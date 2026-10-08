'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CheckCircleIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { TOUR_STEPS, useDemo, type TourStep } from '../lib/store';
import type { SourceId, Tab } from '../lib/types';

export const TRIAL_HREF = '/contact?service=scraping-extraccion';

const TARGET: Record<TourStep, { source?: SourceId; tab: Tab; anchor: string }> = {
  radar: { source: 'contratacion', tab: 'overview', anchor: 'scraping-table' },
  field: { source: 'precios', tab: 'builder', anchor: 'scraping-builder-preview' },
  change: { source: 'precios', tab: 'changes', anchor: 'scraping-changes' },
  download: { tab: 'delivery', anchor: 'scraping-delivery' },
  legal: { tab: 'compliance', anchor: 'scraping-compliance' },
};

export default function Tour() {
  const t = useTranslations('demoScraping');
  const { s, ready, update, selectSource, setTab } = useDemo();
  const done = TOUR_STEPS.filter((k) => s.tour[k]).length;
  const hidden = s.tourHidden;

  return (
    <section className="rounded-xl border border-secondary-800 bg-secondary-900/70 p-3" aria-label={t('tour.title')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white">{t('tour.title')}</h2>
          <span className="rounded-full bg-secondary-800 px-2 py-0.5 text-[11px] text-secondary-300">{t('tour.progress', { done: ready ? done : 0, total: TOUR_STEPS.length })}</span>
        </div>
        <button
          type="button"
          onClick={() => update((p) => ({ ...p, tourHidden: !p.tourHidden }))}
          aria-expanded={!hidden}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-secondary-300 hover:bg-secondary-800 hover:text-white"
        >
          {hidden ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronUpIcon className="h-3.5 w-3.5" />}
          {hidden ? t('tour.show') : t('tour.hide')}
        </button>
      </div>
      {!hidden && (
        <>
          <ol className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-5">
            {TOUR_STEPS.map((k, i) => {
              const ok = ready && s.tour[k];
              return (
                <li key={k} className="w-56 shrink-0 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      const target = TARGET[k];
                      if (target.source) selectSource(target.source);
                      else if (s.customSources.some((c) => c.id === s.activeId)) selectSource('contratacion');
                      setTab(target.tab);
                      // Lleva la vista a la sección del paso (también si ya estabas en esa pestaña).
                      window.setTimeout(() => document.getElementById(target.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
                    }}
                    className={`flex h-full w-full items-start gap-2 rounded-lg border p-2 text-left text-xs transition-colors ${ok ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-100' : 'border-secondary-800 bg-secondary-950/60 text-secondary-300 hover:border-secondary-600'}`}
                  >
                    {ok ? (
                      <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-400" aria-label={t('tour.done')} />
                    ) : (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-secondary-600 text-[10px]">{i + 1}</span>
                    )}
                    <span>
                      <span className="block font-medium text-white">{t(`tour.steps.${k}.title`)}</span>
                      <span className="block text-secondary-400">{t(`tour.steps.${k}.hint`)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary-950/60 px-3 py-2 text-xs text-secondary-300">
            <span>{t('tour.cta')}</span>
            <Link href={TRIAL_HREF} className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500">
              {t('actions.requestTrial')}
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
