import mongoose, { Schema, Document } from 'mongoose';
import { nextSequentialId } from '../utils/sequence';

export interface IDeliverable extends Document {
  deliverableId: string;
  projectId: mongoose.Types.ObjectId;
  /** Cliente dueño del proyecto (lo ve y lo aprueba en su portal). Nunca quien lo sube. */
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: 'design' | 'code' | 'documentation' | 'prototype' | 'other';
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  uploadDate: Date;
  approvedDate?: Date;
  rejectedDate?: Date;
  /**
   * `file`: archivo subido al servidor (se descarga con sesión en
   * GET /api/deliverables/:id/download); `link`: enlace externo (https) que
   * el equipo registra (Drive, repositorio, sitio publicado…).
   */
  storage?: 'file' | 'link';
  /** Ruta interna (`/uploads/deliverables/<archivo>`) o el enlace https. */
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
    storage: {
      type: String,
      enum: ['file', 'link'],
      default: 'file',
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

// Identificador legible (DEL-0001): se asigna ANTES de validar con un
// contador atómico (utils/sequence.ts).
DeliverableSchema.pre('validate', async function () {
  if (!this.deliverableId) {
    this.deliverableId = await nextSequentialId({ model: 'Deliverable', field: 'deliverableId', key: 'deliverable', prefix: 'DEL-', pad: 4 });
  }
});

export default mongoose.model<IDeliverable>('Deliverable', DeliverableSchema);
