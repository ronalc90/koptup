import { BaseEntity } from '../_shared/types';

export type WorkflowStatus = 'enabled' | 'disabled' | 'draft';
export type RunStatus = 'queued' | 'running' | 'success' | 'failed';

export interface Workflow extends BaseEntity {
  name: string;
  description: string;
  trigger: 'schedule' | 'webhook' | 'manual';
  status: WorkflowStatus;
  steps: ReadonlyArray<{ name: string; type: string }>;
  lastRunAt?: string;
}

export interface Run extends BaseEntity {
  workflowId: string;
  status: RunStatus;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  output?: Record<string, unknown>;
  error?: string;
}
