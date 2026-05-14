'use client';

import { useTranslations } from 'next-intl';
import { CalendarIcon } from '@heroicons/react/24/outline';
import type { Task, Column } from '../types';
import { getPriorityColor } from '../taskHelpers';

interface Props {
  tasks: Task[];
  columns: Column[];
  onSelect: (task: Task) => void;
}

export default function ListView({ tasks, columns, onSelect }: Props) {
  const t = useTranslations('demoProjectsPro.list');

  return (
    <div className="p-4 sm:p-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('title')}</h3>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500">
              <th className="text-left px-4 py-3 font-semibold">{t('task')}</th>
              <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">{t('status')}</th>
              <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">{t('assignee')}</th>
              <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">{t('due')}</th>
              <th className="text-left px-4 py-3 font-semibold">{t('priority')}</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const col = columns.find((c) => c.id === task.column);
              return (
                <tr
                  key={task.id}
                  onClick={() => onSelect(task)}
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900 dark:text-white">{task.title}</p>
                    <p className="text-xs text-slate-500 truncate max-w-xs">{task.description}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {col?.title ?? task.column}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-600 dark:text-slate-400">
                    {task.assignee}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-600 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {task.dueDate}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
