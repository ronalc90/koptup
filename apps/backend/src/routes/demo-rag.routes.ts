/**
 * demo-rag.routes.ts — API de la demo "Prueba con tu documento" (/demo/chatbot).
 * Montado en /api/demo-rag (ver index.ts). Lógica en services/demo-rag.service.ts.
 *
 *   GET    /status                        → habilitada, motivo y si se agotó el presupuesto (sin montos)
 *   POST   /documents                     → multipart: file + email + consent=true
 *   GET    /documents/:docId              → estado del documento (preguntas usadas, vencimiento)
 *   POST   /documents/:docId/questions    → { question } → respuesta con citas
 *   DELETE /documents/:docId              → borra el documento de memoria antes del TTL
 *
 * Errores: { success: false, code, message } con códigos estables que el
 * front traduce (invalid_format, file_too_large, too_many_pages, daily_limit,
 * question_limit, budget_exhausted, demo_disabled, …).
 */
import { Router, Request, Response } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import { logger } from '../utils/logger';
import { registerLead } from '../services/lead.service';
import {
  DEMO_LIMITS,
  DemoRagError,
  PUBLIC_LIMITS,
  assertDemoEnabled,
  askDocument,
  deleteDocument,
  detectKind,
  getDemoStatus,
  getDocumentInfo,
  ingestDocument,
  reserveDailyUpload,
  type DemoDocumentInfo,
} from '../services/demo-rag.service';

const router = Router();

const DOC_ID_PATTERN = /^[a-f0-9]{32}$/;
const TEN_MINUTES_MS = 10 * 60 * 1000;

function sendError(res: Response, err: unknown): void {
  if (err instanceof DemoRagError) {
    res.status(err.status).json({ success: false, code: err.code, message: err.message });
    return;
  }
  logger.error('[demo-rag] Error inesperado:', err);
  const fallback = new DemoRagError('internal_error');
  res.status(fallback.status).json({ success: false, code: fallback.code, message: fallback.message });
}

// --- Rate limit por IP (además del límite diario en Redis) -------------------
//
// Protegen el presupuesto y la CPU (parseo de PDF/DOCX). req.ip es la IP real
// del visitante porque index.ts configura `trust proxy` para el proxy de Railway.

const rateLimitHandler = (_req: Request, res: Response) => sendError(res, new DemoRagError('rate_limited'));

const uploadRateLimiter = rateLimit({
  windowMs: TEN_MINUTES_MS,
  max: 10, // intentos de subida por IP cada 10 min (el cupo real es 3 documentos al día)
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const questionRateLimiter = rateLimit({
  windowMs: TEN_MINUTES_MS,
  max: 30, // preguntas por IP cada 10 min
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// --- Subida: multer en memoria (nunca a disco) --------------------------------

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: DEMO_LIMITS.maxFileBytes,
    files: 1,
    fields: 5,
    fieldSize: 1024,
    parts: 8,
  },
  fileFilter: (_req, file, cb) => {
    if (!detectKind(file.originalname, file.mimetype)) {
      cb(new DemoRagError('invalid_format'));
      return;
    }
    cb(null, true);
  },
});

/** Ejecuta multer y traduce sus errores a códigos de la demo. */
function parseMultipart(req: Request, res: Response): Promise<void> {
  return new Promise((resolve, reject) => {
    upload.single('file')(req, res, (err?: unknown) => {
      if (!err) {
        resolve();
        return;
      }
      if (err instanceof DemoRagError) {
        reject(err);
        return;
      }
      if (err instanceof multer.MulterError) {
        reject(new DemoRagError(err.code === 'LIMIT_FILE_SIZE' ? 'file_too_large' : 'invalid_request'));
        return;
      }
      reject(new DemoRagError('invalid_request'));
    });
  });
}

function clientIp(req: Request): string {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

/** Registra el lead por el mismo canal del formulario de contacto (origen demo-rag). */
function registerDemoLead(email: string, doc: DemoDocumentInfo, consentAt: Date): void {
  const unit = doc.pages === 1 ? 'página' : 'páginas';
  const pagesText = `${doc.pages} ${unit}${doc.pagesEstimated ? (doc.pages === 1 ? ' estimada' : ' estimadas') : ''}`;
  registerLead({
    name: 'Lead de la demo RAG',
    email,
    service: 'Demo RAG: prueba con tu documento',
    message: [
      `Subió un documento ${doc.kind.toUpperCase()} (${pagesText}) en /demo/chatbot, opción "Prueba con tu documento".`,
      `Autorizó el tratamiento de sus datos personales según la Ley 1581 de 2012 y la política de privacidad (${consentAt.toISOString()}).`,
    ].join('\n'),
    source: 'demo-rag',
  }).catch((err) => {
    // El visitante igual puede usar la demo; el error queda en el log.
    logger.error(`[demo-rag] No se pudo registrar el lead: ${(err as Error)?.message ?? err}`);
  });
}

// --- Endpoints ----------------------------------------------------------------

router.get('/status', async (_req: Request, res: Response) => {
  try {
    const status = await getDemoStatus();
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, ...status, limits: PUBLIC_LIMITS });
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/documents', uploadRateLimiter, async (req: Request, res: Response) => {
  try {
    // 1) Encendido, Redis, OpenAI y presupuesto: antes de leer el archivo.
    await assertDemoEnabled();

    // 2) Archivo (formato por extensión + mimetype y 5 MB, en memoria).
    await parseMultipart(req, res);
    const file = req.file;
    if (!file || !file.buffer || file.size === 0) throw new DemoRagError('missing_file');
    const kind = detectKind(file.originalname, file.mimetype);
    if (!kind) throw new DemoRagError('invalid_format');

    // 3) Email válido y autorización de datos (Ley 1581 de 2012) obligatoria.
    const emailCheck = await body('email').trim().isLength({ max: 254 }).isEmail().normalizeEmail().run(req);
    if (!emailCheck.isEmpty() || typeof req.body?.email !== 'string') throw new DemoRagError('invalid_email');
    const email: string = req.body.email;
    if (String(req.body?.consent) !== 'true') throw new DemoRagError('consent_required');
    const consentAt = new Date();

    // 4) Cupo diario por IP (3 documentos). Se devuelve si el documento se rechaza.
    const releaseDailySlot = await reserveDailyUpload(clientIp(req));
    let doc: DemoDocumentInfo;
    try {
      doc = await ingestDocument({ buffer: file.buffer, kind, originalName: file.originalname });
    } catch (err) {
      await releaseDailySlot();
      throw err;
    }

    // 5) Lead por el canal del formulario de contacto, sin bloquear la demo.
    registerDemoLead(email, doc, consentAt);

    res.status(201).json({ success: true, document: doc, limits: PUBLIC_LIMITS });
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/documents/:docId', (req: Request, res: Response) => {
  const { docId } = req.params;
  const info = DOC_ID_PATTERN.test(docId) ? getDocumentInfo(docId) : null;
  if (!info) {
    sendError(res, new DemoRagError('document_not_found'));
    return;
  }
  res.set('Cache-Control', 'no-store');
  res.json({ success: true, document: info });
});

router.post('/documents/:docId/questions', questionRateLimiter, async (req: Request, res: Response) => {
  try {
    const { docId } = req.params;
    if (!DOC_ID_PATTERN.test(docId)) throw new DemoRagError('document_not_found');
    const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
    if (!question || question.length > DEMO_LIMITS.maxQuestionChars) throw new DemoRagError('invalid_question');

    const result = await askDocument(docId, question);
    res.json({ success: true, ...result });
  } catch (err) {
    sendError(res, err);
  }
});

router.delete('/documents/:docId', (req: Request, res: Response) => {
  const { docId } = req.params;
  const deleted = DOC_ID_PATTERN.test(docId) ? deleteDocument(docId) : false;
  res.json({ success: true, deleted });
});

export default router;
