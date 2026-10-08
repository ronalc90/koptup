'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ITEM_BY_SKU } from '../lib/catalog';
import { fmtDate, fmtDec, fmtInt, fmtMoney, fmtMoneyShort, fmtMonth, fmtPct, fmtQty } from '../lib/format';
import { useErp } from '../lib/store';
import type { Entry } from '../lib/types';

/** Formateadores ligados al idioma y a la moneda elegida. */
export function useFmt() {
  const { locale, filters } = useErp();
  const cur = filters.currency;
  return {
    locale,
    money: (cop: number) => fmtMoney(cop, cur, locale),
    moneyShort: (cop: number) => fmtMoneyShort(cop, cur, locale),
    /** Siempre en COP (precios unitarios de referencia). */
    cop: (cop: number) => fmtMoney(cop, 'COP', locale),
    date: (iso?: string) => fmtDate(iso, locale),
    month: (iso: string, withYear = false) => fmtMonth(iso, locale, withYear),
    qty: (n: number) => fmtQty(n, locale),
    int: (n: number) => fmtInt(n, locale),
    dec: (n: number, d = 1) => fmtDec(n, d, locale),
    pct: (r: number, d = 1) => fmtPct(r, locale, d),
    item: (sku: string) => {
      const it = ITEM_BY_SKU[sku];
      if (!it) return sku;
      return locale === 'en' ? it.nameEn : it.name;
    },
  };
}

/** Texto de la descripción de un asiento contable. */
export function useEntryDesc() {
  const t = useTranslations('demoErp.entryDesc');
  const { locale } = useErp();
  return (e: Entry) => {
    if ('text' in e.desc) return e.desc.text;
    const params: Record<string, string> = { ...(e.desc.params || {}) };
    if (params.month) params.month = fmtMonth(params.month, locale, true);
    if (params.item && ITEM_BY_SKU[params.item]) params.item = locale === 'en' ? ITEM_BY_SKU[params.item].nameEn : ITEM_BY_SKU[params.item].name;
    return t(e.desc.key as 'sale', params);
  };
}

export function SectionHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-secondary-900 dark:text-white">{title}</h2>
        {subtitle && <p className="text-sm text-secondary-600 dark:text-secondary-400">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

const selectCls =
  'w-full pl-3 pr-8 py-2 text-sm rounded-lg bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

export function SelectField({
  icon,
  label,
  value,
  onChange,
  options,
  className = '',
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  className?: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="block text-[10px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400 mb-1 font-semibold">{label}</span>
      <div className="relative">
        {icon && <span className="hidden sm:block absolute left-3 top-1/2 -translate-y-1/2 text-secondary-500 dark:text-secondary-400 pointer-events-none">{icon}</span>}
        <select value={value} onChange={(e) => onChange(e.target.value)} className={`${selectCls} ${icon ? 'sm:pl-9' : ''}`}>
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="block text-xs font-semibold text-secondary-600 dark:text-secondary-400 mb-1">{children}</span>;
}

export const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

export const plainSelectCls = selectCls;

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  const t = useTranslations('demoErp.common');
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-labelledby={id} className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        className={`bg-white dark:bg-secondary-900 rounded-t-xl sm:rounded-xl shadow-2xl w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'} max-h-[92vh] flex flex-col border border-secondary-200 dark:border-secondary-700 outline-none`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-secondary-200 dark:border-secondary-800">
          <div className="min-w-0">
            <h3 id={id} className="text-lg font-bold text-secondary-900 dark:text-white">
              {title}
            </h3>
            {subtitle && <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400" aria-label={t('close')}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-5 overflow-y-auto">{children}</div>
        {footer && <div className="p-4 sm:p-5 border-t border-secondary-200 dark:border-secondary-800 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/** Muestra los primeros N elementos y un botón para ver más. */
export function usePager<T>(items: T[], size = 12) {
  const [n, setN] = useState(size);
  useEffect(() => setN(size), [items.length, size]);
  return { visible: items.slice(0, n), hasMore: items.length > n, more: () => setN((x) => x + size * 2), total: items.length };
}

export function MoreButton({ pager }: { pager: { hasMore: boolean; more: () => void; total: number; visible: unknown[] } }) {
  const t = useTranslations('demoErp.common');
  if (!pager.hasMore) return null;
  return (
    <button onClick={pager.more} className="mt-3 w-full py-2 text-sm font-medium rounded-lg border border-secondary-200 dark:border-secondary-700 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-950/30">
      {t('showMore', { shown: pager.visible.length, total: pager.total })}
    </button>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-secondary-500 dark:text-secondary-400 py-6 text-center">{children}</p>;
}

export function Note({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'warn' }) {
  const cls =
    tone === 'warn'
      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
      : 'bg-primary-50 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800 text-primary-900 dark:text-primary-200';
  return <div className={`text-xs rounded-lg border p-3 ${cls}`}>{children}</div>;
}

const btnBase = 'inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
export const btn = {
  primary: `${btnBase} bg-primary-600 hover:bg-primary-700 text-white`,
  outline: `${btnBase} border border-secondary-300 dark:border-secondary-600 text-secondary-800 dark:text-secondary-100 hover:bg-secondary-50 dark:hover:bg-secondary-800`,
  danger: `${btnBase} border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40`,
  ghost: `${btnBase} text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-950/40`,
};

export function Th({ children, right, className = '' }: { children?: React.ReactNode; right?: boolean; className?: string }) {
  return <th className={`py-2 pr-3 font-semibold whitespace-nowrap ${right ? 'text-right' : ''} ${className}`}>{children}</th>;
}

export const theadCls = 'text-left text-xs uppercase text-secondary-500 dark:text-secondary-400 border-b border-secondary-200 dark:border-secondary-700';
export const rowCls = 'border-b border-secondary-100 dark:border-secondary-800';

/** Pestañas internas de un módulo. */
export function SubTabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { id: T; label: string }[] }) {
  return (
    <div role="tablist" className="flex gap-1 bg-secondary-100 dark:bg-secondary-800 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
      {tabs.map((tb) => (
        <button
          key={tb.id}
          role="tab"
          aria-selected={value === tb.id}
          onClick={() => onChange(tb.id)}
          className={`px-3 py-1.5 text-xs font-semibold rounded whitespace-nowrap ${value === tb.id ? 'bg-white dark:bg-secondary-700 text-primary-700 dark:text-primary-300 shadow-sm' : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white'}`}
        >
          {tb.label}
        </button>
      ))}
    </div>
  );
}
