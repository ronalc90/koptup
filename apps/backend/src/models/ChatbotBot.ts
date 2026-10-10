import mongoose, { Document, Schema } from 'mongoose';

/**
 * Bots del chatbot RAG ("Configura el tuyo", "Prueba el asistente" y los
 * asistentes de otras demos), sus fragmentos y su historial de
 * conversaciones. Antes vivían en memoria y en `data/chatbots/state.json`
 * (disco efímero en Railway); `services/chatbot-store.service.ts` migra ese
 * archivo una sola vez si existe.
 *
 * Colecciones (nombres explícitos para no chocar con `chatbots`, la del
 * chatbot heredado por sesión de models/Chatbot.ts):
 *  - `chatbot_bots`: configuración, documentos (solo metadatos) y el hash
 *    SHA-256 del token del dueño (el token nunca se guarda).
 *  - `chatbot_bot_chunks`: un registro por documento con sus fragmentos de
 *    texto (las palabras para la búsqueda se recalculan al leerlos).
 *  - `chatbot_turns`: preguntas y respuestas. Solo se guardan las del widget
 *    de un bot de usuario (no las de los bots de ejemplo ni las de la vista
 *    previa) y vencen solas: índice TTL sobre `expiresAt`
 *    (CHATBOT_CONVERSATION_TTL_DAYS, 30 días por defecto).
 */

/** `builder`: bot de "Configura el tuyo". `sample`: bot de ejemplo de una demo. */
export const CHATBOT_BOT_KINDS = ['builder', 'sample'] as const;
export type ChatbotBotKind = (typeof CHATBOT_BOT_KINDS)[number];

export interface IChatbotBotDoc {
  id: string;
  name: string;
  size: number;
  mime: string;
  hash: string;
  uploadedAt: string;
}

export interface IChatbotBot extends Document {
  botId: string;
  name: string;
  color: string;
  position: 'br' | 'bl' | 'tr' | 'tl';
  avatar: string;
  welcome: string;
  systemPrompt: string;
  tone: string;
  languages: string[];
  docs: IChatbotBotDoc[];
  chunksCount: number;
  ownerTokenHash?: string | null;
  kind: ChatbotBotKind;
  /** Última vez que se usó o editó (el job de conservación borra los inactivos). */
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BotDocSchema = new Schema<IChatbotBotDoc>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, maxlength: 200 },
    size: { type: Number, required: true },
    mime: { type: String, maxlength: 120 },
    hash: { type: String, maxlength: 64 },
    uploadedAt: { type: String, required: true },
  },
  { _id: false },
);

const ChatbotBotSchema = new Schema<IChatbotBot>(
  {
    botId: { type: String, required: true, unique: true },
    name: { type: String, required: true, maxlength: 80 },
    color: { type: String, required: true, maxlength: 9 },
    position: { type: String, enum: ['br', 'bl', 'tr', 'tl'], default: 'br' },
    avatar: { type: String, maxlength: 16 },
    welcome: { type: String, maxlength: 500 },
    systemPrompt: { type: String, maxlength: 4000 },
    tone: { type: String, maxlength: 40 },
    languages: { type: [String], default: [] },
    docs: { type: [BotDocSchema], default: [] },
    chunksCount: { type: Number, default: 0 },
    ownerTokenHash: { type: String, default: null, index: true },
    kind: { type: String, enum: [...CHATBOT_BOT_KINDS], default: 'builder' },
    lastActivityAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true, collection: 'chatbot_bots' },
);

export const ChatbotBot = mongoose.model<IChatbotBot>('ChatbotBot', ChatbotBotSchema);

export interface IChatbotChunk {
  id: string;
  docName: string;
  text: string;
}

export interface IChatbotBotChunks extends Document {
  botId: string;
  docId: string;
  chunks: IChatbotChunk[];
  createdAt: Date;
}

const ChunkSchema = new Schema<IChatbotChunk>(
  {
    id: { type: String, required: true },
    docName: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false },
);

const ChatbotBotChunksSchema = new Schema<IChatbotBotChunks>(
  {
    botId: { type: String, required: true },
    docId: { type: String, required: true },
    chunks: { type: [ChunkSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'chatbot_bot_chunks' },
);
ChatbotBotChunksSchema.index({ botId: 1, docId: 1 }, { unique: true });

export const ChatbotBotChunks = mongoose.model<IChatbotBotChunks>('ChatbotBotChunks', ChatbotBotChunksSchema);

export interface IChatbotTurnSource {
  id: string;
  name: string;
  score?: number;
  chunk?: string;
}

export interface IChatbotTurn extends Document {
  botId: string;
  turnId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: IChatbotTurnSource[];
  confidence?: number;
  /** Fecha en que MongoDB borra el turno (índice TTL). */
  expiresAt: Date;
}

const TurnSourceSchema = new Schema<IChatbotTurnSource>(
  {
    id: { type: String },
    name: { type: String },
    score: { type: Number },
    chunk: { type: String },
  },
  { _id: false },
);

const ChatbotTurnSchema = new Schema<IChatbotTurn>(
  {
    botId: { type: String, required: true },
    turnId: { type: String, required: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, required: true },
    sources: { type: [TurnSourceSchema], default: undefined },
    confidence: { type: Number },
    expiresAt: { type: Date, required: true },
  },
  { collection: 'chatbot_turns' },
);
ChatbotTurnSchema.index({ botId: 1, timestamp: -1 });
ChatbotTurnSchema.index({ botId: 1, turnId: 1 }, { unique: true });
ChatbotTurnSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ChatbotTurn = mongoose.model<IChatbotTurn>('ChatbotTurn', ChatbotTurnSchema);
