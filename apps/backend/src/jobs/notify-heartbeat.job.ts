/**
 * notify-heartbeat.job.ts — latido mensual de los avisos al dueño.
 *
 * Con ~1 contacto al mes, un canal puede dejar de funcionar sin que nadie lo
 * note (token de Meta vencido, plantilla archivada por 12 meses sin uso, app
 * de Meta desactivada por inactividad, key de Resend revocada). Por eso, cada
 * NOTIFY_HEARTBEAT_DAYS días (30 por defecto; 0 = apagado) se envía por cada
 * canal configurado un aviso de prueba ("Prueba mensual: tus avisos de
 * contactos funcionan"). Si un canal falla, o solo salió por un respaldo
 * (la plantilla `hello_world` de Meta o el remitente onboarding@resend.dev),
 * se avisa por el otro con el error y qué revisar. Si no salió por ningún
 * canal (o el proceso murió a mitad del envío), se reintenta a las ~20 h
 * (HEARTBEAT_RETRY_MS), dentro de la ventana del día siguiente.
 *
 * El job revisa cada hora y solo envía entre las 9:00 y las 18:59 (hora de
 * Bogotá). La fecha del último latido que salió (`latido.ultimo`) y la del
 * último intento (`latido.intento`) viven en AppSetting `avisos.estado`
 * (sobreviven a reinicios; el intento se "reclama" con una actualización
 * condicionada, así que con varias instancias se envía una sola vez). Candado en Redis
 * (`jobs:notify-heartbeat:lock`) como los otros jobs. No corre en
 * NODE_ENV=test; NOTIFY_JOBS_ENABLED=false lo apaga.
 */
import AppSetting from '../models/AppSetting';
import {
  AVISOS_SETTING_KEY,
  HEARTBEAT_RETRY_MS,
  heartbeatDays,
  isChannelConfigured,
  isWithinHeartbeatWindow,
  notifyJobsEnabled,
  sendNoticeByChannel,
  sendOwnerTestNotice,
  type OwnerNotice,
  type TestNoticeResult,
} from '../services/owner-notify.service';
import { emailLayout } from '../services/demo-emails.service';
import { acquireLock, releaseLock } from '../services/redis-lock.service';
import { isDbReady } from '../middleware/access';
import { escapeHtml } from '../utils/html';
import { logger } from '../utils/logger';

export const NOTIFY_HEARTBEAT_LOCK_KEY = 'jobs:notify-heartbeat:lock';
const LOCK_TTL_MS = 10 * 60 * 1000;
export const NOTIFY_HEARTBEAT_INTERVAL_MS = 60 * 60 * 1000;
const FIRST_RUN_DELAY_MS = 3 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface NotifyHeartbeatResult {
  skipped?: 'disabled' | 'db_unavailable' | 'sin_canales' | 'fuera_de_horario' | 'lock_busy' | 'no_toca';
  lock?: 'acquired' | 'unavailable' | 'busy';
  resultado?: TestNoticeResult;
  /** Canal por el que se avisó que el otro falló. */
  avisoCruzado?: Array<'email' | 'whatsapp'>;
}

function alertNotice(canalCaido: 'email' | 'whatsapp', error: string, respaldo?: string): OwnerNotice {
  const correo = canalCaido === 'email';
  const asunto = correo ? '⚠️ Falla en tus avisos por correo de KopTup' : '⚠️ Falla en tus avisos por WhatsApp de KopTup';
  const revisar = correo
    ? 'Revisa RESEND_API_KEY, NOTIFY_EMAIL y que el dominio del remitente esté verificado en Resend.'
    : 'Revisa que la plantilla esté aprobada en WhatsApp Manager, que el token de Meta (WHATSAPP_API_TOKEN) siga vigente y ADMIN_WHATSAPP_NUMBER.';
  const intro = respaldo
    ? correo
      ? `La prueba mensual por correo solo salió desde el remitente de respaldo ${respaldo} (llega únicamente al correo dueño de la cuenta de Resend)`
      : `La prueba mensual por WhatsApp solo salió con la plantilla de respaldo ${respaldo}: los avisos de contactos te llegan sin datos`
    : correo
      ? 'La prueba mensual por correo falló'
      : 'La prueba mensual por WhatsApp falló';
  const lines = [`${intro}: ${error}`, revisar, 'Puedes probar de nuevo en el panel de KopTup › Configuración › Avisos de nuevos contactos.'];
  return {
    asunto,
    html: emailLayout(asunto, lines.map((l) => `      <p>${escapeHtml(l)}</p>`).join('\n')),
    text: lines.join('\n\n'),
    titulo: correo ? 'Falla en los avisos por correo' : 'Falla en los avisos por WhatsApp',
    detalle: `${intro}: ${error}. ${revisar}`,
  };
}

/** Una corrida del latido (exportada para las pruebas). */
export async function runNotifyHeartbeatJob(now = new Date()): Promise<NotifyHeartbeatResult> {
  const days = heartbeatDays();
  if (days <= 0) return { skipped: 'disabled' };
  if (!isDbReady()) return { skipped: 'db_unavailable' };
  const emailOn = isChannelConfigured('email');
  const whatsappOn = isChannelConfigured('whatsapp');
  if (!emailOn && !whatsappOn) return { skipped: 'sin_canales' };
  if (!isWithinHeartbeatWindow(now)) return { skipped: 'fuera_de_horario' };

  const lock = await acquireLock(NOTIFY_HEARTBEAT_LOCK_KEY, LOCK_TTL_MS);
  if (lock.status === 'busy') return { skipped: 'lock_busy', lock: 'busy' };
  if (lock.status === 'unavailable') logger.warn('[notify-heartbeat-job] Redis no disponible: se corre sin candado (el latido se reclama en MongoDB)');
  try {
    await AppSetting.updateOne({ clave: AVISOS_SETTING_KEY }, { $setOnInsert: { valor: {} } }, { upsert: true });
    const threshold = new Date(now.getTime() - days * DAY_MS);
    const retryThreshold = new Date(now.getTime() - HEARTBEAT_RETRY_MS);
    // Toca si el último latido que salió tiene `days` días o más y el último
    // intento (si no salió) tiene más de HEARTBEAT_RETRY_MS.
    const claim = await AppSetting.updateOne(
      {
        clave: AVISOS_SETTING_KEY,
        $and: [
          { $or: [{ 'valor.latido.ultimo': { $exists: false } }, { 'valor.latido.ultimo': null }, { 'valor.latido.ultimo': { $lte: threshold } }] },
          { $or: [{ 'valor.latido.intento': { $exists: false } }, { 'valor.latido.intento': null }, { 'valor.latido.intento': { $lte: retryThreshold } }] },
        ],
      },
      { $set: { 'valor.latido.intento': now } },
    );
    if (!claim.modifiedCount) return { skipped: 'no_toca', lock: lock.status };

    const resultado = await sendOwnerTestNotice('latido', now);
    // Un canal que solo salió por un respaldo no cuenta como sano.
    const sano = (r: TestNoticeResult['email']) => (r.configurado ? r.enviado && !r.respaldo : null);
    const algunoSalio = resultado.email.enviado || resultado.whatsapp.enviado;
    await AppSetting.updateOne(
      { clave: AVISOS_SETTING_KEY },
      {
        $set: {
          'valor.latido.resultado': { email: sano(resultado.email), whatsapp: sano(resultado.whatsapp) },
          // Si no salió por ningún canal, `ultimo` no cambia y se reintenta en ~20 h.
          ...(algunoSalio ? { 'valor.latido.ultimo': now } : {}),
        },
      },
    );

    // Si un canal falla o solo salió por un respaldo, avisa por el otro (si
    // ese sí salió de verdad).
    const avisoCruzado: Array<'email' | 'whatsapp'> = [];
    const day = now.toISOString().slice(0, 10);
    if (resultado.email.configurado && sano(resultado.email) === false && sano(resultado.whatsapp) === true) {
      const r = await sendNoticeByChannel('whatsapp', alertNotice('email', resultado.email.error ?? 'sin detalle', resultado.email.respaldo), { now });
      if (r.ok) avisoCruzado.push('whatsapp');
    }
    if (resultado.whatsapp.configurado && sano(resultado.whatsapp) === false && resultado.email.enviado) {
      const r = await sendNoticeByChannel('email', alertNotice('whatsapp', resultado.whatsapp.error ?? 'sin detalle', resultado.whatsapp.respaldo), {
        now,
        idempotencyKey: `latido-${day}-alerta-whatsapp`,
      });
      if (r.ok) avisoCruzado.push('email');
    }
    const describe = (r: TestNoticeResult['email']) => (r.configurado ? `${r.enviado}${r.respaldo ? ` (respaldo ${r.respaldo})` : ''}` : 'no configurado');
    const line = `correo=${describe(resultado.email)} whatsapp=${describe(resultado.whatsapp)}${avisoCruzado.length ? ` (aviso por ${avisoCruzado.join(', ')})` : ''}`;
    if (algunoSalio) logger.info(`[notify-heartbeat-job] Latido enviado: ${line}`);
    else logger.error(`[notify-heartbeat-job] El latido no salió por ningún canal (${line}): se reintenta en ~${Math.round(HEARTBEAT_RETRY_MS / 3_600_000)} h`);
    return { lock: lock.status, resultado, avisoCruzado };
  } finally {
    if (lock.status === 'acquired') await releaseLock(NOTIFY_HEARTBEAT_LOCK_KEY, lock.token);
  }
}

let interval: NodeJS.Timeout | null = null;
let firstRun: NodeJS.Timeout | null = null;
let running = false;

async function tick(): Promise<void> {
  if (running) return;
  running = true;
  try {
    await runNotifyHeartbeatJob();
  } catch (err) {
    logger.error(`[notify-heartbeat-job] Error: ${(err as Error)?.message ?? err}`);
  } finally {
    running = false;
  }
}

/** Arranca el latido (lo llama index.ts). No hace nada en pruebas, apagado o con NOTIFY_HEARTBEAT_DAYS=0. */
export function startNotifyHeartbeatJob(): boolean {
  if (interval || process.env.NODE_ENV === 'test' || !notifyJobsEnabled() || heartbeatDays() <= 0) return false;
  firstRun = setTimeout(() => void tick(), FIRST_RUN_DELAY_MS);
  firstRun.unref();
  interval = setInterval(() => void tick(), NOTIFY_HEARTBEAT_INTERVAL_MS);
  interval.unref();
  logger.info(`[notify-heartbeat-job] Latido de avisos cada ${heartbeatDays()} días (revisión cada hora, de 9:00 a 18:59 hora de Bogotá)`);
  return true;
}

export function stopNotifyHeartbeatJob(): void {
  if (firstRun) clearTimeout(firstRun);
  if (interval) clearInterval(interval);
  firstRun = null;
  interval = null;
}
