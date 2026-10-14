import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Origen del lead. `contact-form` es el formulario de /contact (valor por
 * defecto, también para los contactos guardados antes de existir el campo);
 * `demo-rag` es la demo "Prueba con tu documento" de /demo/chatbot;
 * `demo-request` es el formulario "Solicitar demo" (POST /api/demo-requests).
 */
export const CONTACT_SOURCES = ['contact-form', 'demo-rag', 'demo-request'] as const;
export type ContactSource = (typeof CONTACT_SOURCES)[number];
export const DEFAULT_CONTACT_SOURCE: ContactSource = 'contact-form';

/**
 * Lo que la persona estaba cotizando cuando llegó a /contact desde un plan
 * RAG (`plan`) o desde "Cotizar este tier" del catálogo (`tier` y
 * `modality`). Solo identificadores; el nombre legible va en `service`.
 */
export const CONTACT_QUOTE_TIERS = ['basico', 'profesional', 'avanzado', 'enterprise'] as const;
export const CONTACT_QUOTE_MODALITIES = ['compra', 'saas'] as const;
export const CONTACT_QUOTE_PLANS = ['piloto', 'esencial', 'profesional', 'empresarial'] as const;

/**
 * ¿Cuándo quiere empezar? (campo "Plazo" de /contact): ya, el próximo mes, en
 * 2-3 meses o sin definir.
 */
export const CONTACT_TIMELINES = ['now', '1m', '3m', 'open'] as const;
export type ContactTimeline = (typeof CONTACT_TIMELINES)[number];

export interface IContactQuote {
  /** Slug del servicio (`sistema-rag` o una solución del catálogo). */
  servicio: string;
  plan?: (typeof CONTACT_QUOTE_PLANS)[number];
  nivel?: (typeof CONTACT_QUOTE_TIERS)[number];
  modalidad?: (typeof CONTACT_QUOTE_MODALITIES)[number];
}

/**
 * Prueba de la autorización de tratamiento de datos (Ley 1581 de 2012),
 * igual que en DemoRequest: la versión de la política la fija el servidor
 * (PRIVACY_POLICY_VERSION), la IP se guarda solo en hash SHA-256.
 */
export interface IContactConsent {
  aceptado: boolean;
  fecha: Date;
  ipHash?: string;
  userAgent?: string;
  versionPolitica: string;
}

export interface IContact extends Document {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service: string;
  budget?: string;
  message: string;
  status: 'new' | 'read' | 'responded';
  source?: ContactSource;
  /** Plan, nivel o modalidad que se estaba cotizando (formulario de /contact). */
  cotizacion?: IContactQuote | null;
  /** Cuándo quiere empezar (formulario de /contact). */
  plazo?: ContactTimeline | null;
  /**
   * Lead del pipeline comercial al que pertenece (deduplicado por email). Lo
   * fija services/leads.service.ts: al registrar el contacto y, para los
   * contactos anteriores al pipeline, la migración del arranque.
   */
  lead?: Types.ObjectId | null;
  /** Autorización de datos del formulario de contacto o de "Prueba con tu documento". */
  consentimiento?: IContactConsent | null;
  /** Fecha en que el job de conservación quitó los datos personales (jobs/retention.job.ts). */
  anonimizadoEn?: Date | null;
  created_at: Date;
}

const ContactSchema = new Schema<IContact>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  company: { type: String },
  service: { type: String, required: true },
  budget: { type: String },
  message: { type: String, required: true },
  status: { type: String, enum: ['new', 'read', 'responded'], default: 'new' },
  source: { type: String, enum: [...CONTACT_SOURCES], default: DEFAULT_CONTACT_SOURCE },
  cotizacion: {
    type: new Schema<IContactQuote>(
      {
        servicio: { type: String, required: true, maxlength: 60 },
        plan: { type: String, enum: [...CONTACT_QUOTE_PLANS] },
        nivel: { type: String, enum: [...CONTACT_QUOTE_TIERS] },
        modalidad: { type: String, enum: [...CONTACT_QUOTE_MODALITIES] },
      },
      { _id: false },
    ),
    default: undefined,
  },
  plazo: { type: String, enum: [...CONTACT_TIMELINES] },
  lead: { type: Schema.Types.ObjectId, ref: 'Lead' },
  consentimiento: {
    type: new Schema<IContactConsent>(
      {
        aceptado: { type: Boolean, required: true },
        fecha: { type: Date, required: true },
        ipHash: { type: String },
        userAgent: { type: String, maxlength: 300 },
        versionPolitica: { type: String, required: true, maxlength: 40 },
      },
      { _id: false },
    ),
    default: undefined,
  },
  anonimizadoEn: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
});

ContactSchema.index({ lead: 1, created_at: -1 });

export default mongoose.model<IContact>('Contact', ContactSchema);
