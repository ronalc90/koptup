'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { TierKey } from './data';
import { dec, money, moneyM, num, signed } from './engine';

export const TIER_THEME: Record<TierKey, { from: string; to: string; ring: string; text: string; dot: string; hex: string }> = {
  classic: { from: 'from-emerald-600', to: 'to-teal-800', ring: 'ring-emerald-400', text: 'text-emerald-50', dot: 'bg-emerald-600', hex: '#059669' },
  silver: { from: 'from-slate-500', to: 'to-slate-700', ring: 'ring-slate-300', text: 'text-slate-100', dot: 'bg-slate-500', hex: '#64748b' },
  gold: { from: 'from-amber-500', to: 'to-amber-700', ring: 'ring-amber-300', text: 'text-amber-50', dot: 'bg-amber-500', hex: '#f59e0b' },
  diamond: { from: 'from-cyan-500', to: 'to-indigo-700', ring: 'ring-cyan-200', text: 'text-cyan-50', dot: 'bg-cyan-500', hex: '#06b6d4' },
};

/** Formatos fijos (mismo resultado en servidor y navegador). */
export function useFmt() {
  const locale = useLocale();
  const t = useTranslations('demoLoyalty');
  const date = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return t('fmt.date', { d, m: t(`months.${m}`), y });
  };
  return {
    locale,
    num: (n: number) => num(n, locale),
    money: (n: number) => money(n, locale),
    moneyM: (n: number) => moneyM(n, locale),
    dec: (n: number) => dec(n, locale),
    signed: (n: number) => signed(n, locale),
    date,
    weekday: (n: number) => t(`weekdays.${n}`),
    weekdayPlural: (n: number) => t(`weekdaysPlural.${n}`),
    dayLabel: (iso: string, weekday: number) => `${t(`weekdays.${weekday}`)} · ${date(iso)}`,
  };
}

/* --------------------------------- Avisos --------------------------------- */

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
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={notify}>
      {children}
      <div aria-live="polite" role="status" className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 z-[210] flex flex-col gap-2 sm:max-w-sm pointer-events-none">
        {items.map((x) => (
          <div
            key={x.id}
            className="pointer-events-auto flex items-start gap-2 rounded-xl bg-secondary-900 text-white dark:bg-white dark:text-secondary-900 px-4 py-3 text-sm shadow-xl"
          >
            <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-400 dark:text-emerald-600" />
            <span>{x.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* --------------------------------- Modal --------------------------------- */

/** Modal accesible montado en <body>: cierra con Escape o clic afuera. */
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
  const t = useTranslations('demoLoyalty');
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
              aria-label={t('common.close')}
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

/* ------------------------------- Controles ------------------------------- */

export const inputCls =
  'w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

export const selectCls =
  'w-full text-sm pl-3 pr-9 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-800 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500';

export const labelCls = 'block text-xs font-medium text-secondary-600 dark:text-secondary-300 mb-1';

export function Field({ label, htmlFor, error, hint, children }: { label: ReactNode; htmlFor: string; error?: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className={labelCls}>
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-[11px] text-secondary-500 dark:text-secondary-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

/** Interruptor accesible. */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-primary-600' : 'bg-secondary-300 dark:bg-secondary-700'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export function KpiBox({
  label,
  value,
  sub,
  tone,
  icon: Icon,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'success' | 'danger' | 'warning';
  icon?: ComponentType<{ className?: string }>;
}) {
  const toneCls = tone === 'success' ? 'text-green-600 dark:text-green-400' : tone === 'danger' ? 'text-red-600 dark:text-red-400' : tone === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-secondary-900 dark:text-white';
  return (
    <div className="rounded-lg border border-secondary-200 dark:border-secondary-800 p-3 bg-white dark:bg-secondary-900 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-secondary-500 dark:text-secondary-400">{label}</p>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-secondary-400" />}
      </div>
      <p className={`text-xl font-bold mt-1 truncate ${toneCls}`}>{value}</p>
      {sub && <p className="text-[11px] mt-1 text-secondary-500 dark:text-secondary-400">{sub}</p>}
    </div>
  );
}

/** Rótulo pequeño "ejemplo" para cifras que no salen de lo que haces en la demo. */
export function SampleTag() {
  const t = useTranslations('demoLoyalty');
  return (
    <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200 whitespace-nowrap">
      {t('common.sample')}
    </span>
  );
}

export function SectionTitle({ icon: Icon, title, subtitle, right }: { icon?: ComponentType<{ className?: string }>; title: ReactNode; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div className="min-w-0">
        <h3 className="font-bold text-secondary-900 dark:text-white flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 shrink-0" />} {title}
        </h3>
        {subtitle && <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0 flex flex-wrap gap-2">{right}</div>}
    </div>
  );
}
