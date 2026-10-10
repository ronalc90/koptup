/**
 * chatbot-store.service.ts — almacenamiento de los bots del chatbot RAG en
 * MongoDB (models/ChatbotBot.ts): configuración, documentos, fragmentos y
 * conversaciones.
 *
 *  - Los bots y sus documentos sobreviven a reinicios y despliegues. El job
 *    de conservación (jobs/retention.job.ts) borra los bots sin uso:
 *    `sample` tras CHATBOT_SAMPLE_BOT_RETENTION_DAYS (30 días por defecto) y
 *    los de "Configura el tuyo" tras CHATBOT_BOT_RETENTION_DAYS (365).
 *  - Conversaciones: solo las del widget de un bot de usuario, con
 *    vencimiento automático (CHATBOT_CONVERSATION_TTL_DAYS, 30 días por
 *    defecto; índice TTL de MongoDB) y como máximo las últimas 200 por bot.
 *  - Migración: si existe el archivo heredado `data/chatbots/state.json`, se
 *    importa una vez (sin pisar lo que ya esté en la base; las
 *    conversaciones ya vencidas no se importan) y luego se borra.
 *
 * Los fragmentos se cachean en memoria por bot y versión (`updatedAt`): con
 * varias instancias, cada una recarga cuando el bot cambió.
 */
import { ChatbotBot, ChatbotBotChunks, ChatbotTurn, type ChatbotBotKind, type IChatbotBotDoc } from '../models/ChatbotBot';
import { readLegacyState, retireLegacyStateFile } from '../data/chatbot-store';
import { tokenize, type RagChunk } from './rag-pipeline';
import { isDbReady } from '../middleware/access';
import { logger } from '../utils/logger';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Turnos de conversación que se conservan por bot (los más recientes). */
export const MAX_TURNS_PER_BOT = 200;
/** Cada cuánto, como mucho, el chat actualiza `lastActivityAt` del bot. */
const ACTIVITY_TOUCH_MS = 60 * 60 * 1000;

function envDays(name: string, fallback: number, max: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n >= 1 && n <= max ? Math.floor(n) : fallback;
}

/** Días que se guarda cada pregunta y respuesta del widget (1 a 365; 30 por defecto). */
export function conversationTtlDays(): number {
  return envDays('CHATBOT_CONVERSATION_TTL_DAYS', 30, 365);
}

/** Días sin uso tras los que se borra un bot de ejemplo (1 a 365; 30 por defecto). */
export function sampleBotRetentionDays(): number {
  return envDays('CHATBOT_SAMPLE_BOT_RETENTION_DAYS', 30, 365);
}

/** Días sin uso tras los que se borra un bot de "Configura el tuyo" (1 a 3650; 365 por defecto). */
export function builderBotRetentionDays(): number {
  return envDays('CHATBOT_BOT_RETENTION_DAYS', 365, 3650);
}

/** Bots de ejemplo públicos (CHATBOT_EXAMPLE_BOT_IDS): visibles para todos y sin historial. */
export function exampleBotIds(): Set<string> {
  return new Set(
    (process.env.CHATBOT_EXAMPLE_BOT_IDS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

/** Bots que puede haber a la vez (protección de la base; 20 000 por defecto). */
export function maxBots(): number {
  const n = Number(process.env.CHATBOT_MAX_BOTS);
  return Number.isInteger(n) && n >= 1 ? n : 20000;
}

export interface StoredBot {
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
  lastActivityAt: Date;
  createdAt: string;
  updatedAt: string;
}

export interface StoredTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Array<{ id: string; name: string; score?: number; chunk?: string }>;
  confidence?: number;
}

export type BotConfigPatch = Partial<Pick<StoredBot, 'name' | 'color' | 'position' | 'avatar' | 'welcome' | 'systemPrompt' | 'tone' | 'languages'>>;

function toIso(d: unknown): string {
  return d instanceof Date ? d.toISOString() : typeof d === 'string' ? d : new Date().toISOString();
}

function toStoredBot(doc: any): StoredBot {
  return {
    botId: doc.botId,
    name: doc.name,
    color: doc.color,
    position: doc.position ?? 'br',
    avatar: doc.avatar ?? '',
    welcome: doc.welcome ?? '',
    systemPrompt: doc.systemPrompt ?? '',
    tone: doc.tone ?? '',
    languages: Array.isArray(doc.languages) ? [...doc.languages] : [],
    docs: Array.isArray(doc.docs) ? doc.docs.map((d: IChatbotBotDoc) => ({ id: d.id, name: d.name, size: d.size, mime: d.mime, hash: d.hash, uploadedAt: d.uploadedAt })) : [],
    chunksCount: doc.chunksCount ?? 0,
    ownerTokenHash: doc.ownerTokenHash ?? null,
    kind: doc.kind === 'sample' ? 'sample' : 'builder',
    lastActivityAt: doc.lastActivityAt instanceof Date ? doc.lastActivityAt : new Date(doc.lastActivityAt ?? Date.now()),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

// ---------------------------------------------------------------------------
//   Migración del archivo heredado
// ---------------------------------------------------------------------------

let migration: Promise<void> | null = null;

/**
 * Importa `data/chatbots/state.json` a MongoDB si existe (una vez por
 * proceso; si la base no está lista, se reintenta en la siguiente llamada).
 * Idempotente: no pisa bots, documentos ni turnos que ya estén en la base.
 */
export function ensureChatbotMigrated(): Promise<void> {
  if (!isDbReady()) return Promise.resolve();
  if (!migration) {
    migration = migrateLegacyFile().catch((err) => {
      migration = null;
      logger.error(`[chatbot-store] No se pudo migrar el archivo heredado: ${(err as Error)?.message ?? err}`);
    });
  }
  return migration;
}

/** Solo pruebas: permite volver a correr la migración. */
export function resetChatbotMigrationForTests(): void {
  migration = null;
  chunkCache.clear();
}

async function migrateLegacyFile(): Promise<void> {
  const state = readLegacyState();
  if (!state) return;
  if (state === 'corrupt') {
    // No se borra: el equipo debe revisarlo (o borrarlo) a mano.
    logger.error('[chatbot-store] El archivo heredado del chatbot no es un JSON válido: no se migró ni se borró');
    return;
  }

  const now = Date.now();
  const ttlMs = conversationTtlDays() * DAY_MS;
  const docsByBot = new Map(state.docs);
  const chunksByBot = new Map(state.chunks);
  let bots = 0;
  let turns = 0;

  for (const [botId, raw] of state.bots) {
    if (typeof botId !== 'string' || !/^[A-Za-z0-9_-]{3,64}$/.test(botId) || !raw || typeof raw !== 'object') continue;
    const docs: IChatbotBotDoc[] = (Array.isArray(docsByBot.get(botId)) ? docsByBot.get(botId) : Array.isArray(raw.docs) ? raw.docs : [])
      .filter((d: any) => d && typeof d.id === 'string' && typeof d.name === 'string')
      .map((d: any) => ({
        id: d.id,
        name: String(d.name).slice(0, 200),
        size: Number(d.size) || 0,
        mime: String(d.mime ?? 'text/plain').slice(0, 120),
        hash: String(d.hash ?? '').slice(0, 64),
        uploadedAt: typeof d.uploadedAt === 'string' ? d.uploadedAt : new Date(now).toISOString(),
      }));

    // Fragmentos agrupados por documento.
    const chunks = (chunksByBot.get(botId) ?? []).filter((c: any) => c && typeof c.text === 'string' && typeof c.docId === 'string');
    const byDoc = new Map<string, Array<{ id: string; docName: string; text: string }>>();
    for (const c of chunks) {
      const list = byDoc.get(c.docId) ?? [];
      list.push({ id: String(c.id ?? ''), docName: String(c.docName ?? ''), text: c.text });
      byDoc.set(c.docId, list);
    }
    for (const [docId, list] of byDoc) {
      await ChatbotBotChunks.updateOne({ botId, docId }, { $setOnInsert: { botId, docId, chunks: list, createdAt: new Date(now) } }, { upsert: true, timestamps: false });
    }

    const createdAt = Date.parse(raw.createdAt) ? new Date(raw.createdAt) : new Date(now);
    const updatedAt = Date.parse(raw.updatedAt) ? new Date(raw.updatedAt) : createdAt;
    const res = await ChatbotBot.updateOne(
      { botId },
      {
        $setOnInsert: {
          botId,
          name: String(raw.name ?? 'Demo Bot').slice(0, 80),
          color: /^#[0-9a-fA-F]{3,8}$/.test(raw.color) ? raw.color : '#4F46E5',
          position: ['br', 'bl', 'tr', 'tl'].includes(raw.position) ? raw.position : 'br',
          avatar: String(raw.avatar ?? '🤖').slice(0, 16),
          welcome: String(raw.welcome ?? '').slice(0, 500),
          systemPrompt: String(raw.systemPrompt ?? '').slice(0, 4000),
          tone: String(raw.tone ?? 'professional').slice(0, 40),
          languages: Array.isArray(raw.languages) ? raw.languages.filter((l: unknown) => typeof l === 'string').slice(0, 10) : [],
          docs,
          chunksCount: chunks.length,
          ownerTokenHash: typeof raw.ownerTokenHash === 'string' ? raw.ownerTokenHash : null,
          kind: 'builder',
          lastActivityAt: updatedAt,
          createdAt,
          updatedAt,
        },
      },
      { upsert: true, timestamps: false },
    );
    if (res.upsertedCount) bots += 1;
  }

  // Conversaciones: solo las que no habrían vencido con el plazo vigente.
  for (const [botId, list] of state.conversations) {
    if (typeof botId !== 'string' || !Array.isArray(list)) continue;
    const valid = list
      .filter((t: any) => t && (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string' && t.content)
      .map((t: any) => ({ ...t, ts: Date.parse(t.timestamp) || 0 }))
      .filter((t: any) => t.ts > 0 && t.ts + ttlMs > now)
      .slice(-MAX_TURNS_PER_BOT);
    for (const t of valid) {
      const r = await ChatbotTurn.updateOne(
        { botId, turnId: String(t.id || `migrado_${t.ts}_${t.role}`) },
        {
          $setOnInsert: {
            botId,
            turnId: String(t.id || `migrado_${t.ts}_${t.role}`),
            role: t.role,
            content: t.content,
            timestamp: new Date(t.ts),
            ...(Array.isArray(t.sources) ? { sources: t.sources.slice(0, 10) } : {}),
            ...(typeof t.confidence === 'number' ? { confidence: t.confidence } : {}),
            expiresAt: new Date(t.ts + ttlMs),
          },
        },
        { upsert: true },
      );
      if (r.upsertedCount) turns += 1;
    }
  }

  retireLegacyStateFile();
  logger.info(`[chatbot-store] Archivo heredado migrado a MongoDB (bots nuevos: ${bots}, turnos vigentes: ${turns}) y retirado del disco`);
}

// ---------------------------------------------------------------------------
//   Bots
// ---------------------------------------------------------------------------

export async function findBot(botId: string): Promise<StoredBot | null> {
  await ensureChatbotMigrated();
  const doc = await ChatbotBot.findOne({ botId }).lean();
  return doc ? toStoredBot(doc) : null;
}

export async function countBots(): Promise<number> {
  await ensureChatbotMigrated();
  return ChatbotBot.estimatedDocumentCount();
}

/** Bots de los dueños indicados (hashes de sus tokens) y los de ejemplo públicos. */
export async function listVisibleBots(ownerHashes: string[], exampleIds: string[]): Promise<StoredBot[]> {
  await ensureChatbotMigrated();
  const or: Record<string, unknown>[] = [];
  if (ownerHashes.length) or.push({ ownerTokenHash: { $in: ownerHashes } });
  if (exampleIds.length) or.push({ botId: { $in: exampleIds } });
  if (!or.length) return [];
  const docs = await ChatbotBot.find({ $or: or }).sort({ updatedAt: -1 }).limit(1000).lean();
  return docs.map(toStoredBot);
}

export async function createStoredBot(input: Omit<StoredBot, 'createdAt' | 'updatedAt' | 'lastActivityAt' | 'chunksCount'>): Promise<StoredBot> {
  await ensureChatbotMigrated();
  const doc = await ChatbotBot.create({ ...input, chunksCount: 0, lastActivityAt: new Date() });
  return toStoredBot(doc.toObject());
}

export async function updateBotConfig(botId: string, patch: BotConfigPatch): Promise<StoredBot | null> {
  const doc = await ChatbotBot.findOneAndUpdate({ botId }, { $set: { ...patch, lastActivityAt: new Date() } }, { new: true }).lean();
  return doc ? toStoredBot(doc) : null;
}

/** Borra el bot con sus fragmentos y conversaciones. */
export async function deleteBotCascade(botId: string): Promise<void> {
  await Promise.all([ChatbotBot.deleteOne({ botId }), ChatbotBotChunks.deleteMany({ botId }), ChatbotTurn.deleteMany({ botId })]);
  chunkCache.delete(botId);
}

/** Marca actividad del bot (como mucho una escritura por hora). */
export async function touchBot(bot: StoredBot, now = new Date()): Promise<void> {
  if (now.getTime() - bot.lastActivityAt.getTime() < ACTIVITY_TOUCH_MS) return;
  await ChatbotBot.updateOne({ botId: bot.botId }, { $set: { lastActivityAt: now } }, { timestamps: false }).catch(() => undefined);
}

// ---------------------------------------------------------------------------
//   Documentos y fragmentos
// ---------------------------------------------------------------------------

const CHUNK_CACHE_MAX = 200;
const chunkCache = new Map<string, { version: string; chunks: RagChunk[] }>();

/** Fragmentos del bot (con las palabras para BM25), cacheados por versión del bot. */
export async function getBotChunks(bot: StoredBot): Promise<RagChunk[]> {
  const cached = chunkCache.get(bot.botId);
  if (cached && cached.version === bot.updatedAt) return cached.chunks;
  const sets = await ChatbotBotChunks.find({ botId: bot.botId }).sort({ createdAt: 1 }).lean();
  const order = new Map(bot.docs.map((d, i) => [d.id, i]));
  sets.sort((a, b) => (order.get(a.docId) ?? 1e9) - (order.get(b.docId) ?? 1e9));
  const chunks: RagChunk[] = [];
  for (const set of sets) {
    for (const c of set.chunks ?? []) {
      chunks.push({ id: c.id, docId: set.docId, docName: c.docName, text: c.text, tokens: tokenize(c.text) });
    }
  }
  if (chunkCache.size >= CHUNK_CACHE_MAX) {
    const oldest = chunkCache.keys().next().value;
    if (oldest !== undefined) chunkCache.delete(oldest);
  }
  chunkCache.set(bot.botId, { version: bot.updatedAt, chunks });
  return chunks;
}

/** Guarda documentos nuevos con sus fragmentos y devuelve el bot actualizado. */
export async function addBotDocs(botId: string, added: Array<{ meta: IChatbotBotDoc; chunks: RagChunk[] }>): Promise<StoredBot | null> {
  if (!added.length) return findBot(botId);
  await ChatbotBotChunks.insertMany(
    added.map(({ meta, chunks }) => ({ botId, docId: meta.id, chunks: chunks.map((c) => ({ id: c.id, docName: c.docName, text: c.text })) })),
  );
  const total = added.reduce((n, a) => n + a.chunks.length, 0);
  const doc = await ChatbotBot.findOneAndUpdate(
    { botId },
    { $push: { docs: { $each: added.map((a) => a.meta) } }, $inc: { chunksCount: total }, $set: { lastActivityAt: new Date() } },
    { new: true },
  ).lean();
  if (!doc) {
    // El bot se borró mientras tanto: no quedan fragmentos huérfanos.
    await ChatbotBotChunks.deleteMany({ botId, docId: { $in: added.map((a) => a.meta.id) } });
    return null;
  }
  return toStoredBot(doc);
}

/** Quita un documento y sus fragmentos. */
export async function removeBotDoc(botId: string, docId: string): Promise<StoredBot | null> {
  const set = await ChatbotBotChunks.findOneAndDelete({ botId, docId }).lean();
  const removed = set?.chunks?.length ?? 0;
  const doc = await ChatbotBot.findOneAndUpdate(
    { botId },
    { $pull: { docs: { id: docId } }, $inc: { chunksCount: -removed }, $set: { lastActivityAt: new Date() } },
    { new: true },
  ).lean();
  return doc ? toStoredBot(doc) : null;
}

// ---------------------------------------------------------------------------
//   Conversaciones
// ---------------------------------------------------------------------------

/** Guarda turnos con vencimiento y deja solo los últimos 200 del bot. */
export async function appendTurns(botId: string, turns: StoredTurn[], now = new Date()): Promise<void> {
  if (!turns.length) return;
  const expiresAt = new Date(now.getTime() + conversationTtlDays() * DAY_MS);
  await ChatbotTurn.insertMany(
    turns.map((t) => ({
      botId,
      turnId: t.id,
      role: t.role,
      content: t.content,
      timestamp: new Date(t.timestamp),
      ...(t.sources ? { sources: t.sources } : {}),
      ...(typeof t.confidence === 'number' ? { confidence: t.confidence } : {}),
      expiresAt,
    })),
  );
  const overflow = await ChatbotTurn.find({ botId }).sort({ timestamp: -1, _id: -1 }).skip(MAX_TURNS_PER_BOT).select('_id').lean();
  if (overflow.length) await ChatbotTurn.deleteMany({ _id: { $in: overflow.map((o) => o._id) } });
}

/** Últimos `limit` turnos del bot, del más antiguo al más reciente. */
export async function listTurns(botId: string, limit: number): Promise<StoredTurn[]> {
  const docs = await ChatbotTurn.find({ botId, expiresAt: { $gt: new Date() } }).sort({ timestamp: -1, _id: -1 }).limit(limit).lean();
  return docs.reverse().map((d) => ({
    id: d.turnId,
    role: d.role,
    content: d.content,
    timestamp: d.timestamp.toISOString(),
    ...(d.sources ? { sources: d.sources } : {}),
    ...(typeof d.confidence === 'number' ? { confidence: d.confidence } : {}),
  }));
}

export async function clearTurns(botId: string): Promise<void> {
  await ChatbotTurn.deleteMany({ botId });
}

/** Turnos vigentes por bot. */
export async function countTurnsByBot(botIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!botIds.length) return out;
  const rows = await ChatbotTurn.aggregate<{ _id: string; n: number }>([
    { $match: { botId: { $in: botIds }, expiresAt: { $gt: new Date() } } },
    { $group: { _id: '$botId', n: { $sum: 1 } } },
  ]);
  for (const r of rows) out.set(r._id, r.n);
  return out;
}

// ---------------------------------------------------------------------------
//   Conservación
// ---------------------------------------------------------------------------

/** Borra los bots sin uso pasado su plazo (con fragmentos y conversaciones). */
export async function purgeIdleBots(now = new Date()): Promise<{ sample: number; builder: number }> {
  await ensureChatbotMigrated();
  const sampleLimit = new Date(now.getTime() - sampleBotRetentionDays() * DAY_MS);
  const builderLimit = new Date(now.getTime() - builderBotRetentionDays() * DAY_MS);
  const idle = await ChatbotBot.find({
    botId: { $nin: [...exampleBotIds()] },
    $or: [
      { kind: 'sample', lastActivityAt: { $lt: sampleLimit } },
      { kind: { $ne: 'sample' }, lastActivityAt: { $lt: builderLimit } },
    ],
  })
    .select('botId kind')
    .limit(1000)
    .lean();
  let sample = 0;
  let builder = 0;
  for (const b of idle) {
    await deleteBotCascade(b.botId);
    if (b.kind === 'sample') sample += 1;
    else builder += 1;
  }
  return { sample, builder };
}
