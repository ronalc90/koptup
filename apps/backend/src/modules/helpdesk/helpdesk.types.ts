import { BaseEntity } from '../_shared/types';

export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Ticket extends BaseEntity {
  subject: string;
  description: string;
  requesterEmail: string;
  agentId?: string;
  status: TicketStatus;
  priority: TicketPriority;
  channel: 'email' | 'chat' | 'phone' | 'web';
  slaDueAt: string;
  tags: ReadonlyArray<string>;
}

export interface Agent extends BaseEntity {
  name: string;
  email: string;
  status: 'online' | 'away' | 'offline';
  loadCount: number;
}
