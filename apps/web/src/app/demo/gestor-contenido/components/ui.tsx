'use client';

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { hasUnpublishedChanges, titleOf } from '../lib/models';
import { notifiedTargets } from '../lib/reducer';
import { useCms } from '../lib/store';
import type { Entry, Status, TypeId } from '../lib/types';

/**
 * Aviso al publicar: dice a qué canales se avisó de verdad (webhooks activados;
 * el del asistente solo para preguntas frecuentes) o que no se avisó a ninguno.
 * Se calcula antes de publicar con los webhooks del momento.
 */
export function usePublishNotice() {
  const t = useTranslations('demoCms.editor');
  const tTargets = useTranslations('demoCms.publishing.targets');
  const uiLocale = useLocale();
  const { state } = useCms();
  return (entry: Pick<Entry, 'type'>) => {
    const targets = notifiedTargets(state, entry).map((id) => tTargets(`${id}.name`));
    if (targets.length === 0) return t('publishedNoHooks');
    return t('publishedTo', { targets: new Intl.ListFormat(uiLocale === 'en' ? 'en' : 'es', { type: 'conjunction' }).format(targets) });
  };
}

/**
 * Título de una entrada para la actividad y las entregas: el actual, en el idioma
 * del contenido; si la entrada ya no existe (se eliminó), el que se guardó.
 */
export function useEntryTitle() {
  const { state, contentLocale } = useCms();
  return (entryId: string | undefined, stored: string | undefined) => {
    const e = entryId ? state.entries.find((x) => x.id === entryId) : undefined;
    return (e && titleOf(e, e.content, contentLocale)) || stored || '';
  };
}

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
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  // El control que abrió la ventana (se lee en el primer render, antes de que el foco entre en ella).
  const openerRef = useRef<HTMLElement | null>(typeof document === 'undefined' ? null : (document.activeElement as HTMLElement | null));
  // Al abrir: foco en la ventana (o en su campo con autoFocus) y sin desplazamiento de fondo;
  // al cerrar, el foco vuelve al control que la abrió.
  useEffect(() => {
    const opener = openerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (!ref.current?.contains(document.activeElement)) ref.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (opener && document.contains(opener)) opener.focus();
    };
  }, []);
  // Escape cierra solo la ventana de arriba; Tab no sale de la ventana.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      closeRef.current();
      return;
    }
    if (e.key !== 'Tab' || !ref.current) return;
    const items = Array.from(ref.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"]')).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
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
        onKeyDown={onKeyDown}
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
  const t = useTranslations('demoCms.common');
  const { toasts, dismissToast } = useCms();
  // La región de avisos siempre está en el DOM para que los lectores de pantalla anuncien cada aviso.
  // Queda debajo de las ventanas (z 210): un aviso nunca tapa los botones de una ventana abierta.
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-[205] flex flex-col gap-2 w-[min(92vw,24rem)]" role="status" aria-live="polite">
      {toasts.map((item) => {
        const Icon = item.tone === 'warn' ? ExclamationTriangleIcon : item.tone === 'info' ? InformationCircleIcon : CheckCircleIcon;
        const color =
          item.tone === 'warn'
            ? 'border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-800'
            : item.tone === 'info'
              ? 'border-sky-300 bg-sky-50 text-sky-900 dark:bg-sky-950 dark:text-sky-100 dark:border-sky-800'
              : 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-800';
        return (
          <div key={item.id} className={`flex items-start gap-2 pl-4 pr-2 py-2.5 rounded-xl border shadow-lg text-sm ${color}`}>
            <Icon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="min-w-0 flex-1 break-words py-0.5">{item.text}</span>
            <button type="button" onClick={() => dismissToast(item.id)} className="shrink-0 rounded-md p-1 opacity-70 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-current" aria-label={t('dismiss')}>
              <XMarkIcon className="w-4 h-4" aria-hidden="true" />
            </button>
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
