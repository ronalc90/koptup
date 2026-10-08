'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useModalClose } from '@/hooks/useModalClose';
import type { DateNames } from './logic';
import type { AuditEntry, Locale, Priority } from './types';

export function useLoc(): Locale {
  return useLocale() === 'en' ? 'en' : 'es';
}

export function useDateNames(): DateNames {
  const t = useTranslations('demoTelemed');
  return { months: t('dates.months').split(','), weekdays: t('dates.weekdays').split(',') };
}

/** Texto de una entrada de auditoría en el idioma activo. */
export function useAuditText() {
  const t = useTranslations('demoTelemed');
  return useCallback(
    (e: AuditEntry) => {
      const params: Record<string, string> = {};
      Object.entries(e.params ?? {}).forEach(([k, v]) => {
        params[k] = typeof v === 'string' ? v : t(v.t);
      });
      return { actor: t(`audit.actors.${e.actor}`), text: t(`audit.events.${e.key}`, params) };
    },
    [t],
  );
}

export const PRIORITY_STYLES: Record<Priority, { dot: string; chip: string; ring: string }> = {
  red: { dot: 'bg-red-500', chip: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200', ring: 'ring-red-500' },
  yellow: { dot: 'bg-amber-400', chip: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200', ring: 'ring-amber-400' },
  green: { dot: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200', ring: 'ring-emerald-500' },
};

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const t = useTranslations('demoTelemed');
  useModalClose(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex h-full items-center justify-center">
        <div
          className={`relative w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-full overflow-y-auto rounded-2xl bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 shadow-2xl`}
        >
          <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-secondary-200 dark:border-secondary-700 bg-white/95 dark:bg-secondary-900/95 px-5 py-3">
            <h2 className="text-base font-semibold text-secondary-900 dark:text-white">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="rounded-md p-1.5 text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="px-5 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** Aviso breve en la esquina (acciones simuladas, descargas, errores de permiso). */
export function useToast() {
  const [toast, setToast] = useState<{ id: number; text: string; tone: 'ok' | 'warn' } | null>(null);
  const timer = useRef<number | null>(null);
  const show = useCallback((text: string, tone: 'ok' | 'warn' = 'ok') => {
    if (timer.current) window.clearTimeout(timer.current);
    setToast({ id: Date.now(), text, tone });
    timer.current = window.setTimeout(() => setToast(null), 4200);
  }, []);
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );
  const node = (
    <div aria-live="polite" className="fixed bottom-4 left-4 right-4 sm:left-auto z-[120] flex justify-end pointer-events-none">
      {toast && (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto max-w-md rounded-lg border px-4 py-2.5 text-sm shadow-xl ${
            toast.tone === 'ok'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100'
              : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100'
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
  return { show, node };
}

export function SimTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-200 whitespace-nowrap">
      {children}
    </span>
  );
}
