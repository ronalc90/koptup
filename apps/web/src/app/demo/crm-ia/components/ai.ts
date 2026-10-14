/**
 * «Mejorar con IA» del asistente de redacción: la única parte de la demo que
 * llama a un modelo de lenguaje de verdad. Envía el borrador al endpoint
 * `/api/content/improve` del backend de KopTup (el mismo del gestor de
 * contenido), que tiene tope de gasto mensual y cupo por conexión. Envía la
 * sesión, si la hay, para que el equipo de KopTup no quede sujeto al cupo.
 * Si el servidor no responde, no tiene clave del modelo, agotó el presupuesto
 * o limita las solicitudes, se devuelve un error tipado para mostrar un
 * mensaje honesto; el resto de la demo no depende del servidor.
 */
import { authFetch } from '@/lib/auth-token';
import { BACKEND_URL } from '@/lib/backend-url';

export type AiErrorCode =
  | 'network'
  | 'timeout'
  | 'notConfigured'
  | 'unavailable'
  | 'budget'
  | 'rateLimited'
  | 'access'
  | 'invalid'
  | 'server';

export class AiError extends Error {
  constructor(public code: AiErrorCode) {
    super(code);
    this.name = 'AiError';
  }
}

/** Máximo de caracteres del borrador que se envían al modelo. */
export const AI_MAX_CHARS = 2000;
const TIMEOUT_MS = 45_000;

const BY_CODE: Record<string, AiErrorCode> = {
  rate_limited: 'rateLimited',
  budget_exhausted: 'budget',
  content_too_long: 'invalid',
  // Si el acceso a la IA se restringe (demo con solicitud o desactivada), para
  // quien usa el CRM es lo mismo: la IA no está abierta a visitantes.
  login_required: 'access',
  TOKEN_EXPIRED: 'access',
  demo_access_required: 'access',
  demo_disabled: 'access',
};

/** Motivo del error a partir del estado HTTP y del cuerpo `{ code, message }` del backend. */
export function classifyAiError(status: number, body: { code?: unknown; message?: unknown } | null): AiErrorCode {
  const code = typeof body?.code === 'string' ? body.code : '';
  const message = typeof body?.message === 'string' ? body.message : '';
  if (BY_CODE[code]) return BY_CODE[code];
  if (code === 'ai_unavailable' || status === 503) {
    return /configurad|OPENAI_API_KEY|not configured/i.test(message) ? 'notConfigured' : 'unavailable';
  }
  if (status === 429) return 'rateLimited';
  if (status === 401 || status === 403) return 'access';
  if (status === 400) return 'invalid';
  return 'server';
}

/** Pide al modelo una redacción mejorada del borrador (correo o WhatsApp). */
export async function improveDraft(text: string): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await authFetch(`${BACKEND_URL}/api/content/improve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text.slice(0, AI_MAX_CHARS), template: 'email' }),
      signal: ctrl.signal,
    });
  } catch (e) {
    throw new AiError((e as Error)?.name === 'AbortError' ? 'timeout' : 'network');
  } finally {
    clearTimeout(timer);
  }
  let data: { success?: boolean; code?: string; message?: string; data?: { content?: unknown } } | null = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  const content = data?.data?.content;
  if (!res.ok || typeof content !== 'string' || !content.trim()) {
    throw new AiError(res.ok ? 'server' : classifyAiError(res.status, data));
  }
  return content.trim();
}
