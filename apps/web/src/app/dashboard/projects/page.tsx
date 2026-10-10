'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { PortalEmpty, PortalError, PortalLoading } from '@/components/dashboard/PortalStates';
import { useErrorText } from '@/hooks/useErrorText';
import { apiRequest } from '@/lib/demo-system';
import { formatDate, formatMoney, type ProjectStatus } from '@/lib/portal';
import { CalendarIcon, ChatBubbleLeftIcon, CreditCardIcon, DocumentTextIcon, FolderIcon, UserIcon } from '@heroicons/react/24/outline';

interface ProjectRow {
  _id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  progress?: number;
  budget?: number | null;
  currency?: 'COP' | 'USD';
  start_date?: string | null;
  end_date?: string | null;
  manager_name?: string | null;
  deliverables_count?: number;
  deliverables_pending?: number;
  invoices_count?: number;
  conversation_id?: string | null;
}

const STATUS_BADGE: Record<ProjectStatus, string> = {
  planning: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300',
  active: 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300',
  on_hold: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300',
  completed: 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300',
  cancelled: 'bg-secondary-200 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300',
};

function ProjectsContent() {
  const t = useTranslations('projectsPage');
  const tc = useTranslations('portalCommon');
  const locale = useLocale();
  const errorText = useErrorText();
  const [projects, setProjects] = useState<ProjectRow[] | null>(null);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const data = await apiRequest<ProjectRow[]>('/projects');
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setProjects(null);
      setLoadError(errorText(err));
    }
  }, [errorText]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">{t('title')}</h1>
        <p className="text-secondary-600 dark:text-secondary-400">{t('subtitle')}</p>
      </div>

      {loadError ? (
        <PortalError message={loadError} onRetry={() => void load()} />
      ) : !projects ? (
        <PortalLoading />
      ) : projects.length === 0 ? (
        <PortalEmpty icon={FolderIcon} title={t('noProjects')} body={t('noProjectsDesc')} action={{ href: '/dashboard/orders/new', label: t('requestNewProject') }} />
      ) : (
        <ul className="space-y-4" data-testid="projects-list">
          {projects.map((p) => {
            const progress = Math.min(100, Math.max(0, Number(p.progress ?? 0)));
            return (
              <li key={p._id}>
                <Card variant="bordered" data-project={p._id}>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h2 className="text-xl font-semibold text-secondary-900 dark:text-white break-words">{p.name}</h2>
                          <Badge variant="secondary" size="sm" className={STATUS_BADGE[p.status]}>
                            {tc(`projectStatus.${p.status}`)}
                          </Badge>
                        </div>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400 whitespace-pre-wrap">{p.description || t('noDescription')}</p>
                      </div>
                      {p.budget != null && p.budget > 0 && (
                        <div className="sm:text-right flex-shrink-0">
                          <p className="text-xs text-secondary-500">{t('budget')}</p>
                          <p className="text-lg font-bold text-secondary-900 dark:text-white">{formatMoney(p.budget, p.currency ?? 'COP', locale)}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-secondary-600 dark:text-secondary-400">{t('progress')}</span>
                        <span className="font-semibold text-secondary-900 dark:text-white">{progress}%</span>
                      </div>
                      <div className="w-full bg-secondary-200 dark:bg-secondary-800 rounded-full h-2.5 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={t('progress')}>
                        <div className="bg-primary-600 h-2.5" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-xs text-secondary-500 mt-1">{t('progressNote')}</p>
                    </div>

                    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-secondary-500 flex-shrink-0" />
                        <dt className="text-secondary-600 dark:text-secondary-400">{t('startDate')}:</dt>
                        <dd className="font-medium text-secondary-900 dark:text-white">{p.start_date ? formatDate(p.start_date, locale) : t('noDate')}</dd>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-secondary-500 flex-shrink-0" />
                        <dt className="text-secondary-600 dark:text-secondary-400">{t('deliveryDate')}:</dt>
                        <dd className="font-medium text-secondary-900 dark:text-white">{p.end_date ? formatDate(p.end_date, locale) : t('noDate')}</dd>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-secondary-500 flex-shrink-0" />
                        <dt className="text-secondary-600 dark:text-secondary-400">{t('manager')}:</dt>
                        <dd className="font-medium text-secondary-900 dark:text-white">{p.manager_name || t('unassigned')}</dd>
                      </div>
                    </dl>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-secondary-200 dark:border-secondary-800">
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/dashboard/deliverables">
                          <DocumentTextIcon className="h-4 w-4 mr-2" />
                          {t('deliverablesCount', { count: Number(p.deliverables_count ?? 0) })}
                          {Number(p.deliverables_pending ?? 0) > 0 ? ` · ${t('toReview', { count: Number(p.deliverables_pending) })}` : ''}
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/dashboard/billing">
                          <CreditCardIcon className="h-4 w-4 mr-2" />
                          {t('invoicesCount', { count: Number(p.invoices_count ?? 0) })}
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={p.conversation_id ? `/dashboard/messages?c=${encodeURIComponent(p.conversation_id)}` : '/dashboard/messages'}>
                          <ChatBubbleLeftIcon className="h-4 w-4 mr-2" />
                          {t('contactTeam')}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * Portal › Proyectos: los proyectos reales del cliente (estado, avance que
 * registra el equipo, fechas, entregables, facturas y conversación). Sin
 * fases inventadas.
 */
export default function ProjectsPage() {
  return (
    <DashboardLayout>
      <ProjectsContent />
    </DashboardLayout>
  );
}
