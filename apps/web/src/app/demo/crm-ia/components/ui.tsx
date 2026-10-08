'use client';

import { ReactNode, useEffect } from 'react';
import { CheckCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useModalClose } from '@/hooks/useModalClose';

export function Avatar({ text, size = 'md' }: { text: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'w-12 h-12 sm:w-14 sm:h-14 text-base' : size === 'sm' ? 'w-8 h-8 text-[11px]' : 'w-9 h-9 text-xs';
  return (
    <div
      className={`${cls} rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold flex-shrink-0`}
      aria-hidden="true"
    >
      {text}
    </div>
  );
}

/** Aviso discreto de qué es simulado en una sección. */
export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="flex gap-2 text-xs text-secondary-600 dark:text-secondary-400 bg-secondary-50 dark:bg-secondary-900/60 border border-secondary-200 dark:border-secondary-800 rounded-lg px-3 py-2 mb-4">
      <InformationCircleIcon className="h-4 w-4 flex-shrink-0 mt-px" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export function SectionHeader({
  title,
  subtitle,
  aside,
}: {
  title: string;
  subtitle: string;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-lg sm:text-xl font-semibold text-secondary-900 dark:text-white">{title}</h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">{subtitle}</p>
      </div>
      {aside && <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:flex-shrink-0">{aside}</div>}
    </div>
  );
}

export function PlanBadge({ label, hint }: { label: string; hint: string }) {
  return (
    <span
      title={hint}
      className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-300"
    >
      {label}
    </span>
  );
}

export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(onDone, 4000);
    return () => clearTimeout(id);
  }, [message, onDone]);
  return (
    <div aria-live="polite" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[120] w-[calc(100%-2rem)] max-w-md pointer-events-none">
      {message && (
        <div className="pointer-events-auto flex items-start gap-2 rounded-xl bg-secondary-900 text-white dark:bg-white dark:text-secondary-900 px-4 py-3 shadow-xl text-sm animate-fade-in">
          <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-green-400 dark:text-green-600" aria-hidden="true" />
          <span className="flex-1">{message}</span>
        </div>
      )}
    </div>
  );
}

export function Modal({
  title,
  subtitle,
  onClose,
  closeLabel,
  children,
  footer,
  size = 'md',
  labelId,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  closeLabel: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
  labelId: string;
}) {
  useModalClose(true, onClose);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      onClick={onClose}
      className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-2 sm:p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative bg-white dark:bg-secondary-900 rounded-2xl w-full ${size === 'lg' ? 'max-w-4xl' : 'max-w-lg'} max-h-[95vh] overflow-y-auto shadow-2xl`}
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-800 px-4 sm:px-6 py-4 flex items-start justify-between gap-4">
          <div className="min-w-0">{typeof title === 'string' ? (
            <h2 id={labelId} className="text-lg sm:text-xl font-bold text-secondary-900 dark:text-white">{title}</h2>
          ) : (
            <div id={labelId}>{title}</div>
          )}
            {subtitle && <div className="text-sm text-secondary-600 dark:text-secondary-400 mt-0.5">{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors flex-shrink-0"
            aria-label={closeLabel}
          >
            <XMarkIcon className="h-6 w-6 text-secondary-600 dark:text-secondary-300" />
          </button>
        </div>
        <div className="px-4 sm:px-6 py-4">{children}</div>
        {footer && (
          <div className="sticky bottom-0 bg-white dark:bg-secondary-900 border-t border-secondary-200 dark:border-secondary-800 px-4 sm:px-6 py-3 flex flex-wrap justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export const inputCls =
  'w-full px-3 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';
export const labelCls = 'block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1.5';
