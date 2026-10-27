/** Tipos de la demo de firma electrónica (todo vive en el navegador). */

/** Fecha y hora de Colombia sin zona: "2026-10-08T09:05:12". */
export type Stamp = string;

export const TABS = ['home', 'create', 'templates', 'evidence', 'signer', 'developers', 'integrations'] as const;
export type Tab = (typeof TABS)[number];

export const ENV_STATUSES = ['draft', 'sent', 'partial', 'completed', 'expired', 'voided'] as const;
export type EnvStatus = (typeof ENV_STATUSES)[number];

export const ROLES = ['signer', 'approver', 'witness', 'cc'] as const;
export type Role = (typeof ROLES)[number];

export const CHANNELS = ['email', 'sms', 'whatsapp'] as const;
export type Channel = (typeof CHANNELS)[number];

export const AUTH_METHODS = ['emailOtp', 'smsOtp', 'whatsappOtp', 'idCheck'] as const;
export type AuthMethod = (typeof AUTH_METHODS)[number];

export const SIG_TYPES = ['electronic', 'digital'] as const;
export type SigType = (typeof SIG_TYPES)[number];

export const FIELD_TYPES = ['signature', 'initials', 'date', 'text', 'checkbox'] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export type SignMode = 'sequential' | 'parallel';

export interface SignatureMark {
  kind: 'draw' | 'type' | 'upload' | 'approve';
  /** PNG en data URL (trazo, nombre escrito o imagen subida). */
  image?: string;
  /** Nombre escrito, para las firmas de los datos de ejemplo. */
  text?: string;
}

export interface Signer {
  id: string;
  name: string;
  email: string;
  phone: string;
  channel: Channel;
  role: Role;
  state: 'pending' | 'viewed' | 'signed';
  signedAt?: Stamp;
  signature?: SignatureMark;
  /** Valores de los campos de texto y casillas que llenó. */
  values?: Record<string, string>;
}

export interface Field {
  id: string;
  type: FieldType;
  /** Posición en porcentaje de la página (centro del campo). */
  x: number;
  y: number;
  signerId: string;
}

export interface DocRef {
  kind: 'template' | 'upload';
  templateId?: string;
  vars?: Record<string, string>;
  fileName?: string;
  size?: number;
  pages?: number;
  /** SHA-256 del documento (del PDF subido o del texto de la plantilla). */
  hash: string;
}

export const EVENT_TYPES = [
  'created',
  'sent',
  'reminder',
  'viewed',
  'codeSent',
  'authenticated',
  'signed',
  'approved',
  'commentsResolved',
  'completed',
  'sealed',
  'copySent',
  'voided',
  'expired',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/** Actor especial: el remitente (tú) o la plataforma. */
export const YOU = '@you';
export const SYSTEM = '@system';

export interface EvEvent {
  id: string;
  type: EventType;
  at: Stamp;
  actor: string;
  ip: string;
  device: string;
  geo: string;
  detail: Record<string, string>;
  /** Hash del evento anterior (el primero apunta a la huella del documento). */
  prev: string;
  hash: string;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  status: 'open' | 'accepted' | 'rejected';
  /** Comentarios de ejemplo: el texto sale de la traducción. */
  sample?: 'c1' | 'c2';
}

export interface Envelope {
  id: string;
  /** Asunto escrito por la persona (sobres de PDF o de plantillas propias). */
  title: string;
  /** Persona o empresa del documento (para el título de las plantillas). */
  subject: string;
  doc: DocRef;
  signers: Signer[];
  fields: Field[];
  mode: SignMode;
  auth: AuthMethod;
  sigType: SigType;
  expiryDays: number;
  reminderDays: number;
  timestamp: boolean;
  redlines: boolean;
  comments: Comment[];
  status: EnvStatus;
  createdAt: Stamp;
  updatedAt: Stamp;
  sentAt?: Stamp;
  completedAt?: Stamp;
  expiresAt?: Stamp;
  events: EvEvent[];
  origin: 'seed' | 'wizard' | 'bulk';
}

export interface CustomTemplate {
  id: string;
  name: string;
  body: string;
  vars: string[];
}

/** Lo que llevas armado en el asistente "Nuevo sobre". */
export interface Draft {
  /** Si estás editando un borrador guardado. */
  editingId: string | null;
  step: number;
  title: string;
  subject: string;
  doc: DocRef | null;
  signers: Signer[];
  fields: Field[];
  mode: SignMode;
  auth: AuthMethod;
  sigType: SigType;
  expiryDays: number;
  reminderDays: number;
  timestamp: boolean;
  redlines: boolean;
  comments: Comment[];
}

export interface DemoState {
  version: number;
  /** Día (hora de Colombia) en que se generaron los datos de ejemplo. */
  baseDate: string;
  seq: number;
  envelopes: Envelope[];
  templates: CustomTemplate[];
  draft: Draft;
}

export interface BulkRow {
  line: number;
  name: string;
  email: string;
  phone: string;
  vars: Record<string, string>;
  errors: string[];
}
