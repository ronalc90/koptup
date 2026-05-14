import { Request } from 'express';
import { handle, requireFields } from '../_shared/crud';
import { DomainError } from '../_shared/types';
import { ErpService } from './erp.service';

export class ErpController {
  constructor(private readonly service: ErpService) {}
  list = handle(async (req: Request) => this.service.list(req.query as Record<string, string>), 'erp');
  get = handle(async (req: Request) => this.service.get(req.params.id), 'erp');
  create = handle(async (req: Request) => {
    const err = requireFields(req.body, ['accountId', 'amount']);
    if (err) throw new DomainError('VALIDATION', err);
    return this.service.create(req.body);
  }, 'erp');
  update = handle(async (req: Request) => this.service.update(req.params.id, req.body), 'erp');
  remove = handle(async (req: Request) => this.service.remove(req.params.id), 'erp');
  accounts = handle(async (req: Request) => this.service.listAccounts(req.query as Record<string, string>), 'erp');
  aging = handle(async () => this.service.agingReport(), 'erp');
}
