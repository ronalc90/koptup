'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeftIcon, ChevronRightIcon, FlagIcon } from '@heroicons/react/24/outline';
import { addDays, addMonths, daysInMonth, firstOfMonth, weekday } from '../lib/dates';
import { isOverdue } from '../lib/engine';
import { useDemo } from '../lib/store';
import type { ISODate, Task } from '../lib/types';
import { Empty, STATUS_DOT, btn, capitalize, card, useFmt } from './ui';

export default function MonthCalendar({ tasks }: { tasks: Task[] }) {
  const t = useTranslations('demoProjectsPro.calendar');
  const f = useFmt();
  const { ws, today, openTask } = useDemo();
  const [month, setMonth] = useState<ISODate>(firstOfMonth(today));
  const milestones = ws.milestones.filter((m) => m.projectId === ws.currentProjectId);

  const byDay = useMemo(() => {
    const map = new Map<ISODate, Task[]>();
    for (const x of tasks) map.set(x.due, [...(map.get(x.due) ?? []), x]);
    return map;
  }, [tasks]);
  const msByDay = useMemo(() => {
    const map = new Map<ISODate, string[]>();
    for (const m of milestones) map.set(m.end, [...(map.get(m.end) ?? []), m.name]);
    return map;
  }, [milestones]);

  // La semana empieza el lunes.
  const lead = (weekday(month) + 6) % 7;
  const n = daysInMonth(month);
  const cells: (ISODate | null)[] = [...Array.from({ length: lead }, () => null), ...Array.from({ length: n }, (_, i) => addDays(month, i))];
  while (cells.length % 7) cells.push(null);
  const weekdays = Array.from({ length: 7 }, (_, i) => f.date(addDays('2026-10-05', i), 'weekday'));
  const monthDays = cells.filter((c): c is ISODate => !!c);
  const agenda = monthDays.filter((d) => byDay.has(d) || msByDay.has(d));

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{capitalize(f.date(month, 'month'))}</h3>
        <div className="flex items-center gap-2">
          <button type="button" className={btn.small} onClick={() => setMonth(addMonths(month, -1))} aria-label={t('prev')}>
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <button type="button" className={btn.small} onClick={() => setMonth(firstOfMonth(today))} disabled={month === firstOfMonth(today)}>
            {t('today')}
          </button>
          <button type="button" className={btn.small} onClick={() => setMonth(addMonths(month, 1))} aria-label={t('next')}>
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{t('hint')}</p>

      <div className={`${card} p-2 sm:p-3 hidden sm:block`}>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekdays.map((d) => (
            <div key={d} className="text-center text-[11px] font-semibold uppercase text-slate-500 py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} className="min-h-[96px]" />;
            const list = byDay.get(d) ?? [];
            const ms = msByDay.get(d) ?? [];
            const isToday = d === today;
            return (
              <div
                key={d}
                className={`min-h-[96px] rounded-lg p-1.5 border ${isToday ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/30' : 'border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30'}`}
              >
                <p className={`text-xs font-semibold ${isToday ? 'text-teal-700 dark:text-teal-300' : 'text-slate-600 dark:text-slate-300'}`}>{Number(d.slice(8))}</p>
                <div className="space-y-0.5 mt-1">
                  {ms.map((name) => (
                    <p key={name} className="flex items-center gap-1 text-[10px] font-semibold text-violet-700 dark:text-violet-300 truncate" title={t('milestoneEnd', { name })}>
                      <FlagIcon className="w-3 h-3 shrink-0" />
                      <span className="truncate">{name}</span>
                    </p>
                  ))}
                  {list.slice(0, 3).map((x) => (
                    <button
                      key={x.id}
                      type="button"
                      onClick={() => openTask(x.id)}
                      title={x.title}
                      className={`block w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate ${
                        isOverdue(x, today) ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200' : x.status === 'done' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 line-through' : 'bg-teal-600 text-white hover:bg-teal-700'
                      }`}
                    >
                      {x.title}
                    </button>
                  ))}
                  {list.length > 3 && <p className="text-[10px] text-slate-500">{t('more', { count: list.length - 3 })}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sm:hidden space-y-2">
        {agenda.length === 0 ? (
          <div className={card}>
            <Empty>{t('emptyMonth')}</Empty>
          </div>
        ) : (
          agenda.map((d) => (
            <div key={d} className={`${card} p-3`}>
              <p className={`text-xs font-bold mb-1.5 ${d === today ? 'text-teal-700 dark:text-teal-300' : 'text-slate-700 dark:text-slate-200'}`}>
                {f.date(d, 'day')}
                {d === today && ` · ${t('today')}`}
              </p>
              {(msByDay.get(d) ?? []).map((name) => (
                <p key={name} className="flex items-center gap-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
                  <FlagIcon className="w-3.5 h-3.5" />
                  {t('milestoneEnd', { name })}
                </p>
              ))}
              {(byDay.get(d) ?? []).map((x) => (
                <button key={x.id} type="button" onClick={() => openTask(x.id)} className="flex items-center gap-2 w-full text-left text-sm py-1">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${isOverdue(x, today) ? 'bg-red-500' : STATUS_DOT[x.status]}`} aria-hidden="true" />
                  <span className={`text-slate-800 dark:text-slate-100 ${x.status === 'done' ? 'line-through text-slate-400' : ''}`}>{x.title}</span>
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
