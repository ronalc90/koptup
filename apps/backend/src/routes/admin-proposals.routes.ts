/**
 * Propuestas para el equipo (wiki 05 §9). Se monta en app.ts ANTES de
 * `/api/admin`.
 *
 * Permisos (rol leído de la BD en cada petición, config/commerce.ts):
 *  - Ver, crear, editar (borrador), duplicar, borrar borrador, enviar,
 *    reenviar y opciones de pago: admin y sales.
 *  - Marcar el anticipo como recibido y convertir: solo admin.
 *
 *  /api/admin/proposals
 *    GET    /                     ?estado=&lead=&q=&page=&limit=  (con `conteos` por estado)
 *    GET    /templates            ?moneda=COP|USD&fxRate=   plantillas de ítems (planes RAG y catálogo)
 *    POST   /                     { leadId | cliente{nombre,email,empresa?,telefono?}, items[], moneda?, fxRate?,
 *                                   ivaAplica?, anticipoPct?, validezDias?, titulo?, alcance?, condiciones?,
 *                                   exclusiones?, enlacePago?, instruccionesPago? }
 *                                   items[]: { plantilla: 'rag:piloto' | 'producto:<slug>:<plan>' } o
 *                                            { tipo, planRag?, offeringSlug?, plan?, modalidad?, descripcion?,
 *                                              cantidad?, setup?, mensualidad?, descuentoPct? }
 *    GET    /:id                  detalle + historial (AuditLog)
 *    PATCH  /:id                  mismos campos (solo en borrador; los montos se recalculan)
 *    DELETE /:id                  solo borrador
 *    POST   /:id/duplicate        copia en borrador con número nuevo
 *    POST   /:id/send             enlace público + email si hay SMTP → { url, whatsapp, email }
 *    POST   /:id/resend           enlace NUEVO (el anterior deja de servir) + email si hay SMTP
 *    PATCH  /:id/payment-options  { enlacePago?: https | null, instrucciones?: string | null }
 *    POST   /:id/mark-paid        { referencia, proveedor?: transferencia|enlace|otro, fecha?, nota? } (admin)
 *    POST   /:id/convert          crea el proyecto, rol client, accesos convertidos, lead ganado (admin; idempotente)
 */
import { Router, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { requireRole } from '../middleware/access';
import { AuthRequest } from '../types';
import {
  CURRENCIES,
  FX_RATE_MAX,
  FX_RATE_MIN,
  PROPOSAL_CONVERT_ROLES,
  PROPOSAL_MANAGE_ROLES,
  PROPOSAL_PAYMENT_ROLES,
  PROPOSAL_READ_ROLES,
  PROPOSAL_STATES,
  type Currency,
} from '../config/commerce';
import {
  CreateProposalSchema,
  MarkPaidSchema,
  PaymentOptionsSchema,
  UpdateProposalSchema,
  type CreateProposalInput,
  type StaffActor,
  type UpdateProposalInput,
  convertProposal,
  createProposal,
  deleteDraft,
  duplicateProposal,
  getProposalDetail,
  listProposals,
  markDepositReceived,
  sendProposal,
  updatePaymentOptions,
  updateProposal,
} from '../services/proposals.service';
import { TRM_REFERENCIA, listTemplates } from '../services/pricing.service';
import { zodToAppError } from './demo-public.routes';

const readers = requireRole(...PROPOSAL_READ_ROLES);
const managers = requireRole(...PROPOSAL_MANAGE_ROLES);
const payments = requireRole(...PROPOSAL_PAYMENT_ROLES);
const converters = requireRole(...PROPOSAL_CONVERT_ROLES);

function actorOf(req: AuthRequest): StaffActor {
  const u = req.user!;
  return { id: u.id, email: u.email, role: u.role };
}

function parse<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const parsed = schema.safeParse(data ?? {});
  if (!parsed.success) throw zodToAppError(parsed.error);
  return parsed.data;
}

const ListQuery = z.object({
  estado: z.enum(PROPOSAL_STATES).optional(),
  lead: z.string().trim().max(40).optional(),
  q: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v ? v : undefined)),
  page: z.coerce.number().int().min(1).max(10_000).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const TemplatesQuery = z.object({
  moneda: z.enum(CURRENCIES).optional().default('COP'),
  fxRate: z.coerce.number().finite().min(FX_RATE_MIN).max(FX_RATE_MAX).optional(),
});

export const adminProposalsRouter = Router();

adminProposalsRouter.get(
  '/',
  ...readers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const q = parse(ListQuery, req.query);
    res.json({ success: true, data: await listProposals({ ...q, page: q.page ?? 1, limit: q.limit ?? 20 }) });
  }),
);

adminProposalsRouter.get(
  '/templates',
  ...readers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const q = parse(TemplatesQuery, req.query);
    const moneda = (q.moneda ?? 'COP') as Currency;
    const fxRate = q.fxRate ?? TRM_REFERENCIA;
    res.json({ success: true, data: { moneda, fxRate, trmReferencia: TRM_REFERENCIA, plantillas: listTemplates(moneda, fxRate) } });
  }),
);

adminProposalsRouter.post(
  '/',
  ...managers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = parse(CreateProposalSchema, req.body) as CreateProposalInput;
    res.status(201).json({ success: true, message: 'Propuesta creada en borrador.', data: await createProposal(body, actorOf(req), req) });
  }),
);

adminProposalsRouter.get(
  '/:id',
  ...readers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json({ success: true, data: await getProposalDetail(req.params.id) });
  }),
);

adminProposalsRouter.patch(
  '/:id',
  ...managers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = parse(UpdateProposalSchema, req.body) as UpdateProposalInput;
    res.json({ success: true, message: 'Propuesta actualizada.', data: await updateProposal(req.params.id, body, actorOf(req), req) });
  }),
);

adminProposalsRouter.delete(
  '/:id',
  ...managers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json({ success: true, message: 'Borrador eliminado.', data: await deleteDraft(req.params.id, actorOf(req), req) });
  }),
);

adminProposalsRouter.post(
  '/:id/duplicate',
  ...managers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    res.status(201).json({ success: true, message: 'Propuesta duplicada en borrador.', data: await duplicateProposal(req.params.id, actorOf(req), req) });
  }),
);

adminProposalsRouter.post(
  '/:id/send',
  ...managers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await sendProposal(req.params.id, actorOf(req), { reenvio: false, req });
    res.json({
      success: true,
      message: data.email.enviado ? 'Propuesta enviada por email. También puedes compartir el enlace.' : 'Propuesta lista: copia el enlace o compártelo por WhatsApp.',
      data,
    });
  }),
);

adminProposalsRouter.post(
  '/:id/resend',
  ...managers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await sendProposal(req.params.id, actorOf(req), { reenvio: true, req });
    res.json({
      success: true,
      message: 'Enlace nuevo emitido: el anterior dejó de funcionar.',
      data,
    });
  }),
);

adminProposalsRouter.patch(
  '/:id/payment-options',
  ...managers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = parse(PaymentOptionsSchema, req.body) as { enlacePago?: string | null; instrucciones?: string | null };
    res.json({ success: true, message: 'Opciones de pago actualizadas.', data: await updatePaymentOptions(req.params.id, body, actorOf(req), req) });
  }),
);

adminProposalsRouter.post(
  '/:id/mark-paid',
  ...payments,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = parse(MarkPaidSchema, req.body) as { referencia: string; proveedor?: 'transferencia' | 'enlace' | 'otro'; fecha?: Date; nota?: string };
    res.json({ success: true, message: 'Anticipo registrado como recibido.', data: await markDepositReceived(req.params.id, body, actorOf(req), req) });
  }),
);

adminProposalsRouter.post(
  '/:id/convert',
  ...converters,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await convertProposal(req.params.id, actorOf(req), req);
    res.status(data.yaConvertida ? 200 : 201).json({
      success: true,
      message: data.yaConvertida
        ? 'Esta propuesta ya estaba convertida: no se creó nada nuevo.'
        : data.activationUrl
          ? 'Proyecto creado. Comparte el enlace de activación si el correo no llega.'
          : 'Proyecto creado. El cliente ya puede entrar al portal.',
      data,
    });
  }),
);
