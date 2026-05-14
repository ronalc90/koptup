import { Request } from 'express';
import { handle, requireFields } from '../_shared/crud';
import { DomainError } from '../_shared/types';
import { CodeReviewService } from './code-review.service';

export class CodeReviewController {
  constructor(private readonly service: CodeReviewService) {}
  list = handle(async (req: Request) => this.service.list(req.query as Record<string, string>), 'code-review');
  get = handle(async (req: Request) => this.service.get(req.params.id), 'code-review');
  create = handle(async (req: Request) => {
    const err = requireFields(req.body, ['repo', 'title', 'author', 'branch']);
    if (err) throw new DomainError('VALIDATION', err);
    return this.service.create(req.body);
  }, 'code-review');
  update = handle(async (req: Request) => this.service.update(req.params.id, req.body), 'code-review');
  remove = handle(async (req: Request) => this.service.remove(req.params.id), 'code-review');
  reviews = handle(async (req: Request) => this.service.listReviews(req.params.id), 'code-review');
  runAi = handle(async (req: Request) => this.service.runAiReview(req.params.id), 'code-review');
}
