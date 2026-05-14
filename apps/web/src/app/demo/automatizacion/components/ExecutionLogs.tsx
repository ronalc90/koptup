'use client';

import { Fragment, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import type { RunRecord } from './types';

interface Props {
  runs: RunRecord[];
}

const STATUS_ICONS = {
  success: CheckCircleIcon,
  failed: XCircleIcon,
  retry: ArrowPathIcon,
  running: ArrowPathIcon,
} as const;

const STATUS_STYLES = {
  success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  failed: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  retry: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  running: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
} as const;

export default function ExecutionLogs({ runs }: Props) {
  const t = useTranslations('demoAutomation.logs');
  const tn = useTranslations('demoAutomation.canvas.nodes');
  const [expanded, setExpanded] = useState<string | null>(runs[0]?.id ?? null);

  return (
    <div className="flex flex-col h-full bg-secondary-950">
      <div className="px-4 py-2 border-b border-secondary-800 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-secondary-300 uppercase tracking-wider">
            {t('title')}
          </h3>
          <p className="text-[11px] text-secondary-500">{t('subtitle')}</p>
        </div>
        <span className="text-[11px] font-mono text-secondary-500">
          {runs.length} runs
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="bg-secondary-900/60 sticky top-0">
            <tr className="text-left text-[10px] uppercase tracking-wider text-secondary-500">
              <th className="px-3 py-2 w-6"></th>
              <th className="px-3 py-2">{t('columns.id')}</th>
              <th className="px-3 py-2">{t('columns.started')}</th>
              <th className="px-3 py-2">{t('columns.duration')}</th>
              <th className="px-3 py-2">{t('columns.status')}</th>
              <th className="px-3 py-2">{t('columns.trigger')}</th>
              <th className="px-3 py-2 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => {
              const isOpen = expanded === run.id;
              const Icon = STATUS_ICONS[run.status];
              return (
                <Fragment key={run.id}>
                  <tr
                    className={`border-t border-secondary-800 hover:bg-secondary-900/40 ${
                      isOpen ? 'bg-secondary-900/30' : ''
                    }`}
                  >
                    <td className="px-3 py-2">
                      <button
                        onClick={() => setExpanded(isOpen ? null : run.id)}
                        className="text-secondary-500 hover:text-white"
                      >
                        {isOpen ? (
                          <ChevronDownIcon className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRightIcon className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-2 font-mono text-secondary-300">
                      {run.id}
                    </td>
                    <td className="px-3 py-2 text-secondary-400 font-mono">
                      {run.startedAt}
                    </td>
                    <td className="px-3 py-2 font-mono text-secondary-300">
                      {run.durationMs} ms
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${
                          STATUS_STYLES[run.status]
                        }`}
                      >
                        <Icon
                          className={`h-3 w-3 ${
                            run.status === 'running' || run.status === 'retry'
                              ? 'animate-spin'
                              : ''
                          }`}
                        />
                        {t(`statuses.${run.status}`)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-secondary-400">
                      {run.trigger}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => setExpanded(isOpen ? null : run.id)}
                        className="text-[10px] text-primary-400 hover:text-primary-300"
                      >
                        {isOpen ? t('collapse') : t('expand')}
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-secondary-950">
                      <td colSpan={7} className="px-3 py-3">
                        <div className="space-y-1.5 max-w-3xl">
                          {run.steps.map((step, i) => {
                            const ss = STATUS_STYLES[step.status];
                            const SIcon = STATUS_ICONS[step.status];
                            return (
                              <div
                                key={i}
                                className="flex items-center gap-2 text-[11px] font-mono"
                              >
                                <span className="text-secondary-600 w-10">
                                  {t('step')} {i + 1}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border ${ss}`}
                                >
                                  <SIcon className="h-2.5 w-2.5" />
                                </span>
                                <span className="text-secondary-300 flex-1">
                                  {tn(step.nodeId)}
                                </span>
                                {/* mini bar */}
                                <div className="flex-1 max-w-[200px] h-1.5 bg-secondary-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-primary-500 to-emerald-400"
                                    style={{
                                      width: `${Math.min(100, (step.durationMs / 2000) * 100)}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-secondary-500 w-16 text-right">
                                  {step.durationMs} {t('stepDuration')}
                                </span>
                                <button className="text-secondary-500 hover:text-primary-400">
                                  <EyeIcon className="h-3 w-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
