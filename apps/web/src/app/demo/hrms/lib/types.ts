import type { ISODate } from './dates';

export type TabId = 'home' | 'people' | 'absences' | 'talent' | 'performance' | 'payroll' | 'learning';

export type SiteId = 'funza' | 'bogota' | 'medellin';
export type AreaId = 'management' | 'production' | 'quality' | 'maintenance' | 'logistics' | 'sales' | 'finance' | 'people';
export type ContractType = 'indefinite' | 'fixed' | 'work' | 'apprentice';
export type ShiftId = 'office' | 'day' | 'night' | 'rotating';

export type PositionId =
  | 'ceo' | 'plantDirector' | 'cfo' | 'salesDirector' | 'hrHead' | 'logisticsHead' | 'qualityHead' | 'maintenanceHead'
  | 'supervisor' | 'packer' | 'operator' | 'qualityAssistant' | 'qualityAnalyst' | 'technician' | 'warehouseAssistant'
  | 'driver' | 'salesRep' | 'accountant' | 'costAnalyst' | 'adminAssistant' | 'hrAnalyst' | 'apprentice';

export interface Employee {
  id: string;
  name: string;
  gender?: 'F' | 'M';
  docId: string;
  positionId: PositionId;
  area: AreaId;
  site: SiteId;
  managerId: string | null;
  contract: ContractType;
  /** Duración del contrato a término fijo, en meses (para renovarlo). */
  termMonths?: number;
  joined: ISODate;
  contractEnd: ISODate | null;
  salary: number;
  birthday: string; // MM-DD
  birthYear: number;
  phone: string;
  email: string | null;
  eps: string;
  afp: string;
  ccf: string;
  arlClass: 1 | 2 | 3 | 4 | 5;
  shift: ShiftId;
  /** Días hábiles de vacaciones disfrutados antes de las solicitudes registradas en la demo. */
  vacTaken: number;
  lastExam: ISODate;
  examScheduled?: ISODate;
  bank: string;
  account: string;
  status: 'active' | 'leaving' | 'retired';
  noticeSent?: boolean;
}

export type LeaveType = 'vacation' | 'permit' | 'unpaid' | 'sick';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface Leave {
  id: string;
  employeeId: string;
  type: LeaveType;
  from: ISODate;
  to: ISODate;
  /** Días hábiles (vacaciones) o calendario (incapacidad, licencia). */
  days: number;
  status: LeaveStatus;
  note?: string;
  rejectReason?: string;
  source: 'seed' | 'app' | 'hr';
}

export interface Exit {
  id: string;
  name: string;
  positionId: PositionId;
  date: ISODate;
  reason: ExitReason;
}

export type ExitReason = 'resignation' | 'endOfTerm' | 'dismissal' | 'agreement';

export type Stage = 'applied' | 'screening' | 'interview' | 'offer' | 'hired';
export const STAGES: Stage[] = ['applied', 'screening', 'interview', 'offer', 'hired'];

export type Education = 'highSchool' | 'technical' | 'technologist' | 'professional';

export interface Vacancy {
  id: string;
  positionId: PositionId;
  site: SiteId;
  openings: number;
  hired: number;
  minYears: number;
  education: Education;
  shifts: boolean;
}

export type CandidateSource = 'jobBoard' | 'referral' | 'publicService' | 'socialMedia' | 'walkIn';

export interface Candidate {
  id: string;
  name: string;
  gender?: 'F' | 'M';
  vacancyId: string;
  stage: Stage;
  source: CandidateSource;
  years: number;
  education: Education;
  shifts: boolean;
  distanceKm: number;
  appliedOn: ISODate;
  phone: string;
  discarded?: boolean;
}

export type OnTask = 'contract' | 'eps' | 'pension' | 'arl' | 'ccf' | 'medical' | 'uniform' | 'induction';
export type OffTask = 'letter' | 'settlement' | 'clearance' | 'exitExam' | 'certificate' | 'deregister';
export const ON_TASKS: OnTask[] = ['contract', 'arl', 'eps', 'pension', 'ccf', 'medical', 'uniform', 'induction'];
export const OFF_TASKS: OffTask[] = ['letter', 'settlement', 'clearance', 'exitExam', 'certificate', 'deregister'];

export interface Onboarding {
  id: string;
  kind: 'in';
  candidateId: string | null;
  name: string;
  gender?: 'F' | 'M';
  docId: string;
  positionId: PositionId;
  site: SiteId;
  startDate: ISODate;
  done: OnTask[];
  closed: boolean;
}

export interface Offboarding {
  id: string;
  kind: 'out';
  employeeId: string;
  lastDay: ISODate;
  reason: ExitReason;
  done: OffTask[];
  closed: boolean;
}

export type NoveltyKind = 'hed' | 'hen' | 'rn' | 'rdf' | 'commission';
export const NOVELTY_KINDS: NoveltyKind[] = ['hed', 'hen', 'rn', 'rdf', 'commission'];

export interface Novelty {
  id: string;
  employeeId: string;
  kind: NoveltyKind;
  /** Horas, o pesos en comisiones. */
  qty: number;
}

export type RunStatus = 'draft' | 'liquidated' | 'approved' | 'paid';

export interface PayrollRun {
  periodId: string; // AAAA-MM-Q1 | AAAA-MM-Q2
  status: RunStatus;
  novelties: Novelty[];
}

export interface MonthlyFiling {
  month: string; // AAAA-MM
  einvoice: 'pending' | 'accepted';
  cunes: Record<string, string>;
  pila: 'pending' | 'generated' | 'paid';
}

export type Competency = 'goals' | 'quality' | 'teamwork' | 'safety' | 'initiative';
export const COMPETENCIES: Competency[] = ['goals', 'quality', 'teamwork', 'safety', 'initiative'];

export interface Review {
  employeeId: string;
  scores: Partial<Record<Competency, number>>;
  comment: string;
  status: 'pending' | 'done';
}

export type CourseId = 'induction' | 'sst50' | 'food' | 'heights' | 'pesv' | 'sagrilaft' | 'dataProtection' | 'harassment';

export interface Course {
  id: CourseId;
  hours: number;
  due: ISODate;
  assigned: string[];
  completed: string[];
  remindedOn?: ISODate;
}

export interface Survey {
  id: string;
  question: 'enps' | 'workload' | 'safety';
  audience: 'all' | SiteId;
  sentOn: ISODate;
  invited: number;
  promoters: number;
  passives: number;
  detractors: number;
  closed: boolean;
}

export interface HrState {
  version: number;
  baseDate: ISODate;
  employees: Employee[];
  leaves: Leave[];
  exits: Exit[];
  vacancies: Vacancy[];
  candidates: Candidate[];
  processes: (Onboarding | Offboarding)[];
  run: PayrollRun;
  filing: MonthlyFiling;
  reviews: Review[];
  courses: Course[];
  surveys: Survey[];
  seq: number;
}
