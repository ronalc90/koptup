'use client';

// Encabezado de la demo: qué es, para quién, por dónde empezar y las salidas
// (volver al catálogo, demo guiada y cotización). No depende de los datos
// guardados, así que se pinta igual en el servidor y en el navegador.

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeftIcon, ArrowPathIcon, CalculatorIcon, MapIcon, PresentationChartBarIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

/** Salidas comerciales: demo guiada con esta demo ya elegida y cotización del producto «Tienda en línea». */
export const GUIDED_DEMO_HREF = '/solicitar-demo?demos=ecommerce';
export const QUOTE_HREF = '/contact?service=ecommerce';

const linkBtn =
  'inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold sm:px-3 sm:py-2 sm:text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-secondary-900';

export default function Intro({ onStartTour, onReset }: { onStartTour: () => void; onReset: () => void }) {
  const t = useTranslations('demoEcommerce2');
  return (
    <header className="border-b border-secondary-200 bg-white dark:border-secondary-800 dark:bg-secondary-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Link
            href="/demo"
            className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-secondary-600 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-secondary-300 dark:hover:text-primary-300"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            {t('intro.back')}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={GUIDED_DEMO_HREF} className={`${linkBtn} bg-primary-600 text-white hover:bg-primary-700`}>
              <PresentationChartBarIcon className="h-4 w-4" aria-hidden="true" />
              {t('intro.guidedDemo')}
            </Link>
            <Link
              href={QUOTE_HREF}
              className={`${linkBtn} border border-secondary-300 text-secondary-800 hover:bg-secondary-50 dark:border-secondary-600 dark:text-secondary-100 dark:hover:bg-secondary-800`}
            >
              <CalculatorIcon className="h-4 w-4" aria-hidden="true" />
              {t('intro.quote')}
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-600 to-emerald-800 shadow-lg" aria-hidden="true">
              <ShoppingBagIcon className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{t('intro.kicker')}</p>
              <h1 className="text-xl font-bold tracking-tight text-secondary-900 dark:text-white sm:text-2xl">{t('meta.title')}</h1>
              <p className="max-w-3xl text-xs text-secondary-600 dark:text-secondary-400 sm:text-sm">{t('intro.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              title={t('sampleDataHint')}
              className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
            >
              {t('sampleData')}
            </span>
            <button
              type="button"
              onClick={onReset}
              title={t('reset.hint')}
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-xs font-medium text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800"
            >
              <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
              {t('reset.button')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm md:grid-cols-2">
          <p className="rounded-lg border border-secondary-200 bg-secondary-50/70 px-3 py-2 text-secondary-700 dark:border-secondary-700 dark:bg-secondary-800/40 dark:text-secondary-300">
            <span className="font-semibold text-secondary-900 dark:text-white">{t('intro.forWhomLabel')} </span>
            {t('intro.forWhom')}
          </p>
          <div className="flex flex-col items-start gap-2 rounded-lg border border-primary-200 bg-primary-50/70 px-3 py-2 sm:flex-row sm:items-center sm:justify-between text-secondary-700 dark:border-primary-800 dark:bg-primary-950/30 dark:text-secondary-300">
            <p className="min-w-0 sm:flex-1">
              <span className="font-semibold text-secondary-900 dark:text-white">{t('intro.startLabel')} </span>
              {t('intro.start')}
            </p>
            <button
              type="button"
              onClick={onStartTour}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-primary-300 bg-white px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-primary-700 dark:bg-secondary-900 dark:text-primary-300 dark:hover:bg-primary-950/50"
            >
              <MapIcon className="h-4 w-4" aria-hidden="true" />
              {t('intro.startCta')}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
