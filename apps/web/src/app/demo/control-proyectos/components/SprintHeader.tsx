'use client';

import { useTranslations } from 'next-intl';

const IDEAL = [40, 32, 24, 16, 8, 0];
const ACTUAL = [40, 35, 30, 22, 14, 9];
const MAX = 40;

export default function SprintHeader() {
  const t = useTranslations('demoProjectsPro.sprints');

  const w = 160;
  const h = 44;
  const toX = (i: number) => (i / (IDEAL.length - 1)) * w;
  const toY = (v: number) => h - (v / MAX) * h;
  const idealPath = IDEAL.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(v)}`).join(' ');
  const actualPath = ACTUAL.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(v)}`).join(' ');

  return (
    <div className="flex flex-wrap items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40 border-b border-teal-100 dark:border-teal-900/60">
      <div className="flex flex-col">
        <span className="text-[11px] uppercase tracking-wide text-teal-700/70 dark:text-teal-300/70 font-semibold">
          {t('currentSprint')}
        </span>
        <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
          {t('daysRemaining')}
        </span>
      </div>

      <div className="hidden sm:flex flex-col items-start min-w-[180px]">
        <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-semibold mb-0.5">
          {t('burndown')}
        </span>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
          <path d={idealPath} fill="none" stroke="rgb(148, 163, 184)" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d={actualPath} fill="none" stroke="rgb(13, 148, 136)" strokeWidth="2" />
        </svg>
      </div>

      <div className="flex gap-2 sm:gap-3 ml-auto flex-wrap">
        <SprintKpi label={t('velocity')} value={t('velocityValue')} />
        <SprintKpi label={t('storyPoints')} value="31/40" />
        <SprintKpi label={t('capacity')} value="86%" tone="ok" />
      </div>
    </div>
  );
}

function SprintKpi({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'warn' }) {
  const toneClass =
    tone === 'ok'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'warn'
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-slate-900 dark:text-white';
  return (
    <div className="px-3 py-1.5 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
      <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400 leading-none mb-0.5">
        {label}
      </p>
      <p className={`text-sm font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}
