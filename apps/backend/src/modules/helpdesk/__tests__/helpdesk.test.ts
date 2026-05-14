/**
 * Smoke test módulo Helpdesk: valida CRUD básico del service in-memory.
 */
import { helpdeskService } from '../helpdesk.service';

describe('Helpdesk module', () => {
  it('lista tickets con resultados', () => {
    const r = helpdeskService.list({});
    expect(r.total).toBeGreaterThan(0);
    expect(r.items.length).toBeGreaterThan(0);
  });

  it('obtiene un ticket conocido', () => {
    const first = helpdeskService.list({}).items[0];
    const found = helpdeskService.get(first.id);
    expect(found.id).toBe(first.id);
  });

  it('crea un nuevo ticket', () => {
    const before = helpdeskService.list({}).total;
    const created = helpdeskService.create({
      subject: 'Issue de prueba',
      requesterEmail: 'test@example.com',
      description: 'Descripción',
    });
    expect(created.id).toBeDefined();
    expect(helpdeskService.list({}).total).toBe(before + 1);
  });
});
