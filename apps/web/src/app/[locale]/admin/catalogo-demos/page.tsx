'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { ArrowPathIcon, ArrowTopRightOnSquareIcon, CheckIcon, InformationCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DemoAccessBadge from '@/components/demo/DemoAccessBadge';
import { apiErrorMessage, useStaffRole } from '@/components/admin/demos/shared';
import { type AdminCatalogItem, type DemoAccessMode, apiRequest, demoName, formatDate } from '@/lib/demo-system';
import { DEMO_ACCESS_MODES } from '@/lib/demo-access-defaults';
import { cn } from '@/lib/utils';

/** El chatbot RAG es siempre público y activo (el backend responde 422 si se intenta cambiar). */
const FIXED_PUBLIC = new Set(['chatbot']);

type Filter = 'todas' | DemoAccessMode | 'inactivas';
type Draft = { accessMode: DemoAccessMode; activo: boolean; duracionDiasPorDefecto: number };

export default function AdminDemoCatalogPage() {
  const t = useTranslations('adminDemos');
  const locale = useLocale();
  const role = useStaffRole();
  const canEdit = role === 'admin';
  const [items, setItems] = useState<AdminCatalogItem[] | null>(null);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState<string>('');
  const [filter, setFilter] = useState<Filter>('todas');

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await apiRequest<AdminCatalogItem[]>('/admin/demo-catalog');
      setItems(Array.isArray(data) ? data : []);
      setDrafts({});
    } catch {
      setError(t('loadError'));
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { todas: 0, publico: 0, solicitud: 0, privado: 0, inactivas: 0 };
    for (const i of items ?? []) {
      c.todas += 1;
      c[i.accessMode] += 1;
      if (!i.activo) c.inactivas += 1;
    }
    return c;
  }, [items]);

  const visible = (items ?? []).filter((i) => (filter === 'todas' ? true : filter === 'inactivas' ? !i.activo : i.accessMode === filter));

  const draftOf = (i: AdminCatalogItem): Draft => drafts[i.slug] ?? { accessMode: i.accessMode, activo: i.activo, duracionDiasPorDefecto: i.duracionDiasPorDefecto };
  const setDraft = (i: AdminCatalogItem, patch: Partial<Draft>) => setDrafts((d) => ({ ...d, [i.slug]: { ...draftOf(i), ...patch } }));
  const dirtyFields = (i: AdminCatalogItem) => {
    const d = draftOf(i);
    const changes: Partial<Draft> = {};
    if (d.accessMode !== i.accessMode) changes.accessMode = d.accessMode;
    if (d.activo !== i.activo) changes.activo = d.activo;
    if (d.duracionDiasPorDefecto !== i.duracionDiasPorDefecto) changes.duracionDiasPorDefecto = d.duracionDiasPorDefecto;
    return changes;
  };

  const save = async (i: AdminCatalogItem) => {
    const changes = dirtyFields(i);
    if (!Object.keys(changes).length) return;
    setSaving(i.slug);
    try {
      const updated = await apiRequest<AdminCatalogItem>(`/admin/demo-catalog/${encodeURIComponent(i.slug)}`, { method: 'PATCH', body: changes });
      setItems((list) => (list ?? []).map((x) => (x.slug === i.slug ? { ...x, ...updated } : x)));
      setDrafts((d) => {
        const next = { ...d };
        delete next[i.slug];
        return next;
      });
      toast.success(t('catalog.saved', { name: demoName(i, locale) }));
    } catch (err) {
      toast.error(apiErrorMessage(err, locale, t('actionError')));
    } finally {
      setSaving('');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">{t('catalog.title')}</h1>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">{t('catalog.subtitle', { count: counts.todas })}</p>
          </div>
          <Button variant="outline" size="sm" onClick={load}>
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            {t('refresh')}
          </Button>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-100 space-y-1">
            <p>{t('catalog.info')}</p>
            <p>{t('catalog.modesHelp')}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2" role="tablist">
          {(['todas', 'publico', 'solicitud', 'privado', 'inactivas'] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium border',
                filter === f ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-200' : 'border-secondary-200 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300',
              )}
            >
              {t(`catalog.filter.${f}`)} <span className="ml-1 text-xs opacity-75">{items ? counts[f] : '…'}</span>
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <Card variant="bordered">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm" data-testid="catalog-table">
              <thead className="bg-secondary-50 dark:bg-secondary-900 text-left text-xs uppercase tracking-wide text-secondary-500">
                <tr>
                  <th className="px-4 py-3">{t('catalog.colDemo')}</th>
                  <th className="px-4 py-3">{t('catalog.colMode')}</th>
                  <th className="px-4 py-3">{t('catalog.colActive')}</th>
                  <th className="px-4 py-3">{t('catalog.colDuration')}</th>
                  <th className="px-4 py-3">{t('catalog.colUpdated')}</th>
                  <th className="px-4 py-3 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200 dark:divide-secondary-800">
                {!items ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-secondary-500">
                      {t('loading')}
                    </td>
                  </tr>
                ) : (
                  visible.map((i) => {
                    const d = draftOf(i);
                    const fixed = FIXED_PUBLIC.has(i.slug);
                    const disabled = !canEdit || fixed;
                    const dirty = Object.keys(dirtyFields(i)).length > 0;
                    return (
                      <tr key={i.slug} className={cn('align-middle', dirty && 'bg-amber-50/60 dark:bg-amber-950/20')} data-catalog-row={i.slug}>
                        <td className="px-4 py-3 min-w-[12rem]">
                          <p className="font-semibold text-secondary-900 dark:text-white">{demoName(i, locale)}</p>
                          <p className="text-xs font-mono text-secondary-500">/demo/{i.slug}</p>
                          {fixed && (
                            <p className="mt-1 inline-flex items-center gap-1 text-xs text-secondary-500">
                              <LockClosedIcon className="h-3.5 w-3.5" /> {t('catalog.fixedPublic')}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <label htmlFor={`mode-${i.slug}`} className="sr-only">
                              {t('catalog.colMode')}
                            </label>
                            <select
                              id={`mode-${i.slug}`}
                              value={d.accessMode}
                              disabled={disabled}
                              onChange={(e) => setDraft(i, { accessMode: e.target.value as DemoAccessMode })}
                              className="min-w-[11.5rem] pl-2 pr-8 py-1.5 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white disabled:opacity-60"
                              data-mode-select={i.slug}
                            >
                              {DEMO_ACCESS_MODES.map((m) => (
                                <option key={m} value={m}>
                                  {t(`catalog.mode.${m}`)}
                                </option>
                              ))}
                            </select>
                            {!d.activo && <DemoAccessBadge mode={d.accessMode} activo={false} />}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={d.activo}
                            aria-label={t('catalog.colActive')}
                            disabled={disabled}
                            onClick={() => setDraft(i, { activo: !d.activo })}
                            className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-60', d.activo ? 'bg-primary-600' : 'bg-secondary-300 dark:bg-secondary-700')}
                            data-active-toggle={i.slug}
                          >
                            <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform', d.activo ? 'translate-x-6' : 'translate-x-1')} />
                          </button>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <label htmlFor={`days-${i.slug}`} className="sr-only">
                            {t('catalog.colDuration')}
                          </label>
                          <input
                            id={`days-${i.slug}`}
                            type="number"
                            min={1}
                            max={365}
                            value={d.duracionDiasPorDefecto}
                            disabled={!canEdit}
                            onChange={(e) => setDraft(i, { duracionDiasPorDefecto: Math.max(1, Math.min(365, Number(e.target.value) || 1)) })}
                            className="w-20 px-2 py-1.5 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white disabled:opacity-60"
                          />{' '}
                          <span className="text-secondary-500">{t('days')}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-secondary-500 min-w-[7rem]">{i.updatedAt ? formatDate(i.updatedAt, locale, true) : '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            {canEdit && (
                              <Button size="sm" onClick={() => save(i)} disabled={!dirty || saving !== ''} isLoading={saving === i.slug} data-save={i.slug}>
                                <CheckIcon className="h-4 w-4 mr-1" />
                                {t('save')}
                              </Button>
                            )}
                            <a
                              href={`/demo/${i.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1.5 text-sm text-primary-600 hover:underline"
                              aria-label={t('catalog.openDemo', { name: demoName(i, locale) })}
                            >
                              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
        {!canEdit && role && <p className="text-sm text-secondary-500">{t('catalog.readOnly')}</p>}
      </div>
    </AdminLayout>
  );
}
