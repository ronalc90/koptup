/** Modelos de contenido de ejemplo y utilidades sobre ellos. */
import { isL10n, pick } from './text';
import type { ContentType, Entry, EntryContent, FieldDef, L10n, Locale, TypeId } from './types';

const f = (id: string, kind: FieldDef['kind'], required: boolean, localized: boolean, extra: Partial<FieldDef> = {}): FieldDef => ({
  id,
  kind,
  required,
  localized,
  ...extra,
});

export const DEFAULT_TYPES: ContentType[] = [
  {
    id: 'page',
    route: '/',
    hasSeo: true,
    fields: [f('title', 'text', true, true, { max: 70 }), f('summary', 'longText', false, true, { max: 200 }), f('heroImage', 'image', false, false), f('body', 'blocks', false, true)],
  },
  {
    id: 'article',
    route: '/blog/',
    hasSeo: true,
    fields: [
      f('title', 'text', true, true, { max: 70 }),
      f('excerpt', 'longText', true, true, { max: 200 }),
      f('category', 'text', false, true, { max: 40 }),
      f('cover', 'image', false, false),
      f('body', 'blocks', true, true),
    ],
  },
  {
    id: 'location',
    route: '/sedes/',
    hasSeo: true,
    fields: [
      f('name', 'text', true, true, { max: 60 }),
      f('city', 'text', true, false, { max: 40 }),
      f('address', 'text', true, false, { max: 80 }),
      f('hours', 'longText', true, true, { max: 160 }),
      f('whatsapp', 'phone', true, false),
      f('photo', 'image', false, false),
      f('services', 'references', false, false, { refType: 'service' }),
      f('description', 'longText', false, true, { max: 300 }),
    ],
  },
  {
    id: 'service',
    route: '/servicios/',
    hasSeo: true,
    fields: [
      f('name', 'text', true, true, { max: 60 }),
      f('summary', 'longText', true, true, { max: 240 }),
      f('priceFrom', 'number', false, false),
      f('preparation', 'longText', false, true, { max: 400 }),
      f('image', 'image', false, false),
    ],
  },
  {
    id: 'faq',
    route: '/preguntas-frecuentes#',
    hasSeo: false,
    fields: [
      f('question', 'text', true, true, { max: 120 }),
      f('answer', 'longText', true, true, { max: 600 }),
      f('service', 'reference', false, false, { refType: 'service' }),
      f('assistant', 'boolean', false, false),
    ],
  },
];

export const TITLE_FIELD: Record<TypeId, string> = {
  page: 'title',
  article: 'title',
  location: 'name',
  service: 'name',
  faq: 'question',
};

export function typeOf(types: ContentType[], id: TypeId): ContentType {
  const t = types.find((x) => x.id === id);
  if (!t) throw new Error(`Tipo desconocido: ${id}`);
  return t;
}

export function titleOf(entry: Pick<Entry, 'type'>, content: EntryContent, locale: Locale): string {
  const v = content.fields[TITLE_FIELD[entry.type]];
  return isL10n(v) ? pick(v, locale) : '';
}

/** Ruta pública de la entrada en el sitio de ejemplo. */
export function pathOf(type: TypeId, slug: string): string {
  switch (type) {
    case 'page':
      return slug === 'inicio' ? '/' : `/${slug}`;
    case 'article':
      return `/blog/${slug}`;
    case 'location':
      return `/sedes/${slug}`;
    case 'service':
      return `/servicios/${slug}`;
    case 'faq':
      return `/preguntas-frecuentes#${slug}`;
  }
}

/** Rutas que el sitio debe regenerar cuando cambia una entrada publicada. */
export function revalidatePaths(type: TypeId, slug: string): string[] {
  const own = pathOf(type, slug);
  const list: Record<TypeId, string | null> = {
    page: null,
    article: '/blog',
    location: '/sedes',
    service: '/servicios',
    faq: '/preguntas-frecuentes',
  };
  const out = [own.split('#')[0] || '/'];
  const l = list[type];
  if (l && !out.includes(l)) out.push(l);
  return out;
}

export const SITE_ORIGIN = 'https://montana-azul.example';
export const CDN_ORIGIN = 'https://cdn.montana-azul.example';
export const API_ORIGIN = 'https://cms.montana-azul.example';

/** Valor vacío para un campo nuevo según su tipo. */
export function emptyValue(def: FieldDef): EntryContent['fields'][string] {
  if (def.localized && (def.kind === 'text' || def.kind === 'longText')) return { es: '', en: '' } as L10n;
  switch (def.kind) {
    case 'boolean':
      return false;
    case 'references':
      return [];
    case 'number':
    case 'image':
    case 'reference':
      return null;
    default:
      return '';
  }
}

/** Campos obligatorios sin valor (en español, el idioma por defecto). */
export function missingRequired(type: ContentType, content: EntryContent): string[] {
  const out: string[] = [];
  for (const def of type.fields) {
    if (!def.required) continue;
    if (def.kind === 'blocks') {
      if (content.blocks.length === 0) out.push(def.id);
      continue;
    }
    const v = content.fields[def.id];
    if (v === null || v === undefined) out.push(def.id);
    else if (isL10n(v)) {
      if (!v.es.trim()) out.push(def.id);
    } else if (typeof v === 'string' && !v.trim()) out.push(def.id);
    else if (Array.isArray(v) && v.length === 0) out.push(def.id);
  }
  return out;
}

/** Campos traducibles con texto en español y sin texto en inglés. */
export function missingTranslations(type: ContentType, content: EntryContent): string[] {
  const out: string[] = [];
  for (const def of type.fields) {
    if (!def.localized) continue;
    if (def.kind === 'blocks') {
      const missing = content.blocks.some((b) => {
        switch (b.kind) {
          case 'heading':
            return !!b.text.es.trim() && !b.text.en.trim();
          case 'paragraph':
            return !!b.html.es.trim() && !b.html.en.trim();
          case 'image':
            return !!b.caption.es.trim() && !b.caption.en.trim();
          case 'button':
            return !!b.label.es.trim() && !b.label.en.trim();
          case 'faq':
            return (!!b.question.es.trim() && !b.question.en.trim()) || (!!b.answer.es.trim() && !b.answer.en.trim());
        }
      });
      if (missing) out.push(def.id);
      continue;
    }
    const v = content.fields[def.id];
    if (isL10n(v) && v.es.trim() && !v.en.trim()) out.push(def.id);
  }
  if (type.hasSeo) {
    if (content.seo.title.es.trim() && !content.seo.title.en.trim()) out.push('seo.title');
    if (content.seo.description.es.trim() && !content.seo.description.en.trim()) out.push('seo.description');
  }
  return out;
}

export function sameContent(a: EntryContent | null, b: EntryContent | null): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** ¿La versión de trabajo tiene cambios que el sitio todavía no muestra? */
export function hasUnpublishedChanges(entry: Pick<Entry, 'live' | 'content'>): boolean {
  return !!entry.live && !sameContent(entry.live, entry.content);
}
