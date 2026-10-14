'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  BeakerIcon,
  CodeBracketIcon,
  DocumentDuplicateIcon,
  HomeIcon,
  InformationCircleIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  PuzzlePieceIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { COMPANY } from './lib/data';
import { formatNit } from './lib/logic';
import { FirmaProvider, useFirma } from './lib/store';
import { TABS, type Tab } from './lib/types';
import { Toasts, focusRing } from './components/ui';
import Dashboard from './components/Dashboard';
import Wizard from './components/wizard/Wizard';
import Templates from './components/Templates';
import Evidence from './components/Evidence';
import SignerView from './components/SignerView';
import Developers from './components/Developers';
import Integrations from './components/Integrations';

const ICONS: Record<Tab, typeof HomeIcon> = {
  home: HomeIcon,
  create: PlusCircleIcon,
  templates: DocumentDuplicateIcon,
  evidence: ShieldCheckIcon,
  signer: PencilSquareIcon,
  developers: CodeBracketIcon,
  integrations: PuzzlePieceIcon,
};

export default function FirmaElectronicaDemo() {
  const t = useTranslations('demoSign');
  return (
    <div className="min-h-screen bg-secondary-50 text-secondary-900 dark:bg-secondary-950 dark:text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Link
          href="/demo"
          className={`mb-3 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-secondary-600 hover:text-lime-700 dark:text-secondary-300 dark:hover:text-lime-300 ${focusRing}`}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t('shell.back')}
        </Link>

        <header className="mb-4 rounded-2xl bg-gradient-to-br from-lime-700 to-lime-900 p-5 text-white shadow-sm sm:p-7">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-amber-300/15 px-2.5 py-0.5 text-xs font-semibold text-amber-100" title={t('shell.sampleHint')}>
              <BeakerIcon className="h-3.5 w-3.5" />
              {t('shell.sampleBadge')}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/40 px-2.5 py-0.5 text-xs font-semibold text-white/90">
              <InformationCircleIcon className="h-3.5 w-3.5" />
              {t('shell.simBadge')}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{t('shell.title')}</h1>
          <p className="mt-2 max-w-3xl text-base text-lime-50/90 sm:text-lg">{t('shell.subtitle')}</p>
          <p className="mt-3 max-w-3xl text-sm text-lime-100/85">{t('shell.caseLine', { company: COMPANY.name, nit: formatNit(COMPANY.nit), city: COMPANY.city })}</p>
          <p className="mt-1 max-w-3xl text-xs text-lime-100/75">{t('shell.legalLine')}</p>
        </header>

        <details className="group mb-5 rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm dark:border-secondary-800 dark:bg-secondary-900">
          <summary className={`flex cursor-pointer list-none items-center gap-2 rounded font-medium text-secondary-800 dark:text-secondary-200 ${focusRing}`}>
            <InformationCircleIcon className="h-4 w-4 shrink-0 text-lime-700 dark:text-lime-400" />
            {t('how.title')}
            <span className="ml-auto text-xs text-secondary-500 group-open:hidden">{t('common.show')}</span>
            <span className="ml-auto hidden text-xs text-secondary-500 group-open:inline">{t('common.hide')}</span>
          </summary>
          <div className="mt-3 grid gap-4 text-secondary-700 dark:text-secondary-300 md:grid-cols-2">
            <div>
              <p className="mb-1 font-semibold text-secondary-900 dark:text-white">{t('how.realTitle')}</p>
              <ul className="list-disc space-y-1 pl-5">
                {(t.raw('how.real') as string[]).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1 font-semibold text-secondary-900 dark:text-white">{t('how.simTitle')}</p>
              <ul className="list-disc space-y-1 pl-5">
                {(t.raw('how.sim') as string[]).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-2">
              <p className="mb-1 font-semibold text-secondary-900 dark:text-white">{t('how.tourTitle')}</p>
              <ol className="list-decimal space-y-1 pl-5">
                {(t.raw('how.tour') as string[]).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ol>
            </div>
          </div>
        </details>

        <FirmaProvider
          fallback={
            <div role="status" className="rounded-2xl border border-secondary-200 bg-white p-10 text-center text-sm text-secondary-500 dark:border-secondary-800 dark:bg-secondary-900 dark:text-secondary-400">
              {t('shell.loading')}
            </div>
          }
        >
          <Shell />
        </FirmaProvider>
      </div>
    </div>
  );
}

function Shell() {
  const t = useTranslations('demoSign');
  const { tab, go, reset, toast } = useFirma();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <nav aria-label={t('shell.navLabel')} className="-mx-4 min-w-0 overflow-x-auto px-4 lg:mx-0 lg:flex-1 lg:px-0">
          <div role="tablist" className="flex w-max min-w-full gap-1 rounded-xl border border-secondary-200 bg-white p-1 dark:border-secondary-800 dark:bg-secondary-900">
            {TABS.map((key) => {
              const Icon = ICONS[key];
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls="firma-panel"
                  onClick={() => go(key)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${focusRing} ${
                    active
                      ? 'bg-lime-100 text-lime-900 shadow-sm dark:bg-lime-950 dark:text-lime-200'
                      : 'text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(`tabs.${key}`)}
                </button>
              );
            })}
          </div>
        </nav>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className={`inline-flex items-center gap-1.5 rounded-lg border border-secondary-300 bg-white px-3 py-1.5 text-sm text-secondary-700 hover:bg-secondary-100 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-200 dark:hover:bg-secondary-800 ${focusRing}`}
            >
              <ArrowPathIcon className="h-4 w-4" />
              {t('shell.reset')}
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-100">
              <span>{t('shell.resetConfirm')}</span>
              <button
                type="button"
                className={`rounded-md bg-red-600 px-2 py-0.5 font-medium text-white hover:bg-red-700 ${focusRing}`}
                onClick={() => {
                  reset();
                  setConfirmReset(false);
                  toast(t('shell.resetDone'), 'info');
                }}
              >
                {t('shell.resetYes')}
              </button>
              <button type="button" className={`rounded-md px-2 py-0.5 hover:bg-red-100 dark:hover:bg-red-900 ${focusRing}`} onClick={() => setConfirmReset(false)}>
                {t('common.cancel')}
              </button>
            </div>
          )}
        </div>
      </div>

      <section id="firma-panel" role="tabpanel" aria-label={t(`tabs.${tab}`)} className="min-w-0 scroll-mt-24">
        {tab === 'home' && <Dashboard />}
        {tab === 'create' && <Wizard />}
        {tab === 'templates' && <Templates />}
        {tab === 'evidence' && <Evidence />}
        {tab === 'signer' && <SignerView />}
        {tab === 'developers' && <Developers />}
        {tab === 'integrations' && <Integrations />}
      </section>
      <Toasts />
    </>
  );
}
