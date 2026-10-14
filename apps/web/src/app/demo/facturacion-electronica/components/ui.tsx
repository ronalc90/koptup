'use client';

import { useCallback, useEffect, useMemo, useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import type { DocStatus } from './data';
import { encodeQr, qrSvgPath } from './qr';

export const inputCls =
  'block w-full rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 px-3 py-2 text-sm text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60';
export const labelCls = 'block text-xs font-medium text-secondary-600 dark:text-secondary-300 mb-1';

export function Field({ label, htmlFor, children, hint }: { label: string; htmlFor?: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className={labelCls}>
        {label}
      </label>
      {children}
      {hint}
    </div>
  );
}

const STATUS_VARIANT: Record<DocStatus, 'success' | 'danger' | 'warning'> = {
  accepted: 'success',
  rejected: 'danger',
  contingency: 'warning',
};

export function StatusBadge({ status }: { status: DocStatus }) {
  const t = useTranslations('demoBilling');
  return (
    <Badge variant={STATUS_VARIANT[status]} size="sm" className="whitespace-nowrap">
      {t(`status.${status}`)}
    </Badge>
  );
}

/** Código QR real (SVG) generado en el navegador. */
export function QrSvg({ text, size = 112, label }: { text: string; size?: number; label: string }) {
  const { path, dim } = useMemo(() => {
    const modules = encodeQr(text);
    return { path: qrSvgPath(modules), dim: modules.length + 8 };
  }, [text]);
  return (
    <svg
      role="img"
      aria-label={label}
      width={size}
      height={size}
      viewBox={`0 0 ${dim} ${dim}`}
      shapeRendering="crispEdges"
      className="rounded bg-white flex-shrink-0"
    >
      <rect width={dim} height={dim} fill="#fff" />
      <path d={path} fill="#000" />
    </svg>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const t = useTranslations('demoBilling');
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    // Al cerrar, el foco vuelve al control que abrió la ventana.
    const opener = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      // Tab no sale de la ventana mientras está abierta.
      if (e.key !== 'Tab' || !panel.current) return;
      const focusables = Array.from(
        panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    panel.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-start sm:items-center justify-center p-3 sm:p-6 bg-black/50" onClick={onClose}>
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={
          'w-full max-h-[92vh] overflow-y-auto rounded-xl bg-white dark:bg-secondary-900 shadow-xl focus:outline-none ' +
          (wide ? 'max-w-3xl' : 'max-w-lg')
        }
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900">
          <h2 className="text-base font-semibold text-secondary-900 dark:text-white min-w-0 break-words">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className={'p-1 rounded-md text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800 ' + focusRing}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}

export function SectionTitle({ icon, title, subtitle, right }: { icon: ReactNode; title: string; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-white flex items-center gap-2">
          <span className="text-primary-600 flex-shrink-0">{icon}</span>
          {title}
        </h2>
        {subtitle && <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{subtitle}</p>}
      </div>
      {right && <div className="flex flex-wrap gap-2 sm:justify-end">{right}</div>}
    </div>
  );
}

export function Pill({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <span
      className={
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] ' +
        (ok
          ? 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300'
          : 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300')
      }
    >
      <span aria-hidden>{ok ? '✓' : '!'}</span>
      {children}
    </span>
  );
}

export function useMonths() {
  const t = useTranslations('demoBilling');
  return useMemo(() => t('common.monthsShort').split(','), [t]);
}

/** "2026-10" → "octubre de 2026" (o "Octubre de 2026" para títulos y listas). */
export function useMonthLabel() {
  const t = useTranslations('demoBilling');
  const long = useMemo(() => t('common.monthsLong').split(','), [t]);
  return useCallback(
    (ym: string, capitalize = false) => {
      const name = long[Number(ym.slice(5, 7)) - 1] || ym;
      return t('common.monthYear', { month: capitalize ? name.charAt(0).toUpperCase() + name.slice(1) : name, year: ym.slice(0, 4) });
    },
    [long, t],
  );
}

/** Anillo de foco visible para botones propios de la demo. */
export const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-secondary-900';

/**
 * Teclado de un grupo de pestañas (role="tablist"): flechas, Inicio y Fin cambian de
 * pestaña y mueven el foco, como pide el patrón de pestañas de WAI-ARIA.
 */
export function onTabsKeyDown<K extends string>(e: ReactKeyboardEvent<HTMLElement>, keys: readonly K[], current: K, select: (k: K) => void) {
  const idx = keys.indexOf(current);
  let next = -1;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % keys.length;
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + keys.length) % keys.length;
  else if (e.key === 'Home') next = 0;
  else if (e.key === 'End') next = keys.length - 1;
  if (next < 0) return;
  e.preventDefault();
  select(keys[next]);
  const tabs = e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]');
  tabs[next]?.focus();
}
