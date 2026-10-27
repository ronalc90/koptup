/**
 * Llamadas a la API de documentos (/api/documents) para la cuenta con sesión.
 * Cada cuenta ve solo sus documentos (el servidor filtra por el usuario).
 * El borrado no pide PIN: lo confirma la interfaz y el servidor lo limita al dueño.
 */
import { api } from '@/lib/api';
import { isoToBogota } from './dates';
import { kindFromMime } from './util';
import type { DocItem } from './types';

export type ApiErrorCode =
  | 'login'
  | 'rateLimit'
  | 'forbidden'
  | 'notFound'
  | 'fileType'
  | 'fileSize'
  | 'noText'
  | 'aiOff'
  | 'aiBudget'
  | 'aiUserLimit'
  | 'aiUnavailable'
  | 'network'
  | 'server';

export class DocsApiError extends Error {
  code: ApiErrorCode;
  constructor(code: ApiErrorCode, message?: string) {
    super(message || code);
    this.code = code;
  }
}

/** Traduce un error de axios a un código con texto propio en messages. */
export function toApiError(err: unknown): DocsApiError {
  const e = err as { response?: { status?: number; data?: { code?: string; message?: string } }; code?: string };
  const status = e?.response?.status;
  const data = e?.response?.data || {};
  const msg = String(data.message || '').toLowerCase();
  if (!e?.response) return new DocsApiError(e?.code === 'ERR_NETWORK' || !status ? 'network' : 'server');
  if (status === 401) return new DocsApiError('login');
  if (status === 429 && data.code === 'ai_user_limit') return new DocsApiError('aiUserLimit');
  if (status === 429) return new DocsApiError('rateLimit');
  if (data.code === 'budget_exhausted') return new DocsApiError('aiBudget');
  if (data.code === 'ai_unavailable') return new DocsApiError('aiUnavailable');
  if (status === 403) return new DocsApiError('forbidden');
  if (status === 404) return new DocsApiError('notFound');
  if (msg.includes('file type') || msg.includes('mime')) return new DocsApiError('fileType');
  if (status === 413 || msg.includes('too large') || msg.includes('file size')) return new DocsApiError('fileSize');
  if (msg.includes('extractable text')) return new DocsApiError('noText');
  if (msg.includes('openai') || msg.includes('embedding')) return new DocsApiError('aiOff');
  return new DocsApiError('server');
}

interface ServerDoc {
  id: string;
  name: string;
  folder: string;
  sizeBytes: number;
  mimeType: string;
  favorite: boolean;
  tags?: string[];
  summary?: string;
  keywords?: string[];
  entities?: string[];
  createdAt: string;
}

function mapDoc(d: ServerDoc, deleted: boolean): DocItem {
  return {
    id: String(d.id),
    source: 'server',
    name: d.name,
    kind: kindFromMime(d.mimeType || '', d.name || ''),
    sizeBytes: d.sizeBytes || 0,
    folder: d.folder || 'General',
    tags: d.tags || [],
    favorite: Boolean(d.favorite),
    createdAt: isoToBogota(d.createdAt),
    deleted,
    summary: d.summary || undefined,
    keywords: d.keywords || [],
    entitiesText: d.entities || [],
  };
}

async function call<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    throw toApiError(err);
  }
}

/** Documentos activos y papelera en dos llamadas (carpetas y contadores se calculan aquí). */
export async function fetchAll(): Promise<DocItem[]> {
  return call(async () => {
    const [active, trash] = await Promise.all([
      api.get('/api/documents'),
      api.get('/api/documents', { params: { trash: 'true' } }),
    ]);
    const a = ((active.data?.data || []) as ServerDoc[]).map((d) => mapDoc(d, false));
    const t = ((trash.data?.data || []) as ServerDoc[]).map((d) => mapDoc(d, true));
    return [...a, ...t];
  });
}

export interface UploadResult {
  analyzed: boolean | null;
  aiCode?: string;
}

export async function uploadFile(file: File, folder: string, onProgress: (pct: number) => void): Promise<UploadResult> {
  return call(async () => {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', folder);
    const res = await api.post('/api/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
      onUploadProgress: (ev: { loaded: number; total?: number }) => {
        if (ev.total) onProgress(Math.round((ev.loaded * 100) / ev.total));
      },
    });
    const ai = res.data?.ai as { analyzed?: boolean; code?: string } | undefined;
    return { analyzed: ai ? Boolean(ai.analyzed) : null, aiCode: ai?.code };
  });
}

export async function patchDoc(id: string, body: { filename?: string; folder?: string; is_favorite?: boolean }): Promise<void> {
  await call(() => api.patch(`/api/documents/${id}`, body));
}

export async function trashDoc(id: string): Promise<void> {
  await call(() => api.delete(`/api/documents/${id}`));
}

export async function destroyDoc(id: string): Promise<void> {
  await call(() => api.delete(`/api/documents/${id}`, { params: { permanent: 'true' } }));
}

export async function restoreDoc(id: string): Promise<void> {
  await call(() => api.post(`/api/documents/${id}/restore`));
}

export interface SemanticHit {
  id: string;
  name: string;
  folder: string;
  summary?: string;
  similarity: number;
}

export async function semanticSearch(query: string): Promise<SemanticHit[]> {
  return call(async () => {
    const res = await api.post('/api/documents/search/semantic', { query });
    return ((res.data?.results || []) as SemanticHit[]).map((r) => ({ ...r, id: String(r.id) }));
  });
}

export async function explainDoc(id: string): Promise<string> {
  return call(async () => {
    const res = await api.get(`/api/documents/${id}/explain`, { timeout: 90000 });
    return String(res.data?.data?.explanation || '');
  });
}

export async function explainMatch(id: string, query: string, similarity: number): Promise<string> {
  return call(async () => {
    const res = await api.post(`/api/documents/${id}/explain-similarity`, { query, similarity }, { timeout: 90000 });
    return String(res.data?.data?.explanation || '');
  });
}
