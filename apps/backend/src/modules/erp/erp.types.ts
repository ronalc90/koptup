import { BaseEntity } from '../_shared/types';

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'void';

export interface Invoice extends BaseEntity {
  number: string;
  accountId: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: InvoiceStatus;
  lineItems: ReadonlyArray<{ description: string; qty: number; unit: number }>;
}

export interface Account extends BaseEntity {
  legalName: string;
  taxId: string;
  country: string;
  balance: number;
}
