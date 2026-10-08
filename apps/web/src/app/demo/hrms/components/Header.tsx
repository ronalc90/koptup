'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import {
  AcademicCapIcon,
  ArrowPathIcon,
  BanknotesIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
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

export function Banner({ actions }: { actions?: ReactNode }) {
  const t = useTranslations('demoHrms.meta');
  return (
    <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 p-5 sm:p-8 text-white shadow-sm flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
      <div className="min-w-0">
        <span title={t('sampleHint')} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/30 mb-3">
          {t('sampleBadge')}
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-base sm:text-lg text-violet-50/90 mt-2 max-w-3xl">{t('subtitle')}</p>
      </div>
      {actions}
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
          <DevicePhoneMobileIcon className="w-4 h-4" />
          {t('openApp')}
        </button>
        <button type="button" onClick={() => setConfirm(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/20 border border-white/30 text-white">
          <ArrowPathIcon className="w-4 h-4" />
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
  return (
    <nav id="hrms-tabs" aria-label={t('aria')} className="relative overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 scroll-mt-24">
      <div role="tablist" className="flex gap-1.5 sm:gap-2 min-w-max">
        {TABS.map(({ id, icon: Icon }) => {
          const isActive = active === id;
          const n = counts?.[id];
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="hrms-panel"
              onClick={() => onSelect?.(id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg whitespace-nowrap font-medium text-sm transition-all ${
                isActive
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-white dark:bg-secondary-900 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800 border border-secondary-200 dark:border-secondary-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t(id)}
              {n ? (
                <span className={`ml-0.5 min-w-[1.25rem] px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-white/25 text-white' : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'}`}>
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
