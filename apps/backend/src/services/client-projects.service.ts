/**
 * client-projects.service.ts — proyectos de los clientes (Admin › Proyectos).
 *
 * `createClientProject` es el punto único para crear el proyecto de un
 * cliente: lo usa el panel y lo puede reutilizar la conversión de una
 * propuesta aceptada (pasando `proposalId`; el índice único de
 * `Project.proposal_id` evita duplicarlo). Al crearlo:
 *  - la cuenta queda como cliente (`prospect` y `user` pasan a `client`, con
 *    registro en la bitácora); una cuenta del equipo no puede ser cliente;
 *  - se crea la conversación del proyecto con el cliente (Mensajes);
 *  - se notifica al cliente (portal y correo según sus preferencias);
 *  - queda en la bitácora (`project.create`) y en la actividad del proyecto.
 */
import type { Request } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Project, { type IProject } from '../models/Project';
import User from '../models/User';
import ActivityLog from '../models/ActivityLog';
import Invoice from '../models/Invoice';
import Deliverable from '../models/Deliverable';
import Conversation from '../models/Conversation';
import Order from '../models/Order';
import { AppError } from '../middleware/errorHandler';
import { isStaffRole } from '../middleware/access';
import { recordAudit } from './audit.service';
import { PROJECT_STATUS_LABELS, notifyClient } from './portal-notify.service';
import { createClientConversation, type StaffActor } from './conversations.service';
import { businessDay, endOfBusinessDay, startOfBusinessDay } from '../utils/dates';
import { logger } from '../utils/logger';

export const PROJECT_STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'] as const;
export const PROJECT_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export const PROJECT_CURRENCIES = ['COP', 'USD'] as const;

const Day = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa el formato AAAA-MM-DD.');

export const CreateProjectSchema = z
  .object({
    clientId: z.string().trim().min(1, 'Elige el cliente del proyecto.'),
    name: z.string().trim().min(3, 'Escribe el nombre del proyecto (mínimo 3 caracteres).').max(160),
    description: z.string().trim().max(5000).optional(),
    budget: z.coerce.number().min(0).max(100_000_000_000).optional(),
    currency: z.enum(PROJECT_CURRENCIES).optional(),
    status: z.enum(PROJECT_STATUSES).optional(),
    priority: z.enum(PROJECT_PRIORITIES).optional(),
    startDate: Day.optional(),
    endDate: Day.optional(),
    managerId: z.string().trim().optional(),
    /** Primer mensaje de la conversación del proyecto (opcional). */
    welcomeMessage: z.string().trim().max(2000).optional(),
  })
  .strict();

export const UpdateProjectSchema = z
  .object({
    name: z.string().trim().min(3).max(160).optional(),
    description: z.string().trim().max(5000).optional(),
    budget: z.coerce.number().min(0).max(100_000_000_000).nullable().optional(),
    currency: z.enum(PROJECT_CURRENCIES).optional(),
    status: z.enum(PROJECT_STATUSES).optional(),
    priority: z.enum(PROJECT_PRIORITIES).optional(),
    progress: z.coerce.number().int().min(0).max(100).optional(),
    startDate: Day.nullable().optional(),
    endDate: Day.nullable().optional(),
  })
  .strict();

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export interface CreateClientProjectOptions {
  /** Propuesta de origen (conversión): un proyecto por propuesta. */
  proposalId?: string | mongoose.Types.ObjectId | null;
  req?: Request;
}

function toDate(day: string | null | undefined, end = false): Date | undefined {
  if (!day) return undefined;
  const d = end ? endOfBusinessDay(day) : startOfBusinessDay(day);
  if (!d) throw new AppError('La fecha no es válida.', 400, 'invalid_date');
  return d;
}

/** Cuenta del cliente: existe, no es del equipo; un prospecto o `user` pasa a `client`. */
export async function ensureClientAccount(clientId: string, actor: StaffActor, motivo: string, req?: Request) {
  if (!mongoose.Types.ObjectId.isValid(clientId)) throw new AppError('El cliente no es válido.', 400, 'invalid_request', { fields: ['clientId'] });
  const user = await User.findById(clientId).select('name email role company phone');
  if (!user) throw new AppError('No encontramos la cuenta del cliente.', 404, 'client_not_found');
  if (isStaffRole(user.role) || user.role === 'developer') {
    throw new AppError('Esa cuenta es del equipo de KopTup: elige la cuenta del cliente.', 400, 'client_is_staff');
  }
  if (user.role !== 'client') {
    const antes = user.role;
    user.role = 'client';
    await user.save();
    await recordAudit({
      actor,
      accion: 'user.role_change',
      entidad: { tipo: 'User', id: String(user._id) },
      detalle: { email: user.email, antes, despues: 'client', motivo },
      req,
    });
  }
  return user;
}

/** Crea el proyecto de un cliente (panel o conversión de una propuesta). */
export async function createClientProject(input: CreateProjectInput, actor: StaffActor, opts: CreateClientProjectOptions = {}) {
  const client = await ensureClientAccount(input.clientId, actor, `Proyecto "${input.name}"`, opts.req);

  let managerId = new mongoose.Types.ObjectId(actor.id);
  if (input.managerId) {
    const manager = mongoose.Types.ObjectId.isValid(input.managerId) ? await User.findById(input.managerId).select('role').lean() : null;
    if (!manager || !(isStaffRole(manager.role) || manager.role === 'developer')) {
      throw new AppError('El responsable debe ser una cuenta del equipo.', 400, 'invalid_manager', { fields: ['managerId'] });
    }
    managerId = manager._id as mongoose.Types.ObjectId;
  }
  const start = toDate(input.startDate) ?? new Date();
  const end = toDate(input.endDate, true);
  if (end && end.getTime() < start.getTime()) {
    throw new AppError('La fecha de entrega no puede ser anterior al inicio.', 400, 'invalid_dates', { fields: ['endDate'] });
  }

  const project = await Project.create({
    name: input.name,
    description: input.description,
    client_id: client._id,
    manager_id: managerId,
    status: input.status ?? 'planning',
    priority: input.priority ?? 'medium',
    budget: input.budget,
    currency: input.currency ?? 'COP',
    start_date: start,
    end_date: end,
    progress: 0,
    ...(opts.proposalId ? { proposal_id: opts.proposalId } : {}),
  });

  await ActivityLog.create({
    project_id: project._id,
    user_id: new mongoose.Types.ObjectId(actor.id),
    action: 'created_project',
    entity_type: 'project',
    entity_id: project._id,
    details: 'Proyecto creado desde el panel',
  }).catch((err) => logger.warn(`[projects] Actividad: ${(err as Error)?.message ?? err}`));

  // Conversación del proyecto con el cliente (Mensajes del portal).
  try {
    await createClientConversation({
      title: `Proyecto: ${project.name}`,
      clientId: client._id as mongoose.Types.ObjectId,
      createdBy: actor.id,
      projectId: project._id as mongoose.Types.ObjectId,
      staff: actor,
      firstMessage: input.welcomeMessage ? { from: 'staff', content: input.welcomeMessage } : null,
    });
  } catch (err) {
    logger.warn(`[projects] No se pudo crear la conversación del proyecto: ${(err as Error)?.message ?? err}`);
  }

  await recordAudit({
    actor,
    accion: 'project.create',
    entidad: { tipo: 'Project', id: String(project._id) },
    detalle: { nombre: project.name, cliente: client.email, presupuesto: input.budget ?? null, moneda: project.currency, propuesta: opts.proposalId ? String(opts.proposalId) : null },
    req: opts.req,
  });
  await notifyClient({
    userId: client._id as mongoose.Types.ObjectId,
    type: 'project',
    evento: 'project_created',
    params: { name: project.name },
    title: 'Tu proyecto está en el portal',
    message: `Creamos el proyecto "${project.name}". Desde tu portal puedes seguir su avance, sus entregables y sus facturas.`,
    actionUrl: '/dashboard/projects',
    metadata: { projectId: String(project._id) },
  });
  return project;
}

/** Actualiza un proyecto; si cambia el estado, se avisa al cliente. */
export async function updateClientProject(id: string, input: z.infer<typeof UpdateProjectSchema>, actor: StaffActor, req?: Request) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Proyecto no encontrado', 404, 'not_found');
  const project = await Project.findById(id);
  if (!project) throw new AppError('Proyecto no encontrado', 404, 'not_found');
  const before = { status: project.status, progress: project.progress };
  if (input.name !== undefined) project.name = input.name;
  if (input.description !== undefined) project.description = input.description;
  if (input.budget !== undefined) project.budget = input.budget ?? undefined;
  if (input.currency !== undefined) project.currency = input.currency;
  if (input.status !== undefined) project.status = input.status;
  if (input.priority !== undefined) project.priority = input.priority;
  if (input.progress !== undefined) project.progress = input.progress;
  if (input.startDate !== undefined) project.start_date = input.startDate ? toDate(input.startDate) : undefined;
  if (input.endDate !== undefined) project.end_date = input.endDate ? toDate(input.endDate, true) : undefined;
  if (input.status === 'completed' && input.progress === undefined) project.progress = 100;
  if (project.start_date && project.end_date && project.end_date.getTime() < project.start_date.getTime()) {
    throw new AppError('La fecha de entrega no puede ser anterior al inicio.', 400, 'invalid_dates', { fields: ['endDate'] });
  }
  await project.save();
  await recordAudit({
    actor,
    accion: 'project.update',
    entidad: { tipo: 'Project', id: String(project._id) },
    detalle: { nombre: project.name, cambios: Object.keys(input) },
    req,
  });
  if (project.client_id && input.status !== undefined && input.status !== before.status) {
    await notifyClient({
      userId: project.client_id,
      type: 'project',
      evento: 'project_status',
      params: { name: project.name, status: input.status },
      title: `Proyecto ${PROJECT_STATUS_LABELS[input.status]?.toLowerCase() ?? 'actualizado'}`,
      message: `El proyecto "${project.name}" pasó a: ${PROJECT_STATUS_LABELS[input.status] ?? input.status}.`,
      actionUrl: '/dashboard/projects',
      metadata: { projectId: String(project._id) },
    });
  }
  return project;
}

/** Vista de un proyecto para el panel. */
export function adminProjectView(p: Record<string, any>, counts?: { invoices: number; deliverables: number; orders: number; conversation: string | null }) {
  const client = p.client_id && typeof p.client_id === 'object' && 'email' in p.client_id ? p.client_id : null;
  const manager = p.manager_id && typeof p.manager_id === 'object' && 'email' in p.manager_id ? p.manager_id : null;
  return {
    id: String(p._id),
    name: p.name,
    description: p.description ?? '',
    status: p.status as IProject['status'],
    priority: p.priority,
    progress: p.progress ?? 0,
    budget: p.budget ?? null,
    currency: p.currency ?? 'COP',
    startDate: businessDay(p.start_date),
    endDate: businessDay(p.end_date),
    client: client ? { id: String(client._id), name: client.name, email: client.email, company: client.company ?? null } : null,
    manager: manager ? { id: String(manager._id), name: manager.name, email: manager.email } : null,
    proposalId: p.proposal_id ? String(p.proposal_id) : null,
    createdAt: p.created_at,
    ...(counts ?? {}),
  };
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listClientProjects(params: { q?: string; status?: string; clientId?: string }) {
  const filter: Record<string, unknown> = {};
  if (params.status && (PROJECT_STATUSES as readonly string[]).includes(params.status)) filter.status = params.status;
  if (params.clientId && mongoose.Types.ObjectId.isValid(params.clientId)) filter.client_id = new mongoose.Types.ObjectId(params.clientId);
  if (params.q) {
    const rx = new RegExp(escapeRegex(params.q), 'i');
    const users = await User.find({ $or: [{ email: rx }, { name: rx }, { company: rx }] }).select('_id').limit(500).lean();
    filter.$or = [{ name: rx }, { client_id: { $in: users.map((u) => u._id) } }];
  }
  const projects = await Project.find(filter).populate('client_id', 'name email company').populate('manager_id', 'name email').sort({ updated_at: -1 }).limit(300).lean();
  const ids = projects.map((p) => p._id);
  const [invoices, deliverables, orders, conversations] = await Promise.all([
    Invoice.aggregate<{ _id: mongoose.Types.ObjectId; n: number }>([{ $match: { projectId: { $in: ids } } }, { $group: { _id: '$projectId', n: { $sum: 1 } } }]),
    Deliverable.aggregate<{ _id: mongoose.Types.ObjectId; n: number }>([{ $match: { projectId: { $in: ids } } }, { $group: { _id: '$projectId', n: { $sum: 1 } } }]),
    Order.aggregate<{ _id: mongoose.Types.ObjectId; n: number }>([{ $match: { projectId: { $in: ids } } }, { $group: { _id: '$projectId', n: { $sum: 1 } } }]),
    Conversation.find({ projectId: { $in: ids } }).select('projectId conversationId').sort({ createdAt: 1 }).lean(),
  ]);
  const count = (rows: Array<{ _id: mongoose.Types.ObjectId; n: number }>, id: unknown) => rows.find((r) => String(r._id) === String(id))?.n ?? 0;
  return projects.map((p) =>
    adminProjectView(p, {
      invoices: count(invoices, p._id),
      deliverables: count(deliverables, p._id),
      orders: count(orders, p._id),
      conversation: conversations.find((c) => String(c.projectId) === String(p._id))?.conversationId ?? null,
    }),
  );
}

/** Cuentas que pueden ser clientes (para los selectores del panel). */
export async function searchClientAccounts(q?: string) {
  const filter: Record<string, unknown> = { role: { $in: ['client', 'user', 'prospect'] } };
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ email: rx }, { name: rx }, { company: rx }];
  }
  const users = await User.find(filter).select('name email company role phone').sort({ name: 1 }).limit(50).lean();
  return users.map((u) => ({ id: String(u._id), name: u.name, email: u.email, company: u.company ?? null, role: u.role, phone: u.phone ?? null }));
}
