'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  NoSymbolIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DemoAccessBadge from '@/components/demo/DemoAccessBadge';
import {
  ActivationLinkPanel,
  type AdminGrant,
  DaysPicker,
  type GrantResult,
  GrantStatusBadge,
  Modal,
  apiErrorMessage,
  useStaffRole,
} from '@/components/admin/demos/shared';
import { type AdminCatalogItem, apiRequest, demoName, formatDate } from '@/lib/demo-system';
import { cn } from '@/lib/utils';

type Tab = 'todos' | 'activo' | 'por_vencer' | 'expirado' | 'revocado';
const TABS: Tab[] = ['activo', 'por_vencer', 'expirado', 'revocado', 'todos'];
const LIMIT = 20;

interface ListResponse {
  items: AdminGrant[];
  total: number;
  page: number;
  pages: number;
  conteos: Record<Tab, number>;
}

type Dialog =
  | { kind: 'extend'; grant: AdminGrant }
  | { kind: 'revoke'; grant: AdminGrant }
  | { kind: 'link'; grant: AdminGrant; result: GrantResult }
  | { kind: 'invite' }
  | null;

function GrantsInner() {
  const t = useTranslations('adminDemos');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const role = useStaffRole();
  const canManage = role === 'admin' || role === 'sales';
  const isAdmin = role === 'admin';

  const [tab, setTab] = useState<Tab>((searchParams.get('estado') as Tab) || (searchParams.get('q') ? 'todos' : 'activo'));
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [demo, setDemo] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState('');
  const [catalog, setCatalog] = useState<AdminCatalogItem[]>([]);
  const [dialog, setDialog] = useState<Dialog>(null);

  const load = useCallback(async () => {
    setError('');
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (tab !== 'todos') params.set('estado', tab);
    if (query) params.set('q', query);
    if (demo) params.set('demo', demo);
    try {
      setData(await apiRequest<ListResponse>(`/admin/demo-grants?${params.toString()}`));
    } catch {
      setError(t('loadError'));
    }
  }, [tab, query, demo, page, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    apiRequest<AdminCatalogItem[]>('/admin/demo-catalog')
      .then((items) => setCatalog(Array.isArray(items) ? items : []))
      .catch(() => undefined);
  }, []);

  const sortedCatalog = useMemo(() => catalog.slice().sort((a, b) => demoName(a, locale).localeCompare(demoName(b, locale), locale)), [catalog, locale]);

  const resend = async (grant: AdminGrant) => {
    try {
      const result = await apiRequest<GrantResult>(`/admin/demo-grants/${grant.id}/resend-activation`, { method: 'POST' });
      setDialog({ kind: 'link', grant, result });
    } catch (err) {
      toast.error(apiErrorMessage(err, locale, t('actionError')));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">{t('grants.title')}</h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">{t('grants.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            {t('refresh')}
          </Button>
          {canManage && (
            <Button size="sm" onClick={() => setDialog({ kind: 'invite' })} data-testid="invite-button">
              <UserPlusIcon className="h-4 w-4 mr-1" />
              {t('grants.invite')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(['activo', 'por_vencer', 'expirado', 'revocado'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setTab(k);
              setPage(1);
            }}
            className={cn(
              'text-left rounded-xl border p-4 bg-white dark:bg-secondary-950 transition-colors',
              tab === k ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-900' : 'border-secondary-200 dark:border-secondary-800 hover:border-primary-300',
            )}
          >
            <p className="text-2xl font-bold text-secondary-900 dark:text-white" data-count={k}>
              {data?.conteos?.[k] ?? '…'}
            </p>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">{t(`grants.kpi.${k}`)}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1 border-b border-secondary-200 dark:border-secondary-800" role="tablist">
        {TABS.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => {
              setTab(k);
              setPage(1);
            }}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px',
              tab === k ? 'border-primary-600 text-primary-700 dark:text-primary-300' : 'border-transparent text-secondary-600 dark:text-secondary-400',
            )}
          >
            {k === 'todos' ? t('all') : t(`grants.tabs.${k}`)}
            <span className="ml-2 inline-flex min-w-[1.5rem] justify-center rounded-full bg-secondary-100 dark:bg-secondary-800 px-1.5 text-xs">
              {data?.conteos?.[k] ?? '…'}
            </span>
          </button>
        ))}
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
                placeholder={t('grants.searchPlaceholder')}
                aria-label={t('grants.searchPlaceholder')}
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
            {sortedCatalog.map((d) => (
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
          <table className="w-full text-sm" data-testid="grants-table">
            <thead className="bg-secondary-50 dark:bg-secondary-900 text-left text-xs uppercase tracking-wide text-secondary-500">
              <tr>
                <th className="px-4 py-3">{t('grants.colPerson')}</th>
                <th className="px-4 py-3">{t('grants.colDemo')}</th>
                <th className="px-4 py-3">{t('grants.colStatus')}</th>
                <th className="px-4 py-3">{t('grants.colExpires')}</th>
                <th className="px-4 py-3">{t('grants.colLastAccess')}</th>
                <th className="px-4 py-3 text-right">{t('grants.colVisits')}</th>
                <th className="px-4 py-3 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200 dark:divide-secondary-800">
              {!data ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-secondary-500">
                    {t('loading')}
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-secondary-500">
                    {t('grants.empty')}
                  </td>
                </tr>
              ) : (
                data.items.map((g) => {
                  const invited = g.user?.accountStatus === 'invitado';
                  const locked = g.accessMode === 'privado' && !isAdmin;
                  return (
                    <tr key={g.id} className="align-top hover:bg-secondary-50 dark:hover:bg-secondary-900/50" data-grant-row={`${g.user?.email ?? ''}|${g.demoSlug}`}>
                      <td className="px-4 py-3 min-w-[12rem]">
                        <p className="font-semibold text-secondary-900 dark:text-white">{g.user?.name ?? t('grants.deletedAccount')}</p>
                        <p className="text-xs text-secondary-500 break-all">{g.user?.email ?? ''}</p>
                        {g.user?.company && <p className="text-xs text-secondary-500">{g.user.company}</p>}
                        {invited && <span className="mt-1 inline-flex rounded-full bg-amber-100 dark:bg-amber-900 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-100">{t('accountStatus.invitado')}</span>}
                      </td>
                      <td className="px-4 py-3 min-w-[10rem]">
                        <p className="text-secondary-900 dark:text-white">{demoName({ slug: g.demoSlug, nombre: g.demoNombre, nombreEn: g.demoNombreEn }, locale)}</p>
                        {g.accessMode && <DemoAccessBadge mode={g.accessMode} activo={g.demoActiva} className="mt-1" />}
                      </td>
                      <td className="px-4 py-3">
                        <GrantStatusBadge grant={g} />
                        {g.motivoRevocacion && <p className="mt-1 text-xs text-secondary-500 max-w-[12rem]">{g.motivoRevocacion}</p>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-secondary-900 dark:text-white">{formatDate(g.expiresAt, locale)}</p>
                        {g.estadoEfectivo === 'activo' && <p className="text-xs text-secondary-500">{t('daysLeftShort', { days: g.diasRestantes })}</p>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-secondary-700 dark:text-secondary-300">
                        {g.ultimoAcceso ? formatDate(g.ultimoAcceso, locale, true) : t('grants.never')}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{g.accesos}</td>
                      <td className="px-4 py-3">
                        {canManage && !locked ? (
                          <div className="flex flex-wrap justify-end gap-1">
                            {g.estadoEfectivo !== 'revocado' && (
                              <Button size="sm" variant="outline" onClick={() => setDialog({ kind: 'extend', grant: g })} data-action="extend">
                                <CalendarDaysIcon className="h-4 w-4 mr-1" />
                                {t('grants.extend')}
                              </Button>
                            )}
                            {g.estadoEfectivo !== 'revocado' && (
                              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setDialog({ kind: 'revoke', grant: g })} data-action="revoke">
                                <NoSymbolIcon className="h-4 w-4 mr-1" />
                                {t('grants.revoke')}
                              </Button>
                            )}
                            {invited && g.estadoEfectivo === 'activo' && (
                              <Button size="sm" variant="ghost" onClick={() => resend(g)} data-action="resend">
                                <LinkIcon className="h-4 w-4 mr-1" />
                                {t('grants.newLink')}
                              </Button>
                            )}
                          </div>
                        ) : locked ? (
                          <p className="text-right text-xs text-secondary-500">{t('detail.privateAdminOnly')}</p>
                        ) : null}
                        {g.request && (
                          <p className="text-right mt-1">
                            <Link href={`/admin/solicitudes/${g.request}`} className="text-xs text-primary-600 hover:underline">
                              {t('grants.viewRequest')}
                            </Link>
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })
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
      {!canManage && role && <p className="text-sm text-secondary-500">{t('readOnly')}</p>}

      {dialog?.kind === 'extend' && <ExtendDialog grant={dialog.grant} onClose={() => setDialog(null)} onDone={load} />}
      {dialog?.kind === 'revoke' && <RevokeDialog grant={dialog.grant} onClose={() => setDialog(null)} onDone={load} />}
      {dialog?.kind === 'link' && (
        <Modal title={t('grants.newLink')} onClose={() => setDialog(null)}>
          <ActivationLinkPanel
            result={dialog.result}
            phone={null}
            demoNames={[demoName({ slug: dialog.grant.demoSlug, nombre: dialog.grant.demoNombre, nombreEn: dialog.grant.demoNombreEn }, locale)]}
          />
        </Modal>
      )}
      {dialog?.kind === 'invite' && <InviteDialog catalog={sortedCatalog} isAdmin={isAdmin} onClose={() => setDialog(null)} onDone={load} />}
    </div>
  );
}

function ExtendDialog({ grant, onClose, onDone }: { grant: AdminGrant; onClose: () => void; onDone: () => void }) {
  const t = useTranslations('adminDemos');
  const locale = useLocale();
  const [days, setDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const base = Math.max(new Date(grant.expiresAt).getTime(), Date.now());
  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await apiRequest(`/admin/demo-grants/${grant.id}/extend`, { method: 'POST', body: { dias: days } });
      toast.success(t('grants.extended'));
      onDone();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, locale, t('actionError')));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={t('grants.extendTitle', { demo: demoName({ slug: grant.demoSlug, nombre: grant.demoNombre, nombreEn: grant.demoNombreEn }, locale), name: grant.user?.name ?? '' })} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('grants.currentExpiry', { date: formatDate(grant.expiresAt, locale) })}</p>
        <DaysPicker id="extend-days" value={days} onChange={setDays} />
        <p className="text-sm text-green-700 dark:text-green-400 font-semibold">{t('grants.newExpiry', { date: formatDate(new Date(base + days * 86400000), locale) })}</p>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} isLoading={busy} data-testid="confirm-extend">
            {t('grants.extend')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function RevokeDialog({ grant, onClose, onDone }: { grant: AdminGrant; onClose: () => void; onDone: () => void }) {
  const t = useTranslations('adminDemos');
  const locale = useLocale();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await apiRequest(`/admin/demo-grants/${grant.id}/revoke`, { method: 'POST', body: { motivo: reason.trim() || undefined } });
      toast.success(t('grants.revoked'));
      onDone();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, locale, t('actionError')));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={t('grants.revokeTitle', { demo: demoName({ slug: grant.demoSlug, nombre: grant.demoNombre, nombreEn: grant.demoNombreEn }, locale), name: grant.user?.name ?? '' })} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('grants.revokeHelp')}</p>
        <label htmlFor="revoke-reason" className="block text-sm font-semibold">
          {t('grants.revokeReason')}
        </label>
        <textarea
          id="revoke-reason"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={1000}
          className="w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-sm"
        />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button variant="danger" onClick={submit} isLoading={busy} data-testid="confirm-revoke">
            {t('grants.revoke')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function InviteDialog({ catalog, isAdmin, onClose, onDone }: { catalog: AdminCatalogItem[]; isAdmin: boolean; onClose: () => void; onDone: () => void }) {
  const t = useTranslations('adminDemos');
  const locale = useLocale();
  const [form, setForm] = useState({ email: '', nombre: '', empresa: '', telefono: '', nota: '', mensaje: '' });
  const [demos, setDemos] = useState<string[]>([]);
  const [days, setDays] = useState(14);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<GrantResult | null>(null);
  const input = 'w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white text-sm';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) return setError(t('grants.inviteEmailError'));
    if (demos.length === 0) return setError(t('grants.inviteDemosError'));
    setBusy(true);
    try {
      const data = await apiRequest<GrantResult>('/admin/demo-grants', {
        method: 'POST',
        body: {
          email: form.email.trim(),
          nombre: form.nombre.trim() || undefined,
          empresa: form.empresa.trim() || undefined,
          telefono: form.telefono.trim() || undefined,
          demos,
          dias: days,
          nota: form.nota.trim() || undefined,
          mensaje: form.mensaje.trim() || undefined,
        },
      });
      setResult(data);
      toast.success(t('grants.invited'));
      onDone();
    } catch (err) {
      setError(apiErrorMessage(err, locale, t('actionError')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={t('grants.inviteTitle')} onClose={onClose} wide>
      {result ? (
        <div className="space-y-4">
          <ActivationLinkPanel result={result} phone={form.telefono} demoNames={demos.map((s) => demoName(catalog.find((c) => c.slug === s) ?? null, locale, s))} />
          <div className="flex justify-end">
            <Button onClick={onClose}>{t('close')}</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate data-testid="invite-form">
          <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('grants.inviteHelp')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="inv-email" className="block text-sm font-semibold mb-1">
                {t('grants.inviteEmail')} *
              </label>
              <input id="inv-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} />
            </div>
            <div>
              <label htmlFor="inv-name" className="block text-sm font-semibold mb-1">
                {t('grants.inviteName')}
              </label>
              <input id="inv-name" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className={input} />
              <p className="text-xs text-secondary-500 mt-1">{t('grants.inviteNameHint')}</p>
            </div>
            <div>
              <label htmlFor="inv-company" className="block text-sm font-semibold mb-1">
                {t('grants.inviteCompany')}
              </label>
              <input id="inv-company" value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} className={input} />
            </div>
            <div>
              <label htmlFor="inv-phone" className="block text-sm font-semibold mb-1">
                {t('grants.invitePhone')}
              </label>
              <input id="inv-phone" type="tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className={input} />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">{t('grants.inviteDemos')} *</p>
            <div className="max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 pr-1">
              {catalog.map((c) => {
                const locked = c.accessMode === 'privado' && !isAdmin;
                const checked = demos.includes(c.slug);
                return (
                  <label key={c.slug} className={cn('flex items-center gap-2 p-2 rounded-lg border text-sm', checked ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/40' : 'border-secondary-200 dark:border-secondary-800', locked && 'opacity-50')}>
                    <input
                      type="checkbox"
                      disabled={locked}
                      checked={checked}
                      onChange={() => setDemos((cur) => (cur.includes(c.slug) ? cur.filter((s) => s !== c.slug) : cur.length >= 10 ? cur : [...cur, c.slug]))}
                      className="h-4 w-4 rounded"
                      data-invite-demo={c.slug}
                    />
                    <span className="flex-1 min-w-0 truncate">{demoName(c, locale)}</span>
                    {c.accessMode !== 'publico' && <DemoAccessBadge mode={c.accessMode} activo={c.activo} />}
                  </label>
                );
              })}
            </div>
            {!isAdmin && <p className="text-xs text-secondary-500 mt-1">{t('detail.privateAdminOnly')}</p>}
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">{t('detail.validity')}</p>
            <DaysPicker id="invite-days" value={days} onChange={setDays} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="inv-note" className="block text-sm font-semibold mb-1">
                {t('detail.internalNote')}
              </label>
              <textarea id="inv-note" rows={2} value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} className={input} />
            </div>
            <div>
              <label htmlFor="inv-message" className="block text-sm font-semibold mb-1">
                {t('detail.messageToProspect')}
              </label>
              <textarea id="inv-message" rows={2} value={form.mensaje} onChange={(e) => setForm({ ...form, mensaje: e.target.value })} className={input} />
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit" isLoading={busy}>
              {t('grants.inviteSubmit')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default function AdminDemoGrantsPage() {
  return (
    <AdminLayout>
      <Suspense fallback={null}>
        <GrantsInner />
      </Suspense>
    </AdminLayout>
  );
}
