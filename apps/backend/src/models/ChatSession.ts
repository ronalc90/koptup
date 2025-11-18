import mongoose, { Schema, Document } from 'mongoose';

export interface IChatSession extends Document {
  session_token: string;
  is_anonymous: boolean;
  expires_at: Date;
  created_at: Date;
}

const ChatSessionSchema = new Schema<IChatSession>({
  session_token: { type: String, required: true, unique: true },
  is_anonymous: { type: Boolean, default: true },
  expires_at: { type: Date, required: true },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
