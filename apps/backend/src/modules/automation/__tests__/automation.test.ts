/**
 * Smoke test módulo Automation: valida CRUD básico del service in-memory.
 */
import { automationService } from '../automation.service';

describe('Automation module', () => {
  it('lista workflows con resultados', () => {
    const r = automationService.list({});
    expect(r.total).toBeGreaterThan(0);
    expect(r.items.length).toBeGreaterThan(0);
  });

  it('obtiene un workflow conocido', () => {
    const first = automationService.list({}).items[0];
    const found = automationService.get(first.id);
    expect(found.id).toBe(first.id);
  });

  it('lista runs', () => {
    const runs = automationService.listRuns({});
    expect(runs.total).toBeGreaterThanOrEqual(0);
  });
});
