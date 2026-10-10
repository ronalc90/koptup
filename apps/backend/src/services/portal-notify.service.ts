/**
 * portal-notify.service.ts — avisos al CLIENTE por eventos reales del portal:
 * cambio de estado de su pedido, factura emitida o pago registrado,
 * entregable nuevo, mensaje del equipo y proyecto creado o actualizado.
 *
 * - Siempre crea la notificación del portal (la campana de /dashboard).
 * - Además envía un correo si el servidor tiene correo configurado y la
 *   persona no lo desactivó para esa categoría (Portal › Configuración,
 *   `User.notificationPrefs`). El correo sale en segundo plano: nunca demora
 *   ni hace fallar la acción del equipo.
 *
 * La notificación guarda el texto en español (respaldo) y, en
 * `metadata.evento` y `metadata.params`, la clave para que la web la muestre
 * en el idioma de la persona.
 */
import mongoose from 'mongoose';
import Notification from '../models/Notification';
import User, { resolveNotificationPreferences, type NotificationEmailCategory } from '../models/User';
import { emailService } from './email.service';
import { emailLayout } from './demo-emails.service';
import { frontendUrl } from '../config/demos';
import { escapeHtml, safeHref, safeSubject } from '../utils/html';
import { logger } from '../utils/logger';

export type PortalNotificationType = 'order' | 'billing' | 'deliverable' | 'message' | 'project';

const CATEGORY_BY_TYPE: Record<PortalNotificationType, NotificationEmailCategory> = {
  order: 'pedidos',
  billing: 'facturacion',
  deliverable: 'proyectos',
  project: 'proyectos',
  message: 'mensajes',
};

export interface ClientNotice {
  userId: string | mongoose.Types.ObjectId;
  type: PortalNotificationType;
  /** Clave del evento (la web la traduce: `portalNotifications.<evento>`). */
  evento: string;
  /** Valores del texto (número de pedido, estado, título…). */
  params?: Record<string, string | number>;
  /** Título y mensaje en español (respaldo y correo). */
  title: string;
  message: string;
  /** Ruta del portal a la que lleva la notificación (`/dashboard/...`). */
  actionUrl: string;
  metadata?: Record<string, unknown>;
}

export interface ClientNoticeResult {
  notificationId: string | null;
  /** Promesa del correo (true si salió). Solo para pruebas; nadie la espera en una petición. */
  email: Promise<boolean>;
}

/** ¿La persona quiere el correo de esta categoría? (por defecto sí). */
export async function wantsEmail(userId: string | mongoose.Types.ObjectId, type: PortalNotificationType): Promise<{ to: string; name: string } | null> {
  if (!mongoose.Types.ObjectId.isValid(String(userId))) return null;
  const user = await User.findById(userId).select('email name notificationPrefs').lean();
  if (!user?.email) return null;
  const prefs = resolveNotificationPreferences(user.notificationPrefs);
  return prefs.email[CATEGORY_BY_TYPE[type]] ? { to: user.email, name: user.name } : null;
}

async function sendNoticeEmail(notice: ClientNotice): Promise<boolean> {
  if (!emailService.isConfigured()) return false;
  const recipient = await wantsEmail(notice.userId, notice.type);
  if (!recipient) return false;
  const link = `${frontendUrl()}${notice.actionUrl}`;
  const firstName = (recipient.name || '').split(' ')[0];
  const html = emailLayout(
    notice.title,
    `      <p>Hola${firstName ? ` ${escapeHtml(firstName)}` : ''},</p>
      <p>${escapeHtml(notice.message)}</p>
      <p><a class="button" href="${safeHref(link)}">Ver en tu portal</a></p>
      <p class="muted">Puedes elegir qué avisos recibir por correo en Configuración de tu portal.</p>`,
  );
  const text = [`Hola${firstName ? ` ${firstName}` : ''},`, '', notice.message, '', `Ver en tu portal: ${link}`].join('\n');
  return emailService.sendMail({ to: recipient.to, subject: safeSubject(`${notice.title} - KopTup`), html, text });
}

/**
 * Crea la notificación del portal y dispara el correo (si aplica) sin
 * esperarlo. Nunca lanza: un aviso que falla queda en el log.
 */
export async function notifyClient(notice: ClientNotice): Promise<ClientNoticeResult> {
  let notificationId: string | null = null;
  try {
    if (mongoose.Types.ObjectId.isValid(String(notice.userId))) {
      const doc = await Notification.create({
        userId: String(notice.userId),
        type: notice.type,
        title: notice.title.slice(0, 200),
        message: notice.message.slice(0, 1000),
        actionUrl: notice.actionUrl,
        isRead: false,
        metadata: { ...(notice.metadata ?? {}), evento: notice.evento, params: notice.params ?? {} },
      });
      notificationId = String(doc._id);
    }
  } catch (err) {
    logger.warn(`[portal-notify] No se pudo crear la notificación ${notice.evento}: ${(err as Error)?.message ?? err}`);
  }
  const email = sendNoticeEmail(notice).catch((err) => {
    logger.warn(`[portal-notify] Correo ${notice.evento}: ${(err as Error)?.message ?? err}`);
    return false;
  });
  return { notificationId, email };
}

// ---------------------------------------------------------------------------
//   Textos de cada evento (español; la web los traduce con `evento`)
// ---------------------------------------------------------------------------

/** Nombre del estado de un pedido como lo ve el cliente. */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En proceso',
  shipped: 'Enviado',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  planning: 'Planeación',
  active: 'Activo',
  on_hold: 'En espera',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: currency === 'COP' ? 0 : 2 }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}
