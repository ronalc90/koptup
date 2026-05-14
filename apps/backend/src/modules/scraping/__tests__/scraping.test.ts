/**
 * Smoke test módulo Scraping: valida CRUD básico del service in-memory.
 */
import { scrapingService } from '../scraping.service';

describe('Scraping module', () => {
  it('lista scrapers con resultados', () => {
    const r = scrapingService.list({});
    expect(r.total).toBeGreaterThan(0);
    expect(r.items.length).toBeGreaterThan(0);
  });

  it('obtiene un scraper conocido', () => {
    const first = scrapingService.list({}).items[0];
    const found = scrapingService.get(first.id);
    expect(found.id).toBe(first.id);
  });

  it('lista jobs', () => {
    const jobs = scrapingService.listJobs({});
    expect(jobs.total).toBeGreaterThanOrEqual(0);
  });
});
