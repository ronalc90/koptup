'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
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
  const t = useTranslations('projectsPage');
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProjects = async () => {
    try {
      // Cargar proyectos desde la API
      const projectsData = await api.getUserProjects();

      // Formatear proyectos de la API
      const formattedProjects = projectsData.map((p: any) => ({
        id: p._id || p.id,
        name: p.name,
        description: p.description || t('noDescription'),
        status: p.status || 'active',
        progress: p.progress || 0,
        startDate: p.start_date ? new Date(p.start_date).toISOString().split('T')[0] : t('noDate'),
        endDate: p.end_date ? new Date(p.end_date).toISOString().split('T')[0] : t('noDate'),
        manager: p.manager_name || t('unassigned'),
        teamSize: p.team_size || 0,
        budget: p.budget || 0,
        spent: p.actual_hours ? (p.actual_hours / (p.estimated_hours || 1)) * (p.budget || 0) : 0,
        totalTasks: p.total_tasks || 0,
        completedTasks: p.completed_tasks || 0,
        phases: [
          {
            name: t('phases.planning'),
            status: p.progress > 0 ? 'completed' : 'in_progress',
            progress: p.progress > 0 ? 100 : 50,
            dueDate: p.start_date ? new Date(p.start_date).toISOString().split('T')[0] : t('noDate')
          },
          {
            name: t('phases.development'),
            status: p.progress > 0 && p.progress < 100 ? 'in_progress' : p.progress === 100 ? 'completed' : 'pending',
            progress: p.progress || 0,
            dueDate: p.end_date ? new Date(p.end_date).toISOString().split('T')[0] : t('noDate')
          },
          {
            name: t('phases.qa'),
            status: p.progress > 80 ? 'in_progress' : 'pending',
            progress: p.progress > 80 ? (p.progress - 80) * 5 : 0,
            dueDate: p.end_date ? new Date(p.end_date).toISOString().split('T')[0] : t('noDate')
          },
          {
            name: t('phases.delivery'),
            status: p.status === 'completed' ? 'completed' : 'pending',
            progress: p.status === 'completed' ? 100 : 0,
            dueDate: p.end_date ? new Date(p.end_date).toISOString().split('T')[0] : t('noDate')
          },
        ],
        milestones: [],
        deliverables: [],
      }));

      setProjects(formattedProjects);
      if (formattedProjects.length > 0) {
        setSelectedProject(formattedProjects[0]);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { className: string; text: string }> = {
      planning: { className: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300', text: t('status.planning') },
      active: { className: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300', text: t('status.active') },
      on_hold: { className: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300', text: t('status.on_hold') },
      completed: { className: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300', text: t('status.completed') },
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
              {t('title')}
            </h1>
            <p className="text-secondary-600 dark:text-secondary-400">
              {t('subtitle')}
            </p>
          </div>
          <Button asChild>
            <Link href="/contact?type=new-project">{t('newProject')}</Link>
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card variant="bordered">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">
                  {t('noProjects')}
                </h3>
                <p className="text-secondary-600 dark:text-secondary-400 mb-6">
                  {t('noProjectsDesc')}
                </p>
                <Button asChild>
                  <Link href="/contact?type=new-project">{t('requestNewProject')}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
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
                      <span className="text-secondary-600 dark:text-secondary-400">{t('progress')}</span>
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
                    <span>{project.teamSize} {t('members')}</span>
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
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">{t('manager')}</p>
                      <p className="font-semibold text-secondary-900 dark:text-white">
                        {selectedProject.manager}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">{t('team')}</p>
                      <p className="font-semibold text-secondary-900 dark:text-white">
                        {selectedProject.teamSize} {t('members')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">{t('startDate')}</p>
                      <p className="font-semibold text-secondary-900 dark:text-white">
                        {selectedProject.startDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">{t('deliveryDate')}</p>
                      <p className="font-semibold text-secondary-900 dark:text-white">
                        {selectedProject.endDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-secondary-50 dark:bg-secondary-900 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">
                        {t('budgetUsed')}
                      </p>
                      <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                        ${selectedProject.spent.toLocaleString()} / ${selectedProject.budget.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">
                        {t('remaining')}
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
                  <CardTitle>{t('projectPhases')}</CardTitle>
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
                                {t('progress')}
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
                    <CardTitle>{t('milestones')}</CardTitle>
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
                                  ? t('status.completed')
                                  : milestone.status === 'in_progress'
                                  ? t('status.in_progress')
                                  : t('status.pending')}
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
                    <CardTitle>{t('deliverables')}</CardTitle>
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
                                {deliverable.status === 'approved' ? t('status.approved') : t('status.in_review')}
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
                    {t('viewDeliverables')}
                  </Link>
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <Link href="/dashboard/messages">
                    <ChatBubbleLeftIcon className="h-4 w-4 mr-2" />
                    {t('contactTeam')}
                  </Link>
                </Button>
              </div>
            </div>
          )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
