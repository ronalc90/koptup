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
import {
  addBotDocs,
  appendTurns,
  clearTurns,
  countBots,
  countTurnsByBot,
  createStoredBot,
  deleteBotCascade,
  exampleBotIds,
  findBot,
  getBotChunks,
  listTurns,
  listVisibleBots,
  maxBots,
  removeBotDoc,
  touchBot,
  updateBotConfig,
  type StoredBot,
} from '../services/chatbot-store.service';
import { CHATBOT_BOT_KINDS, type ChatbotBotKind } from '../models/ChatbotBot';
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
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { isDbReady, isStaffRole, loadFreshUser, readBearer } from '../middleware/access';
import type { AuthRequest } from '../types';
import { errorBody, sendError } from '../utils/http-error';

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
// ALMACENAMIENTO: MongoDB (services/chatbot-store.service.ts). Sin base de
// datos estas rutas responden 503. Las conversaciones solo se guardan cuando
// el chat llega del widget de un bot de usuario (`channel: "widget"`, lo
// envía /embed/chatbot fuera de la vista previa del Builder) y vencen solas
// (CHATBOT_CONVERSATION_TTL_DAYS, 30 días por defecto). Las de los bots de
// ejemplo (`kind: "sample"` o CHATBOT_EXAMPLE_BOT_IDS), "Prueba el asistente"
// y la vista previa no se guardan.
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

type BotDocMeta = StoredBot['docs'][number];
type BotConfig = StoredBot;
type BotChunk = RagChunk;

/**
 * Errores de /bots con el formato único `{ success: false, code, message }`
 * (utils/http-error.ts), más datos útiles cuando aplica (`field`, `max`).
 * Ojo: el chat responde 200 con `error` (`budget_exhausted`,
 * `llm_provider_error`) cuando contesta en modo extractivo: no es un error,
 * es el motivo del modo.
 */
const BOT_NOT_FOUND_MESSAGE = 'Este bot no existe o ya fue borrado.';
const FIELD_ERROR_MESSAGES: Record<string, string> = {
  invalid_field: 'Revisa el campo: tiene un valor no válido.',
  field_too_long: 'Revisa el campo: es demasiado largo.',
};

/** Sin MongoDB los bots no se pueden leer ni guardar: 503 honesto. */
function requireStorage(_req: Request, res: Response, next: () => void): void {
  if (isDbReady()) {
    next();
    return;
  }
  sendError(res, 503, 'storage_unavailable', 'El chatbot no está disponible en este momento. Intenta de nuevo en unos minutos.');
}
router.use('/bots', requireStorage);

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

function isOwner(bot: BotConfig, tokens: string[]): boolean {
  if (!bot.ownerTokenHash) return false;
  return tokens.some((t) => safeEqualHex(hashOwnerToken(t), bot.ownerTokenHash as string));
}

/**
 * Devuelve el bot si quien llama puede administrarlo; si no, responde
 * 404/401/403 y devuelve null.
 *  - Bot con dueño: exige su token en `X-Bot-Owner-Token`.
 *  - Bot heredado sin dueño registrado (creado antes del control de
 *    propiedad): solo lo administra el equipo de KopTup (sesión con rol de
 *    staff leído de la BD). Nadie lo "reclama" con un token.
 */
async function requireOwner(req: Request, res: Response): Promise<BotConfig | null> {
  const bot = await findBot(req.params.botId);
  if (!bot) {
    sendError(res, 404, 'bot_not_found', BOT_NOT_FOUND_MESSAGE);
    return null;
  }
  if (!bot.ownerTokenHash) {
    const bearer = readBearer(req as AuthRequest);
    const fresh = bearer.user ? await loadFreshUser(bearer.user.id) : null;
    if (fresh && fresh !== 'db_unavailable' && isStaffRole(fresh.role)) return bot;
    sendError(res, 403, 'legacy_bot_staff_only', 'Este bot no tiene un propietario registrado: solo el equipo de KopTup puede administrarlo.');
    return null;
  }
  const tokens = readOwnerTokens(req);
  if (tokens.length === 0) {
    sendError(res, 401, 'owner_token_required', `Envía el token del propietario del bot en la cabecera ${OWNER_TOKEN_HEADER}.`);
    return null;
  }
  if (!isOwner(bot, tokens)) {
    sendError(res, 403, 'forbidden_not_owner', 'Este bot pertenece a otro usuario.');
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

/** Vista completa para el dueño (sin el hash del token ni datos internos). */
function serializeBot(bot: BotConfig) {
  return {
    botId: bot.botId,
    name: bot.name,
    color: bot.color,
    position: bot.position,
    avatar: bot.avatar,
    welcome: bot.welcome,
    systemPrompt: bot.systemPrompt,
    tone: bot.tone,
    languages: [...bot.languages],
    createdAt: bot.createdAt,
    updatedAt: bot.updatedAt,
    docs: [...bot.docs],
    kind: bot.kind,
    owned: true as const,
  };
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
  message: errorBody('rate_limited', 'Creaste demasiados bots en la última hora. Intenta de nuevo más tarde.'),
});

/**
 * POST /bots — crea un bot nuevo. Devuelve `ownerToken` (única vez). Si la
 * petición trae un token válido en `X-Bot-Owner-Token`, el bot nuevo queda a
 * nombre de ese mismo token (un navegador puede usar una sola llave para
 * todos sus bots). Si viene `botId` de un bot existente, se trata como una
 * actualización y exige ser su dueño.
 */
router.post('/bots', createBotLimiter, asyncHandler(async (req: Request, res: Response) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const requestedId =
    typeof body.botId === 'string' && /^[a-zA-Z0-9_-]{3,64}$/.test(body.botId) ? body.botId : null;

  const parsed = parseConfigPatch(body);
  if ('error' in parsed) {
    sendError(res, 400, parsed.error, FIELD_ERROR_MESSAGES[parsed.error] ?? 'Revisa los datos del bot.', { field: parsed.field });
    return;
  }

  if (requestedId && (await findBot(requestedId))) {
    req.params.botId = requestedId;
    const bot = await requireOwner(req, res);
    if (!bot) return;
    const updated = await updateBotConfig(bot.botId, parsed.patch);
    if (!updated) {
      sendError(res, 404, 'bot_not_found', BOT_NOT_FOUND_MESSAGE);
      return;
    }
    res.status(200).json(serializeBot(updated));
    return;
  }

  if ((await countBots()) >= maxBots()) {
    sendError(res, 503, 'capacity', 'La demo alcanzó su capacidad de bots. Intenta más tarde.');
    return;
  }

  // `kind: "sample"`: bot de ejemplo de una demo (sus conversaciones nunca se guardan).
  const kind: ChatbotBotKind =
    typeof body.kind === 'string' && (CHATBOT_BOT_KINDS as readonly string[]).includes(body.kind) ? (body.kind as ChatbotBotKind) : 'builder';
  const provided = readOwnerTokens(req);
  const ownerToken = provided.length === 1 ? provided[0] : newOwnerToken();
  const id = requestedId ?? newBotId();
  const bot = await createStoredBot({
    botId: id,
    name: parsed.patch.name || 'Demo Bot',
    color: parsed.patch.color || '#4F46E5',
    position: parsed.patch.position || 'br',
    avatar: parsed.patch.avatar || '🤖',
    welcome: parsed.patch.welcome || '¡Hola! ¿En qué puedo ayudarte hoy?',
    systemPrompt: parsed.patch.systemPrompt || 'You are a helpful enterprise assistant.',
    tone: parsed.patch.tone || 'professional',
    languages: parsed.patch.languages ?? ['es', 'en'],
    docs: [],
    ownerTokenHash: hashOwnerToken(ownerToken),
    kind,
  });
  res.status(201).json({ ...serializeBot(bot), ownerToken });
}));

/**
 * GET /bots — bots del propietario (según los tokens de `X-Bot-Owner-Token`)
 * más los bots de ejemplo públicos (CHATBOT_EXAMPLE_BOT_IDS). Sin token solo
 * devuelve los de ejemplo. Paginación opcional con `?limit` y `?offset`.
 */
router.get('/bots', asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.max(1, Math.min(500, Number(req.query.limit) || 100));
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const tokens = readOwnerTokens(req);
  const examples = exampleBotIds();
  const candidates = await listVisibleBots(tokens.map(hashOwnerToken), [...examples]);
  const visible = candidates
    .map((b) => ({ bot: b, owned: isOwner(b, tokens) }))
    .filter(({ bot, owned }) => owned || examples.has(bot.botId));
  const page = visible.slice(offset, offset + limit);
  const turns = await countTurnsByBot(page.filter((p) => p.owned).map((p) => p.bot.botId));
  const slice = page.map(({ bot: b, owned }) => ({
    botId: b.botId,
    name: b.name,
    color: b.color,
    avatar: b.avatar,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    docsCount: b.docs.length,
    chunksCount: owned ? b.chunksCount : undefined,
    conversationsCount: owned ? turns.get(b.botId) ?? 0 : 0,
    owned,
    example: examples.has(b.botId),
  }));
  res.json(slice);
}));

/** GET /bots/:botId — config completa para el dueño; vista pública para el resto. */
router.get('/bots/:botId', asyncHandler(async (req: Request, res: Response) => {
  const bot = await findBot(req.params.botId);
  if (!bot) {
    sendError(res, 404, 'bot_not_found', BOT_NOT_FOUND_MESSAGE);
    return;
  }
  if (isOwner(bot, readOwnerTokens(req))) {
    res.json(serializeBot(bot));
    return;
  }
  res.json(serializePublicBot(bot));
}));

/** PATCH /bots/:botId — merge parcial validado. [dueño] */
router.patch('/bots/:botId', asyncHandler(async (req: Request, res: Response) => {
  const bot = await requireOwner(req, res);
  if (!bot) return;
  const parsed = parseConfigPatch(req.body);
  if ('error' in parsed) {
    sendError(res, 400, parsed.error, FIELD_ERROR_MESSAGES[parsed.error] ?? 'Revisa los datos del bot.', { field: parsed.field });
    return;
  }
  const updated = await updateBotConfig(bot.botId, parsed.patch);
  if (!updated) {
    sendError(res, 404, 'bot_not_found', BOT_NOT_FOUND_MESSAGE);
    return;
  }
  res.json(serializeBot(updated));
}));

/** DELETE /bots/:botId — borra el bot, sus docs, chunks y conversaciones. [dueño] */
router.delete('/bots/:botId', asyncHandler(async (req: Request, res: Response) => {
  const bot = await requireOwner(req, res);
  if (!bot) return;
  const botId = bot.botId;
  await deleteBotCascade(botId);
  res.json({ deleted: true, botId });
}));

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
router.post('/bots/:botId/docs', asyncHandler(async (req: Request, res: Response) => {
  const bot = await requireOwner(req, res);
  if (!bot) return;
  const incoming = Array.isArray(req.body?.files) ? req.body.files : [];
  if (incoming.length === 0) {
    sendError(res, 400, 'no_files', 'Adjunta al menos un archivo.');
    return;
  }
  if (incoming.length > BOT_LIMITS.maxFilesPerRequest) {
    sendError(res, 400, 'too_many_files', `Puedes subir máximo ${BOT_LIMITS.maxFilesPerRequest} archivos a la vez.`, { max: BOT_LIMITS.maxFilesPerRequest });
    return;
  }
  if (bot.docs.length + incoming.length > BOT_LIMITS.maxDocsPerBot) {
    sendError(res, 400, 'too_many_docs', `Cada bot admite máximo ${BOT_LIMITS.maxDocsPerBot} documentos.`, { max: BOT_LIMITS.maxDocsPerBot });
    return;
  }

  const added: Array<{ meta: BotDocMeta; chunks: BotChunk[] }> = [];
  const errors: Array<{ name: string; reason: string }> = [];
  let chunksTotal = bot.chunksCount;

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
    if (chunksTotal + fileChunks.length > BOT_LIMITS.maxChunksPerBot) {
      errors.push({ name, reason: 'bot_capacity' });
      continue;
    }
    chunksTotal += fileChunks.length;
    const meta: BotDocMeta = {
      id,
      name,
      size: buffer.length,
      mime,
      hash: crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 16),
      uploadedAt: new Date().toISOString(),
    };
    added.push({ meta, chunks: fileChunks });
  }

  if (added.length > 0) {
    const updated = await addBotDocs(bot.botId, added);
    if (!updated) {
      sendError(res, 404, 'bot_not_found', BOT_NOT_FOUND_MESSAGE);
      return;
    }
    res.status(201).json({ docs: updated.docs, added: added.map((a) => a.meta), errors });
    return;
  }
  sendError(res, 422, 'no_valid_files', 'No pudimos leer ninguno de los archivos.', { docs: bot.docs, added: [], errors });
}));

/** DELETE /bots/:botId/docs/:docId — borra metadata + chunks asociados. [dueño] */
router.delete('/bots/:botId/docs/:docId', asyncHandler(async (req: Request, res: Response) => {
  const bot = await requireOwner(req, res);
  if (!bot) return;
  const updated = await removeBotDoc(bot.botId, req.params.docId);
  res.json({ docs: updated?.docs ?? [] });
}));

/**
 * POST /bots/:botId/urls — descarga páginas públicas, quita el HTML y las
 * indexa. [dueño] Máximo 5 URLs por petición y 2 MB por página; bloquea IPs
 * privadas, loopback y de metadatos (ver services/safe-fetch.service.ts).
 */
router.post('/bots/:botId/urls', asyncHandler(async (req: Request, res: Response) => {
  const bot = await requireOwner(req, res);
  if (!bot) return;
  const urls = Array.isArray(req.body?.urls) ? req.body.urls : [];
  if (urls.length === 0) {
    sendError(res, 400, 'no_urls', 'Escribe al menos una URL.');
    return;
  }
  if (urls.length > BOT_LIMITS.maxUrlsPerRequest) {
    sendError(res, 400, 'too_many_urls', `Puedes agregar máximo ${BOT_LIMITS.maxUrlsPerRequest} URL a la vez.`, { max: BOT_LIMITS.maxUrlsPerRequest });
    return;
  }
  if (bot.docs.length + urls.length > BOT_LIMITS.maxDocsPerBot) {
    sendError(res, 400, 'too_many_docs', `Cada bot admite máximo ${BOT_LIMITS.maxDocsPerBot} documentos.`, { max: BOT_LIMITS.maxDocsPerBot });
    return;
  }

  const added: Array<{ meta: BotDocMeta; chunks: BotChunk[] }> = [];
  const errors: Array<{ url: string; reason: string }> = [];
  let chunksTotal = bot.chunksCount;

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
      if (chunksTotal + chunks.length > BOT_LIMITS.maxChunksPerBot) {
        errors.push({ url, reason: 'bot_capacity' });
        continue;
      }
      chunksTotal += chunks.length;
      const meta: BotDocMeta = {
        id,
        name: hostname,
        size: text.length,
        mime: 'text/html',
        hash: crypto.createHash('sha256').update(url).digest('hex').slice(0, 16),
        uploadedAt: new Date().toISOString(),
      };
      added.push({ meta, chunks });
    } catch (err: unknown) {
      errors.push({ url, reason: err instanceof SafeFetchError ? err.reason : 'fetch_failed' });
    }
  }
  const updated = added.length > 0 ? await addBotDocs(bot.botId, added) : bot;
  if (!updated) {
    sendError(res, 404, 'bot_not_found', BOT_NOT_FOUND_MESSAGE);
    return;
  }
  res.json({ docs: updated.docs, added: added.map((a) => a.meta), errors });
}));

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
router.post('/bots/:botId/chat', asyncHandler(async (req: Request, res: Response) => {
  const botId = req.params.botId;
  const bot = await findBot(botId);
  if (!bot) {
    sendError(res, 404, 'bot_not_found', BOT_NOT_FOUND_MESSAGE);
    return;
  }
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!message) {
    sendError(res, 400, 'empty_message', 'Escribe un mensaje.');
    return;
  }
  if (message.length > BOT_LIMITS.maxMessageChars) {
    sendError(res, 400, 'message_too_long', `El mensaje supera ${BOT_LIMITS.maxMessageChars} caracteres.`, { max: BOT_LIMITS.maxMessageChars });
    return;
  }
  const history = sanitizeHistory(req.body?.history);
  if (history === 'too_long') {
    sendError(res, 400, 'history_too_long', `El historial supera ${BOT_LIMITS.maxHistoryInput} mensajes.`, { max: BOT_LIMITS.maxHistoryInput });
    return;
  }

  const allChunks = await getBotChunks(bot);
  await touchBot(bot);
  // Historial: solo el widget de un bot de usuario (no "Prueba el asistente",
  // ni la vista previa del Builder, ni los bots de ejemplo).
  const keepHistory = req.body?.channel === 'widget' && bot.kind !== 'sample' && !exampleBotIds().has(botId);
  const requestedModel = typeof req.body?.model === 'string' ? req.body.model : DEFAULT_MODEL_ID;
  const safeModel = ALLOWED_MODEL_IDS.has(requestedModel) ? requestedModel : DEFAULT_MODEL_ID;
  const timestampStart = new Date().toISOString();

  const retrieved = retrieve(message, allChunks, 5);
  const sources = retrieved.map((r, i) => formatSource(r, i));

  async function finish(payload: {
    reply: string;
    confidence: number;
    latencyMs: number;
    model: string;
    tokens?: { prompt: number; completion: number; total: number };
    costUSD?: number;
    error?: string;
  }) {
    if (keepHistory) {
      await appendTurns(botId, [
        {
          id: 'msg_' + crypto.randomBytes(6).toString('hex'),
          role: 'user',
          content: message,
          timestamp: timestampStart,
        },
        {
          id: 'msg_' + crypto.randomBytes(6).toString('hex'),
          role: 'assistant',
          content: payload.reply,
          timestamp: new Date().toISOString(),
          sources: sources.map((s) => ({ id: s.id, name: s.name, score: s.score, chunk: s.chunk })),
          confidence: payload.confidence,
        },
      ]).catch((err) => logger.error(`[chatbot] No se pudo guardar el historial: ${(err as Error)?.message ?? err}`));
    }
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

  async function extractive(note: string | null, error?: string) {
    const base =
      retrieved.length > 0
        ? composeExtractiveReply(retrieved)
        : allChunks.length === 0
          ? 'Aún no tienes documentos cargados. Sube un archivo o agrega una URL en el Builder y vuelve a preguntarme.'
          : NOT_FOUND_REPLY;
    await finish({
      reply: note && retrieved.length > 0 ? `${note} ${base}` : base,
      confidence: retrieved.length > 0 ? 0.3 : 0,
      latencyMs: 50,
      model: 'extractive-bm25',
      error,
    });
  }

  // --- Sin LLM: modo extractivo puro -------------------------------------
  if (!process.env.OPENAI_API_KEY) {
    await extractive(null);
    return;
  }

  // --- Tope de gasto mensual (Redis, compartido con la infraestructura de demo-rag)
  const budget = await getBudgetStatus('chatbot');
  if (!budget.available) {
    await extractive(
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
    await finish({
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
    await finish({
      reply: fallbackReply,
      confidence: retrieved.length > 0 ? 0.3 : 0,
      latencyMs,
      model: 'extractive-bm25-fallback',
      error: 'llm_provider_error',
    });
  }
}));

/** GET /bots/:botId/conversations — últimos N turnos (default 50, máx 200). [dueño] */
router.get('/bots/:botId/conversations', asyncHandler(async (req: Request, res: Response) => {
  const bot = await requireOwner(req, res);
  if (!bot) return;
  const limit = Math.max(1, Math.min(200, Number(req.query.limit) || 50));
  res.json(await listTurns(bot.botId, limit));
}));

/** DELETE /bots/:botId/conversations — limpia el histórico del bot. [dueño] */
router.delete('/bots/:botId/conversations', asyncHandler(async (req: Request, res: Response) => {
  const bot = await requireOwner(req, res);
  if (!bot) return;
  await clearTurns(bot.botId);
  res.json({ cleared: true, botId: bot.botId });
}));

export default router;
