/**
 * proposals-expiry.job.ts — marca `vencida` las propuestas enviadas o vistas
 * cuya validez (`validaHasta`) pasó, y lo deja en la línea de tiempo del lead.
 *
 * Igual que el job de accesos a demos: candado en Redis
 * (`jobs:proposals-expiry:lock`, SET NX con TTL) para que con varias
 * instancias corra una sola; si Redis no responde corre igual (la
 * actualización está condicionada al estado: es idempotente).
 *
 * La vigencia real NO depende del job: ver, aceptar o rechazar una propuesta
 * compara `validaHasta` con la hora en cada petición.
 *
 * PROPOSALS_JOB_ENABLED=false lo apaga en esa instancia;
 * PROPOSALS_JOB_INTERVAL_MS cambia la frecuencia (por defecto 1 hora).
 */
import { expireProposals } from '../services/proposals.service';
import { acquireLock, releaseLock } from '../services/redis-lock.service';
import { isDbReady } from '../middleware/access';
import { logger } from '../utils/logger';

export const PROPOSALS_EXPIRY_LOCK_KEY = 'jobs:proposals-expiry:lock';
const LOCK_TTL_MS = 10 * 60 * 1000;
const DEFAULT_INTERVAL_MS = 60 * 60 * 1000;
const FIRST_RUN_DELAY_MS = 45 * 1000;

export interface ProposalsExpiryJobResult {
  skipped?: 'lock_busy' | 'db_unavailable';
  lock: 'acquired' | 'unavailable' | 'busy';
  vencidas: number;
}

export async function runProposalsExpiryJob(now = new Date()): Promise<ProposalsExpiryJobResult> {
  if (!isDbReady()) return { skipped: 'db_unavailable', lock: 'unavailable', vencidas: 0 };
  const lock = await acquireLock(PROPOSALS_EXPIRY_LOCK_KEY, LOCK_TTL_MS);
  if (lock.status === 'busy') return { skipped: 'lock_busy', lock: 'busy', vencidas: 0 };
  if (lock.status === 'unavailable') logger.warn('[proposals-job] Redis no disponible: se corre sin candado (es idempotente)');
  try {
    const vencidas = await expireProposals(now);
    if (vencidas) logger.info(`[proposals-job] vencidas=${vencidas}`);
    return { lock: lock.status, vencidas };
  } finally {
    if (lock.status === 'acquired') await releaseLock(PROPOSALS_EXPIRY_LOCK_KEY, lock.token);
  }
}

let interval: NodeJS.Timeout | null = null;
let firstRun: NodeJS.Timeout | null = null;
let running = false;

async function tick(): Promise<void> {
  if (running) return;
  running = true;
  try {
    await runProposalsExpiryJob();
  } catch (err) {
    logger.error(`[proposals-job] Error: ${(err as Error)?.message ?? err}`);
  } finally {
    running = false;
  }
}

/** Arranca el job (lo llama index.ts). No hace nada en pruebas ni si está apagado. */
export function startProposalsExpiryJob(): boolean {
  if (interval || process.env.NODE_ENV === 'test' || process.env.PROPOSALS_JOB_ENABLED === 'false') return false;
  const configured = Number(process.env.PROPOSALS_JOB_INTERVAL_MS);
  const every = Number.isFinite(configured) && configured >= 60_000 ? configured : DEFAULT_INTERVAL_MS;
  firstRun = setTimeout(() => void tick(), Math.min(FIRST_RUN_DELAY_MS, every));
  firstRun.unref();
  interval = setInterval(() => void tick(), every);
  interval.unref();
  logger.info(`[proposals-job] Programado cada ${Math.round(every / 60000)} min`);
  return true;
}

export function stopProposalsExpiryJob(): void {
  if (firstRun) clearTimeout(firstRun);
  if (interval) clearInterval(interval);
  firstRun = null;
  interval = null;
}
