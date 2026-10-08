/**
 * "Redactar con IA": borrador de respuesta generado por un modelo de IA desde
 * nuestro backend, usando como única fuente los artículos de la base de
 * conocimiento de esta demo.
 *
 * Usa las rutas reales del chatbot RAG (`/api/chatbot`):
 *   1. La primera vez crea un bot (`POST /bots`) y le sube los artículos como
 *      documentos de texto (`POST /bots/:id/docs`). El id queda en
 *      localStorage para reutilizarlo; si el servidor lo perdió, se recrea.
 *   2. Cada borrador es una pregunta a `POST /bots/:id/chat`: el backend busca
 *      los fragmentos relevantes (BM25) y, si tiene clave de OpenAI, llama al
 *      modelo con reglas para no inventar y citar la fuente. Sin clave
 *      responde en modo extractivo (los fragmentos tal cual) y la UI lo dice.
 */
import { BACKEND_URL } from '@/lib/backend-url';

const API = `${BACKEND_URL}/api/chatbot`;
const STORAGE_KEY = 'koptup.helpdesk.kbBot';
/** Súbelo si cambian los textos de los artículos: obliga a reindexar. */
export const KB_VERSION = 1;
const OWNER_HEADER = 'X-Bot-Owner-Token';

export type AiErrorKind = 'network' | 'rateLimited' | 'server';

export class AiError extends Error {
  readonly kind: AiErrorKind;

  constructor(kind: AiErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

export interface KbDoc {
  name: string;
  text: string;
}

export interface AiSource {
  index: number;
  name: string;
  chunk: string;
}

export interface AiDraft {
  reply: string;
  sources: AiSource[];
  model: string;
  /** El servidor respondió con el modelo de IA (no en modo extractivo). */
  llm: boolean;
  providerError: boolean;
  latencyMs: number;
  costUSD: number | null;
}

interface StoredBot {
  botId: string;
  ownerToken: string | null;
  version: number;
  docs: number;
}

function readStored(lang: string): StoredBot | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw) as Record<string, StoredBot>;
    const entry = all?.[lang];
    return entry && typeof entry.botId === 'string' ? entry : null;
  } catch {
    return null;
  }
}

function writeStored(lang: string, entry: StoredBot | null) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const all = (raw ? (JSON.parse(raw) as Record<string, StoredBot>) : {}) || {};
    if (entry) all[lang] = entry;
    else delete all[lang];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* sin almacenamiento: se crea un bot nuevo en la próxima visita */
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
  if (!res.ok) {
    const err = new AiError('server', `HTTP ${res.status}`);
    (err as AiError & { status?: number }).status = res.status;
    throw err;
  }
  return (await res.json()) as T;
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

const inflight = new Map<string, Promise<KbBot>>();

export interface KbBot {
  botId: string;
  /** Token de dueño, si el backend lo entrega (se envía en cada llamada al bot). */
  ownerToken: string | null;
}

const ownerHeaders = (token: string | null): Record<string, string> => (token ? { [OWNER_HEADER]: token } : {});

async function createBot(lang: string, docs: KbDoc[], persona: string, name: string): Promise<KbBot> {
  const created = await call<{ botId: string; ownerToken?: string }>('/bots', {
    method: 'POST',
    body: JSON.stringify({ name, systemPrompt: persona, tone: 'friendly', languages: [lang], avatar: '🎧', color: '#e11d48' }),
  });
  const ownerToken = typeof created.ownerToken === 'string' && created.ownerToken ? created.ownerToken : null;
  await call(`/bots/${encodeURIComponent(created.botId)}/docs`, {
    method: 'POST',
    headers: ownerHeaders(ownerToken),
    body: JSON.stringify({
      files: docs.map((d) => ({
        name: d.name,
        size: new TextEncoder().encode(d.text).length,
        mime: 'text/plain',
        contentBase64: toBase64(d.text),
      })),
    }),
  });
  writeStored(lang, { botId: created.botId, ownerToken, version: KB_VERSION, docs: docs.length });
  return { botId: created.botId, ownerToken };
}

async function resolveBot(lang: string, docs: KbDoc[], persona: string, name: string): Promise<KbBot> {
  const stored = readStored(lang);
  if (stored && stored.version === KB_VERSION && stored.docs === docs.length) {
    try {
      const bot = await call<{ docs?: unknown[] }>(`/bots/${encodeURIComponent(stored.botId)}`, { headers: ownerHeaders(stored.ownerToken) });
      if (Array.isArray(bot.docs) && bot.docs.length === docs.length) return { botId: stored.botId, ownerToken: stored.ownerToken };
    } catch (err) {
      // 404: el servidor ya no tiene el bot; cualquier otro error se informa.
      if (!(err instanceof AiError) || err.kind !== 'server') throw err;
    }
  }
  writeStored(lang, null);
  return createBot(lang, docs, persona, name);
}

/** Bot con la base de conocimiento de la demo en el idioma dado (lo crea si hace falta). */
export function ensureKbBot(lang: string, docs: KbDoc[], persona: string, name: string): Promise<KbBot> {
  const pending = inflight.get(lang);
  if (pending) return pending;
  const p = resolveBot(lang, docs, persona, name).finally(() => inflight.delete(lang));
  inflight.set(lang, p);
  return p;
}

/** Olvida el bot guardado (por ejemplo, si el servidor perdió sus documentos). */
export function forgetKbBot(lang: string) {
  writeStored(lang, null);
}

interface ChatResponse {
  reply: string;
  sources?: { index?: number; name?: string; chunk?: string }[];
  model?: string;
  latencyMs?: number;
  costUSD?: number;
  error?: string;
}

export async function draftReply(bot: KbBot, message: string): Promise<AiDraft> {
  const r = await call<ChatResponse>(`/bots/${encodeURIComponent(bot.botId)}/chat`, {
    method: 'POST',
    headers: ownerHeaders(bot.ownerToken),
    body: JSON.stringify({ message, history: [] }),
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
    providerError: r.error === 'llm_provider_error',
    latencyMs: typeof r.latencyMs === 'number' ? r.latencyMs : 0,
    costUSD: typeof r.costUSD === 'number' ? r.costUSD : null,
  };
}

/** Quita las marcas de cita [1], [2]… para insertar el texto en la respuesta al cliente. */
export function stripCitations(text: string): string {
  return text
    .replace(/\s*\[\d+\](?:\s*\[\d+\])*/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}
