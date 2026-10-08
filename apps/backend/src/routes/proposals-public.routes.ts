/**
 * Propuestas para el cliente y pagos (wiki 05 §9, 06).
 *
 * Público por token (la URL /propuesta/<token> que arma el equipo al enviar):
 *  GET  /api/proposals/public/:token              ver (registra la vista; la primera avisa al equipo)
 *                                                 `?registrar=0` o sesión del equipo: no cuenta la vista
 *  POST /api/proposals/public/:token/accept       { nombre, email, acepto: true } (una sola vez, solo vigente)
 *  POST /api/proposals/public/:token/reject       { motivo? }
 *  POST /api/proposals/public/:token/wompi-checkout   → { checkoutUrl } (solo si Wompi está configurado, COP)
 *  Un token inválido o de otra propuesta responde 404.
 *
 * Portal (prospect, client o user autenticado; solo las suyas):
 *  POST /api/me/proposal-requests                 { interes?, mensaje? } "Solicitar propuesta" (idempotente)
 *  GET  /api/me/proposal-requests                 solicitud abierta, si la hay
 *  GET  /api/me/proposals                         propuestas recibidas (sin borradores)
 *  GET  /api/me/proposals/:id
 *  POST /api/me/proposals/:id/accept              { nombre? }
 *  POST /api/me/proposals/:id/reject              { motivo? }
 *
 * Pagos:
 *  GET  /api/payments/config                      métodos de pago en línea activos (sin secretos)
 *  POST /api/payments/wompi/events                webhook de Wompi (checksum SHA-256; idempotente)
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { isStaffRole, loadFreshUser, readBearer, requireRole } from '../middleware/access';
import { AuthRequest } from '../types';
import { PORTAL_ROLES } from '../config/commerce';
import User from '../models/User';
import {
  AcceptSchema,
  RejectSchema,
  acceptMyProposal,
  acceptPublicProposal,
  getMyProposal,
  listMyProposals,
  processWompiEvent,
  rejectMyProposal,
  rejectPublicProposal,
  startWompiCheckout,
  viewPublicProposal,
} from '../services/proposals.service';
import { findLeadForUser, proposalRequestView, requestProposal } from '../services/leads.service';
import { readWompiConfig, type WompiEvent } from '../services/wompi.service';
import { zodToAppError } from './demo-public.routes';

function parse<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const parsed = schema.safeParse(data ?? {});
  if (!parsed.success) throw zodToAppError(parsed.error);
  return parsed.data;
}

// ---------------------------------------------------------------------------
//   Público por token
// ---------------------------------------------------------------------------

export const publicProposalsRouter = Router();

publicProposalsRouter.use((_req, res, next) => {
  // Contenido privado de un cliente: nunca en cachés compartidas ni indexado.
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  next();
});

/** Las visitas del equipo (vista previa) no cuentan como vistas del cliente. */
async function isStaffPreview(req: Request): Promise<boolean> {
  const bearer = readBearer(req as AuthRequest);
  if (!bearer.user) return false;
  const fresh = await loadFreshUser(bearer.user.id);
  return !!fresh && fresh !== 'db_unavailable' && isStaffRole(fresh.role);
}

publicProposalsRouter.get(
  '/:token',
  asyncHandler(async (req: Request, res: Response) => {
    const registrar = req.query.registrar !== '0' && !(await isStaffPreview(req));
    res.json({ success: true, data: await viewPublicProposal(req.params.token, { registrar, req }) });
  }),
);

publicProposalsRouter.post(
  '/:token/accept',
  asyncHandler(async (req: Request, res: Response) => {
    const body = parse(AcceptSchema, req.body) as { nombre: string; email: string };
    res.json({ success: true, message: '¡Gracias! Registramos tu aceptación.', data: await acceptPublicProposal(req.params.token, body, req) });
  }),
);

publicProposalsRouter.post(
  '/:token/reject',
  asyncHandler(async (req: Request, res: Response) => {
    const { motivo } = parse(RejectSchema, req.body) as { motivo?: string };
    res.json({ success: true, message: 'Gracias por avisarnos.', data: await rejectPublicProposal(req.params.token, motivo, req) });
  }),
);

publicProposalsRouter.post(
  '/:token/wompi-checkout',
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, data: await startWompiCheckout(String(req.params.token), req) });
  }),
);

// ---------------------------------------------------------------------------
//   Portal
// ---------------------------------------------------------------------------

export const meCommerceRouter = Router();
const portal = requireRole(...PORTAL_ROLES);

const ProposalRequestSchema = z
  .object({
    interes: z
      .string()
      .trim()
      .max(200)
      .optional()
      .transform((v) => (v ? v : undefined)),
    mensaje: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .transform((v) => (v ? v : undefined)),
  })
  .strict();

async function portalUser(req: AuthRequest) {
  const u = await User.findById(req.user!.id).select('email name role company phone').lean();
  return {
    id: req.user!.id,
    email: u?.email ?? req.user!.email,
    name: u?.name ?? req.user!.name ?? req.user!.email,
    role: u?.role ?? req.user!.role,
    company: u?.company,
    phone: u?.phone,
  };
}

meCommerceRouter.post(
  '/proposal-requests',
  ...portal,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = parse(ProposalRequestSchema, req.body) as { interes?: string; mensaje?: string };
    const result = await requestProposal(await portalUser(req), body, req);
    res.status(result.creada ? 201 : 200).json({
      success: true,
      message: result.creada
        ? 'Recibimos tu solicitud. El equipo de KopTup te enviará la propuesta en máximo 2 días hábiles.'
        : 'Ya tenemos tu solicitud de propuesta: el equipo la está preparando.',
      data: { creada: result.creada, solicitud: result.solicitud },
    });
  }),
);

meCommerceRouter.get(
  '/proposal-requests',
  ...portal,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await portalUser(req);
    const lead = await findLeadForUser(user.id, user.email);
    res.json({ success: true, data: lead ? proposalRequestView(lead) : { abierta: false, abiertaEn: null, interes: null, mensaje: null } });
  }),
);

meCommerceRouter.get(
  '/proposals',
  ...portal,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data: await listMyProposals(await portalUser(req)) });
  }),
);

meCommerceRouter.get(
  '/proposals/:id',
  ...portal,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data: await getMyProposal(await portalUser(req), req.params.id) });
  }),
);

const MyAcceptSchema = z
  .object({
    nombre: z.string().trim().min(2).max(160).optional(),
    acepto: z.literal(true, { errorMap: () => ({ message: 'Debes confirmar que aceptas la propuesta y sus condiciones.' }) }),
  })
  .strict();

meCommerceRouter.post(
  '/proposals/:id/accept',
  ...portal,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = parse(MyAcceptSchema, req.body) as { nombre?: string };
    res.json({ success: true, message: '¡Gracias! Registramos tu aceptación.', data: await acceptMyProposal(await portalUser(req), req.params.id, body.nombre, req) });
  }),
);

meCommerceRouter.post(
  '/proposals/:id/reject',
  ...portal,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { motivo } = parse(RejectSchema, req.body) as { motivo?: string };
    res.json({ success: true, message: 'Gracias por avisarnos.', data: await rejectMyProposal(await portalUser(req), req.params.id, motivo, req) });
  }),
);

// ---------------------------------------------------------------------------
//   Pagos
// ---------------------------------------------------------------------------

export const paymentsRouter = Router();

paymentsRouter.get('/config', (_req: Request, res: Response) => {
  const wompi = readWompiConfig();
  res.json({ success: true, data: { wompi: { activo: wompi.enabled, ambiente: wompi.config?.env ?? null, monedas: wompi.enabled ? ['COP'] : [] } } });
});

paymentsRouter.post(
  '/wompi/events',
  asyncHandler(async (req: Request, res: Response) => {
    const header = req.get('x-event-checksum') ?? undefined;
    const outcome = await processWompiEvent((req.body ?? {}) as WompiEvent, header, req);
    if (outcome.status === 404) {
      res.status(404).json({ success: false, code: 'wompi_disabled', message: 'El pago con Wompi no está configurado.' });
      return;
    }
    if (outcome.status === 401) {
      res.status(401).json({ success: false, code: 'invalid_checksum', message: 'Firma del evento inválida.' });
      return;
    }
    res.status(200).json({ success: true, resultado: outcome.resultado });
  }),
);
