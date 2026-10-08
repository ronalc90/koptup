'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import {
  AcademicCapIcon,
  ArrowPathIcon,
  BanknotesIcon,
  ChartBarIcon,
  DocumentCheckIcon,
  PencilSquareIcon,
  PlayCircleIcon,
  ReceiptPercentIcon,
  ShieldCheckIcon,
  TrophyIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { ACADEMY } from '../lib/catalog';
import { useLms } from '../lib/store';
import type { Role } from '../lib/types';
import { Modal, btn } from './ui';

export type Section =
  | 'catalog'
  | 'learning'
  | 'live'
  | 'gamification'
  | 'certificates'
  | 'analytics'
  | 'authoring'
  | 'sales'
  | 'coupons'
  | 'issued';

export const DEFAULT_SECTION: Record<Role, Section> = { student: 'catalog', instructor: 'analytics', admin: 'sales' };

const NAV: Record<Role, { key: Section; icon: typeof AcademicCapIcon }[]> = {
  student: [
    { key: 'catalog', icon: AcademicCapIcon },
    { key: 'learning', icon: PlayCircleIcon },
    { key: 'live', icon: VideoCameraIcon },
    { key: 'gamification', icon: TrophyIcon },
    { key: 'certificates', icon: ShieldCheckIcon },
  ],
  instructor: [
    { key: 'analytics', icon: ChartBarIcon },
    { key: 'authoring', icon: PencilSquareIcon },
  ],
  admin: [
    { key: 'sales', icon: BanknotesIcon },
    { key: 'coupons', icon: ReceiptPercentIcon },
    { key: 'issued', icon: DocumentCheckIcon },
  ],
};

const ROLES: Role[] = ['student', 'instructor', 'admin'];

export default function Header({
  role,
  onRole,
  section,
  onSection,
}: {
  role: Role;
  onRole: (r: Role) => void;
  section: Section;
  onSection: (s: Section) => void;
}) {
  const t = useTranslations('demoLms');
  const { state, reset } = useLms();
  const [confirm, setConfirm] = useState(false);

  return (
    <header className="relative md:sticky md:top-20 z-30 backdrop-blur-md bg-white/80 dark:bg-secondary-900/80 border-b border-secondary-200 dark:border-secondary-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-cyan-800 flex items-center justify-center shadow-md shrink-0">
            <AcademicCapIcon className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold tracking-tight text-secondary-900 dark:text-white leading-tight">{ACADEMY.name}</h1>
              <span
                title={t('header.sampleHint')}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border border-amber-200 dark:border-amber-800"
              >
                {t('header.sampleBadge')}
              </span>
            </div>
            <p className="text-xs text-secondary-500 dark:text-secondary-400 leading-tight">{t('header.subtitle')}</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary-100 dark:bg-secondary-800" role="tablist" aria-label={t('header.roleLabel')}>
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={role === r}
                onClick={() => onRole(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  role === r
                    ? 'bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white shadow-sm'
                    : 'text-secondary-600 dark:text-secondary-300 hover:text-secondary-900 dark:hover:text-white'
                }`}
              >
                {t(`header.role.${r}`)}
              </button>
            ))}
          </div>
          <button type="button" className={btn.small} onClick={() => setConfirm(true)} disabled={!state} title={t('header.resetHint')}>
            <ArrowPathIcon className="w-3.5 h-3.5" />
            {t('header.reset')}
          </button>
        </div>
      </div>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 pb-3 flex gap-1 overflow-x-auto" aria-label={t('header.navLabel')}>
        {NAV[role].map((n) => (
          <button
            key={n.key}
            type="button"
            aria-current={section === n.key ? 'page' : undefined}
            onClick={() => onSection(n.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              section === n.key
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'
            }`}
          >
            <n.icon className="w-4 h-4" />
            {t(`nav.${n.key}`)}
          </button>
        ))}
      </nav>

      <Modal open={confirm} onClose={() => setConfirm(false)} title={t('header.resetTitle')} labelledBy="lms-reset-title" closeLabel={t('common.close')}>
        <div className="p-5 space-y-4">
          <p className="text-sm text-secondary-600 dark:text-secondary-300">{t('header.resetBody')}</p>
          <div className="flex justify-end gap-2">
            <button type="button" className={btn.outline} onClick={() => setConfirm(false)}>
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className={btn.primary}
              onClick={() => {
                reset();
                setConfirm(false);
                onRole('student');
                toast.success(t('header.resetDone'));
              }}
            >
              {t('header.resetConfirm')}
            </button>
          </div>
        </div>
      </Modal>
    </header>
  );
}
