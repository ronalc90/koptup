'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ClipboardDocumentIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  SparklesIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { yearSeries } from '../lib/engine';
import { useDashboard } from '../lib/store';
import { Donut, GoalBars, SalesChart, type Slice } from './charts';
import { useNarrative } from './narrative';
import { btn, card, Delta, Note, NS, SectionTitle, useFmt, useLabels } from './ui';

export function KpiCards() {
  const t = useTranslations(`${NS}.kpis`);
  const fmt = useFmt();
  const { ctx, dataset } = useDashboard();
  const k = ctx.kpis;
  const prevYear = ctx.period.year - 1;
  const cards = [
    {
      id: 'sales',
      icon: CurrencyDollarIcon,
      color: 'from-green-500 to-emerald-600',
      title: t('sales.title'),
      value: fmt.moneyM(k.sales),
      delta: k.compliance !== null ? <Delta value={k.compliance - 1} text={t('sales.badge', { pct: fmt.pct(k.compliance, 0) })} title={t('sales.badgeHint')} /> : null,
      note: k.compliance !== null ? t('sales.note', { pct: fmt.pct(k.compliance, 0), budget: fmt.moneyM(k.budget ?? 0) }) : t('sales.noGoal'),
      sub: k.salesYoy !== null ? t('yoyVs', { pct: fmt.signedPct(k.salesYoy), year: prevYear }) : null,
    },
    k.margin !== null
      ? {
          id: 'margin',
          icon: ChartBarIcon,
          color: 'from-orange-500 to-orange-600',
          title: t('margin.title'),
          value: fmt.pct(k.margin),
          delta: k.marginPrev !== null ? <Delta value={k.margin - k.marginPrev} text={fmt.signedPts(k.margin - k.marginPrev)} /> : null,
          note: k.marginPrev !== null ? t('margin.note', { delta: fmt.signedPts(k.margin - k.marginPrev) }) : t('margin.noPrev'),
          sub: t('margin.formula'),
        }
      : {
          id: 'margin',
          icon: ChartBarIcon,
          color: 'from-slate-400 to-slate-500',
          title: t('margin.title'),
          value: '—',
          delta: null,
          note: t('margin.noCost'),
          sub: null,
        },
    k.over60 !== null
      ? {
          id: 'overdue',
          icon: ClockIcon,
          color: 'from-purple-500 to-purple-600',
          title: t('overdue.title'),
          value: fmt.moneyM(k.over60),
          delta: k.over60Prev ? <Delta value={k.over60 / k.over60Prev - 1} goodWhenUp={false} text={fmt.signedPct(k.over60 / k.over60Prev - 1)} title={t('overdue.badgeHint')} /> : null,
          note: t('overdue.note', { date: fmt.date(ctx.aging?.asOf ?? dataset.cutoff) }),
          sub: k.over60Prev !== null ? t('overdue.prev', { value: fmt.moneyM(k.over60Prev) }) : null,
        }
      : {
          id: 'customers',
          icon: UsersIcon,
          color: 'from-purple-500 to-purple-600',
          title: t('customers.title'),
          value: fmt.num(k.activeCustomers),
          delta: k.activeCustomersYoy !== null ? <Delta value={k.activeCustomersYoy} text={fmt.signedPct(k.activeCustomersYoy)} /> : null,
          note: t('customers.note'),
          sub: null,
        },
    {
      id: 'ticket',
      icon: ShoppingBagIcon,
      color: 'from-blue-500 to-blue-600',
      title: t('ticket.title'),
      value: fmt.moneyM(k.ticket),
      delta: k.ticketYoy !== null ? <Delta value={k.ticketYoy} text={fmt.signedPct(k.ticketYoy)} title={t('yoyVs', { pct: fmt.signedPct(k.ticketYoy), year: prevYear })} /> : null,
      note: t('ticket.note', { count: k.invoices }),
      sub: k.ticketYoy !== null ? t('yoyVs', { pct: fmt.signedPct(k.ticketYoy), year: prevYear }) : null,
    },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.id} className={`${card} overflow-hidden`} data-testid={`exec-kpi-${c.id}`}>
            <div className={`h-2 bg-gradient-to-r ${c.color}`} />
            <div className="p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className={`p-3 bg-gradient-to-br ${c.color} rounded-xl`}>
                  <Icon className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                {c.delta}
              </div>
              <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 break-words">{c.value}</p>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{c.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{c.note}</p>
              {c.sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{c.sub}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Overview() {
  const t = useTranslations(`${NS}.overview`);
  const tc = useTranslations(`${NS}.charts`);
  const fmt = useFmt();
  const labels = useLabels();
  const { ctx, period, findings, setView, dataset, notify } = useDashboard();
  const { findingText } = useNarrative();
  const [table, setTable] = useState(false);
  const series = useMemo(() => yearSeries(ctx.idx, period.year, ctx.params.goalGrowth, ctx.fc), [ctx, period.year]);
  const slices: Slice[] = useMemo(() => {
    const top = ctx.lines.slice(0, 4).map((l) => ({
      key: l.key,
      label: labels.line(l.key),
      value: l.sales,
      extra: dataset.hasCost ? t('marginShort', { pct: fmt.pct(l.margin) }) : undefined,
    }));
    const rest = ctx.lines.slice(4);
    if (rest.length) top.push({ key: '__other', label: t('others', { count: rest.length }), value: rest.reduce((s, l) => s + l.sales, 0), extra: undefined });
    return top;
  }, [ctx.lines, labels, dataset.hasCost, fmt, t]);
  const cityItems = ctx.cities.slice(0, 8).map((c) => ({ key: c.key, label: c.key, value: c.sales, budget: c.budget }));

  const copyFindings = async () => {
    const text = findings.map((f) => `• ${findingText(f)}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      notify(t('copied'));
    } catch {
      notify(t('copyError'), 'error');
    }
  };

  return (
    <>
      <KpiCards />
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <section className={`${card} p-5 sm:p-6 xl:col-span-3 min-w-0`} aria-labelledby="ov-sales">
          <SectionTitle
            title={<span id="ov-sales">{t('salesTitle', { year: period.year })}</span>}
            subtitle={
              ctx.fc.method !== 'none'
                ? t('salesSubtitle', { goal: fmt.num(ctx.params.goalGrowth, 1), prev: period.year - 1, method: t(`method.${ctx.fc.method}`) })
                : t('salesSubtitleNoForecast', { goal: fmt.num(ctx.params.goalGrowth, 1), prev: period.year - 1 })
            }
            actions={
              <button type="button" className={btn.small} onClick={() => setTable((v) => !v)} aria-pressed={table}>
                {table ? tc('showChart') : tc('showTable')}
              </button>
            }
          />
          {table ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2 pr-3 font-semibold">{tc('month')}</th>
                    <th className="py-2 px-3 font-semibold text-right">{tc('actual')}</th>
                    <th className="py-2 px-3 font-semibold text-right">{tc('budget')}</th>
                    <th className="py-2 px-3 font-semibold text-right">{tc('forecast')}</th>
                    <th className="py-2 pl-3 font-semibold text-right">{tc('complianceShort')}</th>
                  </tr>
                </thead>
                <tbody>
                  {series.map((p) => (
                    <tr key={p.month} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-1.5 pr-3 text-slate-800 dark:text-slate-100">{fmt.monthTitle(p.month)}</td>
                      <td className="py-1.5 px-3 text-right">{p.actual !== null ? fmt.moneyM(p.actual) : '—'}</td>
                      <td className="py-1.5 px-3 text-right">{p.budget !== null ? fmt.moneyM(p.budget) : '—'}</td>
                      <td className="py-1.5 px-3 text-right">{p.forecast ? `${fmt.moneyM(p.forecast.value)} (${fmt.moneyM(p.forecast.low)}–${fmt.moneyM(p.forecast.high)})` : '—'}</td>
                      <td className="py-1.5 pl-3 text-right">
                        {p.budget ? fmt.pct((p.actual ?? p.forecast?.value ?? 0) / p.budget, 0) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <SalesChart points={series} highlight={period.months} fmt={fmt} />
          )}
        </section>
        <section className={`${card} p-5 sm:p-6 xl:col-span-2 min-w-0`} aria-labelledby="ov-city">
          <SectionTitle title={<span id="ov-city">{t('cityTitle', { dim: labels.cityDimPlural.toLowerCase() })}</span>} subtitle={t('citySubtitle')} />
          <GoalBars items={cityItems} fmt={fmt} />
        </section>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <section className={`${card} p-5 sm:p-6 min-w-0`} aria-labelledby="ov-lines">
          <SectionTitle title={<span id="ov-lines">{t('linesTitle')}</span>} subtitle={t('linesSubtitle')} />
          <Donut slices={slices} fmt={fmt} centerLabel={t('total')} />
        </section>
        <section className={`${card} p-5 sm:p-6 min-w-0`} aria-labelledby="ov-findings">
          <SectionTitle
            title={
              <span id="ov-findings" className="inline-flex items-center gap-2">
                <SparklesIcon className="w-6 h-6 text-purple-600" aria-hidden="true" />
                {t('findingsTitle')}
              </span>
            }
            subtitle={t('findingsSubtitle')}
            actions={
              findings.length ? (
                <button type="button" className={btn.small} onClick={copyFindings}>
                  <ClipboardDocumentIcon className="w-4 h-4" aria-hidden="true" />
                  {t('copy')}
                </button>
              ) : undefined
            }
          />
          {findings.length ? (
            <ul className="space-y-3">
              {findings.map((f) => {
                const Icon = f.tone === 'good' ? ArrowTrendingUpIcon : f.tone === 'bad' ? ArrowTrendingDownIcon : SparklesIcon;
                const tone =
                  f.tone === 'good'
                    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40'
                    : f.tone === 'bad'
                      ? 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40'
                      : 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40';
                return (
                  <li key={f.kind} className={`p-4 rounded-xl ${tone}`}>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shrink-0">
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm mb-1">{t(`findingKinds.${f.kind}`)}</h4>
                        <p className="text-sm text-slate-700 dark:text-slate-200">{findingText(f)}</p>
                        {f.view !== 'resumen' && (
                          <button type="button" className={`${btn.link} mt-2`} onClick={() => setView(f.view)}>
                            {t(`goTo.${f.view}`)}
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">{t('noFindings')}</p>
          )}
          <div className="mt-4">
            <Note>{t('findingsNote')}</Note>
          </div>
        </section>
      </div>
    </>
  );
}
