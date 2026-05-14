import { Consultation, Prescription } from './telemedicine.types';

const h = (offset: number) => new Date(Date.now() + offset * 3600000).toISOString();

export const consultations: Consultation[] = [
  { id: 'cns_001', patientName: 'Pedro Suárez', patientId: 'pat_001', doctorName: 'Dr. Elena Vargas', doctorId: 'doc_001', specialty: 'Medicina General', scheduledAt: h(2), status: 'scheduled', createdAt: h(-24), updatedAt: h(-24) },
  { id: 'cns_002', patientName: 'Lucía Marín', patientId: 'pat_002', doctorName: 'Dr. Andrés Rincón', doctorId: 'doc_002', specialty: 'Cardiología', scheduledAt: h(4), status: 'scheduled', videoUrl: 'https://meet.koptup.com/abc', createdAt: h(-48), updatedAt: h(-1) },
  { id: 'cns_003', patientName: 'Juan Restrepo', patientId: 'pat_003', doctorName: 'Dr. Elena Vargas', doctorId: 'doc_001', specialty: 'Medicina General', scheduledAt: h(-2), status: 'completed', notes: 'Cuadro gripal, reposo y líquidos', createdAt: h(-72), updatedAt: h(-1) },
  { id: 'cns_004', patientName: 'Camila Hoyos', patientId: 'pat_004', doctorName: 'Dr. María Quintero', doctorId: 'doc_003', specialty: 'Pediatría', scheduledAt: h(24), status: 'scheduled', createdAt: h(-10), updatedAt: h(-10) },
  { id: 'cns_005', patientName: 'Sergio Pinilla', patientId: 'pat_005', doctorName: 'Dr. Andrés Rincón', doctorId: 'doc_002', specialty: 'Cardiología', scheduledAt: h(-24), status: 'completed', notes: 'Control HTA estable', createdAt: h(-96), updatedAt: h(-23) },
  { id: 'cns_006', patientName: 'Valeria Pardo', patientId: 'pat_006', doctorName: 'Dr. Luis Bermúdez', doctorId: 'doc_004', specialty: 'Dermatología', scheduledAt: h(48), status: 'scheduled', createdAt: h(-2), updatedAt: h(-2) },
  { id: 'cns_007', patientName: 'Manuel Cobos', patientId: 'pat_007', doctorName: 'Dr. María Quintero', doctorId: 'doc_003', specialty: 'Pediatría', scheduledAt: h(-48), status: 'cancelled', createdAt: h(-72), updatedAt: h(-50) },
  { id: 'cns_008', patientName: 'Isabel Cruz', patientId: 'pat_008', doctorName: 'Dr. Elena Vargas', doctorId: 'doc_001', specialty: 'Medicina General', scheduledAt: h(72), status: 'scheduled', createdAt: h(-1), updatedAt: h(-1) },
];

export const prescriptions: Prescription[] = [
  { id: 'rx_001', consultationId: 'cns_003', patientId: 'pat_003', doctorId: 'doc_001', medications: [{ name: 'Acetaminofén', dosage: '500mg', frequency: 'cada 8h', days: 3 }, { name: 'Ibuprofeno', dosage: '400mg', frequency: 'cada 12h', days: 3 }], diagnosis: 'Gripe estacional', issuedAt: h(-1), createdAt: h(-1), updatedAt: h(-1) },
  { id: 'rx_002', consultationId: 'cns_005', patientId: 'pat_005', doctorId: 'doc_002', medications: [{ name: 'Losartán', dosage: '50mg', frequency: 'diaria', days: 30 }], diagnosis: 'Hipertensión controlada', issuedAt: h(-23), createdAt: h(-23), updatedAt: h(-23) },
];
