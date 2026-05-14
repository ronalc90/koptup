/**
 * Smoke test módulo LMS: valida CRUD básico del service in-memory.
 */
import { lmsService } from '../lms.service';

describe('LMS module', () => {
  it('lista courses con resultados', () => {
    const r = lmsService.list({});
    expect(r.total).toBeGreaterThan(0);
    expect(r.items.length).toBeGreaterThan(0);
  });

  it('obtiene un course conocido', () => {
    const first = lmsService.list({}).items[0];
    const found = lmsService.get(first.id);
    expect(found.id).toBe(first.id);
  });

  it('crea un nuevo course', () => {
    const before = lmsService.list({}).total;
    const created = lmsService.create({
      title: 'Curso de Prueba',
      instructor: 'Profe Test',
    });
    expect(created.id).toBeDefined();
    expect(lmsService.list({}).total).toBe(before + 1);
  });
});
