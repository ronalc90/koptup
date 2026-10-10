'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { PortalEmpty, PortalError, PortalLoading } from '@/components/dashboard/PortalStates';
import { useErrorText } from '@/hooks/useErrorText';
import { apiRequest } from '@/lib/demo-system';
import { formatDateTime, refreshPanelCounts } from '@/lib/portal';
import {
  BellIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  DocumentTextIcon,
  FolderIcon,
  ShoppingBagIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

type NotificationType = 'order' | 'project' | 'billing' | 'message' | 'deliverable' | 'system' | 'task';

interface PortalNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: { evento?: string; params?: Record<string, string | number> } & Record<string, unknown>;
}

const FILTERS: Array<'all' | NotificationType> = ['all', 'order', 'project', 'deliverable', 'billing', 'message'];

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  order: ShoppingBagIcon,
  project: FolderIcon,
  deliverable: DocumentTextIcon,
  billing: CreditCardIcon,
  message: ChatBubbleLeftRightIcon,
};

/** «Hace 5 minutos» en el idioma de la persona. */
function relativeTime(iso: string, locale: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(diffMs)) return '';
  const rtf = new Intl.RelativeTimeFormat(locale === 'en' ? 'en' : 'es', { numeric: 'auto' });
  const minutes = Math.round(diffMs / 60000);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return rtf.format(days, 'day');
  return formatDateTime(iso, locale);
}

function NotificationsContent() {
  const t = useTranslations('notificationsPage');
  const tn = useTranslations('portalNotifications');
  const tc = useTranslations('portalCommon');
  const locale = useLocale();
  const errorText = useErrorText();
  const [items, setItems] = useState<PortalNotification[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState<'all' | NotificationType>('all');

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const data = await apiRequest<PortalNotification[]>('/notifications');
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setItems(null);
      setLoadError(errorText(err));
    }
  }, [errorText]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Título y texto en el idioma de la persona (el backend guarda el evento y sus datos). */
  const render = useCallback(
    (n: PortalNotification): { title: string; message: string } => {
      const ev = n.metadata?.evento;
      if (!ev || !tn.has(`${ev}.title`)) return { title: n.title, message: n.message };
      const raw = n.metadata?.params ?? {};
      const params: Record<string, string> = { id: '', name: '', title: '', project: '', number: '', amount: '', reason: '', status: '' };
      for (const [k, v] of Object.entries(raw)) params[k] = String(v ?? '');
      if (params.status) {
        const key = ev === 'project_status' ? `projectStatus.${params.status}` : `orderStatus.${params.status}`;
        if (tc.has(key)) params.status = tc(key);
      }
      return { title: tn(`${ev}.title`, params), message: tn(`${ev}.message`, params) };
    },
    [tn, tc],
  );

  const markAsRead = async (id: string) => {
    try {
      await apiRequest(`/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' });
      setItems((prev) => (prev ? prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)) : prev));
      refreshPanelCounts();
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const markAll = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'POST' });
      setItems((prev) => (prev ? prev.map((n) => ({ ...n, isRead: true })) : prev));
      refreshPanelCounts();
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const remove = async (id: string) => {
    try {
      await apiRequest(`/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setItems((prev) => (prev ? prev.filter((n) => n.id !== id) : prev));
      refreshPanelCounts();
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const visible = useMemo(() => (items ?? []).filter((n) => filter === 'all' || n.type === filter), [items, filter]);
  const unread = (items ?? []).filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">{t('title')}</h1>
          <p className="text-secondary-600 dark:text-secondary-400">{t('subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {unread > 0 && (
            <Button variant="outline" onClick={() => void markAll()}>
              <CheckIcon className="h-5 w-5 mr-2" />
              {t('markAll')}
            </Button>
          )}
          <Button variant="ghost" asChild>
            <Link href="/dashboard/settings">
              <Cog6ToothIcon className="h-5 w-5 mr-2" />
              {t('preferences')}
            </Link>
          </Button>
        </div>
      </div>

      {loadError ? (
        <PortalError message={loadError} onRetry={() => void load()} />
      ) : !items ? (
        <PortalLoading />
      ) : items.length === 0 ? (
        <PortalEmpty icon={BellIcon} title={t('emptyTitle')} body={t('emptyBody')} />
      ) : (
        <>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('summary', { unread, total: items.length })}</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('filterLabel')}>
            {FILTERS.map((f) => (
              <Button key={f} size="sm" variant={filter === f ? 'primary' : 'outline'} aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {t(`filters.${f}`)}
              </Button>
            ))}
          </div>

          {visible.length === 0 ? (
            <Card variant="bordered">
              <CardContent className="p-10 text-center text-secondary-600 dark:text-secondary-400">{t('noResults')}</CardContent>
            </Card>
          ) : (
            <ul className="space-y-3" data-testid="notifications-list">
              {visible.map((n) => {
                const Icon = ICONS[n.type] ?? BellIcon;
                const { title, message } = render(n);
                const href = n.actionUrl && n.actionUrl.startsWith('/') ? n.actionUrl : null;
                return (
                  <li key={n.id}>
                    <Card variant="bordered" className={n.isRead ? '' : 'border-primary-300 dark:border-primary-700 bg-primary-50/40 dark:bg-primary-950/30'}>
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center flex-shrink-0 text-secondary-700 dark:text-secondary-300">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className={`text-secondary-900 dark:text-white break-words ${n.isRead ? 'font-medium' : 'font-semibold'}`}>{title}</p>
                              {!n.isRead && (
                                <Badge variant="primary" size="sm">
                                  {t('new')}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-secondary-700 dark:text-secondary-300 whitespace-pre-wrap break-words">{message}</p>
                            <p className="text-xs text-secondary-500 mt-1" title={formatDateTime(n.timestamp, locale)}>
                              {relativeTime(n.timestamp, locale)}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {href && (
                                <Button size="sm" variant="outline" asChild>
                                  <Link href={href} onClick={() => (!n.isRead ? void markAsRead(n.id) : undefined)}>
                                    {t('open')}
                                  </Link>
                                </Button>
                              )}
                              {!n.isRead && (
                                <Button size="sm" variant="ghost" onClick={() => void markAsRead(n.id)}>
                                  <CheckIcon className="h-4 w-4 mr-1" />
                                  {t('markRead')}
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => void remove(n.id)} aria-label={t('delete')}>
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Portal › Notificaciones: avisos reales (pedidos, proyectos, entregables,
 * facturas y mensajes) en el idioma de la persona.
 */
export default function NotificationsPage() {
  return (
    <DashboardLayout>
      <NotificationsContent />
    </DashboardLayout>
  );
}
