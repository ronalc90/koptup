import mongoose from 'mongoose';
import Notification from '../models/Notification';
import User from '../models/User';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/koptup';

/**
 * Script para crear notificaciones de ejemplo en la base de datos
 *
 * Uso:
 * npm run seed:notifications
 *
 * O directamente:
 * npx ts-node src/scripts/seed-notifications.ts
 */
async function seedNotifications() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar un usuario para asignar las notificaciones
    const user = await User.findOne();

    if (!user) {
      console.log('❌ No se encontró ningún usuario en la base de datos.');
      console.log('💡 Por favor, crea un usuario primero antes de ejecutar este seed.');
      process.exit(1);
    }

    const userId = user._id.toString();
    console.log(`👤 Usando usuario: ${user.email} (${userId})`);

    // Eliminar notificaciones existentes del usuario (opcional)
    const deleteResult = await Notification.deleteMany({ userId });
    console.log(`🗑️  Eliminadas ${deleteResult.deletedCount} notificaciones existentes`);

    // Crear notificaciones de ejemplo
    const notifications = [
      {
        userId,
        type: 'project',
        title: 'Nuevo proyecto creado',
        message: 'El proyecto "Sistema de gestión de inventario" ha sido creado exitosamente',
        actionUrl: '/dashboard/projects/1',
        metadata: { projectId: '1', projectName: 'Sistema de gestión de inventario' },
        isRead: false,
        created_at: new Date(Date.now() - 1000 * 60 * 30), // Hace 30 minutos
      },
      {
        userId,
        type: 'message',
        title: 'Nuevo mensaje',
        message: 'El equipo de KopTup te ha enviado un mensaje',
        actionUrl: '/dashboard/messages',
        metadata: { conversationId: 'conv-001', senderName: 'Equipo KopTup' },
        isRead: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60), // Hace 1 hora
      },
      {
        userId,
        type: 'billing',
        title: 'Nueva factura disponible',
        message: 'La factura #FAC-2025-001 por $3,500.00 está lista para descargar',
        actionUrl: '/dashboard/billing',
        metadata: { invoiceId: 'inv-001', invoiceNumber: 'FAC-2025-001', amount: 3500 },
        isRead: false,
        created_at: new Date(Date.now() - 1000 * 60 * 120), // Hace 2 horas
      },
      {
        userId,
        type: 'task',
        title: 'Nueva tarea asignada',
        message: 'Se te ha asignado la tarea "Implementar sistema de notificaciones"',
        actionUrl: '/dashboard/projects/1',
        metadata: { taskId: 'task-001', taskTitle: 'Implementar sistema de notificaciones', projectId: '1' },
        isRead: true,
        readAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 6), // Hace 6 horas
      },
      {
        userId,
        type: 'order',
        title: 'Nuevo pedido confirmado',
        message: 'Tu pedido ORD-005 ha sido confirmado y está en proceso',
        actionUrl: '/dashboard/orders/ord-005',
        metadata: { orderId: 'ord-005' },
        isRead: true,
        readAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24), // Hace 1 día
      },
      {
        userId,
        type: 'deliverable',
        title: 'Entregable aprobado',
        message: 'Tu entregable "Diseño UI/UX completo" ha sido aprobado',
        actionUrl: '/dashboard/deliverables/del-001',
        metadata: { deliverableId: 'del-001', deliverableName: 'Diseño UI/UX completo' },
        isRead: true,
        readAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 36), // Hace 1.5 días
      },
      {
        userId,
        type: 'project',
        title: 'Proyecto actualizado',
        message: 'El proyecto "Chatbot con IA" ha sido actualizado',
        actionUrl: '/dashboard/projects/2',
        metadata: { projectId: '2', projectName: 'Chatbot con IA' },
        isRead: true,
        readAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 48), // Hace 2 días
      },
      {
        userId,
        type: 'billing',
        title: 'Pago recibido',
        message: 'Se ha recibido el pago de la factura FAC-2025-002 por $2,500.00',
        actionUrl: '/dashboard/billing',
        metadata: { invoiceId: 'inv-002', invoiceNumber: 'FAC-2025-002', amount: 2500 },
        isRead: true,
        readAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 72), // Hace 3 días
      },
      {
        userId,
        type: 'system',
        title: 'Mantenimiento programado',
        message: 'Realizaremos mantenimiento del sistema el sábado de 2:00 AM a 4:00 AM',
        metadata: { maintenanceDate: 'Sábado 2:00 AM - 4:00 AM' },
        isRead: true,
        readAt: new Date(Date.now() - 1000 * 60 * 60 * 96),
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 96), // Hace 4 días
      },
      {
        userId,
        type: 'task',
        title: 'Tarea completada',
        message: 'La tarea "Configurar base de datos" ha sido completada',
        actionUrl: '/dashboard/projects/1',
        metadata: { taskId: 'task-002', taskTitle: 'Configurar base de datos' },
        isRead: true,
        readAt: new Date(Date.now() - 1000 * 60 * 60 * 120),
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 120), // Hace 5 días
      },
    ];

    const result = await Notification.insertMany(notifications);
    console.log(`✅ Se crearon ${result.length} notificaciones de ejemplo`);

    const unreadCount = notifications.filter(n => !n.isRead).length;
    console.log(`📬 Notificaciones no leídas: ${unreadCount}`);
    console.log(`📭 Notificaciones leídas: ${result.length - unreadCount}`);

    console.log('\n🎉 Seed completado exitosamente!');
    console.log(`🔗 Puedes ver las notificaciones en: http://localhost:3000/dashboard/notifications`);

  } catch (error) {
    console.error('❌ Error al ejecutar seed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

// Ejecutar el seed
seedNotifications();
