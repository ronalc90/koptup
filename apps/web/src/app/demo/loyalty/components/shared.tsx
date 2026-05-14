'use client';

import { ArrowTrendingDownIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

export type TierKey = 'bronze' | 'silver' | 'gold' | 'platinum';

export const TIER_THEME: Record<TierKey, { from: string; to: string; ring: string; text: string; emoji: string }> = {
  bronze: { from: 'from-amber-700', to: 'to-amber-900', ring: 'ring-amber-600', text: 'text-amber-200', emoji: 'B' },
  silver: { from: 'from-slate-400', to: 'to-slate-600', ring: 'ring-slate-300', text: 'text-slate-100', emoji: 'S' },
  gold: { from: 'from-yellow-400', to: 'to-amber-600', ring: 'ring-yellow-300', text: 'text-yellow-50', emoji: 'G' },
  platinum: { from: 'from-cyan-300', to: 'to-indigo-600', ring: 'ring-cyan-200', text: 'text-cyan-50', emoji: 'P' },
};

export function KpiBox({
  label,
  value,
  delta,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: 'success' | 'danger';
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-secondary-200 dark:border-secondary-800 p-3 bg-white dark:bg-secondary-900">
      <div className="flex items-center justify-between">
        <p className="text-xs text-secondary-500 dark:text-secondary-400">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-secondary-400" />}
      </div>
      <p className="text-xl font-bold text-secondary-900 dark:text-white mt-1">{value}</p>
      {delta && (
        <p className={`text-xs mt-1 flex items-center gap-1 ${tone === 'success' ? 'text-green-600' : 'text-secondary-500'}`}>
          {delta.startsWith('+') ? <ArrowTrendingUpIcon className="h-3 w-3" /> : <ArrowTrendingDownIcon className="h-3 w-3" />}
          {delta}
        </p>
      )}
    </div>
  );
}
