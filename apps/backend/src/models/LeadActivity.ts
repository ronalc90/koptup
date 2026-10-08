import mongoose, { Document, Schema, Types } from 'mongoose';
import { LEAD_ACTIVITY_TYPES, type LeadActivityType } from '../config/commerce';

/**
 * Actividad en la línea de tiempo de un lead: notas, llamadas, emails,
 * WhatsApp, reuniones, tareas (con vencimiento y cierre), cambios de etapa,
 * propuestas y solicitudes de propuesta. Las del sistema no tienen autor.
 */
export interface ILeadActivity extends Document {
  lead: Types.ObjectId;
  tipo: LeadActivityType;
  texto: string;
  /** Datos extra (de/a en cambio_etapa, número de propuesta, interés…). */
  meta?: Record<string, unknown>;
  autor?: Types.ObjectId | null;
  autorEmail?: string | null;
  /** Solo tareas: clase (p. ej. `preparar_propuesta`), vencimiento y cierre. */
  tarea?: {
    clase?: string | null;
    vence: Date;
    completadaEn?: Date | null;
    completadaPor?: Types.ObjectId | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

const LeadActivitySchema = new Schema<ILeadActivity>(
  {
    lead: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    tipo: { type: String, enum: [...LEAD_ACTIVITY_TYPES], required: true },
    texto: { type: String, required: true, maxlength: 4000 },
    meta: { type: Schema.Types.Mixed },
    autor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    autorEmail: { type: String, default: null },
    tarea: {
      type: new Schema(
        {
          clase: { type: String, default: null },
          vence: { type: Date, required: true },
          completadaEn: { type: Date, default: null },
          completadaPor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        },
        { _id: false },
      ),
      default: null,
    },
  },
  { timestamps: true },
);

LeadActivitySchema.index({ lead: 1, createdAt: -1 });
LeadActivitySchema.index({ 'tarea.clase': 1, 'tarea.completadaEn': 1 });

export default mongoose.model<ILeadActivity>('LeadActivity', LeadActivitySchema);
