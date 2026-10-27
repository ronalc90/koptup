'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ArrowTrendingUpIcon, ArrowUturnLeftIcon, BookmarkSquareIcon, ClockIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { diffMinutes, fmtAgo, fmtDate, fmtDec, fmtInt, nextMonthStart } from '../lib/format';
import { monthUsage, useAutomation } from '../lib/store';
import { ConfirmDialog, btnLink, focusRing } from './ui';

/** Límite de ejecuciones del plan Básico del catálogo (automatizacion-workflows). */
export const PLAN_LIMIT = 10000;

export function UsageCard() {
  const t = useTranslations('demoAutomation.usage');
  const { s, now, loc, setMinutes } = useAutomation();
  const [open, setOpen] = useState(false);
  const usage = monthUsage(s, now);
  const pct = Math.min(100, (usage.runs / PLAN_LIMIT) * 100);
  const renew = nextMonthStart(now);

  return (
    <section className="rounded-lg border border-secondary-800 bg-secondary-900/60 p-3" aria-labelledby="usage-title">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <ArrowTrendingUpIcon className="h-3.5 w-3.5 shrink-0 text-primary-400" />
          <h3 id="usage-title" className="truncate text-xs font-semibold text-secondary-100">
            {t('title')}
          </h3>
        </div>
        <span className="shrink-0 rounded-full bg-primary-500/15 px-2 py-0.5 text-[10px] font-semibold text-primary-200">{t('plan')}</span>
      </div>
      <div className="mb-0.5 flex justify-between text-[11px]">
        <span className="text-secondary-400">{t('runs')}</span>
        <span className="font-mono text-secondary-200">
          {fmtInt(usage.runs, loc)} / {fmtInt(PLAN_LIMIT, loc)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary-800" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={t('runs')}>
        <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <span className="text-[11px] text-secondary-400">{t('savings')}</span>
        <span className="text-lg font-bold text-emerald-300">{t('hours', { hours: fmtInt(usage.hours, loc) })}</span>
      </div>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className={btnLink}>
        {open ? t('hideHow') : t('how')}
      </button>
      {open && (
        <div className="mt-2 space-y-1.5 rounded-md border border-secondary-800 bg-secondary-950 p-2">
          <p className="text-[10.5px] leading-snug text-secondary-400">{t('formula')}</p>
          {usage.rows.map((r) => (
            <div key={r.wf.id} className="flex items-center gap-2 text-[11px]">
              <span className="min-w-0 flex-1 truncate text-secondary-300" title={r.wf.name}>
                {r.wf.name}
              </span>
              <span className="shrink-0 font-mono text-secondary-400">{fmtInt(r.ok, loc)} ×</span>
              <label className="flex shrink-0 items-center gap-1 text-secondary-400">
                <span className="sr-only">{t('minutesFor', { name: r.wf.name })}</span>
                <input
                  type="number"
                  min={0}
                  max={240}
                  value={r.wf.minutesPerRun}
                  onChange={(e) => setMinutes(r.wf.id, Number(e.target.value))}
                  className="w-12 rounded border border-secondary-700 bg-secondary-900 px-1 py-0.5 text-right font-mono text-[11px] text-secondary-100 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                min
              </label>
              <span className="w-14 shrink-0 text-right font-mono text-emerald-300">{fmtDec(r.hours, loc)} h</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-secondary-400">
        <span className="flex items-center gap-1">
          <ClockIcon className="h-3 w-3" />
          {t('renew', { date: fmtDate(renew.day, loc), days: renew.daysLeft })}
        </span>
        <Link href="/services#otras-soluciones" className={btnLink}>
          {t('plans')} →
        </Link>
      </div>
    </section>
  );
}

export function VersionsCard({ onSave }: { onSave: () => void }) {
  const t = useTranslations('demoAutomation.versions');
  const { wf, dirty, now, loc, restoreVersion, toast, live } = useAutomation();
  const [restoring, setRestoring] = useState<number | null>(null);
  const versions = [...wf.versions].reverse();
  const current = !dirty ? wf.versions[wf.versions.length - 1]?.n : undefined;

  return (
    <section className="rounded-lg border border-secondary-800 bg-secondary-900/60 p-3" aria-labelledby="versions-title">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 id="versions-title" className="text-xs font-semibold text-secondary-100">
          {t('title')}
        </h3>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${dirty ? 'bg-amber-500/15 text-amber-200' : 'bg-emerald-500/15 text-emerald-200'}`}>
          {dirty ? t('unsavedShort') : t('saved', { n: current ?? 0 })}
        </span>
      </div>
      {versions.length === 0 ? (
        <p className="text-[11px] text-secondary-400">{t('empty')}</p>
      ) : (
        <ul className="max-h-[132px] space-y-1.5 overflow-y-auto pr-1">
          {versions.map((v) => (
            <li key={v.n} className="flex items-start gap-2 text-[11px]">
              <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${v.n === current ? 'bg-primary-400 ring-2 ring-primary-400/30' : 'bg-secondary-600'}`} />
              <span className="w-6 shrink-0 font-mono text-secondary-400">v{v.n}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-secondary-200" title={v.note}>
                  {v.note}
                </span>
                <span className="flex flex-wrap items-center gap-x-2 text-[10px] text-secondary-500">
                  <span>
                    {v.author} · {fmtAgo(Math.max(0, diffMinutes(v.at, now)), loc)} · {t('stepsCount', { count: v.steps.length })}
                  </span>
                  {v.n !== current && (
                    <button type="button" disabled={live.running} onClick={() => setRestoring(v.n)} className={`${btnLink} !text-[10px]`} aria-label={t('restoreAria', { n: v.n })}>
                      <ArrowUturnLeftIcon className="h-3 w-3" />
                      {t('restore')}
                    </button>
                  )}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={onSave}
        disabled={!dirty || live.running}
        className={`mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded border border-primary-500/40 py-1 text-[11px] font-semibold text-primary-200 transition-colors hover:bg-primary-500/10 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
      >
        <BookmarkSquareIcon className="h-3.5 w-3.5" />
        {dirty ? t('save') : t('nothingToSave')}
      </button>
      <ConfirmDialog
        open={restoring !== null}
        title={t('restoreTitle', { n: restoring ?? 0 })}
        body={dirty ? t('restoreBodyDirty') : t('restoreBody')}
        confirmLabel={t('restore')}
        onClose={() => setRestoring(null)}
        onConfirm={() => {
          if (restoring !== null) {
            restoreVersion(restoring);
            toast(t('restoredToast', { n: restoring }));
          }
        }}
      />
    </section>
  );
}

export function ReviewCard({ onOpen }: { onOpen: () => void }) {
  const t = useTranslations('demoAutomation.reviewCard');
  const { s, wf, now } = useAutomation();
  const open = s.reviews.filter((r) => r.status === 'open');
  const mine = open.filter((r) => r.workflowId === wf.id).length;
  const failed24 = s.runs.filter((r) => r.status === 'failed' && diffMinutes(r.startedAt, now) <= 1440).length;

  return (
    <section className="rounded-lg border border-secondary-800 bg-secondary-900/60 p-3" aria-labelledby="review-title">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldExclamationIcon className="h-3.5 w-3.5 text-amber-400" />
          <h3 id="review-title" className="text-xs font-semibold text-secondary-100">
            {t('title')}
          </h3>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${open.length ? 'bg-amber-500/15 text-amber-200' : 'bg-emerald-500/15 text-emerald-200'}`}>{open.length}</span>
      </div>
      <div className="mb-2 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-md border border-secondary-800 bg-secondary-950 p-2">
          <p className="text-lg font-bold text-amber-300">{mine}</p>
          <p className="text-[10px] leading-tight text-secondary-400">{t('thisFlow')}</p>
        </div>
        <div className="rounded-md border border-secondary-800 bg-secondary-950 p-2">
          <p className="text-lg font-bold text-rose-300">{failed24}</p>
          <p className="text-[10px] leading-tight text-secondary-400">{t('failed24')}</p>
        </div>
      </div>
      <p className="mb-2 text-[10.5px] leading-snug text-secondary-400">{t('hint')}</p>
      <button
        type="button"
        onClick={onOpen}
        className={`w-full rounded border border-amber-500/40 py-1 text-[11px] font-semibold text-amber-200 transition-colors hover:bg-amber-500/10 ${focusRing}`}
      >
        {t('open', { count: open.length })}
      </button>
    </section>
  );
}
