/**
 * api.ts — cliente HTTP de la demo "Prueba con tu documento".
 *
 * Habla con `${BACKEND_URL}/api/demo-rag/...` (misma base URL que el resto de
 * la demo de chatbot, ver `builder/api.ts`). El backend procesa el documento
 * solo en memoria y lo borra a la hora.
 */
import { BACKEND_URL } from '@/lib/backend-url';

const API_BASE = `${BACKEND_URL}/api/demo-rag`;

export type DemoDocKind = 'pdf' | 'docx' | 'txt';
export type DemoDisabledReason = 'disabled' | 'unavailable' | 'budget_exhausted';

export interface DemoLimits {
  formats: DemoDocKind[];
  maxFileMb: number;
  maxPages: number;
  maxQuestionsPerDocument: number;
  maxDocumentsPerDay: number;
  ttlMinutes: number;
  maxQuestionChars: number;
}

/** Valores por defecto (los mismos del backend) si el estado no los trae. */
export const DEFAULT_DEMO_LIMITS: DemoLimits = {
  formats: ['pdf', 'docx', 'txt'],
  maxFileMb: 5,
  maxPages: 30,
  maxQuestionsPerDocument: 10,
  maxDocumentsPerDay: 3,
  ttlMinutes: 60,
  maxQuestionChars: 500,
};

export const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.txt'] as const;
export const ACCEPT_ATTRIBUTE = '.pdf,.docx,.txt';

export interface DemoStatus {
  enabled: boolean;
  reason: DemoDisabledReason | null;
  budgetExhausted: boolean;
  limits?: DemoLimits;
}

export interface DemoDocument {
  docId: string;
  name: string;
  kind: DemoDocKind;
  citationUnit: 'page' | 'fragment';
  pages: number;
  pagesEstimated: boolean;
  fragments: number;
  maxQuestions: number;
  questionsUsed: number;
  questionsRemaining: number;
  createdAt: string;
  expiresAt: string;
}

export interface DemoCitation {
  /** Presente cuando la cita es una página (PDF). */
  page?: number;
  /** Presente cuando la cita es un fragmento (DOCX/TXT). */
  fragment?: number;
  excerpt: string;
}

export interface DemoAnswer {
  answer: string;
  citations: DemoCitation[];
  notFound: boolean;
  maxQuestions: number;
  questionsUsed: number;
  questionsRemaining: number;
}

/** Códigos de error del backend + errores de red del cliente. */
export type DemoErrorCode =
  | 'demo_disabled'
  | 'budget_exhausted'
  | 'capacity'
  | 'missing_file'
  | 'invalid_format'
  | 'file_too_large'
  | 'too_many_pages'
  | 'empty_document'
  | 'unreadable_document'
  | 'invalid_email'
  | 'consent_required'
  | 'invalid_request'
  | 'daily_limit'
  | 'rate_limited'
  | 'document_not_found'
  | 'question_limit'
  | 'invalid_question'
  | 'llm_error'
  | 'internal_error'
  | 'network'
  | 'unknown';

export class DemoRagApiError extends Error {
  readonly code: DemoErrorCode;
  readonly status: number;

  constructor(code: DemoErrorCode, status: number) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, cache: 'no-store' });
  } catch {
    throw new DemoRagApiError('network', 0);
  }
  const data = (await res.json().catch(() => null)) as (T & { success?: boolean; code?: string }) | null;
  if (!res.ok || !data || data.success === false) {
    let code: DemoErrorCode = 'unknown';
    if (data && typeof data.code === 'string') code = data.code as DemoErrorCode;
    else if (res.status === 413) code = 'file_too_large';
    else if (res.status === 429) code = 'rate_limited';
    throw new DemoRagApiError(code, res.status);
  }
  return data;
}

/** Estado de la demo. Si el backend no responde, se trata como no disponible. */
export async function getDemoStatus(): Promise<DemoStatus> {
  try {
    return await request<DemoStatus>('/status');
  } catch {
    return { enabled: false, reason: 'unavailable', budgetExhausted: false };
  }
}

export async function uploadDemoDocument(input: {
  file: File;
  email: string;
  consent: boolean;
}): Promise<DemoDocument> {
  const form = new FormData();
  // Campos de texto antes del archivo: el backend los lee en el mismo multipart.
  form.append('email', input.email);
  form.append('consent', input.consent ? 'true' : 'false');
  form.append('file', input.file, input.file.name);
  const data = await request<{ document: DemoDocument }>('/documents', { method: 'POST', body: form });
  return data.document;
}

export async function getDemoDocument(docId: string): Promise<DemoDocument> {
  const data = await request<{ document: DemoDocument }>(`/documents/${encodeURIComponent(docId)}`);
  return data.document;
}

export async function askDemoDocument(docId: string, question: string): Promise<DemoAnswer> {
  return request<DemoAnswer>(`/documents/${encodeURIComponent(docId)}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
}

/** Borra el documento antes del TTL (al subir otro). Ignora errores. */
export async function deleteDemoDocument(docId: string): Promise<void> {
  try {
    await request(`/documents/${encodeURIComponent(docId)}`, { method: 'DELETE' });
  } catch {
    /* el TTL de 1 hora lo borra de todas formas */
  }
}
