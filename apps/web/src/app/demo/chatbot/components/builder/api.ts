/**
 * api.ts — cliente HTTP minimalista para los endpoints del builder de chatbot.
 *
 * Responsabilidad única: hablar con `${NEXT_PUBLIC_API_URL}/api/chatbot/bots/...`.
 * Centraliza URLs y serialización para mantener los componentes UI puros.
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

export interface RemoteBotConfig {
  botId: string;
  name: string;
  color: string;
  position: 'br' | 'bl' | 'tr' | 'tl';
  avatar: string;
  welcome: string;
  systemPrompt: string;
  tone: string;
  languages: string[];
  createdAt: string;
  updatedAt: string;
  docs?: RemoteBotDoc[];
}

export interface RemoteChatReplySource {
  id: string;
  /** 1-indexed para alinearse con las citas `[n]` del reply. */
  index?: number;
  /** Nombre del documento (o hostname si es una URL indexada). */
  name: string;
  /** Score BM25-lite del retrieval. */
  score?: number;
  /** Texto crudo del chunk recuperado. */
  chunk?: string;
}

export interface RemoteChatReply {
  botId: string;
  reply: string;
  sources: RemoteChatReplySource[];
  /** Confianza calibrada (0..1). */
  confidence?: number;
  /** Latencia real (ms) si se llamó a OpenAI, simulada si fue extractivo. */
  latencyMs?: number;
  /**
   * Identificador del modelo que respondió. Puede ser un GPT (`gpt-4o-mini`,
   * `gpt-4o`, `gpt-4-turbo`) o `extractive-bm25` / `extractive-bm25-fallback`
   * cuando el LLM no estaba disponible.
   */
  model?: string;
  tokens?: { prompt?: number; completion?: number; total?: number };
  /** Costo estimado del request en USD (sólo cuando hubo llamada LLM real). */
  costUSD?: number;
  /** Si el LLM falló, el backend reporta el motivo (sin filtrar la API key). */
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

export interface RemoteBotSummary {
  botId: string;
  name: string;
  color: string;
  avatar: string;
  createdAt: string;
  updatedAt?: string;
  docsCount: number;
  chunksCount?: number;
  conversationsCount: number;
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

async function jsonFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${text}`);
  }
  return (await res.json()) as T;
}

export async function createBot(payload: Partial<RemoteBotConfig>): Promise<RemoteBotConfig> {
  return jsonFetch<RemoteBotConfig>(`${API_BASE}/bots`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getBot(botId: string): Promise<RemoteBotConfig> {
  return jsonFetch<RemoteBotConfig>(`${API_BASE}/bots/${encodeURIComponent(botId)}`);
}

export async function patchBot(
  botId: string,
  payload: Partial<RemoteBotConfig>,
): Promise<RemoteBotConfig> {
  return jsonFetch<RemoteBotConfig>(`${API_BASE}/bots/${encodeURIComponent(botId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
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
  return jsonFetch(`${API_BASE}/bots/${encodeURIComponent(botId)}/docs`, {
    method: 'POST',
    body: JSON.stringify({ files }),
  });
}

export async function deleteBotDoc(
  botId: string,
  docId: string,
): Promise<{ docs: RemoteBotDoc[] }> {
  return jsonFetch(
    `${API_BASE}/bots/${encodeURIComponent(botId)}/docs/${encodeURIComponent(docId)}`,
    { method: 'DELETE' },
  );
}

export async function chatWithBot(
  botId: string,
  message: string,
  history: Array<{ role: string; content: string }>,
  model?: string,
): Promise<RemoteChatReply> {
  return jsonFetch(`${API_BASE}/bots/${encodeURIComponent(botId)}/chat`, {
    method: 'POST',
    body: JSON.stringify({ message, history, model }),
  });
}

/** Lista los modelos LLM soportados por el backend (flag `enabled` real). */
export async function listModels(): Promise<RemoteModelsResponse> {
  return jsonFetch<RemoteModelsResponse>(`${API_BASE}/models`);
}

/** Lista todos los bots (tenants) creados. */
export async function listBots(): Promise<RemoteBotSummary[]> {
  return jsonFetch<RemoteBotSummary[]>(`${API_BASE}/bots`);
}

/** Borra un bot completo (incluye docs, chunks y conversaciones). */
export async function deleteBot(botId: string): Promise<{ deleted: true; botId: string }> {
  return jsonFetch(`${API_BASE}/bots/${encodeURIComponent(botId)}`, { method: 'DELETE' });
}

/** Trae el histórico de mensajes de un bot. */
export async function getConversations(botId: string): Promise<RemoteConversationTurn[]> {
  return jsonFetch<RemoteConversationTurn[]>(
    `${API_BASE}/bots/${encodeURIComponent(botId)}/conversations`,
  );
}

/** Limpia el histórico de un bot (idempotente). */
export async function clearConversations(botId: string): Promise<{ cleared: true; botId: string }> {
  return jsonFetch(`${API_BASE}/bots/${encodeURIComponent(botId)}/conversations`, {
    method: 'DELETE',
  });
}

export async function ingestBotUrls(
  botId: string,
  urls: string[],
): Promise<RemoteUrlIngestResult> {
  return jsonFetch(`${API_BASE}/bots/${encodeURIComponent(botId)}/urls`, {
    method: 'POST',
    body: JSON.stringify({ urls }),
  });
}

/** Lee un File del navegador y devuelve el contenido como Base64 puro (sin data: prefix). */
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
