/**
 * conversations.service.ts — conversaciones del portal entre el cliente y el
 * equipo de KopTup (Mensajes del portal y Admin › Conversaciones).
 *
 * - Una conversación tiene como participante al cliente; los miembros del
 *   equipo se agregan solos la primera vez que responden (el panel ve todas
 *   las conversaciones, aunque no participe).
 * - `unreadCount` guarda los no leídos por persona (clave = id de la cuenta)
 *   y los del equipo en conjunto (clave `team`).
 * - Se crean solas: con cada pedido (pedido → conversación) y con cada
 *   proyecto creado desde el panel; el equipo también puede abrir una desde
 *   Admin › Conversaciones.
 * - Avisos: un mensaje del equipo notifica al cliente (portal y, si quiere,
 *   correo); un mensaje del cliente avisa al equipo (correo y WhatsApp si
 *   están configurados). Solo se avisa cuando la conversación pasa de 0 a 1
 *   mensaje sin leer, para no repetir un aviso por cada mensaje.
 */
import mongoose from 'mongoose';
import Conversation, { type IConversation } from '../models/Conversation';
import Message from '../models/Message';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { notifyClient } from './portal-notify.service';
import { notifyTeamInBackground } from './team-notify.service';
import { frontendUrl } from '../config/demos';
import { logger } from '../utils/logger';

export const TEAM_UNREAD_KEY = 'team';
const MAX_MESSAGE_LENGTH = 5000;
const MAX_TITLE_LENGTH = 200;

export interface StaffActor {
  id: string;
  email: string;
  role: string;
  name?: string;
}

type ObjectIdLike = string | mongoose.Types.ObjectId;

function oid(id: ObjectIdLike): mongoose.Types.ObjectId {
  return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
}

/** Rol dentro de la conversación: `admin` para el admin, `support` para el resto del equipo. */
function staffParticipantRole(role: string): 'admin' | 'support' {
  return role === 'admin' ? 'admin' : 'support';
}

/** Lee el contador de no leídos de un documento o de un objeto `lean()` (Map o plano). */
export function unreadFor(unread: unknown, key: string): number {
  if (!unread) return 0;
  if (unread instanceof Map) return Number(unread.get(key) ?? 0);
  return Number((unread as Record<string, unknown>)[key] ?? 0);
}

/** Suma de no leídos de las cuentas indicadas o, sin lista, de todas las claves. */
export function unreadValues(unread: unknown): Record<string, number> {
  if (!unread) return {};
  const entries = unread instanceof Map ? [...unread.entries()] : Object.entries(unread as Record<string, unknown>);
  const out: Record<string, number> = {};
  for (const [k, v] of entries) out[k] = Number(v ?? 0);
  return out;
}

export function cleanMessage(content: unknown): string {
  if (typeof content !== 'string') throw new AppError('Escribe el mensaje.', 400, 'invalid_message', { fields: ['content'] });
  const text = content.trim();
  if (!text) throw new AppError('Escribe el mensaje.', 400, 'invalid_message', { fields: ['content'] });
  if (text.length > MAX_MESSAGE_LENGTH) {
    throw new AppError(`El mensaje puede tener máximo ${MAX_MESSAGE_LENGTH} caracteres.`, 400, 'invalid_message', { fields: ['content'] });
  }
  return text;
}

/** Crea una conversación con el cliente como participante (y un primer mensaje opcional). */
export async function createClientConversation(args: {
  title: string;
  clientId: ObjectIdLike;
  createdBy: ObjectIdLike;
  orderId?: ObjectIdLike | null;
  projectId?: ObjectIdLike | null;
  staff?: StaffActor | null;
  firstMessage?: { from: 'client' | 'staff' | 'system'; content: string } | null;
}): Promise<IConversation> {
  const client = await User.findById(args.clientId).select('name email').lean();
  if (!client) throw new AppError('No encontramos la cuenta del cliente.', 404, 'client_not_found');
  const participants: Array<Record<string, unknown>> = [
    { userId: client._id, role: 'client', name: client.name || client.email, email: client.email, joinedAt: new Date() },
  ];
  if (args.staff && String(args.staff.id) !== String(client._id)) {
    participants.push({
      userId: oid(args.staff.id),
      role: staffParticipantRole(args.staff.role),
      name: args.staff.name || args.staff.email,
      email: args.staff.email,
      joinedAt: new Date(),
    });
  }
  const conversation = await Conversation.create({
    title: args.title.trim().slice(0, MAX_TITLE_LENGTH),
    orderId: args.orderId ? oid(args.orderId) : undefined,
    projectId: args.projectId ? oid(args.projectId) : undefined,
    participants,
    status: 'active',
    createdBy: oid(args.createdBy),
    unreadCount: new Map(),
  });

  if (args.firstMessage) {
    if (args.firstMessage.from === 'client') {
      await postClientMessage(conversation, { id: String(client._id), name: client.name || client.email, email: client.email }, args.firstMessage.content, {
        notifyTeam: false,
      });
    } else if (args.staff) {
      await postStaffMessage(conversation, args.staff, args.firstMessage.content, {
        type: args.firstMessage.from === 'system' ? 'system' : 'text',
        notify: args.firstMessage.from !== 'system',
      });
    }
  }
  return conversation;
}

/** Agrega al miembro del equipo como participante si aún no lo es. */
function ensureStaffParticipant(conversation: IConversation, staff: StaffActor): 'admin' | 'support' {
  const existing = conversation.participants.find((p) => String(p.userId) === String(staff.id));
  if (existing) return existing.role === 'client' ? 'support' : existing.role;
  const role = staffParticipantRole(staff.role);
  conversation.participants.push({
    userId: oid(staff.id),
    role,
    name: staff.name || staff.email,
    email: staff.email,
    joinedAt: new Date(),
  } as IConversation['participants'][number]);
  return role;
}

function clientParticipants(conversation: IConversation) {
  return conversation.participants.filter((p) => p.role === 'client');
}

/**
 * Mensaje del equipo (desde el panel o un aviso automático). Suma no leídos a
 * los clientes de la conversación y les avisa si estaban al día.
 */
export async function postStaffMessage(
  conversation: IConversation,
  staff: StaffActor,
  rawContent: string,
  opts: { type?: 'text' | 'system'; notify?: boolean } = {},
) {
  const content = cleanMessage(rawContent);
  const senderRole = ensureStaffParticipant(conversation, staff);
  const senderName = opts.type === 'system' ? 'Equipo KopTup' : staff.name || staff.email;
  const message = await Message.create({
    conversationId: conversation._id,
    sender: oid(staff.id),
    senderName,
    senderRole,
    content,
    type: opts.type ?? 'text',
    readBy: [{ userId: oid(staff.id), readAt: new Date() }],
  });

  const now = new Date();
  conversation.lastMessage = { text: content.slice(0, 500), sender: oid(staff.id), senderName, timestamp: now };
  const toNotify: string[] = [];
  for (const p of clientParticipants(conversation)) {
    const key = String(p.userId);
    const before = unreadFor(conversation.unreadCount, key);
    conversation.unreadCount.set(key, before + 1);
    if (before === 0) toNotify.push(key);
  }
  // El equipo ya leyó lo que acaba de escribir.
  conversation.unreadCount.set(TEAM_UNREAD_KEY, 0);
  if (conversation.status === 'closed') conversation.status = 'active';
  conversation.markModified('unreadCount');
  await conversation.save();

  if (opts.notify !== false) {
    for (const userId of toNotify) {
      await notifyClient({
        userId,
        type: 'message',
        evento: 'message_new',
        params: { title: conversation.title },
        title: 'Tienes un mensaje nuevo de KopTup',
        message: `El equipo de KopTup te escribió en "${conversation.title}".`,
        actionUrl: `/dashboard/messages?c=${encodeURIComponent(conversation.conversationId)}`,
        metadata: { conversationId: conversation.conversationId },
      });
    }
  }
  return message;
}

/**
 * Mensaje del cliente (o de un participante del equipo desde el portal). Suma
 * no leídos a los demás participantes y al equipo, y avisa al equipo si la
 * conversación estaba al día.
 */
export async function postClientMessage(
  conversation: IConversation,
  sender: { id: string; name?: string; email: string },
  rawContent: string,
  opts: { notifyTeam?: boolean } = {},
) {
  const content = cleanMessage(rawContent);
  const participant = conversation.participants.find((p) => String(p.userId) === String(sender.id));
  if (!participant) throw new AppError('No participas en esta conversación.', 403, 'forbidden');
  const senderName = sender.name || sender.email;
  const message = await Message.create({
    conversationId: conversation._id,
    sender: oid(sender.id),
    senderName,
    senderRole: participant.role,
    content,
    type: 'text',
    readBy: [{ userId: oid(sender.id), readAt: new Date() }],
  });

  conversation.lastMessage = { text: content.slice(0, 500), sender: oid(sender.id), senderName, timestamp: new Date() };
  for (const p of conversation.participants) {
    const key = String(p.userId);
    if (key === String(sender.id)) continue;
    conversation.unreadCount.set(key, unreadFor(conversation.unreadCount, key) + 1);
  }
  let teamBefore = 0;
  if (participant.role === 'client') {
    teamBefore = unreadFor(conversation.unreadCount, TEAM_UNREAD_KEY);
    conversation.unreadCount.set(TEAM_UNREAD_KEY, teamBefore + 1);
  }
  if (conversation.status === 'closed') conversation.status = 'active';
  conversation.markModified('unreadCount');
  await conversation.save();

  if (participant.role === 'client' && teamBefore === 0 && opts.notifyTeam !== false) {
    notifyTeamInBackground({
      asunto: `Nuevo mensaje de ${senderName}`,
      lineas: [`Conversación: ${conversation.title} (${conversation.conversationId})`, '', content.slice(0, 600)],
      enlace: `${frontendUrl()}/admin/conversations/${conversation.conversationId}`,
    });
  }
  return message;
}

/** El equipo abrió la conversación en el panel: sus no leídos vuelven a 0. */
export async function markReadForTeam(conversationId: mongoose.Types.ObjectId, staffId: string): Promise<void> {
  await Conversation.updateOne({ _id: conversationId }, { $set: { [`unreadCount.${TEAM_UNREAD_KEY}`]: 0, [`unreadCount.${staffId}`]: 0 } }, { timestamps: false });
  await Message.updateMany(
    { conversationId, 'readBy.userId': { $ne: oid(staffId) } },
    { $push: { readBy: { userId: oid(staffId), readAt: new Date() } } },
  );
}

// ---------------------------------------------------------------------------
//   Pedidos
// ---------------------------------------------------------------------------

/**
 * Conversación automática de un pedido nuevo: el cliente aparece como autor
 * del primer mensaje con el resumen del pedido.
 */
export async function createOrderConversation(order: {
  _id: mongoose.Types.ObjectId;
  orderId: string;
  name: string;
  userId: mongoose.Types.ObjectId;
  amount: number;
  currency?: string;
  items: Array<{ name: string; quantity: number; price: number }>;
}): Promise<IConversation> {
  const currency = order.currency || 'USD';
  const itemsList = order.items.map((item) => `- ${item.name} (x${item.quantity}): ${(item.price * item.quantity).toFixed(2)} ${currency}`).join('\n');
  return createClientConversation({
    title: `Pedido ${order.orderId}: ${order.name}`,
    clientId: order.userId,
    createdBy: order.userId,
    orderId: order._id,
    firstMessage: {
      from: 'client',
      content: `Creé el pedido ${order.orderId}.\n\nÍtems:\n${itemsList}\n\nTotal estimado: ${order.amount.toFixed(2)} ${currency}`,
    },
  });
}

/** Mensaje automático en la conversación del pedido cuando el equipo lo aprueba, rechaza o cambia de estado. */
export async function sendOrderStatusMessage(
  conversationId: mongoose.Types.ObjectId,
  staff: StaffActor,
  content: string,
): Promise<void> {
  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return;
    // El cliente ya recibe la notificación del cambio de estado: el mensaje no avisa otra vez.
    await postStaffMessage(conversation, staff, content, { type: 'system', notify: false });
  } catch (err) {
    logger.warn(`[conversations] No se pudo dejar el mensaje del pedido: ${(err as Error)?.message ?? err}`);
  }
}
