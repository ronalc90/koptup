/**
 * Smoke test módulo HRMS: valida CRUD básico del service in-memory.
 */
import { hrmsService } from '../hrms.service';

describe('HRMS module', () => {
  it('lista employees con resultados', () => {
    const r = hrmsService.list({});
    expect(r.total).toBeGreaterThan(0);
    expect(r.items.length).toBeGreaterThan(0);
  });

  it('obtiene un employee conocido', () => {
    const first = hrmsService.list({}).items[0];
    const found = hrmsService.get(first.id);
    expect(found.id).toBe(first.id);
  });

  it('lista candidates', () => {
    const candidates = hrmsService.listCandidates({});
    expect(candidates.total).toBeGreaterThanOrEqual(0);
  });
});
