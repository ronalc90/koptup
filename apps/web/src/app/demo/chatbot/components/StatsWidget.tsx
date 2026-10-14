'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { formatInteger, formatUsd } from './data';
import { ChartBarIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

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
 * Métricas de esta sesión, calculadas en el navegador con las respuestas
 * reales que llegaron del backend en esta pestaña (nada aleatorio, nada se
 * envía al servidor). Va al pie de "Cómo se respondió": en la columna derecha
 * (pantallas grandes) y en el panel que se abre en celulares y tabletas.
 */
export default function StatsWidget({ stats, defaultExpanded = false }: { stats: SessionStats; defaultExpanded?: boolean }) {
  const t = useTranslations('demoChatbot.stats');
  const locale = useLocale() === 'en' ? 'en' : 'es';
  const [expanded, setExpanded] = useState(defaultExpanded);

  const cells = [
    { key: 'questions', label: t('questions'), value: String(stats.questions) },
    { key: 'withSources', label: t('withSources'), value: pct(stats.withSources, stats.questions) },
    { key: 'notFound', label: t('notFound'), value: pct(stats.notFound, stats.questions) },
    { key: 'avgLatency', label: t('avgLatency'), value: stats.questions > 0 ? `${formatInteger(stats.avgLatencyMs, locale)} ms` : '—' },
    { key: 'tokens', label: t('tokens'), value: formatInteger(stats.tokens, locale) },
    { key: 'cost', label: t('cost'), value: formatUsd(stats.costUSD, locale) },
    { key: 'feedback', label: t('feedback'), value: `${stats.feedbackUp} / ${stats.feedbackDown}` },
  ];

  return (
    <section className="border-t border-secondary-200 dark:border-secondary-800" aria-label={t('title')} data-testid="session-stats">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-secondary-50 dark:hover:bg-secondary-800/60"
      >
        <ChartBarIcon className="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary-500 dark:text-secondary-400">
            {t('title')}
          </span>
          <span className="block font-mono text-[11px] text-secondary-700 dark:text-secondary-200">
            {t('summary', { count: stats.questions, withSources: pct(stats.withSources, stats.questions) })}
          </span>
        </span>
        {expanded ? (
          <ChevronDownIcon className="h-3.5 w-3.5 text-secondary-400" aria-hidden="true" />
        ) : (
          <ChevronUpIcon className="h-3.5 w-3.5 text-secondary-400" aria-hidden="true" />
        )}
      </button>
      {expanded ? (
        <div className="px-3 pb-3">
          <dl className="grid grid-cols-3 gap-1.5">
            {cells.map((c) => (
              <div
                key={c.key}
                className={`rounded-lg bg-secondary-50 px-2 py-1.5 ring-1 ring-secondary-100 dark:bg-secondary-800/80 dark:ring-secondary-700/60 ${
                  c.key === 'feedback' ? 'col-span-3' : ''
                }`}
              >
                <dt className="text-[9px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400">{c.label}</dt>
                <dd className="font-mono text-xs font-bold text-secondary-800 dark:text-secondary-100">{c.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-[10px] leading-snug text-secondary-500 dark:text-secondary-400">{t('hint')}</p>
        </div>
      ) : null}
    </section>
  );
}
