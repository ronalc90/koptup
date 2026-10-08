import mongoose, { Document, Schema, Types } from 'mongoose';
import {
  LEAD_LOST_REASONS,
  LEAD_SOURCES,
  LEAD_STAGES,
  type LeadLostReason,
  type LeadSource,
  type LeadStage,
} from '../config/commerce';

/**
 * Lead: una persona interesada, deduplicada por email (normalizado igual que
 * el login). Reúne todos sus `Contact` (formulario de contacto, "Prueba con
 * tu documento", "Solicitar demo"), sus solicitudes, accesos y propuestas.
 *
 * Los `Contact` no se modifican salvo el enlace `Contact.lead`: el pipeline
 * se arma encima de ellos (services/leads.service.ts → migrateContactsToLeads
 * al arrancar, y `syncLeadFromContact` en cada lead nuevo).
 *
 * Etapas: nuevo → contactado → demo → propuesta → ganado | perdido (motivo).
 * Cada cambio de etapa deja una `LeadActivity` de tipo `cambio_etapa`.
 */
export interface ILeadNextAction {
  descripcion: string;
  fecha: Date;
  asignadaPor?: Types.ObjectId | null;
}

export interface ILead extends Document {
  email: string;
  nombre: string;
  empresa?: string;
  telefono?: string;
  etapa: LeadStage;
  etapaCambiadaEn: Date;
  motivoPerdida?: LeadLostReason | null;
  detallePerdida?: string | null;
  responsable?: Types.ObjectId | null;
  proximaAccion?: ILeadNextAction | null;
  /** Orígenes por los que llegó (sin repetir) y el primero. */
  origenes: LeadSource[];
  origenPrincipal: LeadSource;
  /** Productos o servicios de interés (de sus formularios y solicitudes). */
  intereses: string[];
  /** Cuenta del portal, si la tiene. */
  usuario?: Types.ObjectId | null;
  /** Mensajes recibidos (Contact) ligados a este lead. */
  contactos: number;
  ultimaActividadEn: Date;
  /**
   * Solicitud de propuesta abierta (POST /api/me/proposal-requests). Se
   * reclama con una actualización condicionada a `null`: una segunda
   * solicitud mientras esta siga abierta no crea otra tarea. Se cierra al
   * enviar una propuesta o al completar la tarea.
   */
  solicitudPropuesta?: {
    abiertaEn: Date;
    tarea?: Types.ObjectId | null;
    interes?: string;
    mensaje?: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

const NextActionSchema = new Schema<ILeadNextAction>(
  {
    descripcion: { type: String, required: true, maxlength: 500 },
    fecha: { type: Date, required: true },
    asignadaPor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: false },
);

const LeadSchema = new Schema<ILead>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    nombre: { type: String, required: true, trim: true, maxlength: 160 },
    empresa: { type: String, trim: true, maxlength: 160 },
    telefono: { type: String, trim: true, maxlength: 40 },
    etapa: { type: String, enum: [...LEAD_STAGES], default: 'nuevo', index: true },
    etapaCambiadaEn: { type: Date, default: Date.now },
    motivoPerdida: { type: String, enum: [...LEAD_LOST_REASONS, null], default: null },
    detallePerdida: { type: String, maxlength: 1000, default: null },
    responsable: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    proximaAccion: { type: NextActionSchema, default: null },
    origenes: { type: [String], enum: [...LEAD_SOURCES], default: [] },
    origenPrincipal: { type: String, enum: [...LEAD_SOURCES], default: 'manual' },
    intereses: { type: [String], default: [] },
    usuario: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    contactos: { type: Number, default: 0 },
    ultimaActividadEn: { type: Date, default: Date.now },
    solicitudPropuesta: {
      type: new Schema(
        {
          abiertaEn: { type: Date, required: true },
          tarea: { type: Schema.Types.ObjectId, ref: 'LeadActivity', default: null },
          interes: { type: String, maxlength: 200 },
          mensaje: { type: String, maxlength: 2000 },
        },
        { _id: false },
      ),
      default: null,
    },
  },
  { timestamps: true },
);

LeadSchema.index({ etapa: 1, ultimaActividadEn: -1 });
LeadSchema.index({ origenes: 1 });
LeadSchema.index({ 'proximaAccion.fecha': 1 });

export default mongoose.model<ILead>('Lead', LeadSchema);
