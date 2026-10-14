'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircleIcon, MapIcon } from '@heroicons/react/24/outline';
import type { ActivityEvent } from './crm';
import type { GuideFlags } from './useCrmStore';
import { useCrmText } from './useCrmText';

/** Salidas comerciales: demo guiada con esta demo ya elegida y cotización del producto. */
export const REQUEST_DEMO_HREF = '/solicitar-demo?demos=crm-ia';
export const QUOTE_HREF = '/contact?service=crm-ia';

const OPEN_KEY = 'koptup-demo-crm-ia:guide-open';

export type GuideStepId = 'move' | 'open' | 'draft' | 'forecast' | 'sequence';
export const GUIDE_STEPS: GuideStepId[] = ['move', 'open', 'draft', 'forecast', 'sequence'];

/** Qué pasos del recorrido ya se hicieron, según el historial y las marcas del estado. */
export function guideProgress(events: ActivityEvent[], flags: GuideFlags): Record<GuideStepId, boolean> {
  return {
    move: events.some((e) => e.type === 'stage' || e.type === 'won' || e.type === 'lost'),
    open: !!flags.opened,
    draft: events.some((e) => e.key === 'sent'),
    forecast: !!flags.forecast,
    sequence: events.some((e) => e.key === 'sequence' || e.key === 'enrolled'),
  };
}

interface Props {
  events: ActivityEvent[];
  flags: GuideFlags;
  onAction: (step: GuideStepId) => void;
}

/**
 * Recorrido sugerido: cinco pasos que cuentan la historia del CRM (mover un
 * negocio, entender su puntaje, redactar el mensaje, ver el pronóstico y
 * automatizar el seguimiento). Cada paso se marca solo cuando el estado de la
 * demo muestra que se hizo.
 */
export default function GettingStarted({ events, flags, onAction }: Props) {
  const { t } = useCrmText();
  const [open, setOpen] = useState(true);

  // Preferencia del visitante (mostrar u ocultar); se lee después de montar.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(OPEN_KEY) === '0') setOpen(false);
    } catch {
      /* sin almacenamiento: queda abierto */
    }
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      window.localStorage.setItem(OPEN_KEY, next ? '1' : '0');
    } catch {
      /* sin almacenamiento */
    }
  };

  const progress = guideProgress(events, flags);
  const done = GUIDE_STEPS.filter((s) => progress[s]).length;
  const all = done === GUIDE_STEPS.length;

  return (
    <section
      aria-labelledby="crm-guide-title"
      className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-white/80 dark:bg-secondary-900/80 p-4 sm:p-5 mb-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id="crm-guide-title" className="text-base sm:text-lg font-bold text-secondary-900 dark:text-white flex items-center gap-2">
            <MapIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" aria-hidden="true" />
            {t('guide.title')}
          </h2>
          <p className="text-xs sm:text-sm text-secondary-600 dark:text-secondary-400 mt-0.5">{t('guide.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-secondary-500 dark:text-secondary-400" aria-live="polite">
            {t('guide.progress', { done, total: GUIDE_STEPS.length })}
          </span>
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls="crm-guide-steps"
            className="text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {open ? t('guide.hide') : t('guide.show')}
          </button>
        </div>
      </div>
      {open && (
        <div id="crm-guide-steps">
          <ol className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2 sm:gap-3">
            {GUIDE_STEPS.map((id, i) => {
              const isDone = progress[id];
              return (
                <li
                  key={id}
                  data-guide-step={id}
                  data-done={isDone ? 'true' : 'false'}
                  className={`flex flex-col rounded-xl border p-3 ${
                    isDone
                      ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/20'
                      : 'border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900'
                  }`}
                >
                  <p className="flex items-center gap-2 text-sm font-semibold text-secondary-900 dark:text-white">
                    {isDone ? (
                      <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" aria-label={t('guide.done')} />
                    ) : (
                      <span
                        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white"
                        aria-hidden="true"
                      >
                        {i + 1}
                      </span>
                    )}
                    {t(`guide.steps.${id}.title`)}
                  </p>
                  <p className="mt-1 flex-1 hidden sm:block text-xs text-secondary-600 dark:text-secondary-400">{t(`guide.steps.${id}.text`)}</p>
                  <button
                    type="button"
                    onClick={() => onAction(id)}
                    className="mt-1 sm:mt-2 self-start text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    {t(`guide.steps.${id}.action`)} →
                  </button>
                </li>
              );
            })}
          </ol>
          {all && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 p-3">
              <p className="text-sm text-secondary-800 dark:text-secondary-100 flex-1 min-w-[12rem]">{t('guide.finished')}</p>
              <Link
                href={REQUEST_DEMO_HREF}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border border-indigo-600 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                {t('guide.finishedDemo')}
              </Link>
              <Link
                href={QUOTE_HREF}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                {t('guide.finishedQuote')}
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
