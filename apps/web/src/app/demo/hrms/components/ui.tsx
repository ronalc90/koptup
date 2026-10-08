'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatDate, type ISODate } from '../lib/dates';
import type { PositionId } from '../lib/types';

/** Formatos de dinero, números y fechas según el idioma activo (COP siempre). */
export function useFmt() {
  const locale = useLocale();
  return useMemo(() => {
    const tag = locale === 'en' ? 'en-US' : 'es-CO';
    const money = new Intl.NumberFormat(tag, { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
    const num = new Intl.NumberFormat(tag, { maximumFractionDigits: 1 });
    const int = new Intl.NumberFormat(tag, { maximumFractionDigits: 0 });
    return {
      locale,
      money: (n: number) => money.format(Math.round(n)),
      moneyShort: (n: number) => (locale === 'en' ? `COP ${num.format(n / 1e6)}M` : `$ ${num.format(n / 1e6)} M`),
      num: (n: number) => num.format(n),
      int: (n: number) => int.format(n),
      pct: (n: number) => `${num.format(n)} %`,
      date: (d: ISODate, style?: Parameters<typeof formatDate>[2]) => formatDate(d, locale, style),
    };
  }, [locale]);
}

/** Cargo con el género gramatical de la persona (o la forma genérica si no se conoce). */
export function usePos() {
  const t = useTranslations('demoHrms');
  return useCallback(
    (x: { positionId: PositionId; gender?: 'F' | 'M' }) =>
      t(`${x.gender === 'F' ? 'positionsF' : x.gender === 'M' ? 'positionsM' : 'positions'}.${x.positionId}`),
    [t],
  );
}

export const inputCls =
  'w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500';

export const labelCls = 'block text-xs font-semibold text-secondary-600 dark:text-secondary-300 mb-1';

export const btn = {
  primary:
    'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed',
  outline:
    'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-secondary-300 dark:border-secondary-600 text-secondary-800 dark:text-secondary-100 bg-white dark:bg-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed',
  small:
    'inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md text-xs font-medium border border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-200 bg-white dark:bg-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed',
  link: 'text-xs font-semibold text-violet-700 dark:text-violet-300 hover:underline disabled:opacity-50',
  approve: 'flex-1 px-2 py-1.5 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 hover:bg-emerald-200',
  reject: 'flex-1 px-2 py-1.5 text-xs font-semibold rounded-md bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 hover:bg-red-200',
};

export function SectionTitle({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h3 className="font-bold text-secondary-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function TabIntro({ title, subtitle }: { title: ReactNode; subtitle: ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-secondary-900 dark:text-white">{title}</h2>
      <p className="text-secondary-600 dark:text-secondary-400 text-sm">{subtitle}</p>
    </div>
  );
}

export function Stat({ label, value, sub, icon, onClick }: { label: ReactNode; value: ReactNode; sub?: ReactNode; icon?: ReactNode; onClick?: () => void }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-secondary-600 dark:text-secondary-300">{label}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-2 truncate">{value}</p>
      {sub && <p className="text-[11px] text-secondary-500 dark:text-secondary-400 mt-0.5">{sub}</p>}
    </>
  );
  const cls = 'text-left rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 p-4 min-w-0';
  return onClick ? (
    <button type="button" onClick={onClick} className={`${cls} hover:border-violet-400 dark:hover:border-violet-500 transition-colors`}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function Initials({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const parts = name.split(' ');
  const ini = `${parts[0][0]}${(parts[parts.length - 2] ?? parts[1] ?? ' ')[0]}`.toUpperCase();
  const colors = ['from-rose-400 to-pink-500', 'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-500', 'from-sky-400 to-blue-500', 'from-violet-400 to-purple-500', 'from-fuchsia-400 to-pink-500'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  const cls = size === 'sm' ? 'w-8 h-8 text-[11px]' : size === 'lg' ? 'w-14 h-14 text-lg' : 'w-11 h-11 text-sm';
  return (
    <div className={`${cls} shrink-0 rounded-full bg-gradient-to-br ${colors[Math.abs(h) % colors.length]} text-white flex items-center justify-center font-bold`} aria-hidden="true">
      {ini}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-secondary-500 dark:text-secondary-400 py-6 text-center">{children}</p>;
}

export function Progress({ value, tone = 'violet' }: { value: number; tone?: 'violet' | 'red' | 'emerald' }) {
  const bar = tone === 'red' ? 'bg-red-500' : tone === 'emerald' ? 'bg-emerald-500' : 'bg-violet-600';
  return (
    <div className="h-2 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

/** Paginación simple en el cliente. */
export function usePager<T>(items: T[], size: number) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(page, pages);
  return {
    page: current,
    pages,
    setPage,
    visible: items.slice((current - 1) * size, current * size),
    total: items.length,
  };
}

export function Pager({ pager }: { pager: ReturnType<typeof usePager> }) {
  const t = useTranslations('demoHrms.common');
  if (pager.pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 pt-3 text-sm">
      <span className="text-secondary-500 dark:text-secondary-400">{t('pageOf', { page: pager.page, pages: pager.pages })}</span>
      <div className="flex gap-2">
        <button type="button" className={btn.small} disabled={pager.page <= 1} onClick={() => pager.setPage(pager.page - 1)}>
          {t('previous')}
        </button>
        <button type="button" className={btn.small} disabled={pager.page >= pager.pages} onClick={() => pager.setPage(pager.page + 1)}>
          {t('next')}
        </button>
      </div>
    </div>
  );
}

/** Modal accesible montado en <body>: cierra con Escape o clic fuera y enfoca el diálogo. */
export function Modal({
  title,
  subtitle,
  onClose,
  children,
  size = 'md',
  labelId,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  labelId: string;
}) {
  const t = useTranslations('demoHrms.common');
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const width = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      className="fixed inset-0 bg-black/60 z-[200] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={ref} tabIndex={-1} className={`bg-white dark:bg-secondary-900 rounded-2xl w-full ${width} my-4 outline-none shadow-xl`}>
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h2 id={labelId} className="text-lg sm:text-xl font-bold text-secondary-900 dark:text-white">
                {title}
              </h2>
              {subtitle && <p className="text-xs sm:text-sm text-secondary-500 dark:text-secondary-400 mt-0.5">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('close')}
              className="p-2 -m-1 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg text-secondary-600 dark:text-secondary-300"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function Field({ label, htmlFor, children, hint }: { label: ReactNode; htmlFor: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelCls}>
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-secondary-500 dark:text-secondary-400 mt-1">{hint}</p>}
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] leading-relaxed text-secondary-500 dark:text-secondary-400 border-l-2 border-violet-300 dark:border-violet-700 pl-2">{children}</p>
  );
}
