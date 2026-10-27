'use client';

import { useTranslations } from 'next-intl';
import { ArrowPathIcon, PauseCircleIcon } from '@heroicons/react/24/outline';
import { useDemo } from '../lib/store';
import { pct, type Loc } from '../lib/format';
import type { LogLine, SourceId } from '../lib/types';
import { btn } from './ui';

export function logText(t: ReturnType<typeof useTranslations>, l: LogLine, loc: Loc): string {
  const p: Record<string, string | number> = { ...(l.params ?? {}) };
  if (typeof p.quality === 'number') p.quality = pct(p.quality, loc, Number.isInteger(p.quality) ? 0 : 1);
  return t(`log.${l.key}`, p);
}

export const LOG_COLORS: Record<LogLine['level'], string> = {
  info: 'text-secondary-300',
  ok: 'text-emerald-300',
  warn: 'text-amber-300',
  demo: 'text-sky-300',
};

/** Avisos comunes a todas las pestañas: ejecución en curso, configuración sin aplicar y fuente pausada. */
export function RunNotice({ sourceId }: { sourceId: SourceId }) {
  const t = useTranslations('demoScraping');
  const { s, loc, running, runNow, pendingConfig, update } = useDemo();
  const paused = s.paused.includes(sourceId);

  if (running && running.sourceId === sourceId) {
    const lines = running.result.log.slice(0, running.shown);
    return (
      <div className="rounded-xl border border-sky-500/30 bg-black p-3" role="status" aria-live="polite">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-sky-200">
          <ArrowPathIcon className="h-4 w-4 animate-spin" />
          {t('run.inProgress', { source: t(`sources.${sourceId}.name`) })}
        </div>
        <ol className="space-y-0.5 font-mono text-[11px] leading-relaxed">
          {lines.map((l, i) => (
            <li key={i} className={LOG_COLORS[l.level]}>
              <span className="mr-2 text-secondary-600">{String(i + 1).padStart(2, '0')}</span>
              {logText(t, l, loc)}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <>
      {paused && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-3 py-2 text-sm text-yellow-100">
          <span className="flex items-center gap-2">
            <PauseCircleIcon className="h-4 w-4" />
            {t('run.pausedNotice')}
          </span>
          <button type="button" className={btn.secondary} onClick={() => update((p) => ({ ...p, paused: p.paused.filter((x) => x !== sourceId) }))}>
            {t('actions.resume')}
          </button>
        </div>
      )}
      {pendingConfig(sourceId) && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-500/30 bg-sky-500/5 px-3 py-2 text-sm text-sky-100">
          <span>{t('run.pendingConfig')}</span>
          <button type="button" className={btn.primary} onClick={() => runNow(sourceId)} disabled={!!running || paused}>
            <ArrowPathIcon className="h-4 w-4" />
            {t('actions.runNow')}
          </button>
        </div>
      )}
    </>
  );
}
