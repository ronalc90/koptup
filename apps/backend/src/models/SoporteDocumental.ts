import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISoporteDocumental extends Document {
  facturaId?: Types.ObjectId;
  atencionId?: Types.ObjectId;
  procedimientoId?: Types.ObjectId;

  // Tipo de soporte
  tipo: 'Autorización' | 'Orden Médica' | 'Historia Clínica' | 'Fórmula' | 'Consentimiento' | 'Paraclínico' | 'Otro';
  descripcion?: string;

  // Archivo
  filename: string;
  originalName: string;
  path: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;

  // Validación
  validado: boolean;
  observaciones?: string;
  auditorId?: string;
  fechaValidacion?: Date;

  // Extracción de datos (OCR/OpenAI)
  datosExtraidos?: any;
  procesado: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const SoporteDocumentalSchema = new Schema<ISoporteDocumental>(
  {
    facturaId: {
      type: Schema.Types.ObjectId,
      ref: 'Factura',
      index: true,
    },
    atencionId: {
      type: Schema.Types.ObjectId,
      ref: 'Atencion',
      index: true,
    },
    procedimientoId: {
      type: Schema.Types.ObjectId,
      ref: 'Procedimiento',
      index: true,
    },
    tipo: {
      type: String,
      required: true,
      enum: ['Autorización', 'Orden Médica', 'Historia Clínica', 'Fórmula', 'Consentimiento', 'Paraclínico', 'Otro'],
      index: true,
    },
    descripcion: String,
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    validado: {
      type: Boolean,
      default: false,
      index: true,
    },
    observaciones: String,
    auditorId: {
      type: String,
      index: true,
    },
    fechaValidacion: Date,
    datosExtraidos: Schema.Types.Mixed,
    procesado: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'soportes_documentales',
  }
);

// Índices compuestos
SoporteDocumentalSchema.index({ facturaId: 1, tipo: 1 });
SoporteDocumentalSchema.index({ atencionId: 1, tipo: 1 });
SoporteDocumentalSchema.index({ validado: 1, tipo: 1 });

export default mongoose.model<ISoporteDocumental>('SoporteDocumental', SoporteDocumentalSchema);
