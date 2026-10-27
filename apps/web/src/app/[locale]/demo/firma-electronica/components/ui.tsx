'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import { SIGNER_COLORS } from '../lib/data';
import { useFirma } from '../lib/store';
import type { StepError } from '../lib/logic';
import type { EnvStatus } from '../lib/types';

export const inputCls =
  'block w-full min-w-0 rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 px-3 py-2 text-sm text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500';
export const selectCls =
  'block w-full min-w-0 rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 px-3 py-2 text-sm text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500';
export const labelCls = 'mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-300';
export const smallBtn =
  'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-40';
export const focusRing = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-secondary-900';

export function Panel({ title, subtitle, actions, children, className = '' }: { title?: string; subtitle?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-secondary-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-900 sm:p-5 ${className}`}>
      {(title || actions) && (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-secondary-900 dark:text-white sm:text-lg">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-secondary-600 dark:text-secondary-400">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/** Rótulo para lo que se simula en la demo. */
export function SimNote({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100 ${className}`}>
      {children}
    </p>
  );
}

const STATUS_VARIANT: Record<EnvStatus, 'info' | 'warning' | 'success' | 'danger' | 'default'> = {
  draft: 'default',
  sent: 'info',
  partial: 'warning',
  completed: 'success',
  expired: 'danger',
  voided: 'default',
};

export function StatusBadge({ status }: { status: EnvStatus }) {
  const t = useTranslations('demoSign');
  return (
    <Badge size="sm" variant={STATUS_VARIANT[status]} className="whitespace-nowrap">
      {t(`status.${status}`)}
    </Badge>
  );
}

export function SignerDot({ index }: { index: number }) {
  return <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${SIGNER_COLORS[index % SIGNER_COLORS.length].dot}`} aria-hidden />;
}

export function Errors({ errors }: { errors: StepError[] }) {
  const t = useTranslations('demoSign.wizard.errors');
  if (!errors.length) return null;
  return (
    <ul role="alert" className="space-y-1 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-200">
      {errors.map((e, i) => (
        <li key={`${e.key}-${i}`}>{t(e.key, e.params)}</li>
      ))}
    </ul>
  );
}

/** Ventana modal: Escape y clic afuera cierran, Tab no se sale y el foco vuelve a donde estaba. */
export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const t = useTranslations('demoSign.common');
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
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
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
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
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl focus:outline-none dark:bg-secondary-900 sm:rounded-2xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
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
  const t = useTranslations('demoSign.common');
  const { toasts, dismissToast } = useFirma();
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
          <span className="flex-1">{x.text}</span>
          <button type="button" onClick={() => dismissToast(x.id)} className="rounded p-0.5 opacity-70 hover:opacity-100" aria-label={t('close')}>
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Contenedor de una página de documento (blanca también en modo oscuro, como un papel). */
export function Paper({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`relative rounded-lg border border-secondary-300 bg-white text-secondary-800 shadow-inner ${className}`}>{children}</div>;
}
