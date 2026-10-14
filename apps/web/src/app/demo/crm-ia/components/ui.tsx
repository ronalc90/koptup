'use client';

import { KeyboardEvent as ReactKeyboardEvent, ReactNode, useEffect, useRef } from 'react';
import { CheckCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export function Avatar({ text, size = 'md' }: { text: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'w-12 h-12 sm:w-14 sm:h-14 text-base' : size === 'sm' ? 'w-8 h-8 text-[11px]' : 'w-9 h-9 text-xs';
  return (
    <div
      className={`${cls} rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold flex-shrink-0`}
      aria-hidden="true"
    >
      {text}
    </div>
  );
}

/** Aviso discreto de qué es simulado en una sección. */
export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="flex gap-2 text-xs text-secondary-600 dark:text-secondary-400 bg-secondary-50 dark:bg-secondary-900/60 border border-secondary-200 dark:border-secondary-800 rounded-lg px-3 py-2 mb-4">
      <InformationCircleIcon className="h-4 w-4 flex-shrink-0 mt-px" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export function SectionHeader({
  title,
  subtitle,
  aside,
}: {
  title: string;
  subtitle: string;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-lg sm:text-xl font-semibold text-secondary-900 dark:text-white">{title}</h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">{subtitle}</p>
      </div>
      {aside && <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:flex-shrink-0">{aside}</div>}
    </div>
  );
}

export function PlanBadge({ label, hint }: { label: string; hint: string }) {
  return (
    <span
      title={hint}
      className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-300"
    >
      {label}
    </span>
  );
}

export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(onDone, 4000);
    return () => clearTimeout(id);
  }, [message, onDone]);
  return (
    <div aria-live="polite" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[120] w-[calc(100%-2rem)] max-w-md pointer-events-none">
      {message && (
        <div className="pointer-events-auto flex items-start gap-2 rounded-xl bg-secondary-900 text-white dark:bg-white dark:text-secondary-900 px-4 py-3 shadow-xl text-sm animate-fade-in">
          <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-green-400 dark:text-green-600" aria-hidden="true" />
          <span className="flex-1">{message}</span>
        </div>
      )}
    </div>
  );
}

/** Ventanas abiertas, de la de abajo a la de arriba: Escape cierra solo la de arriba. */
const modalStack: string[] = [];

export function Modal({
  title,
  subtitle,
  onClose,
  closeLabel,
  children,
  footer,
  size = 'md',
  labelId,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  closeLabel: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
  labelId: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    // Al abrir: foco en la ventana y sin scroll de fondo; al cerrar: el foco vuelve al control que la abrió.
    const opener = document.activeElement as HTMLElement | null;
    modalStack.push(labelId);
    panelRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (modalStack[modalStack.length - 1] !== labelId) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      // Tab y Mayús+Tab se quedan dentro de la ventana.
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      const i = modalStack.lastIndexOf(labelId);
      if (i >= 0) modalStack.splice(i, 1);
      if (!modalStack.length) document.body.style.overflow = previousOverflow;
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [labelId]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      onClick={onClose}
      className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-2 sm:p-4 animate-fade-in"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`relative bg-white dark:bg-secondary-900 rounded-2xl w-full ${size === 'lg' ? 'max-w-4xl' : 'max-w-lg'} max-h-[95vh] overflow-y-auto shadow-2xl outline-none`}
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-800 px-4 sm:px-6 py-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {typeof title === 'string' ? (
              <h2 id={labelId} className="text-lg sm:text-xl font-bold text-secondary-900 dark:text-white">
                {title}
              </h2>
            ) : (
              <div id={labelId}>{title}</div>
            )}
            {subtitle && <div className="text-sm text-secondary-600 dark:text-secondary-400 mt-0.5">{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label={closeLabel}
          >
            <XMarkIcon className="h-6 w-6 text-secondary-600 dark:text-secondary-300" aria-hidden="true" />
          </button>
        </div>
        <div className="px-4 sm:px-6 py-4">{children}</div>
        {footer && (
          <div className="sticky bottom-0 bg-white dark:bg-secondary-900 border-t border-secondary-200 dark:border-secondary-800 px-4 sm:px-6 py-3 flex flex-wrap justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** Flechas, Inicio y Fin para moverse entre pestañas (patrón de pestañas accesibles de ARIA). */
export function tabKeyDown<T extends string>(
  e: ReactKeyboardEvent<HTMLElement>,
  ids: readonly T[],
  current: T,
  select: (id: T) => void,
) {
  const i = ids.indexOf(current);
  let next = -1;
  if (e.key === 'ArrowRight') next = (i + 1) % ids.length;
  else if (e.key === 'ArrowLeft') next = (i - 1 + ids.length) % ids.length;
  else if (e.key === 'Home') next = 0;
  else if (e.key === 'End') next = ids.length - 1;
  if (next < 0) return;
  e.preventDefault();
  select(ids[next]);
  const tabs = e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]');
  tabs[next]?.focus();
}

export const inputCls =
  'w-full px-3 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60';

/** Enlace con apariencia de texto que muestra el foco al navegar con teclado. */
export const linkCls =
  'text-primary-700 dark:text-primary-300 underline underline-offset-2 hover:no-underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500';
export const labelCls = 'block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1.5';
