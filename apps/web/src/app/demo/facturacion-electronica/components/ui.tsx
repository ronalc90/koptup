'use client';

import { useEffect, useMemo, useRef, type ReactNode } from 'react';
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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    panel.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
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
            className="p-1 rounded-md text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800"
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
