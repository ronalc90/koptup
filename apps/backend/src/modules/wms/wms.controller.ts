import { Request } from 'express';
import { handle, requireFields } from '../_shared/crud';
import { DomainError } from '../_shared/types';
import { WmsService } from './wms.service';

export class WmsController {
  constructor(private readonly service: WmsService) {}
  list = handle(async (req: Request) => this.service.list(req.query as Record<string, string>), 'wms');
  get = handle(async (req: Request) => this.service.get(req.params.id), 'wms');
  create = handle(async (req: Request) => {
    const err = requireFields(req.body, ['warehouseId', 'orderId']);
    if (err) throw new DomainError('VALIDATION', err);
    return this.service.create(req.body);
  }, 'wms');
  update = handle(async (req: Request) => this.service.update(req.params.id, req.body), 'wms');
  remove = handle(async (req: Request) => this.service.remove(req.params.id), 'wms');
  warehouses = handle(async () => this.service.listWarehouses(), 'wms');
  complete = handle(async (req: Request) => this.service.completePick(req.params.id), 'wms');
}
