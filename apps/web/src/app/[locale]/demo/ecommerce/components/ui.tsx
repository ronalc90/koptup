'use client';

// Piezas de interfaz compartidas por las vistas de la demo de tienda.

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import { imageUrl, type PhotoDetail, type Product } from './products';
import { ageParts, orderAge } from './analytics';
import type { Order, OrderStatus } from './data';
import { useStore } from './store';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Ventana de la demo: retiene el foco con Tab, se cierra con Escape (solo la de
 * arriba si hay varias) o tocando fuera, y al cerrarse devuelve el foco al
 * control que la abrió.
 */
export function Modal({
  title,
  onClose,
  children,
  footer,
  size = 'md',
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
}) {
  const t = useTranslations('demoEcommerce2');
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const titleId = useId();
  // Solo al abrir: enfoca el diálogo, escucha el teclado y, al cerrar, devuelve el foco.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKey = (e: KeyboardEvent) => {
      const dialog = ref.current;
      if (!dialog) return;
      const dialogs = document.querySelectorAll('[data-ecommerce-dialog]');
      if (dialogs[dialogs.length - 1] !== dialog) return; // otra ventana está encima
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!items.length) {
        e.preventDefault();
        dialog.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (!dialog.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      // Devuelve el foco si el control que abrió la ventana sigue en la página
      // (de inmediato: en desarrollo React monta los efectos dos veces).
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);
  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-ecommerce-dialog=""
        tabIndex={-1}
        className={`flex max-h-[92vh] w-full flex-col rounded-t-2xl sm:rounded-2xl bg-white dark:bg-secondary-900 outline-none ${size === 'lg' ? 'sm:max-w-4xl' : 'sm:max-w-xl'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-secondary-200 dark:border-secondary-800 px-5 py-4">
          <h2 id={titleId} className="text-lg font-bold text-secondary-900 dark:text-white">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800" aria-label={t('common.close')}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-secondary-200 dark:border-secondary-800 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/** Marcador cuando el producto no tiene foto o la foto no carga. */
function PhotoPlaceholder({ alt }: { alt: string }) {
  return (
    <div role="img" aria-label={alt} className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary-100 to-secondary-200 dark:from-secondary-800 dark:to-secondary-700 text-secondary-400">
      <PhotoIcon className="h-1/3 w-1/3" aria-hidden="true" />
    </div>
  );
}

/**
 * Foto del producto: Unsplash (catálogo base), foto subida o marcador sin foto.
 * Si la foto externa no carga (servicio caído o sin conexión), muestra el marcador.
 */
export function ProductImage({
  product,
  alt,
  size,
  sizes,
  detail,
  className = 'object-cover',
}: {
  product: Product;
  alt: string;
  size: number;
  sizes: string;
  detail?: PhotoDetail;
  className?: string;
}) {
  const src = product.imageData ?? (product.photoId ? imageUrl(product.photoId, size, size, detail) : null);
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) return <PhotoPlaceholder alt={alt} />;
  if (product.imageData) {
    return <Image src={src} alt={alt} fill sizes={sizes} className={className} unoptimized onError={() => setFailed(src)} />;
  }
  return <Image src={src} alt={alt} fill sizes={sizes} className={className} onError={() => setFailed(src)} />;
}

const STATUS_VARIANT: Record<OrderStatus, 'info' | 'warning' | 'primary' | 'success' | 'danger'> = {
  new: 'info',
  preparing: 'warning',
  shipped: 'primary',
  delivered: 'success',
  cancelled: 'danger',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const t = useTranslations('demoEcommerce2');
  return (
    <Badge variant={STATUS_VARIANT[status]} size="sm" className="whitespace-nowrap">
      {t(`orderStatus.${status}`)}
    </Badge>
  );
}

/** "hace 12 min", "hace 3 h", "hace 2 d". */
export function useAgeLabel() {
  const t = useTranslations('demoEcommerce2');
  const { clock } = useStore();
  return (o: Pick<Order, 'ageMin' | 'createdAt'>) => {
    const { unit, n } = ageParts(orderAge(o, clock));
    return t(`time.${unit}`, { n });
  };
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-primary-600' : 'bg-secondary-300 dark:bg-secondary-600'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export function SampleNote({ children }: { children: ReactNode }) {
  return <p className="text-xs text-secondary-500 dark:text-secondary-400">{children}</p>;
}

export function Toasts() {
  const { toasts, dismissToast, setView } = useStore();
  const t = useTranslations('demoEcommerce2');
  if (!toasts.length) return null;
  return (
    // Abajo a la izquierda en pantallas grandes (no tapa el botón «Ir a pagar» ni
    // los botones de los formularios) y abajo al centro en el celular. Solo los
    // avisos reciben clics; el resto de la franja deja pasar el puntero.
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-[110] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col gap-2 sm:bottom-6 sm:left-6 sm:w-96 sm:translate-x-0" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto flex items-center gap-3 rounded-xl bg-secondary-900 px-4 py-3 text-sm text-white shadow-2xl dark:bg-secondary-100 dark:text-secondary-900">
          <span className="flex-1">{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              className="shrink-0 font-semibold text-primary-300 hover:underline dark:text-primary-700"
              onClick={() => {
                setView(toast.action!.view);
                dismissToast(toast.id);
              }}
            >
              {toast.action.label}
            </button>
          )}
          <button type="button" onClick={() => dismissToast(toast.id)} aria-label={t('common.close')} className="shrink-0 opacity-70 hover:opacity-100">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function FieldLabel({ htmlFor, children, required }: { htmlFor: string; children: ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-secondary-700 dark:text-secondary-300">
      {children}
      {required && <span className="text-red-600"> *</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-secondary-700 dark:bg-secondary-800 dark:text-white';
export const inputErrorClass = 'border-red-500 dark:border-red-500';
