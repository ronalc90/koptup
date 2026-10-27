/**
 * "Pregúntale a Gestión Humana": asistente que responde solo con el reglamento
 * de ejemplo, usando las rutas reales del chatbot RAG del backend
 * (`/api/chatbot`):
 *   1. Pide el bot de ejemplo COMPARTIDO (`POST /sample-bots`): el servidor
 *      devuelve el bot que ya tiene exactamente estos textos (lo crea e indexa
 *      la primera vez), así cada navegador no crea el suyo. Si el backend no
 *      ofrece esa ruta (versión anterior), crea un bot propio (`POST /bots`) y
 *      le sube las políticas; ese id queda en localStorage.
 *   2. Cada pregunta va a `POST /bots/:id/chat`: el backend busca los
 *      fragmentos relevantes y, si tiene clave del proveedor de IA y cupo del
 *      mes, llama al modelo con reglas para no inventar y citar la fuente. Sin
 *      clave, sin cupo o si el proveedor falla responde en modo extractivo (los
 *      fragmentos tal cual) y la interfaz dice por qué.
 */
import { BACKEND_URL } from '@/lib/backend-url';
import type { PolicyDoc } from './policies';

const API = `${BACKEND_URL}/api/chatbot`;
const STORAGE_KEY = 'koptup.hrms.policyBot';
/** Súbelo si cambian los textos de las políticas: obliga a reindexar. */
export const POLICY_VERSION = 1;
const OWNER_HEADER = 'X-Bot-Owner-Token';

/** Clave del bot de ejemplo compartido: demo, idioma y versión de los textos. */
export function sampleKey(lang: string): string {
  return `hrms-policies:${lang}:v${POLICY_VERSION}`;
}

export type AssistantErrorKind = 'network' | 'rateLimited' | 'unavailable' | 'server';

export class AssistantError extends Error {
  readonly kind: AssistantErrorKind;
  readonly status: number;
  readonly code: string;

  constructor(kind: AssistantErrorKind, message: string, status = 0, code = '') {
    super(message);
    this.kind = kind;
    this.status = status;
    this.code = code;
  }
}

/** Por qué la respuesta no la redactó el modelo (o `null` si sí la redactó). */
export type NoAiReason = 'noKey' | 'budgetExhausted' | 'budgetUnavailable' | 'providerError';

export interface AssistantAnswer {
  reply: string;
  sources: { index: number; name: string; chunk: string }[];
  model: string;
  llm: boolean;
  noAi: NoAiReason | null;
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
    /* sin almacenamiento: se pide el bot de nuevo en la próxima visita */
  }
}

/** Traduce el error HTTP (formato único `{ code, message }`) a un tipo que la interfaz explica. */
export function errorKind(status: number, code: string): AssistantErrorKind {
  if (status === 429 || code === 'rate_limited') return 'rateLimited';
  if (status === 503 || code === 'storage_unavailable' || code === 'capacity') return 'unavailable';
  return 'server';
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
  if (!res.ok) {
    let code = '';
    try {
      const body = (await res.json()) as { code?: unknown };
      code = typeof body?.code === 'string' ? body.code : '';
    } catch {
      /* respuesta sin JSON */
    }
    throw new AssistantError(errorKind(res.status, code), `HTTP ${res.status}`, res.status, code);
  }
  return (await res.json()) as T;
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function filesOf(docs: PolicyDoc[]) {
  return docs.map((d) => ({
    name: `${d.name}.txt`,
    size: new TextEncoder().encode(d.text).length,
    mime: 'text/plain',
    contentBase64: toBase64(d.text),
  }));
}

function configOf(lang: string, persona: string, name: string) {
  return { name, systemPrompt: persona, tone: 'friendly', languages: [lang], avatar: 'GH', color: '#7c3aed' };
}

/** Bot compartido del servidor; `null` si el backend no ofrece POST /sample-bots. */
async function sharedBot(lang: string, docs: PolicyDoc[], persona: string, name: string): Promise<string | null> {
  try {
    const res = await call<{ botId?: unknown }>('/sample-bots', {
      method: 'POST',
      body: JSON.stringify({ sampleKey: sampleKey(lang), config: configOf(lang, persona, name), files: filesOf(docs) }),
    });
    return typeof res.botId === 'string' ? res.botId : null;
  } catch (err) {
    if (err instanceof AssistantError && (err.status === 404 || err.status === 405)) return null;
    throw err;
  }
}

/** Respaldo para un backend sin bots compartidos: bot propio con las políticas. */
async function ownBot(lang: string, docs: PolicyDoc[], persona: string, name: string): Promise<string> {
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
  const created = await call<{ botId: string; ownerToken?: string }>('/bots', { method: 'POST', body: JSON.stringify(configOf(lang, persona, name)) });
  const ownerToken = typeof created.ownerToken === 'string' && created.ownerToken ? created.ownerToken : null;
  await call(`/bots/${encodeURIComponent(created.botId)}/docs`, {
    method: 'POST',
    headers: ownerToken ? { [OWNER_HEADER]: ownerToken } : {},
    body: JSON.stringify({ files: filesOf(docs) }),
  });
  writeStored(lang, { botId: created.botId, ownerToken, version: POLICY_VERSION, docs: docs.length });
  return created.botId;
}

const resolved = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

async function resolveBot(lang: string, docs: PolicyDoc[], persona: string, name: string): Promise<string> {
  const hit = resolved.get(lang);
  if (hit) return hit;
  const botId = (await sharedBot(lang, docs, persona, name)) ?? (await ownBot(lang, docs, persona, name));
  resolved.set(lang, botId);
  return botId;
}

export function ensurePolicyBot(lang: string, docs: PolicyDoc[], persona: string, name: string): Promise<string> {
  const pending = inflight.get(lang);
  if (pending) return pending;
  const p = resolveBot(lang, docs, persona, name).finally(() => inflight.delete(lang));
  inflight.set(lang, p);
  return p;
}

/** Olvida el bot (p. ej. el servidor lo borró por inactividad) para pedirlo de nuevo. */
export function forgetPolicyBot(lang: string) {
  resolved.delete(lang);
  writeStored(lang, null);
}

interface ChatResponse {
  reply: string;
  sources?: { index?: number; name?: string; chunk?: string }[];
  model?: string;
  error?: string;
}

/** Motivo del modo sin IA a partir de la respuesta del chat. */
export function noAiReason(model: string, error: string | undefined): NoAiReason | null {
  if (error === 'budget_exhausted') return 'budgetExhausted';
  if (error === 'budget_unavailable') return 'budgetUnavailable';
  if (error === 'llm_provider_error') return 'providerError';
  if (!model || model.startsWith('extractive')) return 'noKey';
  return null;
}

export async function ask(botId: string, message: string, history: { role: 'user' | 'assistant'; content: string }[]): Promise<AssistantAnswer> {
  const r = await call<ChatResponse>(`/bots/${encodeURIComponent(botId)}/chat`, {
    method: 'POST',
    body: JSON.stringify({ message, history: history.slice(-6) }),
  });
  const model = r.model || '';
  const noAi = noAiReason(model, r.error);
  return {
    reply: String(r.reply || '').trim(),
    sources: (r.sources || []).map((s, i) => ({
      index: typeof s.index === 'number' ? s.index : i + 1,
      name: String(s.name || '').replace(/\.txt$/i, ''),
      chunk: String(s.chunk || ''),
    })),
    model,
    llm: noAi === null,
    noAi,
  };
}
