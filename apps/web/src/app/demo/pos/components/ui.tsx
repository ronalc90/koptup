'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { PRESETS, type PresetId, type Role, type TaxKind } from './data';
import { money, qtyLabel } from './engine';

/** Formato de montos y cantidades según el idioma activo. */
export function useFmt() {
  const locale = useLocale();
  return {
    locale,
    money: (n: number) => money(n, locale),
    qty: (q: number, byWeight?: boolean) => qtyLabel(q, byWeight, locale),
  };
}

export function taxLabelKey(kind: TaxKind) {
  return `tax.${kind}` as const;
}

export function employeeName(preset: PresetId, id: string | undefined) {
  if (!id) return '';
  return PRESETS[preset].employees.find((e) => e.id === id)?.name ?? '';
}

/** "Sofía Pardo" → "Sofía P." */
export function shortName(name: string) {
  const [first, last] = name.split(' ');
  return last ? `${first} ${last[0]}.` : first;
}

export function roleKey(role: Role) {
  return `staff.roles.${role}` as const;
}

/**
 * Imprime solo el elemento indicado (recibo, reporte X o Z) con el diálogo de
 * impresión del navegador; el estilo `@media print` está en la página.
 */
export function printById(id: string) {
  if (typeof window === 'undefined') return;
  document.querySelectorAll('.pos-print-target').forEach((n) => n.classList.remove('pos-print-target'));
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('pos-print-target');
  const cleanup = () => {
    el.classList.remove('pos-print-target');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
}

export const PRINT_CSS = `@media print {
  body * { visibility: hidden !important; }
  .pos-print-target, .pos-print-target * { visibility: visible !important; }
  .pos-print-target { position: absolute !important; left: 0 !important; top: 0 !important; width: 80mm !important; max-height: none !important; overflow: visible !important; box-shadow: none !important; border: 0 !important; color: #000 !important; background: #fff !important; }
}`;

/** Contenedor de modal accesible: cierra con Escape y enfoca el diálogo al abrir. */
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
  const t = useTranslations('demoPos');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const width = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';
  // Se monta en <body> para quedar por encima de la barra de navegación del sitio.
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

export const inputCls =
  'w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

export const selectCls =
  'text-sm pl-3 pr-9 py-1.5 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-800 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500';

export function Stat({ label, value, sub, tone }: { label: ReactNode; value: ReactNode; sub?: ReactNode; tone?: string }) {
  return (
    <div className="rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 p-3 sm:p-4 min-w-0">
      <div className="text-xs text-secondary-500 dark:text-secondary-400">{label}</div>
      <div className={`text-lg sm:text-2xl font-bold mt-1 truncate ${tone ?? 'text-secondary-900 dark:text-white'}`}>{value}</div>
      {sub && <div className="text-[11px] text-secondary-500 dark:text-secondary-400 mt-0.5">{sub}</div>}
    </div>
  );
}
