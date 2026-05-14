import { applyPatch, Filterable, findOrThrow, nextId, nowIso, paginate, softDelete } from '../_shared/crud';
import { DomainError, ListResult } from '../_shared/types';
import { picks as seedPicks, warehouses as seedWarehouses } from './wms.data';
import { Pick, Warehouse } from './wms.types';

export interface WmsService {
  list(q: Filterable & { warehouseId?: string }): ListResult<Pick>;
  get(id: string): Pick;
  create(input: Partial<Pick>): Pick;
  update(id: string, patch: Partial<Pick>): Pick;
  remove(id: string): { id: string };
  listWarehouses(): ReadonlyArray<Warehouse>;
  completePick(id: string): Pick;
}

export class InMemoryWmsService implements WmsService {
  private picks: Pick[] = [...seedPicks];
  private warehouses: Warehouse[] = [...seedWarehouses];

  list(q: Filterable & { warehouseId?: string }): ListResult<Pick> {
    const base = paginate(this.picks, q, (p, n) => p.orderId.toLowerCase().includes(n));
    const items = q.warehouseId ? base.items.filter((p) => p.warehouseId === q.warehouseId) : base.items;
    return { ...base, items };
  }
  get(id: string): Pick { return findOrThrow(this.picks, id, 'Pick'); }

  create(input: Partial<Pick>): Pick {
    if (!input.warehouseId || !input.orderId) throw new DomainError('VALIDATION', 'warehouseId y orderId requeridos');
    const p: Pick = {
      id: nextId('pk'),
      warehouseId: input.warehouseId,
      orderId: input.orderId,
      status: 'pending',
      items: input.items ?? [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.picks.push(p);
    return p;
  }

  update(id: string, patch: Partial<Pick>): Pick {
    const idx = this.picks.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Pick ${id}`);
    this.picks[idx] = applyPatch(this.picks[idx], patch);
    return this.picks[idx];
  }
  remove(id: string): { id: string } {
    const idx = this.picks.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Pick ${id}`);
    this.picks[idx] = softDelete(this.picks[idx]);
    return { id };
  }

  listWarehouses(): ReadonlyArray<Warehouse> { return this.warehouses; }

  completePick(id: string): Pick {
    const p = findOrThrow(this.picks, id, 'Pick');
    if (p.status !== 'picking') throw new DomainError('CONFLICT', `Pick en estado ${p.status} no se puede completar`);
    return this.update(id, { status: 'packed', completedAt: nowIso() });
  }
}

export const wmsService: WmsService = new InMemoryWmsService();
