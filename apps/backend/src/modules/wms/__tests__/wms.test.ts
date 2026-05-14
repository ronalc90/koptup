/**
 * Smoke test módulo WMS (logística): valida CRUD básico del service in-memory.
 */
import { wmsService } from '../wms.service';

describe('WMS module', () => {
  it('lista picks con resultados', () => {
    const r = wmsService.list({});
    expect(r.total).toBeGreaterThan(0);
    expect(r.items.length).toBeGreaterThan(0);
  });

  it('obtiene un pick conocido', () => {
    const first = wmsService.list({}).items[0];
    const found = wmsService.get(first.id);
    expect(found.id).toBe(first.id);
  });

  it('lista warehouses', () => {
    const warehouses = wmsService.listWarehouses();
    expect(warehouses.length).toBeGreaterThan(0);
  });
});
