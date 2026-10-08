'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { addDays, diffDays } from '../lib/dates';
import { dateRange, dependencyConflicts, isOverdue } from '../lib/engine';
import { useDemo } from '../lib/store';
import type { ISODate, Task } from '../lib/types';
import { Empty, STATUS_BAR, btn, capitalize, card, useFmt, useStatusLabel } from './ui';

const LABEL_W = 150;
const ROW_H = 34;
const HEAD_H = 40;

export default function Schedule({ tasks }: { tasks: Task[] }) {
  const t = useTranslations('demoProjectsPro.timeline');
  const f = useFmt();
  const { ws, state, today, openTask } = useDemo();
  const label = useStatusLabel();
  const scroller = useRef<HTMLDivElement>(null);
  const milestones = useMemo(() => ws.milestones.filter((m) => m.projectId === ws.currentProjectId).sort((a, b) => a.start.localeCompare(b.start)), [ws.milestones, ws.currentProjectId]);
  const rows = useMemo(() => [...tasks].sort((a, b) => a.start.localeCompare(b.start) || a.due.localeCompare(b.due)), [tasks]);
  const [r0, r1] = dateRange(rows, milestones, today);
  const from = addDays(r0, -2);
  const to = addDays(r1, 3);
  const days = diffDays(from, to) + 1;
  const [scale, setScale] = useState<'day' | 'week'>(days > 70 ? 'week' : 'day');
  const dayW = scale === 'day' ? 26 : 9;
  const width = days * dayW;
  const x = (d: ISODate) => diffDays(from, d) * dayW;
  const rowIndex = new Map(rows.map((r, i) => [r.id, i]));
  const conflicts = dependencyConflicts(ws, rows);
  const conflictSet = new Set(conflicts.map((c) => `${c.pred.id}>${c.task.id}`));
  const msRows = milestones.length > 0 ? 1 : 0;
  const top = HEAD_H + msRows * ROW_H;

  // Marcas de la cabecera: meses y (en escala diaria) días; (en semanal) lunes.
  const ticks: { d: ISODate; label: string; month: boolean }[] = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(from, i);
    const isFirst = d.endsWith('-01') || i === 0;
    if (isFirst) ticks.push({ d, label: capitalize(f.date(d, 'month')), month: true });
    if (scale === 'day' || new Date(`${d}T00:00:00Z`).getUTCDay() === 1) ticks.push({ d, label: String(Number(d.slice(8))), month: false });
  }

  const todayX = x(today);
  const goToday = (behavior: ScrollBehavior = 'smooth') => {
    const el = scroller.current;
    if (el) el.scrollTo({ left: Math.max(0, todayX - (el.clientWidth - LABEL_W) / 2), behavior });
  };
  // Al abrir el cronograma o cambiar la escala, se centra en hoy.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = Math.max(0, todayX - (el.clientWidth - LABEL_W) / 2);
  }, [todayX]);

  if (rows.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <div className={card}>
          <Empty>{t('empty')}</Empty>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">{t('hint')}</p>
        <div className="flex items-center gap-2">
          <div role="group" aria-label={t('scale')} className="inline-flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
            {(['day', 'week'] as const).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={scale === s}
                onClick={() => setScale(s)}
                className={`px-2.5 py-1 text-xs font-medium ${scale === s ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'}`}
              >
                {t(s)}
              </button>
            ))}
          </div>
          <button type="button" className={btn.small} onClick={() => goToday()}>
            {t('today')}
          </button>
        </div>
      </div>

      <div ref={scroller} className={`${card} overflow-x-auto`}>
        <div className="relative" style={{ width: LABEL_W + width, height: top + rows.length * ROW_H + 8 }}>
          {/* Cabecera */}
          <div className="absolute top-0 left-0 border-b border-slate-200 dark:border-slate-800" style={{ width: LABEL_W + width, height: HEAD_H }}>
            <div className="sticky left-0 z-20 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800" style={{ width: LABEL_W }}>
              <p className="text-[11px] font-semibold uppercase text-slate-500 px-2 pt-3">{t('task')}</p>
            </div>
            {ticks.map((tk) => (
              <span
                key={`${tk.d}-${tk.month}`}
                className={`absolute text-[10px] whitespace-nowrap ${tk.month ? 'top-1 font-semibold text-slate-700 dark:text-slate-200' : 'top-5 text-slate-500'}`}
                style={{ left: LABEL_W + x(tk.d) + 2 }}
              >
                {tk.label}
              </span>
            ))}
          </div>

          {/* Línea de hoy */}
          <div className="absolute z-10 w-px bg-red-500" style={{ left: LABEL_W + x(today) + dayW / 2, top: HEAD_H - 6, bottom: 0 }} aria-hidden="true">
            <span className="absolute -top-0.5 left-1 text-[9px] font-bold text-red-600 whitespace-nowrap">{t('todayMark')}</span>
          </div>

          {/* Franja de hitos */}
          {msRows > 0 && (
            <div className="absolute" style={{ top: HEAD_H, left: 0, width: LABEL_W + width, height: ROW_H }}>
              <div className="sticky left-0 z-20 h-full flex items-center px-2 text-[11px] font-semibold text-violet-700 dark:text-violet-300 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800" style={{ width: LABEL_W }}>
                {t('milestones')}
              </div>
              {milestones.map((m) => (
                <div
                  key={m.id}
                  title={`${m.name} · ${f.date(m.start, 'short')} – ${f.date(m.end, 'short')}`}
                  className={`absolute top-1.5 h-[22px] rounded border text-[10px] font-semibold px-1.5 flex items-center overflow-hidden whitespace-nowrap ${m.closed ? 'border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800' : 'border-violet-300 bg-violet-100 text-violet-800 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200'}`}
                  style={{ left: LABEL_W + x(m.start), width: Math.max(dayW, (diffDays(m.start, m.end) + 1) * dayW - 2) }}
                >
                  {m.name}
                </div>
              ))}
            </div>
          )}

          {/* Filas de tareas */}
          {rows.map((task, i) => {
            const late = isOverdue(task, today);
            const left = x(task.start);
            const w = Math.max(dayW, (diffDays(task.start, task.due) + 1) * dayW - 2);
            const color = late ? 'bg-red-500' : STATUS_BAR[task.status];
            return (
              <div key={task.id} className="absolute border-b border-slate-100 dark:border-slate-800" style={{ top: top + i * ROW_H, left: 0, width: LABEL_W + width, height: ROW_H }}>
                <button
                  type="button"
                  onClick={() => openTask(task.id)}
                  title={task.title}
                  className="sticky left-0 z-20 h-full flex items-center px-2 text-xs text-left text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hover:text-teal-700 dark:hover:text-teal-300"
                  style={{ width: LABEL_W }}
                >
                  <span className="truncate">{task.title}</span>
                </button>
                <button
                  type="button"
                  onClick={() => openTask(task.id)}
                  title={`${task.title} · ${f.date(task.start, 'short')} – ${f.date(task.due, 'short')}`}
                  aria-label={t('barAria', { task: task.title, from: f.date(task.start, 'short'), to: f.date(task.due, 'short') })}
                  className={`absolute top-[7px] h-5 rounded ${color} ${task.status === 'done' ? 'opacity-70' : ''} text-white text-[10px] font-medium px-1.5 text-left overflow-hidden whitespace-nowrap hover:ring-2 hover:ring-teal-300`}
                  style={{ left: LABEL_W + left, width: w }}
                >
                  {w > 70 ? task.title : ''}
                </button>
              </div>
            );
          })}

          {/* Flechas de dependencia (fin → inicio) */}
          <svg className="absolute pointer-events-none z-[5]" style={{ left: LABEL_W, top: 0 }} width={width} height={top + rows.length * ROW_H} aria-hidden="true">
            <defs>
              <marker id="gp-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 z" fill="rgb(100,116,139)" />
              </marker>
              <marker id="gp-arrow-warn" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 z" fill="rgb(217,119,6)" />
              </marker>
            </defs>
            {rows.flatMap((task) =>
              task.dependsOn
                .filter((id) => rowIndex.has(id))
                .map((id) => {
                  const pred = rows[rowIndex.get(id)!];
                  const pi = rowIndex.get(id)!;
                  const si = rowIndex.get(task.id)!;
                  const x1 = x(pred.due) + dayW - 2;
                  const y1 = top + pi * ROW_H + ROW_H / 2;
                  const x2 = x(task.start);
                  const y2 = top + si * ROW_H + ROW_H / 2;
                  const warn = conflictSet.has(`${pred.id}>${task.id}`);
                  const d = `M${x1},${y1} H${x1 + 6} V${y2} H${x2 - 1}`;
                  return <path key={`${id}>${task.id}`} d={d} fill="none" stroke={warn ? 'rgb(217,119,6)' : 'rgb(100,116,139)'} strokeWidth="1.5" strokeDasharray={warn ? '4 2' : undefined} markerEnd={`url(#${warn ? 'gp-arrow-warn' : 'gp-arrow'})`} />;
                }),
            )}
          </svg>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-[11px] text-slate-600 dark:text-slate-300">
        {(['todo', 'doing', 'review', 'client', 'done'] as const).map((s) => (
          <span key={s} className="inline-flex items-center gap-1">
            <span className={`w-3 h-2 rounded ${STATUS_BAR[s]}`} aria-hidden="true" />
            {label(state.sector, s)}
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-2 rounded bg-red-500" aria-hidden="true" />
          {t('late')}
        </span>
      </div>

      {conflicts.length > 0 && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-900 dark:text-amber-200">
            <ExclamationTriangleIcon className="w-4 h-4" />
            {t('conflicts', { count: conflicts.length })}
          </p>
          <ul className="mt-1.5 space-y-1">
            {conflicts.map((c) => (
              <li key={`${c.pred.id}>${c.task.id}`} className="text-xs text-amber-900 dark:text-amber-200">
                <button type="button" className="underline hover:no-underline text-left" onClick={() => openTask(c.task.id)}>
                  {t('conflict', { task: c.task.title, pred: c.pred.title, date: f.date(c.pred.due, 'short') })}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
