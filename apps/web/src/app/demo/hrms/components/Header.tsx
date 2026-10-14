'use client';

import { useState, type KeyboardEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import {
  AcademicCapIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  BanknotesIcon,
  BriefcaseIcon,
  CalculatorIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
  PresentationChartBarIcon,
  StarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { COMPANY } from '../lib/catalog';
import { useHr } from '../lib/store';
import type { TabId } from '../lib/types';
import { Modal, btn, useFmt } from './ui';

export const TABS: { id: TabId; icon: typeof UsersIcon }[] = [
  { id: 'home', icon: ChartBarIcon },
  { id: 'people', icon: UsersIcon },
  { id: 'absences', icon: CalendarDaysIcon },
  { id: 'talent', icon: BriefcaseIcon },
  { id: 'performance', icon: StarIcon },
  { id: 'payroll', icon: BanknotesIcon },
  { id: 'learning', icon: AcademicCapIcon },
];

/** Salidas comerciales: demo guiada con esta demo ya elegida y cotización del producto. */
export const REQUEST_DEMO_HREF = '/solicitar-demo?demos=hrms';
export const QUOTE_HREF = '/contact?service=hrms';

export function Banner({ actions }: { actions?: ReactNode }) {
  const t = useTranslations('demoHrms.meta');
  return (
    <div className="space-y-3">
      <Link
        href="/demo"
        className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-secondary-700 hover:text-secondary-900 dark:text-secondary-300 dark:hover:text-white"
      >
        <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
        {t('back')}
      </Link>
      <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 p-5 sm:p-8 text-white shadow-sm flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="min-w-0">
          <span title={t('sampleHint')} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/30 mb-3">
            {t('sampleBadge')}
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-base sm:text-lg text-violet-50/90 mt-2 max-w-3xl">{t('subtitle')}</p>
          <p className="text-sm text-violet-100/90 mt-2 max-w-3xl">{t('audience')}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link
              href={REQUEST_DEMO_HREF}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/40 text-white"
            >
              <PresentationChartBarIcon className="h-4 w-4" aria-hidden="true" />
              {t('requestDemo')}
            </Link>
            <Link
              href={QUOTE_HREF}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/40 text-white"
            >
              <CalculatorIcon className="h-4 w-4" aria-hidden="true" />
              {t('quote')}
            </Link>
          </div>
        </div>
        {actions}
      </div>
    </div>
  );
}

export function HeaderActions() {
  const t = useTranslations('demoHrms.header');
  const { openApp, reset, state } = useHr();
  const f = useFmt();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="flex flex-col gap-2 lg:items-end shrink-0">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => openApp(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-white text-violet-800 hover:bg-violet-50">
          <DevicePhoneMobileIcon className="w-4 h-4" aria-hidden="true" />
          {t('openApp')}
        </button>
        <button type="button" onClick={() => setConfirm(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/20 border border-white/30 text-white">
          <ArrowPathIcon className="w-4 h-4" aria-hidden="true" />
          {t('reset')}
        </button>
      </div>
      <p className="text-xs text-violet-100/90 lg:text-right">
        {t('company', { name: COMPANY.name, nit: COMPANY.nitFormatted })}
        <br />
        {t('asOf', { date: f.date(state.baseDate, 'long') })}
      </p>
      {confirm && (
        <Modal title={t('resetTitle')} onClose={() => setConfirm(false)} size="sm" labelId="hrms-reset-title">
          <p className="text-sm text-secondary-700 dark:text-secondary-300 mb-4">{t('resetBody')}</p>
          <div className="flex justify-end gap-2">
            <button type="button" className={btn.outline} onClick={() => setConfirm(false)}>
              {t('cancel')}
            </button>
            <button
              type="button"
              className={btn.primary}
              onClick={() => {
                reset();
                setConfirm(false);
                toast.success(t('resetDone'));
              }}
            >
              {t('resetConfirm')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function TabBar({ active, onSelect, counts }: { active: TabId | null; onSelect?: (t: TabId) => void; counts?: Partial<Record<TabId, number>> }) {
  const t = useTranslations('demoHrms.tabs');
  // Teclado: flechas, Inicio y Fin mueven entre pestañas (patrón de pestañas de ARIA).
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onSelect) return;
    // Se parte de la pestaña enfocada (o de la activa si el foco no está en una pestaña).
    const focused = (e.target as HTMLElement).closest('[role="tab"]')?.id.replace('hrms-tab-', '');
    const i = Math.max(0, TABS.findIndex((x) => x.id === (focused || active)));
    let j = -1;
    if (e.key === 'ArrowRight') j = (i + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') j = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = TABS.length - 1;
    if (j < 0) return;
    e.preventDefault();
    onSelect(TABS[j].id);
    document.getElementById(`hrms-tab-${TABS[j].id}`)?.focus();
  };
  return (
    <nav id="hrms-tabs" aria-label={t('aria')} className="relative overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 scroll-mt-24">
      <div role="tablist" aria-label={t('aria')} className="flex gap-1.5 sm:gap-2 min-w-max" onKeyDown={onKeyDown}>
        {TABS.map(({ id, icon: Icon }, idx) => {
          const isActive = active === id;
          const n = counts?.[id];
          return (
            <button
              key={id}
              id={`hrms-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="hrms-panel"
              tabIndex={isActive || (active === null && idx === 0) ? 0 : -1}
              onClick={() => onSelect?.(id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg whitespace-nowrap font-medium text-sm transition-all ${
                isActive
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-white dark:bg-secondary-900 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800 border border-secondary-200 dark:border-secondary-700'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {t(id)}
              {n ? (
                <span
                  aria-label={t('pendingCount', { n })}
                  className={`ml-0.5 min-w-[1.25rem] px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-white/25 text-white' : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'}`}
                >
                  {n}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
