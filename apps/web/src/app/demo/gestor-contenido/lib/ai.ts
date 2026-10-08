/**
 * Asistente de redacción con IA real: llama a los endpoints `/api/content/*`
 * del backend de KopTup, que a su vez llaman a un modelo de lenguaje. Si el
 * servidor no responde, no tiene clave del modelo o limita las solicitudes,
 * se devuelve un error tipado para mostrar un mensaje honesto.
 */
import { BACKEND_URL } from '@/lib/backend-url';

export type AiTone = 'formal' | 'técnico' | 'persuasivo';
export const AI_TONES: AiTone[] = ['formal', 'técnico', 'persuasivo'];
export type AiErrorCode = 'network' | 'timeout' | 'notConfigured' | 'rateLimited' | 'invalid' | 'server';

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

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/api/content/${path}`, {
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
  let data: { success?: boolean; message?: string; data?: T } | null = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (res.status === 429) throw new AiError('rateLimited');
  if (!res.ok || !data?.data) {
    const msg = data?.message ?? '';
    if (/OPENAI_API_KEY|api key|not configured/i.test(msg)) throw new AiError('notConfigured');
    if (res.status === 400) throw new AiError('invalid');
    throw new AiError('server');
  }
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
