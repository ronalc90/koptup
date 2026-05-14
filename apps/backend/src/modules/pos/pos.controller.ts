import { Request } from 'express';
import { handle, requireFields } from '../_shared/crud';
import { DomainError } from '../_shared/types';
import { PosService } from './pos.service';
import { Payment } from './pos.types';

export class PosController {
  constructor(private readonly service: PosService) {}
  list = handle(async (req: Request) => this.service.list(req.query as Record<string, string>), 'pos');
  get = handle(async (req: Request) => this.service.get(req.params.id), 'pos');
  create = handle(async (req: Request) => {
    const err = requireFields(req.body, ['cashierId', 'terminalId']);
    if (err) throw new DomainError('VALIDATION', err);
    return this.service.create(req.body);
  }, 'pos');
  update = handle(async (req: Request) => this.service.update(req.params.id, req.body), 'pos');
  remove = handle(async (req: Request) => this.service.remove(req.params.id), 'pos');
  payments = handle(async (req: Request) => this.service.listPayments(req.query as Record<string, string>), 'pos');
  charge = handle(async (req: Request) => {
    const err = requireFields(req.body, ['method']);
    if (err) throw new DomainError('VALIDATION', err);
    return this.service.charge(req.params.id, req.body.method as Payment['method']);
  }, 'pos');
}
