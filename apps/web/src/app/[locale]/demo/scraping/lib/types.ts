import type { SchedulePreset } from './cron';

export type SourceId = 'contratacion' | 'precios' | 'normativa' | 'documentos';
export type SourceKind = 'api' | 'web' | 'documents';
export type Tab = 'overview' | 'builder' | 'changes' | 'alerts' | 'delivery' | 'history' | 'compliance';
export const TABS: Tab[] = ['overview', 'builder', 'changes', 'alerts', 'delivery', 'history', 'compliance'];

export type FieldType = 'text' | 'number' | 'price' | 'link' | 'image';
export const FIELD_TYPES: FieldType[] = ['text', 'number', 'price', 'link', 'image'];

/** Campo del constructor: un selector CSS que se aplica dentro de cada registro o en toda la página. */
export interface Field {
  id: string;
  name: string;
  selector: string;
  type: FieldType;
  required: boolean;
  scope: 'record' | 'page';
}

export type CellValue = string | number | null;
export type Row = Record<string, CellValue>;

/** Tipo de presentación de una columna en tablas y descargas. */
export type ColumnType = 'text' | 'number' | 'price' | 'link' | 'image' | 'date' | 'percent' | 'status';

export interface Column {
  key: string;
  /** Prefijo de traducción para valores codificados (p. ej. `values.modality`). */
  valueKey?: string;
  /** Texto fijo (campos que nombró el usuario) o clave de traducción en `columns.*`. */
  label?: string;
  labelKey?: string;
  type: ColumnType;
  required?: boolean;
  /** Columna de texto largo: se le da un ancho mínimo en la tabla. */
  wide?: boolean;
}

export interface FieldDiff {
  field: string;
  label?: string;
  labelKey?: string;
  before: string;
  after: string;
  /** Variación porcentual (precios y cuantías). */
  pct?: number;
}

export interface Change {
  id: string;
  kind: 'added' | 'removed' | 'modified';
  key: string;
  title: string;
  subtitle?: string;
  diffs: FieldDiff[];
  /** Datos para evaluar reglas de alerta. */
  meta?: Record<string, string | number | null>;
}

export interface LogLine {
  key: string;
  params?: Record<string, string | number>;
  level: 'info' | 'ok' | 'warn' | 'demo';
}

export type RunStatus = 'ok' | 'partial' | 'error';

export interface RunResult {
  sourceId: SourceId;
  at: string;
  trigger: 'scheduled' | 'manual';
  rows: Row[];
  columns: Column[];
  changes: Change[];
  quality: number;
  status: RunStatus;
  log: LogLine[];
  /** Firma de la configuración con la que se ejecutó (para avisar cambios sin aplicar). */
  signature: string;
}

export interface HistoryEntry {
  id: string;
  sourceId: SourceId;
  at: string;
  trigger: 'scheduled' | 'manual' | 'retry';
  status: RunStatus;
  records: number;
  changes: number;
  quality: number;
  noteKey?: string;
  log: LogLine[];
}

export type RuleType = 'priceDrop' | 'stockBelow' | 'newProcessOver' | 'closingSoon' | 'newDoc' | 'docReview';

export interface Rule {
  id: string;
  sourceId: SourceId;
  type: RuleType;
  /** Umbral numérico o palabra clave, según el tipo. */
  value: number | string;
  enabled: boolean;
  /** Regla creada desde un cambio concreto: solo aplica a ese registro. */
  targetKey?: string;
  targetLabel?: string;
}

export interface SentAlert {
  id: string;
  sourceId: SourceId;
  at: string;
  channels: Channel[];
  lines: number;
}

export type Channel = 'email' | 'teams' | 'whatsapp';

export interface Schedule {
  preset: SchedulePreset;
  cron: string;
}

export interface RadarConfig {
  keywords: string[];
  departments: string[];
  minAmount: number;
}

export interface NormativaConfig {
  entities: string[];
  keyword: string;
}

export interface DocsConfig {
  threshold: number;
  columns: string[];
}

export interface CustomSource {
  id: string;
  name: string;
  url: string;
  kind: SourceKind;
  fields: string[];
  preset: SchedulePreset;
  destination: string;
  createdAt: string;
}
