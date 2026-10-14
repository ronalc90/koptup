'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { PRESETS, type PresetId, type Role, type TaxKind } from './data';
import { clockLabel, money, qtyLabel } from './engine';

/** Formato de montos y cantidades según el idioma activo. */
export function useFmt() {
  const locale = useLocale();
  return {
    locale,
    money: (n: number) => money(n, locale),
    qty: (q: number, byWeight?: boolean) => qtyLabel(q, byWeight, locale),
    /** Hora «HH:MM» guardada por la demo, con el formato del idioma. */
    clock: (hm: string) => clockLabel(hm, locale),
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

/** Ventanas abiertas, de abajo hacia arriba: Escape y Tab solo actúan sobre la de arriba. */
const modalStack: symbol[] = [];

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Si el control que abrió la ventana ya no existe o quedó deshabilitado (por
 * ejemplo, «Cobrar» después de cobrar o «Cerrar turno» después del cierre), el
 * foco vuelve al campo de escaneo, al buscador o al título de la pestaña.
 */
const RETURN_FOCUS = ['pos-scan', 'pos-search', 'pos-panel-title'];
const canFocus = (el: Element | null): el is HTMLElement =>
  el instanceof HTMLElement && el.isConnected && el !== document.body && !el.matches(':disabled');

/**
 * Contenedor de modal accesible: Escape cierra solo la ventana de arriba, el
 * foco entra al abrir, Tab no se sale de la ventana y, al cerrar, el foco
 * vuelve al control que la abrió.
 */
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
  // onClose cambia en cada render del padre: se lee de una ref para no volver a enfocar la ventana.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const id = Symbol('modal');
    modalStack.push(id);
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (modalStack[modalStack.length - 1] !== id) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab' || !ref.current) return;
      const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === ref.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      const i = modalStack.indexOf(id);
      if (i >= 0) modalStack.splice(i, 1);
      if (canFocus(opener)) opener.focus();
      else RETURN_FOCUS.map((x) => document.getElementById(x)).find(canFocus)?.focus({ preventScroll: true });
    };
  }, []);

  const width = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';
  // Se monta en <body> para quedar por encima de la barra de navegación del sitio.
  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 z-[200] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeRef.current();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        tabIndex={-1}
        className={`bg-white dark:bg-secondary-900 rounded-2xl w-full ${width} my-4 outline-none shadow-xl`}
      >
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
              onClick={() => closeRef.current()}
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

/** Título de la pestaña activa: recibe el foco cuando se cierra una ventana cuyo botón ya no existe. */
export const panelTitleProps = { id: 'pos-panel-title', tabIndex: -1 } as const;

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
