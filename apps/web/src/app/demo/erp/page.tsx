'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import {
  BookOpenIcon,
  BanknotesIcon,
  CubeIcon,
  ReceiptPercentIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
  GlobeAmericasIcon,
  CurrencyDollarIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';
import { SelectField, DetailModal, formatMoney } from './components/shared';
import { AccountingModule, FinanceModule } from './components/AccountingFinance';
import { InventoryModule, SalesModule } from './components/InventorySales';
import { PurchasesModule, HrModule, ManufacturingModule } from './components/PurchasesHrMfg';

type ModuleId =
  | 'accounting'
  | 'finance'
  | 'inventory'
  | 'sales'
  | 'purchases'
  | 'hr'
  | 'manufacturing';

export default function ErpDemoPage() {
  const t = useTranslations('demoErp');

  const [activeModule, setActiveModule] = useState<ModuleId>('accounting');
  const [company, setCompany] = useState('holding');
  const [currency, setCurrency] = useState('usd');
  const [country, setCountry] = useState('CO');
  const [period, setPeriod] = useState('month');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalRef, setModalRef] = useState<string>('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const currencyCode = useMemo(() => {
    const map: Record<string, string> = {
      usd: 'USD',
      cop: 'COP',
      mxn: 'MXN',
      ars: 'ARS',
      clp: 'CLP',
      pen: 'PEN',
    };
    return map[currency] || 'USD';
  }, [currency]);

  const kpis = [
    { key: 'revenue', label: t('kpis.revenue'), value: 2_845_000, delta: 12.4, up: true, icon: ArrowTrendingUpIcon, color: 'from-green-500 to-emerald-600' },
    { key: 'grossMargin', label: t('kpis.grossMargin'), value: 0.42, delta: 1.8, up: true, isPct: true, icon: SparklesIcon, color: 'from-blue-500 to-indigo-600' },
    { key: 'ebitda', label: t('kpis.ebitda'), value: 612_000, delta: 6.2, up: true, icon: BanknotesIcon, color: 'from-purple-500 to-violet-600' },
    { key: 'cash', label: t('kpis.cash'), value: 1_245_000, delta: -3.1, up: false, icon: CurrencyDollarIcon, color: 'from-amber-500 to-orange-600' },
    { key: 'ar', label: t('kpis.ar'), value: 982_000, delta: 4.5, up: false, icon: ArrowTrendingDownIcon, color: 'from-cyan-500 to-sky-600' },
    { key: 'ap', label: t('kpis.ap'), value: 754_000, delta: -2.3, up: true, icon: ReceiptPercentIcon, color: 'from-rose-500 to-red-600' },
  ];

  const modules: { id: ModuleId; label: string; icon: any }[] = [
    { id: 'accounting', label: t('modules.accounting'), icon: BookOpenIcon },
    { id: 'finance', label: t('modules.finance'), icon: BanknotesIcon },
    { id: 'inventory', label: t('modules.inventory'), icon: CubeIcon },
    { id: 'sales', label: t('modules.sales'), icon: ReceiptPercentIcon },
    { id: 'purchases', label: t('modules.purchases'), icon: ShoppingBagIcon },
    { id: 'hr', label: t('modules.hr'), icon: UserGroupIcon },
    { id: 'manufacturing', label: t('modules.manufacturing'), icon: WrenchScrewdriverIcon },
  ];

  const openDetail = (ref: string) => {
    setModalRef(ref);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-slate-100 dark:from-secondary-950 dark:via-secondary-900 dark:to-secondary-950">
      <header className="sticky top-0 z-30 border-b border-secondary-200 dark:border-secondary-800 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg">
                <CpuChipIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-secondary-900 dark:text-white">{t('meta.title')}</h1>
                <p className="text-xs sm:text-sm text-secondary-600 dark:text-secondary-400 max-w-xl">{t('meta.subtitle')}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
              <SparklesIcon className="w-3.5 h-3.5" />
              {t('meta.poweredByAI')}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <SelectField
              icon={<BuildingOffice2Icon className="w-4 h-4" />}
              label={t('topbar.company')}
              value={company}
              onChange={setCompany}
              options={[
                { value: 'holding', label: t('companies.holding') },
                { value: 'co', label: t('companies.co') },
                { value: 'mx', label: t('companies.mx') },
                { value: 'ar', label: t('companies.ar') },
                { value: 'cl', label: t('companies.cl') },
                { value: 'pe', label: t('companies.pe') },
              ]}
            />
            <SelectField
              icon={<CurrencyDollarIcon className="w-4 h-4" />}
              label={t('topbar.currency')}
              value={currency}
              onChange={setCurrency}
              options={[
                { value: 'usd', label: t('currencies.usd') },
                { value: 'cop', label: t('currencies.cop') },
                { value: 'mxn', label: t('currencies.mxn') },
                { value: 'ars', label: t('currencies.ars') },
                { value: 'clp', label: t('currencies.clp') },
                { value: 'pen', label: t('currencies.pen') },
              ]}
            />
            <SelectField
              icon={<GlobeAmericasIcon className="w-4 h-4" />}
              label={t('topbar.country')}
              value={country}
              onChange={setCountry}
              options={[
                { value: 'CO', label: 'CO' },
                { value: 'MX', label: 'MX' },
                { value: 'AR', label: 'AR' },
                { value: 'CL', label: 'CL' },
                { value: 'PE', label: 'PE' },
              ]}
            />
            <SelectField
              icon={<ClockIcon className="w-4 h-4" />}
              label={t('topbar.period')}
              value={period}
              onChange={setPeriod}
              options={[
                { value: 'month', label: t('periods.month') },
                { value: 'q1', label: t('periods.q1') },
                { value: 'q2', label: t('periods.q2') },
                { value: 'ytd', label: t('periods.ytd') },
              ]}
            />
            <div className="col-span-2 md:col-span-1 relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none z-10" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('topbar.searchPlaceholder')} className="pl-9" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpis.map((k) => (
            <Card key={k.key} variant="bordered" padding="sm" className="hover:shadow-medium transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${k.color} flex items-center justify-center shadow-sm`}>
                  <k.icon className="w-5 h-5 text-white" />
                </div>
                <span className={`text-xs font-semibold flex items-center gap-0.5 ${k.up ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {k.up ? <ArrowTrendingUpIcon className="w-3.5 h-3.5" /> : <ArrowTrendingDownIcon className="w-3.5 h-3.5" />}
                  {Math.abs(k.delta)}%
                </span>
              </div>
              <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-0.5">{k.label}</p>
              <p className="text-lg font-bold text-secondary-900 dark:text-white truncate">
                {k.isPct ? `${(k.value * 100).toFixed(1)}%` : formatMoney(k.value, currencyCode)}
              </p>
              <p className="text-[10px] text-secondary-500 dark:text-secondary-500 mt-1">{t('kpis.vsLastMonth')}</p>
            </Card>
          ))}
        </section>

        <nav className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="flex gap-2 min-w-max">
            {modules.map((m) => {
              const isActive = activeModule === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveModule(m.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 border border-secondary-200 dark:border-secondary-700 hover:border-primary-400 dark:hover:border-primary-500'
                  }`}
                >
                  <m.icon className="w-4 h-4" />
                  {m.label}
                </button>
              );
            })}
          </div>
        </nav>

        <section className="animate-fade-in">
          {activeModule === 'accounting' && <AccountingModule openDetail={openDetail} currencyCode={currencyCode} />}
          {activeModule === 'finance' && <FinanceModule currencyCode={currencyCode} />}
          {activeModule === 'inventory' && <InventoryModule currencyCode={currencyCode} />}
          {activeModule === 'sales' && <SalesModule openDetail={openDetail} currencyCode={currencyCode} />}
          {activeModule === 'purchases' && <PurchasesModule currencyCode={currencyCode} />}
          {activeModule === 'hr' && <HrModule currencyCode={currencyCode} />}
          {activeModule === 'manufacturing' && <ManufacturingModule />}
        </section>

        <footer className="pt-4 pb-8 text-center text-xs text-secondary-500 dark:text-secondary-500">
          {t('footer.demo')} · {t('footer.note')}
        </footer>
      </main>

      {showModal && <DetailModal reference={modalRef} onClose={() => setShowModal(false)} />}
    </div>
  );
}
