import mongoose, { Schema, Document } from 'mongoose';

export interface IDiagnostico extends Document {
  codigoCIE10: string; // Código CIE-10
  descripcion: string;
  categoria: string; // Capítulo CIE-10
  subcategoria?: string;
  tipoLesion?: string;
  gravedad?: 'leve' | 'moderada' | 'grave' | 'critica';
  cronico: boolean;
  requiereHospitalizacion: boolean;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DiagnosticoSchema = new Schema<IDiagnostico>(
  {
    codigoCIE10: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    descripcion: {
      type: String,
      required: true,
      index: 'text',
    },
    categoria: {
      type: String,
      required: true,
      index: true,
    },
    subcategoria: String,
    tipoLesion: String,
    gravedad: {
      type: String,
      enum: ['leve', 'moderada', 'grave', 'critica'],
    },
    cronico: {
      type: Boolean,
      default: false,
    },
    requiereHospitalizacion: {
      type: Boolean,
      default: false,
    },
    activo: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'diagnosticos',
  }
);

// Índices compuestos
DiagnosticoSchema.index({ categoria: 1, activo: 1 });

export default mongoose.model<IDiagnostico>('Diagnostico', DiagnosticoSchema);
