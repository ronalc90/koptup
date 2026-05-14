import { BaseEntity } from '../_shared/types';

export type EnvelopeStatus = 'draft' | 'sent' | 'partial' | 'completed' | 'voided';
export type SignerStatus = 'pending' | 'viewed' | 'signed' | 'declined';

export interface Envelope extends BaseEntity {
  title: string;
  documentUrl: string;
  senderEmail: string;
  status: EnvelopeStatus;
  expiresAt: string;
  signerIds: ReadonlyArray<string>;
}

export interface Signer extends BaseEntity {
  envelopeId: string;
  name: string;
  email: string;
  order: number;
  status: SignerStatus;
  signedAt?: string;
  ipAddress?: string;
}
