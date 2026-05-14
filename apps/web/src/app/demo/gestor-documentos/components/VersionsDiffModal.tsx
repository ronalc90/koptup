'use client';

import { useTranslations } from 'next-intl';
import { XMarkIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import useModalClose from '@/hooks/useModalClose';

interface VersionsDiffModalProps {
  open: boolean;
  onClose: () => void;
  documentName?: string;
}

/**
 * Modal full-width con split view diff antes/después.
 */
export default function VersionsDiffModal({ open, onClose, documentName }: VersionsDiffModalProps) {
  const t = useTranslations('demoDocsPro');
  useModalClose(open, onClose);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-x-4 top-10 bottom-10 sm:inset-x-10 max-w-5xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col">
        <header className="border-b border-slate-200 dark:border-slate-800 p-5 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
              <DocumentDuplicateIcon className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-wide">PRO</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('compare.title')}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{documentName ?? t('compare.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('viewer.close')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="p-5 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 font-mono text-xs leading-relaxed">
              <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-2">{t('compare.before')}</div>
              <p className="text-slate-700 dark:text-slate-300">
                Cláusula 4. El plazo del contrato será de{' '}
                <span className="bg-red-200 dark:bg-red-900/50 line-through">12 meses</span>.
              </p>
              <p className="text-slate-700 dark:text-slate-300 mt-2">
                Cláusula 7.{' '}
                <span className="bg-red-200 dark:bg-red-900/50 line-through">
                  Sin penalidad por terminación anticipada.
                </span>
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 font-mono text-xs leading-relaxed">
              <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-2">{t('compare.after')}</div>
              <p className="text-slate-700 dark:text-slate-300">
                Cláusula 4. El plazo del contrato será de{' '}
                <span className="bg-emerald-200 dark:bg-emerald-900/50">24 meses con prórroga automática</span>.
              </p>
              <p className="text-slate-700 dark:text-slate-300 mt-2">
                Cláusula 7.{' '}
                <span className="bg-emerald-200 dark:bg-emerald-900/50">
                  Penalidad del 15% sobre el saldo pendiente.
                </span>
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">{t('compare.summary')}</p>
        </div>
      </div>
    </>
  );
}
