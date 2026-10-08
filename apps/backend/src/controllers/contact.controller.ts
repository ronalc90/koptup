import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { whatsappService } from '../services/whatsapp.service';
import { emailService } from '../services/email.service';
import { registerLead } from '../services/lead.service';

export const submitContact = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation error', 400);
  }

  const { name, email, phone, company, service, budget, message } = req.body;

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
  });

  res.json({
    success: true,
    message: 'Contact form submitted successfully',
  });
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
