import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import Contact from '../models/Contact';
import { logger } from '../utils/logger';
import { whatsappService } from '../services/whatsapp.service';
import { emailService } from '../services/email.service';

export const submitContact = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation error', 400);
  }

  const { name, email, phone, company, service, budget, message } = req.body;

  logger.info('📝 Processing contact form submission:');
  logger.info(`   Name: ${name}`);
  logger.info(`   Email: ${email}`);
  logger.info(`   Phone: ${phone || 'Not provided'}`);
  logger.info(`   Service: ${service}`);

  // Guardar en base de datos
  const contact = await Contact.create({
    name,
    email,
    phone,
    company,
    service,
    budget,
    message,
    status: 'new',
  });

  logger.info(`✅ Contact saved to database with ID: ${contact._id}`);

  // Enviar notificación por WhatsApp (async, no bloqueante)
  logger.info('🔔 Triggering WhatsApp notification...');
  whatsappService.sendContactNotification({
    name,
    email,
    phone,
    company,
    service,
    budget,
    message,
  }).catch((err) => {
    logger.error('❌ Failed to send WhatsApp notification:');
    logger.error(`   Error: ${err.message}`);
    logger.error(`   Stack: ${err.stack}`);
    // No fallar la petición si WhatsApp falla
  });

  // Enviar notificación por Email (async, no bloqueante)
  logger.info('📧 Triggering Email notification...');
  emailService.sendContactNotification({
    name,
    email,
    phone,
    company,
    service,
    budget,
    message,
  }).catch((err) => {
    logger.error('❌ Failed to send Email notification:');
    logger.error(`   Error: ${err.message}`);
    logger.error(`   Stack: ${err.stack}`);
    // No fallar la petición si Email falla
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
