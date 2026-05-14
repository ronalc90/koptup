'use client';

import { useTranslations } from 'next-intl';
import type { Task } from '../types';

interface Props {
  tasks: Task[];
  onSelect: (task: Task) => void;
}

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function CalendarView({ tasks, onSelect }: Props) {
  const t = useTranslations('demoProjectsPro.calendarView');

  return (
    <div className="p-4 sm:p-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('title')}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{t('subtitle')}</p>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {DAYS_ES.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-slate-500 py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }, (_, i) => {
            const day = i - 2;
            const dayTasks = tasks.filter((tk) => new Date(tk.dueDate).getDate() === day + 1);
            return (
              <div
                key={i}
                className={`aspect-square min-h-[60px] rounded-lg p-1 ${
                  day < 0
                    ? 'invisible'
                    : dayTasks.length > 0
                    ? 'bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900'
                    : 'bg-slate-50 dark:bg-slate-800/40 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                {day >= 0 && (
                  <>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{day + 1}</p>
                    <div className="space-y-0.5 mt-1">
                      {dayTasks.slice(0, 2).map((dt) => (
                        <button
                          key={dt.id}
                          onClick={() => onSelect(dt)}
                          className="block w-full text-left text-[10px] px-1.5 py-0.5 rounded bg-teal-500/80 text-white truncate hover:bg-teal-600"
                        >
                          {dt.title}
                        </button>
                      ))}
                      {dayTasks.length > 2 && (
                        <span className="text-[10px] text-slate-500">+{dayTasks.length - 2}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
