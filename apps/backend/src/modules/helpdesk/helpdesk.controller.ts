import { Request } from 'express';
import { handle, requireFields } from '../_shared/crud';
import { DomainError } from '../_shared/types';
import { HelpdeskService } from './helpdesk.service';

export class HelpdeskController {
  constructor(private readonly service: HelpdeskService) {}
  list = handle(async (req: Request) => this.service.list(req.query as Record<string, string>), 'helpdesk');
  get = handle(async (req: Request) => this.service.get(req.params.id), 'helpdesk');
  create = handle(async (req: Request) => {
    const err = requireFields(req.body, ['subject', 'requesterEmail']);
    if (err) throw new DomainError('VALIDATION', err);
    return this.service.create(req.body);
  }, 'helpdesk');
  update = handle(async (req: Request) => this.service.update(req.params.id, req.body), 'helpdesk');
  remove = handle(async (req: Request) => this.service.remove(req.params.id), 'helpdesk');
  agents = handle(async (req: Request) => this.service.listAgents(req.query as Record<string, string>), 'helpdesk');
  assign = handle(async (req: Request) => {
    const err = requireFields(req.body, ['agentId']);
    if (err) throw new DomainError('VALIDATION', err);
    return this.service.assign(req.params.id, req.body.agentId);
  }, 'helpdesk');
}
