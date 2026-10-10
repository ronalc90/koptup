import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types';
import { isStaffSession } from '../middleware/access';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import Invoice from '../models/Invoice';
// Registra los modelos que usa populate().
import '../models/Project';
import '../models/Order';
import '../models/User';
import { getCommerceSettings } from '../services/commerce-settings.service';
import {
  IssueInvoiceSchema,
  cancelInvoice as cancelInvoiceService,
  invoiceStatusFilter,
  invoiceView,
  issueInvoice,
  loadInvoiceView,
  registerInvoicePayment,
} from '../services/invoices.service';
import { zodToAppError } from '../routes/demo-public.routes';

function actorOf(req: AuthRequest) {
  const u = req.user!;
  return { id: u.id, email: u.email, role: u.role, name: u.name };
}

function queryText(value: unknown, max = 40): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined;
}

/**
 * GET /api/invoices — facturas de la cuenta (el cliente ve las suyas). Las
 * fechas son días de Colombia; una factura pendiente con la fecha de pago
 * vencida aparece como `overdue`.
 */
export const getInvoices = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const status = queryText(req.query.status);
  const filter: Record<string, unknown> = { userId, ...(status && status !== 'all' ? invoiceStatusFilter(status) : {}) };
  const invoices = await Invoice.find(filter)
    .populate('projectId', 'name')
    .populate('orderId', 'orderId name')
    .populate('userId', 'name email company')
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
  res.json({ success: true, data: invoices.map((inv) => invoiceView(inv)) });
});

/** GET /api/invoices/:id — detalle: el cliente dueño o el equipo (rol leído de la BD). */
export const getInvoiceById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const view = await loadInvoiceView(String(req.params.id));
  if (!view) throw new AppError('Factura no encontrada', 404, 'not_found');
  if (view.client.id !== String(req.user!.id) && !(await isStaffSession(req))) {
    throw new AppError('No tienes permiso para ver esta factura', 403, 'forbidden');
  }
  res.json({ success: true, data: view });
});

/**
 * POST /api/invoices (admin o manager) — emite una factura a nombre del
 * cliente: `{ clientId | projectId | orderId, items[{ description, quantity,
 * unitPrice }], taxRate?, currency?, dueDate?, notes?, terms? }`.
 */
export const createInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = IssueInvoiceSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw zodToAppError(parsed.error);
  if (!parsed.data.orderId && !parsed.data.items) {
    throw new AppError('Agrega al menos un ítem.', 400, 'invalid_items', { fields: ['items'] });
  }
  const view = await issueInvoice(parsed.data, actorOf(req), req);
  res.status(201).json({ success: true, data: view, message: 'Factura emitida.' });
});

/**
 * POST /api/invoices/:id/pay — registra el pago de una factura. Solo el equipo
 * (admin o manager, rol leído de la BD en la ruta) lo hace, después de
 * confirmar el pago por el medio real (transferencia, enlace). El cliente no
 * marca sus facturas como pagadas: en el portal ve los métodos de pago
 * configurados (GET /api/invoices/payment-methods).
 */
export const payInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { paymentMethod, transactionId } = (req.body ?? {}) as { paymentMethod?: unknown; transactionId?: unknown };
  if (!paymentMethod || typeof paymentMethod !== 'string') {
    throw new AppError('Método de pago requerido', 400, 'invalid_request', { fields: ['paymentMethod'] });
  }
  await registerInvoicePayment(
    String(req.params.id),
    { paymentMethod, transactionId: typeof transactionId === 'string' ? transactionId : undefined },
    actorOf(req),
    req,
  );
  res.json({ success: true, message: 'Pago registrado' });
});

/** POST /api/invoices/:id/cancel { motivo } (admin o manager) — anula una factura no pagada. */
export const cancelInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const motivo = typeof req.body?.motivo === 'string' ? req.body.motivo.trim().slice(0, 300) : '';
  if (motivo.length < 3) throw new AppError('Escribe el motivo de la anulación.', 400, 'invalid_request', { fields: ['motivo'] });
  await cancelInvoiceService(String(req.params.id), motivo, actorOf(req), req);
  res.json({ success: true, message: 'Factura anulada.', data: await loadInvoiceView(String(req.params.id)) });
});

/**
 * GET /api/invoices/payment-methods — métodos de pago reales que el equipo
 * configuró (Admin › Configuración). Hoy: las instrucciones de transferencia.
 * Si no hay ninguno, `metodos` viene vacío y el portal no ofrece "Pagar".
 */
export const getInvoicePaymentMethods = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const settings = await getCommerceSettings();
  const instrucciones = settings.instruccionesTransferencia.trim();
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    success: true,
    data: {
      metodos: instrucciones ? [{ tipo: 'transferencia' as const, instrucciones }] : [],
    },
  });
});

/**
 * GET /api/invoices/:id/download — los datos completos de la factura para
 * generar su PDF (la web lo arma con jsPDF y lo descarga). Solo el cliente
 * dueño o el equipo; sin caché.
 */
export const downloadInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(String(req.params.id))) throw new AppError('Factura no encontrada', 404, 'not_found');
  const view = await loadInvoiceView(String(req.params.id));
  if (!view) throw new AppError('Factura no encontrada', 404, 'not_found');
  if (view.client.id !== String(req.user!.id) && !(await isStaffSession(req))) {
    throw new AppError('No tienes permiso para descargar esta factura', 403, 'forbidden');
  }
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({
    success: true,
    data: {
      ...view,
      fileName: `factura-${view.invoiceNumber}.pdf`,
      emisor: { nombre: 'KopTup' },
    },
  });
});
