/**
 * Tipos de la demo "CMS headless": modelos de contenido, entradas con versión
 * de trabajo y versión publicada, medios, roles, webhooks y registro de
 * actividad. Todo vive en el navegador (reducer + localStorage).
 */

export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/** Texto por idioma del contenido (no del sitio). */
export interface L10n {
  es: string;
  en: string;
}

export const TYPE_IDS = ['page', 'article', 'location', 'service', 'faq'] as const;
export type TypeId = (typeof TYPE_IDS)[number];

export const STATUSES = ['draft', 'review', 'approved', 'scheduled', 'published'] as const;
export type Status = (typeof STATUSES)[number];

export const ROLES = ['writer', 'editor', 'admin'] as const;
export type RoleId = (typeof ROLES)[number];

export type FieldKind =
  | 'text'
  | 'longText'
  | 'number'
  | 'boolean'
  | 'date'
  | 'phone'
  | 'image'
  | 'reference'
  | 'references'
  | 'blocks';

/** Tipos que se pueden elegir al agregar un campo propio a un modelo. */
export const CUSTOM_FIELD_KINDS = ['text', 'longText', 'number', 'boolean', 'date'] as const;
export type CustomFieldKind = (typeof CUSTOM_FIELD_KINDS)[number];

export interface FieldDef {
  id: string;
  kind: FieldKind;
  required: boolean;
  localized: boolean;
  /** Límite de caracteres sugerido (se muestra el contador). */
  max?: number;
  /** Tipo de contenido al que apunta una referencia. */
  refType?: TypeId;
  /** Solo en los campos que agregaste desde "Modelos de contenido". */
  custom?: { label: L10n };
}

export interface ContentType {
  id: TypeId;
  /** Ruta pública en el sitio de ejemplo ("/sedes/"). */
  route: string;
  hasSeo: boolean;
  fields: FieldDef[];
}

export type FieldValue = string | number | boolean | L10n | string[] | null;

export type HeadingLevel = 1 | 2 | 3;

export type Block =
  | { id: string; kind: 'heading'; level: HeadingLevel; text: L10n }
  | { id: string; kind: 'paragraph'; html: L10n }
  | { id: string; kind: 'image'; mediaId: string | null; caption: L10n }
  | { id: string; kind: 'button'; label: L10n; href: string }
  | { id: string; kind: 'faq'; question: L10n; answer: L10n };

export type BlockKind = Block['kind'];
export const BLOCK_KINDS: BlockKind[] = ['heading', 'paragraph', 'image', 'button', 'faq'];

export interface Seo {
  title: L10n;
  description: L10n;
}

/** Contenido de una entrada (lo que se edita y lo que se publica). */
export interface EntryContent {
  slug: string;
  fields: Record<string, FieldValue>;
  blocks: Block[];
  seo: Seo;
}

export type VersionReason = 'created' | 'saved' | 'submitted' | 'approved' | 'published' | 'restored' | 'discarded';

export interface Version {
  id: string;
  at: string;
  by: string;
  reason: VersionReason;
  content: EntryContent;
}

export interface Entry {
  id: string;
  type: TypeId;
  status: Status;
  /** Versión de trabajo (borrador). */
  content: EntryContent;
  /** Versión publicada: la que entrega la API y ve el sitio. */
  live: EntryContent | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  publishedAt: string | null;
  scheduledAt: string | null;
  reviewNote: string | null;
  versions: Version[];
}

export type ArtKey =
  | 'facade'
  | 'facade2'
  | 'consult'
  | 'team'
  | 'lab'
  | 'ultrasound'
  | 'dental'
  | 'physio'
  | 'calendar'
  | 'chat'
  | 'city'
  | 'reception';

export interface Media {
  id: string;
  name: string;
  /** Imagen subida (data URI comprimida). Las de ejemplo se dibujan con `art`. */
  src: string | null;
  art: ArtKey | null;
  alt: L10n;
  focal: { x: number; y: number };
  width: number;
  height: number;
  sizeKb: number;
  source: 'sample' | 'upload';
  createdAt: string;
}

export interface Person {
  id: string;
  name: string;
  role: RoleId;
}

export const WEBHOOK_TARGETS = ['site', 'app', 'assistant'] as const;
export type WebhookTargetId = (typeof WEBHOOK_TARGETS)[number];

export interface Webhook {
  id: WebhookTargetId;
  url: string;
  enabled: boolean;
}

export type WebhookEvent = 'entry.published' | 'entry.unpublished' | 'entry.deleted';

export interface Delivery {
  id: string;
  at: string;
  event: WebhookEvent;
  target: WebhookTargetId;
  entryId: string;
  entryTitle: string;
  paths: string[];
  /** Publicada por el programador (fecha y hora), no por una persona. */
  auto: boolean;
  resent: boolean;
}

export type ActivityKind =
  | 'created'
  | 'edited'
  | 'saved'
  | 'submitted'
  | 'approved'
  | 'changesRequested'
  | 'published'
  | 'autoPublished'
  | 'scheduled'
  | 'unscheduled'
  | 'unpublished'
  | 'discarded'
  | 'restored'
  | 'duplicated'
  | 'deleted'
  | 'fieldAdded'
  | 'fieldRemoved'
  | 'mediaAdded'
  | 'mediaRemoved'
  | 'webhookToggled'
  | 'webhookResent';

export interface Activity {
  id: string;
  at: string;
  by: string;
  kind: ActivityKind;
  entryId?: string;
  entryTitle?: string;
  detail?: string;
}

export const TOUR_STEPS = ['model', 'edit', 'assistant', 'publish', 'rag'] as const;
export type TourStep = (typeof TOUR_STEPS)[number];

export interface AppState {
  version: number;
  /** Momento en que se generaron los datos de ejemplo. */
  seededAt: string;
  currentUserId: string;
  people: Person[];
  types: ContentType[];
  entries: Entry[];
  media: Media[];
  webhooks: Webhook[];
  deliveries: Delivery[];
  activity: Activity[];
  tour: Record<TourStep, boolean>;
}

export type ViewId = 'home' | 'entries' | 'editor' | 'models' | 'media' | 'publishing' | 'api' | 'roles';
