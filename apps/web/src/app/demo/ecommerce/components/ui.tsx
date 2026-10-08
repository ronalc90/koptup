'use client';

// Piezas de interfaz compartidas por las vistas de la demo de tienda.

import { useEffect, useRef, type ReactNode } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import { imageUrl, type PhotoDetail, type Product } from './products';
import { ageParts, orderAge } from './analytics';
import type { Order, OrderStatus } from './data';
import { useStore } from './store';

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
  // Solo al abrir: enfoca el diálogo y escucha Escape (sin robar el foco en cada render).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`flex max-h-[92vh] w-full flex-col rounded-t-2xl sm:rounded-2xl bg-white dark:bg-secondary-900 outline-none ${size === 'lg' ? 'sm:max-w-4xl' : 'sm:max-w-xl'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-secondary-200 dark:border-secondary-800 px-5 py-4">
          <h2 className="text-lg font-bold text-secondary-900 dark:text-white">{title}</h2>
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

/** Foto del producto: Unsplash (catálogo base), foto subida o marcador sin foto. */
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
  if (product.imageData) {
    return <Image src={product.imageData} alt={alt} fill sizes={sizes} className={className} unoptimized />;
  }
  if (product.photoId) {
    return <Image src={imageUrl(product.photoId, size, size, detail)} alt={alt} fill sizes={sizes} className={className} />;
  }
  return (
    <div role="img" aria-label={alt} className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary-100 to-secondary-200 dark:from-secondary-800 dark:to-secondary-700 text-secondary-400">
      <PhotoIcon className="h-1/3 w-1/3" />
    </div>
  );
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
    <div className="fixed bottom-24 left-1/2 z-[110] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col gap-2" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="flex items-center gap-3 rounded-xl bg-secondary-900 px-4 py-3 text-sm text-white shadow-2xl dark:bg-secondary-100 dark:text-secondary-900">
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
