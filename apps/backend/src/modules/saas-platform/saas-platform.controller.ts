import { Request } from 'express';
import { handle, requireFields } from '../_shared/crud';
import { DomainError } from '../_shared/types';
import { SaasPlatformService } from './saas-platform.service';

export class SaasPlatformController {
  constructor(private readonly service: SaasPlatformService) {}
  list = handle(async (req: Request) => this.service.list(req.query as Record<string, string>), 'saas-platform');
  get = handle(async (req: Request) => this.service.get(req.params.id), 'saas-platform');
  create = handle(async (req: Request) => {
    const err = requireFields(req.body, ['name', 'subdomain', 'ownerEmail']);
    if (err) throw new DomainError('VALIDATION', err);
    return this.service.create(req.body);
  }, 'saas-platform');
  update = handle(async (req: Request) => this.service.update(req.params.id, req.body), 'saas-platform');
  remove = handle(async (req: Request) => this.service.remove(req.params.id), 'saas-platform');
  plans = handle(async () => this.service.listPlans(), 'saas-platform');
  changePlan = handle(async (req: Request) => {
    const err = requireFields(req.body, ['planId']);
    if (err) throw new DomainError('VALIDATION', err);
    return this.service.changePlan(req.params.id, req.body.planId);
  }, 'saas-platform');
}
