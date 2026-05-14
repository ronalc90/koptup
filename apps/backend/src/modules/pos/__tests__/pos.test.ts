/**
 * Smoke test módulo POS: valida CRUD básico del service in-memory.
 */
import { posService } from '../pos.service';

describe('POS module', () => {
  it('lista pos-orders con resultados', () => {
    const r = posService.list({});
    expect(r.total).toBeGreaterThan(0);
    expect(r.items.length).toBeGreaterThan(0);
  });

  it('obtiene una pos-order conocida', () => {
    const first = posService.list({}).items[0];
    const found = posService.get(first.id);
    expect(found.id).toBe(first.id);
  });

  it('lista payments', () => {
    const payments = posService.listPayments({});
    expect(payments.total).toBeGreaterThanOrEqual(0);
  });
});
