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

const botsStore = new Map<string, BotConfig>();
const chunksStore = new Map<string, BotChunk[]>();

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
  }
  return bot;
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
  res.status(existing ? 200 : 201).json(serializeBot(bot));
  return;
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
  res.json(serializeBot(bot));
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
  res.json({ docs: bot.docs, added, errors });
});

/** POST /bots/:botId/chat — retrieval real sobre los chunks del bot. */
router.post('/bots/:botId/chat', (req: Request, res: Response) => {
  const botId = req.params.botId;
  const message = String(req.body?.message || '').trim();
  if (!message) {
    res.status(400).json({ error: 'empty_message' });
    return;
  }

  const bot = botsStore.get(botId);
  const allChunks = chunksStore.get(botId) ?? [];
  const timestamp = new Date().toISOString();

  if (!bot) {
    res.json({
      botId,
      reply:
        'Aún no tenés documentos cargados. Subí PDFs, Word, TXT, HTML o agregá una URL en el Builder y volvé a preguntarme.',
      sources: [],
      confidence: 0,
      latencyMs: 8,
      timestamp,
    });
    return;
  }

  if (allChunks.length === 0) {
    res.json({
      botId,
      reply:
        'Aún no tenés documentos cargados. Subí PDFs, Word, TXT, HTML o agregá una URL en el Builder y volvé a preguntarme.',
      sources: [],
      confidence: 0,
      latencyMs: 12,
      timestamp,
    });
    return;
  }

  const retrieved = retrieve(message, allChunks, 3);
  if (retrieved.length === 0) {
    res.json({
      botId,
      reply: `No encontré información relacionada con "${message}" en los ${allChunks.length} fragmento(s) cargado(s). Probá reformular la pregunta o cargar más documentos.`,
      sources: [],
      confidence: 0.05,
      latencyMs: 18,
      timestamp,
    });
    return;
  }

  const lines = retrieved
    .map(
      (r, idx) =>
        `[${idx + 1}] ${r.chunk.text.slice(0, 280)}${r.chunk.text.length > 280 ? '…' : ''}`,
    )
    .join('\n\n');
  const sources = retrieved.map((r, idx) => ({
    id: r.chunk.id,
    index: idx + 1,
    name: r.chunk.docName,
    score: Number(r.score.toFixed(3)),
    chunk: r.chunk.text,
  }));
  const queryTokenCount = Math.max(1, tokenize(message).length);
  const confidence = Math.min(0.95, retrieved[0].score / (queryTokenCount * 2));

  const reply = `Esto encontré en tus documentos sobre "${message}":\n\n${lines}\n\nFuentes citadas: ${retrieved
    .map((r, i) => `[${i + 1}] ${r.chunk.docName}`)
    .join(' · ')}`;

  res.json({
    botId,
    reply,
    sources,
    confidence: Number(confidence.toFixed(2)),
    latencyMs: 60 + Math.round(Math.random() * 80),
    timestamp,
  });
});

export default router;
