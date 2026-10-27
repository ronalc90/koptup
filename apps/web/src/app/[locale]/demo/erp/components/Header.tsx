'use client';

import { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  BuildingOffice2Icon,
  CalculatorIcon,
  ClockIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  MapIcon,
  PresentationChartBarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { COMPANIES } from '../lib/catalog';
import { addMonths, fmtMonthTitle, TRM_REF } from '../lib/format';
import { searchCounts } from '../lib/search';
import { useErp } from '../lib/store';
import type { CompanyFilter, CurrencyCode, ModuleId, PeriodId } from '../lib/types';
import { START_TOUR_EVENT } from './FlowGuide';
import { Modal, SelectField, btn, useEntryDesc, useFmt } from './ui';

export const MODULE_ORDER: ModuleId[] = ['sales', 'inventory', 'purchases', 'accounting', 'finance', 'hr', 'manufacturing'];

/** Salidas comerciales: demo guiada con esta demo ya elegida y cotización del producto del catálogo. */
const GUIDED_DEMO_HREF = '/solicitar-demo?demos=erp';
const QUOTE_HREF = '/contact?service=erp-modular';

const linkBtn = 'inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-semibold px-3 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-secondary-900';

/**
 * Encabezado de la demo: qué es, para quién y por dónde empezar, con la salida
 * al catálogo y las salidas comerciales. No depende de los datos, así que se
 * pinta igual en el servidor y en el navegador.
 */
export function ErpIntro() {
  const t = useTranslations('demoErp');
  return (
    <header className="border-b border-secondary-200 dark:border-secondary-800 bg-white/90 dark:bg-secondary-900/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Link href="/demo" className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-secondary-600 dark:text-secondary-300 hover:text-primary-700 dark:hover:text-primary-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
            <ArrowLeftIcon className="w-4 h-4" aria-hidden="true" />
            {t('intro.back')}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={GUIDED_DEMO_HREF} className={`${linkBtn} bg-primary-600 hover:bg-primary-700 text-white`}>
              <PresentationChartBarIcon className="w-4 h-4" aria-hidden="true" />
              {t('intro.guidedDemo')}
            </Link>
            <Link href={QUOTE_HREF} className={`${linkBtn} border border-secondary-300 dark:border-secondary-600 text-secondary-800 dark:text-secondary-100 hover:bg-secondary-50 dark:hover:bg-secondary-800`}>
              <CalculatorIcon className="w-4 h-4" aria-hidden="true" />
              {t('intro.quote')}
            </Link>
          </div>
        </div>

        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg" aria-hidden="true">
              <CpuChipIcon className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">{t('intro.kicker')}</p>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-secondary-900 dark:text-white">{t('meta.title')}</h1>
              <p className="text-xs sm:text-sm text-secondary-600 dark:text-secondary-400 max-w-3xl">{t('meta.subtitle')}</p>
            </div>
          </div>
          <span title={t('meta.sampleHint')} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200">
            {t('meta.sampleBadge')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs sm:text-sm">
          <p className="rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50/70 dark:bg-secondary-800/40 px-3 py-2 text-secondary-700 dark:text-secondary-300">
            <span className="font-semibold text-secondary-900 dark:text-white">{t('intro.forWhomLabel')} </span>
            {t('intro.forWhom')}
          </p>
          <div className="rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50/70 dark:bg-primary-950/30 px-3 py-2 text-secondary-700 dark:text-secondary-300 flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 flex-1">
              <span className="font-semibold text-secondary-900 dark:text-white">{t('intro.startLabel')} </span>
              {t('intro.start')}
            </p>
            <a
              href="#erp-recorrido"
              onClick={() => window.dispatchEvent(new Event(START_TOUR_EVENT))}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white dark:bg-secondary-900 border border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-950/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <MapIcon className="w-4 h-4" aria-hidden="true" />
              {t('intro.startCta')}
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

/** Mientras se arman los datos de ejemplo (unos instantes después de cargar la página). */
export function ErpLoading() {
  const t = useTranslations('demoErp');
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10" role="status" aria-live="polite" aria-busy="true">
      <div className="rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white/80 dark:bg-secondary-900/60 p-6 text-sm text-secondary-600 dark:text-secondary-300 flex items-center gap-3">
        <ArrowPathIcon className="w-5 h-5 animate-spin text-primary-600 dark:text-primary-400" aria-hidden="true" />
        {t('loading')}
      </div>
    </div>
  );
}

/** Nombre visible de cada período, relativo a la fecha de trabajo (corto: cabe en el celular). */
export function usePeriodLabel() {
  const t = useTranslations('demoErp.periods');
  const { workDate, locale } = useErp();
  const m0 = workDate.slice(0, 7);
  return (p: PeriodId) => {
    switch (p) {
      case 'm0':
      case 'm1':
      case 'm2':
        return fmtMonthTitle(addMonths(m0, -Number(p[1])), locale);
      case 'q':
        return t('q');
      case 'ytd':
      default:
        return t('ytd', { year: m0.slice(0, 4) });
    }
  };
}

/** Filtros, búsqueda y fecha de trabajo (necesitan los datos de la demo). */
export default function Toolbar() {
  const t = useTranslations('demoErp');
  const { filters, setFilters, state, computed, goTo, reset, range, workDate, openMonthLabel } = useErp();
  const f = useFmt();
  const descOf = useEntryDesc();
  const periodLabel = usePeriodLabel();
  const [confirmReset, setConfirmReset] = useState(false);

  const counts = useMemo(
    () => searchCounts(state, computed, filters.search, filters.company, range, descOf),
    // descOf depende solo del idioma
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, computed, filters.search, filters.company, range, f.locale],
  );
  const hasEdits = useMemo(() => state.sales.some((s) => s.user) || state.pos.some((p) => p.user) || state.manual.length > 0 || state.transfers.some((x) => x.user) || state.bank.some((b) => b.match?.by === 'user' || b.imported) || state.production.some((o) => o.user) || state.vacations.some((v) => v.user) || state.payroll.some((p) => p.user) || state.receipts.some((r) => r.user), [state]);

  return (
    <section aria-label={t('topbar.aria')} className="border-b border-secondary-200 dark:border-secondary-800 bg-white/90 dark:bg-secondary-900/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-3">
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
            options={(['m0', 'm1', 'm2', 'q', 'ytd'] as PeriodId[]).map((p) => ({ value: p, label: periodLabel(p) }))}
          />
          <div className="col-span-2 md:col-span-1">
            <label htmlFor="erp-search" className="block text-[10px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400 mb-1 font-semibold">
              {t('topbar.search')}
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" aria-hidden="true" />
              {/* Sin la X propia del navegador: la demo trae su botón para borrar */}
              <input
                id="erp-search"
                type="search"
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && filters.search) setFilters({ search: '' });
                }}
                placeholder={t('topbar.searchPlaceholder')}
                className="w-full pl-9 pr-8 py-2 text-sm rounded-lg bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-cancel-button]:hidden"
              />
              {filters.search && (
                <button onClick={() => setFilters({ search: '' })} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-secondary-500 hover:text-secondary-900 dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500" aria-label={t('topbar.clearSearch')}>
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
          <span>{t('topbar.viewing', { from: f.date(range.start), to: f.date(range.end) })}</span>
          <span>· {t('topbar.workDate', { month: openMonthLabel, date: f.date(workDate) })}</span>
          {filters.currency === 'USD' && <span>· {t('topbar.trmNote', { trm: f.cop(TRM_REF) })}</span>}
          <span>· {t('topbar.savedLocally')}</span>
          {hasEdits && (
            <button onClick={() => setConfirmReset(true)} className="inline-flex items-center gap-1 rounded text-primary-700 dark:text-primary-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
              <ArrowPathIcon className="w-3.5 h-3.5" aria-hidden="true" />
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
    </section>
  );
}
