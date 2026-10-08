'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, ArrowPathIcon, BeakerIcon, DocumentCheckIcon, SignalSlashIcon } from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { DEMO_TODAY } from './components/data';
import { formatDate } from './components/docs';
import { useBillingStore } from './components/useBillingStore';
import { EmissionPanel } from './components/EmissionPanel';
import { DocPreview } from './components/DocPreview';
import { DocumentsPanel } from './components/DocumentsPanel';
import { ReceptionPanel } from './components/ReceptionPanel';
import { ReportsPanel } from './components/ReportsPanel';
import { ApiPanel } from './components/ApiPanel';
import { MetricsRow, ProjectPanel, TourCard } from './components/Overview';
import { useMonths } from './components/ui';

export default function FacturacionElectronicaPage() {
  const t = useTranslations('demoBilling');
  const months = useMonths();
  const store = useBillingStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const { startNote: openNote } = store;

  const startNote = useCallback(
    (type: 'notaCredito' | 'notaDebito', id: string) => {
      openNote(type, id);
      document.getElementById('emision')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [openNote],
  );

  const reset = () => {
    store.reset();
    setConfirmReset(false);
    toast.success(t('header.resetDone'));
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      <header className="bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <Link href="/demo" className="inline-flex items-center gap-2 text-secondary-600 dark:text-secondary-300 hover:text-primary-600">
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="text-sm font-medium">{t('header.back')}</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="warning" size="sm">
              <BeakerIcon className="w-3.5 h-3.5 mr-1" /> {t('header.sampleBadge')}
            </Badge>
            <Badge variant="info" size="sm">
              <SignalSlashIcon className="w-3.5 h-3.5 mr-1" /> {t('header.simBadge')}
            </Badge>
            {confirmReset ? (
              <span className="inline-flex flex-wrap items-center gap-2 text-sm text-secondary-700 dark:text-secondary-200">
                {t('header.resetConfirm')}
                <Button size="sm" variant="danger" onClick={reset}>
                  {t('header.resetYes')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>
                  {t('common.cancel')}
                </Button>
              </span>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setConfirmReset(true)}>
                <ArrowPathIcon className="w-4 h-4 mr-1" /> {t('header.reset')}
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <section className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 sm:p-8 text-white shadow-sm">
          <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-emerald-100">
            <DocumentCheckIcon className="w-4 h-4" /> {t('hero.kicker')}
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">{t('hero.title')}</h1>
          <p className="mt-2 text-base sm:text-lg text-emerald-50/90 max-w-3xl">{t('hero.subtitle')}</p>
          <p className="mt-3 text-sm text-emerald-100/90 max-w-3xl">
            {t('hero.simNote')} {t('hero.dateNote', { date: formatDate(DEMO_TODAY, months) })}
          </p>
        </section>

        {store.storageFull && (
          <p className="rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200">
            {t('header.storageFull')}
          </p>
        )}

        <MetricsRow store={store} />
        <TourCard store={store} />

        <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
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
      </div>
    </div>
  );
}
