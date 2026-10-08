'use client';

import { useTranslations } from 'next-intl';
import {
  CheckCircleIcon,
  ClockIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon,
  MinusCircleIcon,
  ChatBubbleBottomCenterTextIcon,
  ExclamationTriangleIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';
import type { AnswerMeta, SourceChunk } from './data';
import Tooltip from './ui/Tooltip';

interface PipelinePanelProps {
  /** Esperando la respuesta del backend. */
  running: boolean;
  /** Datos de la última respuesta (null si todavía no hay ninguna). */
  meta: AnswerMeta | null;
  sources: SourceChunk[];
}

type StepState = 'done' | 'skipped' | 'warn';

interface StepView {
  key: string;
  title: string;
  detail: string;
  state: StepState;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

/**
 * "Cómo se respondió": los pasos que de verdad ejecuta el backend
 * (`chatbot.routes.ts`) para la última respuesta, con los datos que devolvió:
 * fragmentación al indexar → búsqueda BM25 top 5 → prompt con fragmentos y
 * reglas → modelo elegido (o modo extractivo) → citas.
 */
export default function PipelinePanel({ running, meta, sources }: PipelinePanelProps) {
  const t = useTranslations('demoChatbot.pipeline');

  const steps: StepView[] = [];
  if (meta) {
    const bestScore = sources.reduce((max, s) => Math.max(max, s.score), 0);
    steps.push({
      key: 'chunking',
      title: t('steps.chunking.title'),
      detail: t('steps.chunking.detail', { docs: meta.docsIndexed }),
      state: 'done',
      Icon: DocumentDuplicateIcon,
    });
    steps.push({
      key: 'search',
      title: t('steps.search.title'),
      detail:
        sources.length > 0
          ? t('steps.search.detail', { count: sources.length, score: bestScore.toFixed(3) })
          : t('steps.search.none'),
      state: sources.length > 0 ? 'done' : 'warn',
      Icon: MagnifyingGlassIcon,
    });
    const usedModel = meta.generative;
    steps.push({
      key: 'prompt',
      title: t('steps.prompt.title'),
      detail: usedModel ? t('steps.prompt.detail', { count: sources.length }) : t('steps.prompt.extractive'),
      state: usedModel ? 'done' : 'skipped',
      Icon: ChatBubbleBottomCenterTextIcon,
    });
    steps.push({
      key: 'model',
      title: t('steps.model.title'),
      detail: usedModel
        ? t('steps.model.detail', { model: meta.model, latency: meta.backendLatencyMs ?? 0 })
        : meta.providerError
          ? t('steps.model.error')
          : t('steps.model.extractive'),
      state: usedModel ? 'done' : meta.providerError ? 'warn' : 'skipped',
      Icon: CpuChipIcon,
    });
    steps.push({
      key: 'citations',
      title: t('steps.citations.title'),
      detail: meta.notFound ? t('steps.citations.notFound') : t('steps.citations.detail', { count: meta.citationsUsed }),
      state: meta.notFound || meta.citationsUsed === 0 ? 'warn' : 'done',
      Icon: LinkIcon,
    });
  }

  const tokens = meta?.tokens?.total;
  const cost = meta?.costUSD;

  return (
    <aside className="flex h-full w-full flex-col border-l border-secondary-200 bg-white/70 backdrop-blur dark:border-secondary-800 dark:bg-secondary-900/70">
      <header className="border-b border-secondary-200 px-4 py-3 dark:border-secondary-800">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary-500 dark:text-secondary-400">
          {t('title')}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-secondary-500 dark:text-secondary-400">{t('subtitle')}</p>
      </header>

      <ol className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {running ? (
          <li className="animate-pulse rounded-lg border border-primary-300 bg-primary-50 px-3 py-6 text-center text-xs font-medium text-primary-800 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-200">
            {t('running')}
          </li>
        ) : steps.length === 0 ? (
          <li className="rounded-lg border border-dashed border-secondary-300 px-3 py-8 text-center dark:border-secondary-700">
            <CpuChipIcon className="mx-auto mb-2 h-5 w-5 text-secondary-400 dark:text-secondary-500" aria-hidden="true" />
            <p className="text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('idle')}</p>
          </li>
        ) : (
          steps.map((step) => {
            const ring =
              step.state === 'done'
                ? 'border-emerald-300/60 bg-emerald-50/70 dark:border-emerald-800/40 dark:bg-emerald-950/40'
                : step.state === 'warn'
                  ? 'border-amber-300/70 bg-amber-50/70 dark:border-amber-800/40 dark:bg-amber-950/30'
                  : 'border-secondary-200 bg-white dark:border-secondary-700/70 dark:bg-secondary-900';
            const StateIcon =
              step.state === 'done' ? CheckCircleIcon : step.state === 'warn' ? ExclamationTriangleIcon : MinusCircleIcon;
            const stateColor =
              step.state === 'done' ? 'text-emerald-600' : step.state === 'warn' ? 'text-amber-600' : 'text-secondary-400';
            return (
              <li key={step.key} className={`rounded-lg border p-2.5 ${ring}`}>
                <div className="flex items-center gap-2">
                  <StateIcon className={`h-3.5 w-3.5 shrink-0 ${stateColor}`} aria-hidden="true" />
                  <step.Icon className="h-3.5 w-3.5 shrink-0 text-secondary-500 dark:text-secondary-400" aria-hidden="true" />
                  <span className="text-xs font-semibold text-secondary-900 dark:text-secondary-100">{step.title}</span>
                </div>
                <p className="mt-1 pl-[1.375rem] text-[10.5px] leading-snug text-secondary-600 dark:text-secondary-400">
                  {step.detail}
                </p>
              </li>
            );
          })
        )}
      </ol>

      <footer className="grid grid-cols-3 gap-2 border-t border-secondary-200 px-3 py-3 text-xs dark:border-secondary-800">
        <Tooltip content={t('totals.latencyHint')} side="top">
          <div className="w-full cursor-help rounded-lg bg-secondary-50 px-2 py-1.5 ring-1 ring-secondary-100 dark:bg-secondary-800/80 dark:ring-secondary-700/60">
            <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
              <ClockIcon className="h-3 w-3" aria-hidden="true" />
              {t('totals.latency')}
            </div>
            <div className="font-mono text-sm font-bold text-secondary-900 dark:text-white">
              {meta && !running ? `${meta.clientLatencyMs} ms` : t('totals.notAvailable')}
            </div>
          </div>
        </Tooltip>
        <Tooltip content={t('totals.tokensHint')} side="top">
          <div className="w-full cursor-help rounded-lg bg-secondary-50 px-2 py-1.5 ring-1 ring-secondary-100 dark:bg-secondary-800/80 dark:ring-secondary-700/60">
            <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
              <CpuChipIcon className="h-3 w-3" aria-hidden="true" />
              {t('totals.tokens')}
            </div>
            <div className="font-mono text-sm font-bold text-secondary-900 dark:text-white">
              {typeof tokens === 'number' && !running ? tokens : t('totals.notAvailable')}
            </div>
          </div>
        </Tooltip>
        <Tooltip content={t('totals.costHint')} side="top" align="end">
          <div className="w-full cursor-help rounded-lg bg-secondary-50 px-2 py-1.5 ring-1 ring-secondary-100 dark:bg-secondary-800/80 dark:ring-secondary-700/60">
            <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
              <CurrencyDollarIcon className="h-3 w-3" aria-hidden="true" />
              {t('totals.cost')}
            </div>
            <div className="font-mono text-sm font-bold text-secondary-900 dark:text-white">
              {typeof cost === 'number' && !running ? `$${cost.toFixed(5)}` : t('totals.notAvailable')}
            </div>
          </div>
        </Tooltip>
      </footer>
    </aside>
  );
}
