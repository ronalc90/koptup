import { Response } from 'express';
import { AuthRequest } from '../types';
import Notification from '../models/Notification';
import User from '../models/User';
import mongoose from 'mongoose';

// Obtener todas las notificaciones del usuario
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { type, unreadOnly } = req.query;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    const query: any = { userId };
    if (type && type !== 'all') {
      query.type = type;
    }
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const formattedNotifications = notifications.map((notif: any) => ({
      id: notif.notificationId,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      timestamp: notif.createdAt.toISOString(),
      isRead: notif.isRead,
      actionUrl: notif.actionUrl,
      metadata: notif.metadata,
    }));

    res.json({ success: true, data: formattedNotifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener notificaciones' });
  }
};

export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    const notification = await Notification.findOne({ notificationId: id, userId });
    if (!notification) {
      res.status(404).json({ success: false, message: 'Notificación no encontrada' });
      return;
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true, message: 'Notificación marcada como leída' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ success: false, message: 'Error al marcar notificación como leída' });
  }
};

export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    await Notification.updateMany({ userId, isRead: false }, { \$set: { isRead: true } });

    res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ success: false, message: 'Error al marcar todas las notificaciones como leídas' });
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    const result = await Notification.findOneAndDelete({ notificationId: id, userId });
    if (!result) {
      res.status(404).json({ success: false, message: 'Notificación no encontrada' });
      return;
    }

    res.json({ success: true, message: 'Notificación eliminada exitosamente' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar notificación' });
  }
};

export const createNotification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = req.user;
    const { type, title, message, targetUserId, targetUserIds, actionUrl, metadata } = req.body;

    if (!userId || !user) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    if (user.role !== 'admin' && user.role !== 'project_manager') {
      res.status(403).json({ success: false, message: 'No tienes permisos para crear notificaciones' });
      return;
    }

    if (!type || !title || !message) {
      res.status(400).json({ success: false, message: 'Tipo, título y mensaje son requeridos' });
      return;
    }

    let recipientIds: string[] = [];
    if (targetUserId) {
      recipientIds = [targetUserId];
    } else if (targetUserIds && Array.isArray(targetUserIds)) {
      recipientIds = targetUserIds;
    } else {
      const allUsers = await User.find({ role: 'client' }).select('_id').lean();
      recipientIds = allUsers.map((u: any) => u._id.toString());
    }

    const notifications = recipientIds.map((recipientId) => ({
      type,
      title,
      message,
      userId: new mongoose.Types.ObjectId(recipientId),
      isRead: false,
      actionUrl,
      metadata,
      createdBy: userId,
    }));

    const createdNotifications = await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      data: { count: createdNotifications.length, recipients: recipientIds },
      message: `${createdNotifications.length} notificación(es) creada(s) exitosamente`,
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ success: false, message: 'Error al crear notificación' });
  }
};

export const getNotificationStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = req.user;

    if (!userId || !user) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    if (user.role !== 'admin' && user.role !== 'project_manager') {
      res.status(403).json({ success: false, message: 'No tienes permisos para ver estadísticas' });
      return;
    }

    const [totalStats, typeStats, recentNotifications] = await Promise.all([
      Notification.aggregate([
        { \$group: { _id: null, total: { \$sum: 1 }, unread: { \$sum: { \$cond: [{ \$eq: ['\$isRead', false] }, 1, 0] } } } },
      ]),
      Notification.aggregate([{ \$group: { _id: '\$type', count: { \$sum: 1 } } }]),
      Notification.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'name email').populate('createdBy', 'name email').lean(),
    ]);

    const stats = {
      total: totalStats[0]?.total || 0,
      unread: totalStats[0]?.unread || 0,
      byType: typeStats.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recent: recentNotifications.map((notif: any) => ({
        id: notif.notificationId,
        type: notif.type,
        title: notif.title,
        recipient: notif.userId?.name || 'Usuario desconocido',
        sentBy: notif.createdBy?.name || 'Sistema',
        isRead: notif.isRead,
        createdAt: notif.createdAt,
      })),
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
};
