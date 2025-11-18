import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  type: 'order' | 'project' | 'billing' | 'message' | 'system' | 'deliverable' | 'task';
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: {
    orderId?: string;
    projectId?: string;
    invoiceId?: string;
    deliverableId?: string;
    taskId?: string;
    conversationId?: string;
    amount?: number;
    [key: string]: any;
  };
  created_at: Date;
  updated_at: Date;
  readAt?: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['order', 'project', 'billing', 'message', 'system', 'deliverable', 'task'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    actionUrl: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Índices compuestos para mejorar el rendimiento de consultas
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, created_at: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
