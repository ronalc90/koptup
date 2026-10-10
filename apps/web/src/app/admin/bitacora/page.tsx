'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { apiRequest } from '@/lib/demo-system';
import { describeError, formatDateTime } from '@/lib/portal';
import { ClockIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface AuditItem {
  id: string;
  accion: string;
  actor: string | null;
  actorEmail: string | null;
  actorRol: string | null;
  entidad: { tipo: string; id?: string };
  detalle: Record<string, unknown> | null;
  fecha: string;
}

interface AuditPage {
  items: AuditItem[];
  total: number;
  page: number;
  pages: number;
}

/** Grupos de acciones (prefijo antes del punto) para el filtro. */
const GROUPS = ['demo_request', 'demo_grant', 'demo_catalog', 'user', 'project', 'invoice', 'deliverable', 'lead', 'proposal', 'proposal_request', 'settings', 'privacy'] as const;

/**
 * Admin › Bitácora (solo admin): todo lo que el equipo hizo en el panel,
 * con filtros por grupo de acciones, acción, persona y fechas.
 */
export default function AdminAuditPage() {
  const t = useTranslations('adminAudit');
  const tc = useTranslations('portalCommon');
  const locale = useLocale();
  const [data, setData] = useState<AuditPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [acciones, setAcciones] = useState<string[]>([]);
  const [group, setGroup] = useState('');
  const [accion, setAccion] = useState('');
  const [actor, setActor] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [applied, setApplied] = useState({ group: '', accion: '', actor: '', desde: '', hasta: '' });
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<string[]>('/admin/audit-log/acciones')
      .then((rows) => setAcciones(Array.isArray(rows) ? rows : []))
      .catch(() => setAcciones([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (applied.accion) params.set('accion', applied.accion);
      else if (applied.group) params.set('categoria', applied.group);
      if (applied.actor) params.set('actor', applied.actor);
      if (applied.desde) params.set('desde', applied.desde);
      if (applied.hasta) params.set('hasta', applied.hasta);
      setData(await apiRequest<AuditPage>(`/admin/audit-log?${params}`));
    } catch (err) {
      setData(null);
      setLoadError(describeError(err, locale, { network: tc('errors.network'), rateLimited: tc('errors.rateLimited'), server: tc('errors.server'), generic: tc('errors.generic') }));
    } finally {
      setLoading(false);
    }
  }, [applied, page, locale, tc]);

  useEffect(() => {
    void load();
  }, [load]);

  const actionLabel = (code: string) => (t.has(`actions.${code}`) ? t(`actions.${code}`) : code);
  const visibleActions = acciones.filter((a) => !group || a.startsWith(`${group}.`));
  const inputCls = 'w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white text-sm';

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">{t('title')}</h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">{t('subtitle')}</p>
        </div>

        <Card variant="bordered">
          <CardContent className="p-4">
            <form
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end"
              onSubmit={(e) => {
                e.preventDefault();
                setPage(1);
                setApplied({ group, accion, actor: actor.trim(), desde, hasta });
              }}
            >
              <div>
                <label htmlFor="audit-group" className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">
                  {t('filters.group')}
                </label>
                <select
                  id="audit-group"
                  value={group}
                  onChange={(e) => {
                    setGroup(e.target.value);
                    setAccion('');
                  }}
                  className={inputCls}
                >
                  <option value="">{t('filters.allGroups')}</option>
                  {GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {t(`groups.${g}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="audit-action" className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">
                  {t('filters.action')}
                </label>
                <select id="audit-action" value={accion} onChange={(e) => setAccion(e.target.value)} className={inputCls}>
                  <option value="">{t('filters.allActions')}</option>
                  {visibleActions.map((a) => (
                    <option key={a} value={a}>
                      {actionLabel(a)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="audit-actor" className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">
                  {t('filters.actor')}
                </label>
                <input id="audit-actor" type="search" value={actor} onChange={(e) => setActor(e.target.value)} placeholder={t('filters.actorPlaceholder')} className={inputCls} />
              </div>
              <div>
                <label htmlFor="audit-from" className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">
                  {t('filters.from')}
                </label>
                <input id="audit-from" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="audit-to" className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">
                  {t('filters.to')}
                </label>
                <input id="audit-to" type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} className={inputCls} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1">
                  <FunnelIcon className="h-4 w-4 mr-1" />
                  {t('filters.apply')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setGroup('');
                    setAccion('');
                    setActor('');
                    setDesde('');
                    setHasta('');
                    setPage(1);
                    setApplied({ group: '', accion: '', actor: '', desde: '', hasta: '' });
                  }}
                >
                  {t('filters.clear')}
                </Button>
              </div>
            </form>
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
        ) : !data || data.items.length === 0 ? (
          <Card variant="bordered">
            <CardContent className="p-10 text-center">
              <ClockIcon className="h-12 w-12 mx-auto text-secondary-400 mb-4" />
              <p className="text-secondary-600 dark:text-secondary-400">{t('empty')}</p>
            </CardContent>
          </Card>
        ) : (
          <Card variant="bordered">
            <CardContent className="p-0">
              <p className="px-4 pt-4 text-sm text-secondary-600 dark:text-secondary-400">{t('total', { count: data.total })}</p>
              <ul className="divide-y divide-secondary-200 dark:divide-secondary-800">
                {data.items.map((item) => (
                  <li key={item.id} className="p-4" data-audit={item.accion}>
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-secondary-900 dark:text-white">{actionLabel(item.accion)}</p>
                        <p className="text-xs text-secondary-500 font-mono break-all">
                          {item.accion} · {item.entidad?.tipo}
                          {item.entidad?.id ? ` ${item.entidad.id}` : ''}
                        </p>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                          {item.actorEmail ? t('by', { email: item.actorEmail, role: item.actorRol ?? '—' }) : t('bySystem')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm text-secondary-500">{formatDateTime(item.fecha, locale)}</span>
                        {item.detalle && (
                          <Button size="sm" variant="ghost" onClick={() => setOpen(open === item.id ? null : item.id)} aria-expanded={open === item.id}>
                            {open === item.id ? t('hideDetail') : t('showDetail')}
                          </Button>
                        )}
                      </div>
                    </div>
                    {open === item.id && item.detalle && (
                      <pre className="mt-3 p-3 rounded-lg bg-secondary-50 dark:bg-secondary-900 text-xs text-secondary-800 dark:text-secondary-200 overflow-x-auto whitespace-pre-wrap break-all">
                        {JSON.stringify(item.detalle, null, 2)}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between p-4 border-t border-secondary-200 dark:border-secondary-800">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  {t('prev')}
                </Button>
                <span className="text-sm text-secondary-600 dark:text-secondary-400">{t('pageOf', { page: data.page, pages: data.pages })}</span>
                <Button size="sm" variant="outline" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
                  {t('next')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
