'use client';

import { useTranslations } from 'next-intl';
import type { Task } from '../types';

interface Props {
  tasks: Task[];
  onSelect: (task: Task) => void;
}

export default function GanttView({ tasks, onSelect }: Props) {
  const t = useTranslations('demoProjectsPro.criticalPath');

  const sorted = [...tasks].sort((a, b) => a.id - b.id);
  const totalUnits = 24;

  return (
    <div className="p-4 sm:p-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Gantt</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t('subtitle')}</p>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-auto">
        <div className="min-w-[600px] space-y-2">
          {sorted.map((task, i) => {
            const start = (i * 3) % totalUnits;
            const len = Math.max(3, 5 + (task.id % 5));
            const critical = task.priority === 'alta';
            return (
              <div
                key={task.id}
                onClick={() => onSelect(task)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-32 text-xs text-slate-700 dark:text-slate-300 truncate group-hover:text-teal-600">
                  {task.title}
                </div>
                <div className="flex-1 relative h-6 bg-slate-100 dark:bg-slate-800 rounded">
                  <div
                    className={`absolute top-0 bottom-0 rounded transition-all ${
                      critical
                        ? 'bg-gradient-to-r from-red-500 to-red-600'
                        : 'bg-gradient-to-r from-teal-500 to-cyan-500'
                    }`}
                    style={{
                      left: `${(start / totalUnits) * 100}%`,
                      width: `${Math.min((len / totalUnits) * 100, 100 - (start / totalUnits) * 100)}%`,
                    }}
                  />
                </div>
                <span
                  className={`text-[10px] font-semibold w-16 text-right ${
                    critical ? 'text-red-600' : 'text-slate-500'
                  }`}
                >
                  {critical ? t('critical') : t('slack')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
