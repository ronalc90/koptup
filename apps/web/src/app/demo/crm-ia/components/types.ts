export type StageId = 'prospect' | 'qualified' | 'proposal' | 'negotiation' | 'closed';
export type ScoreTier = 'hot' | 'warm' | 'cold';
export type Sentiment = 'positive' | 'neutral' | 'negative';
export type Channel = 'email' | 'whatsapp' | 'call' | 'linkedin' | 'task';
export type StepStatus = 'done' | 'current' | 'pending';

export interface Contact {
  id: number;
  name: string;
  company: string;
  email: string;
  avatar: string;
  score: number;
  dealValue: number;
  nextAction: string;
  lastContact: string;
  stage: StageId;
  owner: string;
  closeDate: string;
  probability: number;
}

export interface Conversation {
  id: number;
  contactId: number;
  date: string;
  duration: string;
  sentiment: Sentiment;
  topics: string[];
  actionItems: string[];
  talkRatioRep: number;
}

export interface TimelineEvent {
  id: number;
  type: 'emailSent' | 'callMade' | 'meetingHeld' | 'dealCreated' | 'ticketOpened' | 'transactionCompleted';
  date: string;
  summary: string;
}

export interface SequenceStep {
  day: number;
  channel: Channel;
  title: string;
  status: StepStatus;
}

export const scoreTier = (score: number): ScoreTier => {
  if (score >= 75) return 'hot';
  if (score >= 50) return 'warm';
  return 'cold';
};

export const formatCurrency = (value: number): string => {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  }
  return `$${value}`;
};
