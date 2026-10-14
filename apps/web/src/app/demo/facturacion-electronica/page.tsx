'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  BeakerIcon,
  CalculatorIcon,
  DocumentCheckIcon,
  InformationCircleIcon,
  MapIcon,
  PresentationChartBarIcon,
  SignalSlashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDate } from './components/docs';
import { isReady, useBillingStore, type BillingStore } from './components/useBillingStore';
import { EmissionPanel } from './components/EmissionPanel';
import { DocPreview } from './components/DocPreview';
import { DocumentsPanel } from './components/DocumentsPanel';
import { ReceptionPanel } from './components/ReceptionPanel';
import { ReportsPanel } from './components/ReportsPanel';
import { ApiPanel } from './components/ApiPanel';
import { MetricsRow, ProjectPanel, TOUR_ID, TourCard } from './components/Overview';
import { focusRing, useMonthLabel, useMonths } from './components/ui';
import { GUIDED_DEMO_HREF, QUOTE_HREF } from './components/links';

const linkBtn =
  'inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-semibold px-3 py-2 transition-colors ' + focusRing;

export default function FacturacionElectronicaPage() {
  const t = useTranslations('demoBilling');
  const months = useMonths();
  const store = useBillingStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const ready = isReady(store);

  const reset = () => {
    store.reset();
    setConfirmReset(false);
    toast.success(t('header.resetDone'));
  };

  const startTour = () => {
    const card = document.getElementById(TOUR_ID);
    card?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // El foco va al primer paso pendiente (o al primero) para seguir con el teclado.
    const next = card?.querySelector<HTMLButtonElement>('[aria-describedby="fe-tour-next"]') || card?.querySelector<HTMLButtonElement>('button');
    next?.focus({ preventScroll: true });
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      <header className="bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <Link
              href="/demo"
              className={'inline-flex items-center gap-2 rounded text-secondary-600 dark:text-secondary-300 hover:text-primary-600 ' + focusRing}
            >
              <ArrowLeftIcon className="w-5 h-5" aria-hidden="true" />
              <span className="text-sm font-medium">{t('header.back')}</span>
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <Link href={GUIDED_DEMO_HREF} className={`${linkBtn} bg-primary-600 hover:bg-primary-700 text-white`}>
                <PresentationChartBarIcon className="w-4 h-4" aria-hidden="true" />
                {t('header.guidedDemo')}
              </Link>
              <Link
                href={QUOTE_HREF}
                className={`${linkBtn} border border-secondary-300 dark:border-secondary-600 text-secondary-800 dark:text-secondary-100 hover:bg-secondary-50 dark:hover:bg-secondary-800`}
              >
                <CalculatorIcon className="w-4 h-4" aria-hidden="true" />
                {t('header.quote')}
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="warning" size="sm">
                <BeakerIcon className="w-3.5 h-3.5 mr-1" aria-hidden="true" /> {t('header.sampleBadge')}
              </Badge>
              <Badge variant="info" size="sm">
                <SignalSlashIcon className="w-3.5 h-3.5 mr-1" aria-hidden="true" /> {t('header.simBadge')}
              </Badge>
            </div>
            {confirmReset ? (
              <span className="inline-flex flex-wrap items-center gap-2 text-sm text-secondary-700 dark:text-secondary-200" role="group" aria-label={t('header.reset')}>
                {t('header.resetConfirm')}
                <Button size="sm" variant="danger" onClick={reset}>
                  {t('header.resetYes')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>
                  {t('common.cancel')}
                </Button>
              </span>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setConfirmReset(true)} disabled={!ready}>
                <ArrowPathIcon className="w-4 h-4 mr-1" aria-hidden="true" /> {t('header.reset')}
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <section className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 sm:p-8 text-white shadow-sm">
          <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-emerald-100">
            <DocumentCheckIcon className="w-4 h-4" aria-hidden="true" /> {t('hero.kicker')}
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">{t('hero.title')}</h1>
          <p className="mt-2 text-base sm:text-lg text-emerald-50/90 max-w-3xl">{t('hero.subtitle')}</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <p className="rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-emerald-50">
              <span className="font-semibold text-white">{t('hero.forWhomLabel')} </span>
              {t('hero.forWhom')}
            </p>
            <div className="rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-emerald-50 flex flex-wrap items-center justify-between gap-3">
              <p className="min-w-0 flex-1 basis-56">
                <span className="font-semibold text-white">{t('hero.startLabel')} </span>
                {t('hero.start')}
              </p>
              <button
                type="button"
                onClick={startTour}
                disabled={!ready}
                className={
                  'inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-700'
                }
              >
                <MapIcon className="w-4 h-4" aria-hidden="true" />
                {t('hero.startCta')}
              </button>
            </div>
          </div>
          <p className="mt-4 text-sm text-emerald-100/90 max-w-3xl">
            {t('hero.simNote')}
            {store.today && <> {t('hero.dateNote', { date: formatDate(store.today, months) })}</>}
          </p>
        </section>

        {isReady(store) ? <DemoBody store={store} /> : <Loading />}
      </div>
    </div>
  );
}

/** Mientras se arman los datos de ejemplo con la fecha de hoy (un instante después de cargar). */
function Loading() {
  const t = useTranslations('demoBilling');
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 p-6 text-sm text-secondary-600 dark:text-secondary-300 flex items-center gap-3">
      <ArrowPathIcon className="w-5 h-5 animate-spin text-primary-600" aria-hidden="true" />
      {t('header.loading')}
    </div>
  );
}

function DemoBody({ store }: { store: BillingStore }) {
  const t = useTranslations('demoBilling');
  const monthLabel = useMonthLabel();
  const { startNote: openNote } = store;

  const startNote = useCallback(
    (type: 'notaCredito' | 'notaDebito', id: string) => {
      openNote(type, id);
      document.getElementById('emision')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [openNote],
  );

  return (
    <>
      {store.notice?.kind === 'monthChanged' && (
        <div className="flex items-start gap-3 rounded-lg bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800 p-3 text-sm text-sky-900 dark:text-sky-100">
          <InformationCircleIcon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          <p className="flex-1 min-w-0">
            {t('header.monthChanged', { from: monthLabel(store.notice.from), to: monthLabel(store.today.slice(0, 7)) })}
          </p>
          <button type="button" onClick={store.dismissNotice} aria-label={t('common.close')} className={'p-1 rounded-md hover:bg-sky-100 dark:hover:bg-sky-800 ' + focusRing}>
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {store.storageFull && (
        <p className="rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200">
          {t('header.storageFull')}
        </p>
      )}

      <MetricsRow store={store} />
      <TourCard store={store} />

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start" aria-label={t('emission.title')}>
        <EmissionPanel store={store} />
        <DocPreview store={store} />
      </section>

      <DocumentsPanel store={store} onStartNote={startNote} />
      <ReceptionPanel store={store} />
      <ReportsPanel store={store} />

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ApiPanel store={store} />
        <ProjectPanel />
      </section>
    </>
  );
}
