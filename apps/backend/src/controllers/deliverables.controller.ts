/**
 * Entregables del portal: el equipo los sube (archivo) o los registra (enlace)
 * dentro de un proyecto; quedan a nombre del CLIENTE del proyecto, que los ve,
 * los descarga y los aprueba o rechaza en su portal.
 *
 *  - GET  /api/deliverables              los del cliente que consulta
 *  - GET  /api/deliverables/:id          dueño o equipo
 *  - GET  /api/deliverables/:id/download dueño o equipo (archivo como descarga; un enlace responde su URL)
 *  - POST /api/deliverables              equipo (admin, manager, developer): multipart `file` o `link` https
 *  - PUT  /api/deliverables/:id          equipo: título y descripción
 *  - POST /api/deliverables/:id/approve | reject   dueño (el cliente) o equipo
 */
import { Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import { AuthRequest } from '../types';
import { isStaffSession } from '../middleware/access';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import Deliverable from '../models/Deliverable';
import Project from '../models/Project';
import User from '../models/User';
import { notifyClient } from '../services/portal-notify.service';
import { notifyTeamInBackground } from '../services/team-notify.service';
import { recordAudit } from '../services/audit.service';
import { frontendUrl } from '../config/demos';
import { businessDay } from '../utils/dates';
import { isSafeUrl } from '../utils/html';

const DELIVERABLE_TYPES = ['design', 'code', 'documentation', 'prototype', 'other'] as const;
const DELIVERABLES_DIR = path.resolve('./uploads/deliverables');

type Populated = Record<string, any>;

function nameOf(ref: unknown): string | null {
  return ref && typeof ref === 'object' && 'name' in ref ? String((ref as { name?: string }).name ?? '') || null : null;
}

/** Vista de un entregable para el portal y el panel. */
export function deliverableView(d: Populated) {
  const project = d.projectId && typeof d.projectId === 'object' && 'name' in d.projectId ? d.projectId : null;
  const client = d.userId && typeof d.userId === 'object' && 'email' in d.userId ? d.userId : null;
  const storage: 'file' | 'link' = d.storage === 'link' ? 'link' : 'file';
  return {
    id: d.deliverableId,
    title: d.title,
    description: d.description ?? '',
    type: d.type,
    status: d.status,
    storage,
    fileName: d.fileName,
    fileSize: d.fileSize ?? 0,
    fileType: d.fileType ?? null,
    // Solo los enlaces exponen su URL; los archivos se bajan con sesión.
    url: storage === 'link' ? d.fileUrl : null,
    version: d.version ?? 1,
    uploadDate: businessDay(d.uploadDate),
    approvedDate: businessDay(d.approvedDate),
    rejectedDate: businessDay(d.rejectedDate),
    comments: d.comments ?? null,
    project: project ? { id: String(project._id), name: project.name } : d.projectId ? { id: String(d.projectId), name: null } : null,
    client: client ? { id: String(client._id), name: client.name, email: client.email } : { id: String(d.userId), name: null, email: null },
    uploadedBy: nameOf(d.uploadedBy),
    reviewedBy: nameOf(d.reviewedBy),
    createdAt: d.createdAt,
  };
}

function populateDeliverable<T extends { populate: (...a: any[]) => T }>(q: T): T {
  return q.populate('projectId', 'name').populate('userId', 'name email').populate('uploadedBy', 'name').populate('reviewedBy', 'name');
}

async function loadOwnedOrStaff(req: AuthRequest, id: string) {
  const deliverable = await Deliverable.findOne({ deliverableId: String(id) });
  if (!deliverable) throw new AppError('Entregable no encontrado', 404, 'not_found');
  if (String(deliverable.userId) !== String(req.user!.id) && !(await isStaffSession(req))) {
    throw new AppError('No tienes permiso para ver este entregable', 403, 'forbidden');
  }
  return deliverable;
}

// Obtener los entregables del cliente
export const getDeliverables = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined;
  const query: Record<string, unknown> = { userId };
  if (status && status !== 'all') query.status = status;
  if (projectId && mongoose.Types.ObjectId.isValid(projectId)) query.projectId = projectId;
  const deliverables = await populateDeliverable(Deliverable.find(query)).sort({ createdAt: -1 }).limit(500).lean();
  res.json({ success: true, data: deliverables.map(deliverableView) });
});

export const getDeliverableById = asyncHandler(async (req: AuthRequest, res: Response) => {
  await loadOwnedOrStaff(req, String(req.params.id));
  const d = await populateDeliverable(Deliverable.findOne({ deliverableId: String(req.params.id) }))
    .populate('history.user', 'name')
    .lean();
  if (!d) throw new AppError('Entregable no encontrado', 404, 'not_found');
  res.json({
    success: true,
    data: {
      ...deliverableView(d),
      history: (d.history ?? []).map((h: any) => ({ date: h.date, action: h.action, userName: h.userName, description: h.description })),
    },
  });
});

/** Descarga: el archivo (siempre como descarga) o la URL del enlace. */
export const downloadDeliverable = asyncHandler(async (req: AuthRequest, res: Response) => {
  const deliverable = await loadOwnedOrStaff(req, String(req.params.id));
  res.setHeader('Cache-Control', 'private, no-store');
  if (deliverable.storage === 'link') {
    res.json({ success: true, data: { storage: 'link', url: deliverable.fileUrl } });
    return;
  }
  const storedName = path.basename(String(deliverable.fileUrl ?? ''));
  if (!storedName || storedName === '.' || storedName === '..') throw new AppError('Este entregable no tiene archivo.', 404, 'not_found');
  const filePath = path.join(DELIVERABLES_DIR, storedName);
  try {
    await fs.access(filePath);
  } catch {
    throw new AppError('El archivo ya no está disponible en el servidor. Pídele al equipo que lo vuelva a subir.', 410, 'file_unavailable');
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const downloadName = String(deliverable.fileName || storedName).replace(/[\r\n"]/g, '_');
  res.download(filePath, downloadName);
});

async function discard(file: Express.Multer.File | undefined): Promise<void> {
  if (file?.path) await fs.unlink(file.path).catch(() => undefined);
}

/**
 * POST /api/deliverables (equipo) — `projectId`, `title`, `type`,
 * `description?` y el archivo (`file`, multipart) o `link` (https). Queda a
 * nombre del cliente del proyecto y en revisión del cliente.
 */
export const uploadDeliverable = asyncHandler(async (req: AuthRequest, res: Response) => {
  const file = (req as { file?: Express.Multer.File }).file;
  try {
    const user = req.user!;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const projectId = typeof body.projectId === 'string' ? body.projectId : '';
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const type = typeof body.type === 'string' ? body.type : 'other';
    const link = typeof body.link === 'string' ? body.link.trim() : '';

    if (!mongoose.Types.ObjectId.isValid(projectId)) throw new AppError('Elige el proyecto del entregable.', 400, 'invalid_request', { fields: ['projectId'] });
    if (!title || title.length > 200) throw new AppError('Escribe el título del entregable (máximo 200 caracteres).', 400, 'invalid_request', { fields: ['title'] });
    if (description.length > 3000) throw new AppError('La descripción puede tener máximo 3000 caracteres.', 400, 'invalid_request', { fields: ['description'] });
    if (!(DELIVERABLE_TYPES as readonly string[]).includes(type)) throw new AppError('Tipo de entregable no válido.', 400, 'invalid_request', { fields: ['type'] });
    if (!file && !link) throw new AppError('Sube el archivo o escribe el enlace del entregable.', 400, 'file_required', { fields: ['file'] });
    if (file && link) throw new AppError('Sube un archivo o escribe un enlace, no los dos.', 400, 'invalid_request', { fields: ['link'] });
    if (link && (!/^https:\/\//i.test(link) || link.length > 1000 || !isSafeUrl(link))) {
      throw new AppError('El enlace debe empezar por https://', 400, 'invalid_link', { fields: ['link'] });
    }

    const project = await Project.findById(projectId).select('name client_id').lean();
    if (!project) throw new AppError('Proyecto no encontrado.', 404, 'project_not_found');
    if (!project.client_id) throw new AppError('Este proyecto no tiene cliente: asígnale uno antes de subir entregables.', 400, 'project_without_client');

    const now = new Date();
    let linkName = '';
    if (link) {
      try {
        linkName = new URL(link).hostname;
      } catch {
        linkName = 'enlace';
      }
    }
    const deliverable = await Deliverable.create({
      projectId: project._id,
      userId: project.client_id,
      title,
      description,
      type,
      status: 'in_review',
      uploadDate: now,
      storage: file ? 'file' : 'link',
      fileUrl: file ? `/uploads/deliverables/${file.filename}` : link,
      fileName: file ? file.originalname.slice(0, 200) : linkName,
      fileSize: file ? file.size : 0,
      fileType: file ? file.mimetype : 'link',
      version: 1,
      uploadedBy: user.id,
      history: [{ date: now, action: 'uploaded', user: user.id, userName: user.name || user.email, description: file ? 'Entregable subido' : 'Enlace registrado' }],
    });

    await recordAudit({
      actor: { id: user.id, email: user.email, role: user.role },
      accion: 'deliverable.create',
      entidad: { tipo: 'Deliverable', id: deliverable.deliverableId },
      detalle: { titulo: title, proyecto: String(project._id), almacenamiento: file ? 'archivo' : 'enlace' },
      req,
    });
    await notifyClient({
      userId: project.client_id,
      type: 'deliverable',
      evento: 'deliverable_uploaded',
      params: { title, project: project.name },
      title: 'Nuevo entregable para revisar',
      message: `El equipo de KopTup compartió "${title}" en el proyecto ${project.name}. Revísalo y apruébalo o pide cambios.`,
      actionUrl: '/dashboard/deliverables',
      metadata: { deliverableId: deliverable.deliverableId, projectId: String(project._id) },
    });

    const view = await populateDeliverable(Deliverable.findById(deliverable._id)).lean();
    res.status(201).json({ success: true, data: view ? deliverableView(view) : { id: deliverable.deliverableId }, message: 'Entregable compartido con el cliente.' });
  } catch (err) {
    await discard(file);
    throw err;
  }
});

export const updateDeliverable = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const deliverable = await Deliverable.findOne({ deliverableId: String(req.params.id) });
  if (!deliverable) throw new AppError('Entregable no encontrado', 404, 'not_found');
  const { title, description } = (req.body ?? {}) as { title?: unknown; description?: unknown };
  if (title !== undefined && (typeof title !== 'string' || !title.trim() || title.length > 200)) {
    throw new AppError('Escribe un título válido (máximo 200 caracteres).', 400, 'invalid_request', { fields: ['title'] });
  }
  if (description !== undefined && (typeof description !== 'string' || description.length > 3000)) {
    throw new AppError('La descripción puede tener máximo 3000 caracteres.', 400, 'invalid_request', { fields: ['description'] });
  }
  if (typeof title === 'string') deliverable.title = title.trim();
  if (typeof description === 'string') deliverable.description = description.trim();
  deliverable.history.push({
    date: new Date(),
    action: 'updated',
    user: new mongoose.Types.ObjectId(user.id),
    userName: user.name || user.email,
    description: 'Entregable actualizado',
  });
  await deliverable.save();
  res.json({ success: true, message: 'Entregable actualizado exitosamente' });
});

async function review(req: AuthRequest, res: Response, decision: 'approved' | 'rejected') {
  const user = req.user!;
  const comments = typeof req.body?.comments === 'string' ? req.body.comments.trim().slice(0, 2000) : '';
  if (decision === 'rejected' && !comments) {
    throw new AppError('Cuéntanos qué cambios necesitas para rechazar el entregable.', 400, 'comments_required', { fields: ['comments'] });
  }
  const deliverable = await loadOwnedOrStaff(req, String(req.params.id));
  if (deliverable.status === decision) {
    throw new AppError(decision === 'approved' ? 'Este entregable ya está aprobado.' : 'Este entregable ya está rechazado.', 409, 'already_reviewed');
  }
  const now = new Date();
  deliverable.status = decision;
  if (decision === 'approved') deliverable.approvedDate = now;
  else deliverable.rejectedDate = now;
  deliverable.reviewedBy = new mongoose.Types.ObjectId(user.id);
  deliverable.comments = comments || (decision === 'approved' ? 'Aprobado' : '');
  deliverable.history.push({
    date: now,
    action: decision,
    user: new mongoose.Types.ObjectId(user.id),
    userName: user.name || user.email,
    description: decision === 'approved' ? 'Entregable aprobado' : `Entregable rechazado: ${comments}`.slice(0, 500),
  });
  await deliverable.save();

  // El cliente revisó: se avisa al equipo.
  if (String(deliverable.userId) === String(user.id)) {
    const client = await User.findById(user.id).select('name email').lean();
    notifyTeamInBackground({
      asunto: decision === 'approved' ? `Entregable aprobado: ${deliverable.title}` : `Entregable con cambios: ${deliverable.title}`,
      lineas: [
        `${client?.name || 'El cliente'} ${decision === 'approved' ? 'aprobó' : 'pidió cambios en'} el entregable ${deliverable.deliverableId}.`,
        comments ? `Comentarios: ${comments}` : '',
      ].filter(Boolean),
      enlace: `${frontendUrl()}/admin/deliverables`,
    });
  }
  res.json({ success: true, message: decision === 'approved' ? 'Entregable aprobado exitosamente' : 'Entregable rechazado exitosamente' });
}

export const approveDeliverable = asyncHandler((req: AuthRequest, res: Response) => review(req, res, 'approved'));
export const rejectDeliverable = asyncHandler((req: AuthRequest, res: Response) => review(req, res, 'rejected'));
