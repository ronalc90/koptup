import { applyPatch, Filterable, findOrThrow, nextId, nowIso, paginate, softDelete } from '../_shared/crud';
import { DomainError, ListResult } from '../_shared/types';
import { drivers as seedDrivers, orders as seedOrders } from './delivery.data';
import { DeliveryOrder, Driver } from './delivery.types';

export interface DeliveryService {
  list(q: Filterable & { driverId?: string }): ListResult<DeliveryOrder>;
  get(id: string): DeliveryOrder;
  create(input: Partial<DeliveryOrder>): DeliveryOrder;
  update(id: string, patch: Partial<DeliveryOrder>): DeliveryOrder;
  remove(id: string): { id: string };
  listDrivers(q: Filterable): ListResult<Driver>;
  assignDriver(orderId: string): DeliveryOrder;
}

export class InMemoryDeliveryService implements DeliveryService {
  private orders: DeliveryOrder[] = [...seedOrders];
  private drivers: Driver[] = [...seedDrivers];

  list(q: Filterable & { driverId?: string }): ListResult<DeliveryOrder> {
    const base = paginate(this.orders, q, (o, n) => o.customerName.toLowerCase().includes(n) || o.dropoffAddress.toLowerCase().includes(n));
    const items = q.driverId ? base.items.filter((o) => o.driverId === q.driverId) : base.items;
    return { ...base, items };
  }
  get(id: string): DeliveryOrder { return findOrThrow(this.orders, id, 'DeliveryOrder'); }

  create(input: Partial<DeliveryOrder>): DeliveryOrder {
    if (!input.customerName || !input.pickupAddress || !input.dropoffAddress) {
      throw new DomainError('VALIDATION', 'customerName, pickupAddress, dropoffAddress requeridos');
    }
    const o: DeliveryOrder = {
      id: nextId('dlv'),
      customerName: input.customerName,
      customerPhone: input.customerPhone ?? '',
      pickupAddress: input.pickupAddress,
      dropoffAddress: input.dropoffAddress,
      status: 'created',
      estimatedTime: input.estimatedTime ?? 30,
      amount: input.amount ?? 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.orders.push(o);
    return o;
  }

  update(id: string, patch: Partial<DeliveryOrder>): DeliveryOrder {
    const idx = this.orders.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `DeliveryOrder ${id}`);
    this.orders[idx] = applyPatch(this.orders[idx], patch);
    return this.orders[idx];
  }
  remove(id: string): { id: string } {
    const idx = this.orders.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `DeliveryOrder ${id}`);
    this.orders[idx] = softDelete(this.orders[idx]);
    return { id };
  }

  listDrivers(q: Filterable): ListResult<Driver> {
    return paginate(this.drivers, q, (d, n) => d.name.toLowerCase().includes(n));
  }

  assignDriver(orderId: string): DeliveryOrder {
    const order = findOrThrow(this.orders, orderId, 'DeliveryOrder');
    if (order.status !== 'created') throw new DomainError('CONFLICT', `Orden en estado ${order.status}`);
    const available = this.drivers.find((d) => d.status === 'available' && !d.deletedAt);
    if (!available) throw new DomainError('CONFLICT', 'No hay drivers disponibles');
    const dIdx = this.drivers.findIndex((d) => d.id === available.id);
    this.drivers[dIdx] = { ...this.drivers[dIdx], status: 'on-delivery', updatedAt: nowIso() };
    return this.update(orderId, { driverId: available.id, status: 'assigned' });
  }
}

export const deliveryService: DeliveryService = new InMemoryDeliveryService();
