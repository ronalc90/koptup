/**
 * team-notify.service.ts — avisos internos al equipo por el canal existente
 * del formulario de contacto: email a ADMIN_EMAIL (y al responsable, si se
 * indica) y WhatsApp al número del equipo, cada uno solo si está
 * configurado. Nunca lanza: devuelve qué se envió de verdad.
 */
import { emailService } from './email.service';
import { whatsappService } from './whatsapp.service';
import { emailLayout } from './demo-emails.service';
import { escapeHtml } from '../utils/email-address';
import { logger } from '../utils/logger';

export interface TeamNotice {
  /** Asunto del correo y primera línea del WhatsApp. */
  asunto: string;
  /** Líneas del mensaje (texto plano; se escapan en el HTML). */
  lineas: string[];
  /** Enlace al panel (opcional). */
  enlace?: string;
  /** Emails adicionales (p. ej. el responsable del lead). */
  copiaA?: Array<string | null | undefined>;
}

export interface TeamNoticeResult {
  email: boolean;
  whatsapp: boolean;
}

export async function notifyTeam(notice: TeamNotice): Promise<TeamNoticeResult> {
  const recipients = [...new Set([emailService.getAdminEmail(), ...(notice.copiaA ?? [])].filter((e): e is string => !!e))];
  const text = [...notice.lineas, ...(notice.enlace ? ['', notice.enlace] : [])].join('\n');
  const html = emailLayout(
    notice.asunto,
    `      ${notice.lineas.map((l) => (l ? `<p>${escapeHtml(l)}</p>` : '')).join('\n      ')}
      ${notice.enlace ? `<p><a class="button" href="${escapeHtml(notice.enlace)}">Abrir en el panel</a></p>` : ''}`,
  );
  const email = emailService.isConfigured()
    ? (await Promise.all(recipients.map((to) => emailService.sendMail({ to, subject: notice.asunto, html, text }).catch(() => false)))).some(Boolean)
    : false;
  const whatsapp = await whatsappService.sendTeamMessage(`*${notice.asunto}*\n\n${text}`).catch((err) => {
    logger.warn(`[team-notify] WhatsApp: ${(err as Error)?.message ?? err}`);
    return false;
  });
  return { email, whatsapp };
}

/** Igual que `notifyTeam`, sin esperar (para no demorar la respuesta). */
export function notifyTeamInBackground(notice: TeamNotice): Promise<TeamNoticeResult> {
  return notifyTeam(notice).catch((err) => {
    logger.error(`[team-notify] ${(err as Error)?.message ?? err}`);
    return { email: false, whatsapp: false };
  });
}
