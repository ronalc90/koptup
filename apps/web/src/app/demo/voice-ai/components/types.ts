export type Speaker = 'ai' | 'customer';
export type Sentiment = 'positive' | 'neutral' | 'negative';
export type Direction = 'inbound' | 'outbound';
export type ScenarioId = 'banca' | 'salud' | 'cobranza' | 'pedido';
export type FlowNode = 'greeting' | 'identify' | 'intent' | 'action' | 'close' | 'transfer';
export type FnStatus = 'pending' | 'running' | 'done' | 'skipped';

/** Fase de la llamada de ejemplo en el reproductor. */
export type Phase = 'idle' | 'playing' | 'paused' | 'transferred' | 'ended';

/** Resultado de una llamada en el registro. */
export type CallResult = 'resolved' | 'transferred' | 'abandoned' | 'voicemail' | 'noAnswer';

export type FnKey =
  | 'verifyCustomer'
  | 'getTransactions'
  | 'registerTravel'
  | 'unblockCard'
  | 'getAppointment'
  | 'findAvailability'
  | 'rescheduleAppointment'
  | 'sendWhatsapp'
  | 'getBalance'
  | 'quotePaymentPlan'
  | 'createAgreement'
  | 'createPaymentLink'
  | 'getOrder'
  | 'createTicket'
  | 'transferToHuman'
  | 'logCallCrm';

/** Turno del guion. El texto vive en messages: demoVoice.scenarios.<id>.turns.<key>. */
export interface Turn {
  key: string;
  speaker: Speaker;
  sentiment: Sentiment;
  node: FlowNode;
  /** Intención detectada en este turno (clave de demoVoice.intents). */
  intent?: string;
  /** Confianza de ejemplo (0–1) de la intención. */
  confidence?: number;
  /** Funciones que el agente invoca en este turno. */
  fns?: FnKey[];
  /** El turno contiene un dato sensible que se muestra enmascarado. */
  masked?: boolean;
  /** Turno con el aviso de grabación y tratamiento de datos (Ley 1581). */
  notice?: boolean;
}

export interface FnCall {
  key: FnKey;
  /** Sistema con el que se conectaría en un proyecto real (clave de demoVoice.systems). */
  system: string;
  /** Argumentos de ejemplo (se muestran como JSON). */
  args: Record<string, string | number | boolean>;
}

export interface Scenario {
  id: ScenarioId;
  direction: Direction;
  /** Número del cliente, ya enmascarado. */
  number: string;
  /** Datos sensibles enmascarados que se insertan en el guion. */
  maskedData: Record<string, string>;
  turns: Turn[];
  fns: FnCall[];
  /** Fecha y hora de la llamada saliente (para validar la ventana de contacto). */
  scheduled?: { date: string; time: string };
  /** Llamada de cobranza: aplica la ventana horaria de la Ley 2300. */
  collections?: boolean;
}

/** Fila del registro de llamadas. */
export interface CallRow {
  id: string;
  /** Hora local HH:MM (fija en los datos de ejemplo). */
  time: string;
  number: string;
  direction: Direction;
  /** Clave de demoVoice.intents con el motivo principal. */
  intent: string;
  durationSec: number;
  result: CallResult;
  sentiment: Sentiment;
  /** Encuesta de satisfacción 1–5 (null si no respondió). */
  csat: number | null;
  scenario?: ScenarioId;
  /** Llamada hecha por la persona en esta demo. */
  mine?: boolean;
}

/** Contacto de la campaña saliente. */
export interface CampaignContact {
  id: string;
  name: string;
  number: string;
  /** Fecha programada AAAA-MM-DD (2026). */
  date: string;
  /** Hora programada HH:MM (24 h). */
  time: string;
  excluded?: boolean;
  /** Fecha del último contacto (para la regla de frecuencia). */
  lastContact?: string;
  /** Resultado si la llamada se permite. */
  outcome: 'agreement' | 'voicemail' | 'paid' | 'noAnswer' | 'callback';
}

export type BlockReason = 'sunday' | 'holiday' | 'beforeOpen' | 'afterClose' | 'excluded' | 'frequency' | 'outOfRange' | 'invalid';

export type ContactCheck =
  | { kind: 'allowed' }
  | { kind: 'blocked'; reason: BlockReason; holiday?: string };

export const SENTIMENT_TONE: Record<Sentiment, string> = {
  positive: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  neutral: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  negative: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

export const RESULT_TONE: Record<CallResult, string> = {
  resolved: 'bg-emerald-500/15 text-emerald-300',
  transferred: 'bg-violet-500/15 text-violet-300',
  abandoned: 'bg-rose-500/15 text-rose-300',
  voicemail: 'bg-amber-500/15 text-amber-300',
  noAnswer: 'bg-slate-500/20 text-slate-300',
};

export function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export function fmtTime(s: number) {
  const total = Math.max(0, Math.floor(s));
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}
