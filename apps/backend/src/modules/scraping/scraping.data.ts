import { Job, Scraper } from './scraping.types';

const t = (m: number) => new Date(Date.now() - m * 60000).toISOString();

export const scrapers: Scraper[] = [
  { id: 'scr_001', name: 'Precios competencia', targetUrl: 'https://competitor1.com/pricing', schedule: '0 6 * * *', selectors: { price: '.plan-price', features: '.feature-item' }, status: 'idle', lastRunAt: t(60 * 6), successRate: 0.98, createdAt: '2026-01-15T00:00:00Z', updatedAt: t(60 * 6) },
  { id: 'scr_002', name: 'Noticias industria fintech', targetUrl: 'https://news.fintech.com', schedule: '*/30 * * * *', selectors: { title: 'h2.title', summary: 'p.excerpt' }, status: 'running', lastRunAt: t(2), successRate: 0.95, createdAt: '2026-02-01T00:00:00Z', updatedAt: t(2) },
  { id: 'scr_003', name: 'Vacantes LinkedIn Tech', targetUrl: 'https://linkedin.com/jobs', schedule: '0 */6 * * *', selectors: { jobTitle: '.job-title', company: '.company-name' }, status: 'idle', lastRunAt: t(60 * 3), successRate: 0.85, createdAt: '2026-02-15T00:00:00Z', updatedAt: t(60 * 3) },
  { id: 'scr_004', name: 'Reseñas Google Maps', targetUrl: 'https://maps.google.com', schedule: '0 12 * * *', selectors: { rating: '.rating', text: '.review-text' }, status: 'error', lastRunAt: t(60 * 12), successRate: 0.72, createdAt: '2026-03-01T00:00:00Z', updatedAt: t(60 * 12) },
  { id: 'scr_005', name: 'Stock Amazon', targetUrl: 'https://amazon.com/dp/X123', schedule: '*/15 * * * *', selectors: { stock: '#availability', price: '.price' }, status: 'paused', successRate: 0.91, createdAt: '2026-03-10T00:00:00Z', updatedAt: t(60 * 24) },
  { id: 'scr_006', name: 'Eventos Eventbrite', targetUrl: 'https://eventbrite.com/d/online', schedule: '0 9 * * 1', selectors: { eventName: '.event-card h3', date: '.event-date' }, status: 'idle', lastRunAt: t(60 * 24 * 2), successRate: 0.99, createdAt: '2026-04-01T00:00:00Z', updatedAt: t(60 * 24 * 2) },
];

export const jobs: Job[] = [
  { id: 'job_001', scraperId: 'scr_001', status: 'success', startedAt: t(60 * 6), finishedAt: t(60 * 6 - 1), recordsFound: 8, resultUrl: '/results/job_001.json', createdAt: t(60 * 6), updatedAt: t(60 * 6 - 1) },
  { id: 'job_002', scraperId: 'scr_002', status: 'running', startedAt: t(2), recordsFound: 0, createdAt: t(2), updatedAt: t(2) },
  { id: 'job_003', scraperId: 'scr_002', status: 'success', startedAt: t(32), finishedAt: t(31), recordsFound: 15, resultUrl: '/results/job_003.json', createdAt: t(32), updatedAt: t(31) },
  { id: 'job_004', scraperId: 'scr_004', status: 'failed', startedAt: t(60 * 12), finishedAt: t(60 * 12), recordsFound: 0, error: 'Captcha detectado', createdAt: t(60 * 12), updatedAt: t(60 * 12) },
  { id: 'job_005', scraperId: 'scr_003', status: 'success', startedAt: t(60 * 3), finishedAt: t(60 * 3 - 2), recordsFound: 42, resultUrl: '/results/job_005.json', createdAt: t(60 * 3), updatedAt: t(60 * 3 - 2) },
  { id: 'job_006', scraperId: 'scr_006', status: 'success', startedAt: t(60 * 24 * 2), finishedAt: t(60 * 24 * 2 - 1), recordsFound: 28, resultUrl: '/results/job_006.json', createdAt: t(60 * 24 * 2), updatedAt: t(60 * 24 * 2 - 1) },
  { id: 'job_007', scraperId: 'scr_001', status: 'queued', startedAt: t(0), recordsFound: 0, createdAt: t(0), updatedAt: t(0) },
];
