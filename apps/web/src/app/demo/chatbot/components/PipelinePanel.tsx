'use client';

import { useTranslations } from 'next-intl';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import type { PipelineStepData } from './data';
import InfoIcon from './ui/InfoIcon';
import Tooltip from './ui/Tooltip';

interface PipelinePanelProps {
  running: boolean;
  /** Índice del paso actualmente animándose (-1 si idle, length cuando termina). */
  activeStepIndex: number;
  steps: PipelineStepData[];
  totalLatencyMs: number;
  totalTokens: number;
  costUsd: number;
}

const STEP_ICONS = {
  rewrite: ArrowPathIcon,
  retrieve: BoltIcon,
  rerank: BoltIcon,
  context: CpuChipIcon,
  llm: CpuChipIcon,
  cite: CheckCircleIcon,
  respond: CheckCircleIcon,
} as const;

/**
 * Visualiza el pipeline en vivo: User Query → Rewrite → Retrieve → Rerank → Context → LLM → Cite → Response.
 * Cada step muestra timing, tokens y status. Se anima paso-a-paso al ejecutar una query.
 *
 * Mejoras UX:
 *  - Skeleton elegante en idle (no spinner crudo)
 *  - Info icon en header con explicación
 *  - Tooltip por step y por KPI footer
 */
export default function PipelinePanel({
  running,
  activeStepIndex,
  steps,
  totalLatencyMs,
  totalTokens,
  costUsd,
}: PipelinePanelProps) {
  const t = useTranslations('demoChatbot');

  return (
    <aside className="flex h-full w-full flex-col border-l border-secondary-200 bg-white/70 backdrop-blur dark:border-secondary-800 dark:bg-secondary-900/70">
      <header className="border-b border-secondary-200 px-4 py-4 dark:border-secondary-800">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary-500 dark:text-secondary-400">
            {t('pipeline.title')}
          </p>
          <InfoIcon content={t('ux.sectionInfo.pipeline')} side="left" align="center" />
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-secondary-500 dark:text-secondary-400">
          {t('pipeline.subtitle')}
        </p>
      </header>

      <ol className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {steps.length === 0 ? (
          running ? (
            // Skeleton mientras corre el primer step
            <SkeletonSteps />
          ) : (
            <li className="rounded-lg border border-dashed border-secondary-300 px-3 py-8 text-center dark:border-secondary-700">
              <CpuChipIcon className="mx-auto mb-2 h-5 w-5 text-secondary-400 dark:text-secondary-500" />
              <p className="text-xs font-medium text-secondary-600 dark:text-secondary-300">
                {t('pipeline.idle')}
              </p>
            </li>
          )
        ) : (
          steps.map((step, idx) => {
            const Icon = STEP_ICONS[step.key];
            const isDone = idx < activeStepIndex || (!running && activeStepIndex >= steps.length);
            const isActive = running && idx === activeStepIndex;
            const isPending = !isDone && !isActive;

            const ring = isDone
              ? 'border-emerald-300/60 bg-emerald-50/70 dark:border-emerald-800/40 dark:bg-emerald-950/40'
              : isActive
              ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/20 dark:border-primary-400 dark:bg-primary-950/50 dark:ring-primary-500/30'
              : 'border-secondary-200 bg-white dark:border-secondary-700/70 dark:bg-secondary-900';

            const dot = isDone
              ? 'bg-emerald-500'
              : isActive
              ? 'bg-primary-500 animate-pulse'
              : 'bg-secondary-300 dark:bg-secondary-700';

            return (
              <li key={step.key} className={`rounded-lg border p-2.5 transition-all ${ring}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${dot}`} />
                    <Icon className="h-3.5 w-3.5 shrink-0 text-secondary-500 dark:text-secondary-400" />
                    <span className="truncate text-xs font-semibold text-secondary-900 dark:text-secondary-100">
                      {t(`pipeline.steps.${step.key}`)}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-secondary-500 dark:text-secondary-400">
                    {isPending ? '—' : `${step.durationMs} ${t('common.ms')}`}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 pl-4">
                  <span className="truncate text-[10px] text-secondary-500 dark:text-secondary-400">
                    {step.detail}
                  </span>
                  {step.tokens > 0 && !isPending ? (
                    <span className="shrink-0 font-mono text-[10px] text-secondary-500 dark:text-secondary-400">
                      {step.tokens} {t('common.tokens')}
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })
        )}
      </ol>

      <footer className="grid grid-cols-3 gap-2 border-t border-secondary-200 px-3 py-3 text-xs dark:border-secondary-800">
        <Tooltip content={t('ux.stats.latency')} side="top">
          <div className="w-full cursor-help rounded-lg bg-secondary-50 px-2 py-1.5 ring-1 ring-secondary-100 dark:bg-secondary-800/80 dark:ring-secondary-700/60">
            <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
              <ClockIcon className="h-3 w-3" />
              {t('pipeline.totalLatency')}
            </div>
            <div className="font-mono text-sm font-bold text-secondary-900 dark:text-white">
              {totalLatencyMs} {t('common.ms')}
            </div>
          </div>
        </Tooltip>
        <Tooltip content={t('ux.stats.tokens')} side="top">
          <div className="w-full cursor-help rounded-lg bg-secondary-50 px-2 py-1.5 ring-1 ring-secondary-100 dark:bg-secondary-800/80 dark:ring-secondary-700/60">
            <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
              <CpuChipIcon className="h-3 w-3" />
              {t('pipeline.totalTokens')}
            </div>
            <div className="font-mono text-sm font-bold text-secondary-900 dark:text-white">
              {totalTokens}
            </div>
          </div>
        </Tooltip>
        <Tooltip content={t('ux.stats.cost')} side="top">
          <div className="w-full cursor-help rounded-lg bg-secondary-50 px-2 py-1.5 ring-1 ring-secondary-100 dark:bg-secondary-800/80 dark:ring-secondary-700/60">
            <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
              <CurrencyDollarIcon className="h-3 w-3" />
              {t('pipeline.estCost')}
            </div>
            <div className="font-mono text-sm font-bold text-secondary-900 dark:text-white">
              ${costUsd.toFixed(4)}
            </div>
          </div>
        </Tooltip>
      </footer>
    </aside>
  );
}

/**
 * Skeleton de pasos del pipeline mientras se inicializa el primer scenario.
 * Cuatro filas con shimmer; presentacional.
 */
function SkeletonSteps() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <li
          key={i}
          className="animate-pulse rounded-lg border border-secondary-200 bg-white p-2.5 dark:border-secondary-700/70 dark:bg-secondary-900"
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-secondary-200 dark:bg-secondary-700" />
            <span className="h-3 w-24 rounded bg-secondary-200 dark:bg-secondary-700" />
          </div>
          <div className="mt-2 h-2 w-3/4 rounded bg-secondary-100 dark:bg-secondary-800" />
        </li>
      ))}
    </>
  );
}
