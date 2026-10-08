/**
 * Tipos de la demo de telemedicina. Todo el estado vive en el navegador:
 * no hay backend, video ni pagos reales (se rotulan como simulados).
 */

export type Locale = 'es' | 'en';
/** Texto bilingüe de los datos de ejemplo. */
export type L = { es: string; en: string };
/** Texto de datos: bilingüe (datos de ejemplo) o libre (lo que escribe el visitante). */
export type Txt = L | string;

export type Priority = 'red' | 'yellow' | 'green';
export type PayerKind = 'eps' | 'prepaid' | 'private';
export type MainTab = 'console' | 'patient' | 'triage' | 'scheduling' | 'lab' | 'billing';
export type ConsultTab = 'record' | 'labs' | 'rx' | 'notes';
export type SpecKey = 'general' | 'pedia' | 'derma' | 'internal' | 'psych';
export type PatientStatus = 'waiting' | 'inConsult' | 'done' | 'referred';
export type LabFlag = 'normal' | 'high' | 'low' | 'critical';
export type AllergyClass = 'penicillin' | 'nsaid' | 'sulfa';

export interface Payer {
  id: string;
  name: Txt;
  kind: PayerKind;
}

export interface Specialty {
  key: SpecKey;
  pro: string;
  /** Registro médico de ejemplo. */
  reg: string;
  /** Valor del servicio por tipo de pagador (COP, valores de ejemplo). */
  tariff: Record<PayerKind, number>;
  /** Código CUPS de la consulta (referencia para el RIPS simulado). */
  cups: string;
}

export interface LabRow {
  test: Txt;
  value: Txt;
  ref: Txt;
  flag: LabFlag;
  date: string;
}

export interface Preconsult {
  reason: Txt;
  onset: Txt;
  intensity: number;
  prev: Txt;
  temp: string;
  bp: string;
  consentTele: boolean;
  consentData: boolean;
  consentRec: boolean;
  /** Hora (HH:MM) en que el paciente envió el formulario. */
  at: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  sex?: 'F' | 'M';
  docType: 'CC' | 'TI' | 'CE';
  doc: string;
  blood?: string;
  payerId: string;
  reason: Txt;
  priority: Priority;
  waitMin: number;
  status: PatientStatus;
  allergies: { label: Txt; cls?: AllergyClass }[];
  history: Txt[];
  meds: { name: Txt; dose: string; freq: Txt }[];
  vitals: { hr?: number; bp?: string; spo2?: number; temp?: number; glucose?: number; source: 'preconsult' | 'homeDevices' };
  pastConsults: { date: string; spec: SpecKey; notes: Txt }[];
  preconsult: Preconsult | null;
  guardian?: Txt;
  /** Respuestas del paciente en el chat (guion de ejemplo). */
  script: Txt[];
  labs: LabRow[];
}

export interface ChatMessage {
  id: string;
  from: 'doctor' | 'patient';
  text: string;
  at: string;
}

export interface Cie10 {
  code: string;
  label: L;
}

export interface MedPreset {
  id: string;
  name: L;
  dose: L;
  freq: L;
  duration: L;
  instructions: L;
  cls?: AllergyClass;
}

export interface RxMed {
  id: string;
  name: string;
  dose: string;
  freq: string;
  duration: string;
  instructions: string;
  cls?: AllergyClass;
}

export interface LabOrder {
  id: string;
  label: L;
}

export interface Soap {
  s: string;
  o: string;
  a: string;
  p: string;
}

/** Línea de una receta firmada (texto libre o bilingüe en los datos de ejemplo). */
export interface RxLine {
  name: Txt;
  dose: Txt;
  freq: Txt;
  duration: Txt;
  instructions: Txt;
}

export interface Prescription {
  number: string;
  signedAt: string;
  meds: RxLine[];
}

export type PayStatus = 'paid' | 'pending' | 'na';
export type PayMethod = 'pse' | 'card' | 'wallet';

export interface Attention {
  id: string;
  kind: 'consult' | 'referral';
  patientName: string;
  docType: string;
  doc: string;
  payerId: string;
  spec: SpecKey;
  date: string;
  time: string;
  durationMin: number;
  dx: { code: string; label: Txt } | null;
  value: number;
  patientShare: number;
  payerShare: number;
  payStatus: PayStatus;
  payMethod?: PayMethod;
  payRef?: string;
  invoice: string | null;
  rips: boolean;
  rx: Prescription | null;
  orders: string[];
  soap: Soap | null;
}

export interface Appointment {
  id: string;
  spec: SpecKey;
  date: string;
  time: string;
  patient: string;
  phone: string;
  payerId: string;
  modality: 'video' | 'phone';
}

/** Entrada de auditoría: se guarda la clave del texto para mostrarla en el idioma activo. */
export interface AuditEntry {
  id: string;
  at: string;
  actor: 'system' | 'doctor' | 'patient' | 'billing';
  key: string;
  params?: Record<string, string | { t: string }>;
}

export interface TriageResult {
  urgency: Priority;
  alarm: boolean;
  specs: SpecKey[];
  rule: string;
}
