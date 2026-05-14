import { applyPatch, Filterable, findOrThrow, nextId, nowIso, paginate, softDelete } from '../_shared/crud';
import { DomainError, ListResult } from '../_shared/types';
import { consultations as seedConsultations, prescriptions as seedPrescriptions } from './telemedicine.data';
import { Consultation, Prescription } from './telemedicine.types';

export interface TelemedicineService {
  list(q: Filterable): ListResult<Consultation>;
  get(id: string): Consultation;
  create(input: Partial<Consultation>): Consultation;
  update(id: string, patch: Partial<Consultation>): Consultation;
  remove(id: string): { id: string };
  listPrescriptions(q: Filterable): ListResult<Prescription>;
  startSession(id: string): Consultation;
}

export class InMemoryTelemedicineService implements TelemedicineService {
  private consultations: Consultation[] = [...seedConsultations];
  private prescriptions: Prescription[] = [...seedPrescriptions];

  list(q: Filterable): ListResult<Consultation> {
    return paginate(this.consultations, q, (c, n) => c.patientName.toLowerCase().includes(n) || c.doctorName.toLowerCase().includes(n));
  }
  get(id: string): Consultation { return findOrThrow(this.consultations, id, 'Consultation'); }

  create(input: Partial<Consultation>): Consultation {
    if (!input.patientName || !input.doctorName) throw new DomainError('VALIDATION', 'patientName y doctorName requeridos');
    const c: Consultation = {
      id: nextId('cns'),
      patientName: input.patientName,
      patientId: input.patientId ?? nextId('pat'),
      doctorName: input.doctorName,
      doctorId: input.doctorId ?? 'doc_001',
      specialty: input.specialty ?? 'Medicina General',
      scheduledAt: input.scheduledAt ?? nowIso(),
      status: 'scheduled',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.consultations.push(c);
    return c;
  }

  update(id: string, patch: Partial<Consultation>): Consultation {
    const idx = this.consultations.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Consultation ${id}`);
    this.consultations[idx] = applyPatch(this.consultations[idx], patch);
    return this.consultations[idx];
  }
  remove(id: string): { id: string } {
    const idx = this.consultations.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Consultation ${id}`);
    this.consultations[idx] = softDelete(this.consultations[idx]);
    return { id };
  }

  listPrescriptions(q: Filterable): ListResult<Prescription> {
    return paginate(this.prescriptions, q, (p, n) => p.diagnosis.toLowerCase().includes(n));
  }

  startSession(id: string): Consultation {
    const c = findOrThrow(this.consultations, id, 'Consultation');
    if (c.status === 'completed' || c.status === 'cancelled') {
      throw new DomainError('CONFLICT', `No se puede iniciar consulta ${c.status}`);
    }
    return this.update(id, { status: 'in-progress', videoUrl: `https://meet.koptup.com/${id}` });
  }
}

export const telemedicineService: TelemedicineService = new InMemoryTelemedicineService();
