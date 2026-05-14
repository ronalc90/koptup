export type Speaker = 'ai' | 'customer' | 'human';
export type Sentiment = 'positive' | 'neutral' | 'negative';
export type FnStatus = 'pending' | 'running' | 'done';
export type FnKey = 'check_balance' | 'unblock_card' | 'schedule_appointment' | 'transfer_human';

export interface Turn {
  id: number;
  speaker: Speaker;
  textKey: string;
  intentKey?: string;
  confidence?: number;
  sentiment: Sentiment;
  latencyMs: number;
  redacted?: boolean;
  codeSwitch?: boolean;
  fn?: FnKey;
}

export interface QueueRow {
  id: string;
  number: string;
  direction: 'inbound' | 'outbound';
  duration: string;
  status: 'live' | 'completed' | 'voicemail' | 'missed' | 'transferred';
  sentiment: Sentiment;
  confidence: number;
}

export const TURNS: Turn[] = [
  { id: 1, speaker: 'customer', textKey: 't1', intentKey: 'card_unblock',    confidence: 0.94, sentiment: 'negative', latencyMs: 210, redacted: true },
  { id: 2, speaker: 'ai',       textKey: 't2',                                                  sentiment: 'neutral',  latencyMs: 240, fn: 'check_balance' },
  { id: 3, speaker: 'customer', textKey: 't3', intentKey: 'travel_notice',   confidence: 0.91, sentiment: 'neutral',  latencyMs: 195 },
  { id: 4, speaker: 'ai',       textKey: 't4',                                                  sentiment: 'positive', latencyMs: 260, fn: 'unblock_card', codeSwitch: true },
  { id: 5, speaker: 'customer', textKey: 't5',                                                  sentiment: 'positive', latencyMs: 180 },
  { id: 6, speaker: 'ai',       textKey: 't6',                                                  sentiment: 'positive', latencyMs: 230 },
  { id: 7, speaker: 'customer', textKey: 't7', intentKey: 'book_appointment',confidence: 0.97, sentiment: 'positive', latencyMs: 205 },
  { id: 8, speaker: 'ai',       textKey: 't8',                                                  sentiment: 'positive', latencyMs: 250, fn: 'schedule_appointment' },
];

export const STT_PROVIDERS: { id: 'whisper' | 'deepgram' | 'assembly'; latency: number }[] = [
  { id: 'whisper',  latency: 320 },
  { id: 'deepgram', latency: 180 },
  { id: 'assembly', latency: 240 },
];
export const TTS_PROVIDERS: { id: 'eleven' | 'cartesia' | 'playht' }[] = [
  { id: 'eleven' }, { id: 'cartesia' }, { id: 'playht' },
];
export const TELE_PROVIDERS: { id: 'twilio' | 'vonage' | 'telnyx' }[] = [
  { id: 'twilio' }, { id: 'vonage' }, { id: 'telnyx' },
];

export const INBOUND: QueueRow[] = [
  { id: 'i1', number: '+56 9 4521 8830', direction: 'inbound', duration: '02:14', status: 'live',        sentiment: 'positive', confidence: 0.94 },
  { id: 'i2', number: '+56 2 2890 1145', direction: 'inbound', duration: '04:38', status: 'completed',   sentiment: 'neutral',  confidence: 0.88 },
  { id: 'i3', number: '+56 9 7732 5519', direction: 'inbound', duration: '00:42', status: 'missed',     sentiment: 'negative', confidence: 0.61 },
  { id: 'i4', number: '+51 1 642 3399',  direction: 'inbound', duration: '06:11', status: 'transferred',sentiment: 'neutral',  confidence: 0.79 },
];
export const OUTBOUND: QueueRow[] = [
  { id: 'o1', number: '+56 9 5544 8821', direction: 'outbound', duration: '01:48', status: 'completed', sentiment: 'positive', confidence: 0.92 },
  { id: 'o2', number: '+56 9 2233 9087', direction: 'outbound', duration: '00:18', status: 'voicemail', sentiment: 'neutral',  confidence: 0.74 },
  { id: 'o3', number: '+56 9 8801 5562', direction: 'outbound', duration: '03:02', status: 'completed', sentiment: 'positive', confidence: 0.90 },
  { id: 'o4', number: '+54 11 4456 9912',direction: 'outbound', duration: '00:00', status: 'missed',    sentiment: 'neutral',  confidence: 0.55 },
];

export const SENTIMENT_TONE: Record<Sentiment, string> = {
  positive: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  neutral:  'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  negative: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

export const STATUS_TONE: Record<QueueRow['status'], string> = {
  live:        'bg-emerald-500/15 text-emerald-300',
  completed:   'bg-cyan-500/15 text-cyan-300',
  voicemail:   'bg-amber-500/15 text-amber-300',
  missed:      'bg-rose-500/15 text-rose-300',
  transferred: 'bg-violet-500/15 text-violet-300',
};

export function pad(n: number) { return n.toString().padStart(2, '0'); }
export function fmtTime(s: number) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }
