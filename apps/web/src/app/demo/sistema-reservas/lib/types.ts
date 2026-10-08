/**
 * Tipos de la demo de reservas. Las fechas se guardan como texto 'AAAA-MM-DD'
 * y las horas como minutos desde la medianoche (hora de Bogotá, UTC−5 sin
 * horario de verano), así los cálculos no dependen de la zona del navegador.
 */

export type ISODate = string;
/** 'AAAA-MM-DDTHH:mm' en hora de Bogotá. */
export type Stamp = string;

export type PresetId = 'odontologia' | 'estetica' | 'canchas';
export const PRESETS: PresetId[] = ['odontologia', 'estetica', 'canchas'];

export interface L {
  es: string;
  en: string;
}

export type IconKey = 'search' | 'sparkles' | 'sun' | 'wrench' | 'face' | 'hand' | 'heart' | 'scissors' | 'trophy' | 'bolt';

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
}

/** Turno de un profesional (o de una cancha) en una sede. */
export interface Shift {
  loc: string;
  start: number;
  end: number;
}

export type StaffColor = 'sky' | 'violet' | 'emerald' | 'rose';

export interface Staff {
  id: string;
  name: string;
  role: L;
  color: StaffColor;
  /** Servicios que atiende. */
  services: string[];
  /** Turnos por día de la semana (0 = domingo … 6 = sábado). */
  schedule: Partial<Record<number, Shift[]>>;
}

export interface Service {
  id: string;
  name: L;
  description: L;
  /** Minutos de atención. */
  duration: number;
  /** Minutos de alistamiento después de cada cita. */
  buffer: number;
  /** Precio en COP. */
  price: number;
  /** Porcentaje de abono exigido para reservar en línea (0 = se paga en la sede). */
  deposit: number;
  icon: IconKey;
}

export interface Business {
  id: PresetId;
  name: string;
  nit: string;
  sector: L;
  tagline: L;
  city: string;
  phone: string;
  /** 'court' cambia los textos de "profesional" por "cancha". */
  staffKind: 'professional' | 'court';
  /** Si atiende en festivos (con el horario del domingo). */
  holidaysOpen: boolean;
  /** Datos de salud: se muestra el aviso de datos sensibles. */
  healthData: boolean;
  /** Intervalo entre horas de inicio, en minutos. */
  step: number;
  /** Anticipación mínima para reservar el mismo día, en minutos. */
  leadMinutes: number;
  /** Horas antes de la cita para cancelar o reprogramar sin perder el abono. */
  cancelHours: number;
  /** Días hacia adelante que se pueden reservar. */
  horizonDays: number;
  locations: Location[];
  staff: Staff[];
  services: Service[];
}

export type Status = 'pending' | 'confirmed' | 'attended' | 'noshow' | 'cancelled';
export const STATUSES: Status[] = ['pending', 'confirmed', 'attended', 'noshow', 'cancelled'];

export type Channel = 'web' | 'whatsapp' | 'phone' | 'walkin';
export const CHANNELS: Channel[] = ['web', 'whatsapp', 'phone', 'walkin'];

export type PayMethod = 'pse' | 'nequi' | 'card' | 'onsite';
export type PayKind = 'deposit' | 'full' | 'none';

export interface Payment {
  kind: PayKind;
  method: PayMethod;
  /** Valor pagado en línea (simulado). */
  amount: number;
  ref: string | null;
}

export interface Client {
  name: string;
  phone: string;
  email: string;
}

export type HistoryKind = 'created' | 'status' | 'rescheduled' | 'note' | 'message' | 'reply';

export interface HistoryItem {
  at: Stamp;
  kind: HistoryKind;
  /** Dato adicional (estado nuevo, fecha anterior, tipo de mensaje…). */
  detail: string;
}

export interface Booking {
  id: string;
  code: string;
  serviceId: string;
  staffId: string;
  locationId: string;
  date: ISODate;
  start: number;
  end: number;
  client: Client;
  channel: Channel;
  status: Status;
  payment: Payment;
  notes: string;
  /** Recordatorio elegido por el cliente. */
  remind: { whatsapp: boolean; email: boolean };
  createdAt: Stamp;
  /** 'session' = creada por ti en esta demo. */
  source: 'seed' | 'session';
  history: HistoryItem[];
}

export type MessageKind = 'confirmation' | 'reminder' | 'reschedule' | 'cancellation';
export type MessageChannel = 'whatsapp' | 'email';

/** Mensaje simulado: se muestra la vista previa, no se envía nada. */
export interface MessageLog {
  id: string;
  bookingId: string;
  kind: MessageKind;
  channel: MessageChannel;
  at: Stamp;
  reply: 'confirmed' | 'reschedule' | null;
}

export interface PresetData {
  bookings: Booking[];
  messages: MessageLog[];
}

export interface AppState {
  version: number;
  baseDate: ISODate;
  preset: PresetId;
  data: Record<PresetId, PresetData>;
  seq: number;
  /** Última reserva creada en esta sesión (se resalta en la agenda). */
  lastBookingId: string | null;
}

export interface NewBookingInput {
  serviceId: string;
  staffId: string;
  locationId: string;
  date: ISODate;
  start: number;
  client: Client;
  channel: Channel;
  status: Status;
  payment: Payment;
  notes: string;
  remind: { whatsapp: boolean; email: boolean };
}
