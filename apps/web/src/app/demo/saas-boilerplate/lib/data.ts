/**
 * Datos de ejemplo de la demo. Todo es ficticio: el SaaS "ConjuntoDemo", sus
 * clientes, personas, NIT, correos (dominio reservado .example) e IP (rangos
 * de documentación RFC 5737). Fecha de corte fija: 8 de octubre de 2026.
 */
import type {
  AuditEntry, DemoState, Invoice, Member, ModuleId, Notice, Plan, PlanId, Reservation, Tenant, Unit, WebhookEvent,
} from './types';
import { stableHash } from './format';

export const DEMO_TODAY = '2026-10-08';
export const DEMO_PERIOD = '2026-10';
export const DEMO_START_CLOCK = '2026-10-08T09:00';
export const TRIAL_DAYS = 14;
export const IVA_RATE = 0.19;
export const STORAGE_KEY = 'demo:saas-boilerplate:v1';
export const BASE_DOMAIN = 'conjuntodemo.example';
export const CONTACT_HREF = '/contact?service=saas-multi-tenant';

/** El SaaS ficticio que vende el software (tu empresa, en tu proyecto). */
export const VENDOR = {
  name: 'ConjuntoDemo S.A.S.',
  product: 'ConjuntoDemo',
  nit: '901482736',
  city: 'Bogotá D.C.',
  email: 'facturacion@conjuntodemo.example',
};

export const PLANS: Record<PlanId, Plan> = {
  pequeno: { id: 'pequeno', price: 149000, maxUnits: 80, maxStaff: 3, storageGb: 5, modules: ['pagos'] },
  mediano: { id: 'mediano', price: 290000, maxUnits: 300, maxStaff: 10, storageGb: 20, modules: ['pagos', 'reservas', 'votaciones'] },
  multi: { id: 'multi', price: 590000, maxUnits: 1500, maxStaff: 30, storageGb: 100, modules: ['pagos', 'reservas', 'votaciones'] },
};

export const CITIES = [
  'Bogotá D.C.', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Floridablanca', 'Pereira',
  'Manizales', 'Villavicencio', 'Chía', 'Envigado', 'El Retiro', 'Santa Marta', 'Ibagué', 'Cúcuta',
];

export const BRAND_COLORS = ['#2563eb', '#16a34a', '#b45309', '#7c3aed', '#db2777', '#0f766e'];

/** Bancos ficticios para el pago PSE simulado. */
export const DEMO_BANKS = ['Banco Cordillera', 'Banco Pacífico Andino', 'Cooperativa Financiera Altiplano', 'Banco Llanero Digital'];

export const ZONES = ['salon', 'bbq', 'piscina', 'cancha'] as const;
export type ZoneId = (typeof ZONES)[number];

/** Secreto de ejemplo para el segundo factor (TOTP, RFC 6238). Solo para la demo. */
export const DEMO_TOTP_SECRET = 'JBSWY3DPEHPK3PXP';
/** Secreto de ejemplo con el que la demo firma los webhooks (HMAC SHA-256). */
export const DEMO_WEBHOOK_SECRET = 'whsec_demo_conjuntodemo';

/** Ingresos recurrentes mensuales de meses anteriores (COP, datos de ejemplo). */
export const MRR_HISTORY: { period: string; mrr: number }[] = [
  { period: '2026-05', mrr: 588000 },
  { period: '2026-06', mrr: 588000 },
  { period: '2026-07', mrr: 588000 },
  { period: '2026-08', mrr: 588000 },
  { period: '2026-09', mrr: 1178000 },
];

export function apiKeyFor(slug: string): string {
  return `ck_test_${slug}_${stableHash(slug).toString(16).padStart(8, '0').slice(0, 8)}`;
}

export function moduleAllowed(plan: PlanId, m: ModuleId): boolean {
  return PLANS[plan].modules.includes(m);
}

const SEED_TENANTS: Tenant[] = [
  {
    id: 't-arrayanes', name: 'Conjunto Arrayanes de Suba', slug: 'arrayanes', city: 'Bogotá D.C.', nit: '900731245',
    email: 'administracion@arrayanes.example', plan: 'mediano', status: 'activo', units: 240, storageGb: 8.4,
    color: '#2563eb', createdAt: '2025-11-03', modules: ['pagos', 'reservas', 'votaciones'],
    sso: { google: true, microsoft: false, mfa: true }, fee: 285000,
  },
  {
    id: 't-laureles', name: 'Edificio Mirador de Laureles', slug: 'miradorlaureles', city: 'Medellín', nit: '901118342',
    email: 'admin@miradorlaureles.example', plan: 'pequeno', status: 'mora', units: 64, storageGb: 2.1,
    color: '#16a34a', createdAt: '2026-02-14', modules: ['pagos'],
    sso: { google: false, microsoft: false, mfa: false }, fee: 340000,
  },
  {
    id: 't-guayacanes', name: 'Condominio Campestre Los Guayacanes', slug: 'guayacanes', city: 'El Retiro', nit: '901602587',
    email: 'gerencia@guayacanes.example', plan: 'mediano', status: 'prueba', units: 96, storageGb: 0.6,
    color: '#b45309', createdAt: '2026-10-01', trialEndsAt: '2026-10-15', modules: ['pagos', 'reservas'],
    sso: { google: true, microsoft: true, mfa: false }, fee: 520000,
  },
  {
    id: 't-oriente', name: 'Administraciones del Oriente S.A.S.', slug: 'adminoriente', city: 'Floridablanca', nit: '900984421',
    email: 'operaciones@adminoriente.example', plan: 'multi', status: 'activo', units: 1120, storageGb: 31.5,
    color: '#7c3aed', createdAt: '2026-08-20', modules: ['pagos', 'reservas', 'votaciones'],
    sso: { google: false, microsoft: true, mfa: true }, fee: 198000,
  },
  {
    id: 't-palmas', name: 'Edificio Palmas del Norte', slug: 'palmasnorte', city: 'Barranquilla', nit: '901276650',
    email: 'admin@palmasnorte.example', plan: 'pequeno', status: 'cancelado', units: 48, storageGb: 1.2,
    color: '#0891b2', createdAt: '2025-12-10', cancelledAt: '2026-10-02', modules: ['pagos'],
    sso: { google: false, microsoft: false, mfa: false }, fee: 260000,
  },
];

const SEED_MEMBERS: Member[] = [
  { id: 'm-1', tenantId: 't-arrayanes', name: 'Luz Marina Rojas', email: 'luz.rojas@arrayanes.example', role: 'admin', status: 'activo' },
  { id: 'm-2', tenantId: 't-arrayanes', name: 'Jorge Andrés Peña', email: 'contabilidad@arrayanes.example', role: 'contador', status: 'activo' },
  { id: 'm-3', tenantId: 't-arrayanes', name: 'Portería Torre 1', email: 'porteria@arrayanes.example', role: 'porteria', status: 'activo' },
  { id: 'm-4', tenantId: 't-arrayanes', name: 'Sandra Milena Ortiz', email: 'sandra.ortiz@correo.example', role: 'residente', status: 'activo' },
  { id: 'm-5', tenantId: 't-arrayanes', name: '', email: 'revisoria@arrayanes.example', role: 'contador', status: 'invitado', invitedAt: '2026-10-06T09:12', resent: 0 },
  { id: 'm-6', tenantId: 't-laureles', name: 'Diana Patricia Gómez', email: 'admin@miradorlaureles.example', role: 'admin', status: 'activo' },
  { id: 'm-7', tenantId: 't-laureles', name: 'Portería Mirador', email: 'porteria@miradorlaureles.example', role: 'porteria', status: 'activo' },
  { id: 'm-8', tenantId: 't-laureles', name: 'Felipe Arango', email: 'felipe.arango@correo.example', role: 'residente', status: 'activo' },
  { id: 'm-9', tenantId: 't-guayacanes', name: 'Ricardo León Mejía', email: 'gerencia@guayacanes.example', role: 'admin', status: 'activo' },
  { id: 'm-10', tenantId: 't-guayacanes', name: '', email: 'contabilidad@guayacanes.example', role: 'contador', status: 'invitado', invitedAt: '2026-10-02T15:40', resent: 0 },
  { id: 'm-11', tenantId: 't-oriente', name: 'Martha Cecilia Vargas', email: 'martha.vargas@adminoriente.example', role: 'admin', status: 'activo' },
  { id: 'm-12', tenantId: 't-oriente', name: 'Óscar Iván Rueda', email: 'oscar.rueda@adminoriente.example', role: 'contador', status: 'activo' },
  { id: 'm-13', tenantId: 't-oriente', name: 'Yolanda Prada', email: 'yolanda.prada@adminoriente.example', role: 'admin', status: 'activo' },
  { id: 'm-14', tenantId: 't-oriente', name: 'Portería Cañahuate', email: 'porteria.canahuate@adminoriente.example', role: 'porteria', status: 'activo' },
  { id: 'm-15', tenantId: 't-palmas', name: 'Héctor Fabio Lozano', email: 'admin@palmasnorte.example', role: 'admin', status: 'activo' },
];

function inv(n: number, tenantId: string, plan: PlanId, period: string, issuedAt: string, method: Invoice['method']): Invoice {
  const subtotal = PLANS[plan].price;
  const iva = Math.round(subtotal * IVA_RATE);
  return { id: `inv-${n}`, number: `CD-${n}`, tenantId, period, issuedAt, gross: subtotal, discount: 0, subtotal, iva, total: subtotal + iva, method, concept: 'subscription', plan };
}

const SEED_INVOICES: Invoice[] = [
  inv(1036, 't-arrayanes', 'mediano', '2026-09', '2026-09-01T07:00', 'tarjeta'),
  inv(1037, 't-laureles', 'pequeno', '2026-09', '2026-09-01T07:02', 'pse'),
  inv(1038, 't-palmas', 'pequeno', '2026-09', '2026-09-01T07:04', 'tarjeta'),
  inv(1039, 't-oriente', 'multi', '2026-09', '2026-09-03T07:00', 'pse'),
  inv(1040, 't-arrayanes', 'mediano', '2026-10', '2026-10-01T07:00', 'tarjeta'),
  inv(1041, 't-oriente', 'multi', '2026-10', '2026-10-03T07:00', 'nequi'),
];

const SYS = 'sistema';
const SEED_AUDIT: AuditEntry[] = [
  { id: 'a-1', at: '2026-10-01T07:00', actor: SYS, tenantId: 't-arrayanes', action: 'invoice.paid', params: { number: 'CD-1040' }, ip: '—' },
  { id: 'a-2', at: '2026-10-01T08:30', actor: 'ventas@conjuntodemo.example', tenantId: 't-guayacanes', action: 'tenant.created', params: {}, ip: '203.0.113.24' },
  { id: 'a-3', at: '2026-10-02T11:05', actor: 'soporte@conjuntodemo.example', tenantId: 't-palmas', action: 'tenant.cancelled', params: {}, ip: '203.0.113.24' },
  { id: 'a-4', at: '2026-10-03T07:00', actor: SYS, tenantId: 't-oriente', action: 'invoice.paid', params: { number: 'CD-1041' }, ip: '—' },
  { id: 'a-5', at: '2026-10-05T07:00', actor: SYS, tenantId: 't-laureles', action: 'payment.failed', params: {}, ip: '—' },
  { id: 'a-6', at: '2026-10-05T07:01', actor: SYS, tenantId: 't-laureles', action: 'dunning.reminder', params: { day: '0' }, ip: '—' },
  { id: 'a-7', at: '2026-10-06T09:12', actor: 'luz.rojas@arrayanes.example', tenantId: 't-arrayanes', action: 'member.invited', params: { email: 'revisoria@arrayanes.example' }, ip: '198.51.100.7' },
  { id: 'a-8', at: '2026-10-07T16:42', actor: 'martha.vargas@adminoriente.example', tenantId: 't-oriente', action: 'auth.login', params: { method: 'microsoft' }, ip: '198.51.100.63' },
  { id: 'a-9', at: '2026-10-08T07:00', actor: SYS, tenantId: 't-laureles', action: 'dunning.reminder', params: { day: '3' }, ip: '—' },
];

const SEED_WEBHOOKS: WebhookEvent[] = [
  { id: 'evt_0001', type: 'invoice.paid', tenantId: 't-arrayanes', at: '2026-10-01T07:00', data: { invoice: 'CD-1040', total: 345100, currency: 'COP', method: 'tarjeta' } },
  { id: 'evt_0002', type: 'tenant.created', tenantId: 't-guayacanes', at: '2026-10-01T08:30', data: { plan: 'mediano', trial_ends_at: '2026-10-15' } },
  { id: 'evt_0003', type: 'invoice.paid', tenantId: 't-oriente', at: '2026-10-03T07:00', data: { invoice: 'CD-1041', total: 702100, currency: 'COP', method: 'nequi' } },
  { id: 'evt_0004', type: 'payment.failed', tenantId: 't-laureles', at: '2026-10-05T07:00', data: { period: '2026-10', amount: 177310, currency: 'COP', reason: 'fondos_insuficientes' } },
];

const SEED_NOTICES: Notice[] = [
  { id: 'n-1', tenantId: 't-arrayanes', title: '', body: '', at: '2026-10-06T08:00', seedKey: 'ascensores' },
  { id: 'n-2', tenantId: 't-arrayanes', title: '', body: '', at: '2026-09-28T18:30', seedKey: 'asamblea' },
  { id: 'n-3', tenantId: 't-laureles', title: '', body: '', at: '2026-10-04T10:00', seedKey: 'fumigacion' },
  { id: 'n-4', tenantId: 't-guayacanes', title: '', body: '', at: '2026-10-01T09:00', seedKey: 'bienvenida' },
  { id: 'n-5', tenantId: 't-oriente', title: '', body: '', at: '2026-10-07T07:30', seedKey: 'agua' },
];

const OWNERS = [
  'Ana Lucía Herrera', 'Juan Camilo Restrepo', 'María Fernanda Castro', 'Andrés Felipe Molina', 'Claudia Patricia Ríos',
  'Luis Eduardo Salazar', 'Paola Andrea Muñoz', 'Germán Alberto Ospina', 'Natalia Cárdenas', 'Diego Alejandro Pardo',
  'Liliana Becerra', 'Sergio Iván Quintero',
];

const UNIT_LABELS: Record<string, string[]> = {
  't-arrayanes': ['T1-101', 'T1-102', 'T2-302', 'T2-405', 'T3-504', 'T4-1201'],
  't-laureles': ['201', '302', '401', '501', '702', '801'],
  't-guayacanes': ['Casa 3', 'Casa 7', 'Casa 12', 'Casa 18', 'Casa 25', 'Casa 31'],
  't-oriente': ['Cañahuate 101', 'Cañahuate 204', 'Guaduales 302', 'Guaduales 410', 'Altamira 503', 'Altamira 607'],
  't-palmas': ['101', '201', '301', '401', '501', '601'],
};

/** Unidades de ejemplo de un cliente (6 por cliente; deterministas). */
export function unitsFor(tenant: Pick<Tenant, 'id' | 'slug'>, labels?: string[]): Unit[] {
  const list = labels ?? UNIT_LABELS[tenant.id] ?? ['101', '102', '201', '202', '301', '302'];
  const h = stableHash(tenant.slug);
  return list.map((label, i) => ({
    id: `u-${tenant.slug}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '')}`,
    tenantId: tenant.id,
    label,
    owner: OWNERS[(h + i * 5) % OWNERS.length],
    paid: ((h >> i) & 3) !== 0,
  }));
}

const SEED_RESERVATIONS: Reservation[] = [
  { id: 'r-1', tenantId: 't-arrayanes', zone: 'salon', date: '2026-10-10', unit: 'T2-302' },
  { id: 'r-2', tenantId: 't-arrayanes', zone: 'bbq', date: '2026-10-11', unit: 'T1-101' },
  { id: 'r-3', tenantId: 't-guayacanes', zone: 'piscina', date: '2026-10-12', unit: 'Casa 7' },
  { id: 'r-4', tenantId: 't-oriente', zone: 'cancha', date: '2026-10-09', unit: 'Guaduales 302' },
];

export function defaultState(): DemoState {
  return {
    screen: 'dashboard',
    tenants: SEED_TENANTS.map((t) => ({ ...t, modules: [...t.modules], sso: { ...t.sso } })),
    members: SEED_MEMBERS.map((m) => ({ ...m })),
    invoices: SEED_INVOICES.map((i) => ({ ...i })),
    dunning: [{ tenantId: 't-laureles', period: '2026-10', stage: 1, startedAt: '2026-10-05T07:00' }],
    audit: SEED_AUDIT.map((a) => ({ ...a, params: { ...a.params } })),
    webhooks: SEED_WEBHOOKS.map((w) => ({ ...w, data: { ...w.data } })),
    notices: SEED_NOTICES.map((n) => ({ ...n })),
    units: SEED_TENANTS.flatMap((t) => unitsFor(t)),
    reservations: SEED_RESERVATIONS.map((r) => ({ ...r })),
    votes: {
      't-arrayanes': { si: 86, no: 31, abst: 12, voted: false },
      't-oriente': { si: 412, no: 120, abst: 44, voted: false },
    },
    impersonation: null,
    clock: DEMO_START_CLOCK,
    seq: 100,
    invoiceSeq: 1042,
    selected: { billing: 't-guayacanes', access: 't-arrayanes', portal: 't-arrayanes', operations: 't-arrayanes' },
    tour: { dashboard: false, onboarding: false, payment: false, portal: false, support: false },
    tourHidden: false,
    progress: { pseInvoice: null, invoiceOpened: false, portalCustom: false, isolationTested: false },
  };
}
