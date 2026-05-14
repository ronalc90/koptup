'use client';

import { useTranslations } from 'next-intl';
import type { Task, Column } from '../types';
import { getPriorityColor } from '../taskHelpers';

interface Props {
  tasks: Task[];
  columns: Column[];
  onSelect: (task: Task) => void;
}

export default function SwimlanesView({ tasks, columns, onSelect }: Props) {
  const t = useTranslations('demoProjectsPro.swimlanes');

  const assignees = Array.from(new Set(tasks.map((tk) => tk.assignee)));

  return (
    <div className="p-4 sm:p-6 overflow-x-auto">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('title')}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{t('subtitle')}</p>

      <div className="space-y-3 min-w-[800px]">
        {assignees.map((person) => (
          <div key={person} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center text-white text-xs font-semibold">
                {person.split(' ').map((s) => s[0]).join('')}
              </div>
              <span className="font-semibold text-slate-900 dark:text-white text-sm">{person}</span>
              <span className="ml-auto text-xs text-slate-500">
                {tasks.filter((task) => task.assignee === person).length}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 p-3">
              {columns.map((col) => (
                <div key={col.id} className="space-y-1.5">
                  <p className="text-[10px] uppercase font-semibold text-slate-500">{col.title}</p>
                  {tasks
                    .filter((task) => task.assignee === person && task.column === col.id)
                    .map((task) => (
                      <button
                        key={task.id}
                        onClick={() => onSelect(task)}
                        className="block w-full text-left text-xs px-2 py-1.5 rounded bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-900/30 truncate transition-colors"
                      >
                        <span className="font-medium text-slate-700 dark:text-slate-200">{task.title}</span>
                        <span
                          className={`ml-1 inline-block px-1 rounded text-[9px] ${getPriorityColor(task.priority)}`}
                        >
                          {task.priority[0].toUpperCase()}
                        </span>
                      </button>
                    ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
