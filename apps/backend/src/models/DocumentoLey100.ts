import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentoLey100 extends Document {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  tipo: string; // normativa, protocolo, ley, reglamento, guía, manual, otro
  tags: string[];
  descripcion?: string;
  enabled: boolean; // Whether this document should be used in RAG queries
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
}

const DocumentoLey100Schema = new Schema<IDocumentoLey100>(
  {
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
    size: {
      type: Number,
      required: true,
    },
    tipo: {
      type: String,
      enum: ['normativa', 'protocolo', 'ley', 'reglamento', 'guía', 'manual', 'otro'],
      default: 'normativa',
    },
    tags: {
      type: [String],
      default: [],
    },
    descripcion: {
      type: String,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    userId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const DocumentoLey100 = mongoose.model<IDocumentoLey100>(
  'DocumentoLey100',
  DocumentoLey100Schema
);
