/**
 * request-limits.service.ts — cupos por ventana de tiempo para formularios
 * públicos (p. ej. "Solicitar demo").
 *
 * Usa Redis (compartido entre instancias, `consumeRateLimit`); si Redis no
 * responde, cae a un contador en memoria del proceso para no dejar el
 * formulario sin límite ni bloquear a los visitantes reales.
 */
import { consumeRateLimit } from './ai-budget.service';

export interface LimitResult {
  allowed: boolean;
  retryAfterSec: number;
  /** `redis` o `memoria` (respaldo). */
  store: 'redis' | 'memoria';
}

const memory = new Map<string, { count: number; resetAt: number }>();
const MEMORY_MAX_KEYS = 10_000;

function consumeInMemory(key: string, limit: number, windowSec: number, now = Date.now()): LimitResult {
  const hit = memory.get(key);
  if (!hit || hit.resetAt <= now) {
    if (memory.size >= MEMORY_MAX_KEYS) {
      for (const [k, v] of memory) if (v.resetAt <= now) memory.delete(k);
      if (memory.size >= MEMORY_MAX_KEYS) memory.clear();
    }
    memory.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { allowed: 1 <= limit, retryAfterSec: windowSec, store: 'memoria' };
  }
  hit.count += 1;
  return { allowed: hit.count <= limit, retryAfterSec: Math.max(1, Math.ceil((hit.resetAt - now) / 1000)), store: 'memoria' };
}

export async function consumeLimit(args: { scope: string; key: string; limit: number; windowSec: number }): Promise<LimitResult> {
  const redisResult = await consumeRateLimit({ scope: args.scope, ip: args.key, limit: args.limit, windowSec: args.windowSec });
  if (redisResult) return { allowed: redisResult.allowed, retryAfterSec: redisResult.retryAfterSec, store: 'redis' };
  return consumeInMemory(`${args.scope}:${args.key}`, args.limit, args.windowSec);
}

/** Lee un entero positivo de una variable de entorno (o el valor por defecto). */
export function envLimit(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}
