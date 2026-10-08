/**
 * Datos de ejemplo de la mesa de ayuda (todo ficticio).
 *
 * Tres marcas inventadas atienden por una sola bandeja: una tienda de ropa en
 * línea, un proveedor de internet y TV, y una cooperativa de ahorro y crédito.
 * Personas, contactos, pedidos, montos y radicados son inventados.
 *
 * El reloj de la demo cuenta minutos desde las 00:00 del día de referencia
 * (REF_DATE). Los tickets guardan sus tiempos en esa escala: un valor negativo
 * es de días anteriores. Los textos de los tickets de ejemplo son claves de
 * traducción (`{ k }`); lo que escribe el usuario se guarda tal cual (string).
 */

export type Channel = 'email' | 'webchat' | 'whatsapp' | 'messenger' | 'telegram' | 'voice';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Sentiment = 'positive' | 'neutral' | 'negative';
export type Status = 'open' | 'pending' | 'resolved';
export type Category = 'billing' | 'tech' | 'orders' | 'account' | 'cancel' | 'general';
export type Skill = 'billing' | 'tech' | 'orders' | 'account' | 'retention' | 'english';
export type BrandId = 'moda' | 'conecta' | 'ceiba';
export type AgentId = 'maria' | 'carlos' | 'ana' | 'luis';
export type Lang = 'es' | 'en';
export type PqrsType = 'peticion' | 'queja' | 'reclamo' | 'sugerencia' | 'felicitacion';
export type Plan = 'basic' | 'pro' | 'advanced';

/**
 * Texto traducible (clave dentro de `demoHelpdesk`, con parámetros opcionales;
 * un parámetro que empieza con '@' es otra clave que también se traduce) o
 * texto libre escrito por el usuario.
 */
export type Txt = string | { k: string; p?: Record<string, string | number> };

export interface Msg {
  id: string;
  from: 'customer' | 'agent' | 'bot';
  /** Solo para mensajes del bot: acuse de recibo o respuesta automática. */
  kind?: 'ack' | 'autoReply';
  /** Agente que escribió (o 'you' si lo escribió el visitante de la demo). */
  author?: AgentId | 'you';
  text: Txt;
  at: number;
}

export interface Note {
  id: string;
  author: AgentId | 'you' | 'system';
  text: Txt;
  at: number;
}

export interface Escalation {
  target: EscalationTarget;
  reason: string;
  at: number;
}

export type EscalationTarget = 'level2' | 'supervisor' | 'quality' | 'billingArea';

export interface Pqrs {
  type: PqrsType;
  radicado: string;
  /** Día de radicación (0 = REF_DATE, negativo = días anteriores). */
  filedDay: number;
}

export interface Ticket {
  id: string;
  brand: BrandId;
  channel: Channel;
  customer: string;
  contact: string;
  city: string;
  subject: Txt;
  category: Category;
  priority: Priority;
  sentiment: Sentiment;
  language: Lang;
  status: Status;
  assignee: AgentId | null;
  createdAt: number;
  resolvedAt: number | null;
  tags: string[];
  messages: Msg[];
  notes: Note[];
  pqrs: Pqrs | null;
  escalation: Escalation | null;
  /** El SLA ya venció y se aplicó la regla de escalamiento automático. */
  slaHandled: boolean;
}

export interface Agent {
  id: AgentId;
  name: string;
  skills: Skill[];
}

export interface KbArticle {
  id: string;
  category: Category;
  /** Puede usarse como respuesta automática (pregunta frecuente). */
  autoReply: boolean;
  /** Palabras para la búsqueda (además del título y el texto). */
  tags: string[];
}

export type MacroCondition =
  | { type: 'category'; value: Category }
  | { type: 'channel'; value: Channel }
  | { type: 'priorityAtLeast'; value: Priority }
  | { type: 'sentiment'; value: Sentiment }
  | { type: 'keyword'; value: string };

export type MacroAction =
  | { type: 'assign'; value: AgentId }
  | { type: 'priority'; value: Priority }
  | { type: 'tag'; value: string }
  | { type: 'ack' };

export interface Macro {
  id: string;
  /** Nombre traducible (macros de ejemplo) o escrito por el usuario. */
  name: Txt;
  conditions: MacroCondition[];
  actions: MacroAction[];
  /** Se aplica sola a los tickets nuevos que cumplen las condiciones. */
  auto: boolean;
  active: boolean;
  runs: number;
}

export type AutoResult = 'sent' | 'belowThreshold' | 'notEligible' | 'off';

export interface AutoLogEntry {
  id: string;
  ticketId: string;
  channel: Channel;
  category: Category;
  confidence: number;
  result: AutoResult;
  /** El tema tiene respuesta automática y el mensaje no es negativo. */
  eligible: boolean;
  at: number;
}

export interface Survey {
  id: string;
  ticketId: string;
  agent: AgentId | null;
  score: number;
  nps: number;
  comment: Txt;
  at: number;
}

export interface Settings {
  autoReplyOn: boolean;
  threshold: number;
}

/** Fecha de referencia de los datos de ejemplo (día 0 del reloj de la demo). */
export const REF_DATE = { y: 2026, m: 10, d: 8 };
/** Hora inicial del reloj de la demo: 10:30 a. m. del día de referencia. */
export const START_CLOCK = 10 * 60 + 30;

export const CHANNELS: Channel[] = ['email', 'webchat', 'whatsapp', 'messenger', 'telegram', 'voice'];
export const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];
export const CATEGORIES: Category[] = ['billing', 'tech', 'orders', 'account', 'cancel', 'general'];
export const BRANDS: BrandId[] = ['moda', 'conecta', 'ceiba'];
export const PQRS_TYPES: PqrsType[] = ['peticion', 'queja', 'reclamo', 'sugerencia', 'felicitacion'];
export const ESCALATION_TARGETS: EscalationTarget[] = ['level2', 'supervisor', 'quality', 'billingArea'];

/** Plan del Helpdesk con IA desde el que se incluye cada canal (ver catálogo). */
export const CHANNEL_PLAN: Record<Channel, Plan> = {
  email: 'basic',
  webchat: 'basic',
  whatsapp: 'pro',
  messenger: 'pro',
  telegram: 'pro',
  voice: 'advanced',
};

export const AGENTS: Agent[] = [
  { id: 'maria', name: 'María González', skills: ['billing', 'retention'] },
  { id: 'carlos', name: 'Carlos Ruiz', skills: ['tech', 'account', 'english'] },
  { id: 'ana', name: 'Ana Pereira', skills: ['orders', 'billing'] },
  { id: 'luis', name: 'Luis Martínez', skills: ['tech', 'orders'] },
];

export const AGENT_IDS: AgentId[] = AGENTS.map((a) => a.id);

/** Habilidad que necesita cada área para el enrutamiento. */
export const CATEGORY_SKILL: Record<Category, Skill | null> = {
  billing: 'billing',
  tech: 'tech',
  orders: 'orders',
  account: 'account',
  cancel: 'retention',
  general: null,
};

/** Política de SLA de ejemplo, en minutos corridos. */
export const SLA_FIRST_RESPONSE: Record<Priority, number> = { urgent: 15, high: 30, medium: 60, low: 240 };
export const SLA_RESOLUTION: Record<Priority, number> = { urgent: 240, high: 480, medium: 1440, low: 2880 };

/** Término de ejemplo para PQRS, en días hábiles. */
export const PQRS_TERM_DAYS = 15;

export const KB_ARTICLES: KbArticle[] = [
  { id: 'refund', category: 'billing', autoReply: false, tags: ['reembolso*', 'refund*', 'devuelvan', 'devolver el dinero', 'cobro duplicado', 'dos cargos', 'dos veces', 'duplicado*', 'twice', 'duplicate', 'two charges', 'money back'] },
  { id: 'einvoice', category: 'billing', autoReply: true, tags: ['factura electronica', 'factura', 'invoice', 'electronic invoice', 'e invoice', 'dian', 'correo', 'email', 'xml'] },
  { id: 'pse', category: 'billing', autoReply: true, tags: ['pse', 'pago*', 'payment*', 'banco', 'bank', 'pendiente', 'pending', 'rechazad*', 'declined'] },
  { id: 'password', category: 'account', autoReply: true, tags: ['contrasena*', 'password', 'clave', 'codigo*', 'code', 'verificacion', 'verification', 'iniciar sesion', 'log in', 'login', 'sign in', 'sms'] },
  { id: 'orderStatus', category: 'orders', autoReply: true, tags: ['pedido*', 'order*', 'guia', 'tracking', 'donde va', 'donde esta', 'where is', 'where my order', 'envio*', 'shipping'] },
  { id: 'address', category: 'orders', autoReply: false, tags: ['direccion', 'address', 'entrega', 'equivoque', 'cambiar', 'wrong', 'change'] },
  { id: 'returns', category: 'orders', autoReply: true, tags: ['cambio de talla', 'talla', 'devolucion', 'devolver', 'retracto', 'return*', 'size', 'exchange'] },
  { id: 'slowInternet', category: 'tech', autoReply: false, tags: ['internet', 'lento', 'lenta', 'intermitente', 'modem', 'router', 'wifi', 'senal', 'slow', 'connection', 'se cae', 'signal'] },
  { id: 'visit', category: 'tech', autoReply: false, tags: ['visita*', 'tecnico', 'visit', 'technician'] },
  { id: 'cancelPlan', category: 'cancel', autoReply: false, tags: ['cancelar', 'cancel*', 'plan', 'de baja', 'retiro', 'pausar', 'pause', 'suscripcion', 'subscription'] },
];

const k = (key: string): Txt => ({ k: `data.${key}` });

const DAY = 1440;

export const SEED_TICKETS: Ticket[] = [
  {
    id: 'TCK-1041',
    brand: 'moda',
    channel: 'whatsapp',
    customer: 'Lucía Andrade',
    contact: '+57 310 *** 4521',
    city: 'Medellín',
    subject: k('tickets.t1.subject'),
    category: 'billing',
    priority: 'high',
    sentiment: 'negative',
    language: 'es',
    status: 'open',
    assignee: 'maria',
    createdAt: 602,
    resolvedAt: null,
    tags: ['pse'],
    messages: [
      { id: 't1m1', from: 'customer', text: k('tickets.t1.m1'), at: 602 },
      { id: 't1m2', from: 'bot', kind: 'ack', text: k('ack'), at: 602 },
      { id: 't1m3', from: 'agent', author: 'maria', text: k('tickets.t1.m3'), at: 611 },
      { id: 't1m4', from: 'customer', text: k('tickets.t1.m4'), at: 618 },
    ],
    notes: [{ id: 't1n1', author: 'maria', text: k('tickets.t1.n1'), at: 613 }],
    pqrs: null,
    escalation: null,
    slaHandled: false,
  },
  {
    id: 'TCK-1042',
    brand: 'conecta',
    channel: 'voice',
    customer: 'Javier Bravo',
    contact: '+57 315 *** 0287',
    city: 'Villavicencio',
    subject: k('tickets.t2.subject'),
    category: 'tech',
    priority: 'urgent',
    sentiment: 'negative',
    language: 'es',
    status: 'open',
    assignee: 'luis',
    createdAt: 580,
    resolvedAt: null,
    tags: ['falla-masiva'],
    messages: [
      { id: 't2m1', from: 'customer', text: k('tickets.t2.m1'), at: 580 },
      { id: 't2m2', from: 'agent', author: 'luis', text: k('tickets.t2.m2'), at: 588 },
    ],
    notes: [{ id: 't2n1', author: 'luis', text: k('tickets.t2.n1'), at: 590 }],
    pqrs: null,
    escalation: { target: 'level2', reason: '', at: 590 },
    slaHandled: false,
  },
  {
    id: 'TCK-1043',
    brand: 'conecta',
    channel: 'whatsapp',
    customer: 'Marta Quiroz',
    contact: '+57 301 *** 7764',
    city: 'Bogotá',
    subject: k('tickets.t3.subject'),
    category: 'cancel',
    priority: 'medium',
    sentiment: 'neutral',
    language: 'es',
    status: 'pending',
    assignee: 'maria',
    createdAt: 535,
    resolvedAt: null,
    tags: ['retencion'],
    messages: [
      { id: 't3m1', from: 'customer', text: k('tickets.t3.m1'), at: 535 },
      { id: 't3m2', from: 'bot', kind: 'ack', text: k('ack'), at: 535 },
      { id: 't3m3', from: 'agent', author: 'maria', text: k('tickets.t3.m3'), at: 552 },
    ],
    notes: [],
    pqrs: { type: 'peticion', radicado: 'PQRS-2026-0418', filedDay: 0 },
    escalation: null,
    slaHandled: false,
  },
  {
    id: 'TCK-1044',
    brand: 'moda',
    channel: 'messenger',
    customer: 'Diego Núñez',
    contact: 'Messenger · Diego N.',
    city: 'Cali',
    subject: k('tickets.t4.subject'),
    category: 'orders',
    priority: 'medium',
    sentiment: 'neutral',
    language: 'es',
    status: 'open',
    assignee: null,
    createdAt: 622,
    resolvedAt: null,
    tags: [],
    messages: [{ id: 't4m1', from: 'customer', text: k('tickets.t4.m1'), at: 622 }],
    notes: [],
    pqrs: null,
    escalation: null,
    slaHandled: false,
  },
  {
    id: 'TCK-1045',
    brand: 'moda',
    channel: 'telegram',
    customer: 'Sofía Castro',
    contact: 'Telegram · @sofi_c',
    city: 'Barranquilla',
    subject: k('tickets.t5.subject'),
    category: 'general',
    priority: 'low',
    sentiment: 'positive',
    language: 'es',
    status: 'resolved',
    assignee: 'ana',
    createdAt: -DAY + 970,
    resolvedAt: -DAY + 990,
    tags: [],
    messages: [
      { id: 't5m1', from: 'customer', text: k('tickets.t5.m1'), at: -DAY + 970 },
      { id: 't5m2', from: 'agent', author: 'ana', text: k('tickets.t5.m2'), at: -DAY + 985 },
    ],
    notes: [],
    pqrs: { type: 'felicitacion', radicado: 'PQRS-2026-0415', filedDay: -1 },
    escalation: null,
    slaHandled: false,
  },
  {
    id: 'TCK-1046',
    brand: 'conecta',
    channel: 'email',
    customer: 'Karen Mejía',
    contact: 'ka***@correo.example',
    city: 'Bucaramanga',
    subject: k('tickets.t6.subject'),
    category: 'billing',
    priority: 'high',
    sentiment: 'neutral',
    language: 'es',
    status: 'open',
    assignee: 'ana',
    createdAt: 545,
    resolvedAt: null,
    tags: ['sla-vencido'],
    messages: [{ id: 't6m1', from: 'customer', text: k('tickets.t6.m1'), at: 545 }],
    notes: [{ id: 't6n1', author: 'system', text: k('tickets.t6.n1'), at: 605 }],
    pqrs: null,
    escalation: null,
    slaHandled: true,
  },
  {
    id: 'TCK-1047',
    brand: 'moda',
    channel: 'email',
    customer: 'Daniel Brooks',
    contact: 'da***@mail.example',
    city: 'Cartagena',
    subject: k('tickets.t7.subject'),
    category: 'account',
    priority: 'medium',
    sentiment: 'neutral',
    language: 'en',
    status: 'open',
    assignee: 'carlos',
    createdAt: 612,
    resolvedAt: null,
    tags: [],
    messages: [{ id: 't7m1', from: 'customer', text: k('tickets.t7.m1'), at: 612 }],
    notes: [],
    pqrs: null,
    escalation: null,
    slaHandled: false,
  },
  {
    id: 'TCK-1048',
    brand: 'moda',
    channel: 'email',
    customer: 'Roberto Vidal',
    contact: 'ro***@correo.example',
    city: 'Bogotá',
    subject: k('tickets.t8.subject'),
    category: 'billing',
    priority: 'urgent',
    sentiment: 'negative',
    language: 'es',
    status: 'open',
    assignee: null,
    createdAt: 620,
    resolvedAt: null,
    tags: ['reembolso', 'riesgo-legal'],
    messages: [{ id: 't8m1', from: 'customer', text: k('tickets.t8.m1'), at: 620 }],
    notes: [],
    pqrs: null,
    escalation: null,
    slaHandled: false,
  },
  {
    id: 'TCK-1049',
    brand: 'moda',
    channel: 'webchat',
    customer: 'Valentina Ríos',
    contact: 'Chat web · visitante',
    city: 'Pereira',
    subject: k('tickets.t9.subject'),
    category: 'orders',
    priority: 'low',
    sentiment: 'neutral',
    language: 'es',
    status: 'pending',
    assignee: null,
    createdAt: 605,
    resolvedAt: null,
    tags: ['respuesta-automatica'],
    messages: [
      { id: 't9m1', from: 'customer', text: k('tickets.t9.m1'), at: 605 },
      { id: 't9m2', from: 'bot', kind: 'autoReply', text: k('tickets.t9.m2'), at: 605 },
    ],
    notes: [],
    pqrs: null,
    escalation: null,
    slaHandled: false,
  },
  {
    id: 'TCK-1050',
    brand: 'conecta',
    channel: 'email',
    customer: 'Hernán Ospina',
    contact: 'he***@correo.example',
    city: 'Tunja',
    subject: k('tickets.t10.subject'),
    category: 'billing',
    priority: 'high',
    sentiment: 'negative',
    language: 'es',
    status: 'open',
    assignee: 'maria',
    createdAt: -17 * DAY + 555,
    resolvedAt: null,
    tags: ['visita-tecnica'],
    messages: [
      { id: 't10m1', from: 'customer', text: k('tickets.t10.m1'), at: -17 * DAY + 555 },
      { id: 't10m2', from: 'agent', author: 'maria', text: k('tickets.t10.m2'), at: -17 * DAY + 590 },
      { id: 't10m3', from: 'customer', text: k('tickets.t10.m3'), at: -6 * DAY + 600 },
    ],
    notes: [{ id: 't10n1', author: 'maria', text: k('tickets.t10.n1'), at: -6 * DAY + 640 }],
    pqrs: { type: 'reclamo', radicado: 'PQRS-2026-0402', filedDay: -17 },
    escalation: null,
    slaHandled: false,
  },
  {
    id: 'TCK-1051',
    brand: 'ceiba',
    channel: 'whatsapp',
    customer: 'Camila Torres',
    contact: '+57 320 *** 1190',
    city: 'Manizales',
    subject: k('tickets.t11.subject'),
    category: 'account',
    priority: 'medium',
    sentiment: 'neutral',
    language: 'es',
    status: 'open',
    assignee: 'carlos',
    createdAt: 615,
    resolvedAt: null,
    tags: [],
    messages: [
      { id: 't11m1', from: 'customer', text: k('tickets.t11.m1'), at: 615 },
      { id: 't11m2', from: 'bot', kind: 'ack', text: k('ack'), at: 615 },
    ],
    notes: [],
    pqrs: null,
    escalation: null,
    slaHandled: false,
  },
  {
    id: 'TCK-1052',
    brand: 'ceiba',
    channel: 'webchat',
    customer: 'Andrés Salazar',
    contact: 'Chat web · asociado',
    city: 'Neiva',
    subject: k('tickets.t12.subject'),
    category: 'general',
    priority: 'low',
    sentiment: 'neutral',
    language: 'es',
    status: 'open',
    assignee: 'ana',
    createdAt: -7 * DAY + 940,
    resolvedAt: null,
    tags: ['certificados'],
    messages: [
      { id: 't12m1', from: 'customer', text: k('tickets.t12.m1'), at: -7 * DAY + 940 },
      { id: 't12m2', from: 'agent', author: 'ana', text: k('tickets.t12.m2'), at: -7 * DAY + 990 },
    ],
    notes: [],
    pqrs: { type: 'peticion', radicado: 'PQRS-2026-0410', filedDay: -7 },
    escalation: null,
    slaHandled: false,
  },
];

/** Siguiente número de radicado PQRS de ejemplo. */
export const SEED_PQRS_SEQ = 419;

export const SEED_MACROS: Macro[] = [
  {
    id: 'm1',
    name: { k: 'macros.seed.m1' },
    conditions: [{ type: 'keyword', value: 'reembolso, refund' }],
    actions: [
      { type: 'tag', value: 'reembolso' },
      { type: 'priority', value: 'high' },
    ],
    auto: true,
    active: true,
    runs: 1,
  },
  {
    id: 'm2',
    name: { k: 'macros.seed.m2' },
    conditions: [{ type: 'category', value: 'cancel' }],
    actions: [
      { type: 'assign', value: 'maria' },
      { type: 'tag', value: 'retencion' },
    ],
    auto: true,
    active: true,
    runs: 1,
  },
  {
    id: 'm3',
    name: { k: 'macros.seed.m3' },
    conditions: [{ type: 'channel', value: 'whatsapp' }],
    actions: [{ type: 'ack' }],
    auto: true,
    active: true,
    runs: 3,
  },
  {
    id: 'm4',
    name: { k: 'macros.seed.m4' },
    conditions: [{ type: 'keyword', value: 'SIC' }],
    actions: [
      { type: 'priority', value: 'urgent' },
      { type: 'tag', value: 'riesgo-legal' },
    ],
    auto: true,
    active: true,
    runs: 1,
  },
];

/**
 * Registro de la respuesta automática para los tickets de ejemplo que llegaron
 * hoy. La confianza y el resultado son los que calculan `classify` y
 * `autoReplyDecision` con el texto en español (lo comprueba la prueba de
 * `engine`).
 */
export const SEED_AUTO_LOG: AutoLogEntry[] = [
  { id: 'l9', ticketId: 'TCK-1044', channel: 'messenger', category: 'orders', confidence: 0.8, result: 'notEligible', eligible: false, at: 622 },
  { id: 'l8', ticketId: 'TCK-1048', channel: 'email', category: 'billing', confidence: 0.6, result: 'notEligible', eligible: false, at: 620 },
  { id: 'l7', ticketId: 'TCK-1051', channel: 'whatsapp', category: 'account', confidence: 0.7, result: 'belowThreshold', eligible: true, at: 615 },
  { id: 'l6', ticketId: 'TCK-1047', channel: 'email', category: 'account', confidence: 0.7, result: 'notEligible', eligible: false, at: 612 },
  { id: 'l5', ticketId: 'TCK-1049', channel: 'webchat', category: 'orders', confidence: 0.9, result: 'sent', eligible: true, at: 605 },
  { id: 'l4', ticketId: 'TCK-1041', channel: 'whatsapp', category: 'billing', confidence: 0.9, result: 'notEligible', eligible: false, at: 602 },
  { id: 'l3', ticketId: 'TCK-1042', channel: 'voice', category: 'tech', confidence: 0.7, result: 'notEligible', eligible: false, at: 580 },
  { id: 'l2', ticketId: 'TCK-1046', channel: 'email', category: 'billing', confidence: 0.6, result: 'belowThreshold', eligible: true, at: 545 },
  { id: 'l1', ticketId: 'TCK-1043', channel: 'whatsapp', category: 'cancel', confidence: 0.7, result: 'notEligible', eligible: false, at: 535 },
];

export const SEED_SURVEYS: Survey[] = [
  { id: 's1', ticketId: 'TCK-1045', agent: 'ana', score: 5, nps: 10, comment: k('surveys.s1'), at: -DAY + 1000 },
  { id: 's2', ticketId: 'TCK-1031', agent: 'maria', score: 5, nps: 9, comment: '', at: -DAY + 700 },
  { id: 's3', ticketId: 'TCK-1029', agent: 'maria', score: 4, nps: 8, comment: '', at: -2 * DAY + 900 },
  { id: 's4', ticketId: 'TCK-1027', agent: 'carlos', score: 4, nps: 7, comment: '', at: -2 * DAY + 640 },
  { id: 's5', ticketId: 'TCK-1024', agent: 'luis', score: 3, nps: 6, comment: k('surveys.s5'), at: -3 * DAY + 820 },
  { id: 's6', ticketId: 'TCK-1022', agent: 'carlos', score: 5, nps: 9, comment: '', at: -4 * DAY + 600 },
  { id: 's7', ticketId: 'TCK-1019', agent: 'ana', score: 4, nps: 8, comment: '', at: -5 * DAY + 930 },
  { id: 's8', ticketId: 'TCK-1017', agent: 'luis', score: 4, nps: 7, comment: '', at: -5 * DAY + 610 },
  { id: 's9', ticketId: 'TCK-1015', agent: 'maria', score: 5, nps: 10, comment: k('surveys.s9'), at: -6 * DAY + 760 },
];

export const SEED_SETTINGS: Settings = { autoReplyOn: true, threshold: 0.8 };

/** Ejemplos para "Simular ticket entrante" (el texto se puede editar). */
export interface IncomingExample {
  id: string;
  channel: Channel;
  brand: BrandId;
  customer: string;
  contact: string;
  city: string;
}

export const INCOMING_EXAMPLES: IncomingExample[] = [
  { id: 'pse', channel: 'whatsapp', brand: 'moda', customer: 'Natalia Herrera', contact: '+57 312 *** 6610', city: 'Bogotá' },
  { id: 'outage', channel: 'voice', brand: 'conecta', customer: 'Óscar Patiño', contact: '+57 318 *** 2045', city: 'Yopal' },
  { id: 'tracking', channel: 'messenger', brand: 'moda', customer: 'Juliana Cárdenas', contact: 'Messenger · Juliana C.', city: 'Ibagué' },
  { id: 'password', channel: 'email', brand: 'ceiba', customer: 'Emily Carter', contact: 'em***@mail.example', city: 'Medellín' },
  { id: 'sic', channel: 'email', brand: 'conecta', customer: 'Gustavo Rincón', contact: 'gu***@correo.example', city: 'Cúcuta' },
  { id: 'cancel', channel: 'telegram', brand: 'conecta', customer: 'Paola Gutiérrez', contact: 'Telegram · @paogu', city: 'Santa Marta' },
];
