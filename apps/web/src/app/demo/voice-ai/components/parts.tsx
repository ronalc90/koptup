'use client';

import type { ReactNode } from 'react';
import type { useTranslations } from 'next-intl';
import { CheckCircleIcon, ClockIcon, MinusCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { Sentiment } from './types';
import { SENTIMENT_TONE } from './types';

export type T = ReturnType<typeof useTranslations>;

export function PanelTitle({ icon, title, subtitle, right }: { icon: ReactNode; title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
      <div className="min-w-0">
        <h2 className="font-semibold text-white flex items-center gap-2 text-base">
          {icon}
          {title}
        </h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function SentimentPill({ value, t }: { value: Sentiment; t: T }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border', SENTIMENT_TONE[value])}>
      {t(`sentiment.${value}`)}
    </span>
  );
}

export function SentimentGauge({ value, t }: { value: Sentiment; t: T }) {
  const pct = value === 'positive' ? 85 : value === 'neutral' ? 50 : 18;
  const color =
    value === 'positive' ? 'from-emerald-500 to-emerald-300' : value === 'neutral' ? 'from-cyan-500 to-cyan-300' : 'from-rose-500 to-rose-300';
  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
        {t('sentiment.current')}
        <SentimentPill value={value} t={t} />
      </div>
      <div className="mt-3 relative h-2 w-full rounded-full bg-gradient-to-r from-rose-500/30 via-cyan-500/30 to-emerald-500/30 overflow-hidden">
        <div className={cn('absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all duration-500', color)} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-slate-500">
        <span>{t('sentiment.negative')}</span>
        <span>{t('sentiment.neutral')}</span>
        <span>{t('sentiment.positive')}</span>
      </div>
    </div>
  );
}

export function ContextRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md bg-slate-800/40 border border-slate-700/40 px-2.5 py-1.5">
      <span className="text-slate-400 shrink-0">{label}</span>
      <span className="text-slate-100 font-medium text-right min-w-0 break-words">{value}</span>
    </div>
  );
}

export type CheckState = 'ok' | 'pending' | 'na';

export function ComplianceRow({ title, desc, state, label }: { title: string; desc: string; state: CheckState; label: string }) {
  const Icon = state === 'ok' ? CheckCircleIcon : state === 'pending' ? ClockIcon : MinusCircleIcon;
  return (
    <li
      className={cn(
        'flex items-start gap-2.5 rounded-lg border p-2.5',
        state === 'ok' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-700/60 bg-slate-800/30',
      )}
    >
      <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', state === 'ok' ? 'text-emerald-400' : state === 'pending' ? 'text-amber-300' : 'text-slate-500')} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="text-slate-100 font-medium">{title}</span>
          <span
            className={cn(
              'shrink-0 text-[10px] uppercase tracking-wide',
              state === 'ok' ? 'text-emerald-300' : state === 'pending' ? 'text-amber-300' : 'text-slate-500',
            )}
          >
            {label}
          </span>
        </div>
        <div className="text-slate-400">{desc}</div>
      </div>
    </li>
  );
}

export function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-800/30 px-2.5 py-2 min-w-0">
      <div className="text-[10px] uppercase tracking-wide text-slate-400 leading-tight break-words">
        {label}
      </div>
      <div className="text-base font-bold text-white tabular-nums">{value}</div>
    </div>
  );
}

export function KpiCard({
  label,
  sub,
  value,
  tone,
}: {
  label: string;
  sub: string;
  value: string;
  tone: 'emerald' | 'cyan' | 'violet' | 'fuchsia' | 'amber' | 'sky';
}) {
  const tones = {
    emerald: 'from-emerald-500/20 to-emerald-500/0 border-emerald-500/30',
    cyan: 'from-cyan-500/20 to-cyan-500/0 border-cyan-500/30',
    violet: 'from-violet-500/20 to-violet-500/0 border-violet-500/30',
    fuchsia: 'from-fuchsia-500/20 to-fuchsia-500/0 border-fuchsia-500/30',
    amber: 'from-amber-500/20 to-amber-500/0 border-amber-500/30',
    sky: 'from-sky-500/20 to-sky-500/0 border-sky-500/30',
  } as const;
  return (
    <div className={cn('rounded-xl border bg-gradient-to-br p-3 min-w-0', tones[tone])}>
      <div className="text-xs text-slate-300">{label}</div>
      <div className="text-2xl font-bold text-white mt-1 tabular-nums">{value}</div>
      <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{sub}</div>
    </div>
  );
}

/** Pestañas accesibles (role=tab + aria-selected). */
export function Tabs<K extends string>({
  value,
  onChange,
  items,
  label,
}: {
  value: K;
  onChange: (k: K) => void;
  items: { key: K; label: string }[];
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex rounded-lg border border-slate-700 p-0.5 bg-slate-900/60">
      {items.map((it) => (
        <button
          key={it.key}
          role="tab"
          type="button"
          aria-selected={value === it.key}
          onClick={() => onChange(it.key)}
          className={cn(
            'px-3 py-1 text-xs rounded-md transition-colors',
            value === it.key ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400 hover:text-slate-200',
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
