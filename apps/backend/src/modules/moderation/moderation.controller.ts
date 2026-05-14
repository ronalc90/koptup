import { Request } from 'express';
import { handle, requireFields } from '../_shared/crud';
import { DomainError } from '../_shared/types';
import { ModerationService } from './moderation.service';

export class ModerationController {
  constructor(private readonly service: ModerationService) {}
  list = handle(async (req: Request) => this.service.list(req.query as Record<string, string>), 'moderation');
  get = handle(async (req: Request) => this.service.get(req.params.id), 'moderation');
  create = handle(async (req: Request) => {
    const err = requireFields(req.body, ['contentType', 'sourceUser']);
    if (err) throw new DomainError('VALIDATION', err);
    return this.service.create(req.body);
  }, 'moderation');
  update = handle(async (req: Request) => this.service.update(req.params.id, req.body), 'moderation');
  remove = handle(async (req: Request) => this.service.remove(req.params.id), 'moderation');
  decisions = handle(async (req: Request) => this.service.listDecisions(req.query as Record<string, string>), 'moderation');
  decide = handle(async (req: Request) => {
    const err = requireFields(req.body, ['moderatorId', 'verdict', 'reason']);
    if (err) throw new DomainError('VALIDATION', err);
    return this.service.decide(req.params.id, req.body.moderatorId, req.body.verdict, req.body.reason);
  }, 'moderation');
}
