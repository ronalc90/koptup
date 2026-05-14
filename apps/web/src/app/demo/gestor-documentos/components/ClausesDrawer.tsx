'use client';

import { useTranslations } from 'next-intl';
import { XMarkIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import useModalClose from '@/hooks/useModalClose';

interface ClausesDrawerProps {
  open: boolean;
  onClose: () => void;
  documentName?: string;
}

type Risk = 'low' | 'medium' | 'high';
type ClauseKey = 'confidentiality' | 'payment' | 'indemnity' | 'termination';

/**
 * Drawer lateral con cláusulas detectadas + riesgo color-coded.
 */
export default function ClausesDrawer({ open, onClose, documentName }: ClausesDrawerProps) {
  const t = useTranslations('demoDocsPro');
  useModalClose(open, onClose);

  const items: Array<{ key: ClauseKey; risk: Risk }> = [
    { key: 'confidentiality', risk: 'low' },
    { key: 'payment', risk: 'medium' },
    { key: 'indemnity', risk: 'high' },
    { key: 'termination', risk: 'medium' },
  ];
  const color = (r: Risk) =>
    ({
      low: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-300 dark:border-green-800',
      medium: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      high: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800',
    }[r]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <aside
        role="dialog"
        aria-label={t('clauses.title')}
        className="fixed right-0 top-0 bottom-0 w-full max-w-[95vw] sm:max-w-[560px] bg-white dark:bg-slate-900 z-50 shadow-2xl overflow-y-auto"
      >
        <header className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
              <ShieldCheckIcon className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-wide">PRO</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('clauses.title')}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{documentName ?? t('clauses.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('viewer.close')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="p-6">
          <div className="text-xs text-slate-500 mb-3 font-mono">{t('clauses.doc')}</div>
          <ul className="space-y-2">
            {items.map((c) => (
              <li
                key={c.key}
                className={`p-3 rounded-lg border ${color(c.risk)} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{t(`clauses.items.${c.key}.name`)}</div>
                  <div className="text-xs opacity-80">{t(`clauses.items.${c.key}.snippet`)}</div>
                </div>
                <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-white/60 dark:bg-black/30 font-semibold uppercase">
                  {t(`clauses.risk.${c.risk}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
}
