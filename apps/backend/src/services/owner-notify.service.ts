/**
 * owner-notify.service.ts — avisos al dueño de KopTup cuando una persona
 * escribe (formulario de /contact, "Prueba con tu documento" y "Solicitar
 * demo"), por correo (email.service: Resend o SMTP) y por WhatsApp
 * (whatsapp.service: plantilla de Meta).
 *
 * Centraliza:
 *  - armar el aviso de un Contact (asunto, html y texto del correo; título y
 *    detalle de la plantilla de WhatsApp);
 *  - enviarlo por cada canal y guardar el resultado en
 *    `Contact.notificaciones.<canal>` (estado, intentos, error, id del
 *    proveedor y respaldo usado);
 *  - el estado de salud de cada canal en AppSetting `avisos.estado`
 *    (último éxito, último fallo y último error por canal, y el latido);
 *  - el aviso de prueba (panel y latido mensual), el estado para el panel y
 *    los estados que llegan por el webhook de WhatsApp.
 *
 * Lo usan lead.service (aviso inicial), jobs/notify-retry.job (reintentos),
 * jobs/notify-heartbeat.job (latido), el reenvío manual y la prueba del panel
 * (routes/admin-notifications.routes) y el webhook de WhatsApp.
 */
import crypto from 'crypto';
import mongoose from 'mongoose';
import Contact, {
  DEFAULT_CONTACT_SOURCE,
  type IContact,
  type IContactNotifications,
  type IContactNotifyChannel,
  type NotifyState,
} from '../models/Contact';
import AppSetting from '../models/AppSetting';
import DemoRequest from '../models/DemoRequest';
import { emailService, type EmailSendResult } from './email.service';
import { whatsappService, describeMetaError, type WhatsAppSendResult } from './whatsapp.service';
import { emailLayout } from './demo-emails.service';
import { frontendUrl } from '../config/demos';
import { escapeHtml, escapeMultiline, safeHref, safeSubject } from '../utils/html';
import { cleanErrorText, maskEmailList } from '../utils/mask';
import { logger } from '../utils/logger';

export type NotifyChannel = 'email' | 'whatsapp';
export const NOTIFY_CHANNELS: readonly NotifyChannel[] = ['email', 'whatsapp'];

/** Intentos máximos por canal (el inicial + 5 reintentos). */
export const MAX_NOTIFY_ATTEMPTS = 6;
/** Espera antes del reintento n (después del intento 1, 2, 3, 4 y 5). */
export const NOTIFY_BACKOFF_MS = [5 * 60_000, 15 * 60_000, 60 * 60_000, 3 * 60 * 60_000, 12 * 60 * 60_000] as const;
/** Un `pendiente` con más de 10 min (p. ej. por un reinicio a mitad del envío) lo retoma el job. */
export const PENDING_LEASE_MS = 10 * 60_000;
/** Clave en AppSetting con la salud de los canales y el latido. */
export const AVISOS_SETTING_KEY = 'avisos.estado';
export const DEFAULT_HEARTBEAT_DAYS = 30;
/**
 * Si un latido no salió por ningún canal (o el proceso murió a mitad del
 * envío), se vuelve a intentar pasadas estas horas, al día siguiente dentro
 * de la ventana, en lugar de esperar otros NOTIFY_HEARTBEAT_DAYS días.
 */
export const HEARTBEAT_RETRY_MS = 20 * 60 * 60_000;
const DAY_MS = 24 * 60 * 60_000;
const SUCCESS_STATES: readonly NotifyState[] = ['enviado', 'entregado', 'leido'];
const EXCERPT_MAX = 300;

// ---------------------------------------------------------------------------
//   Armar el aviso
// ---------------------------------------------------------------------------

export interface OwnerNotice {
  asunto: string;
  html: string;
  text: string;
  /** {{1}} de la plantilla de WhatsApp. */
  titulo: string;
  /** {{2}} de la plantilla de WhatsApp. */
  detalle: string;
  /** Responder a: el correo de la persona que escribió. */
  replyTo?: string | null;
  /** Etiqueta para el log en lugar del asunto (el asunto lleva el nombre de la persona). */
  logLabel?: string;
}

type ContactLike = Pick<IContact, 'name' | 'email' | 'service' | 'message'> &
  Partial<Pick<IContact, 'phone' | 'company' | 'budget' | 'source' | 'plazo' | 'cotizacion' | 'created_at'>> & { _id?: unknown };

const TIMELINE_LABELS: Record<string, string> = {
  now: 'Ya mismo',
  '1m': 'El próximo mes',
  '3m': 'En 2 o 3 meses',
  open: 'Sin definir',
};

const SOURCE_LABELS: Record<string, string> = {
  'contact-form': 'Formulario de contacto',
  'demo-rag': 'Prueba con tu documento (demo RAG)',
  'demo-request': 'Solicitar demo',
};

function bogotaDate(date: Date): string {
  return date.toLocaleString('es-CO', { timeZone: 'America/Bogota' });
}

function excerpt(text: string, max = EXCERPT_MAX): string {
  const flat = String(text ?? '').replace(/\s+/g, ' ').trim();
  const chars = Array.from(flat);
  return chars.length > max ? `${chars.slice(0, max - 1).join('').trimEnd()}…` : flat;
}

function quoteLabel(c: ContactLike): string | null {
  const q = c.cotizacion;
  if (!q?.servicio) return null;
  return [q.servicio, q.plan && `plan ${q.plan}`, q.nivel && `nivel ${q.nivel}`, q.modalidad && `modalidad ${q.modalidad}`].filter(Boolean).join(' · ');
}

/**
 * Aviso de un contacto nuevo. Es determinista para los mismos datos (la hora
 * es la de creación del contacto), pero el contacto puede cambiar después
 * (p. ej. la demo RAG completa el mensaje con el resultado del documento): por
 * eso la Idempotency-Key del correo lleva un hash del cuerpo
 * (`contactEmailIdempotencyKey`).
 */
export function buildContactNotice(c: ContactLike): OwnerNotice {
  const source = c.source ?? DEFAULT_CONTACT_SOURCE;
  const created = c.created_at ? new Date(c.created_at) : new Date();
  const origen = SOURCE_LABELS[source] ?? source;
  const plazo = c.plazo ? TIMELINE_LABELS[c.plazo] ?? c.plazo : null;
  const cotizacion = quoteLabel(c);
  const panel = `${frontendUrl()}/admin/contacts`;

  const fields: Array<[string, string | null | undefined]> = [
    ['Nombre', c.name],
    ['Email', c.email],
    ['Teléfono', c.phone],
    ['Empresa', c.company],
    ['Servicio', c.service],
    ['Origen', source !== DEFAULT_CONTACT_SOURCE ? origen : null],
    ['Presupuesto', c.budget],
    ['Cuándo quiere empezar', plazo],
    ['Cotizaba', cotizacion],
  ];
  const present = fields.filter((f): f is [string, string] => !!f[1]);

  const htmlFields = present
    .map(([label, value]) =>
      label === 'Email'
        ? `      <p><strong>${escapeHtml(label)}:</strong> <a href="${safeHref(`mailto:${value}`)}">${escapeHtml(value)}</a></p>`
        : `      <p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`,
    )
    .join('\n');
  const html = emailLayout(
    '🔔 Nuevo contacto en KopTup',
    `${htmlFields}
      <p><strong>Mensaje:</strong></p>
      <div style="background:#fff;padding:12px;border-left:3px solid #4F46E5;border-radius:6px">${escapeMultiline(c.message)}</div>
      <p>Responde a este correo para escribirle directamente a la persona.</p>
      <p><a class="button" href="${safeHref(panel)}">Abrir Contactos en el panel</a></p>
      <p class="muted">Recibido el ${escapeHtml(bogotaDate(created))} (hora de Colombia).</p>`,
  );
  const text = [
    'Nuevo contacto en KopTup',
    '',
    ...present.map(([label, value]) => `${label}: ${value}`),
    '',
    'Mensaje:',
    c.message,
    '',
    `Responde a este correo para escribirle directamente a la persona. Panel: ${panel}`,
    `Recibido el ${bogotaDate(created)} (hora de Colombia).`,
  ].join('\n');

  const detalle = [
    c.company ? `Empresa: ${c.company}` : null,
    `Servicio: ${c.service}`,
    source !== DEFAULT_CONTACT_SOURCE ? `Origen: ${origen}` : null,
    `Email: ${c.email}`,
    `Mensaje: ${excerpt(c.message)}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    asunto: safeSubject(`🔔 Nuevo contacto: ${c.name} - ${c.service}`),
    html,
    text,
    titulo: `Nuevo contacto de ${c.name}`,
    detalle,
    replyTo: c.email,
    logLabel: `aviso del contacto ${c._id ? String(c._id) : 'nuevo'}`,
  };
}

export type TestOrigin = 'prueba' | 'latido';

function channelLine(): string {
  const email = emailService.isOwnerNoticeConfigured() ? 'configurado' : 'no configurado';
  const wa = whatsappService.isConfigured() ? 'configurado' : 'no configurado';
  return `Correo: ${email} · WhatsApp: ${wa}`;
}

/** Aviso de prueba (botón del panel) o del latido mensual. */
export function buildTestNotice(origen: TestOrigin, now = new Date()): OwnerNotice {
  const mensual = origen === 'latido';
  const asunto = mensual ? '✅ Prueba mensual: tus avisos de contactos funcionan' : '✅ Aviso de prueba de KopTup';
  const intro = mensual
    ? 'Prueba mensual: tus avisos de contactos funcionan. KopTup envía esta prueba cada mes para confirmar que el correo y el WhatsApp siguen activos aunque lleguen pocos mensajes.'
    : 'Prueba desde el panel: si recibes esto, los avisos de nuevos contactos llegan por este canal.';
  const lines = [intro, `Estado de los canales: ${channelLine()}.`, `Enviado el ${bogotaDate(now)} (hora de Colombia).`];
  return {
    asunto,
    html: emailLayout(asunto, lines.map((l) => `      <p>${escapeHtml(l)}</p>`).join('\n')),
    text: lines.join('\n\n'),
    titulo: mensual ? 'Prueba mensual de avisos' : 'Aviso de prueba',
    detalle: mensual ? `Prueba mensual: tus avisos de contactos funcionan. ${channelLine()}` : `Prueba desde el panel: tus avisos de contactos funcionan. ${channelLine()}`,
  };
}

// ---------------------------------------------------------------------------
//   Envío por canal y salud (AppSetting avisos.estado)
// ---------------------------------------------------------------------------

export interface ChannelSendResult {
  configurado: boolean;
  ok: boolean;
  id?: string;
  error?: string;
  respaldo?: string;
}

/** ¿El canal está configurado para avisar al dueño? */
export function isChannelConfigured(canal: NotifyChannel): boolean {
  return canal === 'email' ? emailService.isOwnerNoticeConfigured() : whatsappService.isConfigured();
}

function missingFor(canal: NotifyChannel): string[] {
  return canal === 'email' ? emailService.missingForOwnerNotice() : whatsappService.getStatus().faltan;
}

function fromEmail(r: EmailSendResult): ChannelSendResult {
  return { configurado: r.configurado, ok: r.ok, id: r.id, error: r.error, respaldo: r.respaldo };
}

function fromWhatsApp(r: WhatsAppSendResult): ChannelSendResult {
  return { configurado: r.configurado, ok: r.ok, id: r.id, error: r.error, respaldo: r.respaldo };
}

/** Envía un aviso por un canal (sin persistir en el Contact) y registra la salud del canal. */
export async function sendNoticeByChannel(
  canal: NotifyChannel,
  notice: OwnerNotice,
  opts: { idempotencyKey?: string; now?: Date; recordHealth?: boolean } = {},
): Promise<ChannelSendResult> {
  if (!isChannelConfigured(canal)) {
    return { configurado: false, ok: false, error: `No configurado: falta ${missingFor(canal).join(', ')}` };
  }
  let result: ChannelSendResult;
  try {
    result =
      canal === 'email'
        ? fromEmail(
            await emailService.send({
              to: emailService.getNotifyEmails(),
              subject: notice.asunto,
              html: notice.html,
              text: notice.text,
              replyTo: notice.replyTo ?? null,
              idempotencyKey: opts.idempotencyKey,
              ownerNotice: true,
              logLabel: notice.logLabel,
            }),
          )
        : fromWhatsApp(await whatsappService.sendTemplate(notice.titulo, notice.detalle));
  } catch (err) {
    result = { configurado: true, ok: false, error: cleanErrorText((err as Error)?.message ?? err) };
  }
  if (result.configurado && opts.recordHealth !== false) await recordChannelHealth(canal, result, opts.now ?? new Date());
  return result;
}

/**
 * Guarda en AppSetting `avisos.estado` el último éxito o fallo del canal. Un
 * envío con respaldo cuenta como éxito, pero deja el error de la plantilla o
 * del dominio como último error para que el panel lo muestre.
 */
export async function recordChannelHealth(canal: NotifyChannel, result: { ok: boolean; error?: string; respaldo?: string }, now = new Date()): Promise<void> {
  if (mongoose.connection.readyState !== 1) return;
  const base = `valor.${canal}`;
  const set: Record<string, unknown> = {};
  if (result.ok) set[`${base}.ultimoExito`] = now;
  if (!result.ok || result.respaldo) {
    set[`${base}.ultimoFallo`] = now;
    set[`${base}.ultimoError`] = cleanErrorText(result.error ?? 'Error desconocido');
  }
  try {
    await AppSetting.updateOne({ clave: AVISOS_SETTING_KEY }, { $set: set }, { upsert: true });
  } catch (err) {
    logger.warn(`[avisos] No se pudo guardar el estado del canal ${canal}: ${(err as Error)?.message ?? err}`);
  }
}

export interface AvisosState {
  email?: { ultimoExito?: Date | null; ultimoFallo?: Date | null; ultimoError?: string | null };
  whatsapp?: { ultimoExito?: Date | null; ultimoFallo?: Date | null; ultimoError?: string | null; ultimoEventoWebhook?: Date | null };
  latido?: {
    /** Último latido que salió por al menos un canal. */
    ultimo?: Date | null;
    /** Último intento de latido (reclamado antes de enviar). */
    intento?: Date | null;
    resultado?: { email: boolean | null; whatsapp: boolean | null } | null;
  };
}

export async function readAvisosState(): Promise<AvisosState> {
  if (mongoose.connection.readyState !== 1) return {};
  const doc = await AppSetting.findOne({ clave: AVISOS_SETTING_KEY }).lean().catch(() => null);
  return ((doc?.valor ?? {}) as AvisosState) ?? {};
}

// ---------------------------------------------------------------------------
//   Avisos de un Contact (estado por canal en Contact.notificaciones)
// ---------------------------------------------------------------------------

/** Estado inicial de los avisos de un contacto nuevo (el envío queda "reclamado" 10 min). */
export function initialNotifications(now = new Date()): IContactNotifications {
  const channel = (canal: NotifyChannel): IContactNotifyChannel =>
    isChannelConfigured(canal)
      ? { estado: 'pendiente', intentos: 0, ultimoIntento: now, proximoIntento: new Date(now.getTime() + PENDING_LEASE_MS) }
      : { estado: 'no_configurado', intentos: 0, error: `Falta ${missingFor(canal).join(', ')}`, proximoIntento: null };
  return { email: channel('email'), whatsapp: channel('whatsapp') };
}

/** Cuándo reintentar después del intento número `intentos` (null: ya no se reintenta). */
export function nextRetryAt(intentos: number, now: Date): Date | null {
  if (intentos >= MAX_NOTIFY_ATTEMPTS) return null;
  const wait = NOTIFY_BACKOFF_MS[Math.min(Math.max(intentos, 1), NOTIFY_BACKOFF_MS.length) - 1];
  return new Date(now.getTime() + wait);
}

export interface ChannelOutcome {
  configurado: boolean;
  enviado: boolean;
  estado: NotifyState;
  id?: string;
  error?: string;
  respaldo?: string;
  /** true si no se intentó (otro proceso lo tenía o ya estaba resuelto). */
  omitido?: boolean;
}

export type DeliverMode =
  /** Aviso inicial: los canales `pendiente` recién creados (ya reclamados). */
  | 'inicial'
  /** Job de reintentos: `pendiente` o `fallido` con `proximoIntento` vencido e intentos < 6. */
  | 'reintento'
  /** Reenvío manual: canales no exitosos, sin límite de intentos. */
  | 'manual'
  /** Reenvío manual de todos los canales (?todos=1). */
  | 'manual_todos';

export interface DeliverOptions {
  canales?: readonly NotifyChannel[];
  modo?: DeliverMode;
  now?: Date;
}

/** Hash corto del cuerpo del correo (asunto, html, texto y responder a). */
export function noticeBodyHash(notice: Pick<OwnerNotice, 'asunto' | 'html' | 'text' | 'replyTo'>): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify([notice.asunto, notice.html, notice.text, notice.replyTo ?? null]))
    .digest('hex')
    .slice(0, 16);
}

/**
 * Idempotency-Key de Resend del aviso de un contacto (Resend la guarda 24 h y
 * responde 409 si la misma key llega con otro cuerpo). Lleva el hash del
 * cuerpo: un reintento con el mismo cuerpo usa la misma key (Resend no lo
 * duplica) y, si el contacto cambió desde el primer intento, la key cambia y
 * el aviso sale en lugar de fallar con 409.
 */
export function contactEmailIdempotencyKey(contactId: unknown, modo: DeliverMode, intento: number, bodyHash: string): string {
  // El reenvío manual de un aviso ya enviado necesita otra key; el resto usa la misma.
  const base = `contact-${String(contactId)}-email-${bodyHash}`;
  return modo === 'manual_todos' ? `${base}-r${intento}` : base;
}

async function claimChannel(contactId: unknown, canal: NotifyChannel, modo: DeliverMode, now: Date): Promise<IContact | null> {
  const p = `notificaciones.${canal}`;
  const filter: Record<string, unknown> = { _id: contactId, anonimizadoEn: null };
  // Un `pendiente` dentro de su plazo está en curso (aviso inicial, job o
  // reenvío manual que lo reclamó): nunca se reclama dos veces.
  const notInFlight = { $or: [{ [`${p}.estado`]: { $ne: 'pendiente' } }, { [`${p}.proximoIntento`]: { $lte: now } }, { [`${p}.proximoIntento`]: null }] };
  if (modo === 'reintento') {
    filter[`${p}.estado`] = { $in: ['pendiente', 'fallido'] };
    filter[`${p}.proximoIntento`] = { $lte: now };
    filter[`${p}.intentos`] = { $lt: MAX_NOTIFY_ATTEMPTS };
  } else if (modo === 'manual') {
    filter[`${p}.estado`] = { $in: ['fallido', 'no_configurado', 'pendiente'] };
    filter.$and = [notInFlight];
  } else {
    filter[`${p}.estado`] = { $exists: true };
    filter.$and = [notInFlight];
  }
  // El reclamo deja el canal en `pendiente` con plazo de 10 min: así otro
  // proceso (job o reenvío manual) no lo envía a la vez, y si este proceso
  // muere a mitad del envío el job lo retoma al vencer el plazo.
  return Contact.findOneAndUpdate(
    filter,
    { $set: { [`${p}.estado`]: 'pendiente', [`${p}.ultimoIntento`]: now, [`${p}.proximoIntento`]: new Date(now.getTime() + PENDING_LEASE_MS) } },
    { new: true },
  ).lean<IContact>();
}

async function deliverChannel(contact: IContact, canal: NotifyChannel, modo: DeliverMode, now: Date): Promise<ChannelOutcome> {
  const current = contact.notificaciones?.[canal];
  if (modo === 'inicial' && current?.estado !== 'pendiente') {
    return { configurado: current?.estado !== 'no_configurado', enviado: false, estado: current?.estado ?? 'no_configurado', omitido: true, error: current?.error ?? undefined };
  }
  const p = `notificaciones.${canal}`;
  let doc: IContact | null = contact;
  if (modo !== 'inicial') {
    doc = await claimChannel(contact._id, canal, modo, now);
    if (!doc) {
      const fresh = await Contact.findById(contact._id).select('notificaciones').lean<IContact>();
      const estado = fresh?.notificaciones?.[canal]?.estado ?? 'pendiente';
      return { configurado: isChannelConfigured(canal), enviado: SUCCESS_STATES.includes(estado), estado, omitido: true };
    }
  }

  if (!isChannelConfigured(canal)) {
    const error = `Falta ${missingFor(canal).join(', ')}`;
    await Contact.updateOne({ _id: contact._id }, { $set: { [`${p}.estado`]: 'no_configurado', [`${p}.error`]: error, [`${p}.proximoIntento`]: null } });
    return { configurado: false, enviado: false, estado: 'no_configurado', error };
  }

  const intento = (doc.notificaciones?.[canal]?.intentos ?? 0) + 1;
  const notice = buildContactNotice(doc);
  // La salud del canal se guarda después del wamid: así el webhook de Meta
  // encuentra el contacto aunque el estado `failed` llegue muy rápido.
  const result = await sendNoticeByChannel(canal, notice, {
    idempotencyKey: canal === 'email' ? contactEmailIdempotencyKey(contact._id, modo, intento, noticeBodyHash(notice)) : undefined,
    now,
    recordHealth: false,
  });
  const estado: NotifyState = result.ok ? 'enviado' : 'fallido';
  const error = result.error ? cleanErrorText(result.error) : null;
  await Contact.updateOne(
    { _id: contact._id },
    {
      $set: {
        [`${p}.estado`]: estado,
        [`${p}.ultimoIntento`]: now,
        [`${p}.proximoIntento`]: result.ok ? null : nextRetryAt(intento, now),
        [`${p}.error`]: error,
        [`${p}.idProveedor`]: result.id ?? null,
        [`${p}.respaldo`]: result.respaldo ?? null,
      },
      $inc: { [`${p}.intentos`]: 1 },
    },
  );
  await recordChannelHealth(canal, result, now);
  if (doc.source === 'demo-request') await syncDemoRequestNotice(contact._id, canal, result.ok);
  if (!result.ok) {
    logger.warn(`[avisos] Contacto ${String(contact._id)}: ${canal} falló (intento ${intento} de ${MAX_NOTIFY_ATTEMPTS}): ${error}`);
  }
  return { configurado: true, enviado: result.ok, estado, id: result.id, error: error ?? undefined, respaldo: result.respaldo };
}

/**
 * La solicitud de demo que creó el contacto (DemoRequest.lead) muestra si
 * salió el aviso al equipo: se actualiza con cada intento (inicial,
 * reintento, reenvío manual o fallo informado por el webhook).
 */
async function syncDemoRequestNotice(contactId: unknown, canal: NotifyChannel, enviado: boolean): Promise<void> {
  const field = canal === 'email' ? 'notificaciones.equipoEmail' : 'notificaciones.equipoWhatsapp';
  await DemoRequest.updateMany({ lead: contactId }, { $set: { [field]: enviado } }).catch((err) =>
    logger.warn(`[avisos] No se pudo actualizar la solicitud de demo del contacto ${String(contactId)}: ${(err as Error)?.message ?? err}`),
  );
}

/**
 * Envía (o reenvía) los avisos de un contacto por los canales indicados y
 * guarda el resultado por canal. Nunca lanza: un error queda como `fallido`
 * en el resultado.
 */
export async function deliverContactNotifications(
  contactOrId: IContact | mongoose.Types.ObjectId | string,
  opts: DeliverOptions = {},
): Promise<Partial<Record<NotifyChannel, ChannelOutcome>>> {
  const modo = opts.modo ?? 'reintento';
  const now = opts.now ?? new Date();
  const canales = opts.canales ?? NOTIFY_CHANNELS;
  let contact: IContact | null =
    typeof contactOrId === 'string' || contactOrId instanceof mongoose.Types.ObjectId
      ? await Contact.findById(contactOrId).lean<IContact>()
      : (contactOrId as IContact);
  if (!contact) return {};
  if (contact.anonimizadoEn) return {};

  // Contactos anteriores a los avisos registrados: el reenvío manual los inicia.
  if (!contact.notificaciones && (modo === 'manual' || modo === 'manual_todos')) {
    const initial = initialNotifications(new Date(0));
    for (const canal of NOTIFY_CHANNELS) {
      initial[canal].proximoIntento = new Date(0);
      if (initial[canal].estado === 'pendiente') initial[canal].ultimoIntento = null;
    }
    await Contact.updateOne({ _id: contact._id, notificaciones: null }, { $set: { notificaciones: initial } });
    contact = await Contact.findById(contact._id).lean<IContact>();
    if (!contact) return {};
  }

  const entries = await Promise.all(
    canales.map(async (canal): Promise<[NotifyChannel, ChannelOutcome]> => {
      try {
        return [canal, await deliverChannel(contact as IContact, canal, modo, now)];
      } catch (err) {
        const error = cleanErrorText((err as Error)?.message ?? err);
        logger.error(`[avisos] Contacto ${String(contact?._id)}: error enviando por ${canal}: ${error}`);
        return [canal, { configurado: isChannelConfigured(canal), enviado: false, estado: 'fallido', error }];
      }
    }),
  );
  return Object.fromEntries(entries) as Partial<Record<NotifyChannel, ChannelOutcome>>;
}

/** `notificaciones` de un contacto para el panel (sin ids internos). */
export function publicNotifications(n: IContactNotifications | null | undefined) {
  if (!n) return null;
  const pick = (c: IContactNotifyChannel | undefined) =>
    c
      ? {
          estado: c.estado,
          intentos: c.intentos ?? 0,
          ultimoIntento: c.ultimoIntento ?? null,
          proximoIntento: c.proximoIntento ?? null,
          error: c.error ?? null,
          respaldo: c.respaldo ?? null,
        }
      : null;
  return { email: pick(n.email), whatsapp: pick(n.whatsapp) };
}

// ---------------------------------------------------------------------------
//   Prueba (panel) y latido
// ---------------------------------------------------------------------------

export interface TestChannelResult {
  configurado: boolean;
  enviado: boolean;
  id?: string;
  error?: string;
  respaldo?: string;
}

export interface TestNoticeResult {
  email: TestChannelResult;
  whatsapp: TestChannelResult;
}

function toTestResult(r: ChannelSendResult): TestChannelResult {
  return {
    configurado: r.configurado,
    enviado: r.ok,
    ...(r.id ? { id: r.id } : {}),
    ...(r.error ? { error: r.error } : {}),
    ...(r.respaldo ? { respaldo: r.respaldo } : {}),
  };
}

/** Envía el aviso de prueba por los dos canales (los no configurados lo dicen). */
export async function sendOwnerTestNotice(origen: TestOrigin = 'prueba', now = new Date()): Promise<TestNoticeResult> {
  const notice = buildTestNotice(origen, now);
  const key = origen === 'latido' ? `latido-${now.toISOString().slice(0, 10)}` : undefined;
  const [email, whatsapp] = await Promise.all([
    sendNoticeByChannel('email', notice, { idempotencyKey: key, now }),
    sendNoticeByChannel('whatsapp', notice, { now }),
  ]);
  return { email: toTestResult(email), whatsapp: toTestResult(whatsapp) };
}

/** Días entre latidos (NOTIFY_HEARTBEAT_DAYS; 30 por defecto; 0 = apagado). */
export function heartbeatDays(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.NOTIFY_HEARTBEAT_DAYS?.trim();
  if (!raw) return DEFAULT_HEARTBEAT_DAYS;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : DEFAULT_HEARTBEAT_DAYS;
}

export function notifyJobsEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NOTIFY_JOBS_ENABLED?.trim().toLowerCase() !== 'false';
}

/** Hora (0-23) en Bogotá. */
export function bogotaHour(now: Date): number {
  const h = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Bogota', hour: 'numeric', hourCycle: 'h23' }).format(now);
  return Number.parseInt(h, 10) % 24;
}

/** Ventana del latido: de 9:00 a 18:59, hora de Bogotá. */
export function isWithinHeartbeatWindow(now: Date): boolean {
  const h = bogotaHour(now);
  return h >= 9 && h <= 18;
}

/**
 * Próximo latido estimado (el job revisa cada hora, dentro de la ventana).
 * `intento` es el último intento: si no salió, se reintenta tras
 * HEARTBEAT_RETRY_MS.
 */
export function nextHeartbeatAt(ultimo: Date | null, days: number, now = new Date(), intento: Date | null = null): Date | null {
  if (days <= 0) return null;
  let at = ultimo ? new Date(ultimo.getTime() + days * DAY_MS) : now;
  if (intento && (!ultimo || intento > ultimo)) {
    const retry = new Date(intento.getTime() + HEARTBEAT_RETRY_MS);
    if (retry > at) at = retry;
  }
  if (at < now) at = now;
  // Bogotá es UTC-5 sin horario de verano: 9:00 en Bogotá = 14:00 UTC.
  if (!isWithinHeartbeatWindow(at)) {
    const next = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate(), 14, 0, 0));
    if (next <= at) next.setUTCDate(next.getUTCDate() + 1);
    at = next;
  }
  return at;
}

function iso(d: unknown): string | null {
  if (!d) return null;
  const date = d instanceof Date ? d : new Date(String(d));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Estado de los avisos para el panel (GET /api/admin/notifications/status). Sin secretos. */
export async function getNotificationStatus(now = new Date()) {
  const state = await readAvisosState();
  const wa = whatsappService.getStatus();
  const days = heartbeatDays();
  const ultimoLatido = state.latido?.ultimo ? new Date(state.latido.ultimo) : null;
  const intentoLatido = state.latido?.intento ? new Date(state.latido.intento) : null;
  const anyChannel = emailService.isOwnerNoticeConfigured() || wa.configurado;
  const activo = days > 0 && notifyJobsEnabled() && anyChannel;
  const provider = emailService.getProvider();
  return {
    email: {
      proveedor: provider,
      configurado: emailService.isOwnerNoticeConfigured(),
      destino: maskEmailList(emailService.getNotifyEmails()),
      remitente: provider ? emailService.getFrom() : null,
      ultimoExito: iso(state.email?.ultimoExito),
      ultimoFallo: iso(state.email?.ultimoFallo),
      ultimoError: state.email?.ultimoError ?? null,
      faltan: emailService.missingForOwnerNotice(),
    },
    whatsapp: {
      proveedor: wa.proveedor,
      configurado: wa.configurado,
      destino: wa.destino,
      plantilla: wa.plantilla,
      webhook: wa.webhook,
      /** Último evento de estado recibido por el webhook (null: ninguno todavía). */
      webhookUltimoEvento: iso(state.whatsapp?.ultimoEventoWebhook),
      /** WHATSAPP_PROVIDER pide un proveedor retirado (twilio, ultramsg u otro). */
      proveedorNoSoportado: wa.proveedorNoSoportado,
      ultimoExito: iso(state.whatsapp?.ultimoExito),
      ultimoFallo: iso(state.whatsapp?.ultimoFallo),
      ultimoError: state.whatsapp?.ultimoError ?? null,
      faltan: wa.faltan,
    },
    latido: {
      activo,
      cadaDias: days,
      ultimo: iso(ultimoLatido),
      proximo: activo ? iso(nextHeartbeatAt(ultimoLatido, days, now, intentoLatido)) : null,
    },
  };
}

/** Una línea por canal al arrancar, con los destinos enmascarados. */
export function logNotifyChannels(log: { info: (m: string) => void; warn: (m: string) => void } = logger): void {
  const provider = emailService.getProvider();
  if (emailService.isOwnerNoticeConfigured()) {
    const override = emailService.getResendUrlOverride();
    const host = provider === 'resend' && override.custom ? ' (RESEND_API_URL: servidor de pruebas, no api.resend.com)' : '';
    log.info(`Avisos por correo: ${provider === 'resend' ? 'Resend' : 'SMTP'} → ${maskEmailList(emailService.getNotifyEmails())}${host}`);
  } else {
    log.warn(`Avisos por correo: no configurado: falta ${emailService.missingForOwnerNotice().join(', ')}`);
  }
  const wa = whatsappService.getStatus();
  if (wa.configurado) {
    const host = whatsappService.getGraphUrlOverride().custom ? ' (WHATSAPP_GRAPH_URL: servidor de pruebas, no graph.facebook.com)' : '';
    log.info(`Avisos por WhatsApp: Meta plantilla ${wa.plantilla} → ${wa.destino}${wa.webhook ? ' (webhook de estados activo)' : ''}${host}`);
  } else if (wa.proveedorNoSoportado) {
    const otros = wa.faltan.filter((f) => f !== 'WHATSAPP_PROVIDER');
    log.warn(
      `Avisos por WhatsApp: no configurado: WHATSAPP_PROVIDER pide un proveedor retirado (Twilio y UltraMsg ya no se soportan; cámbiala a meta)${otros.length ? `; además falta ${otros.join(', ')}` : ''}`,
    );
  } else {
    log.warn(`Avisos por WhatsApp: no configurado: falta ${wa.faltan.join(', ')}`);
  }
}

// ---------------------------------------------------------------------------
//   Webhook de WhatsApp (estados por wamid)
// ---------------------------------------------------------------------------

const STATUS_MAP: Record<string, NotifyState> = { delivered: 'entregado', read: 'leido', failed: 'fallido' };
const alertedWamids: string[] = [];

export interface WebhookResult {
  estados: number;
  actualizados: number;
  alertas: number;
}

async function sendFailureAlert(wamid: string, errorText: string, contact: IContact | null): Promise<boolean> {
  if (alertedWamids.includes(wamid)) return false;
  alertedWamids.push(wamid);
  if (alertedWamids.length > 200) alertedWamids.shift();
  if (!emailService.isOwnerNoticeConfigured()) {
    logger.error(`[avisos] WhatsApp no entregó ${wamid} y no hay correo para avisar: ${errorText}`);
    return false;
  }
  const lines = [
    'WhatsApp no pudo entregar un aviso de KopTup.',
    `Motivo: ${errorText}`,
    contact
      ? `Era el aviso del contacto de ${contact.name} (${contact.service}). Está en Admin › Contactos, donde puedes reenviarlo.`
      : 'No se pudo asociar a un contacto: puede ser un aviso de prueba, el latido mensual o un aviso de pedido o de propuesta del portal. Revisa los pedidos y propuestas recientes en el panel.',
    'Qué revisar: que la plantilla esté aprobada en WhatsApp Manager, que el token de Meta siga vigente y que ADMIN_WHATSAPP_NUMBER sea tu número con indicativo (p. ej. 57...).',
  ];
  const asunto = '⚠️ WhatsApp no entregó un aviso de KopTup';
  const r = await emailService.send({
    to: emailService.getNotifyEmails(),
    subject: asunto,
    html: emailLayout(asunto, lines.map((l) => `      <p>${escapeHtml(l)}</p>`).join('\n')),
    text: lines.join('\n\n'),
    idempotencyKey: `wa-failed-${wamid}`.slice(0, 256),
    ownerNotice: true,
  });
  return r.ok;
}

/**
 * Procesa los `statuses` del webhook de WhatsApp: actualiza por wamid el
 * aviso guardado (entregado / leído / fallido, sin retroceder de estado) y,
 * ante `failed`, avisa al dueño por correo con el código y qué hacer.
 */
export interface WebhookOptions {
  /** Reintentos de la búsqueda del contacto de un `failed` cuyo wamid aún no se guardó. */
  lookupRetries?: number;
  /** Espera entre esos reintentos (ms). */
  lookupDelayMs?: number;
}

/** Espera por defecto antes de volver a buscar el wamid de un `failed` (el envío aún lo está guardando). */
export const WEBHOOK_LOOKUP_DELAY_MS = 2000;

async function findContactByWamid(wamid: string, opts: WebhookOptions): Promise<IContact | null> {
  const retries = opts.lookupRetries ?? 2;
  const delay = opts.lookupDelayMs ?? WEBHOOK_LOOKUP_DELAY_MS;
  for (let i = 0; ; i += 1) {
    const contact = await Contact.findOne({ 'notificaciones.whatsapp.idProveedor': wamid }).lean<IContact>();
    if (contact || i >= retries) return contact;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

export async function processWhatsAppStatuses(body: any, now = new Date(), opts: WebhookOptions = {}): Promise<WebhookResult> {
  const out: WebhookResult = { estados: 0, actualizados: 0, alertas: 0 };
  const statuses: any[] = [];
  for (const entry of Array.isArray(body?.entry) ? body.entry : []) {
    for (const change of Array.isArray(entry?.changes) ? entry.changes : []) {
      for (const st of Array.isArray(change?.value?.statuses) ? change.value.statuses : []) statuses.push(st);
    }
  }
  const p = 'notificaciones.whatsapp';
  for (const st of statuses) {
    const wamid = typeof st?.id === 'string' ? st.id.slice(0, 200) : null;
    const estado = STATUS_MAP[String(st?.status ?? '')];
    if (!wamid || !estado) continue;
    out.estados += 1;
    if (estado === 'fallido') {
      const err = Array.isArray(st.errors) ? st.errors[0] : null;
      const errorText = cleanErrorText(
        err
          ? describeMetaError({ code: err.code, message: err.title ?? err.message, error_data: err.error_data }, 200).text.replace(/^Meta 200 /, 'Meta ')
          : 'Meta informó que el mensaje falló (sin detalle)',
      );
      // Si Meta avisa muy rápido, el envío puede no haber guardado aún el
      // wamid: se vuelve a buscar tras una breve espera.
      const contact = await findContactByWamid(wamid, opts);
      if (contact && contact.notificaciones?.whatsapp?.estado !== 'leido') {
        const intentos = contact.notificaciones?.whatsapp?.intentos ?? 1;
        const res = await Contact.updateOne(
          { _id: contact._id, [`${p}.idProveedor`]: wamid },
          { $set: { [`${p}.estado`]: 'fallido', [`${p}.error`]: errorText, [`${p}.proximoIntento`]: nextRetryAt(intentos, now) } },
        );
        out.actualizados += res.modifiedCount ?? 0;
        if (contact.source === 'demo-request') await syncDemoRequestNotice(contact._id, 'whatsapp', false);
      }
      await recordChannelHealth('whatsapp', { ok: false, error: errorText }, now);
      if (await sendFailureAlert(wamid, errorText, contact)) out.alertas += 1;
      continue;
    }
    const allowed = estado === 'entregado' ? ['pendiente', 'enviado'] : ['pendiente', 'enviado', 'entregado'];
    const res = await Contact.updateOne({ [`${p}.idProveedor`]: wamid, [`${p}.estado`]: { $in: allowed } }, { $set: { [`${p}.estado`]: estado } });
    out.actualizados += res.modifiedCount ?? 0;
  }
  if (out.estados > 0 && mongoose.connection.readyState === 1) {
    // El panel muestra cuándo llegó el último evento (prueba de que Meta sí envía los estados).
    await AppSetting.updateOne({ clave: AVISOS_SETTING_KEY }, { $set: { 'valor.whatsapp.ultimoEventoWebhook': now } }, { upsert: true }).catch(() => undefined);
  }
  return out;
}

/** Solo para pruebas: olvida los wamid ya alertados. */
export function resetWebhookAlertsForTests(): void {
  alertedWamids.length = 0;
}
