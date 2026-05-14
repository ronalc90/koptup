import { Request } from 'express';
import { handle, requireFields } from '../_shared/crud';
import { DomainError } from '../_shared/types';
import { DeliveryService } from './delivery.service';

export class DeliveryController {
  constructor(private readonly service: DeliveryService) {}
  list = handle(async (req: Request) => this.service.list(req.query as Record<string, string>), 'delivery');
  get = handle(async (req: Request) => this.service.get(req.params.id), 'delivery');
  create = handle(async (req: Request) => {
    const err = requireFields(req.body, ['customerName', 'pickupAddress', 'dropoffAddress']);
    if (err) throw new DomainError('VALIDATION', err);
    return this.service.create(req.body);
  }, 'delivery');
  update = handle(async (req: Request) => this.service.update(req.params.id, req.body), 'delivery');
  remove = handle(async (req: Request) => this.service.remove(req.params.id), 'delivery');
  drivers = handle(async (req: Request) => this.service.listDrivers(req.query as Record<string, string>), 'delivery');
  assign = handle(async (req: Request) => this.service.assignDriver(req.params.id), 'delivery');
}
