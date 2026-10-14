/**
 * Tutor IA del curso: usa las rutas reales del chatbot RAG del backend
 * (`/api/chatbot`), igual que el resto de demos con IA:
 *   1. Cursos del catálogo de ejemplo: pide el bot de ejemplo COMPARTIDO del
 *      curso (`POST /sample-bots` con el guion de cada lección). El servidor
 *      devuelve el mismo bot a todos los visitantes (la clave es la huella del
 *      contenido), así que no se crea un bot por visitante ni se gasta el
 *      límite de bots nuevos por hora; sus conversaciones no se guardan.
 *      Cursos creados en la vista Instructor (o un servidor sin esa ruta):
 *      crea un bot de ejemplo propio (`POST /bots` con `kind: "sample"`) y le
 *      sube el guion (`POST /bots/:id/docs`); el id queda en localStorage.
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
  readonly status: number;

  constructor(kind: TutorErrorKind, message: string, status = 0) {
    super(message);
    this.kind = kind;
    this.status = status;
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
  if (res.status === 429) throw new TutorError('rateLimited', 'HTTP 429', 429);
  if (!res.ok) throw new TutorError('server', `HTTP ${res.status}`, res.status);
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
/** Bots compartidos ya resueltos en esta visita (el servidor siempre devuelve el mismo). */
const shared = new Map<string, StoredBot>();
/** El servidor no ofrece POST /sample-bots (versión anterior): se usa un bot propio. */
let sharedUnavailable = false;

function botConfig(course: Course, locale: Locale) {
  return {
    name: 'Tutor: ' + pick(course.title, locale).slice(0, 60),
    systemPrompt: persona(course, locale),
    tone: 'friendly',
    languages: [locale],
    avatar: 'AQ',
    color: '#0891b2',
  };
}

function fileOf(d: { name: string; text: string }) {
  return { name: d.name, size: new TextEncoder().encode(d.text).length, mime: 'text/plain', contentBase64: toBase64(d.text) };
}

/** Máximo de documentos de un bot de ejemplo compartido (igual que el backend). */
const SHARED_MAX_FILES = 5;

async function sharedBot(key: string, course: Course, locale: Locale): Promise<StoredBot> {
  const cached = shared.get(key);
  if (cached) return cached;
  const docs = courseDocs(course, locale);
  const r = await call<{ botId: string }>('/sample-bots', {
    method: 'POST',
    body: JSON.stringify({ sampleKey: `lms:${course.id}:${locale}:v${TUTOR_VERSION}`, config: botConfig(course, locale), files: docs.map(fileOf) }),
  });
  const entry: StoredBot = { botId: r.botId, ownerToken: null, version: TUTOR_VERSION, docs: docs.length };
  shared.set(key, entry);
  return entry;
}

async function createBot(key: string, course: Course, locale: Locale): Promise<StoredBot> {
  const docs = courseDocs(course, locale);
  const created = await call<{ botId: string; ownerToken?: string }>('/bots', {
    method: 'POST',
    // Bot de ejemplo: sus conversaciones no se guardan y el servidor lo borra tras 30 días sin uso.
    body: JSON.stringify({ ...botConfig(course, locale), kind: 'sample' }),
  });
  const ownerToken = typeof created.ownerToken === 'string' && created.ownerToken ? created.ownerToken : null;
  await call(`/bots/${encodeURIComponent(created.botId)}/docs`, {
    method: 'POST',
    headers: ownerToken ? { [OWNER_HEADER]: ownerToken } : {},
    body: JSON.stringify({ files: docs.map(fileOf) }),
  });
  const entry: StoredBot = { botId: created.botId, ownerToken, version: TUTOR_VERSION, docs: docs.length };
  writeEntry(key, entry);
  return entry;
}

async function resolveBot(key: string, course: Course, locale: Locale): Promise<StoredBot> {
  if (!course.custom && !sharedUnavailable && courseDocs(course, locale).length <= SHARED_MAX_FILES) {
    try {
      return await sharedBot(key, course, locale);
    } catch (err) {
      // Solo un servidor sin la ruta (404) pasa al bot propio; el resto de errores se informan.
      if (!(err instanceof TutorError) || err.status !== 404) throw err;
      sharedUnavailable = true;
    }
  }
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
      shared.delete(`${locale}:${course.id}`);
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
