'use client';

import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { KpiBox, type TierKey } from './shared';

export default function AnalyticsView() {
  const t = useTranslations('demoLoyalty');
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-secondary-900 dark:text-white">{t('analytics.title')}</h2>
        <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('analytics.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiBox label={t('analytics.kpis.activeMembers')} value="84,210" tone="success" delta="+8.4%" />
        <KpiBox label={t('analytics.kpis.redemptionRate')} value="32.1%" delta="+2.1%" />
        <KpiBox label={t('analytics.kpis.engagement')} value="68%" delta="+5%" tone="success" />
        <KpiBox label={t('analytics.kpis.ltvUplift')} value="+24%" tone="success" />
        <KpiBox label={t('analytics.kpis.breakage')} value="14.2%" delta="-1.3%" />
        <KpiBox label={t('analytics.kpis.aovDelta')} value="+38%" tone="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CohortChart />
        <TierDonut />
      </div>

      <TopRewards />
      <MlPersonalization />
    </div>
  );
}

function CohortChart() {
  const t = useTranslations('demoLoyalty');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const cohort: number[][] = [
    [100, 82, 71, 65, 60, 55],
    [100, 80, 68, 60, 55, 0],
    [100, 78, 67, 58, 0, 0],
    [100, 84, 72, 0, 0, 0],
    [100, 81, 0, 0, 0, 0],
    [100, 0, 0, 0, 0, 0],
  ];
  const colorFor = (v: number) => {
    if (v === 0) return 'bg-secondary-100 dark:bg-secondary-800 text-transparent';
    if (v >= 80) return 'bg-primary-700 text-white';
    if (v >= 60) return 'bg-primary-500 text-white';
    if (v >= 40) return 'bg-primary-300 text-primary-900';
    return 'bg-primary-100 text-primary-900';
  };
  return (
    <Card>
      <h3 className="font-bold text-secondary-900 dark:text-white">{t('analytics.cohort.title')}</h3>
      <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('analytics.cohort.subtitle')}</p>
      <div className="mt-4 overflow-x-auto">
        <table className="text-xs w-full">
          <thead>
            <tr>
              <th className="text-left text-secondary-500 font-medium pr-2">{t('analytics.cohort.month')}</th>
              {months.map((m, i) => (
                <th key={m} className="text-secondary-500 font-medium px-1">M{i}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohort.map((row, r) => (
              <tr key={r}>
                <td className="text-secondary-500 pr-2 py-0.5">{months[r]}</td>
                {row.map((v, c) => (
                  <td key={c} className="p-0.5">
                    <div className={`rounded text-center py-1.5 font-medium ${colorFor(v)}`}>
                      {v > 0 ? `${v}%` : '-'}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function TierDonut() {
  const t = useTranslations('demoLoyalty');
  const tiers: { key: TierKey; pct: number; count: number; color: string }[] = [
    { key: 'bronze', pct: 62, count: 18420, color: '#b45309' },
    { key: 'silver', pct: 25, count: 7320, color: '#94a3b8' },
    { key: 'gold', pct: 10, count: 2840, color: '#f59e0b' },
    { key: 'platinum', pct: 3, count: 620, color: '#06b6d4' },
  ];
  const circumference = 2 * Math.PI * 60;
  let offset = 0;

  return (
    <Card>
      <h3 className="font-bold text-secondary-900 dark:text-white">{t('analytics.tierDistribution.title')}</h3>
      <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('analytics.tierDistribution.subtitle')}</p>
      <div className="mt-4 flex flex-col md:flex-row items-center gap-6">
        <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
          <circle cx="80" cy="80" r="60" fill="none" stroke="currentColor" strokeWidth="20" className="text-secondary-100 dark:text-secondary-800" />
          {tiers.map((tt) => {
            const len = (tt.pct / 100) * circumference;
            const seg = (
              <circle
                key={tt.key}
                cx="80"
                cy="80"
                r="60"
                fill="none"
                stroke={tt.color}
                strokeWidth="20"
                strokeDasharray={`${len} ${circumference - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return seg;
          })}
        </svg>
        <div className="flex-1 space-y-2 w-full">
          {tiers.map((tt) => (
            <div key={tt.key} className="flex items-center gap-3 text-sm">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: tt.color }} />
              <span className="flex-1 text-secondary-700 dark:text-secondary-300">{t(`member.tier.${tt.key}`)}</span>
              <span className="text-xs text-secondary-500">{tt.count.toLocaleString()}</span>
              <span className="font-mono text-secondary-900 dark:text-white w-10 text-right">{tt.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function TopRewards() {
  const t = useTranslations('demoLoyalty');
  const rows = [
    { name: 'Starbucks $10', redemptions: 4820, burned: 7230000 },
    { name: 'Amazon $25', redemptions: 3120, burned: 9360000 },
    { name: 'Netflix 1 mes', redemptions: 2840, burned: 6248000 },
    { name: 'Uber $20', redemptions: 1980, burned: 4752000 },
    { name: 'Spotify Premium', redemptions: 1640, burned: 2952000 },
  ];
  return (
    <Card>
      <h3 className="font-bold text-secondary-900 dark:text-white">{t('analytics.topRewards.title')}</h3>
      <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('analytics.topRewards.subtitle')}</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase text-secondary-500 border-b border-secondary-200 dark:border-secondary-800">
              <th className="text-left py-2">Reward</th>
              <th className="text-right py-2">{t('analytics.topRewards.redemptions')}</th>
              <th className="text-right py-2">{t('analytics.topRewards.pointsBurned')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-b border-secondary-100 dark:border-secondary-800/50">
                <td className="py-2 font-medium text-secondary-900 dark:text-white">{r.name}</td>
                <td className="py-2 text-right text-secondary-700 dark:text-secondary-300">{r.redemptions.toLocaleString()}</td>
                <td className="py-2 text-right font-mono text-secondary-700 dark:text-secondary-300">
                  {r.burned.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function MlPersonalization() {
  const t = useTranslations('demoLoyalty');
  const segs = [
    { key: 'vip', rec: 'Triple pts en travel', uplift: 18, color: 'from-purple-500 to-fuchsia-600' },
    { key: 'atRisk', rec: 'Cupón -20% reactivación', uplift: 11, color: 'from-orange-500 to-red-600' },
    { key: 'rising', rec: 'Fast-track Silver', uplift: 9, color: 'from-emerald-500 to-teal-600' },
    { key: 'dormant', rec: 'Bonus pts visita en tienda', uplift: 6, color: 'from-slate-500 to-slate-700' },
  ];
  return (
    <Card>
      <h3 className="font-bold text-secondary-900 dark:text-white flex items-center gap-2">
        <SparklesIcon className="h-5 w-5" /> {t('analytics.ml.title')}
      </h3>
      <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('analytics.ml.subtitle')}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {segs.map((s) => (
          <div key={s.key} className={`rounded-xl p-4 bg-gradient-to-br ${s.color} text-white`}>
            <p className="text-xs uppercase tracking-wider opacity-80">{t(`analytics.ml.segments.${s.key}`)}</p>
            <p className="font-semibold mt-2 text-sm">{s.rec}</p>
            <p className="text-xs opacity-80 mt-3">{t('analytics.ml.expectedUplift')}</p>
            <p className="text-2xl font-bold">+{s.uplift}%</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
