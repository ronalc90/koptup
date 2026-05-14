import { BaseEntity } from '../_shared/types';

export type CallStatus = 'queued' | 'ringing' | 'in-progress' | 'completed' | 'failed';

export interface Call extends BaseEntity {
  from: string;
  to: string;
  direction: 'inbound' | 'outbound';
  status: CallStatus;
  startedAt?: string;
  endedAt?: string;
  durationSec?: number;
  agentId?: string;
  recordingUrl?: string;
}

export interface Transcript extends BaseEntity {
  callId: string;
  segments: ReadonlyArray<{ speaker: 'agent' | 'customer'; text: string; tStart: number; tEnd: number }>;
  sentiment: 'positive' | 'neutral' | 'negative';
  summary: string;
}
