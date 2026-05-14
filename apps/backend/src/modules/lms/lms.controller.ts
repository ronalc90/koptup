import { Request } from 'express';
import { handle, requireFields } from '../_shared/crud';
import { DomainError } from '../_shared/types';
import { LmsService } from './lms.service';

export class LmsController {
  constructor(private readonly service: LmsService) {}
  list = handle(async (req: Request) => this.service.list(req.query as Record<string, string>), 'lms');
  get = handle(async (req: Request) => this.service.get(req.params.id), 'lms');
  create = handle(async (req: Request) => {
    const err = requireFields(req.body, ['title', 'instructor']);
    if (err) throw new DomainError('VALIDATION', err);
    return this.service.create(req.body);
  }, 'lms');
  update = handle(async (req: Request) => this.service.update(req.params.id, req.body), 'lms');
  remove = handle(async (req: Request) => this.service.remove(req.params.id), 'lms');
  enrollments = handle(async (req: Request) => this.service.listEnrollments(req.query as Record<string, string>), 'lms');
  enroll = handle(async (req: Request) => {
    const err = requireFields(req.body, ['studentEmail']);
    if (err) throw new DomainError('VALIDATION', err);
    return this.service.enroll(req.params.id, req.body.studentEmail);
  }, 'lms');
}
