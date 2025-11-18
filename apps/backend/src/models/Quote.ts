import mongoose, { Schema, Document } from 'mongoose';

export interface IQuote extends Document {
  name: string;
  email: string;
  service: string;
  description: string;
  status: 'pending' | 'contacted' | 'completed';
  created_at: Date;
}

const QuoteSchema = new Schema<IQuote>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  service: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['pending', 'contacted', 'completed'], default: 'pending' },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model<IQuote>('Quote', QuoteSchema);
