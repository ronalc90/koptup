-- Sample projects data (requires users to exist first)

-- Sample Project 1: E-commerce Platform
INSERT INTO projects (id, name, description, status, priority, budget, start_date, end_date, estimated_hours, progress)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'E-commerce Platform Development',
  'Desarrollo completo de plataforma de comercio electrónico con pasarela de pagos, gestión de inventario y sistema de usuarios',
  'active',
  'high',
  15000.00,
  '2025-01-15',
  '2025-04-30',
  320,
  45
) ON CONFLICT (id) DO NOTHING;

-- Sample Project 2: Mobile App
INSERT INTO projects (id, name, description, status, priority, budget, start_date, end_date, estimated_hours, progress)
VALUES (
  'b2c3d4e5-f6a7-4b5c-8d9e-0f1a2b3c4d5e',
  'Fitness Tracker Mobile App',
  'Aplicación móvil multiplataforma para seguimiento de ejercicios, nutrición y objetivos de fitness',
  'active',
  'medium',
  8500.00,
  '2025-02-01',
  '2025-05-15',
  240,
  30
) ON CONFLICT (id) DO NOTHING;

-- Sample Project 3: Website Redesign
INSERT INTO projects (id, name, description, status, priority, budget, start_date, end_date, estimated_hours, progress)
VALUES (
  'c3d4e5f6-a7b8-4c5d-8e9f-0a1b2c3d4e5f',
  'Corporate Website Redesign',
  'Rediseño completo del sitio web corporativo con enfoque en UX/UI moderno y optimización SEO',
  'planning',
  'medium',
  5000.00,
  '2025-03-01',
  '2025-04-15',
  160,
  15
) ON CONFLICT (id) DO NOTHING;

-- Sample Project 4: AI Chatbot
INSERT INTO projects (id, name, description, status, priority, budget, start_date, end_date, estimated_hours, progress)
VALUES (
  'd4e5f6a7-b8c9-4d5e-8f9a-0b1c2d3e4f5a',
  'AI Customer Support Chatbot',
  'Desarrollo de chatbot con inteligencia artificial para atención al cliente 24/7 integrado con WhatsApp y web',
  'active',
  'high',
  12000.00,
  '2025-01-20',
  '2025-03-30',
  280,
  65
) ON CONFLICT (id) DO NOTHING;

-- Sample Project 5: CRM System
INSERT INTO projects (id, name, description, status, priority, budget, start_date, end_date, estimated_hours, progress)
VALUES (
  'e5f6a7b8-c9d0-4e5f-8a9b-0c1d2e3f4a5b',
  'Custom CRM System',
  'Sistema CRM personalizado para gestión de clientes, ventas y seguimiento de oportunidades',
  'completed',
  'medium',
  10000.00,
  '2024-11-01',
  '2025-01-31',
  300,
  100
) ON CONFLICT (id) DO NOTHING;

-- Sample Tasks for Project 1 (E-commerce)
INSERT INTO tasks (id, project_id, title, description, status, priority, estimated_hours, due_date)
VALUES
  ('t1-aaaa-bbbb-cccc-dddddddddddd', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
   'Diseño de base de datos', 'Crear esquema de BD para productos, usuarios, órdenes y pagos',
   'completed', 'high', 16, '2025-01-20'),
  ('t2-aaaa-bbbb-cccc-dddddddddddd', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
   'Desarrollo de API REST', 'Implementar endpoints para gestión de productos y carrito',
   'in_progress', 'high', 40, '2025-02-15'),
  ('t3-aaaa-bbbb-cccc-dddddddddddd', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
   'Integración pasarela de pagos', 'Integrar Stripe/PayPal para procesamiento de pagos',
   'todo', 'high', 24, '2025-03-01'),
  ('t4-aaaa-bbbb-cccc-dddddddddddd', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
   'Frontend - Catálogo de productos', 'Diseñar e implementar vista de productos con filtros',
   'in_progress', 'medium', 32, '2025-02-20'),
  ('t5-aaaa-bbbb-cccc-dddddddddddd', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
   'Panel de administración', 'Crear dashboard para gestión de inventario',
   'todo', 'medium', 40, '2025-03-15')
ON CONFLICT (id) DO NOTHING;

-- Sample Tasks for Project 4 (AI Chatbot)
INSERT INTO tasks (id, project_id, title, description, status, priority, estimated_hours, due_date)
VALUES
  ('t1-dddd-bbbb-cccc-eeeeeeeeeeee', 'd4e5f6a7-b8c9-4d5e-8f9a-0b1c2d3e4f5a',
   'Configuración de OpenAI API', 'Configurar y probar integración con GPT-4',
   'completed', 'high', 8, '2025-01-25'),
  ('t2-dddd-bbbb-cccc-eeeeeeeeeeee', 'd4e5f6a7-b8c9-4d5e-8f9a-0b1c2d3e4f5a',
   'Integración WhatsApp Business', 'Conectar chatbot con WhatsApp Business API',
   'completed', 'high', 20, '2025-02-10'),
  ('t3-dddd-bbbb-cccc-eeeeeeeeeeee', 'd4e5f6a7-b8c9-4d5e-8f9a-0b1c2d3e4f5a',
   'Sistema de contexto conversacional', 'Implementar memoria de conversaciones',
   'in_progress', 'high', 24, '2025-03-05'),
  ('t4-dddd-bbbb-cccc-eeeeeeeeeeee', 'd4e5f6a7-b8c9-4d5e-8f9a-0b1c2d3e4f5a',
   'Dashboard de analytics', 'Panel para visualizar métricas de conversaciones',
   'todo', 'medium', 16, '2025-03-20')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE projects IS 'Sample projects for demonstration';
COMMENT ON TABLE tasks IS 'Sample tasks/deliverables for projects';
