'use client';

import { useTranslations } from 'next-intl';
import { CalendarIcon } from '@heroicons/react/24/outline';
import type { Task } from '../types';
import { getPriorityColor } from '../taskHelpers';

interface Props {
  tasks: Task[];
  onSelect: (task: Task) => void;
}

export default function TimelineView({ tasks, onSelect }: Props) {
  const t = useTranslations('demoProjectsPro.timeline');
  const sorted = [...tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div className="p-4 sm:p-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('title')}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{t('subtitle')}</p>
      <div className="relative border-l-2 border-teal-200 dark:border-teal-900 pl-6 ml-3 space-y-4">
        {sorted.map((task) => (
          <div
            key={task.id}
            onClick={() => onSelect(task)}
            className="relative cursor-pointer group"
          >
            <span className="absolute -left-[34px] top-2 w-4 h-4 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 ring-4 ring-white dark:ring-slate-950" />
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 group-hover:border-teal-500 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {task.dueDate}
                  </p>
                  <h4 className="font-semibold text-slate-900 dark:text-white">{task.title}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">{task.description}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
