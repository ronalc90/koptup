'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import {
  ArrowPathIcon,
  BuildingOffice2Icon,
  ClockIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { COMPANIES, WORK_DATE } from '../lib/catalog';
import { periodRange } from '../lib/engine';
import { TRM_REF } from '../lib/format';
import { searchCounts } from '../lib/search';
import { useErp } from '../lib/store';
import type { CompanyFilter, CurrencyCode, ModuleId, PeriodId } from '../lib/types';
import { Modal, SelectField, btn, useEntryDesc, useFmt } from './ui';

export const MODULE_ORDER: ModuleId[] = ['sales', 'inventory', 'purchases', 'accounting', 'finance', 'hr', 'manufacturing'];

export default function Header() {
  const t = useTranslations('demoErp');
  const { filters, setFilters, state, computed, goTo, reset } = useErp();
  const f = useFmt();
  const descOf = useEntryDesc();
  const [confirmReset, setConfirmReset] = useState(false);

  const counts = useMemo(
    () => searchCounts(state, computed, filters.search, filters.company, periodRange(filters.period), descOf),
    // descOf depende solo del idioma
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, computed, filters.search, filters.company, filters.period, f.locale],
  );
  const hasEdits = useMemo(() => state.sales.some((s) => s.user) || state.pos.some((p) => p.user) || state.manual.length > 0 || state.transfers.some((x) => x.user) || state.bank.some((b) => b.match?.by === 'user' || b.imported) || state.production.some((o) => o.user) || state.vacations.some((v) => v.user) || state.payroll.some((p) => p.user) || state.receipts.some((r) => r.user), [state]);

  return (
    <header className="lg:sticky lg:top-20 z-30 border-b border-secondary-200 dark:border-secondary-800 bg-white/90 dark:bg-secondary-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg">
              <CpuChipIcon className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-secondary-900 dark:text-white">{t('meta.title')}</h1>
              <p className="text-xs sm:text-sm text-secondary-600 dark:text-secondary-400 max-w-2xl">{t('meta.subtitle')}</p>
            </div>
          </div>
          <span
            title={t('meta.sampleHint')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200"
          >
            {t('meta.sampleBadge')}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <SelectField
            icon={<BuildingOffice2Icon className="w-4 h-4" />}
            label={t('topbar.company')}
            value={filters.company}
            onChange={(v) => setFilters({ company: v as CompanyFilter })}
            options={[
              { value: 'all', label: t('topbar.companyAll') },
              { value: 'com', label: COMPANIES.com.name },
              { value: 'log', label: COMPANIES.log.name },
            ]}
            className="col-span-2 md:col-span-1"
          />
          <SelectField
            icon={<CurrencyDollarIcon className="w-4 h-4" />}
            label={t('topbar.currency')}
            value={filters.currency}
            onChange={(v) => setFilters({ currency: v as CurrencyCode })}
            options={[
              { value: 'COP', label: t('topbar.cop') },
              { value: 'USD', label: t('topbar.usd') },
            ]}
          />
          <SelectField
            icon={<ClockIcon className="w-4 h-4" />}
            label={t('topbar.period')}
            value={filters.period}
            onChange={(v) => setFilters({ period: v as PeriodId })}
            options={(['2026-09', '2026-08', '2026-07', 'q3', 'ytd'] as PeriodId[]).map((p) => ({ value: p, label: t(`periods.${p}`) }))}
          />
          <div className="col-span-2 md:col-span-1">
            <label htmlFor="erp-search" className="block text-[10px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400 mb-1 font-semibold">
              {t('topbar.search')}
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" />
              <input
                id="erp-search"
                type="search"
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                placeholder={t('topbar.searchPlaceholder')}
                className="w-full pl-9 pr-8 py-2 text-sm rounded-lg bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {filters.search && (
                <button onClick={() => setFilters({ search: '' })} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-secondary-500 hover:text-secondary-900 dark:hover:text-white" aria-label={t('topbar.clearSearch')}>
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {filters.search.trim() && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs" aria-live="polite">
            <span className="text-secondary-600 dark:text-secondary-400">{t('topbar.resultsIn')}</span>
            {MODULE_ORDER.map((m) => (
              <button
                key={m}
                onClick={() => goTo(m, undefined, true)}
                disabled={!counts[m]}
                className="px-2 py-0.5 rounded-full border border-secondary-200 dark:border-secondary-700 text-secondary-700 dark:text-secondary-200 hover:border-primary-400 disabled:opacity-40 disabled:cursor-default"
              >
                {t(`modules.${m}`)} · {counts[m] || 0}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-secondary-500 dark:text-secondary-400">
          <span>{t('topbar.workDate', { date: f.date(WORK_DATE) })}</span>
          {filters.currency === 'USD' && <span>· {t('topbar.trmNote', { trm: f.cop(TRM_REF) })}</span>}
          <span>· {t('topbar.savedLocally')}</span>
          {hasEdits && (
            <button onClick={() => setConfirmReset(true)} className="inline-flex items-center gap-1 text-primary-700 dark:text-primary-300 hover:underline">
              <ArrowPathIcon className="w-3.5 h-3.5" />
              {t('topbar.reset')}
            </button>
          )}
        </div>
      </div>

      {confirmReset && (
        <Modal
          title={t('topbar.resetTitle')}
          onClose={() => setConfirmReset(false)}
          footer={
            <>
              <button className={btn.outline} onClick={() => setConfirmReset(false)}>
                {t('common.cancel')}
              </button>
              <button
                className={btn.primary}
                onClick={() => {
                  reset();
                  setConfirmReset(false);
                  toast.success(t('topbar.resetDone'));
                }}
              >
                {t('topbar.resetConfirm')}
              </button>
            </>
          }
        >
          <p className="text-sm text-secondary-700 dark:text-secondary-300">{t('topbar.resetBody')}</p>
        </Modal>
      )}
    </header>
  );
}
