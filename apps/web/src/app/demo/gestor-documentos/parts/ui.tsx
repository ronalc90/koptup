'use client';

/**
 * Piezas de interfaz de la demo: ventana modal accesible (Escape cierra solo
 * la de arriba, el foco queda atrapado y vuelve al botón que la abrió), panel
 * lateral, avisos e interruptor.
 */
import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useDocs } from '../lib/store';

export const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900';

export const btnPrimary = `inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
export const btnSecondary = `inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 ${focusRing}`;
export const btnDanger = `inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
export const inputCls =
  'block w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
export const labelCls = 'mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300';

/* ---------------------------- Pila de ventanas ---------------------------- */

const stack: string[] = [];

function useLayer(open: boolean, onClose: () => void, panelRef: RefObject<HTMLElement>, initialFocus?: RefObject<HTMLElement>) {
  const id = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    stack.push(id);
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') || [],
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
    const first = initialFocus?.current || focusables()[0] || panel;
    first?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== id) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key === 'Tab' && panel) {
        const items = focusables();
        if (!items.length) return;
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        } else if (!panel.contains(document.activeElement)) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      const i = stack.lastIndexOf(id);
      if (i !== -1) stack.splice(i, 1);
      document.body.style.overflow = prevOverflow;
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id]);
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  initialFocus?: RefObject<HTMLElement>;
}

const SIZES = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

/** Ventana centrada por encima del menú del sitio y del panel del documento. */
export function Modal({ open, onClose, title, subtitle, icon, children, footer, size = 'md', initialFocus }: ModalProps) {
  const t = useTranslations('demoDocs');
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useLayer(open, onClose, ref, initialFocus);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-950/60" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex max-h-[92vh] w-full ${SIZES[size]} flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl outline-none dark:bg-slate-900 sm:rounded-2xl`}
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            {icon && <span className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-400">{icon}</span>}
            <div className="min-w-0">
              <h2 id={titleId} className="break-words text-lg font-bold text-slate-900 dark:text-white">
                {title}
              </h2>
              {subtitle && <div className="mt-0.5 break-words text-sm text-slate-500 dark:text-slate-400">{subtitle}</div>}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={t('common.close')} className={`shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 ${focusRing}`}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800">{footer}</footer>}
      </div>
    </div>
  );
}

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  label: string;
  side?: 'left' | 'right';
  children: ReactNode;
  widthCls?: string;
}

/** Panel lateral que empieza debajo del menú del sitio (que mide 4 rem o 5 rem). */
export function Drawer({ open, onClose, label, side = 'right', children, widthCls = 'sm:max-w-[620px]' }: DrawerProps) {
  const ref = useRef<HTMLDivElement>(null);
  useLayer(open, onClose, ref);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110]">
      <div className="absolute inset-0 bg-slate-950/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`absolute bottom-0 top-16 w-full ${widthCls} overflow-y-auto bg-white shadow-2xl outline-none dark:bg-slate-900 md:top-20 ${side === 'right' ? 'right-0' : 'left-0'}`}
      >
        {children}
      </div>
    </div>
  );
}

/* --------------------------------- Avisos --------------------------------- */

export function Toasts() {
  const { toasts, dismissToast } = useDocs();
  const t = useTranslations('demoDocs');
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[130] flex flex-col items-end gap-2 sm:left-auto sm:right-4 sm:w-96" role="status" aria-live="polite">
      {toasts.map((x) => {
        const Icon = x.kind === 'error' ? ExclamationTriangleIcon : x.kind === 'success' ? CheckCircleIcon : InformationCircleIcon;
        const tone =
          x.kind === 'error'
            ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-100'
            : x.kind === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100'
              : 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100';
        return (
          <div key={x.id} className={`pointer-events-auto flex w-full items-start gap-2 rounded-xl border px-3 py-2.5 text-sm shadow-lg ${tone}`}>
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="min-w-0 flex-1 break-words">{x.text}</p>
            <button type="button" onClick={() => dismissToast(x.id)} aria-label={t('common.close')} className={`shrink-0 rounded p-0.5 opacity-70 hover:opacity-100 ${focusRing}`}>
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------- Interruptor ------------------------------- */

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${checked ? 'bg-red-600' : 'bg-slate-300 dark:bg-slate-600'} ${focusRing}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

/** Rótulo para lo que se simula o es de ejemplo. */
export function Note({ children, tone = 'amber', className = '' }: { children: ReactNode; tone?: 'amber' | 'blue'; className?: string }) {
  const cls =
    tone === 'amber'
      ? 'border-amber-300/70 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100'
      : 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100';
  return <p className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${cls} ${className}`}>{children}</p>;
}
