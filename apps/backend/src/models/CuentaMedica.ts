import mongoose, { Schema, Document } from 'mongoose';

export interface IArchivoSubido {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  uploadedAt: Date;
  processed: boolean;
  enabled: boolean; // Whether this file should be included in processing
  extractedDataCached?: any; // Cache for OpenAI extraction
}

export interface ICuentaMedica extends Document {
  nombre: string;
  numeroCuenta?: string;
  archivos: IArchivoSubido[];
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  userId?: string; // Optional: link to user who created it
}

const ArchivoSubidoSchema = new Schema<IArchivoSubido>({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  path: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedAt: { type: Date, default: Date.now },
  processed: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },
  extractedDataCached: { type: Schema.Types.Mixed },
});

const CuentaMedicaSchema = new Schema<ICuentaMedica>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    numeroCuenta: {
      type: String,
      required: false,
    },
    archivos: [ArchivoSubidoSchema],
    metadata: {
      type: Schema.Types.Mixed,
      required: false,
    },
    userId: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const CuentaMedica = mongoose.model<ICuentaMedica>(
  'CuentaMedica',
  CuentaMedicaSchema
);
