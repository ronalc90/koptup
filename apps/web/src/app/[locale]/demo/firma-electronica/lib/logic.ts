/** Reglas de la demo (funciones puras, probadas en __tests__/logic.test.ts). */
import { diffMinutes, monthOf, type Loc } from './dates';
import { sha256Hex } from './sha256';
import type { BulkRow, Draft, Envelope, EvEvent, Signer, Stamp } from './types';

/* ---------- Plantillas ---------- */

export function detectVars(body: string): string[] {
  const out: string[] = [];
  for (const m of body.matchAll(/\{([A-Za-z0-9_áéíóúñÁÉÍÓÚÑ]+)\}/g)) if (!out.includes(m[1])) out.push(m[1]);
  return out;
}

/** Reemplaza {variable} por su valor; las vacías quedan como [variable]. */
export function renderTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{([A-Za-z0-9_áéíóúñÁÉÍÓÚÑ]+)\}/g, (_, k: string) => {
    const v = vars[k]?.trim();
    return v ? v : `[${k}]`;
  });
}

const LONG_MONTHS: Record<Loc, string[]> = {
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

/** "1 de noviembre de 2026" / "November 1, 2026" */
export function longDate(y: number, m: number, d: number, loc: Loc): string {
  return loc === 'en' ? `${LONG_MONTHS.en[m - 1]} ${d}, ${y}` : `${d} de ${LONG_MONTHS.es[m - 1]} de ${y}`;
}

/** Valor de ejemplo de una variable de fecha, a partir de hoy. */
export function sampleDate(kind: 'nextMonthStart' | 'today' | 'prevMonthEnd', now: Stamp, loc: Loc): string {
  const [y, m, d] = now.slice(0, 10).split('-').map(Number);
  if (kind === 'today') return longDate(y, m, d, loc);
  if (kind === 'nextMonthStart') return m === 12 ? longDate(y + 1, 1, 1, loc) : longDate(y, m + 1, 1, loc);
  const last = new Date(Date.UTC(y, m - 1, 0)).getUTCDate();
  return m === 1 ? longDate(y - 1, 12, last, loc) : longDate(y, m - 1, last, loc);
}

/* ---------- Datos de contacto ---------- */

export function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

/** Celular colombiano: 10 dígitos que empiezan por 3 (acepta +57 y espacios). */
export function normalizeMobile(v: string): string {
  let d = v.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('57')) d = d.slice(2);
  return d;
}

export function isCoMobile(v: string): boolean {
  return /^3\d{9}$/.test(normalizeMobile(v));
}

export function formatMobile(v: string): string {
  const d = normalizeMobile(v);
  return d.length === 10 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : v;
}

/** Correo ocultando parte del usuario: "an***@correo.example". */
export function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  return `${user.slice(0, 2)}***@${domain}`;
}

export function maskMobile(v: string): string {
  const d = normalizeMobile(v);
  return d.length === 10 ? `${d.slice(0, 3)} *** ${d.slice(-4)}` : v;
}

/** Dígito de verificación del NIT (DIAN, módulo 11). */
export function nitDv(nit: string): number {
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const digits = nit.replace(/\D/g, '').split('').reverse();
  const sum = digits.reduce((acc, d, i) => acc + Number(d) * weights[i], 0);
  const r = sum % 11;
  return r >= 2 ? 11 - r : r;
}

/** "901.537.284-9" */
export function formatNit(nit: string): string {
  const clean = nit.replace(/\D/g, '');
  return `${clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${nitDv(clean)}`;
}

/* ---------- Firmantes y turnos ---------- */

export function acts(s: Pick<Signer, 'role'>): boolean {
  return s.role !== 'cc';
}

/** Firmantes que deben firmar o aprobar y todavía no lo han hecho. */
export function pendingSigners(env: Pick<Envelope, 'signers'>): Signer[] {
  return env.signers.filter((s) => acts(s) && s.state !== 'signed');
}

/** ¿Puede actuar este firmante ahora? En modo secuencial solo el siguiente en orden. */
export function canAct(env: Pick<Envelope, 'signers' | 'mode' | 'status'>, signerId: string): boolean {
  if (env.status !== 'sent' && env.status !== 'partial') return false;
  const s = env.signers.find((x) => x.id === signerId);
  if (!s || !acts(s) || s.state === 'signed') return false;
  if (env.mode === 'parallel') return true;
  return pendingSigners(env)[0]?.id === signerId;
}

/** A quién le toca (secuencial) o quiénes faltan (paralelo). */
export function whoIsNext(env: Pick<Envelope, 'signers' | 'mode' | 'status'>): Signer[] {
  if (env.status !== 'sent' && env.status !== 'partial') return [];
  const pending = pendingSigners(env);
  return env.mode === 'parallel' ? pending : pending.slice(0, 1);
}

/* ---------- Evidencia: cadena de hashes ---------- */

export function eventPayload(e: Omit<EvEvent, 'hash' | 'prev'>): string {
  const detail = Object.keys(e.detail)
    .sort()
    .map((k) => `${k}=${e.detail[k]}`)
    .join('&');
  return [e.id, e.type, e.at, e.actor, e.ip, e.device, e.geo, detail].join('|');
}

export function chainHash(prev: string, e: Omit<EvEvent, 'hash' | 'prev'>): string {
  return sha256Hex(`${prev}|${eventPayload(e)}`);
}

/** Agrega un evento encadenado: su hash incluye el hash del anterior (o la huella del documento). */
export function appendEvent(docHash: string, events: EvEvent[], e: Omit<EvEvent, 'hash' | 'prev'>): EvEvent[] {
  const prev = events.length ? events[events.length - 1].hash : docHash;
  return [...events, { ...e, prev, hash: chainHash(prev, e) }];
}

/** Recalcula la cadena completa. Si algo cambió, dice en qué evento se rompe. */
export function verifyChain(docHash: string, events: EvEvent[]): { ok: boolean; checked: number; brokenAt: number | null } {
  let prev = docHash;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (e.prev !== prev || chainHash(prev, e) !== e.hash) return { ok: false, checked: i, brokenAt: i };
    prev = e.hash;
  }
  return { ok: true, checked: events.length, brokenAt: null };
}

/* ---------- Indicadores ---------- */

export interface Metrics {
  pending: number;
  signedMonth: number;
  expired: number;
  drafts: number;
  rate: number | null;
  avgMinutes: number | null;
  completed: number;
  closed: number;
}

/** Todo sale de la lista de sobres: cambia al enviar, firmar, anular o vencer. */
export function computeMetrics(envs: Envelope[], now: Stamp): Metrics {
  const month = monthOf(now);
  const completed = envs.filter((e) => e.status === 'completed');
  const closed = envs.filter((e) => e.status === 'completed' || e.status === 'expired' || e.status === 'voided');
  const durations = completed.filter((e) => e.sentAt && e.completedAt).map((e) => diffMinutes(e.sentAt as string, e.completedAt as string));
  return {
    pending: envs.filter((e) => e.status === 'sent' || e.status === 'partial').length,
    signedMonth: completed.filter((e) => e.completedAt && monthOf(e.completedAt) === month).length,
    expired: envs.filter((e) => e.status === 'expired').length,
    drafts: envs.filter((e) => e.status === 'draft').length,
    rate: closed.length ? Math.round((completed.length / closed.length) * 100) : null,
    avgMinutes: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null,
    completed: completed.length,
    closed: closed.length,
  };
}

/* ---------- Validación del asistente ---------- */

export interface StepError {
  key: string;
  params?: Record<string, string | number>;
}

export function validateStep(d: Draft, step: number, vars: string[]): StepError[] {
  const errs: StepError[] = [];
  if (step === 0) {
    if (!d.doc) errs.push({ key: 'docRequired' });
    else if (d.doc.kind === 'template') {
      const missing = vars.filter((v) => !d.doc?.vars?.[v]?.trim());
      if (missing.length) errs.push({ key: 'varsRequired', params: { vars: missing.join(', ') } });
    }
    if (d.doc?.kind === 'upload' && !d.title.trim()) errs.push({ key: 'titleRequired' });
  }
  if (step === 1) {
    if (!d.signers.some(acts)) errs.push({ key: 'noActing' });
    const seen = new Set<string>();
    d.signers.forEach((s, i) => {
      const n = i + 1;
      if (s.name.trim().length < 3) errs.push({ key: 'nameInvalid', params: { n } });
      if (!isEmail(s.email)) errs.push({ key: 'emailInvalid', params: { n } });
      else if (seen.has(s.email.trim().toLowerCase())) errs.push({ key: 'emailDuplicate', params: { n } });
      seen.add(s.email.trim().toLowerCase());
      if (s.channel !== 'email' && !isCoMobile(s.phone)) errs.push({ key: 'phoneInvalid', params: { n } });
    });
  }
  if (step === 2) {
    d.signers
      .filter((s) => s.role === 'signer' || s.role === 'witness')
      .forEach((s) => {
        if (!d.fields.some((f) => f.signerId === s.id && f.type === 'signature')) errs.push({ key: 'signatureMissing', params: { name: s.name || '?' } });
      });
  }
  if (step === 3) {
    if (!Number.isInteger(d.expiryDays) || d.expiryDays < 1 || d.expiryDays > 90) errs.push({ key: 'expiryRange' });
    if (!Number.isInteger(d.reminderDays) || d.reminderDays < 1 || d.reminderDays > 30) errs.push({ key: 'reminderRange' });
    else if (d.reminderDays >= d.expiryDays) errs.push({ key: 'reminderBeforeExpiry' });
    const open = d.redlines ? d.comments.filter((c) => c.status === 'open').length : 0;
    if (open) errs.push({ key: 'openComments', params: { n: open } });
  }
  return errs;
}

/* ---------- CSV ---------- */

/** Separa un CSV respetando comillas. Detecta ";" o "," por la primera línea. */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, '');
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? '';
  const sep = (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows.map((r) => r.map((c) => c.trim()));
}

function csvCell(v: string | number, sep: string): string {
  const s = String(v);
  return s.includes(sep) || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildCsv(headers: string[], rows: (string | number)[][], sep: ';' | ','): string {
  return [headers, ...rows].map((r) => r.map((c) => csvCell(c, sep)).join(sep)).join('\r\n');
}

/** "Correo electrónico" → "correoelectronico" (para reconocer encabezados). */
export function normHeader(h: string): string {
  return h
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Lee las filas de un envío masivo. `aliases` dice qué encabezados valen para
 * cada columna (name, email, phone y las variables de la plantilla).
 */
export function readBulk(
  table: string[][],
  aliases: Record<string, string[]>,
  templateVars: string[],
  maxRows: number,
): { rows: BulkRow[]; missingColumns: string[]; truncated: boolean } {
  const required = ['name', 'email', ...templateVars.filter((v) => v !== 'name')];
  const [header = [], ...body] = table;
  const index: Record<string, number> = {};
  header.forEach((h, i) => {
    const n = normHeader(h);
    for (const [key, list] of Object.entries(aliases)) if (index[key] === undefined && list.some((a) => normHeader(a) === n)) index[key] = i;
  });
  const missingColumns = required.filter((k) => index[k] === undefined);
  if (missingColumns.length) return { rows: [], missingColumns, truncated: false };
  const truncated = body.length > maxRows;
  const seen = new Set<string>();
  const rows = body.slice(0, maxRows).map((cells, i) => {
    const get = (k: string) => (index[k] === undefined ? '' : (cells[index[k]] ?? '').trim());
    const vars: Record<string, string> = {};
    const name = get('name');
    templateVars.forEach((k) => (vars[k] = k === 'name' ? name : get(k)));
    const errors: string[] = [];
    const email = get('email');
    const phone = get('phone');
    if (name.length < 3) errors.push('name');
    if (!isEmail(email)) errors.push('email');
    else if (seen.has(email.toLowerCase())) errors.push('duplicate');
    seen.add(email.toLowerCase());
    if (phone && !isCoMobile(phone)) errors.push('phone');
    Object.entries(vars).forEach(([k, v]) => {
      if (!v && k !== 'name') errors.push(`var:${k}`);
    });
    return { line: i + 2, name, email, phone: phone ? normalizeMobile(phone) : '', vars, errors };
  });
  return { rows, missingColumns, truncated };
}

/* ---------- Dispositivo ---------- */

/** "Chrome · Windows" a partir del navegador que usas (para la evidencia). */
export function deviceLabel(ua: string): string {
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\//.test(ua)
      ? 'Opera'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Chrome\//.test(ua)
          ? 'Chrome'
          : /Safari\//.test(ua)
            ? 'Safari'
            : 'Web';
  const os = /Android/.test(ua)
    ? 'Android'
    : /iPhone|iPad|iPod/.test(ua)
      ? 'iOS'
      : /Windows/.test(ua)
        ? 'Windows'
        : /Mac OS X/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : '';
  return os ? `${browser} · ${os}` : browser;
}

/** Cuenta las páginas de un PDF (aproximado: objetos /Type /Page). */
export function countPdfPages(bytes: Uint8Array): number {
  const sample = bytes.length > 8_000_000 ? bytes.subarray(0, 8_000_000) : bytes;
  let text = '';
  for (let i = 0; i < sample.length; i += 65536) text += String.fromCharCode(...Array.from(sample.subarray(i, i + 65536)));
  return (text.match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length;
}

export function isPdf(bytes: Uint8Array): boolean {
  return bytes.length > 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}
