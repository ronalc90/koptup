import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  notificationId: string;
  type: 'order' | 'project' | 'billing' | 'message' | 'system';
  title: string;
  message: string;
  userId: mongoose.Types.ObjectId;
  isRead: boolean;
  actionUrl?: string;
  metadata?: {
    orderId?: string;
    projectId?: string;
    invoiceId?: string;
    amount?: number;
  };
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    notificationId: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['order', 'project', 'billing', 'message', 'system'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    actionUrl: {
      type: String,
    },
    metadata: {
      orderId: { type: String },
      projectId: { type: String },
      invoiceId: { type: String },
      amount: { type: Number },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para búsquedas eficientes
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

// Generar notificationId automáticamente
NotificationSchema.pre('save', async function (next) {
  if (!this.notificationId) {
    const count = await mongoose.model('Notification').countDocuments();
    this.notificationId = `NOTIF-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model<INotification>('Notification', NotificationSchema);
