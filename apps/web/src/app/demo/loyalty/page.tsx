'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import {
  ArrowPathIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DevicePhoneMobileIcon,
  InformationCircleIcon,
  MapIcon,
  ShoppingCartIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import AdminView, { type AdminTab } from './components/AdminView';
import AnalyticsView from './components/AnalyticsView';
import CashierView from './components/CashierView';
import MemberView from './components/MemberView';
import { CLUB, type Segment } from './components/data';
import { LoyaltyProvider, useLoyalty } from './components/store';
import { ToastProvider, useToast } from './components/ui';

type MainTab = 'cashier' | 'member' | 'config' | 'results';
const TABS: MainTab[] = ['cashier', 'member', 'config', 'results'];
const TAB_ICON = { cashier: ShoppingCartIcon, member: DevicePhoneMobileIcon, config: Cog6ToothIcon, results: ChartBarIcon } as const;

export default function LoyaltyDemoPage() {
  return (
    <ToastProvider>
      <LoyaltyProvider>
        <LoyaltyDemo />
      </LoyaltyProvider>
    </ToastProvider>
  );
}

function LoyaltyDemo() {
  const t = useTranslations('demoLoyalty');
  const notify = useToast();
  const store = useLoyalty();
  const [tab, setTab] = useState<MainTab>('cashier');
  const [adminSub, setAdminSub] = useState<AdminTab>('points');
  const [prefill, setPrefill] = useState<Segment | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const go = (k: MainTab) => {
    setTab(k);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const clearPrefill = useCallback(() => setPrefill(null), []);

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <header className="mb-4 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 text-white p-5 sm:p-6 md:p-8 shadow-lg">
          <div className="flex items-start gap-3 mb-2">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur text-white shrink-0">
              <SparklesIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">{t('pageTitle')}</h1>
              <p className="text-sm text-amber-50/90 mt-1">{t('pageBrand', { club: CLUB.club, brand: CLUB.brand })}</p>
            </div>
          </div>
          <p className="text-base sm:text-lg text-amber-50/95 max-w-3xl">{t('pageSubtitle')}</p>
        </header>

        <div className="mb-5 flex flex-col lg:flex-row lg:items-start gap-3">
          <span
            className="self-start inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200 whitespace-nowrap"
            title={t('sampleHint', { club: CLUB.club, brand: CLUB.brand, nit: CLUB.nit })}
          >
            {t('sampleBadge')}
          </span>
          <details className="group flex-1 min-w-0 rounded-lg border border-secondary-200 dark:border-secondary-800 bg-white/70 dark:bg-secondary-900/70 px-3 py-2 text-sm">
            <summary className="cursor-pointer list-none flex items-center gap-2 font-medium text-secondary-800 dark:text-secondary-200">
              <InformationCircleIcon className="h-4 w-4 text-primary-600 dark:text-primary-400 shrink-0" />
              {t('howItWorks.title')}
              <span className="ml-auto text-xs text-secondary-500 group-open:hidden">{t('common.show')}</span>
              <span className="ml-auto text-xs text-secondary-500 hidden group-open:inline">{t('common.hide')}</span>
            </summary>
            <ul className="mt-2 space-y-1.5 text-secondary-700 dark:text-secondary-300 list-disc pl-5">
              <li>{t('sampleHint', { club: CLUB.club, brand: CLUB.brand, nit: CLUB.nit })}</li>
              <li>{t('howItWorks.real')}</li>
              <li>{t('howItWorks.simulated')}</li>
              <li>{t('howItWorks.project')}</li>
            </ul>
          </details>
          <details className="group flex-1 min-w-0 rounded-lg border border-secondary-200 dark:border-secondary-800 bg-white/70 dark:bg-secondary-900/70 px-3 py-2 text-sm">
            <summary className="cursor-pointer list-none flex items-center gap-2 font-medium text-secondary-800 dark:text-secondary-200">
              <MapIcon className="h-4 w-4 text-primary-600 dark:text-primary-400 shrink-0" />
              {t('tour.title')}
              <span className="ml-auto text-xs text-secondary-500 group-open:hidden">{t('common.show')}</span>
              <span className="ml-auto text-xs text-secondary-500 hidden group-open:inline">{t('common.hide')}</span>
            </summary>
            <ol className="mt-2 space-y-1.5 text-secondary-700 dark:text-secondary-300 list-decimal pl-5">
              {(['1', '2', '3', '4', '5'] as const).map((k) => (
                <li key={k}>{t(`tour.steps.${k}`)}</li>
              ))}
            </ol>
          </details>
          <div className="self-start">
            {!confirmReset ? (
              <Button size="sm" variant="ghost" onClick={() => setConfirmReset(true)} className="gap-1.5">
                <ArrowPathIcon className="h-4 w-4" />
                {t('reset.button')}
              </Button>
            ) : (
              <div role="alert" className="flex flex-wrap items-center gap-2 rounded-lg border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 px-3 py-1.5">
                <span className="text-xs text-secondary-700 dark:text-secondary-300">{t('reset.confirm')}</span>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    store.reset();
                    setConfirmReset(false);
                    setTab('cashier');
                    setAdminSub('points');
                    notify(t('reset.done'));
                  }}
                >
                  {t('reset.yes')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            )}
          </div>
        </div>

        <nav className="flex gap-1 sm:gap-2 mb-6 border-b border-secondary-200 dark:border-secondary-800 overflow-x-auto" role="tablist" aria-label={t('tabs.label')}>
          {TABS.map((k) => {
            const Icon = TAB_ICON[k];
            const active = tab === k;
            return (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => go(k)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  active ? 'border-amber-600 text-amber-700 dark:text-amber-300' : 'border-transparent text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {t(`tabs.${k}`)}
              </button>
            );
          })}
        </nav>

        <div data-testid="ly-content" role="tabpanel" aria-label={t(`tabs.${tab}`)}>
          {tab === 'cashier' && <CashierView onOpenMember={() => go('member')} />}
          {tab === 'member' && <MemberView />}
          {tab === 'config' && <AdminView sub={adminSub} onSub={setAdminSub} prefillSegment={prefill} onPrefillUsed={clearPrefill} />}
          {tab === 'results' && (
            <AnalyticsView
              onCreateCampaign={(s) => {
                setPrefill(s);
                setAdminSub('campaigns');
                setTab('config');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
