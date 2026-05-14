'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ChartBarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import InfoIcon from './ui/InfoIcon';
import Tooltip from './ui/Tooltip';

interface StatsWidgetProps {
  tokens: number;
  latencyMs: number;
  costUsd: number;
  cacheHitPct: number;
  driftPct: number;
  faithfulnessPct: number;
  hallucinationPct: number;
}

type StatKey =
  | 'tokens'
  | 'latency'
  | 'cost'
  | 'cacheHit'
  | 'drift'
  | 'faithfulness'
  | 'hallucination';

/**
 * Widget flotante con telemetría agregada.
 *
 * Mejoras UX:
 *  - Colapsable: empieza minimizado para no robar foco. Click expande.
 *  - Cada KPI tiene tooltip explicativo (qué significa, target).
 *  - Tonos semánticos consistentes (good/warn/bad).
 */
export default function StatsWidget({
  tokens,
  latencyMs,
  costUsd,
  cacheHitPct,
  driftPct,
  faithfulnessPct,
  hallucinationPct,
}: StatsWidgetProps) {
  const t = useTranslations('demoChatbot');
  const [expanded, setExpanded] = useState(false);

  const cells: {
    key: StatKey;
    label: string;
    value: string;
    tone: 'good' | 'warn' | 'bad' | 'neutral';
  }[] = [
    { key: 'tokens', label: t('stats.tokens'), value: tokens.toLocaleString(), tone: 'neutral' },
    {
      key: 'latency',
      label: t('stats.latency'),
      value: `${latencyMs} ${t('common.ms')}`,
      tone: latencyMs === 0 ? 'neutral' : latencyMs < 1500 ? 'good' : 'warn',
    },
    { key: 'cost', label: t('stats.cost'), value: `$${costUsd.toFixed(4)}`, tone: 'neutral' },
    {
      key: 'cacheHit',
      label: t('stats.cacheHit'),
      value: `${cacheHitPct.toFixed(0)}%`,
      tone: cacheHitPct >= 60 ? 'good' : 'warn',
    },
    {
      key: 'drift',
      label: t('stats.drift'),
      value: `${driftPct.toFixed(1)}%`,
      tone: driftPct < 2 ? 'good' : 'warn',
    },
    {
      key: 'faithfulness',
      label: t('stats.faithfulness'),
      value: `${faithfulnessPct.toFixed(0)}%`,
      tone: faithfulnessPct >= 90 ? 'good' : 'warn',
    },
    {
      key: 'hallucination',
      label: t('stats.hallucination'),
      value: `${hallucinationPct.toFixed(1)}%`,
      tone: hallucinationPct < 1 ? 'good' : 'bad',
    },
  ];

  const tone = (v: typeof cells[number]['tone']) =>
    v === 'good'
      ? 'text-emerald-600 dark:text-emerald-300'
      : v === 'warn'
      ? 'text-amber-600 dark:text-amber-300'
      : v === 'bad'
      ? 'text-red-600 dark:text-red-300'
      : 'text-secondary-800 dark:text-secondary-100';

  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-30 hidden lg:block">
      {expanded ? (
        <div className="w-[460px] max-w-[calc(100vw-2rem)] rounded-xl border border-secondary-200 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md dark:border-secondary-700 dark:bg-secondary-900/95">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary-500 dark:text-secondary-400">
                {t('stats.title')}
              </p>
              <InfoIcon content={t('ux.sectionInfo.stats')} size="xs" side="top" />
            </div>
            <Tooltip content={t('ux.tooltips.toggleStats')} side="left">
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label={t('ux.tooltips.toggleStats')}
                className="rounded p-1 text-secondary-500 transition hover:bg-secondary-100 hover:text-secondary-900 dark:hover:bg-secondary-800 dark:hover:text-white"
              >
                <ChevronDownIcon className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {cells.map((c) => (
              <Tooltip key={c.key} content={t(`ux.stats.${c.key}`)} side="top">
                <div className="w-full cursor-help rounded-lg bg-secondary-50 px-2 py-1.5 ring-1 ring-secondary-100 transition hover:ring-primary-200 dark:bg-secondary-800/80 dark:ring-secondary-700/60 dark:hover:ring-primary-700">
                  <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                    {c.label}
                  </div>
                  <div className={`font-mono text-xs font-bold ${tone(c.tone)}`}>{c.value}</div>
                </div>
              </Tooltip>
            ))}
          </div>
        </div>
      ) : (
        <Tooltip content={t('ux.tooltips.toggleStats')} side="left">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label={t('stats.title')}
            className="inline-flex items-center gap-2 rounded-full border border-secondary-200 bg-white/95 px-3.5 py-2 shadow-xl backdrop-blur-md transition hover:border-primary-300 hover:shadow-2xl dark:border-secondary-700 dark:bg-secondary-900/95 dark:hover:border-primary-700"
          >
            <ChartBarIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <span className="text-[11px] font-semibold text-secondary-700 dark:text-secondary-200">
              {t('stats.title')}
            </span>
            <span className="font-mono text-[10px] text-secondary-500 dark:text-secondary-400">
              {tokens.toLocaleString()}t · {latencyMs}ms
            </span>
            <ChevronUpIcon className="h-3 w-3 text-secondary-400" />
          </button>
        </Tooltip>
      )}
    </div>
  );
}
