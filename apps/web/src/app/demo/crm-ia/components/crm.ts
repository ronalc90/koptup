/**
 * Lógica del CRM de ejemplo. Todo se calcula en el navegador a partir de los
 * negocios del estado (puntaje, probabilidad, métricas, pronóstico, alertas,
 * historial). Funciones puras y deterministas: no usan la fecha actual del
 * sistema, sino la fecha de corte fija de los datos de ejemplo (REF_DATE), para
 * que el render del servidor y el del cliente sean idénticos.
 */

import { CALLS, SEED_DEALS, SEED_ENROLLMENTS } from './data';

export const REF_DATE = '2026-10-08';

export type StageId = 'prospect' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
export const OPEN_STAGES: StageId[] = ['prospect', 'qualified', 'proposal', 'negotiation'];
export const ALL_STAGES: StageId[] = [...OPEN_STAGES, 'won', 'lost'];

export type Temperature = 'hot' | 'warm' | 'cold';
export type ChannelId = 'whatsapp' | 'email' | 'call';
export type SourceId = 'web' | 'referral' | 'fair' | 'inbound' | 'import';
export type OwnerId = 'vr' | 'ac' | 'jo';
export type SizeId = 'small' | 'medium' | 'large';
export type LostReason = 'price' | 'competitor' | 'timing' | 'noResponse';

export const OWNERS: Record<OwnerId, { name: string; initials: string }> = {
  vr: { name: 'Valentina Ríos', initials: 'VR' },
  ac: { name: 'Andrés Cárdenas', initials: 'AC' },
  jo: { name: 'Juliana Ospina', initials: 'JO' },
};
export const OWNER_IDS = Object.keys(OWNERS) as OwnerId[];

export const CITIES = [
  'Barranquilla',
  'Bogotá',
  'Bucaramanga',
  'Cali',
  'Cartagena',
  'Manizales',
  'Medellín',
  'Pereira',
  'Tunja',
  'Villavicencio',
];

export interface Deal {
  id: string;
  contactName: string;
  company: string;
  nit: string;
  city: string;
  email: string;
  phone: string;
  channel: ChannelId;
  source: SourceId;
  owner: OwnerId;
  value: number;
  stage: StageId;
  createdAt: string;
  closeDate: string;
  lastContact: string;
  size: SizeId;
  budgetConfirmed: boolean;
  decisionMaker: boolean;
  interactions30d: number;
  lostReason?: LostReason;
  /** Textos de los datos de ejemplo: se traducen con demoCrm.data.deals.<id>.* */
  i18n?: boolean;
  /** Textos escritos por quien usa la demo (negocios nuevos o editados). */
  role?: string;
  title?: string;
  nextAction?: string;
}

export type EventType =
  | 'created'
  | 'meeting'
  | 'proposal'
  | 'whatsapp'
  | 'email'
  | 'call'
  | 'note'
  | 'won'
  | 'lost'
  | 'stage'
  | 'sequence';

export interface ActivityEvent {
  id: string;
  dealId: string;
  date: string;
  type: EventType;
  /** Clave de demoCrm.events.* (eventos generados por la demo). */
  key?: string;
  params?: Record<string, string | number>;
  /** Texto libre escrito por quien usa la demo. */
  text?: string;
  /** Orden dentro del mismo día (mayor = más reciente). */
  order: number;
}

export type EnrollmentStatus = 'active' | 'paused' | 'replied' | 'finished';
export interface Enrollment {
  dealId: string;
  start: string;
  stepsDone: number;
  status: EnrollmentStatus;
}

export type SequenceChannel = ChannelId | 'task';
export const SEQUENCE_STEPS: { id: string; day: number; channel: SequenceChannel }[] = [
  { id: 's1', day: 0, channel: 'whatsapp' },
  { id: 's2', day: 2, channel: 'email' },
  { id: 's3', day: 5, channel: 'call' },
  { id: 's4', day: 8, channel: 'whatsapp' },
  { id: 's5', day: 12, channel: 'task' },
];

// ---------------------------------------------------------------------------
// Fechas (sin zona horaria: todo en días UTC)
// ---------------------------------------------------------------------------

export function dayNumber(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

export function addDays(iso: string, days: number): string {
  return new Date((dayNumber(iso) + days) * 86400000).toISOString().slice(0, 10);
}

export const daysBetween = (from: string, to: string) => dayNumber(to) - dayNumber(from);
export const daysSince = (iso: string) => daysBetween(iso, REF_DATE);

export function formatDate(iso: string, months: string[], locale: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const month = months[m - 1] ?? String(m);
  return locale === 'en' ? `${month} ${d}, ${y}` : `${d} ${month} ${y}`;
}

// ---------------------------------------------------------------------------
// Dinero (COP) con formato propio, idéntico en servidor y navegador
// ---------------------------------------------------------------------------

function group(intStr: string, sep: string): string {
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

export function formatCOP(value: number, locale: string): string {
  const n = Math.round(value);
  return locale === 'en' ? `COP ${group(String(n), ',')}` : `$ ${group(String(n), '.')}`;
}

/** Valor abreviado en millones: "$186 M" / "COP 186M". */
export function formatCOPShort(value: number, locale: string): string {
  const millions = value / 1_000_000;
  let txt: string;
  if (Math.abs(millions) >= 10 || Number.isInteger(millions)) {
    txt = group(String(Math.round(millions)), locale === 'en' ? ',' : '.');
  } else {
    txt = (Math.round(millions * 10) / 10).toFixed(1);
    if (locale !== 'en') txt = txt.replace('.', ',');
  }
  return locale === 'en' ? `COP ${txt}M` : `$${txt} M`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

// ---------------------------------------------------------------------------
// Puntaje del lead (reglas de ejemplo, explicables)
// ---------------------------------------------------------------------------

export type FactorId = 'fit' | 'engagement' | 'recency' | 'budget' | 'decision';
export interface ScoreFactor {
  id: FactorId;
  points: number;
  max: number;
}

export function scoreFactors(d: Deal): ScoreFactor[] {
  const fit = d.size === 'large' ? 25 : d.size === 'medium' ? 18 : 10;
  const engagement = Math.min(25, Math.max(0, d.interactions30d) * 5);
  const ds = daysSince(d.lastContact);
  const recency = ds <= 3 ? 20 : ds <= 7 ? 15 : ds <= 14 ? 8 : ds <= 30 ? 3 : 0;
  return [
    { id: 'fit', points: fit, max: 25 },
    { id: 'engagement', points: engagement, max: 25 },
    { id: 'recency', points: recency, max: 20 },
    { id: 'budget', points: d.budgetConfirmed ? 15 : 0, max: 15 },
    { id: 'decision', points: d.decisionMaker ? 15 : 0, max: 15 },
  ];
}

export const scoreOf = (d: Deal) => scoreFactors(d).reduce((s, f) => s + f.points, 0);

export const temperatureOf = (score: number): Temperature =>
  score >= 75 ? 'hot' : score >= 50 ? 'warm' : 'cold';

const STAGE_BASE: Record<StageId, number> = {
  prospect: 10,
  qualified: 25,
  proposal: 45,
  negotiation: 65,
  won: 100,
  lost: 0,
};

/** Probabilidad = base de la etapa ajustada por el puntaje (entre 5 % y 95 % si está abierto). */
export function probabilityOf(d: Deal): number {
  if (d.stage === 'won') return 100;
  if (d.stage === 'lost') return 0;
  const adj = Math.max(-10, Math.min(12, Math.round((scoreOf(d) - 60) / 4)));
  return Math.max(5, Math.min(95, STAGE_BASE[d.stage] + adj));
}

export const isOpen = (d: Deal) => d.stage !== 'won' && d.stage !== 'lost';
export const weightedValue = (d: Deal) => (isOpen(d) ? (d.value * probabilityOf(d)) / 100 : 0);
export const stageIndex = (s: StageId) => ALL_STAGES.indexOf(s);

// ---------------------------------------------------------------------------
// Métricas del encabezado
// ---------------------------------------------------------------------------

export function computeMetrics(deals: Deal[]) {
  const open = deals.filter(isOpen);
  const from = addDays(REF_DATE, -90);
  const inWindow = (d: Deal) => d.closeDate >= from && d.closeDate <= REF_DATE;
  const won = deals.filter((d) => d.stage === 'won' && inWindow(d));
  const lost = deals.filter((d) => d.stage === 'lost' && inWindow(d));
  const closed = won.length + lost.length;
  const cycle = won.length
    ? Math.round(won.reduce((s, d) => s + daysBetween(d.createdAt, d.closeDate), 0) / won.length)
    : null;
  return {
    openCount: open.length,
    openValue: open.reduce((s, d) => s + d.value, 0),
    weighted: open.reduce((s, d) => s + weightedValue(d), 0),
    won: won.length,
    closed,
    winRate: closed ? Math.round((won.length / closed) * 100) : null,
    cycle,
  };
}

// ---------------------------------------------------------------------------
// Pronóstico
// ---------------------------------------------------------------------------

export type PeriodId = 'month' | 'quarter';
export const PERIODS: Record<PeriodId, { start: string; end: string; quota: number }> = {
  month: { start: '2026-10-01', end: '2026-10-31', quota: 350_000_000 },
  quarter: { start: '2026-10-01', end: '2026-12-31', quota: 1_050_000_000 },
};

/** Abiertos con cierre en el periodo; los vencidos se cuentan en el periodo actual. */
const openInPeriod = (d: Deal, end: string) => isOpen(d) && d.closeDate <= end;
const wonInPeriod = (d: Deal, start: string, end: string) =>
  d.stage === 'won' && d.closeDate >= start && d.closeDate <= end;

export function forecastFor(deals: Deal[], period: PeriodId) {
  const { start, end, quota } = PERIODS[period];
  const sumBy = (list: Deal[], fn: (d: Deal) => number) => list.reduce((s, d) => s + fn(d), 0);
  const calc = (list: Deal[]) => {
    const won = sumBy(list.filter((d) => wonInPeriod(d, start, end)), (d) => d.value);
    const open = list.filter((d) => openInPeriod(d, end));
    const negotiation = sumBy(open.filter((d) => d.stage === 'negotiation'), (d) => d.value);
    const late = sumBy(open.filter((d) => d.stage === 'proposal' || d.stage === 'negotiation'), (d) => d.value);
    const weighted = sumBy(open, weightedValue);
    return {
      won,
      commit: won + negotiation,
      projection: won + weighted,
      best: won + late,
      weighted,
      openCount: open.length,
    };
  };
  const total = calc(deals);
  const byOwner = OWNER_IDS.map((id) => ({ id, ...calc(deals.filter((d) => d.owner === id)) }));
  return {
    quota,
    ...total,
    attainment: quota ? Math.round((total.projection / quota) * 100) : 0,
    byOwner,
  };
}

export function stageDistribution(deals: Deal[]) {
  const open = deals.filter(isOpen);
  const totalValue = open.reduce((s, d) => s + d.value, 0);
  return OPEN_STAGES.map((stage) => {
    const list = open.filter((d) => d.stage === stage);
    const value = list.reduce((s, d) => s + d.value, 0);
    return { stage, count: list.length, value, share: totalValue ? (value / totalValue) * 100 : 0 };
  });
}

export const TREND_MONTHS = ['2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'];

/** Ganado por mes (real del dataset) y ponderado abierto por mes de cierre (vencidos → mes de corte). */
export function monthlyTrend(deals: Deal[]) {
  const refMonth = REF_DATE.slice(0, 7);
  return TREND_MONTHS.map((month) => {
    const won = deals
      .filter((d) => d.stage === 'won' && d.closeDate.slice(0, 7) === month)
      .reduce((s, d) => s + d.value, 0);
    const weighted =
      month < refMonth
        ? 0
        : deals
            .filter((d) => isOpen(d))
            .filter((d) => {
              const m = d.closeDate.slice(0, 7) < refMonth ? refMonth : d.closeDate.slice(0, 7);
              return m === month;
            })
            .reduce((s, d) => s + weightedValue(d), 0);
    return { month, won, weighted };
  });
}

export type Alert =
  | { kind: 'stale'; deal: Deal; days: number }
  | { kind: 'overdue'; deal: Deal; days: number }
  | { kind: 'gap'; value: number }
  | { kind: 'over'; value: number };

export function forecastAlerts(deals: Deal[], period: PeriodId): Alert[] {
  const alerts: Alert[] = [];
  const late = deals
    .filter((d) => d.stage === 'proposal' || d.stage === 'negotiation')
    .filter((d) => daysSince(d.lastContact) >= 7)
    .sort((a, b) => b.value - a.value);
  for (const d of late) alerts.push({ kind: 'stale', deal: d, days: daysSince(d.lastContact) });
  for (const d of deals.filter((x) => isOpen(x) && x.closeDate < REF_DATE)) {
    alerts.push({ kind: 'overdue', deal: d, days: daysSince(d.closeDate) });
  }
  const f = forecastFor(deals, period);
  if (f.projection < f.quota) alerts.push({ kind: 'gap', value: f.quota - f.projection });
  else alerts.push({ kind: 'over', value: f.projection - f.quota });
  return alerts;
}

// ---------------------------------------------------------------------------
// Recomendaciones (reglas)
// ---------------------------------------------------------------------------

export type Recommendation =
  | { id: 'won' }
  | { id: 'lost'; reason: LostReason }
  | { id: 'overdue'; days: number }
  | { id: 'stale'; days: number }
  | { id: 'hot' }
  | { id: 'budget' }
  | { id: 'decision' }
  | { id: 'stageNext'; stage: StageId }
  | { id: 'channel'; channel: ChannelId };

export function recommendationsFor(d: Deal): Recommendation[] {
  if (d.stage === 'won') return [{ id: 'won' }];
  if (d.stage === 'lost') return [{ id: 'lost', reason: d.lostReason ?? 'noResponse' }];
  const recs: Recommendation[] = [];
  if (d.closeDate < REF_DATE) recs.push({ id: 'overdue', days: daysSince(d.closeDate) });
  const ds = daysSince(d.lastContact);
  if (ds >= 7) recs.push({ id: 'stale', days: ds });
  if (temperatureOf(scoreOf(d)) === 'hot' && ds < 7) recs.push({ id: 'hot' });
  if (!d.budgetConfirmed) recs.push({ id: 'budget' });
  if (!d.decisionMaker) recs.push({ id: 'decision' });
  recs.push({ id: 'stageNext', stage: d.stage });
  recs.push({ id: 'channel', channel: d.channel });
  return recs;
}

// ---------------------------------------------------------------------------
// Historial
// ---------------------------------------------------------------------------

/**
 * Eventos derivados de los datos de ejemplo ORIGINALES del negocio (no se
 * guardan). Se calculan sobre la semilla y no sobre el estado actual, para que
 * mover un negocio no invente reuniones o propuestas en fechas pasadas.
 */
function seedTimeline(d: Deal): ActivityEvent[] {
  const ev: ActivityEvent[] = [];
  const add = (date: string, type: EventType, key: string, params?: ActivityEvent['params']) =>
    ev.push({ id: `${d.id}-${key}-${date}`, dealId: d.id, date, type, key, params, order: ev.length });
  add(d.createdAt, 'created', 'created', { source: d.source });
  const idx = stageIndex(d.stage);
  const clamp = (iso: string) => (iso > d.lastContact ? d.lastContact : iso);
  let last = d.createdAt;
  if (idx >= stageIndex('qualified')) {
    const date = clamp(addDays(d.createdAt, 6));
    if (date > last) {
      add(date, 'meeting', 'meeting');
      last = date;
    }
  }
  if (idx >= stageIndex('proposal')) {
    const date = clamp(addDays(d.createdAt, 13));
    if (date > last) {
      add(date, 'proposal', 'proposal', { channel: d.channel });
      last = date;
    }
  }
  const enrollment = SEED_ENROLLMENTS.find((e) => e.dealId === d.id);
  if (enrollment) {
    SEQUENCE_STEPS.slice(0, enrollment.stepsDone).forEach((step) => {
      add(addDays(enrollment.start, step.day), 'sequence', 'sequenceSeed', { step: step.id });
    });
  }
  const calls = CALLS.filter((c) => c.dealId === d.id);
  calls.forEach((c) => add(c.date, 'call', 'callLogged', { duration: c.duration }));
  if (d.stage === 'won' || d.stage === 'lost') {
    if (d.stage === 'won') add(d.closeDate, 'won', 'won');
    else add(d.closeDate, 'lost', 'lost', { reason: d.lostReason ?? 'noResponse' });
    if (d.lastContact > d.closeDate) add(d.lastContact, d.channel, 'postSale', { channel: d.channel });
  } else if (d.lastContact > last && !ev.some((e) => e.date === d.lastContact)) {
    add(d.lastContact, d.channel, 'followUp', { channel: d.channel });
  }
  return ev;
}

export function timelineFor(d: Deal, events: ActivityEvent[]): ActivityEvent[] {
  const seed = SEED_DEALS.find((s) => s.id === d.id);
  const base: ActivityEvent[] = seed
    ? seedTimeline(seed)
    : [{ id: `${d.id}-created`, dealId: d.id, date: d.createdAt, type: 'created', key: 'createdManual', order: 0 }];
  const userEvents = events.filter((e) => e.dealId === d.id).map((e) => ({ ...e, order: e.order + 1000 }));
  return [...base, ...userEvents].sort((a, b) =>
    a.date === b.date ? b.order - a.order : a.date < b.date ? 1 : -1,
  );
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

export function toCsv(rows: (string | number)[][], sep: string): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /["\n\r;,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + rows.map((r) => r.map(esc).join(sep)).join('\r\n');
}

export function downloadFile(name: string, content: BlobPart, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const NIT_RE = /^\d{3}\.?\d{3}\.?\d{3}-?\d$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
