'use client';

import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';
import useModalClose from '@/hooks/useModalClose';
import { formatDate, formatDateTime, type DateStyle } from '../lib/dates';
import type { HealthLevel } from '../lib/engine';
import type { ISODate, ISODateTime, Priority, SectorId, StatusId } from '../lib/types';

/** Formatos de dinero (COP), números y fechas según el idioma activo. */
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
      hours: (n: number) => `${num.format(n)} h`,
      date: (d: ISODate, style?: DateStyle) => formatDate(d, locale, style),
      dateTime: (d: ISODateTime) => formatDateTime(d, locale),
    };
  }, [locale]);
}

/** Nombre visible de un estado del tablero según el sector. */
export function useStatusLabel() {
  const t = useTranslations('demoProjectsPro.status');
  return useCallback((sector: SectorId, s: StatusId) => t(`${sector}.${s}`), [t]);
}

export const inputCls =
  'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500';

/** Los <select> necesitan espacio a la derecha para la flecha (plugin de formularios de Tailwind). */
export const selectCls = `${inputCls} pr-9`;

export const labelCls = 'block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1';

export const btn = {
  primary:
    'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed',
  outline:
    'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed',
  small:
    'inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md text-xs font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed',
  ghost: 'inline-flex items-center justify-center gap-1.5 p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
  danger:
    'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed',
  link: 'text-xs font-semibold text-teal-700 dark:text-teal-300 hover:underline disabled:opacity-50',
};

/** Primera letra en mayúscula ("octubre de 2026" → "Octubre de 2026"). */
export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const card = 'rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';

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
  const t = useTranslations('demoProjectsPro.common');
  useModalClose(true, onClose);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  const width = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-3xl' : size === 'xl' ? 'max-w-5xl' : 'max-w-xl';
  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
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

export function Initials({ name, size = 'md', title }: { name: string; size?: 'xs' | 'sm' | 'md'; title?: string }) {
  const parts = name.trim().split(/\s+/);
  const ini = `${parts[0]?.[0] ?? '?'}${parts.length > 1 ? parts[parts.length - 1][0] : ''}`.toUpperCase();
  const colors = ['from-rose-400 to-pink-500', 'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-500', 'from-sky-400 to-blue-500', 'from-violet-400 to-purple-500', 'from-teal-400 to-cyan-500'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  const cls = size === 'xs' ? 'w-6 h-6 text-[10px]' : size === 'sm' ? 'w-7 h-7 text-[11px]' : 'w-9 h-9 text-sm';
  return (
    <span
      title={title ?? name}
      className={`${cls} shrink-0 rounded-full bg-gradient-to-br ${colors[Math.abs(h) % colors.length]} text-white inline-flex items-center justify-center font-bold`}
    >
      {ini}
    </span>
  );
}

export function Bar({ value, tone = 'teal', className = '' }: { value: number; tone?: 'teal' | 'red' | 'amber' | 'emerald' | 'slate'; className?: string }) {
  const color = { teal: 'bg-teal-600', red: 'bg-red-500', amber: 'bg-amber-500', emerald: 'bg-emerald-500', slate: 'bg-slate-400' }[tone];
  return (
    <div className={`h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden ${className}`}>
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

const HEALTH_CLS: Record<HealthLevel, string> = {
  ok: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  risk: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  late: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};
const HEALTH_DOT: Record<HealthLevel, string> = { ok: 'bg-emerald-500', risk: 'bg-amber-500', late: 'bg-red-500' };

export function HealthBadge({ level }: { level: HealthLevel }) {
  const t = useTranslations('demoProjectsPro.health');
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${HEALTH_CLS[level]}`}>
      <span className={`w-2 h-2 rounded-full ${HEALTH_DOT[level]}`} aria-hidden="true" />
      {t(level)}
    </span>
  );
}

export function HealthDot({ level }: { level: HealthLevel }) {
  const t = useTranslations('demoProjectsPro.health');
  return <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${HEALTH_DOT[level]}`} title={t(level)} aria-label={t(level)} role="img" />;
}

const PRIORITY_CLS: Record<Priority, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};

export function PriorityChip({ p }: { p: Priority }) {
  const t = useTranslations('demoProjectsPro.priority');
  return <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${PRIORITY_CLS[p]}`}>{t(p)}</span>;
}

export const STATUS_DOT: Record<StatusId, string> = {
  todo: 'bg-slate-400',
  doing: 'bg-sky-500',
  review: 'bg-amber-500',
  client: 'bg-violet-500',
  done: 'bg-emerald-500',
};

export const STATUS_BAR: Record<StatusId, string> = {
  todo: 'bg-slate-400',
  doing: 'bg-sky-500',
  review: 'bg-amber-500',
  client: 'bg-violet-500',
  done: 'bg-emerald-500',
};

export function SectionTitle({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
      <div className="min-w-0">
        <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">{children}</p>;
}

export function Stat({ label, value, sub, tone }: { label: ReactNode; value: ReactNode; sub?: ReactNode; tone?: 'red' | 'amber' | 'emerald' }) {
  const color = tone === 'red' ? 'text-red-600 dark:text-red-400' : tone === 'amber' ? 'text-amber-600 dark:text-amber-400' : tone === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white';
  return (
    <div className={`${card} p-4 min-w-0`}>
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</p>
      <p className={`text-2xl font-bold mt-1 truncate ${color}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export function Toggle({ checked, onChange, label, description, id }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode; id: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-slate-800 dark:text-slate-100 cursor-pointer">
          {label}
        </label>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-600'}`}
      >
        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}
