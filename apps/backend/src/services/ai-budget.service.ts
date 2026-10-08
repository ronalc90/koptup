/**
 * ai-budget.service.ts — topes de gasto mensual de IA y rate-limit en Redis.
 *
 * Infraestructura compartida por todas las funciones que llaman a OpenAI desde
 * endpoints alcanzables por visitantes:
 *
 *  | Función        | Variable                         | Por defecto | Clave Redis                    |
 *  |----------------|----------------------------------|-------------|--------------------------------|
 *  | demo-rag       | DEMO_MONTHLY_BUDGET_USD          | 50          | demo-rag:spend:YYYY-MM         |
 *  | chatbot        | CHATBOT_MONTHLY_BUDGET_USD       | 50          | chatbot:spend:YYYY-MM          |
 *  | linkedin-ads   | LINKEDIN_ADS_MONTHLY_BUDGET_USD  | 20          | linkedin-ads:spend:YYYY-MM     |
 *  | content        | CONTENT_MONTHLY_BUDGET_USD       | 20          | content:spend:YYYY-MM          |
 *
 * - El gasto se acumula por mes UTC (como factura OpenAI) con INCRBYFLOAT y
 *   se calcula con los tokens que informa el proveedor.
 * - Falla cerrada: si Redis no responde, `getBudgetStatus` devuelve
 *   `unavailable` y el llamador NO debe llamar al modelo (cada función decide
 *   cómo degradar: 503 honesto o modo sin IA).
 * - Un valor inválido o negativo del tope deja la función sin presupuesto (0).
 */
import crypto from 'crypto';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

export type BudgetFeature = 'demo-rag' | 'chatbot' | 'linkedin-ads' | 'content';

interface FeatureBudgetDef {
  envVar: string;
  defaultUSD: number;
}

export const BUDGET_FEATURES: Readonly<Record<BudgetFeature, FeatureBudgetDef>> = {
  'demo-rag': { envVar: 'DEMO_MONTHLY_BUDGET_USD', defaultUSD: 50 },
  chatbot: { envVar: 'CHATBOT_MONTHLY_BUDGET_USD', defaultUSD: 50 },
  'linkedin-ads': { envVar: 'LINKEDIN_ADS_MONTHLY_BUDGET_USD', defaultUSD: 20 },
  content: { envVar: 'CONTENT_MONTHLY_BUDGET_USD', defaultUSD: 20 },
};

const REDIS_OP_TIMEOUT_MS = 3000;
const REDIS_CONNECT_TIMEOUT_MS = 7000;
/** Tras un fallo de conexión a Redis, no reintentar durante 30 s. */
const REDIS_RETRY_COOLDOWN_MS = 30 * 1000;
const DAY_SECONDS = 24 * 60 * 60;
/** El gasto de cada mes se conserva ~2 meses para consulta y luego expira. */
const SPEND_KEY_TTL_SECONDS = 62 * DAY_SECONDS;

export type RedisClient = Awaited<ReturnType<typeof getRedisClient>>;

let redisRetryAfter = 0;
const warnedInvalidBudget = new Set<BudgetFeature>();

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label}: timeout de ${ms} ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * Espera el evento `ready` de un cliente que ya abrió la conexión pero aún no
 * terminó el saludo con Redis (pasa al arrancar: `getRedisClient` devuelve el
 * cliente apenas está abierto). Sin esta espera, la primera consulta del
 * arranque caía en el enfriamiento de 30 s y las funciones con IA se veían
 * "no disponibles" justo después de cada despliegue.
 */
async function waitUntilReady(client: RedisClient, ms: number): Promise<void> {
  if (client.isReady) return;
  let onReady: (() => void) | undefined;
  try {
    await withTimeout(
      new Promise<void>((resolve) => {
        onReady = resolve;
        client.once('ready', resolve);
      }),
      ms,
      'Redis ready',
    );
  } finally {
    if (onReady) client.off('ready', onReady);
  }
}

/** Cliente de Redis listo, o null si no hay conexión (falla cerrada). */
export async function getReadyRedis(): Promise<RedisClient | null> {
  if (Date.now() < redisRetryAfter) return null;
  try {
    const client = await withTimeout(getRedisClient(), REDIS_CONNECT_TIMEOUT_MS, 'Redis connect');
    await waitUntilReady(client, REDIS_CONNECT_TIMEOUT_MS);
    if (!client.isReady) throw new Error('Redis no está listo');
    return client;
  } catch (err) {
    redisRetryAfter = Date.now() + REDIS_RETRY_COOLDOWN_MS;
    logger.warn(`[ai-budget] Redis no disponible: ${(err as Error)?.message ?? err}`);
    return null;
  }
}

/** Solo pruebas: permite reintentar Redis de inmediato. */
export function resetRedisCooldownForTests(): void {
  redisRetryAfter = 0;
}

/** Tope mensual en USD de la función (variable de entorno o valor por defecto). */
export function getMonthlyBudgetUSD(feature: BudgetFeature): number {
  const def = BUDGET_FEATURES[feature];
  const raw = process.env[def.envVar];
  if (raw === undefined || raw.trim() === '') return def.defaultUSD;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    if (!warnedInvalidBudget.has(feature)) {
      logger.warn(`[ai-budget] ${def.envVar} inválido; se usa 0 (función sin presupuesto).`);
      warnedInvalidBudget.add(feature);
    }
    return 0;
  }
  return value;
}

/** Clave del gasto del mes (UTC): `<feature>:spend:YYYY-MM`. */
export function spendKey(feature: BudgetFeature, now = new Date()): string {
  return `${feature}:spend:${now.toISOString().slice(0, 7)}`;
}

export async function readMonthlySpend(client: RedisClient, feature: BudgetFeature): Promise<number> {
  const raw = await withTimeout(client.get(spendKey(feature)), REDIS_OP_TIMEOUT_MS, 'Redis GET spend');
  const value = raw ? Number(raw) : 0;
  return Number.isFinite(value) ? value : 0;
}

export type BudgetUnavailableReason = 'unavailable' | 'budget_exhausted';

export interface BudgetStatus {
  /** true si se puede llamar al modelo. */
  available: boolean;
  reason: BudgetUnavailableReason | null;
}

/**
 * ¿Queda presupuesto este mes? Nunca expone montos.
 *  - `unavailable`: Redis no responde (no se puede medir el gasto).
 *  - `budget_exhausted`: el gasto del mes alcanzó el tope.
 */
export async function getBudgetStatus(feature: BudgetFeature): Promise<BudgetStatus> {
  const client = await getReadyRedis();
  if (!client) return { available: false, reason: 'unavailable' };
  let spend: number;
  try {
    spend = await readMonthlySpend(client, feature);
  } catch (err) {
    logger.warn(`[ai-budget] No se pudo leer el gasto de ${feature}: ${(err as Error)?.message ?? err}`);
    return { available: false, reason: 'unavailable' };
  }
  if (spend >= getMonthlyBudgetUSD(feature)) return { available: false, reason: 'budget_exhausted' };
  return { available: true, reason: null };
}

/** Suma el costo de una llamada al gasto del mes de la función. */
export async function recordSpend(feature: BudgetFeature, usd: number): Promise<void> {
  if (!(usd > 0)) return;
  const client = await getReadyRedis();
  if (!client) {
    logger.error(`[ai-budget] No se pudo registrar un gasto de ${feature} (USD ${usd}): Redis no disponible.`);
    return;
  }
  const key = spendKey(feature);
  try {
    await withTimeout(
      client.multi().incrByFloat(key, usd).expire(key, SPEND_KEY_TTL_SECONDS).exec(),
      REDIS_OP_TIMEOUT_MS,
      'Redis INCRBYFLOAT spend',
    );
  } catch (err) {
    logger.error(`[ai-budget] No se pudo registrar un gasto de ${feature} (USD ${usd}): ${(err as Error)?.message ?? err}`);
  }
}

// ---------------------------------------------------------------------------
//   Rate-limit por IP en Redis (ventana fija)
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

/** Hash de la IP: el contador solo necesita distinguir visitantes. */
export function hashIp(scope: string, ip: string): string {
  return crypto.createHash('sha256').update(`${scope}:${ip}`).digest('hex').slice(0, 32);
}

/**
 * Cuenta una petición del visitante en la ventana actual (INCR + EXPIRE en una
 * transacción). Devuelve null si Redis no responde: el llamador decide si
 * falla cerrado (lo normal en endpoints que gastan dinero).
 */
export async function consumeRateLimit(args: {
  scope: string;
  ip: string;
  limit: number;
  windowSec: number;
}): Promise<RateLimitResult | null> {
  const client = await getReadyRedis();
  if (!client) return null;
  const windowStart = Math.floor(Date.now() / 1000 / args.windowSec);
  const key = `rl:${args.scope}:${windowStart}:${hashIp(args.scope, args.ip)}`;
  try {
    const replies = await withTimeout(
      client.multi().incr(key).expire(key, args.windowSec).exec(),
      REDIS_OP_TIMEOUT_MS,
      'Redis INCR rate limit',
    );
    const count = Number(replies?.[0]);
    if (!Number.isFinite(count)) return null;
    const retryAfterSec = args.windowSec - (Math.floor(Date.now() / 1000) % args.windowSec);
    return {
      allowed: count <= args.limit,
      remaining: Math.max(0, args.limit - count),
      retryAfterSec,
    };
  } catch (err) {
    logger.warn(`[ai-budget] Rate-limit ${args.scope} sin Redis: ${(err as Error)?.message ?? err}`);
    return null;
  }
}
