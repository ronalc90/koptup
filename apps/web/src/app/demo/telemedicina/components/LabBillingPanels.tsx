'use client';

import { useTranslations } from 'next-intl';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { LabRow } from './types';
import { LAB_ROWS } from './mockData';

export function flagBadge(f: LabRow['flag'], t: ReturnType<typeof useTranslations>) {
  const map: Record<LabRow['flag'], { v: 'success' | 'warning' | 'danger' | 'info'; label: string }> = {
    normal: { v: 'success', label: t('lab.normal') },
    high: { v: 'warning', label: t('lab.high') },
    low: { v: 'info', label: t('lab.low') },
    critical: { v: 'danger', label: t('lab.critical') },
  };
  return (
    <Badge variant={map[f].v} size="sm">
      {map[f].label}
    </Badge>
  );
}

export function LabPanel() {
  const t = useTranslations('demoTelemed');
  return (
    <Card variant="bordered" padding="md">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle>{t('lab.title')}</CardTitle>
            <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('lab.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="info">{t('lab.fhirBadge')}</Badge>
            <Badge variant="info">{t('lab.hl7Badge')}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-secondary-500 dark:text-secondary-400 border-b border-secondary-200 dark:border-secondary-700">
              <tr>
                <th className="py-2 pr-3">{t('lab.test')}</th>
                <th className="py-2 pr-3">{t('lab.value')}</th>
                <th className="py-2 pr-3">{t('lab.ref')}</th>
                <th className="py-2 pr-3">{t('lab.flag')}</th>
                <th className="py-2 pr-3">{t('lab.date')}</th>
                <th className="py-2 pr-3">{t('lab.source')}</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {LAB_ROWS.map((r, i) => (
                <tr key={i} className="border-b border-secondary-100 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-800/40">
                  <td className="py-2.5 pr-3 text-secondary-900 dark:text-white font-medium">{r.test}</td>
                  <td className="py-2.5 pr-3 text-secondary-900 dark:text-white">{r.value}</td>
                  <td className="py-2.5 pr-3 text-secondary-500 dark:text-secondary-400">{r.ref}</td>
                  <td className="py-2.5 pr-3">{flagBadge(r.flag, t)}</td>
                  <td className="py-2.5 pr-3 text-secondary-500 dark:text-secondary-400">{r.date}</td>
                  <td className="py-2.5 pr-3">
                    <Badge variant="outline" size="sm">{r.source}</Badge>
                  </td>
                  <td className="py-2.5 pr-3 text-right">
                    <Button size="sm" variant="ghost" aria-label={t('lab.download')}>
                      <ArrowDownTrayIcon className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function BillingPanel() {
  const t = useTranslations('demoTelemed');
  const billing = [
    { id: 'B-7741', service: t('specialties.cardio'), date: '2026-05-10', billed: 480000, covered: 384000, copay: 30000, status: 'paid' as const },
    { id: 'B-7720', service: t('specialties.general'), date: '2026-04-22', billed: 180000, covered: 162000, copay: 18000, status: 'paid' as const },
    { id: 'B-7705', service: t('specialties.derma'), date: '2026-04-08', billed: 220000, covered: 198000, copay: 22000, status: 'pending' as const },
    { id: 'B-7681', service: t('specialties.neuro'), date: '2026-03-12', billed: 350000, covered: 0, copay: 0, status: 'denied' as const },
  ];
  return (
    <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-3">
        <Card variant="bordered" padding="md">
          <CardHeader>
            <CardTitle>{t('billing.title')}</CardTitle>
            <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('billing.subtitle')}</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-secondary-500 dark:text-secondary-400 border-b border-secondary-200 dark:border-secondary-700">
                  <tr>
                    <th className="py-2 pr-3">{t('billing.consultation')}</th>
                    <th className="py-2 pr-3">{t('billing.service')}</th>
                    <th className="py-2 pr-3 text-right">{t('billing.billed')}</th>
                    <th className="py-2 pr-3 text-right">{t('billing.covered')}</th>
                    <th className="py-2 pr-3 text-right">{t('billing.copay')}</th>
                    <th className="py-2 pr-3">{t('billing.status')}</th>
                    <th className="py-2 pr-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {billing.map((b) => (
                    <tr key={b.id} className="border-b border-secondary-100 dark:border-secondary-800">
                      <td className="py-2.5 pr-3 font-mono text-secondary-700 dark:text-secondary-200">{b.id}</td>
                      <td className="py-2.5 pr-3 text-secondary-900 dark:text-white">
                        {b.service}
                        <p className="text-xs text-secondary-500 dark:text-secondary-400">{b.date}</p>
                      </td>
                      <td className="py-2.5 pr-3 text-right text-secondary-900 dark:text-white">${b.billed.toLocaleString()}</td>
                      <td className="py-2.5 pr-3 text-right text-emerald-600 dark:text-emerald-400">${b.covered.toLocaleString()}</td>
                      <td className="py-2.5 pr-3 text-right text-secondary-900 dark:text-white">${b.copay.toLocaleString()}</td>
                      <td className="py-2.5 pr-3">
                        <Badge variant={b.status === 'paid' ? 'success' : b.status === 'pending' ? 'warning' : 'danger'} size="sm">
                          {t(`billing.${b.status}`)}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-3 text-right">
                        {b.status === 'pending' ? <Button size="sm">{t('billing.pay')}</Button> : <Button size="sm" variant="ghost">{t('billing.viewEob')}</Button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-3">
        <Card variant="bordered" padding="md">
          <p className="text-xs uppercase tracking-wide text-secondary-500 dark:text-secondary-400">{t('billing.totals.outOfPocket')}</p>
          <p className="text-2xl font-bold text-secondary-900 dark:text-white">$70.000</p>
          <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('billing.totals.ytd')}</p>
        </Card>
        <Card variant="bordered" padding="md">
          <p className="text-xs uppercase tracking-wide text-secondary-500 dark:text-secondary-400">{t('billing.totals.deductible')}</p>
          <p className="text-2xl font-bold text-secondary-900 dark:text-white">$420.000 / $1.000.000</p>
          <div className="mt-2 w-full bg-secondary-200 dark:bg-secondary-700 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-primary-600" style={{ width: '42%' }} />
          </div>
          <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">42% {t('billing.totals.deductibleMet')}</p>
        </Card>
      </div>
    </section>
  );
}
