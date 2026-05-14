/**
 * Smoke test módulo SaaS Platform (boilerplate): valida CRUD básico.
 */
import { saasPlatformService } from '../saas-platform.service';

describe('SaaS Platform module', () => {
  it('lista tenants con resultados', () => {
    const r = saasPlatformService.list({});
    expect(r.total).toBeGreaterThan(0);
    expect(r.items.length).toBeGreaterThan(0);
  });

  it('obtiene un tenant conocido', () => {
    const first = saasPlatformService.list({}).items[0];
    const found = saasPlatformService.get(first.id);
    expect(found.id).toBe(first.id);
  });

  it('lista plans', () => {
    const plans = saasPlatformService.listPlans();
    expect(plans.length).toBeGreaterThan(0);
  });
});
