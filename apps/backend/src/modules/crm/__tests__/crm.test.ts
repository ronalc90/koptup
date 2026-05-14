/**
 * Smoke test módulo CRM: valida CRUD básico del service in-memory.
 */
import { crmService } from '../crm.service';

describe('CRM module', () => {
  it('lista deals con resultados', () => {
    const r = crmService.listDeals({});
    expect(r.total).toBeGreaterThan(0);
    expect(r.items.length).toBeGreaterThan(0);
  });

  it('obtiene un deal conocido', () => {
    const first = crmService.listDeals({}).items[0];
    const found = crmService.getDeal(first.id);
    expect(found.id).toBe(first.id);
  });

  it('crea un nuevo deal y aumenta el total', () => {
    const before = crmService.listDeals({}).total;
    const created = crmService.createDeal({
      title: 'Test Deal',
      contactId: crmService.listContacts({}).items[0].id,
      amount: 1234,
    });
    expect(created.id).toMatch(/^dl_/);
    const after = crmService.listDeals({}).total;
    expect(after).toBe(before + 1);
  });
});
