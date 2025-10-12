import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProjectMember extends Document {
  project_id: Types.ObjectId;
  user_id: Types.ObjectId;
  role: string;
  assigned_at: Date;
}

const ProjectMemberSchema: Schema = new Schema(
  {
    project_id: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    assigned_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index to ensure uniqueness and faster queries
ProjectMemberSchema.index({ project_id: 1, user_id: 1 }, { unique: true });
ProjectMemberSchema.index({ project_id: 1 });
ProjectMemberSchema.index({ user_id: 1 });

export default mongoose.model<IProjectMember>('ProjectMember', ProjectMemberSchema);
