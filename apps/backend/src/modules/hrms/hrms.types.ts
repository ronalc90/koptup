import { BaseEntity } from '../_shared/types';

export type EmployeeStatus = 'active' | 'on-leave' | 'terminated';
export type CandidateStage = 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';

export interface Employee extends BaseEntity {
  name: string;
  email: string;
  position: string;
  department: string;
  status: EmployeeStatus;
  hireDate: string;
  salary: number;
  managerId?: string;
}

export interface Candidate extends BaseEntity {
  name: string;
  email: string;
  position: string;
  stage: CandidateStage;
  source: string;
  score: number;
  resumeUrl?: string;
}
