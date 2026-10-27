'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAutomation } from '../lib/store';

/** El editor es oscuro siempre (como la mayoría de editores de flujos). */
export const focusRing = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1 focus-visible:ring-offset-secondary-950';
export const inputCls =
  'w-full min-w-0 rounded-md border border-secondary-700 bg-secondary-950 px-2 py-1.5 text-xs text-secondary-100 placeholder:text-secondary-500 focus:outline-none focus:ring-1 focus:ring-primary-400';
export const btnGhost = `inline-flex items-center gap-1.5 rounded-md border border-secondary-700 px-2.5 py-1.5 text-xs text-secondary-200 hover:bg-secondary-800 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
export const btnPrimary = `inline-flex items-center justify-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;
export const btnDanger = `inline-flex items-center justify-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;
export const btnLink = `inline-flex items-center gap-1 rounded text-xs font-medium text-primary-300 hover:text-primary-200 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

/** Rótulo pequeño para lo que en la demo es simulado. */
export function SimTag({ className = '' }: { className?: string }) {
  const t = useTranslations('demoAutomation.common');
  return (
    <span className={`inline-flex shrink-0 items-center rounded border border-amber-400/40 bg-amber-400/10 px-1 text-[9px] font-semibold uppercase tracking-wide text-amber-200 ${className}`}>
      {t('simulated')}
    </span>
  );
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const t = useTranslations('demoAutomation.common');
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const first = panel.current?.querySelector<HTMLElement>('[data-autofocus]') ?? panel.current;
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const firstEl = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === firstEl || document.activeElement === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        firstEl.focus();
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
  const width = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-3xl', xl: 'sm:max-w-4xl' }[size];
  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-secondary-700 bg-secondary-900 text-secondary-100 shadow-2xl focus:outline-none sm:rounded-xl ${width}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-secondary-800 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-secondary-400">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label={t('close')} className={`rounded-md p-1 text-secondary-400 hover:bg-secondary-800 hover:text-white ${focusRing}`}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-secondary-800 px-4 py-3 sm:px-5">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const t = useTranslations('demoAutomation.common');
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" onClick={onClose} className={btnGhost}>
            {t('cancel')}
          </button>
          <button
            type="button"
            data-autofocus
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={danger ? btnDanger : btnPrimary}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-sm text-secondary-300">{body}</div>
    </Modal>
  );
}

export function PromptDialog({
  open,
  title,
  label,
  initial,
  confirmLabel,
  onConfirm,
  onClose,
  maxLength = 80,
}: {
  open: boolean;
  title: string;
  label: string;
  initial: string;
  confirmLabel: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
  maxLength?: number;
}) {
  const t = useTranslations('demoAutomation.common');
  const [value, setValue] = useState(initial);
  useEffect(() => {
    if (open) setValue(initial);
  }, [open, initial]);
  const submit = () => {
    if (!value.trim()) return;
    onConfirm(value.trim());
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" onClick={onClose} className={btnGhost}>
            {t('cancel')}
          </button>
          <button type="button" onClick={submit} disabled={!value.trim()} className={btnPrimary}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <label className="block text-xs text-secondary-400">
        {label}
        <input
          data-autofocus
          value={value}
          maxLength={maxLength}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          className={`${inputCls} mt-1 text-sm`}
        />
      </label>
    </Modal>
  );
}

export function Toasts() {
  const t = useTranslations('demoAutomation.common');
  const { toasts, dismissToast } = useAutomation();
  return (
    <div className="pointer-events-none fixed bottom-4 left-4 right-4 z-[130] flex flex-col items-end gap-2 sm:left-auto sm:w-96" aria-live="polite">
      {toasts.map((x) => (
        <div
          key={x.id}
          className={`pointer-events-auto flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-sm shadow-lg ${
            x.tone === 'warn'
              ? 'border-amber-500/50 bg-amber-950 text-amber-100'
              : x.tone === 'info'
                ? 'border-sky-500/50 bg-sky-950 text-sky-100'
                : 'border-emerald-500/50 bg-emerald-950 text-emerald-100'
          }`}
        >
          <span className="min-w-0 flex-1 break-words">{x.text}</span>
          {x.action && (
            <button
              type="button"
              onClick={() => {
                x.action?.run();
                dismissToast(x.id);
              }}
              className={`shrink-0 rounded px-1.5 text-xs font-semibold underline ${focusRing}`}
            >
              {x.action.label}
            </button>
          )}
          <button type="button" onClick={() => dismissToast(x.id)} className={`shrink-0 rounded p-0.5 opacity-70 hover:opacity-100 ${focusRing}`} aria-label={t('close')}>
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Bloque de JSON de solo lectura. */
export function JsonBlock({ value, className = '' }: { value: unknown; className?: string }) {
  return (
    <pre className={`max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-md border border-secondary-800 bg-secondary-950 p-2 font-mono text-[11px] leading-relaxed text-emerald-200 ${className}`}>
      {value === undefined ? '—' : JSON.stringify(value, null, 2)}
    </pre>
  );
}

/** Descarga un texto como archivo. */
export function downloadText(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
