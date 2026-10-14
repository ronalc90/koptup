/**
 * notify-retry.job.ts — reintentos de los avisos al dueño (contactos nuevos).
 *
 * Cada 5 minutos (la primera corrida ~1 min después de arrancar) busca los
 * contactos de los últimos 3 días con algún canal (correo o WhatsApp):
 *  - `fallido`, o
 *  - `pendiente` viejo (más de 10 min sin resolverse, p. ej. porque el
 *    proceso se reinició a mitad del envío),
 * con `proximoIntento` vencido y menos de 6 intentos, y los vuelve a enviar
 * con services/owner-notify.service.ts. Espera entre intentos: 5 min,
 * 15 min, 1 h, 3 h y 12 h. Nunca reenvía un canal ya `enviado`, `entregado`
 * o `leido`. Cada canal se "reclama" con una actualización condicionada, así
 * que dos corridas nunca lo envían a la vez; el correo lleva la
 * Idempotency-Key `contact-<id>-email-<hash del cuerpo>` (Resend la guarda
 * 24 h: el mismo cuerpo no se duplica y, si el contacto cambió, la key cambia
 * en lugar de recibir un 409). El reclamo deja el canal en `pendiente` con un
 * plazo de 10 min, así que el reenvío manual del panel no lo envía a la vez.
 *
 * Igual que los otros jobs: candado en Redis (`jobs:notify-retry:lock`); si
 * Redis no responde corre igual (el reclamo por canal evita duplicados). No
 * corre en NODE_ENV=test; NOTIFY_JOBS_ENABLED=false lo apaga (también el
 * latido mensual).
 */
import Contact from '../models/Contact';
import {
  MAX_NOTIFY_ATTEMPTS,
  NOTIFY_CHANNELS,
  deliverContactNotifications,
  notifyJobsEnabled,
  type NotifyChannel,
} from '../services/owner-notify.service';
import { acquireLock, releaseLock } from '../services/redis-lock.service';
import { isDbReady } from '../middleware/access';
import { logger } from '../utils/logger';

export const NOTIFY_RETRY_LOCK_KEY = 'jobs:notify-retry:lock';
const LOCK_TTL_MS = 4 * 60 * 1000;
export const NOTIFY_RETRY_INTERVAL_MS = 5 * 60 * 1000;
const FIRST_RUN_DELAY_MS = 60 * 1000;
/** Solo se reintentan los contactos de los últimos 3 días. */
export const NOTIFY_RETRY_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;
const MAX_PER_RUN = 50;

export interface NotifyRetryJobResult {
  skipped?: 'lock_busy' | 'db_unavailable';
  lock: 'acquired' | 'unavailable' | 'busy';
  intentados: number;
  enviados: number;
  fallidos: number;
}

/** Una corrida del job (exportada para las pruebas y para ejecutarla a mano). */
export async function runNotifyRetryJob(now = new Date()): Promise<NotifyRetryJobResult> {
  const empty = { intentados: 0, enviados: 0, fallidos: 0 };
  if (!isDbReady()) return { skipped: 'db_unavailable', lock: 'unavailable', ...empty };
  const lock = await acquireLock(NOTIFY_RETRY_LOCK_KEY, LOCK_TTL_MS);
  if (lock.status === 'busy') return { skipped: 'lock_busy', lock: 'busy', ...empty };
  if (lock.status === 'unavailable') logger.warn('[notify-retry-job] Redis no disponible: se corre sin candado (cada canal se reclama antes de enviar)');

  const result: NotifyRetryJobResult = { lock: lock.status, ...empty };
  try {
    const since = new Date(now.getTime() - NOTIFY_RETRY_WINDOW_MS);
    for (const canal of NOTIFY_CHANNELS) {
      const p = `notificaciones.${canal}`;
      const candidatos = await Contact.find({
        created_at: { $gte: since },
        anonimizadoEn: null,
        [`${p}.estado`]: { $in: ['pendiente', 'fallido'] },
        [`${p}.proximoIntento`]: { $lte: now },
        [`${p}.intentos`]: { $lt: MAX_NOTIFY_ATTEMPTS },
      })
        .sort({ created_at: 1 })
        .select('_id')
        .limit(MAX_PER_RUN)
        .lean();
      for (const c of candidatos) {
        const out = await deliverContactNotifications(String(c._id), { canales: [canal as NotifyChannel], modo: 'reintento', now });
        const r = out[canal];
        if (!r || r.omitido) continue;
        result.intentados += 1;
        if (r.enviado) result.enviados += 1;
        else result.fallidos += 1;
      }
    }
    if (result.intentados) {
      logger.info(`[notify-retry-job] intentados=${result.intentados} enviados=${result.enviados} fallidos=${result.fallidos}`);
    }
    return result;
  } finally {
    if (lock.status === 'acquired') await releaseLock(NOTIFY_RETRY_LOCK_KEY, lock.token);
  }
}

let interval: NodeJS.Timeout | null = null;
let firstRun: NodeJS.Timeout | null = null;
let running = false;

async function tick(): Promise<void> {
  if (running) return;
  running = true;
  try {
    await runNotifyRetryJob();
  } catch (err) {
    logger.error(`[notify-retry-job] Error: ${(err as Error)?.message ?? err}`);
  } finally {
    running = false;
  }
}

/** Arranca el job (lo llama index.ts). No hace nada en pruebas ni si está apagado. */
export function startNotifyRetryJob(): boolean {
  if (interval || process.env.NODE_ENV === 'test' || !notifyJobsEnabled()) return false;
  firstRun = setTimeout(() => void tick(), FIRST_RUN_DELAY_MS);
  firstRun.unref();
  interval = setInterval(() => void tick(), NOTIFY_RETRY_INTERVAL_MS);
  interval.unref();
  logger.info('[notify-retry-job] Reintentos de avisos programados cada 5 min');
  return true;
}

export function stopNotifyRetryJob(): void {
  if (firstRun) clearTimeout(firstRun);
  if (interval) clearInterval(interval);
  firstRun = null;
  interval = null;
}
