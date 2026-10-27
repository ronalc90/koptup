'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  ArrowLeftIcon,
  BeakerIcon,
  CalculatorIcon,
  CircleStackIcon,
  InformationCircleIcon,
  MapIcon,
  PresentationChartBarIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import { SHOW_GUIDE_EVENT } from '../lib/store';

/** Salidas comerciales: demo guiada con esta demo ya elegida y cotización del producto del catálogo. */
export const GUIDED_DEMO_HREF = '/solicitar-demo?demos=control-proyectos';
export const QUOTE_HREF = '/contact?service=gestion-proyectos';

const linkBtn =
  'inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-semibold px-3 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900';

/**
 * Encabezado de la demo: qué es, para quién y por dónde empezar, con la salida
 * al catálogo y las salidas comerciales. No depende de los datos de ejemplo,
 * así que se pinta igual en el servidor y en el navegador.
 */
export default function Intro() {
  const t = useTranslations('demoProjectsPro.intro');
  const tb = useTranslations('demoProjectsPro.bar');
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90">
      <div className="px-4 sm:px-6 pt-4 pb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Link
            href="/demo"
            className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <ArrowLeftIcon className="w-4 h-4" aria-hidden="true" />
            {t('back')}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={GUIDED_DEMO_HREF} className={`${linkBtn} bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white`}>
              <PresentationChartBarIcon className="w-4 h-4" aria-hidden="true" />
              {t('guidedDemo')}
            </Link>
            <Link href={QUOTE_HREF} className={`${linkBtn} border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800`}>
              <CalculatorIcon className="w-4 h-4" aria-hidden="true" />
              {t('quote')}
            </Link>
          </div>
        </div>

        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow" aria-hidden="true">
            <RectangleStackIcon className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">{t('kicker')}</p>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{tb('title')}</h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-4xl">{tb('subtitle')}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span title={tb('sampleHint')} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-900">
            <BeakerIcon className="w-3.5 h-3.5" aria-hidden="true" />
            {tb('sample')}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200">
            <InformationCircleIcon className="w-3.5 h-3.5" aria-hidden="true" />
            {t('simBadge')}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200">
            <CircleStackIcon className="w-3.5 h-3.5" aria-hidden="true" />
            {t('localBadge')}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-xs sm:text-sm">
          <p className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 px-3 py-2 text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">{t('forWhomLabel')} </span>
            {t('forWhom')}
          </p>
          <div className="rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50/70 dark:bg-teal-950/30 px-3 py-2 text-slate-700 dark:text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="min-w-0 sm:flex-1">
              <span className="font-semibold text-slate-900 dark:text-white">{t('startLabel')} </span>
              {t('start')}
            </p>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event(SHOW_GUIDE_EVENT))}
              className="self-start sm:self-auto shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-950/50"
            >
              <MapIcon className="w-4 h-4" aria-hidden="true" />
              {t('startCta')}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
