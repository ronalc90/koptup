'use client';

import { useTranslations } from 'next-intl';
import {
  SparklesIcon,
  ShareIcon,
  ShieldExclamationIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { getAiScore, getAiScoreTone, getTaskMeta } from '../taskHelpers';

interface Props {
  taskId: number;
}

export default function TaskCardBadges({ taskId }: Props) {
  const t = useTranslations('demoProjectsPro.shell');
  const aiScore = getAiScore(taskId);
  const { deps, risk, hours } = getTaskMeta(taskId);

  const riskColor =
    risk === 'high'
      ? 'text-red-600 dark:text-red-400'
      : risk === 'medium'
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-emerald-600 dark:text-emerald-400';

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-2">
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${getAiScoreTone(aiScore)}`}
        title={`${t('aiScore')} score ${aiScore}`}
      >
        <SparklesIcon className="w-3 h-3" />
        {aiScore}
      </span>

      {deps > 0 && (
        <span
          className="inline-flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400"
          title={`${deps} ${t('deps')}`}
        >
          <ShareIcon className="w-3 h-3" />
          {deps}
        </span>
      )}

      <span
        className={`inline-flex items-center gap-1 text-[10px] ${riskColor}`}
        title={`${t('risk')}: ${risk}`}
      >
        <ShieldExclamationIcon className="w-3 h-3" />
      </span>

      <span
        className="inline-flex items-center gap-1 text-[10px] text-slate-500 ml-auto"
        title={`${hours.toFixed(1)}h ${t('logged')}`}
      >
        <ClockIcon className="w-3 h-3" />
        {hours.toFixed(1)}h
      </span>
    </div>
  );
}
