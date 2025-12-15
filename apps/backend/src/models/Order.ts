import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  orderId: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'shipped' | 'completed' | 'cancelled';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  userId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  conversationId?: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    price: number;
  }>;
  tracking?: string;
  carrier?: string;
  orderDate: Date;
  completedDate?: Date;
  approvedDate?: Date;
  rejectedDate?: Date;
  rejectionReason?: string;
  history: Array<{
    date: Date;
    status: string;
    description: string;
    updatedBy?: mongoose.Types.ObjectId;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    orderId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'shipped', 'completed', 'cancelled'],
      default: 'pending',
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    items: [
      {
        name: { type: String, required: true },
        description: { type: String },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    tracking: {
      type: String,
    },
    carrier: {
      type: String,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    completedDate: {
      type: Date,
    },
    approvedDate: {
      type: Date,
    },
    rejectedDate: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    history: [
      {
        date: { type: Date, default: Date.now },
        status: { type: String, required: true },
        description: { type: String, required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Generar orderId automáticamente
OrderSchema.pre('save', async function (next) {
  if (!this.orderId) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderId = `ORD-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export default mongoose.model<IOrder>('Order', OrderSchema);
