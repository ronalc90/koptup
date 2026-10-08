'use client';

import { useTranslations } from 'next-intl';
import { AcademicCapIcon, ChartBarIcon, ClockIcon, UsersIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import { useLms } from '../lib/store';
import { headerStats } from '../lib/selectors';
import { useFmt } from './ui';

/** Cifras calculadas con los datos de ejemplo de la demo (no son métricas reales). */
export default function StatsBar() {
  const t = useTranslations('demoLms');
  const f = useFmt();
  const { state } = useLms();
  const s = state ? headerStats(state) : null;
  const items = [
    { label: t('stats.courses'), value: s ? f.int(s.courses) : '—', icon: AcademicCapIcon, color: 'from-indigo-500 to-purple-500' },
    { label: t('stats.students'), value: s ? f.int(s.students) : '—', icon: UsersIcon, color: 'from-pink-500 to-rose-500' },
    { label: t('stats.completion'), value: s ? f.pct(s.completion) : '—', icon: ChartBarIcon, color: 'from-emerald-500 to-teal-500' },
    { label: t('stats.hours'), value: s ? f.int(s.hours) : '—', icon: ClockIcon, color: 'from-amber-500 to-orange-500' },
  ];
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {items.map((it) => (
          <Card key={it.label} variant="bordered" padding="sm">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${it.color} flex items-center justify-center flex-shrink-0`}>
                <it.icon className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-secondary-900 dark:text-white leading-tight">{it.value}</p>
                <p className="text-[11px] text-secondary-500 dark:text-secondary-400 leading-tight">{it.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <p className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('stats.note')}</p>
    </div>
  );
}
