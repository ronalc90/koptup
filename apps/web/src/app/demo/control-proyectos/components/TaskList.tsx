'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDownTrayIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { STATUS_ORDER, downloadBlob, isOverdue, loggedHours, memberById, slugify, toCSV } from '../lib/engine';
import { useDemo } from '../lib/store';
import type { Task } from '../lib/types';
import { Empty, Initials, PriorityChip, STATUS_DOT, btn, card, useFmt, useStatusLabel } from './ui';

type SortKey = 'title' | 'status' | 'assignee' | 'milestone' | 'due' | 'priority' | 'hours';
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

export default function TaskList({ tasks }: { tasks: Task[] }) {
  const t = useTranslations('demoProjectsPro.list');
  const tp = useTranslations('demoProjectsPro.priority');
  const f = useFmt();
  const { ws, state, today, openTask } = useDemo();
  const label = useStatusLabel();
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'due', dir: 1 });
  const project = ws.projects.find((p) => p.id === ws.currentProjectId) ?? ws.projects[0];
  const msName = (id: string | null) => ws.milestones.find((m) => m.id === id)?.name ?? '';

  const rows = useMemo(() => {
    const val = (x: Task): string | number => {
      switch (sort.key) {
        case 'title':
          return x.title.toLowerCase();
        case 'status':
          return STATUS_ORDER[x.status];
        case 'assignee':
          return memberById(ws, x.assigneeId)?.name ?? '~';
        case 'milestone':
          return ws.milestones.find((m) => m.id === x.milestoneId)?.start ?? '~';
        case 'priority':
          return PRIORITY_ORDER[x.priority];
        case 'hours':
          return loggedHours(ws, x.id);
        default:
          return x.due;
      }
    };
    return [...tasks].sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir;
    });
  }, [tasks, sort, ws]);

  const exportCsv = () => {
    const head = [t('task'), t('status'), t('assignee'), t('milestone'), t('start'), t('due'), t('priority'), t('estimate'), t('logged'), t('clientVisible')];
    const body = rows.map((x) => [
      x.title,
      label(state.sector, x.status),
      memberById(ws, x.assigneeId)?.name ?? t('unassigned'),
      msName(x.milestoneId),
      x.start,
      x.due,
      tp(x.priority),
      x.estimate,
      loggedHours(ws, x.id),
      x.clientVisible ? t('yes') : t('no'),
    ]);
    downloadBlob(toCSV([head, ...body]), `${t('filePrefix')}-${slugify(project.name)}.csv`, 'text/csv;charset=utf-8');
  };

  const Th = ({ k, children, className = '' }: { k: SortKey; children: ReactNode; className?: string }) => (
    <th className={`text-left px-3 py-2.5 font-semibold ${className}`} aria-sort={sort.key === k ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? (s.dir === 1 ? -1 : 1) : 1 }))}
        className="inline-flex items-center gap-1 uppercase hover:text-slate-800 dark:hover:text-white"
      >
        {children}
        {sort.key === k && (sort.dir === 1 ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />)}
      </button>
    </th>
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">{t('count', { count: rows.length })}</p>
        <button type="button" onClick={exportCsv} className={btn.outline} disabled={rows.length === 0}>
          <ArrowDownTrayIcon className="w-4 h-4" />
          {t('export')}
        </button>
      </div>
      {rows.length === 0 ? (
        <div className={card}>
          <Empty>{t('empty')}</Empty>
        </div>
      ) : (
        <>
          <div className={`${card} overflow-x-auto hidden md:block`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                  <Th k="title">{t('task')}</Th>
                  <Th k="status">{t('status')}</Th>
                  <Th k="assignee">{t('assignee')}</Th>
                  <Th k="milestone" className="hidden lg:table-cell">
                    {t('milestone')}
                  </Th>
                  <Th k="due">{t('due')}</Th>
                  <Th k="priority">{t('priority')}</Th>
                  <Th k="hours">{t('hours')}</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((x) => {
                  const a = memberById(ws, x.assigneeId);
                  const late = isOverdue(x, today);
                  return (
                    <tr key={x.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-3 py-2.5 max-w-xs">
                        <button type="button" onClick={() => openTask(x.id)} className="text-left font-semibold text-slate-900 dark:text-white hover:text-teal-700 dark:hover:text-teal-300">
                          {x.title}
                        </button>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span className={`w-2 h-2 rounded-full ${STATUS_DOT[x.status]}`} aria-hidden="true" />
                          {label(state.sector, x.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {a ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Initials name={a.name} size="xs" />
                            {a.name}
                          </span>
                        ) : (
                          <span className="italic text-slate-400">{t('unassigned')}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-400 hidden lg:table-cell">{msName(x.milestoneId)}</td>
                      <td className={`px-3 py-2.5 whitespace-nowrap text-xs ${late ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}>
                        {f.date(x.due, 'short')}
                        {late && ` · ${t('late')}`}
                      </td>
                      <td className="px-3 py-2.5">
                        <PriorityChip p={x.priority} />
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                        {f.num(loggedHours(ws, x.id))} / {f.num(x.estimate)} h
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ul className="md:hidden space-y-2">
            {rows.map((x) => {
              const a = memberById(ws, x.assigneeId);
              const late = isOverdue(x, today);
              return (
                <li key={x.id}>
                  <button type="button" onClick={() => openTask(x.id)} className={`${card} w-full text-left p-3`}>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{x.title}</p>
                    <span className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${STATUS_DOT[x.status]}`} aria-hidden="true" />
                        {label(state.sector, x.status)}
                      </span>
                      <PriorityChip p={x.priority} />
                      <span className={late ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>{f.date(x.due, 'short')}</span>
                      <span>{a?.name ?? t('unassigned')}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
