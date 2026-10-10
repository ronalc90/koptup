import { Response } from 'express';
import { AuthRequest } from '../types';
import Order from '../models/Order';
import Invoice from '../models/Invoice';
import Deliverable from '../models/Deliverable';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import Contact from '../models/Contact';
import DemoRequest from '../models/DemoRequest';
import mongoose from 'mongoose';
import User from '../models/User';
// Registra los modelos que usa populate().
import '../models/Project';
import { recordAudit } from '../services/audit.service';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { businessDay } from '../utils/dates';
import { ORDER_STATUS_LABELS, notifyClient } from '../services/portal-notify.service';
import { TEAM_UNREAD_KEY, markReadForTeam, postStaffMessage, sendOrderStatusMessage, unreadFor, unreadValues } from '../services/conversations.service';
import { invoiceStatusFilter, invoiceView, issueInvoice } from '../services/invoices.service';
import { deliverableView } from './deliverables.controller';
import { issueMagicLink } from '../services/magic-link.service';

/**
 * Panel de administración (operación). Cada controlador va envuelto en
 * asyncHandler: si algo falla, el error llega al manejador de errores de
 * Express (formato único `{ success: false, code, message }`).
 */

type OrderStatus = 'pending' | 'in_progress' | 'shipped' | 'completed' | 'cancelled';
const ORDER_STATUSES: string[] = ['pending', 'in_progress', 'shipped', 'completed', 'cancelled'];
const CONTACT_STATUSES: string[] = ['new', 'read', 'responded'];
const CONVERSATION_STATUSES: string[] = ['active', 'archived', 'closed'];

/**
 * Filtro de la query string: solo texto. Descarta arrays y objetos
 * (`?status[$ne]=x` llega como objeto y se convertiría en un operador de
 * MongoDB) y recorta el largo.
 */
function queryText(value: unknown, max = 100): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined;
}

/** Texto literal para usar dentro de una expresión regular. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function actorOf(req: AuthRequest) {
  const u = req.user!;
  return { id: u.id, email: u.email, role: u.role, name: u.name };
}

// ---------------------------------------------------------------------------
//   Pedidos
// ---------------------------------------------------------------------------

export const adminGetOrders = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const status = queryText(req.query.status);
  const approval = queryText(req.query.approval);
  const q = queryText(req.query.q);
  const query: Record<string, unknown> = {};
  if (status && status !== 'all') query.status = status;
  if (approval && approval !== 'all') query.approvalStatus = approval === 'pending' ? { $in: ['pending', null] } : approval;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    const users = await User.find({ $or: [{ email: rx }, { name: rx }] }).select('_id').limit(500).lean();
    query.$or = [{ orderId: rx }, { name: rx }, { userId: { $in: users.map((u) => u._id) } }];
  }
  const orders = await Order.find(query)
    .populate('userId', 'name email phone')
    .populate('projectId', 'name')
    .populate('conversationId', 'conversationId')
    .sort({ createdAt: -1 })
    .limit(300)
    .lean();
  const invoices = await Invoice.find({ orderId: { $in: orders.map((o) => o._id) }, status: { $ne: 'cancelled' } })
    .select('orderId invoiceNumber status dueDate')
    .lean();
  const data = orders.map((o: any) => {
    const inv = invoices.find((i) => String(i.orderId) === String(o._id));
    return {
      id: o.orderId,
      _id: o._id,
      name: o.name,
      description: o.description,
      status: o.status,
      approvalStatus: o.approvalStatus || 'pending',
      // Día del pedido en Colombia (AAAA-MM-DD), sin desfase de UTC.
      date: businessDay(o.orderDate),
      createdAt: o.orderDate,
      amount: o.amount,
      currency: o.currency || 'USD',
      items: o.items || [],
      attachments: o.attachments || [],
      comments: o.comments || [],
      user: { _id: o.userId?._id, name: o.userId?.name, email: o.userId?.email, phone: o.userId?.phone ?? null },
      project: o.projectId ? { _id: o.projectId._id, name: o.projectId.name } : null,
      conversationId: o.conversationId?.conversationId ?? null,
      invoice: inv ? { id: String(inv._id), invoiceNumber: inv.invoiceNumber, status: inv.status } : null,
      approvedDate: o.approvedDate,
      rejectedDate: o.rejectedDate,
      rejectionReason: o.rejectionReason,
    };
  });
  res.json({ success: true, data });
});

async function notifyOrderChange(
  order: { userId: mongoose.Types.ObjectId; orderId: string; name: string; conversationId?: mongoose.Types.ObjectId | null },
  req: AuthRequest,
  change: { evento: 'order_status' | 'order_approved' | 'order_rejected'; title: string; message: string; status?: string; reason?: string },
) {
  await notifyClient({
    userId: order.userId,
    type: 'order',
    evento: change.evento,
    params: { id: order.orderId, name: order.name, ...(change.status ? { status: change.status } : {}), ...(change.reason ? { reason: change.reason } : {}) },
    title: change.title,
    message: change.message,
    actionUrl: `/dashboard/orders/${encodeURIComponent(order.orderId)}`,
    metadata: { orderId: order.orderId },
  });
  if (order.conversationId) await sendOrderStatusMessage(order.conversationId, actorOf(req), change.message);
}

export const adminUpdateOrderStatus = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = (req.body ?? {}) as { status?: unknown };
  if (typeof status !== 'string' || !ORDER_STATUSES.includes(status)) {
    res.status(400).json({ success: false, message: 'Estado requerido', validStatuses: ORDER_STATUSES });
    return;
  }
  const order = await Order.findOne({ orderId: String(id) });
  if (!order) throw new AppError('Pedido no encontrado', 404, 'not_found');
  if (order.status === status) {
    res.json({ success: true, message: 'El pedido ya tenía ese estado', data: { id: order.orderId, status: order.status } });
    return;
  }
  if (order.approvalStatus === 'rejected' && status !== 'cancelled') {
    throw new AppError('El pedido está rechazado: apruébalo de nuevo antes de cambiar su estado.', 409, 'order_rejected');
  }
  order.status = status as OrderStatus;
  if (status === 'completed') order.completedDate = new Date();
  order.history.push({
    date: new Date(),
    status,
    description: `Estado actualizado por el equipo a «${ORDER_STATUS_LABELS[status] ?? status}»`,
    updatedBy: new mongoose.Types.ObjectId(req.user!.id),
  });
  await order.save();
  const label = ORDER_STATUS_LABELS[status] ?? status;
  await notifyOrderChange(order, req, {
    evento: 'order_status',
    status,
    title: `Pedido ${order.orderId}: ${label.toLowerCase()}`,
    message: `Tu pedido ${order.orderId} ("${order.name}") cambió a: ${label}.`,
  });
  res.json({ success: true, message: 'Estado actualizado', data: { id: order.orderId, status: order.status } });
});

// Admin - Aprobar pedido
export const adminApproveOrder = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const order = await Order.findOne({ orderId: String(req.params.id) });
  if (!order) throw new AppError('Pedido no encontrado', 404, 'not_found');
  if (order.approvalStatus === 'approved') throw new AppError('El pedido ya está aprobado', 400, 'already_approved');

  const wasRejected = order.approvalStatus === 'rejected';
  order.approvalStatus = 'approved';
  order.approvedDate = new Date();
  // Un pedido re-aprobado vuelve a "pendiente" para retomarlo.
  if (wasRejected && order.status === 'cancelled') order.status = 'pending';
  order.rejectionReason = undefined;
  order.history.push({
    date: new Date(),
    status: 'approved',
    description: wasRejected ? 'Pedido aprobado de nuevo por el equipo' : 'Pedido aprobado por el equipo',
    updatedBy: new mongoose.Types.ObjectId(req.user!.id),
  });
  await order.save();
  await notifyOrderChange(order, req, {
    evento: 'order_approved',
    title: `Pedido ${order.orderId} aprobado`,
    message: `Aprobamos tu pedido ${order.orderId} ("${order.name}"). Te mantendremos al tanto de su avance.`,
  });
  res.json({ success: true, message: 'Pedido aprobado exitosamente', data: { id: order.orderId, approvalStatus: 'approved' } });
});

// Admin - Rechazar pedido
export const adminRejectOrder = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 1000) : '';
  if (reason.length < 3) throw new AppError('Escribe el motivo del rechazo.', 400, 'invalid_request', { fields: ['reason'] });
  const order = await Order.findOne({ orderId: String(req.params.id) });
  if (!order) throw new AppError('Pedido no encontrado', 404, 'not_found');
  if (order.approvalStatus === 'rejected') throw new AppError('El pedido ya está rechazado', 400, 'already_rejected');

  order.approvalStatus = 'rejected';
  order.rejectedDate = new Date();
  order.rejectionReason = reason;
  order.status = 'cancelled';
  order.history.push({
    date: new Date(),
    status: 'rejected',
    description: `Pedido rechazado por el equipo: ${reason}`,
    updatedBy: new mongoose.Types.ObjectId(req.user!.id),
  });
  await order.save();
  await notifyOrderChange(order, req, {
    evento: 'order_rejected',
    reason,
    title: `Pedido ${order.orderId} rechazado`,
    message: `No pudimos aceptar tu pedido ${order.orderId} ("${order.name}"). Motivo: ${reason}. Escríbenos por Mensajes si tienes dudas.`,
  });
  res.json({ success: true, message: 'Pedido rechazado', data: { id: order.orderId, approvalStatus: 'rejected', rejectionReason: reason } });
});

/** POST /api/admin/orders/:id/invoice — emite la factura del pedido a nombre del cliente. */
export const adminCreateInvoiceFromOrder = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const body = (req.body ?? {}) as { dueDate?: unknown; taxRate?: unknown; notes?: unknown };
  const view = await issueInvoice(
    {
      orderId: String(req.params.id),
      ...(typeof body.dueDate === 'string' && body.dueDate ? { dueDate: body.dueDate } : {}),
      ...(body.taxRate !== undefined && body.taxRate !== '' ? { taxRate: Math.min(1, Math.max(0, Number(body.taxRate) || 0)) } : {}),
      ...(typeof body.notes === 'string' && body.notes.trim() ? { notes: body.notes.trim().slice(0, 2000) } : {}),
    },
    actorOf(req),
    req,
  );
  res.status(201).json({ success: true, data: view, message: 'Factura emitida desde el pedido' });
});

// ---------------------------------------------------------------------------
//   Facturas y entregables
// ---------------------------------------------------------------------------

export const adminGetInvoices = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const status = queryText(req.query.status);
  const q = queryText(req.query.q);
  const projectId = queryText(req.query.projectId);
  const query: Record<string, unknown> = status && status !== 'all' ? invoiceStatusFilter(status) : {};
  if (projectId && mongoose.Types.ObjectId.isValid(projectId)) query.projectId = projectId;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    const and = (query.$and as unknown[]) ?? [];
    and.push({ $or: [{ invoiceNumber: rx }, { 'clientInfo.name': rx }, { 'clientInfo.email': rx }] });
    query.$and = and;
  }
  const invoices = await Invoice.find(query)
    .populate('userId', 'name email company')
    .populate('projectId', 'name')
    .populate('orderId', 'orderId name')
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
  res.json({ success: true, data: invoices.map((inv) => invoiceView(inv)) });
});

export const adminGetDeliverables = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const status = queryText(req.query.status);
  const projectId = queryText(req.query.projectId);
  if (projectId && !mongoose.Types.ObjectId.isValid(projectId)) throw new AppError('Proyecto no válido', 400, 'invalid_request');
  const query: Record<string, unknown> = {};
  if (status && status !== 'all') query.status = status;
  if (projectId) query.projectId = projectId;
  const list = await Deliverable.find(query)
    .populate('userId', 'name email')
    .populate('projectId', 'name')
    .populate('uploadedBy', 'name')
    .populate('reviewedBy', 'name')
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
  res.json({ success: true, data: list.map(deliverableView) });
});

// ---------------------------------------------------------------------------
//   Conversaciones
// ---------------------------------------------------------------------------

export const adminGetConversations = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const status = queryText(req.query.status);
  const q = queryText(req.query.q);
  const query: Record<string, unknown> = {};
  if (status && status !== 'all') query.status = status;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    query.$or = [{ title: rx }, { conversationId: rx }, { 'participants.name': rx }, { 'participants.email': rx }];
  }
  const conversations = await Conversation.find(query)
    .populate('projectId', 'name')
    .populate('orderId', 'name orderId')
    .sort({ updatedAt: -1 })
    .limit(300)
    .lean();

  // Con lean() el Map de no leídos llega como objeto plano (unreadFor lee ambos).
  const data = conversations.map((conv: any) => ({
    id: conv.conversationId,
    title: conv.title,
    projectId: conv.projectId?._id ?? null,
    projectName: conv.projectId?.name ?? null,
    orderId: conv.orderId?.orderId ?? null,
    orderName: conv.orderId?.name ?? null,
    participants: (conv.participants ?? []).map((p: any) => ({ name: p.name, email: p.email, role: p.role })),
    client: (conv.participants ?? []).find((p: any) => p.role === 'client') ?? null,
    lastMessage: conv.lastMessage?.text || '',
    lastMessageTime: conv.lastMessage?.timestamp || conv.updatedAt,
    // Mensajes del cliente que el equipo aún no lee.
    teamUnread: unreadFor(conv.unreadCount, TEAM_UNREAD_KEY),
    status: conv.status,
    createdAt: conv.createdAt,
  }));
  res.json({ success: true, data });
});

async function loadConversationOr404(id: string) {
  const conversation = await Conversation.findOne({ conversationId: String(id) });
  if (!conversation) throw new AppError('Conversación no encontrada', 404, 'not_found');
  return conversation;
}

// Admin - detalle de una conversación (al abrirla, el equipo la marca como leída)
export const adminGetConversationDetails = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const found = await loadConversationOr404(String(req.params.id));
  await markReadForTeam(found._id as mongoose.Types.ObjectId, req.user!.id);
  const conversation = await Conversation.findById(found._id).populate('projectId', 'name').populate('orderId', 'orderId name').lean();
  if (!conversation) throw new AppError('Conversación no encontrada', 404, 'not_found');
  const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).limit(1000).lean();
  const staffId = String(req.user!.id);
  res.json({
    success: true,
    data: {
      conversation: {
        id: conversation.conversationId,
        title: conversation.title,
        projectName: (conversation.projectId as any)?.name ?? null,
        orderId: (conversation.orderId as any)?.orderId ?? null,
        participants: conversation.participants.map((p: any) => ({ name: p.name, email: p.email, role: p.role })),
        unread: unreadValues(conversation.unreadCount),
        status: conversation.status,
        createdAt: conversation.createdAt,
      },
      messages: messages.map((msg: any) => ({
        id: msg.messageId,
        senderId: msg.sender ? String(msg.sender) : null,
        senderName: msg.senderName,
        senderRole: msg.senderRole,
        content: msg.content,
        type: msg.type,
        timestamp: msg.createdAt,
        isOwnMessage: !!msg.sender && String(msg.sender) === staffId,
        // ¿Lo leyó alguien distinto de quien lo envió?
        readByOthers: (msg.readBy ?? []).some((r: any) => String(r.userId) !== String(msg.sender)),
      })),
    },
  });
});

/** POST /api/admin/conversations/:id/messages { content } — el equipo responde al cliente. */
export const adminReplyConversation = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const conversation = await loadConversationOr404(String(req.params.id));
  const message = await postStaffMessage(conversation, actorOf(req), req.body?.content);
  res.status(201).json({
    success: true,
    message: 'Mensaje enviado',
    data: {
      id: message.messageId,
      senderName: message.senderName,
      senderRole: message.senderRole,
      content: message.content,
      timestamp: message.createdAt,
      isOwnMessage: true,
    },
  });
});

/** PATCH /api/admin/conversations/:id/status { status } — activa, archivada o cerrada. */
export const adminUpdateConversationStatus = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const status = req.body?.status;
  if (typeof status !== 'string' || !CONVERSATION_STATUSES.includes(status)) {
    throw new AppError('Estado no válido', 400, 'invalid_request', { validStatuses: CONVERSATION_STATUSES });
  }
  const conversation = await loadConversationOr404(String(req.params.id));
  conversation.status = status as 'active' | 'archived' | 'closed';
  await conversation.save();
  res.json({ success: true, message: 'Conversación actualizada', data: { id: conversation.conversationId, status } });
});

// ---------------------------------------------------------------------------
//   Usuarios
// ---------------------------------------------------------------------------

export const adminGetUsers = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const role = queryText(req.query.role);
  const search = queryText(req.query.search);
  const query: Record<string, unknown> = {};
  if (role && role !== 'all') query.role = role;
  if (search) {
    // Búsqueda literal (sin operadores de expresión regular del usuario).
    const pattern = escapeRegex(search);
    query.$or = [
      { name: { $regex: pattern, $options: 'i' } },
      { email: { $regex: pattern, $options: 'i' } },
      { company: { $regex: pattern, $options: 'i' } },
    ];
  }
  const users = await User.find(query).select('-password').sort({ created_at: -1 }).limit(1000).lean();
  const data = users.map((user: any) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    provider: user.provider,
    accountStatus: user.accountStatus ?? 'activo',
    company: user.company ?? null,
    phone: user.phone ?? null,
    avatar: user.avatar,
    lastLogin: user.last_login,
    createdAt: user.created_at,
  }));
  res.json({ success: true, data });
});

// Admin - Update user role
export const adminUpdateUserRole = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { role } = (req.body ?? {}) as { role?: unknown };

  // Roles válidos = los del esquema de User (si se agregan roles, se aceptan solos).
  const validRoles: string[] = ((User.schema.path('role') as any)?.enumValues as string[]) ?? [];
  if (typeof role !== 'string' || !validRoles.includes(role)) {
    res.status(400).json({ success: false, message: 'Rol inválido', validRoles });
    return;
  }
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Usuario no encontrado', 404, 'not_found');

  // Un admin no puede quitarse a sí mismo el rol (evita quedarse sin administradores).
  if (req.user?.id === id && role !== 'admin') {
    throw new AppError('No puedes quitarte tu propio rol de administrador', 400, 'self_demotion');
  }

  const previous = await User.findById(id).select('role').lean();
  const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
  if (!user) throw new AppError('Usuario no encontrado', 404, 'not_found');

  await recordAudit({
    actor: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
    accion: 'user.role_change',
    entidad: { tipo: 'User', id: String(user._id) },
    detalle: { email: user.email, antes: previous?.role ?? null, despues: user.role },
    req,
  });

  res.json({
    success: true,
    message: 'Rol actualizado exitosamente',
    data: { id: user._id, email: user.email, role: user.role },
  });
});

/**
 * POST /api/admin/users/:id/reset-link (solo admin) — genera un enlace de
 * restablecimiento de contraseña (1 hora, un solo uso; anula los anteriores)
 * para que el equipo lo comparta por WhatsApp o lo copie cuando el servidor no
 * tiene correo. No envía nada: solo devuelve el enlace. Queda en la bitácora
 * sin el enlace.
 */
export const adminCreateResetLink = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Usuario no encontrado', 404, 'not_found');
  const user = await User.findById(id).select('email name phone provider accountStatus');
  if (!user) throw new AppError('Usuario no encontrado', 404, 'not_found');
  if (user.provider !== 'local') {
    throw new AppError('Esta cuenta entra con Google: no tiene contraseña de KopTup para restablecer.', 409, 'not_local_account');
  }
  const link = await issueMagicLink({ userId: user._id as mongoose.Types.ObjectId, proposito: 'reset', creadoPor: req.user!.id });
  await recordAudit({
    actor: { id: req.user!.id, email: req.user!.email, role: req.user!.role },
    accion: 'user.reset_link',
    entidad: { tipo: 'User', id: String(user._id) },
    detalle: { email: user.email, venceEn: link.expiresAt },
    req,
  });
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    success: true,
    message: 'Enlace generado. Compártelo solo con la persona dueña de la cuenta.',
    data: {
      user: { id: String(user._id), email: user.email, name: user.name, phone: user.phone ?? null, accountStatus: user.accountStatus ?? 'activo' },
      resetUrl: link.url,
      expiresAt: link.expiresAt,
    },
  });
});

// ---------------------------------------------------------------------------
//   Contactos
// ---------------------------------------------------------------------------

export const adminGetContacts = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const status = queryText(req.query.status);
  const source = queryText(req.query.source, 40);
  const q = queryText(req.query.q);
  const query: Record<string, unknown> = {};
  if (status === 'discarded') query.descartado = { $ne: null };
  else {
    // Los descartados (spam) no aparecen ni cuentan como nuevos.
    query.$or = [{ descartado: null }, { descartado: { $exists: false } }];
    if (status && status !== 'all') query.status = status;
  }
  if (source && source !== 'all') {
    query.source = source === 'contact-form' ? { $in: ['contact-form', null] } : source;
  }
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    query.$and = [{ $or: [{ name: rx }, { email: rx }, { company: rx }, { phone: rx }, { service: rx }] }];
  }

  const contacts = await Contact.find(query).sort({ created_at: -1 }).limit(500).lean();
  // Solicitud de demo de origen (para enlazarla desde el detalle).
  const demoRequests = await DemoRequest.find({ lead: { $in: contacts.filter((c) => c.source === 'demo-request').map((c) => c._id) } })
    .select('lead codigo estado')
    .lean();

  const data = contacts.map((contact: any) => {
    const request = demoRequests.find((r) => String(r.lead) === String(contact._id));
    return {
      id: contact._id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      service: contact.service,
      budget: contact.budget,
      // Cuándo quiere empezar y qué plan/nivel/modalidad cotizaba (formulario de /contact).
      plazo: contact.plazo ?? null,
      cotizacion: contact.cotizacion ?? null,
      message: contact.message,
      status: contact.status,
      // Origen del lead: 'contact-form' (también los antiguos, sin el campo), 'demo-request' o 'demo-rag'.
      source: contact.source ?? 'contact-form',
      demoRequest: request ? { id: String(request._id), codigo: request.codigo, estado: request.estado } : null,
      descartado: contact.descartado ?? null,
      // Prueba de la autorización de datos (Ley 1581), sin el hash de la IP.
      consentimiento: contact.consentimiento
        ? {
            aceptado: contact.consentimiento.aceptado === true,
            fecha: contact.consentimiento.fecha ?? null,
            versionPolitica: contact.consentimiento.versionPolitica ?? null,
          }
        : null,
      anonimizado: !!contact.anonimizadoEn,
      createdAt: contact.created_at,
    };
  });

  res.json({ success: true, data });
});

// Admin - Update contact status
export const adminUpdateContactStatus = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = (req.body ?? {}) as { status?: unknown };
  if (typeof status !== 'string' || !CONTACT_STATUSES.includes(status)) {
    res.status(400).json({ success: false, message: 'Estado requerido', validStatuses: CONTACT_STATUSES });
    return;
  }
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Contacto no encontrado', 404, 'not_found');
  const contact = await Contact.findByIdAndUpdate(id, { status }, { new: true });
  if (!contact) throw new AppError('Contacto no encontrado', 404, 'not_found');
  res.json({ success: true, message: 'Estado actualizado exitosamente', data: { id: contact._id, status: contact.status } });
});
