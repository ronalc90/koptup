/**
 * redis-lock.service.ts — candado distribuido simple en Redis
 * (SET NX PX + liberación solo por el dueño), para que un job periódico no
 * corra a la vez en varias instancias del backend.
 */
import crypto from 'crypto';
import { getReadyRedis, withTimeout } from './ai-budget.service';
import { logger } from '../utils/logger';

const OP_TIMEOUT_MS = 3000;

export type LockResult =
  | { status: 'acquired'; token: string }
  | { status: 'busy' }
  | { status: 'unavailable' };

export async function acquireLock(key: string, ttlMs: number): Promise<LockResult> {
  const client = await getReadyRedis();
  if (!client) return { status: 'unavailable' };
  const token = crypto.randomBytes(16).toString('hex');
  try {
    const reply = await withTimeout(client.set(key, token, { NX: true, PX: ttlMs }), OP_TIMEOUT_MS, 'Redis SET NX lock');
    return reply === 'OK' ? { status: 'acquired', token } : { status: 'busy' };
  } catch (err) {
    logger.warn(`[lock] No se pudo tomar ${key}: ${(err as Error)?.message ?? err}`);
    return { status: 'unavailable' };
  }
}

const RELEASE_SCRIPT = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";

export async function releaseLock(key: string, token: string): Promise<void> {
  const client = await getReadyRedis();
  if (!client) return;
  try {
    await withTimeout(client.eval(RELEASE_SCRIPT, { keys: [key], arguments: [token] }), OP_TIMEOUT_MS, 'Redis release lock');
  } catch (err) {
    logger.warn(`[lock] No se pudo liberar ${key}: ${(err as Error)?.message ?? err}`);
  }
}
