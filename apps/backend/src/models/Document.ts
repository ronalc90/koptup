import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IDocument extends MongooseDocument {
  user_id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  text_content?: string;
  created_at: Date;
}

const DocumentSchema = new Schema<IDocument>({
  user_id: { type: String, required: true, index: true },
  filename: { type: String, required: true },
  original_filename: { type: String, required: true },
  file_path: { type: String, required: true },
  file_size: { type: Number, required: true },
  mime_type: { type: String, required: true },
  text_content: { type: String },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model<IDocument>('Document', DocumentSchema);
