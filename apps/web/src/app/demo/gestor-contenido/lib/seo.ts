/**
 * Chequeos SEO reales sobre el contenido de la entrada (no es un puntaje
 * inventado): largo del título y de la meta descripción, slug, un solo H1,
 * texto alternativo de las imágenes, enlace interno y largo del artículo.
 */
import { titleOf, typeOf } from './models';
import { isInternalHref, linksIn, pick, SLUG_RE, stripHtml, wordCount } from './text';
import type { AppState, Entry, EntryContent, Locale } from './types';

export type SeoCheckId = 'titleLength' | 'descriptionLength' | 'slug' | 'singleH1' | 'imageAlt' | 'internalLink' | 'bodyLength';

export interface SeoCheck {
  id: SeoCheckId;
  ok: boolean;
  /** Dato que explica el resultado (largo, cantidad o nombres de imagen). */
  value: number | string;
}

export const TITLE_RANGE = [30, 60] as const;
export const DESCRIPTION_RANGE = [70, 160] as const;
export const ARTICLE_MIN_WORDS = 80;

/** Título que verá el buscador: el título SEO o, si falta, el de la entrada. */
export function seoTitle(entry: Pick<Entry, 'type'>, content: EntryContent, locale: Locale): string {
  return pick(content.seo.title, locale).trim() || titleOf(entry, content, locale);
}

export function seoDescription(content: EntryContent, locale: Locale): string {
  return pick(content.seo.description, locale).trim();
}

/** Imágenes usadas por la entrada (campos de imagen y bloques). */
export function imagesOf(state: Pick<AppState, 'types'>, entry: Pick<Entry, 'type'>, content: EntryContent): string[] {
  const type = typeOf(state.types, entry.type);
  const ids: string[] = [];
  for (const def of type.fields) {
    const v = content.fields[def.id];
    if (def.kind === 'image' && typeof v === 'string' && v) ids.push(v);
  }
  for (const b of content.blocks) if (b.kind === 'image' && b.mediaId) ids.push(b.mediaId);
  return Array.from(new Set(ids));
}

export function bodyText(content: EntryContent, locale: Locale): string {
  return content.blocks
    .map((b) => {
      switch (b.kind) {
        case 'heading':
          return pick(b.text, locale);
        case 'paragraph':
          return stripHtml(pick(b.html, locale));
        case 'faq':
          return `${pick(b.question, locale)} ${pick(b.answer, locale)}`;
        default:
          return '';
      }
    })
    .join('\n');
}

export function seoChecks(state: Pick<AppState, 'types' | 'media' | 'entries'>, entry: Pick<Entry, 'id' | 'type'>, content: EntryContent, locale: Locale): SeoCheck[] {
  const type = typeOf(state.types, entry.type);
  const checks: SeoCheck[] = [];
  const title = seoTitle(entry, content, locale);
  checks.push({ id: 'titleLength', ok: title.length >= TITLE_RANGE[0] && title.length <= TITLE_RANGE[1], value: title.length });
  const desc = seoDescription(content, locale);
  checks.push({ id: 'descriptionLength', ok: desc.length >= DESCRIPTION_RANGE[0] && desc.length <= DESCRIPTION_RANGE[1], value: desc.length });
  const taken = state.entries.some((x) => x.id !== entry.id && x.type === entry.type && (x.content.slug === content.slug || x.live?.slug === content.slug));
  checks.push({ id: 'slug', ok: SLUG_RE.test(content.slug) && !taken, value: content.slug });
  const hasBlocks = type.fields.some((f) => f.kind === 'blocks');
  if (hasBlocks) {
    const h1 = content.blocks.filter((b) => b.kind === 'heading' && b.level === 1).length;
    checks.push({ id: 'singleH1', ok: h1 === 0, value: h1 + 1 });
  }
  const missingAlt = imagesOf(state, entry, content)
    .map((id) => state.media.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => !!m && !m.alt[locale].trim())
    .map((m) => m.name);
  checks.push({ id: 'imageAlt', ok: missingAlt.length === 0, value: missingAlt.join(', ') });
  if (hasBlocks) {
    const hrefs = content.blocks.flatMap((b) => (b.kind === 'paragraph' ? linksIn(pick(b.html, locale)) : b.kind === 'button' ? [b.href] : []));
    const internal = hrefs.filter(isInternalHref).length;
    checks.push({ id: 'internalLink', ok: internal > 0, value: internal });
  }
  if (entry.type === 'article') {
    const words = wordCount(bodyText(content, locale));
    checks.push({ id: 'bodyLength', ok: words >= ARTICLE_MIN_WORDS, value: words });
  }
  return checks;
}
