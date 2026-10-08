'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowPathIcon, ChartBarSquareIcon, CreditCardIcon, PlusCircleIcon, UsersIcon, BuildingOffice2Icon, WrenchScrewdriverIcon, LifebuoyIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { DemoProvider, useDemo } from './lib/store';
import type { Screen } from './lib/types';
import { SCREENS } from './lib/types';
import { DEMO_TODAY, VENDOR } from './lib/data';
import { useFmt } from './lib/useFmt';
import { Toasts } from './components/ui';
import Tour from './components/Tour';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import Billing from './components/Billing';
import Access from './components/Access';
import Portal from './components/Portal';
import Operations from './components/Operations';

const ICONS: Record<Screen, typeof ChartBarSquareIcon> = {
  dashboard: ChartBarSquareIcon,
  onboarding: PlusCircleIcon,
  billing: CreditCardIcon,
  access: UsersIcon,
  portal: BuildingOffice2Icon,
  operations: WrenchScrewdriverIcon,
};

export default function SaasMultiTenantDemoPage() {
  return (
    <DemoProvider>
      <Shell />
    </DemoProvider>
  );
}

function Shell() {
  const t = useTranslations('demoSaas');
  const f = useFmt();
  const { s, go, reset, endSupport } = useDemo();
  const [confirmReset, setConfirmReset] = useState(false);
  const support = s.impersonation ? s.tenants.find((x) => x.id === s.impersonation?.tenantId) : null;

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="mb-5 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 p-5 text-white shadow-sm sm:p-7">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-amber-300/50 bg-amber-300/15 px-2.5 py-0.5 text-xs font-semibold text-amber-100" title={t('meta.sampleHint')}>
              {t('meta.sampleBadge')}
            </span>
            <span className="inline-flex items-center rounded-full border border-white/30 px-2.5 py-0.5 text-xs font-semibold text-white/90">
              {t('meta.simBadge')}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{t('meta.title')}</h1>
          <p className="mt-2 max-w-3xl text-base text-slate-100/90 sm:text-lg">{t('meta.subtitle')}</p>
          <p className="mt-3 max-w-3xl text-sm text-slate-200/80">{t('meta.caseLine', { product: VENDOR.product, date: f.date(DEMO_TODAY) })}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 px-3 py-1.5 text-sm text-white/90 hover:bg-white/10"
              >
                <ArrowPathIcon className="h-4 w-4" />
                {t('meta.reset')}
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm">
                <span>{t('meta.resetConfirm')}</span>
                <button
                  type="button"
                  className="rounded-md bg-white px-2 py-0.5 font-medium text-slate-800"
                  onClick={() => {
                    reset();
                    setConfirmReset(false);
                  }}
                >
                  {t('meta.resetYes')}
                </button>
                <button type="button" className="rounded-md px-2 py-0.5 text-white/90 hover:bg-white/10" onClick={() => setConfirmReset(false)}>
                  {t('common.cancel')}
                </button>
              </div>
            )}
          </div>
        </header>

        <Tour />

        <div className="lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-6">
          <nav aria-label={t('meta.navLabel')} className="mb-5 lg:mb-0">
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:sticky lg:top-24 lg:grid-cols-1">
              {SCREENS.map((key, i) => {
                const Icon = ICONS[key];
                const active = s.screen === key;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => go(key)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                        active
                          ? 'bg-slate-700 text-white shadow-sm'
                          : 'bg-white text-secondary-700 ring-1 ring-secondary-200 hover:bg-secondary-100 dark:bg-secondary-900 dark:text-secondary-200 dark:ring-secondary-700 dark:hover:bg-secondary-800'
                      }`}
                    >
                      <span className={`hidden text-xs tabular-nums sm:inline ${active ? 'text-white/70' : 'text-secondary-400'}`}>{i + 1}</span>
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 leading-tight">{t(`screens.${key}.label`)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <main className="min-w-0 space-y-5">
            {support && (
              <div className="flex flex-col gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-2">
                  <LifebuoyIcon className="mt-0.5 h-5 w-5 shrink-0" />
                  <span className="min-w-0 break-words">{t('support.banner', { tenant: support.name, reason: s.impersonation?.reason ?? '' })}</span>
                </div>
                <Button size="sm" variant="outline" onClick={endSupport} className="shrink-0">
                  {t('support.end')}
                </Button>
              </div>
            )}
            {s.screen === 'dashboard' && <Dashboard />}
            {s.screen === 'onboarding' && <Onboarding />}
            {s.screen === 'billing' && <Billing />}
            {s.screen === 'access' && <Access />}
            {s.screen === 'portal' && <Portal />}
            {s.screen === 'operations' && <Operations />}
          </main>
        </div>
      </div>
      <Toasts />
    </div>
  );
}
