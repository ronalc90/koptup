'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CATEGORY_COLORS, PRIORITY_COLORS } from '../lib/data';
import { splitHighlights } from '../lib/classifier';
import { fmtPct } from '../lib/format';
import { useModeration } from '../lib/store';
import type { Label, Priority } from '../lib/types';

export const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-secondary-900';
export const selectCls =
  'block w-full min-w-0 rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 py-2 pl-3 pr-9 text-sm text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500';
export const inputCls =
  'block w-full min-w-0 rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 px-3 py-2 text-sm text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500';
export const labelCls = 'mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-300';
export const chipBtn = `inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${focusRing}`;

export function SectionTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">{title}</h2>
        {subtitle && <p className="text-sm text-secondary-600 dark:text-secondary-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 md:max-w-[65%] md:flex-none md:justify-end">{actions}</div>}
    </div>
  );
}

/** Rótulo para lo que es de ejemplo o simulado. */
export function SimNote({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100 ${className}`}>
      {children}
    </p>
  );
}

export function CategoryChip({ label, className = '', wrap = false }: { label: Label; className?: string; wrap?: boolean }) {
  const t = useTranslations('demoModeration');
  return (
    <span className={`inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-xs ${wrap ? 'whitespace-normal' : 'whitespace-nowrap'} ${CATEGORY_COLORS[label]} ${className}`}>
      {t(`categories.${label}.name`)}
    </span>
  );
}

export function PriorityChip({ priority }: { priority: Priority }) {
  const t = useTranslations('demoModeration');
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[priority]}`}>{t(`priorities.${priority}`)}</span>;
}

export function ConfidenceBar({ score, className = '' }: { score: number; className?: string }) {
  const { lang } = useModeration();
  const color = score >= 0.85 ? 'bg-red-500' : score >= 0.6 ? 'bg-orange-500' : score >= 0.2 ? 'bg-yellow-500' : 'bg-emerald-500';
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-secondary-200 dark:bg-secondary-700" aria-hidden>
        <span className={`block h-full ${color}`} style={{ width: `${Math.round(score * 100)}%` }} />
      </span>
      <span className="font-mono text-xs text-secondary-700 dark:text-secondary-300">{fmtPct(score, lang)}</span>
    </span>
  );
}

/** Texto con los fragmentos que explican la categoría resaltados. */
export function Highlighted({ text, spans }: { text: string; spans: Array<[number, number]> }) {
  return (
    <>
      {splitHighlights(text, spans).map((p, i) =>
        p.mark ? (
          <mark key={i} className="rounded bg-amber-200/80 px-0.5 text-inherit dark:bg-amber-500/30">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-secondary-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-900">
      <p className="mb-1 text-xs uppercase tracking-wide text-secondary-500 dark:text-secondary-400">{label}</p>
      <p className="text-2xl font-bold text-secondary-900 dark:text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">{hint}</p>}
    </div>
  );
}

export function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400">{label}</dt>
      <dd className="break-words font-medium text-secondary-800 dark:text-secondary-100">{value}</dd>
    </div>
  );
}

/** Barras verticales; la altura de cada barra es relativa a la mayor. */
export function BarChart({ data, ariaLabel }: { data: Array<{ label: string; value: number; display: string }>; ariaLabel: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end justify-between gap-3" role="img" aria-label={ariaLabel}>
      {data.map((d) => (
        <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <span className="font-mono text-[11px] text-secondary-600 dark:text-secondary-300">{d.display}</span>
          <div className="flex h-32 w-full items-end">
            <div className="w-full rounded-t-md bg-gradient-to-t from-primary-600 to-primary-400" style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }} />
          </div>
          <span className="truncate text-xs text-secondary-600 dark:text-secondary-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Barras horizontales con etiqueta de categoría. */
export function CategoryBars({ rows }: { rows: Array<{ label: Label; value: number; display: string }> }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[minmax(0,11.5rem)_1fr_auto] items-center gap-2">
          <CategoryChip label={r.label} className="justify-self-start truncate" />
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary-100 dark:bg-secondary-800">
            <div className="h-full bg-primary-500" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
          <span className="w-12 text-right text-xs text-secondary-600 dark:text-secondary-400">{r.display}</span>
        </div>
      ))}
    </div>
  );
}

/** Ventana modal: Escape y clic afuera cierran, Tab no se sale y el foco vuelve a donde estaba. */
export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const t = useTranslations('demoModeration.common');
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const first = panel.current?.querySelector<HTMLElement>('[data-autofocus]');
    (first ?? panel.current)?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;
      const items = Array.from(
        panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      );
      if (!items.length) return;
      const firstItem = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === firstItem || document.activeElement === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        firstItem.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl focus:outline-none dark:bg-secondary-900 sm:rounded-2xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-secondary-200 bg-white px-4 py-3 dark:border-secondary-700 dark:bg-secondary-900">
          <h2 className="min-w-0 text-base font-semibold text-secondary-900 dark:text-white">{title}</h2>
          <button type="button" onClick={onClose} className={`rounded-md p-1.5 text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800 ${focusRing}`} aria-label={t('close')}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function Toasts() {
  const t = useTranslations('demoModeration.common');
  const { toasts, dismissToast } = useModeration();
  return (
    <div className="pointer-events-none fixed bottom-4 left-4 right-4 z-[130] flex flex-col items-end gap-2 sm:left-auto sm:w-96" aria-live="polite">
      {toasts.map((x) => (
        <div
          key={x.id}
          className={`pointer-events-auto flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-sm shadow-lg ${
            x.tone === 'warn'
              ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100'
              : x.tone === 'info'
                ? 'border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-100'
                : 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100'
          }`}
        >
          <span className="min-w-0 flex-1">{x.text}</span>
          <button type="button" onClick={() => dismissToast(x.id)} className={`rounded p-0.5 opacity-70 hover:opacity-100 ${focusRing}`} aria-label={t('close')}>
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
