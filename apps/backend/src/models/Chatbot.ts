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
    fontFamily?: string;
    customIconUrl?: string;
    restrictedTopics?: string[];
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
      fontFamily: { type: String, default: 'Inter' },
      customIconUrl: { type: String },
      restrictedTopics: { type: [String], default: [] },
    },
    documents: [ChatbotDocumentSchema],
    messages: [ChatMessageSchema],
  },
  {
    timestamps: true,
  }
);

// Lazy model registration - solo se registra cuando se usa
let chatbotModel: mongoose.Model<IChatbot> | null = null;

export const getChatbotModel = (): mongoose.Model<IChatbot> => {
  if (!chatbotModel) {
    try {
      // Intentar obtener el modelo si ya existe
      chatbotModel = mongoose.model<IChatbot>('Chatbot');
    } catch {
      // Si no existe, crearlo
      chatbotModel = mongoose.model<IChatbot>('Chatbot', ChatbotSchema);
    }
  }
  return chatbotModel;
};

// Exportar para compatibilidad, pero usar getChatbotModel() en servicios
export const Chatbot = getChatbotModel();
