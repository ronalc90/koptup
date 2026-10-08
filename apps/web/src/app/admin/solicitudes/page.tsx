'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon, EyeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DemoAccessBadge from '@/components/demo/DemoAccessBadge';
import { type AdminDemoRequest, type RequestState, RequestStatusBadge } from '@/components/admin/demos/shared';
import { type CatalogItem, apiRequest, catalogMap, demoName, fetchPublicCatalog, formatDate } from '@/lib/demo-system';
import { cn } from '@/lib/utils';

const TABS: Array<RequestState | ''> = ['pendiente', 'en_revision', 'aprobada', 'rechazada', ''];
const LIMIT = 20;

interface ListResponse {
  items: AdminDemoRequest[];
  total: number;
  page: number;
  pages: number;
  conteos: Record<RequestState, number>;
}

function RequestsInner() {
  const t = useTranslations('adminDemos');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [estado, setEstado] = useState<RequestState | ''>((searchParams.get('estado') as RequestState) ?? 'pendiente');
  const [demo, setDemo] = useState(searchParams.get('demo') ?? '');
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [catalog, setCatalog] = useState<Map<string, CatalogItem>>(() => catalogMap(null));

  useEffect(() => {
    fetchPublicCatalog()
      .then((items) => setCatalog(catalogMap(items)))
      .catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (estado) params.set('estado', estado);
    if (demo) params.set('demo', demo);
    if (query) params.set('q', query);
    try {
      setData(await apiRequest<ListResponse>(`/admin/demo-requests?${params.toString()}`));
    } catch {
      setError(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [estado, demo, query, page, t]);

  useEffect(() => {
    load();
  }, [load]);

  const total = useMemo(() => (data ? Object.values(data.conteos).reduce((a, b) => a + b, 0) : 0), [data]);
  const demoOptions = useMemo(
    () => [...catalog.values()].sort((a, b) => demoName(a, locale).localeCompare(demoName(b, locale), locale)),
    [catalog, locale],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">{t('requests.title')}</h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">{t('requests.subtitle')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <ArrowPathIcon className="h-4 w-4 mr-1" />
          {t('refresh')}
        </Button>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-secondary-200 dark:border-secondary-800" role="tablist">
        {TABS.map((tab) => {
          const count = tab ? data?.conteos?.[tab] : total;
          return (
            <button
              key={tab || 'todas'}
              type="button"
              role="tab"
              aria-selected={estado === tab}
              onClick={() => {
                setEstado(tab);
                setPage(1);
              }}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px',
                estado === tab
                  ? 'border-primary-600 text-primary-700 dark:text-primary-300'
                  : 'border-transparent text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white',
              )}
            >
              {tab ? t(`requestStatus.${tab}`) : t('all')}
              <span className="ml-2 inline-flex min-w-[1.5rem] justify-center rounded-full bg-secondary-100 dark:bg-secondary-800 px-1.5 text-xs">
                {count ?? '…'}
              </span>
            </button>
          );
        })}
      </div>

      <Card variant="bordered">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <form
            className="flex-1 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setQuery(q.trim());
            }}
          >
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('requests.searchPlaceholder')}
                aria-label={t('requests.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white"
              />
            </div>
            <Button type="submit">{t('search')}</Button>
          </form>
          <select
            value={demo}
            onChange={(e) => {
              setDemo(e.target.value);
              setPage(1);
            }}
            aria-label={t('filterDemo')}
            className="px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white"
          >
            <option value="">{t('allDemos')}</option>
            {demoOptions.map((d) => (
              <option key={d.slug} value={d.slug}>
                {demoName(d, locale)}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <Card variant="bordered">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm" data-testid="requests-table">
            <thead className="bg-secondary-50 dark:bg-secondary-900 text-left text-xs uppercase tracking-wide text-secondary-500">
              <tr>
                <th className="px-4 py-3">{t('requests.colCode')}</th>
                <th className="px-4 py-3">{t('requests.colPerson')}</th>
                <th className="px-4 py-3">{t('requests.colCountry')}</th>
                <th className="px-4 py-3">{t('requests.colDemos')}</th>
                <th className="px-4 py-3">{t('requests.colStatus')}</th>
                <th className="px-4 py-3 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200 dark:divide-secondary-800">
              {loading && !data ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-secondary-500">
                    {t('loading')}
                  </td>
                </tr>
              ) : data && data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-secondary-500">
                    {t('requests.empty')}
                  </td>
                </tr>
              ) : (
                data?.items.map((r) => (
                  <tr key={r.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-900/50 align-top" data-request-code={r.codigo}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-mono font-semibold text-secondary-900 dark:text-white">{r.codigo}</p>
                      <p className="text-xs text-secondary-500">{formatDate(r.createdAt, locale, true)}</p>
                    </td>
                    <td className="px-4 py-3 min-w-[12rem]">
                      <p className="font-semibold text-secondary-900 dark:text-white">{r.nombre}</p>
                      <p className="text-secondary-600 dark:text-secondary-400">{r.empresa}</p>
                      <p className="text-xs text-secondary-500 break-all">{r.email}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-secondary-700 dark:text-secondary-300">
                      {r.pais}
                      <p className="text-xs text-secondary-500">{t('people', { size: r.tamanoEmpresa })}</p>
                    </td>
                    <td className="px-4 py-3 min-w-[12rem]">
                      <ul className="space-y-1">
                        {r.demos.map((slug) => {
                          const entry = catalog.get(slug);
                          return (
                            <li key={slug} className="flex flex-wrap items-center gap-1 text-secondary-700 dark:text-secondary-300">
                              {demoName(entry, locale, slug)}
                              {entry && entry.accessMode !== 'publico' && <DemoAccessBadge mode={entry.accessMode} activo={entry.activo} />}
                            </li>
                          );
                        })}
                      </ul>
                    </td>
                    <td className="px-4 py-3">
                      <RequestStatusBadge estado={r.estado} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant={r.estado === 'pendiente' || r.estado === 'en_revision' ? 'primary' : 'outline'} onClick={() => router.push(`/admin/solicitudes/${r.id}`)}>
                        <EyeIcon className="h-4 w-4 mr-1" />
                        {r.estado === 'pendiente' || r.estado === 'en_revision' ? t('requests.review') : t('view')}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-secondary-600 dark:text-secondary-400">
          <span>{t('pageOf', { page: data.page, pages: data.pages, total: data.total })}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label={t('prev')}>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} aria-label={t('next')}>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      <p className="text-xs text-secondary-500">
        {t.rich('requests.footer', {
          link: (chunks) => (
            <Link href="/solicitar-demo" className="text-primary-600 hover:underline" target="_blank">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </div>
  );
}

export default function AdminDemoRequestsPage() {
  return (
    <AdminLayout>
      <Suspense fallback={null}>
        <RequestsInner />
      </Suspense>
    </AdminLayout>
  );
}
