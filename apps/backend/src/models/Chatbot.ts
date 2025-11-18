import mongoose, { Schema, Document } from 'mongoose';

export interface IChatbotDocument {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  content?: string; // Extracted text content
  uploadedAt: Date;
}

export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IChatbot extends Document {
  sessionId: string;
  config: {
    title: string;
    greeting: string;
    placeholder: string;
    textColor: string;
    headerColor: string;
    backgroundColor: string;
    icon: string;
  };
  documents: IChatbotDocument[];
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatbotDocumentSchema = new Schema<IChatbotDocument>({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  path: { type: String, required: true },
  size: { type: Number, required: true },
  content: { type: String },
  uploadedAt: { type: Date, default: Date.now },
});

const ChatMessageSchema = new Schema<IChatMessage>({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const ChatbotSchema = new Schema<IChatbot>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    config: {
      title: { type: String, default: 'Asistente Virtual' },
      greeting: { type: String, default: '¡Hola! 👋 Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?' },
      placeholder: { type: String, default: 'Escribe tu mensaje aquí...' },
      textColor: { type: String, default: '#1F2937' },
      headerColor: { type: String, default: '#4F46E5' },
      backgroundColor: { type: String, default: '#FFFFFF' },
      icon: { type: String, default: 'FaComments' },
    },
    documents: [ChatbotDocumentSchema],
    messages: [ChatMessageSchema],
  },
  {
    timestamps: true,
  }
);

export const Chatbot = mongoose.model<IChatbot>('Chatbot', ChatbotSchema);
