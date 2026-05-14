import { BaseEntity } from '../_shared/types';

export type ConsultationStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

export interface Consultation extends BaseEntity {
  patientName: string;
  patientId: string;
  doctorName: string;
  doctorId: string;
  specialty: string;
  scheduledAt: string;
  status: ConsultationStatus;
  videoUrl?: string;
  notes?: string;
}

export interface Prescription extends BaseEntity {
  consultationId: string;
  patientId: string;
  doctorId: string;
  medications: ReadonlyArray<{ name: string; dosage: string; frequency: string; days: number }>;
  diagnosis: string;
  issuedAt: string;
}
