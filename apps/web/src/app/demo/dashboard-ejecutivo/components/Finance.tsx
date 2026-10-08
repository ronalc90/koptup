'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDownTrayIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { BUCKETS, movements, openInvoices, pnl } from '../lib/engine';
import { toCsv } from '../lib/csv';
import { slugify } from '../lib/format';
import { useDashboard } from '../lib/store';
import { CashChart, StackBar } from './charts';
import { btn, card, downloadText, Note, NS, SectionTitle, useFmt, useLabels } from './ui';

export default function Finance() {
  const t = useTranslations(`${NS}.finance`);
  const fmt = useFmt();
  const labels = useLabels();
  const { ctx, period, dataset, setUpload, openCustomer, company, notify } = useDashboard();
  const [showWeeks, setShowWeeks] = useState(false);
  const lines = useMemo(() => pnl(ctx.idx, period.months, ctx.params.goalGrowth), [ctx, period.months]);
  const moves = useMemo(() => movements(ctx.idx, period.months), [ctx.idx, period.months]);

  if (!dataset.expenses) {
    const gross = lines;
    return (
      <div className="space-y-6">
        <section className={`${card} p-6`}>
          <SectionTitle title={t('uploadTitle')} subtitle={t('uploadSubtitle')} />
          {dataset.hasCost ? (
            <table className="w-full text-sm max-w-xl">
              <tbody>
                {gross.map((l) => (
                  <tr key={l.key} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 text-slate-700 dark:text-slate-200">{t(`pnl.rows.${l.key}`)}</td>
                    <td className="py-2 text-right font-semibold text-slate-900 dark:text-white">{fmt.moneyM(l.real)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Note tone="amber">{t('uploadNoCost')}</Note>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={btn.primary} onClick={() => setUpload(null)}>
              {t('backToSample')}
            </button>
          </div>
        </section>
      </div>
    );
  }

  const pnlName = (key: string, kind: string) => (kind === 'expense' ? labels.expense(key) : t(`pnl.rows.${key}`));
  const sales = lines[0].real;
  const aging = ctx.aging;
  const cash = ctx.cash;
  const floor = ctx.params.thresholds.cashFloor * 1e6;

  const exportReceivables = () => {
    if (!aging) return;
    const open = openInvoices(ctx.idx, aging.asOf).sort((a, b) => b.daysOverdue - a.daysOverdue);
    const csv = toCsv(
      [t('csv.invoice'), t('csv.customer'), t('csv.date'), t('csv.due'), t('csv.daysOverdue'), t('csv.bucket'), t('csv.value')],
      open.map((o) => [o.row.id, o.row.customer, o.row.date, o.row.due, Math.max(0, o.daysOverdue), t(`aging.buckets.${o.bucket}`), Math.round(o.row.value)]),
      fmt.loc,
    );
    const file = `cartera-${slugify(company.name)}-${aging.asOf}.csv`;
    downloadText(csv, file, 'text/csv;charset=utf-8');
    notify(t('exported', { file, count: open.length }));
  };

  return (
    <div className="space-y-6">
      <section className={`${card} p-5 sm:p-6`} aria-labelledby="fin-pnl">
        <SectionTitle title={<span id="fin-pnl">{t('pnl.title')}</span>} subtitle={t('pnl.subtitle', { period: fmt.period(period), goal: fmt.num(ctx.params.goalGrowth, 1) })} />
        <div className="overflow-x-auto -mx-2 sm:-mx-1">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <th className="py-2 px-1 text-left font-semibold">{t('pnl.concept')}</th>
                <th className="py-2 px-1 sm:px-2 text-right font-semibold">{t('pnl.real')}</th>
                <th className="py-2 px-1 sm:px-2 text-right font-semibold">{t('pnl.budget')}</th>
                <th className="py-2 px-1 sm:px-2 text-right font-semibold">{t('pnl.variance')}</th>
                <th className="py-2 px-1 text-right font-semibold hidden sm:table-cell">{t('pnl.ofSales')}</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => {
                const strong = l.kind !== 'expense';
                const isCost = l.kind === 'cost' || l.kind === 'expense' || l.kind === 'expenses';
                const variance = l.budget ? l.real / l.budget - 1 : null;
                const good = variance === null ? null : isCost ? variance <= 0 : variance >= 0;
                return (
                  <tr key={l.key} className={`border-b border-slate-100 dark:border-slate-800 ${strong ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                    <td className={`py-2 px-1 ${l.kind === 'expense' ? 'pl-3 sm:pl-5' : ''}`}>{pnlName(l.key, l.kind)}</td>
                    <td className="py-2 px-1 sm:px-2 text-right whitespace-nowrap">{fmt.moneyM(l.real)}</td>
                    <td className="py-2 px-1 sm:px-2 text-right whitespace-nowrap">{l.budget !== null ? fmt.moneyM(l.budget) : '—'}</td>
                    <td className={`py-2 px-1 sm:px-2 text-right whitespace-nowrap ${good === null ? '' : good ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                      {variance !== null ? fmt.signedPct(variance) : '—'}
                    </td>
                    <td className="py-2 px-1 text-right whitespace-nowrap hidden sm:table-cell">{sales ? fmt.pct(l.real / sales) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <Note>{t('pnl.note')}</Note>
        </div>
      </section>

      {aging && (
        <section className={`${card} p-5 sm:p-6`} aria-labelledby="fin-aging">
          <SectionTitle
            title={<span id="fin-aging">{t('aging.title')}</span>}
            subtitle={t('aging.subtitle', { date: fmt.date(aging.asOf), total: fmt.moneyM(aging.total) })}
            actions={
              <button type="button" className={btn.small} onClick={exportReceivables}>
                <ArrowDownTrayIcon className="w-4 h-4" aria-hidden="true" />
                {t('aging.export')}
              </button>
            }
          />
          <StackBar parts={BUCKETS.map((b) => ({ key: b, label: t(`aging.buckets.${b}`), value: aging.buckets[b] }))} fmt={fmt} />
          <h4 className="mt-6 mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{t('aging.topTitle')}</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2 text-left font-semibold">{t('aging.customer')}</th>
                  <th className="py-2 px-2 text-right font-semibold">{t('aging.over60')}</th>
                  <th className="py-2 px-2 text-right font-semibold hidden sm:table-cell">{t('aging.over90')}</th>
                  <th className="py-2 px-2 text-right font-semibold hidden sm:table-cell">{t('aging.totalOpen')}</th>
                </tr>
              </thead>
              <tbody>
                {aging.customers
                  .filter((c) => c.over60 > 0)
                  .slice(0, 5)
                  .map((c) => (
                    <tr key={c.customer} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2">
                        <button type="button" className="text-left font-medium text-purple-700 dark:text-purple-300 hover:underline" onClick={() => openCustomer(c.customer)}>
                          {c.customer}
                        </button>
                      </td>
                      <td className="py-2 px-2 text-right whitespace-nowrap">{fmt.moneyM(c.over60)}</td>
                      <td className="py-2 px-2 text-right whitespace-nowrap hidden sm:table-cell">{fmt.moneyM(c.over90)}</td>
                      <td className="py-2 px-2 text-right whitespace-nowrap hidden sm:table-cell">{fmt.moneyM(c.total)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {aging.over60 > 0 && (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {t('aging.concentration', {
                share: fmt.pct(
                  aging.customers
                    .filter((c) => c.over60 > 0)
                    .slice(0, 5)
                    .reduce((s, c) => s + c.over60, 0) / aging.over60,
                  0,
                ),
              })}
            </p>
          )}
        </section>
      )}

      {cash && (
        <section className={`${card} p-5 sm:p-6`} aria-labelledby="fin-cash">
          <SectionTitle
            title={
              <span id="fin-cash" className="inline-flex items-center gap-2">
                <BanknotesIcon className="w-6 h-6 text-blue-600" aria-hidden="true" />
                {t('cash.title')}
              </span>
            }
            subtitle={t('cash.subtitle', { date: fmt.date(dataset.cutoff) })}
            actions={
              <button type="button" className={btn.small} onClick={() => setShowWeeks((v) => !v)} aria-pressed={showWeeks}>
                {showWeeks ? t('cash.hideWeeks') : t('cash.showWeeks')}
              </button>
            }
          />
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {[
              { k: 'today', v: fmt.moneyM(cash.start), s: fmt.date(dataset.cutoff) },
              { k: 'min', v: fmt.moneyM(cash.min.balance), s: t('cash.weekOf', { date: fmt.date(cash.min.start) }) },
              { k: 'week8', v: fmt.moneyM(cash.weeks[7].balance), s: t('cash.weekOf', { date: fmt.date(cash.weeks[7].start) }) },
              { k: 'week13', v: fmt.moneyM(cash.weeks[12].balance), s: t('cash.weekOf', { date: fmt.date(cash.weeks[12].start) }) },
            ].map((x) => (
              <div key={x.k} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                <dt className="text-xs text-slate-500 dark:text-slate-400">{t(`cash.kpi.${x.k}`)}</dt>
                <dd className="text-lg font-bold text-slate-900 dark:text-white">{x.v}</dd>
                <dd className="text-[11px] text-slate-500 dark:text-slate-400">{x.s}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300 mb-2">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#2a78d6] dark:bg-[#3987e5]" aria-hidden="true" />
              {t('cash.legendBalance')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-500" aria-hidden="true" />
              {t('cash.legendMin')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-600 dark:bg-red-500" aria-hidden="true" />
              {t('cash.legendBelow')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="18" height="6" aria-hidden="true">
                <line x1="0" y1="3" x2="18" y2="3" className="stroke-red-600 dark:stroke-red-400" strokeWidth="2" strokeDasharray="5 4" />
              </svg>
              {t('cash.legendFloor', { floor: fmt.moneyM(floor) })}
            </span>
            <span>{t('cash.legendMarkers')}</span>
          </div>
          <CashChart
            fmt={fmt}
            floor={floor}
            minN={cash.min.n}
            bars={cash.weeks.map((w) => ({
              n: w.n,
              label: fmt.date(w.start).replace(/ \d{4}$/, '').replace(/, \d{4}$/, ''),
              balance: w.balance,
              marker: w.events.includes('tax') ? t('cash.markerTax') : w.events.includes('bonus') ? t('cash.markerBonus') : undefined,
              detail: (
                <>
                  <div className="font-semibold mb-1">{t('cash.weekRange', { n: w.n, start: fmt.date(w.start), end: fmt.date(w.end) })}</div>
                  <div className="flex justify-between gap-3"><span>{t('cash.inflows')}</span><span>{fmt.moneyM(w.collections + w.newSales)}</span></div>
                  <div className="flex justify-between gap-3"><span>{t('cash.outflows')}</span><span>{fmt.moneyM(w.suppliers + w.payroll + w.rent + w.other + w.tax)}</span></div>
                  {w.tax > 0 && <div className="flex justify-between gap-3 text-amber-300"><span>{t('cash.tax')}</span><span>{fmt.moneyM(w.tax)}</span></div>}
                  <div className="flex justify-between gap-3 font-semibold mt-1"><span>{t('cash.balance')}</span><span>{fmt.moneyM(w.balance)}</span></div>
                </>
              ),
            }))}
          />
          {showWeeks && (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-xs min-w-[760px]">
                <thead>
                  <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2 text-left font-semibold">{t('cash.week')}</th>
                    <th className="py-2 px-2 text-right font-semibold">{t('cash.collections')}</th>
                    <th className="py-2 px-2 text-right font-semibold">{t('cash.newSales')}</th>
                    <th className="py-2 px-2 text-right font-semibold">{t('cash.suppliers')}</th>
                    <th className="py-2 px-2 text-right font-semibold">{t('cash.payroll')}</th>
                    <th className="py-2 px-2 text-right font-semibold">{t('cash.rentOther')}</th>
                    <th className="py-2 px-2 text-right font-semibold">{t('cash.tax')}</th>
                    <th className="py-2 pl-2 text-right font-semibold">{t('cash.balance')}</th>
                  </tr>
                </thead>
                <tbody>
                  {cash.weeks.map((w) => (
                    <tr key={w.n} className={`border-b border-slate-100 dark:border-slate-800 ${w.n === cash.min.n ? 'bg-amber-50 dark:bg-amber-950/30' : ''}`}>
                      <td className="py-1.5 whitespace-nowrap">{t('cash.weekRange', { n: w.n, start: fmt.date(w.start), end: fmt.date(w.end) })}</td>
                      <td className="py-1.5 px-2 text-right">{fmt.moneyM(w.collections)}</td>
                      <td className="py-1.5 px-2 text-right">{fmt.moneyM(w.newSales)}</td>
                      <td className="py-1.5 px-2 text-right">−{fmt.moneyM(w.suppliers)}</td>
                      <td className="py-1.5 px-2 text-right">−{fmt.moneyM(w.payroll)}</td>
                      <td className="py-1.5 px-2 text-right">−{fmt.moneyM(w.rent + w.other)}</td>
                      <td className="py-1.5 px-2 text-right">{w.tax ? `−${fmt.moneyM(w.tax)}` : '—'}</td>
                      <td className={`py-1.5 pl-2 text-right font-semibold ${w.balance < floor ? 'text-red-700 dark:text-red-400' : ''}`}>{fmt.moneyM(w.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3 space-y-2">
            <Note>
              {t('cash.method', {
                days: cash.collectionDays,
                supplierDays: cash.supplierDays,
                excluded: fmt.moneyM(cash.excludedOver180),
              })}
            </Note>
            {dataset.iva && <Note>{t('cash.taxNote', { date: cash.taxDate ? fmt.date(cash.taxDate) : '—' })}</Note>}
          </div>
        </section>
      )}

      {moves.length > 0 && (
        <section className={`${card} p-5 sm:p-6`} aria-labelledby="fin-moves">
          <SectionTitle title={<span id="fin-moves">{t('moves.title')}</span>} subtitle={t('moves.subtitle', { period: fmt.periodIn(period) })} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2 text-left font-semibold hidden sm:table-cell">{t('moves.date')}</th>
                  <th className="py-2 px-2 text-left font-semibold">{t('moves.concept')}</th>
                  <th className="py-2 pl-2 text-right font-semibold">{t('moves.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {moves.map((m, i) => (
                  <tr key={`${m.date}-${m.kind}-${i}`} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 whitespace-nowrap text-slate-600 dark:text-slate-300 hidden sm:table-cell">{fmt.date(m.date)}</td>
                    <td className="py-2 sm:px-2 text-slate-800 dark:text-slate-100">
                      <span className="block sm:hidden text-xs text-slate-500 dark:text-slate-400">{fmt.date(m.date)}</span>
                      {m.kind === 'collection'
                        ? t('moves.collection', { customer: m.ref })
                        : m.kind === 'tax'
                          ? t('moves.tax', { from: fmt.month(m.ref.split('|')[0], true), to: fmt.month(m.ref.split('|')[1], true) })
                          : t(`moves.${m.kind}`, { month: fmt.month(m.ref) })}
                    </td>
                    <td className={`py-2 pl-2 text-right font-semibold whitespace-nowrap ${m.amount >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                      {m.amount >= 0 ? '+' : '−'}
                      {fmt.money(Math.abs(m.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <Note>{t('moves.note')}</Note>
          </div>
        </section>
      )}
    </div>
  );
}
