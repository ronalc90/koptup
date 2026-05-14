import { Request } from 'express';
import { handle, requireFields } from '../_shared/crud';
import { DomainError } from '../_shared/types';
import { EInvoicingService } from './e-invoicing.service';

export class EInvoicingController {
  constructor(private readonly service: EInvoicingService) {}
  list = handle(async (req: Request) => this.service.list(req.query as Record<string, string>), 'e-invoicing');
  get = handle(async (req: Request) => this.service.get(req.params.id), 'e-invoicing');
  create = handle(async (req: Request) => {
    const err = requireFields(req.body, ['country', 'issuer', 'receiver', 'amount']);
    if (err) throw new DomainError('VALIDATION', err);
    return this.service.create(req.body);
  }, 'e-invoicing');
  update = handle(async (req: Request) => this.service.update(req.params.id, req.body), 'e-invoicing');
  remove = handle(async (req: Request) => this.service.remove(req.params.id), 'e-invoicing');
  countries = handle(async () => this.service.listCountries(), 'e-invoicing');
  emit = handle(async (req: Request) => this.service.emit(req.params.id), 'e-invoicing');
}
