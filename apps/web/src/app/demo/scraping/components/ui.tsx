'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDownTrayIcon, ChevronUpDownIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cop, date as fmtDate, num, pct, type Loc } from '../lib/format';
import type { CellValue, Column, Row } from '../lib/types';

export type T = ReturnType<typeof useTranslations>;

export function Panel({ children, className = '', id }: { children: ReactNode; className?: string; id?: string }) {
  return <div id={id} className={`scroll-mt-56 rounded-xl border border-secondary-800 bg-secondary-900 p-4 ${className}`}>{children}</div>;
}

export function Section({ title, subtitle, children, right, id }: { title: string; subtitle?: ReactNode; children: ReactNode; right?: ReactNode; id?: string }) {
  return (
    <section id={id} className="scroll-mt-56 space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-sm text-secondary-400 max-w-3xl">{subtitle}</p>}
        </div>
        {right}
      </header>
      {children}
    </section>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${value ? 'bg-emerald-500' : 'bg-secondary-700'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export function Chip({ active, onClick, children, title }: { active: boolean; onClick: () => void; children: ReactNode; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${active ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-200' : 'border-secondary-700 text-secondary-400 hover:text-white'}`}
    >
      {children}
    </button>
  );
}

export const btn = {
  primary: 'inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50',
  secondary: 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-secondary-700 px-3 py-1.5 text-sm text-secondary-200 hover:border-secondary-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50',
  ghost: 'inline-flex items-center justify-center gap-1 rounded-md px-2 py-1 text-xs text-secondary-300 hover:bg-secondary-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50',
  danger: 'inline-flex items-center justify-center gap-1 rounded-md px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50',
};

export const inputCls = 'w-full rounded-md border border-secondary-700 bg-secondary-950 px-2.5 py-1.5 text-sm text-white outline-none placeholder:text-secondary-500 focus:border-emerald-500';

export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const t = useTranslations('demoScraping');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-secondary-700 bg-secondary-900 p-5 text-secondary-100 shadow-2xl outline-none sm:rounded-2xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-secondary-400 hover:bg-secondary-800 hover:text-white" aria-label={t('actions.close')}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function colLabel(c: Column, t: T): string {
  return c.label ?? t(`columns.${c.labelKey}`);
}

export function formatCell(c: Column, v: CellValue, t: T, loc: Loc): string {
  if (v === null || v === undefined || v === '') return '—';
  switch (c.type) {
    case 'price':
      return typeof v === 'number' ? cop(v, loc) : String(v);
    case 'number':
      return typeof v === 'number' ? num(v, loc, Number.isInteger(v) ? 0 : 2) : String(v);
    case 'percent':
      return typeof v === 'number' ? pct(v, loc) : String(v);
    case 'date':
      return /^\d{4}-\d{2}-\d{2}/.test(String(v)) ? fmtDate(String(v), loc) : String(v);
    case 'status':
      return c.valueKey ? t(`values.${c.valueKey}.${v}`) : String(v);
    default:
      return String(v);
  }
}

/** Valor para CSV/JSON: números sin separadores, fechas ISO y estados traducidos. */
export function exportCell(c: Column, v: CellValue, t: T): string | number | null {
  if (v === null || v === undefined || v === '') return null;
  if (c.type === 'status' && c.valueKey) return t(`values.${c.valueKey}.${v}`);
  return v;
}

export function buildCsv(columns: Column[], rows: Row[], t: T, loc: Loc): string {
  const sep = loc === 'es' ? ';' : ',';
  const esc = (x: string | number | null) => {
    if (x === null) return '';
    let s = typeof x === 'number' ? (loc === 'es' ? String(x).replace('.', ',') : String(x)) : x;
    // Evita que Excel interprete el texto como fórmula.
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /["\n\r;,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = columns.map((c) => esc(colLabel(c, t))).join(sep);
  const body = rows.map((r) => columns.map((c) => esc(exportCell(c, r[c.key], t))).join(sep));
  return `﻿${[head, ...body].join('\r\n')}\r\n`;
}

export function buildJson(columns: Column[], rows: Row[], t: T): string {
  return JSON.stringify(rows.map((r) => Object.fromEntries(columns.map((c) => [colLabel(c, t), exportCell(c, r[c.key], t)]))), null, 2);
}

export function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* sigue con el método alterno */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

interface TableProps {
  columns: Column[];
  rows: Row[];
  t: T;
  loc: Loc;
  rowKey: (r: Row, i: number) => string;
  renderCell?: (c: Column, r: Row) => ReactNode | undefined;
  onRowClick?: (r: Row) => void;
  rowLabel?: (r: Row) => string;
  onDownload?: () => void;
  actions?: ReactNode;
  emptyText?: string;
}

/** Tabla con búsqueda y orden por columna (sobre los datos de la última ejecución). */
export function DataTable({ columns, rows, t, loc, rowKey, renderCell, onRowClick, rowLabel, onDownload, actions, emptyText }: TableProps) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = needle
      ? rows.filter((r) => columns.some((c) => formatCell(c, r[c.key], t, loc).toLowerCase().includes(needle)))
      : rows;
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      out = [...out].sort((a, b) => {
        const va = a[sort.key];
        const vb = b[sort.key];
        if (va === vb) return 0;
        if (va === null || va === undefined) return 1;
        if (vb === null || vb === undefined) return -1;
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * sort.dir;
        const sa = col ? formatCell(col, va, t, loc) : String(va);
        const sb = col ? formatCell(col, vb, t, loc) : String(vb);
        return sa.localeCompare(sb, loc) * sort.dir;
      });
    }
    return out;
  }, [rows, columns, q, sort, t, loc]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative w-full min-w-0 sm:w-auto sm:max-w-xs sm:flex-1">
          <span className="sr-only">{t('table.search')}</span>
          <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('table.search')} className={`${inputCls} pl-8`} />
        </label>
        <span className="text-xs text-secondary-400">{t('table.count', { shown: shown.length, total: rows.length })}</span>
        <div className="flex-1" />
        {actions}
        {onDownload && (
          <button type="button" onClick={onDownload} className={btn.secondary}>
            <ArrowDownTrayIcon className="h-4 w-4" />
            {t('actions.downloadCsv')}
          </button>
        )}
      </div>
      <div className="overflow-x-auto rounded-xl border border-secondary-800">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-secondary-950 text-[11px] uppercase tracking-wider text-secondary-400">
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className="whitespace-nowrap px-3 py-2 text-left font-medium">
                  <button
                    type="button"
                    onClick={() => setSort((p) => (p && p.key === c.key ? (p.dir === 1 ? { key: c.key, dir: -1 } : null) : { key: c.key, dir: 1 }))}
                    className="inline-flex items-center gap-1 uppercase hover:text-white"
                    aria-label={t('table.sortBy', { column: colLabel(c, t) })}
                  >
                    {colLabel(c, t)}
                    {c.required && <span className="text-emerald-400" title={t('table.required')}>*</span>}
                    <ChevronUpDownIcon className={`h-3.5 w-3.5 ${sort?.key === c.key ? 'text-emerald-300' : 'text-secondary-600'}`} />
                    {sort?.key === c.key && <span className="sr-only">{sort.dir === 1 ? t('table.asc') : t('table.desc')}</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-800 bg-secondary-900">
            {shown.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-sm text-secondary-500">{emptyText ?? t('table.empty')}</td>
              </tr>
            )}
            {shown.map((r, i) => (
              <tr
                key={rowKey(r, i)}
                className={onRowClick ? 'cursor-pointer hover:bg-secondary-800/40' : ''}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                aria-label={onRowClick && rowLabel ? rowLabel(r) : undefined}
                onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(r); } } : undefined}
              >
                {columns.map((c) => {
                  const custom = renderCell?.(c, r);
                  return (
                    <td
                      key={c.key}
                      className={`px-3 py-2 align-top text-xs ${
                        c.type === 'price' || c.type === 'number' || c.type === 'percent'
                          ? 'whitespace-nowrap text-right font-mono text-secondary-200'
                          : c.type === 'date' || c.type === 'status'
                            ? 'whitespace-nowrap text-secondary-200'
                            : c.wide
                              ? 'min-w-[220px] text-secondary-200'
                              : 'text-secondary-200'
                      }`}
                    >
                      {custom !== undefined ? custom : c.type === 'link' && r[c.key] ? <span className="break-all font-mono text-[11px] text-cyan-300">{String(r[c.key])}</span> : formatCell(c, r[c.key], t, loc)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
