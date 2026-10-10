/**
 * invoices.service.ts — facturas del portal (cuentas de cobro que el equipo
 * emite al cliente y que el cliente ve y descarga en Facturación).
 *
 * - La factura queda SIEMPRE a nombre del cliente (`userId`): el del pedido,
 *   el del proyecto o el que el equipo elige. Quien la emite queda en
 *   `createdBy` y en el historial.
 * - Se puede emitir desde un pedido (toma sus ítems), desde un proyecto o a
 *   mano para un cliente. Un pedido no tiene dos facturas vigentes.
 * - Los totales se calculan en el servidor (nunca se confía en el total que
 *   manda el navegador).
 * - Al emitirla o registrar su pago se avisa al cliente (portal y correo según
 *   sus preferencias).
 */
import type { Request } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Invoice, { type IInvoice } from '../models/Invoice';
import Order from '../models/Order';
import Project from '../models/Project';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { isStaffRole } from '../middleware/access';
import { recordAudit } from './audit.service';
import { formatMoney, notifyClient } from './portal-notify.service';
import { businessDay, endOfBusinessDay } from '../utils/dates';

export const INVOICE_CURRENCIES = ['COP', 'USD'] as const;
export const DEFAULT_TAX_RATE = 0.19;
const DEFAULT_DUE_DAYS = 15;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface InvoiceActor {
  id: string;
  email: string;
  role: string;
  name?: string;
}

const ItemSchema = z.object({
  description: z.string().trim().min(1, 'Cada ítem necesita una descripción.').max(300),
  quantity: z.coerce.number().int('La cantidad debe ser un número entero.').min(1).max(100000),
  unitPrice: z.coerce.number().min(0).max(10_000_000_000),
});

export const IssueInvoiceSchema = z
  .object({
    clientId: z.string().trim().optional(),
    projectId: z.string().trim().optional(),
    orderId: z.string().trim().max(40).optional(),
    items: z.array(ItemSchema).min(1, 'Agrega al menos un ítem.').max(50).optional(),
    taxRate: z.coerce.number().min(0).max(1).optional(),
    currency: z.enum(INVOICE_CURRENCIES).optional(),
    /** Día de vencimiento `AAAA-MM-DD` (hora de Colombia). */
    dueDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de vencimiento debe tener el formato AAAA-MM-DD.').optional(),
    notes: z.string().trim().max(2000).optional(),
    terms: z.string().trim().max(1000).optional(),
  })
  .strict();

export type IssueInvoiceInput = z.infer<typeof IssueInvoiceSchema>;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function invalidId(id: string | undefined): boolean {
  return !!id && !mongoose.Types.ObjectId.isValid(id);
}

/** Estado que ve la persona: una factura pendiente con la fecha de pago vencida aparece como vencida. */
export function effectiveInvoiceStatus(inv: Pick<IInvoice, 'status' | 'dueDate'>, now = new Date()): IInvoice['status'] {
  if (inv.status === 'pending' && inv.dueDate && new Date(inv.dueDate).getTime() < now.getTime()) return 'overdue';
  return inv.status;
}

/** Filtro de MongoDB para el estado (efectivo) pedido en un listado. */
export function invoiceStatusFilter(status: string | undefined, now = new Date()): Record<string, unknown> {
  switch (status) {
    case 'pending':
      return { status: 'pending', dueDate: { $gte: now } };
    case 'overdue':
      return { $or: [{ status: 'overdue' }, { status: 'pending', dueDate: { $lt: now } }] };
    case 'paid':
    case 'cancelled':
    case 'draft':
      return { status };
    default:
      return {};
  }
}

type PopulatedInvoice = Record<string, any>;

/** Vista de una factura para el portal, el panel y el PDF. */
export function invoiceView(inv: PopulatedInvoice, now = new Date()) {
  const project = inv.projectId && typeof inv.projectId === 'object' && 'name' in inv.projectId ? inv.projectId : null;
  const order = inv.orderId && typeof inv.orderId === 'object' && 'orderId' in inv.orderId ? inv.orderId : null;
  const user = inv.userId && typeof inv.userId === 'object' && 'email' in inv.userId ? inv.userId : null;
  return {
    id: String(inv._id),
    invoiceNumber: inv.invoiceNumber,
    status: effectiveInvoiceStatus(inv as IInvoice, now),
    issueDate: businessDay(inv.issueDate),
    dueDate: businessDay(inv.dueDate),
    paidDate: businessDay(inv.paidDate),
    projectId: project ? String(project._id) : inv.projectId ? String(inv.projectId) : null,
    projectName: project?.name ?? null,
    orderId: order?.orderId ?? null,
    client: {
      id: user ? String(user._id) : String(inv.userId),
      name: inv.clientInfo?.name ?? user?.name ?? '',
      email: inv.clientInfo?.email ?? user?.email ?? '',
      company: inv.clientInfo?.company ?? user?.company ?? null,
    },
    items: (inv.items ?? []).map((it: any) => ({
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      total: it.total,
    })),
    subtotal: inv.subtotal,
    taxRate: inv.taxRate,
    taxAmount: inv.taxAmount,
    total: inv.total,
    currency: inv.currency || 'USD',
    paymentMethod: inv.paymentMethod ?? null,
    notes: inv.notes ?? null,
    terms: inv.terms ?? null,
    createdAt: inv.createdAt,
  };
}

export async function loadInvoiceView(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const inv = await Invoice.findById(id).populate('projectId', 'name').populate('orderId', 'orderId name').populate('userId', 'name email company').lean();
  return inv ? invoiceView(inv) : null;
}

/** Cliente válido: existe y no es una cuenta del equipo. */
async function loadClient(id: mongoose.Types.ObjectId | string) {
  const client = await User.findById(id).select('name email company role').lean();
  if (!client) throw new AppError('No encontramos la cuenta del cliente.', 404, 'client_not_found');
  if (isStaffRole(client.role) || client.role === 'developer') {
    throw new AppError('Esa cuenta es del equipo de KopTup: elige la cuenta del cliente.', 400, 'client_is_staff');
  }
  return client;
}

/**
 * Emite una factura a nombre del cliente. El cliente sale del pedido, del
 * proyecto o de `clientId` (si vienen varios, deben coincidir).
 */
export async function issueInvoice(input: IssueInvoiceInput, actor: InvoiceActor, req?: Request) {
  if (invalidId(input.clientId) || invalidId(input.projectId)) throw new AppError('El cliente o el proyecto no son válidos.', 400, 'invalid_request');

  const order = input.orderId ? await Order.findOne({ orderId: input.orderId }) : null;
  if (input.orderId && !order) throw new AppError('Pedido no encontrado.', 404, 'order_not_found');
  const project = input.projectId
    ? await Project.findById(input.projectId).select('name client_id currency').lean()
    : order?.projectId
      ? await Project.findById(order.projectId).select('name client_id currency').lean()
      : null;
  if (input.projectId && !project) throw new AppError('Proyecto no encontrado.', 404, 'project_not_found');

  const candidates = [input.clientId, order ? String(order.userId) : undefined, project?.client_id ? String(project.client_id) : undefined].filter(
    (v): v is string => !!v,
  );
  if (candidates.length === 0) {
    throw new AppError('Elige el cliente, el proyecto o el pedido de la factura.', 400, 'client_required', { fields: ['clientId'] });
  }
  if (new Set(candidates).size > 1) {
    throw new AppError('El cliente, el proyecto y el pedido no corresponden a la misma cuenta.', 400, 'client_mismatch');
  }
  const client = await loadClient(candidates[0]);

  if (order) {
    if (order.approvalStatus === 'rejected' || order.status === 'cancelled') {
      throw new AppError('Este pedido está rechazado o cancelado: no se le puede emitir una factura.', 409, 'order_not_billable');
    }
    const existing = await Invoice.findOne({ orderId: order._id, status: { $ne: 'cancelled' } }).select('invoiceNumber').lean();
    if (existing) {
      throw new AppError(`Este pedido ya tiene la factura ${existing.invoiceNumber}. Anúlala antes de emitir otra.`, 409, 'invoice_exists', {
        invoiceNumber: existing.invoiceNumber,
      });
    }
  }

  const rawItems =
    input.items ??
    (order?.items ?? []).map((it) => ({ description: it.description ? `${it.name} — ${it.description}` : it.name, quantity: it.quantity, unitPrice: it.price }));
  if (rawItems.length === 0) throw new AppError('Agrega al menos un ítem.', 400, 'invalid_items', { fields: ['items'] });
  const items = rawItems.map((it) => ({
    description: it.description.slice(0, 300),
    quantity: it.quantity,
    unitPrice: round2(it.unitPrice),
    total: round2(it.quantity * it.unitPrice),
  }));
  const subtotal = round2(items.reduce((sum, it) => sum + it.total, 0));
  const taxRate = input.taxRate ?? DEFAULT_TAX_RATE;
  const taxAmount = round2(subtotal * taxRate);
  const total = round2(subtotal + taxAmount);
  const currency = input.currency ?? (order?.currency as 'COP' | 'USD' | undefined) ?? (project?.currency as 'COP' | 'USD' | undefined) ?? 'COP';

  const now = new Date();
  const dueDate = input.dueDate ? endOfBusinessDay(input.dueDate) : new Date(now.getTime() + DEFAULT_DUE_DAYS * DAY_MS);
  if (!dueDate) throw new AppError('La fecha de vencimiento no es válida.', 400, 'invalid_due_date', { fields: ['dueDate'] });
  if (dueDate.getTime() < now.getTime() - DAY_MS) {
    throw new AppError('La fecha de vencimiento no puede ser anterior a hoy.', 400, 'invalid_due_date', { fields: ['dueDate'] });
  }

  const invoice = await Invoice.create({
    projectId: project?._id ?? null,
    orderId: order?._id,
    userId: client._id,
    createdBy: new mongoose.Types.ObjectId(actor.id),
    clientInfo: { name: client.name || client.email, email: client.email, ...(client.company ? { company: client.company } : {}) },
    items,
    subtotal,
    taxRate,
    taxAmount,
    total,
    currency,
    status: 'pending',
    issueDate: now,
    dueDate,
    notes: input.notes || undefined,
    ...(input.terms ? { terms: input.terms } : {}),
    history: [
      {
        date: now,
        action: 'created',
        description: order ? `Factura emitida desde el pedido ${order.orderId}` : project ? `Factura emitida para el proyecto ${project.name}` : 'Factura emitida',
        amount: total,
        updatedBy: new mongoose.Types.ObjectId(actor.id),
      },
    ],
  });

  await recordAudit({
    actor,
    accion: 'invoice.issue',
    entidad: { tipo: 'Invoice', id: String(invoice._id) },
    detalle: { numero: invoice.invoiceNumber, cliente: client.email, total, moneda: currency, pedido: order?.orderId ?? null, proyecto: project ? String(project._id) : null },
    req,
  });

  await notifyClient({
    userId: client._id as mongoose.Types.ObjectId,
    type: 'billing',
    evento: 'invoice_issued',
    params: { number: invoice.invoiceNumber, amount: formatMoney(total, currency) },
    title: `Nueva factura ${invoice.invoiceNumber}`,
    message: `Te emitimos la factura ${invoice.invoiceNumber} por ${formatMoney(total, currency)}. Puedes verla y descargarla en Facturación.`,
    actionUrl: '/dashboard/billing',
    metadata: { invoiceId: String(invoice._id), invoiceNumber: invoice.invoiceNumber },
  });

  return loadInvoiceView(String(invoice._id));
}

/** Registra el pago de una factura (lo hace el equipo al confirmar el pago real). */
export async function registerInvoicePayment(
  id: string,
  body: { paymentMethod: string; transactionId?: string },
  actor: InvoiceActor,
  req?: Request,
) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Factura no encontrada', 404, 'not_found');
  const invoice = await Invoice.findById(id);
  if (!invoice) throw new AppError('Factura no encontrada', 404, 'not_found');
  if (invoice.status === 'paid') throw new AppError('La factura ya está pagada', 400, 'already_paid');
  if (invoice.status === 'cancelled') throw new AppError('La factura está anulada', 409, 'invoice_cancelled');

  invoice.status = 'paid';
  invoice.paidDate = new Date();
  invoice.paymentMethod = body.paymentMethod.slice(0, 60);
  invoice.transactionId = body.transactionId?.trim() ? body.transactionId.trim().slice(0, 120) : `TXN-${Date.now()}`;
  invoice.history.push({
    date: new Date(),
    action: 'paid',
    description: 'Pago registrado por el equipo',
    amount: invoice.total,
    updatedBy: new mongoose.Types.ObjectId(actor.id),
  });
  await invoice.save();

  await recordAudit({
    actor,
    accion: 'invoice.payment',
    entidad: { tipo: 'Invoice', id: String(invoice._id) },
    detalle: { numero: invoice.invoiceNumber, metodo: invoice.paymentMethod, total: invoice.total },
    req,
  });
  await notifyClient({
    userId: invoice.userId,
    type: 'billing',
    evento: 'invoice_paid',
    params: { number: invoice.invoiceNumber },
    title: `Pago registrado: ${invoice.invoiceNumber}`,
    message: `Registramos el pago de la factura ${invoice.invoiceNumber}. ¡Gracias!`,
    actionUrl: '/dashboard/billing',
    metadata: { invoiceId: String(invoice._id), invoiceNumber: invoice.invoiceNumber },
  });
  return invoice;
}

/** Anula una factura pendiente (p. ej. para emitirla de nuevo con otros valores). */
export async function cancelInvoice(id: string, motivo: string, actor: InvoiceActor, req?: Request) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Factura no encontrada', 404, 'not_found');
  const invoice = await Invoice.findById(id);
  if (!invoice) throw new AppError('Factura no encontrada', 404, 'not_found');
  if (invoice.status === 'paid') throw new AppError('Una factura pagada no se puede anular.', 409, 'invoice_paid');
  if (invoice.status === 'cancelled') throw new AppError('La factura ya está anulada.', 409, 'invoice_cancelled');
  invoice.status = 'cancelled';
  invoice.history.push({
    date: new Date(),
    action: 'cancelled',
    description: `Factura anulada: ${motivo}`.slice(0, 500),
    updatedBy: new mongoose.Types.ObjectId(actor.id),
  });
  await invoice.save();
  await recordAudit({
    actor,
    accion: 'invoice.cancel',
    entidad: { tipo: 'Invoice', id: String(invoice._id) },
    detalle: { numero: invoice.invoiceNumber, motivo },
    req,
  });
  return invoice;
}
