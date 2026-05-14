'use client';

import { useTranslations } from 'next-intl';
import { XMarkIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import useModalClose from '@/hooks/useModalClose';

interface EncryptionSettingsModalProps {
  open: boolean;
  onClose: () => void;
  enabled: boolean;
  onToggle: () => void;
}

/**
 * Modal de configuración Zero-knowledge encryption + BYO-key + flow 4 pasos.
 */
export default function EncryptionSettingsModal({
  open,
  onClose,
  enabled,
  onToggle,
}: EncryptionSettingsModalProps) {
  const t = useTranslations('demoDocsPro');
  useModalClose(open, onClose);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-x-4 top-10 max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 max-h-[85vh] overflow-y-auto">
        <header className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-5 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
              <LockClosedIcon className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-wide">PRO</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('encryption.title')}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('encryption.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('viewer.close')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={onToggle}
              aria-pressed={enabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-slate-700 dark:text-slate-300">{t('encryption.toggle')}</span>
            {enabled && (
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1">
                <LockClosedIcon className="w-3.5 h-3.5" />
                {t('encryption.badge')}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            {(['1', '2', '3', '4'] as const).map((n, i) => (
              <div
                key={n}
                className="relative p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
              >
                <div className="text-xs text-slate-700 dark:text-slate-300">{t(`encryption.flow.${n}`)}</div>
                {i < 3 && (
                  <span className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600">
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
