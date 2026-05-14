'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDownIcon, ChevronUpIcon, LinkIcon } from '@heroicons/react/24/outline';

const ITEMS = [
  { key: 'github', color: 'bg-slate-900 text-white' },
  { key: 'gitlab', color: 'bg-orange-600 text-white' },
  { key: 'slack', color: 'bg-purple-600 text-white' },
  { key: 'teams', color: 'bg-blue-600 text-white' },
  { key: 'figma', color: 'bg-pink-600 text-white' },
] as const;

export default function IntegrationsPanel() {
  const t = useTranslations('demoProjectsPro.integrations');
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t('panelTitle')}
          </span>
          <span className="text-xs text-slate-500">({ITEMS.length})</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="hidden sm:inline">{open ? t('collapse') : t('expand')}</span>
          {open ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        <div className="px-4 sm:px-6 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ITEMS.map(({ key, color }) => (
            <div
              key={key}
              className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 flex items-center gap-3"
            >
              <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center font-bold text-sm`}>
                {key.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">{t(key)}</p>
                <p className="text-xs text-slate-500 truncate">{t(`${key}Desc`)}</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold flex-shrink-0">
                {t('connected')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
