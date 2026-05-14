import { Request } from 'express';
import { handle, requireFields } from '../_shared/crud';
import { DomainError } from '../_shared/types';
import { HrmsService } from './hrms.service';
import { CandidateStage } from './hrms.types';

export class HrmsController {
  constructor(private readonly service: HrmsService) {}
  list = handle(async (req: Request) => this.service.list(req.query as Record<string, string>), 'hrms');
  get = handle(async (req: Request) => this.service.get(req.params.id), 'hrms');
  create = handle(async (req: Request) => {
    const err = requireFields(req.body, ['name', 'email', 'position']);
    if (err) throw new DomainError('VALIDATION', err);
    return this.service.create(req.body);
  }, 'hrms');
  update = handle(async (req: Request) => this.service.update(req.params.id, req.body), 'hrms');
  remove = handle(async (req: Request) => this.service.remove(req.params.id), 'hrms');
  candidates = handle(async (req: Request) => this.service.listCandidates(req.query as Record<string, string>), 'hrms');
  advance = handle(async (req: Request) => {
    const err = requireFields(req.body, ['stage']);
    if (err) throw new DomainError('VALIDATION', err);
    return this.service.advanceCandidate(req.params.id, req.body.stage as CandidateStage);
  }, 'hrms');
}
