/**
 * Qué documentos se ven: vista (todos, favoritos, recientes, papelera,
 * carpeta), filtros, búsqueda y orden. Función pura para poder probarla.
 */
import { diffDays } from './dates';
import { queryTerms, rank, snippet, tokenize, type IndexedDoc, type Snippet } from './search';
import type { DateFilter, DocItem, Filters, SortKey, Stamp, View } from './types';

export interface SelectOptions {
  view: View;
  folder: string;
  query: string;
  filters: Filters;
  sort: SortKey;
  now: Stamp;
}

export interface VisibleDoc {
  doc: DocItem;
  score: number;
  snippet: Snippet | null;
}

const DATE_DAYS: Record<Exclude<DateFilter, 'all'>, number> = { d7: 7, d30: 30, d365: 365 };

/** Texto en el que se busca: nombre, etiquetas, palabras clave, resumen, entidades y contenido. */
export function searchableText(d: DocItem): string {
  return [
    d.name,
    d.tags.join(' '),
    (d.keywords || []).join(' '),
    d.summary || '',
    (d.entities || []).map((e) => e.value).join(' '),
    (d.entitiesText || []).join(' '),
    d.text || '',
  ].join('\n');
}

export function indexDocs(docs: DocItem[]): IndexedDoc[] {
  return docs.map((d) => ({ id: d.id, tokens: tokenize(searchableText(d)) }));
}

/** Los 10 más recientes que no están en la papelera. */
export function recentIds(docs: DocItem[]): Set<string> {
  return new Set(
    docs
      .filter((d) => !d.deleted)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10)
      .map((d) => d.id),
  );
}

export function selectDocs(docs: DocItem[], o: SelectOptions): VisibleDoc[] {
  const recent = o.view === 'recent' ? recentIds(docs) : null;
  let list = docs.filter((d) => {
    if (o.view === 'trash') return d.deleted;
    if (d.deleted) return false;
    if (o.view === 'favorites') return d.favorite;
    if (o.view === 'recent') return recent!.has(d.id);
    if (o.view === 'folder') return d.folder === o.folder;
    return true;
  });
  if (o.filters.type !== 'all') list = list.filter((d) => d.kind === o.filters.type);
  if (o.filters.date !== 'all') {
    const max = DATE_DAYS[o.filters.date];
    list = list.filter((d) => diffDays(d.createdAt, o.now) <= max);
  }
  if (o.filters.tag) list = list.filter((d) => d.tags.includes(o.filters.tag));

  const q = o.query.trim();
  let scores = new Map<string, { score: number; hits: string[] }>();
  if (q) {
    const terms = queryTerms(q, false);
    const ranked = rank(indexDocs(list), terms);
    scores = new Map(ranked.map((r) => [r.id, { score: r.score, hits: r.hits }]));
    list = list.filter((d) => scores.has(d.id));
  }

  const sort: SortKey = o.sort === 'relevance' && !q ? 'newest' : o.sort;
  const sorted = [...list].sort((a, b) => {
    switch (sort) {
      case 'relevance':
        return (scores.get(b.id)?.score || 0) - (scores.get(a.id)?.score || 0);
      case 'oldest':
        return a.createdAt.localeCompare(b.createdAt);
      case 'name':
        return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      case 'size':
        return b.sizeBytes - a.sizeBytes;
      default:
        return o.view === 'trash' && a.deletedAt && b.deletedAt ? b.deletedAt.localeCompare(a.deletedAt) : b.createdAt.localeCompare(a.createdAt);
    }
  });

  return sorted.map((doc) => {
    const s = scores.get(doc.id);
    return {
      doc,
      score: s?.score || 0,
      snippet: s && doc.text ? snippet(doc.text, s.hits) : null,
    };
  });
}

/** Todas las etiquetas de los documentos visibles (para el filtro por etiqueta). */
export function allTags(docs: DocItem[]): string[] {
  const set = new Set<string>();
  docs.forEach((d) => !d.deleted && d.tags.forEach((t) => set.add(t)));
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
}

export interface ExpandedHit {
  doc: DocItem;
  score: number;
  /** Términos escritos que coincidieron. */
  direct: string[];
  /** Términos relacionados (sinónimos de ejemplo) que coincidieron. */
  related: string[];
  snippet: Snippet | null;
}

/** Búsqueda ampliada con términos relacionados (datos de ejemplo, sin IA). */
export function expandedSearch(docs: DocItem[], query: string, limit = 8): ExpandedHit[] {
  const active = docs.filter((d) => !d.deleted);
  const terms = queryTerms(query, true);
  const written = new Set(terms.map((x) => x.term));
  const ranked = rank(indexDocs(active), terms).slice(0, limit);
  const top = ranked[0]?.score || 1;
  return ranked.map((r) => {
    const doc = active.find((d) => d.id === r.id)!;
    return {
      doc,
      score: r.score / top,
      direct: r.hits.filter((h) => written.has(h)),
      related: r.hits.filter((h) => !written.has(h)),
      snippet: doc.text ? snippet(doc.text, r.hits) : null,
    };
  });
}
