/**
 * Tipos de la demo de automatización. Todo vive en el navegador: los flujos,
 * las ejecuciones y los casos para revisar se guardan en localStorage.
 */

export type Loc = 'es' | 'en';

/** Fecha y hora de Colombia sin zona: "2026-10-10T09:05:12". */
export type Stamp = string;

export type StepType =
  | 'trigger.email'
  | 'trigger.webhook'
  | 'trigger.schedule'
  | 'trigger.chat'
  | 'ai.extract'
  | 'ai.classify'
  | 'ai.draft'
  | 'ai.rag'
  | 'app.sheet'
  | 'app.accounting'
  | 'app.crm'
  | 'app.payment'
  | 'app.http'
  | 'notify.chat'
  | 'notify.email'
  | 'logic.condition'
  | 'logic.wait'
  | 'logic.assign'
  | 'code.js'
  | 'code.map';

export type Category = 'triggers' | 'ai' | 'apps' | 'notify' | 'logic' | 'code';

export type TemplateKey = 'invoices' | 'collections' | 'leads' | 'assistant' | 'blank';

export type Backoff = 'exponential' | 'linear';

export interface RetryPolicy {
  /** Reintentos después del primer intento (0 a 5). */
  attempts: number;
  backoff: Backoff;
  /** Espera antes del primer reintento, en segundos. */
  baseSeconds: number;
}

export type ConfigValue = string | number;

export interface Step {
  id: string;
  type: StepType;
  name: string;
  config: Record<string, ConfigValue>;
  retry: RetryPolicy;
  /** Id de una credencial de ejemplo ('' = sin credencial). */
  credential: string;
}

export interface Version {
  n: number;
  note: string;
  author: string;
  at: Stamp;
  steps: Step[];
}

export interface Workflow {
  id: string;
  name: string;
  template: TemplateKey;
  steps: Step[];
  versions: Version[];
  /** Minutos de trabajo manual que ahorra cada ejecución exitosa. */
  minutesPerRun: number;
  /** Ritmo de ejemplo antes de esta sesión: ejecuciones al día y fracción exitosa. */
  rate: { perDay: number; ok: number };
  stepSeq: number;
}

/** Texto traducible: la UI lo pinta con t(key, params). */
export interface Msg {
  key: string;
  params?: Record<string, string | number>;
}

export type RunStatus = 'success' | 'retried' | 'review' | 'failed' | 'stopped' | 'cancelled';

export type StepStatus = 'success' | 'retry' | 'failed' | 'review' | 'stopped' | 'cancelled';

export interface StepLog {
  stepId: string;
  name: string;
  type: StepType;
  status: StepStatus;
  attempt: number;
  durationMs: number;
  /** Espera antes del siguiente intento (solo en status 'retry'). */
  waitMs?: number;
  msg: Msg;
  input: unknown;
  output?: unknown;
}

export type RunSource = 'manual' | 'trigger' | 'retry' | 'approve' | 'replay';

export interface RunRecord {
  id: string;
  seq: number;
  workflowId: string;
  startedAt: Stamp;
  durationMs: number;
  status: RunStatus;
  sampleId: string;
  source: RunSource;
  /** Ejecución de origen (reintento, aprobación o repetición). */
  sourceRun?: string;
  version: string;
  steps: StepLog[];
  summary: Msg;
  reviewId?: string;
}

export type ReviewKind = 'exception' | 'failure';

export interface ReviewItem {
  id: string;
  runId: string;
  workflowId: string;
  stepId: string;
  stepName: string;
  kind: ReviewKind;
  reason: Msg;
  createdAt: Stamp;
  status: 'open' | 'resolved' | 'discarded';
  /** Datos con los que se retoma el flujo. */
  data: Record<string, unknown>;
  /** Paso desde el que se retoma ('' = el flujo termina ahí). */
  resumeFrom: string;
  /** Dato que faltaba (por ejemplo "cartera.celular"), si el fallo fue por eso. */
  missingPath?: string;
  sampleId: string;
  resolvedAt?: Stamp;
  resolution?: Msg;
}

export interface Counters {
  run: number;
  review: number;
  wf: number;
  cxp: number;
  crm: number;
  pay: number;
}

export interface DemoState {
  v: number;
  /** Día (Colombia) en que se armaron los datos de ejemplo. */
  day: string;
  workflows: Workflow[];
  activeId: string;
  runs: RunRecord[];
  reviews: ReviewItem[];
  counters: Counters;
}

export interface SampleEvent {
  id: string;
  trigger: StepType;
  /** Clave de traducción del nombre del ejemplo (en samples.*). */
  labelKey: string;
  payload: Record<string, unknown>;
  /** Pasos que fallan con un error temporal en el primer intento. */
  transient?: StepType[];
}
