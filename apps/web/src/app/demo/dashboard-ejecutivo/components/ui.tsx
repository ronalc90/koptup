'use client';

import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { Severity } from '../lib/engine';
import * as F from '../lib/format';
import type { ISODate, MonthKey, Period } from '../lib/types';
import { useDashboard } from '../lib/store';

export const NS = 'demoBiDashboard';

/** Formatos según el idioma activo (sin Intl: misma salida en servidor y navegador). */
export function useFmt() {
  const locale = useLocale();
  const t = useTranslations(`${NS}.time`);
  return useMemo(() => {
    const loc: F.Loc = locale === 'en' ? 'en' : 'es';
    const names: F.MonthNames = { long: t.raw('monthsLong') as string[], short: t.raw('monthsShort') as string[] };
    return {
      loc,
      names,
      num: (n: number, d = 0) => F.num(n, loc, d),
      money: (n: number) => F.money(n, loc),
      moneyM: (n: number, d?: number) => F.moneyM(n, loc, d),
      pct: (r: number, d = 1) => F.pct(r, loc, d),
      signedPct: (r: number, d = 1) => F.signedPct(r, loc, d),
      signedPts: (r: number) => F.signedPts(r, loc),
      date: (d: ISODate) => F.formatDate(d, loc, names),
      /** Mes en minúscula (para usar dentro de una frase): "sep 2026". */
      month: (m: MonthKey, short = false) => F.formatMonth(m, names, short),
      /** Mes con mayúscula inicial (títulos, filas de tabla): "Sep 2026". */
      monthTitle: (m: MonthKey, short = false) => F.capitalize(F.formatMonth(m, names, short)),
      /** Período para selectores y títulos: "Septiembre 2026". */
      period: (p: Period) => F.periodLabel(p, names, { quarter: t('quarterPrefix'), ytd: t('ytd') }),
      /** Período dentro de una frase: "septiembre de 2026". */
      periodIn: (p: Period) =>
        p.kind === 'month'
          ? t('monthYear', { month: names.long[p.index - 1], year: p.year })
          : F.periodLabel(p, names, { quarter: t('quarterPrefix'), ytd: t('ytd') }),
    };
  }, [locale, t]);
}

export type Fmt = ReturnType<typeof useFmt>;

/** Nombres visibles de líneas, categorías de gasto y dimensión de ciudad/sede. */
export function useLabels() {
  const { dataset } = useDashboard();
  const t = useTranslations(`${NS}.sectors`);
  const sector = dataset.sector;
  const sample = dataset.source === 'sample';
  const line = useCallback((id: string) => (sample ? t(`${sector}.lines.${id}`) : id), [sample, sector, t]);
  const expense = useCallback((id: string) => t(`expenses.${id}`), [t]);
  const cityDim = sample ? t(`${sector}.cityLabel`) : t('upload.cityLabel');
  const cityDimPlural = sample ? t(`${sector}.cityLabelPlural`) : t('upload.cityLabelPlural');
  return { line, expense, cityDim, cityDimPlural };
}

export const card = 'bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800';

export const inputCls =
  'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500';
export const selectCls = `${inputCls} pr-9`;
export const labelCls = 'block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1';

export const btn = {
  primary:
    'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed',
  outline:
    'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed',
  small:
    'inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed',
  ghost: 'inline-flex items-center justify-center p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
  danger: 'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700',
  link: 'text-xs font-semibold text-purple-700 dark:text-purple-300 hover:underline',
};

export function SectionTitle({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Nota discreta que explica de dónde sale una cifra o qué es simulado. */
export function Note({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'amber' }) {
  const cls =
    tone === 'amber'
      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-900'
      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  return <p className={`text-xs rounded-lg border px-3 py-2 ${cls}`}>{children}</p>;
}

const severityStyle: Record<Severity, { icon: typeof ExclamationCircleIcon; cls: string }> = {
  critical: { icon: ExclamationCircleIcon, cls: 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900' },
  warning: { icon: ExclamationTriangleIcon, cls: 'text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900' },
  info: { icon: InformationCircleIcon, cls: 'text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900' },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const t = useTranslations(`${NS}.alerts.severity`);
  const s = severityStyle[severity];
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${s.cls}`}>
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {t(severity)}
    </span>
  );
}

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  size = 'md',
  labelId,
  footer,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  labelId: string;
  footer?: ReactNode;
}) {
  const t = useTranslations(`${NS}.common`);
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    ref.current?.focus();
    // Escape cierra solo el modal de arriba (puede haber una factura abierta sobre un cliente).
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const open = document.querySelectorAll('[data-bi-modal]');
      if (open[open.length - 1] === ref.current) closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, []);
  const width = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-3xl' : size === 'xl' ? 'max-w-5xl' : 'max-w-xl';
  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        data-bi-modal=""
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        className={`relative w-full ${width} max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl outline-none`}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="min-w-0">
            <h2 id={labelId} className="text-lg font-bold text-slate-900 dark:text-white break-words">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className={btn.ghost} aria-label={t('close')}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 flex-1">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Toasts() {
  const { toasts } = useDashboard();
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[220] flex flex-col gap-2 items-stretch sm:items-end" role="status" aria-live="polite">
      {toasts.map((t) => {
        const Icon = t.tone === 'error' ? ExclamationCircleIcon : t.tone === 'info' ? InformationCircleIcon : CheckCircleIcon;
        const cls = t.tone === 'error' ? 'bg-red-600' : t.tone === 'info' ? 'bg-slate-800' : 'bg-emerald-600';
        return (
          <div key={t.id} className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm text-white shadow-xl ${cls} sm:max-w-sm`}>
            <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>{t.text}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Descarga un texto como archivo. */
export function downloadText(content: string, fileName: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Etiqueta de variación con color (verde si es buena, rojo si es mala). */
export function Delta({ value, text, goodWhenUp = true, title }: { value: number | null; text: string; goodWhenUp?: boolean; title?: string }) {
  if (value === null) return <span className="text-xs text-slate-400">—</span>;
  const good = goodWhenUp ? value >= 0 : value <= 0;
  return (
    <span
      title={title}
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
        Math.abs(value) < 0.0005
          ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          : good
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
            : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
      }`}
    >
      {text}
    </span>
  );
}
