import { applyPatch, Filterable, findOrThrow, nextId, nowIso, paginate, softDelete } from '../_shared/crud';
import { DomainError, ListResult } from '../_shared/types';
import { plans as seedPlans, tenants as seedTenants } from './saas-platform.data';
import { Plan, Tenant } from './saas-platform.types';

export interface SaasPlatformService {
  list(q: Filterable & { planId?: string }): ListResult<Tenant>;
  get(id: string): Tenant;
  create(input: Partial<Tenant>): Tenant;
  update(id: string, patch: Partial<Tenant>): Tenant;
  remove(id: string): { id: string };
  listPlans(): ReadonlyArray<Plan>;
  changePlan(tenantId: string, planId: string): Tenant;
}

export class InMemorySaasPlatformService implements SaasPlatformService {
  private tenants: Tenant[] = [...seedTenants];
  private plans: Plan[] = [...seedPlans];

  list(q: Filterable & { planId?: string }): ListResult<Tenant> {
    const base = paginate(this.tenants, q, (t, n) => t.name.toLowerCase().includes(n) || t.subdomain.toLowerCase().includes(n));
    const items = q.planId ? base.items.filter((t) => t.planId === q.planId) : base.items;
    return { ...base, items };
  }
  get(id: string): Tenant { return findOrThrow(this.tenants, id, 'Tenant'); }

  create(input: Partial<Tenant>): Tenant {
    if (!input.name || !input.subdomain || !input.ownerEmail) {
      throw new DomainError('VALIDATION', 'name, subdomain, ownerEmail requeridos');
    }
    if (this.tenants.find((t) => t.subdomain === input.subdomain && !t.deletedAt)) {
      throw new DomainError('CONFLICT', 'subdomain ya existe');
    }
    const planId = input.planId ?? 'plan_trial';
    if (!this.plans.find((p) => p.id === planId)) throw new DomainError('VALIDATION', `Plan ${planId} inválido`);
    const t: Tenant = {
      id: nextId('tnt'),
      name: input.name,
      subdomain: input.subdomain,
      planId,
      status: input.status ?? 'trial',
      seats: input.seats ?? 1,
      region: input.region ?? 'us-east-1',
      ownerEmail: input.ownerEmail,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.tenants.push(t);
    return t;
  }

  update(id: string, patch: Partial<Tenant>): Tenant {
    const idx = this.tenants.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Tenant ${id}`);
    this.tenants[idx] = applyPatch(this.tenants[idx], patch);
    return this.tenants[idx];
  }
  remove(id: string): { id: string } {
    const idx = this.tenants.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Tenant ${id}`);
    this.tenants[idx] = softDelete(this.tenants[idx]);
    return { id };
  }

  listPlans(): ReadonlyArray<Plan> { return this.plans; }

  changePlan(tenantId: string, planId: string): Tenant {
    const plan = this.plans.find((p) => p.id === planId);
    if (!plan) throw new DomainError('VALIDATION', `Plan ${planId} no existe`);
    const tenant = findOrThrow(this.tenants, tenantId, 'Tenant');
    if (tenant.seats > plan.seatLimit) {
      throw new DomainError('CONFLICT', `Seats actuales (${tenant.seats}) exceden límite (${plan.seatLimit})`);
    }
    return this.update(tenantId, { planId });
  }
}

export const saasPlatformService: SaasPlatformService = new InMemorySaasPlatformService();
