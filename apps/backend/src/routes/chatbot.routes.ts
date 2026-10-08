import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import {
  createOrGetSession,
  uploadDocuments,
  sendMessage,
  getChatbotInfo,
  updateConfig,
  clearMessages,
  clearDocuments,
} from '../controllers/chatbot.controller';
import { load as loadState, persist as persistState } from '../data/chatbot-store';
import {
  ALLOWED_MODEL_IDS,
  DEFAULT_MODEL_ID,
  OPENAI_MODELS,
  callOpenAI,
  chunkText,
  estimateCostUSD,
  retrieve,
  type RagChunk,
} from '../services/rag-pipeline';
import { getBudgetStatus, recordSpend } from '../services/ai-budget.service';
import { extractTextFromBuffer, UnsupportedDocumentError } from '../services/document-text.service';
import { safeFetchText, SafeFetchError } from '../services/safe-fetch.service';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// --- API heredada "por sesión" (la usa /demo/chatbot/preview vía los proxies
// de Next en apps/web/src/app/api/chatbot/*). Se retira en la Fase 2 del plan.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/chatbot/');
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'chatbot-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt', '.csv', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) cb(null, true);
    else cb(new AppError('Tipo de archivo no permitido. Solo PDF, TXT, CSV, DOCX', 400));
  },
});

router.post('/session', createOrGetSession);
router.post('/upload', uploadRateLimiter, upload.array('files', 10), uploadDocuments);
router.post('/message', sendMessage);
router.get('/info/:sessionId', getChatbotInfo);
router.put('/config', updateConfig);
router.delete('/messages/:sessionId', clearMessages);
router.delete('/documents/:sessionId', clearDocuments);

// ============================================================================
//   Builder + Playground (RAG con BM25-lite y, si hay clave y presupuesto, OpenAI)
// ============================================================================
//
// El front consume estas rutas vía `apps/web/.../builder/api.ts`:
//   POST   /api/chatbot/bots                  → crear bot (devuelve ownerToken)
//   GET    /api/chatbot/bots                  → bots del propietario + ejemplos
//   GET    /api/chatbot/bots/:botId           → config (completa solo al dueño)
//   PATCH  /api/chatbot/bots/:botId           → actualizar config        [dueño]
//   DELETE /api/chatbot/bots/:botId           → borrar bot               [dueño]
//   POST   /api/chatbot/bots/:botId/docs      → subir archivos (base64)  [dueño]
//   DELETE /api/chatbot/bots/:botId/docs/:id  → eliminar doc + chunks    [dueño]
//   POST   /api/chatbot/bots/:botId/urls      → indexar páginas web      [dueño]
//   POST   /api/chatbot/bots/:botId/chat      → preguntar (público, bot existente)
//   GET    /api/chatbot/bots/:botId/conversations → histórico            [dueño]
//   DELETE /api/chatbot/bots/:botId/conversations → limpiar histórico    [dueño]
//
// PROPIEDAD: al crear un bot el backend devuelve `ownerToken` (solo esa vez).
// El cliente lo guarda y lo envía en la cabecera `X-Bot-Owner-Token` en las
// rutas marcadas [dueño]. Se guarda solo su hash SHA-256. La cabecera acepta
// varios tokens separados por comas (uno por bot del navegador). Un bot creado
// antes de este control (sin hash guardado) queda asignado al primer token que
// lo use en una ruta [dueño].

/** Cabecera con el token del propietario del bot. */
export const OWNER_TOKEN_HEADER = 'x-bot-owner-token';
const OWNER_TOKEN_RE = /^[A-Za-z0-9_-]{32,128}$/;
const MAX_OWNER_TOKENS_PER_REQUEST = 50;

/** Límites de la API de bots. */
export const BOT_LIMITS = {
  maxBots: 5000,
  maxMessageChars: 2000,
  maxHistoryItems: 10,
  maxHistoryItemChars: 2000,
  maxHistoryInput: 50,
  maxFilesPerRequest: 5,
  maxFileBytes: 5 * 1024 * 1024,
  maxDocsPerBot: 50,
  maxChunksPerBot: 5000,
  maxTextCharsPerDoc: 500_000,
  maxUrlsPerRequest: 5,
  maxUrlBytes: 2 * 1024 * 1024,
  urlTimeoutMs: 8000,
  field: {
    name: 80,
    avatar: 16,
    welcome: 500,
    systemPrompt: 4000,
    tone: 40,
    languages: 10,
    language: 10,
  },
} as const;

interface BotDocMeta {
  id: string;
  name: string;
  size: number;
  mime: string;
  hash: string;
  uploadedAt: string;
}

interface BotConfig {
  botId: string;
  name: string;
  color: string;
  position: 'br' | 'bl' | 'tr' | 'tl';
  avatar: string;
  welcome: string;
  systemPrompt: string;
  tone: string;
  languages: string[];
  createdAt: string;
  updatedAt: string;
  docs: BotDocMeta[];
  /** SHA-256 del token del propietario. Nunca se devuelve al cliente. */
  ownerTokenHash?: string;
}

type BotChunk = RagChunk;

interface ConversationTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Array<{ id: string; name: string; score?: number; chunk?: string }>;
  confidence?: number;
}

const botsStore = new Map<string, BotConfig>();
const chunksStore = new Map<string, BotChunk[]>();
const conversationsStore = new Map<string, ConversationTurn[]>();
const docsStore = new Map<string, BotDocMeta[]>();

// --- Persistencia file-based ------------------------------------------------
//
// Al arrancar el módulo rehidratamos los Maps desde disco; tras cada mutación
// importante volcamos el estado a `data/chatbots/state.json` (o
// CHATBOT_STATE_DIR). No es una BD: es un respaldo liviano para que la demo
// sobreviva reinicios del proceso.

(function hydrateFromDisk() {
  const initial = loadState();
  for (const [k, v] of initial.bots) botsStore.set(k, v as BotConfig);
  for (const [k, v] of initial.docs) docsStore.set(k, v as BotDocMeta[]);
  for (const [k, v] of initial.chunks) chunksStore.set(k, v as BotChunk[]);
  for (const [k, v] of initial.conversations) {
    conversationsStore.set(k, v as ConversationTurn[]);
  }
  for (const [botId, bot] of botsStore) {
    const docs = docsStore.get(botId);
    if (docs) bot.docs = docs;
  }
})();

function snapshot() {
  persistState({
    bots: [...botsStore.entries()],
    docs: [...docsStore.entries()],
    chunks: [...chunksStore.entries()],
    conversations: [...conversationsStore.entries()],
    updatedAt: new Date().toISOString(),
  });
}

// --- Propiedad ---------------------------------------------------------------

function hashOwnerToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  return ba.length === bb.length && ba.length > 0 && crypto.timingSafeEqual(ba, bb);
}

/** Tokens válidos que trae la cabecera (pueden ser varios separados por comas). */
function readOwnerTokens(req: Request): string[] {
  const raw = req.headers[OWNER_TOKEN_HEADER];
  const value = Array.isArray(raw) ? raw.join(',') : raw ?? '';
  return value
    .split(',')
    .map((t) => t.trim())
    .filter((t) => OWNER_TOKEN_RE.test(t))
    .slice(0, MAX_OWNER_TOKENS_PER_REQUEST);
}

function newOwnerToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/** Bots de ejemplo públicos (visibles para todos, editables solo por su dueño). */
function exampleBotIds(): Set<string> {
  return new Set(
    (process.env.CHATBOT_EXAMPLE_BOT_IDS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

function isOwner(bot: BotConfig, tokens: string[]): boolean {
  if (!bot.ownerTokenHash) return false;
  return tokens.some((t) => safeEqualHex(hashOwnerToken(t), bot.ownerTokenHash as string));
}

/**
 * Devuelve el bot si quien llama es su dueño; si no, responde 404/401/403 y
 * devuelve null. Migración: un bot sin hash guardado (creado antes del control
 * de propiedad) queda asignado al primer token que llegue.
 */
function requireOwner(req: Request, res: Response): BotConfig | null {
  const bot = botsStore.get(req.params.botId);
  if (!bot) {
    res.status(404).json({ error: 'bot_not_found' });
    return null;
  }
  const tokens = readOwnerTokens(req);
  if (tokens.length === 0) {
    res.status(401).json({
      error: 'owner_token_required',
      message: `Envía el token del propietario del bot en la cabecera ${OWNER_TOKEN_HEADER}.`,
    });
    return null;
  }
  if (!bot.ownerTokenHash) {
    bot.ownerTokenHash = hashOwnerToken(tokens[0]);
    snapshot();
    logger.info(`[chatbot] Bot ${bot.botId} sin propietario: asignado al token de esta petición (migración).`);
    return bot;
  }
  if (!isOwner(bot, tokens)) {
    res.status(403).json({ error: 'forbidden_not_owner', message: 'Este bot pertenece a otro usuario.' });
    return null;
  }
  return bot;
}

// --- Validación de la configuración ------------------------------------------

const POSITIONS = new Set(['br', 'bl', 'tr', 'tl']);
const COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;

type ConfigPatch = Partial<Pick<BotConfig, 'name' | 'color' | 'position' | 'avatar' | 'welcome' | 'systemPrompt' | 'tone' | 'languages'>>;

/** Valida y normaliza los campos editables. Devuelve el error del primer campo inválido. */
function parseConfigPatch(body: unknown): { patch: ConfigPatch } | { error: string; field: string } {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const patch: ConfigPatch = {};
  const textFields: Array<[keyof typeof BOT_LIMITS.field & keyof ConfigPatch, number]> = [
    ['name', BOT_LIMITS.field.name],
    ['avatar', BOT_LIMITS.field.avatar],
    ['welcome', BOT_LIMITS.field.welcome],
    ['systemPrompt', BOT_LIMITS.field.systemPrompt],
    ['tone', BOT_LIMITS.field.tone],
  ];
  for (const [field, max] of textFields) {
    const value = b[field];
    if (value === undefined) continue;
    if (typeof value !== 'string') return { error: 'invalid_field', field };
    if (value.length > max) return { error: 'field_too_long', field };
    (patch as Record<string, string>)[field] = value;
  }
  if (b.color !== undefined) {
    if (typeof b.color !== 'string' || !COLOR_RE.test(b.color)) return { error: 'invalid_field', field: 'color' };
    patch.color = b.color;
  }
  if (b.position !== undefined) {
    if (typeof b.position !== 'string' || !POSITIONS.has(b.position)) return { error: 'invalid_field', field: 'position' };
    patch.position = b.position as BotConfig['position'];
  }
  if (b.languages !== undefined) {
    if (
      !Array.isArray(b.languages) ||
      b.languages.length > BOT_LIMITS.field.languages ||
      b.languages.some((l) => typeof l !== 'string' || l.length > BOT_LIMITS.field.language)
    ) {
      return { error: 'invalid_field', field: 'languages' };
    }
    patch.languages = b.languages as string[];
  }
  return { patch };
}

// --- Helpers de texto -------------------------------------------------------

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// --- DTO helpers ------------------------------------------------------------

function newBotId(): string {
  return 'kbot_' + crypto.randomBytes(8).toString('hex');
}

/** Mantiene `docsStore` sincronizado con `bot.docs` (single source of truth). */
function syncDocs(bot: BotConfig): void {
  docsStore.set(bot.botId, bot.docs);
}

/** Vista completa para el dueño (sin el hash del token). */
function serializeBot(bot: BotConfig): Omit<BotConfig, 'ownerTokenHash'> & { owned: true } {
  const rest: BotConfig = { ...bot };
  delete rest.ownerTokenHash;
  return { ...rest, docs: [...bot.docs], owned: true };
}

/** Vista pública (widget): sin prompt del sistema ni nombres de documentos. */
function serializePublicBot(bot: BotConfig) {
  return {
    botId: bot.botId,
    name: bot.name,
    color: bot.color,
    position: bot.position,
    avatar: bot.avatar,
    welcome: bot.welcome,
    systemPrompt: '',
    tone: bot.tone,
    languages: [...bot.languages],
    createdAt: bot.createdAt,
    updatedAt: bot.updatedAt,
    docs: [] as BotDocMeta[],
    docsCount: bot.docs.length,
    owned: false,
  };
}

// --- Endpoints --------------------------------------------------------------

/** Crear bots: 30 por IP cada hora (memoria del proceso; IP real vía trust proxy). */
const createBotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: parseInt(process.env.CHATBOT_CREATE_LIMIT_PER_HOUR || '30', 10) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limited', message: 'Creaste demasiados bots. Intenta de nuevo más tarde.' },
});

/**
 * POST /bots — crea un bot nuevo. Devuelve `ownerToken` (única vez). Si la
 * petición trae un token válido en `X-Bot-Owner-Token`, el bot nuevo queda a
 * nombre de ese mismo token (un navegador puede usar una sola llave para
 * todos sus bots). Si viene `botId` de un bot existente, se trata como una
 * actualización y exige ser su dueño.
 */
router.post('/bots', createBotLimiter, (req: Request, res: Response) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const requestedId =
    typeof body.botId === 'string' && /^[a-zA-Z0-9_-]{3,64}$/.test(body.botId) ? body.botId : null;

  const parsed = parseConfigPatch(body);
  if ('error' in parsed) {
    res.status(400).json({ error: parsed.error, field: parsed.field });
    return;
  }

  if (requestedId && botsStore.has(requestedId)) {
    req.params.botId = requestedId;
    const bot = requireOwner(req, res);
    if (!bot) return;
    Object.assign(bot, parsed.patch);
    bot.updatedAt = new Date().toISOString();
    syncDocs(bot);
    snapshot();
    res.status(200).json(serializeBot(bot));
    return;
  }

  if (botsStore.size >= BOT_LIMITS.maxBots) {
    res.status(503).json({ error: 'capacity', message: 'La demo alcanzó su capacidad de bots. Intenta más tarde.' });
    return;
  }

  const provided = readOwnerTokens(req);
  const ownerToken = provided.length === 1 ? provided[0] : newOwnerToken();
  const now = new Date().toISOString();
  const id = requestedId ?? newBotId();
  const bot: BotConfig = {
    botId: id,
    name: parsed.patch.name || 'Demo Bot',
    color: parsed.patch.color || '#4F46E5',
    position: parsed.patch.position || 'br',
    avatar: parsed.patch.avatar || '🤖',
    welcome: parsed.patch.welcome || '¡Hola! ¿En qué puedo ayudarte hoy?',
    systemPrompt: parsed.patch.systemPrompt || 'You are a helpful enterprise assistant.',
    tone: parsed.patch.tone || 'professional',
    languages: parsed.patch.languages ?? ['es', 'en'],
    createdAt: now,
    updatedAt: now,
    docs: [],
    ownerTokenHash: hashOwnerToken(ownerToken),
  };
  botsStore.set(id, bot);
  syncDocs(bot);
  snapshot();
  res.status(201).json({ ...serializeBot(bot), ownerToken });
});

/**
 * GET /bots — bots del propietario (según los tokens de `X-Bot-Owner-Token`)
 * más los bots de ejemplo públicos (CHATBOT_EXAMPLE_BOT_IDS). Sin token solo
 * devuelve los de ejemplo. Paginación opcional con `?limit` y `?offset`.
 */
router.get('/bots', (req: Request, res: Response) => {
  const limit = Math.max(1, Math.min(500, Number(req.query.limit) || 100));
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const tokens = readOwnerTokens(req);
  const examples = exampleBotIds();
  const visible = [...botsStore.values()]
    .map((b) => ({ bot: b, owned: isOwner(b, tokens) }))
    .filter(({ bot, owned }) => owned || examples.has(bot.botId))
    .sort((a, b) => (b.bot.updatedAt || '').localeCompare(a.bot.updatedAt || ''));
  const slice = visible.slice(offset, offset + limit).map(({ bot: b, owned }) => ({
    botId: b.botId,
    name: b.name,
    color: b.color,
    avatar: b.avatar,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    docsCount: b.docs.length,
    chunksCount: owned ? (chunksStore.get(b.botId) ?? []).length : undefined,
    conversationsCount: owned ? (conversationsStore.get(b.botId) ?? []).length : 0,
    owned,
    example: examples.has(b.botId),
  }));
  res.json(slice);
});

/** GET /bots/:botId — config completa para el dueño; vista pública para el resto. */
router.get('/bots/:botId', (req: Request, res: Response) => {
  const bot = botsStore.get(req.params.botId);
  if (!bot) {
    res.status(404).json({ error: 'bot_not_found' });
    return;
  }
  if (isOwner(bot, readOwnerTokens(req))) {
    res.json(serializeBot(bot));
    return;
  }
  res.json(serializePublicBot(bot));
});

/** PATCH /bots/:botId — merge parcial validado. [dueño] */
router.patch('/bots/:botId', (req: Request, res: Response) => {
  const bot = requireOwner(req, res);
  if (!bot) return;
  const parsed = parseConfigPatch(req.body);
  if ('error' in parsed) {
    res.status(400).json({ error: parsed.error, field: parsed.field });
    return;
  }
  Object.assign(bot, parsed.patch);
  bot.updatedAt = new Date().toISOString();
  syncDocs(bot);
  snapshot();
  res.json(serializeBot(bot));
});

/** DELETE /bots/:botId — borra el bot, sus docs, chunks y conversaciones. [dueño] */
router.delete('/bots/:botId', (req: Request, res: Response) => {
  const bot = requireOwner(req, res);
  if (!bot) return;
  const botId = bot.botId;
  botsStore.delete(botId);
  docsStore.delete(botId);
  chunksStore.delete(botId);
  conversationsStore.delete(botId);
  snapshot();
  res.json({ deleted: true, botId });
});

/** Tamaño decodificado de un base64 sin decodificarlo. */
function base64DecodedBytes(b64: string): number {
  const clean = b64.replace(/\s/g, '');
  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  return Math.floor((clean.length * 3) / 4) - padding;
}

/**
 * POST /bots/:botId/docs — ingesta de archivos en base64. [dueño]
 * PDF (pdf-parse) y DOCX (mammoth) se parsean de verdad; texto plano se
 * decodifica. Máximo 5 archivos por petición, 5 MB cada uno y 50 por bot.
 */
router.post('/bots/:botId/docs', async (req: Request, res: Response) => {
  const bot = requireOwner(req, res);
  if (!bot) return;
  const incoming = Array.isArray(req.body?.files) ? req.body.files : [];
  if (incoming.length === 0) {
    res.status(400).json({ error: 'no_files' });
    return;
  }
  if (incoming.length > BOT_LIMITS.maxFilesPerRequest) {
    res.status(400).json({ error: 'too_many_files', max: BOT_LIMITS.maxFilesPerRequest });
    return;
  }
  if (bot.docs.length + incoming.length > BOT_LIMITS.maxDocsPerBot) {
    res.status(400).json({ error: 'too_many_docs', max: BOT_LIMITS.maxDocsPerBot });
    return;
  }

  const added: BotDocMeta[] = [];
  const errors: Array<{ name: string; reason: string }> = [];
  const existingChunks = chunksStore.get(bot.botId) ?? [];

  for (const f of incoming) {
    const name = path.basename(String(f?.name || 'document')).slice(0, 200);
    const mime = String(f?.mime || 'application/octet-stream').slice(0, 120);
    const b64 = typeof f?.contentBase64 === 'string' ? f.contentBase64 : '';
    if (!b64) {
      errors.push({ name, reason: 'missing_content' });
      continue;
    }
    if (base64DecodedBytes(b64) > BOT_LIMITS.maxFileBytes) {
      errors.push({ name, reason: 'file_too_large' });
      continue;
    }
    const buffer = Buffer.from(b64, 'base64');
    if (buffer.length === 0) {
      errors.push({ name, reason: 'missing_content' });
      continue;
    }
    if (buffer.length > BOT_LIMITS.maxFileBytes) {
      errors.push({ name, reason: 'file_too_large' });
      continue;
    }

    let text: string;
    try {
      const extracted = await extractTextFromBuffer(buffer, { name, mime });
      text = extracted.text.slice(0, BOT_LIMITS.maxTextCharsPerDoc);
    } catch (err) {
      errors.push({ name, reason: err instanceof UnsupportedDocumentError ? err.reason : 'unreadable' });
      continue;
    }
    if (text.trim().length === 0) {
      errors.push({ name, reason: 'empty_content' });
      continue;
    }

    const id = 'doc_' + crypto.randomBytes(8).toString('hex');
    const fileChunks = chunkText(text, { docId: id, docName: name });
    if (existingChunks.length + fileChunks.length > BOT_LIMITS.maxChunksPerBot) {
      errors.push({ name, reason: 'bot_capacity' });
      continue;
    }
    existingChunks.push(...fileChunks);
    const meta: BotDocMeta = {
      id,
      name,
      size: buffer.length,
      mime,
      hash: crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 16),
      uploadedAt: new Date().toISOString(),
    };
    bot.docs.push(meta);
    added.push(meta);
  }

  chunksStore.set(bot.botId, existingChunks);
  if (added.length > 0) {
    bot.updatedAt = new Date().toISOString();
    syncDocs(bot);
    snapshot();
    res.status(201).json({ docs: bot.docs, added, errors });
    return;
  }
  res.status(422).json({ error: 'no_valid_files', docs: bot.docs, added, errors });
});

/** DELETE /bots/:botId/docs/:docId — borra metadata + chunks asociados. [dueño] */
router.delete('/bots/:botId/docs/:docId', (req: Request, res: Response) => {
  const bot = requireOwner(req, res);
  if (!bot) return;
  const docId = req.params.docId;
  bot.docs = bot.docs.filter((d) => d.id !== docId);
  const chunks = chunksStore.get(bot.botId) ?? [];
  chunksStore.set(bot.botId, chunks.filter((c) => c.docId !== docId));
  bot.updatedAt = new Date().toISOString();
  syncDocs(bot);
  snapshot();
  res.json({ docs: bot.docs });
});

/**
 * POST /bots/:botId/urls — descarga páginas públicas, quita el HTML y las
 * indexa. [dueño] Máximo 5 URLs por petición y 2 MB por página; bloquea IPs
 * privadas, loopback y de metadatos (ver services/safe-fetch.service.ts).
 */
router.post('/bots/:botId/urls', async (req: Request, res: Response) => {
  const bot = requireOwner(req, res);
  if (!bot) return;
  const urls = Array.isArray(req.body?.urls) ? req.body.urls : [];
  if (urls.length === 0) {
    res.status(400).json({ error: 'no_urls' });
    return;
  }
  if (urls.length > BOT_LIMITS.maxUrlsPerRequest) {
    res.status(400).json({ error: 'too_many_urls', max: BOT_LIMITS.maxUrlsPerRequest });
    return;
  }
  if (bot.docs.length + urls.length > BOT_LIMITS.maxDocsPerBot) {
    res.status(400).json({ error: 'too_many_docs', max: BOT_LIMITS.maxDocsPerBot });
    return;
  }

  const added: BotDocMeta[] = [];
  const errors: Array<{ url: string; reason: string }> = [];
  const existingChunks = chunksStore.get(bot.botId) ?? [];

  for (const rawUrl of urls) {
    const url = String(rawUrl || '').trim().slice(0, 2048);
    if (!/^https?:\/\//i.test(url)) {
      errors.push({ url, reason: 'invalid_url' });
      continue;
    }
    try {
      const page = await safeFetchText(url, {
        maxBytes: BOT_LIMITS.maxUrlBytes,
        timeoutMs: BOT_LIMITS.urlTimeoutMs,
      });
      const text = stripHtml(page.body).slice(0, BOT_LIMITS.maxTextCharsPerDoc);
      if (text.length < 40) {
        errors.push({ url, reason: 'empty_content' });
        continue;
      }
      const hostname = new URL(page.finalUrl).hostname;
      const id = 'doc_' + crypto.randomBytes(8).toString('hex');
      const chunks = chunkText(text, { docId: id, docName: hostname });
      if (existingChunks.length + chunks.length > BOT_LIMITS.maxChunksPerBot) {
        errors.push({ url, reason: 'bot_capacity' });
        continue;
      }
      existingChunks.push(...chunks);
      const meta: BotDocMeta = {
        id,
        name: hostname,
        size: text.length,
        mime: 'text/html',
        hash: crypto.createHash('sha256').update(url).digest('hex').slice(0, 16),
        uploadedAt: new Date().toISOString(),
      };
      bot.docs.push(meta);
      added.push(meta);
    } catch (err: unknown) {
      errors.push({ url, reason: err instanceof SafeFetchError ? err.reason : 'fetch_failed' });
    }
  }
  chunksStore.set(bot.botId, existingChunks);
  bot.updatedAt = new Date().toISOString();
  syncDocs(bot);
  snapshot();
  res.json({ docs: bot.docs, added, errors });
});

/** Agrega un turno a la conversación del bot. Conserva últimos 200 turnos. */
function appendConversation(botId: string, turn: ConversationTurn): void {
  const list = conversationsStore.get(botId) ?? [];
  list.push(turn);
  if (list.length > 200) list.splice(0, list.length - 200);
  conversationsStore.set(botId, list);
}

/**
 * GET /models — modelos permitidos (la lista blanca que ofrece la demo) y si
 * están habilitados (hay API key). Nunca expone la clave.
 */
router.get('/models', (_req: Request, res: Response) => {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  res.json({
    available: OPENAI_MODELS.map((m) => ({
      ...m,
      enabled: hasOpenAI,
    })),
    activeProvider: hasOpenAI ? 'openai' : null,
  });
});

/**
 * Respuesta cuando los documentos no contienen la información. Es la frase
 * que promete /rag ("Cómo evitamos respuestas inventadas").
 */
const NOT_FOUND_REPLY = 'No encontré esa información en los documentos cargados.';

/**
 * Reglas de respuesta que se agregan SIEMPRE al prompt del sistema, también
 * cuando el bot tiene un prompt propio (ese prompt solo define rol y tono).
 */
const GROUNDING_RULES = [
  'Reglas obligatorias para responder:',
  '1. Responde solo con la información de los fragmentos numerados que acompañan la pregunta. No uses conocimiento externo ni inventes datos.',
  '2. Cita la fuente de cada dato con el número del fragmento entre corchetes: [1], [2], etc.',
  `3. Si los fragmentos no contienen la respuesta, o no hay fragmentos, responde "${NOT_FOUND_REPLY}" (en inglés: "I couldn't find that information in the uploaded documents.") y, si sirve, sugiere qué documento cargar.`,
  'Responde en el idioma de la pregunta y, en español, trata al usuario de "tú".',
].join('\n');

function composeExtractiveReply(retrieved: Array<{ chunk: BotChunk; score: number }>): string {
  if (retrieved.length === 0) {
    return `${NOT_FOUND_REPLY} Prueba reformular la pregunta o subir más documentos.`;
  }
  return retrieved
    .map(
      (r, idx) =>
        `[${idx + 1}] ${r.chunk.text.slice(0, 280)}${r.chunk.text.length > 280 ? '…' : ''}`,
    )
    .join('\n\n');
}

function formatSource(
  r: { chunk: BotChunk; score: number },
  idx: number,
): { id: string; index: number; name: string; score: number; chunk: string } {
  return {
    id: r.chunk.id,
    index: idx + 1,
    name: r.chunk.docName,
    score: Number(r.score.toFixed(3)),
    chunk: r.chunk.text,
  };
}

/** Historial acotado: últimos 10 turnos user/assistant, cada uno ≤ 2.000 caracteres. */
function sanitizeHistory(raw: unknown): Array<{ role: string; content: string }> | 'too_long' {
  if (!Array.isArray(raw)) return [];
  if (raw.length > BOT_LIMITS.maxHistoryInput) return 'too_long';
  return raw
    .filter(
      (m): m is { role: string; content: string } =>
        !!m && typeof m === 'object' && typeof (m as any).content === 'string' &&
        ((m as any).role === 'user' || (m as any).role === 'assistant'),
    )
    .slice(-BOT_LIMITS.maxHistoryItems)
    .map((m) => ({ role: m.role, content: m.content.slice(0, BOT_LIMITS.maxHistoryItemChars) }));
}

/**
 * POST /bots/:botId/chat — público, solo para bots existentes:
 *   1. Recupera top-5 chunks por BM25-lite sobre los docs del bot.
 *   2. Con OPENAI_API_KEY y presupuesto del mes (CHATBOT_MONTHLY_BUDGET_USD,
 *      medido en Redis), llama al modelo elegido de la lista blanca
 *      (gpt-4o-mini por defecto) y suma el costo al gasto del mes.
 *   3. Sin clave, sin presupuesto o si el proveedor falla: modo extractivo
 *      (cita los fragmentos) y lo dice en la respuesta.
 */
router.post('/bots/:botId/chat', async (req: Request, res: Response) => {
  const botId = req.params.botId;
  const bot = botsStore.get(botId);
  if (!bot) {
    res.status(404).json({ error: 'bot_not_found' });
    return;
  }
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!message) {
    res.status(400).json({ error: 'empty_message' });
    return;
  }
  if (message.length > BOT_LIMITS.maxMessageChars) {
    res.status(400).json({ error: 'message_too_long', max: BOT_LIMITS.maxMessageChars });
    return;
  }
  const history = sanitizeHistory(req.body?.history);
  if (history === 'too_long') {
    res.status(400).json({ error: 'history_too_long', max: BOT_LIMITS.maxHistoryInput });
    return;
  }

  const allChunks = chunksStore.get(botId) ?? [];
  const requestedModel = typeof req.body?.model === 'string' ? req.body.model : DEFAULT_MODEL_ID;
  const safeModel = ALLOWED_MODEL_IDS.has(requestedModel) ? requestedModel : DEFAULT_MODEL_ID;
  const timestampStart = new Date().toISOString();

  const retrieved = retrieve(message, allChunks, 5);
  const sources = retrieved.map((r, i) => formatSource(r, i));

  function finish(payload: {
    reply: string;
    confidence: number;
    latencyMs: number;
    model: string;
    tokens?: { prompt: number; completion: number; total: number };
    costUSD?: number;
    error?: string;
  }) {
    appendConversation(botId, {
      id: 'msg_' + crypto.randomBytes(6).toString('hex'),
      role: 'user',
      content: message,
      timestamp: timestampStart,
    });
    appendConversation(botId, {
      id: 'msg_' + crypto.randomBytes(6).toString('hex'),
      role: 'assistant',
      content: payload.reply,
      timestamp: new Date().toISOString(),
      sources: sources.map((s) => ({ id: s.id, name: s.name, score: s.score, chunk: s.chunk })),
      confidence: payload.confidence,
    });
    snapshot();
    res.json({
      botId,
      reply: payload.reply,
      sources,
      confidence: Number(payload.confidence.toFixed(2)),
      latencyMs: payload.latencyMs,
      model: payload.model,
      tokens: payload.tokens,
      costUSD: payload.costUSD,
      error: payload.error,
      timestamp: timestampStart,
    });
  }

  function extractive(note: string | null, error?: string) {
    const base =
      retrieved.length > 0
        ? composeExtractiveReply(retrieved)
        : allChunks.length === 0
          ? 'Aún no tienes documentos cargados. Sube un archivo o agrega una URL en el Builder y vuelve a preguntarme.'
          : NOT_FOUND_REPLY;
    finish({
      reply: note && retrieved.length > 0 ? `${note} ${base}` : base,
      confidence: retrieved.length > 0 ? 0.3 : 0,
      latencyMs: 50,
      model: 'extractive-bm25',
      error,
    });
  }

  // --- Sin LLM: modo extractivo puro -------------------------------------
  if (!process.env.OPENAI_API_KEY) {
    extractive(null);
    return;
  }

  // --- Tope de gasto mensual (Redis, compartido con la infraestructura de demo-rag)
  const budget = await getBudgetStatus('chatbot');
  if (!budget.available) {
    extractive(
      budget.reason === 'budget_exhausted'
        ? '(Modo extractivo: alcanzamos el cupo mensual de IA de esta demo.)'
        : '(Modo extractivo: la IA no está disponible en este momento.)',
      budget.reason === 'budget_exhausted' ? 'budget_exhausted' : 'budget_unavailable',
    );
    return;
  }

  // --- Con LLM -----------------------------------------------------------
  const tone = bot.tone || 'professional';
  const persona =
    bot.systemPrompt && bot.systemPrompt.trim().length > 0
      ? bot.systemPrompt
      : `Eres un asistente virtual con tono ${tone}. Sé conciso y directo.`;
  const systemPrompt = `${persona}\n\n${GROUNDING_RULES}`;

  const context =
    retrieved.length > 0
      ? retrieved.map((r, i) => `[${i + 1}] (${r.chunk.docName}) ${r.chunk.text}`).join('\n\n')
      : allChunks.length === 0
        ? '(Ninguno: el bot todavía no tiene documentos cargados. Aplica la regla 3 y sugiere subir documentos.)'
        : '(Ninguno: ningún fragmento de los documentos cargados coincide con la pregunta. Aplica la regla 3.)';

  try {
    const result = await callOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: safeModel,
      systemPrompt,
      context,
      history,
      userMessage: message,
    });
    const costUSD = estimateCostUSD(safeModel, result.promptTokens, result.completionTokens);
    await recordSpend('chatbot', costUSD);
    finish({
      reply: result.reply,
      confidence: retrieved.length > 0 ? 0.85 : 0.5,
      latencyMs: result.latencyMs,
      model: safeModel,
      tokens: {
        prompt: result.promptTokens,
        completion: result.completionTokens,
        total: result.totalTokens,
      },
      costUSD,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const latencyMs =
      err && typeof err === 'object' && 'latencyMs' in err && typeof (err as { latencyMs?: unknown }).latencyMs === 'number'
        ? (err as { latencyMs: number }).latencyMs
        : 200;
    logger.error(`[chatbot] OpenAI call failed: ${msg.slice(0, 300)}`);
    const fallbackReply =
      retrieved.length > 0
        ? `(Modo extractivo por error del proveedor LLM) ${composeExtractiveReply(retrieved)}`
        : allChunks.length === 0
          ? 'No pude generar la respuesta (error del proveedor LLM) y todavía no tienes documentos cargados.'
          : NOT_FOUND_REPLY;
    finish({
      reply: fallbackReply,
      confidence: retrieved.length > 0 ? 0.3 : 0,
      latencyMs,
      model: 'extractive-bm25-fallback',
      error: 'llm_provider_error',
    });
  }
});

/** GET /bots/:botId/conversations — últimos N turnos (default 50, máx 200). [dueño] */
router.get('/bots/:botId/conversations', (req: Request, res: Response) => {
  const bot = requireOwner(req, res);
  if (!bot) return;
  const limit = Math.max(1, Math.min(200, Number(req.query.limit) || 50));
  const list = conversationsStore.get(bot.botId) ?? [];
  res.json(list.slice(-limit));
});

/** DELETE /bots/:botId/conversations — limpia el histórico del bot. [dueño] */
router.delete('/bots/:botId/conversations', (req: Request, res: Response) => {
  const bot = requireOwner(req, res);
  if (!bot) return;
  conversationsStore.set(bot.botId, []);
  snapshot();
  res.json({ cleared: true, botId: bot.botId });
});

export default router;
