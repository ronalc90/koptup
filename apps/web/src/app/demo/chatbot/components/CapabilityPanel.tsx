'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { IncludedKey } from './data';

interface CapabilityPanelProps {
  itemKey: IncludedKey | null;
  onClose: () => void;
}

/** Detalle de una capacidad de "Qué incluye hoy" (solo lo que existe en el código). */
export default function CapabilityPanel({ itemKey, onClose }: CapabilityPanelProps) {
  const t = useTranslations('demoChatbot.included');

  useEffect(() => {
    if (!itemKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [itemKey, onClose]);

  if (!itemKey) return null;

  const raw = t.raw(`items.${itemKey}.items`);
  const items: string[] = Array.isArray(raw) ? (raw as string[]) : [];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`included-${itemKey}-title`}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-2xl dark:border-secondary-700 dark:bg-secondary-900"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-secondary-200 px-6 py-5 dark:border-secondary-800">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-300">
              {t('title')}
            </p>
            <h2
              id={`included-${itemKey}-title`}
              className="mt-1 text-xl font-bold leading-tight tracking-tight text-secondary-900 dark:text-white"
            >
              {t(`items.${itemKey}.title`)}
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-secondary-600 dark:text-secondary-400">
              {t(`items.${itemKey}.summary`)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="rounded-md p-1.5 text-secondary-500 transition hover:bg-secondary-100 hover:text-secondary-900 dark:hover:bg-secondary-800 dark:hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>

        <ul className="max-h-[60vh] space-y-2 overflow-y-auto px-6 py-5">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 rounded-lg border border-secondary-100 bg-secondary-50/70 px-3.5 py-2.5 text-[13px] leading-relaxed text-secondary-700 dark:border-secondary-800 dark:bg-secondary-800/40 dark:text-secondary-200"
            >
              <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
