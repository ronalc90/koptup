import { BaseEntity } from '../_shared/types';

export type ScraperStatus = 'idle' | 'running' | 'paused' | 'error';
export type JobStatus = 'queued' | 'running' | 'success' | 'failed';

export interface Scraper extends BaseEntity {
  name: string;
  targetUrl: string;
  schedule: string;
  selectors: Record<string, string>;
  status: ScraperStatus;
  lastRunAt?: string;
  successRate: number;
}

export interface Job extends BaseEntity {
  scraperId: string;
  status: JobStatus;
  startedAt: string;
  finishedAt?: string;
  recordsFound: number;
  error?: string;
  resultUrl?: string;
}
