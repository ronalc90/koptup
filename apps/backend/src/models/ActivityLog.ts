import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IActivityLog extends Document {
  project_id: Types.ObjectId;
  user_id?: Types.ObjectId;
  action: string;
  entity_type?: string;
  entity_id?: Types.ObjectId;
  details?: string;
  created_at: Date;
}

const ActivityLogSchema: Schema = new Schema(
  {
    project_id: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    entity_type: {
      type: String,
      trim: true,
    },
    entity_id: {
      type: Schema.Types.ObjectId,
    },
    details: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

// Indexes for faster queries
ActivityLogSchema.index({ project_id: 1, created_at: -1 });
ActivityLogSchema.index({ user_id: 1 });

export default mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
