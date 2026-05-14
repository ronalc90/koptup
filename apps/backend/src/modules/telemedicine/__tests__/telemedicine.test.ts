/**
 * Smoke test módulo Telemedicine: valida CRUD básico del service in-memory.
 */
import { telemedicineService } from '../telemedicine.service';

describe('Telemedicine module', () => {
  it('lista consultations con resultados', () => {
    const r = telemedicineService.list({});
    expect(r.total).toBeGreaterThan(0);
    expect(r.items.length).toBeGreaterThan(0);
  });

  it('obtiene una consultation conocida', () => {
    const first = telemedicineService.list({}).items[0];
    const found = telemedicineService.get(first.id);
    expect(found.id).toBe(first.id);
  });

  it('crea una nueva consultation', () => {
    const before = telemedicineService.list({}).total;
    const created = telemedicineService.create({
      patientName: 'Paciente Test',
      doctorName: 'Dr Test',
    });
    expect(created.id).toBeDefined();
    expect(telemedicineService.list({}).total).toBe(before + 1);
  });
});
