/**
 * Mensajes del portal (cliente ↔ equipo de KopTup). La lógica de las
 * conversaciones (no leídos, avisos) está en services/conversations.service.ts.
 *
 *  - GET  /api/messages/conversations            las conversaciones de la cuenta
 *  - GET  /api/messages/conversations/:id        detalle con mensajes (participante)
 *  - POST /api/messages/conversations            equipo: abrir una conversación con un cliente
 *  - POST /api/messages/conversations/support    cliente: escribirle al equipo (asunto y mensaje)
 *  - POST /api/messages/conversations/:id/read   participante: marcar como leída
 *  - POST /api/messages/send                     participante: enviar un mensaje
 */
import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import User from '../models/User';
// Registra los modelos que usa populate().
import '../models/Project';
import '../models/Order';
import { createClientConversation, postClientMessage, postStaffMessage, unreadFor } from '../services/conversations.service';
import { isStaffRole } from '../middleware/access';

function participantId(p: { userId?: unknown }): string {
  const ref = p.userId as { _id?: unknown } | undefined;
  return String(ref && typeof ref === 'object' && '_id' in ref ? ref._id : ref);
}

// Obtener todas las conversaciones del usuario
export const getConversations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = String(req.user!.id);
  const { unreadOnly } = req.query;

  const conversations = await Conversation.find({ 'participants.userId': userId, status: { $ne: 'closed' } })
    .populate('projectId', 'name')
    .populate('orderId', 'name orderId')
    .sort({ updatedAt: -1 })
    .limit(200)
    .lean();

  // Con lean() el Map de no leídos llega como objeto plano: unreadFor lee ambos.
  const formatted = conversations.map((conv: any) => ({
    id: conv.conversationId,
    title: conv.title,
    projectName: conv.projectId?.name ?? null,
    orderId: conv.orderId?.orderId ?? null,
    lastMessage: conv.lastMessage?.text || '',
    lastMessageTime: conv.lastMessage?.timestamp || conv.updatedAt,
    unreadCount: unreadFor(conv.unreadCount, userId),
    participants: (conv.participants ?? []).map((p: any) => p.name),
    status: conv.status,
  }));

  res.json({ success: true, data: unreadOnly === 'true' ? formatted.filter((c) => c.unreadCount > 0) : formatted });
});

// Obtener conversación por ID con sus mensajes
export const getConversationById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = String(req.user!.id);
  const conversation = await Conversation.findOne({ conversationId: String(req.params.id) })
    .populate('projectId', 'name description')
    .populate('orderId', 'name orderId')
    .lean();
  if (!conversation) throw new AppError('Conversación no encontrada', 404, 'not_found');

  const isParticipant = conversation.participants.some((p: any) => participantId(p) === userId);
  if (!isParticipant) throw new AppError('No tienes acceso a esta conversación', 403, 'forbidden');

  const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).limit(1000).lean();
  const formattedMessages = messages.map((msg: any) => ({
    id: msg.messageId,
    senderId: msg.sender ? String(msg.sender) : null,
    senderName: msg.senderName,
    senderRole: msg.senderRole,
    content: msg.content,
    type: msg.type,
    timestamp: msg.createdAt,
    isOwnMessage: !!msg.sender && String(msg.sender) === userId,
    status: (msg.readBy ?? []).some((r: any) => String(r.userId) !== String(msg.sender)) ? 'read' : 'sent',
  }));

  res.json({
    success: true,
    data: {
      conversation: {
        id: conversation.conversationId,
        title: conversation.title,
        status: conversation.status,
        projectName: (conversation.projectId as any)?.name ?? null,
        orderId: (conversation.orderId as any)?.orderId ?? null,
        participants: conversation.participants.map((p: any) => ({ name: p.name, role: p.role })),
      },
      messages: formattedMessages,
    },
  });
});

// Enviar mensaje (participante)
export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { conversationId, content } = (req.body ?? {}) as { conversationId?: unknown; content?: unknown };
  if (typeof conversationId !== 'string' || !conversationId) {
    throw new AppError('Falta la conversación.', 400, 'invalid_request', { fields: ['conversationId'] });
  }
  const conversation = await Conversation.findOne({ conversationId });
  if (!conversation) throw new AppError('Conversación no encontrada', 404, 'not_found');
  const participant = conversation.participants.find((p) => String(p.userId) === String(user.id));
  if (!participant) throw new AppError('No eres participante de esta conversación', 403, 'forbidden');

  const fresh = await User.findById(user.id).select('name email role').lean();
  const sender = { id: String(user.id), name: fresh?.name || user.name, email: fresh?.email || user.email };
  // Un miembro del equipo que participa responde como equipo (avisa al cliente).
  const message =
    participant.role !== 'client' && fresh && isStaffRole(fresh.role)
      ? await postStaffMessage(conversation, { id: sender.id, name: sender.name, email: sender.email, role: fresh.role }, content as string)
      : await postClientMessage(conversation, sender, content as string);

  res.status(201).json({
    success: true,
    data: {
      id: message.messageId,
      senderId: String(user.id),
      senderName: message.senderName,
      senderRole: message.senderRole,
      content: message.content,
      timestamp: message.createdAt,
      isOwnMessage: true,
      status: 'sent',
    },
    message: 'Mensaje enviado exitosamente',
  });
});

// Marcar conversación como leída
export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = String(req.user!.id);
  const conversation = await Conversation.findOne({ conversationId: String(req.params.id) });
  if (!conversation) throw new AppError('Conversación no encontrada', 404, 'not_found');
  const isParticipant = conversation.participants.some((p) => String(p.userId) === userId);
  if (!isParticipant) throw new AppError('No tienes acceso a esta conversación', 403, 'forbidden');

  await Conversation.updateOne({ _id: conversation._id }, { $set: { [`unreadCount.${userId}`]: 0 } }, { timestamps: false });
  await Message.updateMany(
    { conversationId: conversation._id, 'readBy.userId': { $ne: new mongoose.Types.ObjectId(userId) } },
    { $push: { readBy: { userId: new mongoose.Types.ObjectId(userId), readAt: new Date() } } },
  );
  res.json({ success: true, message: 'Conversación marcada como leída' });
});

// Crear nueva conversación (solo staff: la ruta exige requireStaff, con el rol
// vigente leído de la BD). Admite un primer mensaje.
export const createConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { title, projectId, orderId, clientId, message } = (req.body ?? {}) as Record<string, unknown>;
  if (typeof title !== 'string' || !title.trim() || title.length > 200) {
    throw new AppError('Escribe el asunto de la conversación (máximo 200 caracteres).', 400, 'invalid_request', { fields: ['title'] });
  }
  if (typeof clientId !== 'string' || !mongoose.Types.ObjectId.isValid(clientId)) {
    throw new AppError('Elige el cliente de la conversación.', 400, 'invalid_request', { fields: ['clientId'] });
  }
  const client = await User.findById(clientId).select('role').lean();
  if (!client) throw new AppError('Cliente no encontrado', 404, 'client_not_found');
  if (isStaffRole(client.role) || client.role === 'developer') {
    throw new AppError('Esa cuenta es del equipo: elige la cuenta del cliente.', 400, 'client_is_staff');
  }
  const conversation = await createClientConversation({
    title,
    clientId,
    createdBy: user.id,
    projectId: typeof projectId === 'string' && mongoose.Types.ObjectId.isValid(projectId) ? projectId : null,
    orderId: typeof orderId === 'string' && mongoose.Types.ObjectId.isValid(orderId) ? orderId : null,
    staff: { id: user.id, email: user.email, role: user.role, name: user.name },
    firstMessage: typeof message === 'string' && message.trim() ? { from: 'staff', content: message } : null,
  });
  res.status(201).json({
    success: true,
    data: { id: conversation.conversationId, title: conversation.title },
    message: 'Conversación creada exitosamente',
  });
});

/** Conversaciones que un cliente puede abrir por día (evita abusos). */
const MAX_CLIENT_CONVERSATIONS_PER_DAY = 5;

/**
 * POST /api/messages/conversations/support (cliente) — `title` y `message`.
 * Abre una conversación del cliente con el equipo; el equipo la ve en
 * Admin › Conversaciones como no leída y recibe el aviso (correo/WhatsApp si
 * están configurados).
 */
export const openSupportConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { title, message, projectId, orderId } = (req.body ?? {}) as Record<string, unknown>;
  if (typeof title !== 'string' || !title.trim() || title.length > 200) {
    throw new AppError('Escribe el asunto (máximo 200 caracteres).', 400, 'invalid_request', { fields: ['title'] });
  }
  if (typeof message !== 'string' || !message.trim()) {
    throw new AppError('Escribe tu mensaje.', 400, 'invalid_request', { fields: ['message'] });
  }
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await Conversation.countDocuments({ createdBy: user.id, createdAt: { $gte: since } });
  if (recent >= MAX_CLIENT_CONVERSATIONS_PER_DAY) {
    throw new AppError('Ya abriste varias conversaciones hoy: escribe en una de las que tienes abiertas.', 429, 'too_many_conversations');
  }
  // Pedido o proyecto opcionales, solo si son del mismo cliente.
  let linkedProject: mongoose.Types.ObjectId | null = null;
  if (typeof projectId === 'string' && mongoose.Types.ObjectId.isValid(projectId)) {
    const project = await mongoose.model('Project').findOne({ _id: projectId, client_id: user.id }).select('_id').lean<{ _id: mongoose.Types.ObjectId }>();
    linkedProject = project?._id ?? null;
  }
  let linkedOrder: mongoose.Types.ObjectId | null = null;
  if (typeof orderId === 'string' && orderId.trim()) {
    const order = await mongoose.model('Order').findOne({ orderId: orderId.trim(), userId: user.id }).select('_id').lean<{ _id: mongoose.Types.ObjectId }>();
    linkedOrder = order?._id ?? null;
  }
  const conversation = await createClientConversation({
    title,
    clientId: user.id,
    createdBy: user.id,
    projectId: linkedProject,
    orderId: linkedOrder,
  });
  await postClientMessage(conversation, { id: String(user.id), name: user.name, email: user.email }, message);
  res.status(201).json({
    success: true,
    data: { id: conversation.conversationId, title: conversation.title },
    message: 'Mensaje enviado al equipo',
  });
});
