import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { whatsappService } from '../services/whatsapp.service';
import { emailService } from '../services/email.service';
import { registerLead } from '../services/lead.service';
import { hashIp } from '../services/audit.service';
import { resolveClientIp } from '../middleware/client-ip';
import { currentPrivacyPolicyVersion } from '../config/demos';

const CONTACT_OK_MESSAGE = 'Recibimos tu mensaje. Te responderemos al correo que indicaste.';

/**
 * POST /api/contact. Orden: campo trampa (a un bot se le responde igual que a
 * una persona, sin guardar nada), autorización de datos obligatoria,
 * validación con el campo que falló y, por último, el registro del lead con
 * la prueba de la autorización (versión de la política del servidor, fecha,
 * hash de la IP y navegador).
 */
export const submitContact = asyncHandler(async (req: Request, res: Response) => {
  const body = (req.body ?? {}) as Record<string, unknown>;

  if (typeof body.website === 'string' && body.website.trim() !== '') {
    logger.warn('[contact] Campo trampa activado: envío descartado');
    res.json({ success: true, message: CONTACT_OK_MESSAGE });
    return;
  }

  if (body.consentimiento !== true && body.consentimiento !== 'true') {
    throw new AppError(
      'Debes autorizar el tratamiento de tus datos personales (Ley 1581 de 2012) para enviar el mensaje.',
      400,
      'consent_required',
      { fields: ['consentimiento'], errores: { consentimiento: 'Marca la casilla de autorización para enviar el mensaje.' } },
    );
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errores: Record<string, string> = {};
    for (const e of errors.array()) {
      const field = e.type === 'field' ? e.path : '_';
      if (!errores[field]) errores[field] = String(e.msg);
    }
    const first = Object.values(errores)[0] ?? 'Revisa los datos del formulario.';
    throw new AppError(first, 400, 'invalid_request', { fields: Object.keys(errores), errores });
  }

  const { name, email, phone, company, service, budget, message, quote, timeline } = req.body;

  // Guarda el Contact y notifica por WhatsApp/email (mismo canal que usa la
  // demo "Prueba con tu documento" con origen "demo-rag").
  await registerLead({
    name,
    email,
    phone,
    company,
    service,
    budget,
    message,
    source: 'contact-form',
    consentimiento: {
      aceptado: true,
      fecha: new Date(),
      ipHash: hashIp(resolveClientIp(req)),
      userAgent: req.get('user-agent')?.slice(0, 300),
      versionPolitica: currentPrivacyPolicyVersion(),
    },
    plazo: timeline || undefined,
    cotizacion: quote
      ? {
          servicio: quote.service,
          ...(quote.plan ? { plan: quote.plan } : {}),
          ...(quote.tier ? { nivel: quote.tier } : {}),
          ...(quote.modality ? { modalidad: quote.modality } : {}),
        }
      : undefined,
  });

  res.json({ success: true, message: CONTACT_OK_MESSAGE });
});

/**
 * Endpoint de prueba para WhatsApp
 */
export const testWhatsApp = asyncHandler(async (req: Request, res: Response) => {
  logger.info('Testing WhatsApp notification...');

  try {
    const result = await whatsappService.sendTestMessage();

    res.json({
      success: result,
      message: result ? 'WhatsApp test message sent successfully' : 'WhatsApp not configured or failed',
    });
  } catch (error: any) {
    logger.error('WhatsApp test failed:', error);
    throw new AppError('WhatsApp test failed: ' + error.message, 500);
  }
});

/**
 * Endpoint de prueba para Email
 */
export const testEmail = asyncHandler(async (req: Request, res: Response) => {
  logger.info('Testing Email notification...');

  try {
    const result = await emailService.sendTestEmail();

    res.json({
      success: result,
      message: result ? 'Email test sent successfully' : 'Email not configured or failed',
    });
  } catch (error: any) {
    logger.error('Email test failed:', error);
    throw new AppError('Email test failed: ' + error.message, 500);
  }
});
