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
  /**
   * Lead del pipeline comercial al que pertenece (deduplicado por email). Lo
   * fija services/leads.service.ts: al registrar el contacto y, para los
   * contactos anteriores al pipeline, la migración del arranque.
   */
  lead?: Types.ObjectId | null;
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
  lead: { type: Schema.Types.ObjectId, ref: 'Lead' },
  created_at: { type: Date, default: Date.now },
});

ContactSchema.index({ lead: 1, created_at: -1 });

export default mongoose.model<IContact>('Contact', ContactSchema);
