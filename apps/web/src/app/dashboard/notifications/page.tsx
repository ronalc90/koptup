'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  BellIcon,
  CheckIcon,
  ShoppingBagIcon,
  FolderIcon,
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Notification {
  id: string;
  type: 'order' | 'project' | 'billing' | 'message' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: {
    orderId?: string;
    projectId?: string;
    invoiceId?: string;
    amount?: number;
  };
}

type NotificationFilter = 'all' | 'order' | 'project' | 'billing' | 'message' | 'system';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [filter, notifications]);

  const loadNotifications = async () => {
    try {
      // Try to fetch from API
      const data = await api.getNotifications(filter !== 'all' ? filter : undefined, false);
      setNotifications(data);
    } catch (error) {
      // Silently use fallback data when API is unavailable

      // Fallback to mock data if API fails
      const mockNotifications: Notification[] = [
        {
          id: 'notif-001',
          type: 'order',
          title: 'Nuevo pedido confirmado',
          message: 'Tu pedido ORD-005 ha sido confirmado y está en proceso.',
          timestamp: '2025-10-11T10:30:00',
          isRead: false,
          actionUrl: '/dashboard/orders/ORD-005',
          metadata: { orderId: 'ORD-005' },
        },
        {
          id: 'notif-002',
          type: 'project',
          title: 'Hito del proyecto completado',
          message: 'Se ha completado el Hito 2 del proyecto "Sistema de gestión de inventario".',
          timestamp: '2025-10-11T09:15:00',
          isRead: false,
          actionUrl: '/dashboard/projects/PRJ-001',
          metadata: { projectId: 'PRJ-001' },
        },
        {
          id: 'notif-003',
          type: 'billing',
          title: 'Nueva factura disponible',
          message: 'La factura INV-2025-042 por $3,500.00 está lista para descargar.',
          timestamp: '2025-10-11T08:00:00',
          isRead: false,
          actionUrl: '/dashboard/billing',
          metadata: { invoiceId: 'INV-2025-042', amount: 3500 },
        },
        {
          id: 'notif-004',
          type: 'message',
          title: 'Nuevo mensaje recibido',
          message: 'Tienes un nuevo mensaje sobre el proyecto "Aplicación móvil iOS/Android".',
          timestamp: '2025-10-10T16:45:00',
          isRead: true,
          actionUrl: '/dashboard/messages',
          metadata: { projectId: 'PRJ-002' },
        },
        {
          id: 'notif-005',
          type: 'project',
          title: 'Actualización de cronograma',
          message: 'El cronograma del proyecto "Website corporativo" ha sido actualizado.',
          timestamp: '2025-10-10T14:20:00',
          isRead: true,
          actionUrl: '/dashboard/projects/PRJ-003',
          metadata: { projectId: 'PRJ-003' },
        },
        {
          id: 'notif-006',
          type: 'order',
          title: 'Pedido enviado',
          message: 'Tu pedido ORD-003 ha sido enviado y está en camino.',
          timestamp: '2025-10-09T11:30:00',
          isRead: true,
          actionUrl: '/dashboard/orders/ORD-003',
          metadata: { orderId: 'ORD-003' },
        },
        {
          id: 'notif-007',
          type: 'billing',
          title: 'Pago procesado',
          message: 'Tu pago de $2,500.00 ha sido procesado exitosamente.',
          timestamp: '2025-10-08T10:15:00',
          isRead: true,
          actionUrl: '/dashboard/billing',
          metadata: { amount: 2500 },
        },
        {
          id: 'notif-008',
          type: 'message',
          title: 'Respuesta del equipo',
          message: 'El equipo de KopTup ha respondido a tu consulta sobre el proyecto PRJ-001.',
          timestamp: '2025-10-07T15:00:00',
          isRead: true,
          actionUrl: '/dashboard/messages',
          metadata: { projectId: 'PRJ-001' },
        },
        {
          id: 'notif-009',
          type: 'system',
          title: 'Mantenimiento programado',
          message: 'Realizaremos mantenimiento del sistema el sábado de 2:00 AM a 4:00 AM.',
          timestamp: '2025-10-06T12:00:00',
          isRead: true,
        },
        {
          id: 'notif-010',
          type: 'project',
          title: 'Entregable disponible',
          message: 'Un nuevo entregable está disponible para el proyecto "Chatbot con IA".',
          timestamp: '2025-10-05T09:30:00',
          isRead: true,
          actionUrl: '/dashboard/deliverables',
          metadata: { projectId: 'PRJ-004' },
        },
      ];

      setNotifications(mockNotifications);
    } finally {
      setLoading(false);
    }
  };

  const filterNotifications = () => {
    if (filter === 'all') {
      setFilteredNotifications(notifications);
    } else {
      setFilteredNotifications(notifications.filter(notif => notif.type === filter));
    }
  };

  const markAsRead = async (id: string) => {
    try {
      // Try to mark as read via API
      await api.markNotificationAsRead(id);
    } catch (error) {
      // Silently continue if API is unavailable
    } finally {
      // Update locally regardless of API response
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      // Try to mark all as read via API
      await api.markAllNotificationsAsRead();
    } catch (error) {
      // Silently continue if API is unavailable
    } finally {
      // Update locally regardless of API response
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      // Try to delete via API
      await api.deleteNotification(id);
    } catch (error) {
      // Silently continue if API is unavailable
    } finally {
      // Remove locally regardless of API response
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const iconClass = "h-6 w-6";
    switch (type) {
      case 'order':
        return <ShoppingBagIcon className={iconClass} />;
      case 'project':
        return <FolderIcon className={iconClass} />;
      case 'billing':
        return <CreditCardIcon className={iconClass} />;
      case 'message':
        return <ChatBubbleLeftRightIcon className={iconClass} />;
      case 'system':
        return <Cog6ToothIcon className={iconClass} />;
      default:
        return <BellIcon className={iconClass} />;
    }
  };

  const getNotificationBadge = (type: Notification['type']) => {
    const badges: Record<Notification['type'], { variant: any; text: string }> = {
      order: { variant: 'primary', text: 'Pedido' },
      project: { variant: 'info', text: 'Proyecto' },
      billing: { variant: 'success', text: 'Facturación' },
      message: { variant: 'warning', text: 'Mensaje' },
      system: { variant: 'default', text: 'Sistema' },
    };
    const badge = badges[type];
    return <Badge variant={badge.variant} size="sm">{badge.text}</Badge>;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `Hace ${days} día${days !== 1 ? 's' : ''}`;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filterOptions = [
    { value: 'all' as NotificationFilter, label: 'Todas', icon: BellIcon },
    { value: 'order' as NotificationFilter, label: 'Pedidos', icon: ShoppingBagIcon },
    { value: 'project' as NotificationFilter, label: 'Proyectos', icon: FolderIcon },
    { value: 'billing' as NotificationFilter, label: 'Facturación', icon: CreditCardIcon },
    { value: 'message' as NotificationFilter, label: 'Mensajes', icon: ChatBubbleLeftRightIcon },
  ];

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
              Notificaciones
            </h1>
            <p className="text-secondary-600 dark:text-secondary-400">
              Mantente al tanto de todas las actualizaciones
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                <CheckIcon className="h-5 w-5 mr-2" />
                Marcar todas como leídas
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/dashboard/settings">
                <Cog6ToothIcon className="h-5 w-5 mr-2" />
                Preferencias
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="bordered" padding="sm">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                {unreadCount}
              </p>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Sin leer
              </p>
            </div>
          </Card>
          <Card variant="bordered" padding="sm">
            <div className="text-center">
              <p className="text-3xl font-bold text-secondary-900 dark:text-white mb-1">
                {notifications.length}
              </p>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Total
              </p>
            </div>
          </Card>
          <Card variant="bordered" padding="sm">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {notifications.filter(n => n.type === 'project').length}
              </p>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Proyectos
              </p>
            </div>
          </Card>
          <Card variant="bordered" padding="sm">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                {notifications.filter(n => n.type === 'billing').length}
              </p>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Facturación
              </p>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card variant="bordered">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setFilter(option.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === option.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{option.label}</span>
                    {option.value === 'all' && unreadCount > 0 && (
                      <Badge variant="danger" size="sm" className="ml-1">
                        {unreadCount}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card variant="bordered">
              <CardContent className="p-12 text-center">
                <BellIcon className="h-16 w-16 text-secondary-400 mx-auto mb-4" />
                <p className="text-secondary-600 dark:text-secondary-400">
                  No hay notificaciones para mostrar
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                variant="bordered"
                className={`transition-all ${
                  !notification.isRead
                    ? 'border-l-4 border-l-primary-500 bg-primary-50/30 dark:bg-primary-950/30'
                    : 'hover:shadow-medium'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-3 rounded-lg flex-shrink-0 ${
                      !notification.isRead
                        ? 'bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400'
                        : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`font-semibold ${
                            !notification.isRead
                              ? 'text-secondary-900 dark:text-white'
                              : 'text-secondary-700 dark:text-secondary-300'
                          }`}>
                            {notification.title}
                          </h3>
                          {getNotificationBadge(notification.type)}
                          {!notification.isRead && (
                            <Badge variant="danger" size="sm">
                              Nueva
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-secondary-500">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        <div className="flex items-center gap-2">
                          {notification.actionUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Link href={notification.actionUrl}>
                                Ver detalles
                              </Link>
                            </Button>
                          )}
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-2 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-950 transition-colors"
                              title="Marcar como leída"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950 transition-colors"
                            title="Eliminar notificación"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
