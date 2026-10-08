'use client';

import { useTranslations } from 'next-intl';
import {
  BanknotesIcon,
  BookOpenIcon,
  CubeIcon,
  ReceiptPercentIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { ErpProvider, useErp } from './lib/store';
import type { ModuleId } from './lib/types';
import Header, { MODULE_ORDER } from './components/Header';
import Kpis from './components/Kpis';
import FlowGuide from './components/FlowGuide';
import SalesModule from './components/SalesModule';
import InventoryModule from './components/InventoryModule';
import PurchasesModule from './components/PurchasesModule';
import AccountingModule from './components/AccountingModule';
import FinanceModule from './components/FinanceModule';
import HrModule from './components/HrModule';
import ManufacturingModule from './components/ManufacturingModule';

const ICONS: Record<ModuleId, typeof BookOpenIcon> = {
  sales: ReceiptPercentIcon,
  inventory: CubeIcon,
  purchases: ShoppingBagIcon,
  accounting: BookOpenIcon,
  finance: BanknotesIcon,
  hr: UserGroupIcon,
  manufacturing: WrenchScrewdriverIcon,
};

export default function ErpDemoPage() {
  return (
    <ErpProvider>
      <ErpDemo />
    </ErpProvider>
  );
}

function ErpDemo() {
  const t = useTranslations('demoErp');
  const { module, goTo } = useErp();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-slate-100 dark:from-secondary-950 dark:via-secondary-900 dark:to-secondary-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Kpis />
        <FlowGuide />

        <nav id="erp-modules" aria-label={t('modules.aria')} className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 scroll-mt-24 lg:scroll-mt-[300px]">
          <div role="tablist" className="flex gap-2 min-w-max">
            {MODULE_ORDER.map((id) => {
              const Icon = ICONS[id];
              const isActive = module === id;
              return (
                <button
                  key={id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => goTo(id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 border border-secondary-200 dark:border-secondary-700 hover:border-primary-400 dark:hover:border-primary-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t(`modules.${id}`)}
                </button>
              );
            })}
          </div>
        </nav>

        <section role="tabpanel" aria-label={t(`modules.${module}`)}>
          {module === 'sales' && <SalesModule />}
          {module === 'inventory' && <InventoryModule />}
          {module === 'purchases' && <PurchasesModule />}
          {module === 'accounting' && <AccountingModule />}
          {module === 'finance' && <FinanceModule />}
          {module === 'hr' && <HrModule />}
          {module === 'manufacturing' && <ManufacturingModule />}
        </section>

        <footer className="pt-4 pb-8 text-xs text-secondary-500 dark:text-secondary-400 space-y-1 max-w-4xl">
          <p>{t('footer.sample')}</p>
          <p>{t('footer.integrations')}</p>
          <p>{t('footer.storage')}</p>
        </footer>
      </main>
    </div>
  );
}
