import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IDocumentoConocimientoConfig extends MongooseDocument {
  documento_id: string; // ID del documento (cups, cie10, soat, etc.)
  activo: boolean; // Si el documento está activo para auditorías
  updated_at: Date;
  created_at: Date;
}

const DocumentoConocimientoConfigSchema = new Schema<IDocumentoConocimientoConfig>({
  documento_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  activo: {
    type: Boolean,
    required: true,
    default: true
  },
  updated_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },
});

// Middleware para actualizar updated_at
DocumentoConocimientoConfigSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export default mongoose.model<IDocumentoConocimientoConfig>(
  'DocumentoConocimientoConfig',
  DocumentoConocimientoConfigSchema
);
