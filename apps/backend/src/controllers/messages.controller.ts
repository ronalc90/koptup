import { Response } from 'express';
import { AuthRequest } from '../types';

// Controlador para mensajes y conversaciones
export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { unreadOnly } = req.query;

    // Mock data - En producción, consultar base de datos
    const conversations = [
      {
        id: 'CONV-001',
        projectId: 'PRJ-001',
        projectName: 'Sistema de gestión de inventario',
        participant: {
          id: 'USR-002',
          name: 'María García',
          email: 'maria.garcia@example.com',
          role: 'project_manager',
          avatar: 'https://i.pravatar.cc/150?img=1',
        },
        lastMessage: {
          id: 'MSG-010',
          text: '¿Cuándo podemos revisar el último entregable?',
          sender: 'María García',
          timestamp: '2025-10-11T14:30:00Z',
          read: false,
        },
        unreadCount: 3,
        userId,
        createdAt: '2025-10-01T10:00:00Z',
        updatedAt: '2025-10-11T14:30:00Z',
      },
      {
        id: 'CONV-002',
        projectId: 'PRJ-002',
        projectName: 'Aplicación móvil iOS/Android',
        participant: {
          id: 'USR-003',
          name: 'Carlos López',
          email: 'carlos.lopez@example.com',
          role: 'client',
          avatar: 'https://i.pravatar.cc/150?img=2',
        },
        lastMessage: {
          id: 'MSG-025',
          text: 'Perfecto, quedamos así entonces',
          sender: userId,
          timestamp: '2025-10-10T16:45:00Z',
          read: true,
        },
        unreadCount: 0,
        userId,
        createdAt: '2025-09-28T09:00:00Z',
        updatedAt: '2025-10-10T16:45:00Z',
      },
      {
        id: 'CONV-003',
        projectId: 'PRJ-003',
        projectName: 'Website corporativo',
        participant: {
          id: 'USR-004',
          name: 'Ana Martínez',
          email: 'ana.martinez@example.com',
          role: 'client',
          avatar: 'https://i.pravatar.cc/150?img=3',
        },
        lastMessage: {
          id: 'MSG-018',
          text: 'Necesito hacer algunos cambios en el diseño',
          sender: 'Ana Martínez',
          timestamp: '2025-10-09T11:20:00Z',
          read: false,
        },
        unreadCount: 1,
        userId,
        createdAt: '2025-09-20T14:30:00Z',
        updatedAt: '2025-10-09T11:20:00Z',
      },
      {
        id: 'CONV-004',
        projectId: 'PRJ-001',
        projectName: 'Sistema de gestión de inventario',
        participant: {
          id: 'USR-005',
          name: 'Support Team',
          email: 'support@koptup.com',
          role: 'support',
          avatar: 'https://i.pravatar.cc/150?img=4',
        },
        lastMessage: {
          id: 'MSG-032',
          text: 'Tu consulta ha sido resuelta',
          sender: 'Support Team',
          timestamp: '2025-10-08T09:15:00Z',
          read: true,
        },
        unreadCount: 0,
        userId,
        createdAt: '2025-10-07T08:00:00Z',
        updatedAt: '2025-10-08T09:15:00Z',
      },
    ];

    // Filtrar solo no leídas si se solicita
    const filteredConversations = unreadOnly === 'true'
      ? conversations.filter(conv => conv.unreadCount > 0)
      : conversations;

    res.json({
      success: true,
      data: filteredConversations,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener conversaciones',
    });
  }
};

export const getConversationById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Mock data
    const conversation = {
      id,
      projectId: 'PRJ-001',
      projectName: 'Sistema de gestión de inventario',
      participant: {
        id: 'USR-002',
        name: 'María García',
        email: 'maria.garcia@example.com',
        role: 'project_manager',
        avatar: 'https://i.pravatar.cc/150?img=1',
        status: 'online',
      },
      messages: [
        {
          id: 'MSG-001',
          conversationId: id,
          text: 'Hola, ¿cómo va el proyecto?',
          sender: {
            id: 'USR-002',
            name: 'María García',
            isCurrentUser: false,
          },
          timestamp: '2025-10-11T10:00:00Z',
          read: true,
          type: 'text',
        },
        {
          id: 'MSG-002',
          conversationId: id,
          text: 'Hola María, todo va muy bien. Ya tenemos el 80% completado.',
          sender: {
            id: userId,
            name: 'Tú',
            isCurrentUser: true,
          },
          timestamp: '2025-10-11T10:05:00Z',
          read: true,
          type: 'text',
        },
        {
          id: 'MSG-003',
          conversationId: id,
          text: 'Excelente, ¿ya subiste el último entregable?',
          sender: {
            id: 'USR-002',
            name: 'María García',
            isCurrentUser: false,
          },
          timestamp: '2025-10-11T10:10:00Z',
          read: true,
          type: 'text',
        },
        {
          id: 'MSG-004',
          conversationId: id,
          text: 'Sí, lo subí esta mañana. Puedes revisarlo en la sección de entregables.',
          sender: {
            id: userId,
            name: 'Tú',
            isCurrentUser: true,
          },
          timestamp: '2025-10-11T10:15:00Z',
          read: true,
          type: 'text',
        },
        {
          id: 'MSG-005',
          conversationId: id,
          text: 'Perfecto, lo reviso ahora mismo',
          sender: {
            id: 'USR-002',
            name: 'María García',
            isCurrentUser: false,
          },
          timestamp: '2025-10-11T10:20:00Z',
          read: true,
          type: 'text',
        },
        {
          id: 'MSG-006',
          conversationId: id,
          text: 'design-mockup.fig',
          sender: {
            id: userId,
            name: 'Tú',
            isCurrentUser: true,
          },
          timestamp: '2025-10-11T11:00:00Z',
          read: true,
          type: 'file',
          attachment: {
            fileName: 'design-mockup.fig',
            fileSize: 15234567,
            fileUrl: 'https://example.com/files/design-mockup.fig',
            fileType: 'application/figma',
          },
        },
        {
          id: 'MSG-007',
          conversationId: id,
          text: 'Gracias por el archivo, lo voy a revisar',
          sender: {
            id: 'USR-002',
            name: 'María García',
            isCurrentUser: false,
          },
          timestamp: '2025-10-11T11:05:00Z',
          read: true,
          type: 'text',
        },
        {
          id: 'MSG-008',
          conversationId: id,
          text: 'Ya lo revisé, se ve muy bien. Solo tengo un par de comentarios menores.',
          sender: {
            id: 'USR-002',
            name: 'María García',
            isCurrentUser: false,
          },
          timestamp: '2025-10-11T13:30:00Z',
          read: false,
        },
        {
          id: 'MSG-009',
          conversationId: id,
          text: 'Los dejé en el sistema de revisión de entregables',
          sender: {
            id: 'USR-002',
            name: 'María García',
            isCurrentUser: false,
          },
          timestamp: '2025-10-11T13:35:00Z',
          read: false,
          type: 'text',
        },
        {
          id: 'MSG-010',
          conversationId: id,
          text: '¿Cuándo podemos revisar el último entregable?',
          sender: {
            id: 'USR-002',
            name: 'María García',
            isCurrentUser: false,
          },
          timestamp: '2025-10-11T14:30:00Z',
          read: false,
          type: 'text',
        },
      ],
      unreadCount: 3,
      userId,
      createdAt: '2025-10-01T10:00:00Z',
      updatedAt: '2025-10-11T14:30:00Z',
    };

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('Get conversation by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener conversación',
    });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { conversationId, text, type, attachment } = req.body;

    if (!conversationId || !text) {
      res.status(400).json({
        success: false,
        message: 'ConversationId y texto son requeridos',
      });
      return;
    }

    // Mock message creation
    const newMessage = {
      id: `MSG-${Date.now()}`,
      conversationId,
      text,
      sender: {
        id: userId,
        name: req.user?.email,
        isCurrentUser: true,
      },
      timestamp: new Date().toISOString(),
      read: false,
      type: type || 'text',
      attachment: attachment || null,
    };

    res.status(201).json({
      success: true,
      data: newMessage,
      message: 'Mensaje enviado exitosamente',
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar mensaje',
    });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Mock marking as read
    const result = {
      conversationId: id,
      unreadCount: 0,
      markedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: result,
      message: 'Conversación marcada como leída',
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar como leída',
    });
  }
};
