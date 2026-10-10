/**
 * «Explicar con IA»: un modelo de IA de nuestro servidor lee el contenido y
 * los apartados de la política de la plataforma de ejemplo, y dice cuál aplica
 * y qué acción indica, citando el apartado.
 *
 * Usa las rutas reales del asistente RAG (`/api/chatbot`), igual que las otras
 * demos con IA:
 *   1. La primera vez crea un asistente (`POST /bots`) y le sube la política,
 *      un documento por categoría (`POST /bots/:id/docs`). El id queda en
 *      localStorage para reutilizarlo; si el servidor lo perdió, se recrea.
 *   2. Cada explicación es una pregunta a `POST /bots/:id/chat`: el servidor
 *      busca los apartados más parecidos y, si tiene clave de IA y cupo del
 *      mes, llama al modelo con reglas para no inventar y citar la fuente. Sin
 *      clave o sin cupo responde en modo extractivo (los apartados tal cual) y
 *      la demo lo dice.
 * La cola, la confianza y las reglas NO usan esto: son del clasificador por
 * reglas que corre en el navegador.
 */
import { BACKEND_URL } from '@/lib/backend-url';
import { POLICIES } from './samples';
import { CATEGORIES, type Lang } from './types';

const API = `${BACKEND_URL}/api/chatbot`;
const STORAGE_KEY = 'koptup.demo.moderacion.policyBot';
/** Súbelo si cambian los textos de la política: obliga a recrear el asistente. */
export const POLICY_VERSION = 1;
const OWNER_HEADER = 'X-Bot-Owner-Token';
const UPLOAD_BATCH = 5;
export const MAX_AI_CHARS = 1900;

export type AiErrorKind = 'network' | 'rateLimited' | 'server';

export class AiError extends Error {
  readonly kind: AiErrorKind;
  constructor(kind: AiErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

export interface AiSource {
  index: number;
  name: string;
  chunk: string;
}

export interface AiAnswer {
  reply: string;
  sources: AiSource[];
  model: string;
  /** El servidor respondió con el modelo (no en modo extractivo). */
  llm: boolean;
  /** Motivo del modo extractivo, si el servidor lo informa. */
  error: string | null;
  latencyMs: number;
}

interface StoredBot {
  botId: string;
  ownerToken: string | null;
  version: number;
  docs: number;
}

function readStored(lang: Lang): StoredBot | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const entry = (JSON.parse(raw) as Record<string, StoredBot>)?.[lang];
    return entry && typeof entry.botId === 'string' ? entry : null;
  } catch {
    return null;
  }
}

function writeStored(lang: Lang, entry: StoredBot | null) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const all = ((raw ? JSON.parse(raw) : {}) || {}) as Record<string, StoredBot>;
    if (entry) all[lang] = entry;
    else delete all[lang];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* sin almacenamiento: se crea un asistente nuevo en la próxima visita */
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      ...init,
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    });
  } catch {
    throw new AiError('network', 'network');
  }
  if (res.status === 429) throw new AiError('rateLimited', 'HTTP 429');
  if (!res.ok) throw new AiError('server', `HTTP ${res.status}`);
  return (await res.json()) as T;
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

const ownerHeaders = (token: string | null): Record<string, string> => (token ? { [OWNER_HEADER]: token } : {});

export interface PolicyDoc {
  name: string;
  text: string;
}

export function policyDocs(lang: Lang, names: Record<string, string>): PolicyDoc[] {
  return CATEGORIES.map((c) => ({ name: `${names[c] ?? c}.txt`, text: POLICIES[c][lang] }));
}

export interface PolicyBot {
  botId: string;
  ownerToken: string | null;
}

async function createBot(lang: Lang, docs: PolicyDoc[], persona: string, name: string): Promise<PolicyBot> {
  const created = await call<{ botId: string; ownerToken?: string }>('/bots', {
    method: 'POST',
    body: JSON.stringify({ name, systemPrompt: persona, tone: 'professional', languages: [lang], avatar: '🛡️', color: '#b91c1c' }),
  });
  const ownerToken = typeof created.ownerToken === 'string' && created.ownerToken ? created.ownerToken : null;
  for (let i = 0; i < docs.length; i += UPLOAD_BATCH) {
    await call(`/bots/${encodeURIComponent(created.botId)}/docs`, {
      method: 'POST',
      headers: ownerHeaders(ownerToken),
      body: JSON.stringify({
        files: docs.slice(i, i + UPLOAD_BATCH).map((d) => ({
          name: d.name,
          size: new TextEncoder().encode(d.text).length,
          mime: 'text/plain',
          contentBase64: toBase64(d.text),
        })),
      }),
    });
  }
  writeStored(lang, { botId: created.botId, ownerToken, version: POLICY_VERSION, docs: docs.length });
  return { botId: created.botId, ownerToken };
}

async function resolveBot(lang: Lang, docs: PolicyDoc[], persona: string, name: string): Promise<PolicyBot> {
  const stored = readStored(lang);
  if (stored && stored.version === POLICY_VERSION && stored.docs === docs.length) {
    try {
      const bot = await call<{ docs?: unknown[] }>(`/bots/${encodeURIComponent(stored.botId)}`, { headers: ownerHeaders(stored.ownerToken) });
      if (Array.isArray(bot.docs) && bot.docs.length === docs.length) return { botId: stored.botId, ownerToken: stored.ownerToken };
    } catch (err) {
      // 404: el servidor ya no tiene el asistente; cualquier otro error se informa.
      if (!(err instanceof AiError) || err.kind !== 'server') throw err;
    }
  }
  writeStored(lang, null);
  return createBot(lang, docs, persona, name);
}

const inflight = new Map<Lang, Promise<PolicyBot>>();

export function ensurePolicyBot(lang: Lang, docs: PolicyDoc[], persona: string, name: string): Promise<PolicyBot> {
  const pending = inflight.get(lang);
  if (pending) return pending;
  const p = resolveBot(lang, docs, persona, name).finally(() => inflight.delete(lang));
  inflight.set(lang, p);
  return p;
}

export function forgetPolicyBot(lang: Lang) {
  writeStored(lang, null);
}

interface ChatResponse {
  reply?: string;
  sources?: Array<{ index?: number; name?: string; chunk?: string }>;
  model?: string;
  latencyMs?: number;
  error?: string;
}

export async function askPolicy(bot: PolicyBot, message: string): Promise<AiAnswer> {
  const r = await call<ChatResponse>(`/bots/${encodeURIComponent(bot.botId)}/chat`, {
    method: 'POST',
    headers: ownerHeaders(bot.ownerToken),
    body: JSON.stringify({ message: message.slice(0, MAX_AI_CHARS), history: [] }),
  });
  const model = r.model || '';
  return {
    reply: String(r.reply || '').trim(),
    sources: (r.sources || []).map((s, i) => ({
      index: typeof s.index === 'number' ? s.index : i + 1,
      name: String(s.name || '').replace(/\.txt$/i, ''),
      chunk: String(s.chunk || ''),
    })),
    model,
    llm: model !== '' && !model.startsWith('extractive'),
    error: typeof r.error === 'string' ? r.error : null,
    latencyMs: typeof r.latencyMs === 'number' ? r.latencyMs : 0,
  };
}
