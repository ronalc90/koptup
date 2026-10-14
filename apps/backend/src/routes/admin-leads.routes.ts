/**
 * Pipeline de leads para el equipo (wiki 05 §8). Se monta en app.ts ANTES de
 * `/api/admin` (admin.routes exige admin o manager en todo su router; aquí
 * `sales` también gestiona).
 *
 * Permisos (rol leído de la BD en cada petición, config/commerce.ts):
 *  - Leer: admin, sales, manager.
 *  - Gestionar (etapa, responsable, próxima acción, actividades, alta): admin y sales.
 *  - Ejecutar la migración de contactos a mano: admin.
 *
 *  /api/admin/leads
 *    GET    /                        ?etapa=&responsable=<id>|me|none&origen=&q=&vencidas=1&page=&limit=
 *                                    (incluye `conteos` por etapa para el tablero)
 *    POST   /                        { nombre, email, empresa?, telefono?, interes?, nota? } (lead manual)
 *    POST   /sync                    migra los Contact sin lead (admin; también corre al arrancar)
 *    GET    /:id                     ficha: lead, actividades, contactos, solicitudes, accesos, propuestas
 *    POST   /:id/stage               { etapa, motivo? (obligatorio si perdido), detalle?, nota? }
 *    POST   /:id/assign              { responsable: <userId> | null }
 *    PUT    /:id/next-action         { descripcion, fecha } | { clear: true }
 *    POST   /:id/activities          { tipo: nota|llamada|email|whatsapp|reunion|tarea, texto, vence? }
 *    PATCH  /:id/activities/:actId   { completada: boolean } (solo tareas)
 */
import { Router, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { requireRole } from '../middleware/access';
import { AuthRequest } from '../types';
import {
  LEAD_LOST_REASONS,
  LEAD_MANAGE_ROLES,
  LEAD_MANUAL_ACTIVITY_TYPES,
  LEAD_READ_ROLES,
  LEAD_SOURCES,
  LEAD_STAGES,
} from '../config/commerce';
import {
  type LeadActor,
  addManualActivity,
  assignOwner,
  changeStage,
  createManualLead,
  getLeadDetail,
  leadView,
  listLeads,
  migrateContactsToLeads,
  setNextAction,
  updateTask,
} from '../services/leads.service';
import { recordAudit } from '../services/audit.service';
import { zodToAppError } from './demo-public.routes';

const readers = requireRole(...LEAD_READ_ROLES);
const managers = requireRole(...LEAD_MANAGE_ROLES);

function actorOf(req: AuthRequest): LeadActor {
  const u = req.user!;
  return { id: u.id, email: u.email, role: u.role };
}

function parse<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const parsed = schema.safeParse(data ?? {});
  if (!parsed.success) throw zodToAppError(parsed.error);
  return parsed.data;
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const ListQuery = z.object({
  etapa: z.enum(LEAD_STAGES).optional(),
  responsable: optionalText(40),
  origen: z.enum(LEAD_SOURCES).optional(),
  q: optionalText(120),
  vencidas: z
    .enum(['1', 'true', '0', 'false'])
    .optional()
    .transform((v) => v === '1' || v === 'true'),
  page: z.coerce.number().int().min(1).max(10_000).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

export const adminLeadsRouter = Router();

adminLeadsRouter.get(
  '/',
  ...readers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const q = parse(ListQuery, req.query);
    res.json({ success: true, data: await listLeads({ ...q, page: q.page ?? 1, limit: q.limit ?? 50, actorId: req.user!.id }) });
  }),
);

const CreateLeadSchema = z.object({
  nombre: z.string().trim().min(2, 'Escribe el nombre.').max(160),
  email: z.string().trim().max(254).email('Escribe un email válido.'),
  empresa: optionalText(160),
  telefono: optionalText(40),
  interes: optionalText(200),
  nota: optionalText(4000),
});

adminLeadsRouter.post(
  '/',
  ...managers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = parse(CreateLeadSchema, req.body) as { nombre: string; email: string; empresa?: string; telefono?: string; interes?: string; nota?: string };
    const result = await createManualLead(body, actorOf(req), req);
    res.status(result.creado ? 201 : 200).json({
      success: true,
      message: result.creado ? 'Lead creado.' : 'Ese email ya era un lead: se actualizó el existente.',
      data: result,
    });
  }),
);

adminLeadsRouter.post(
  '/sync',
  ...requireRole('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await migrateContactsToLeads();
    await recordAudit({ actor: actorOf(req), accion: 'lead.migrate_contacts', entidad: { tipo: 'Lead' }, detalle: { ...result }, req });
    res.json({ success: true, data: result });
  }),
);

adminLeadsRouter.get(
  '/:id',
  ...readers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json({ success: true, data: await getLeadDetail(req.params.id) });
  }),
);

const StageSchema = z
  .object({
    etapa: z.enum(LEAD_STAGES),
    motivo: z.enum(LEAD_LOST_REASONS).optional(),
    detalle: optionalText(1000),
    nota: optionalText(1000),
  })
  .refine((b) => b.etapa !== 'perdido' || !!b.motivo, { message: 'Indica el motivo de la pérdida.', path: ['motivo'] });

adminLeadsRouter.post(
  '/:id/stage',
  ...managers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = parse(StageSchema, req.body);
    const lead = await changeStage(req.params.id, body.etapa, { actor: actorOf(req), motivo: body.motivo, detalle: body.detalle, nota: body.nota, req });
    res.json({ success: true, message: 'Etapa actualizada.', data: { lead: leadView(lead) } });
  }),
);

const AssignSchema = z.object({ responsable: z.union([z.string().trim().max(40), z.null()]) });

adminLeadsRouter.post(
  '/:id/assign',
  ...managers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { responsable } = parse(AssignSchema, req.body);
    const lead = await assignOwner(req.params.id, responsable || null, actorOf(req), req);
    res.json({ success: true, message: responsable ? 'Responsable asignado.' : 'Responsable quitado.', data: { lead: leadView(lead) } });
  }),
);

const NextActionSchema = z.union([
  z.object({ clear: z.literal(true) }).strict(),
  z
    .object({
      descripcion: z.string().trim().min(2, 'Describe la próxima acción.').max(500),
      fecha: z.coerce.date({ errorMap: () => ({ message: 'Indica una fecha válida.' }) }),
    })
    .strict(),
]);

adminLeadsRouter.put(
  '/:id/next-action',
  ...managers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = parse(NextActionSchema, req.body) as { clear: true } | { descripcion: string; fecha: Date };
    const accion = 'clear' in body ? null : { descripcion: body.descripcion, fecha: body.fecha };
    const lead = await setNextAction(req.params.id, accion, actorOf(req), req);
    res.json({ success: true, message: accion ? 'Próxima acción guardada.' : 'Próxima acción quitada.', data: { lead: leadView(lead) } });
  }),
);

const ActivitySchema = z.object({
  tipo: z.enum(LEAD_MANUAL_ACTIVITY_TYPES),
  texto: z.string().trim().min(1, 'Escribe el detalle.').max(4000),
  vence: z.coerce.date().optional(),
});

adminLeadsRouter.post(
  '/:id/activities',
  ...managers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = parse(ActivitySchema, req.body) as { tipo: (typeof LEAD_MANUAL_ACTIVITY_TYPES)[number]; texto: string; vence?: Date };
    const result = await addManualActivity(req.params.id, body, actorOf(req), req);
    res.status(201).json({ success: true, message: 'Actividad registrada.', data: result });
  }),
);

const TaskPatchSchema = z.object({ completada: z.boolean() }).strict();

adminLeadsRouter.patch(
  '/:id/activities/:activityId',
  ...managers,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { completada } = parse(TaskPatchSchema, req.body);
    const result = await updateTask(req.params.id, req.params.activityId, completada, actorOf(req));
    res.json({ success: true, message: completada ? 'Tarea completada.' : 'Tarea reabierta.', data: result });
  }),
);

