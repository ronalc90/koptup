import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  messageId: string;
  conversationId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  senderName: string;
  senderRole: 'admin' | 'client' | 'support' | 'project_manager';
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
      enum: ['admin', 'client', 'support', 'project_manager'],
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

// Generar messageId automáticamente
MessageSchema.pre('save', async function (next) {
  if (!this.messageId) {
    const count = await mongoose.model('Message').countDocuments();
    this.messageId = `MSG-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model<IMessage>('Message', MessageSchema);
