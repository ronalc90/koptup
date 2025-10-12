import { Response } from 'express';
import { AuthRequest } from '../types';

// Controlador para notificaciones
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { unreadOnly, limit } = req.query;

    // Mock data - En producción, consultar base de datos
    const notifications = [
      {
        id: 'NOTIF-001',
        type: 'deliverable_approved',
        title: 'Entregable aprobado',
        message: 'Tu entregable "Diseño UI/UX completo" ha sido aprobado',
        icon: 'check-circle',
        color: 'success',
        read: false,
        timestamp: '2025-10-11T14:30:00Z',
        actionUrl: '/deliverables/DEL-001',
        relatedEntity: {
          type: 'deliverable',
          id: 'DEL-001',
          name: 'Diseño UI/UX completo',
        },
        userId,
      },
      {
        id: 'NOTIF-002',
        type: 'new_message',
        title: 'Nuevo mensaje',
        message: 'María García te ha enviado un mensaje',
        icon: 'message',
        color: 'primary',
        read: false,
        timestamp: '2025-10-11T13:45:00Z',
        actionUrl: '/messages/conversations/CONV-001',
        relatedEntity: {
          type: 'conversation',
          id: 'CONV-001',
          name: 'María García',
        },
        userId,
      },
      {
        id: 'NOTIF-003',
        type: 'payment_received',
        title: 'Pago recibido',
        message: 'Se ha recibido el pago de la factura FAC-2025-001 por $4,165.00',
        icon: 'dollar-sign',
        color: 'success',
        read: false,
        timestamp: '2025-10-11T10:20:00Z',
        actionUrl: '/invoices/INV-001',
        relatedEntity: {
          type: 'invoice',
          id: 'INV-001',
          name: 'FAC-2025-001',
        },
        userId,
      },
      {
        id: 'NOTIF-004',
        type: 'project_update',
        title: 'Actualización de proyecto',
        message: 'El proyecto "Sistema de gestión de inventario" ha sido actualizado',
        icon: 'folder',
        color: 'info',
        read: true,
        timestamp: '2025-10-10T16:00:00Z',
        actionUrl: '/projects/PRJ-001',
        relatedEntity: {
          type: 'project',
          id: 'PRJ-001',
          name: 'Sistema de gestión de inventario',
        },
        userId,
      },
      {
        id: 'NOTIF-005',
        type: 'deliverable_rejected',
        title: 'Entregable rechazado',
        message: 'Tu entregable "Prototipo funcional v1" ha sido rechazado. Revisa los comentarios.',
        icon: 'x-circle',
        color: 'danger',
        read: true,
        timestamp: '2025-10-10T11:30:00Z',
        actionUrl: '/deliverables/DEL-003',
        relatedEntity: {
          type: 'deliverable',
          id: 'DEL-003',
          name: 'Prototipo funcional v1',
        },
        userId,
      },
      {
        id: 'NOTIF-006',
        type: 'invoice_overdue',
        title: 'Factura vencida',
        message: 'La factura FAC-2025-003 está vencida. Por favor, procesa el pago.',
        icon: 'alert-triangle',
        color: 'warning',
        read: true,
        timestamp: '2025-10-09T09:00:00Z',
        actionUrl: '/invoices/INV-003',
        relatedEntity: {
          type: 'invoice',
          id: 'INV-003',
          name: 'FAC-2025-003',
        },
        userId,
      },
      {
        id: 'NOTIF-007',
        type: 'project_milestone',
        title: 'Hito alcanzado',
        message: 'El proyecto "Chatbot con IA" ha alcanzado el 100% de completitud',
        icon: 'award',
        color: 'success',
        read: true,
        timestamp: '2025-10-08T15:20:00Z',
        actionUrl: '/projects/PRJ-004',
        relatedEntity: {
          type: 'project',
          id: 'PRJ-004',
          name: 'Chatbot con IA',
        },
        userId,
      },
      {
        id: 'NOTIF-008',
        type: 'new_order',
        title: 'Nuevo pedido',
        message: 'Has recibido un nuevo pedido: Website corporativo',
        icon: 'shopping-cart',
        color: 'info',
        read: true,
        timestamp: '2025-10-07T12:00:00Z',
        actionUrl: '/orders/ORD-003',
        relatedEntity: {
          type: 'order',
          id: 'ORD-003',
          name: 'Website corporativo',
        },
        userId,
      },
    ];

    // Filtrar solo no leídas si se solicita
    let filteredNotifications = unreadOnly === 'true'
      ? notifications.filter(notif => !notif.read)
      : notifications;

    // Limitar cantidad si se especifica
    if (limit) {
      const limitNum = parseInt(limit as string, 10);
      filteredNotifications = filteredNotifications.slice(0, limitNum);
    }

    res.json({
      success: true,
      data: filteredNotifications,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones',
    });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    // Mock data - En producción, consultar base de datos
    const unreadCount = 3; // Simulamos que hay 3 notificaciones no leídas

    res.json({
      success: true,
      data: {
        count: unreadCount,
        userId,
      },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener contador de no leídas',
    });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Mock marking as read
    const result = {
      id,
      read: true,
      readAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: result,
      message: 'Notificación marcada como leída',
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar notificación como leída',
    });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    // Mock marking all as read
    const result = {
      userId,
      markedCount: 3, // Simulamos que se marcaron 3 notificaciones
      markedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: result,
      message: 'Todas las notificaciones marcadas como leídas',
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar todas como leídas',
    });
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Mock deletion
    res.json({
      success: true,
      message: 'Notificación eliminada exitosamente',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar notificación',
    });
  }
};
