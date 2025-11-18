import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  session_id: { type: String, required: true, index: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
