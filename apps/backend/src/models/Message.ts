import mongoose, { Schema, Document } from 'mongoose';
import { nextSequentialId } from '../utils/sequence';

export interface IMessage extends Document {
  messageId: string;
  conversationId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  senderName: string;
  senderRole: 'admin' | 'client' | 'support';
  content: string;
  type: 'text' | 'file' | 'system' | 'notification';
  attachment?: {
    fileName: string;
    fileSize: number;
    fileUrl: string;
    fileType: string;
  };
  readBy: Array<{
    userId: mongoose.Types.ObjectId;
    readAt: Date;
  }>;
  metadata?: Map<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    messageId: {
      type: String,
      required: true,
      unique: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['admin', 'client', 'support'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'file', 'system', 'notification'],
      default: 'text',
    },
    attachment: {
      fileName: { type: String },
      fileSize: { type: Number },
      fileUrl: { type: String },
      fileType: { type: String },
    },
    readBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        readAt: { type: Date, default: Date.now },
      },
    ],
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para búsquedas eficientes
MessageSchema.index({ conversationId: 1, createdAt: -1 });

// Identificador legible (MSG-000001): se asigna ANTES de validar con un
// contador atómico (utils/sequence.ts).
MessageSchema.pre('validate', async function () {
  if (!this.messageId) {
    this.messageId = await nextSequentialId({ model: 'Message', field: 'messageId', key: 'message', prefix: 'MSG-', pad: 6 });
  }
});

export default mongoose.model<IMessage>('Message', MessageSchema);
