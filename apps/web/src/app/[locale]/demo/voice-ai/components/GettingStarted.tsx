'use client';

import { CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { T } from './parts';

export type GuideStepId = 'pick' | 'listen' | 'result' | 'transfer' | 'campaign';
export type GuideFlags = Record<GuideStepId, boolean>;

export const GUIDE_STEPS: GuideStepId[] = ['pick', 'listen', 'result', 'transfer', 'campaign'];
export const EMPTY_GUIDE: GuideFlags = { pick: false, listen: false, result: false, transfer: false, campaign: false };

/**
 * Primeros pasos: cinco pasos accionables que se marcan solos cuando la
 * persona los hace (el avance se guarda en este navegador).
 */
export default function GettingStarted({
  t,
  done,
  open,
  onToggle,
  onAction,
}: {
  t: T;
  done: GuideFlags;
  open: boolean;
  onToggle: () => void;
  onAction: (id: GuideStepId) => void;
}) {
  const count = GUIDE_STEPS.filter((s) => done[s]).length;
  return (
    <section
      aria-labelledby="voice-guide-title"
      className="mb-6 rounded-2xl border border-sky-500/30 bg-slate-900/70 p-4 sm:p-5"
      data-testid="voice-guide"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="voice-guide-title" className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-sky-300" aria-hidden="true" />
          {t('guide.title')}
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{t('guide.progress', { done: count, total: GUIDE_STEPS.length })}</span>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls="voice-guide-steps"
            className="rounded text-xs font-medium text-sky-300 hover:text-sky-200 hover:underline"
          >
            {open ? t('guide.hide') : t('guide.show')}
          </button>
        </div>
      </div>
      {open && (
        <ol id="voice-guide-steps" className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          {GUIDE_STEPS.map((id, i) => (
            <li
              key={id}
              className={cn(
                'flex flex-col rounded-xl border p-3 min-w-0',
                done[id] ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-slate-700/70 bg-slate-800/40',
              )}
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-white">
                {done[id] ? (
                  <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-400" aria-label={t('guide.done')} />
                ) : (
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-600 text-[11px] font-bold text-white"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                )}
                {t(`guide.steps.${id}.title`)}
              </p>
              <p className="mt-1 flex-1 text-xs text-slate-400">{t(`guide.steps.${id}.text`)}</p>
              <button
                type="button"
                onClick={() => onAction(id)}
                className="mt-2 self-start rounded text-xs font-semibold text-sky-300 hover:text-sky-200 hover:underline"
              >
                {t(`guide.steps.${id}.action`)} →
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
