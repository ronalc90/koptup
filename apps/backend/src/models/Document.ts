import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IDocument extends MongooseDocument {
  user_id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  text_content?: string;

  // Organización
  folder?: string;
  is_favorite: boolean;
  is_deleted: boolean;
  deleted_at?: Date;

  // Metadatos de IA
  tags: string[];
  ai_summary?: string;
  ai_keywords?: string[];
  ai_entities?: string[];

  // Búsqueda semántica
  embedding?: number[];

  // Auditoría
  created_at: Date;
  updated_at: Date;
  last_accessed_at?: Date;
}

const DocumentSchema = new Schema<IDocument>({
  user_id: { type: String, required: true, index: true },
  filename: { type: String, required: true },
  original_filename: { type: String, required: true },
  file_path: { type: String, required: true },
  file_size: { type: Number, required: true },
  mime_type: { type: String, required: true },
  text_content: { type: String },

  // Organización
  folder: { type: String, default: 'General', index: true },
  is_favorite: { type: Boolean, default: false, index: true },
  is_deleted: { type: Boolean, default: false, index: true },
  deleted_at: { type: Date },

  // Metadatos de IA
  tags: { type: [String], default: [], index: true },
  ai_summary: { type: String },
  ai_keywords: { type: [String], default: [] },
  ai_entities: { type: [String], default: [] },

  // Búsqueda semántica
  embedding: { type: [Number] },

  // Auditoría
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  last_accessed_at: { type: Date },
});

// Índices compuestos para búsquedas eficientes
DocumentSchema.index({ user_id: 1, is_deleted: 1, created_at: -1 });
DocumentSchema.index({ user_id: 1, folder: 1, is_deleted: 1 });
DocumentSchema.index({ user_id: 1, is_favorite: 1, is_deleted: 1 });
DocumentSchema.index({ tags: 1, user_id: 1 });

// Middleware para actualizar updated_at
DocumentSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export default mongoose.model<IDocument>('Document', DocumentSchema);
