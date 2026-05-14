'use client';

import { useTranslations } from 'next-intl';
import type { Task } from '../types';

interface Props {
  tasks: Task[];
  onSelect: (task: Task) => void;
}

export default function MindmapView({ tasks, onSelect }: Props) {
  const t = useTranslations('demoProjectsPro.mindmap');
  const tPm = useTranslations('projectManager');

  const groups: Record<string, Task[]> = {};
  for (const task of tasks) {
    const key = task.tags[0] ?? 'Sin etiqueta';
    if (!groups[key]) groups[key] = [];
    groups[key].push(task);
  }
  const branches = Object.entries(groups);

  return (
    <div className="p-4 sm:p-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('title')}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{t('subtitle')}</p>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col items-center">
          <div className="px-6 py-3 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white font-bold shadow-lg">
            {tPm('mainProject')}
          </div>
          <div className="w-px h-6 bg-slate-300 dark:bg-slate-700" />
          <div className="flex flex-wrap justify-center gap-4">
            {branches.map(([key, branchTasks]) => (
              <div key={key} className="flex flex-col items-center">
                <div className="px-4 py-2 rounded-lg bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-950 dark:to-cyan-950 text-teal-700 dark:text-teal-300 font-semibold text-sm">
                  {key}
                </div>
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-700" />
                <div className="flex flex-col gap-2 items-center">
                  {branchTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => onSelect(task)}
                      className="px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-900/40 text-xs text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 transition-colors max-w-[180px] truncate"
                    >
                      {task.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
