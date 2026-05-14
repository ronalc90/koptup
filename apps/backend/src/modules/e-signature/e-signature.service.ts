import { applyPatch, Filterable, findOrThrow, nextId, nowIso, paginate, softDelete } from '../_shared/crud';
import { DomainError, ListResult } from '../_shared/types';
import { envelopes as seedEnvelopes, signers as seedSigners } from './e-signature.data';
import { Envelope, Signer } from './e-signature.types';

export interface ESignatureService {
  list(q: Filterable): ListResult<Envelope>;
  get(id: string): Envelope;
  create(input: Partial<Envelope>): Envelope;
  update(id: string, patch: Partial<Envelope>): Envelope;
  remove(id: string): { id: string };
  listSigners(envelopeId: string): ReadonlyArray<Signer>;
  sign(signerId: string, ipAddress: string): Signer;
}

export class InMemoryESignatureService implements ESignatureService {
  private envelopes: Envelope[] = [...seedEnvelopes];
  private signers: Signer[] = [...seedSigners];

  list(q: Filterable): ListResult<Envelope> {
    return paginate(this.envelopes, q, (e, n) => e.title.toLowerCase().includes(n) || e.senderEmail.toLowerCase().includes(n));
  }
  get(id: string): Envelope { return findOrThrow(this.envelopes, id, 'Envelope'); }

  create(input: Partial<Envelope>): Envelope {
    if (!input.title || !input.senderEmail || !input.documentUrl) {
      throw new DomainError('VALIDATION', 'title, senderEmail, documentUrl requeridos');
    }
    const e: Envelope = {
      id: nextId('env'),
      title: input.title,
      documentUrl: input.documentUrl,
      senderEmail: input.senderEmail,
      status: 'draft',
      expiresAt: input.expiresAt ?? new Date(Date.now() + 86400000 * 14).toISOString(),
      signerIds: input.signerIds ?? [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.envelopes.push(e);
    return e;
  }

  update(id: string, patch: Partial<Envelope>): Envelope {
    const idx = this.envelopes.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Envelope ${id}`);
    this.envelopes[idx] = applyPatch(this.envelopes[idx], patch);
    return this.envelopes[idx];
  }
  remove(id: string): { id: string } {
    const idx = this.envelopes.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Envelope ${id}`);
    this.envelopes[idx] = softDelete(this.envelopes[idx]);
    return { id };
  }

  listSigners(envelopeId: string): ReadonlyArray<Signer> {
    return this.signers.filter((s) => s.envelopeId === envelopeId && !s.deletedAt);
  }

  sign(signerId: string, ipAddress: string): Signer {
    const idx = this.signers.findIndex((s) => s.id === signerId);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Signer ${signerId}`);
    const signer = this.signers[idx];
    if (signer.status === 'signed' || signer.status === 'declined') {
      throw new DomainError('CONFLICT', `Signer en estado ${signer.status}`);
    }
    this.signers[idx] = { ...signer, status: 'signed', signedAt: nowIso(), ipAddress, updatedAt: nowIso() };
    // Actualiza estado del envelope
    const envSigners = this.listSigners(signer.envelopeId);
    const allSigned = envSigners.every((s) => s.status === 'signed');
    const envIdx = this.envelopes.findIndex((e) => e.id === signer.envelopeId);
    if (envIdx >= 0) {
      this.envelopes[envIdx] = { ...this.envelopes[envIdx], status: allSigned ? 'completed' : 'partial', updatedAt: nowIso() };
    }
    return this.signers[idx];
  }
}

export const eSignatureService: ESignatureService = new InMemoryESignatureService();
