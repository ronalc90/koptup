'use client';

import { Fragment, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDownTrayIcon, ChevronDownIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { useDemo } from '../lib/store';
import { BASE_DOMAIN, DEMO_PERIOD, MRR_HISTORY, PLANS } from '../lib/data';
import { formatNit, monthShort } from '../lib/format';
import {
  atRisk, churnThisMonth, collectedThisMonth, countBy, mrr, newThisMonth, potentialMrr, staffCount, trialDaysLeft, usage,
} from '../lib/logic';
import { downloadCsv } from '../lib/files';
import { useFmt } from '../lib/useFmt';
import type { Tenant, TenantStatus } from '../lib/types';
import { TENANT_STATUSES } from '../lib/types';
import { Panel, ProgressBar, ScreenHeader, StatusBadge, TenantAvatar, inputCls } from './ui';

type Filter = 'all' | TenantStatus;

export default function Dashboard() {
  const t = useTranslations('demoSaas');
  const f = useFmt();
  const { s, go, select, markTour, cancelTenant } = useDemo();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  const current = mrr(s.tenants);
  const history = [...MRR_HISTORY, { period: DEMO_PERIOD, mrr: current }];
  const maxBar = Math.max(...history.map((h) => h.mrr), 1);
  const invoicesThisMonth = s.invoices.filter((i) => i.issuedAt.startsWith(DEMO_PERIOD)).length;

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return s.tenants.filter(
      (tn) =>
        (filter === 'all' || tn.status === filter) &&
        (!needle || tn.name.toLowerCase().includes(needle) || tn.city.toLowerCase().includes(needle) || tn.slug.includes(needle)),
    );
  }, [s.tenants, q, filter]);

  const chooseFilter = (v: Filter) => {
    setFilter(v);
    if (v === 'mora') markTour('dashboard');
  };

  const statusDetail = (tn: Tenant) => {
    if (tn.status === 'prueba') return t('dashboard.trialLeft', { days: trialDaysLeft(tn) });
    if (tn.status === 'mora') {
      const d = s.dunning.find((x) => x.tenantId === tn.id);
      return d ? t('dashboard.dunningStage', { day: ['0', '3', '7', '10'][d.stage] }) : '';
    }
    if (tn.status === 'cancelado' && tn.cancelledAt) return t('dashboard.cancelledOn', { date: f.date(tn.cancelledAt) });
    return '';
  };

  const exportCsv = () => {
    const sep = f.loc === 'en' ? ',' : ';';
    downloadCsv(
      `clientes-${DEMO_PERIOD}.csv`,
      [t('dashboard.cols.tenant'), 'NIT', t('dashboard.cols.subdomain'), t('dashboard.cols.city'), t('dashboard.cols.plan'), t('dashboard.cols.units'), t('dashboard.cols.staff'), t('dashboard.cols.status'), t('dashboard.cols.monthly')],
      list.map((tn) => [
        tn.name, formatNit(tn.nit), `${tn.slug}.${BASE_DOMAIN}`, tn.city, t(`plans.${tn.plan}.name`), tn.units, staffCount(s.members, tn.id), t(`status.${tn.status}`), PLANS[tn.plan].price,
      ]),
      sep,
    );
    markTour('dashboard');
  };

  const openTenant = (id: string, area: 'portal' | 'billing' | 'access') => {
    select(area, id);
    go(area);
  };

  const kpis = [
    { key: 'mrr', value: f.money(current), sub: t('dashboard.kpi.mrrSub', { amount: f.money(potentialMrr(s.tenants)) }) },
    { key: 'collected', value: f.money(collectedThisMonth(s)), sub: t('dashboard.kpi.collectedSub', { n: invoicesThisMonth }) },
    { key: 'active', value: String(countBy(s.tenants, 'activo')), sub: t('dashboard.kpi.activeSub', { n: countBy(s.tenants, 'prueba') }) },
    { key: 'overdue', value: String(countBy(s.tenants, 'mora') + countBy(s.tenants, 'suspendido')), sub: t('dashboard.kpi.overdueSub', { amount: f.money(atRisk(s.tenants)) }) },
    { key: 'moves', value: `${newThisMonth(s.tenants)} / ${churnThisMonth(s.tenants)}`, sub: t('dashboard.kpi.movesSub') },
  ];

  return (
    <div className="space-y-5">
      <ScreenHeader title={t('screens.dashboard.title')} subtitle={t('screens.dashboard.subtitle')}>
        <Button size="sm" onClick={() => go('onboarding')}>
          <PlusIcon className="mr-1 h-4 w-4" />
          {t('dashboard.newTenant')}
        </Button>
      </ScreenHeader>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.key} className="rounded-xl border border-secondary-200 bg-white p-3 dark:border-secondary-700 dark:bg-secondary-900 sm:p-4">
            <div className="text-xs font-medium text-secondary-500 dark:text-secondary-400">{t(`dashboard.kpi.${k.key}`)}</div>
            <div className="mt-1 break-words text-lg font-bold text-secondary-900 dark:text-white sm:text-xl">{k.value}</div>
            <div className="mt-0.5 text-[11px] text-secondary-500 dark:text-secondary-400">{k.sub}</div>
          </div>
        ))}
      </div>

      <Panel title={t('dashboard.chartTitle')} subtitle={t('dashboard.chartSubtitle')}>
        <div className="flex h-40 items-end gap-2 sm:gap-4">
          {history.map((h) => {
            const isNow = h.period === DEMO_PERIOD;
            return (
              <div key={h.period} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                <span className="hidden text-[10px] text-secondary-500 sm:block">{f.money(h.mrr)}</span>
                <div
                  className={`w-full max-w-[56px] rounded-t-md ${isNow ? 'bg-primary-600' : 'bg-slate-400 dark:bg-slate-600'}`}
                  style={{ height: `${Math.max(4, Math.round((h.mrr / maxBar) * 100))}%` }}
                  title={`${f.period(h.period)}: ${f.money(h.mrr)}`}
                />
                <span className={`text-[11px] ${isNow ? 'font-semibold text-primary-700 dark:text-primary-300' : 'text-secondary-500'}`}>
                  {monthShort(h.period, f.loc)}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-secondary-500 dark:text-secondary-400">{t('dashboard.chartNote')}</p>
      </Panel>

      <Panel
        title={t('dashboard.listTitle')}
        subtitle={t('dashboard.listSubtitle', { shown: list.length, total: s.tenants.length })}
        actions={
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={list.length === 0}>
            <ArrowDownTrayIcon className="mr-1 h-4 w-4" />
            {t('common.exportCsv')}
          </Button>
        }
      >
        <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center">
          <label className="relative block lg:w-72">
            <span className="sr-only">{t('dashboard.search')}</span>
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-secondary-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('dashboard.search')} className={`${inputCls} pl-8`} />
          </label>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('dashboard.filterLabel')}>
            {(['all', ...TENANT_STATUSES] as Filter[]).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={filter === v}
                onClick={() => chooseFilter(v)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  filter === v ? 'bg-slate-700 text-white' : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-200'
                }`}
              >
                {v === 'all' ? t('common.all') : t(`status.${v}`)} ({v === 'all' ? s.tenants.length : countBy(s.tenants, v)})
              </button>
            ))}
          </div>
        </div>

        {list.length === 0 ? (
          <p className="rounded-lg bg-secondary-50 p-4 text-center text-sm text-secondary-500 dark:bg-secondary-800/50">{t('dashboard.empty')}</p>
        ) : (
          <ul className="divide-y divide-secondary-100 rounded-lg border border-secondary-200 dark:divide-secondary-800 dark:border-secondary-700">
            {list.map((tn) => {
              const expanded = open === tn.id;
              return (
                <Fragment key={tn.id}>
                  <li>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => {
                        setOpen(expanded ? null : tn.id);
                        setConfirmCancel(null);
                        markTour('dashboard');
                      }}
                      className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 text-left hover:bg-secondary-50 dark:hover:bg-secondary-800/50 md:grid-cols-[auto_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto]"
                    >
                      <TenantAvatar tenant={tn} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-secondary-900 dark:text-white">{tn.name}</span>
                        <span className="block truncate text-xs text-secondary-500">{tn.slug}.{BASE_DOMAIN}</span>
                      </span>
                      <span className="hidden min-w-0 truncate text-xs text-secondary-600 dark:text-secondary-300 md:block">
                        {t(`plans.${tn.plan}.name`)}
                        <span className="block text-secondary-500">{tn.city}</span>
                      </span>
                      <span className="hidden text-right text-sm font-medium text-secondary-900 dark:text-white md:block">
                        {f.money(PLANS[tn.plan].price)}
                        <span className="block text-[11px] font-normal text-secondary-500">{t('common.perMonth')}</span>
                      </span>
                      <span className="flex flex-col items-end gap-0.5">
                        <StatusBadge status={tn.status} />
                        <span className="text-[11px] text-secondary-500">{statusDetail(tn)}</span>
                      </span>
                      <ChevronDownIcon className={`hidden h-4 w-4 text-secondary-400 transition-transform md:block ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                  </li>
                  {expanded && (
                    <li className="bg-secondary-50 px-3 py-3 dark:bg-secondary-800/40">
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
                        <div><dt className="text-secondary-500">NIT</dt><dd className="font-medium text-secondary-900 dark:text-white">{formatNit(tn.nit)}</dd></div>
                        <div><dt className="text-secondary-500">{t('dashboard.cols.plan')}</dt><dd className="font-medium text-secondary-900 dark:text-white">{t(`plans.${tn.plan}.name`)} · {f.money(PLANS[tn.plan].price)}</dd></div>
                        <div><dt className="text-secondary-500">{t('dashboard.since')}</dt><dd className="font-medium text-secondary-900 dark:text-white">{f.date(tn.createdAt)}</dd></div>
                        <div className="min-w-0"><dt className="text-secondary-500">{t('dashboard.contact')}</dt><dd className="truncate font-medium text-secondary-900 dark:text-white">{tn.email}</dd></div>
                      </dl>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        {usage(s, tn).map((u) => (
                          <div key={u.key}>
                            <div className="mb-1 flex justify-between text-[11px] text-secondary-600 dark:text-secondary-300">
                              <span>{t(`usage.${u.key}`)}</span>
                              <span>{f.num(u.value, u.key === 'storage' ? 1 : 0)}{u.unit} / {f.num(u.max)}{u.unit}</span>
                            </div>
                            <ProgressBar value={u.value} max={u.max} />
                          </div>
                        ))}
                      </div>
                      {tn.status !== 'cancelado' ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => openTenant(tn.id, 'portal')}>{t('dashboard.actions.portal')}</Button>
                          <Button size="sm" variant="outline" onClick={() => openTenant(tn.id, 'billing')}>{t('dashboard.actions.billing')}</Button>
                          <Button size="sm" variant="outline" onClick={() => openTenant(tn.id, 'access')}>{t('dashboard.actions.access')}</Button>
                          {confirmCancel === tn.id ? (
                            <span className="flex flex-wrap items-center gap-2 text-xs text-red-700 dark:text-red-300">
                              {t('dashboard.cancelConfirm')}
                              <Button size="sm" variant="danger" onClick={() => { cancelTenant(tn.id); setConfirmCancel(null); }}>{t('dashboard.actions.cancelYes')}</Button>
                              <Button size="sm" variant="ghost" onClick={() => setConfirmCancel(null)}>{t('common.cancel')}</Button>
                            </span>
                          ) : (
                            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setConfirmCancel(tn.id)}>{t('dashboard.actions.cancel')}</Button>
                          )}
                        </div>
                      ) : (
                        <p className="mt-3 text-xs text-secondary-500">{t('dashboard.cancelledNote')}</p>
                      )}
                    </li>
                  )}
                </Fragment>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
