import { BaseEntity } from '../_shared/types';

export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Contact extends BaseEntity {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  tags: ReadonlyArray<string>;
}

export interface Deal extends BaseEntity {
  title: string;
  contactId: string;
  amount: number;
  currency: string;
  stage: DealStage;
  status: 'open' | 'closed';
  expectedClose: string;
  ownerId: string;
}

export interface ForecastBucket {
  stage: DealStage;
  count: number;
  totalAmount: number;
  weightedAmount: number;
}
