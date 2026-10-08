/**
 * "Pregúntale a Gestión Humana": asistente que responde solo con el reglamento
 * de ejemplo, usando las rutas reales del chatbot RAG del backend
 * (`/api/chatbot`):
 *   1. La primera vez crea un bot (`POST /bots`) y le sube las políticas como
 *      documentos de texto (`POST /bots/:id/docs`). El id queda en
 *      localStorage para reutilizarlo; si el servidor lo perdió, se recrea.
 *   2. Cada pregunta va a `POST /bots/:id/chat`: el backend busca los
 *      fragmentos relevantes y, si tiene clave del proveedor de IA, llama al
 *      modelo con reglas para no inventar y citar la fuente. Sin clave responde
 *      en modo extractivo (los fragmentos tal cual) y la interfaz lo dice.
 */
import { BACKEND_URL } from '@/lib/backend-url';
import type { PolicyDoc } from './policies';

const API = `${BACKEND_URL}/api/chatbot`;
const STORAGE_KEY = 'koptup.hrms.policyBot';
/** Súbelo si cambian los textos de las políticas: obliga a reindexar. */
export const POLICY_VERSION = 1;
const OWNER_HEADER = 'X-Bot-Owner-Token';

export type AssistantErrorKind = 'network' | 'rateLimited' | 'server';

export class AssistantError extends Error {
  readonly kind: AssistantErrorKind;

  constructor(kind: AssistantErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

export interface AssistantAnswer {
  reply: string;
  sources: { index: number; name: string; chunk: string }[];
  model: string;
  llm: boolean;
  providerError: boolean;
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
    const entry = (JSON.parse(raw) as Record<string, StoredBot>)?.[lang];
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
    throw new AssistantError('network', 'network');
  }
  if (res.status === 429) throw new AssistantError('rateLimited', 'HTTP 429');
  if (!res.ok) throw new AssistantError('server', `HTTP ${res.status}`);
  return (await res.json()) as T;
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

const inflight = new Map<string, Promise<string>>();

async function createBot(lang: string, docs: PolicyDoc[], persona: string, name: string): Promise<string> {
  const created = await call<{ botId: string; ownerToken?: string }>('/bots', {
    method: 'POST',
    body: JSON.stringify({ name, systemPrompt: persona, tone: 'friendly', languages: [lang], avatar: 'GH', color: '#7c3aed' }),
  });
  const ownerToken = typeof created.ownerToken === 'string' && created.ownerToken ? created.ownerToken : null;
  await call(`/bots/${encodeURIComponent(created.botId)}/docs`, {
    method: 'POST',
    headers: ownerToken ? { [OWNER_HEADER]: ownerToken } : {},
    body: JSON.stringify({
      files: docs.map((d) => ({
        name: `${d.name}.txt`,
        size: new TextEncoder().encode(d.text).length,
        mime: 'text/plain',
        contentBase64: toBase64(d.text),
      })),
    }),
  });
  writeStored(lang, { botId: created.botId, ownerToken, version: POLICY_VERSION, docs: docs.length });
  return created.botId;
}

async function resolveBot(lang: string, docs: PolicyDoc[], persona: string, name: string): Promise<string> {
  const stored = readStored(lang);
  if (stored && stored.version === POLICY_VERSION && stored.docs === docs.length) {
    try {
      const bot = await call<{ docs?: unknown[] }>(`/bots/${encodeURIComponent(stored.botId)}`, {
        headers: stored.ownerToken ? { [OWNER_HEADER]: stored.ownerToken } : {},
      });
      if (Array.isArray(bot.docs) && bot.docs.length === docs.length) return stored.botId;
    } catch (err) {
      if (!(err instanceof AssistantError) || err.kind !== 'server') throw err;
    }
  }
  writeStored(lang, null);
  return createBot(lang, docs, persona, name);
}

export function ensurePolicyBot(lang: string, docs: PolicyDoc[], persona: string, name: string): Promise<string> {
  const pending = inflight.get(lang);
  if (pending) return pending;
  const p = resolveBot(lang, docs, persona, name).finally(() => inflight.delete(lang));
  inflight.set(lang, p);
  return p;
}

export function forgetPolicyBot(lang: string) {
  writeStored(lang, null);
}

interface ChatResponse {
  reply: string;
  sources?: { index?: number; name?: string; chunk?: string }[];
  model?: string;
  error?: string;
}

export async function ask(botId: string, message: string, history: { role: 'user' | 'assistant'; content: string }[]): Promise<AssistantAnswer> {
  const r = await call<ChatResponse>(`/bots/${encodeURIComponent(botId)}/chat`, {
    method: 'POST',
    body: JSON.stringify({ message, history: history.slice(-6) }),
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
  };
}
