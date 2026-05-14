import {
  applyPatch,
  findOrThrow,
  Filterable,
  nextId,
  nowIso,
  paginate,
  softDelete,
} from '../_shared/crud';
import { DomainError, ListResult } from '../_shared/types';
import { contacts as seedContacts, deals as seedDeals } from './crm.data';
import { Contact, Deal, DealStage, ForecastBucket } from './crm.types';

const STAGE_PROBABILITY: Record<DealStage, number> = {
  lead: 0.1,
  qualified: 0.25,
  proposal: 0.5,
  negotiation: 0.75,
  won: 1,
  lost: 0,
};

export interface CrmService {
  listDeals(q: Filterable & { stage?: string; ownerId?: string }): ListResult<Deal>;
  getDeal(id: string): Deal;
  createDeal(input: Partial<Deal>): Deal;
  updateDeal(id: string, patch: Partial<Deal>): Deal;
  removeDeal(id: string): { id: string };
  listContacts(q: Filterable): ListResult<Contact>;
  forecast(): ReadonlyArray<ForecastBucket>;
}

export class InMemoryCrmService implements CrmService {
  private deals: Deal[] = [...seedDeals];
  private contacts: Contact[] = [...seedContacts];

  listDeals(q: Filterable & { stage?: string; ownerId?: string }): ListResult<Deal> {
    const base = paginate(this.deals, q, (d, n) => d.title.toLowerCase().includes(n));
    let items = base.items;
    if (q.stage) items = items.filter((d) => d.stage === q.stage);
    if (q.ownerId) items = items.filter((d) => d.ownerId === q.ownerId);
    return { ...base, items };
  }

  getDeal(id: string): Deal {
    return findOrThrow(this.deals, id, 'Deal');
  }

  createDeal(input: Partial<Deal>): Deal {
    if (!input.title || !input.contactId || typeof input.amount !== 'number') {
      throw new DomainError('VALIDATION', 'title, contactId, amount son requeridos');
    }
    const deal: Deal = {
      id: nextId('dl'),
      title: input.title,
      contactId: input.contactId,
      amount: input.amount,
      currency: input.currency ?? 'USD',
      stage: input.stage ?? 'lead',
      status: 'open',
      expectedClose: input.expectedClose ?? nowIso(),
      ownerId: input.ownerId ?? 'usr_001',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.deals.push(deal);
    return deal;
  }

  updateDeal(id: string, patch: Partial<Deal>): Deal {
    const idx = this.deals.findIndex((d) => d.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Deal ${id}`);
    const updated = applyPatch(this.deals[idx], patch);
    this.deals[idx] = updated;
    return updated;
  }

  removeDeal(id: string): { id: string } {
    const idx = this.deals.findIndex((d) => d.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Deal ${id}`);
    this.deals[idx] = softDelete(this.deals[idx]);
    return { id };
  }

  listContacts(q: Filterable): ListResult<Contact> {
    return paginate(this.contacts, q, (c, n) =>
      c.name.toLowerCase().includes(n) || c.email.toLowerCase().includes(n) || (c.company?.toLowerCase().includes(n) ?? false),
    );
  }

  forecast(): ReadonlyArray<ForecastBucket> {
    const stages: DealStage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
    return stages.map((stage) => {
      const items = this.deals.filter((d) => !d.deletedAt && d.stage === stage);
      const totalAmount = items.reduce((a, b) => a + b.amount, 0);
      return {
        stage,
        count: items.length,
        totalAmount,
        weightedAmount: Math.round(totalAmount * STAGE_PROBABILITY[stage]),
      };
    });
  }
}

export const crmService: CrmService = new InMemoryCrmService();
