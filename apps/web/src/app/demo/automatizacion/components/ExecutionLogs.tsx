'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  MinusCircleIcon,
  NoSymbolIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { fmtMs, fmtWhen } from '../lib/format';
import { useAutomation } from '../lib/store';
import type { RunRecord, RunStatus, StepStatus } from '../lib/types';
import { JsonBlock, btnGhost, btnLink, downloadText, focusRing } from './ui';

const ICONS = {
  success: CheckCircleIcon,
  retried: CheckCircleIcon,
  retry: ArrowPathIcon,
  failed: XCircleIcon,
  review: ExclamationTriangleIcon,
  stopped: MinusCircleIcon,
  cancelled: NoSymbolIcon,
} as const;

const STYLES: Record<RunStatus | StepStatus, string> = {
  success: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  retried: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  retry: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  failed: 'text-rose-300 bg-rose-500/10 border-rose-500/30',
  review: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  stopped: 'text-secondary-300 bg-secondary-800 border-secondary-700',
  cancelled: 'text-secondary-300 bg-secondary-800 border-secondary-700',
};

const FILTERS = ['all', 'success', 'retried', 'review', 'failed', 'stopped', 'cancelled'] as const;
type Filter = (typeof FILTERS)[number];

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function ExecutionLogs({ onReplay }: { onReplay: (run: RunRecord) => void }) {
  const t = useTranslations('demoAutomation');
  const { s, wf, now, loc, msg, live } = useAutomation();
  const [filter, setFilter] = useState<Filter>('all');
  const runs = useMemo(() => s.runs.filter((r) => r.workflowId === wf.id), [s.runs, wf.id]);
  const visible = filter === 'all' ? runs : runs.filter((r) => r.status === filter);
  const [expanded, setExpanded] = useState<string | null>(runs[0]?.id ?? null);
  const [payload, setPayload] = useState<string | null>(null);

  // La ejecución más reciente se abre sola.
  const latest = runs[0]?.id;
  useEffect(() => {
    if (latest) setExpanded(latest);
  }, [latest]);

  const sourceLabel = (r: RunRecord) =>
    r.source === 'retry' || r.source === 'approve' || r.source === 'replay' ? t(`logs.source.${r.source}`, { run: r.sourceRun ?? '—' }) : t(`logs.source.${r.source}`);

  const exportCsv = () => {
    const header = ['id', 'flujo', 'inicio', 'duracion_ms', 'estado', 'origen', 'version', 'pasos', 'resumen'].map((h) => t(`logs.csv.${h}`));
    const lines = visible.map((r) =>
      [r.id, wf.name, r.startedAt.replace('T', ' '), r.durationMs, t(`logs.statuses.${r.status}`), `${sourceLabel(r)} · ${t(`samples.${r.sampleId}`)}`, r.version === 'draft' ? t('logs.draft') : r.version, r.steps.length, msg(r.summary)]
        .map(csvCell)
        .join(','),
    );
    downloadText(`${t('logs.fileName')}-${wf.id}-${now.slice(0, 10)}.csv`, `﻿${[header.join(','), ...lines].join('\n')}`, 'text/csv;charset=utf-8');
  };

  return (
    <section className="flex h-full min-h-0 flex-col bg-secondary-950" aria-labelledby="logs-title">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-secondary-800 px-3 py-2 sm:px-4">
        <div className="min-w-0">
          <h3 id="logs-title" className="text-xs font-semibold uppercase tracking-wider text-secondary-300">
            {t('logs.title')}
          </h3>
          <p className="truncate text-[11px] text-secondary-400">{t('logs.subtitle', { name: wf.name })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="logs-filter">
            {t('logs.filter')}
          </label>
          <select
            id="logs-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            className="rounded-md border border-secondary-700 bg-secondary-900 px-2 py-1 text-[11px] text-secondary-200 focus:outline-none focus:ring-1 focus:ring-primary-400"
          >
            {FILTERS.map((f) => (
              <option key={f} value={f}>
                {f === 'all' ? t('logs.filterAll') : t(`logs.statuses.${f}`)} ({f === 'all' ? runs.length : runs.filter((r) => r.status === f).length})
              </option>
            ))}
          </select>
          <button type="button" onClick={exportCsv} disabled={!visible.length} className={btnGhost}>
            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
            {t('logs.export')}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {visible.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-secondary-400">{runs.length ? t('logs.noneFiltered') : t('logs.none')}</p>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-secondary-900">
              <tr className="text-left text-[10px] uppercase tracking-wider text-secondary-400">
                <th className="w-6 px-2 py-2 sm:px-3">
                  <span className="sr-only">{t('logs.expand')}</span>
                </th>
                <th className="px-2 py-2 sm:px-3">{t('logs.columns.id')}</th>
                <th className="px-2 py-2 sm:px-3">{t('logs.columns.started')}</th>
                <th className="hidden px-3 py-2 md:table-cell">{t('logs.columns.duration')}</th>
                <th className="px-2 py-2 sm:px-3">{t('logs.columns.status')}</th>
                <th className="hidden px-3 py-2 xl:table-cell">{t('logs.columns.source')}</th>
                <th className="hidden px-3 py-2 md:table-cell">{t('logs.columns.version')}</th>
                <th className="px-2 py-2 sm:px-3">
                  <span className="sr-only">{t('logs.columns.actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((run) => {
                const isOpen = expanded === run.id;
                const Icon = ICONS[run.status];
                const maxStep = Math.max(1, ...run.steps.map((x) => x.durationMs + (x.waitMs ?? 0)));
                return (
                  <Fragment key={run.id}>
                    <tr className={`border-t border-secondary-800 hover:bg-secondary-900/40 ${isOpen ? 'bg-secondary-900/30' : ''}`}>
                      <td className="px-2 py-2 sm:px-3">
                        <button
                          type="button"
                          onClick={() => setExpanded(isOpen ? null : run.id)}
                          aria-expanded={isOpen}
                          aria-label={isOpen ? t('logs.collapse') : t('logs.expand')}
                          className={`rounded text-secondary-400 hover:text-white ${focusRing}`}
                        >
                          {isOpen ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 font-mono text-secondary-200 sm:px-3">{run.id}</td>
                      <td className="whitespace-nowrap px-2 py-2 font-mono text-secondary-300 sm:px-3">{fmtWhen(run.startedAt, now, loc)}</td>
                      <td className="hidden whitespace-nowrap px-3 py-2 font-mono text-secondary-300 md:table-cell">{fmtMs(run.durationMs, loc)}</td>
                      <td className="px-2 py-2 sm:px-3">
                        <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-medium ${STYLES[run.status]}`}>
                          <Icon className="h-3 w-3" />
                          {t(`logs.statuses.${run.status}`)}
                        </span>
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-2 text-secondary-300 xl:table-cell">{sourceLabel(run)}</td>
                      <td className="hidden whitespace-nowrap px-3 py-2 font-mono text-secondary-400 md:table-cell">{run.version === 'draft' ? t('logs.draft') : run.version}</td>
                      <td className="whitespace-nowrap px-2 py-2 text-right sm:px-3">
                        <button type="button" onClick={() => setExpanded(isOpen ? null : run.id)} className={`${btnLink} hidden sm:inline-flex`}>
                          {isOpen ? t('logs.collapse') : t('logs.expand')}
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-secondary-950">
                        <td colSpan={8} className="px-2 py-3 sm:px-4">
                          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-secondary-300">
                            <span className="font-medium text-secondary-100">{msg(run.summary)}</span>
                            <span className="md:hidden">· {fmtMs(run.durationMs, loc)}</span>
                            <span className="xl:hidden">· {sourceLabel(run)}</span>
                            <span>· {t('logs.sample', { name: t(`samples.${run.sampleId}`) })}</span>
                            <button type="button" disabled={live.running} onClick={() => onReplay(run)} className={btnLink}>
                              <ArrowPathIcon className="h-3 w-3" />
                              {t('logs.replay')}
                            </button>
                          </div>
                          <ol className="max-w-4xl space-y-1.5">
                            {run.steps.map((step, i) => {
                              const SIcon = ICONS[step.status];
                              const key = `${run.id}-${i}`;
                              const showing = payload === key;
                              return (
                                <li key={key} className="rounded-md border border-secondary-800/70 p-1.5">
                                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                    <span className="w-12 shrink-0 text-secondary-500">
                                      {t('logs.step')} {i + 1}
                                    </span>
                                    <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 ${STYLES[step.status]}`} title={t(`logs.stepStatus.${step.status}`)}>
                                      <SIcon className="h-3 w-3" />
                                      <span className="sr-only">{t(`logs.stepStatus.${step.status}`)}</span>
                                    </span>
                                    <span className="min-w-0 flex-1 truncate font-medium text-secondary-100">
                                      {step.name}
                                      {step.attempt > 1 ? ` · ${t('logs.attempt', { n: step.attempt })}` : ''}
                                    </span>
                                    <span className="hidden h-1.5 w-28 shrink-0 overflow-hidden rounded-full bg-secondary-800 sm:block">
                                      <span className="block h-full bg-gradient-to-r from-primary-500 to-emerald-400" style={{ width: `${Math.max(3, (step.durationMs / maxStep) * 100)}%` }} />
                                    </span>
                                    <span className="w-16 shrink-0 text-right font-mono text-secondary-400">{fmtMs(step.durationMs, loc)}</span>
                                    <button
                                      type="button"
                                      onClick={() => setPayload(showing ? null : key)}
                                      aria-expanded={showing}
                                      aria-label={showing ? t('logs.hidePayload') : t('logs.viewPayload')}
                                      title={showing ? t('logs.hidePayload') : t('logs.viewPayload')}
                                      className={`rounded p-0.5 text-secondary-400 hover:text-primary-300 ${focusRing}`}
                                    >
                                      {showing ? <EyeSlashIcon className="h-3.5 w-3.5" /> : <EyeIcon className="h-3.5 w-3.5" />}
                                    </button>
                                  </div>
                                  <p className="mt-0.5 pl-14 text-[11px] text-secondary-400">
                                    {msg(step.msg)}
                                    {step.waitMs ? ` ${t('logs.waited', { time: fmtMs(step.waitMs, loc) })}` : ''}
                                  </p>
                                  {showing && (
                                    <div className="mt-1.5 grid gap-2 pl-0 sm:pl-14 lg:grid-cols-2">
                                      <div>
                                        <p className="mb-0.5 text-[10px] uppercase tracking-wider text-secondary-500">{t('inspector.test.input')}</p>
                                        <JsonBlock value={step.input} className="max-h-48" />
                                      </div>
                                      <div>
                                        <p className="mb-0.5 text-[10px] uppercase tracking-wider text-secondary-500">{t('inspector.test.output')}</p>
                                        <JsonBlock value={step.output ?? null} className="max-h-48" />
                                      </div>
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ol>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
