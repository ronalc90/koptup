/**
 * Rutas públicas del sistema de demos (wiki 04, §8.2) y del portal.
 *
 *  POST /api/demo-requests        Formulario "Solicitar demo" (público).
 *                                 Honeypot `website`, cupo por IP (Redis) y
 *                                 por email, validación zod y autorización de
 *                                 datos (Ley 1581) obligatoria.
 *  GET  /api/demo-catalog         Catálogo público: slug, nombre, accessMode, activo.
 *  GET  /api/demo-access/:slug    ¿Puede esta sesión abrir la demo? (sesión opcional)
 *                                 → { allowed, accessMode, reason, expiresAt, ... }
 *  GET  /api/me/demos             Accesos de la cuenta con días restantes (autenticado).
 */
import { Router, Request, Response } from 'express';
import { ZodError } from 'zod';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { loadFreshUser, readBearer, requireRole } from '../middleware/access';
import { resolveClientIp } from '../middleware/client-ip';
import { AuthRequest } from '../types';
import { USER_ROLES } from '../models/User';
import { DemoRequestInputSchema, createDemoRequest, generateRequestCode } from '../services/demo-requests.service';
import { consumeLimit, envLimit } from '../services/request-limits.service';
import { listCatalog, publicCatalogView } from '../services/demo-catalog.service';
import { DEMO_CATALOG_SEED } from '../data/demo-catalog.seed';
import { evaluateDemoAccess, type AccessUser } from '../services/demo-access.service';
import { listMyGrants } from '../services/demo-grants.service';
import { normalizeEmailLikeAuth } from '../utils/email-address';
import { logger } from '../utils/logger';

function friendlyIssue(message: string): string {
  if (/^Required$/i.test(message)) return 'Este campo es obligatorio.';
  const unknown = /^Unrecognized key\(s\) in object: (.*)$/.exec(message);
  if (unknown) return `Estos campos no se pueden enviar: ${unknown[1].replace(/'/g, '')}.`;
  if (/^(Invalid|Expected)/.test(message)) return 'Este campo tiene un formato inválido.';
  return message;
}

/** Error de validación de zod → 400 con `fields` y `errores` ({ campo: mensaje }) en español. */
export function zodToAppError(err: ZodError): AppError {
  const errores: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_';
    if (!errores[key]) errores[key] = friendlyIssue(issue.message);
  }
  const first = Object.values(errores)[0];
  return new AppError(first ?? 'Revisa los datos del formulario.', 400, 'invalid_request', {
    fields: Object.keys(errores).slice(0, 20),
    errores,
  });
}

function tooMany(res: Response, retryAfterSec: number, message: string): void {
  res.setHeader('Retry-After', String(retryAfterSec));
  res.status(429).json({ success: false, code: 'rate_limited', message, retryAfterSec });
}

// ---------------------------------------------------------------------------
//   POST /api/demo-requests
// ---------------------------------------------------------------------------

export const demoRequestsRouter = Router();

demoRequestsRouter.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const ip = resolveClientIp(req);
    const body = (req.body ?? {}) as Record<string, unknown>;

    // Honeypot: un campo oculto que una persona nunca llena. A un bot se le
    // responde igual que a una persona, pero no se guarda nada.
    if (typeof body.website === 'string' && body.website.trim() !== '') {
      logger.warn('[demo-requests] Honeypot activado: solicitud descartada');
      res.status(201).json({
        success: true,
        message: 'Recibimos tu solicitud. Te escribiremos al correo que indicaste.',
        data: { codigo: generateRequestCode(), estado: 'pendiente', fusionada: false },
      });
      return;
    }

    if (body.consentimiento !== true && body.consentimiento !== 'true') {
      throw new AppError(
        'Debes autorizar el tratamiento de tus datos personales (Ley 1581 de 2012) para enviar la solicitud.',
        400,
        'consent_required',
        { fields: ['consentimiento'] },
      );
    }

    const parsed = DemoRequestInputSchema.safeParse(body);
    if (!parsed.success) throw zodToAppError(parsed.error);

    // Los cupos cuentan solo envíos válidos: una persona que corrige errores
    // del formulario no se queda bloqueada (los envíos inválidos no escriben
    // nada y los limita el rate-limit general de /api).
    const perIp = await consumeLimit({
      scope: 'demo-request:ip:1h',
      key: ip,
      limit: envLimit('DEMO_REQUEST_LIMIT_PER_HOUR', 5),
      windowSec: 60 * 60,
    });
    if (!perIp.allowed) {
      tooMany(res, perIp.retryAfterSec, 'Recibimos varias solicitudes desde tu conexión. Intenta de nuevo más tarde.');
      return;
    }

    const perEmail = await consumeLimit({
      scope: 'demo-request:email:1d',
      key: (await normalizeEmailLikeAuth(parsed.data.email)) ?? parsed.data.email.toLowerCase(),
      limit: envLimit('DEMO_REQUEST_LIMIT_PER_EMAIL_DAY', 3),
      windowSec: 24 * 60 * 60,
    });
    if (!perEmail.allowed) {
      tooMany(res, perEmail.retryAfterSec, 'Ya recibimos varias solicitudes con este email hoy. Te responderemos pronto.');
      return;
    }

    const { request, fusionada } = await createDemoRequest(parsed.data, { ip, userAgent: req.get('user-agent') ?? undefined });
    res.status(201).json({
      success: true,
      message: fusionada
        ? 'Ya teníamos una solicitud tuya en revisión: le sumamos las demos que elegiste.'
        : 'Recibimos tu solicitud. Te escribiremos al correo que indicaste.',
      data: { codigo: request.codigo, estado: request.estado, fusionada },
    });
  }),
);

// ---------------------------------------------------------------------------
//   GET /api/demo-catalog
// ---------------------------------------------------------------------------

export const demoCatalogRouter = Router();

demoCatalogRouter.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'public, max-age=30');
    try {
      const items = await listCatalog();
      res.json({ success: true, fuente: 'bd', data: items.map(publicCatalogView) });
    } catch (err) {
      logger.warn(`[demo-catalog] Respaldo con la semilla: ${(err as Error)?.message ?? err}`);
      res.json({ success: true, fuente: 'respaldo', data: DEMO_CATALOG_SEED.map((s) => publicCatalogView({ ...s, persistido: false })) });
    }
  }),
);

// ---------------------------------------------------------------------------
//   GET /api/demo-access/:slug
// ---------------------------------------------------------------------------

export const demoAccessRouter = Router();

demoAccessRouter.get(
  '/:slug',
  asyncHandler(async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const slug = String(req.params.slug ?? '').toLowerCase();
    if (!/^[a-z0-9-]{2,60}$/.test(slug)) {
      res.status(404).json({ success: false, code: 'not_found', message: 'Esa demo no existe.' });
      return;
    }

    const bearer = readBearer(req as AuthRequest);
    let user: AccessUser | null = null;
    if (bearer.user) {
      const fresh = await loadFreshUser(bearer.user.id);
      if (fresh && fresh !== 'db_unavailable') user = { id: fresh.id, role: fresh.role };
    }

    const decision = await evaluateDemoAccess(slug, user, { registrar: true });
    if (decision.reason === 'no_existe') {
      res.status(404).json({ success: false, code: 'not_found', message: 'Esa demo no existe.' });
      return;
    }
    // Token vencido y la demo no es pública: el cliente debe renovar la sesión.
    if (!decision.allowed && !user && bearer.error === 'expired') {
      res.status(401).json({ success: false, code: 'TOKEN_EXPIRED', message: 'Tu sesión expiró. Inicia sesión de nuevo.' });
      return;
    }
    res.json({
      success: true,
      data: {
        slug: decision.slug,
        allowed: decision.allowed,
        accessMode: decision.accessMode,
        activo: decision.activo,
        reason: decision.reason,
        expiresAt: decision.expiresAt,
        diasRestantes: decision.diasRestantes,
      },
    });
  }),
);

// ---------------------------------------------------------------------------
//   GET /api/me/demos
// ---------------------------------------------------------------------------

export const meRouter = Router();

meRouter.get(
  '/demos',
  ...requireRole(...USER_ROLES),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const items = await listMyGrants(req.user!.id);
    res.json({ success: true, data: items });
  }),
);
