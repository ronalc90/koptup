import mongoose, { Schema, Document } from 'mongoose';

export interface IDeliverable extends Document {
  deliverableId: string;
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: 'design' | 'code' | 'documentation' | 'prototype' | 'other';
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  uploadDate: Date;
  approvedDate?: Date;
  rejectedDate?: Date;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType?: string;
  version: number;
  uploadedBy: mongoose.Types.ObjectId;
  reviewedBy?: mongoose.Types.ObjectId;
  comments?: string;
  metadata?: Map<string, any>;
  history: Array<{
    date: Date;
    action: string;
    user: mongoose.Types.ObjectId;
    userName: string;
    description: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const DeliverableSchema: Schema = new Schema(
  {
    deliverableId: {
      type: String,
      required: true,
      unique: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['design', 'code', 'documentation', 'prototype', 'other'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'approved', 'rejected'],
      default: 'pending',
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    approvedDate: {
      type: Date,
    },
    rejectedDate: {
      type: Date,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    fileType: {
      type: String,
    },
    version: {
      type: Number,
      default: 1,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    comments: {
      type: String,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    history: [
      {
        date: { type: Date, default: Date.now },
        action: { type: String, required: true },
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        userName: { type: String, required: true },
        description: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Generar deliverableId automáticamente
DeliverableSchema.pre('save', async function (next) {
  if (!this.deliverableId) {
    const count = await mongoose.model('Deliverable').countDocuments();
    this.deliverableId = `DEL-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export default mongoose.model<IDeliverable>('Deliverable', DeliverableSchema);
