import { Response } from 'express';
import { AuthRequest } from '../types';
import Notification from '../models/Notification';
import { createNotification } from '../utils/notifications';

// Controlador para notificaciones
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { type, unreadOnly, limit } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
    }

    // Construir query
    const query: any = { userId };

    // Filtrar por tipo si se especifica
    if (type && type !== 'all') {
      query.type = type;
    }

    // Filtrar solo no leídas si se solicita
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    // Obtener notificaciones de la base de datos
    let notificationsQuery = Notification.find(query)
      .sort({ created_at: -1 }); // Ordenar por más reciente primero

    // Limitar cantidad si se especifica
    if (limit) {
      const limitNum = parseInt(limit as string, 10);
      notificationsQuery = notificationsQuery.limit(limitNum);
    }

    const notifications = await notificationsQuery;

    // Mapear a formato esperado por el frontend
    const formattedNotifications = notifications.map(notif => ({
      id: notif._id.toString(),
      type: notif.type,
      title: notif.title,
      message: notif.message,
      timestamp: notif.created_at.toISOString(),
      isRead: notif.isRead,
      actionUrl: notif.actionUrl,
      metadata: notif.metadata,
    }));

    return res.json({
      success: true,
      data: formattedNotifications,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones',
    });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
    }

    // Contar notificaciones no leídas en la base de datos
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    return res.json({
      success: true,
      data: {
        count: unreadCount,
        userId,
      },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener contador de no leídas',
    });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
    }

    // Actualizar notificación en la base de datos
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId }, // Asegurar que la notificación pertenece al usuario
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada',
      });
    }

    return res.json({
      success: true,
      data: {
        id: notification._id.toString(),
        isRead: notification.isRead,
        readAt: notification.readAt,
      },
      message: 'Notificación marcada como leída',
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al marcar notificación como leída',
    });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
    }

    // Actualizar todas las notificaciones no leídas del usuario
    const result = await Notification.updateMany(
      { userId, isRead: false },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    return res.json({
      success: true,
      data: {
        userId,
        markedCount: result.modifiedCount,
        markedAt: new Date().toISOString(),
      },
      message: 'Todas las notificaciones marcadas como leídas',
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al marcar todas como leídas',
    });
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
    }

    // Eliminar notificación de la base de datos
    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId, // Asegurar que la notificación pertenece al usuario
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada',
      });
    }

    return res.json({
      success: true,
      message: 'Notificación eliminada exitosamente',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar notificación',
    });
  }
};

export const createNewNotification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { type, title, message, actionUrl, metadata, targetUserId } = req.body;

    // Si se especifica un targetUserId (para admin), usar ese; sino usar el userId del usuario autenticado
    const notificationUserId = targetUserId || userId;

    if (!notificationUserId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
    }

    // Validar campos requeridos
    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Los campos type, title y message son requeridos',
      });
    }

    // Validar tipo de notificación
    const validTypes = ['order', 'project', 'billing', 'message', 'system', 'deliverable', 'task'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Tipo de notificación inválido. Debe ser uno de: ${validTypes.join(', ')}`,
      });
    }

    // Crear notificación
    const notification = await createNotification({
      userId: notificationUserId,
      type,
      title,
      message,
      actionUrl,
      metadata,
    });

    return res.status(201).json({
      success: true,
      data: {
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        timestamp: notification.created_at.toISOString(),
        isRead: notification.isRead,
        actionUrl: notification.actionUrl,
        metadata: notification.metadata,
      },
      message: 'Notificación creada exitosamente',
    });
  } catch (error) {
    console.error('Create notification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear notificación',
    });
  }
};
