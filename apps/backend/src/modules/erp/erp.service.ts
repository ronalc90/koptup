import { applyPatch, Filterable, findOrThrow, nextId, nowIso, paginate, softDelete } from '../_shared/crud';
import { DomainError, ListResult } from '../_shared/types';
import { accounts as seedAccounts, invoices as seedInvoices } from './erp.data';
import { Account, Invoice } from './erp.types';

export interface ErpService {
  list(q: Filterable): ListResult<Invoice>;
  get(id: string): Invoice;
  create(input: Partial<Invoice>): Invoice;
  update(id: string, patch: Partial<Invoice>): Invoice;
  remove(id: string): { id: string };
  listAccounts(q: Filterable): ListResult<Account>;
  agingReport(): ReadonlyArray<{ bucket: string; count: number; amount: number }>;
}

export class InMemoryErpService implements ErpService {
  private invoices: Invoice[] = [...seedInvoices];
  private accounts: Account[] = [...seedAccounts];

  list(q: Filterable): ListResult<Invoice> {
    return paginate(this.invoices, q, (i, n) => i.number.toLowerCase().includes(n));
  }
  get(id: string): Invoice { return findOrThrow(this.invoices, id, 'Invoice'); }

  create(input: Partial<Invoice>): Invoice {
    if (!input.accountId || typeof input.amount !== 'number') {
      throw new DomainError('VALIDATION', 'accountId, amount son requeridos');
    }
    const inv: Invoice = {
      id: nextId('inv'),
      number: input.number ?? `FE-${new Date().getFullYear()}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
      accountId: input.accountId,
      amount: input.amount,
      currency: input.currency ?? 'USD',
      dueDate: input.dueDate ?? nowIso(),
      status: input.status ?? 'draft',
      lineItems: input.lineItems ?? [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.invoices.push(inv);
    return inv;
  }

  update(id: string, patch: Partial<Invoice>): Invoice {
    const idx = this.invoices.findIndex((d) => d.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Invoice ${id}`);
    const upd = applyPatch(this.invoices[idx], patch);
    this.invoices[idx] = upd;
    return upd;
  }

  remove(id: string): { id: string } {
    const idx = this.invoices.findIndex((d) => d.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Invoice ${id}`);
    this.invoices[idx] = softDelete(this.invoices[idx]);
    return { id };
  }

  listAccounts(q: Filterable): ListResult<Account> {
    return paginate(this.accounts, q, (a, n) => a.legalName.toLowerCase().includes(n));
  }

  agingReport(): ReadonlyArray<{ bucket: string; count: number; amount: number }> {
    const now = Date.now();
    const buckets = { current: { c: 0, a: 0 }, '1-30': { c: 0, a: 0 }, '31-60': { c: 0, a: 0 }, '60+': { c: 0, a: 0 } };
    this.invoices.filter((i) => !i.deletedAt && i.status !== 'paid' && i.status !== 'void').forEach((i) => {
      const days = Math.floor((now - new Date(i.dueDate).getTime()) / 86400000);
      const key: keyof typeof buckets = days <= 0 ? 'current' : days <= 30 ? '1-30' : days <= 60 ? '31-60' : '60+';
      buckets[key].c += 1;
      buckets[key].a += i.amount;
    });
    return Object.entries(buckets).map(([bucket, v]) => ({ bucket, count: v.c, amount: v.a }));
  }
}

export const erpService: ErpService = new InMemoryErpService();
