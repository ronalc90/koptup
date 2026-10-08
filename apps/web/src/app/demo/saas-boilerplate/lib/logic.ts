/**
 * Reglas de negocio de la demo (funciones puras): ingresos recurrentes,
 * límites del plan, prorrateo, etapas de cobro, aislamiento por cliente.
 */
import { DEMO_PERIOD, DEMO_TODAY, IVA_RATE, PLANS } from './data';
import { addDays, daysBetween, daysInMonth } from './format';
import type { DemoState, Member, PlanId, Tenant, TenantStatus } from './types';
import { STAFF_ROLES } from './types';

/** Suscripciones que cuentan en los ingresos recurrentes (las de prueba aún no pagan). */
const BILLABLE: TenantStatus[] = ['activo', 'mora'];

export function monthlyNet(t: Tenant): number {
  return PLANS[t.plan].price;
}

export function mrr(tenants: Tenant[]): number {
  return tenants.filter((t) => BILLABLE.includes(t.status)).reduce((s, t) => s + monthlyNet(t), 0);
}

export function atRisk(tenants: Tenant[]): number {
  return tenants.filter((t) => t.status === 'mora').reduce((s, t) => s + monthlyNet(t), 0);
}

/** Ingresos si todas las pruebas gratis de hoy pasan a pago. */
export function potentialMrr(tenants: Tenant[]): number {
  return mrr(tenants) + tenants.filter((t) => t.status === 'prueba').reduce((s, t) => s + monthlyNet(t), 0);
}

export function countBy(tenants: Tenant[], status: TenantStatus): number {
  return tenants.filter((t) => t.status === status).length;
}

export function newThisMonth(tenants: Tenant[]): number {
  return tenants.filter((t) => t.createdAt.startsWith(DEMO_PERIOD)).length;
}

export function churnThisMonth(tenants: Tenant[]): number {
  return tenants.filter((t) => t.cancelledAt?.startsWith(DEMO_PERIOD)).length;
}

export function collectedThisMonth(state: DemoState): number {
  return state.invoices.filter((i) => i.issuedAt.startsWith(DEMO_PERIOD)).reduce((s, i) => s + i.total, 0);
}

export function staffCount(members: Member[], tenantId: string): number {
  return members.filter((m) => m.tenantId === tenantId && STAFF_ROLES.includes(m.role)).length;
}

export function trialDaysLeft(t: Tenant): number {
  return t.trialEndsAt ? Math.max(0, daysBetween(DEMO_TODAY, t.trialEndsAt)) : 0;
}

export function withIva(subtotal: number) {
  const iva = Math.round(subtotal * IVA_RATE);
  return { subtotal, iva, total: subtotal + iva };
}

/** ¿Ya pagó el periodo actual? */
export function paidCurrentPeriod(state: DemoState, tenantId: string): boolean {
  return state.invoices.some((i) => i.tenantId === tenantId && i.period === DEMO_PERIOD && i.concept === 'subscription');
}

export function canCharge(state: DemoState, t: Tenant): boolean {
  return t.status !== 'cancelado' && !paidCurrentPeriod(state, t.id);
}

export type PlanChangeCheck =
  | { ok: true; kind: 'upgrade' | 'downgrade' | 'trial'; days: number; amount: number }
  | { ok: false; reason: 'same' | 'units' | 'staff' | 'storage' | 'status' };

/**
 * Valida un cambio de plan contra el uso actual y calcula el prorrateo del
 * resto del mes (días restantes incluyendo hoy / días del mes).
 */
export function checkPlanChange(state: DemoState, t: Tenant, to: PlanId): PlanChangeCheck {
  if (to === t.plan) return { ok: false, reason: 'same' };
  if (t.status === 'mora' || t.status === 'suspendido' || t.status === 'cancelado') return { ok: false, reason: 'status' };
  const plan = PLANS[to];
  if (t.units > plan.maxUnits) return { ok: false, reason: 'units' };
  if (staffCount(state.members, t.id) > plan.maxStaff) return { ok: false, reason: 'staff' };
  if (t.storageGb > plan.storageGb) return { ok: false, reason: 'storage' };
  const total = daysInMonth(DEMO_PERIOD);
  const days = total - Number(DEMO_TODAY.slice(8, 10)) + 1;
  if (t.status === 'prueba') return { ok: true, kind: 'trial', days, amount: 0 };
  const diff = plan.price - PLANS[t.plan].price;
  const amount = Math.round((Math.abs(diff) * days) / total);
  return { ok: true, kind: diff > 0 ? 'upgrade' : 'downgrade', days, amount };
}

/** Etapas del cobro fallido: días después del primer intento. */
export const DUNNING_DAYS = [0, 3, 7, 10] as const;

export function dunningDate(startedAt: string, stage: number): string {
  return addDays(startedAt.slice(0, 10), DUNNING_DAYS[stage]);
}

/** Subdominios que no se pueden usar. */
export const RESERVED_SLUGS = ['www', 'app', 'api', 'admin', 'soporte', 'mail', 'static', 'cdn', 'status'];

export type SlugError = 'format' | 'reserved' | 'taken' | null;

export function slugError(state: DemoState, slug: string): SlugError {
  if (!/^[a-z0-9](?:[a-z0-9-]{1,22}[a-z0-9])$/.test(slug)) return 'format';
  if (RESERVED_SLUGS.includes(slug)) return 'reserved';
  if (state.tenants.some((t) => t.slug === slug)) return 'taken';
  return null;
}

export function suggestedPlan(units: number): PlanId {
  if (units <= PLANS.pequeno.maxUnits) return 'pequeno';
  if (units <= PLANS.mediano.maxUnits) return 'mediano';
  return 'multi';
}

export function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim());
}

/** Luhn: valida el número de tarjeta (sin cobrar nada). */
export function luhnOk(card: string): boolean {
  const digits = card.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/** MM/AA vigente respecto a la fecha de corte de la demo. */
export function expiryOk(v: string): boolean {
  const m = v.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  const [cy, cm] = DEMO_PERIOD.split('-').map(Number);
  return year > cy || (year === cy && month >= cm);
}

/** Celular colombiano: 10 dígitos que empiezan por 3. */
export function mobileOk(v: string): boolean {
  return /^3\d{9}$/.test(v.replace(/\D/g, ''));
}

export type ResourceLookup =
  | { ok: true; kind: 'unit' | 'notice' | 'invoice'; ownerTenantId: string }
  | { ok: false; reason: 'forbidden'; ownerTenantId: string }
  | { ok: false; reason: 'not_found' };

/**
 * Busca un recurso para un cliente. La consulta SIEMPRE filtra por el cliente
 * de la sesión: un recurso de otro conjunto da "sin acceso", nunca sus datos.
 */
export function findResource(state: DemoState, tenantId: string, resourceId: string): ResourceLookup {
  const id = resourceId.trim();
  const owner =
    state.units.find((u) => u.id === id)?.tenantId ??
    state.notices.find((n) => n.id === id)?.tenantId ??
    state.invoices.find((i) => i.id === id || i.number === id)?.tenantId;
  if (!owner) return { ok: false, reason: 'not_found' };
  if (owner !== tenantId) return { ok: false, reason: 'forbidden', ownerTenantId: owner };
  const kind = state.units.some((u) => u.id === id) ? 'unit' : state.notices.some((n) => n.id === id) ? 'notice' : 'invoice';
  return { ok: true, kind, ownerTenantId: owner };
}

/** Uso de un cliente frente a su plan. */
export function usage(state: DemoState, t: Tenant) {
  const plan = PLANS[t.plan];
  return [
    { key: 'units' as const, value: t.units, max: plan.maxUnits, unit: '' },
    { key: 'staff' as const, value: staffCount(state.members, t.id), max: plan.maxStaff, unit: '' },
    { key: 'storage' as const, value: t.storageGb, max: plan.storageGb, unit: ' GB' },
  ];
}
