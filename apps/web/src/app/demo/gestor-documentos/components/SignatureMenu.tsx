'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

type SignLevel = 'simple' | 'advanced' | 'qualified' | 'ley527';

const LEVELS: Array<{ key: SignLevel; color: string }> = [
  { key: 'simple', color: 'from-slate-500 to-slate-700' },
  { key: 'advanced', color: 'from-blue-500 to-indigo-600' },
  { key: 'qualified', color: 'from-purple-500 to-pink-600' },
  { key: 'ley527', color: 'from-amber-500 to-orange-600' },
];

/**
 * Botón "Firmar electrónicamente" con menú de 4 niveles.
 */
export default function SignatureMenu() {
  const t = useTranslations('demoDocsPro');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg px-4 py-3 font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2"
      >
        <CheckIcon className="w-5 h-5" />
        {t('sign.button')}
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-40"
        >
          <p className="px-2 pt-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t('sign.menuTitle')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {LEVELS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setOpen(false)}
                className="text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${s.color}`}
                >
                  {t(`sign.levels.${s.key}.name`)}
                </div>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                  {t(`sign.levels.${s.key}.desc`)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
