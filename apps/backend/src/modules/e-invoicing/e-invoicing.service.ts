import { applyPatch, Filterable, findOrThrow, nextId, nowIso, paginate, softDelete } from '../_shared/crud';
import { DomainError, ListResult } from '../_shared/types';
import { countries as seedCountries, documents as seedDocuments } from './e-invoicing.data';
import { CountryRegistry, EDocument } from './e-invoicing.types';

export interface EInvoicingService {
  list(q: Filterable & { country?: string; type?: string }): ListResult<EDocument>;
  get(id: string): EDocument;
  create(input: Partial<EDocument>): EDocument;
  update(id: string, patch: Partial<EDocument>): EDocument;
  remove(id: string): { id: string };
  listCountries(): ReadonlyArray<CountryRegistry>;
  emit(id: string): EDocument;
}

export class InMemoryEInvoicingService implements EInvoicingService {
  private documents: EDocument[] = [...seedDocuments];
  private countries: CountryRegistry[] = [...seedCountries];

  list(q: Filterable & { country?: string; type?: string }): ListResult<EDocument> {
    const base = paginate(this.documents, q, (d, n) => d.documentNumber.toLowerCase().includes(n) || d.receiver.toLowerCase().includes(n));
    let items = base.items;
    if (q.country) items = items.filter((d) => d.country === q.country);
    if (q.type) items = items.filter((d) => d.type === q.type);
    return { ...base, items };
  }
  get(id: string): EDocument { return findOrThrow(this.documents, id, 'EDocument'); }

  create(input: Partial<EDocument>): EDocument {
    if (!input.country || !input.issuer || !input.receiver || typeof input.amount !== 'number') {
      throw new DomainError('VALIDATION', 'country, issuer, receiver, amount requeridos');
    }
    const country = this.countries.find((c) => c.code === input.country);
    if (!country || !country.active) throw new DomainError('VALIDATION', `País ${input.country} no soportado`);
    const d: EDocument = {
      id: nextId('edoc'),
      type: input.type ?? 'invoice',
      documentNumber: input.documentNumber ?? `DOC-${Date.now()}`,
      country: input.country,
      taxAuthority: country.authority,
      issuer: input.issuer,
      receiver: input.receiver,
      amount: input.amount,
      currency: input.currency ?? 'USD',
      status: 'draft',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.documents.push(d);
    return d;
  }

  update(id: string, patch: Partial<EDocument>): EDocument {
    const idx = this.documents.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `EDocument ${id}`);
    this.documents[idx] = applyPatch(this.documents[idx], patch);
    return this.documents[idx];
  }
  remove(id: string): { id: string } {
    const idx = this.documents.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `EDocument ${id}`);
    this.documents[idx] = softDelete(this.documents[idx]);
    return { id };
  }

  listCountries(): ReadonlyArray<CountryRegistry> { return this.countries; }

  emit(id: string): EDocument {
    const doc = findOrThrow(this.documents, id, 'EDocument');
    if (doc.status !== 'draft' && doc.status !== 'signed') {
      throw new DomainError('CONFLICT', `Documento en estado ${doc.status} no se puede emitir`);
    }
    const cufe = Buffer.from(`${doc.id}-${Date.now()}`).toString('base64').slice(0, 24);
    return this.update(id, { status: 'transmitted', cufe, xmlUrl: `/files/${doc.id}.xml`, pdfUrl: `/files/${doc.id}.pdf` });
  }
}

export const eInvoicingService: EInvoicingService = new InMemoryEInvoicingService();
