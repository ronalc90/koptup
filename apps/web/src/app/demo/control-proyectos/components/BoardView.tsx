'use client';

import { useTranslations } from 'next-intl';
import { CalendarIcon } from '@heroicons/react/24/outline';
import type { Task, Column } from '../types';
import { getPriorityColor, getAiScore, getAiScoreTone } from '../taskHelpers';

interface Props {
  tasks: Task[];
  columns: Column[];
  onSelect: (task: Task) => void;
}

export default function BoardView({ tasks, columns, onSelect }: Props) {
  const tShell = useTranslations('demoProjectsPro.shell');

  return (
    <div className="p-4 sm:p-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Board</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tasks.map((task) => {
          const col = columns.find((c) => c.id === task.column);
          const aiScore = getAiScore(task.id);
          return (
            <button
              key={task.id}
              onClick={() => onSelect(task)}
              className="text-left bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-md hover:border-teal-500 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] uppercase font-semibold text-slate-500">{col?.title}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getAiScoreTone(aiScore)}`}>
                  {tShell('aiScore')} {aiScore}
                </span>
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">{task.title}</h4>
              <p className="text-xs text-slate-500 line-clamp-2 mb-2">{task.description}</p>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  {task.dueDate}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
