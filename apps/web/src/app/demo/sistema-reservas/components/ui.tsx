'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import {
  BoltIcon,
  CheckCircleIcon,
  FaceSmileIcon,
  HandRaisedIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  ScissorsIcon,
  SparklesIcon,
  SunIcon,
  TrophyIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { formatDate, formatStamp, formatTime, type DateStyle } from '../lib/dates';
import { formatCOP, formatDuration } from '../lib/engine';
import type { Business, IconKey, L, Stamp, StaffColor, Status } from '../lib/types';

/* ------------------------------ Formatos ------------------------------ */

export function useFmt() {
  const locale = useLocale();
  const lang: 'es' | 'en' = locale === 'en' ? 'en' : 'es';
  return {
    locale: lang,
    l: (x: L) => x[lang],
    date: (iso: string, style: DateStyle = 'medium') => formatDate(iso, lang, style),
    time: (m: number) => formatTime(m, lang),
    stamp: (s: Stamp) => formatStamp(s, lang),
    money: (n: number) => formatCOP(n, lang),
    duration: (m: number) => formatDuration(m, lang),
    pct: (x: number) => `${Math.round(x * 100)} %`,
  };
}

/** Textos que cambian si el negocio agenda profesionales o canchas. */
export function useKind(biz: Business) {
  const t = useTranslations('demoReservas.kind');
  const k = biz.staffKind;
  return {
    one: t(`${k}.one`),
    many: t(`${k}.many`),
    any: t(`${k}.any`),
    choose: t(`${k}.choose`),
  };
}

/* ------------------------------ Íconos ------------------------------ */

const ICONS: Record<IconKey, ComponentType<{ className?: string }>> = {
  search: MagnifyingGlassIcon,
  sparkles: SparklesIcon,
  sun: SunIcon,
  wrench: WrenchScrewdriverIcon,
  face: FaceSmileIcon,
  hand: HandRaisedIcon,
  heart: HeartIcon,
  scissors: ScissorsIcon,
  trophy: TrophyIcon,
  bolt: BoltIcon,
};

export function ServiceIcon({ icon, className = 'h-6 w-6' }: { icon: IconKey; className?: string }) {
  const Icon = ICONS[icon];
  return <Icon className={className} />;
}

export const STAFF_COLORS: Record<StaffColor, { dot: string; block: string; soft: string }> = {
  sky: {
    dot: 'bg-sky-500',
    block: 'bg-sky-50 border-sky-400 text-sky-900 dark:bg-sky-950/60 dark:border-sky-600 dark:text-sky-100',
    soft: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200',
  },
  violet: {
    dot: 'bg-violet-500',
    block: 'bg-violet-50 border-violet-400 text-violet-900 dark:bg-violet-950/60 dark:border-violet-600 dark:text-violet-100',
    soft: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200',
  },
  emerald: {
    dot: 'bg-emerald-500',
    block: 'bg-emerald-50 border-emerald-400 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-600 dark:text-emerald-100',
    soft: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
  },
  rose: {
    dot: 'bg-rose-500',
    block: 'bg-rose-50 border-rose-400 text-rose-900 dark:bg-rose-950/60 dark:border-rose-600 dark:text-rose-100',
    soft: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200',
  },
};

export const STATUS_STYLE: Record<Status, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  confirmed: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  attended: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  noshow: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  cancelled: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export function StatusBadge({ status }: { status: Status }) {
  const t = useTranslations('demoReservas.status');
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${STATUS_STYLE[status]}`}>{t(status)}</span>;
}

/* ------------------------------ Avisos ------------------------------ */

const ToastCtx = createContext<(msg: string) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; msg: string }[]>([]);
  const seq = useRef(0);
  const notify = useCallback((msg: string) => {
    const id = ++seq.current;
    setItems((xs) => [...xs.slice(-2), { id, msg }]);
    window.setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 4500);
  }, []);
  return (
    <ToastCtx.Provider value={notify}>
      {children}
      <div aria-live="polite" role="status" className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 z-[210] flex flex-col gap-2 sm:max-w-sm pointer-events-none">
        {items.map((x) => (
          <div key={x.id} className="pointer-events-auto flex items-start gap-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 text-sm shadow-xl">
            <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-400 dark:text-emerald-600" />
            <span>{x.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ------------------------------ Modal ------------------------------ */

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
  const t = useTranslations('demoReservas.common');
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const width = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-3xl' : 'max-w-xl';
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
      <div ref={ref} tabIndex={-1} className={`bg-white dark:bg-slate-900 rounded-2xl w-full ${width} my-4 outline-none shadow-xl`}>
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h2 id={labelId} className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {title}
              </h2>
              {subtitle && <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</div>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('close')}
              className="p-2 -m-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
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

/* ------------------------------ Controles ------------------------------ */

export const inputCls =
  'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500';

export const selectCls =
  'w-full text-sm pl-3 pr-9 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500';

export const labelCls = 'block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1';

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

export const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

export const btnSmall =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

export function Field({ label, htmlFor, error, hint, children }: { label: ReactNode; htmlFor: string; error?: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className={labelCls}>
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{hint}</p>}
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Píldoras tipo pestaña (accesibles con aria-pressed). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  size = 'md',
}: {
  value: T;
  options: { id: T; label: ReactNode }[];
  onChange: (v: T) => void;
  label: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap rounded-lg bg-slate-100 dark:bg-slate-800 p-1 gap-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-md ${size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'} font-medium transition-colors ${
            value === o.id ? 'bg-white dark:bg-slate-950 text-orange-700 dark:text-orange-300 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Aviso fijo de simulación. */
export function SimNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
      {children}
    </p>
  );
}
