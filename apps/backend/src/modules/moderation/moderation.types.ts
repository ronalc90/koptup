import { BaseEntity } from '../_shared/types';

export type ItemStatus = 'pending' | 'approved' | 'rejected' | 'escalated';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface ModerationItem extends BaseEntity {
  contentType: 'text' | 'image' | 'video' | 'audio';
  contentUrl?: string;
  contentExcerpt?: string;
  sourceUser: string;
  aiScore: number;
  flags: ReadonlyArray<string>;
  status: ItemStatus;
  severity: Severity;
}

export interface Decision extends BaseEntity {
  itemId: string;
  moderatorId: string;
  verdict: 'approve' | 'reject' | 'escalate';
  reason: string;
}
