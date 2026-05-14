/**
 * Smoke test módulo E-Invoicing (facturación electrónica): valida CRUD básico.
 */
import { eInvoicingService } from '../e-invoicing.service';

describe('E-Invoicing module', () => {
  it('lista e-documents con resultados', () => {
    const r = eInvoicingService.list({});
    expect(r.total).toBeGreaterThan(0);
    expect(r.items.length).toBeGreaterThan(0);
  });

  it('obtiene un e-document conocido', () => {
    const first = eInvoicingService.list({}).items[0];
    const found = eInvoicingService.get(first.id);
    expect(found.id).toBe(first.id);
  });

  it('lista países registrados', () => {
    const countries = eInvoicingService.listCountries();
    expect(countries.length).toBeGreaterThan(0);
  });
});
