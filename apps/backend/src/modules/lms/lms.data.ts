import { Course, Enrollment } from './lms.types';

export const courses: Course[] = [
  { id: 'crs_001', title: 'TypeScript desde cero', description: 'Fundamentos hasta avanzado', instructor: 'Ana Beltrán', level: 'beginner', durationHours: 12, modules: [{ title: 'Tipos básicos', duration: 2 }, { title: 'Genéricos', duration: 3 }, { title: 'Decoradores', duration: 3 }], status: 'published', enrolledCount: 245, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-15T00:00:00Z' },
  { id: 'crs_002', title: 'React + Next.js', description: 'SSR, RSC y rendimiento', instructor: 'Luis Cárdenas', level: 'intermediate', durationHours: 20, modules: [{ title: 'RSC', duration: 5 }, { title: 'App Router', duration: 5 }], status: 'published', enrolledCount: 198, createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' },
  { id: 'crs_003', title: 'Microservicios con NestJS', description: 'Arquitectura distribuida', instructor: 'María Ortiz', level: 'advanced', durationHours: 30, modules: [{ title: 'Patrones', duration: 8 }, { title: 'Kafka', duration: 6 }], status: 'published', enrolledCount: 87, createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-15T00:00:00Z' },
  { id: 'crs_004', title: 'Docker y Kubernetes', description: 'Containers en producción', instructor: 'Carlos Patiño', level: 'intermediate', durationHours: 25, modules: [{ title: 'Docker', duration: 8 }, { title: 'K8s', duration: 10 }], status: 'published', enrolledCount: 156, createdAt: '2026-02-10T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z' },
  { id: 'crs_005', title: 'GraphQL Avanzado', description: 'Federación y subscriptions', instructor: 'Sofía Ramírez', level: 'advanced', durationHours: 18, modules: [{ title: 'Schema', duration: 4 }, { title: 'Federación', duration: 6 }], status: 'draft', enrolledCount: 0, createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z' },
  { id: 'crs_006', title: 'AWS Solutions Architect', description: 'Preparación certificación', instructor: 'Jorge Vega', level: 'intermediate', durationHours: 40, modules: [{ title: 'VPC', duration: 6 }, { title: 'EC2', duration: 8 }], status: 'published', enrolledCount: 312, createdAt: '2026-01-20T00:00:00Z', updatedAt: '2026-03-10T00:00:00Z' },
];

export const enrollments: Enrollment[] = [
  { id: 'enr_001', courseId: 'crs_001', studentEmail: 'pedro@globex.com', status: 'active', progress: 45, createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
  { id: 'enr_002', courseId: 'crs_001', studentEmail: 'maria@initech.com', status: 'completed', progress: 100, completedAt: '2026-04-15T00:00:00Z', createdAt: '2026-02-10T00:00:00Z', updatedAt: '2026-04-15T00:00:00Z' },
  { id: 'enr_003', courseId: 'crs_002', studentEmail: 'pedro@globex.com', status: 'active', progress: 70, createdAt: '2026-03-15T00:00:00Z', updatedAt: '2026-05-10T00:00:00Z' },
  { id: 'enr_004', courseId: 'crs_003', studentEmail: 'lead@hooli.com', status: 'active', progress: 30, createdAt: '2026-04-01T00:00:00Z', updatedAt: '2026-05-05T00:00:00Z' },
  { id: 'enr_005', courseId: 'crs_004', studentEmail: 'devops@umbrella.co', status: 'completed', progress: 100, completedAt: '2026-04-30T00:00:00Z', createdAt: '2026-02-15T00:00:00Z', updatedAt: '2026-04-30T00:00:00Z' },
  { id: 'enr_006', courseId: 'crs_006', studentEmail: 'pedro@globex.com', status: 'active', progress: 15, createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-05-12T00:00:00Z' },
  { id: 'enr_007', courseId: 'crs_002', studentEmail: 'dev@stark.com', status: 'dropped', progress: 20, createdAt: '2026-02-20T00:00:00Z', updatedAt: '2026-03-15T00:00:00Z' },
  { id: 'enr_008', courseId: 'crs_004', studentEmail: 'sre@hooli.com', status: 'active', progress: 55, createdAt: '2026-03-20T00:00:00Z', updatedAt: '2026-05-08T00:00:00Z' },
  { id: 'enr_009', courseId: 'crs_006', studentEmail: 'arch@stark.com', status: 'completed', progress: 100, completedAt: '2026-05-01T00:00:00Z', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
  { id: 'enr_010', courseId: 'crs_001', studentEmail: 'jr@pied-piper.io', status: 'active', progress: 25, createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-05-13T00:00:00Z' },
];
