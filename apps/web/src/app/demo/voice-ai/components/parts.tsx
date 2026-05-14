'use client';

import { useTranslations } from 'next-intl';
import { CheckCircleIcon, ShieldCheckIcon, LanguageIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { Sentiment, Turn } from './types';
import { SENTIMENT_TONE, fmtTime, TURNS } from './types';

export function TranscriptTurn({
  turn, t, index, totalDur,
}: {
  turn: Turn;
  t: ReturnType<typeof useTranslations>;
  index: number;
  totalDur: number;
}) {
  const isAI = turn.speaker === 'ai';
  const isHuman = turn.speaker === 'human';
  const label = isAI ? t('transcript.ai') : isHuman ? t('transcript.human') : t('transcript.you');
  const ts = Math.max(0, totalDur - (TURNS.length - index) * 10);
  return (
    <div className={cn('flex gap-3', isAI || isHuman ? 'flex-row' : 'flex-row-reverse')}>
      <div className={cn(
        'h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
        isAI ? 'bg-gradient-to-br from-cyan-500 to-violet-600 text-white' :
        isHuman ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
        'bg-slate-700 text-slate-200'
      )}>{isAI ? 'AI' : isHuman ? 'H' : 'C'}</div>
      <div className={cn(
        'flex-1 max-w-[80%] rounded-2xl px-3.5 py-2.5 border',
        isAI ? 'bg-violet-500/10 border-violet-500/20 rounded-tl-sm'
          : isHuman ? 'bg-amber-500/10 border-amber-500/20 rounded-tl-sm'
          : 'bg-slate-800/70 border-slate-700/60 rounded-tr-sm'
      )}>
        <div className="flex items-center justify-between gap-2 mb-1 text-[10px] text-slate-400">
          <span className="font-medium text-slate-300">{label}</span>
          <span className="font-mono">{fmtTime(ts)}</span>
        </div>
        <div className="text-sm text-slate-100 leading-relaxed">
          {t(`turns.${turn.textKey}`, { card: '****1234' })}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] border', SENTIMENT_TONE[turn.sentiment])}>
            {t(`sentiment.${turn.sentiment}`)}
          </span>
          {turn.redacted && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500/15 text-rose-300 border border-rose-500/30">
              <ShieldCheckIcon className="h-2.5 w-2.5" /> {t('transcript.redacted')}
            </span>
          )}
          {turn.codeSwitch && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              <LanguageIcon className="h-2.5 w-2.5" /> {t('transcript.codeSwitch')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function SentimentGauge({ value, t }: { value: Sentiment; t: ReturnType<typeof useTranslations> }) {
  const pct = value === 'positive' ? 85 : value === 'neutral' ? 50 : 18;
  const color = value === 'positive' ? 'from-emerald-500 to-emerald-300'
    : value === 'neutral' ? 'from-cyan-500 to-cyan-300'
    : 'from-rose-500 to-rose-300';
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1.5">{t('sentiment.current')}</div>
      <div className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs border', SENTIMENT_TONE[value])}>
        {t(`sentiment.${value}`)}
      </div>
      <div className="mt-3 relative h-2 w-full rounded-full bg-gradient-to-r from-rose-500/30 via-cyan-500/30 to-emerald-500/30 overflow-hidden">
        <div className={cn('absolute inset-y-0 left-0 rounded-full bg-gradient-to-r', color)} style={{ width: `${pct}%` }} />
        <div className="absolute -top-0.5 w-1 h-3 bg-white rounded-full shadow" style={{ left: `calc(${pct}% - 2px)` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-slate-500">
        <span>{t('sentiment.negative')}</span>
        <span>{t('sentiment.neutral')}</span>
        <span>{t('sentiment.positive')}</span>
      </div>
    </div>
  );
}

export function ProviderGroup({
  label, options, value, onChange,
}: {
  label: string;
  options: { id: string; label: string; meta?: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-300 mb-2">{label}</div>
      <div className="grid grid-cols-1 gap-1.5">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={cn(
              'flex items-center justify-between px-3 py-2 rounded-lg text-xs border transition-colors text-left',
              value === o.id
                ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
                : 'border-slate-700 bg-slate-800/40 text-slate-300 hover:bg-slate-800/70'
            )}
          >
            <span className="font-medium">{o.label}</span>
            {o.meta && <span className="font-mono text-[10px] text-slate-500">{o.meta}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md bg-slate-800/40 border border-slate-700/40 px-2.5 py-1.5">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-100 font-medium text-right truncate">{value}</span>
    </div>
  );
}

export function ComplianceRow({ title, desc, highlight = false }: { title: string; desc: string; highlight?: boolean }) {
  return (
    <li className={cn(
      'flex items-start gap-2.5 rounded-lg border p-2.5',
      highlight ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-700/60 bg-slate-800/30'
    )}>
      <CheckCircleIcon className={cn('h-4 w-4 mt-0.5 shrink-0', highlight ? 'text-emerald-400' : 'text-cyan-400')} />
      <div>
        <div className="text-slate-100 font-medium">{title}</div>
        <div className="text-slate-500">{desc}</div>
      </div>
    </li>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-800/30 px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-base font-bold text-white">{value}</div>
    </div>
  );
}

export function KpiCard({ label, sub, value, tone }: { label: string; sub: string; value: string; tone: 'emerald' | 'cyan' | 'violet' | 'fuchsia' | 'amber' }) {
  const tones = {
    emerald: 'from-emerald-500/20 to-emerald-500/0 border-emerald-500/30',
    cyan:    'from-cyan-500/20 to-cyan-500/0 border-cyan-500/30',
    violet:  'from-violet-500/20 to-violet-500/0 border-violet-500/30',
    fuchsia: 'from-fuchsia-500/20 to-fuchsia-500/0 border-fuchsia-500/30',
    amber:   'from-amber-500/20 to-amber-500/0 border-amber-500/30',
  } as const;
  return (
    <div className={cn('rounded-xl border bg-gradient-to-br p-3', tones[tone])}>
      <div className="text-xs text-slate-300">{label}</div>
      <div className="text-2xl font-bold text-white mt-1">{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}
