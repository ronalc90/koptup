/**
 * lead.service.ts — canal único para registrar leads.
 *
 * Es la lógica que antes vivía en `contact.controller.submitContact`: guarda el
 * `Contact` en MongoDB y dispara (sin bloquear) las notificaciones por WhatsApp
 * y email al equipo. La usan:
 *   - el formulario de /contact (`source: 'contact-form'`, por defecto), y
 *   - la demo "Prueba con tu documento" (`source: 'demo-rag'`).
 *
 * El guardado se espera (si Mongo falla, el error sube al caller, igual que
 * antes en el formulario); las notificaciones nunca hacen fallar la petición.
 */
import Contact, { DEFAULT_CONTACT_SOURCE, type ContactSource, type IContact } from '../models/Contact';
import { logger } from '../utils/logger';
import { whatsappService } from './whatsapp.service';
import { emailService } from './email.service';

export interface LeadInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service: string;
  budget?: string;
  message: string;
  /** Origen del lead; por defecto `contact-form`. */
  source?: ContactSource;
}

export async function registerLead(input: LeadInput): Promise<IContact> {
  const { name, email, phone, company, service, budget, message } = input;
  const source = input.source ?? DEFAULT_CONTACT_SOURCE;

  logger.info('📝 Processing contact form submission:');
  logger.info(`   Name: ${name}`);
  logger.info(`   Email: ${email}`);
  logger.info(`   Phone: ${phone || 'Not provided'}`);
  logger.info(`   Service: ${service}`);
  logger.info(`   Source: ${source}`);

  // Guardar en base de datos
  const contact = await Contact.create({
    name,
    email,
    phone,
    company,
    service,
    budget,
    message,
    source,
    status: 'new',
  });

  logger.info(`✅ Contact saved to database with ID: ${contact._id}`);

  const notification = { name, email, phone, company, service, budget, message, source };

  // Enviar notificación por WhatsApp (async, no bloqueante)
  logger.info('🔔 Triggering WhatsApp notification...');
  whatsappService.sendContactNotification(notification).catch((err) => {
    logger.error('❌ Failed to send WhatsApp notification:');
    logger.error(`   Error: ${err.message}`);
    logger.error(`   Stack: ${err.stack}`);
    // No fallar la petición si WhatsApp falla
  });

  // Enviar notificación por Email (async, no bloqueante)
  logger.info('📧 Triggering Email notification...');
  emailService.sendContactNotification(notification).catch((err) => {
    logger.error('❌ Failed to send Email notification:');
    logger.error(`   Error: ${err.message}`);
    logger.error(`   Stack: ${err.stack}`);
    // No fallar la petición si Email falla
  });

  return contact;
}
