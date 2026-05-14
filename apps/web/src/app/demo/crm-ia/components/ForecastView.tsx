'use client';

import { useTranslations } from 'next-intl';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from './types';

export default function ForecastView() {
  const t = useTranslations('demoCrm');

  const quota = 850000;
  const weighted = 720000;
  const commit = 530000;
  const best = 980000;
  const attainment = Math.min(100, Math.round((weighted / quota) * 100));

  const owners = [
    { name: 'Ronald', commit: 260000, best: 410000, weighted: 320000 },
    { name: 'Camila', commit: 180000, best: 340000, weighted: 250000 },
    { name: 'Lucas', commit: 90000, best: 230000, weighted: 150000 },
  ];

  const months: { key: 'jan' | 'feb' | 'mar' | 'apr' | 'may' | 'jun'; weighted: number; closed: number }[] = [
    { key: 'jan', weighted: 410, closed: 320 },
    { key: 'feb', weighted: 480, closed: 380 },
    { key: 'mar', weighted: 540, closed: 460 },
    { key: 'apr', weighted: 620, closed: 510 },
    { key: 'may', weighted: 720, closed: 540 },
    { key: 'jun', weighted: 810, closed: 0 },
  ];
  const maxBar = Math.max(...months.map((m) => Math.max(m.weighted, m.closed)));

  const stageDist = [
    { stage: 'prospect', value: 18 },
    { stage: 'qualified', value: 28 },
    { stage: 'proposal', value: 22 },
    { stage: 'negotiation', value: 22 },
    { stage: 'closed', value: 10 },
  ] as const;

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-secondary-900 dark:text-white">
          {t('forecast.title')}
        </h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
          {t('forecast.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {([
          { key: 'commit', value: commit, color: 'bg-blue-500' },
          { key: 'weighted', value: weighted, color: 'bg-primary-600' },
          { key: 'best', value: best, color: 'bg-green-500' },
        ] as const).map((cat) => (
          <div
            key={cat.key}
            className="rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-4 sm:p-5"
          >
            <p className="text-xs text-secondary-500 mb-1">{t(`forecast.categories.${cat.key}`)}</p>
            <p className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
              {formatCurrency(cat.value)}
            </p>
            <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-3">
              {t(`forecast.categories.${cat.key}Sub`)}
            </p>
            <div className="h-2 rounded-full bg-secondary-100 dark:bg-secondary-800 overflow-hidden">
              <div
                className={`h-full ${cat.color} transition-all`}
                style={{ width: `${Math.min(100, Math.round((cat.value / quota) * 100))}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Quota gauge */}
      <div className="rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-4 sm:p-5 mb-6">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-secondary-900 dark:text-white">
              {t('forecast.quotaAttainment')}
            </p>
            <p className="text-xs text-secondary-500">
              {formatCurrency(weighted)} / {formatCurrency(quota)} {t('forecast.quota')}
            </p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400">
            {attainment}%
          </p>
        </div>
        <div className="h-3 rounded-full bg-secondary-100 dark:bg-secondary-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-700 transition-all"
            style={{ width: `${attainment}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* By owner */}
        <div className="rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-4 sm:p-5">
          <h3 className="font-semibold text-secondary-900 dark:text-white mb-4">
            {t('forecast.byOwner')}
          </h3>
          <div className="space-y-3">
            {owners.map((o) => {
              const total = o.commit + o.weighted + o.best;
              return (
                <div key={o.name}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-secondary-700 dark:text-secondary-300">{o.name}</span>
                    <span className="text-secondary-500">{formatCurrency(total)}</span>
                  </div>
                  <div className="flex h-2.5 rounded-full overflow-hidden bg-secondary-100 dark:bg-secondary-800">
                    <div
                      className="bg-blue-500"
                      style={{ width: `${(o.commit / total) * 100}%` }}
                      title="commit"
                    />
                    <div
                      className="bg-primary-600"
                      style={{ width: `${(o.weighted / total) * 100}%` }}
                      title="weighted"
                    />
                    <div
                      className="bg-green-500"
                      style={{ width: `${(o.best / total) * 100}%` }}
                      title="best"
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-4 text-xs text-secondary-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-500" /> {t('forecast.categories.commit')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-primary-600" /> {t('forecast.categories.weighted')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-green-500" /> {t('forecast.categories.best')}
            </span>
          </div>
        </div>

        {/* By stage */}
        <div className="rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-4 sm:p-5">
          <h3 className="font-semibold text-secondary-900 dark:text-white mb-4">
            {t('forecast.byStage')}
          </h3>
          <div className="space-y-3">
            {stageDist.map((s) => (
              <div key={s.stage}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-secondary-700 dark:text-secondary-300">
                    {t(`pipeline.stages.${s.stage}`)}
                  </span>
                  <span className="text-secondary-500">{s.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary-100 dark:bg-secondary-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-700 transition-all"
                    style={{ width: `${s.value * 3}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend chart */}
      <div className="rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-4 sm:p-5 mb-6">
        <h3 className="font-semibold text-secondary-900 dark:text-white mb-4">
          {t('forecast.trend')}
        </h3>
        <div className="flex items-end gap-2 sm:gap-3 h-40">
          {months.map((m) => {
            const wH = (m.weighted / maxBar) * 100;
            const cH = (m.closed / maxBar) * 100;
            return (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex-1 w-full flex items-end gap-0.5">
                  <div
                    className="flex-1 bg-primary-200 dark:bg-primary-900/70 rounded-t-md transition-all"
                    style={{ height: `${wH}%` }}
                  />
                  <div
                    className="flex-1 bg-primary-600 rounded-t-md transition-all"
                    style={{ height: `${cH}%` }}
                  />
                </div>
                <span className="text-xs text-secondary-500">
                  {t(`forecast.monthLabels.${m.key}`)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-secondary-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-primary-200 dark:bg-primary-900/70" />
            {t('forecast.categories.weighted')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-primary-600" />
            {t('forecast.categories.commit')}
          </span>
        </div>
      </div>

      {/* AI Commentary */}
      <div className="rounded-xl border border-primary-200 dark:border-primary-800 bg-gradient-to-br from-primary-50 to-white dark:from-primary-950/40 dark:to-secondary-900 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2">
          <SparklesIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <h3 className="font-semibold text-secondary-900 dark:text-white">
            {t('forecast.aiCommentary')}
          </h3>
        </div>
        <p className="text-sm text-secondary-700 dark:text-secondary-300 leading-relaxed">
          {t('forecast.aiCommentaryText')}
        </p>
      </div>
    </div>
  );
}
