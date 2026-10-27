/**
 * Motor del constructor "apunta y haz clic": genera selectores CSS a partir
 * del elemento que tocas, los aplica con `querySelectorAll` sobre la página y
 * convierte cada valor según su tipo. Todo corre en tu navegador sobre páginas
 * de ejemplo (o el HTML que pegues): no se visita ningún sitio externo.
 */
import { parseNumber } from './format';
import type { CellValue, Field, FieldType, Row } from './types';

const CLASS_OK = /^[a-zA-Z_][\w-]*$/;

/** Atributo que marca elementos resaltados por la demo (no forma parte de los selectores). */
export const KX_ATTRS = ['data-kx-hover', 'data-kx-match', 'data-kx-record'];

function segment(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const classes = Array.from(el.classList).filter((c) => CLASS_OK.test(c) && !c.startsWith('kx-'));
  return tag + classes.slice(0, 2).map((c) => `.${c}`).join('');
}

function safeQueryAll(root: ParentNode, selector: string): Element[] | null {
  try {
    return Array.from(root.querySelectorAll(selector));
  } catch {
    return null;
  }
}

export function isValidSelector(selector: string): boolean {
  if (!selector.trim()) return false;
  if (typeof document === 'undefined') return true;
  try {
    document.createDocumentFragment().querySelector(selector);
    return true;
  } catch {
    return false;
  }
}

/**
 * Selector para `el`.
 * - Dentro de un registro: el sufijo más corto cuyo primer resultado dentro del registro es `el`.
 * - En la página: el sufijo más corto que encuentra los mismos elementos "hermanos" que la ruta completa.
 */
export function buildSelector(el: Element, root: Element, recordSelector: string): { selector: string; scope: 'record' | 'page' } {
  let record: Element | null = null;
  if (recordSelector.trim()) {
    try {
      const candidate = el.closest(recordSelector);
      if (candidate && candidate !== el && root.contains(candidate)) record = candidate;
    } catch {
      record = null;
    }
  }
  const scopeRoot = record ?? root;
  const chain: Element[] = [];
  let cur: Element | null = el;
  while (cur && cur !== scopeRoot) {
    chain.unshift(cur);
    cur = cur.parentElement;
  }
  if (cur !== scopeRoot || chain.length === 0) return { selector: '', scope: 'page' };

  if (record) {
    const segs = chain.map((node) => {
      let s = segment(node);
      const parent = node.parentElement;
      if (parent) {
        const sameTag = Array.from(parent.children).filter((c) => c.tagName === node.tagName);
        const sameSeg = sameTag.filter((c) => segment(c) === s);
        if (sameSeg.length > 1) s += `:nth-of-type(${sameTag.indexOf(node) + 1})`;
      }
      return s;
    });
    for (let k = 1; k <= segs.length; k++) {
      const sel = segs.slice(segs.length - k).join(' ');
      try {
        if (record.querySelector(sel) === el) return { selector: sel, scope: 'record' };
      } catch {
        /* sigue con el siguiente */
      }
    }
    return { selector: segs.join(' > '), scope: 'record' };
  }

  const segs = chain.map(segment);
  const full = safeQueryAll(root, segs.join(' ')) ?? [el];
  for (let k = 1; k <= segs.length; k++) {
    const sel = segs.slice(segs.length - k).join(' ');
    const found = safeQueryAll(root, sel);
    if (found && found.length === full.length && found.includes(el)) return { selector: sel, scope: 'page' };
  }
  return { selector: segs.join(' '), scope: 'page' };
}

function textOf(el: Element): string {
  return (el.textContent || '').replace(/\s+/g, ' ').trim();
}

export function valueOf(el: Element | null | undefined, type: FieldType): CellValue {
  if (!el) return null;
  switch (type) {
    case 'number':
    case 'price':
      return parseNumber(textOf(el));
    case 'link': {
      const a = el.matches('a[href]') ? el : el.querySelector('a[href]') ?? el.closest('a[href]');
      return a ? a.getAttribute('href') : null;
    }
    case 'image': {
      const img = el.matches('img') ? el : el.querySelector('img');
      if (!img) return null;
      return img.getAttribute('src') || img.getAttribute('data-src') || null;
    }
    default: {
      const t = textOf(el);
      return t || null;
    }
  }
}

/** Sugiere un nombre y un tipo para un elemento recién tocado. */
export function guessField(el: Element): { name: string; type: FieldType } {
  const tag = el.tagName.toLowerCase();
  const cls = Array.from(el.classList).find((c) => CLASS_OK.test(c) && !c.startsWith('kx-'));
  const base = cls ?? el.getAttribute('itemprop') ?? tag;
  const pretty = base.replace(/[-_]+/g, ' ').trim();
  const name = pretty.charAt(0).toUpperCase() + pretty.slice(1);
  const text = textOf(el);
  let type: FieldType = 'text';
  if (tag === 'img' || (!text && el.querySelector('img'))) type = 'image';
  else if (tag === 'a' && !/\$|\d{2,}/.test(text)) type = 'link';
  else if (/\$|COP|S\/|US\$/.test(text) || /precio|price/i.test(base)) type = 'price';
  else if (/^\D{0,12}\d[\d.,]*\s*\D{0,20}$/.test(text) && /\d/.test(text)) type = 'number';
  return { name, type };
}

export interface FieldError { fieldId: string; kind: 'invalid' | 'empty' }

export interface ExtractResult {
  rows: Row[];
  recordCount: number;
  errors: FieldError[];
  matches: Record<string, number>;
}

/**
 * Aplica los campos a la página. Con selector de registro, una fila por
 * registro; sin él, la fila n toma la coincidencia n de cada campo.
 */
export function extract(root: ParentNode, recordSelector: string, fields: Field[]): ExtractResult {
  const errors: FieldError[] = [];
  const matches: Record<string, number> = {};
  const rows: Row[] = [];
  const records = recordSelector.trim() ? safeQueryAll(root, recordSelector) : null;
  const pageMatches: Record<string, Element[]> = {};
  for (const f of fields) {
    if (!f.selector.trim()) {
      errors.push({ fieldId: f.id, kind: 'empty' });
      pageMatches[f.id] = [];
      matches[f.id] = 0;
      continue;
    }
    const all = safeQueryAll(root, f.selector);
    if (all === null) {
      errors.push({ fieldId: f.id, kind: 'invalid' });
      pageMatches[f.id] = [];
      matches[f.id] = 0;
      continue;
    }
    pageMatches[f.id] = all;
    matches[f.id] = all.length;
  }
  const valid = (f: Field) => !errors.some((e) => e.fieldId === f.id);

  if (records && records.length > 0) {
    records.forEach((rec, i) => {
      const row: Row = {};
      for (const f of fields) {
        if (!valid(f)) {
          row[f.id] = null;
          continue;
        }
        if (f.scope === 'record') {
          let el: Element | null = null;
          try {
            el = rec.querySelector(f.selector);
          } catch {
            el = null;
          }
          row[f.id] = valueOf(el, f.type);
        } else {
          row[f.id] = valueOf(pageMatches[f.id][i], f.type);
        }
      }
      rows.push(row);
    });
    for (const f of fields) {
      if (f.scope === 'record' && valid(f)) {
        matches[f.id] = rows.filter((r) => r[f.id] !== null).length;
      }
    }
    return { rows, recordCount: records.length, errors, matches };
  }

  const n = Math.max(0, ...fields.filter(valid).map((f) => pageMatches[f.id].length));
  for (let i = 0; i < n; i++) {
    const row: Row = {};
    for (const f of fields) row[f.id] = valid(f) ? valueOf(pageMatches[f.id][i], f.type) : null;
    rows.push(row);
  }
  return { rows, recordCount: records ? 0 : n, errors, matches };
}

/** % de campos obligatorios con valor (100 si no hay obligatorios). */
export function quality(rows: Row[], requiredKeys: string[]): number {
  if (rows.length === 0) return 0;
  if (requiredKeys.length === 0) return 100;
  let ok = 0;
  for (const r of rows) for (const k of requiredKeys) if (r[k] !== null && r[k] !== '' && r[k] !== undefined) ok++;
  return Math.round((ok / (rows.length * requiredKeys.length)) * 1000) / 10;
}

// ---------------------------------------------------------------------------
// HTML que pega el visitante: se limpia con una lista de etiquetas permitidas.
// Sin scripts, estilos, iframes, formularios, SVG ni atributos de eventos; las
// imágenes no se descargan (su `src` pasa a `data-src`).
// ---------------------------------------------------------------------------

const ALLOWED = new Set([
  'div', 'span', 'p', 'a', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption', 'strong', 'em', 'b', 'i', 'u', 'small',
  'section', 'article', 'header', 'footer', 'main', 'nav', 'aside', 'figure', 'figcaption', 'img', 'br', 'hr',
  'time', 'data', 'mark', 'sup', 'sub', 'del', 'ins', 's', 'blockquote', 'pre', 'code', 'label', 'abbr', 'cite', 'address',
]);
const DROP = new Set([
  'script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'link', 'meta', 'base', 'noscript', 'template',
  'svg', 'math', 'form', 'input', 'button', 'select', 'option', 'textarea', 'video', 'audio', 'source', 'track', 'canvas',
  'xmp', 'plaintext', 'noembed', 'noframes', 'title', 'head', 'applet', 'portal', 'dialog',
]);
const ATTRS = new Set(['class', 'id', 'href', 'alt', 'title', 'datetime', 'value', 'itemprop', 'aria-label', 'lang']);

export const MAX_HTML_CHARS = 300_000;

export interface SanitizeResult { html: string; elements: number; removed: number; truncated: boolean }

export function sanitizeHtml(raw: string): SanitizeResult {
  const truncated = raw.length > MAX_HTML_CHARS;
  const doc = new DOMParser().parseFromString(truncated ? raw.slice(0, MAX_HTML_CHARS) : raw, 'text/html');
  let removed = 0;
  let elements = 0;
  const walk = (node: Node) => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.COMMENT_NODE || child.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
        child.parentNode?.removeChild(child);
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const el = child as Element;
      const tag = el.tagName.toLowerCase();
      if (DROP.has(tag) || elements > 4000) {
        removed++;
        el.remove();
        continue;
      }
      if (!ALLOWED.has(tag)) {
        removed++;
        walk(el);
        el.replaceWith(...Array.from(el.childNodes));
        continue;
      }
      elements++;
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        if (name === 'src' && tag === 'img') {
          el.setAttribute('data-src', attr.value);
          el.removeAttribute(attr.name);
        } else if (name === 'href') {
          // El navegador ignora espacios y caracteres de control al leer el esquema ("java\tscript:").
          // eslint-disable-next-line no-control-regex
          const v = attr.value.replace(/[\u0000- \u007f]/g, '');
          const scheme = v.match(/^([a-z][a-z0-9+.-]*):/i);
          if (scheme && !/^https?$/i.test(scheme[1])) el.removeAttribute(attr.name);
        } else if (name.startsWith('data-') && !name.startsWith('data-kx')) {
          // se conservan atributos data-* (algunas páginas guardan ahí el SKU o el precio)
        } else if (!ATTRS.has(name)) {
          el.removeAttribute(attr.name);
        }
      }
      walk(el);
    }
  };
  walk(doc.body);
  return { html: doc.body.innerHTML, elements, removed, truncated };
}

/** Quita las marcas de resaltado de la demo dentro de `root`. */
export function clearMarks(root: ParentNode, attrs = KX_ATTRS) {
  for (const a of attrs) root.querySelectorAll(`[${a}]`).forEach((n) => n.removeAttribute(a));
}

/** Resalta las coincidencias de un campo y devuelve cuántas hay. */
export function highlight(root: Element, recordSelector: string, field: Field): number {
  clearMarks(root, ['data-kx-match']);
  let found: Element[] = [];
  if (field.scope === 'record' && recordSelector.trim()) {
    const recs = safeQueryAll(root, recordSelector) ?? [];
    for (const r of recs) {
      try {
        const el = r.querySelector(field.selector);
        if (el) found.push(el);
      } catch {
        return -1;
      }
    }
  } else {
    const all = safeQueryAll(root, field.selector);
    if (all === null) return -1;
    found = all;
  }
  found.forEach((el) => el.setAttribute('data-kx-match', ''));
  return found.length;
}
