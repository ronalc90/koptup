import { applyPatch, Filterable, findOrThrow, nextId, nowIso, paginate, softDelete } from '../_shared/crud';
import { DomainError, ListResult } from '../_shared/types';
import { jobs as seedJobs, scrapers as seedScrapers } from './scraping.data';
import { Job, Scraper } from './scraping.types';

export interface ScrapingService {
  list(q: Filterable): ListResult<Scraper>;
  get(id: string): Scraper;
  create(input: Partial<Scraper>): Scraper;
  update(id: string, patch: Partial<Scraper>): Scraper;
  remove(id: string): { id: string };
  listJobs(q: Filterable & { scraperId?: string }): ListResult<Job>;
  runScraper(id: string): Job;
}

export class InMemoryScrapingService implements ScrapingService {
  private scrapers: Scraper[] = [...seedScrapers];
  private jobs: Job[] = [...seedJobs];

  list(q: Filterable): ListResult<Scraper> {
    return paginate(this.scrapers, q, (s, n) => s.name.toLowerCase().includes(n) || s.targetUrl.toLowerCase().includes(n));
  }
  get(id: string): Scraper { return findOrThrow(this.scrapers, id, 'Scraper'); }

  create(input: Partial<Scraper>): Scraper {
    if (!input.name || !input.targetUrl) throw new DomainError('VALIDATION', 'name y targetUrl requeridos');
    const s: Scraper = {
      id: nextId('scr'),
      name: input.name,
      targetUrl: input.targetUrl,
      schedule: input.schedule ?? '0 * * * *',
      selectors: input.selectors ?? {},
      status: 'idle',
      successRate: 1,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.scrapers.push(s);
    return s;
  }

  update(id: string, patch: Partial<Scraper>): Scraper {
    const idx = this.scrapers.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Scraper ${id}`);
    this.scrapers[idx] = applyPatch(this.scrapers[idx], patch);
    return this.scrapers[idx];
  }
  remove(id: string): { id: string } {
    const idx = this.scrapers.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Scraper ${id}`);
    this.scrapers[idx] = softDelete(this.scrapers[idx]);
    return { id };
  }

  listJobs(q: Filterable & { scraperId?: string }): ListResult<Job> {
    const base = paginate(this.jobs, q);
    const items = q.scraperId ? base.items.filter((j) => j.scraperId === q.scraperId) : base.items;
    return { ...base, items };
  }

  runScraper(id: string): Job {
    const s = findOrThrow(this.scrapers, id, 'Scraper');
    if (s.status === 'paused' || s.status === 'error') {
      throw new DomainError('CONFLICT', `Scraper en estado ${s.status}`);
    }
    const job: Job = {
      id: nextId('job'),
      scraperId: id,
      status: 'queued',
      startedAt: nowIso(),
      recordsFound: 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.jobs.push(job);
    this.update(id, { lastRunAt: nowIso(), status: 'running' });
    return job;
  }
}

export const scrapingService: ScrapingService = new InMemoryScrapingService();
