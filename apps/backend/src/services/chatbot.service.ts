/**
 * Servicio de Chatbot con RAG (Retrieval-Augmented Generation)
 * Permite crear chatbots que responden basándose en documentos subidos
 */

import mongoose from 'mongoose';
import { getOpenAI } from './openai.service';
import { extractTextFromPDF } from './pdf.service';
import { getChatbotModel, IChatbot } from '../models/Chatbot';
import { logger } from '../utils/logger';
import fs from 'fs/promises';

export interface ChatbotConfig {
  title?: string;
  greeting?: string;
  placeholder?: string;
  textColor?: string;
  headerColor?: string;
  backgroundColor?: string;
  icon?: string;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
}

class ChatbotService {
  /**
   * Verifica que MongoDB esté conectado con reintentos
   */
  private async ensureConnection(): Promise<void> {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 segundo

    for (let i = 0; i < maxRetries; i++) {
      if (mongoose.connection.readyState === 1) {
        return; // Conectado
      }

      if (i < maxRetries - 1) {
        logger.warn(`MongoDB not ready (readyState: ${mongoose.connection.readyState}), retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    throw new Error('Database connection not ready. Please try again in a moment.');
  }

  /**
   * Crea o recupera una sesión de chatbot
   */
  async getOrCreateSession(sessionId: string, config?: ChatbotConfig): Promise<IChatbot> {
    try {
      await this.ensureConnection();

      const Chatbot = getChatbotModel();
      let chatbot = await Chatbot.findOne({ sessionId }).maxTimeMS(5000).exec();

      if (!chatbot) {
        chatbot = new Chatbot({
          sessionId,
          config: config || {},
          documents: [],
          messages: [],
        });
        await chatbot.save();
        logger.info(`Nueva sesión de chatbot creada: ${sessionId}`);
      } else if (config) {
        // Actualizar configuración si se proporciona
        chatbot.config = { ...chatbot.config, ...config };
        await chatbot.save();
      }

      return chatbot;
    } catch (error: any) {
      if (error.message && error.message.includes('buffering timed out')) {
        throw new Error('Database connection not ready. Please try again in a moment.');
      }
      throw error;
    }
  }

  /**
   * Procesa y guarda documentos subidos
   */
  async uploadDocuments(
    sessionId: string,
    files: Array<{ path: string; originalName: string; filename: string; size: number }>
  ): Promise<{ success: boolean; documentsCount: number }> {
    const chatbot = await this.getOrCreateSession(sessionId);

    for (const file of files) {
      try {
        // Extraer texto del documento
        let content = '';

        if (file.originalName.toLowerCase().endsWith('.pdf')) {
          const extracted = await extractTextFromPDF(file.path);
          content = extracted.text;
        } else if (
          file.originalName.toLowerCase().endsWith('.txt') ||
          file.originalName.toLowerCase().endsWith('.csv')
        ) {
          content = await fs.readFile(file.path, 'utf-8');
        }

        // Guardar documento con contenido extraído
        chatbot.documents.push({
          filename: file.filename,
          originalName: file.originalName,
          path: file.path,
          size: file.size,
          content,
          uploadedAt: new Date(),
        });

        logger.info(`Documento procesado: ${file.originalName} (${content.length} caracteres)`);
      } catch (error: any) {
        logger.error(`Error procesando documento ${file.originalName}:`, error);
      }
    }

    await chatbot.save();

    return {
      success: true,
      documentsCount: chatbot.documents.length,
    };
  }

  /**
   * Envía un mensaje al chatbot y obtiene respuesta usando RAG
   */
  async sendMessage(sessionId: string, userMessage: string): Promise<ChatResponse> {
    const chatbot = await this.getOrCreateSession(sessionId);
    const openai = getOpenAI();

    // Verificar temas restringidos ANTES de procesar
    const restrictedTopics = chatbot.config.restrictedTopics || [];
    if (restrictedTopics.length > 0) {
      const messageToCheck = userMessage.toLowerCase();
      const foundRestrictedTopic = restrictedTopics.find(topic =>
        messageToCheck.includes(topic.toLowerCase())
      );

      if (foundRestrictedTopic) {
        const restrictionMessage = `Lo siento, no puedo responder sobre temas relacionados con "${foundRestrictedTopic}". Este es un tema restringido en esta conversación. ¿Hay algo más en lo que pueda ayudarte?`;

        // Guardar mensaje del usuario
        chatbot.messages.push({
          role: 'user',
          content: userMessage,
          timestamp: new Date(),
        });

        // Guardar respuesta de restricción
        chatbot.messages.push({
          role: 'assistant',
          content: restrictionMessage,
          timestamp: new Date(),
        });

        await chatbot.save();

        return {
          message: restrictionMessage,
          sessionId,
        };
      }
    }

    // Guardar mensaje del usuario
    chatbot.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    });

    // Construir contexto desde los documentos
    const documentContext = chatbot.documents
      .filter(doc => doc.content && doc.content.length > 0)
      .map(doc => `--- Documento: ${doc.originalName} ---\n${doc.content.substring(0, 3000)}`)
      .join('\n\n');

    // Construir historial de conversación (últimos 5 mensajes)
    const conversationHistory = chatbot.messages
      .slice(-5)
      .map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

    try {
      // Construir restricciones para el prompt
      const restrictionsText = restrictedTopics.length > 0
        ? `\n\n⚠️ TEMAS RESTRINGIDOS (NO responder sobre estos temas):
${restrictedTopics.map(topic => `- ${topic}`).join('\n')}

Si el usuario pregunta sobre alguno de estos temas, indica amablemente que no puedes ayudar con eso.`
        : '';

      // Crear el prompt del sistema
      const systemPrompt = documentContext
        ? `Eres ${chatbot.config.title}, un asistente virtual inteligente y útil.

Tienes acceso a los siguientes documentos que el usuario ha subido:

${documentContext}

Instrucciones:
- Responde SIEMPRE en español de forma clara y concisa
- Usa la información de los documentos cuando sea relevante para responder
- Si la pregunta no está relacionada con los documentos, responde de forma general pero amigable
- Sé cortés, profesional y servicial
- Si no tienes información suficiente en los documentos, indica que no tienes esa información específica
- Menciona de qué documento obtuviste la información cuando sea apropiado${restrictionsText}`
        : `Eres ${chatbot.config.title}, un asistente virtual inteligente y útil.

El usuario aún no ha subido documentos, así que responde de forma general a sus preguntas.

Instrucciones:
- Responde SIEMPRE en español de forma clara y concisa
- Sé cortés, profesional y servicial
- Puedes sugerirle al usuario que suba documentos para que puedas ayudarle mejor con información específica${restrictionsText}`;

      // Llamar a OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const assistantMessage = completion.choices[0].message.content || 'Lo siento, no pude generar una respuesta.';

      // Guardar respuesta del asistente
      chatbot.messages.push({
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date(),
      });

      await chatbot.save();

      return {
        message: assistantMessage,
        sessionId,
      };
    } catch (error: any) {
      logger.error('Error generando respuesta del chatbot:', error);

      const errorMessage = 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.';

      chatbot.messages.push({
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
      });

      await chatbot.save();

      return {
        message: errorMessage,
        sessionId,
      };
    }
  }

  /**
   * Obtiene la configuración y estado actual del chatbot
   */
  async getChatbotInfo(sessionId: string): Promise<{
    config: any;
    documentsCount: number;
    messagesCount: number;
    messages: any[];
  }> {
    const chatbot = await this.getOrCreateSession(sessionId);

    return {
      config: chatbot.config,
      documentsCount: chatbot.documents.length,
      messagesCount: chatbot.messages.length,
      messages: chatbot.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      })),
    };
  }

  /**
   * Actualiza la configuración del chatbot
   */
  async updateConfig(sessionId: string, config: ChatbotConfig): Promise<{ success: boolean }> {
    const chatbot = await this.getOrCreateSession(sessionId, config);
    return { success: true };
  }

  /**
   * Elimina todos los mensajes de la sesión (reset del chat)
   */
  async clearMessages(sessionId: string): Promise<{ success: boolean }> {
    const Chatbot = getChatbotModel();
    const chatbot = await Chatbot.findOne({ sessionId }).exec();
    if (chatbot) {
      chatbot.messages = [];
      await chatbot.save();
    }
    return { success: true };
  }

  /**
   * Elimina todos los documentos de la sesión
   */
  async clearDocuments(sessionId: string): Promise<{ success: boolean }> {
    const Chatbot = getChatbotModel();
    const chatbot = await Chatbot.findOne({ sessionId }).exec();
    if (chatbot) {
      // Eliminar archivos físicos
      for (const doc of chatbot.documents) {
        try {
          await fs.unlink(doc.path);
        } catch (error) {
          logger.warn(`No se pudo eliminar archivo: ${doc.path}`);
        }
      }
      chatbot.documents = [];
      await chatbot.save();
    }
    return { success: true };
  }
}

export const chatbotService = new ChatbotService();
