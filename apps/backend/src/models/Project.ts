import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description?: string;
  client_id?: Types.ObjectId;
  manager_id?: Types.ObjectId;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  budget?: number;
  start_date?: Date;
  end_date?: Date;
  estimated_hours?: number;
  actual_hours?: number;
  progress: number;
  created_at: Date;
  updated_at: Date;
}

const ProjectSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    client_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    manager_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
      default: 'planning',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    budget: {
      type: Number,
      min: 0,
    },
    start_date: {
      type: Date,
    },
    end_date: {
      type: Date,
    },
    estimated_hours: {
      type: Number,
      min: 0,
    },
    actual_hours: {
      type: Number,
      default: 0,
      min: 0,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes for faster queries
ProjectSchema.index({ client_id: 1 });
ProjectSchema.index({ manager_id: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ updated_at: -1 });

export default mongoose.model<IProject>('Project', ProjectSchema);
