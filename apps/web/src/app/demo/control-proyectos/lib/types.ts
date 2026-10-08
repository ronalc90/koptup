/**
 * Modelo de datos de la demo "Gestión de proyectos con portal de cliente".
 * Todo vive en el navegador (estado de React + localStorage); no hay backend.
 */

/** Fecha sin hora ni zona: 'AAAA-MM-DD'. */
export type ISODate = string;
/** Fecha y hora local sin zona: 'AAAA-MM-DDTHH:mm'. */
export type ISODateTime = string;

export type SectorId = 'construccion' | 'agencia' | 'software';
export const SECTORS: SectorId[] = ['construccion', 'agencia', 'software'];

/** Estados del tablero (los nombres visibles cambian por sector). */
export type StatusId = 'todo' | 'doing' | 'review' | 'client' | 'done';
export const STATUSES: StatusId[] = ['todo', 'doing', 'review', 'client', 'done'];

export type Priority = 'high' | 'medium' | 'low';
export const PRIORITIES: Priority[] = ['high', 'medium', 'low'];

export type ViewId = 'kanban' | 'list' | 'calendar' | 'timeline' | 'reports';
export const VIEWS: ViewId[] = ['kanban', 'list', 'calendar', 'timeline', 'reports'];

export type SectionId = 'project' | 'portfolio' | 'notifications' | 'preferences';

export type RoleId =
  | 'pm'
  | 'resident'
  | 'purchasing'
  | 'foreman'
  | 'architect'
  | 'accounts'
  | 'creative'
  | 'designer'
  | 'producer'
  | 'community'
  | 'techLead'
  | 'backend'
  | 'mobile'
  | 'qa';

/** Tipos de documento de ejemplo que la demo genera en PDF al descargarlos. */
export type DocKind = 'acta' | 'informe' | 'presupuesto' | 'brief' | 'piezas' | 'especificacion' | 'fotos';

export interface Member {
  id: string;
  name: string;
  role: RoleId;
  /** Costo por hora en COP (para el presupuesto ejecutado). */
  rate: number;
  /** Horas disponibles por semana. */
  capacity: number;
  /** La persona que usa la demo ("Tú"). */
  me?: boolean;
}

export interface Company {
  name: string;
  nit: string;
  city: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  clientContact: string;
  city: string;
  description: string;
  /** Clase de Tailwind del color del proyecto (bg-*). */
  color: string;
  favorite: boolean;
  start: ISODate;
  end: ISODate;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  kind: 'milestone' | 'sprint';
  start: ISODate;
  end: ISODate;
  /** Presupuesto de costo del hito (COP). */
  budget: number;
  /** Valor a facturar al cliente al cerrar el hito (COP, antes de IVA). */
  billing: number;
  invoice?: { number: string; on: ISODate };
  closed?: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  at: ISODateTime;
  fromClient?: boolean;
  mentions?: string[];
}

export interface Attachment {
  id: string;
  name: string;
  /** 'sample': PDF de ejemplo que se genera al descargar. 'upload': archivo que subiste (solo esta sesión). */
  source: 'sample' | 'upload';
  doc?: DocKind;
  size?: number;
}

export interface HistoryEntry {
  at: ISODateTime;
  actor: string;
  /** Clave i18n en `demoProjectsPro.history`. */
  key: string;
  params?: Record<string, string>;
  /** Se muestra en el portal del cliente. */
  client?: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  milestoneId: string | null;
  title: string;
  description: string;
  assigneeId: string | null;
  start: ISODate;
  due: ISODate;
  priority: Priority;
  status: StatusId;
  /** Horas estimadas. */
  estimate: number;
  tags: string[];
  checklist: ChecklistItem[];
  comments: Comment[];
  attachments: Attachment[];
  history: HistoryEntry[];
  /** Dependencias fin-inicio: esta tarea empieza cuando terminan estas. */
  dependsOn: string[];
  /** Entregable visible y aprobable en el portal del cliente. */
  clientVisible: boolean;
  completedAt?: ISODate;
  /** Aprobación del cliente (si la automatización no la movió a Terminado). */
  clientApproved?: boolean;
  /** Vencimiento para el que ya se aplicó la automatización de tareas vencidas. */
  autoRaisedDue?: ISODate;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  memberId: string;
  date: ISODate;
  hours: number;
  note: string;
}

export interface Expense {
  id: string;
  projectId: string;
  milestoneId: string;
  date: ISODate;
  concept: string;
  amount: number;
}

export type NotificationKind = 'client' | 'due' | 'sent' | 'mention' | 'assigned';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  at: ISODateTime;
  /** Clave i18n en `demoProjectsPro.notif`. */
  key: string;
  params: Record<string, string>;
  read: boolean;
  projectId?: string;
  taskId?: string;
}

/** Avisos al cliente (correo / WhatsApp) que en la demo son simulados. */
export interface OutboxItem {
  id: string;
  at: ISODateTime;
  projectId: string;
  channel: 'email' | 'whatsapp';
  to: string;
  /** Clave i18n en `demoProjectsPro.outbox`. */
  key: string;
  params: Record<string, string>;
}

export interface Automations {
  /** Si el cliente aprueba un entregable, pasa a Terminado y se avisa al equipo. */
  clientApproval: boolean;
  /** Si una tarea visible pasa a "Revisión del cliente", se avisa al cliente (simulado). */
  notifyClient: boolean;
  /** Si una tarea vence sin terminar, sube a prioridad alta y te avisa. */
  overdueRaise: boolean;
}

export interface Workspace {
  sector: SectorId;
  company: Company;
  members: Member[];
  projects: Project[];
  milestones: Milestone[];
  tasks: Task[];
  time: TimeEntry[];
  expenses: Expense[];
  notifications: AppNotification[];
  outbox: OutboxItem[];
  automations: Automations;
  /** Proyecto abierto en el tablero. */
  currentProjectId: string;
  /** Contador para ids únicos (nunca se reutiliza un id). */
  seq: number;
}

export interface Prefs {
  defaultView: ViewId;
  notify: Record<'client' | 'due' | 'sent', boolean>;
}

export interface AppState {
  version: number;
  /** Fecha local en que se generaron los datos de ejemplo. */
  baseDate: ISODate;
  sector: SectorId;
  workspaces: Record<SectorId, Workspace>;
  prefs: Prefs;
}

export interface Filters {
  q: string;
  assignee: string;
  priority: '' | Priority;
  milestone: string;
  overdueOnly: boolean;
}

export const EMPTY_FILTERS: Filters = { q: '', assignee: '', priority: '', milestone: '', overdueOnly: false };
