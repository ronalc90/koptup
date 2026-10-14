/**
 * Asistente de redacción con IA real: llama a los endpoints `/api/content/*`
 * del backend de KopTup, que a su vez llaman a un modelo de lenguaje. Envía la
 * sesión (si hay) para que la demo siga funcionando cuando el admin la pase a
 * «Con solicitud» o «Solo por invitación», y para que el equipo de KopTup no
 * quede sujeto al cupo por conexión. Si el servidor no responde, no tiene clave
 * del modelo, agotó el presupuesto o limita las solicitudes, se devuelve un
 * error tipado para mostrar un mensaje honesto.
 */
import { authFetch } from '@/lib/auth-token';
import { BACKEND_URL } from '@/lib/backend-url';

export type AiTone = 'formal' | 'técnico' | 'persuasivo';
export const AI_TONES: AiTone[] = ['formal', 'técnico', 'persuasivo'];
export type AiErrorCode =
  | 'network'
  | 'timeout'
  | 'notConfigured'
  | 'unavailable'
  | 'budget'
  | 'rateLimited'
  | 'login'
  | 'access'
  | 'disabled'
  | 'invalid'
  | 'server';

export class AiError extends Error {
  constructor(public code: AiErrorCode) {
    super(code);
    this.name = 'AiError';
  }
}

/** Máximo de caracteres que se envían al modelo desde la demo. */
export const AI_MAX_CHARS = 2000;
const TIMEOUT_MS = 60_000;
// El backend ajusta el prompt según el contexto; "product" (texto de marketing)
// es el más cercano a fichas de sedes, servicios y artículos.
const TEMPLATE = 'product';

const BY_CODE: Record<string, AiErrorCode> = {
  rate_limited: 'rateLimited',
  budget_exhausted: 'budget',
  content_too_long: 'invalid',
  login_required: 'login',
  TOKEN_EXPIRED: 'login',
  demo_access_required: 'access',
  demo_disabled: 'disabled',
};

/**
 * Motivo del error a partir del estado HTTP y del cuerpo `{ code, message }`
 * que responde el backend (ver apps/backend/src/routes/content-manager.routes.ts
 * y el middleware de acceso a demos).
 */
export function classifyAiError(status: number, body: { code?: unknown; message?: unknown } | null): AiErrorCode {
  const code = typeof body?.code === 'string' ? body.code : '';
  const message = typeof body?.message === 'string' ? body.message : '';
  if (BY_CODE[code]) return BY_CODE[code];
  if (code === 'ai_unavailable' || status === 503) {
    return /configurad|OPENAI_API_KEY|not configured/i.test(message) ? 'notConfigured' : 'unavailable';
  }
  if (status === 429) return 'rateLimited';
  if (status === 401) return 'login';
  if (status === 403) return 'access';
  if (status === 400) return 'invalid';
  return 'server';
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await authFetch(`${BACKEND_URL}/api/content/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, template: TEMPLATE }),
      signal: ctrl.signal,
    });
  } catch (e) {
    throw new AiError((e as Error)?.name === 'AbortError' ? 'timeout' : 'network');
  } finally {
    clearTimeout(timer);
  }
  let data: { success?: boolean; code?: string; message?: string; data?: T } | null = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok || !data?.data) throw new AiError(res.ok ? 'server' : classifyAiError(res.status, data));
  return data.data;
}

const clip = (s: string) => s.slice(0, AI_MAX_CHARS);

export async function improve(text: string): Promise<string> {
  return (await post<{ content: string }>('improve', { content: clip(text) })).content;
}

export async function changeTone(text: string, tone: AiTone): Promise<string> {
  return (await post<{ content: string }>('change-tone', { content: clip(text), tone })).content;
}

export async function adjustLength(text: string, targetWords: number): Promise<string> {
  return (await post<{ content: string }>('adjust-length', { content: clip(text), targetWords: Math.max(10, Math.round(targetWords)) })).content;
}

export interface AiVersion {
  content: string;
  tone: AiTone;
}

export async function versions(text: string): Promise<AiVersion[]> {
  const r = await post<{ versions: { content: string; tone: AiTone }[] }>('generate-versions', { content: clip(text), numVersions: 3 });
  return r.versions.map((v) => ({ content: v.content, tone: v.tone }));
}
