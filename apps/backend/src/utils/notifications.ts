import Notification, { INotification } from '../models/Notification';

interface CreateNotificationParams {
  userId: string;
  type: 'order' | 'project' | 'billing' | 'message' | 'system' | 'deliverable' | 'task';
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Helper function to create a notification
 */
export const createNotification = async (params: CreateNotificationParams): Promise<INotification> => {
  try {
    const notification = new Notification({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      actionUrl: params.actionUrl,
      metadata: params.metadata || {},
      isRead: false,
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Helper function to create multiple notifications at once
 */
export const createBulkNotifications = async (
  notificationsData: CreateNotificationParams[]
): Promise<INotification[]> => {
  try {
    const notifications = notificationsData.map(data => ({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl,
      metadata: data.metadata || {},
      isRead: false,
    }));

    const createdNotifications = await Notification.insertMany(notifications);
    return createdNotifications;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
};

/**
 * Notification templates for common events
 */
export const NotificationTemplates = {
  // Project notifications
  projectCreated: (userId: string, projectId: string, projectName: string) => ({
    userId,
    type: 'project' as const,
    title: 'Nuevo proyecto creado',
    message: `El proyecto "${projectName}" ha sido creado exitosamente`,
    actionUrl: `/dashboard/projects/${projectId}`,
    metadata: { projectId, projectName },
  }),

  projectUpdated: (userId: string, projectId: string, projectName: string) => ({
    userId,
    type: 'project' as const,
    title: 'Proyecto actualizado',
    message: `El proyecto "${projectName}" ha sido actualizado`,
    actionUrl: `/dashboard/projects/${projectId}`,
    metadata: { projectId, projectName },
  }),

  projectCompleted: (userId: string, projectId: string, projectName: string) => ({
    userId,
    type: 'project' as const,
    title: 'Proyecto completado',
    message: `El proyecto "${projectName}" ha sido completado`,
    actionUrl: `/dashboard/projects/${projectId}`,
    metadata: { projectId, projectName },
  }),

  // Task notifications
  taskAssigned: (userId: string, taskId: string, taskTitle: string, projectId?: string) => ({
    userId,
    type: 'task' as const,
    title: 'Nueva tarea asignada',
    message: `Se te ha asignado la tarea "${taskTitle}"`,
    actionUrl: projectId ? `/dashboard/projects/${projectId}` : `/dashboard/tasks/${taskId}`,
    metadata: { taskId, taskTitle, projectId },
  }),

  taskCompleted: (userId: string, taskId: string, taskTitle: string) => ({
    userId,
    type: 'task' as const,
    title: 'Tarea completada',
    message: `La tarea "${taskTitle}" ha sido completada`,
    actionUrl: `/dashboard/tasks/${taskId}`,
    metadata: { taskId, taskTitle },
  }),

  // Order notifications
  orderReceived: (userId: string, orderId: string, orderTitle: string) => ({
    userId,
    type: 'order' as const,
    title: 'Nuevo pedido recibido',
    message: `Has recibido un nuevo pedido: ${orderTitle}`,
    actionUrl: `/dashboard/orders/${orderId}`,
    metadata: { orderId, orderTitle },
  }),

  orderConfirmed: (userId: string, orderId: string) => ({
    userId,
    type: 'order' as const,
    title: 'Pedido confirmado',
    message: `Tu pedido ${orderId} ha sido confirmado y está en proceso`,
    actionUrl: `/dashboard/orders/${orderId}`,
    metadata: { orderId },
  }),

  orderShipped: (userId: string, orderId: string) => ({
    userId,
    type: 'order' as const,
    title: 'Pedido enviado',
    message: `Tu pedido ${orderId} ha sido enviado y está en camino`,
    actionUrl: `/dashboard/orders/${orderId}`,
    metadata: { orderId },
  }),

  // Billing notifications
  invoiceCreated: (userId: string, invoiceId: string, invoiceNumber: string, amount: number) => ({
    userId,
    type: 'billing' as const,
    title: 'Nueva factura disponible',
    message: `La factura ${invoiceNumber} por $${amount.toLocaleString()} está lista para descargar`,
    actionUrl: `/dashboard/billing`,
    metadata: { invoiceId, invoiceNumber, amount },
  }),

  paymentReceived: (userId: string, invoiceId: string, invoiceNumber: string, amount: number) => ({
    userId,
    type: 'billing' as const,
    title: 'Pago recibido',
    message: `Se ha recibido el pago de la factura ${invoiceNumber} por $${amount.toLocaleString()}`,
    actionUrl: `/dashboard/billing`,
    metadata: { invoiceId, invoiceNumber, amount },
  }),

  invoiceOverdue: (userId: string, invoiceId: string, invoiceNumber: string) => ({
    userId,
    type: 'billing' as const,
    title: 'Factura vencida',
    message: `La factura ${invoiceNumber} está vencida. Por favor, procesa el pago.`,
    actionUrl: `/dashboard/billing`,
    metadata: { invoiceId, invoiceNumber },
  }),

  // Message notifications
  newMessage: (userId: string, conversationId: string, senderName: string) => ({
    userId,
    type: 'message' as const,
    title: 'Nuevo mensaje',
    message: `${senderName} te ha enviado un mensaje`,
    actionUrl: `/dashboard/messages`,
    metadata: { conversationId, senderName },
  }),

  // Deliverable notifications
  deliverableApproved: (userId: string, deliverableId: string, deliverableName: string) => ({
    userId,
    type: 'deliverable' as const,
    title: 'Entregable aprobado',
    message: `Tu entregable "${deliverableName}" ha sido aprobado`,
    actionUrl: `/dashboard/deliverables/${deliverableId}`,
    metadata: { deliverableId, deliverableName },
  }),

  deliverableRejected: (userId: string, deliverableId: string, deliverableName: string) => ({
    userId,
    type: 'deliverable' as const,
    title: 'Entregable rechazado',
    message: `Tu entregable "${deliverableName}" ha sido rechazado. Revisa los comentarios.`,
    actionUrl: `/dashboard/deliverables/${deliverableId}`,
    metadata: { deliverableId, deliverableName },
  }),

  deliverableUploaded: (userId: string, deliverableId: string, deliverableName: string) => ({
    userId,
    type: 'deliverable' as const,
    title: 'Nuevo entregable disponible',
    message: `Un nuevo entregable "${deliverableName}" está disponible para revisión`,
    actionUrl: `/dashboard/deliverables/${deliverableId}`,
    metadata: { deliverableId, deliverableName },
  }),

  // System notifications
  systemMaintenance: (userId: string, maintenanceDate: string) => ({
    userId,
    type: 'system' as const,
    title: 'Mantenimiento programado',
    message: `Realizaremos mantenimiento del sistema ${maintenanceDate}`,
    metadata: { maintenanceDate },
  }),

  systemUpdate: (userId: string, updateDescription: string) => ({
    userId,
    type: 'system' as const,
    title: 'Actualización del sistema',
    message: updateDescription,
    metadata: {},
  }),
};
