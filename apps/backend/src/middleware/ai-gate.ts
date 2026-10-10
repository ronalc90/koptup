/**
 * ai-gate.ts — antes de un endpoint que llama a la IA (gestor de documentos y
 * APIs de salud): tope mensual de la función y cupo diario por usuario.
 *
 *  - Tope mensual (DOCUMENTS_MONTHLY_BUDGET_USD / HEALTH_MONTHLY_BUDGET_USD):
 *    si se agotó, o si Redis no responde (no se puede medir), 503.
 *  - Cupo diario por usuario (DOCUMENTS_AI_DAILY_LIMIT_PER_USER /
 *    HEALTH_AI_DAILY_LIMIT_PER_USER): cada petición con IA descuenta uno; al
 *    agotarlo, 429 con Retry-After. El equipo de KopTup (rol de staff leído de
 *    la BD) no tiene cupo por usuario, solo el tope mensual. Sin sesión, el
 *    cupo es por IP.
 *
 * Es la barrera "amable" (mensaje claro antes de procesar). La barrera dura es
 * el cliente de OpenAI de la función (services/openai.service.ts:
 * `getOpenAIFor`), que rechaza cualquier llamada con el tope agotado y suma el
 * costo real de cada respuesta.
 *
 * Modo `degrade`: en vez de responder el error, marca `req.aiGate.allowed =
 * false` y sigue; el controlador hace su trabajo sin IA (p. ej. guarda el
 * documento sin análisis) y lo dice en la respuesta.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { consumeRateLimit, getBudgetStatus, getUserDailyLimit, type UserLimitedFeature } from '../services/ai-budget.service';
import type { AuthRequest } from '../types';
import { isStaffSession } from './access';
import { resolveClientIp } from './client-ip';

export type AiGateDecision = NonNullable<AuthRequest['aiGate']>;

export const AI_GATE_MESSAGES = {
  budget_exhausted: 'Alcanzamos el cupo mensual de IA de esta función. Escríbenos y te ayudamos con tu caso.',
  ai_unavailable: 'La IA no está disponible en este momento. Intenta de nuevo en unos minutos.',
  ai_user_limit: 'Llegaste al límite diario de solicitudes con IA de tu cuenta. Vuelve a intentarlo mañana.',
} as const;

const DAY_SECONDS = 24 * 60 * 60;

async function isExempt(req: AuthRequest): Promise<boolean> {
  if (req.demoAccess?.reason === 'staff') return true;
  return isStaffSession(req);
}

export function aiGate(feature: UserLimitedFeature, options: { mode?: 'block' | 'degrade' } = {}): RequestHandler {
  const mode = options.mode ?? 'block';
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    const deny = (status: number, code: NonNullable<AiGateDecision['code']>, retryAfterSec?: number) => {
      if (mode === 'degrade') {
        authReq.aiGate = { allowed: false, code, message: AI_GATE_MESSAGES[code] };
        next();
        return;
      }
      if (retryAfterSec) res.setHeader('Retry-After', String(retryAfterSec));
      res.status(status).json({ success: false, code, message: AI_GATE_MESSAGES[code] });
    };

    try {
      const budget = await getBudgetStatus(feature);
      if (!budget.available) {
        deny(503, budget.reason === 'budget_exhausted' ? 'budget_exhausted' : 'ai_unavailable');
        return;
      }

      if (!(await isExempt(authReq))) {
        const key = authReq.user?.id ? `user:${authReq.user.id}` : `ip:${resolveClientIp(req)}`;
        const quota = await consumeRateLimit({ scope: `${feature}-ai:day`, ip: key, limit: getUserDailyLimit(feature), windowSec: DAY_SECONDS });
        if (!quota) {
          deny(503, 'ai_unavailable');
          return;
        }
        if (!quota.allowed) {
          deny(429, 'ai_user_limit', quota.retryAfterSec);
          return;
        }
      }

      authReq.aiGate = { allowed: true };
      next();
    } catch (err) {
      next(err);
    }
  };
}
