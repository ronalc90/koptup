/**
 * api.ts — cliente HTTP de los bots del chatbot RAG (Playground, Builder y
 * la página pública /embed/chatbot/[botId]).
 *
 * Habla con `${NEXT_PUBLIC_API_URL}/api/chatbot/...` (rutas reales de
 * `apps/backend/src/routes/chatbot.routes.ts`).
 *
 * Propiedad de los bots:
 *  - El backend puede devolver `ownerToken` al crear un bot (POST /bots). Ese
 *    token se guarda en localStorage (`koptup.chatbot.myBots`) junto con el
 *    nombre del bot, y se envía en el header `X-Bot-Owner-Token` en las
 *    operaciones del dueño: PATCH/DELETE del bot, subir/borrar documentos,
 *    indexar URLs y leer/borrar conversaciones.
 *  - Compatibilidad: si el backend todavía no devuelve `ownerToken`, el bot
 *    queda registrado sin token y NO se envía el header (así no se rompe el
 *    preflight CORS de un backend que aún no lo permite).
 *  - Leer la configuración pública (GET /bots/:id) y conversar
 *    (POST /bots/:id/chat) no requieren token: los usa el widget embebido.
 */
import { BACKEND_URL as RAW_BASE } from '@/lib/backend-url';

export interface RemoteBotDoc {
  id: string;
  name: string;
  size: number;
  mime: string;
  hash: string;
  uploadedAt: string;
}

export type BotPosition = 'br' | 'bl' | 'tr' | 'tl';

export interface RemoteBotConfig {
  botId: string;
  name: string;
  color: string;
  position: BotPosition;
  avatar: string;
  welcome: string;
  systemPrompt: string;
  tone: string;
  languages: string[];
  createdAt: string;
  updatedAt: string;
  docs?: RemoteBotDoc[];
  /** Solo en la respuesta de creación, si el backend ya implementa la propiedad de bots. */
  ownerToken?: string;
}

export interface RemoteChatReplySource {
  id: string;
  /** 1-indexed para alinearse con las citas `[n]` del reply. */
  index?: number;
  /** Nombre del documento (o hostname si es una URL indexada). */
  name: string;
  /** Puntaje BM25 del fragmento. */
  score?: number;
  /** Texto del fragmento recuperado. */
  chunk?: string;
}

export interface RemoteChatReply {
  botId: string;
  reply: string;
  sources: RemoteChatReplySource[];
  /** Heurística del backend (no es una probabilidad calibrada): la UI no la muestra. */
  confidence?: number;
  /** Latencia de la llamada al modelo (ms) medida en el backend. */
  latencyMs?: number;
  /**
   * Modelo que respondió: un GPT (`gpt-4o-mini`, `gpt-4o`, `gpt-4-turbo`) o
   * `extractive-bm25` / `extractive-bm25-fallback` cuando no hubo modelo.
   */
  model?: string;
  tokens?: { prompt?: number; completion?: number; total?: number };
  /** Costo estimado del request en USD (solo cuando hubo llamada al modelo). */
  costUSD?: number;
  /** `llm_provider_error` si el proveedor del modelo falló (sin exponer la clave). */
  error?: string;
  timestamp: string;
}

export interface RemoteModelMeta {
  id: string;
  name: string;
  provider: 'openai';
  enabled: boolean;
  costInputUSDper1M: number;
  costOutputUSDper1M: number;
  recommended?: boolean;
}

export interface RemoteModelsResponse {
  available: RemoteModelMeta[];
  activeProvider: 'openai' | null;
}

export interface RemoteConversationTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Array<{ id: string; name: string; score?: number; chunk?: string }>;
  confidence?: number;
}

export interface RemoteUrlIngestResult {
  docs: RemoteBotDoc[];
  added: RemoteBotDoc[];
  errors: Array<{ url: string; reason: string }>;
}

const API_BASE = `${RAW_BASE}/api/chatbot`;

export const OWNER_TOKEN_HEADER = 'X-Bot-Owner-Token';

/** Error HTTP con el status, para distinguir 401/403/404 en la UI. */
export class BotApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Registro local de bots propios (localStorage)
// ---------------------------------------------------------------------------

const MY_BOTS_LS_KEY = 'koptup.chatbot.myBots';

export type OwnedBotKind = 'builder' | 'sample';

export interface OwnedBotEntry {
  /** null si el backend no devolvió token (backend sin propiedad de bots). */
  ownerToken: string | null;
  name: string;
  kind: OwnedBotKind;
  /** Clave de la empresa de ejemplo + idioma + versión (solo kind = sample). */
  sampleKey?: string;
  savedAt: string;
}

type OwnedBots = Record<string, OwnedBotEntry>;

function readOwned(): OwnedBots {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(MY_BOTS_LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as OwnedBots) : {};
  } catch {
    return {};
  }
}

function writeOwned(data: OwnedBots): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MY_BOTS_LS_KEY, JSON.stringify(data));
  } catch {
    /* almacenamiento lleno o bloqueado: el bot sigue funcionando en esta pestaña */
  }
}

/** Guarda (o actualiza) un bot propio. Conserva el token previo si no llega uno nuevo. */
export function rememberBot(
  botId: string,
  entry: { name: string; kind: OwnedBotKind; ownerToken?: string | null; sampleKey?: string },
): void {
  const all = readOwned();
  const prev = all[botId];
  all[botId] = {
    ownerToken: entry.ownerToken ?? prev?.ownerToken ?? null,
    name: entry.name,
    kind: entry.kind,
    sampleKey: entry.sampleKey ?? prev?.sampleKey,
    savedAt: new Date().toISOString(),
  };
  writeOwned(all);
}

export function forgetBot(botId: string): void {
  const all = readOwned();
  if (!(botId in all)) return;
  delete all[botId];
  writeOwned(all);
}

export function getOwnedBot(botId: string): OwnedBotEntry | null {
  return readOwned()[botId] ?? null;
}

/** Bots propios de un tipo, del más reciente al más antiguo. */
export function listOwnedBots(kind: OwnedBotKind): Array<{ botId: string } & OwnedBotEntry> {
  return Object.entries(readOwned())
    .filter(([, e]) => e.kind === kind)
    .map(([botId, e]) => ({ botId, ...e }))
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function getOwnerToken(botId: string): string | null {
  return readOwned()[botId]?.ownerToken ?? null;
}

/** Header del dueño, solo si hay token (compatibilidad con backends sin propiedad). */
function ownerHeaders(botId: string): Record<string, string> {
  const token = getOwnerToken(botId);
  return token ? { [OWNER_TOKEN_HEADER]: token } : {};
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

async function jsonFetch<T>(input: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(input, {
      ...init,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
  } catch {
    throw new BotApiError(0, 'network');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new BotApiError(res.status, `HTTP ${res.status}${text ? ` — ${text.slice(0, 200)}` : ''}`);
  }
  return (await res.json()) as T;
}

const botUrl = (botId: string) => `${API_BASE}/bots/${encodeURIComponent(botId)}`;

/** Crea un bot y registra su token de dueño (si el backend lo devuelve). */
export async function createBot(
  payload: Partial<RemoteBotConfig>,
  meta: { kind: OwnedBotKind; sampleKey?: string },
): Promise<RemoteBotConfig> {
  const created = await jsonFetch<RemoteBotConfig>(`${API_BASE}/bots`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  rememberBot(created.botId, {
    name: created.name,
    kind: meta.kind,
    sampleKey: meta.sampleKey,
    ownerToken: typeof created.ownerToken === 'string' && created.ownerToken ? created.ownerToken : null,
  });
  return created;
}

/** Configuración pública del bot (sin token). */
export async function getBot(botId: string): Promise<RemoteBotConfig> {
  return jsonFetch<RemoteBotConfig>(botUrl(botId));
}

export async function patchBot(botId: string, payload: Partial<RemoteBotConfig>): Promise<RemoteBotConfig> {
  return jsonFetch<RemoteBotConfig>(botUrl(botId), {
    method: 'PATCH',
    headers: ownerHeaders(botId),
    body: JSON.stringify(payload),
  });
}

/** Borra el bot (documentos, fragmentos y conversaciones) y lo saca del registro local. */
export async function deleteBot(botId: string): Promise<{ deleted: true; botId: string }> {
  const res = await jsonFetch<{ deleted: true; botId: string }>(botUrl(botId), {
    method: 'DELETE',
    headers: ownerHeaders(botId),
  });
  forgetBot(botId);
  return res;
}

export interface UploadFilePayload {
  name: string;
  size: number;
  mime: string;
  contentBase64: string;
}

export async function uploadBotDocs(
  botId: string,
  files: UploadFilePayload[],
): Promise<{ docs: RemoteBotDoc[]; added: RemoteBotDoc[] }> {
  return jsonFetch(`${botUrl(botId)}/docs`, {
    method: 'POST',
    headers: ownerHeaders(botId),
    body: JSON.stringify({ files }),
  });
}

export async function deleteBotDoc(botId: string, docId: string): Promise<{ docs: RemoteBotDoc[] }> {
  return jsonFetch(`${botUrl(botId)}/docs/${encodeURIComponent(docId)}`, {
    method: 'DELETE',
    headers: ownerHeaders(botId),
  });
}

export async function chatWithBot(
  botId: string,
  message: string,
  history: Array<{ role: string; content: string }>,
  model?: string,
): Promise<RemoteChatReply> {
  return jsonFetch(`${botUrl(botId)}/chat`, {
    method: 'POST',
    body: JSON.stringify({ message, history, model }),
  });
}

/** Modelos de OpenAI soportados y si hay clave configurada (`enabled`). */
export async function listModels(): Promise<RemoteModelsResponse> {
  return jsonFetch<RemoteModelsResponse>(`${API_BASE}/models`);
}

/** Historial de conversaciones del bot (operación del dueño). */
export async function getConversations(botId: string, limit = 200): Promise<RemoteConversationTurn[]> {
  return jsonFetch<RemoteConversationTurn[]>(`${botUrl(botId)}/conversations?limit=${limit}`, {
    headers: ownerHeaders(botId),
  });
}

/** Borra el historial del bot (operación del dueño). */
export async function clearConversations(botId: string): Promise<{ cleared: true; botId: string }> {
  return jsonFetch(`${botUrl(botId)}/conversations`, {
    method: 'DELETE',
    headers: ownerHeaders(botId),
  });
}

export async function ingestBotUrls(botId: string, urls: string[]): Promise<RemoteUrlIngestResult> {
  return jsonFetch(`${botUrl(botId)}/urls`, {
    method: 'POST',
    headers: ownerHeaders(botId),
    body: JSON.stringify({ urls }),
  });
}

/** Codifica texto UTF-8 en Base64 (para subir los documentos de ejemplo). */
export function textToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/** Lee un File del navegador y devuelve el contenido como Base64 puro (sin prefijo data:). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        resolve('');
        return;
      }
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(file);
  });
}

/** ¿El modelo que respondió es un LLM real (y no el modo extractivo)? */
export function isGenerativeReply(reply: Pick<RemoteChatReply, 'model' | 'error'>): boolean {
  return !!reply.model && !reply.model.startsWith('extractive') && !reply.error;
}

/** Frases con las que el backend dice que la respuesta no está en los documentos. */
const NOT_FOUND_PATTERNS = [/no encontr[ée] esa informaci[óo]n/i, /couldn.?t find that information/i, /aún no tienes documentos/i];

export function isNotFoundReply(reply: Pick<RemoteChatReply, 'reply' | 'sources'>): boolean {
  return NOT_FOUND_PATTERNS.some((re) => re.test(reply.reply)) || (reply.sources?.length ?? 0) === 0;
}
