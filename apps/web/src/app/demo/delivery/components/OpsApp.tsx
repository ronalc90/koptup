'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { TruckIcon, UserGroupIcon, ClockIcon, FireIcon, CloudIcon, ExclamationTriangleIcon, ShieldCheckIcon, SparklesIcon, ArrowPathIcon, ChartBarSquareIcon, BoltIcon } from '@heroicons/react/24/outline';
import { Kpi } from './shared';

export default function OpsApp() {
  const t = useTranslations('demoDelivery');
  const [surge, setSurge] = useState(1);
  const [reason, setReason] = useState<'rain' | 'peak' | 'event'>('peak');
  const [selected, setSelected] = useState<string | null>(null);

  const zoneNames = (t.raw('ops.heatmap.zones') as string[]) || [];
  const loads = [0.9, 0.6, 0.75, 0.45, 0.85, 0.3];
  const zones = zoneNames.map((name, i) => ({ name, load: loads[i] ?? 0.5 }));

  const dispatchRows = [
    { id: '5821', driver: 'Diego R.', status: 'On the way' },
    { id: '5822', driver: 'María L.', status: 'Pickup' },
    { id: '5823', driver: 'Carlos V.', status: 'Delivered' },
    { id: '5824', driver: 'Lucía F.', status: 'Assigned' },
  ];

  const heatColor = (v: number) => (v > 0.8 ? 'bg-red-500' : v > 0.6 ? 'bg-orange-500' : v > 0.4 ? 'bg-amber-400' : 'bg-emerald-400');

  const ReasonIcon = reason === 'rain' ? CloudIcon : reason === 'event' ? UserGroupIcon : FireIcon;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card variant="bordered" className="lg:col-span-3">
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ChartBarSquareIcon className="h-5 w-5 text-primary-500" />
              {t('ops.header')}
            </h2>
            <Badge variant="success" size="sm">
              <BoltIcon className="h-3 w-3 mr-1" /> Live
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kpi title={t('ops.activeDeliveries')} value="127" icon={TruckIcon} color="text-primary-500" />
            <Kpi title={t('ops.driversOnline')} value="84" icon={UserGroupIcon} color="text-emerald-500" />
            <Kpi title={t('ops.avgEta')} value="22 min" icon={ClockIcon} color="text-amber-500" />
            <Kpi title={t('ops.surgeNow')} value={`${surge.toFixed(1)}x`} icon={FireIcon} color="text-rose-500" />
          </div>
        </CardContent>
      </Card>

      <Card variant="bordered" className="lg:col-span-2">
        <CardContent>
          <h3 className="text-sm font-semibold mb-3">{t('ops.heatmap.title')}</h3>
          <div className="grid grid-cols-3 gap-2">
            {zones.map((z) => (
              <div key={z.name} className={`relative aspect-[4/3] rounded-lg ${heatColor(z.load)} text-white p-2 flex flex-col justify-between overflow-hidden`}>
                <div className="text-xs font-semibold">{z.name}</div>
                <div className="text-lg font-bold">{Math.round(z.load * 100)}%</div>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-secondary-500 dark:text-secondary-400">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" />{t('ops.heatmap.legendLow')}</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />{t('ops.heatmap.legendHigh')}</span>
          </div>
        </CardContent>
      </Card>

      <Card variant="bordered">
        <CardContent>
          <h3 className="text-sm font-semibold mb-3">{t('ops.surge.title')}</h3>
          <div className="flex items-center gap-3">
            <ReasonIcon className="h-6 w-6 text-rose-500" />
            <div className="flex-1">
              <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('ops.surge.multiplier')}</p>
              <p className="text-2xl font-bold">{surge.toFixed(1)}x</p>
            </div>
          </div>
          <input type="range" min={1} max={3} step={0.1} value={surge} onChange={(e) => setSurge(parseFloat(e.target.value))} className="w-full mt-2 accent-primary-600" />
          <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-2 mb-1">{t('ops.surge.reason')}</p>
          <div className="grid grid-cols-3 gap-1">
            {(['rain', 'peak', 'event'] as const).map((r) => (
              <button key={r} onClick={() => setReason(r)} className={`rounded-lg py-1 text-[11px] font-semibold ${reason === r ? 'bg-primary-600 text-white' : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-200'}`}>
                {t(`ops.surge.reasons.${r}` as any)}
              </button>
            ))}
          </div>
          <Button size="sm" fullWidth className="mt-2">{t('ops.surge.apply')}</Button>
        </CardContent>
      </Card>

      <Card variant="bordered" className="lg:col-span-2">
        <CardContent>
          <h3 className="text-sm font-semibold mb-3">{t('ops.dispatch.title')}</h3>
          <div className="space-y-1.5">
            {dispatchRows.map((d) => (
              <div key={d.id} onClick={() => setSelected(d.id)} className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs cursor-pointer transition ${selected === d.id ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-500' : 'bg-secondary-50 dark:bg-secondary-900 border border-transparent'}`}>
                <div>
                  <div className="font-semibold">{t('ops.dispatch.order', { id: d.id })}</div>
                  <div className="text-secondary-500 dark:text-secondary-400">{t('ops.dispatch.assignedTo', { driver: d.driver })}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="info" size="sm">{d.status}</Badge>
                  <Button size="sm" variant="outline">
                    <ArrowPathIcon className="h-3.5 w-3.5 mr-1" />{t('ops.dispatch.reassign')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card variant="bordered">
        <CardContent>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <ShieldCheckIcon className="h-4 w-4 text-rose-500" />{t('ops.fraud.title')}
          </h3>
          <div className="space-y-2 text-xs">
            <FraudAlert text={t('ops.fraud.alerts.gps', { id: 'D-217' })} cta={t('ops.fraud.review')} color="rose" />
            <FraudAlert text={t('ops.fraud.alerts.multi', { id: 'C-988' })} cta={t('ops.fraud.review')} color="amber" />
            <FraudAlert text={t('ops.fraud.alerts.chargeback', { id: 'O-5402' })} cta={t('ops.fraud.review')} color="rose" />
          </div>
        </CardContent>
      </Card>

      <Card variant="bordered" className="lg:col-span-3">
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <SparklesIcon className="h-4 w-4 text-primary-500" />{t('ops.forecast.title')}
            </h3>
            <Badge variant="primary" size="sm">{t('ops.forecast.model')}</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {zones.map((z, i) => {
              const pct = Math.round(z.load * 35 + i * 2);
              return (
                <div key={z.name} className="rounded-lg bg-secondary-50 dark:bg-secondary-900 p-2 text-center">
                  <p className="text-xs font-semibold">{z.name}</p>
                  <p className="text-sm font-bold text-primary-600 dark:text-primary-400">+{pct}%</p>
                  <p className="text-[10px] text-secondary-500 dark:text-secondary-400">{t('ops.forecast.nextHour', { pct })}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FraudAlert({ text, cta, color }: { text: string; cta: string; color: 'rose' | 'amber' }) {
  const bg = color === 'rose'
    ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-300 dark:border-rose-700'
    : 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700';
  return (
    <div className={`rounded-lg border ${bg} px-3 py-2 flex items-center justify-between gap-2`}>
      <div className="flex items-start gap-2 flex-1">
        <ExclamationTriangleIcon className={`h-4 w-4 mt-0.5 ${color === 'rose' ? 'text-rose-500' : 'text-amber-500'}`} />
        <span>{text}</span>
      </div>
      <Button size="sm" variant="outline">{cta}</Button>
    </div>
  );
}
