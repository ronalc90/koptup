'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { kpis, serviceOf, staffOf } from '../lib/engine';
import { useReservas } from '../lib/store';
import { CHANNELS } from '../lib/types';
import { STAFF_COLORS, selectCls, useFmt, useKind } from './ui';

function Bar({ value, max, className }: { value: number; max: number; className: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
      <div className={`h-full rounded-full ${className}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Indicadores calculados en vivo sobre las reservas de la demo. */
export default function Indicators() {
  const t = useTranslations('demoReservas.kpi');
  const tc = useTranslations('demoReservas.channel');
  const { biz, data, now } = useReservas();
  const f = useFmt();
  const kind = useKind(biz);
  const [locationId, setLocationId] = useState('all');
  const k = useMemo(() => kpis(biz, data.bookings, now.date, locationId), [biz, data.bookings, now.date, locationId]);
  const maxService = Math.max(1, ...k.byService.map((s) => s.count));
  const totalChannel = Math.max(1, CHANNELS.reduce((a, c) => a + k.byChannel[c], 0));

  const cards = [
    { id: 'occupancy', value: f.pct(k.occupancy), detail: t('occupancyDetail', { from: f.date(k.weekStart, 'short'), to: f.date(k.weekEnd, 'short'), booked: Math.round(k.bookedMinutes / 60), available: Math.round(k.availableMinutes / 60) }) },
    { id: 'noshow', value: f.pct(k.noShowRate), detail: t('noshowDetail', { n: k.noShows, total: k.noShows + k.attended }) },
    { id: 'revenue', value: f.money(k.revenueMonth), detail: t('revenueDetail') },
    { id: 'prepaid', value: f.money(k.prepaidMonth), detail: t('prepaidDetail') },
    { id: 'upcoming', value: String(k.upcoming7), detail: t('upcomingDetail', { n: k.pendingUpcoming }) },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-300">{t('intro')}</p>
        <div className="sm:w-56">
          <label htmlFor="kpi-loc" className="sr-only">
            {t('location')}
          </label>
          <select id="kpi-loc" className={selectCls} value={locationId} onChange={(e) => setLocationId(e.target.value)}>
            <option value="all">{t('allLocations')}</option>
            {biz.locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((c) => (
          <div key={c.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t(`cards.${c.id}`)}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{c.value}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{c.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">{t('byStaff', { kind: kind.one.toLowerCase() })}</h3>
          <ul className="space-y-3">
            {k.byStaff
              .filter((s) => s.available > 0)
              .map((s) => {
                const staff = staffOf(biz, s.id);
                if (!staff) return null;
                return (
                  <li key={s.id}>
                    <div className="flex justify-between text-xs mb-1 gap-2">
                      <span className="truncate text-slate-700 dark:text-slate-200">{staff.name}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{f.pct(s.booked / s.available)}</span>
                    </div>
                    <Bar value={s.booked} max={s.available} className={STAFF_COLORS[staff.color].dot} />
                  </li>
                );
              })}
          </ul>
        </section>
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">{t('byService')}</h3>
          <ul className="space-y-3">
            {k.byService.map((s) => {
              const svc = serviceOf(biz, s.id);
              return (
                <li key={s.id}>
                  <div className="flex justify-between text-xs mb-1 gap-2">
                    <span className="truncate text-slate-700 dark:text-slate-200">{svc ? f.l(svc.name) : ''}</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{s.count}</span>
                  </div>
                  <Bar value={s.count} max={maxService} className="bg-orange-500" />
                </li>
              );
            })}
          </ul>
        </section>
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">{t('byChannel')}</h3>
          <ul className="space-y-3">
            {CHANNELS.map((c) => (
              <li key={c}>
                <div className="flex justify-between text-xs mb-1 gap-2">
                  <span className="text-slate-700 dark:text-slate-200">{tc(c)}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {k.byChannel[c]} · {f.pct(k.byChannel[c] / totalChannel)}
                  </span>
                </div>
                <Bar value={k.byChannel[c]} max={totalChannel} className="bg-sky-500" />
              </li>
            ))}
          </ul>
        </section>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{t('footnote')}</p>
    </div>
  );
}
