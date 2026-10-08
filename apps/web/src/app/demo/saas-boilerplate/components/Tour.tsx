'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CheckCircleIcon, MapIcon } from '@heroicons/react/24/outline';
import { useDemo } from '../lib/store';
import { CONTACT_HREF } from '../lib/data';
import type { Screen, TourStep } from '../lib/types';
import { TOUR_STEPS } from '../lib/types';

const STEP_SCREEN: Record<TourStep, Screen> = {
  dashboard: 'dashboard',
  onboarding: 'onboarding',
  payment: 'billing',
  portal: 'portal',
  support: 'operations',
};

/** Recorrido guiado de 5 pasos. Cada paso se marca solo cuando lo haces de verdad en la demo. */
export default function Tour() {
  const t = useTranslations('demoSaas');
  const { s, go, setTourHidden } = useDemo();
  const done = TOUR_STEPS.filter((k) => s.tour[k]).length;
  const all = done === TOUR_STEPS.length;

  if (s.tourHidden) {
    return (
      <div className="mb-5 flex justify-end">
        <button
          type="button"
          onClick={() => setTourHidden(false)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-secondary-700 ring-1 ring-secondary-200 hover:bg-secondary-100 dark:bg-secondary-900 dark:text-secondary-200 dark:ring-secondary-700"
        >
          <MapIcon className="h-4 w-4" />
          {t('tour.show', { done, total: TOUR_STEPS.length })}
        </button>
      </div>
    );
  }

  return (
    <section aria-label={t('tour.title')} className="mb-5 rounded-xl border border-primary-200 bg-primary-50/60 p-4 dark:border-primary-800 dark:bg-primary-950/30">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-secondary-900 dark:text-white">
            <MapIcon className="h-4 w-4 text-primary-600" />
            {t('tour.title')}
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-primary-700 ring-1 ring-primary-200 dark:bg-secondary-900 dark:text-primary-300 dark:ring-primary-800">
              {t('tour.progress', { done, total: TOUR_STEPS.length })}
            </span>
          </h2>
          <p className="mt-1 text-xs text-secondary-600 dark:text-secondary-400">{t('tour.subtitle')}</p>
        </div>
        <button type="button" onClick={() => setTourHidden(true)} className="rounded-md px-2 py-1 text-xs text-secondary-600 hover:bg-white dark:text-secondary-300 dark:hover:bg-secondary-800">
          {t('tour.hide')}
        </button>
      </div>
      <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {TOUR_STEPS.map((k, i) => {
          const ok = s.tour[k];
          return (
            <li key={k} className={`rounded-lg border p-3 text-xs ${ok ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30' : 'border-secondary-200 bg-white dark:border-secondary-700 dark:bg-secondary-900'}`}>
              <div className="flex items-start gap-2">
                {ok ? (
                  <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-600" aria-label={t('tour.done')} />
                ) : (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-600 text-[11px] font-bold text-white">{i + 1}</span>
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-secondary-900 dark:text-white">{t(`tour.steps.${k}.title`)}</div>
                  <p className="mt-0.5 text-secondary-600 dark:text-secondary-400">{t(`tour.steps.${k}.hint`)}</p>
                  {!ok && (
                    <button type="button" onClick={() => go(STEP_SCREEN[k])} className="mt-1.5 font-medium text-primary-700 hover:underline dark:text-primary-300">
                      {t('tour.go')}
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {all && (
        <div className="mt-3 flex flex-col gap-2 rounded-lg bg-white p-3 text-sm ring-1 ring-primary-200 dark:bg-secondary-900 dark:ring-primary-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-semibold text-secondary-900 dark:text-white">{t('tour.ctaTitle')}</div>
            <p className="text-xs text-secondary-600 dark:text-secondary-400">{t('tour.ctaText')}</p>
          </div>
          <Link href={CONTACT_HREF} className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            {t('tour.ctaButton')}
          </Link>
        </div>
      )}
    </section>
  );
}
