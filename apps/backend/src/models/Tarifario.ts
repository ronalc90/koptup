import mongoose, { Schema, Document } from 'mongoose';

export interface ITarifarioItem {
  codigoCUPS: string;
  valor: number;
  factorMultiplicador?: number; // Para cálculos especiales
  unidad?: string; // unidad, UVR, etc.
  observaciones?: string;
}

export interface ITarifario extends Document {
  nombre: string; // Ej: "ISS 2001", "SOAT 2024", "Contrato EPS Salud Total"
  tipo: 'ISS' | 'SOAT' | 'Contrato' | 'Personalizado';
  vigenciaInicio: Date;
  vigenciaFin?: Date;
  eps?: string; // Si es un contrato específico con una EPS
  items: ITarifarioItem[];
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TarifarioItemSchema = new Schema<ITarifarioItem>({
  codigoCUPS: { type: String, required: true, index: true },
  valor: { type: Number, required: true, min: 0 },
  factorMultiplicador: { type: Number, default: 1 },
  unidad: { type: String, default: 'COP' },
  observaciones: String,
});

const TarifarioSchema = new Schema<ITarifario>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    tipo: {
      type: String,
      required: true,
      enum: ['ISS', 'SOAT', 'Contrato', 'Personalizado'],
      index: true,
    },
    vigenciaInicio: {
      type: Date,
      required: true,
      index: true,
    },
    vigenciaFin: {
      type: Date,
      index: true,
    },
    eps: {
      type: String,
      index: true,
    },
    items: [TarifarioItemSchema],
    activo: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'tarifarios',
  }
);

// Índices compuestos
TarifarioSchema.index({ tipo: 1, activo: 1, vigenciaInicio: -1 });
TarifarioSchema.index({ eps: 1, activo: 1 });

export default mongoose.model<ITarifario>('Tarifario', TarifarioSchema);
