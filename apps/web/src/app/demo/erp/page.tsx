'use client';

import { useTranslations } from 'next-intl';
import {
  BanknotesIcon,
  BookOpenIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  ReceiptPercentIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { ErpProvider, useErp } from './lib/store';
import { tabKeyDown } from './components/ui';
import type { ModuleId } from './lib/types';
import Toolbar, { ErpIntro, ErpLoading, MODULE_ORDER } from './components/Header';
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-slate-100 dark:from-secondary-950 dark:via-secondary-900 dark:to-secondary-950">
      <ErpIntro />
      {/* Los datos de ejemplo dependen de la fecha de hoy: se arman en el navegador */}
      <ErpProvider fallback={<ErpLoading />}>
        <ErpDemo />
      </ErpProvider>
    </div>
  );
}

function ErpDemo() {
  const t = useTranslations('demoErp');
  const { module, goTo, filters, setFilters } = useErp();

  return (
    <>
      <Toolbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Kpis />
        <FlowGuide />

        <nav id="erp-modules" aria-label={t('modules.aria')} className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 scroll-mt-24">
          <div role="tablist" aria-label={t('modules.aria')} className="flex gap-2 min-w-max" onKeyDown={(e) => tabKeyDown(e, MODULE_ORDER, module, goTo)}>
            {MODULE_ORDER.map((id) => {
              const Icon = ICONS[id];
              const isActive = module === id;
              return (
                <button
                  key={id}
                  id={`erp-tab-${id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="erp-panel"
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => goTo(id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 border border-secondary-200 dark:border-secondary-700 hover:border-primary-400 dark:hover:border-primary-500'
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {t(`modules.${id}`)}
                </button>
              );
            })}
          </div>
        </nav>

        {filters.search.trim() && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
            <MagnifyingGlassIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-words">{t('topbar.filtering', { q: filters.search.trim() })}</span>
            <button onClick={() => setFilters({ search: '' })} className="font-semibold underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
              {t('topbar.clearSearch')}
            </button>
          </div>
        )}

        <section id="erp-panel" role="tabpanel" aria-labelledby={`erp-tab-${module}`}>
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
      </div>
    </>
  );
}
