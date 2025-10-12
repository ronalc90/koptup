import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITask extends Document {
  project_id: Types.ObjectId;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: Types.ObjectId;
  created_by?: Types.ObjectId;
  estimated_hours?: number;
  actual_hours?: number;
  due_date?: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const TaskSchema: Schema = new Schema(
  {
    project_id: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'review', 'completed', 'blocked'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    assigned_to: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
    due_date: {
      type: Date,
    },
    completed_at: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes for faster queries
TaskSchema.index({ project_id: 1 });
TaskSchema.index({ assigned_to: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ due_date: 1 });

export default mongoose.model<ITask>('Task', TaskSchema);
