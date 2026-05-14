import { BaseEntity } from '../_shared/types';

export type EDocStatus = 'draft' | 'signed' | 'transmitted' | 'accepted' | 'rejected';
export type EDocType = 'invoice' | 'credit-note' | 'debit-note' | 'receipt';

export interface EDocument extends BaseEntity {
  type: EDocType;
  documentNumber: string;
  country: string;
  taxAuthority: string;
  issuer: string;
  receiver: string;
  amount: number;
  currency: string;
  status: EDocStatus;
  cufe?: string;
  xmlUrl?: string;
  pdfUrl?: string;
}

export interface CountryRegistry {
  code: string;
  name: string;
  authority: string;
  format: 'UBL' | 'CFDI' | 'NF-e' | 'SAF-T';
  active: boolean;
}
