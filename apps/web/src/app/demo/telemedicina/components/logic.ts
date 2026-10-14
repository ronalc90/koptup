/**
 * Lógica pura de la demo de telemedicina (sin React ni DOM): formato, reloj y jornada de la
 * demo, agenda con festivos de Colombia, orientación de síntomas por reglas, valores por
 * pagador, alertas de alergia, indicadores, CSV y RIPS simplificado. Las funciones reciben la
 * fecha y la hora como parámetros para que el primer render sea igual en servidor y navegador.
 */
import { BASE_DATE, DEMO_CLOCK, IPS, PATIENT_SHARE, PAYERS, SATURDAY_SLOTS, SPECIALTIES, WEEKDAY_SLOTS } from './mockData';
import type { AllergyClass, Attention, Locale, Patient, Payer, PayerKind, Priority, SpecKey, Specialty, TriageResult, Txt } from './types';

export function tx(v: Txt | null | undefined, locale: Locale): string {
  if (v == null) return '';
  return typeof v === 'string' ? v : v[locale];
}

export function payerOf(id: string): Payer {
  return PAYERS.find((p) => p.id === id) ?? PAYERS[PAYERS.length - 1];
}

export function specOf(key: SpecKey): Specialty {
  return SPECIALTIES.find((s) => s.key === key) ?? SPECIALTIES[0];
}

/** Valor del servicio y reparto entre paciente y pagador. Siempre cuadra: valor = paciente + pagador. */
export function priceFor(spec: SpecKey, kind: PayerKind) {
  const value = specOf(spec).tariff[kind];
  const patient = kind === 'private' ? value : Math.min(PATIENT_SHARE[kind], value);
  return { value, patient, payer: value - patient };
}

function group(n: number, sep: string) {
  return Math.round(Math.abs(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

/** $ 65.000 (es) · COP 65,000 (en). Sin Intl para que servidor y navegador den lo mismo. */
export function fmtCOP(n: number, locale: Locale) {
  const sign = n < 0 ? '-' : '';
  return locale === 'es' ? `${sign}$ ${group(n, '.')}` : `${sign}COP ${group(n, ',')}`;
}

export function fmtDec(n: number, locale: Locale, decimals = 1) {
  const s = n.toFixed(decimals);
  return locale === 'es' ? s.replace('.', ',') : s;
}

// ───────────────────────── Fechas (ISO yyyy-mm-dd, siempre en UTC) ─────────────────────────

function toUtc(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(iso: string, n: number) {
  return new Date(toUtc(iso) + n * 86400000).toISOString().slice(0, 10);
}

/** 0 = domingo … 6 = sábado. */
export function weekdayOf(iso: string) {
  return new Date(toUtc(iso)).getUTCDay();
}

/** Días entre dos fechas ISO (b - a). */
export function daysBetween(a: string, b: string) {
  return Math.round((toUtc(b) - toUtc(a)) / 86400000);
}

/** Fecha de hoy en Colombia (yyyy-mm-dd). Solo se llama en el navegador, después de montar. */
export function todayInBogota(now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Domingo de Pascua (algoritmo gregoriano anónimo). */
function easter(year: number) {
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
  return `${year}-${pad(month, 2)}-${pad(day, 2)}`;
}

/** Corre la fecha al lunes siguiente si no cae en lunes (Ley 51 de 1983). */
function nextMonday(iso: string) {
  const wd = weekdayOf(iso);
  return wd === 1 ? iso : addDays(iso, (8 - wd) % 7);
}

const holidayCache = new Map<number, Set<string>>();

/** Festivos de Colombia de un año: fijos, trasladables al lunes y los que dependen de la Pascua. */
export function holidaysCO(year: number): Set<string> {
  const cached = holidayCache.get(year);
  if (cached) return cached;
  const d = (m: number, day: number) => `${year}-${pad(m, 2)}-${pad(day, 2)}`;
  const e = easter(year);
  const out = new Set<string>([
    d(1, 1),
    d(5, 1),
    d(7, 20),
    d(8, 7),
    d(12, 8),
    d(12, 25),
    nextMonday(d(1, 6)),
    nextMonday(d(3, 19)),
    nextMonday(d(6, 29)),
    nextMonday(d(8, 15)),
    nextMonday(d(10, 12)),
    nextMonday(d(11, 1)),
    nextMonday(d(11, 11)),
    addDays(e, -3),
    addDays(e, -2),
    addDays(e, 43),
    addDays(e, 64),
    addDays(e, 71),
  ]);
  holidayCache.set(year, out);
  return out;
}

export interface DateNames {
  /** 12 abreviaturas de mes. */
  months: string[];
  /** 7 abreviaturas de día, empezando en domingo. */
  weekdays: string[];
}

export function fmtDate(iso: string, locale: Locale, names: DateNames, opts: { weekday?: boolean; year?: boolean } = {}) {
  const [y, m, d] = iso.split('-').map(Number);
  const wd = opts.weekday ? names.weekdays[weekdayOf(iso)] : '';
  if (locale === 'es') {
    return `${wd ? `${wd} ` : ''}${d} ${names.months[m - 1]}${opts.year ? ` ${y}` : ''}`;
  }
  return `${wd ? `${wd}, ` : ''}${names.months[m - 1]} ${d}${opts.year ? `, ${y}` : ''}`;
}

export type DayStatus = 'open' | 'saturday' | 'sunday' | 'holiday';

export interface AgendaDay {
  iso: string;
  status: DayStatus;
}

export function dayStatus(iso: string): DayStatus {
  if (holidaysCO(Number(iso.slice(0, 4))).has(iso)) return 'holiday';
  const wd = weekdayOf(iso);
  if (wd === 0) return 'sunday';
  if (wd === 6) return 'saturday';
  return 'open';
}

export function agendaDays(start: string, n = 7): AgendaDay[] {
  return Array.from({ length: n }, (_, i) => {
    const iso = addDays(start, i);
    return { iso, status: dayStatus(iso) };
  });
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export interface Slot {
  time: string;
  /** Ocupado por otra cita de la agenda de ejemplo. */
  taken: boolean;
}

/**
 * Horarios del día: L-V jornada completa, sábado solo mañana, domingos y festivos cerrados;
 * hoy solo después de la hora del reloj de la demo. Los ocupados salen de un hash fijo
 * (los mismos para la misma especialidad, día y hora).
 */
export function slotsFor(spec: SpecKey, iso: string, today: string, now: string): Slot[] {
  const st = dayStatus(iso);
  if (st === 'sunday' || st === 'holiday') return [];
  const base = st === 'saturday' ? SATURDAY_SLOTS : WEEKDAY_SLOTS;
  return base.filter((time) => iso !== today || time > now).map((time) => ({ time, taken: hash(`${spec}|${iso}|${time}`) % 10 < 3 }));
}

// ───────────────────────── Orientación de síntomas (reglas fijas de ejemplo) ─────────────────────────

export function normalize(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

interface Rule {
  id: string;
  re: RegExp;
  urgency: Priority;
  alarm?: boolean;
  specs: SpecKey[];
}

/** Se evalúan en orden: la primera que coincide gana. Los signos de alarma van primero. */
export const TRIAGE_RULES: Rule[] = [
  {
    id: 'chest',
    re: /(dolor (en el |de )?pecho|dolor toracico|opresion en el pecho|chest pain|pain in (my |the )?chest|chest tightness|falta de aire|dificultad para respirar|me ahogo|shortness of breath|can'?t breathe|trouble breathing)/,
    urgency: 'red',
    alarm: true,
    specs: [],
  },
  {
    id: 'neuro',
    re: /(desmay|perdida de (la )?conciencia|convulsi|parali|cara caida|no puedo hablar|habla arrastrada|faint|seizure|paralys|face droop|slurred)/,
    urgency: 'red',
    alarm: true,
    specs: [],
  },
  {
    id: 'bleeding',
    re: /(sangrado abundante|vomito con sangre|heavy bleeding|vomiting blood)/,
    urgency: 'red',
    alarm: true,
    specs: [],
  },
  {
    id: 'selfharm',
    re: /(suicid|hacerme dano|quitarme la vida|self.?harm|kill myself|hurt myself)/,
    urgency: 'red',
    alarm: true,
    specs: [],
  },
  { id: 'resp', re: /(fiebre|\btos\b|garganta|gripa|congestion|fever|cough|sore throat|\bflu\b|\bcold\b)/, urgency: 'yellow', specs: ['general', 'internal'] },
  { id: 'head', re: /(dolor de cabeza|cefalea|migra|headache)/, urgency: 'yellow', specs: ['general', 'internal'] },
  { id: 'ear', re: /(oido|otalgia|\bears?\b|earache)/, urgency: 'green', specs: ['general', 'pedia'] },
  { id: 'skin', re: /(piel|erupcion|brote|picazon|rasquina|ronchas|skin|rash|itch|hives)/, urgency: 'green', specs: ['derma'] },
  { id: 'mental', re: /(ansiedad|estres|triste|insomnio|no puedo dormir|anxiety|stress|\bsad\b|insomnia|can'?t sleep)/, urgency: 'green', specs: ['psych'] },
  {
    id: 'chronic',
    re: /(diabetes|glucosa|azucar|presion alta|hipertension|blood sugar|glucose|high blood pressure|hypertension)/,
    urgency: 'green',
    specs: ['internal', 'general'],
  },
];

export function classifySymptoms(text: string): TriageResult {
  const n = normalize(text);
  for (const r of TRIAGE_RULES) {
    if (r.re.test(n)) return { urgency: r.urgency, alarm: !!r.alarm, specs: r.specs, rule: r.id };
  }
  return { urgency: 'green', alarm: false, specs: ['general'], rule: 'default' };
}

// ───────────────────────── Sala de espera e indicadores ─────────────────────────

const PRIORITY_ORDER: Record<Priority, number> = { red: 0, yellow: 1, green: 2 };

/** HH:MM → minutos desde la medianoche. */
export function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

/** Minutos que lleva en la sala de espera según el reloj de la demo. */
export function waitMinutes(p: Pick<Patient, 'arrivedAt'>, now: string) {
  return Math.max(0, toMinutes(now) - toMinutes(p.arrivedAt));
}

/** Prioridad primero; a igual prioridad, quien llegó antes. */
export function sortQueue(list: Patient[]) {
  return [...list].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || toMinutes(a.arrivedAt) - toMinutes(b.arrivedAt));
}

/**
 * Turno aproximado de quien acaba de entrar a la sala: cuenta a los que esperan con igual o
 * mayor prioridad, sin los signos de alarma (no se atienden por teleconsulta, se derivan).
 */
export function queuePosition(waiting: Patient[], priority: Priority, excludeId?: string) {
  if (priority === 'red') return 0;
  return waiting.filter((p) => p.id !== excludeId && p.priority !== 'red' && PRIORITY_ORDER[p.priority] <= PRIORITY_ORDER[priority]).length + 1;
}

export function computeKpis(patients: Patient[], attentions: Attention[], day: string, now: string) {
  const waiting = patients.filter((p) => p.status === 'waiting');
  const avgWait = waiting.length ? Math.round(waiting.reduce((s, p) => s + waitMinutes(p, now), 0) / waiting.length) : 0;
  const done = attentions.filter((a) => a.kind === 'consult' && a.date === day).length;
  const pending = attentions.filter((a) => a.payStatus === 'pending').reduce((s, a) => s + a.patientShare, 0);
  return { waiting: waiting.length, avgWait, done, pending };
}

/**
 * Servicio que atiende a un paciente que llega sin cita: el primero que sugiere la orientación
 * de síntomas; los menores de 14 años van a pediatría cuando la sugerencia es medicina general.
 */
export function assignSpec(triage: Pick<TriageResult, 'specs'>, age: number): SpecKey {
  const first = triage.specs[0] ?? 'general';
  if (age < 14 && (first === 'general' || triage.specs.includes('pedia'))) return 'pedia';
  return first;
}

export function billingTotals(attentions: Attention[]) {
  const consults = attentions.filter((a) => a.kind === 'consult');
  return {
    collected: consults.filter((a) => a.payStatus === 'paid').reduce((s, a) => s + a.patientShare, 0),
    pending: consults.filter((a) => a.payStatus === 'pending').reduce((s, a) => s + a.patientShare, 0),
    payers: consults.reduce((s, a) => s + a.payerShare, 0),
    total: consults.reduce((s, a) => s + a.value, 0),
  };
}

// ───────────────────────── Seguridad del paciente ─────────────────────────

/** Clase de alergia de un medicamento según su nombre (para medicamentos escritos a mano también). */
export function medAllergyClass(name: string): AllergyClass | undefined {
  const n = normalize(name);
  if (/(amoxi|penicil|ampicil|oxacil|dicloxa|cefalex|amoxicillin|penicillin)/.test(n)) return 'penicillin';
  if (/(ibuprof|naprox|diclofen|aspirin|acetilsalic|\basa\b|ketorolac|meloxicam)/.test(n)) return 'nsaid';
  if (/(sulfa|sulfametox|sulfamethox)/.test(n)) return 'sulfa';
  return undefined;
}

export function allergyConflicts(patient: Pick<Patient, 'allergies'>, meds: { name: string }[]): AllergyClass[] {
  const own = new Set(patient.allergies.map((a) => a.cls).filter(Boolean) as AllergyClass[]);
  const out = new Set<AllergyClass>();
  meds.forEach((m) => {
    const c = medAllergyClass(m.name);
    if (c && own.has(c)) out.add(c);
  });
  return [...out];
}

/**
 * Hora del reloj de la demo: arranca a las 09:30 cuando se abre la jornada (`start`, en ms) y
 * avanza en tiempo real; no pasa de las 23:59:59. Sin `start` (antes de montar) marca las 09:30.
 */
export function clockAt(start: number, nowMs: number, withSeconds = false) {
  const elapsed = start > 0 ? Math.max(0, Math.floor((nowMs - start) / 1000)) : 0;
  const total = Math.min(toMinutes(DEMO_CLOCK) * 60 + elapsed, 24 * 3600 - 1);
  const hh = Math.floor(total / 3600);
  const mm = Math.floor((total % 3600) / 60);
  const ss = total % 60;
  return withSeconds ? `${pad(hh, 2)}:${pad(mm, 2)}:${pad(ss, 2)}` : `${pad(hh, 2)}:${pad(mm, 2)}`;
}

/** Corre las fechas de los datos de ejemplo para que la jornada base quede en `day`. */
export function shiftIso(iso: string, day: string) {
  return addDays(iso, daysBetween(BASE_DATE, day));
}

export function fmtTimer(s: number) {
  return `${Math.floor(s / 60)
    .toString()
    .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();
}

export function avatarColor(seed: string) {
  const palette = [
    'from-sky-500 to-indigo-600',
    'from-rose-500 to-pink-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-violet-500 to-purple-600',
  ];
  return palette[hash(seed) % palette.length];
}

// ───────────────────────── Exportaciones ─────────────────────────

export function toCsv(rows: (string | number)[][]) {
  return rows
    .map((r) =>
      r
        .map((c) => {
          const s = String(c ?? '');
          return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(','),
    )
    .join('\n');
}

/**
 * RIPS simplificado y SIMULADO de una atención (inspirado en la estructura JSON vigente).
 * En un proyecto real lo genera el módulo de facturación con la estructura oficial y se
 * valida con el proveedor de facturación electrónica en salud.
 */
export function ripsFor(a: Attention) {
  const kind = payerOf(a.payerId).kind;
  return {
    _nota: 'RIPS simplificado y simulado para la demo: no es un documento válido.',
    numDocumentoIdObligado: IPS.nit.replace(/\D/g, '').slice(0, 9),
    numFactura: a.invoice,
    usuarios: [
      {
        tipoDocumentoIdentificacion: a.docType,
        numDocumentoIdentificacion: a.doc.replace(/\D/g, ''),
        tipoUsuario: kind === 'eps' ? '01' : kind === 'prepaid' ? '05' : '04',
        consecutivo: 1,
        servicios: {
          consultas: [
            {
              codPrestador: IPS.code,
              fechaInicioAtencion: `${a.date} ${a.time}`,
              codConsulta: specOf(a.spec).cups,
              modalidadGrupoServicioTecSal: '06',
              codDiagnosticoPrincipal: a.dx ? a.dx.code.replace('.', '') : null,
              vrServicio: a.value,
              valorPagoModerador: kind === 'private' ? 0 : a.patientShare,
              consecutivo: 1,
            },
          ],
        },
      },
    ],
  };
}

/** Nombre de archivo seguro (sin tildes ni espacios). */
export function fileSlug(text: string) {
  return normalize(text)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function pad(n: number, len: number) {
  return n.toString().padStart(len, '0');
}
