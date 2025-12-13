import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import Contact from '../models/Contact';
import { logger } from '../utils/logger';
import { whatsappService } from '../services/whatsapp.service';

export const submitContact = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation error', 400);
  }

  const { name, email, phone, company, service, budget, message } = req.body;

  // Guardar en base de datos
  await Contact.create({
    name,
    email,
    phone,
    company,
    service,
    budget,
    message,
    status: 'new',
  });

  logger.info(`Contact form submitted: ${email} - Service: ${service}`);

  // Enviar notificación por WhatsApp (async, no bloqueante)
  whatsappService.sendContactNotification({
    name,
    email,
    phone,
    company,
    service,
    budget,
    message,
  }).catch((err) => {
    logger.error('Failed to send WhatsApp notification:', err);
    // No fallar la petición si WhatsApp falla
  });

  res.json({
    success: true,
    message: 'Contact form submitted successfully',
  });
});
