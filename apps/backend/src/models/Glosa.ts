import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IGlosa extends Document {
  procedimientoId: Types.ObjectId;
  atencionId: Types.ObjectId;
  facturaId: Types.ObjectId;

  // Tipo de glosa
  codigo: string; // Ej: G001, G002, etc.
  tipo: 'Tarifa' | 'Soporte' | 'Pertinencia' | 'Duplicidad' | 'Autorización' | 'Facturación' | 'Otro';
  descripcion: string;

  // Valores
  valorGlosado: number;
  porcentaje?: number; // Si la glosa es porcentual

  // Detalles
  observaciones?: string;
  justificacion?: string;

  // Estado
  estado: 'Pendiente' | 'Aceptada' | 'Rechazada' | 'En Discusión';
  respuestaIPS?: string;
  fechaRespuesta?: Date;

  // Auditoría
  generadaAutomaticamente: boolean;
  auditorId?: string;
  fechaGeneracion: Date;

  // Soporte
  requiereSoporte: boolean;
  soporteId?: Types.ObjectId; // Referencia a SoporteDocumental si existe

  createdAt: Date;
  updatedAt: Date;
}

const GlosaSchema = new Schema<IGlosa>(
  {
    procedimientoId: {
      type: Schema.Types.ObjectId,
      ref: 'Procedimiento',
      required: true,
      index: true,
    },
    atencionId: {
      type: Schema.Types.ObjectId,
      ref: 'Atencion',
      required: true,
      index: true,
    },
    facturaId: {
      type: Schema.Types.ObjectId,
      ref: 'Factura',
      required: true,
      index: true,
    },
    codigo: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    tipo: {
      type: String,
      required: true,
      enum: ['Tarifa', 'Soporte', 'Pertinencia', 'Duplicidad', 'Autorización', 'Facturación', 'Otro'],
      index: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
    valorGlosado: {
      type: Number,
      required: true,
      min: 0,
    },
    porcentaje: {
      type: Number,
      min: 0,
      max: 100,
    },
    observaciones: String,
    justificacion: String,
    estado: {
      type: String,
      required: true,
      enum: ['Pendiente', 'Aceptada', 'Rechazada', 'En Discusión'],
      default: 'Pendiente',
      index: true,
    },
    respuestaIPS: String,
    fechaRespuesta: Date,
    generadaAutomaticamente: {
      type: Boolean,
      default: false,
      index: true,
    },
    auditorId: {
      type: String,
      index: true,
    },
    fechaGeneracion: {
      type: Date,
      default: Date.now,
      index: true,
    },
    requiereSoporte: {
      type: Boolean,
      default: false,
    },
    soporteId: {
      type: Schema.Types.ObjectId,
      ref: 'SoporteDocumental',
    },
  },
  {
    timestamps: true,
    collection: 'glosas',
  }
);

// Índices compuestos
GlosaSchema.index({ facturaId: 1, tipo: 1, estado: 1 });
GlosaSchema.index({ tipo: 1, estado: 1, fechaGeneracion: -1 });
GlosaSchema.index({ generadaAutomaticamente: 1, estado: 1 });

export default mongoose.model<IGlosa>('Glosa', GlosaSchema);
