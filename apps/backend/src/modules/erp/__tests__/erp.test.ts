/**
 * Smoke test módulo ERP: valida CRUD básico del service in-memory.
 */
import { erpService } from '../erp.service';

describe('ERP module', () => {
  it('lista invoices con resultados', () => {
    const r = erpService.list({});
    expect(r.total).toBeGreaterThan(0);
    expect(r.items.length).toBeGreaterThan(0);
  });

  it('obtiene una invoice conocida', () => {
    const first = erpService.list({}).items[0];
    const found = erpService.get(first.id);
    expect(found.id).toBe(first.id);
  });

  it('crea una nueva invoice', () => {
    const before = erpService.list({}).total;
    const account = erpService.listAccounts({}).items[0];
    const created = erpService.create({
      accountId: account.id,
      amount: 1000,
    });
    expect(created.id).toBeDefined();
    expect(erpService.list({}).total).toBe(before + 1);
  });
});
