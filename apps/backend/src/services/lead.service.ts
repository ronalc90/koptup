/**
 * lead.service.ts — canal único para registrar leads.
 *
 * Es la lógica que antes vivía en `contact.controller.submitContact`: guarda el
 * `Contact` en MongoDB con el estado de los avisos al dueño en `pendiente`
 * (o `no_configurado` si falta el canal) y dispara (sin bloquear la respuesta)
 * los avisos por correo y WhatsApp de services/owner-notify.service.ts, que
 * guardan el resultado por canal en `Contact.notificaciones`; si un canal
 * falla, jobs/notify-retry.job.ts lo reintenta. La usan:
 *   - el formulario de /contact (`source: 'contact-form'`, por defecto),
 *   - la demo "Prueba con tu documento" (`source: 'demo-rag'`), y
 *   - el formulario "Solicitar demo" (`source: 'demo-request'`).
 *
 * El guardado se espera (si Mongo falla, el error sube al caller, igual que
 * antes en el formulario); las notificaciones nunca hacen fallar la petición.
 * Con el flujo de compra activo (COMMERCE_ENABLED=true), cada contacto se
 * liga además a su `Lead` del pipeline comercial (services/leads.service.ts),
 * que agrupa los contactos por email; apagado, solo se guarda el `Contact`.
 */
import Contact, {
  DEFAULT_CONTACT_SOURCE,
  type ContactSource,
  type ContactTimeline,
  type IContact,
  type IContactConsent,
  type IContactQuote,
} from '../models/Contact';
import { logger } from '../utils/logger';
import { deliverContactNotifications, initialNotifications } from './owner-notify.service';
import { isCommerceEnabled } from '../config/commerce';
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
  /** Plan, nivel o modalidad que se estaba cotizando (formulario de /contact). */
  cotizacion?: IContactQuote;
  /** Cuándo quiere empezar (formulario de /contact). */
  plazo?: ContactTimeline;
  /** Prueba de la autorización de datos (Ley 1581): versión de la política del servidor, fecha, hash de IP. */
  consentimiento?: IContactConsent;
}

export interface LeadNotificationResult {
  /** true si el aviso por WhatsApp al dueño se envió (false si no está configurado o falló). */
  whatsapp: boolean;
  /** true si el aviso por email al dueño se envió (false si no está configurado o falló). */
  email: boolean;
}

/**
 * Guarda el lead y dispara los avisos al dueño sin esperarlos. `notified`
 * se resuelve (nunca se rechaza) cuando terminan, con lo que de verdad se
 * envió (el detalle por canal queda en `Contact.notificaciones`); la
 * solicitud de demo lo guarda para que el panel lo muestre.
 */
export async function registerLeadWithNotifications(
  input: LeadInput,
): Promise<{ contact: IContact; notified: Promise<LeadNotificationResult> }> {
  const { name, email, phone, company, service, budget, message } = input;
  const source = input.source ?? DEFAULT_CONTACT_SOURCE;

  logger.info(`📝 Registrando lead (origen: ${source})`);

  // Guardar en base de datos (con los avisos ya "reclamados" por 10 min: si el
  // proceso se reinicia a mitad del envío, el job de reintentos los retoma).
  const now = new Date();
  const contact = await Contact.create({
    name,
    email,
    phone,
    company,
    service,
    budget,
    message,
    source,
    ...(input.cotizacion ? { cotizacion: input.cotizacion } : {}),
    ...(input.plazo ? { plazo: input.plazo } : {}),
    ...(input.consentimiento ? { consentimiento: input.consentimiento } : {}),
    notificaciones: initialNotifications(now),
    status: 'new',
    created_at: now,
  });

  logger.info(`✅ Contact saved to database with ID: ${contact._id}`);

  // Pipeline comercial (solo con COMMERCE_ENABLED=true): liga el contacto a
  // su Lead (uno por email). Nunca hace fallar el registro del contacto.
  if (isCommerceEnabled()) await syncLeadFromContactSafe(contact);

  // Avisos al dueño (no bloqueantes: nunca hacen fallar la petición).
  const notified = deliverContactNotifications(contact, { modo: 'inicial', now })
    .then((r) => ({ whatsapp: r.whatsapp?.enviado === true, email: r.email?.enviado === true }))
    .catch((err) => {
      logger.error(`❌ Avisos del contacto ${String(contact._id)}: ${(err as Error)?.message ?? err}`);
      return { whatsapp: false, email: false };
    });

  return { contact, notified };
}

export async function registerLead(input: LeadInput): Promise<IContact> {
  const { contact } = await registerLeadWithNotifications(input);
  return contact;
}
