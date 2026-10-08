/**
 * Tutor IA del curso: usa las rutas reales del chatbot RAG del backend
 * (`/api/chatbot`), igual que el resto de demos con IA:
 *   1. La primera vez que preguntas en un curso, crea un bot (`POST /bots`) y
 *      le sube el guion de cada lección como documento de texto
 *      (`POST /bots/:id/docs`). El id queda en localStorage para reutilizarlo.
 *   2. Cada pregunta va a `POST /bots/:id/chat`: el backend busca los
 *      fragmentos del material y, si tiene clave del proveedor de IA, llama al
 *      modelo con reglas para no inventar y citar la fuente. Sin clave
 *      responde en modo extractivo (los fragmentos tal cual) y la interfaz lo
 *      dice. Si el servidor no responde, la demo busca en el material del
 *      navegador y también lo dice: nunca se presenta como IA lo que no lo es.
 */
import { BACKEND_URL } from '@/lib/backend-url';
import { clock } from './dates';
import { firstStamp, lessonsOf, pick } from './engine';
import type { Course, Locale } from './types';

const API = `${BACKEND_URL}/api/chatbot`;
const STORAGE_KEY = 'koptup.lms.tutorBots';
const OWNER_HEADER = 'X-Bot-Owner-Token';
/** Súbelo si cambia el guion de las lecciones: obliga a reindexar. */
export const TUTOR_VERSION = 1;

export type TutorErrorKind = 'network' | 'rateLimited' | 'server';

export class TutorError extends Error {
  readonly kind: TutorErrorKind;

  constructor(kind: TutorErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

export interface TutorSource {
  index: number;
  lessonId: string | null;
  at: number | null;
  name: string;
  chunk: string;
}

export interface TutorAnswer {
  reply: string;
  sources: TutorSource[];
  model: string;
  /** true si respondió un modelo de lenguaje; false en modo extractivo. */
  llm: boolean;
  /** Motivo por el que no hubo IA (sin clave, cupo agotado, error del proveedor). */
  degraded: 'none' | 'noKey' | 'budget' | 'provider';
}

interface StoredBot {
  botId: string;
  ownerToken: string | null;
  version: number;
  docs: number;
}

type Store = Record<string, StoredBot>;

function readAll(): Store {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? ((JSON.parse(raw) as Store) ?? {}) : {};
  } catch {
    return {};
  }
}

function writeEntry(key: string, entry: StoredBot | null) {
  try {
    const all = readAll();
    if (entry) all[key] = entry;
    else delete all[key];
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
    throw new TutorError('network', 'network');
  }
  if (res.status === 429) throw new TutorError('rateLimited', 'HTTP 429');
  if (!res.ok) throw new TutorError('server', `HTTP ${res.status}`);
  return (await res.json()) as T;
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/** Documentos del curso: un archivo de texto por lección, con los minutos del video. */
export function courseDocs(course: Course, locale: Locale): { name: string; text: string }[] {
  const lessonWord = locale === 'en' ? 'Lesson' : 'Lección';
  return lessonsOf(course)
    .filter((x) => x.kind !== 'quiz' && x.lines.length > 0)
    .map((lesson) => {
      const title = pick(lesson.title, locale);
      const body = lesson.lines
        .map((ln) => (lesson.kind === 'video' ? `[${clock(ln.at)}] ${pick(ln.text, locale)}` : pick(ln.text, locale)))
        .join('\n\n');
      return {
        name: `L${lesson.n} - ${title}.txt`,
        text: `${pick(course.title, locale)}. ${lessonWord} ${lesson.n}: ${title}.\n\n${body}`,
      };
    });
}

export function hasMaterial(course: Course): boolean {
  return lessonsOf(course).some((x) => x.kind !== 'quiz' && x.lines.length > 0);
}

function persona(course: Course, locale: Locale): string {
  return locale === 'en'
    ? `You are the tutor of the course "${course.title.en}" at Academia Quindé (sample academy). You answer students' questions using only the course material, in a friendly and clear tone, in at most four sentences.`
    : `Eres el tutor del curso «${course.title.es}» de Academia Quindé (academia de ejemplo). Respondes las dudas de los estudiantes solo con el material del curso, con tono cercano y claro, en máximo cuatro frases. Trata al estudiante de "tú".`;
}

const inflight = new Map<string, Promise<StoredBot>>();

async function createBot(key: string, course: Course, locale: Locale): Promise<StoredBot> {
  const docs = courseDocs(course, locale);
  const created = await call<{ botId: string; ownerToken?: string }>('/bots', {
    method: 'POST',
    body: JSON.stringify({
      name: (locale === 'en' ? 'Tutor: ' : 'Tutor: ') + pick(course.title, locale).slice(0, 60),
      systemPrompt: persona(course, locale),
      tone: 'friendly',
      languages: [locale],
      avatar: 'AQ',
      color: '#0891b2',
    }),
  });
  const ownerToken = typeof created.ownerToken === 'string' && created.ownerToken ? created.ownerToken : null;
  await call(`/bots/${encodeURIComponent(created.botId)}/docs`, {
    method: 'POST',
    headers: ownerToken ? { [OWNER_HEADER]: ownerToken } : {},
    body: JSON.stringify({
      files: docs.map((d) => ({
        name: d.name,
        size: new TextEncoder().encode(d.text).length,
        mime: 'text/plain',
        contentBase64: toBase64(d.text),
      })),
    }),
  });
  const entry: StoredBot = { botId: created.botId, ownerToken, version: TUTOR_VERSION, docs: docs.length };
  writeEntry(key, entry);
  return entry;
}

async function resolveBot(key: string, course: Course, locale: Locale): Promise<StoredBot> {
  const stored = readAll()[key];
  const docs = courseDocs(course, locale).length;
  if (stored && stored.version === TUTOR_VERSION && stored.docs === docs) {
    try {
      const bot = await call<{ docs?: unknown[] }>(`/bots/${encodeURIComponent(stored.botId)}`, {
        headers: stored.ownerToken ? { [OWNER_HEADER]: stored.ownerToken } : {},
      });
      if (Array.isArray(bot.docs) && bot.docs.length === docs) return stored;
    } catch (err) {
      if (!(err instanceof TutorError) || err.kind !== 'server') throw err;
    }
  }
  writeEntry(key, null);
  return createBot(key, course, locale);
}

function ensureBot(course: Course, locale: Locale): Promise<StoredBot> {
  const key = `${locale}:${course.id}`;
  const pending = inflight.get(key);
  if (pending) return pending;
  const p = resolveBot(key, course, locale).finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

interface ChatResponse {
  reply: string;
  sources?: { index?: number; name?: string; chunk?: string }[];
  model?: string;
  error?: string;
}

export async function askTutor(
  course: Course,
  locale: Locale,
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[],
): Promise<TutorAnswer> {
  const bot = await ensureBot(course, locale);
  let r: ChatResponse;
  try {
    r = await call<ChatResponse>(`/bots/${encodeURIComponent(bot.botId)}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message: message.slice(0, 1500), history: history.slice(-6) }),
    });
  } catch (err) {
    // El servidor pudo reiniciarse y perder el bot: se recrea una vez.
    if (err instanceof TutorError && err.kind === 'server') {
      writeEntry(`${locale}:${course.id}`, null);
      const again = await ensureBot(course, locale);
      r = await call<ChatResponse>(`/bots/${encodeURIComponent(again.botId)}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message: message.slice(0, 1500), history: history.slice(-6) }),
      });
    } else {
      throw err;
    }
  }
  const lessons = lessonsOf(course);
  const model = r.model || '';
  const llm = model !== '' && !model.startsWith('extractive');
  return {
    reply: String(r.reply || '').trim(),
    sources: (r.sources || []).map((s, i) => {
      const name = String(s.name || '').replace(/\.txt$/i, '');
      const n = Number((name.match(/^L(\d+)\b/) || [])[1]);
      const lesson = lessons.find((x) => x.n === n);
      const chunk = String(s.chunk || '');
      return { index: typeof s.index === 'number' ? s.index : i + 1, lessonId: lesson?.id ?? null, at: lesson?.kind === 'video' ? firstStamp(chunk) : null, name, chunk };
    }),
    model,
    llm,
    degraded: llm
      ? 'none'
      : r.error === 'budget_exhausted' || r.error === 'budget_unavailable'
        ? 'budget'
        : r.error === 'llm_provider_error'
          ? 'provider'
          : 'noKey',
  };
}
