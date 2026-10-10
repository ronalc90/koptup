/**
 * retention.job.ts — plazo de conservación de datos personales (Ley 1581).
 *
 * Una vez al día (RETENTION_JOB_INTERVAL_MS; la primera corrida ~2 min
 * después de arrancar) aplica services/retention.service.ts: anonimiza las
 * solicitudes de demo rechazadas y los prospectos sin actividad pasado
 * DATA_RETENTION_MONTHS (24 meses por defecto) y borra los bots del chatbot
 * sin uso.
 *
 * Igual que los otros jobs: candado en Redis (`jobs:retention:lock`, SET NX
 * con TTL) para que con varias instancias corra una sola; si Redis no
 * responde corre igual (cada paso es idempotente). RETENTION_JOB_ENABLED=false
 * lo apaga en esa instancia.
 */
import { applyRetention, retentionMonths, type RetentionResult } from '../services/retention.service';
import { acquireLock, releaseLock } from '../services/redis-lock.service';
import { isDbReady } from '../middleware/access';
import { logger } from '../utils/logger';

export { retentionMonths };

export const RETENTION_LOCK_KEY = 'jobs:retention:lock';
const LOCK_TTL_MS = 30 * 60 * 1000;
const DEFAULT_INTERVAL_MS = 24 * 60 * 60 * 1000;
const FIRST_RUN_DELAY_MS = 2 * 60 * 1000;

export interface RetentionJobResult {
  skipped?: 'lock_busy' | 'db_unavailable';
  lock: 'acquired' | 'unavailable' | 'busy';
  result?: RetentionResult;
}

export async function runRetentionJob(now = new Date()): Promise<RetentionJobResult> {
  if (!isDbReady()) return { skipped: 'db_unavailable', lock: 'unavailable' };
  const lock = await acquireLock(RETENTION_LOCK_KEY, LOCK_TTL_MS);
  if (lock.status === 'busy') return { skipped: 'lock_busy', lock: 'busy' };
  if (lock.status === 'unavailable') logger.warn('[retention-job] Redis no disponible: se corre sin candado (es idempotente)');
  try {
    const result = await applyRetention(now);
    if (Object.values(result).some((n) => n > 0)) logger.info(`[retention-job] ${JSON.stringify(result)}`);
    return { lock: lock.status, result };
  } finally {
    if (lock.status === 'acquired') await releaseLock(RETENTION_LOCK_KEY, lock.token);
  }
}

let interval: NodeJS.Timeout | null = null;
let firstRun: NodeJS.Timeout | null = null;
let running = false;

async function tick(): Promise<void> {
  if (running) return;
  running = true;
  try {
    await runRetentionJob();
  } catch (err) {
    logger.error(`[retention-job] Error: ${(err as Error)?.message ?? err}`);
  } finally {
    running = false;
  }
}

/** Arranca el job (lo llama index.ts). No hace nada en pruebas ni si está apagado. */
export function startRetentionJob(): boolean {
  if (interval || process.env.NODE_ENV === 'test' || process.env.RETENTION_JOB_ENABLED === 'false') return false;
  const configured = Number(process.env.RETENTION_JOB_INTERVAL_MS);
  const every = Number.isFinite(configured) && configured >= 60_000 ? configured : DEFAULT_INTERVAL_MS;
  firstRun = setTimeout(() => void tick(), Math.min(FIRST_RUN_DELAY_MS, every));
  firstRun.unref();
  interval = setInterval(() => void tick(), every);
  interval.unref();
  logger.info(`[retention-job] Programado cada ${Math.round(every / 60000)} min (conservación: ${retentionMonths()} meses)`);
  return true;
}

export function stopRetentionJob(): void {
  if (firstRun) clearTimeout(firstRun);
  if (interval) clearInterval(interval);
  firstRun = null;
  interval = null;
}
