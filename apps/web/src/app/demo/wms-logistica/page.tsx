'use client';

import { CubeTransparentIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { WmsProvider } from './lib/store';
import Shell from './components/Shell';

export default function WmsLogisticaPage() {
  const t = useTranslations('demoWms');
  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-secondary-50 via-white to-primary-50 px-4 py-8 dark:from-secondary-950 dark:via-secondary-900 dark:to-secondary-950 sm:py-10">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-2xl bg-gradient-to-br from-stone-600 to-stone-800 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/15 p-2 text-white shadow-lg">
                  <CubeTransparentIcon className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">{t('pageTitle')}</h1>
              </div>
              <p className="mt-2 max-w-3xl text-base text-stone-100/90 sm:text-lg">{t('pageSubtitle')}</p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium text-white">
              {t('sampleData')}
            </span>
          </div>
        </header>
        <WmsProvider>
          <Shell />
        </WmsProvider>
      </div>
    </div>
  );
}
