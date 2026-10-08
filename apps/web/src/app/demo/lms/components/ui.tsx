'use client';

import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocale } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatDate, type DateStyle, type ISODate } from '../lib/dates';
import type { Locale } from '../lib/types';

/** Formatos de dinero (COP), números y fechas según el idioma activo. */
export function useFmt() {
  const locale = (useLocale() === 'en' ? 'en' : 'es') as Locale;
  return useMemo(() => {
    const tag = locale === 'en' ? 'en-US' : 'es-CO';
    const money = new Intl.NumberFormat(tag, { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
    const int = new Intl.NumberFormat(tag, { maximumFractionDigits: 0 });
    const dec = new Intl.NumberFormat(tag, { maximumFractionDigits: 1 });
    return {
      locale,
      money: (n: number) => money.format(Math.round(n)),
      int: (n: number) => int.format(n),
      dec: (n: number) => dec.format(n),
      pct: (n: number) => (locale === 'en' ? `${int.format(n)}%` : `${int.format(n)} %`),
      date: (d: ISODate, style?: DateStyle) => formatDate(d, locale, style),
    };
  }, [locale]);
}

export const inputCls =
  'w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500';

/** Igual que inputCls, con espacio para la flecha del select. */
export const selectCls = inputCls.replace('px-3', 'pl-3 pr-9');

export const labelCls = 'block text-xs font-semibold text-secondary-600 dark:text-secondary-300 mb-1';

export const btn = {
  primary:
    'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed',
  outline:
    'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-secondary-300 dark:border-secondary-600 text-secondary-800 dark:text-secondary-100 bg-white dark:bg-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed',
  small:
    'inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md text-xs font-medium border border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-200 bg-white dark:bg-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed',
  ghost:
    'inline-flex items-center justify-center gap-1 p-1.5 rounded-md text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800 disabled:opacity-50',
};

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  labelledBy,
  closeLabel,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  size?: 'md' | 'lg' | 'xl';
  labelledBy?: string;
  closeLabel: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open || typeof document === 'undefined') return null;
  const width = size === 'xl' ? 'max-w-4xl' : size === 'lg' ? 'max-w-3xl' : 'max-w-lg';
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={panel}
        tabIndex={-1}
        className={`relative bg-white dark:bg-secondary-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full ${width} max-h-[92vh] overflow-y-auto focus:outline-none`}
        onClick={(e) => e.stopPropagation()}
      >
        {title !== undefined && (
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 border-b border-secondary-200 dark:border-secondary-800 bg-white/95 dark:bg-secondary-900/95 backdrop-blur">
            <h2 id={labelledBy} className="text-base font-bold text-secondary-900 dark:text-white min-w-0">
              {title}
            </h2>
            <button type="button" onClick={onClose} className={btn.ghost} aria-label={closeLabel}>
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function SectionTitle({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-3">
      <div className="min-w-0">
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">{title}</h2>
        {subtitle && <p className="text-sm text-secondary-500 dark:text-secondary-400">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2 flex-wrap">{action}</div>}
    </div>
  );
}

/** Aviso de simulación: qué hace la demo y qué se conecta en el proyecto real. */
export function SimNote({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] leading-snug text-secondary-500 dark:text-secondary-400 bg-secondary-50 dark:bg-secondary-800/50 border border-dashed border-secondary-300 dark:border-secondary-700 rounded-lg px-3 py-2">
      {children}
    </p>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="text-center text-sm text-secondary-500 dark:text-secondary-400 py-10">{children}</div>;
}
