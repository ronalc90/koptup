/**
 * Motor de la demo: ejecuta un flujo paso a paso sobre un evento de ejemplo.
 *
 * Lo que hace de verdad: arma los datos de cada paso, llena plantillas
 * {{campo}}, evalúa condiciones, busca en las hojas de ejemplo, aplica reglas
 * de asignación, reintenta con espera creciente, corre el código JavaScript del
 * usuario (en un Worker aislado, ver sandbox.ts) y deja el caso en «Para
 * revisar» cuando algo no cuadra o falla.
 *
 * Lo que simula: los conectores (correo, hojas, software contable, CRM,
 * pasarela de pagos, mensajería) no salen del navegador, la «IA» usa reglas
 * fijas y los tiempos de cada paso son simulados (deterministas).
 */
import { CREDENTIALS, SHEET_COLUMNS, TYPE_DEFS, isTrigger, type ConditionOp, type SheetKey } from './catalog';
import { addDays, dayOf, fmtCop, fmtDec, fmtInt, hashStr, nitDv } from './format';
import type { Row } from './samples';
import type { Counters, Loc, Msg, RunStatus, SampleEvent, Stamp, Step, StepLog, StepType } from './types';

export type Data = Record<string, unknown>;

export type JsResult = { ok: true; value: unknown } | { ok: false; error: string; timeout?: boolean };
export type JsRunner = (code: string, data: Data) => Promise<JsResult>;

export interface KbEntry {
  source: string;
  answer: string;
  keywords: string;
}

export interface RunCtx {
  loc: Loc;
  now: Stamp;
  seq: number;
  counters: Counters;
  sheets: Record<SheetKey, Row[]>;
  kb: KbEntry[];
  runJs: JsRunner;
}

export type ExecOut =
  | { kind: 'ok'; output: unknown; msg: Msg }
  | { kind: 'review'; output?: unknown; msg: Msg }
  | { kind: 'stop'; output?: unknown; msg: Msg }
  | { kind: 'error'; transient: boolean; msg: Msg; missingPath?: string };

/* ------------------------------------------------------------------------ */
/* Datos y plantillas                                                        */
/* ------------------------------------------------------------------------ */

const TPL = /\{\{\s*([A-Za-z_][\w.]*)(?:\s*\|\s*(\w+))?\s*\}\}/g;

export function getPath(data: unknown, path: string): unknown {
  let cur: unknown = data;
  for (const part of path.split('.')) {
    if (cur === null || cur === undefined || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

export function setPath(data: Data, path: string, value: unknown): Data {
  const out: Data = JSON.parse(JSON.stringify(data));
  const parts = path.split('.');
  let cur: Record<string, unknown> = out;
  parts.slice(0, -1).forEach((p) => {
    if (typeof cur[p] !== 'object' || cur[p] === null) cur[p] = {};
    cur = cur[p] as Record<string, unknown>;
  });
  cur[parts[parts.length - 1]] = value;
  return out;
}

function isEmpty(v: unknown): boolean {
  return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
}

export function parseNum(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const s = v.replace(/[$\s]/g, '');
  if (!s) return null;
  let n: number;
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) n = Number(s.replace(/\./g, '').replace(',', '.'));
  else if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) n = Number(s.replace(/,/g, ''));
  else n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function formatValue(v: unknown, filter: string | undefined, loc: Loc): string {
  if (filter === 'cop') {
    const n = parseNum(v);
    return n === null ? String(v) : fmtCop(n, loc);
  }
  if (filter === 'num') {
    const n = parseNum(v);
    return n === null ? String(v) : fmtInt(n, loc);
  }
  if (filter === 'upper') return String(v).toUpperCase();
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/** Llena {{campo}} y {{campo|cop}}. Devuelve también los campos que faltaron. */
export function render(tpl: string, data: Data, loc: Loc): { text: string; missing: string[] } {
  const missing: string[] = [];
  const text = String(tpl ?? '').replace(TPL, (_m, path: string, filter?: string) => {
    const v = getPath(data, path);
    if (isEmpty(v)) {
      missing.push(path);
      return '';
    }
    return formatValue(v, filter, loc);
  });
  return { text, missing };
}

/** Campos usados en una plantilla ("{{a.b}} y {{c}}" → ["a.b", "c"]). */
export function templatePaths(tpl: string): string[] {
  return Array.from(String(tpl ?? '').matchAll(TPL)).map((m) => m[1]);
}

/** Lista plana de los campos disponibles en los datos (para ayudar al usuario). */
export function listPaths(data: unknown, prefix = '', out: string[] = [], depth = 0): string[] {
  if (depth > 3 || data === null || typeof data !== 'object' || Array.isArray(data)) return out;
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) listPaths(v, p, out, depth + 1);
    else out.push(p);
  }
  return out;
}

export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

const SAVE_AS = /^[A-Za-z_]\w{0,30}$/;

function cfgStr(step: Step, key: string): string {
  const v = step.config[key];
  return v === undefined || v === null ? '' : String(v);
}

function missingErr(path: string): ExecOut {
  return { kind: 'error', transient: false, msg: { key: 'err.missing', params: { path } }, missingPath: path };
}

function shortVal(v: string, loc: Loc): string {
  const n = parseNum(v);
  if (n !== null && Math.abs(n) >= 1000 && /^[\d.,$\s-]+$/.test(v)) return fmtInt(n, loc);
  return v.length > 40 ? `${v.slice(0, 40)}…` : v;
}

/* ------------------------------------------------------------------------ */
/* Pasos                                                                     */
/* ------------------------------------------------------------------------ */

/** Lee una factura en el XML de ejemplo (reglas fijas, no un modelo de IA). */
export function readInvoice(xml: string) {
  const pick = (re: RegExp) => {
    const m = xml.match(re);
    return m ? m[1].trim() : null;
  };
  const supplierBlock = xml.match(/<cac:AccountingSupplierParty>([\s\S]*?)<\/cac:AccountingSupplierParty>/)?.[1] ?? '';
  const nitMatch = supplierBlock.match(/<cbc:CompanyID(?:\s+schemeID="(\d)")?[^>]*>(\d+)<\/cbc:CompanyID>/);
  const num = (re: RegExp) => {
    const v = pick(re);
    return v === null ? null : parseNum(v);
  };
  const fields = {
    numero: pick(/<cbc:ID>([^<]+)<\/cbc:ID>/),
    fecha: pick(/<cbc:IssueDate>([^<]+)<\/cbc:IssueDate>/),
    nit: nitMatch ? nitMatch[2] : null,
    proveedor: supplierBlock.match(/<cbc:RegistrationName>([^<]+)<\/cbc:RegistrationName>/)?.[1].trim() ?? null,
    subtotal: num(/<cbc:LineExtensionAmount[^>]*>([^<]+)<\/cbc:LineExtensionAmount>/),
    iva: num(/<cbc:TaxAmount[^>]*>([^<]+)<\/cbc:TaxAmount>/),
    total: num(/<cbc:PayableAmount[^>]*>([^<]+)<\/cbc:PayableAmount>/),
  };
  const dv = nitMatch?.[1] ?? null;
  const missing = (Object.keys(fields) as (keyof typeof fields)[]).filter((k) => fields[k] === null);
  const issues: string[] = [];
  let confidence = 97 - missing.length * 15;
  if (fields.nit && dv !== null && Number(dv) !== nitDv(fields.nit)) {
    confidence -= 20;
    issues.push('dv');
  }
  if (fields.subtotal !== null && fields.iva !== null && fields.total !== null && Math.abs(fields.subtotal + fields.iva - fields.total) > 1) {
    confidence -= 10;
    issues.push('sum');
  }
  return { fields, missing, issues, confidence: Math.max(0, confidence) };
}

const CITIES = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Manizales', 'Ibagué', 'Villavicencio', 'Cúcuta', 'Santa Marta', 'Pasto', 'Neiva', 'Armenia'];

/** Reglas "categoría: palabra, palabra" (una por línea). */
export function parseRules(rules: string): { name: string; words: string[] }[] {
  return rules
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes(':'))
    .map((line) => {
      const idx = line.indexOf(':');
      return {
        name: line.slice(0, idx).trim(),
        words: line
          .slice(idx + 1)
          .split(',')
          .map((w) => normalize(w))
          .filter(Boolean),
      };
    })
    .filter((r) => r.name);
}

export function classify(text: string, rules: string) {
  const parsed = parseRules(rules);
  const n = normalize(text);
  let best: { name: string; score: number; hits: string[] } | null = null;
  for (const r of parsed) {
    const hits = r.words.filter((w) => n.includes(w));
    if (hits.length > 0 && (!best || hits.length > best.score)) best = { name: r.name, score: hits.length, hits };
  }
  const fallback = parsed.find((r) => r.words.length === 0)?.name ?? null;
  const city = CITIES.find((c) => n.includes(normalize(c))) ?? null;
  if (!best) return { categoria: fallback, confianza: fallback ? 50 : 0, ciudad: city, coincidencias: [] as string[] };
  return { categoria: best.name, confianza: Math.min(95, 55 + best.score * 15), ciudad: city, coincidencias: best.hits };
}

/** Tabla "clave = valor" (una por línea; "*" es el valor por defecto). */
export function parseTable(table: string): { key: string; value: string }[] {
  return table
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes('='))
    .map((line) => {
      const idx = line.indexOf('=');
      return { key: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
    })
    .filter((r) => r.key && r.value);
}

function credentialOk(step: Step): boolean {
  const def = TYPE_DEFS[step.type];
  if (!def.credentialRequired) return true;
  return CREDENTIALS.some((c) => c.id === step.credential && c.kind === def.credential);
}

export function evalCondition(step: Step, data: Data, loc: Loc) {
  const op = cfgStr(step, 'op') as ConditionOp;
  const l = render(cfgStr(step, 'left'), data, loc);
  const r = render(cfgStr(step, 'right'), data, loc);
  const left = l.text.trim();
  const right = r.text.trim();
  if (op === 'exists') return { pass: left !== '', left, right, missing: [] as string[] };
  const missing = [...l.missing, ...r.missing];
  if (missing.length) return { pass: false, left, right, missing };
  const ln = parseNum(left);
  const rn = parseNum(right);
  switch (op) {
    case 'eq':
      return { pass: ln !== null && rn !== null ? ln === rn : normalize(left) === normalize(right), left, right, missing };
    case 'neq':
      return { pass: ln !== null && rn !== null ? ln !== rn : normalize(left) !== normalize(right), left, right, missing };
    case 'gt':
    case 'lt': {
      if (ln === null || rn === null) return { pass: false, left, right, missing, notNumber: true };
      return { pass: op === 'gt' ? ln > rn : ln < rn, left, right, missing };
    }
    case 'approx': {
      if (ln === null || rn === null) return { pass: false, left, right, missing, notNumber: true };
      const tol = Number(step.config.tolerance) || 0;
      const diffPct = rn === 0 ? (ln === 0 ? 0 : 100) : (Math.abs(ln - rn) / Math.abs(rn)) * 100;
      return { pass: diffPct <= tol + 1e-9, left, right, missing, diffPct };
    }
    case 'contains':
      return { pass: normalize(left).includes(normalize(right)), left, right, missing };
    default:
      return { pass: false, left, right, missing };
  }
}

async function execStep(step: Step, data: Data, ctx: RunCtx, transient: boolean, sample: SampleEvent): Promise<ExecOut> {
  const loc = ctx.loc;
  const def = TYPE_DEFS[step.type];
  const saveAs = cfgStr(step, 'saveAs');
  if (def.fields.some((f) => f.key === 'saveAs') && !SAVE_AS.test(saveAs)) {
    return { kind: 'error', transient: false, msg: { key: 'err.badSaveAs', params: { name: saveAs || '—' } } };
  }
  if (!credentialOk(step)) return { kind: 'error', transient: false, msg: { key: 'err.noCredential' } };
  const rate = (): ExecOut => ({ kind: 'error', transient: true, msg: { key: 'err.rateLimited' } });

  switch (step.type) {
    case 'trigger.email':
      return {
        kind: 'ok',
        output: sample.payload,
        msg: { key: 'log.triggerEmail', params: { from: String(getPath(sample.payload, 'correo.de') ?? '') } },
      };
    case 'trigger.webhook':
      return { kind: 'ok', output: sample.payload, msg: { key: 'log.triggerWebhook', params: { path: cfgStr(step, 'path') } } };
    case 'trigger.schedule':
      return { kind: 'ok', output: sample.payload, msg: { key: 'log.triggerSchedule', params: { time: cfgStr(step, 'time') } } };
    case 'trigger.chat':
      return {
        kind: 'ok',
        output: sample.payload,
        msg: { key: 'log.triggerChat', params: { from: String(getPath(sample.payload, 'mensaje.nombre') ?? '') } },
      };

    case 'ai.extract': {
      const src = render(cfgStr(step, 'source'), data, loc);
      if (!src.text.trim()) return missingErr(src.missing[0] ?? 'documento.contenido');
      const res = readInvoice(src.text);
      if (res.missing.length === 7) return { kind: 'error', transient: false, msg: { key: 'err.extractNothing' } };
      const threshold = Number(step.config.threshold) || 0;
      const output = { ...res.fields, confianza: res.confidence };
      if (res.confidence < threshold) {
        const why = [...res.missing.map((m) => `§fieldsInvoice.${m}`), ...res.issues.map((i) => `§issues.${i}`)];
        return {
          kind: 'review',
          output,
          msg: { key: 'log.extractLow', params: { conf: res.confidence, threshold, count: why.length, why: why.join('|') } },
        };
      }
      return {
        kind: 'ok',
        output,
        msg: { key: 'log.extractOk', params: { number: res.fields.numero ?? '—', supplier: res.fields.proveedor ?? '—', total: fmtCop(res.fields.total ?? 0, loc), conf: res.confidence } },
      };
    }

    case 'ai.classify': {
      const r = render(cfgStr(step, 'text'), data, loc);
      if (!r.text.trim()) return missingErr(r.missing[0] ?? 'lead.mensaje');
      const res = classify(r.text, cfgStr(step, 'rules'));
      if (!res.categoria) return { kind: 'error', transient: false, msg: { key: 'err.noCategory' } };
      return {
        kind: 'ok',
        output: res,
        msg: { key: res.ciudad ? 'log.classifyOkCity' : 'log.classifyOk', params: { category: res.categoria, city: res.ciudad ?? '', conf: res.confianza } },
      };
    }

    case 'ai.draft': {
      const r = render(cfgStr(step, 'template'), data, loc);
      if (r.missing.length) return missingErr(r.missing[0]);
      if (!r.text.trim()) return { kind: 'error', transient: false, msg: { key: 'err.emptyTemplate' } };
      return { kind: 'ok', output: { texto: r.text }, msg: { key: 'log.draftOk', params: { chars: r.text.length } } };
    }

    case 'ai.rag': {
      const r = render(cfgStr(step, 'question'), data, loc);
      if (!r.text.trim()) return missingErr(r.missing[0] ?? 'mensaje.texto');
      const q = normalize(r.text);
      let best: { e: KbEntry; score: number } | null = null;
      for (const e of ctx.kb) {
        const score = e.keywords
          .split(',')
          .map((w) => normalize(w))
          .filter((w) => w && q.includes(w)).length;
        if (score > 0 && (!best || score > best.score)) best = { e, score };
      }
      if (!best) return { kind: 'review', output: { encontrada: false, pregunta: r.text }, msg: { key: 'log.ragNone' } };
      return { kind: 'ok', output: { encontrada: true, texto: best.e.answer, fuente: best.e.source }, msg: { key: 'log.ragOk', params: { source: best.e.source } } };
    }

    case 'app.sheet': {
      const sheet = cfgStr(step, 'sheet') as SheetKey;
      const column = cfgStr(step, 'column');
      if (!SHEET_COLUMNS[sheet]?.includes(column)) return { kind: 'error', transient: false, msg: { key: 'err.badColumn', params: { column: column || '—' } } };
      const v = render(cfgStr(step, 'value'), data, loc);
      if (v.missing.length) return missingErr(v.missing[0]);
      if (transient) return rate();
      const needle = normalize(v.text).replace(/[^a-z0-9@.]/g, '');
      const row = ctx.sheets[sheet].find((rw) => normalize(String(rw[column] ?? '')).replace(/[^a-z0-9@.]/g, '') === needle);
      if (!row) {
        return { kind: 'review', output: { encontrado: false }, msg: { key: 'log.sheetNotFound', params: { sheet: `§sheets.${sheet}.name`, column, value: v.text } } };
      }
      return { kind: 'ok', output: { ...row }, msg: { key: 'log.sheetOk', params: { sheet: `§sheets.${sheet}.name`, column, value: v.text } } };
    }

    case 'app.accounting': {
      const party = render(cfgStr(step, 'party'), data, loc);
      if (party.missing.length) return missingErr(party.missing[0]);
      const amountR = render(cfgStr(step, 'amount'), data, loc);
      if (amountR.missing.length) return missingErr(amountR.missing[0]);
      const amount = parseNum(amountR.text);
      if (amount === null || amount <= 0) return { kind: 'error', transient: false, msg: { key: 'err.badAmount', params: { value: amountR.text || '—' } } };
      if (transient) return rate();
      ctx.counters.cxp += 1;
      const prefix = { payable: 'CxP', receipt: 'RC', note: 'NC' }[cfgStr(step, 'document')] ?? 'CxP';
      const numero = `${prefix}-${ctx.now.slice(0, 4)}-${String(ctx.counters.cxp).padStart(5, '0')}`;
      return {
        kind: 'ok',
        output: { numero, cuenta: cfgStr(step, 'account'), tercero: party.text, valor: amount },
        msg: { key: 'log.accountingOk', params: { number: numero, amount: fmtCop(amount, loc) } },
      };
    }

    case 'app.crm': {
      const name = render(cfgStr(step, 'contactName'), data, loc);
      if (name.missing.length || !name.text.trim()) return missingErr(name.missing[0] ?? 'lead.nombre');
      const email = render(cfgStr(step, 'email'), data, loc).text.trim();
      const phone = render(cfgStr(step, 'phone'), data, loc).text.trim();
      if (!email && !phone) return missingErr(templatePaths(cfgStr(step, 'email'))[0] ?? 'lead.correo');
      if (transient) return rate();
      const owner = render(cfgStr(step, 'owner'), data, loc).text.trim();
      const existing = email ? ctx.sheets.customers.find((c) => normalize(String(c.correo)) === normalize(email)) : undefined;
      let id: string;
      if (existing) id = `CT-${1000 + (hashStr(String(existing.correo)) % 9000)}`;
      else {
        ctx.counters.crm += 1;
        id = `CT-${String(2400 + ctx.counters.crm)}`;
      }
      return {
        kind: 'ok',
        output: { id, existente: !!existing, nombre: name.text, correo: email || null, telefono: phone || null, propietario: owner || null },
        msg: { key: existing ? 'log.crmUpdated' : 'log.crmCreated', params: { id, owner: owner || '—' } },
      };
    }

    case 'app.payment': {
      const amountR = render(cfgStr(step, 'amount'), data, loc);
      if (amountR.missing.length) return missingErr(amountR.missing[0]);
      const amount = parseNum(amountR.text);
      if (amount === null || amount <= 0) return { kind: 'error', transient: false, msg: { key: 'err.badAmount', params: { value: amountR.text || '—' } } };
      const ref = render(cfgStr(step, 'reference'), data, loc);
      if (ref.missing.length) return missingErr(ref.missing[0]);
      if (transient) return rate();
      ctx.counters.pay += 1;
      const days = Math.max(1, Number(step.config.dueDays) || 3);
      const code = (hashStr(`${ref.text}:${ctx.counters.pay}`) % 2176782336).toString(36).toUpperCase().padStart(6, '0');
      return {
        kind: 'ok',
        output: { enlace: `https://pagos.example/l/${code}`, valor: amount, referencia: ref.text, vence: dayOf(addDays(ctx.now, days)) },
        msg: { key: 'log.paymentOk', params: { amount: fmtCop(amount, loc), days } },
      };
    }

    case 'app.http': {
      const url = render(cfgStr(step, 'url'), data, loc);
      if (url.missing.length) return missingErr(url.missing[0]);
      if (!/^https:\/\/[^\s/]+\.[^\s]+$/.test(url.text.trim())) return { kind: 'error', transient: false, msg: { key: 'err.badUrl', params: { url: url.text || '—' } } };
      const method = cfgStr(step, 'method') || 'POST';
      let body: unknown = null;
      if (method !== 'GET') {
        const b = render(cfgStr(step, 'body'), data, loc);
        if (b.missing.length) return missingErr(b.missing[0]);
        if (b.text.trim()) {
          try {
            body = JSON.parse(b.text);
          } catch {
            return { kind: 'error', transient: false, msg: { key: 'err.badJson' } };
          }
        }
      }
      if (transient) return rate();
      return { kind: 'ok', output: { estado: 200, simulado: true, metodo: method, url: url.text.trim(), eco: body }, msg: { key: 'log.httpOk', params: { method, url: url.text.trim() } } };
    }

    case 'notify.chat': {
      const channel = cfgStr(step, 'channel') === 'whatsapp' ? 'whatsapp' : 'team';
      const toTpl = cfgStr(step, 'to');
      const to = render(toTpl, data, loc);
      if (!to.text.trim()) return missingErr(to.missing[0] ?? templatePaths(toTpl)[0] ?? 'para');
      const msgR = render(cfgStr(step, 'message'), data, loc);
      if (msgR.missing.length) return missingErr(msgR.missing[0]);
      if (!msgR.text.trim()) return { kind: 'error', transient: false, msg: { key: 'err.emptyTemplate' } };
      if (channel === 'whatsapp') {
        const digits = to.text.replace(/\D/g, '');
        const ok = (digits.length === 10 && digits.startsWith('3')) || (digits.length === 12 && digits.startsWith('573'));
        if (!ok) return { kind: 'error', transient: false, msg: { key: 'err.badPhone', params: { to: to.text } } };
      }
      if (transient) return rate();
      return {
        kind: 'ok',
        output: { canal: channel, para: to.text.trim(), texto: msgR.text, enviado: 'simulado' },
        msg: { key: 'log.chatOk', params: { channel: `§options.channel.${channel}`, to: to.text.trim() } },
      };
    }

    case 'notify.email': {
      const toTpl = cfgStr(step, 'to');
      const to = render(toTpl, data, loc);
      if (!to.text.trim()) return missingErr(to.missing[0] ?? templatePaths(toTpl)[0] ?? 'para');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.text.trim())) return { kind: 'error', transient: false, msg: { key: 'err.badEmail', params: { to: to.text } } };
      const subject = render(cfgStr(step, 'subject'), data, loc);
      const body = render(cfgStr(step, 'message'), data, loc);
      const missing = [...subject.missing, ...body.missing];
      if (missing.length) return missingErr(missing[0]);
      if (transient) return rate();
      return { kind: 'ok', output: { para: to.text.trim(), asunto: subject.text, texto: body.text, enviado: 'simulado' }, msg: { key: 'log.emailOk', params: { to: to.text.trim() } } };
    }

    case 'logic.condition': {
      const res = evalCondition(step, data, loc);
      if (res.missing.length) return missingErr(res.missing[0]);
      if ('notNumber' in res && res.notNumber) return { kind: 'error', transient: false, msg: { key: 'err.notNumber', params: { left: res.left || '—', right: res.right || '—' } } };
      const op = cfgStr(step, 'op');
      const params: Record<string, string | number> = { left: shortVal(res.left, loc), right: shortVal(res.right, loc), op: `§options.op.${op}` };
      if ('diffPct' in res && typeof res.diffPct === 'number') params.diff = fmtDec(res.diffPct, loc);
      const output = { cumple: res.pass, izquierda: res.left, derecha: res.right, ...('diffPct' in res && typeof res.diffPct === 'number' ? { diferenciaPct: Math.round(res.diffPct * 100) / 100 } : {}) };
      if (res.pass) return { kind: 'ok', output, msg: { key: op === 'approx' ? 'log.condTrueApprox' : 'log.condTrue', params } };
      const key = op === 'approx' ? 'log.condFalseApprox' : 'log.condFalse';
      if (cfgStr(step, 'onFalse') === 'stop') return { kind: 'stop', output, msg: { key, params: { ...params, then: '§options.onFalse.stop' } } };
      return { kind: 'review', output, msg: { key, params: { ...params, then: '§options.onFalse.review' } } };
    }

    case 'logic.wait': {
      const minutes = Math.max(1, Number(step.config.minutes) || 1);
      return { kind: 'ok', output: { minutos: minutes }, msg: { key: 'log.wait', params: { minutes } } };
    }

    case 'logic.assign': {
      const by = render(cfgStr(step, 'by'), data, loc).text.trim();
      const rows = parseTable(cfgStr(step, 'table'));
      const hit = rows.find((r) => r.key !== '*' && normalize(r.key) === normalize(by)) ?? rows.find((r) => r.key === '*');
      if (!hit) return { kind: 'error', transient: false, msg: { key: 'err.noRule', params: { value: by || '—' } } };
      return { kind: 'ok', output: { responsable: hit.value, regla: hit.key }, msg: { key: hit.key === '*' ? 'log.assignDefault' : 'log.assignOk', params: { owner: hit.value, value: by || '—' } } };
    }

    case 'code.js': {
      const code = cfgStr(step, 'code');
      if (!code.trim()) return { kind: 'error', transient: false, msg: { key: 'err.emptyCode' } };
      const res = await ctx.runJs(code, data);
      if (!res.ok) return { kind: 'error', transient: false, msg: { key: res.timeout ? 'err.jsTimeout' : 'err.js', params: { error: res.error } } };
      return { kind: 'ok', output: res.value, msg: { key: 'log.jsOk' } };
    }

    case 'code.map': {
      const rows = parseTable(cfgStr(step, 'mapping'));
      if (!rows.length) return { kind: 'error', transient: false, msg: { key: 'err.emptyMap' } };
      const out: Record<string, string> = {};
      for (const r of rows) {
        const v = render(r.value, data, loc);
        if (v.missing.length) return missingErr(v.missing[0]);
        out[r.key] = v.text;
      }
      return { kind: 'ok', output: out, msg: { key: 'log.mapOk', params: { count: rows.length } } };
    }
    default:
      return { kind: 'error', transient: false, msg: { key: 'err.unknown' } };
  }
}

/* ------------------------------------------------------------------------ */
/* Tiempos simulados                                                         */
/* ------------------------------------------------------------------------ */

const DURATION: Record<string, [number, number]> = {
  triggers: [8, 24],
  ai: [650, 1500],
  apps: [160, 620],
  notify: [110, 300],
  logic: [2, 9],
  code: [15, 70],
};

export function simDuration(seq: number, step: Step, attempt: number): number {
  const [min, max] = DURATION[TYPE_DEFS[step.type].category];
  return min + (hashStr(`${seq}:${step.id}:${attempt}`) % (max - min + 1));
}

export function backoffMs(policy: Step['retry'], attempt: number): number {
  const base = Math.max(1, policy.baseSeconds) * 1000;
  return policy.backoff === 'linear' ? base * attempt : base * 2 ** (attempt - 1);
}

/* ------------------------------------------------------------------------ */
/* Ejecución                                                                 */
/* ------------------------------------------------------------------------ */

export interface ReviewDraft {
  kind: 'exception' | 'failure';
  stepId: string;
  stepName: string;
  reason: Msg;
  data: Data;
  resumeFrom: string;
  missingPath?: string;
}

export interface RunOutcome {
  status: RunStatus;
  steps: StepLog[];
  data: Data;
  durationMs: number;
  summary: Msg;
  review?: ReviewDraft;
}

function clone<T>(x: T): T {
  return x === undefined ? x : (JSON.parse(JSON.stringify(x)) as T);
}

export function validateFlow(steps: Step[]): Msg | null {
  if (!steps.length || !isTrigger(steps[0].type)) return { key: 'err.noTrigger' };
  if (steps.slice(1).some((s) => isTrigger(s.type))) return { key: 'err.twoTriggers' };
  return null;
}

/**
 * Ejecuta los pasos desde startIndex. Con `resume` (reintento manual o
 * aprobación) no se repiten los errores temporales del ejemplo.
 */
export async function executeRun(opts: {
  steps: Step[];
  sample: SampleEvent;
  ctx: RunCtx;
  startIndex?: number;
  data?: Data;
  resume?: boolean;
  /** Para «Probar paso»: se detiene después de este índice. */
  untilIndex?: number;
}): Promise<RunOutcome> {
  const { steps, sample, ctx } = opts;
  const start = opts.startIndex ?? 0;
  const until = opts.untilIndex ?? steps.length - 1;
  let data: Data = clone(opts.data ?? {});
  const logs: StepLog[] = [];
  let status: RunStatus = 'success';
  let review: ReviewDraft | undefined;
  let retries = 0;

  for (let i = start; i <= until && i < steps.length; i++) {
    const step = steps[i];
    let attempt = 1;
    let finished = false;
    while (!finished) {
      const input = clone(data);
      const transient = !opts.resume && attempt === 1 && !!sample.transient?.includes(step.type);
      const out = await execStep(step, data, ctx, transient, sample);
      const durationMs = simDuration(ctx.seq, step, attempt);
      const base = { stepId: step.id, name: step.name, type: step.type as StepType, attempt, durationMs, input, msg: out.msg };

      if (out.kind === 'error' && out.transient && attempt <= step.retry.attempts) {
        const waitMs = backoffMs(step.retry, attempt);
        logs.push({ ...base, status: 'retry', waitMs });
        retries += 1;
        attempt += 1;
        continue;
      }
      finished = true;
      if (out.kind === 'error') {
        logs.push({ ...base, status: 'failed', msg: out.transient ? { key: 'err.retriesExhausted', params: { attempts: attempt } } : out.msg });
        status = 'failed';
        review = {
          kind: 'failure',
          stepId: step.id,
          stepName: step.name,
          reason: out.transient ? { key: 'err.retriesExhausted', params: { attempts: attempt } } : out.msg,
          data: input,
          resumeFrom: step.id,
          missingPath: out.missingPath,
        };
        break;
      }
      const output = clone(out.output);
      if (output !== undefined) {
        if (isTrigger(step.type) && output && typeof output === 'object') data = { ...data, ...(output as Data) };
        else data = { ...data, [String(step.config.saveAs || step.id)]: output };
      }
      if (out.kind === 'ok') {
        logs.push({ ...base, status: 'success', output });
        continue;
      }
      if (out.kind === 'stop') {
        logs.push({ ...base, status: 'stopped', output });
        status = 'stopped';
        break;
      }
      logs.push({ ...base, status: 'review', output });
      status = 'review';
      review = {
        kind: 'exception',
        stepId: step.id,
        stepName: step.name,
        reason: out.msg,
        data: clone(data),
        resumeFrom: steps[i + 1]?.id ?? '',
      };
    }
    if (status !== 'success') break;
  }

  if (status === 'success' && retries > 0) status = 'retried';
  const durationMs = logs.reduce((acc, l) => acc + l.durationMs + (l.waitMs ?? 0), 0);
  const last = logs[logs.length - 1];
  const summary: Msg =
    status === 'success'
      ? { key: 'sum.success', params: { count: logs.length } }
      : status === 'retried'
        ? { key: 'sum.retried', params: { count: logs.length, retries } }
        : { key: `sum.${status}`, params: { step: last?.name ?? '—' } };
  return { status, steps: logs, data, durationMs, summary, review };
}
