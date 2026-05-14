import { Request, Response } from 'express';
import { handle, requireFields } from '../_shared/crud';
import { DomainError } from '../_shared/types';
import { CrmService } from './crm.service';

export class CrmController {
  constructor(private readonly service: CrmService) {}

  list = handle(async (req: Request) => this.service.listDeals(req.query as Record<string, string>), 'crm');
  get = handle(async (req: Request) => this.service.getDeal(req.params.id), 'crm');

  create = handle(async (req: Request) => {
    const err = requireFields(req.body, ['title', 'contactId', 'amount']);
    if (err) throw new DomainError('VALIDATION', err);
    return this.service.createDeal(req.body);
  }, 'crm');

  update = handle(async (req: Request) => this.service.updateDeal(req.params.id, req.body), 'crm');
  remove = handle(async (req: Request) => this.service.removeDeal(req.params.id), 'crm');

  listContacts = handle(async (req: Request) => this.service.listContacts(req.query as Record<string, string>), 'crm');
  forecast = handle(async (_req: Request, _res: Response) => this.service.forecast(), 'crm');
}
