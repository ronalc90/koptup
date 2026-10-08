'use client';

import { useEffect, useRef, type ComponentType, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import type { Product } from '../lib/types';
import { useWms } from '../lib/store';

export function useT() {
  return useTranslations('demoWms');
}

/** Nombre visible de un producto: los de ejemplo se traducen, los importados usan su nombre. */
export function useProductName() {
  const t = useT();
  const { state } = useWms();
  return (sku: string) => {
    const p = state.products.find((x) => x.sku === sku);
    if (p?.name) return p.name;
    return t.has(`data.products.${sku}`) ? t(`data.products.${sku}`) : sku;
  };
}

export function productLabel(p: Product | undefined, name: (sku: string) => string) {
  return p ? name(p.sku) : '';
}

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className = '',
  id,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`min-w-0 rounded-2xl border border-secondary-200 bg-white p-4 shadow-sm sm:p-5 dark:border-secondary-700 dark:bg-secondary-900 ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-secondary-900 dark:text-white">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export function Kpi({
  label,
  value,
  hint,
  tone = 'text-secondary-900 dark:text-white',
  onClick,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: string;
  onClick?: () => void;
  icon?: ComponentType<{ className?: string }>;
}) {
  const body = (
    <>
      <div className="flex items-center gap-1.5 text-xs text-secondary-500 dark:text-secondary-400">
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        <span className="leading-tight">{label}</span>
      </div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${tone}`}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-secondary-500 dark:text-secondary-400">{hint}</div>}
    </>
  );
  const cls = 'min-w-0 rounded-xl border border-secondary-200 bg-secondary-50 p-3 text-left dark:border-secondary-700 dark:bg-secondary-800/60';
  if (!onClick) return <div className={cls}>{body}</div>;
  return (
    <button type="button" onClick={onClick} className={`${cls} transition hover:border-stone-400 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-500`}>
      {body}
    </button>
  );
}

export type Tone = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

export function Pill({ tone = 'default', children, className = '' }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <Badge variant={tone} size="sm" className={`whitespace-nowrap ${className}`}>
      {children}
    </Badge>
  );
}

/** Nota discreta para aclarar qué es simulado en la demo. */
export function SimNote({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`flex items-start gap-1.5 text-xs text-secondary-500 dark:text-secondary-400 ${className}`}>
      <InformationCircleIcon className="mt-px h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-secondary-300 p-6 text-center text-sm text-secondary-500 dark:border-secondary-700">{children}</div>;
}

export function Modal({ title, onClose, children, footer, wide = false }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const t = useT();
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
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl bg-white text-secondary-900 shadow-xl outline-none dark:bg-secondary-900 dark:text-white ${wide ? 'max-w-2xl' : 'max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-secondary-200 px-4 py-3 dark:border-secondary-700">
          <h3 className="text-base font-bold">{title}</h3>
          <button type="button" onClick={onClose} aria-label={t('common.close')} className="rounded-full p-1 hover:bg-secondary-100 dark:hover:bg-secondary-800">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 text-sm">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-secondary-200 px-4 py-3 dark:border-secondary-700">{footer}</div>}
      </div>
    </div>
  );
}

export function Toasts() {
  const { toasts } = useWms();
  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 left-4 right-4 z-[80] flex flex-col items-end gap-2 sm:left-auto" aria-live="polite">
      {toasts.map((x) => (
        <div
          key={x.id}
          role="status"
          className={`pointer-events-auto max-w-sm rounded-lg px-4 py-2 text-sm text-white shadow-lg ${
            x.tone === 'error' ? 'bg-red-600' : x.tone === 'warn' ? 'bg-amber-600' : 'bg-emerald-600'
          }`}
        >
          {x.text}
        </div>
      ))}
    </div>
  );
}

/** Selector segmentado accesible (pestañas pequeñas). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: ReactNode }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-1 rounded-xl bg-secondary-100 p-1 dark:bg-secondary-800">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-lg px-3 py-1.5 text-sm transition ${
            value === o.id
              ? 'bg-white font-semibold text-secondary-900 shadow-sm dark:bg-secondary-700 dark:text-white'
              : 'text-secondary-600 hover:text-secondary-900 dark:text-secondary-300 dark:hover:text-white'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block font-medium text-secondary-700 dark:text-secondary-300">{label}</span>
      {children}
    </label>
  );
}

/** Estilo base de campos (sin ancho) para poder fijar uno distinto sin conflictos de clases. */
export const baseInputCls =
  'block rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-800 dark:text-white';
export const inputCls = `${baseInputCls} w-full`;
/** Las listas desplegables dejan espacio a la flecha. */
export const selectCls = `${inputCls} pr-9`;

export const thCls = 'px-2 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400';
export const tdCls = 'px-2 py-2 align-top';

export function download(filename: string, content: string | Blob, mime = 'text/csv;charset=utf-8') {
  const blob = typeof content === 'string' ? new Blob([content], { type: mime }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ProgressBar({ value, tone = 'bg-stone-600' }: { value: number; tone?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary-200 dark:bg-secondary-700">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
