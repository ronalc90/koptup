'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Modal } from '@/components/admin/demos/shared';
import ClientPicker from '@/components/admin/ClientPicker';
import { apiRequest } from '@/lib/demo-system';
import {
  PROJECT_STATUSES,
  describeError,
  formatDay,
  formatMoney,
  todayInColombia,
  type AdminProjectView,
  type ClientAccount,
  type Currency,
  type ProjectStatus,
} from '@/lib/portal';
import { ChatBubbleLeftRightIcon, FolderIcon, MagnifyingGlassIcon, PencilSquareIcon, PlusIcon } from '@heroicons/react/24/outline';

const STATUS_VARIANT: Record<ProjectStatus, 'info' | 'success' | 'warning' | 'primary' | 'secondary'> = {
  planning: 'info',
  active: 'success',
  on_hold: 'warning',
  completed: 'primary',
  cancelled: 'secondary',
};

/**
 * Admin › Proyectos: el equipo crea el proyecto de un cliente (queda en su
 * portal con su conversación) y lleva su estado y avance. Las facturas y los
 * entregables se ligan al proyecto desde sus pantallas.
 */
export default function AdminProjectsPage() {
  const t = useTranslations('adminProjects');
  const tc = useTranslations('portalCommon');
  const locale = useLocale();
  const [projects, setProjects] = useState<AdminProjectView[]>([]);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminProjectView | null>(null);

  const errorTexts = { network: tc('errors.network'), rateLimited: tc('errors.rateLimited'), server: tc('errors.server'), generic: tc('errors.generic') };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams();
      if (status !== 'all') params.set('status', status);
      if (query) params.set('q', query);
      const data = await apiRequest<AdminProjectView[]>(`/admin/projects${params.toString() ? `?${params}` : ''}`);
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setProjects([]);
      setLoadError(describeError(err, locale, errorTexts));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, query, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">{t('title')}</h1>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">{t('subtitle')}</p>
          </div>
          <Button onClick={() => setCreating(true)}>
            <PlusIcon className="h-5 w-5 mr-2" />
            {t('newProject')}
          </Button>
        </div>

        <Card variant="bordered">
          <CardContent className="p-4 space-y-4">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setQuery(search.trim());
              }}
            >
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  aria-label={t('searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white"
                />
              </div>
              <Button type="submit" size="sm">
                {tc('search')}
              </Button>
            </form>
            <div className="flex gap-2 flex-wrap">
              {(['all', ...PROJECT_STATUSES] as const).map((s) => (
                <Button key={s} size="sm" variant={status === s ? 'primary' : 'outline'} onClick={() => setStatus(s)} aria-pressed={status === s}>
                  {s === 'all' ? t('filterAll') : tc(`projectStatus.${s}`)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : loadError ? (
          <Card variant="bordered">
            <CardContent className="p-10 text-center" role="alert">
              <p className="text-red-600 dark:text-red-400 mb-4">{loadError}</p>
              <Button variant="outline" onClick={() => void load()}>
                {tc('retry')}
              </Button>
            </CardContent>
          </Card>
        ) : projects.length === 0 ? (
          <Card variant="bordered">
            <CardContent className="p-10 text-center">
              <FolderIcon className="h-12 w-12 mx-auto text-secondary-400 mb-4" />
              <p className="text-secondary-700 dark:text-secondary-300 font-medium">{query || status !== 'all' ? t('noResults') : t('empty')}</p>
              {!query && status === 'all' && <p className="text-sm text-secondary-500 mt-1">{t('emptyHint')}</p>}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {projects.map((p) => (
              <Card key={p.id} variant="bordered" data-project={p.name}>
                <CardContent className="p-4 sm:p-6 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-secondary-900 dark:text-white break-words">{p.name}</h3>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 break-words">
                        {p.client ? `${p.client.name}${p.client.company ? ` · ${p.client.company}` : ''}` : t('noClient')}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANT[p.status]} size="sm">
                      {tc(`projectStatus.${p.status}`)}
                    </Badge>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-secondary-500 mb-1">
                      <span>{t('progress')}</span>
                      <span>{p.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary-200 dark:bg-secondary-800" role="progressbar" aria-valuenow={p.progress} aria-valuemin={0} aria-valuemax={100}>
                      <div className="h-2 rounded-full bg-primary-600" style={{ width: `${p.progress}%` }} />
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-xs text-secondary-500">{t('budget')}</dt>
                      <dd className="text-secondary-900 dark:text-white">{p.budget !== null ? formatMoney(p.budget, p.currency, locale) : '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-secondary-500">{t('dates')}</dt>
                      <dd className="text-secondary-900 dark:text-white">
                        {formatDay(p.startDate, locale)} – {formatDay(p.endDate, locale)}
                      </dd>
                    </div>
                    <div className="col-span-2 text-xs text-secondary-500">
                      {t('counts', { invoices: p.invoices ?? 0, deliverables: p.deliverables ?? 0, orders: p.orders ?? 0 })}
                    </div>
                  </dl>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                      <PencilSquareIcon className="h-4 w-4 mr-2" />
                      {t('edit')}
                    </Button>
                    {p.conversation && (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/conversations/${p.conversation}`}>
                          <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                          {t('conversation')}
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {creating && (
          <ProjectFormModal
            onClose={() => setCreating(false)}
            onSaved={async (name) => {
              setCreating(false);
              toast.success(t('created', { name }));
              await load();
            }}
          />
        )}
        {editing && (
          <ProjectFormModal
            project={editing}
            onClose={() => setEditing(null)}
            onSaved={async () => {
              setEditing(null);
              toast.success(t('updated'));
              await load();
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

function ProjectFormModal({
  project,
  onClose,
  onSaved,
}: {
  project?: AdminProjectView;
  onClose: () => void;
  onSaved: (name: string) => void | Promise<void>;
}) {
  const t = useTranslations('adminProjects');
  const tc = useTranslations('portalCommon');
  const locale = useLocale();
  const [client, setClient] = useState<ClientAccount | null>(null);
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [budget, setBudget] = useState(project?.budget !== null && project?.budget !== undefined ? String(project.budget) : '');
  const [currency, setCurrency] = useState<Currency>(project?.currency ?? 'COP');
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'planning');
  const [progress, setProgress] = useState(String(project?.progress ?? 0));
  const [startDate, setStartDate] = useState(project?.startDate ?? todayInColombia());
  const [endDate, setEndDate] = useState(project?.endDate ?? '');
  const [welcome, setWelcome] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!project && !client) return setError(t('form.clientRequired'));
    if (name.trim().length < 3) return setError(t('form.nameRequired'));
    const body: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim(),
      currency,
      ...(budget.trim() ? { budget: Number(budget) } : project ? { budget: null } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : project ? { endDate: null } : {}),
    };
    setBusy(true);
    try {
      if (project) {
        await apiRequest(`/admin/projects/${project.id}`, { method: 'PATCH', body: { ...body, status, progress: Math.min(100, Math.max(0, Math.round(Number(progress) || 0))) } });
      } else {
        await apiRequest('/admin/projects', { method: 'POST', body: { ...body, clientId: client!.id, status, ...(welcome.trim() ? { welcomeMessage: welcome.trim() } : {}) } });
      }
      await onSaved(name.trim());
    } catch (err) {
      setError(describeError(err, locale, { network: tc('errors.network'), rateLimited: tc('errors.rateLimited'), server: tc('errors.server'), generic: tc('errors.generic') }));
    } finally {
      setBusy(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white';

  return (
    <Modal title={project ? t('editTitle', { name: project.name }) : t('newProject')} onClose={onClose} wide>
      <div className="space-y-4">
        {project ? (
          <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('form.clientFixed', { name: project.client?.name ?? '—' })}</p>
        ) : (
          <>
            <ClientPicker value={client} onChange={setClient} label={t('form.client')} />
            {client?.role === 'prospect' && <p className="text-xs text-amber-700 dark:text-amber-400">{t('form.prospectNote')}</p>}
          </>
        )}
        <div>
          <label htmlFor="prj-name" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
            {t('form.name')}
          </label>
          <input id="prj-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={160} className={inputCls} />
        </div>
        <div>
          <label htmlFor="prj-desc" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
            {t('form.description')}
          </label>
          <textarea id="prj-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} className={inputCls} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="prj-budget" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              {t('form.budget')}
            </label>
            <input id="prj-budget" type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="prj-currency" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              {t('form.currency')}
            </label>
            <select id="prj-currency" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className={inputCls}>
              <option value="COP">COP</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <label htmlFor="prj-status" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              {t('form.status')}
            </label>
            <select id="prj-status" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)} className={inputCls}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {tc(`projectStatus.${s}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="prj-start" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              {t('form.startDate')}
            </label>
            <input id="prj-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="prj-end" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              {t('form.endDate')}
            </label>
            <input id="prj-end" type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
          </div>
          {project && (
            <div>
              <label htmlFor="prj-progress" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                {t('form.progress')}
              </label>
              <input id="prj-progress" type="number" min={0} max={100} value={progress} onChange={(e) => setProgress(e.target.value)} className={inputCls} />
            </div>
          )}
        </div>
        {!project && (
          <div>
            <label htmlFor="prj-welcome" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              {t('form.welcome')}
            </label>
            <textarea id="prj-welcome" rows={2} value={welcome} onChange={(e) => setWelcome(e.target.value)} maxLength={2000} className={inputCls} placeholder={t('form.welcomePlaceholder')} />
            <p className="text-xs text-secondary-500 mt-1">{t('form.welcomeHelp')}</p>
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {tc('cancel')}
          </Button>
          <Button onClick={() => void submit()} isLoading={busy} disabled={busy}>
            {project ? t('form.save') : t('form.create')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
