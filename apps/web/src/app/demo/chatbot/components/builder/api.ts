/**
 * api.ts — cliente HTTP minimalista para los endpoints del builder de chatbot.
 *
 * Responsabilidad única: hablar con `${NEXT_PUBLIC_API_URL}/api/chatbot/bots/...`.
 * Centraliza URLs y serialización para mantener los componentes UI puros.
 */

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
  /** Latencia simulada en milisegundos. */
  latencyMs?: number;
  timestamp: string;
}

export interface RemoteUrlIngestResult {
  docs: RemoteBotDoc[];
  added: RemoteBotDoc[];
  errors: Array<{ url: string; reason: string }>;
}

const RAW_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
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
): Promise<RemoteChatReply> {
  return jsonFetch(`${API_BASE}/bots/${encodeURIComponent(botId)}/chat`, {
    method: 'POST',
    body: JSON.stringify({ message, history }),
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
