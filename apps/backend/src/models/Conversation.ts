import mongoose, { Schema, Document } from 'mongoose';
import { nextSequentialId } from '../utils/sequence';

export interface IConversation extends Document {
  conversationId: string;
  title: string;
  projectId?: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  participants: Array<{
    userId: mongoose.Types.ObjectId;
    role: 'admin' | 'client' | 'support';
    name: string;
    email: string;
    avatar?: string;
    joinedAt: Date;
  }>;
  lastMessage?: {
    text: string;
    sender: mongoose.Types.ObjectId;
    senderName: string;
    timestamp: Date;
  };
  unreadCount: Map<string, number>; // userId -> count
  status: 'active' | 'archived' | 'closed';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema: Schema = new Schema(
  {
    conversationId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    participants: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: {
          type: String,
          enum: ['admin', 'client', 'support'],
          required: true,
        },
        name: { type: String, required: true },
        email: { type: String, required: true },
        avatar: { type: String },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    lastMessage: {
      text: { type: String },
      sender: { type: Schema.Types.ObjectId, ref: 'User' },
      senderName: { type: String },
      timestamp: { type: Date },
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'closed'],
      default: 'active',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para búsquedas por participante
ConversationSchema.index({ 'participants.userId': 1, status: 1 });

// Identificador legible (CONV-0001): se asigna ANTES de validar con un
// contador atómico (utils/sequence.ts).
ConversationSchema.pre('validate', async function () {
  if (!this.conversationId) {
    this.conversationId = await nextSequentialId({ model: 'Conversation', field: 'conversationId', key: 'conversation', prefix: 'CONV-', pad: 4 });
  }
});

export default mongoose.model<IConversation>('Conversation', ConversationSchema);
