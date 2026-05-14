import { Request } from 'express';
import { handle, requireFields } from '../_shared/crud';
import { DomainError } from '../_shared/types';
import { AutomationService } from './automation.service';

export class AutomationController {
  constructor(private readonly service: AutomationService) {}
  list = handle(async (req: Request) => this.service.list(req.query as Record<string, string>), 'automation');
  get = handle(async (req: Request) => this.service.get(req.params.id), 'automation');
  create = handle(async (req: Request) => {
    const err = requireFields(req.body, ['name', 'trigger']);
    if (err) throw new DomainError('VALIDATION', err);
    return this.service.create(req.body);
  }, 'automation');
  update = handle(async (req: Request) => this.service.update(req.params.id, req.body), 'automation');
  remove = handle(async (req: Request) => this.service.remove(req.params.id), 'automation');
  runs = handle(async (req: Request) => this.service.listRuns(req.query as Record<string, string>), 'automation');
  trigger = handle(async (req: Request) => this.service.triggerRun(req.params.id), 'automation');
}
