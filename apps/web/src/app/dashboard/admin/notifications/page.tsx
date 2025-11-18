'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  BellIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
  ChartBarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  recent: any[];
}

export default function AdminNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    type: 'system' as 'order' | 'project' | 'billing' | 'message' | 'system',
    title: '',
    message: '',
    targetType: 'all' as 'all' | 'specific',
    targetUserIds: [] as string[],
    actionUrl: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, usersData] = await Promise.all([
        api.getNotificationStats(),
        // Obtener lista de usuarios para el selector
        api.get('/api/users').then(res => res.data.data).catch(() => []),
      ]);

      setStats(statsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const notificationData: any = {
        type: formData.type,
        title: formData.title,
        message: formData.message,
        actionUrl: formData.actionUrl || undefined,
      };

      if (formData.targetType === 'specific' && formData.targetUserIds.length > 0) {
        notificationData.targetUserIds = formData.targetUserIds;
      }

      const response = await api.createNotification(notificationData);

      alert(response.message || 'Notificación enviada exitosamente');

      // Reset form
      setFormData({
        type: 'system',
        title: '',
        message: '',
        targetType: 'all',
        targetUserIds: [],
        actionUrl: '',
      });

      // Reload stats
      loadData();
    } catch (error: any) {
      console.error('Error sending notification:', error);
      alert(error.response?.data?.message || 'Error al enviar notificación');
    } finally {
      setSending(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const badges: Record<string, { variant: any; text: string }> = {
      order: { variant: 'primary', text: 'Pedido' },
      project: { variant: 'info', text: 'Proyecto' },
      billing: { variant: 'success', text: 'Facturación' },
      message: { variant: 'warning', text: 'Mensaje' },
      system: { variant: 'default', text: 'Sistema' },
    };
    const badge = badges[type] || { variant: 'default', text: type };
    return <Badge variant={badge.variant} size="sm">{badge.text}</Badge>;
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
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
            Panel de Notificaciones - Admin
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Envía notificaciones a los usuarios del sistema
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card variant="bordered">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">
                    Total Enviadas
                  </p>
                  <p className="text-3xl font-bold text-secondary-900 dark:text-white">
                    {stats?.total || 0}
                  </p>
                </div>
                <BellIcon className="h-12 w-12 text-secondary-400" />
              </div>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">
                    No Leídas
                  </p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stats?.unread || 0}
                  </p>
                </div>
                <ChartBarIcon className="h-12 w-12 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">
                    Usuarios Activos
                  </p>
                  <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                    {users.length}
                  </p>
                </div>
                <UserGroupIcon className="h-12 w-12 text-primary-400" />
              </div>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">
                    Sistema
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {stats?.byType?.system || 0}
                  </p>
                </div>
                <CheckCircleIcon className="h-12 w-12 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form to send notifications */}
          <div className="lg:col-span-2">
            <Card variant="bordered">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <PaperAirplaneIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  <CardTitle>Enviar Nueva Notificación</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-900 dark:text-white mb-2">
                      Tipo de Notificación
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="system">Sistema</option>
                      <option value="order">Pedido</option>
                      <option value="project">Proyecto</option>
                      <option value="billing">Facturación</option>
                      <option value="message">Mensaje</option>
                    </select>
                  </div>

                  {/* Title */}
                  <Input
                    label="Título"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Título de la notificación"
                    required
                  />

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-900 dark:text-white mb-2">
                      Mensaje
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Escribe el mensaje de la notificación..."
                      rows={4}
                      className="w-full px-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>

                  {/* Action URL (optional) */}
                  <Input
                    label="URL de Acción (opcional)"
                    value={formData.actionUrl}
                    onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                    placeholder="/dashboard/orders/ORD-001"
                  />

                  {/* Target */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-900 dark:text-white mb-2">
                      Destinatarios
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 p-3 rounded-lg border border-secondary-300 dark:border-secondary-700 cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-900">
                        <input
                          type="radio"
                          name="targetType"
                          value="all"
                          checked={formData.targetType === 'all'}
                          onChange={(e) => setFormData({ ...formData, targetType: 'all', targetUserIds: [] })}
                          className="w-4 h-4 text-primary-600"
                        />
                        <div>
                          <p className="font-medium text-secondary-900 dark:text-white">
                            Todos los clientes
                          </p>
                          <p className="text-sm text-secondary-600 dark:text-secondary-400">
                            Enviar a todos los usuarios con rol de cliente
                          </p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 rounded-lg border border-secondary-300 dark:border-secondary-700 cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-900">
                        <input
                          type="radio"
                          name="targetType"
                          value="specific"
                          checked={formData.targetType === 'specific'}
                          onChange={(e) => setFormData({ ...formData, targetType: 'specific' })}
                          className="w-4 h-4 text-primary-600"
                        />
                        <div>
                          <p className="font-medium text-secondary-900 dark:text-white">
                            Usuarios específicos
                          </p>
                          <p className="text-sm text-secondary-600 dark:text-secondary-400">
                            Seleccionar usuarios manualmente
                          </p>
                        </div>
                      </label>

                      {formData.targetType === 'specific' && (
                        <div className="ml-7">
                          <select
                            multiple
                            value={formData.targetUserIds}
                            onChange={(e) => {
                              const selected = Array.from(e.target.selectedOptions, option => option.value);
                              setFormData({ ...formData, targetUserIds: selected });
                            }}
                            className="w-full px-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                            size={5}
                          >
                            {users.map((user) => (
                              <option key={user._id} value={user._id}>
                                {user.name || user.email} ({user.email})
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-secondary-500 mt-2">
                            Mantén presionado Ctrl/Cmd para seleccionar múltiples usuarios
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="flex gap-3">
                    <Button type="submit" isLoading={sending} fullWidth>
                      <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                      Enviar Notificación
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Recent notifications */}
          <div>
            <Card variant="bordered">
              <CardHeader>
                <CardTitle>Notificaciones Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.recent && stats.recent.length > 0 ? (
                    stats.recent.map((notif, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-secondary-200 dark:border-secondary-700"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-sm text-secondary-900 dark:text-white">
                            {notif.title}
                          </p>
                          {getTypeBadge(notif.type)}
                        </div>
                        <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-2">
                          Para: {notif.recipient}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-secondary-500">
                            {notif.sentBy}
                          </span>
                          {notif.isRead ? (
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                          ) : (
                            <BellIcon className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-secondary-600 dark:text-secondary-400 py-8">
                      No hay notificaciones recientes
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
