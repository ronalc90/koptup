/**
 * API de entrega simulada en el navegador: arma el mismo JSON que serviría el
 * CMS (`GET /api/v1/entries`) a partir del estado de la demo. Sin vista previa
 * solo entrega la versión publicada; con vista previa, los borradores.
 */
import { API_ORIGIN, CDN_ORIGIN, pathOf, SITE_ORIGIN, titleOf, typeOf } from './models';
import { isL10n, pick, pickWithFallback } from './text';
import type { AppState, Block, Entry, EntryContent, Locale, TypeId } from './types';

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

export interface ApiQuery {
  type: TypeId | 'all';
  locale: Locale;
  preview: boolean;
}

function contentFor(entry: Entry, preview: boolean): EntryContent | null {
  return preview ? entry.content : entry.live;
}

function imageJson(state: Pick<AppState, 'media'>, id: unknown, locale: Locale): Json {
  if (typeof id !== 'string' || !id) return null;
  const m = state.media.find((x) => x.id === id);
  if (!m) return null;
  return {
    id: m.id,
    url: `${CDN_ORIGIN}/media/${m.name}`,
    alt: pick(m.alt, locale),
    width: m.width,
    height: m.height,
    focalPoint: { x: m.focal.x / 100, y: m.focal.y / 100 },
  };
}

function refJson(state: Pick<AppState, 'entries'>, id: unknown, locale: Locale, preview: boolean): Json {
  if (typeof id !== 'string' || !id) return null;
  const e = state.entries.find((x) => x.id === id);
  const c = e ? contentFor(e, preview) : null;
  if (!e || !c) return null;
  return { id: e.id, type: e.type, slug: c.slug, title: titleOf(e, c, locale) };
}

function blockJson(state: Pick<AppState, 'media'>, b: Block, locale: Locale): Json {
  switch (b.kind) {
    case 'heading':
      return { type: 'heading', level: b.level, text: pick(b.text, locale) };
    case 'paragraph':
      return { type: 'richText', html: pick(b.html, locale) };
    case 'image':
      return { type: 'image', image: imageJson(state, b.mediaId, locale), caption: pick(b.caption, locale) };
    case 'button':
      return { type: 'button', label: pick(b.label, locale), href: b.href };
    case 'faq':
      return { type: 'faq', question: pick(b.question, locale), answer: pick(b.answer, locale) };
  }
}

/** JSON de una entrada, o null si no hay versión que entregar. */
export function entryJson(state: Pick<AppState, 'types' | 'media' | 'entries'>, entry: Entry, locale: Locale, preview: boolean): Json | null {
  const c = contentFor(entry, preview);
  if (!c) return null;
  const type = typeOf(state.types, entry.type);
  const fields: { [k: string]: Json } = {};
  const fallback: string[] = [];
  let body: Json = null;
  for (const def of type.fields) {
    if (def.kind === 'blocks') {
      body = c.blocks.map((b) => blockJson(state, b, locale));
      continue;
    }
    const v = c.fields[def.id];
    if (isL10n(v)) {
      const r = pickWithFallback(v, locale);
      if (r.fallback) fallback.push(def.id);
      fields[def.id] = r.text;
    } else if (def.kind === 'image') fields[def.id] = imageJson(state, v, locale);
    else if (def.kind === 'reference') fields[def.id] = refJson(state, v, locale, preview);
    else if (def.kind === 'references') fields[def.id] = (Array.isArray(v) ? v : []).map((id) => refJson(state, id, locale, preview)).filter((x) => x !== null);
    else fields[def.id] = (v ?? null) as Json;
  }
  const out: { [k: string]: Json } = {
    id: entry.id,
    type: entry.type,
    slug: c.slug,
    locale,
    status: preview ? entry.status : 'published',
    publishedAt: entry.publishedAt,
    updatedAt: entry.updatedAt,
    fields,
  };
  if (body) out.body = body;
  if (type.hasSeo) {
    out.seo = {
      title: pick(c.seo.title, locale) || titleOf(entry, c, locale),
      description: pick(c.seo.description, locale),
      canonical: `${SITE_ORIGIN}${locale === 'en' ? '/en' : ''}${pathOf(entry.type, c.slug)}`,
    };
  }
  if (fallback.length) out.localeFallback = fallback;
  return out;
}

export function listJson(state: Pick<AppState, 'types' | 'media' | 'entries'>, q: ApiQuery): Json {
  const data = state.entries
    .filter((e) => q.type === 'all' || e.type === q.type)
    .map((e) => entryJson(state, e, q.locale, q.preview))
    .filter((x): x is Json => x !== null);
  return { data, meta: { total: data.length, locale: q.locale, preview: q.preview } };
}

export function listUrl(q: ApiQuery): string {
  const params = new URLSearchParams();
  if (q.type !== 'all') params.set('type', q.type);
  params.set('locale', q.locale);
  if (q.preview) params.set('preview', 'true');
  return `${API_ORIGIN}/api/v1/entries?${params.toString()}`;
}

export function entryUrl(entry: Pick<Entry, 'type'>, slug: string, locale: Locale, preview: boolean): string {
  return `${API_ORIGIN}/api/v1/entries/${entry.type}/${slug}?locale=${locale}${preview ? '&preview=true' : ''}`;
}
