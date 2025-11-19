import Project from '../../models/Project';
import Task from '../../models/Task';
import ProjectMember from '../../models/ProjectMember';
import User from '../../models/User';
import mongoose from 'mongoose';

export async function seedProjects() {
  try {
    console.log('📁 Iniciando seed de proyectos...');

    // Verificar si ya existen proyectos
    const existingProjects = await Project.countDocuments();
    if (existingProjects > 0) {
      console.log(`⏭️  Ya existen ${existingProjects} proyectos. Saltando seed.`);
      return;
    }

    // Obtener o crear usuarios de ejemplo
    let adminUser = await User.findOne({ email: 'admin@koptup.com' });
    let clientUser = await User.findOne({ email: 'test@example.com' });

    // Si no existe un usuario admin, crear uno temporal para el seed
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Administrador KopTup',
        email: 'admin@koptup.com',
        password: 'temporal123',
        role: 'admin',
      });
      console.log('👤 Usuario administrador creado para seed');
    }

    // Si no existe un usuario cliente, usar el admin como fallback
    if (!clientUser) {
      clientUser = adminUser;
    }

    // Crear proyectos de ejemplo
    const projects = [
      {
        name: 'Plataforma E-commerce',
        description: 'Desarrollo completo de tienda online con pasarela de pagos, gestión de inventario y sistema de usuarios',
        client_id: clientUser._id,
        manager_id: adminUser._id,
        status: 'active',
        priority: 'high',
        budget: 15000,
        start_date: new Date('2025-01-15'),
        end_date: new Date('2025-04-30'),
        estimated_hours: 320,
        actual_hours: 144,
        progress: 45,
      },
      {
        name: 'App Móvil de Fitness',
        description: 'Aplicación móvil multiplataforma para seguimiento de ejercicios, nutrición y objetivos de fitness',
        client_id: clientUser._id,
        manager_id: adminUser._id,
        status: 'active',
        priority: 'medium',
        budget: 8500,
        start_date: new Date('2025-02-01'),
        end_date: new Date('2025-05-15'),
        estimated_hours: 240,
        actual_hours: 72,
        progress: 30,
      },
      {
        name: 'Rediseño Web Corporativo',
        description: 'Rediseño completo del sitio web corporativo con enfoque en UX/UI moderno y optimización SEO',
        client_id: clientUser._id,
        manager_id: adminUser._id,
        status: 'planning',
        priority: 'medium',
        budget: 5000,
        start_date: new Date('2025-03-01'),
        end_date: new Date('2025-04-15'),
        estimated_hours: 160,
        actual_hours: 24,
        progress: 15,
      },
      {
        name: 'Chatbot con IA',
        description: 'Desarrollo de chatbot con inteligencia artificial para atención al cliente 24/7 integrado con WhatsApp y web',
        client_id: clientUser._id,
        manager_id: adminUser._id,
        status: 'active',
        priority: 'high',
        budget: 12000,
        start_date: new Date('2025-01-20'),
        end_date: new Date('2025-03-30'),
        estimated_hours: 280,
        actual_hours: 182,
        progress: 65,
      },
      {
        name: 'Sistema CRM Personalizado',
        description: 'Sistema CRM personalizado para gestión de clientes, ventas y seguimiento de oportunidades',
        client_id: clientUser._id,
        manager_id: adminUser._id,
        status: 'completed',
        priority: 'medium',
        budget: 10000,
        start_date: new Date('2024-11-01'),
        end_date: new Date('2025-01-31'),
        estimated_hours: 300,
        actual_hours: 300,
        progress: 100,
      },
    ];

    const createdProjects = await Project.insertMany(projects);
    console.log(`✅ ${createdProjects.length} proyectos creados`);

    // Crear tareas de ejemplo para el primer proyecto (E-commerce)
    const ecommerceProject = createdProjects[0];
    const ecommerceTasks = [
      {
        project_id: ecommerceProject._id,
        title: 'Diseño de base de datos',
        description: 'Crear esquema de BD para productos, usuarios, órdenes y pagos',
        status: 'completed',
        priority: 'high',
        estimated_hours: 16,
        actual_hours: 14,
        due_date: new Date('2025-01-20'),
        created_by: adminUser._id,
        completed_at: new Date('2025-01-19'),
      },
      {
        project_id: ecommerceProject._id,
        title: 'Desarrollo de API REST',
        description: 'Implementar endpoints para gestión de productos y carrito',
        status: 'in_progress',
        priority: 'high',
        estimated_hours: 40,
        actual_hours: 25,
        due_date: new Date('2025-02-15'),
        created_by: adminUser._id,
      },
      {
        project_id: ecommerceProject._id,
        title: 'Integración pasarela de pagos',
        description: 'Integrar Stripe/PayPal para procesamiento de pagos',
        status: 'todo',
        priority: 'high',
        estimated_hours: 24,
        actual_hours: 0,
        due_date: new Date('2025-03-01'),
        created_by: adminUser._id,
      },
      {
        project_id: ecommerceProject._id,
        title: 'Frontend - Catálogo de productos',
        description: 'Diseñar e implementar vista de productos con filtros',
        status: 'in_progress',
        priority: 'medium',
        estimated_hours: 32,
        actual_hours: 18,
        due_date: new Date('2025-02-20'),
        created_by: adminUser._id,
      },
      {
        project_id: ecommerceProject._id,
        title: 'Panel de administración',
        description: 'Crear dashboard para gestión de inventario',
        status: 'todo',
        priority: 'medium',
        estimated_hours: 40,
        actual_hours: 0,
        due_date: new Date('2025-03-15'),
        created_by: adminUser._id,
      },
    ];

    const createdEcommerceTasks = await Task.insertMany(ecommerceTasks);
    console.log(`✅ ${createdEcommerceTasks.length} tareas creadas para proyecto E-commerce`);

    // Crear tareas de ejemplo para el proyecto de Chatbot
    const chatbotProject = createdProjects[3];
    const chatbotTasks = [
      {
        project_id: chatbotProject._id,
        title: 'Configuración de OpenAI API',
        description: 'Configurar y probar integración con GPT-4',
        status: 'completed',
        priority: 'high',
        estimated_hours: 8,
        actual_hours: 7,
        due_date: new Date('2025-01-25'),
        created_by: adminUser._id,
        completed_at: new Date('2025-01-24'),
      },
      {
        project_id: chatbotProject._id,
        title: 'Integración WhatsApp Business',
        description: 'Conectar chatbot con WhatsApp Business API',
        status: 'completed',
        priority: 'high',
        estimated_hours: 20,
        actual_hours: 22,
        due_date: new Date('2025-02-10'),
        created_by: adminUser._id,
        completed_at: new Date('2025-02-12'),
      },
      {
        project_id: chatbotProject._id,
        title: 'Sistema de contexto conversacional',
        description: 'Implementar memoria de conversaciones',
        status: 'in_progress',
        priority: 'high',
        estimated_hours: 24,
        actual_hours: 16,
        due_date: new Date('2025-03-05'),
        created_by: adminUser._id,
      },
      {
        project_id: chatbotProject._id,
        title: 'Dashboard de analytics',
        description: 'Panel para visualizar métricas de conversaciones',
        status: 'todo',
        priority: 'medium',
        estimated_hours: 16,
        actual_hours: 0,
        due_date: new Date('2025-03-20'),
        created_by: adminUser._id,
      },
    ];

    const createdChatbotTasks = await Task.insertMany(chatbotTasks);
    console.log(`✅ ${createdChatbotTasks.length} tareas creadas para proyecto Chatbot`);

    console.log('✅ Seed de proyectos completado exitosamente');
  } catch (error) {
    console.error('❌ Error en seed de proyectos:', error);
    throw error;
  }
}
