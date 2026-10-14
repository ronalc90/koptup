/**
 * demo-rag.routes.ts — API de la demo "Prueba con tu documento" (/demo/chatbot).
 * Montado en /api/demo-rag (ver index.ts). Lógica en services/demo-rag.service.ts.
 *
 *   GET    /status                        → habilitada, motivo y si se agotó el presupuesto (sin montos)
 *   POST   /documents                     → multipart: file + email + consent=true
 *                                            (primero registra el lead con la prueba de la
 *                                            autorización; si no se puede, no procesa el documento)
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
import Contact, { type IContact, type IContactConsent } from '../models/Contact';
import { hashIp } from '../services/audit.service';
import { resolveClientIp } from '../middleware/client-ip';
import { isDbReady } from '../middleware/access';
import { currentPrivacyPolicyVersion } from '../config/demos';
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

/**
 * Registra el lead (origen demo-rag, mismo canal del formulario de contacto)
 * con la prueba de la autorización ANTES de procesar el documento. Si no se
 * puede guardar, no se procesa (DemoRagError `lead_unavailable`).
 */
async function registerDemoLead(email: string, kind: string, consentimiento: IContactConsent): Promise<IContact> {
  if (!isDbReady()) throw new DemoRagError('lead_unavailable');
  try {
    return await registerLead({
      name: 'Lead de la demo RAG',
      email,
      service: 'Demo RAG: prueba con tu documento',
      message: `Subió un documento ${kind.toUpperCase()} en /demo/chatbot, opción "Prueba con tu documento".`,
      source: 'demo-rag',
      consentimiento,
    });
  } catch (err) {
    logger.error(`[demo-rag] No se pudo registrar el lead: ${(err as Error)?.message ?? err}`);
    throw new DemoRagError('lead_unavailable');
  }
}

/** Completa el mensaje del lead con el resultado del procesamiento (sin bloquear la demo). */
function noteDocumentResult(contact: IContact, text: string): void {
  Contact.updateOne({ _id: contact._id }, { $set: { message: `${contact.message}\n${text}` } }).catch((err) =>
    logger.warn(`[demo-rag] No se pudo completar el lead: ${(err as Error)?.message ?? err}`),
  );
}

function pagesText(doc: DemoDocumentInfo): string {
  const unit = doc.pages === 1 ? 'página' : 'páginas';
  return `${doc.pages} ${unit}${doc.pagesEstimated ? (doc.pages === 1 ? ' estimada' : ' estimadas') : ''}`;
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
    // Prueba de la autorización como en las solicitudes de demo: versión de
    // la política que fija el servidor, fecha, hash de la IP y navegador.
    const consentimiento: IContactConsent = {
      aceptado: true,
      fecha: new Date(),
      ipHash: hashIp(resolveClientIp(req)),
      userAgent: req.get('user-agent')?.slice(0, 300),
      versionPolitica: currentPrivacyPolicyVersion(),
    };

    // 4) Cupo diario por IP (3 documentos). Se devuelve si el documento se rechaza.
    const releaseDailySlot = await reserveDailyUpload(clientIp(req));

    // 5) Lead con la autorización. Si no se puede guardar, no se procesa el documento.
    let contact: IContact;
    try {
      contact = await registerDemoLead(email, kind, consentimiento);
    } catch (err) {
      await releaseDailySlot();
      throw err;
    }

    let doc: DemoDocumentInfo;
    try {
      doc = await ingestDocument({ buffer: file.buffer, kind, originalName: file.originalname });
    } catch (err) {
      await releaseDailySlot();
      noteDocumentResult(contact, `El documento no se pudo procesar (${err instanceof DemoRagError ? err.code : 'error'}).`);
      throw err;
    }
    noteDocumentResult(contact, `Documento procesado: ${pagesText(doc)}.`);

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
