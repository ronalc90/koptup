'use client';

// Encabezado de la demo: qué es, para quién, por dónde empezar y las salidas
// (volver al catálogo, demo guiada y cotización). No depende de los datos
// guardados ni de la fecha, así que se pinta igual en el servidor y en el navegador.

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeftIcon, ArrowUturnLeftIcon, ArrowsRightLeftIcon, CalculatorIcon, MapIcon, PresentationChartBarIcon } from '@heroicons/react/24/outline';

/** Salidas comerciales: demo guiada con esta demo ya elegida y cotización del producto «Extracción y monitoreo de datos». */
export const GUIDED_DEMO_HREF = '/solicitar-demo?demos=scraping';
export const QUOTE_HREF = '/contact?service=scraping-extraccion';

const linkBtn =
  'inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors sm:px-3 sm:py-2 sm:text-sm';

export default function Intro({ onStartTour, onReset }: { onStartTour: () => void; onReset: () => void }) {
  const t = useTranslations('demoScraping');
  return (
    <section className="border-b border-secondary-800 bg-secondary-900/60" aria-labelledby="scraping-title">
      <div className="flex flex-col gap-3 px-4 py-4 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Link href="/demo" className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-secondary-300 hover:text-white">
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            {t('intro.back')}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={GUIDED_DEMO_HREF} className={`${linkBtn} bg-emerald-600 text-white hover:bg-emerald-500`}>
              <PresentationChartBarIcon className="h-4 w-4" aria-hidden="true" />
              {t('intro.guidedDemo')}
            </Link>
            <Link href={QUOTE_HREF} className={`${linkBtn} border border-secondary-600 text-secondary-100 hover:border-secondary-400 hover:text-white`}>
              <CalculatorIcon className="h-4 w-4" aria-hidden="true" />
              {t('intro.quote')}
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-600 to-zinc-800" aria-hidden="true">
              <ArrowsRightLeftIcon className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">{t('intro.kicker')}</p>
              <h1 id="scraping-title" className="text-xl font-bold tracking-tight text-white sm:text-2xl">{t('meta.title')}</h1>
              <p className="max-w-3xl text-xs text-secondary-300 sm:text-sm">{t('intro.subtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onReset}
            title={t('intro.resetHint')}
            className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-xs font-medium text-secondary-300 hover:bg-secondary-800 hover:text-white"
          >
            <ArrowUturnLeftIcon className="h-4 w-4" aria-hidden="true" />
            {t('actions.reset')}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm md:grid-cols-2">
          <p className="rounded-lg border border-secondary-800 bg-secondary-950/60 px-3 py-2 text-secondary-300">
            <span className="font-semibold text-white">{t('intro.forWhomLabel')} </span>
            {t('intro.forWhom')}
          </p>
          <div className="flex flex-col items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-secondary-300 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 sm:flex-1">
              <span className="font-semibold text-white">{t('intro.startLabel')} </span>
              {t('intro.start')}
            </p>
            <button
              type="button"
              onClick={onStartTour}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-400/50 bg-secondary-950 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/10"
            >
              <MapIcon className="h-4 w-4" aria-hidden="true" />
              {t('intro.startCta')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
