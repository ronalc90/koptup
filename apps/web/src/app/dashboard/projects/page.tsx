'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      // Cargar proyectos desde la API
      const projectsData = await api.getUserProjects();

      // Si no hay proyectos, usar datos mock para demostración
      if (projectsData.length === 0) {
        const mockProjects = [
        {
          id: 'PROJ-001',
          name: 'Plataforma E-commerce',
          description: 'Desarrollo completo de tienda online con pasarela de pagos',
          status: 'active',
          progress: 75,
          startDate: '2025-09-01',
          endDate: '2025-11-20',
          manager: 'Carlos Rodríguez',
          teamSize: 5,
          budget: 15000,
          spent: 11250,
          phases: [
            { name: 'Planeación', status: 'completed', progress: 100, dueDate: '2025-09-10' },
            { name: 'Desarrollo', status: 'in_progress', progress: 80, dueDate: '2025-10-30' },
            { name: 'QA', status: 'pending', progress: 0, dueDate: '2025-11-10' },
            { name: 'Entrega', status: 'pending', progress: 0, dueDate: '2025-11-20' },
          ],
          milestones: [
            { name: 'Diseño UI/UX completado', date: '2025-09-15', status: 'completed' },
            { name: 'Backend API funcional', date: '2025-10-05', status: 'completed' },
            { name: 'Integración de pagos', date: '2025-10-25', status: 'in_progress' },
            { name: 'Testing completo', date: '2025-11-10', status: 'pending' },
          ],
          deliverables: [
            { name: 'Mockups de diseño', status: 'approved', date: '2025-09-12' },
            { name: 'Prototipo funcional', status: 'approved', date: '2025-09-28' },
            { name: 'Beta version', status: 'in_review', date: '2025-10-15' },
          ],
        },
        {
          id: 'PROJ-002',
          name: 'Portal de Clientes',
          description: 'Dashboard personalizado para clientes con reportes y analytics',
          status: 'active',
          progress: 45,
          startDate: '2025-10-01',
          endDate: '2025-12-10',
          manager: 'María González',
          teamSize: 3,
          budget: 8500,
          spent: 3825,
          phases: [
            { name: 'Planeación', status: 'completed', progress: 100, dueDate: '2025-10-08' },
            { name: 'Desarrollo', status: 'in_progress', progress: 30, dueDate: '2025-11-20' },
            { name: 'QA', status: 'pending', progress: 0, dueDate: '2025-12-01' },
            { name: 'Entrega', status: 'pending', progress: 0, dueDate: '2025-12-10' },
          ],
          milestones: [
            { name: 'Arquitectura definida', date: '2025-10-05', status: 'completed' },
            { name: 'Dashboard de reportes', date: '2025-10-30', status: 'in_progress' },
            { name: 'Integración con API', date: '2025-11-15', status: 'pending' },
          ],
          deliverables: [
            { name: 'Documento de requisitos', status: 'approved', date: '2025-10-03' },
            { name: 'Wireframes', status: 'approved', date: '2025-10-10' },
          ],
        },
        {
          id: 'PROJ-003',
          name: 'App Móvil iOS/Android',
          description: 'Aplicación nativa para gestión de pedidos',
          status: 'planning',
          progress: 15,
          startDate: '2025-10-15',
          endDate: '2026-01-30',
          manager: 'Juan Pérez',
          teamSize: 4,
          budget: 18000,
          spent: 2700,
          phases: [
            { name: 'Planeación', status: 'in_progress', progress: 60, dueDate: '2025-10-30' },
            { name: 'Desarrollo', status: 'pending', progress: 0, dueDate: '2026-01-10' },
            { name: 'QA', status: 'pending', progress: 0, dueDate: '2026-01-20' },
            { name: 'Entrega', status: 'pending', progress: 0, dueDate: '2026-01-30' },
          ],
          milestones: [
            { name: 'Discovery completado', date: '2025-10-20', status: 'in_progress' },
            { name: 'Prototipo aprobado', date: '2025-10-28', status: 'pending' },
          ],
          deliverables: [
            { name: 'Research inicial', status: 'in_review', date: '2025-10-18' },
          ],
        },
        ];
        setProjects(mockProjects);
        setSelectedProject(mockProjects[0]);
      } else {
        // Formatear proyectos de la API
        const formattedProjects = projectsData.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || 'Sin descripción',
          status: p.status || 'active',
          progress: p.progress || 0,
          startDate: p.start_date || new Date().toISOString().split('T')[0],
          endDate: p.end_date || 'Sin fecha',
          manager: p.manager_name || 'Sin asignar',
          teamSize: p.team_size || 1,
          budget: 0,
          spent: 0,
          phases: [
            { name: 'Planeación', status: 'completed', progress: 100, dueDate: p.start_date },
            { name: 'Desarrollo', status: 'in_progress', progress: p.progress || 0, dueDate: p.end_date },
            { name: 'QA', status: 'pending', progress: 0, dueDate: p.end_date },
            { name: 'Entrega', status: 'pending', progress: 0, dueDate: p.end_date },
          ],
          milestones: [],
          deliverables: [],
        }));
        setProjects(formattedProjects);
        if (formattedProjects.length > 0) {
          setSelectedProject(formattedProjects[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { className: string; text: string }> = {
      planning: { className: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300', text: 'Planeación' },
      active: { className: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300', text: 'Activo' },
      on_hold: { className: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300', text: 'En Espera' },
      completed: { className: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300', text: 'Completado' },
    };
    const badge = badges[status] || { className: 'bg-secondary-100', text: status };
    return <Badge variant="secondary" size="sm" className={badge.className}>{badge.text}</Badge>;
  };

  const getPhaseStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
    if (status === 'in_progress') return <ClockIcon className="h-5 w-5 text-blue-600" />;
    return <div className="h-5 w-5 rounded-full border-2 border-secondary-300" />;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
              Mis Proyectos
            </h1>
            <p className="text-secondary-600 dark:text-secondary-400">
              Sigue el progreso de todos tus proyectos
            </p>
          </div>
          <Button asChild>
            <Link href="/contact?type=new-project">Nuevo Proyecto</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects List */}
          <div className="lg:col-span-1 space-y-4">
            {projects.map((project) => (
              <Card
                key={project.id}
                variant="bordered"
                className={`cursor-pointer transition-all ${
                  selectedProject?.id === project.id
                    ? 'ring-2 ring-primary-500 shadow-medium'
                    : 'hover:shadow-medium'
                }`}
                onClick={() => setSelectedProject(project)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-secondary-900 dark:text-white">
                      {project.name}
                    </h3>
                    {getStatusBadge(project.status)}
                  </div>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3">
                    {project.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary-600 dark:text-secondary-400">Progreso</span>
                      <span className="font-semibold text-secondary-900 dark:text-white">
                        {project.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary-200 dark:bg-secondary-800 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-secondary-500">
                    <span className="font-mono">{project.id}</span>
                    <span>•</span>
                    <span>{project.teamSize} miembros</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Project Details */}
          {selectedProject && (
            <div className="lg:col-span-2 space-y-6">
              {/* Overview */}
              <Card variant="bordered">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedProject.name}</CardTitle>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                        {selectedProject.description}
                      </p>
                    </div>
                    {getStatusBadge(selectedProject.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">Manager</p>
                      <p className="font-semibold text-secondary-900 dark:text-white">
                        {selectedProject.manager}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">Equipo</p>
                      <p className="font-semibold text-secondary-900 dark:text-white">
                        {selectedProject.teamSize} miembros
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">Inicio</p>
                      <p className="font-semibold text-secondary-900 dark:text-white">
                        {selectedProject.startDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">Entrega</p>
                      <p className="font-semibold text-secondary-900 dark:text-white">
                        {selectedProject.endDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-secondary-50 dark:bg-secondary-900 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">
                        Presupuesto utilizado
                      </p>
                      <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                        ${selectedProject.spent.toLocaleString()} / ${selectedProject.budget.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">
                        Restante
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        ${(selectedProject.budget - selectedProject.spent).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline - Phases */}
              <Card variant="bordered">
                <CardHeader>
                  <CardTitle>Fases del Proyecto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedProject.phases.map((phase: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          {getPhaseStatusIcon(phase.status)}
                          {idx < selectedProject.phases.length - 1 && (
                            <div className="w-0.5 h-16 bg-secondary-200 dark:bg-secondary-700 my-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-8">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-secondary-900 dark:text-white">
                              {phase.name}
                            </h4>
                            <span className="text-sm text-secondary-600 dark:text-secondary-400">
                              {phase.dueDate}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-secondary-600 dark:text-secondary-400">
                                Progreso
                              </span>
                              <span className="font-semibold text-secondary-900 dark:text-white">
                                {phase.progress}%
                              </span>
                            </div>
                            <div className="w-full bg-secondary-200 dark:bg-secondary-800 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  phase.status === 'completed'
                                    ? 'bg-green-600'
                                    : phase.status === 'in_progress'
                                    ? 'bg-blue-600'
                                    : 'bg-secondary-400'
                                }`}
                                style={{ width: `${phase.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Milestones & Deliverables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Milestones */}
                <Card variant="bordered">
                  <CardHeader>
                    <CardTitle>Hitos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedProject.milestones.map((milestone: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3">
                          <CalendarIcon className="h-5 w-5 text-secondary-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-secondary-900 dark:text-white">
                              {milestone.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-secondary-500">{milestone.date}</span>
                              <Badge
                                variant="secondary"
                                size="sm"
                                className={
                                  milestone.status === 'completed'
                                    ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
                                    : milestone.status === 'in_progress'
                                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                                    : 'bg-secondary-100'
                                }
                              >
                                {milestone.status === 'completed'
                                  ? 'Completado'
                                  : milestone.status === 'in_progress'
                                  ? 'En Progreso'
                                  : 'Pendiente'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Deliverables */}
                <Card variant="bordered">
                  <CardHeader>
                    <CardTitle>Entregables</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedProject.deliverables.map((deliverable: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3">
                          <DocumentTextIcon className="h-5 w-5 text-secondary-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-secondary-900 dark:text-white">
                              {deliverable.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-secondary-500">{deliverable.date}</span>
                              <Badge
                                variant="secondary"
                                size="sm"
                                className={
                                  deliverable.status === 'approved'
                                    ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
                                    : 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300'
                                }
                              >
                                {deliverable.status === 'approved' ? 'Aprobado' : 'En Revisión'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href="/dashboard/deliverables">
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    Ver Entregables
                  </Link>
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <Link href="/dashboard/messages">
                    <ChatBubbleLeftIcon className="h-4 w-4 mr-2" />
                    Contactar Equipo
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
