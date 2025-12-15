'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  ChatBubbleLeftRightIcon,
  ClockIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadConversations();
  }, [statusFilter]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/conversations?status=${statusFilter}`);
      setConversations(response.data?.data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: any; text: string }> = {
      active: { variant: 'primary', text: 'Activa' },
      archived: { variant: 'secondary', text: 'Archivada' },
      closed: { variant: 'secondary', text: 'Cerrada' },
    };
    const badge = badges[status] || { variant: 'secondary', text: status };
    return <Badge variant={badge.variant} size="sm">{badge.text}</Badge>;
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
              Conversaciones
            </h1>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">
              Visualiza y gestiona todas las conversaciones del sistema
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card variant="bordered">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                Todas
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
              >
                Activas
              </Button>
              <Button
                variant={statusFilter === 'archived' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('archived')}
              >
                Archivadas
              </Button>
              <Button
                variant={statusFilter === 'closed' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('closed')}
              >
                Cerradas
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Conversations List */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Todas las conversaciones ({conversations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12">
                <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto text-secondary-400 mb-4" />
                <p className="text-secondary-600 dark:text-secondary-400">
                  No hay conversaciones para mostrar
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {conversations.map((conversation) => (
                  <Link
                    key={conversation.id}
                    href={`/admin/conversations/${conversation.id}`}
                    className="block p-4 rounded-lg border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-900 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-secondary-900 dark:text-white">
                            {conversation.title}
                          </h3>
                          {getStatusBadge(conversation.status)}
                          {conversation.totalUnread > 0 && (
                            <Badge variant="primary" size="sm">
                              {conversation.totalUnread} sin leer
                            </Badge>
                          )}
                        </div>
                        {conversation.projectName && (
                          <p className="text-sm text-secondary-600 dark:text-secondary-400">
                            Proyecto: {conversation.projectName}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm text-secondary-500">
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          <span>{formatDate(conversation.lastMessageTime)}</span>
                        </div>
                      </div>
                    </div>

                    {conversation.lastMessage && (
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2 line-clamp-2">
                        {conversation.lastMessage}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-secondary-500">
                      <UserGroupIcon className="h-4 w-4" />
                      <span>
                        {conversation.participants.map((p: any) => p.name).join(', ')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
