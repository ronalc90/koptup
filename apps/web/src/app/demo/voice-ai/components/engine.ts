import type {
  CallRow, CampaignContact, ContactCheck, FnKey, FnStatus, Phase, Scenario, Sentiment,
} from './types';

/* ------------------------------------------------------------------ */
/* Línea de tiempo de la llamada                                       */
/* ------------------------------------------------------------------ */

/** Segundo de inicio de cada turno (acumulado). */
export function buildTimeline(durations: number[]): number[] {
  const at: number[] = [];
  let acc = 0;
  for (const d of durations) {
    at.push(acc);
    acc += d;
  }
  return at;
}

/** Segundos de llamada transcurridos (reloj del guion, no del navegador). */
export function callClock(at: number[], durations: number[], cursor: number, elapsedMs: number): number {
  if (cursor < 0) return 0;
  const i = Math.min(cursor, durations.length - 1);
  return at[i] + Math.min(elapsedMs / 1000, durations[i]);
}

/**
 * Estado de cada función del escenario:
 * - pending: el turno que la invoca aún no llega.
 * - running: el turno que la invoca se está reproduciendo.
 * - done: el turno ya terminó.
 * - skipped: la llamada terminó (transferida o colgada) antes de invocarla.
 */
export function fnStatuses(scenario: Scenario, cursor: number, turnFinished: boolean, phase: Phase): Record<FnKey, FnStatus> {
  const out = {} as Record<FnKey, FnStatus>;
  const callOver = phase === 'ended' || phase === 'transferred';
  scenario.fns.forEach((fn) => {
    const idx = scenario.turns.findIndex((tn) => tn.fns?.includes(fn.key));
    let st: FnStatus = 'pending';
    if (idx >= 0 && idx < cursor) st = 'done';
    else if (idx >= 0 && idx === cursor) st = turnFinished || callOver ? 'done' : 'running';
    if (st === 'pending' && callOver) st = 'skipped';
    out[fn.key] = st;
  });
  return out;
}

const SENT_ORDER: Record<Sentiment, number> = { negative: 0, neutral: 1, positive: 2 };

export function sentimentTrend(seq: Sentiment[]): 'improving' | 'stable' | 'declining' {
  if (seq.length < 2) return 'stable';
  const a = SENT_ORDER[seq[0]];
  const b = SENT_ORDER[seq[seq.length - 1]];
  return b > a ? 'improving' : b < a ? 'declining' : 'stable';
}

/* ------------------------------------------------------------------ */
/* Ventana de contacto para cobranza (referencia: Ley 2300 de 2023)    */
/* ------------------------------------------------------------------ */

/** Años en los que la demo decide (la Ley 2300 rige desde 2023). */
export const RULE_YEARS = { from: 2024, to: 2099 } as const;

function isoDate(dt: Date): string {
  return dt.toISOString().slice(0, 10);
}

function addDaysUTC(y: number, m: number, d: number, days: number): Date {
  return new Date(Date.UTC(y, m - 1, d + days));
}

/** Domingo de Pascua (algoritmo de Meeus/Jones/Butcher, calendario gregoriano). */
export function easterSunday(year: number): { m: number; d: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { m: month, d: day };
}

/** Traslada la fecha al lunes siguiente si no cae en lunes (Ley 51 de 1983, «Ley Emiliani»). */
function nextMonday(y: number, m: number, d: number): Date {
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = dt.getUTCDay();
  const shift = dow === 1 ? 0 : (8 - dow) % 7;
  dt.setUTCDate(dt.getUTCDate() + shift);
  return dt;
}

const holidayCache = new Map<number, Record<string, string>>();

/**
 * Festivos de Colombia de un año (fecha AAAA-MM-DD → clave de demoVoice.holidays):
 * fijos, trasladables al lunes (Ley 51 de 1983) y los que dependen de la Pascua.
 */
export function colombianHolidays(year: number): Record<string, string> {
  const cached = holidayCache.get(year);
  if (cached) return cached;
  const out: Record<string, string> = {};
  const put = (dt: Date, key: string) => {
    const iso = isoDate(dt);
    if (!out[iso]) out[iso] = key;
  };
  const fixed = (m: number, d: number) => new Date(Date.UTC(year, m - 1, d));
  put(fixed(1, 1), 'newYear');
  put(nextMonday(year, 1, 6), 'epiphany');
  put(nextMonday(year, 3, 19), 'saintJoseph');
  const e = easterSunday(year);
  put(addDaysUTC(year, e.m, e.d, -3), 'holyThursday');
  put(addDaysUTC(year, e.m, e.d, -2), 'goodFriday');
  put(fixed(5, 1), 'labour');
  put(addDaysUTC(year, e.m, e.d, 43), 'ascension');
  put(addDaysUTC(year, e.m, e.d, 64), 'corpusChristi');
  put(addDaysUTC(year, e.m, e.d, 71), 'sacredHeart');
  put(nextMonday(year, 6, 29), 'saintsPeterPaul');
  put(fixed(7, 20), 'independence');
  put(fixed(8, 7), 'boyaca');
  put(nextMonday(year, 8, 15), 'assumption');
  put(nextMonday(year, 10, 12), 'raceDay');
  put(nextMonday(year, 11, 1), 'allSaints');
  put(nextMonday(year, 11, 11), 'cartagena');
  put(fixed(12, 8), 'immaculate');
  put(fixed(12, 25), 'christmas');
  holidayCache.set(year, out);
  return out;
}

/** Ventanas permitidas en minutos desde la medianoche. */
export const CONTACT_WINDOWS = {
  weekday: { from: 7 * 60, to: 19 * 60 },
  saturday: { from: 8 * 60, to: 15 * 60 },
} as const;

function parseDate(date: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  const y = +m[1];
  const mo = +m[2];
  const d = +m[3];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return { y, m: mo, d };
}

function parseTime(time: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m) return null;
  const h = +m[1];
  const mi = +m[2];
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
}

/** Día de la semana (0 = domingo) sin depender de la zona horaria del navegador. */
export function dayOfWeek(date: string): number {
  const p = parseDate(date);
  if (!p) return -1;
  return new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay();
}

/** Lunes (AAAA-MM-DD) de la semana de la fecha. */
export function weekStart(date: string): string {
  const p = parseDate(date);
  if (!p) return '';
  const dt = new Date(Date.UTC(p.y, p.m - 1, p.d));
  const dow = dt.getUTCDay();
  const back = dow === 0 ? 6 : dow - 1;
  dt.setUTCDate(dt.getUTCDate() - back);
  return dt.toISOString().slice(0, 10);
}

/**
 * ¿Se puede llamar en esa fecha y hora? Lunes a viernes 7:00–19:00,
 * sábados 8:00–15:00, sin domingos ni festivos de Colombia (calculados
 * para cada año). Fuera de RULE_YEARS la demo no decide.
 */
export function checkContactWindow(date: string, time: string): ContactCheck {
  const p = parseDate(date);
  const minutes = parseTime(time);
  if (!p || minutes === null) return { kind: 'blocked', reason: 'invalid' };
  if (p.y < RULE_YEARS.from || p.y > RULE_YEARS.to) return { kind: 'blocked', reason: 'outOfRange' };
  const dow = dayOfWeek(date);
  if (dow === 0) return { kind: 'blocked', reason: 'sunday' };
  const holiday = colombianHolidays(p.y)[date];
  if (holiday) return { kind: 'blocked', reason: 'holiday', holiday };
  const win = dow === 6 ? CONTACT_WINDOWS.saturday : CONTACT_WINDOWS.weekday;
  if (minutes < win.from) return { kind: 'blocked', reason: 'beforeOpen' };
  if (minutes >= win.to) return { kind: 'blocked', reason: 'afterClose' };
  return { kind: 'allowed' };
}

/**
 * Evalúa la campaña en orden de fecha y hora: exclusión, frecuencia (máximo
 * una llamada por semana al mismo número, contando el último contacto previo y
 * las llamadas que la propia campaña ya hizo esa semana) y horario.
 */
export function evaluateCampaign(contacts: CampaignContact[]): ContactCheck[] {
  const calledWeeks = new Map<string, Set<string>>();
  const mark = (number: string, week: string) => {
    const set = calledWeeks.get(number) ?? new Set<string>();
    set.add(week);
    calledWeeks.set(number, set);
  };
  // Los contactos previos a la campaña cuentan para ese número.
  contacts.forEach((c) => {
    if (c.lastContact) mark(c.number, weekStart(c.lastContact));
  });
  return contacts.map((c) => {
    if (c.excluded) return { kind: 'blocked', reason: 'excluded' } as ContactCheck;
    const week = weekStart(c.date);
    if (week && calledWeeks.get(c.number)?.has(week)) return { kind: 'blocked', reason: 'frequency' } as ContactCheck;
    const r = checkContactWindow(c.date, c.time);
    if (r.kind === 'allowed') mark(c.number, week);
    return r;
  });
}

/** Evalúa un contacto aislado (sin el historial del resto de la campaña). */
export function evaluateContact(c: CampaignContact): ContactCheck {
  return evaluateCampaign([c])[0];
}

export interface CampaignTotals {
  scheduled: number;
  blocked: number;
  dialed: number;
  connected: number;
  voicemail: number;
  agreements: number;
}

export function campaignTotals(contacts: CampaignContact[], processed: number, checks = evaluateCampaign(contacts)): CampaignTotals {
  const totals: CampaignTotals = { scheduled: contacts.length, blocked: 0, dialed: 0, connected: 0, voicemail: 0, agreements: 0 };
  contacts.slice(0, processed).forEach((c, i) => {
    if (checks[i].kind === 'blocked') {
      totals.blocked += 1;
      return;
    }
    totals.dialed += 1;
    if (c.outcome === 'voicemail') totals.voicemail += 1;
    if (c.outcome === 'agreement' || c.outcome === 'paid' || c.outcome === 'callback') totals.connected += 1;
    if (c.outcome === 'agreement') totals.agreements += 1;
  });
  return totals;
}

/** Enmascara un número colombiano de 10 dígitos: +57 310 *** 4821. Devuelve null si no es válido. */
export function maskColombianNumber(raw: string): string | null {
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('57')) digits = digits.slice(2);
  if (digits.length !== 10 || !/^(3\d{2}|60[1-8])/.test(digits)) return null;
  return `+57 ${digits.slice(0, 3)} *** ${digits.slice(6)}`;
}

/** Ordena por fecha y hora programadas. */
export function sortContacts(list: CampaignContact[]): CampaignContact[] {
  return [...list].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

/* ------------------------------------------------------------------ */
/* Métricas del registro de llamadas                                   */
/* ------------------------------------------------------------------ */

export interface Kpis {
  total: number;
  answered: number;
  resolved: number;
  transferred: number;
  /** % de llamadas atendidas resueltas por el agente IA sin pasar a un humano. */
  containment: number;
  /** Duración media (s) de las llamadas atendidas. */
  aht: number;
  /** Promedio de la encuesta 1–5 (null si nadie respondió). */
  csat: number | null;
  csatResponses: number;
  /** % de llamadas atendidas que terminaron con sentimiento positivo. */
  positive: number;
}

export function computeKpis(rows: CallRow[]): Kpis {
  const answered = rows.filter((r) => r.result === 'resolved' || r.result === 'transferred' || r.result === 'abandoned');
  const resolved = answered.filter((r) => r.result === 'resolved').length;
  const transferred = answered.filter((r) => r.result === 'transferred').length;
  const withCsat = rows.filter((r) => r.csat !== null);
  const csat = withCsat.length ? withCsat.reduce((s, r) => s + (r.csat ?? 0), 0) / withCsat.length : null;
  const aht = answered.length ? answered.reduce((s, r) => s + r.durationSec, 0) / answered.length : 0;
  const positive = answered.length ? (answered.filter((r) => r.sentiment === 'positive').length / answered.length) * 100 : 0;
  return {
    total: rows.length,
    answered: answered.length,
    resolved,
    transferred,
    containment: answered.length ? (resolved / answered.length) * 100 : 0,
    aht,
    csat,
    csatResponses: withCsat.length,
    positive,
  };
}

/* ------------------------------------------------------------------ */
/* Exportaciones                                                       */
/* ------------------------------------------------------------------ */

export function toCsv(rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[";\n,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(esc).join(';')).join('\r\n');
}

/** Descarga un archivo de texto (CSV con BOM para que Excel respete las tildes). */
export function downloadText(filename: string, content: string, mime: string) {
  const bom = mime.includes('csv') ? '﻿' : '';
  const blob = new Blob([bom + content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
