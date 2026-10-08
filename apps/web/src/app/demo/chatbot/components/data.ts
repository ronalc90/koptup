/**
 * Tipos y constantes del Playground del chatbot RAG.
 *
 * Aquí no hay respuestas ni métricas inventadas: los mensajes, las fuentes y
 * los datos del pipeline salen de la respuesta real de
 * `POST /api/chatbot/bots/:id/chat` (ver `builder/api.ts`). La base de
 * conocimiento de ejemplo vive en `sampleKnowledge.ts`.
 */

/** Fragmento citado, tal como lo devolvió el backend. */
export interface SourceChunk {
  id: string;
  /** Posición de la cita en la respuesta: [1], [2]… */
  index: number;
  /** Nombre del documento de donde salió el fragmento. */
  docName: string;
  /** Puntaje BM25 del fragmento para la pregunta. */
  score: number;
  /** Texto exacto del fragmento. */
  text: string;
}

/** Datos reales de cómo se generó una respuesta (para "Cómo se respondió"). */
export interface AnswerMeta {
  /** Modelo que respondió según el backend (`gpt-4o-mini`, `extractive-bm25`…). */
  model: string;
  /** true si respondió un modelo de OpenAI (no el modo extractivo). */
  generative: boolean;
  /** true si el proveedor de IA falló y el backend cayó al modo extractivo. */
  providerError: boolean;
  /** Latencia del modelo medida por el backend (solo con modelo). */
  backendLatencyMs?: number;
  /** Tiempo total medido en el navegador (pregunta → respuesta). */
  clientLatencyMs: number;
  tokens?: { prompt?: number; completion?: number; total?: number };
  costUSD?: number;
  /** La respuesta dice que la información no está en los documentos. */
  notFound: boolean;
  /** Número de citas [n] distintas que aparecen en el texto y existen en las fuentes. */
  citationsUsed: number;
  /** Documentos indexados del bot cuando se respondió. */
  docsIndexed: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceChunk[];
  meta?: AnswerMeta;
  /** Esperando la respuesta del backend. */
  pending?: boolean;
  /** Clave de error de `chat.*` si la llamada falló. */
  errorKey?: 'errorNetwork' | 'errorGeneric';
  /** Pregunta que originó esta respuesta (para "Volver a preguntar"). */
  question?: string;
  feedback?: 'up' | 'down';
  /** Mensaje de bienvenida (no se envía como historial). */
  welcome?: boolean;
}

/** Catálogo de respaldo si `GET /api/chatbot/models` no responde (mismos ids que el backend). */
export const FALLBACK_MODELS: readonly { id: string; name: string }[] = [
  { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
] as const;

export const DEFAULT_MODEL_ID = 'gpt-4o-mini';

/** Capacidades reales que se listan en "Qué incluye hoy". */
export type IncludedKey = 'ingest' | 'chunking' | 'search' | 'answer' | 'models' | 'widget' | 'history';

export const INCLUDED_KEYS: readonly IncludedKey[] = [
  'ingest',
  'chunking',
  'search',
  'answer',
  'models',
  'widget',
  'history',
] as const;

/** Cuenta las citas [n] distintas del texto que corresponden a una fuente existente. */
export function countCitations(text: string, sourcesCount: number): number {
  const seen = new Set<number>();
  for (const m of text.matchAll(/\[(\d{1,2})\]/g)) {
    const n = Number(m[1]);
    if (n >= 1 && n <= sourcesCount) seen.add(n);
  }
  return seen.size;
}
