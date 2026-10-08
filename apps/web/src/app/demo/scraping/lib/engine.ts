/**
 * Ejecuciones de la demo. Precios: extracción real con `DOMParser` +
 * `querySelectorAll` sobre las páginas de las tiendas ficticias (de ayer y de
 * hoy) y comparación campo por campo. Contratación, normativa y documentos:
 * los datos vienen de archivos de ejemplo (simulado y rotulado), pero el filtro
 * del radar, la comparación, la validación del NIT y las reglas de alerta se
 * calculan de verdad con tu configuración.
 */
import {
  CATALOG_YESTERDAY, CIIU, NORMS_TODAY, NORMS_YESTERDAY, PROCESSES_TODAY, PROCESSES_YESTERDAY, RECORD_SELECTOR, SOURCES,
  STORES, SUPPLIER_DOCS, catalogToday, storeHtml, type Process, type SupplierDoc,
} from './data';
import { DEMO_TODAY, DEMO_YESTERDAY, addDays, daysBetween, norm } from './format';
import { formatNit, verificationDigit } from './nit';
import { extract, quality as qualityOf } from './selectors';
import type {
  Change, Column, DocsConfig, Field, FieldDiff, HistoryEntry, LogLine, NormativaConfig, RadarConfig, Row, Rule, RunResult, RunStatus, SourceId,
} from './types';

export interface SourceConfigs {
  fields: Field[];
  recordSelector: string;
  simulated: number;
  radar: RadarConfig;
  normativa: NormativaConfig;
  docs: DocsConfig;
}

export function signatureOf(sourceId: SourceId, c: SourceConfigs): string {
  switch (sourceId) {
    case 'precios':
      return JSON.stringify([c.recordSelector, c.simulated, c.fields.map((f) => [f.name, f.selector, f.type, f.required, f.scope])]);
    case 'contratacion':
      return JSON.stringify([c.radar.keywords, c.radar.departments, c.radar.minAmount]);
    case 'normativa':
      return JSON.stringify([c.normativa.entities, c.normativa.keyword]);
    default:
      return JSON.stringify([c.docs.threshold, c.docs.columns]);
  }
}

function cellText(v: Row[string]): string {
  return v === null || v === undefined ? '' : String(v);
}

/** Comparación genérica por clave: nuevos, retirados y modificados campo por campo. */
function diffRows(
  before: Row[],
  after: Row[],
  columns: Column[],
  keyOf: (r: Row) => string,
  describe: (r: Row) => { title: string; subtitle?: string; meta?: Change['meta'] },
  ignore: string[] = [],
): Change[] {
  const prev = new Map(before.map((r) => [keyOf(r), r]));
  const next = new Map(after.map((r) => [keyOf(r), r]));
  const out: Change[] = [];
  next.forEach((r, k) => {
    const d = describe(r);
    const old = prev.get(k);
    if (!old) {
      out.push({ id: `add:${k}`, kind: 'added', key: k, title: d.title, subtitle: d.subtitle, diffs: [], meta: d.meta });
      return;
    }
    const diffs: FieldDiff[] = [];
    for (const c of columns) {
      if (ignore.includes(c.key)) continue;
      const a = cellText(old[c.key]);
      const b = cellText(r[c.key]);
      if (a === b) continue;
      const fd: FieldDiff = { field: c.key, label: c.label, labelKey: c.labelKey, before: a, after: b };
      if ((c.type === 'price' || c.type === 'number') && typeof old[c.key] === 'number' && typeof r[c.key] === 'number' && (old[c.key] as number) !== 0) {
        fd.pct = (((r[c.key] as number) - (old[c.key] as number)) / (old[c.key] as number)) * 100;
      }
      diffs.push(fd);
    }
    if (diffs.length) out.push({ id: `mod:${k}`, kind: 'modified', key: k, title: d.title, subtitle: d.subtitle, diffs, meta: { ...d.meta, ...metaFromDiffs(diffs, columns, old) } });
  });
  prev.forEach((r, k) => {
    if (next.has(k)) return;
    const d = describe(r);
    out.push({ id: `del:${k}`, kind: 'removed', key: k, title: d.title, subtitle: d.subtitle, diffs: [], meta: d.meta });
  });
  return out;
}

function metaFromDiffs(diffs: FieldDiff[], columns: Column[], old: Row): Change['meta'] {
  const meta: Record<string, string | number | null> = {};
  const price = columns.find((c) => c.type === 'price' && c.required) ?? columns.find((c) => c.type === 'price');
  const stock = columns.find((c) => c.type === 'number');
  const pd = price && diffs.find((d) => d.field === price.key);
  if (pd && pd.pct !== undefined) meta.pricePct = pd.pct;
  const sd = stock && diffs.find((d) => d.field === stock.key);
  if (sd && stock) {
    meta.stockBefore = typeof old[stock.key] === 'number' ? (old[stock.key] as number) : null;
    meta.stockAfter = sd.after === '' ? null : Number(sd.after);
  }
  return meta;
}

// ---------------------------------------------------------------------------
// Precios (extracción real en el navegador)
// ---------------------------------------------------------------------------

export function preciosColumns(fields: Field[]): Column[] {
  return [
    { key: '_store', labelKey: 'store', type: 'text' },
    ...fields.map((f) => ({ key: f.id, label: f.name || '—', type: f.type, required: f.required, wide: f.type === 'text' })),
  ];
}

function keyField(fields: Field[]): Field | undefined {
  return fields.find((f) => f.type === 'text' && f.required) ?? fields.find((f) => f.type === 'text');
}

function extractStores(simulated: number | 'yesterday', fields: Field[], recordSelector: string) {
  const parser = new DOMParser();
  const today = simulated === 'yesterday' ? CATALOG_YESTERDAY : catalogToday(simulated);
  const rows: Row[] = [];
  const perStore: { store: string; records: number; empty: Record<string, number>; invalid: string[] }[] = [];
  for (const s of STORES) {
    const doc = parser.parseFromString(storeHtml(s, today[s.id]), 'text/html');
    const r = extract(doc.body, recordSelector, fields);
    const empty: Record<string, number> = {};
    for (const f of fields) {
      if (!f.required) continue;
      const n = r.rows.filter((row) => row[f.id] === null).length;
      if (n) empty[f.id] = n;
    }
    perStore.push({ store: s.name, records: r.rows.length, empty, invalid: r.errors.filter((e) => e.kind === 'invalid').map((e) => e.fieldId) });
    r.rows.forEach((row, i) => rows.push({ ...row, _store: s.name, _storeId: s.id, _idx: i }));
  }
  return { rows, perStore };
}

export function runPrecios(c: SourceConfigs, at: string, trigger: RunResult['trigger']): RunResult {
  const fields = c.fields;
  const columns = preciosColumns(fields);
  const today = extractStores(c.simulated, fields, c.recordSelector);
  const yesterday = extractStores('yesterday', fields, c.recordSelector);
  const kf = keyField(fields);
  const keyOf = (r: Row) => `${r._storeId}|${kf && r[kf.id] !== null ? cellText(r[kf.id]) : `#${r._idx}`}`;
  const changes = diffRows(yesterday.rows, today.rows, columns, keyOf, (r) => ({
    title: kf ? cellText(r[kf.id]) || '—' : `#${Number(r._idx) + 1}`,
    subtitle: cellText(r._store),
    meta: { store: cellText(r._store) },
  }), ['_store']);
  const required = fields.filter((f) => f.required).map((f) => f.id);
  const q = qualityOf(today.rows, required);
  const log: LogLine[] = [
    { key: 'webDemo', level: 'demo' },
    { key: 'config', params: { pages: STORES.length, fields: fields.length }, level: 'info' },
    { key: 'policy', level: 'info' },
  ];
  let problems = false;
  for (const s of today.perStore) {
    log.push({ key: 'storeExtract', params: { store: s.store, records: s.records }, level: s.records ? 'info' : 'warn' });
    for (const id of s.invalid) {
      problems = true;
      log.push({ key: 'fieldInvalid', params: { field: fields.find((f) => f.id === id)?.name ?? id }, level: 'warn' });
    }
    for (const [id, n] of Object.entries(s.empty)) {
      problems = true;
      log.push({ key: 'fieldEmpty', params: { field: fields.find((f) => f.id === id)?.name ?? id, count: n, store: s.store }, level: 'warn' });
    }
  }
  if (!kf) log.push({ key: 'noKeyField', level: 'warn' });
  log.push({ key: 'compare', params: { changes: changes.length }, level: 'info' });
  const status: RunStatus = today.rows.length === 0 ? 'error' : problems || q < 90 ? 'partial' : 'ok';
  log.push({ key: status === 'error' ? 'doneError' : status === 'partial' ? 'donePartial' : 'done', params: { records: today.rows.length, changes: changes.length, quality: q }, level: status === 'ok' ? 'ok' : 'warn' });
  return { sourceId: 'precios', at, trigger, rows: today.rows, columns, changes, quality: q, status, log, signature: signatureOf('precios', c) };
}

// ---------------------------------------------------------------------------
// Radar de contratación (archivo de ejemplo + filtro real)
// ---------------------------------------------------------------------------

export interface ProcessMatch { ok: boolean; keyword: string | null; departmentOk: boolean; amountOk: boolean }

export function matchProcess(p: Process, r: RadarConfig): ProcessMatch {
  const text = norm(p.object);
  const keyword = r.keywords.find((k) => k.trim() && text.includes(norm(k.trim()))) ?? null;
  const departmentOk = r.departments.includes(p.department);
  const amountOk = p.amount >= r.minAmount;
  return { ok: !!keyword && departmentOk && amountOk, keyword, departmentOk, amountOk };
}

export const PROCESS_COLUMNS: Column[] = [
  { key: 'ref', labelKey: 'ref', type: 'text', required: true },
  { key: 'entity', labelKey: 'entity', type: 'text', required: true, wide: true },
  { key: 'object', labelKey: 'object', type: 'text', required: true, wide: true },
  { key: 'modality', labelKey: 'modality', type: 'status', valueKey: 'modality' },
  { key: 'location', labelKey: 'location', type: 'text' },
  { key: 'amount', labelKey: 'amount', type: 'price', required: true },
  { key: 'published', labelKey: 'published', type: 'date' },
  { key: 'closes', labelKey: 'closes', type: 'date', required: true },
  { key: 'status', labelKey: 'processStatus', type: 'status', valueKey: 'processStatus' },
  { key: 'keyword', labelKey: 'keyword', type: 'text' },
];

function processRow(p: Process, m: ProcessMatch): Row {
  return {
    ref: p.ref, entity: p.entity, object: p.object, modality: p.modality, location: `${p.city}, ${p.department}`,
    amount: p.amount, published: p.published, closes: p.closes, status: p.status, keyword: m.keyword, department: p.department,
  };
}

export function runContratacion(c: SourceConfigs, at: string, trigger: RunResult['trigger']): RunResult {
  const pick = (list: Process[]) => list.map((p) => ({ p, m: matchProcess(p, c.radar) })).filter((x) => x.m.ok).map((x) => processRow(x.p, x.m));
  const rows = pick(PROCESSES_TODAY);
  const before = pick(PROCESSES_YESTERDAY);
  const changes = diffRows(before, rows, PROCESS_COLUMNS, (r) => String(r.ref), (r) => ({
    title: String(r.object), subtitle: `${r.entity} · ${r.location}`, meta: { amount: Number(r.amount), department: String(r.department) },
  }), ['keyword']);
  const q = qualityOf(rows, PROCESS_COLUMNS.filter((x) => x.required).map((x) => x.key));
  const status: RunStatus = 'ok';
  return {
    sourceId: 'contratacion', at, trigger, rows, columns: PROCESS_COLUMNS, changes, quality: q, status,
    log: [
      { key: 'apiDemo', level: 'demo' },
      { key: 'apiQuery', params: { total: PROCESSES_TODAY.length }, level: 'info' },
      { key: 'radarFilter', params: { matched: rows.length, total: PROCESSES_TODAY.length }, level: 'info' },
      { key: 'compare', params: { changes: changes.length }, level: 'info' },
      { key: 'done', params: { records: rows.length, changes: changes.length, quality: q }, level: 'ok' },
    ],
    signature: signatureOf('contratacion', c),
  };
}

// ---------------------------------------------------------------------------
// Normativa (archivo de ejemplo + seguimiento real por entidad y palabra clave)
// ---------------------------------------------------------------------------

export const NORM_COLUMNS: Column[] = [
  { key: 'number', labelKey: 'number', type: 'text', required: true },
  { key: 'type', labelKey: 'normType', type: 'status', valueKey: 'normType' },
  { key: 'entity', labelKey: 'entity', type: 'text', required: true },
  { key: 'title', labelKey: 'title', type: 'text', required: true, wide: true },
  { key: 'date', labelKey: 'date', type: 'date', required: true },
  { key: 'url', labelKey: 'pdf', type: 'link', required: true },
];

export function runNormativa(c: SourceConfigs, at: string, trigger: RunResult['trigger']): RunResult {
  const kw = norm(c.normativa.keyword.trim());
  const pick = (list: typeof NORMS_TODAY) => list
    .filter((d) => c.normativa.entities.includes(d.entity) && (!kw || norm(`${d.title} ${d.number}`).includes(kw)))
    .map((d) => ({ id: d.id, number: d.number, type: d.type, entity: d.entity, title: d.title, date: d.date, url: d.url }));
  const rows = pick(NORMS_TODAY);
  const before = pick(NORMS_YESTERDAY);
  const changes = diffRows(before, rows, NORM_COLUMNS, (r) => String(r.id), (r) => ({ title: `${r.number} — ${r.title}`, subtitle: String(r.entity), meta: { title: String(r.title) } }));
  const q = qualityOf(rows, NORM_COLUMNS.filter((x) => x.required).map((x) => x.key));
  return {
    sourceId: 'normativa', at, trigger, rows, columns: NORM_COLUMNS, changes, quality: q, status: 'ok',
    log: [
      { key: 'normDemo', level: 'demo' },
      { key: 'normFound', params: { total: NORMS_TODAY.length, followed: rows.length }, level: 'info' },
      { key: 'compare', params: { changes: changes.length }, level: 'info' },
      { key: 'done', params: { records: rows.length, changes: changes.length, quality: q }, level: 'ok' },
    ],
    signature: signatureOf('normativa', c),
  };
}

// ---------------------------------------------------------------------------
// Documentos (archivo de ejemplo + validación real del dígito de verificación)
// ---------------------------------------------------------------------------

export type DocStatus = 'validated' | 'reviewDv' | 'reviewConfidence' | 'corrected';

export function docStatus(d: SupplierDoc, threshold: number, correctedDv?: number): { status: DocStatus; dvOk: boolean; dv: number } {
  const expected = verificationDigit(d.nit);
  const dv = correctedDv ?? d.dvRead;
  const dvOk = expected === dv;
  if (correctedDv !== undefined && dvOk) return { status: 'corrected', dvOk, dv };
  if (!dvOk) return { status: 'reviewDv', dvOk, dv };
  if (d.confidence < threshold) return { status: 'reviewConfidence', dvOk, dv };
  return { status: 'validated', dvOk, dv };
}

const ALL_DOC_COLUMNS: Column[] = [
  { key: 'file', labelKey: 'file', type: 'text', required: true },
  { key: 'docType', labelKey: 'docType', type: 'status', valueKey: 'docType' },
  { key: 'nit', labelKey: 'nit', type: 'text', required: true },
  { key: 'name', labelKey: 'companyName', type: 'text', required: true, wide: true },
  { key: 'legalRep', labelKey: 'legalRep', type: 'text' },
  { key: 'ciiu', labelKey: 'ciiu', type: 'text', required: true, wide: true },
  { key: 'docDate', labelKey: 'docDate', type: 'date', required: true },
  { key: 'confidence', labelKey: 'confidence', type: 'percent' },
  { key: 'status', labelKey: 'docStatus', type: 'status', valueKey: 'docStatus' },
];

export function docColumns(selected: string[]): Column[] {
  return ALL_DOC_COLUMNS.filter((c) => c.key === 'file' || c.key === 'status' || selected.includes(c.key));
}

export const OPTIONAL_DOC_COLUMNS = ALL_DOC_COLUMNS.filter((c) => c.key !== 'file' && c.key !== 'status');

function docRow(d: SupplierDoc, threshold: number): Row {
  const st = docStatus(d, threshold);
  return {
    id: d.id, file: d.file, docType: d.docType, nit: `${formatNit(d.nit)}-${d.dvRead}`, nitDigits: d.nit, name: d.name,
    legalRep: d.legalRep, ciiu: `${d.ciiu} — ${CIIU[d.ciiu] ?? ''}`, docDate: d.docDate, confidence: d.confidence, status: st.status,
  };
}

export function runDocumentos(c: SourceConfigs, at: string, trigger: RunResult['trigger']): RunResult {
  const columns = docColumns(c.docs.columns);
  const today = SUPPLIER_DOCS.filter((d) => d.processed <= DEMO_TODAY);
  const yesterday = SUPPLIER_DOCS.filter((d) => d.processed <= DEMO_YESTERDAY);
  const rows = today.map((d) => docRow(d, c.docs.threshold));
  const before = yesterday.map((d) => docRow(d, c.docs.threshold));
  const changes = diffRows(before, rows, columns, (r) => String(r.id), (r) => ({ title: String(r.file), subtitle: String(r.name), meta: { status: String(r.status) } }));
  const validated = rows.filter((r) => r.status === 'validated').length;
  const q = rows.length ? Math.round((validated / rows.length) * 1000) / 10 : 0;
  const log: LogLine[] = [
    { key: 'docsDemo', level: 'demo' },
    { key: 'docsRead', params: { total: rows.length, newDocs: changes.filter((x) => x.kind === 'added').length }, level: 'info' },
  ];
  for (const d of today) {
    const st = docStatus(d, c.docs.threshold);
    if (st.status === 'reviewDv') log.push({ key: 'docDv', params: { file: d.file, read: d.dvRead, expected: verificationDigit(d.nit) ?? '' }, level: 'warn' });
    if (st.status === 'reviewConfidence') log.push({ key: 'docLow', params: { file: d.file, confidence: d.confidence, threshold: c.docs.threshold }, level: 'warn' });
  }
  const status: RunStatus = validated < rows.length ? 'partial' : 'ok';
  log.push({ key: status === 'ok' ? 'done' : 'donePartialDocs', params: { records: rows.length, changes: changes.length, quality: q, review: rows.length - validated }, level: status === 'ok' ? 'ok' : 'warn' });
  return { sourceId: 'documentos', at, trigger, rows, columns, changes, quality: q, status, log, signature: signatureOf('documentos', c) };
}

export function runSource(id: SourceId, c: SourceConfigs, at: string, trigger: RunResult['trigger']): RunResult {
  if (id === 'precios') return runPrecios(c, at, trigger);
  if (id === 'contratacion') return runContratacion(c, at, trigger);
  if (id === 'normativa') return runNormativa(c, at, trigger);
  return runDocumentos(c, at, trigger);
}

// ---------------------------------------------------------------------------
// Reglas de alerta
// ---------------------------------------------------------------------------

export interface AlertHit { ruleId: string; key: string; params: Record<string, string | number> }

/** Evalúa las reglas activas contra la última ejecución. Los montos se formatean en el componente. */
export function evaluateRules(result: RunResult | null, rules: Rule[], ctx: { corrections: Record<string, number> }): AlertHit[] {
  if (!result) return [];
  const hits: AlertHit[] = [];
  for (const rule of rules) {
    if (!rule.enabled || rule.sourceId !== result.sourceId) continue;
    const scoped = (key: string) => !rule.targetKey || rule.targetKey === key;
    switch (rule.type) {
      case 'priceDrop':
        for (const ch of result.changes) {
          const pctv = ch.meta?.pricePct;
          if (ch.kind === 'modified' && typeof pctv === 'number' && pctv <= -Number(rule.value) && scoped(ch.key)) {
            hits.push({ ruleId: rule.id, key: 'priceDrop', params: { product: ch.title, store: ch.subtitle ?? '', pct: pctv } });
          }
        }
        break;
      case 'stockBelow':
        for (const ch of result.changes) {
          const after = ch.meta?.stockAfter;
          const before = ch.meta?.stockBefore;
          if (ch.kind === 'modified' && typeof after === 'number' && after <= Number(rule.value) && (typeof before !== 'number' || before > Number(rule.value)) && scoped(ch.key)) {
            hits.push({ ruleId: rule.id, key: after === 0 ? 'outOfStock' : 'stockBelow', params: { product: ch.title, store: ch.subtitle ?? '', stock: after } });
          }
        }
        break;
      case 'newProcessOver': {
        const big = result.changes.filter((ch) => ch.kind === 'added' && Number(ch.meta?.amount) >= Number(rule.value));
        if (big.length) {
          const byDept = new Map<string, number>();
          big.forEach((ch) => byDept.set(String(ch.meta?.department), (byDept.get(String(ch.meta?.department)) ?? 0) + 1));
          byDept.forEach((count, department) => hits.push({ ruleId: rule.id, key: 'newProcessOver', params: { count, department, amount: Number(rule.value) } }));
        }
        break;
      }
      case 'closingSoon':
        for (const r of result.rows) {
          if (r.status !== 'open' || !r.closes) continue;
          const days = daysBetween(DEMO_TODAY, String(r.closes));
          if (days >= 0 && days <= Number(rule.value) && scoped(String(r.ref))) hits.push({ ruleId: rule.id, key: 'closingSoon', params: { ref: String(r.ref), entity: String(r.entity), days } });
        }
        break;
      case 'newDoc': {
        const kw = norm(String(rule.value ?? '').trim());
        for (const ch of result.changes) {
          if (ch.kind === 'added' && (!kw || norm(ch.title).includes(kw))) hits.push({ ruleId: rule.id, key: 'newDoc', params: { title: ch.title, entity: ch.subtitle ?? '' } });
        }
        break;
      }
      case 'docReview':
        for (const r of result.rows) {
          const d = SUPPLIER_DOCS.find((x) => x.id === r.id);
          if (!d) continue;
          const corrected = ctx.corrections[d.id];
          const st = corrected !== undefined ? docStatus(d, 0, corrected).status : String(r.status);
          if (st === 'reviewDv' || st === 'reviewConfidence') hits.push({ ruleId: rule.id, key: st === 'reviewDv' ? 'docReviewDv' : 'docReviewConfidence', params: { file: d.file } });
        }
        break;
      default:
        break;
    }
  }
  return hits;
}

// ---------------------------------------------------------------------------
// Historial de ejemplo (6 días anteriores) y serie del gráfico
// ---------------------------------------------------------------------------

const RUN_TIME: Record<SourceId, string> = { contratacion: '06:00', precios: '06:05', normativa: '06:10', documentos: '06:15' };
export function scheduledTime(id: SourceId): string {
  return RUN_TIME[id];
}

const PAST_CHANGES: Record<SourceId, number[]> = {
  contratacion: [0, 0, 0, 0, 1, 0],
  precios: [3, 1, 2, 4, 2, 3],
  normativa: [0, 0, 0, 1, 0, 0],
  documentos: [0, 0, 1, 0, 0, 0],
};

export function seedHistory(): HistoryEntry[] {
  const out: HistoryEntry[] = [];
  for (const s of SOURCES) {
    for (let i = 0; i < 6; i++) {
      const day = addDays(DEMO_TODAY, i - 6);
      const records = s.series[7 + i];
      const changes = PAST_CHANGES[s.id][i];
      const at = `${day}T${RUN_TIME[s.id]}`;
      if (s.id === 'contratacion' && i === 1) {
        out.push({ id: `h-${s.id}-${i}-e`, sourceId: s.id, at, trigger: 'scheduled', status: 'error', records: 0, changes: 0, quality: 0, noteKey: 'apiDown', log: [{ key: 'apiDown', level: 'warn' }] });
        out.push({ id: `h-${s.id}-${i}`, sourceId: s.id, at: `${day}T06:10`, trigger: 'retry', status: 'ok', records, changes, quality: 100, log: [{ key: 'retryOk', params: { records }, level: 'ok' }] });
        continue;
      }
      if (s.id === 'precios' && i === 3) {
        out.push({ id: `h-${s.id}-${i}-p`, sourceId: s.id, at, trigger: 'scheduled', status: 'partial', records, changes: 0, quality: 68.8, noteKey: 'layoutChange', log: [{ key: 'layoutChange', level: 'warn' }] });
        out.push({ id: `h-${s.id}-${i}`, sourceId: s.id, at: `${day}T09:40`, trigger: 'retry', status: 'ok', records, changes, quality: 100, noteKey: 'selectorApproved', log: [{ key: 'selectorApproved', level: 'ok' }] });
        continue;
      }
      const quality = 100;
      out.push({ id: `h-${s.id}-${i}`, sourceId: s.id, at, trigger: 'scheduled', status: 'ok', records, changes, quality, log: [{ key: 'done', params: { records, changes, quality }, level: 'ok' }] });
    }
  }
  return out;
}

export function historyFromResult(r: RunResult, id: string): HistoryEntry {
  return { id, sourceId: r.sourceId, at: r.at, trigger: r.trigger, status: r.status, records: r.rows.length, changes: r.changes.length, quality: r.quality, log: r.log };
}

/** 14 días: 13 de ejemplo + el resultado de la última ejecución de hoy. */
export function chartSeries(id: SourceId, todayRecords: number | null): { date: string; value: number; today: boolean }[] {
  const meta = SOURCES.find((s) => s.id === id)!;
  const pts = meta.series.map((v, i) => ({ date: addDays(DEMO_TODAY, i - 13), value: v, today: false }));
  pts.push({ date: DEMO_TODAY, value: todayRecords ?? 0, today: true });
  return pts;
}

export { RECORD_SELECTOR };
