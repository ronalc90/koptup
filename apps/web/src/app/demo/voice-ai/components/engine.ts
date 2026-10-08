import type {
  CallRow, CampaignContact, ContactCheck, FnKey, FnStatus, Phase, Scenario, Sentiment,
} from './types';

/* ------------------------------------------------------------------ */
/* Línea de tiempo de la llamada                                       */
/* ------------------------------------------------------------------ */

/**
 * Duración de un turno en segundos según su número de palabras
 * (≈ 2,6 palabras por segundo, mínimo 2 s). Es determinista: la misma
 * transcripción produce siempre los mismos tiempos.
 */
export function estimateTurnSeconds(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 2.6 + 0.8));
}

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

/** Festivos de Colombia en 2026 (fecha → clave de demoVoice.holidays). */
export const HOLIDAYS_CO_2026: Record<string, string> = {
  '2026-01-01': 'newYear',
  '2026-01-12': 'epiphany',
  '2026-03-23': 'saintJoseph',
  '2026-04-02': 'holyThursday',
  '2026-04-03': 'goodFriday',
  '2026-05-01': 'labour',
  '2026-05-18': 'ascension',
  '2026-06-08': 'corpusChristi',
  '2026-06-15': 'sacredHeart',
  '2026-06-29': 'saintsPeterPaul',
  '2026-07-20': 'independence',
  '2026-08-07': 'boyaca',
  '2026-08-17': 'assumption',
  '2026-10-12': 'raceDay',
  '2026-11-02': 'allSaints',
  '2026-11-16': 'cartagena',
  '2026-12-08': 'immaculate',
  '2026-12-25': 'christmas',
};

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
 * sábados 8:00–15:00, sin domingos ni festivos. Solo hay festivos cargados
 * para 2026: fuera de ese año la demo no decide.
 */
export function checkContactWindow(date: string, time: string): ContactCheck {
  const p = parseDate(date);
  const minutes = parseTime(time);
  if (!p || minutes === null) return { kind: 'blocked', reason: 'invalid' };
  if (p.y !== 2026) return { kind: 'blocked', reason: 'outOfRange' };
  const dow = dayOfWeek(date);
  if (dow === 0) return { kind: 'blocked', reason: 'sunday' };
  const holiday = HOLIDAYS_CO_2026[date];
  if (holiday) return { kind: 'blocked', reason: 'holiday', holiday };
  const win = dow === 6 ? CONTACT_WINDOWS.saturday : CONTACT_WINDOWS.weekday;
  if (minutes < win.from) return { kind: 'blocked', reason: 'beforeOpen' };
  if (minutes >= win.to) return { kind: 'blocked', reason: 'afterClose' };
  return { kind: 'allowed' };
}

/** Evalúa un contacto de la campaña: exclusión, frecuencia (1 por semana) y horario. */
export function evaluateContact(c: CampaignContact): ContactCheck {
  if (c.excluded) return { kind: 'blocked', reason: 'excluded' };
  if (c.lastContact && weekStart(c.lastContact) === weekStart(c.date)) {
    return { kind: 'blocked', reason: 'frequency' };
  }
  return checkContactWindow(c.date, c.time);
}

export interface CampaignTotals {
  scheduled: number;
  blocked: number;
  dialed: number;
  connected: number;
  voicemail: number;
  agreements: number;
}

export function campaignTotals(contacts: CampaignContact[], processed: number): CampaignTotals {
  const done = contacts.slice(0, processed);
  const totals: CampaignTotals = { scheduled: contacts.length, blocked: 0, dialed: 0, connected: 0, voicemail: 0, agreements: 0 };
  done.forEach((c) => {
    const r = evaluateContact(c);
    if (r.kind === 'blocked') {
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
