/**
 * demo-grants.job.ts — ciclo de vida de los accesos a demos.
 *
 * Cada DEMO_GRANTS_JOB_INTERVAL_MS (por defecto 1 hora; la primera corrida
 * ~30 s después de arrancar):
 *  1. Marca `expirado` los accesos `activo` cuyo `expiresAt` ya pasó.
 *  2. Si hay SMTP, envía UN recordatorio por persona con sus accesos que
 *     vencen en los próximos 3 días (cada acceso se "reclama" con una
 *     actualización condicionada a `recordatorioEnviadoEn: null`, así que dos
 *     corridas nunca envían el mismo recordatorio dos veces; si el envío
 *     falla, se libera para el siguiente intento). Sin SMTP no marca nada.
 *
 * Varias instancias: antes de correr toma un candado en Redis
 * (`jobs:demo-grants:lock`, SET NX con TTL). Si otra instancia lo tiene, se
 * salta la corrida. Si Redis no responde, corre igual: los pasos son
 * idempotentes por las actualizaciones condicionadas.
 *
 * La vigencia real NO depende de este job: GET /api/demo-access y el
 * middleware de las APIs comparan `expiresAt` con la hora en cada consulta.
 *
 * DEMO_GRANTS_JOB_ENABLED=false lo apaga en esa instancia.
 */
import mongoose from 'mongoose';
import DemoGrant, { type IDemoGrant } from '../models/DemoGrant';
import User from '../models/User';
import { GRANT_REMINDER_DAYS_BEFORE } from '../config/demos';
import { emailService } from '../services/email.service';
import { sendExpiryReminder } from '../services/demo-emails.service';
import { getCatalogMap } from '../services/demo-catalog.service';
import { acquireLock, releaseLock } from '../services/redis-lock.service';
import { isDbReady } from '../middleware/access';
import { logger } from '../utils/logger';

const DAY_MS = 24 * 60 * 60 * 1000;
export const DEMO_GRANTS_LOCK_KEY = 'jobs:demo-grants:lock';
const LOCK_TTL_MS = 10 * 60 * 1000;
const DEFAULT_INTERVAL_MS = 60 * 60 * 1000;
const FIRST_RUN_DELAY_MS = 30 * 1000;

export interface DemoGrantsJobResult {
  skipped?: 'lock_busy' | 'db_unavailable';
  lock: 'acquired' | 'unavailable' | 'busy';
  expirados: number;
  recordatorios: number;
  recordatoriosFallidos: number;
  smtp: boolean;
}

/** Una corrida del job (exportada para las pruebas y para ejecutarla a mano). */
export async function runDemoGrantsJob(now = new Date()): Promise<DemoGrantsJobResult> {
  const smtp = emailService.isConfigured();
  if (!isDbReady()) return { skipped: 'db_unavailable', lock: 'unavailable', expirados: 0, recordatorios: 0, recordatoriosFallidos: 0, smtp };

  const lock = await acquireLock(DEMO_GRANTS_LOCK_KEY, LOCK_TTL_MS);
  if (lock.status === 'busy') return { skipped: 'lock_busy', lock: 'busy', expirados: 0, recordatorios: 0, recordatoriosFallidos: 0, smtp };
  if (lock.status === 'unavailable') logger.warn('[demo-grants-job] Redis no disponible: se corre sin candado (los pasos son idempotentes)');

  try {
    // 1. Vencidos → expirado.
    const expired = await DemoGrant.updateMany(
      { estado: 'activo', expiresAt: { $lte: now } },
      { $set: { estado: 'expirado', expiradoEn: now } },
    );
    const expirados = expired.modifiedCount ?? 0;

    // 2. Recordatorio 3 días antes (solo con SMTP).
    let recordatorios = 0;
    let recordatoriosFallidos = 0;
    if (smtp) {
      const limite = new Date(now.getTime() + GRANT_REMINDER_DAYS_BEFORE * DAY_MS);
      const candidatos = await DemoGrant.find({
        estado: 'activo',
        expiresAt: { $gt: now, $lte: limite },
        recordatorioEnviadoEn: null,
      })
        .select('_id')
        .limit(500)
        .lean();

      const claimed: IDemoGrant[] = [];
      for (const c of candidatos) {
        const g = await DemoGrant.findOneAndUpdate(
          { _id: c._id, estado: 'activo', recordatorioEnviadoEn: null },
          { $set: { recordatorioEnviadoEn: now } },
          { new: true },
        );
        if (g) claimed.push(g);
      }

      const byUser = new Map<string, IDemoGrant[]>();
      for (const g of claimed) {
        const key = String(g.user);
        byUser.set(key, [...(byUser.get(key) ?? []), g]);
      }
      const catalog = await getCatalogMap(claimed.map((g) => g.demoSlug));
      for (const [userId, grants] of byUser) {
        const ids = grants.map((g) => g._id as mongoose.Types.ObjectId);
        const user = await User.findById(userId).select('email name accountStatus').lean();
        let sent = false;
        if (user) {
          sent = await sendExpiryReminder({
            to: user.email,
            nombre: user.name,
            demos: grants.map((g) => ({ slug: g.demoSlug, nombre: catalog.get(g.demoSlug)?.nombre ?? g.demoSlug, expiresAt: g.expiresAt })),
            pendienteActivacion: user.accountStatus === 'invitado',
          }).catch(() => false);
        }
        if (sent) {
          recordatorios += 1;
        } else {
          recordatoriosFallidos += 1;
          // Se libera para reintentar en la siguiente corrida.
          await DemoGrant.updateMany({ _id: { $in: ids }, recordatorioEnviadoEn: now }, { $set: { recordatorioEnviadoEn: null } });
        }
      }
    }

    if (expirados || recordatorios || recordatoriosFallidos) {
      logger.info(`[demo-grants-job] expirados=${expirados} recordatorios=${recordatorios} fallidos=${recordatoriosFallidos}`);
    }
    return { lock: lock.status, expirados, recordatorios, recordatoriosFallidos, smtp };
  } finally {
    if (lock.status === 'acquired') await releaseLock(DEMO_GRANTS_LOCK_KEY, lock.token);
  }
}

let interval: NodeJS.Timeout | null = null;
let firstRun: NodeJS.Timeout | null = null;
let running = false;

async function tick(): Promise<void> {
  if (running) return;
  running = true;
  try {
    await runDemoGrantsJob();
  } catch (err) {
    logger.error(`[demo-grants-job] Error: ${(err as Error)?.message ?? err}`);
  } finally {
    running = false;
  }
}

/** Arranca el job (lo llama index.ts). No hace nada en pruebas ni si está apagado. */
export function startDemoGrantsJob(): boolean {
  if (interval || process.env.NODE_ENV === 'test' || process.env.DEMO_GRANTS_JOB_ENABLED === 'false') return false;
  const configured = Number(process.env.DEMO_GRANTS_JOB_INTERVAL_MS);
  const every = Number.isFinite(configured) && configured >= 60_000 ? configured : DEFAULT_INTERVAL_MS;
  firstRun = setTimeout(() => void tick(), Math.min(FIRST_RUN_DELAY_MS, every));
  firstRun.unref();
  interval = setInterval(() => void tick(), every);
  interval.unref();
  logger.info(`[demo-grants-job] Programado cada ${Math.round(every / 60000)} min`);
  return true;
}

export function stopDemoGrantsJob(): void {
  if (firstRun) clearTimeout(firstRun);
  if (interval) clearInterval(interval);
  firstRun = null;
  interval = null;
}
