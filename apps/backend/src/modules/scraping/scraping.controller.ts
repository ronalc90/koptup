import { Request } from 'express';
import { handle, requireFields } from '../_shared/crud';
import { DomainError } from '../_shared/types';
import { ScrapingService } from './scraping.service';

export class ScrapingController {
  constructor(private readonly service: ScrapingService) {}
  list = handle(async (req: Request) => this.service.list(req.query as Record<string, string>), 'scraping');
  get = handle(async (req: Request) => this.service.get(req.params.id), 'scraping');
  create = handle(async (req: Request) => {
    const err = requireFields(req.body, ['name', 'targetUrl']);
    if (err) throw new DomainError('VALIDATION', err);
    return this.service.create(req.body);
  }, 'scraping');
  update = handle(async (req: Request) => this.service.update(req.params.id, req.body), 'scraping');
  remove = handle(async (req: Request) => this.service.remove(req.params.id), 'scraping');
  jobs = handle(async (req: Request) => this.service.listJobs(req.query as Record<string, string>), 'scraping');
  run = handle(async (req: Request) => this.service.runScraper(req.params.id), 'scraping');
}
