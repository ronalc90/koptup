/**
 * Asistente del sitio de ejemplo: búsqueda local por palabras clave sobre las
 * preguntas frecuentes PUBLICADAS y marcadas como disponibles para el
 * asistente. Simula el "momento RAG": lo que publicas es lo que se cita; en tu
 * proyecto esta búsqueda la hace tu asistente con IA sobre el mismo contenido.
 */
import { pick, normalize } from './text';
import type { AppState, Entry, L10n, Locale } from './types';

const STOP = new Set(
  'a al algo alguna como con cual cuales cuando de del desde donde el ella en es esa ese esta este hay la las le lo los me mi mis no o para pero por que se si sin sobre su sus te tengo tu tus un una uno y ya yo puedo debo necesito necesita hacer tiene tienen the a an and are can do does for how i in is it my of on or should the to what when where which who with you your need'.split(
    ' ',
  ),
);

export function tokens(s: string): string[] {
  return normalize(s)
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map(stem);
}

/** Raíz muy simple para plurales y género: "ecografías" ≈ "ecografía", "documentos" ≈ "documento". */
function stem(w: string): string {
  let s = w.length > 4 ? w.replace(/(es|s)$/, '') : w;
  if (s.length > 4) s = s.replace(/[aeio]$/, '');
  return s;
}

export interface FaqDoc {
  id: string;
  slug: string;
  question: string;
  answer: string;
  publishedAt: string | null;
}

/** Preguntas frecuentes que el asistente puede citar (publicadas y con el permiso activado). */
export function assistantDocs(state: Pick<AppState, 'entries'>, locale: Locale): FaqDoc[] {
  return state.entries
    .filter((e): e is Entry & { live: NonNullable<Entry['live']> } => e.type === 'faq' && !!e.live && e.live.fields.assistant === true)
    .map((e) => ({
      id: e.id,
      slug: e.live.slug,
      question: pick(e.live.fields.question as L10n, locale),
      answer: pick(e.live.fields.answer as L10n, locale),
      publishedAt: e.publishedAt,
    }));
}

export interface SearchHit {
  doc: FaqDoc;
  score: number;
}

export function searchFaqs(query: string, docs: FaqDoc[]): SearchHit | null {
  const q = Array.from(new Set(tokens(query)));
  if (q.length === 0) return null;
  let best: SearchHit | null = null;
  for (const doc of docs) {
    const qt = new Set(tokens(doc.question));
    const at = new Set(tokens(doc.answer));
    let score = 0;
    for (const w of q) {
      if (qt.has(w)) score += 2;
      else if (at.has(w)) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) best = { doc, score };
  }
  return best && best.score >= 2 ? best : null;
}
