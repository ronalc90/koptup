/**
 * /api/linkedin-ads — generador de contenido de LinkedIn de la demo
 * /demo/linkedin-ads.
 *
 * POST /api/linkedin-ads/generate
 *   Política: staff o acceso a la demo `linkedin-ads` (requireStaffOrDemoAccess).
 *   Límites: 5 generaciones cada 10 minutos y 30 al día por cuenta (con
 *   sesión) o por IP (sin sesión), en Redis;
 *   tope mensual LINKEDIN_ADS_MONTHLY_BUDGET_USD (por defecto 20).
 *   Falla cerrada: sin OPENAI_API_KEY o sin Redis responde 503 honesto y la web
 *   sigue mostrando el generador local.
 *
 * Errores con el formato único `{ success: false, code, message }`:
 *   400 invalid_request · 429 rate_limited (con Retry-After) ·
 *   503 ai_not_configured (sin clave de OpenAI) · 503 budget_exhausted (cupo
 *   del mes agotado) · 503 limits_unavailable (Redis caído: no se puede medir
 *   el cupo, así que no se llama al modelo) · 502 llm_error / invalid_output.
 *
 * La web llama a través de su ruta `/api/linkedin-ads/generate` (proxy fino).
 * IP del visitante (solo cuenta sin sesión): si la petición trae `X-Internal-Key` igual a
 * INTERNAL_API_KEY, se usa `X-Client-IP` (la IP que vio el proxy de Next); si
 * no, `req.ip` (IP real según TRUST_PROXY_HOPS).
 */
import { Router, Request, Response } from 'express';
import { requireStaffOrDemoAccess } from '../middleware/access';
import { resolveClientIp } from '../middleware/client-ip';
import { consumeRateLimit, getBudgetStatus, recordSpend } from '../services/ai-budget.service';
import {
  GenerateRequestSchema,
  LinkedInAdsError,
  generateLinkedInPack,
} from '../services/linkedin-ads.service';
import { logger } from '../utils/logger';
import { sendError } from '../utils/http-error';
import { AuthRequest } from '../types';

const router = Router();

export const LINKEDIN_LIMITS = {
  perWindow: 5,
  windowSec: 10 * 60,
  perDay: 30,
} as const;

/** Mensajes de los 503: dicen qué pasó y que el generador local sigue disponible. */
export const LINKEDIN_UNAVAILABLE_MESSAGES = {
  ai_not_configured: 'La generación con IA no está configurada en este servidor. Usa el generador local.',
  budget_exhausted:
    'Alcanzamos el cupo mensual de generación con IA de esta demo; se renueva el día 1 de cada mes. Mientras tanto, usa el generador local.',
  limits_unavailable:
    'No pudimos verificar el cupo de uso de la IA en este momento, así que no la llamamos. Intenta de nuevo en unos minutos o usa el generador local.',
} as const;

function fail(res: Response, status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
  sendError(res, status, code, message, extra);
}

router.post('/generate', requireStaffOrDemoAccess('linkedin-ads'), async (req: Request, res: Response) => {
  const parsed = GenerateRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 400, 'invalid_request', 'Faltan campos requeridos o tienen un formato inválido: demo, angulo, tono.', {
      fields: parsed.error.issues.map((i) => i.path.join('.')).slice(0, 10),
    });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    fail(res, 503, 'ai_not_configured', LINKEDIN_UNAVAILABLE_MESSAGES.ai_not_configured);
    return;
  }

  const budget = await getBudgetStatus('linkedin-ads');
  if (!budget.available) {
    if (budget.reason === 'budget_exhausted') {
      fail(res, 503, 'budget_exhausted', LINKEDIN_UNAVAILABLE_MESSAGES.budget_exhausted);
    } else {
      fail(res, 503, 'limits_unavailable', LINKEDIN_UNAVAILABLE_MESSAGES.limits_unavailable);
    }
    return;
  }

  // Con sesión, el cupo es por cuenta (la demo es por solicitud: casi todo el
  // tráfico llega autenticado y, a través del proxy de Next sin
  // INTERNAL_API_KEY, la IP sería la de salida de Vercel, compartida). Sin
  // sesión (si el admin la deja pública), por IP del visitante.
  const authUser = (req as AuthRequest).user;
  const ip = authUser ? `user:${authUser.id}` : resolveClientIp(req);
  const [windowLimit, dayLimit] = await Promise.all([
    consumeRateLimit({ scope: 'linkedin-ads:10m', ip, limit: LINKEDIN_LIMITS.perWindow, windowSec: LINKEDIN_LIMITS.windowSec }),
    consumeRateLimit({ scope: 'linkedin-ads:day', ip, limit: LINKEDIN_LIMITS.perDay, windowSec: 24 * 60 * 60 }),
  ]);
  if (!windowLimit || !dayLimit) {
    fail(res, 503, 'limits_unavailable', LINKEDIN_UNAVAILABLE_MESSAGES.limits_unavailable);
    return;
  }
  if (!windowLimit.allowed || !dayLimit.allowed) {
    const retryAfter = !windowLimit.allowed ? windowLimit.retryAfterSec : dayLimit.retryAfterSec;
    res.setHeader('Retry-After', String(retryAfter));
    fail(res, 429, 'rate_limited', 'Llegaste al límite de generaciones con IA. Espera unos minutos y vuelve a intentarlo.', {
      retryAfterSec: retryAfter,
    });
    return;
  }

  try {
    const result = await generateLinkedInPack(parsed.data);
    await recordSpend('linkedin-ads', result.costUSD);
    res.json({ data: result.data, model: result.model, usage: result.usage });
  } catch (err) {
    const costUSD = (err as { costUSD?: number })?.costUSD;
    if (typeof costUSD === 'number') await recordSpend('linkedin-ads', costUSD);
    const code = err instanceof LinkedInAdsError ? err.code : 'llm_error';
    logger.warn(`[linkedin-ads] Generación fallida (${code}): ${(err as Error)?.message ?? err}`);
    fail(res, 502, code, 'No pudimos generar el contenido con IA. Intenta de nuevo o usa el generador local.');
  }
});

export default router;
