'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { CheckIcon, ClipboardDocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import { useDemo } from '../lib/store';
import type { Tenant, TenantStatus } from '../lib/types';

export const selectCls =
  'rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 px-3 py-2 text-sm text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500';
export const inputCls =
  'block w-full rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 px-3 py-2 text-sm text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500';

export function ScreenHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400">{subtitle}</p>}
      </div>
      {children && <div className="flex shrink-0 flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Panel({ title, subtitle, actions, children, className = '' }: { title?: string; subtitle?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-secondary-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-900 sm:p-5 ${className}`}>
      {(title || actions) && (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            {title && <h3 className="text-base font-semibold text-secondary-900 dark:text-white">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-secondary-500 dark:text-secondary-400">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/** Rótulo para lo que se simula en la demo. */
export function SimNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
      {children}
    </p>
  );
}

const STATUS_VARIANT: Record<TenantStatus, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
  activo: 'success',
  prueba: 'info',
  mora: 'warning',
  suspendido: 'danger',
  cancelado: 'default',
};

export function StatusBadge({ status }: { status: TenantStatus }) {
  const t = useTranslations('demoSaas');
  return (
    <Badge size="sm" variant={STATUS_VARIANT[status]}>
      {t(`status.${status}`)}
    </Badge>
  );
}

export function initials(name: string): string {
  const words = name
    .replace(/\b(Conjunto|Edificio|Condominio|Campestre|Torres|de|del|los|las|la|el|S\.A\.S\.)\b/gi, ' ')
    .split(/\s+/)
    .filter(Boolean);
  return (words[0]?.[0] ?? name[0] ?? '?').toUpperCase() + (words[1]?.[0] ?? '').toUpperCase();
}

export function TenantAvatar({ tenant, size = 'md' }: { tenant: Pick<Tenant, 'name' | 'color' | 'logo'>; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'lg' ? 'h-12 w-12 text-base' : size === 'sm' ? 'h-7 w-7 text-[11px]' : 'h-9 w-9 text-xs';
  if (tenant.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={tenant.logo} alt="" className={`${dims} shrink-0 rounded-lg bg-white object-contain p-0.5 ring-1 ring-black/5`} />
    );
  }
  return (
    <span className={`${dims} inline-flex shrink-0 items-center justify-center rounded-lg font-bold text-white`} style={{ backgroundColor: tenant.color }} aria-hidden>
      {initials(tenant.name)}
    </span>
  );
}

/** Selector de cliente (tenant). Por defecto excluye los cancelados. */
export function TenantSelect({ value, onChange, label, includeCancelled = false, id }: { value: string; onChange: (id: string) => void; label: string; includeCancelled?: boolean; id: string }) {
  const { s } = useDemo();
  const list = s.tenants.filter((tn) => includeCancelled || tn.status !== 'cancelado');
  return (
    <label htmlFor={id} className="flex min-w-0 flex-col gap-1 text-xs font-medium text-secondary-600 dark:text-secondary-300 sm:flex-row sm:items-center sm:gap-2">
      <span className="shrink-0">{label}</span>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${selectCls} min-w-0 max-w-full sm:max-w-xs`}>
        {list.map((tn) => (
          <option key={tn.id} value={tn.id}>
            {tn.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  const tone = pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-primary-600';
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary-200 dark:bg-secondary-800" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full ${tone} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Toggle({ checked, onChange, label, disabled = false }: { checked: boolean; onChange: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-5 w-10 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${checked ? 'bg-primary-600' : 'bg-secondary-300 dark:bg-secondary-700'}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export function CopyButton({ text, label }: { text: string; label: string }) {
  const t = useTranslations('demoSaas');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(() => setDone(false), 1800);
    return () => window.clearTimeout(id);
  }, [done]);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => setDone(true)).catch(() => setDone(false));
      }}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-secondary-300 hover:bg-white/10 hover:text-white"
      aria-label={label}
      title={label}
    >
      {done ? <CheckIcon className="h-3.5 w-3.5" /> : <ClipboardDocumentIcon className="h-3.5 w-3.5" />}
      {done ? t('common.copied') : t('common.copy')}
    </button>
  );
}

export function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const t = useTranslations('demoSaas');
  return (
    <div className="overflow-hidden rounded-lg border border-secondary-800 bg-secondary-950 text-secondary-100">
      <div className="flex items-center justify-between border-b border-secondary-800 px-3 py-1.5 text-[10px] uppercase tracking-wider text-secondary-400">
        <span>{lang}</span>
        <CopyButton text={code} label={t('common.copyCode')} />
      </div>
      <pre className="max-h-80 overflow-auto p-3 text-xs leading-relaxed">
        <code className="whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const t = useTranslations('demoSaas');
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl dark:bg-secondary-900 sm:rounded-2xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-secondary-200 bg-white px-4 py-3 dark:border-secondary-700 dark:bg-secondary-900">
          <h3 className="text-base font-semibold text-secondary-900 dark:text-white">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800" aria-label={t('common.close')}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function FieldError({ msg }: { msg?: string | null }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600 dark:text-red-400">{msg}</p>;
}

export function Toasts() {
  const t = useTranslations('demoSaas');
  const { toasts, dismissToast } = useDemo();
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 left-4 right-4 z-[70] flex flex-col items-end gap-2 sm:left-auto sm:w-96" aria-live="polite">
      {toasts.map((x) => (
        <div
          key={x.id}
          className={`pointer-events-auto flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-sm shadow-lg ${
            x.tone === 'error'
              ? 'border-red-300 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-100'
              : x.tone === 'warn'
                ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100'
                : 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100'
          }`}
        >
          <span className="flex-1">{t(x.key, x.params)}</span>
          <button type="button" onClick={() => dismissToast(x.id)} className="rounded p-0.5 opacity-70 hover:opacity-100" aria-label={t('common.close')}>
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
