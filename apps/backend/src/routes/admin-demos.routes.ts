/**
 * Rutas del equipo para el sistema de demos (wiki 04, §8.4). Se montan en
 * app.ts ANTES de `/api/admin` (admin.routes.ts exige admin o manager para
 * todo su router): así `sales` puede gestionar solicitudes y accesos.
 *
 * Permisos (rol leído de la BD en cada petición, config/demos.ts):
 *  - Leer: admin, sales, manager.
 *  - Notas, rechazar y reenviar el enlace de activación: admin y sales.
 *  - Aprobar, invitar, extender y revocar: admin y sales; con demos
 *    `privado`, solo admin (403 `requires_admin`).
 *  - Editar el catálogo y leer la bitácora: solo admin.
 *
 *  /api/admin/demo-requests
 *    GET    /                          ?estado=&demo=&q=&page=&limit=
 *    GET    /:id                       detalle + cuenta + accesos + historial
 *    PATCH  /:id                       { estado?: 'pendiente'|'en_revision', nota? }
 *    POST   /:id/approve               { demos?[], dias?, nota?, mensaje? }
 *    POST   /:id/reject                { motivo, notificar?, mensaje? }
 *    POST   /:id/resend-activation
 *  /api/admin/demo-grants
 *    GET    /                          ?estado=activo|por_vencer|expirado|revocado&demo=&q=&user=&request=&page=&limit=
 *                                      (devuelve también `conteos` por estado)
 *    POST   /                          invitación directa { email, nombre?, empresa?, telefono?, demos[], dias?, nota?, mensaje? }
 *    POST   /:id/extend                { dias }
 *    POST   /:id/revoke                { motivo? }
 *    POST   /:id/resend-activation
 *  /api/admin/demo-catalog
 *    GET    /                          catálogo completo (28 demos)
 *    PATCH  /:slug  (o PATCH / con { slug })   { accessMode?, activo?, duracionDiasPorDefecto?, orden?, nombre?, nombreEn? }
 *  /api/admin/audit-log
 *    GET    /                          ?accion=&entidadTipo=&entidadId=&page=&limit= (solo admin)
 */
import { Router, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { requireRole } from '../middleware/access';
import { AuthRequest } from '../types';
import {
  DEMO_ACCESS_MODES,
  DEMO_CATALOG_MANAGE_ROLES,
  DEMO_MANAGE_ROLES,
  DEMO_READ_ROLES,
  MAX_GRANT_DAYS,
  MIN_GRANT_DAYS,
} from '../config/demos';
import {
  ApproveSchema,
  RejectSchema,
  approveDemoRequest,
  getDemoRequestDetail,
  listDemoRequests,
  rejectDemoRequest,
  resendActivationForRequest,
  updateDemoRequest,
} from '../services/demo-requests.service';
import {
  DirectGrantSchema,
  GRANT_LIST_STATES,
  type StaffActor,
  createDirectGrants,
  extendGrant,
  listGrants,
  resendActivation,
  revokeGrant,
} from '../services/demo-grants.service';
import DemoGrant from '../models/DemoGrant';
import DemoCatalogItem from '../models/DemoCatalogItem';
import AuditLog from '../models/AuditLog';
import { DEMO_SEED_BY_SLUG } from '../data/demo-catalog.seed';
import { adminCatalogView, getCatalogEntry, listCatalog } from '../services/demo-catalog.service';
import { recordAudit } from '../services/audit.service';
import { zodToAppError } from './demo-public.routes';

const readers = requireRole(...DEMO_READ_ROLES);
const managers = requireRole(...DEMO_MANAGE_ROLES);
const catalogAdmins = requireRole(...DEMO_CATALOG_MANAGE_ROLES);

function actorOf(req: AuthRequest): StaffActor {
  const u = req.user!;
  return { id: u.id, email: u.email, role: u.role };
}

function parse<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const parsed = schema.safeParse(data ?? {});
  if (!parsed.success) throw zodToAppError(parsed.error);
  return parsed.data;
}

const PageSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const optionalQuery = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

// ---------------------------------------------------------------------------
//   Solicitudes
// ---------------------------------------------------------------------------

export const adminDemoRequestsRouter = Router();

const RequestListQuery = PageSchema.extend({
  estado: optionalQuery(20),
  demo: optionalQuery(60),
  q: optionalQuery(120),
});

adminDemoRequestsRouter.get(
  '/',
  ...readers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const q = parse(RequestListQuery, req.query);
    res.json({ success: true, data: await listDemoRequests({ ...q, page: q.page ?? 1, limit: q.limit ?? 20 }) });
  }),
);

adminDemoRequestsRouter.get(
  '/:id',
  ...readers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json({ success: true, data: await getDemoRequestDetail(req.params.id) });
  }),
);

const UpdateRequestSchema = z
  .object({
    estado: z.enum(['pendiente', 'en_revision']).optional(),
    nota: z.string().trim().min(1).max(2000).optional(),
  })
  .refine((b) => b.estado || b.nota, { message: 'Indica un estado o una nota.' });

adminDemoRequestsRouter.patch(
  '/:id',
  ...managers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = parse(UpdateRequestSchema, req.body);
    res.json({ success: true, data: await updateDemoRequest(req.params.id, body, actorOf(req), req) });
  }),
);

adminDemoRequestsRouter.post(
  '/:id/approve',
  ...managers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = parse(ApproveSchema, req.body);
    const result = await approveDemoRequest(req.params.id, body, actorOf(req), req);
    res.json({
      success: true,
      message: result.activationUrl
        ? 'Solicitud aprobada. Comparte el enlace de activación si el correo no llega.'
        : 'Solicitud aprobada. La persona ya tiene cuenta: puede iniciar sesión y ver sus demos.',
      data: result,
    });
  }),
);

adminDemoRequestsRouter.post(
  '/:id/reject',
  ...managers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = parse(RejectSchema, req.body);
    res.json({ success: true, message: 'Solicitud rechazada.', data: await rejectDemoRequest(req.params.id, body, actorOf(req), req) });
  }),
);

adminDemoRequestsRouter.post(
  '/:id/resend-activation',
  ...managers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json({ success: true, message: 'Enlace de activación nuevo emitido.', data: await resendActivationForRequest(req.params.id, actorOf(req), req) });
  }),
);

// ---------------------------------------------------------------------------
//   Accesos
// ---------------------------------------------------------------------------

export const adminDemoGrantsRouter = Router();

const GrantListQuery = PageSchema.extend({
  estado: z.enum(GRANT_LIST_STATES).optional(),
  demo: optionalQuery(60),
  q: optionalQuery(120),
  user: optionalQuery(40),
  request: optionalQuery(40),
});

adminDemoGrantsRouter.get(
  '/',
  ...readers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const q = parse(GrantListQuery, req.query);
    res.json({ success: true, data: await listGrants({ ...q, page: q.page ?? 1, limit: q.limit ?? 20 }) });
  }),
);

adminDemoGrantsRouter.post(
  '/',
  ...managers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = parse(DirectGrantSchema, req.body);
    const result = await createDirectGrants(body, actorOf(req), req);
    res.status(201).json({
      success: true,
      message: result.activationUrl
        ? 'Acceso concedido. Comparte el enlace de activación si el correo no llega.'
        : 'Acceso concedido. La persona ya tiene cuenta: puede iniciar sesión y ver sus demos.',
      data: result,
    });
  }),
);

const ExtendSchema = z.object({ dias: z.coerce.number().int().min(MIN_GRANT_DAYS).max(MAX_GRANT_DAYS) });

adminDemoGrantsRouter.post(
  '/:id/extend',
  ...managers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { dias } = parse(ExtendSchema, req.body);
    res.json({ success: true, message: 'Acceso extendido.', data: await extendGrant(req.params.id, dias, actorOf(req), req) });
  }),
);

const RevokeSchema = z.object({ motivo: z.string().trim().max(1000).optional() });

adminDemoGrantsRouter.post(
  '/:id/revoke',
  ...managers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { motivo } = parse(RevokeSchema, req.body);
    res.json({ success: true, message: 'Acceso revocado.', data: await revokeGrant(req.params.id, motivo || undefined, actorOf(req), req) });
  }),
);

adminDemoGrantsRouter.post(
  '/:id/resend-activation',
  ...managers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw new AppError('Acceso no encontrado', 404, 'not_found');
    const grant = await DemoGrant.findById(req.params.id).select('user').lean();
    if (!grant) throw new AppError('Acceso no encontrado', 404, 'not_found');
    const data = await resendActivation(String(grant.user), actorOf(req), { entidad: { tipo: 'DemoGrant', id: String(grant._id) }, req });
    res.json({ success: true, message: 'Enlace de activación nuevo emitido.', data });
  }),
);

// ---------------------------------------------------------------------------
//   Catálogo
// ---------------------------------------------------------------------------

export const adminDemoCatalogRouter = Router();

adminDemoCatalogRouter.get(
  '/',
  ...readers,
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const items = await listCatalog();
    res.json({ success: true, data: items.map(adminCatalogView) });
  }),
);

const CatalogPatchSchema = z
  .object({
    accessMode: z.enum(DEMO_ACCESS_MODES).optional(),
    activo: z.boolean().optional(),
    duracionDiasPorDefecto: z.coerce.number().int().min(MIN_GRANT_DAYS).max(MAX_GRANT_DAYS).optional(),
    orden: z.coerce.number().int().min(0).max(100_000).optional(),
    nombre: z.string().trim().min(2).max(120).optional(),
    nombreEn: z.string().trim().min(2).max(120).optional(),
  })
  .strict()
  .refine((b) => Object.keys(b).length > 0, { message: 'No hay cambios para guardar.' });

/** El chatbot RAG es siempre público (wiki 04, §4): destino de la pauta y de "Probar la demo". */
const FIXED_PUBLIC_DEMOS = new Set(['chatbot']);

async function patchCatalog(req: AuthRequest, res: Response, slugRaw: unknown, rawBody: unknown) {
  const slug = typeof slugRaw === 'string' ? slugRaw.trim().toLowerCase() : '';
  if (!/^[a-z0-9-]{2,60}$/.test(slug)) throw new AppError('Indica la demo (slug).', 400, 'invalid_request', { fields: ['slug'] });
  const changes = parse(CatalogPatchSchema, rawBody);
  const before = await getCatalogEntry(slug);
  if (!before) throw new AppError('Esa demo no existe en el catálogo.', 404, 'not_found');
  if (FIXED_PUBLIC_DEMOS.has(slug) && ((changes.accessMode && changes.accessMode !== 'publico') || changes.activo === false)) {
    throw new AppError('La demo del chatbot RAG es siempre pública y activa.', 422, 'fixed_mode');
  }

  const seed = DEMO_SEED_BY_SLUG[slug];
  const setOnInsert: Record<string, unknown> = {};
  if (seed) {
    for (const [k, v] of Object.entries(seed)) if (!(k in changes)) setOnInsert[k] = v;
  } else {
    setOnInsert.slug = slug;
    if (!('nombre' in changes)) setOnInsert.nombre = before.nombre;
    if (!('accessMode' in changes)) setOnInsert.accessMode = before.accessMode;
  }
  const updated = await DemoCatalogItem.findOneAndUpdate(
    { slug },
    { $set: { ...changes, actualizadoPor: req.user!.id }, ...(Object.keys(setOnInsert).length ? { $setOnInsert: setOnInsert } : {}) },
    { new: true, upsert: true, runValidators: true },
  ).lean();

  const antes: Record<string, unknown> = {};
  const despues: Record<string, unknown> = {};
  for (const k of Object.keys(changes) as Array<keyof typeof changes>) {
    antes[k] = (before as unknown as Record<string, unknown>)[k];
    despues[k] = changes[k];
  }
  await recordAudit({
    actor: actorOf(req),
    accion: 'demo_catalog.update',
    entidad: { tipo: 'DemoCatalogItem', id: slug },
    detalle: { slug, antes, despues },
    req,
  });
  res.json({
    success: true,
    message: 'Catálogo actualizado.',
    data: adminCatalogView({ ...updated!, nombreEn: updated!.nombreEn, persistido: true }),
  });
}

adminDemoCatalogRouter.patch(
  '/:slug',
  ...catalogAdmins,
  asyncHandler(async (req: AuthRequest, res: Response) => patchCatalog(req, res, req.params.slug, req.body)),
);

adminDemoCatalogRouter.patch(
  '/',
  ...catalogAdmins,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { slug, ...rest } = (req.body ?? {}) as Record<string, unknown>;
    return patchCatalog(req, res, slug, rest);
  }),
);

// ---------------------------------------------------------------------------
//   Bitácora
// ---------------------------------------------------------------------------

export const adminAuditLogRouter = Router();

const AuditQuery = PageSchema.extend({
  accion: optionalQuery(80),
  entidadTipo: optionalQuery(60),
  entidadId: optionalQuery(80),
});

adminAuditLogRouter.get(
  '/',
  ...requireRole('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const q = parse(AuditQuery, req.query);
    const filter: Record<string, unknown> = {};
    if (q.accion) filter.accion = q.accion;
    if (q.entidadTipo) filter['entidad.tipo'] = q.entidadTipo;
    if (q.entidadId) filter['entidad.id'] = q.entidadId;
    const [total, docs] = await Promise.all([
      AuditLog.countDocuments(filter),
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(((q.page ?? 1) - 1) * (q.limit ?? 20))
        .limit(q.limit ?? 20)
        .lean(),
    ]);
    res.json({
      success: true,
      data: {
        items: docs.map((d) => ({
          id: String(d._id),
          accion: d.accion,
          actor: d.actor ? String(d.actor) : null,
          actorEmail: d.actorEmail ?? null,
          actorRol: d.actorRol ?? null,
          entidad: d.entidad,
          detalle: d.detalle ?? null,
          fecha: d.createdAt,
        })),
        total,
        page: q.page ?? 1,
        pages: Math.max(1, Math.ceil(total / (q.limit ?? 20))),
      },
    });
  }),
);
