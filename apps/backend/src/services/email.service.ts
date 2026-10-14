/**
 * email.service.ts — envío de correo del backend.
 *
 * Proveedor:
 *  - Resend por API HTTPS (si existe RESEND_API_KEY). Es el que sirve en
 *    Railway Free/Trial/Hobby, que bloquea el SMTP saliente (25/465/587).
 *    POST ${RESEND_API_URL || https://api.resend.com}/emails con
 *    Authorization Bearer, User-Agent propio (sin él Resend responde 403) e
 *    Idempotency-Key cuando el llamador la da. Timeout de 15 s; un único
 *    reintento inmediato ante 429, 5xx o error de red. Éxito = 2xx con `id`.
 *  - SMTP (nodemailer) como respaldo, solo sin RESEND_API_KEY y con
 *    SMTP_USER + SMTP_PASS (local o Railway Pro), con timeouts de conexión.
 *
 * Avisos al dueño (nuevos contactos, prueba, latido): van a NOTIFY_EMAIL
 * (lista separada por comas) o, si falta, a ADMIN_EMAIL. Si Resend rechaza
 * con 403 porque el dominio del remitente no está verificado, el aviso al
 * dueño se reintenta una vez desde `onboarding@resend.dev` (Resend solo lo
 * entrega al correo dueño de la cuenta) y queda constancia en el log.
 *
 * Nunca lanza: `send` devuelve el resultado (con el id del proveedor o el
 * error limpio, sin la key) y `sendMail` un booleano. Los logs enmascaran
 * los destinos.
 */
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import { escapeHtml, safeHref, safeSubject, safeUrlText } from '../utils/html';
import { cleanErrorText, maskEmailList } from '../utils/mask';
import { providerBaseUrl } from '../utils/provider-url';

export const DEFAULT_EMAIL_FROM = 'KopTup <avisos@koptup.com>';
export const RESEND_ONBOARDING_FROM = 'KopTup <onboarding@resend.dev>';
export const DEFAULT_RESEND_API_URL = 'https://api.resend.com';
export const EMAIL_USER_AGENT = 'koptup-backend/1.0';
const DEFAULT_TIMEOUT_MS = 15_000;
const SMTP_CONNECTION_TIMEOUT_MS = 10_000;
const SMTP_SOCKET_TIMEOUT_MS = 15_000;

export type EmailProvider = 'resend' | 'smtp';

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  /** Responder a (p. ej. el correo de la persona que escribió). */
  replyTo?: string | null;
  /** Idempotency-Key de Resend (24 h): evita duplicados al reintentar. */
  idempotencyKey?: string;
  /** Aviso al dueño: habilita el respaldo `onboarding@resend.dev` ante un dominio no verificado. */
  ownerNotice?: boolean;
  /** Qué se registra en el log en lugar del asunto (p. ej. si el asunto lleva el nombre de una persona). */
  logLabel?: string;
}

export interface EmailSendResult {
  ok: boolean;
  /** false si no hay proveedor de correo configurado. */
  configurado: boolean;
  proveedor: EmailProvider | null;
  /** Id del correo en Resend o Message-ID de SMTP. */
  id?: string;
  /** Motivo del fallo (sin secretos; correos enmascarados). */
  error?: string;
  /** Remitente de respaldo usado por un dominio no verificado. */
  respaldo?: 'onboarding@resend.dev';
  status?: number;
}

interface EmailConfig {
  resendApiKey: string | null;
  resendUrl: string;
  /** RESEND_API_URL apunta a otro host (solo pruebas). */
  resendUrlCustom: boolean;
  /** RESEND_API_URL se ignoró (en producción solo se acepta localhost). */
  resendUrlIgnored: boolean;
  from: string;
  /** Destino de los avisos al dueño: NOTIFY_EMAIL o, si falta, ADMIN_EMAIL. */
  notifyEmails: string[];
  smtp: { host: string; port: number; secure: boolean; user: string; pass: string } | null;
  timeoutMs: number;
}

/** Lista de correos separados por coma (sin vacíos ni repetidos). */
export function parseEmailList(raw: string | null | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of (raw ?? '').split(',')) {
    const email = part.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(email);
  }
  return out;
}

/** Correo del remitente sin el nombre: `KopTup <avisos@koptup.com>` → `avisos@koptup.com`. */
export function senderAddress(from: string): string {
  const m = /<([^>]+)>/.exec(from);
  return (m ? m[1] : from).trim();
}

function readConfig(env: NodeJS.ProcessEnv): EmailConfig {
  const smtpUser = env.SMTP_USER?.trim() || '';
  const smtpPass = env.SMTP_PASS || '';
  const notify = parseEmailList(env.NOTIFY_EMAIL);
  const resendUrl = providerBaseUrl(env.RESEND_API_URL, DEFAULT_RESEND_API_URL, env);
  return {
    resendApiKey: env.RESEND_API_KEY?.trim() || null,
    resendUrl: resendUrl.url,
    resendUrlCustom: resendUrl.custom,
    resendUrlIgnored: resendUrl.ignored,
    from: env.EMAIL_FROM?.trim() || DEFAULT_EMAIL_FROM,
    notifyEmails: notify.length > 0 ? notify : parseEmailList(env.ADMIN_EMAIL),
    smtp:
      smtpUser && smtpPass
        ? {
            host: env.SMTP_HOST?.trim() || 'smtp.gmail.com',
            port: Number.parseInt(env.SMTP_PORT || '587', 10) || 587,
            secure: env.SMTP_SECURE === 'true',
            user: smtpUser,
            pass: smtpPass,
          }
        : null,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };
}

/**
 * ¿Se puede usar como `reply_to` de Resend? Solo direcciones ASCII simples:
 * Resend rechaza con 422 las que no siguen `email@example.com` (p. ej. una
 * parte local entre comillas o con tildes, que el formulario sí acepta), y
 * ese rechazo haría fallar el aviso en todos los reintentos.
 */
export function isSafeReplyTo(email: string | null | undefined): email is string {
  return !!email && email.length <= 254 && /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
}

/** ¿El 403 de Resend es por un dominio de remitente no verificado? */
export function isUnverifiedDomainError(message: string): boolean {
  return /domain|verif|testing emails/i.test(message);
}

interface ResendAttempt {
  status: number;
  id?: string;
  message?: string;
  networkError?: boolean;
}

export class EmailService {
  private transporter: any = null;
  private config: EmailConfig;

  constructor(env: NodeJS.ProcessEnv = process.env, opts: { timeoutMs?: number } = {}) {
    this.config = readConfig(env);
    if (opts.timeoutMs) this.config.timeoutMs = opts.timeoutMs;
    if (!this.config.resendApiKey && this.config.smtp) {
      this.transporter = nodemailer.createTransport({
        host: this.config.smtp.host,
        port: this.config.smtp.port,
        secure: this.config.smtp.secure,
        auth: { user: this.config.smtp.user, pass: this.config.smtp.pass },
        connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
        greetingTimeout: SMTP_CONNECTION_TIMEOUT_MS,
        socketTimeout: SMTP_SOCKET_TIMEOUT_MS,
      });
    }
  }

  /** Proveedor activo: Resend si hay RESEND_API_KEY; si no, SMTP si hay usuario y clave. */
  getProvider(): EmailProvider | null {
    if (this.config.resendApiKey) return 'resend';
    if (this.config.smtp && this.transporter) return 'smtp';
    return null;
  }

  /** ¿Sale correo? (cualquier correo: terceros o avisos). */
  isConfigured(): boolean {
    return this.getProvider() !== null;
  }

  /** ¿Salen los avisos al dueño? Proveedor y destino (NOTIFY_EMAIL o ADMIN_EMAIL). */
  isOwnerNoticeConfigured(): boolean {
    return this.isConfigured() && this.config.notifyEmails.length > 0;
  }

  /** Destinos de los avisos al dueño. */
  getNotifyEmails(): string[] {
    return [...this.config.notifyEmails];
  }

  /** Primer destino de los avisos (compatibilidad); null si no hay ninguno. */
  getAdminEmail(): string | null {
    return this.config.notifyEmails[0] ?? null;
  }

  getFrom(): string {
    return this.config.from;
  }

  /** RESEND_API_URL activa (solo pruebas) o ignorada por apuntar fuera de esta máquina en producción. */
  getResendUrlOverride(): { custom: boolean; ignored: boolean } {
    return { custom: this.config.resendUrlCustom, ignored: this.config.resendUrlIgnored };
  }

  /** Variables que faltan para que salgan los avisos al dueño por correo. */
  missingForOwnerNotice(): string[] {
    const faltan: string[] = [];
    if (!this.isConfigured()) faltan.push('RESEND_API_KEY');
    if (this.config.notifyEmails.length === 0) faltan.push('NOTIFY_EMAIL');
    return faltan;
  }

  /** Envía un correo por el proveedor activo. Nunca lanza. */
  async send(msg: EmailMessage): Promise<EmailSendResult> {
    const provider = this.getProvider();
    const subject = safeSubject(msg.subject);
    // En el log, el asunto sin correos completos (o la etiqueta del llamador,
    // si el asunto lleva datos personales como el nombre de quien escribió).
    const logSubject = msg.logLabel ? cleanErrorText(msg.logLabel, [], 120) : cleanErrorText(subject, [], 120);
    if (!provider) {
      logger.warn(`📧 Correo no configurado (falta RESEND_API_KEY): no se envía "${logSubject}"`);
      return { ok: false, configurado: false, proveedor: null, error: 'Correo no configurado: falta RESEND_API_KEY' };
    }
    const to = (Array.isArray(msg.to) ? msg.to : [msg.to]).map((t) => t?.trim()).filter((t): t is string => !!t);
    if (to.length === 0) {
      return { ok: false, configurado: true, proveedor: provider, error: 'Sin destinatario' };
    }
    const result = provider === 'resend' ? await this.sendViaResend({ ...msg, subject }, to) : await this.sendViaSmtp({ ...msg, subject }, to);
    const dest = maskEmailList(to);
    if (result.ok) {
      logger.info(`✅ Correo "${logSubject}" enviado por ${provider} a ${dest} (id ${result.id})${result.respaldo ? ` desde ${result.respaldo}` : ''}`);
    } else {
      logger.error(`❌ Correo "${logSubject}" a ${dest} falló por ${provider}: ${result.error}`);
    }
    return result;
  }

  /**
   * Envía un correo ya armado (plantillas de demos, propuestas, avisos al
   * equipo). Devuelve false, sin lanzar, si no hay correo o el envío falla.
   */
  async sendMail(params: {
    to: string;
    subject: string;
    html: string;
    text: string;
    replyTo?: string | null;
    idempotencyKey?: string;
  }): Promise<boolean> {
    return (await this.send(params)).ok;
  }

  private clean(raw: unknown): string {
    return cleanErrorText(raw, [this.config.resendApiKey, this.config.smtp?.pass]);
  }

  private async resendRequest(body: Record<string, unknown>, idempotencyKey?: string): Promise<ResendAttempt> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.resendApiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': EMAIL_USER_AGENT,
    };
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey.slice(0, 256);
    try {
      const res = await fetch(`${this.config.resendUrl}/emails`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
      const raw = await res.text().catch(() => '');
      let json: any = null;
      try {
        json = raw ? JSON.parse(raw) : null;
      } catch {
        json = null;
      }
      if (res.ok && json && typeof json.id === 'string' && json.id) return { status: res.status, id: json.id };
      const message = res.ok
        ? 'Resend respondió sin id'
        : `${json?.name ? `${json.name}: ` : ''}${json?.message ?? raw ?? ''}`.trim() || res.statusText || 'sin detalle';
      return { status: res.status, message: this.clean(message) };
    } catch (err) {
      const e = err as Error;
      const timeout = e?.name === 'TimeoutError' || e?.name === 'AbortError';
      return {
        status: 0,
        networkError: true,
        message: timeout
          ? `sin respuesta en ${this.config.timeoutMs >= 1000 ? `${Math.round(this.config.timeoutMs / 1000)} s` : `${this.config.timeoutMs} ms`}`
          : this.clean(`no se pudo conectar con el proveedor (${e?.message ?? err})`),
      };
    }
  }

  /** Una petición y, ante 429, 5xx o error de red, un reintento inmediato. */
  private async resendWithRetry(body: Record<string, unknown>, idempotencyKey?: string): Promise<ResendAttempt> {
    const first = await this.resendRequest(body, idempotencyKey);
    if (first.id || !(first.networkError || first.status === 429 || first.status >= 500)) return first;
    logger.warn(`[email] Resend ${first.status || 'red'}: ${first.message}. Reintento una vez.`);
    return this.resendRequest(body, idempotencyKey);
  }

  private async sendViaResend(msg: EmailMessage, to: string[]): Promise<EmailSendResult> {
    const body: Record<string, unknown> = {
      from: this.config.from,
      to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
    };
    if (isSafeReplyTo(msg.replyTo?.trim())) body.reply_to = msg.replyTo?.trim();
    else if (msg.replyTo) logger.warn('[email] El correo de la persona no tiene un formato que Resend acepte en reply_to: se envía sin «responder a» (el correo va en el cuerpo).');
    const attempt = await this.resendWithRetry(body, msg.idempotencyKey);
    if (attempt.id) return { ok: true, configurado: true, proveedor: 'resend', id: attempt.id, status: attempt.status };

    const error = `Resend ${attempt.status || 'sin conexión'}: ${attempt.message}`;
    if (
      attempt.status === 403 &&
      msg.ownerNotice &&
      isUnverifiedDomainError(attempt.message ?? '') &&
      senderAddress(this.config.from) !== senderAddress(RESEND_ONBOARDING_FROM)
    ) {
      logger.warn(
        `[email] Resend rechazó el remitente ${senderAddress(this.config.from)} (dominio no verificado). ` +
          'Reintento el aviso al dueño desde onboarding@resend.dev (solo llega al correo dueño de la cuenta de Resend). Verifica el dominio en Resend.',
      );
      // Otra Idempotency-Key: el cuerpo cambia (remitente) y Resend rechaza una key repetida con otro cuerpo.
      const fallback = await this.resendWithRetry(
        { ...body, from: RESEND_ONBOARDING_FROM },
        msg.idempotencyKey ? `${msg.idempotencyKey}-onboarding` : undefined,
      );
      if (fallback.id) {
        return {
          ok: true,
          configurado: true,
          proveedor: 'resend',
          id: fallback.id,
          status: fallback.status,
          respaldo: 'onboarding@resend.dev',
          error: this.clean(`${error} (se envió desde onboarding@resend.dev)`),
        };
      }
      return {
        ok: false,
        configurado: true,
        proveedor: 'resend',
        status: fallback.status,
        error: this.clean(`${error} | respaldo onboarding@resend.dev: ${fallback.status || 'sin conexión'} ${fallback.message}`),
      };
    }
    return { ok: false, configurado: true, proveedor: 'resend', status: attempt.status, error: this.clean(error) };
  }

  private async sendViaSmtp(msg: EmailMessage, to: string[]): Promise<EmailSendResult> {
    try {
      const info = await this.transporter.sendMail({
        from: this.config.from,
        to: to.join(', '),
        subject: msg.subject,
        text: msg.text,
        html: msg.html,
        ...(msg.replyTo ? { replyTo: msg.replyTo } : {}),
      });
      return { ok: true, configurado: true, proveedor: 'smtp', id: String(info?.messageId ?? 'smtp') };
    } catch (err) {
      return { ok: false, configurado: true, proveedor: 'smtp', error: this.clean(`SMTP: ${(err as Error)?.message ?? err}`) };
    }
  }

  /**
   * Envía el email de recuperación de contraseña con el enlace de reseteo.
   */
  async sendPasswordResetEmail(params: { to: string; name: string; resetUrl: string }): Promise<boolean> {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #4F46E5; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .muted { color: #6b7280; font-size: 13px; word-break: break-all; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Recuperar contraseña</h1>
      <p>KopTup</p>
    </div>
    <div class="content">
      <p>Hola ${escapeHtml(params.name)},</p>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón para crear una nueva contraseña. Este enlace expira en 1 hora.</p>
      <p style="text-align:center;">
        <a class="button" href="${safeHref(params.resetUrl)}">Restablecer contraseña</a>
      </p>
      <p class="muted">Si el botón no funciona, copia y pega este enlace en tu navegador:<br>${safeUrlText(params.resetUrl)}</p>
      <p>Si no solicitaste este cambio, puedes ignorar este correo: tu contraseña seguirá siendo la misma.</p>
      <div class="footer">
        <p>⏰ ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</p>
        <p>Este email fue generado automáticamente por el sistema KopTup</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

    const textContent = `Recuperar contraseña - KopTup

Hola ${params.name},

Recibimos una solicitud para restablecer la contraseña de tu cuenta.
Abre el siguiente enlace para crear una nueva contraseña (expira en 1 hora):

${params.resetUrl}

Si no solicitaste este cambio, ignora este correo.
`;

    return this.sendMail({ to: params.to, subject: '🔐 Recupera tu contraseña - KopTup', text: textContent, html: htmlContent });
  }
}

// Instancia única con la configuración del entorno.
export const emailService = new EmailService();
export default emailService;
