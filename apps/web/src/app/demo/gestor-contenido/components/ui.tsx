'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import useModalClose from '@/hooks/useModalClose';
import { hasUnpublishedChanges } from '../lib/models';
import { useCms } from '../lib/store';
import type { Entry, Status, TypeId } from '../lib/types';

/** "en 5 minutos", "en 3 horas", "en 2 días" (para publicaciones programadas). */
export function useUntil() {
  const t = useTranslations('demoCms.home');
  const { nowMs } = useCms();
  return (isoDate: string) => {
    const mins = Math.max(0, Math.round((Date.parse(isoDate) - nowMs) / 60000));
    if (mins < 60) return t('inMinutes', { n: mins });
    if (mins < 60 * 48) return t('inHours', { n: Math.round(mins / 60) });
    return t('inDays', { n: Math.round(mins / 1440) });
  };
}

export const inputCls =
  'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-slate-100 disabled:text-slate-500 dark:disabled:bg-slate-900';
export const selectCls = `${inputCls} pr-9`;
export const labelCls = 'block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1';
export const card = 'rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';

export const btn = {
  primary:
    'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed',
  outline:
    'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed',
  small:
    'inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md text-xs font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed',
  ghost: 'inline-flex items-center justify-center gap-1.5 p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed',
  danger:
    'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed',
  success:
    'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed',
};

export const STATUS_COLORS: Record<Status, string> = {
  draft: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600',
  review: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800',
  approved: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 border-green-300 dark:border-green-800',
  scheduled: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-800',
  published: 'bg-pink-100 dark:bg-pink-900/40 text-pink-800 dark:text-pink-200 border-pink-300 dark:border-pink-800',
};

export function StatusBadge({ entry, compact = false }: { entry: Pick<Entry, 'status' | 'live' | 'content'>; compact?: boolean }) {
  const t = useTranslations('demoCms.status');
  const changes = entry.status !== 'published' && hasUnpublishedChanges(entry);
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${STATUS_COLORS[entry.status]}`}>{t(entry.status)}</span>
      {!compact && changes && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap bg-white dark:bg-slate-900 text-pink-700 dark:text-pink-300 border-pink-300 dark:border-pink-800" title={t('liveHint')}>
          {t('live')}
        </span>
      )}
    </span>
  );
}

const TYPE_COLORS: Record<TypeId, string> = {
  page: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300',
  article: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
  location: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
  service: 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300',
  faq: 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300',
};

export function TypeBadge({ type }: { type: TypeId }) {
  const t = useTranslations('demoCms.types');
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap ${TYPE_COLORS[type]}`}>{t(`${type}.name`)}</span>;
}

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  size = 'md',
  labelId,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  labelId: string;
}) {
  const t = useTranslations('demoCms.common');
  useModalClose(true, onClose);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  const width = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-3xl' : 'max-w-xl';
  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        className={`relative w-full ${width} max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl outline-none`}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="min-w-0">
            <h2 id={labelId} className="text-lg font-bold text-slate-900 dark:text-white break-words">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className={btn.ghost} aria-label={t('close')}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 flex-1">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Toasts() {
  const { toasts } = useCms();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[220] flex flex-col gap-2 w-[min(92vw,26rem)]" role="status" aria-live="polite">
      {toasts.map((t) => {
        const Icon = t.tone === 'warn' ? ExclamationTriangleIcon : t.tone === 'info' ? InformationCircleIcon : CheckCircleIcon;
        const color =
          t.tone === 'warn'
            ? 'border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-800'
            : t.tone === 'info'
              ? 'border-sky-300 bg-sky-50 text-sky-900 dark:bg-sky-950 dark:text-sky-100 dark:border-sky-800'
              : 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-800';
        return (
          <div key={t.id} className={`flex items-start gap-2 px-4 py-3 rounded-xl border shadow-lg text-sm ${color}`}>
            <Icon className="w-5 h-5 shrink-0" />
            <span className="min-w-0 break-words">{t.text}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Interruptor accesible (role="switch"). */
export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${checked ? 'bg-pink-600' : 'bg-slate-300 dark:bg-slate-600'}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">{children}</div>;
}

/** Nota discreta para explicar qué es simulado en la demo. */
export function Note({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' }) {
  const color =
    tone === 'warn'
      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-100'
      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300';
  return <p className={`text-xs rounded-lg border px-3 py-2 ${color}`}>{children}</p>;
}
