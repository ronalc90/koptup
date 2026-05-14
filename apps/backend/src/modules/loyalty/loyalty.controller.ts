import { Request } from 'express';
import { handle, requireFields } from '../_shared/crud';
import { DomainError } from '../_shared/types';
import { LoyaltyService } from './loyalty.service';

export class LoyaltyController {
  constructor(private readonly service: LoyaltyService) {}
  list = handle(async (req: Request) => this.service.list(req.query as Record<string, string>), 'loyalty');
  get = handle(async (req: Request) => this.service.get(req.params.id), 'loyalty');
  create = handle(async (req: Request) => {
    const err = requireFields(req.body, ['name', 'email']);
    if (err) throw new DomainError('VALIDATION', err);
    return this.service.create(req.body);
  }, 'loyalty');
  update = handle(async (req: Request) => this.service.update(req.params.id, req.body), 'loyalty');
  remove = handle(async (req: Request) => this.service.remove(req.params.id), 'loyalty');
  rewards = handle(async (req: Request) => this.service.listRewards(req.query.memberId as string | undefined), 'loyalty');
  redeem = handle(async (req: Request) => {
    const err = requireFields(req.body, ['rewardName', 'pointsCost']);
    if (err) throw new DomainError('VALIDATION', err);
    return this.service.redeem(req.params.id, req.body.rewardName, Number(req.body.pointsCost));
  }, 'loyalty');
}
