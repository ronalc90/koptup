/**
 * Clasifica la respuesta de error de «Generar con IA» para mostrar un mensaje
 * claro. La API responde con el formato único `{ success: false, code,
 * message }` (ver apps/backend/src/utils/http-error.ts y la ruta
 * apps/backend/src/routes/linkedin-ads.routes.ts); se lee primero `code` y,
 * si no viene (respuestas antiguas), el estado HTTP y el campo `error`.
 */

export type MotivoIA =
  | 'budget'
  | 'notConfigured'
  | 'rateLimited'
  | 'limitsUnavailable'
  | 'login'
  | 'access'
  | 'disabled'
  | 'unavailable'
  | 'llm'
  | 'invalid'
  | 'badRequest'
  | 'network'
  | 'generic';

export interface ErrorIA {
  motivo: MotivoIA;
  /** Minutos para volver a intentar (solo con `rateLimited`, si el servidor lo dice). */
  minutos?: number;
}

export interface CuerpoError {
  code?: unknown;
  message?: unknown;
  error?: unknown;
  retryAfterSec?: unknown;
}

const POR_CODIGO: Record<string, MotivoIA> = {
  budget_exhausted: 'budget',
  ai_not_configured: 'notConfigured',
  rate_limited: 'rateLimited',
  limits_unavailable: 'limitsUnavailable',
  login_required: 'login',
  unauthorized: 'login',
  session_invalid: 'login',
  TOKEN_EXPIRED: 'login',
  demo_access_required: 'access',
  forbidden: 'access',
  demo_disabled: 'disabled',
  service_unavailable: 'unavailable',
  unexpected_response: 'unavailable',
  bad_gateway: 'unavailable',
  timeout: 'unavailable',
  llm_error: 'llm',
  invalid_output: 'invalid',
  invalid_request: 'badRequest',
  bad_request: 'badRequest',
  payload_too_large: 'badRequest',
};

function minutosDe(status: number, cuerpo: CuerpoError | null, retryAfter: string | null): number | undefined {
  const deCuerpo = typeof cuerpo?.retryAfterSec === 'number' ? cuerpo.retryAfterSec : NaN;
  const deCabecera = retryAfter !== null ? Number(retryAfter) : NaN;
  const segundos = Number.isFinite(deCuerpo) ? deCuerpo : deCabecera;
  if (!Number.isFinite(segundos) || segundos <= 0 || status !== 429) return undefined;
  return Math.max(1, Math.ceil(segundos / 60));
}

/** Motivo del error a partir del estado HTTP y del cuerpo JSON (si lo hay). */
export function clasificarErrorIA(status: number, cuerpo: CuerpoError | null, retryAfter: string | null = null): ErrorIA {
  const code = typeof cuerpo?.code === 'string' ? cuerpo.code : '';
  let motivo: MotivoIA | undefined = POR_CODIGO[code];
  if (!motivo) {
    const texto = `${typeof cuerpo?.error === 'string' ? cuerpo.error : ''} ${typeof cuerpo?.message === 'string' ? cuerpo.message : ''}`;
    if (status === 429) motivo = 'rateLimited';
    else if (status === 402) motivo = 'budget';
    else if (status === 401) motivo = 'login';
    else if (status === 403) motivo = 'access';
    else if (status === 400 || status === 413) motivo = 'badRequest';
    else if (status === 503 && /OPENAI_API_KEY|no est[aá] configurada/i.test(texto)) motivo = 'notConfigured';
    else if (status === 503 && /cupo mensual|presupuesto/i.test(texto)) motivo = 'budget';
    else if (status === 502 || status === 503 || status === 504) motivo = 'unavailable';
    else motivo = 'generic';
  }
  return { motivo, minutos: motivo === 'rateLimited' ? minutosDe(status, cuerpo, retryAfter) : undefined };
}

/** ¿El error es una sesión vencida que se puede renovar y reintentar? */
export function esSesionVencida(status: number, cuerpo: CuerpoError | null): boolean {
  return status === 401 && cuerpo?.code === 'TOKEN_EXPIRED';
}
