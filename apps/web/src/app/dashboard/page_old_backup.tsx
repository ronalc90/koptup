'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  FolderIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PlusIcon,
  ArrowRightIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const router = useRouter();
  const t = useTranslations('dashboardPage');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [projects, setProjects] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      const [statsData, projectsData] = await Promise.all([
        api.getDashboardStats(),
        api.getUserProjects(),
      ]);
      setDashboardStats(statsData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleNewProject = () => {
    // Redirigir a la página de contacto con parámetro de nuevo proyecto
    router.push('/contact?type=new-project');
  };

  const handleViewProjectDetails = (projectId: string) => {
    // Por ahora redirigir a contacto, luego se puede crear página de detalles
    router.push(`/contact?type=project-inquiry&projectId=${projectId}`);
  };

  const handleNotifications = () => {
    // Mostrar notificaciones (por ahora redirect a contacto)
    router.push('/contact?type=support');
  };

  const handleSettings = () => {
    // Redirigir a configuración (por ahora contacto)
    router.push('/contact?type=account-settings');
  };

  const handleReports = () => {
    // Redirigir a reportes (por ahora contacto)
    router.push('/contact?type=reports');
  };

  const handleAnalytics = () => {
    // Redirigir a analytics (por ahora contacto)
    router.push('/contact?type=analytics');
  };

  const stats = dashboardStats ? [
    {
      title: t('stats.activeProjects'),
      value: dashboardStats.totalProjects.toString(),
      icon: FolderIcon,
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-100 dark:bg-primary-950',
    },
    {
      title: t('stats.inProgress'),
      value: dashboardStats.tasks.inProgress.toString(),
      icon: ClockIcon,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-950',
    },
    {
      title: t('stats.completed'),
      value: dashboardStats.tasks.completed.toString(),
      icon: CheckCircleIcon,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-950',
    },
    {
      title: 'Total Tasks',
      value: dashboardStats.tasks.total.toString(),
      icon: ExclamationCircleIcon,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-950',
    },
  ] : [];

  const recentActivity = dashboardStats?.recentActivity || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="primary" size="sm">{t('projectStatus.active')}</Badge>;
      case 'planning':
        return <Badge variant="secondary" size="sm">{t('projectStatus.pending')}</Badge>;
      case 'on_hold':
        return <Badge variant="secondary" size="sm" className="bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300">On Hold</Badge>;
      case 'completed':
        return <Badge variant="secondary" size="sm" className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300">{t('projectStatus.completed')}</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" size="sm" className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">Cancelled</Badge>;
      default:
        return <Badge variant="secondary" size="sm">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600 dark:text-secondary-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-black">
      {/* Header */}
      <header className="bg-white dark:bg-secondary-950 border-b border-secondary-200 dark:border-secondary-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="font-display font-bold text-xl text-secondary-900 dark:text-white">
                KopTup
              </span>
            </Link>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleNotifications}
                className="p-2 rounded-lg text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800"
              >
                <BellIcon className="h-6 w-6" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-950">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                      {user?.name?.[0] || 'U'}
                    </div>
                  )}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-secondary-900 dark:text-white">
                    {user?.name}
                  </p>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleSettings}>
                  <Cog6ToothIcon className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
            {t('welcome')}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            {t('subtitle')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} variant="bordered" className="hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-secondary-900 dark:text-white">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Projects and Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Projects List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
                {t('myProjects')}
              </h2>
              <Button size="sm" onClick={handleNewProject}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Nuevo Proyecto
              </Button>
            </div>

            <div className="space-y-4">
              {projects.map((project) => (
                <Card key={project.id} variant="bordered" className="hover:shadow-medium transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">{project.name}</CardTitle>
                          {getStatusBadge(project.status)}
                        </div>
                        <CardDescription>{project.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
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

                    {/* Project Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-secondary-600 dark:text-secondary-400 mb-1">Manager</p>
                        <p className="font-semibold text-secondary-900 dark:text-white">{project.manager_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-secondary-600 dark:text-secondary-400 mb-1">{t('dueDate')}</p>
                        <p className="font-semibold text-secondary-900 dark:text-white">
                          {project.end_date ? new Date(project.end_date).toLocaleDateString('es-ES') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-secondary-600 dark:text-secondary-400 mb-1">Tareas</p>
                        <p className="font-semibold text-secondary-900 dark:text-white">
                          {project.completed_tasks}/{project.total_tasks}
                        </p>
                      </div>
                      <div>
                        <p className="text-secondary-600 dark:text-secondary-400 mb-1">Equipo</p>
                        <p className="font-semibold text-secondary-900 dark:text-white">
                          {project.team_size} {project.team_size === 1 ? 'member' : 'members'}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      fullWidth
                      className="group"
                      onClick={() => handleViewProjectDetails(project.id)}
                    >
                      Ver detalles
                      <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle>{t('recentActivity')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length > 0 ? recentActivity.map((activity: any, idx: number) => (
                    <div key={idx} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary-600 mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-secondary-900 dark:text-white mb-1">
                          {activity.details || activity.action}
                        </p>
                        <p className="text-xs text-secondary-600 dark:text-secondary-400">
                          {activity.project_name} • {activity.user_name}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-secondary-500 dark:text-secondary-400">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle>{t('quickActions')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  className="justify-start"
                  onClick={handleReports}
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  {t('reports')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  className="justify-start"
                  asChild
                >
                  <Link href="/contact">
                    <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                    {t('support')}
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  className="justify-start"
                  onClick={handleAnalytics}
                >
                  <ChartBarIcon className="h-4 w-4 mr-2" />
                  {t('analytics')}
                </Button>
              </CardContent>
            </Card>

            {/* Help */}
            <Card variant="elevated" className="bg-primary-50 dark:bg-primary-950 border-primary-200 dark:border-primary-800">
              <CardContent className="p-6 text-center">
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-primary-600 dark:text-primary-400 mx-auto mb-3" />
                <h3 className="font-semibold text-secondary-900 dark:text-white mb-2">
                  ¿Necesitas ayuda?
                </h3>
                <p className="text-sm text-secondary-700 dark:text-secondary-300 mb-4">
                  Nuestro equipo está listo para asistirte
                </p>
                <Button size="sm" fullWidth asChild>
                  <Link href="/contact">Contactar Soporte</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
