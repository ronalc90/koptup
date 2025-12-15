'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  ShoppingBagIcon,
  FolderIcon,
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    // Check if user is admin and redirect to admin panel
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.role === 'admin') {
        router.push('/admin');
        return;
      }
    }
    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      // Cargar datos del dashboard desde las APIs
      const [stats, projects] = await Promise.all([
        api.getDashboardStats(),
        api.getUserProjects(),
      ]);

      // Calcular estadísticas de proyectos
      const activeProjects = projects.filter((p: any) => p.status === 'active' || p.status === 'in_progress');
      const completedProjects = projects.filter((p: any) => p.status === 'completed');
      const avgProgress = activeProjects.length > 0
        ? Math.round(activeProjects.reduce((sum: number, p: any) => sum + (p.progress || 0), 0) / activeProjects.length)
        : 0;

      // Tomar los proyectos más recientes
      const recentProjects = activeProjects.slice(0, 2).map((p: any) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        progress: p.progress || 0,
        nextMilestone: 'En proceso',
        dueDate: p.end_date || 'Sin fecha',
      }));

      setDashboardData({
        orders: {
          active: 0,
          pending: 0,
          completed: 0,
          total: 0,
        },
        projects: {
          active: activeProjects.length,
          inProgress: activeProjects.length,
          completed: completedProjects.length,
          total: projects.length,
          avgProgress,
        },
        billing: {
          pending: 0,
          overdue: 0,
          paid: 0,
          nextDue: '',
        },
        messages: {
          unread: 0,
          total: 0,
        },
        recentOrders: [],
        recentProjects,
        upcomingDeadlines: [],
      });
    } catch (error) {
      // Silently use empty data when API is unavailable
      setDashboardData({
        orders: { active: 0, pending: 0, completed: 0, total: 0 },
        projects: { active: 0, inProgress: 0, completed: 0, total: 0, avgProgress: 0 },
        billing: { pending: 0, overdue: 0, paid: 0, nextDue: '' },
        messages: { unread: 0, total: 0 },
        recentOrders: [],
        recentProjects: [],
        upcomingDeadlines: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-secondary-600 dark:text-secondary-400">Cargando dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: any; text: string }> = {
      active: { variant: 'primary', text: 'Activo' },
      in_progress: { variant: 'primary', text: 'En Proceso' },
      pending: { variant: 'secondary', text: 'Pendiente' },
      completed: { variant: 'secondary', text: 'Completado' },
      cancelled: { variant: 'secondary', text: 'Cancelado' },
    };
    const badge = badges[status] || { variant: 'secondary', text: status };
    return <Badge variant={badge.variant as any} size="sm">{badge.text}</Badge>;
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') {
      return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
    }
    return <ClockIcon className="h-5 w-5 text-yellow-600" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
            Bienvenido de nuevo! 👋
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Aquí está un resumen de tu actividad reciente
          </p>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Orders KPI */}
          <Card variant="bordered" className="hover:shadow-medium transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                  <ShoppingBagIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <Link href="/dashboard/orders">
                  <ArrowRightIcon className="h-5 w-5 text-secondary-400 hover:text-primary-600" />
                </Link>
              </div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">Pedidos Activos</p>
              <p className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
                {dashboardData.orders.active}
              </p>
              <p className="text-xs text-secondary-500">
                {dashboardData.orders.pending} pendientes de confirmación
              </p>
            </CardContent>
          </Card>

          {/* Projects KPI */}
          <Card variant="bordered" className="hover:shadow-medium transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950 rounded-lg flex items-center justify-center">
                  <FolderIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <Link href="/dashboard/projects">
                  <ArrowRightIcon className="h-5 w-5 text-secondary-400 hover:text-primary-600" />
                </Link>
              </div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">Proyectos Activos</p>
              <p className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
                {dashboardData.projects.active}
              </p>
              <p className="text-xs text-secondary-500">
                Progreso promedio: {dashboardData.projects.avgProgress}%
              </p>
            </CardContent>
          </Card>

          {/* Billing KPI */}
          <Card variant="bordered" className="hover:shadow-medium transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center">
                  <CreditCardIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <Link href="/dashboard/billing">
                  <ArrowRightIcon className="h-5 w-5 text-secondary-400 hover:text-primary-600" />
                </Link>
              </div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">Saldo Pendiente</p>
              <p className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
                ${dashboardData.billing.pending.toFixed(2)}
              </p>
              <p className="text-xs text-secondary-500">
                Próximo vencimiento: {dashboardData.billing.nextDue}
              </p>
            </CardContent>
          </Card>

          {/* Messages KPI */}
          <Card variant="bordered" className="hover:shadow-medium transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <Link href="/dashboard/messages">
                  <ArrowRightIcon className="h-5 w-5 text-secondary-400 hover:text-primary-600" />
                </Link>
              </div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">Mensajes No Leídos</p>
              <p className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
                {dashboardData.messages.unread}
              </p>
              <p className="text-xs text-secondary-500">
                {dashboardData.messages.total} mensajes totales
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2 space-y-6">
            <Card variant="bordered">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pedidos Recientes</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/orders">Ver todos</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recentOrders.map((order: any) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-900 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-secondary-900 dark:text-white">{order.name}</p>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-secondary-600 dark:text-secondary-400">
                          <span>{order.id}</span>
                          <span>•</span>
                          <span>{order.date}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-secondary-900 dark:text-white">
                          ${order.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Projects */}
            <Card variant="bordered">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Proyectos en Curso</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/projects">Ver todos</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recentProjects.map((project: any) => (
                    <div
                      key={project.id}
                      className="p-4 rounded-lg border border-secondary-200 dark:border-secondary-700"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-secondary-900 dark:text-white mb-1">
                            {project.name}
                          </p>
                          <p className="text-sm text-secondary-600 dark:text-secondary-400">
                            Próximo hito: {project.nextMilestone}
                          </p>
                        </div>
                        {getStatusBadge(project.status)}
                      </div>
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
                        <div className="flex items-center gap-2 text-xs text-secondary-500">
                          <CalendarIcon className="h-4 w-4" />
                          <span>Fecha límite: {project.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Deadlines */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle>Próximos Vencimientos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.upcomingDeadlines.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg bg-secondary-50 dark:bg-secondary-900"
                    >
                      {getPriorityIcon(item.priority)}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-secondary-900 dark:text-white mb-1">
                          {item.name}
                        </p>
                        <p className="text-xs text-secondary-600 dark:text-secondary-400">
                          {item.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" fullWidth className="justify-start" asChild>
                  <Link href="/contact?type=new-project">
                    <FolderIcon className="h-4 w-4 mr-2" />
                    Nuevo Proyecto
                  </Link>
                </Button>
                <Button variant="outline" size="sm" fullWidth className="justify-start" asChild>
                  <Link href="/dashboard/messages">
                    <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                    Contactar Soporte
                  </Link>
                </Button>
                <Button variant="outline" size="sm" fullWidth className="justify-start" asChild>
                  <Link href="/dashboard/billing">
                    <CreditCardIcon className="h-4 w-4 mr-2" />
                    Pagar Factura
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
