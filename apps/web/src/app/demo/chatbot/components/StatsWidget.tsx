'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChartBarIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import InfoIcon from './ui/InfoIcon';

export interface SessionStats {
  questions: number;
  withSources: number;
  notFound: number;
  /** Promedio del tiempo medido en el navegador (ms). */
  avgLatencyMs: number;
  tokens: number;
  costUSD: number;
  feedbackUp: number;
  feedbackDown: number;
}

const pct = (part: number, total: number) => (total > 0 ? `${Math.round((part / total) * 100)}%` : '—');

/**
 * Métricas de esta sesión, calculadas con las respuestas reales que llegaron
 * del backend en esta pestaña (nada aleatorio). Colapsable.
 */
export default function StatsWidget({ stats }: { stats: SessionStats }) {
  const t = useTranslations('demoChatbot.stats');
  const [expanded, setExpanded] = useState(false);

  const cells = [
    { key: 'questions', label: t('questions'), value: String(stats.questions) },
    { key: 'withSources', label: t('withSources'), value: pct(stats.withSources, stats.questions) },
    { key: 'notFound', label: t('notFound'), value: pct(stats.notFound, stats.questions) },
    { key: 'avgLatency', label: t('avgLatency'), value: stats.questions > 0 ? `${stats.avgLatencyMs} ms` : '—' },
    { key: 'tokens', label: t('tokens'), value: String(stats.tokens) },
    { key: 'cost', label: t('cost'), value: `$${stats.costUSD.toFixed(5)}` },
    { key: 'feedback', label: t('feedback'), value: `${stats.feedbackUp} / ${stats.feedbackDown}` },
  ];

  return (
    <div className="pointer-events-auto fixed bottom-4 left-4 z-30 hidden lg:block">
      {expanded ? (
        <div className="w-[460px] max-w-[calc(100vw-2rem)] rounded-xl border border-secondary-200 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md dark:border-secondary-700 dark:bg-secondary-900/95">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" aria-hidden="true" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary-500 dark:text-secondary-400">
                {t('title')}
              </p>
              <InfoIcon content={t('hint')} size="xs" side="top" />
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label={t('toggle')}
              aria-expanded="true"
              className="rounded p-1 text-secondary-500 transition hover:bg-secondary-100 hover:text-secondary-900 dark:hover:bg-secondary-800 dark:hover:text-white"
            >
              <ChevronDownIcon className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {cells.map((c) => (
              <div
                key={c.key}
                className="rounded-lg bg-secondary-50 px-2 py-1.5 ring-1 ring-secondary-100 dark:bg-secondary-800/80 dark:ring-secondary-700/60"
              >
                <div className="text-[9px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400">{c.label}</div>
                <div className="font-mono text-xs font-bold text-secondary-800 dark:text-secondary-100">{c.value}</div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-secondary-500 dark:text-secondary-400">{t('hint')}</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label={t('toggle')}
          aria-expanded="false"
          className="inline-flex items-center gap-2 rounded-full border border-secondary-200 bg-white/95 px-3.5 py-2 shadow-xl backdrop-blur-md transition hover:border-primary-300 hover:shadow-2xl dark:border-secondary-700 dark:bg-secondary-900/95 dark:hover:border-primary-700"
        >
          <ChartBarIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" aria-hidden="true" />
          <span className="text-[11px] font-semibold text-secondary-700 dark:text-secondary-200">{t('title')}</span>
          <span className="font-mono text-[10px] text-secondary-500 dark:text-secondary-400">
            {stats.questions} · {pct(stats.withSources, stats.questions)}
          </span>
          <ChevronUpIcon className="h-3 w-3 text-secondary-400" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
