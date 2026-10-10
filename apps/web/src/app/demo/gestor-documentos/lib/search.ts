/**
 * Búsqueda en el navegador para los datos de ejemplo (y para filtrar la lista
 * de la cuenta): ranking BM25 sobre nombre, etiquetas, palabras clave, resumen
 * y texto, con coincidencia por prefijo ("contrat" encuentra "contrato").
 *
 * La "búsqueda ampliada" agrega términos relacionados de un diccionario de
 * sinónimos de ejemplo. No es IA: la búsqueda por significado real (embeddings)
 * la hace el servidor sobre los documentos de la cuenta.
 */

const STOPWORDS = new Set(
  (
    'a al ante con contra de del desde el en entre es esta este esto la las lo los mas o para por que se sin sobre su sus un una uno y ya ' +
    'solo sola solos solas cual cuales como donde cuando todo toda todos todas hay son fue ser estan tiene tienen nos mis tus muy otro otra otros otras tal asi mismo ' +
    'the of and to in for on with by from at an is are be this that it as or'
  ).split(' '),
);

/** Minúsculas y sin tildes, conservando la posición de cada carácter en el original. */
export function normalizeWithMap(text: string): { norm: string; map: number[] } {
  let norm = '';
  const map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const base = text[i].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    for (const ch of base) {
      norm += ch;
      map.push(i);
    }
  }
  return { norm, map };
}

export function normalize(text: string): string {
  return normalizeWithMap(text).norm;
}

/** Palabras de 2+ caracteres, sin tildes ni palabras vacías. */
export function tokenize(text: string): string[] {
  return (normalize(text).match(/[a-z0-9ñ]+/g) || []).filter((w) => w.length >= 2 && !STOPWORDS.has(w));
}

/**
 * Grupos de términos relacionados (raíces sin tildes). Una palabra pertenece a
 * un grupo si empieza por alguna de sus raíces.
 */
export const SYNONYM_GROUPS: string[][] = [
  ['contrat', 'acuerdo', 'convenio', 'otrosi'],
  ['renov', 'renuev', 'prorrog'],
  ['venc', 'vigen', 'plazo', 'expir', 'caduc'],
  ['pago', 'pagar', 'factur', 'cobro', 'honorar', 'canon', 'anticip', 'abono'],
  ['poliza', 'segur', 'amparo', 'garant', 'asegurad'],
  ['penal', 'multa', 'sancion', 'indemni', 'perjuic'],
  ['termina', 'rescin', 'cancel', 'preaviso'],
  ['confiden', 'reserva', 'secreto'],
  ['presupuest', 'costo', 'gasto', 'capitulo'],
  ['concret', 'cement', 'premezcl', 'material', 'varilla', 'acero', 'ferreter', 'suministr', 'proveedor'],
  ['emplead', 'trabajador', 'personal', 'laboral', 'salari', 'hoja', 'ingenier', 'perfil', 'experienc', 'cargo'],
  ['obra', 'construc', 'torre', 'proyect', 'edifici', 'estructur'],
  ['licencia', 'permiso', 'curadur', 'autoriz'],
  ['acta', 'reunion', 'comite', 'junta', 'aprob', 'compromiso', 'decision'],
  ['impuest', 'iva', 'retencion', 'tribut'],
  ['arriend', 'arrend', 'alquil', 'bodega', 'inmueble'],
  ['equipo', 'maquinar', 'grua', 'formalet', 'andamio'],
  ['riesgo', 'retras', 'demora', 'lluvia', 'atras'],
];

export interface IndexedDoc {
  id: string;
  tokens: string[];
}

export interface QueryTerm {
  /** Palabra escrita (raíz). */
  term: string;
  /** Prefijos que cuentan como coincidencia: la palabra y, en la búsqueda ampliada, sus términos relacionados. */
  alts: string[];
}

/** Raíz simple para la consulta: quita el plural ("contratos" → "contrato"). */
export function stem(word: string): string {
  if (word.length > 5 && word.endsWith('ces')) return `${word.slice(0, -3)}z`;
  if (word.length > 6 && word.endsWith('ones')) return word.slice(0, -2);
  if (word.length > 4 && word.endsWith('s')) return word.slice(0, -1);
  return word;
}

function groupOf(word: string): string[] | undefined {
  return SYNONYM_GROUPS.find((group) => group.some((root) => word.startsWith(root) || (word.length >= 4 && root.startsWith(word))));
}

/**
 * Términos de la consulta. Con `expand`, cada palabra se vuelve un "concepto"
 * con sus términos relacionados: el concepto cuenta como un solo término
 * (su frecuencia en el corpus incluye a los sinónimos), así un sinónimo raro
 * no pesa más que la palabra escrita.
 */
export function queryTerms(query: string, expand: boolean): QueryTerm[] {
  const words = Array.from(new Set(tokenize(query).map(stem)));
  const out: QueryTerm[] = [];
  const used = new Set<string[]>();
  for (const w of words) {
    const group = expand ? groupOf(w) : undefined;
    if (group && used.has(group)) continue;
    if (group) used.add(group);
    out.push({ term: w, alts: group ? Array.from(new Set([w, ...group.filter((root) => !w.startsWith(root))])) : [w] });
  }
  return out;
}

function matches(token: string, term: string): boolean {
  return term.length >= 3 ? token.startsWith(term) : token === term;
}

export interface Ranked {
  id: string;
  score: number;
  /** Prefijos que coincidieron (los escritos y los relacionados). */
  hits: string[];
}

/** BM25 (k1 = 1,2; b = 0,75) con coincidencia por prefijo. */
export function rank(docs: IndexedDoc[], terms: QueryTerm[]): Ranked[] {
  if (!terms.length || !docs.length) return [];
  const avg = docs.reduce((s, d) => s + d.tokens.length, 0) / docs.length || 1;
  const k1 = 1.2;
  const b = 0.75;
  const N = docs.length;
  const hitIn = (tok: string, q: QueryTerm) => q.alts.some((alt) => matches(tok, alt));
  const df = terms.map((q) => docs.filter((d) => d.tokens.some((tok) => hitIn(tok, q))).length);
  const out: Ranked[] = [];
  for (const d of docs) {
    let score = 0;
    const hits: string[] = [];
    terms.forEach((q, i) => {
      const tf = d.tokens.filter((tok) => hitIn(tok, q)).length;
      if (!tf) return;
      const idf = Math.log(1 + (N - df[i] + 0.5) / (df[i] + 0.5));
      score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * d.tokens.length) / avg)));
      for (const alt of q.alts) if (d.tokens.some((tok) => matches(tok, alt))) hits.push(alt);
    });
    if (score > 0) out.push({ id: d.id, score, hits });
  }
  return out.sort((a, b2) => b2.score - a.score || a.id.localeCompare(b2.id));
}

export interface Snippet {
  /** Texto del fragmento en partes; `hit` marca las palabras que coinciden. */
  parts: { text: string; hit: boolean }[];
  /** El fragmento empieza o termina a mitad del texto. */
  cutStart: boolean;
  cutEnd: boolean;
}

/** Fragmento del texto alrededor de la primera palabra que empieza por algún término. */
export function snippet(text: string, terms: string[], radius = 70): Snippet | null {
  if (!text || !terms.length) return null;
  const { norm, map } = normalizeWithMap(text);
  // Todas las apariciones de cada término.
  const hits: { idx: number; len: number; term: string }[] = [];
  for (const term of terms) {
    const re = new RegExp(`(^|[^a-z0-9ñ])(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[a-z0-9ñ]*)`, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(norm))) hits.push({ idx: m.index + m[1].length, len: m[2].length, term });
  }
  // Se prefiere la aparición rodeada de más términos distintos de la consulta
  // ("cláusula penal" muestra la cláusula penal, no la primera "cláusula").
  let best = -1;
  let bestLen = 0;
  let bestScore = -1;
  for (const h of hits) {
    const near = new Set(hits.filter((o) => Math.abs(o.idx - h.idx) <= radius).map((o) => o.term)).size;
    if (near > bestScore || (near === bestScore && h.idx < best)) {
      best = h.idx;
      bestLen = h.len;
      bestScore = near;
    }
  }
  if (best === -1) return null;
  const start = map[best];
  const end = map[best + bestLen - 1] + 1;
  let from = Math.max(0, start - radius);
  let to = Math.min(text.length, end + radius);
  // No cortar palabras a la mitad.
  while (from > 0 && /\S/.test(text[from - 1])) from--;
  while (to < text.length && /\S/.test(text[to])) to++;
  // Resalta todas las coincidencias que caen dentro del fragmento.
  const ranges = hits
    .map((h) => ({ s: map[h.idx], e: map[h.idx + h.len - 1] + 1 }))
    .filter((r) => r.s >= from && r.e <= to)
    .sort((a, b) => a.s - b.s);
  const parts: Snippet['parts'] = [];
  let pos = from;
  for (const r of ranges) {
    if (r.s < pos) continue;
    if (r.s > pos) parts.push({ text: text.slice(pos, r.s).replace(/\s+/g, ' '), hit: false });
    parts.push({ text: text.slice(r.s, r.e), hit: true });
    pos = r.e;
  }
  if (pos < to) parts.push({ text: text.slice(pos, to).replace(/\s+/g, ' '), hit: false });
  return { parts, cutStart: from > 0, cutEnd: to < text.length };
}
