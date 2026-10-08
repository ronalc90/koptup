/**
 * lead.service.ts — canal único para registrar leads.
 *
 * Es la lógica que antes vivía en `contact.controller.submitContact`: guarda el
 * `Contact` en MongoDB y dispara (sin bloquear) las notificaciones por WhatsApp
 * y email al equipo. La usan:
 *   - el formulario de /contact (`source: 'contact-form'`, por defecto),
 *   - la demo "Prueba con tu documento" (`source: 'demo-rag'`), y
 *   - el formulario "Solicitar demo" (`source: 'demo-request'`).
 *
 * El guardado se espera (si Mongo falla, el error sube al caller, igual que
 * antes en el formulario); las notificaciones nunca hacen fallar la petición.
 * Cada contacto se liga además a su `Lead` del pipeline comercial
 * (services/leads.service.ts), que agrupa los contactos por email.
 */
import Contact, { DEFAULT_CONTACT_SOURCE, type ContactSource, type IContact } from '../models/Contact';
import { logger } from '../utils/logger';
import { whatsappService } from './whatsapp.service';
import { emailService } from './email.service';
import { syncLeadFromContactSafe } from './leads.service';

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

export interface LeadNotificationResult {
  /** true si el aviso por WhatsApp al equipo se envió (false si no está configurado o falló). */
  whatsapp: boolean;
  /** true si el aviso por email al equipo se envió (false si no está configurado o falló). */
  email: boolean;
}

/**
 * Guarda el lead y dispara los avisos al equipo sin esperarlos. `notified`
 * se resuelve (nunca se rechaza) cuando terminan, con lo que de verdad se
 * envió; la solicitud de demo lo guarda para que el panel lo muestre.
 */
export async function registerLeadWithNotifications(
  input: LeadInput,
): Promise<{ contact: IContact; notified: Promise<LeadNotificationResult> }> {
  const { name, email, phone, company, service, budget, message } = input;
  const source = input.source ?? DEFAULT_CONTACT_SOURCE;

  logger.info(`📝 Registrando lead (origen: ${source})`);

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

  // Pipeline comercial: liga el contacto a su Lead (uno por email). Nunca
  // hace fallar el registro del contacto.
  await syncLeadFromContactSafe(contact);

  const notification = { name, email, phone, company, service, budget, message, source };

  // Avisos al equipo (no bloqueantes: nunca hacen fallar la petición).
  const whatsapp = whatsappService.sendContactNotification(notification).catch((err) => {
    logger.error(`❌ Failed to send WhatsApp notification: ${err?.message ?? err}`);
    return false;
  });
  const emailSent = emailService.sendContactNotification(notification).catch((err) => {
    logger.error(`❌ Failed to send Email notification: ${err?.message ?? err}`);
    return false;
  });
  const notified = Promise.all([whatsapp, emailSent]).then(([w, e]) => ({ whatsapp: w === true, email: e === true }));

  return { contact, notified };
}

export async function registerLead(input: LeadInput): Promise<IContact> {
  const { contact } = await registerLeadWithNotifications(input);
  return contact;
}
