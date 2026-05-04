'use client';

import { motion } from 'framer-motion';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: number;
  deltaSuffix?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  onClick?: () => void;
}

const colorMap: Record<string, { from: string; to: string; text: string }> = {
  blue: {
    from: 'from-blue-500',
    to: 'to-blue-700',
    text: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    from: 'from-green-500',
    to: 'to-green-700',
    text: 'text-green-600 dark:text-green-400',
  },
  purple: {
    from: 'from-purple-500',
    to: 'to-purple-700',
    text: 'text-purple-600 dark:text-purple-400',
  },
  orange: {
    from: 'from-orange-500',
    to: 'to-orange-700',
    text: 'text-orange-600 dark:text-orange-400',
  },
  red: {
    from: 'from-red-500',
    to: 'to-red-700',
    text: 'text-red-600 dark:text-red-400',
  },
};

export default function KpiCard({
  label,
  value,
  delta,
  deltaSuffix,
  icon: Icon,
  color,
  onClick,
}: KpiCardProps) {
  const colors = colorMap[color] ?? colorMap.blue;
  const displayValue = typeof value === 'number' ? value.toLocaleString('es-PE') : value;

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02 } : undefined}
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-secondary-900',
        'border border-secondary-200 dark:border-secondary-700',
        'rounded-xl p-5 transition-shadow hover:shadow-lg',
        onClick && 'cursor-pointer'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-1">
            {label}
          </p>
          <p className="text-3xl font-bold tracking-tight text-secondary-900 dark:text-white truncate">
            {displayValue}
          </p>
          {delta !== undefined && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-xs font-medium',
              delta >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            )}>
              {delta >= 0 ? (
                <ArrowTrendingUpIcon className="h-3 w-3" />
              ) : (
                <ArrowTrendingDownIcon className="h-3 w-3" />
              )}
              <span>{Math.abs(delta).toFixed(1)}%</span>
              {deltaSuffix && (
                <span className="text-secondary-500 dark:text-secondary-400 ml-1 truncate">
                  {deltaSuffix}
                </span>
              )}
            </div>
          )}
        </div>
        <div className={cn(
          'h-12 w-12 rounded-xl',
          `bg-gradient-to-br ${colors.from} ${colors.to}`,
          'flex items-center justify-center flex-shrink-0'
        )}>
          {Icon && <Icon className="h-6 w-6 text-white" />}
        </div>
      </div>
    </motion.div>
  );
}