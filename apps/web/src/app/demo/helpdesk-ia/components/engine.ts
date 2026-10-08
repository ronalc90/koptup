/**
 * Lógica de la mesa de ayuda de ejemplo (funciones puras, sin React).
 *
 * - classify: clasificación por reglas de palabras clave (área, sentimiento,
 *   prioridad sugerida, idioma y confianza). No es un modelo de IA y la UI lo
 *   dice así.
 * - route: asignación por habilidad, idioma y carga de trabajo.
 * - macros, respuesta automática, SLA y PQRS en días hábiles con los festivos
 *   de Colombia (calculados para cualquier año con la Ley Emiliani).
 */
import {
  AGENTS,
  CATEGORY_SKILL,
  KB_ARTICLES,
  PQRS_TERM_DAYS,
  PRIORITIES,
  REF_DATE,
  SLA_FIRST_RESPONSE,
  SLA_RESOLUTION,
  type AgentId,
  type AutoLogEntry,
  type AutoResult,
  type Category,
  type KbArticle,
  type Lang,
  type Macro,
  type MacroAction,
  type MacroCondition,
  type Priority,
  type Sentiment,
  type Settings,
  type Survey,
  type Ticket,
} from './data';

// ---------------------------------------------------------------------------
// Texto
// ---------------------------------------------------------------------------

/** Minúsculas, sin tildes y solo letras, números y espacios. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .replace(/ñ/g, 'n')
    .trim();
}

const patternCache = new Map<string, RegExp>();

/** Palabra o frase completa; con '*' al final acepta cualquier terminación. */
function keywordRegex(keyword: string): RegExp {
  const cached = patternCache.get(keyword);
  if (cached) return cached;
  const prefix = keyword.endsWith('*');
  const body = normalize(prefix ? keyword.slice(0, -1) : keyword)
    .split(' ')
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join(' ');
  const re = new RegExp(`(?:^| )${body}${prefix ? '' : '(?= |$)'}`);
  patternCache.set(keyword, re);
  return re;
}

/** Palabras clave (de la lista) que aparecen en el texto ya normalizado. */
export function matchKeywords(normText: string, keywords: readonly string[]): string[] {
  return keywords.filter((kw) => keywordRegex(kw).test(normText));
}

// ---------------------------------------------------------------------------
// Clasificación por reglas
// ---------------------------------------------------------------------------

/** Palabras clave por área (español e inglés, sin tildes). */
export const CATEGORY_KEYWORDS: Record<Exclude<Category, 'general'>, string[]> = {
  billing: [
    'cobr*', 'cargo*', 'factura*', 'factura electronica', 'pago*', 'pague', 'pagar', 'pse', 'reembolso*',
    'extracto', 'plata', 'tarjeta*', 'charge*', 'invoice*', 'electronic invoice', 'refund*', 'payment*', 'paid',
    'billing', 'statement', 'money back',
  ],
  tech: [
    'internet', 'senal', 'conexion', 'wifi', 'router', 'modem', 'lento', 'lenta', 'intermitente', 'se cae',
    'caido', 'caida', 'falla*', 'velocidad', 'sin servicio', 'connection', 'slow', 'outage', 'signal', 'offline',
  ],
  orders: [
    'pedido*', 'envio*', 'entrega*', 'transportadora', 'guia', 'direccion', 'paquete', 'despacho', 'donde va',
    'donde esta', 'order*', 'shipping', 'shipment', 'ships', 'delivery', 'package', 'address', 'tracking', 'where is',
  ],
  account: [
    'contrasena*', 'clave', 'codigo*', 'verificacion', 'iniciar sesion', 'inicio de sesion', 'usuario',
    'bloquead*', 'password', 'log in', 'login', 'sign in', 'locked', 'account', 'code', 'verification',
  ],
  cancel: [
    'cancelar', 'cancelacion', 'de baja', 'retirarme', 'terminar el contrato', 'suscripcion', 'cancel', 'canceled',
    'cancelled', 'cancellation', 'unsubscribe', 'terminate', 'subscription',
  ],
};

/** Palabras que indican un mensaje de felicitación, sugerencia o trámite general. */
export const GENERAL_KEYWORDS = [
  'felicit*', 'agradec*', 'excelente servicio', 'certificado*', 'sugerencia*', 'thank', 'thank you', 'excellent service',
  'congrat*', 'certificate*', 'suggestion*',
];

export const NEGATIVE_KEYWORDS = [
  'cansad*', 'tercera vez', 'molest*', 'frustra*', 'inaceptable', 'pesim*', 'terrible', 'nadie', 'queja',
  'sic', 'superintendencia', 'demanda', 'abogado', 'harto', 'harta', 'indignad*', 'otra vez', 'no sirve',
  'mal servicio', 'estafa', 'unacceptable', 'angry', 'annoyed', 'worst', 'complaint', 'ridiculous', 'nobody',
  'fed up', 'third time', 'superintendency',
];

export const POSITIVE_KEYWORDS = ['gracias', 'excelente', 'felicit*', 'increible', 'amable', 'genial', 'agradec*', 'perfecto', 'thank*', 'great', 'excellent', 'awesome', 'amazing'];

/** Riesgo legal: la prioridad sugerida es Urgente. */
export const LEGAL_KEYWORDS = ['sic', 'superintendencia', 'superintendency', 'demanda', 'abogado', 'tutela', 'lawyer', 'lawsuit'];

/** Servicio caído: con sentimiento negativo la prioridad sugerida es Urgente. */
export const OUTAGE_KEYWORDS = ['no tengo internet', 'sin internet', 'sin servicio', 'no internet', 'outage'];

const EN_WORDS = ['the', 'my', 'is', 'i', 'im', 'you', 'your', 'to', 'and', 'it', 'please', 'can', 'but', 'have', 'hi', 'hello', 'thanks', 'with', 'for', 'this'];
const ES_WORDS = ['el', 'la', 'de', 'que', 'y', 'mi', 'es', 'por', 'para', 'con', 'no', 'me', 'los', 'las', 'un', 'una', 'hola', 'gracias', 'del', 'en'];

export interface Classification {
  category: Category;
  sentiment: Sentiment;
  priority: Priority;
  language: Lang;
  confidence: number;
  /** Palabras clave del área elegida que aparecen en el mensaje. */
  keywords: string[];
  negative: string[];
  positive: string[];
  /** Por qué se sugirió esa prioridad. */
  priorityReason: 'legal' | 'outage' | 'negative' | 'positive' | 'general' | 'default';
  article: KbArticle | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Artículo de la base de conocimiento que mejor coincide con el texto, dentro del área. */
export function bestArticle(normText: string, category: Category): KbArticle | null {
  let best: KbArticle | null = null;
  let bestScore = 0;
  for (const a of KB_ARTICLES) {
    if (a.category !== category) continue;
    const score = matchKeywords(normText, a.tags).length;
    if (score > bestScore) {
      best = a;
      bestScore = score;
    }
  }
  return best;
}

export function detectLanguage(normText: string): Lang {
  const words = normText.split(' ');
  let en = 0;
  let es = 0;
  for (const w of words) {
    if (EN_WORDS.includes(w)) en++;
    if (ES_WORDS.includes(w)) es++;
  }
  return en >= 3 && en > es ? 'en' : 'es';
}

/** Clasifica el texto del cliente con reglas de palabras clave. */
export function classify(text: string): Classification {
  const norm = normalize(text);
  const scores = (Object.keys(CATEGORY_KEYWORDS) as Exclude<Category, 'general'>[]).map((c) => ({
    category: c as Category,
    matched: matchKeywords(norm, CATEGORY_KEYWORDS[c as Exclude<Category, 'general'>]),
  }));
  scores.sort((a, b) => b.matched.length - a.matched.length);
  const top = scores[0];
  const general = matchKeywords(norm, GENERAL_KEYWORDS);

  let category: Category;
  let keywords: string[];
  let confidence: number;
  if (top.matched.length === 0 || general.length > top.matched.length) {
    category = 'general';
    keywords = general;
    confidence = general.length > 0 ? 0.5 + 0.1 * general.length : 0.4;
  } else {
    category = top.category;
    keywords = top.matched;
    const others = scores.slice(1).reduce((sum, s) => sum + s.matched.length, 0);
    confidence = 0.5 + 0.1 * top.matched.length - 0.1 * others;
  }
  confidence = round2(Math.min(0.97, Math.max(0.35, confidence)));

  const negative = matchKeywords(norm, NEGATIVE_KEYWORDS);
  const positive = matchKeywords(norm, POSITIVE_KEYWORDS);
  const sentiment: Sentiment =
    negative.length > 0 && negative.length >= positive.length
      ? 'negative'
      : positive.length > negative.length
        ? 'positive'
        : 'neutral';

  const legal = matchKeywords(norm, LEGAL_KEYWORDS).length > 0;
  const outage = matchKeywords(norm, OUTAGE_KEYWORDS).length > 0;
  let priority: Priority = 'medium';
  let priorityReason: Classification['priorityReason'] = 'default';
  if (legal) {
    priority = 'urgent';
    priorityReason = 'legal';
  } else if (outage && sentiment === 'negative') {
    priority = 'urgent';
    priorityReason = 'outage';
  } else if (sentiment === 'negative') {
    priority = 'high';
    priorityReason = 'negative';
  } else if (sentiment === 'positive') {
    priority = 'low';
    priorityReason = 'positive';
  } else if (category === 'general') {
    priority = 'low';
    priorityReason = 'general';
  }

  return {
    category,
    sentiment,
    priority,
    language: detectLanguage(norm),
    confidence,
    keywords,
    negative,
    positive,
    priorityReason,
    article: bestArticle(norm, category),
  };
}

// ---------------------------------------------------------------------------
// Enrutamiento por habilidad, idioma y carga
// ---------------------------------------------------------------------------

export interface RouteResult {
  agent: AgentId;
  /** Habilidades requeridas (área y, si aplica, inglés). */
  required: string[];
  candidates: { id: AgentId; load: number }[];
  /** Ningún agente tenía todas las habilidades: se usó la del área. */
  relaxed: boolean;
}

/** Tickets activos (abiertos o pendientes) asignados a cada agente. */
export function agentLoads(tickets: Ticket[], excludeId?: string): Record<AgentId, number> {
  const loads = Object.fromEntries(AGENTS.map((a) => [a.id, 0])) as Record<AgentId, number>;
  for (const tk of tickets) {
    if (tk.id === excludeId || tk.status === 'resolved' || !tk.assignee) continue;
    loads[tk.assignee] += 1;
  }
  return loads;
}

/**
 * Elige agente: el que tenga las habilidades del área (y inglés si el cliente
 * escribe en inglés y la mesa trabaja en español) con menos tickets activos.
 */
export function route(ticket: Pick<Ticket, 'id' | 'category' | 'language'>, tickets: Ticket[], baseLang: Lang = 'es'): RouteResult {
  const loads = agentLoads(tickets, ticket.id);
  const catSkill = CATEGORY_SKILL[ticket.category];
  const required: string[] = [];
  if (catSkill) required.push(catSkill);
  if (ticket.language === 'en' && baseLang !== 'en') required.push('english');

  let pool = AGENTS.filter((a) => required.every((s) => a.skills.includes(s as never)));
  let relaxed = false;
  if (pool.length === 0) {
    relaxed = true;
    pool = catSkill ? AGENTS.filter((a) => a.skills.includes(catSkill)) : AGENTS;
    if (pool.length === 0) pool = AGENTS;
  }
  const candidates = pool.map((a) => ({ id: a.id, load: loads[a.id] }));
  const chosen = [...candidates].sort((a, b) => a.load - b.load)[0];
  return { agent: chosen.id, required, candidates, relaxed };
}

// ---------------------------------------------------------------------------
// Macros
// ---------------------------------------------------------------------------

export function priorityRank(p: Priority): number {
  return PRIORITIES.indexOf(p);
}

export function conditionMatches(c: MacroCondition, ticket: Ticket, normText: string): boolean {
  switch (c.type) {
    case 'category':
      return ticket.category === c.value;
    case 'channel':
      return ticket.channel === c.value;
    case 'priorityAtLeast':
      return priorityRank(ticket.priority) >= priorityRank(c.value);
    case 'sentiment':
      return ticket.sentiment === c.value;
    case 'keyword':
      return keywordList(c.value).some((kw) => matchKeywords(normText, [kw]).length > 0);
  }
}

/** Palabras de una condición «contiene» (separadas por coma). */
export function keywordList(value: string): string[] {
  return value
    .split(',')
    .map((w) => w.trim())
    .filter((w) => normalize(w.replace(/\*$/, '')).length > 0);
}

export function macroMatches(m: Macro, ticket: Ticket, normText: string): boolean {
  return m.conditions.length > 0 && m.conditions.every((c) => conditionMatches(c, ticket, normText));
}

/** Aplica las acciones de una macro al ticket (sin mutar). `ack` agrega el acuse si no existe. */
export function applyActions(ticket: Ticket, actions: MacroAction[], at: number, ackId: string): Ticket {
  let next: Ticket = { ...ticket, tags: [...ticket.tags], messages: [...ticket.messages] };
  for (const a of actions) {
    if (a.type === 'assign') next = { ...next, assignee: a.value };
    if (a.type === 'priority') next = { ...next, priority: a.value };
    if (a.type === 'tag') {
      const tag = a.value.trim();
      if (tag && !next.tags.includes(tag)) next.tags.push(tag);
    }
    if (a.type === 'ack' && !next.messages.some((msg) => msg.kind === 'ack')) {
      next.messages.push({ id: ackId, from: 'bot', kind: 'ack', text: { k: 'data.ack' }, at });
    }
  }
  return next;
}

// ---------------------------------------------------------------------------
// Respuesta automática
// ---------------------------------------------------------------------------

export function autoReplyArticle(c: Classification): KbArticle | null {
  return c.article && c.article.autoReply ? c.article : null;
}

/**
 * Decide si el mensaje se responde solo: el tema debe tener artículo de
 * respuesta automática, el mensaje no puede ser negativo y debe estar en el
 * idioma de la base de conocimiento; además la confianza debe superar el umbral.
 */
export function autoReplyDecision(
  c: Classification,
  settings: Settings,
  kbLang: Lang,
): { result: AutoResult; eligible: boolean; article: KbArticle | null } {
  const article = c.sentiment === 'negative' || c.language !== kbLang ? null : autoReplyArticle(c);
  const eligible = article !== null;
  if (!settings.autoReplyOn) return { result: 'off', eligible, article };
  if (!eligible) return { result: 'notEligible', eligible, article: null };
  if (c.confidence < settings.threshold) return { result: 'belowThreshold', eligible, article };
  return { result: 'sent', eligible, article };
}

/** Cuántos mensajes elegibles del registro se habrían respondido solos con un umbral dado. */
export function wouldAutoReply(log: AutoLogEntry[], threshold: number): { would: number; eligible: number } {
  const eligible = log.filter((l) => l.eligible);
  return { would: eligible.filter((l) => l.confidence >= threshold).length, eligible: eligible.length };
}

// ---------------------------------------------------------------------------
// Tiempo, SLA y días hábiles
// ---------------------------------------------------------------------------

export const DAY_MIN = 1440;

export function dayOf(minute: number): number {
  return Math.floor(minute / DAY_MIN);
}

/** Fecha UTC (sin hora) del día `day` contado desde REF_DATE. */
export function dateOfDay(day: number): Date {
  return new Date(Date.UTC(REF_DATE.y, REF_DATE.m - 1, REF_DATE.d + day));
}

function utcKey(d: Date): string {
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

/** Domingo de Pascua (algoritmo anónimo gregoriano). */
export function easterSunday(year: number): Date {
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
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n));
}

/** Ley Emiliani: si no cae lunes, el festivo pasa al lunes siguiente. */
function nextMonday(d: Date): Date {
  const dow = d.getUTCDay();
  return dow === 1 ? d : addDays(d, (8 - dow) % 7);
}

const holidayCache = new Map<number, Set<string>>();

/** Festivos de Colombia del año (Ley 51 de 1983 y fechas religiosas). */
export function colombianHolidays(year: number): Date[] {
  const fixed = [
    [1, 1],
    [5, 1],
    [7, 20],
    [8, 7],
    [12, 8],
    [12, 25],
  ].map(([m, d]) => new Date(Date.UTC(year, m - 1, d)));
  const moved = [
    [1, 6],
    [3, 19],
    [6, 29],
    [8, 15],
    [10, 12],
    [11, 1],
    [11, 11],
  ].map(([m, d]) => nextMonday(new Date(Date.UTC(year, m - 1, d))));
  const easter = easterSunday(year);
  const easterBased = [
    addDays(easter, -3),
    addDays(easter, -2),
    nextMonday(addDays(easter, 39)),
    nextMonday(addDays(easter, 60)),
    nextMonday(addDays(easter, 68)),
  ];
  return [...fixed, ...moved, ...easterBased].sort((a, b) => a.getTime() - b.getTime());
}

export function isHoliday(d: Date): boolean {
  const year = d.getUTCFullYear();
  let set = holidayCache.get(year);
  if (!set) {
    set = new Set(colombianHolidays(year).map(utcKey));
    holidayCache.set(year, set);
  }
  return set.has(utcKey(d));
}

export function isBusinessDay(day: number): boolean {
  const d = dateOfDay(day);
  const dow = d.getUTCDay();
  return dow !== 0 && dow !== 6 && !isHoliday(d);
}

/** Día en que vence un término de `n` días hábiles contados desde el día siguiente a `startDay`. */
export function addBusinessDays(startDay: number, n: number): number {
  let day = startDay;
  let count = 0;
  while (count < n) {
    day += 1;
    if (isBusinessDay(day)) count += 1;
  }
  return day;
}

/** Días hábiles desde `fromDay` hasta `toDay` (negativo si `toDay` ya pasó). */
export function businessDaysBetween(fromDay: number, toDay: number): number {
  if (toDay === fromDay) return 0;
  const sign = toDay > fromDay ? 1 : -1;
  const [a, b] = sign > 0 ? [fromDay, toDay] : [toDay, fromDay];
  let count = 0;
  for (let d = a + 1; d <= b; d++) if (isBusinessDay(d)) count += 1;
  return sign * count;
}

export interface PqrsInfo {
  dueDay: number;
  /** Días hábiles que faltan (0 = vence hoy, negativo = vencida). */
  daysLeft: number;
  state: 'answered' | 'overdue' | 'dueSoon' | 'onTime';
}

export function pqrsInfo(ticket: Ticket, clock: number): PqrsInfo | null {
  if (!ticket.pqrs) return null;
  const dueDay = addBusinessDays(ticket.pqrs.filedDay, PQRS_TERM_DAYS);
  const daysLeft = businessDaysBetween(dayOf(clock), dueDay);
  const state = ticket.status === 'resolved' ? 'answered' : daysLeft < 0 ? 'overdue' : daysLeft <= 3 ? 'dueSoon' : 'onTime';
  return { dueDay, daysLeft, state };
}

export function firstResponseAt(ticket: Ticket): number | null {
  const m = ticket.messages.find((msg) => msg.from === 'agent' || (msg.from === 'bot' && msg.kind === 'autoReply'));
  return m ? m.at : null;
}

export type SlaInfo =
  | { kind: 'resolved' }
  | { kind: 'waiting' }
  | { kind: 'pqrs'; info: PqrsInfo }
  | { kind: 'first' | 'resolution'; due: number; remaining: number };

export function slaInfo(ticket: Ticket, clock: number): SlaInfo {
  if (ticket.status === 'resolved') return { kind: 'resolved' };
  const pq = pqrsInfo(ticket, clock);
  if (pq) return { kind: 'pqrs', info: pq };
  if (ticket.status === 'pending') return { kind: 'waiting' };
  const first = firstResponseAt(ticket);
  if (first === null) {
    const due = ticket.createdAt + SLA_FIRST_RESPONSE[ticket.priority];
    return { kind: 'first', due, remaining: due - clock };
  }
  const due = ticket.createdAt + SLA_RESOLUTION[ticket.priority];
  return { kind: 'resolution', due, remaining: due - clock };
}

/** Minutos que faltan para vencer (Infinity si no aplica SLA en minutos). */
export function slaRemaining(ticket: Ticket, clock: number): number {
  const s = slaInfo(ticket, clock);
  return s.kind === 'first' || s.kind === 'resolution' ? s.remaining : Number.POSITIVE_INFINITY;
}

export function bumpPriority(p: Priority): Priority {
  return PRIORITIES[Math.min(PRIORITIES.length - 1, priorityRank(p) + 1)];
}

// ---------------------------------------------------------------------------
// Métricas
// ---------------------------------------------------------------------------

export interface Metrics {
  active: number;
  unassigned: number;
  breached: number;
  atRisk: number;
  avgFirstResponse: number | null;
  responded: number;
  csat: number | null;
  nps: number | null;
  surveys: number;
  autoSent: number;
  autoTotal: number;
}

export function computeMetrics(tickets: Ticket[], surveys: Survey[], log: AutoLogEntry[], clock: number): Metrics {
  const active = tickets.filter((t) => t.status !== 'resolved');
  let breached = 0;
  let atRisk = 0;
  for (const t of active) {
    const r = slaRemaining(t, clock);
    if (r <= 0) breached += 1;
    else if (r <= 30) atRisk += 1;
  }
  const responseTimes = tickets
    .map((t) => {
      const f = firstResponseAt(t);
      return f === null ? null : f - t.createdAt;
    })
    .filter((v): v is number => v !== null);
  const csat = surveys.length ? surveys.reduce((s, x) => s + x.score, 0) / surveys.length : null;
  const promoters = surveys.filter((s) => s.nps >= 9).length;
  const detractors = surveys.filter((s) => s.nps <= 6).length;
  return {
    active: active.length,
    unassigned: active.filter((t) => !t.assignee && t.status === 'open').length,
    breached,
    atRisk,
    avgFirstResponse: responseTimes.length ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : null,
    responded: responseTimes.length,
    csat,
    nps: surveys.length ? Math.round(((promoters - detractors) / surveys.length) * 100) : null,
    surveys: surveys.length,
    autoSent: log.filter((l) => l.result === 'sent').length,
    autoTotal: log.length,
  };
}

export function csatByAgent(surveys: Survey[]): { agent: AgentId; avg: number; count: number }[] {
  return AGENTS.map((a) => {
    const mine = surveys.filter((s) => s.agent === a.id);
    return { agent: a.id, avg: mine.length ? mine.reduce((s, x) => s + x.score, 0) / mine.length : 0, count: mine.length };
  });
}

// ---------------------------------------------------------------------------
// Búsqueda, CSV y descarga
// ---------------------------------------------------------------------------

export function includesNorm(haystack: string, query: string): boolean {
  const q = normalize(query);
  return q.length === 0 || normalize(haystack).includes(q);
}

export function toCsv(rows: (string | number)[][], sep: string): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /["\n\r;,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + rows.map((r) => r.map(esc).join(sep)).join('\r\n');
}

export function downloadFile(name: string, content: string, type: string) {
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

/** Texto de los mensajes del cliente (para clasificar o redactar). */
export function customerText(ticket: Ticket, resolve: (txt: Ticket['messages'][number]['text']) => string): string {
  return ticket.messages
    .filter((m) => m.from === 'customer')
    .map((m) => resolve(m.text))
    .join('\n');
}

export function nextTicketNumber(tickets: Ticket[]): number {
  return tickets.reduce((max, t) => Math.max(max, Number(t.id.replace(/\D/g, '')) || 0), 1040) + 1;
}
