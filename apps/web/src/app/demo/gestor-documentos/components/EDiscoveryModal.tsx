'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon, ScaleIcon } from '@heroicons/react/24/outline';
import useModalClose from '@/hooks/useModalClose';

interface EDiscoveryModalProps {
  open: boolean;
  onClose: () => void;
}

type FieldKey = 'keywords' | 'custodian' | 'dateFrom' | 'dateTo';

/**
 * Modal large con formulario de búsqueda compleja para E-discovery.
 */
export default function EDiscoveryModal({ open, onClose }: EDiscoveryModalProps) {
  const t = useTranslations('demoDocsPro');
  const [ready, setReady] = useState(false);
  useModalClose(open, onClose);

  const fields: Array<{ k: FieldKey; type: string; def: string }> = [
    { k: 'keywords', type: 'text', def: 'fraud OR breach OR penalty' },
    { k: 'custodian', type: 'text', def: 'ronald@koptup.com' },
    { k: 'dateFrom', type: 'date', def: '2025-01-01' },
    { k: 'dateTo', type: 'date', def: '2026-05-14' },
  ];

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-x-4 top-10 max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 max-h-[85vh] overflow-y-auto">
        <header className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-5 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
              <ScaleIcon className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-wide">PRO</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('ediscovery.title')}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('ediscovery.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('viewer.close')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fields.map((f) => (
              <label key={f.k} className="text-sm">
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-1">
                  {t(`ediscovery.${f.k}`)}
                </span>
                <input
                  type={f.type}
                  defaultValue={f.def}
                  className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>
            ))}
            <label className="text-sm md:col-span-2">
              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-1">
                {t('ediscovery.format')}
              </span>
              <select className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <option>EDRM XML</option>
                <option>Concordance Load File</option>
                <option>PST + Metadata</option>
              </select>
            </label>
          </div>

          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <button
              onClick={() => {
                setReady(false);
                setTimeout(() => setReady(true), 400);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg"
            >
              {t('ediscovery.generate')}
            </button>
            {ready && (
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                {t('ediscovery.ready')}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
