'use client';

import { useMemo, useState } from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import {
  Deal,
  OWNERS,
  PeriodId,
  forecastAlerts,
  forecastFor,
  monthlyTrend,
  stageDistribution,
} from './crm';
import { PlanBadge, SectionHeader } from './ui';
import { useCrmText } from './useCrmText';

interface Props {
  deals: Deal[];
  onOpen: (id: string) => void;
}

const pct = (v: number, total: number) => (total > 0 ? Math.min(100, (v / total) * 100) : 0);

export default function ForecastView({ deals, onOpen }: Props) {
  const tx = useCrmText();
  const { t } = tx;
  const [period, setPeriod] = useState<PeriodId>('quarter');

  const f = useMemo(() => forecastFor(deals, period), [deals, period]);
  const dist = useMemo(() => stageDistribution(deals), [deals]);
  const trend = useMemo(() => monthlyTrend(deals), [deals]);
  const alerts = useMemo(() => forecastAlerts(deals, period), [deals, period]);
  const maxBar = Math.max(1, ...trend.map((m) => Math.max(m.won, m.weighted)));
  const monthsShort = t.raw('dates.months') as string[];

  const cards = [
    { key: 'won', value: f.won, color: 'bg-green-500' },
    { key: 'commit', value: f.commit, color: 'bg-blue-500' },
    { key: 'projection', value: f.projection, color: 'bg-primary-600' },
    { key: 'best', value: f.best, color: 'bg-indigo-300 dark:bg-indigo-500' },
  ] as const;

  return (
    <div>
      <SectionHeader
        title={t('forecast.title')}
        subtitle={t('forecast.subtitle')}
        aside={
          <>
            <PlanBadge label={t('plans.advanced')} hint={t('plans.advancedForecastHint')} />
            <div
              className="inline-flex rounded-lg border border-secondary-200 dark:border-secondary-700 p-0.5"
              role="group"
              aria-label={t('forecast.periodLabel')}
            >
              {(['month', 'quarter'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={period === p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs sm:text-sm rounded-md font-medium transition-colors ${
                    period === p
                      ? 'bg-primary-600 text-white'
                      : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                  }`}
                >
                  {t(`forecast.period.${p}`)}
                </button>
              ))}
            </div>
          </>
        }
      />

      {/* Cumplimiento */}
      <div className="rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-4 sm:p-5 mb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-secondary-900 dark:text-white">{t('forecast.attainment')}</p>
            <p className="text-xs text-secondary-600 dark:text-secondary-400">
              {t('forecast.attainmentSub', { projection: tx.money(f.projection), quota: tx.money(f.quota) })}
            </p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-primary-700 dark:text-primary-300">{tx.pct(f.attainment)}</p>
        </div>
        <div className="h-3 rounded-full bg-secondary-100 dark:bg-secondary-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-700 transition-all"
            style={{ width: `${Math.min(100, f.attainment)}%` }}
          />
        </div>
        <p className="text-xs text-secondary-500 mt-2">{t('forecast.includesOverdue')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        {cards.map((c) => (
          <div
            key={c.key}
            className="rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-4"
          >
            <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-1">{t(`forecast.${c.key}`)}</p>
            <p className="text-xl font-bold text-secondary-900 dark:text-white">{tx.moneyShort(c.value)}</p>
            <p className="text-xs text-secondary-500 mb-2 min-h-[2rem]">{t(`forecast.${c.key}Sub`)}</p>
            <div
              className="h-2 rounded-full bg-secondary-100 dark:bg-secondary-800 overflow-hidden"
              title={t('forecast.ofQuota', { value: Math.round((c.value / f.quota) * 100) })}
            >
              <div className={`h-full ${c.color} transition-all`} style={{ width: `${pct(c.value, f.quota)}%` }} />
            </div>
            <p className="text-[11px] text-secondary-500 mt-1">
              {t('forecast.ofQuota', { value: Math.round((c.value / f.quota) * 100) })}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Por vendedor */}
        <div className="rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-4 sm:p-5">
          <h3 className="font-semibold text-secondary-900 dark:text-white mb-1">{t('forecast.byOwner')}</h3>
          <p className="text-xs text-secondary-500 mb-4">{t('forecast.byOwnerSub')}</p>
          <div className="space-y-4">
            {f.byOwner.map((o) => {
              const scale = Math.max(o.best, o.projection, 1);
              return (
                <div key={o.id}>
                  <div className="flex flex-wrap justify-between gap-x-2 text-xs mb-1.5">
                    <span className="font-medium text-secondary-800 dark:text-secondary-200">{OWNERS[o.id].name}</span>
                    <span className="text-secondary-600 dark:text-secondary-400">
                      {t('forecast.ownerLine', { projection: tx.moneyShort(o.projection), count: o.openCount })}
                    </span>
                  </div>
                  <div className="relative h-3 rounded-full bg-secondary-100 dark:bg-secondary-800 overflow-hidden" aria-hidden="true">
                    <div className="absolute inset-y-0 left-0 bg-indigo-200 dark:bg-indigo-900" style={{ width: `${pct(o.best, scale)}%` }} />
                    <div className="absolute inset-y-0 left-0 bg-primary-500" style={{ width: `${pct(o.projection, scale)}%` }} />
                    <div className="absolute inset-y-0 left-0 bg-green-500" style={{ width: `${pct(o.won, scale)}%` }} />
                  </div>
                  <p className="text-[11px] text-secondary-500 mt-1">
                    {t('forecast.ownerDetail', {
                      won: tx.moneyShort(o.won),
                      commit: tx.moneyShort(o.commit),
                      best: tx.moneyShort(o.best),
                    })}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-xs text-secondary-600 dark:text-secondary-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-green-500" /> {t('forecast.won')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-primary-500" /> {t('forecast.projection')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-indigo-200 dark:bg-indigo-900" /> {t('forecast.best')}
            </span>
          </div>
        </div>

        {/* Por etapa */}
        <div className="rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-4 sm:p-5">
          <h3 className="font-semibold text-secondary-900 dark:text-white mb-1">{t('forecast.byStage')}</h3>
          <p className="text-xs text-secondary-500 mb-4">{t('forecast.byStageSub')}</p>
          <div className="space-y-3">
            {dist.map((s) => (
              <div key={s.stage}>
                <div className="flex flex-wrap justify-between gap-x-2 text-xs mb-1.5">
                  <span className="font-medium text-secondary-800 dark:text-secondary-200">{t(`stages.${s.stage}`)}</span>
                  <span className="text-secondary-600 dark:text-secondary-400">
                    {t('forecast.stageLine', { count: s.count, value: tx.moneyShort(s.value), share: Math.round(s.share) })}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-secondary-100 dark:bg-secondary-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-700 transition-all"
                    style={{ width: `${s.share}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tendencia */}
      <div className="rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-4 sm:p-5 mb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <h3 className="font-semibold text-secondary-900 dark:text-white">{t('forecast.trend')}</h3>
          <span className="text-xs text-secondary-500">{t('forecast.trendUnit')}</span>
        </div>
        <div className="flex items-end gap-2 sm:gap-4 h-44" role="img" aria-label={t('forecast.trendAria')}>
          {trend.map((m) => {
            const monthIdx = Number(m.month.slice(5, 7)) - 1;
            const mWon = Math.round(m.won / 1_000_000);
            const mW = Math.round(m.weighted / 1_000_000);
            return (
              <div key={m.month} className="flex-1 min-w-0 h-full flex flex-col items-center gap-1">
                <div className="flex-1 w-full flex items-end justify-center gap-0.5 sm:gap-1">
                  <div className="flex-1 max-w-[28px] flex flex-col items-center justify-end h-full">
                    {mWon > 0 && <span className="text-[10px] text-secondary-600 dark:text-secondary-400 mb-0.5">{mWon}</span>}
                    <div className="w-full bg-green-500 rounded-t-md transition-all" style={{ height: `${pct(m.won, maxBar)}%` }} />
                  </div>
                  <div className="flex-1 max-w-[28px] flex flex-col items-center justify-end h-full">
                    {mW > 0 && <span className="text-[10px] text-secondary-600 dark:text-secondary-400 mb-0.5">{mW}</span>}
                    <div
                      className="w-full bg-primary-300 dark:bg-primary-700 rounded-t-md transition-all"
                      style={{ height: `${pct(m.weighted, maxBar)}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-secondary-600 dark:text-secondary-400">{monthsShort[monthIdx]}</span>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-secondary-600 dark:text-secondary-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-green-500" />
            {t('forecast.legendWon')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-primary-300 dark:bg-primary-700" />
            {t('forecast.legendWeighted')}
          </span>
        </div>
      </div>

      {/* Alertas */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-1">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <h3 className="font-semibold text-secondary-900 dark:text-white">{t('forecast.alerts')}</h3>
        </div>
        <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-3">{t('forecast.alertsHint')}</p>
        <ul className="space-y-2">
          {alerts.map((a, i) => {
            if (a.kind === 'gap' || a.kind === 'over') {
              return (
                <li key={`${a.kind}-${i}`} className="flex gap-2 text-sm text-secondary-800 dark:text-secondary-200">
                  {a.kind === 'over' ? (
                    <CheckCircleIcon className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" aria-hidden="true" />
                  ) : (
                    <span className="text-amber-600" aria-hidden="true">•</span>
                  )}
                  <span>{t(`forecast.alert.${a.kind}`, { value: tx.money(a.value), period: t(`forecast.period.${period}`) })}</span>
                </li>
              );
            }
            return (
              <li key={`${a.kind}-${a.deal.id}`} className="flex gap-2 text-sm text-secondary-800 dark:text-secondary-200">
                <span className="text-amber-600" aria-hidden="true">•</span>
                <span>
                  {t(`forecast.alert.${a.kind}`, {
                    company: a.deal.company,
                    days: a.days,
                    stage: t(`stages.${a.deal.stage}`),
                    value: tx.moneyShort(a.deal.value),
                  })}{' '}
                  <button
                    type="button"
                    onClick={() => onOpen(a.deal.id)}
                    className="text-primary-700 dark:text-primary-300 underline underline-offset-2 hover:no-underline"
                  >
                    {t('forecast.openDeal')}
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
