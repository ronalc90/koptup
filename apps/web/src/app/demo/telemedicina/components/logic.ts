/**
 * Lógica pura de la demo de telemedicina (sin React ni DOM): formato, agenda con festivos,
 * orientación de síntomas por reglas, valores por pagador, alertas de alergia, indicadores,
 * CSV y RIPS simplificado. Todo es determinista para evitar diferencias servidor/cliente.
 */
import { DEMO_CLOCK, DEMO_DATE, HOLIDAYS_CO_2026, IPS, PATIENT_SHARE, PAYERS, SATURDAY_SLOTS, SPECIALTIES, WEEKDAY_SLOTS } from './mockData';
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
  if (HOLIDAYS_CO_2026.has(iso)) return 'holiday';
  const wd = weekdayOf(iso);
  if (wd === 0) return 'sunday';
  if (wd === 6) return 'saturday';
  return 'open';
}

export function agendaDays(start = DEMO_DATE, n = 7): AgendaDay[] {
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

/** Horarios del día: L-V jornada completa, sábado solo mañana, domingos y festivos cerrados; hoy solo después de la hora actual. */
export function slotsFor(spec: SpecKey, iso: string): Slot[] {
  const st = dayStatus(iso);
  if (st === 'sunday' || st === 'holiday') return [];
  const base = st === 'saturday' ? SATURDAY_SLOTS : WEEKDAY_SLOTS;
  return base.filter((time) => iso !== DEMO_DATE || time > DEMO_CLOCK).map((time) => ({ time, taken: hash(`${spec}|${iso}|${time}`) % 10 < 3 }));
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

export function sortQueue(list: Patient[]) {
  return [...list].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || b.waitMin - a.waitMin);
}

export function computeKpis(patients: Patient[], attentions: Attention[]) {
  const waiting = patients.filter((p) => p.status === 'waiting');
  const avgWait = waiting.length ? Math.round(waiting.reduce((s, p) => s + p.waitMin, 0) / waiting.length) : 0;
  const done = attentions.filter((a) => a.kind === 'consult' && a.date === DEMO_DATE).length;
  const pending = attentions.filter((a) => a.payStatus === 'pending').reduce((s, a) => s + a.patientShare, 0);
  return { waiting: waiting.length, avgWait, done, pending };
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

/** Hora del reloj de la demo: arranca a las 09:30 de la jornada de ejemplo y avanza en tiempo real. */
let clockStart: number | null = null;
export function demoClock(withSeconds = false) {
  if (clockStart === null) clockStart = Date.now();
  const [h, m] = DEMO_CLOCK.split(':').map(Number);
  const total = h * 3600 + m * 60 + Math.floor((Date.now() - clockStart) / 1000);
  const hh = Math.floor(total / 3600) % 24;
  const mm = Math.floor((total % 3600) / 60);
  const ss = total % 60;
  const p = (x: number) => x.toString().padStart(2, '0');
  return withSeconds ? `${p(hh)}:${p(mm)}:${p(ss)}` : `${p(hh)}:${p(mm)}`;
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
