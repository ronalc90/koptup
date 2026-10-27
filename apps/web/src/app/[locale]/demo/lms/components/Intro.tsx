'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeftIcon, CalculatorIcon, CheckCircleIcon, PresentationChartBarIcon, SparklesIcon } from '@heroicons/react/24/outline';

/** Salidas comerciales: demo guiada con esta demo ya elegida y cotización del producto. */
export const REQUEST_DEMO_HREF = '/solicitar-demo?demos=lms';
export const QUOTE_HREF = '/contact?service=lms-elearning';

/**
 * Presentación de la demo: volver al catálogo, qué es y para quién, qué es
 * real y qué es simulado, y las salidas comerciales.
 */
export function DemoIntro() {
  const t = useTranslations('demoLms.shell');
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-4" aria-labelledby="lms-title">
      <Link
        href="/demo"
        className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-secondary-700 hover:text-secondary-900 dark:text-secondary-300 dark:hover:text-white"
      >
        <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
        {t('back')}
      </Link>
      <div className="mt-3 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">{t('kicker')}</p>
          <h1 id="lms-title" className="mt-1 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-secondary-900 dark:text-white">
            {t('title')}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-secondary-600 dark:text-secondary-300">{t('subtitle')}</p>
          <p className="mt-2 text-xs text-secondary-500 dark:text-secondary-400">{t('realNote')}</p>
        </div>
        <div className="flex flex-wrap gap-2 lg:flex-nowrap lg:shrink-0">
          <Link
            href={REQUEST_DEMO_HREF}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-primary-600 text-primary-700 bg-white hover:bg-primary-50 dark:bg-secondary-900 dark:text-primary-300 dark:border-primary-500 dark:hover:bg-secondary-800"
          >
            <PresentationChartBarIcon className="h-4 w-4" aria-hidden="true" />
            {t('requestDemo')}
          </Link>
          <Link
            href={QUOTE_HREF}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700"
          >
            <CalculatorIcon className="h-4 w-4" aria-hidden="true" />
            {t('quote')}
          </Link>
        </div>
      </div>
    </section>
  );
}

export interface GuideStep {
  id: 'buy' | 'tutor' | 'quiz' | 'academy';
  done: boolean;
  onAction: () => void;
}

/** Primeros pasos: cuatro acciones que recorren la demo y se marcan solas al hacerlas. */
export function GettingStarted({ steps, open, onToggle }: { steps: GuideStep[]; open: boolean; onToggle: () => void }) {
  const t = useTranslations('demoLms.guide');
  const done = steps.filter((s) => s.done).length;
  return (
    <section aria-labelledby="lms-guide-title" className="rounded-2xl border border-cyan-200 dark:border-cyan-900/60 bg-white/80 dark:bg-secondary-900/80 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="lms-guide-title" className="text-base sm:text-lg font-bold text-secondary-900 dark:text-white flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
          {t('title')}
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-secondary-500 dark:text-secondary-400">{t('progress', { done, total: steps.length })}</span>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls="lms-guide-steps"
            className="text-xs font-medium text-primary-700 dark:text-primary-300 hover:underline"
          >
            {open ? t('hide') : t('show')}
          </button>
        </div>
      </div>
      {open && (
        <ol id="lms-guide-steps" className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {steps.map((s, i) => (
            <li
              key={s.id}
              className={`flex flex-col rounded-xl border p-3 ${
                s.done
                  ? 'border-green-300 dark:border-green-800 bg-green-50/70 dark:bg-green-950/20'
                  : 'border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900'
              }`}
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-secondary-900 dark:text-white">
                {s.done ? (
                  <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" aria-label={t('done')} />
                ) : (
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-cyan-600 text-[11px] font-bold text-white" aria-hidden="true">
                    {i + 1}
                  </span>
                )}
                {t(`steps.${s.id}.title`)}
              </p>
              <p className="mt-1 flex-1 text-xs text-secondary-600 dark:text-secondary-400">{t(`steps.${s.id}.text`)}</p>
              <button type="button" onClick={s.onAction} className="mt-2 self-start text-xs font-semibold text-primary-700 dark:text-primary-300 hover:underline">
                {t(`steps.${s.id}.action`)} →
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
