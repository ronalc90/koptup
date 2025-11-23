import mongoose from 'mongoose';
import User from '../models/User';
import Order from '../models/Order';
import Project from '../models/Project';
import Invoice from '../models/Invoice';
import Deliverable from '../models/Deliverable';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import { connectDB } from '../config/mongodb';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const seedDashboard = async () => {
  try {
    console.log('🌱 Iniciando seed de datos del dashboard...');

    // SECURITY: Prevent seeding in production
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ ERROR: Cannot run seed script in production environment!');
      console.error('❌ Set NODE_ENV to "development" or "test" to run this script.');
      process.exit(1);
    }

    // Conectar a MongoDB
    await connectDB();

    // SECURITY: Use environment variables for passwords or generate random ones
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || crypto.randomBytes(16).toString('hex');
    const clientPassword = process.env.SEED_CLIENT_PASSWORD || crypto.randomBytes(16).toString('hex');

    if (!process.env.SEED_ADMIN_PASSWORD) {
      console.warn('⚠️  WARNING: SEED_ADMIN_PASSWORD not set. Generated random password for admin.');
      console.log(`📝 Admin password: ${adminPassword}`);
      console.log('💡 Set SEED_ADMIN_PASSWORD in .env to use a custom password.');
    }

    if (!process.env.SEED_CLIENT_PASSWORD) {
      console.warn('⚠️  WARNING: SEED_CLIENT_PASSWORD not set. Generated random password for client.');
      console.log(`📝 Client password: ${clientPassword}`);
      console.log('💡 Set SEED_CLIENT_PASSWORD in .env to use a custom password.');
    }

    // Crear usuarios de prueba
    const adminUser = await User.findOneAndUpdate(
      { email: 'admin@koptup.com' },
      {
        name: 'Admin KopTup',
        email: 'admin@koptup.com',
        password: await bcrypt.hash(adminPassword, 10),
        role: 'admin',
      },
      { upsert: true, new: true }
    );

    const clientUser = await User.findOneAndUpdate(
      { email: 'cliente@example.com' },
      {
        name: 'Juan Pérez',
        email: 'cliente@example.com',
        password: await bcrypt.hash(clientPassword, 10),
        role: 'client',
      },
      { upsert: true, new: true }
    );

    console.log('✅ Usuarios creados');

    // Crear proyectos
    const project1 = await Project.findOneAndUpdate(
      { name: 'Sistema de Gestión de Inventario' },
      {
        name: 'Sistema de Gestión de Inventario',
        description: 'Desarrollo completo de sistema para gestión de stock',
        status: 'active',
        startDate: new Date('2025-09-01'),
        endDate: new Date('2025-11-20'),
        progress: 75,
      },
      { upsert: true, new: true }
    );

    const project2 = await Project.findOneAndUpdate(
      { name: 'Aplicación Móvil iOS/Android' },
      {
        name: 'Aplicación Móvil iOS/Android',
        description: 'App nativa para gestión de pedidos',
        status: 'active',
        startDate: new Date('2025-10-01'),
        endDate: new Date('2026-01-30'),
        progress: 45,
      },
      { upsert: true, new: true }
    );

    console.log('✅ Proyectos creados');

    // Crear órdenes
    await Order.deleteMany({});
    const order1 = new Order({
      name: 'Sistema de gestión de inventario',
      description: 'Desarrollo de sistema completo para gestión de stock',
      status: 'in_progress',
      userId: clientUser._id,
      projectId: project1._id,
      amount: 3500.00,
      currency: 'USD',
      items: [
        { name: 'Backend API', quantity: 1, price: 2000 },
        { name: 'Frontend Dashboard', quantity: 1, price: 1000 },
        { name: 'Base de datos', quantity: 1, price: 500 },
      ],
      tracking: 'TRK-123456',
      carrier: 'Entrega digital',
      orderDate: new Date('2025-10-01'),
      history: [
        { date: new Date('2025-10-01'), status: 'pending', description: 'Pedido creado' },
        { date: new Date('2025-10-02'), status: 'in_progress', description: 'Desarrollo iniciado' },
      ],
    });

    const order2 = new Order({
      name: 'Aplicación móvil iOS/Android',
      description: 'App nativa para gestión de pedidos',
      status: 'pending',
      userId: clientUser._id,
      projectId: project2._id,
      amount: 8500.00,
      currency: 'USD',
      items: [
        { name: 'Desarrollo iOS', quantity: 1, price: 4000 },
        { name: 'Desarrollo Android', quantity: 1, price: 4000 },
        { name: 'Backend API', quantity: 1, price: 500 },
      ],
      orderDate: new Date('2025-10-05'),
      history: [
        { date: new Date('2025-10-05'), status: 'pending', description: 'Pedido creado' },
      ],
    });

    await order1.save();
    await order2.save();

    console.log('✅ Órdenes creadas');

    // Crear facturas
    await Invoice.deleteMany({});
    const invoice1 = new Invoice({
      projectId: project1._id,
      userId: clientUser._id,
      status: 'paid',
      issueDate: new Date('2025-09-01'),
      dueDate: new Date('2025-09-15'),
      paidDate: new Date('2025-09-10'),
      clientInfo: {
        name: 'Juan Pérez',
        email: 'cliente@example.com',
        address: {
          street: 'Av. Principal 123',
          city: 'Bogotá',
          state: 'Cundinamarca',
          zipCode: '110111',
          country: 'Colombia',
        },
      },
      items: [
        { description: 'Backend API Development', quantity: 1, unitPrice: 2000, total: 2000 },
        { description: 'Frontend Dashboard', quantity: 1, unitPrice: 1000, total: 1000 },
        { description: 'Database Setup', quantity: 1, unitPrice: 500, total: 500 },
      ],
      subtotal: 3500,
      taxRate: 0.19,
      taxAmount: 665,
      total: 4165,
      currency: 'USD',
      paymentMethod: 'credit_card',
      history: [
        { date: new Date('2025-09-01'), action: 'created', description: 'Factura creada' },
        { date: new Date('2025-09-10'), action: 'paid', description: 'Pago recibido', amount: 4165 },
      ],
    });

    const invoice2 = new Invoice({
      projectId: project2._id,
      userId: clientUser._id,
      status: 'pending',
      issueDate: new Date('2025-10-01'),
      dueDate: new Date('2025-10-15'),
      clientInfo: {
        name: 'Juan Pérez',
        email: 'cliente@example.com',
      },
      items: [
        { description: 'Mobile App Development - Phase 1', quantity: 1, unitPrice: 4250, total: 4250 },
      ],
      subtotal: 4250,
      taxRate: 0.19,
      taxAmount: 807.50,
      total: 5057.50,
      currency: 'USD',
      history: [
        { date: new Date('2025-10-01'), action: 'created', description: 'Factura creada' },
      ],
    });

    await invoice1.save();
    await invoice2.save();

    console.log('✅ Facturas creadas');

    // Crear entregables
    await Deliverable.deleteMany({});
    const deliverable1 = new Deliverable({
      projectId: project1._id,
      userId: clientUser._id,
      title: 'Diseño UI/UX completo',
      description: 'Wireframes y diseños de alta fidelidad para todas las pantallas',
      type: 'design',
      status: 'approved',
      uploadDate: new Date('2025-10-05'),
      approvedDate: new Date('2025-10-06'),
      fileUrl: 'https://example.com/files/design-v1.fig',
      fileName: 'design-v1.fig',
      fileSize: 15234567,
      version: 1,
      uploadedBy: adminUser._id,
      reviewedBy: adminUser._id,
      comments: 'Excelente trabajo, aprobado sin cambios',
      history: [
        { date: new Date('2025-10-05'), action: 'uploaded', user: adminUser._id, userName: 'Admin KopTup', description: 'Entregable subido' },
        { date: new Date('2025-10-06'), action: 'approved', user: adminUser._id, userName: 'Admin KopTup', description: 'Entregable aprobado' },
      ],
    });

    const deliverable2 = new Deliverable({
      projectId: project1._id,
      userId: clientUser._id,
      title: 'Backend API - Módulo de inventario',
      description: 'API REST para gestión de inventario con documentación Swagger',
      type: 'code',
      status: 'pending',
      uploadDate: new Date('2025-10-08'),
      fileUrl: 'https://example.com/files/api-v1.zip',
      fileName: 'api-v1.zip',
      fileSize: 45678901,
      version: 1,
      uploadedBy: adminUser._id,
      history: [
        { date: new Date('2025-10-08'), action: 'uploaded', user: adminUser._id, userName: 'Admin KopTup', description: 'Entregable subido' },
      ],
    });

    await deliverable1.save();
    await deliverable2.save();

    console.log('✅ Entregables creados');

    // Crear conversaciones y mensajes
    await Conversation.deleteMany({});
    await Message.deleteMany({});

    const conversation1 = new Conversation({
      title: 'Sistema de gestión de inventario',
      projectId: project1._id,
      participants: [
        {
          userId: adminUser._id,
          role: 'admin',
          name: 'Admin KopTup',
          email: 'admin@koptup.com',
        },
        {
          userId: clientUser._id,
          role: 'client',
          name: 'Juan Pérez',
          email: 'cliente@example.com',
        },
      ],
      status: 'active',
      createdBy: adminUser._id,
      unreadCount: new Map([[clientUser._id.toString(), 2]]),
    });

    await conversation1.save();

    // Crear mensajes para la conversación
    const message1 = new Message({
      conversationId: conversation1._id,
      sender: clientUser._id,
      senderName: 'Juan Pérez',
      senderRole: 'client',
      content: 'Hola, quisiera saber el estado del proyecto',
      type: 'text',
      readBy: [{ userId: clientUser._id, readAt: new Date() }],
      createdAt: new Date('2025-10-11T09:00:00'),
    });

    const message2 = new Message({
      conversationId: conversation1._id,
      sender: adminUser._id,
      senderName: 'Admin KopTup',
      senderRole: 'admin',
      content: 'Buen día, con gusto te informo sobre el avance del proyecto. Hemos completado la primera fase del desarrollo.',
      type: 'text',
      readBy: [{ userId: adminUser._id, readAt: new Date() }],
      createdAt: new Date('2025-10-11T09:15:00'),
    });

    const message3 = new Message({
      conversationId: conversation1._id,
      sender: clientUser._id,
      senderName: 'Juan Pérez',
      senderRole: 'client',
      content: 'Excelente, ¿cuándo podré ver una demo?',
      type: 'text',
      readBy: [{ userId: clientUser._id, readAt: new Date() }],
      createdAt: new Date('2025-10-11T09:20:00'),
    });

    await message1.save();
    await message2.save();
    await message3.save();

    // Actualizar última mensaje de la conversación
    conversation1.lastMessage = {
      text: message3.content,
      sender: clientUser._id,
      senderName: 'Juan Pérez',
      timestamp: new Date('2025-10-11T09:20:00'),
    };
    await conversation1.save();

    console.log('✅ Conversaciones y mensajes creados');

    console.log('\n✅ Seed completado exitosamente!');
    console.log('\n📧 Credenciales de prueba:');
    console.log('   Admin: admin@koptup.com / admin123');
    console.log('   Cliente: cliente@example.com / cliente123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  seedDashboard();
}

export default seedDashboard;
