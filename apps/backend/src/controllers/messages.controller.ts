import { Response } from 'express';
import { AuthRequest } from '../types';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import User from '../models/User';
import mongoose from 'mongoose';

// Obtener todas las conversaciones del usuario
export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { unreadOnly } = req.query;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    // Buscar conversaciones donde el usuario es participante
    const query: any = {
      'participants.userId': userId,
      status: { \$ne: 'closed' },
    };

    const conversations = await Conversation.find(query)
      .populate('projectId', 'name')
      .populate('orderId', 'name orderId')
      .sort({ updatedAt: -1 })
      .lean();

    // Formatear conversaciones
    const formattedConversations = conversations.map((conv: any) => {
      const userUnreadCount = conv.unreadCount ? conv.unreadCount.get(userId.toString()) || 0 : 0;
      
      return {
        id: conv.conversationId,
        title: conv.title,
        projectId: conv.projectId?.name || null,
        lastMessage: conv.lastMessage?.text || '',
        lastMessageTime: conv.lastMessage?.timestamp || conv.updatedAt,
        unreadCount: userUnreadCount,
        participants: conv.participants.map((p: any) => p.name),
        status: conv.status,
      };
    });

    // Filtrar solo conversaciones con mensajes no leídos si se solicita
    const filtered = unreadOnly === 'true'
      ? formattedConversations.filter(c => c.unreadCount > 0)
      : formattedConversations;

    res.json({ success: true, data: filtered });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener conversaciones' });
  }
};

// Obtener conversación por ID con sus mensajes
export const getConversationById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    const conversation = await Conversation.findOne({ conversationId: id })
      .populate('projectId', 'name description')
      .populate('participants.userId', 'name email')
      .lean();

    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversación no encontrada' });
      return;
    }

    // Verificar que el usuario es participante
    const isParticipant = conversation.participants.some(
      (p: any) => p.userId._id.toString() === userId.toString()
    );

    if (!isParticipant) {
      res.status(403).json({ success: false, message: 'No tienes acceso a esta conversación' });
      return;
    }

    // Obtener mensajes de la conversación
    const messages = await Message.find({ conversationId: conversation._id })
      .populate('sender', 'name email')
      .sort({ createdAt: 1 })
      .lean();

    const formattedMessages = messages.map((msg: any) => ({
      id: msg.messageId,
      senderId: msg.sender._id,
      senderName: msg.senderName,
      senderRole: msg.senderRole,
      content: msg.content,
      type: msg.type,
      attachment: msg.attachment,
      timestamp: msg.createdAt,
      isOwnMessage: msg.sender._id.toString() === userId.toString(),
      status: msg.readBy.some((r: any) => r.userId.toString() === userId.toString()) ? 'read' : 'sent',
    }));

    res.json({
      success: true,
      data: {
        conversation,
        messages: formattedMessages,
      },
    });
  } catch (error) {
    console.error('Get conversation by id error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener conversación' });
  }
};

// Enviar mensaje
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = req.user;
    const { conversationId, content, type, attachment } = req.body;

    if (!userId || !user) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    if (!conversationId || !content) {
      res.status(400).json({ success: false, message: 'ConversationId y contenido son requeridos' });
      return;
    }

    // Buscar conversación
    const conversation = await Conversation.findOne({ conversationId });

    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversación no encontrada' });
      return;
    }

    // Verificar que el usuario es participante
    const participant = conversation.participants.find(
      (p: any) => p.userId.toString() === userId.toString()
    );

    if (!participant) {
      res.status(403).json({ success: false, message: 'No eres participante de esta conversación' });
      return;
    }

    // Crear mensaje
    const newMessage = new Message({
      conversationId: conversation._id,
      sender: userId,
      senderName: user.name || user.email,
      senderRole: participant.role,
      content,
      type: type || 'text',
      attachment,
      readBy: [{
        userId: new mongoose.Types.ObjectId(userId),
        readAt: new Date(),
      }],
    });

    await newMessage.save();

    // Actualizar conversación
    conversation.lastMessage = {
      text: content,
      sender: new mongoose.Types.ObjectId(userId),
      senderName: user.name || user.email,
      timestamp: new Date(),
    };

    // Incrementar contador de no leídos para otros participantes
    conversation.participants.forEach((p: any) => {
      if (p.userId.toString() !== userId.toString()) {
        const currentCount = conversation.unreadCount.get(p.userId.toString()) || 0;
        conversation.unreadCount.set(p.userId.toString(), currentCount + 1);
      }
    });

    await conversation.save();

    res.status(201).json({
      success: true,
      data: {
        id: newMessage.messageId,
        content: newMessage.content,
        timestamp: newMessage.createdAt,
      },
      message: 'Mensaje enviado exitosamente',
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Error al enviar mensaje' });
  }
};

// Marcar conversación como leída
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    const conversation = await Conversation.findOne({ conversationId: id });

    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversación no encontrada' });
      return;
    }

    // Resetear contador de no leídos
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();

    // Marcar mensajes como leídos
    await Message.updateMany(
      {
        conversationId: conversation._id,
        'readBy.userId': { \$ne: userId },
      },
      {
        \$push: {
          readBy: {
            userId: new mongoose.Types.ObjectId(userId),
            readAt: new Date(),
          },
        },
      }
    );

    res.json({ success: true, message: 'Conversación marcada como leída' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: 'Error al marcar como leída' });
  }
};

// Crear nueva conversación (admin only)
export const createConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = req.user;
    const { title, projectId, orderId, clientId } = req.body;

    if (!userId || !user) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    // Verificar que es admin
    if (user.role !== 'admin' && user.role !== 'project_manager') {
      res.status(403).json({ success: false, message: 'No tienes permisos para crear conversaciones' });
      return;
    }

    if (!title || !clientId) {
      res.status(400).json({ success: false, message: 'Título y clientId son requeridos' });
      return;
    }

    // Buscar cliente
    const client = await User.findById(clientId);
    if (!client) {
      res.status(404).json({ success: false, message: 'Cliente no encontrado' });
      return;
    }

    // Crear conversación
    const newConversation = new Conversation({
      title,
      projectId: projectId || null,
      orderId: orderId || null,
      participants: [
        {
          userId: new mongoose.Types.ObjectId(userId),
          role: user.role === 'admin' ? 'admin' : 'project_manager',
          name: user.name || user.email,
          email: user.email,
        },
        {
          userId: client._id,
          role: 'client',
          name: client.name || client.email,
          email: client.email,
        },
      ],
      status: 'active',
      createdBy: userId,
      unreadCount: new Map(),
    });

    await newConversation.save();

    res.status(201).json({
      success: true,
      data: {
        id: newConversation.conversationId,
        title: newConversation.title,
      },
      message: 'Conversación creada exitosamente',
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ success: false, message: 'Error al crear conversación' });
  }
};
