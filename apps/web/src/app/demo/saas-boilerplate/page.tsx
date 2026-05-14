'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Badge from '@/components/ui/Badge';
import {
  Squares2X2Icon,
  ServerStackIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  BoltIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  FlagIcon,
  GlobeAltIcon,
  ChartBarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import OverviewTab from './components/OverviewTab';
import TenancyTab from './components/TenancyTab';
import AuthTab from './components/AuthTab';
import BillingTab from './components/BillingTab';
import AdminTab from './components/AdminTab';
import WebhooksTab from './components/WebhooksTab';
import ApiTab from './components/ApiTab';
import AuditTab from './components/AuditTab';
import FlagsTab from './components/FlagsTab';
import I18nTab from './components/I18nTab';
import ObservabilityTab from './components/ObservabilityTab';
import TeamsTab from './components/TeamsTab';

type TabKey =
  | 'overview'
  | 'tenancy'
  | 'auth'
  | 'billing'
  | 'admin'
  | 'webhooks'
  | 'api'
  | 'audit'
  | 'flags'
  | 'i18n'
  | 'observability'
  | 'teams';

const TABS: { key: TabKey; icon: typeof Squares2X2Icon }[] = [
  { key: 'overview', icon: Squares2X2Icon },
  { key: 'tenancy', icon: ServerStackIcon },
  { key: 'auth', icon: ShieldCheckIcon },
  { key: 'billing', icon: CreditCardIcon },
  { key: 'admin', icon: Cog6ToothIcon },
  { key: 'webhooks', icon: BoltIcon },
  { key: 'api', icon: CodeBracketIcon },
  { key: 'audit', icon: DocumentTextIcon },
  { key: 'flags', icon: FlagIcon },
  { key: 'i18n', icon: GlobeAltIcon },
  { key: 'observability', icon: ChartBarIcon },
  { key: 'teams', icon: UsersIcon },
];

export default function SaasBoilerplateDemoPage() {
  const t = useTranslations('demoSaas');
  const [tab, setTab] = useState<TabKey>('overview');

  const renderTab = () => {
    switch (tab) {
      case 'overview':
        return <OverviewTab />;
      case 'tenancy':
        return <TenancyTab />;
      case 'auth':
        return <AuthTab />;
      case 'billing':
        return <BillingTab />;
      case 'admin':
        return <AdminTab />;
      case 'webhooks':
        return <WebhooksTab />;
      case 'api':
        return <ApiTab />;
      case 'audit':
        return <AuditTab />;
      case 'flags':
        return <FlagsTab />;
      case 'i18n':
        return <I18nTab />;
      case 'observability':
        return <ObservabilityTab />;
      case 'teams':
        return <TeamsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 p-6 sm:p-8 text-white shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700">SaaS</span>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border border-white/30 text-white/90">B2B</span>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700">Production-ready</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t('pageTitle')}</h1>
          <p className="mt-3 text-lg text-slate-100/90 max-w-3xl">{t('pageSubtitle')}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(t.raw('stack.items') as string[]).map((s) => (
              <span
                key={s}
                className="text-xs px-2 py-1 rounded-md bg-white/10 border border-white/20 text-white/90"
              >
                {s}
              </span>
            ))}
          </div>
        </header>

        <div className="sticky top-0 z-10 -mx-4 sm:mx-0 mb-6 bg-secondary-50/90 dark:bg-secondary-950/90 backdrop-blur border-b border-secondary-200 dark:border-secondary-800">
          <nav className="flex gap-1 overflow-x-auto px-4 sm:px-0 py-2">
            {TABS.map(({ key, icon: Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t(`tabs.${key}`)}
                </button>
              );
            })}
          </nav>
        </div>

        {renderTab()}
      </div>
    </div>
  );
}
