/**
 * Tipos de la demo "Plataforma SaaS multi-tenant".
 *
 * Caso ficticio: ConjuntoDemo, un software de administración de propiedad
 * horizontal que se vende por suscripción a conjuntos y edificios. Cada
 * conjunto es un tenant (cliente) con sus datos aislados.
 */

export const SCREENS = ['dashboard', 'onboarding', 'billing', 'access', 'portal', 'operations'] as const;
export type Screen = (typeof SCREENS)[number];

export type PlanId = 'pequeno' | 'mediano' | 'multi';
export const PLAN_IDS: PlanId[] = ['pequeno', 'mediano', 'multi'];

/** Módulos del portal que el dueño del SaaS activa por cliente. */
export type ModuleId = 'pagos' | 'reservas' | 'votaciones';
export const MODULE_IDS: ModuleId[] = ['pagos', 'reservas', 'votaciones'];

export type TenantStatus = 'activo' | 'prueba' | 'mora' | 'suspendido' | 'cancelado';
export const TENANT_STATUSES: TenantStatus[] = ['activo', 'prueba', 'mora', 'suspendido', 'cancelado'];

export type Role = 'admin' | 'contador' | 'porteria' | 'residente';
export const ROLES: Role[] = ['admin', 'contador', 'porteria', 'residente'];
/** Roles que cuentan como "usuarios del equipo" contra el límite del plan. */
export const STAFF_ROLES: Role[] = ['admin', 'contador', 'porteria'];

export type PayMethod = 'tarjeta' | 'pse' | 'nequi';
export const PAY_METHODS: PayMethod[] = ['tarjeta', 'pse', 'nequi'];

export interface Plan {
  id: PlanId;
  /** Precio mensual en COP, antes de IVA. */
  price: number;
  maxUnits: number;
  maxStaff: number;
  storageGb: number;
  modules: ModuleId[];
}

export interface Tenant {
  id: string;
  name: string;
  /** Subdominio: <slug>.conjuntodemo.example */
  slug: string;
  city: string;
  /** NIT sin dígito de verificación (se calcula). */
  nit: string;
  email: string;
  plan: PlanId;
  status: TenantStatus;
  units: number;
  storageGb: number;
  color: string;
  /** data URL de una imagen subida por ti (opcional). */
  logo?: string;
  /** Fecha ISO (YYYY-MM-DD). */
  createdAt: string;
  trialEndsAt?: string;
  cancelledAt?: string;
  modules: ModuleId[];
  sso: { google: boolean; microsoft: boolean; mfa: boolean };
  /** Cuota de administración mensual por unidad, en COP (dato de ejemplo del portal). */
  fee: number;
  /** true si la creaste tú en la demo. */
  custom?: boolean;
  /** Saldo a favor (COP) por bajar de plan: se descuenta en la próxima factura. */
  credit?: number;
}

export interface Member {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: Role;
  status: 'activo' | 'invitado';
  /** Fecha y hora de la última invitación (demo). */
  invitedAt?: string;
  resent?: number;
}

export interface Invoice {
  id: string;
  /** Consecutivo con prefijo, p. ej. CD-1041. */
  number: string;
  tenantId: string;
  /** Periodo facturado (YYYY-MM). */
  period: string;
  /** Fecha y hora de emisión (YYYY-MM-DDTHH:mm). */
  issuedAt: string;
  subtotal: number;
  iva: number;
  total: number;
  method: PayMethod;
  concept: 'subscription' | 'proration';
  plan: PlanId;
  /** Precio del plan o del ajuste antes del descuento. */
  gross: number;
  /** Saldo a favor aplicado (COP). */
  discount: number;
}

export type DunningStage = 0 | 1 | 2 | 3;
/** Cobro fallido en curso: etapas día 0, 3, 7 y suspensión (día 10). */
export interface DunningCase {
  tenantId: string;
  period: string;
  stage: DunningStage;
  startedAt: string;
}

export type AuditAction =
  | 'tenant.created'
  | 'tenant.plan_changed'
  | 'tenant.suspended'
  | 'tenant.reactivated'
  | 'tenant.cancelled'
  | 'invoice.paid'
  | 'payment.failed'
  | 'payment.rejected'
  | 'dunning.reminder'
  | 'member.invited'
  | 'member.invite_resent'
  | 'member.invite_revoked'
  | 'member.joined'
  | 'member.role_changed'
  | 'auth.login'
  | 'auth.login_denied'
  | 'auth.settings_changed'
  | 'module.toggled'
  | 'support.impersonation_started'
  | 'support.impersonation_ended'
  | 'notice.published'
  | 'portal.access_denied'
  | 'api.request';

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  tenantId: string | null;
  action: AuditAction;
  /** Valores para la plantilla de descripción (nombres, planes, motivos…). */
  params?: Record<string, string>;
  ip: string;
}

export type WebhookType = 'tenant.created' | 'tenant.updated' | 'invoice.paid' | 'payment.failed' | 'member.invited' | 'notice.published';

export interface WebhookEvent {
  id: string;
  type: WebhookType;
  tenantId: string;
  at: string;
  data: Record<string, string | number | boolean>;
}

export interface Notice {
  id: string;
  tenantId: string;
  title: string;
  body: string;
  at: string;
  /** Clave de texto de ejemplo (si viene de la semilla) para traducirlo. */
  seedKey?: string;
}

export interface Unit {
  id: string;
  tenantId: string;
  label: string;
  owner: string;
  paid: boolean;
}

export interface Reservation {
  id: string;
  tenantId: string;
  zone: string;
  date: string;
  unit: string;
}

export interface Impersonation {
  tenantId: string;
  reason: string;
  startedAt: string;
}

export type TourStep = 'dashboard' | 'onboarding' | 'payment' | 'portal' | 'support';
export const TOUR_STEPS: TourStep[] = ['dashboard', 'onboarding', 'payment', 'portal', 'support'];

export interface DemoState {
  screen: Screen;
  tenants: Tenant[];
  members: Member[];
  invoices: Invoice[];
  dunning: DunningCase[];
  audit: AuditEntry[];
  webhooks: WebhookEvent[];
  notices: Notice[];
  units: Unit[];
  reservations: Reservation[];
  votes: Record<string, { si: number; no: number; abst: number; voted: boolean }>;
  impersonation: Impersonation | null;
  /** Reloj de la demo (YYYY-MM-DDTHH:mm): avanza un minuto con cada acción. */
  clock: string;
  seq: number;
  invoiceSeq: number;
  /** Cliente seleccionado en cada pantalla. */
  selected: { billing: string; access: string; portal: string; operations: string };
  tour: Record<TourStep, boolean>;
  tourHidden: boolean;
  /** Progreso del paso 3 y 4 del recorrido. */
  progress: { pseInvoice: string | null; invoiceOpened: boolean; portalCustom: boolean; isolationTested: boolean };
}
