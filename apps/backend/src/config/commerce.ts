/**
 * commerce.ts — constantes del pipeline comercial y de las propuestas
 * (etapas 8–10 del flujo del cliente; wiki 03, 05 §8–9 y 04 DECISIÓN 14).
 *
 * Todo permiso se verifica en el servidor con el rol leído de la BD
 * (middleware/access.ts → requireRole).
 */

// ---------------------------------------------------------------------------
//   Leads
// ---------------------------------------------------------------------------

/** Etapas del pipeline. `ganado` y `perdido` son finales en el tablero. */
export const LEAD_STAGES = ['nuevo', 'contactado', 'demo', 'propuesta', 'ganado', 'perdido'] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

/** Orden de avance automático (perdido queda fuera: lo decide el equipo). */
export const LEAD_STAGE_ORDER: Readonly<Record<LeadStage, number>> = {
  nuevo: 0,
  contactado: 1,
  demo: 2,
  propuesta: 3,
  ganado: 4,
  perdido: -1,
};

/** Motivos de pérdida (obligatorio al pasar a `perdido`). */
export const LEAD_LOST_REASONS = ['precio', 'tiempo', 'eligio_otro', 'sin_presupuesto', 'sin_respuesta', 'fuera_de_perfil', 'otro'] as const;
export type LeadLostReason = (typeof LEAD_LOST_REASONS)[number];

/**
 * Origen del lead. Los tres primeros son los `Contact.source` existentes;
 * `portal` es una solicitud desde el portal (p. ej. "Solicitar propuesta"),
 * `invitacion` una invitación directa a demos y `manual` lo crea el equipo.
 */
export const LEAD_SOURCES = ['contact-form', 'demo-rag', 'demo-request', 'portal', 'invitacion', 'manual'] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

/** Tipos de actividad de la línea de tiempo del lead. */
export const LEAD_ACTIVITY_TYPES = [
  'nota',
  'llamada',
  'email',
  'whatsapp',
  'reunion',
  'tarea',
  'cambio_etapa',
  'propuesta',
  'solicitud_propuesta',
  'sistema',
] as const;
export type LeadActivityType = (typeof LEAD_ACTIVITY_TYPES)[number];

/** Tipos que el equipo registra a mano (el resto los crea el sistema). */
export const LEAD_MANUAL_ACTIVITY_TYPES = ['nota', 'llamada', 'email', 'whatsapp', 'reunion', 'tarea'] as const;

/** Clase de tarea creada por "Solicitar propuesta" (una abierta por lead). */
export const TASK_PREPARE_PROPOSAL = 'preparar_propuesta';

/** Permisos (wiki 05 §4.3): leer admin/sales/manager; gestionar admin/sales. */
export const LEAD_READ_ROLES = ['admin', 'sales', 'manager'] as const;
export const LEAD_MANAGE_ROLES = ['admin', 'sales'] as const;
/** Quién puede ser responsable de un lead. */
export const LEAD_OWNER_ROLES = ['admin', 'sales', 'manager'] as const;

// ---------------------------------------------------------------------------
//   Propuestas
// ---------------------------------------------------------------------------

export const PROPOSAL_STATES = ['borrador', 'enviada', 'vista', 'aceptada', 'rechazada', 'vencida', 'convertida'] as const;
export type ProposalState = (typeof PROPOSAL_STATES)[number];
/** Estados en los que el cliente todavía puede aceptar o rechazar (si está vigente). */
export const PROPOSAL_OPEN_STATES: readonly ProposalState[] = ['enviada', 'vista'];

export const CURRENCIES = ['COP', 'USD'] as const;
export type Currency = (typeof CURRENCIES)[number];

/** IVA de Colombia (opcional por propuesta: "más IVA si aplica"). */
export const IVA_PCT = 19;
/** TRM de referencia (COP por 1 USD) para el catálogo; los planes RAG tienen USD fijos. */
export const TRM_REFERENCIA_DEFAULT = 3300;
export const FX_RATE_MIN = 1000;
export const FX_RATE_MAX = 20000;

export const DEFAULT_PROPOSAL_VALIDITY_DAYS = 30;
export const MAX_PROPOSAL_VALIDITY_DAYS = 180;
export const DEFAULT_DEPOSIT_PCT = 50;

/** Tipos de ítem: plan RAG, producto del catálogo o línea libre. */
export const PROPOSAL_ITEM_TYPES = ['plan_rag', 'producto', 'personalizado'] as const;
export type ProposalItemType = (typeof PROPOSAL_ITEM_TYPES)[number];

/**
 * Modalidad de un ítem (wiki 02, DECISIÓN 7): la suscripción solo existe en
 * los planes RAG; los productos del catálogo se venden como `compra` (setup
 * + mantenimiento opcional). `saas` en un producto del catálogo se rechaza
 * ("SaaS: lista de espera").
 */
export const PROPOSAL_MODALITIES = ['piloto', 'suscripcion', 'compra', 'saas', 'servicio'] as const;
export type ProposalModality = (typeof PROPOSAL_MODALITIES)[number];

export const PAYMENT_STATES = ['pendiente', 'recibido'] as const;
export const PAYMENT_PROVIDERS = ['transferencia', 'enlace', 'wompi', 'otro'] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

/** Días de acceso de referencia a las demos tras convertir (wiki 03 §10). */
export const CONVERTED_GRANT_DAYS = 90;

/**
 * Permisos (wiki 05 §9): admin y sales crean, editan, envían y ven;
 * confirmar el anticipo y convertir son solo del admin.
 */
export const PROPOSAL_READ_ROLES = ['admin', 'sales'] as const;
export const PROPOSAL_MANAGE_ROLES = ['admin', 'sales'] as const;
export const PROPOSAL_PAYMENT_ROLES = ['admin'] as const;
export const PROPOSAL_CONVERT_ROLES = ['admin'] as const;

/** Configuración comercial: la leen admin/sales/manager; solo el admin la cambia. */
export const SETTINGS_READ_ROLES = ['admin', 'sales', 'manager'] as const;
export const SETTINGS_WRITE_ROLES = ['admin'] as const;

/** Cuentas externas que pueden pedir propuesta y ver las suyas en el portal. */
export const PORTAL_ROLES = ['prospect', 'client', 'user'] as const;
