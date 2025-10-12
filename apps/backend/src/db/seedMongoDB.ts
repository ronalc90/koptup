import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Project from '../models/Project';
import Task from '../models/Task';
import ProjectMember from '../models/ProjectMember';
import { connectDB } from '../config/mongodb';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();

    logger.info('Clearing existing data...');
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await ProjectMember.deleteMany({});

    logger.info('Creating users...');

    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = await User.insertMany([
      {
        email: 'admin@koptup.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin',
        provider: 'local',
      },
      {
        email: 'carlos@koptup.com',
        password: hashedPassword,
        name: 'Carlos Mendoza',
        role: 'manager',
        provider: 'local',
      },
      {
        email: 'ana@koptup.com',
        password: hashedPassword,
        name: 'Ana García',
        role: 'developer',
        provider: 'local',
      },
      {
        email: 'laura@koptup.com',
        password: hashedPassword,
        name: 'Laura Martínez',
        role: 'developer',
        provider: 'local',
      },
      {
        email: 'roberto@koptup.com',
        password: hashedPassword,
        name: 'Roberto Silva',
        role: 'developer',
        provider: 'local',
      },
    ]);

    logger.info(`Created ${users.length} users`);

    const [admin, carlos, ana, laura, roberto] = users;

    logger.info('Creating projects...');

    // Create sample projects
    const projects = await Project.insertMany([
      {
        name: 'E-commerce Platform Development',
        description: 'Desarrollo completo de plataforma de comercio electrónico con pasarela de pagos, gestión de inventario y sistema de usuarios',
        status: 'active',
        priority: 'high',
        budget: 15000,
        start_date: new Date('2025-01-15'),
        end_date: new Date('2025-04-30'),
        estimated_hours: 320,
        progress: 45,
        manager_id: carlos._id,
        client_id: admin._id,
      },
      {
        name: 'Fitness Tracker Mobile App',
        description: 'Aplicación móvil multiplataforma para seguimiento de ejercicios, nutrición y objetivos de fitness',
        status: 'active',
        priority: 'medium',
        budget: 8500,
        start_date: new Date('2025-02-01'),
        end_date: new Date('2025-05-15'),
        estimated_hours: 240,
        progress: 30,
        manager_id: carlos._id,
        client_id: admin._id,
      },
      {
        name: 'Corporate Website Redesign',
        description: 'Rediseño completo del sitio web corporativo con enfoque en UX/UI moderno y optimización SEO',
        status: 'planning',
        priority: 'medium',
        budget: 5000,
        start_date: new Date('2025-03-01'),
        end_date: new Date('2025-04-15'),
        estimated_hours: 160,
        progress: 15,
        manager_id: ana._id,
        client_id: admin._id,
      },
      {
        name: 'AI Customer Support Chatbot',
        description: 'Desarrollo de chatbot con inteligencia artificial para atención al cliente 24/7 integrado con WhatsApp y web',
        status: 'active',
        priority: 'high',
        budget: 12000,
        start_date: new Date('2025-01-20'),
        end_date: new Date('2025-03-30'),
        estimated_hours: 280,
        progress: 65,
        manager_id: roberto._id,
        client_id: admin._id,
      },
      {
        name: 'Custom CRM System',
        description: 'Sistema CRM personalizado para gestión de clientes, ventas y seguimiento de oportunidades',
        status: 'completed',
        priority: 'medium',
        budget: 10000,
        start_date: new Date('2024-11-01'),
        end_date: new Date('2025-01-31'),
        estimated_hours: 300,
        actual_hours: 320,
        progress: 100,
        manager_id: carlos._id,
        client_id: admin._id,
      },
    ]);

    logger.info(`Created ${projects.length} projects`);

    // Create project members
    logger.info('Creating project members...');
    await ProjectMember.insertMany([
      { project_id: projects[0]._id, user_id: ana._id, role: 'frontend developer' },
      { project_id: projects[0]._id, user_id: laura._id, role: 'backend developer' },
      { project_id: projects[1]._id, user_id: laura._id, role: 'mobile developer' },
      { project_id: projects[3]._id, user_id: ana._id, role: 'ai specialist' },
      { project_id: projects[4]._id, user_id: roberto._id, role: 'fullstack developer' },
    ]);

    logger.info('Creating tasks...');

    // Create tasks for Project 1 (E-commerce)
    await Task.insertMany([
      {
        project_id: projects[0]._id,
        title: 'Diseño de base de datos',
        description: 'Crear esquema de BD para productos, usuarios, órdenes y pagos',
        status: 'completed',
        priority: 'high',
        estimated_hours: 16,
        actual_hours: 14,
        due_date: new Date('2025-01-20'),
        completed_at: new Date('2025-01-19'),
        assigned_to: laura._id,
        created_by: carlos._id,
      },
      {
        project_id: projects[0]._id,
        title: 'Desarrollo de API REST',
        description: 'Implementar endpoints para gestión de productos y carrito',
        status: 'in_progress',
        priority: 'high',
        estimated_hours: 40,
        actual_hours: 20,
        due_date: new Date('2025-02-15'),
        assigned_to: laura._id,
        created_by: carlos._id,
      },
      {
        project_id: projects[0]._id,
        title: 'Integración pasarela de pagos',
        description: 'Integrar Stripe/PayPal para procesamiento de pagos',
        status: 'todo',
        priority: 'high',
        estimated_hours: 24,
        due_date: new Date('2025-03-01'),
        assigned_to: laura._id,
        created_by: carlos._id,
      },
      {
        project_id: projects[0]._id,
        title: 'Frontend - Catálogo de productos',
        description: 'Diseñar e implementar vista de productos con filtros',
        status: 'in_progress',
        priority: 'medium',
        estimated_hours: 32,
        actual_hours: 15,
        due_date: new Date('2025-02-20'),
        assigned_to: ana._id,
        created_by: carlos._id,
      },
      {
        project_id: projects[0]._id,
        title: 'Panel de administración',
        description: 'Crear dashboard para gestión de inventario',
        status: 'todo',
        priority: 'medium',
        estimated_hours: 40,
        due_date: new Date('2025-03-15'),
        assigned_to: ana._id,
        created_by: carlos._id,
      },
    ]);

    // Create tasks for Project 4 (AI Chatbot)
    await Task.insertMany([
      {
        project_id: projects[3]._id,
        title: 'Configuración de OpenAI API',
        description: 'Configurar y probar integración con GPT-4',
        status: 'completed',
        priority: 'high',
        estimated_hours: 8,
        actual_hours: 6,
        due_date: new Date('2025-01-25'),
        completed_at: new Date('2025-01-24'),
        assigned_to: roberto._id,
        created_by: roberto._id,
      },
      {
        project_id: projects[3]._id,
        title: 'Integración WhatsApp Business',
        description: 'Conectar chatbot con WhatsApp Business API',
        status: 'completed',
        priority: 'high',
        estimated_hours: 20,
        actual_hours: 22,
        due_date: new Date('2025-02-10'),
        completed_at: new Date('2025-02-11'),
        assigned_to: roberto._id,
        created_by: roberto._id,
      },
      {
        project_id: projects[3]._id,
        title: 'Sistema de contexto conversacional',
        description: 'Implementar memoria de conversaciones',
        status: 'in_progress',
        priority: 'high',
        estimated_hours: 24,
        actual_hours: 10,
        due_date: new Date('2025-03-05'),
        assigned_to: ana._id,
        created_by: roberto._id,
      },
      {
        project_id: projects[3]._id,
        title: 'Dashboard de analytics',
        description: 'Panel para visualizar métricas de conversaciones',
        status: 'todo',
        priority: 'medium',
        estimated_hours: 16,
        due_date: new Date('2025-03-20'),
        assigned_to: ana._id,
        created_by: roberto._id,
      },
    ]);

    logger.info('✅ Database seeded successfully!');
    logger.info('\nSample credentials:');
    logger.info('Email: admin@koptup.com | Password: password123');
    logger.info('Email: carlos@koptup.com | Password: password123');
    logger.info('Email: ana@koptup.com | Password: password123');

    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
