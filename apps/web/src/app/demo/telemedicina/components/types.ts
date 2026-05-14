export type Priority = 'red' | 'yellow' | 'green';
export type ConsultTab = 'record' | 'labs' | 'prescription' | 'notes';
export type MainTab = 'console' | 'triage' | 'scheduling' | 'lab' | 'billing' | 'preconsult';

export interface QueuePatient {
  id: string;
  name: string;
  age: number;
  doc: string;
  blood: string;
  insurance: string;
  reason: string;
  priority: Priority;
  waitingSince: number;
  allergies: string[];
  history: string[];
  meds: { name: string; dose: string; freq: string }[];
  vitals: { hr: number; bp: string; spo2: number; temp: number; steps: number; sleep: number };
  pastConsults: { date: string; specialty: string; notes: string }[];
}

export interface ChatMessage {
  id: string;
  from: 'doctor' | 'patient';
  text: string;
  at: string;
}

export interface TriageMsg {
  id: string;
  from: 'user' | 'ai';
  text: string;
}

export interface TriageResult {
  urgency: Priority;
  specialties: string[];
  recommendation: string;
}

export interface RxMed {
  id: string;
  name: string;
  dose: string;
  freq: string;
  duration: string;
  instructions: string;
}

export interface LabRow {
  test: string;
  value: string;
  ref: string;
  flag: 'normal' | 'high' | 'low' | 'critical';
  date: string;
  source: 'FHIR' | 'HL7';
}

export interface AuditEntry {
  at: string;
  actor: string;
  action: string;
}

export const PRIORITY_STYLES: Record<Priority, { dot: string; chip: string; ring: string }> = {
  red: { dot: 'bg-red-500', chip: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200', ring: 'ring-red-500' },
  yellow: { dot: 'bg-yellow-400', chip: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200', ring: 'ring-yellow-400' },
  green: { dot: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200', ring: 'ring-emerald-500' },
};

export function avatarColor(seed: string) {
  const palette = [
    'from-sky-500 to-indigo-600',
    'from-rose-500 to-pink-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-violet-500 to-purple-600',
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export function initials(name: string) {
  return name.split(' ').slice(0, 2).map((s) => s[0]).join('').toUpperCase();
}

export function fmtTimer(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${m}:${ss}`;
}

export function nowHHMM() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}
