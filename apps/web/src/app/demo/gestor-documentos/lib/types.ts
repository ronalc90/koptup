/**
 * Tipos del gestor documental. Un mismo modelo (`DocItem`) sirve para los
 * datos de ejemplo (viven en el navegador) y para los documentos de la cuenta
 * (vienen de /api/documents).
 */

export type Loc = 'es' | 'en';

/** Fecha y hora de Colombia sin zona: "2026-10-08T09:05:12" (o solo el día). */
export type Stamp = string;

/** De dónde sale la lista: corpus de ejemplo o documentos del servidor. */
export type Mode = 'sample' | 'server';

export type DocKind = 'pdf' | 'docx' | 'txt' | 'csv' | 'other';

export type View = 'all' | 'favorites' | 'recent' | 'trash' | 'folder';

export type EntityKind = 'party' | 'nit' | 'value' | 'date' | 'term' | 'city' | 'person' | 'role' | 'reference';

export interface Entity {
  kind: EntityKind;
  value: string;
}

/** Campo leído de una factura escaneada (datos de ejemplo). */
export interface OcrField {
  key: 'issuer' | 'nit' | 'number' | 'date' | 'cufe' | 'buyer' | 'subtotal' | 'iva' | 'total';
  value: string;
  /** Confianza de la lectura (0–1), parte de los datos de ejemplo. */
  confidence: number;
}

export interface OcrLine {
  concept: string;
  qty: number;
  unit: number;
}

export interface OcrData {
  fields: OcrField[];
  lines: OcrLine[];
}

export interface DocVersion {
  label: string;
  createdAt: Stamp;
  author: string;
  note: string;
  text: string;
}

export interface DocItem {
  id: string;
  source: Mode;
  name: string;
  kind: DocKind;
  sizeBytes: number;
  /** Carpeta. En los datos de ejemplo, las carpetas base empiezan por "@". */
  folder: string;
  tags: string[];
  favorite: boolean;
  createdAt: Stamp;
  deleted: boolean;
  deletedAt?: Stamp;
  summary?: string;
  keywords?: string[];
  /** Entidades del servidor (texto libre). */
  entitiesText?: string[];
  /** Entidades de los datos de ejemplo (con tipo). */
  entities?: Entity[];
  /** Texto del documento (solo datos de ejemplo). */
  text?: string;
  /** Explicación precalculada (solo datos de ejemplo). */
  explanation?: string[];
  /** Factura escaneada con su lectura de ejemplo. */
  ocr?: OcrData;
  versions?: DocVersion[];
}

export type PolicyKey = 'none' | 'y1' | 'y3' | 'y5' | 'y10' | 'perm';

export interface RetentionRule {
  policy: PolicyKey;
  hold: boolean;
}

export type RetentionMap = Record<string, RetentionRule>;

export type SortKey = 'relevance' | 'newest' | 'oldest' | 'name' | 'size';

export type TypeFilter = 'all' | DocKind;

export type DateFilter = 'all' | 'd7' | 'd30' | 'd365';

export interface Filters {
  type: TypeFilter;
  date: DateFilter;
  tag: string;
}
