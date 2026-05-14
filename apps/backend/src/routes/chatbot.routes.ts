import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
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

const router = Router();

// --- Configuración multer existente (modo session/upload con disco) ------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/chatbot/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'chatbot-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt', '.csv', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) cb(null, true);
    else cb(new Error('Tipo de archivo no permitido. Solo PDF, TXT, CSV, DOCX'));
  },
});

// Rutas heredadas (no se tocan: las consume el chatbot por sesión)
router.post('/session', createOrGetSession);
router.post('/upload', upload.array('files', 10), uploadDocuments);
router.post('/message', sendMessage);
router.get('/info/:sessionId', getChatbotInfo);
router.put('/config', updateConfig);
router.delete('/messages/:sessionId', clearMessages);
router.delete('/documents/:sessionId', clearDocuments);

// ============================================================================
//   Builder + Playground real (RAG funcional con BM25-lite, sin LLM externo)
// ============================================================================
//
// El front consume estas rutas vía `apps/web/.../builder/api.ts`:
//   POST   /api/chatbot/bots                  → crear bot
//   GET    /api/chatbot/bots/:botId           → obtener bot + docs
//   PATCH  /api/chatbot/bots/:botId           → actualizar config
//   POST   /api/chatbot/bots/:botId/docs      → subir archivos (base64)
//   DELETE /api/chatbot/bots/:botId/docs/:id  → eliminar doc + chunks
//   POST   /api/chatbot/bots/:botId/urls      → indexar páginas web
//   POST   /api/chatbot/bots/:botId/chat      → preguntar (retrieval real)
//
// Storage in-memory (suficiente para demo). Si el proceso se reinicia, se
// pierde — la persistencia real vive en localStorage del browser (builder).

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
}

interface BotChunk {
  id: string;
  docId: string;
  docName: string;
  text: string;
  /** Tokens normalizados (lower-case, sin puntuación) para retrieval BM25-lite. */
  tokens: string[];
}

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
// importante volcamos el estado a `data/chatbots/state.json`. Esto NO es una
// BBDD: es un fallback liviano para que el demo "100% funcional" sobreviva
// reinicios del proceso (`npm run dev`, despliegues, etc.).

(function hydrateFromDisk() {
  const initial = loadState();
  for (const [k, v] of initial.bots) botsStore.set(k, v as BotConfig);
  for (const [k, v] of initial.docs) docsStore.set(k, v as BotDocMeta[]);
  for (const [k, v] of initial.chunks) chunksStore.set(k, v as BotChunk[]);
  for (const [k, v] of initial.conversations) {
    conversationsStore.set(k, v as ConversationTurn[]);
  }
  // Reconstruir `bot.docs` desde docsStore para mantener la API contractual.
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

// --- Helpers de texto -------------------------------------------------------

const TOKEN_REGEX = /[a-záéíóúñüäöüß0-9]+/gi;

function tokenize(input: string): string[] {
  if (!input) return [];
  const matches = input.toLowerCase().match(TOKEN_REGEX);
  if (!matches) return [];
  return matches.filter((t) => t.length > 2);
}

function decodeBase64Text(base64: string, mime: string): string {
  try {
    const buf = Buffer.from(base64, 'base64');
    if (
      mime.startsWith('text/') ||
      mime === 'application/json' ||
      mime === 'application/xml' ||
      mime === 'application/javascript'
    ) {
      return buf.toString('utf-8');
    }
    // PDFs / DOCX no se parsean (no se instalan deps): fallback con strip de
    // bytes no imprimibles. Si el archivo es texto plano disfrazado, igual sirve.
    const text = buf.toString('utf-8').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ');
    return text;
  } catch {
    return '';
  }
}

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

function makeChunk(text: string, source: { docId: string; docName: string }): BotChunk {
  return {
    id: 'chk_' + crypto.randomBytes(6).toString('hex'),
    docId: source.docId,
    docName: source.docName,
    text,
    tokens: tokenize(text),
  };
}

/**
 * Chunking simple: prioriza párrafos (doble salto). Si un párrafo excede ~800
 * chars, lo subdivide por oraciones agrupando hasta ~500 chars con overlap por
 * oración. Mantiene SRP: una sola responsabilidad — partir texto en pedazos
 * con suficiente contexto para retrieval.
 */
function chunkText(rawText: string, source: { docId: string; docName: string }): BotChunk[] {
  const text = rawText.replace(/\r\n/g, '\n').trim();
  if (!text) return [];
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);
  const out: BotChunk[] = [];
  for (const p of paragraphs) {
    if (p.length <= 800) {
      out.push(makeChunk(p, source));
      continue;
    }
    const sentences = p.split(/(?<=[.!?])\s+/);
    let buf = '';
    for (const s of sentences) {
      const candidate = buf ? buf + ' ' + s : s;
      if (candidate.length > 500 && buf.length > 0) {
        out.push(makeChunk(buf, source));
        buf = s;
      } else {
        buf = candidate;
      }
    }
    if (buf.trim().length > 0) out.push(makeChunk(buf, source));
  }
  // Si no había párrafos válidos (sin saltos dobles) pero hay texto, igual chunkamos.
  if (out.length === 0 && text.length > 0) {
    for (let i = 0; i < text.length; i += 500) {
      const slice = text.slice(i, i + 500);
      if (slice.trim().length > 20) out.push(makeChunk(slice, source));
    }
  }
  return out;
}

/**
 * BM25-lite: TF saturado (tf / (tf + 1)) ponderado por IDF clásico.
 * Devuelve los topK chunks con score > 0, en orden descendente.
 */
function retrieve(
  query: string,
  chunks: BotChunk[],
  topK = 3,
): Array<{ chunk: BotChunk; score: number }> {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0 || chunks.length === 0) return [];

  const docFreq: Record<string, number> = {};
  for (const c of chunks) {
    const seen = new Set(c.tokens);
    for (const t of seen) docFreq[t] = (docFreq[t] ?? 0) + 1;
  }
  const N = chunks.length;

  return chunks
    .map((c) => {
      let score = 0;
      for (const qt of queryTokens) {
        let tf = 0;
        for (const t of c.tokens) if (t === qt) tf += 1;
        if (tf === 0) continue;
        const df = docFreq[qt] ?? 1;
        const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
        score += idf * (tf / (tf + 1));
      }
      return { chunk: c, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// --- DTO helpers ------------------------------------------------------------

function newBotId(): string {
  return 'kbot_' + crypto.randomBytes(8).toString('hex');
}

function ensureBot(botId: string): BotConfig {
  let bot = botsStore.get(botId);
  if (!bot) {
    const now = new Date().toISOString();
    bot = {
      botId,
      name: 'Demo Bot',
      color: '#4F46E5',
      position: 'br',
      avatar: '🤖',
      welcome: '¡Hola! ¿En qué puedo ayudarte hoy?',
      systemPrompt: 'You are a helpful enterprise assistant.',
      tone: 'professional',
      languages: ['es', 'en'],
      createdAt: now,
      updatedAt: now,
      docs: [],
    };
    botsStore.set(botId, bot);
    docsStore.set(botId, bot.docs);
    snapshot();
  }
  return bot;
}

/** Mantiene `docsStore` sincronizado con `bot.docs` (single source of truth). */
function syncDocs(bot: BotConfig): void {
  docsStore.set(bot.botId, bot.docs);
}

function serializeBot(bot: BotConfig): BotConfig {
  return { ...bot, docs: [...bot.docs] };
}

// --- Endpoints --------------------------------------------------------------

/** POST /bots — crear bot (o reutilizar si viene botId explícito). */
router.post('/bots', (req: Request, res: Response) => {
  const body = (req.body ?? {}) as Partial<BotConfig> & { botId?: string };
  const id = body.botId && /^[a-zA-Z0-9_-]{3,64}$/.test(body.botId) ? body.botId : newBotId();
  const now = new Date().toISOString();
  const existing = botsStore.get(id);
  const bot: BotConfig = existing ?? {
    botId: id,
    name: body.name || 'Demo Bot',
    color: body.color || '#4F46E5',
    position: (body.position as BotConfig['position']) || 'br',
    avatar: body.avatar || '🤖',
    welcome: body.welcome || '¡Hola! ¿En qué puedo ayudarte hoy?',
    systemPrompt: body.systemPrompt || 'You are a helpful enterprise assistant.',
    tone: body.tone || 'professional',
    languages: Array.isArray(body.languages) ? body.languages : ['es', 'en'],
    createdAt: now,
    updatedAt: now,
    docs: [],
  };
  // Si ya existía y vienen overrides parciales, mergeamos.
  if (existing) {
    if (body.name) bot.name = body.name;
    if (body.color) bot.color = body.color;
    if (body.position) bot.position = body.position;
    if (body.avatar) bot.avatar = body.avatar;
    if (body.welcome) bot.welcome = body.welcome;
    if (body.systemPrompt) bot.systemPrompt = body.systemPrompt;
    if (body.tone) bot.tone = body.tone;
    if (Array.isArray(body.languages)) bot.languages = body.languages;
    bot.updatedAt = now;
  }
  botsStore.set(id, bot);
  syncDocs(bot);
  snapshot();
  res.status(existing ? 200 : 201).json(serializeBot(bot));
  return;
});

/**
 * GET /bots — listar todos los tenants. Paginación opcional via `?limit` y
 * `?offset`. Devuelve un resumen liviano (sin docs ni chunks completos):
 * `{ botId, name, color, createdAt, updatedAt, docsCount, conversationsCount }`.
 */
router.get('/bots', (req: Request, res: Response) => {
  const limit = Math.max(1, Math.min(500, Number(req.query.limit) || 100));
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const all = [...botsStore.values()].sort((a, b) =>
    (b.updatedAt || '').localeCompare(a.updatedAt || ''),
  );
  const slice = all.slice(offset, offset + limit).map((b) => ({
    botId: b.botId,
    name: b.name,
    color: b.color,
    avatar: b.avatar,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    docsCount: b.docs.length,
    chunksCount: (chunksStore.get(b.botId) ?? []).length,
    conversationsCount: (conversationsStore.get(b.botId) ?? []).length,
  }));
  res.json(slice);
});

/** GET /bots/:botId — obtener config + docs. */
router.get('/bots/:botId', (req: Request, res: Response) => {
  const bot = botsStore.get(req.params.botId);
  if (!bot) {
    res.status(404).json({ error: 'bot_not_found' });
    return;
  }
  res.json(serializeBot(bot));
});

/** PATCH /bots/:botId — merge parcial. */
router.patch('/bots/:botId', (req: Request, res: Response) => {
  const bot = botsStore.get(req.params.botId);
  if (!bot) {
    res.status(404).json({ error: 'bot_not_found' });
    return;
  }
  const body = (req.body ?? {}) as Partial<BotConfig>;
  if (body.name !== undefined) bot.name = body.name;
  if (body.color !== undefined) bot.color = body.color;
  if (body.position !== undefined) bot.position = body.position;
  if (body.avatar !== undefined) bot.avatar = body.avatar;
  if (body.welcome !== undefined) bot.welcome = body.welcome;
  if (body.systemPrompt !== undefined) bot.systemPrompt = body.systemPrompt;
  if (body.tone !== undefined) bot.tone = body.tone;
  if (Array.isArray(body.languages)) bot.languages = body.languages;
  bot.updatedAt = new Date().toISOString();
  syncDocs(bot);
  snapshot();
  res.json(serializeBot(bot));
});

/**
 * DELETE /bots/:botId — borra el bot y todas sus dependencias: docs, chunks
 * y conversaciones. Idempotente: si no existe devuelve 404, si existe limpia
 * todo y persiste.
 */
router.delete('/bots/:botId', (req: Request, res: Response) => {
  const botId = req.params.botId;
  const bot = botsStore.get(botId);
  if (!bot) {
    res.status(404).json({ error: 'bot_not_found' });
    return;
  }
  botsStore.delete(botId);
  docsStore.delete(botId);
  chunksStore.delete(botId);
  conversationsStore.delete(botId);
  snapshot();
  res.json({ deleted: true, botId });
});

/** POST /bots/:botId/docs — ingesta de archivos en base64. */
router.post('/bots/:botId/docs', (req: Request, res: Response) => {
  const bot = ensureBot(req.params.botId);
  const incoming = Array.isArray(req.body?.files) ? req.body.files : [];
  if (incoming.length === 0) {
    res.status(400).json({ error: 'no_files' });
    return;
  }

  const added: BotDocMeta[] = [];
  const existingChunks = chunksStore.get(bot.botId) ?? [];

  for (const f of incoming) {
    const name = String(f?.name || 'document').slice(0, 200);
    const mime = String(f?.mime || 'application/octet-stream');
    const size = Number(f?.size) || 0;
    const id = 'doc_' + crypto.randomBytes(8).toString('hex');
    const hash =
      typeof f?.contentBase64 === 'string'
        ? crypto.createHash('sha256').update(f.contentBase64).digest('hex').slice(0, 16)
        : crypto.randomBytes(8).toString('hex');
    const meta: BotDocMeta = {
      id,
      name,
      size,
      mime,
      hash,
      uploadedAt: new Date().toISOString(),
    };
    bot.docs.push(meta);
    added.push(meta);

    if (typeof f?.contentBase64 === 'string' && f.contentBase64.length > 0) {
      const fullText = decodeBase64Text(f.contentBase64, mime);
      if (fullText.trim().length > 0) {
        const fileChunks = chunkText(fullText, { docId: id, docName: name });
        existingChunks.push(...fileChunks);
      }
    }
  }
  chunksStore.set(bot.botId, existingChunks);
  bot.updatedAt = new Date().toISOString();
  syncDocs(bot);
  snapshot();

  res.status(201).json({ docs: bot.docs, added });
});

/** DELETE /bots/:botId/docs/:docId — borra metadata + chunks asociados. */
router.delete('/bots/:botId/docs/:docId', (req: Request, res: Response) => {
  const bot = botsStore.get(req.params.botId);
  if (!bot) {
    res.status(404).json({ error: 'bot_not_found' });
    return;
  }
  const docId = req.params.docId;
  bot.docs = bot.docs.filter((d) => d.id !== docId);
  const chunks = chunksStore.get(bot.botId) ?? [];
  chunksStore.set(bot.botId, chunks.filter((c) => c.docId !== docId));
  bot.updatedAt = new Date().toISOString();
  syncDocs(bot);
  snapshot();
  res.json({ docs: bot.docs });
});

/** POST /bots/:botId/urls — fetch + strip HTML + chunking. */
router.post('/bots/:botId/urls', async (req: Request, res: Response) => {
  const bot = ensureBot(req.params.botId);
  const urls = Array.isArray(req.body?.urls) ? req.body.urls : [];
  if (urls.length === 0) {
    res.status(400).json({ error: 'no_urls' });
    return;
  }

  const added: BotDocMeta[] = [];
  const errors: Array<{ url: string; reason: string }> = [];
  const existingChunks = chunksStore.get(bot.botId) ?? [];

  for (const rawUrl of urls) {
    const url = String(rawUrl || '').trim();
    if (!/^https?:\/\//i.test(url)) {
      errors.push({ url, reason: 'invalid_url' });
      continue;
    }
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const resp = await fetch(url, {
        signal: ctrl.signal,
        headers: { 'User-Agent': 'Koptup-Chatbot-Indexer/1.0' },
      });
      clearTimeout(timer);
      if (!resp.ok) {
        errors.push({ url, reason: `http_${resp.status}` });
        continue;
      }
      const html = await resp.text();
      const text = stripHtml(html);
      if (text.length < 40) {
        errors.push({ url, reason: 'empty_content' });
        continue;
      }
      let hostname = url;
      try {
        hostname = new URL(url).hostname;
      } catch {
        /* keep raw */
      }
      const id = 'doc_' + crypto.randomBytes(8).toString('hex');
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
      const chunks = chunkText(text, { docId: id, docName: hostname });
      existingChunks.push(...chunks);
    } catch (err: any) {
      const reason = err?.name === 'AbortError' ? 'timeout' : err?.message || 'fetch_failed';
      errors.push({ url, reason });
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

// ---------------------------------------------------------------------------
//   Catálogo de modelos LLM soportados
// ---------------------------------------------------------------------------
//
// SRP: este objeto es la única fuente de verdad para los modelos disponibles
// y sus precios. El endpoint /models lo expone tal cual y el handler /chat
// lo usa para validar/whitelisting + estimar el costo del request.
//
// Sólo modelos GPT de OpenAI: el cliente confirmó que no tiene API key de
// Claude/Gemini. Si en el futuro se agregan otros providers, agregar la
// entrada acá y exponer el flag `enabled` en función de su env var.
interface ModelMeta {
  id: string;
  name: string;
  provider: 'openai';
  /** USD por 1M tokens de input. */
  costInputUSDper1M: number;
  /** USD por 1M tokens de output. */
  costOutputUSDper1M: number;
  recommended?: boolean;
}

const OPENAI_MODELS: ReadonlyArray<ModelMeta> = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    provider: 'openai',
    costInputUSDper1M: 0.15,
    costOutputUSDper1M: 0.6,
    recommended: true,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    costInputUSDper1M: 2.5,
    costOutputUSDper1M: 10,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    costInputUSDper1M: 10,
    costOutputUSDper1M: 30,
  },
];

const DEFAULT_MODEL_ID = 'gpt-4o-mini';
const ALLOWED_MODEL_IDS = new Set(OPENAI_MODELS.map((m) => m.id));

function estimateCostUSD(modelId: string, promptTokens: number, completionTokens: number): number {
  const meta = OPENAI_MODELS.find((m) => m.id === modelId) ?? OPENAI_MODELS[0];
  const cost =
    (promptTokens / 1e6) * meta.costInputUSDper1M +
    (completionTokens / 1e6) * meta.costOutputUSDper1M;
  return Number(cost.toFixed(6));
}

/**
 * GET /models — reporta los modelos LLM soportados y si están habilitados
 * (es decir, si hay una API key del provider configurada). El front consume
 * este endpoint para deshabilitar opciones que no se pueden usar.
 *
 * Notar que NUNCA exponemos el valor de la API key, sólo el booleano de su
 * presencia. Mantiene SRP (config introspection, no auth).
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
 * Llama a OpenAI Chat Completions. Aislado en un helper para mantener el
 * handler de /chat liviano y testeable. Devuelve el texto generado más
 * metadatos (usage, costo, modelo efectivo, latencia).
 *
 * Reintentos y backoff los maneja el caller; acá hacemos un único request
 * con timeout de 30s (suficiente para gpt-4o sin streaming).
 */
async function callOpenAI(args: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  context: string;
  history: Array<{ role: string; content: string }>;
  userMessage: string;
}): Promise<{
  reply: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
}> {
  const t0 = Date.now();
  const messages = [
    { role: 'system', content: args.systemPrompt },
    ...args.history
      .filter((m) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content })),
    {
      role: 'user',
      content: `Fragmentos disponibles:\n${args.context}\n\nPregunta del usuario: ${args.userMessage}`,
    },
  ];

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${args.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: args.model,
      messages,
      temperature: 0.3,
      max_tokens: 800,
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const latencyMs = Date.now() - t0;

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    const err = new Error(`OpenAI HTTP ${resp.status}: ${text.slice(0, 300)}`) as Error & {
      status?: number;
      latencyMs?: number;
    };
    err.status = resp.status;
    err.latencyMs = latencyMs;
    throw err;
  }

  const data = (await resp.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };
  const reply = data.choices?.[0]?.message?.content?.trim() || '(Sin respuesta del modelo)';
  return {
    reply,
    promptTokens: data.usage?.prompt_tokens ?? 0,
    completionTokens: data.usage?.completion_tokens ?? 0,
    totalTokens: data.usage?.total_tokens ?? 0,
    latencyMs,
  };
}

function composeExtractiveReply(
  retrieved: Array<{ chunk: BotChunk; score: number }>,
  message: string,
): string {
  if (retrieved.length === 0) {
    return `No encontré información relacionada con "${message}". Probá reformular o subir más documentos.`;
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

/**
 * POST /bots/:botId/chat — flujo:
 *   1. Recupera top-5 chunks por BM25-lite sobre los docs del bot.
 *   2. Si hay `OPENAI_API_KEY`, arma prompt con system + history + contexto
 *      citado y dispara la llamada a OpenAI Chat Completions.
 *   3. Si no hay key, cae al modo extractivo (cita los chunks).
 *   4. Si OpenAI falla, cae al modo extractivo + reporta el error.
 *   5. Persiste el turno user + assistant en `conversationsStore` y snapshot.
 */
router.post('/bots/:botId/chat', async (req: Request, res: Response) => {
  const botId = req.params.botId;
  const message = String(req.body?.message || '').trim();
  if (!message) {
    res.status(400).json({ error: 'empty_message' });
    return;
  }

  const bot = botsStore.get(botId);
  const allChunks = chunksStore.get(botId) ?? [];
  const requestedModel = typeof req.body?.model === 'string' ? req.body.model : DEFAULT_MODEL_ID;
  const safeModel = ALLOWED_MODEL_IDS.has(requestedModel) ? requestedModel : DEFAULT_MODEL_ID;
  const history = Array.isArray(req.body?.history) ? req.body.history : [];
  const timestampStart = new Date().toISOString();

  const retrieved = retrieve(message, allChunks, 5);
  const sources = retrieved.map((r, i) => formatSource(r, i));

  /**
   * Cierra la respuesta: persiste el turno user + assistant y devuelve el
   * payload al cliente. Centralizado para que ambas ramas (LLM y fallback)
   * compartan el mismo formato.
   */
  function finish(payload: {
    reply: string;
    confidence: number;
    latencyMs: number;
    model: string;
    tokens?: { prompt: number; completion: number; total: number };
    costUSD?: number;
    error?: string;
  }) {
    if (bot) {
      const userTurn: ConversationTurn = {
        id: 'msg_' + crypto.randomBytes(6).toString('hex'),
        role: 'user',
        content: message,
        timestamp: timestampStart,
      };
      const botTurn: ConversationTurn = {
        id: 'msg_' + crypto.randomBytes(6).toString('hex'),
        role: 'assistant',
        content: payload.reply,
        timestamp: new Date().toISOString(),
        sources: sources.map((s) => ({
          id: s.id,
          name: s.name,
          score: s.score,
          chunk: s.chunk,
        })),
        confidence: payload.confidence,
      };
      appendConversation(botId, userTurn);
      appendConversation(botId, botTurn);
      snapshot();
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

  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  // --- Sin LLM: fallback extractivo puro ----------------------------------
  if (!hasOpenAI) {
    const replyText =
      retrieved.length > 0
        ? composeExtractiveReply(retrieved, message)
        : allChunks.length === 0
          ? 'Aún no tenés documentos cargados. Subí PDFs, Word, TXT, HTML o agregá una URL en el Builder y volvé a preguntarme.'
          : `No encontré información relacionada con "${message}" en los documentos cargados.`;
    finish({
      reply: replyText,
      confidence: retrieved.length > 0 ? 0.3 : 0,
      latencyMs: 50,
      model: 'extractive-bm25',
    });
    return;
  }

  // --- Con LLM: armamos contexto y llamamos a OpenAI ----------------------
  const tone = bot?.tone || 'professional';
  const systemPrompt =
    bot?.systemPrompt && bot.systemPrompt.trim().length > 0
      ? bot.systemPrompt
      : `Sos un asistente virtual con tono ${tone}. Respondé en base a los fragmentos provistos cuando estén disponibles, citando las fuentes con [1], [2], etc. Si no hay fragmentos o no encontrás la respuesta, decilo honestamente y ofrecé al usuario subir más contenido. Sé conciso y directo.`;

  const context =
    retrieved.length > 0
      ? retrieved
          .map((r, i) => `[${i + 1}] (${r.chunk.docName}) ${r.chunk.text}`)
          .join('\n\n')
      : '(El bot todavía no tiene documentos cargados. Respondé brevemente y sugerí al usuario subir contenido.)';

  try {
    const result = await callOpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      model: safeModel,
      systemPrompt,
      context,
      history,
      userMessage: message,
    });
    const costUSD = estimateCostUSD(safeModel, result.promptTokens, result.completionTokens);
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
        ? ((err as { latencyMs: number }).latencyMs)
        : 200;
    // Log sin exponer la API key (msg solo lleva la respuesta de OpenAI).
    console.error('[chatbot] OpenAI call failed:', msg.slice(0, 300));
    const fallbackReply =
      retrieved.length > 0
        ? `(Modo extractivo por error del proveedor LLM) ${composeExtractiveReply(retrieved, message)}`
        : 'No pude generar la respuesta (error del proveedor LLM) y todavía no tenés documentos cargados.';
    finish({
      reply: fallbackReply,
      confidence: retrieved.length > 0 ? 0.3 : 0,
      latencyMs,
      model: 'extractive-bm25-fallback',
      error: 'llm_provider_error',
    });
  }
});

/**
 * GET /bots/:botId/conversations — últimos N turnos (default 50, máx 200).
 * Útil para rehidratar el chat del lado cliente y para inspección.
 */
router.get('/bots/:botId/conversations', (req: Request, res: Response) => {
  const botId = req.params.botId;
  if (!botsStore.has(botId)) {
    res.status(404).json({ error: 'bot_not_found' });
    return;
  }
  const limit = Math.max(1, Math.min(200, Number(req.query.limit) || 50));
  const list = conversationsStore.get(botId) ?? [];
  res.json(list.slice(-limit));
});

/** DELETE /bots/:botId/conversations — limpia el histórico del bot. */
router.delete('/bots/:botId/conversations', (req: Request, res: Response) => {
  const botId = req.params.botId;
  if (!botsStore.has(botId)) {
    res.status(404).json({ error: 'bot_not_found' });
    return;
  }
  conversationsStore.set(botId, []);
  snapshot();
  res.json({ cleared: true, botId });
});

export default router;
