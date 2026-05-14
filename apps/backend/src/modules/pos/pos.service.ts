import { applyPatch, Filterable, findOrThrow, nextId, nowIso, paginate, softDelete } from '../_shared/crud';
import { DomainError, ListResult } from '../_shared/types';
import { orders as seedOrders, payments as seedPayments } from './pos.data';
import { Payment, PosOrder } from './pos.types';

export interface PosService {
  list(q: Filterable): ListResult<PosOrder>;
  get(id: string): PosOrder;
  create(input: Partial<PosOrder>): PosOrder;
  update(id: string, patch: Partial<PosOrder>): PosOrder;
  remove(id: string): { id: string };
  listPayments(q: Filterable): ListResult<Payment>;
  charge(orderId: string, method: Payment['method']): { order: PosOrder; payment: Payment };
}

export class InMemoryPosService implements PosService {
  private orders: PosOrder[] = [...seedOrders];
  private payments: Payment[] = [...seedPayments];

  list(q: Filterable): ListResult<PosOrder> {
    return paginate(this.orders, q, (o, n) => o.id.toLowerCase().includes(n) || o.cashierId.toLowerCase().includes(n));
  }
  get(id: string): PosOrder { return findOrThrow(this.orders, id, 'PosOrder'); }

  create(input: Partial<PosOrder>): PosOrder {
    if (!input.cashierId || !input.terminalId) throw new DomainError('VALIDATION', 'cashierId y terminalId requeridos');
    const items = input.items ?? [];
    const total = items.reduce((a, b) => a + b.qty * b.price, 0);
    const o: PosOrder = {
      id: nextId('pos'),
      cashierId: input.cashierId,
      terminalId: input.terminalId,
      total,
      currency: input.currency ?? 'USD',
      status: 'open',
      items,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.orders.push(o);
    return o;
  }

  update(id: string, patch: Partial<PosOrder>): PosOrder {
    const idx = this.orders.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `PosOrder ${id}`);
    this.orders[idx] = applyPatch(this.orders[idx], patch);
    return this.orders[idx];
  }
  remove(id: string): { id: string } {
    const idx = this.orders.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `PosOrder ${id}`);
    this.orders[idx] = softDelete(this.orders[idx]);
    return { id };
  }

  listPayments(q: Filterable): ListResult<Payment> {
    return paginate(this.payments, q, (p, n) => p.orderId.toLowerCase().includes(n));
  }

  charge(orderId: string, method: Payment['method']): { order: PosOrder; payment: Payment } {
    const o = findOrThrow(this.orders, orderId, 'PosOrder');
    if (o.status !== 'open') throw new DomainError('CONFLICT', `Orden en estado ${o.status}`);
    const payment: Payment = {
      id: nextId('pay'),
      orderId,
      method,
      amount: o.total,
      currency: o.currency,
      reference: `AUTH-${Date.now()}`,
      authorized: true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.payments.push(payment);
    const order = this.update(orderId, { status: 'paid', paymentId: payment.id });
    return { order, payment };
  }
}

export const posService: PosService = new InMemoryPosService();
