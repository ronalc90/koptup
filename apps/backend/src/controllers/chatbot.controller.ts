/**
 * Controlador para el Chatbot Demo con RAG
 */

import { Request, Response } from 'express';
import { chatbotService } from '../services/chatbot.service';
import { logger } from '../utils/logger';

/**
 * POST /api/chatbot/session
 * Crea o recupera una sesión de chatbot
 */
export async function createOrGetSession(req: Request, res: Response) {
  try {
    const { sessionId, config } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un sessionId',
      });
    }

    const chatbot = await chatbotService.getOrCreateSession(sessionId, config);

    return res.json({
      success: true,
      data: {
        sessionId: chatbot.sessionId,
        config: chatbot.config,
        documentsCount: chatbot.documents.length,
        messagesCount: chatbot.messages.length,
      },
    });
  } catch (error: any) {
    logger.error('Error creando/obteniendo sesión de chatbot:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al crear sesión',
    });
  }
}

/**
 * POST /api/chatbot/upload
 * Sube documentos al chatbot
 */
export async function uploadDocuments(req: Request, res: Response) {
  try {
    const { sessionId } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un sessionId',
      });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No se recibieron archivos',
      });
    }

    const fileData = files.map(file => ({
      path: file.path,
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
    }));

    const result = await chatbotService.uploadDocuments(sessionId, fileData);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Error subiendo documentos al chatbot:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error subiendo documentos',
    });
  }
}

/**
 * POST /api/chatbot/message
 * Envía un mensaje al chatbot y recibe respuesta
 */
export async function sendMessage(req: Request, res: Response) {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un sessionId',
      });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'El mensaje no puede estar vacío',
      });
    }

    const response = await chatbotService.sendMessage(sessionId, message);

    return res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    logger.error('Error procesando mensaje del chatbot:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error procesando mensaje',
    });
  }
}

/**
 * GET /api/chatbot/info/:sessionId
 * Obtiene información del chatbot
 */
export async function getChatbotInfo(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un sessionId',
      });
    }

    const info = await chatbotService.getChatbotInfo(sessionId);

    return res.json({
      success: true,
      data: info,
    });
  } catch (error: any) {
    logger.error('Error obteniendo información del chatbot:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error obteniendo información',
    });
  }
}

/**
 * PUT /api/chatbot/config
 * Actualiza la configuración del chatbot
 */
export async function updateConfig(req: Request, res: Response) {
  try {
    const { sessionId, config } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un sessionId',
      });
    }

    await chatbotService.updateConfig(sessionId, config);

    return res.json({
      success: true,
      message: 'Configuración actualizada exitosamente',
    });
  } catch (error: any) {
    logger.error('Error actualizando configuración del chatbot:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error actualizando configuración',
    });
  }
}

/**
 * DELETE /api/chatbot/messages/:sessionId
 * Elimina todos los mensajes de una sesión
 */
export async function clearMessages(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un sessionId',
      });
    }

    await chatbotService.clearMessages(sessionId);

    return res.json({
      success: true,
      message: 'Mensajes eliminados exitosamente',
    });
  } catch (error: any) {
    logger.error('Error eliminando mensajes del chatbot:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error eliminando mensajes',
    });
  }
}

/**
 * DELETE /api/chatbot/documents/:sessionId
 * Elimina todos los documentos de una sesión
 */
export async function clearDocuments(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un sessionId',
      });
    }

    await chatbotService.clearDocuments(sessionId);

    return res.json({
      success: true,
      message: 'Documentos eliminados exitosamente',
    });
  } catch (error: any) {
    logger.error('Error eliminando documentos del chatbot:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error eliminando documentos',
    });
  }
}
