import mongoose, { Schema, Document } from 'mongoose';

export interface ICUPS extends Document {
  codigo: string; // Código CUPS (ej: 890201)
  descripcion: string; // Descripción del procedimiento
  categoria: string; // Categoría (Consulta, Procedimiento, Cirugía, etc.)
  especialidad?: string; // Especialidad médica
  tarifaSOAT?: number; // Tarifa SOAT
  tarifaISS2001?: number; // Tarifa ISS 2001
  tarifaISS2004?: number; // Tarifa ISS 2004
  uvr?: number; // Unidad de Valor Relativo
  activo: boolean;

  // Embeddings para búsqueda semántica
  embedding?: number[]; // Vector de 1536 dimensiones (OpenAI text-embedding-3-small)
  embeddingGenerado?: Date; // Fecha de generación del embedding

  metadata?: {
    requiereAutorizacion?: boolean;
    duracionPromedio?: number; // minutos
    nivelComplejidad?: 'bajo' | 'medio' | 'alto' | 'muy_alto';
    requiereQuirofano?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CUPSSchema = new Schema<ICUPS>(
  {
    codigo: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    descripcion: {
      type: String,
      required: true,
      index: 'text', // Para búsqueda de texto completo
    },
    categoria: {
      type: String,
      required: true,
      enum: [
        'Consulta',
        'Procedimiento',
        'Cirugía',
        'Ayudas Diagnósticas',
        'Laboratorio',
        'Imagenología',
        'Terapia',
        'Otro',
      ],
      index: true,
    },
    especialidad: {
      type: String,
      index: true,
    },
    tarifaSOAT: {
      type: Number,
      min: 0,
    },
    tarifaISS2001: {
      type: Number,
      min: 0,
    },
    tarifaISS2004: {
      type: Number,
      min: 0,
    },
    uvr: {
      type: Number,
      min: 0,
    },
    activo: {
      type: Boolean,
      default: true,
      index: true,
    },
    embedding: {
      type: [Number],
      select: false, // No incluir por defecto en consultas
    },
    embeddingGenerado: {
      type: Date,
    },
    metadata: {
      requiereAutorizacion: Boolean,
      duracionPromedio: Number,
      nivelComplejidad: {
        type: String,
        enum: ['bajo', 'medio', 'alto', 'muy_alto'],
      },
      requiereQuirofano: Boolean,
    },
  },
  {
    timestamps: true,
    collection: 'cups',
  }
);

// Índices compuestos para búsquedas comunes
CUPSSchema.index({ categoria: 1, activo: 1 });
CUPSSchema.index({ especialidad: 1, activo: 1 });

export default mongoose.model<ICUPS>('CUPS', CUPSSchema);
