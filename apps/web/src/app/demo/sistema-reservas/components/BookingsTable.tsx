'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDownTrayIcon, ArrowPathIcon, ArrowsUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { EMPTY_FILTERS, balanceOf, filterBookings, locationOf, serviceOf, staffOf, type RangeFilter, type TableFilters } from '../lib/engine';
import { download, fileSlug, toCsv } from '../lib/files';
import { hhmm } from '../lib/dates';
import { useReservas } from '../lib/store';
import { STATUSES } from '../lib/types';
import { StatusBadge, btnSmall, inputCls, selectCls, useFmt, useKind, useToast } from './ui';

const RANGES: RangeFilter[] = ['today', 'week', 'month', 'upcoming', 'past', 'all'];
const PAGE = 25;

export default function BookingsTable({ viewAs, onOpen }: { viewAs: string; onOpen: (id: string) => void }) {
  const t = useTranslations('demoReservas.table');
  const ts = useTranslations('demoReservas.status');
  const tc = useTranslations('demoReservas.channel');
  const tm = useTranslations('demoReservas.method');
  const { biz, data, now, state } = useReservas();
  const f = useFmt();
  const kind = useKind(biz);
  const notify = useToast();
  const [filters, setFilters] = useState<TableFilters>(EMPTY_FILTERS);
  const [limit, setLimit] = useState(PAGE);
  const set = <K extends keyof TableFilters>(k: K, v: TableFilters[K]) => {
    setFilters((x) => ({ ...x, [k]: v }));
    setLimit(PAGE);
  };

  const effective = useMemo(() => (viewAs === 'all' ? filters : { ...filters, staffId: viewAs }), [viewAs, filters]);
  const rows = useMemo(() => filterBookings(data.bookings, effective, now.date), [data.bookings, effective, now.date]);
  const dirty = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  const exportCsv = () => {
    const sep = f.locale === 'en' ? ',' : ';';
    const header = [t('csv.code'), t('csv.date'), t('csv.time'), t('csv.client'), t('csv.phone'), t('csv.email'), t('csv.service'), kind.one, t('csv.location'), t('csv.status'), t('csv.channel'), t('csv.price'), t('csv.paid'), t('csv.method'), t('csv.balance'), t('csv.notes')];
    const body = rows.map((b) => {
      const svc = serviceOf(biz, b.serviceId);
      return [
        b.code,
        b.date,
        hhmm(b.start),
        b.client.name,
        b.client.phone,
        b.client.email,
        svc ? f.l(svc.name) : '',
        staffOf(biz, b.staffId)?.name ?? '',
        locationOf(biz, b.locationId)?.name ?? '',
        ts(b.status),
        tc(b.channel),
        svc?.price ?? 0,
        b.payment.amount,
        b.payment.kind === 'none' ? tm('onsite') : tm(b.payment.method),
        balanceOf(biz, b),
        b.notes,
      ];
    });
    download(`reservas-${fileSlug(biz)}-${now.date}.csv`, toCsv([header, ...body], sep), 'text/csv;charset=utf-8');
    notify(t('csvDone', { n: rows.length }));
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="relative sm:col-span-2 lg:col-span-1 xl:col-span-2">
          <label htmlFor="tb-q" className="sr-only">
            {t('search')}
          </label>
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input id="tb-q" className={`${inputCls} pl-9`} placeholder={t('searchPh')} value={filters.q} onChange={(e) => set('q', e.target.value)} />
        </div>
        <select aria-label={t('range')} className={selectCls} value={filters.range} onChange={(e) => set('range', e.target.value as RangeFilter)}>
          {RANGES.map((r) => (
            <option key={r} value={r}>
              {t(`ranges.${r}`)}
            </option>
          ))}
        </select>
        <select aria-label={t('service')} className={selectCls} value={filters.serviceId} onChange={(e) => set('serviceId', e.target.value)}>
          <option value="all">{t('allServices')}</option>
          {biz.services.map((s) => (
            <option key={s.id} value={s.id}>
              {f.l(s.name)}
            </option>
          ))}
        </select>
        {viewAs === 'all' && (
          <select aria-label={kind.one} className={selectCls} value={filters.staffId} onChange={(e) => set('staffId', e.target.value)}>
            <option value="all">{t('allStaff', { kind: kind.many.toLowerCase() })}</option>
            {biz.staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
        <select aria-label={t('status')} className={selectCls} value={filters.status} onChange={(e) => set('status', e.target.value)}>
          <option value="all">{t('allStatuses')}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {ts(s)}
            </option>
          ))}
        </select>
        <select aria-label={t('location')} className={selectCls} value={filters.locationId} onChange={(e) => set('locationId', e.target.value)}>
          <option value="all">{t('allLocations')}</option>
          {biz.locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-slate-600 dark:text-slate-300 mr-auto" aria-live="polite">
          {t('count', { n: rows.length })}
        </p>
        <button type="button" className={btnSmall} onClick={() => set('sort', filters.sort === 'asc' ? 'desc' : 'asc')}>
          <ArrowsUpDownIcon className="h-4 w-4" />
          {filters.sort === 'asc' ? t('sortAsc') : t('sortDesc')}
        </button>
        <button
          type="button"
          className={btnSmall}
          disabled={!dirty}
          onClick={() => {
            setFilters(EMPTY_FILTERS);
            setLimit(PAGE);
          }}
        >
          <ArrowPathIcon className="h-4 w-4" />
          {t('clear')}
        </button>
        <button type="button" className={btnSmall} onClick={exportCsv} disabled={!rows.length}>
          <ArrowDownTrayIcon className="h-4 w-4" />
          {t('exportCsv')}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-3 py-2.5 font-semibold">{t('cols.when')}</th>
              <th className="px-3 py-2.5 font-semibold">{t('cols.client')}</th>
              <th className="px-3 py-2.5 font-semibold">{t('cols.service')}</th>
              <th className="px-3 py-2.5 font-semibold">{kind.one}</th>
              <th className="px-3 py-2.5 font-semibold">{t('cols.status')}</th>
              <th className="px-3 py-2.5 font-semibold">{t('cols.payment')}</th>
              <th className="px-3 py-2.5 font-semibold sr-only">{t('cols.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-slate-500 dark:text-slate-400">
                  {t('empty')}
                </td>
              </tr>
            )}
            {rows.slice(0, limit).map((b) => {
              const svc = serviceOf(biz, b.serviceId);
              const isNew = b.id === state.lastBookingId;
              return (
                <tr key={b.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${isNew ? 'bg-orange-50 dark:bg-orange-950/30' : ''}`}>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="block font-medium text-slate-900 dark:text-white">{f.date(b.date, 'short')}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {f.time(b.start)} · {b.code}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="block font-medium text-slate-900 dark:text-white">{b.client.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {b.client.phone} · {tc(b.channel)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-700 dark:text-slate-200">
                    {svc ? f.l(svc.name) : ''}
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{locationOf(biz, b.locationId)?.name}</span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-700 dark:text-slate-200">{staffOf(biz, b.staffId)?.name}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {b.payment.kind === 'none' ? t('payOnsite') : t('paidOnline', { amount: f.money(b.payment.amount), method: tm(b.payment.method) })}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button type="button" className={btnSmall} onClick={() => onOpen(b.id)}>
                      {t('open')}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length > limit && (
        <div className="text-center">
          <button type="button" className={btnSmall} onClick={() => setLimit((l) => l + PAGE)}>
            {t('more', { n: rows.length - limit })}
          </button>
        </div>
      )}
    </div>
  );
}
