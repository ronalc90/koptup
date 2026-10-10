/**
 * Catálogo de tipos de paso: categoría, campos que se editan en el inspector,
 * valores por defecto y credencial que necesita. Las etiquetas viven en
 * messages/demos/automatizacion.{es,en}.json (types.<tipo>, fields.<campo>).
 */
import type { Category, ConfigValue, RetryPolicy, StepType } from './types';

export type FieldKind = 'text' | 'template' | 'textarea' | 'number' | 'select' | 'code' | 'column';

export interface FieldDef {
  key: string;
  kind: FieldKind;
  /** Valores posibles (select). La etiqueta sale de options.<key>.<valor>. */
  options?: string[];
  min?: number;
  max?: number;
  rows?: number;
}

export type CredentialKind = 'email' | 'sheet' | 'accounting' | 'crm' | 'payment' | 'messaging' | 'smtp' | 'http';

export interface TypeDef {
  type: StepType;
  category: Category;
  fields: FieldDef[];
  /** Valores por defecto que no dependen del idioma. */
  defaults: Record<string, ConfigValue>;
  credential?: CredentialKind;
  /** La credencial es obligatoria para ejecutar el paso. */
  credentialRequired?: boolean;
  /** El paso habla con un sistema externo o con IA: en la demo es simulado. */
  simulated: boolean;
  /** Por defecto, cuántos reintentos tiene el paso. */
  retry: RetryPolicy;
}

const NO_RETRY: RetryPolicy = { attempts: 0, backoff: 'exponential', baseSeconds: 2 };
const NET_RETRY: RetryPolicy = { attempts: 3, backoff: 'exponential', baseSeconds: 2 };

export const SHEETS = ['orders', 'receivables', 'customers'] as const;
export type SheetKey = (typeof SHEETS)[number];

export const CONDITION_OPS = ['eq', 'neq', 'gt', 'lt', 'approx', 'contains', 'exists'] as const;
export type ConditionOp = (typeof CONDITION_OPS)[number];

export const TYPE_DEFS: Record<StepType, TypeDef> = {
  'trigger.email': {
    type: 'trigger.email',
    category: 'triggers',
    fields: [
      { key: 'mailbox', kind: 'text' },
      { key: 'filter', kind: 'select', options: ['attachments', 'all'] },
    ],
    defaults: { mailbox: 'facturas@nogalandino.example', filter: 'attachments' },
    credential: 'email',
    credentialRequired: true,
    simulated: true,
    retry: NO_RETRY,
  },
  'trigger.webhook': {
    type: 'trigger.webhook',
    category: 'triggers',
    fields: [{ key: 'path', kind: 'text' }],
    defaults: { path: '/formularios/contacto' },
    simulated: true,
    retry: NO_RETRY,
  },
  'trigger.schedule': {
    type: 'trigger.schedule',
    category: 'triggers',
    fields: [
      { key: 'time', kind: 'select', options: ['07:00', '08:00', '09:00', '14:00'] },
      { key: 'days', kind: 'select', options: ['weekdays', 'daily', 'mondays'] },
    ],
    defaults: { time: '08:00', days: 'weekdays' },
    simulated: true,
    retry: NO_RETRY,
  },
  'trigger.chat': {
    type: 'trigger.chat',
    category: 'triggers',
    fields: [{ key: 'line', kind: 'text' }],
    defaults: { line: '+57 601 000 0000' },
    credential: 'messaging',
    credentialRequired: true,
    simulated: true,
    retry: NO_RETRY,
  },
  'ai.extract': {
    type: 'ai.extract',
    category: 'ai',
    fields: [
      { key: 'source', kind: 'template' },
      { key: 'threshold', kind: 'number', min: 50, max: 100 },
      { key: 'saveAs', kind: 'text' },
    ],
    defaults: { source: '{{documento.contenido}}', threshold: 80, saveAs: 'factura' },
    simulated: true,
    retry: NO_RETRY,
  },
  'ai.classify': {
    type: 'ai.classify',
    category: 'ai',
    fields: [
      { key: 'text', kind: 'template' },
      { key: 'rules', kind: 'textarea', rows: 5 },
      { key: 'saveAs', kind: 'text' },
    ],
    defaults: { text: '{{lead.mensaje}}', saveAs: 'clasificacion' },
    simulated: true,
    retry: NO_RETRY,
  },
  'ai.draft': {
    type: 'ai.draft',
    category: 'ai',
    fields: [
      { key: 'template', kind: 'textarea', rows: 5 },
      { key: 'saveAs', kind: 'text' },
    ],
    defaults: { saveAs: 'borrador' },
    simulated: true,
    retry: NO_RETRY,
  },
  'ai.rag': {
    type: 'ai.rag',
    category: 'ai',
    fields: [
      { key: 'question', kind: 'template' },
      { key: 'saveAs', kind: 'text' },
    ],
    defaults: { question: '{{mensaje.texto}}', saveAs: 'respuesta' },
    simulated: true,
    retry: NO_RETRY,
  },
  'app.sheet': {
    type: 'app.sheet',
    category: 'apps',
    fields: [
      { key: 'sheet', kind: 'select', options: [...SHEETS] },
      { key: 'column', kind: 'column' },
      { key: 'value', kind: 'template' },
      { key: 'saveAs', kind: 'text' },
    ],
    defaults: { sheet: 'orders', column: 'nit', value: '{{factura.nit}}', saveAs: 'oc' },
    credential: 'sheet',
    credentialRequired: true,
    simulated: true,
    retry: NET_RETRY,
  },
  'app.accounting': {
    type: 'app.accounting',
    category: 'apps',
    fields: [
      { key: 'document', kind: 'select', options: ['payable', 'receipt', 'note'] },
      { key: 'account', kind: 'select', options: ['220505', '233595', '130505'] },
      { key: 'party', kind: 'template' },
      { key: 'amount', kind: 'template' },
      { key: 'saveAs', kind: 'text' },
    ],
    defaults: { document: 'payable', account: '220505', party: '{{factura.nit}}', amount: '{{factura.total}}', saveAs: 'registro' },
    credential: 'accounting',
    credentialRequired: true,
    simulated: true,
    retry: NET_RETRY,
  },
  'app.crm': {
    type: 'app.crm',
    category: 'apps',
    fields: [
      { key: 'contactName', kind: 'template' },
      { key: 'email', kind: 'template' },
      { key: 'phone', kind: 'template' },
      { key: 'owner', kind: 'template' },
      { key: 'saveAs', kind: 'text' },
    ],
    defaults: { contactName: '{{lead.nombre}}', email: '{{lead.correo}}', phone: '{{lead.telefono}}', owner: '{{asignacion.responsable}}', saveAs: 'contacto' },
    credential: 'crm',
    credentialRequired: true,
    simulated: true,
    retry: NET_RETRY,
  },
  'app.payment': {
    type: 'app.payment',
    category: 'apps',
    fields: [
      { key: 'amount', kind: 'template' },
      { key: 'reference', kind: 'template' },
      { key: 'dueDays', kind: 'number', min: 1, max: 30 },
      { key: 'saveAs', kind: 'text' },
    ],
    defaults: { amount: '{{cartera.saldo}}', reference: '{{cartera.factura}}', dueDays: 3, saveAs: 'pago' },
    credential: 'payment',
    credentialRequired: true,
    simulated: true,
    retry: NET_RETRY,
  },
  'app.http': {
    type: 'app.http',
    category: 'apps',
    fields: [
      { key: 'method', kind: 'select', options: ['GET', 'POST', 'PUT'] },
      { key: 'url', kind: 'template' },
      { key: 'body', kind: 'textarea', rows: 4 },
      { key: 'saveAs', kind: 'text' },
    ],
    defaults: { method: 'POST', url: 'https://api.ejemplo.example/v1/registros', body: '{\n  "id": "{{factura.numero}}"\n}', saveAs: 'respuesta' },
    credential: 'http',
    simulated: true,
    retry: NET_RETRY,
  },
  'notify.chat': {
    type: 'notify.chat',
    category: 'notify',
    fields: [
      { key: 'channel', kind: 'select', options: ['whatsapp', 'team'] },
      { key: 'to', kind: 'template' },
      { key: 'message', kind: 'textarea', rows: 4 },
      { key: 'saveAs', kind: 'text' },
    ],
    defaults: { channel: 'team', to: 'Tesorería', saveAs: 'aviso' },
    credential: 'messaging',
    credentialRequired: true,
    simulated: true,
    retry: NET_RETRY,
  },
  'notify.email': {
    type: 'notify.email',
    category: 'notify',
    fields: [
      { key: 'to', kind: 'template' },
      { key: 'subject', kind: 'template' },
      { key: 'message', kind: 'textarea', rows: 5 },
      { key: 'saveAs', kind: 'text' },
    ],
    defaults: { to: '{{lead.correo}}', saveAs: 'correo' },
    credential: 'smtp',
    credentialRequired: true,
    simulated: true,
    retry: NET_RETRY,
  },
  'logic.condition': {
    type: 'logic.condition',
    category: 'logic',
    fields: [
      { key: 'left', kind: 'template' },
      { key: 'op', kind: 'select', options: [...CONDITION_OPS] },
      { key: 'right', kind: 'template' },
      { key: 'tolerance', kind: 'number', min: 0, max: 50 },
      { key: 'onFalse', kind: 'select', options: ['review', 'stop'] },
    ],
    defaults: { left: '{{factura.total}}', op: 'approx', right: '{{oc.total}}', tolerance: 1, onFalse: 'review' },
    simulated: false,
    retry: NO_RETRY,
  },
  'logic.wait': {
    type: 'logic.wait',
    category: 'logic',
    fields: [{ key: 'minutes', kind: 'number', min: 1, max: 1440 }],
    defaults: { minutes: 30 },
    simulated: false,
    retry: NO_RETRY,
  },
  'logic.assign': {
    type: 'logic.assign',
    category: 'logic',
    fields: [
      { key: 'by', kind: 'template' },
      { key: 'table', kind: 'textarea', rows: 5 },
      { key: 'saveAs', kind: 'text' },
    ],
    defaults: { by: '{{clasificacion.ciudad}}', saveAs: 'asignacion' },
    simulated: false,
    retry: NO_RETRY,
  },
  'code.js': {
    type: 'code.js',
    category: 'code',
    fields: [
      { key: 'code', kind: 'code', rows: 7 },
      { key: 'saveAs', kind: 'text' },
    ],
    defaults: { saveAs: 'calculo' },
    simulated: false,
    retry: NO_RETRY,
  },
  'code.map': {
    type: 'code.map',
    category: 'code',
    fields: [
      { key: 'mapping', kind: 'textarea', rows: 5 },
      { key: 'saveAs', kind: 'text' },
    ],
    defaults: { saveAs: 'registro' },
    simulated: false,
    retry: NO_RETRY,
  },
};

export const STEP_TYPES = Object.keys(TYPE_DEFS) as StepType[];

export const CATEGORIES: Category[] = ['triggers', 'ai', 'apps', 'notify', 'logic', 'code'];

/** Clave de traducción del tipo (los mensajes no admiten puntos en las claves). */
export function typeKey(type: StepType): string {
  return type.replace('.', '_');
}

export function isTrigger(type: StepType): boolean {
  return TYPE_DEFS[type].category === 'triggers';
}

export function isStepType(x: unknown): x is StepType {
  return typeof x === 'string' && x in TYPE_DEFS;
}

/** Columnas de cada hoja de ejemplo (las etiquetas salen de sheets.<hoja>.cols.<col>). */
export const SHEET_COLUMNS: Record<SheetKey, string[]> = {
  orders: ['oc', 'nit', 'proveedor', 'total', 'estado'],
  receivables: ['nit', 'cliente', 'factura', 'saldo', 'diasVencida', 'celular', 'correo'],
  customers: ['correo', 'nombre', 'ciudad', 'comercial'],
};

export interface Credential {
  id: string;
  kind: CredentialKind;
}

/** Credenciales de ejemplo (nombres en messages: credentials.<id>). No hay secretos. */
export const CREDENTIALS: Credential[] = [
  { id: 'mail', kind: 'email' },
  { id: 'sheet', kind: 'sheet' },
  { id: 'accounting', kind: 'accounting' },
  { id: 'crm', kind: 'crm' },
  { id: 'payment', kind: 'payment' },
  { id: 'messaging', kind: 'messaging' },
  { id: 'smtp', kind: 'smtp' },
  { id: 'http', kind: 'http' },
];

export function defaultCredential(type: StepType): string {
  const kind = TYPE_DEFS[type].credential;
  if (!kind) return '';
  return CREDENTIALS.find((c) => c.kind === kind)?.id ?? '';
}
