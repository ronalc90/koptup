/**
 * whatsapp-webhook.routes.ts — webhook de estados de WhatsApp (Meta).
 * Montado en /api/webhooks/whatsapp ANTES del `express.json` global: la
 * firma se calcula sobre el cuerpo CRUDO.
 *
 * Solo existe si están WHATSAPP_WEBHOOK_VERIFY_TOKEN y WHATSAPP_APP_SECRET
 * (si no, 404):
 *  - GET: verificación de Meta (`hub.mode=subscribe` y `hub.verify_token`
 *    igual al configurado → responde `hub.challenge`; si no, 403).
 *  - POST: exige `X-Hub-Signature-256` = HMAC-SHA256 del cuerpo crudo con el
 *    app secret (comparación en tiempo constante; sin firma válida → 401),
 *    responde 200 de inmediato y procesa `entry[].changes[].value.statuses[]`
 *    (services/owner-notify.service.ts: entregado / leído / fallido por
 *    wamid y, si falla, correo de alerta al dueño).
 *
 * Tiene su propio límite por IP, holgado (Meta reintenta y agrupa eventos),
 * y acepta cuerpos de hasta 3 MB (el máximo que Meta documenta).
 */
import crypto from 'crypto';
import express, { Request, Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { whatsappService, verifyMetaSignature } from '../services/whatsapp.service';
import { processWhatsAppStatuses } from '../services/owner-notify.service';
import { resolveClientIp } from '../middleware/client-ip';
import { sendError } from '../utils/http-error';
import { logger } from '../utils/logger';

/** Último procesamiento (para las pruebas). */
let lastProcessing: Promise<unknown> = Promise.resolve();
export function lastWebhookProcessing(): Promise<unknown> {
  return lastProcessing;
}

function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb) && a.length === b.length;
}

export function createWhatsAppWebhookRouter(): Router {
  const router = Router();

  router.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 600,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => `ip:${resolveClientIp(req)}`,
      handler: (_req, res) => {
        res.status(429).json({ success: false, code: 'rate_limited', message: 'Demasiadas peticiones al webhook.' });
      },
    }),
  );

  // Sin las dos variables el webhook no existe.
  router.use((_req, res, next) => {
    if (!whatsappService.isWebhookEnabled()) {
      sendError(res, 404, 'not_found', 'Esta ruta no existe.');
      return;
    }
    next();
  });

  router.get('/', (req: Request, res: Response) => {
    const mode = String(req.query['hub.mode'] ?? '');
    const token = String(req.query['hub.verify_token'] ?? '');
    const challenge = String(req.query['hub.challenge'] ?? '');
    if (mode === 'subscribe' && token && safeEqual(token, whatsappService.getVerifyToken())) {
      res.status(200).type('text/plain').send(challenge);
      return;
    }
    sendError(res, 403, 'forbidden', 'Token de verificación inválido.');
  });

  router.post('/', express.raw({ type: '*/*', limit: '3mb' }), (req: Request, res: Response) => {
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    if (!verifyMetaSignature(raw, req.get('x-hub-signature-256'), whatsappService.getAppSecret())) {
      logger.warn('[whatsapp-webhook] Firma inválida o ausente: petición descartada');
      sendError(res, 401, 'invalid_signature', 'Firma inválida.');
      return;
    }
    let payload: unknown;
    try {
      payload = JSON.parse(raw.toString('utf8') || '{}');
    } catch {
      sendError(res, 400, 'invalid_json', 'El cuerpo no es JSON válido.');
      return;
    }
    res.status(200).json({ success: true });
    lastProcessing = processWhatsAppStatuses(payload).catch((err) => {
      logger.error(`[whatsapp-webhook] Error procesando estados: ${(err as Error)?.message ?? err}`);
    });
  });

  return router;
}
