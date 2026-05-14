'use client';

import { useTranslations } from 'next-intl';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  ChartBarIcon,
  UsersIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

interface ModuleMetric {
  name: string;
  value: number;
  delta?: number;
}

interface RiskStudent {
  name: string;
  risk: number;
}

interface InstructorPanelProps {
  completion: number;
  engagement: number;
  avgScore: number;
  activeStudents: number;
  trend: number[];
  topModules: ModuleMetric[];
  weakModules: ModuleMetric[];
  riskStudents: RiskStudent[];
}

function Gauge({ value, label }: { value: number; label: string }) {
  const angle = (value / 100) * 180;
  const color =
    value >= 70 ? 'from-green-400 to-emerald-500' : value >= 40 ? 'from-amber-400 to-orange-500' : 'from-red-400 to-rose-500';
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-16 overflow-hidden">
        <div className="absolute inset-x-0 top-0 w-32 h-32 rounded-full bg-secondary-100 dark:bg-secondary-800" />
        <div
          className={`absolute inset-x-0 top-0 w-32 h-32 rounded-full bg-gradient-to-r ${color}`}
          style={{
            clipPath: `polygon(50% 50%, 0 0, ${50 + 50 * Math.cos(((180 - angle) * Math.PI) / 180)}% ${50 - 50 * Math.sin(((180 - angle) * Math.PI) / 180)}%, 100% 0)`,
          }}
        />
        <div className="absolute inset-x-2 top-2 bottom-0 rounded-full bg-white dark:bg-secondary-900" />
      </div>
      <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-2">{value}%</p>
      <p className="text-xs text-secondary-500 dark:text-secondary-400">{label}</p>
    </div>
  );
}

export default function InstructorPanel({
  completion,
  engagement,
  avgScore,
  activeStudents,
  trend,
  topModules,
  weakModules,
  riskStudents,
}: InstructorPanelProps) {
  const t = useTranslations('demoLms');
  const maxTrend = Math.max(...trend, 1);

  const riskLabel = (r: number) =>
    r >= 70 ? t('analytics.riskHigh') : r >= 40 ? t('analytics.riskMid') : t('analytics.riskLow');
  const riskVariant = (r: number): 'danger' | 'warning' | 'success' =>
    r >= 70 ? 'danger' : r >= 40 ? 'warning' : 'success';

  const kpis = [
    {
      icon: AcademicCapIcon,
      label: t('analytics.completionRate'),
      value: `${completion}%`,
      color: 'from-green-500 to-emerald-600',
    },
    {
      icon: ChartBarIcon,
      label: t('analytics.engagement'),
      value: `${engagement}%`,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      icon: ArrowTrendingUpIcon,
      label: t('analytics.avgScore'),
      value: `${avgScore}/100`,
      color: 'from-purple-500 to-pink-600',
    },
    {
      icon: UsersIcon,
      label: t('analytics.activeStudents'),
      value: activeStudents.toString(),
      color: 'from-amber-500 to-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
          {t('analytics.title')}
        </h2>
        <p className="text-sm text-secondary-500 dark:text-secondary-400">
          {t('analytics.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} variant="bordered">
            <CardContent className="p-0">
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${k.color} flex items-center justify-center mb-3`}
              >
                <k.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">{k.value}</p>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="bordered" className="lg:col-span-2">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-secondary-900 dark:text-white">
                {t('analytics.trend')}
              </h3>
              <Badge variant="success" size="sm">
                <ArrowTrendingUpIcon className="w-3.5 h-3.5 mr-1" />
                +12%
              </Badge>
            </div>
            <div className="h-48 flex items-end gap-2">
              {trend.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-primary-500 to-purple-500 transition-all duration-700 hover:opacity-80"
                    style={{ height: `${(v / maxTrend) * 100}%` }}
                    title={`${v}`}
                  />
                  <span className="text-[10px] text-secondary-500 dark:text-secondary-400">
                    D{i + 1}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent className="p-0 flex flex-col items-center justify-center h-full">
            <h3 className="text-base font-semibold text-secondary-900 dark:text-white mb-3">
              {t('analytics.dropoutRisk')}
            </h3>
            <Gauge value={32} label={t('analytics.riskLow')} />
            <div className="mt-4 w-full space-y-2">
              {riskStudents.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between p-2 rounded-md bg-secondary-50 dark:bg-secondary-800/40"
                >
                  <span className="text-sm text-secondary-800 dark:text-secondary-100">
                    {s.name}
                  </span>
                  <Badge variant={riskVariant(s.risk)} size="sm">
                    {riskLabel(s.risk)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="bordered">
          <CardContent className="p-0">
            <h3 className="text-base font-semibold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
              <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
              {t('analytics.topModules')}
            </h3>
            <div className="space-y-3">
              {topModules.map((m) => (
                <div key={m.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-secondary-800 dark:text-secondary-100">
                      {m.name}
                    </span>
                    <span className="text-xs font-semibold text-secondary-600 dark:text-secondary-300">
                      {m.value}%
                    </span>
                  </div>
                  <div className="h-2 bg-secondary-100 dark:bg-secondary-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
                      style={{ width: `${m.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent className="p-0">
            <h3 className="text-base font-semibold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
              <ArrowTrendingDownIcon className="w-5 h-5 text-amber-500" />
              {t('analytics.weakModules')}
            </h3>
            <div className="space-y-3">
              {weakModules.map((m) => (
                <div key={m.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-secondary-800 dark:text-secondary-100">
                      {m.name}
                    </span>
                    <span className="text-xs font-semibold text-secondary-600 dark:text-secondary-300">
                      {m.value}%
                    </span>
                  </div>
                  <div className="h-2 bg-secondary-100 dark:bg-secondary-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                      style={{ width: `${m.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
