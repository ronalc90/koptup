'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { BanknotesIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

const concepts = [
  { k: 'salary', type: 'earning', amount: '$1,820,000' },
  { k: 'overtime', type: 'earning', amount: '$84,200' },
  { k: 'bonus', type: 'earning', amount: '$235,800' },
  { k: 'severance', type: 'earning', amount: '$152,000' },
  { k: 'health', type: 'deduction', amount: '-$84,000' },
  { k: 'pension', type: 'deduction', amount: '-$98,400' },
  { k: 'tax', type: 'deduction', amount: '-$116,000' },
];

const benefits = [
  { name: 'Medicina prepagada', value: '$4,200', enrolled: true },
  { name: 'Plan dental', value: '$1,100', enrolled: true },
  { name: 'Stock options', value: '$12,000', enrolled: true },
  { name: 'Gimnasio', value: '$600', enrolled: false },
  { name: 'Educación continua', value: '$2,400', enrolled: true },
  { name: 'Seguro vida', value: '$900', enrolled: false },
];

export default function PayrollTab() {
  const t = useTranslations('demoHrms');
  const [status, setStatus] = useState<'draft' | 'processed'>('draft');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-secondary-900 dark:text-white">{t('payroll.title')}</h2>
        <p className="text-secondary-600 dark:text-secondary-400 text-sm">{t('payroll.subtitle')}</p>
      </div>

      <Card variant="bordered">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="primary">{t('payroll.period')}: Mayo 2026</Badge>
            <Badge variant="info">{t('payroll.employees')}: 482</Badge>
            <Badge variant={status === 'draft' ? 'warning' : 'success'}>
              {t('payroll.status')}: {status === 'draft' ? t('payroll.draft') : t('common.completed')}
            </Badge>
          </div>
          <Button
            variant="primary"
            size="sm"
            disabled={status !== 'draft'}
            onClick={() => setStatus('processed')}
          >
            <BanknotesIcon className="w-4 h-4 mr-2" />
            {t('payroll.process')}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800">
            <p className="text-xs text-secondary-500">{t('payroll.gross')}</p>
            <p className="text-xl font-bold text-secondary-900 dark:text-white">$2,140,000</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800">
            <p className="text-xs text-secondary-500">{t('payroll.deductions')}</p>
            <p className="text-xl font-bold text-red-600">-$298,400</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950">
            <p className="text-xs text-emerald-700 dark:text-emerald-300">{t('payroll.net')}</p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">$1,841,600</p>
          </div>
        </div>

        <h4 className="font-semibold text-sm mb-2 text-secondary-900 dark:text-white">{t('payroll.concepts.title')}</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-secondary-500 border-b border-secondary-200 dark:border-secondary-700">
                <th className="py-2">{t('payroll.concepts.title')}</th>
                <th className="py-2">{t('payroll.concepts.type')}</th>
                <th className="py-2 text-right">{t('payroll.concepts.amount')}</th>
              </tr>
            </thead>
            <tbody>
              {concepts.map((c) => (
                <tr key={c.k} className="border-b border-secondary-100 dark:border-secondary-800">
                  <td className="py-2 font-medium text-secondary-900 dark:text-white">{t(`payroll.concepts.${c.k}`)}</td>
                  <td className="py-2">
                    <Badge variant={c.type === 'earning' ? 'success' : 'danger'} size="sm">
                      {t(`payroll.concepts.${c.type}`)}
                    </Badge>
                  </td>
                  <td className="py-2 text-right font-semibold">{c.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card variant="bordered">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-secondary-900 dark:text-white">{t('payroll.benefits.title')}</h3>
            <p className="text-xs text-secondary-500">{t('payroll.benefits.subtitle')}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-secondary-500">{t('payroll.benefits.totalRewards')}</p>
            <p className="text-xl font-bold text-primary-600">$118,400</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {benefits.map((b) => (
            <div key={b.name} className="p-3 rounded-lg border border-secondary-200 dark:border-secondary-700 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-secondary-900 dark:text-white">{b.name}</p>
                <p className="text-xs text-secondary-500">{b.value} / año</p>
              </div>
              {b.enrolled ? (
                <Badge variant="success" size="sm">{t('payroll.benefits.enrolled')}</Badge>
              ) : (
                <button className="text-xs font-medium text-primary-600 hover:underline">{t('payroll.benefits.enroll')}</button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card variant="bordered">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-secondary-900 dark:text-white">{t('surveys.title')}</h3>
            <p className="text-xs text-secondary-500">{t('surveys.subtitle')}</p>
          </div>
          <Button size="sm" variant="outline">{t('surveys.launch')}</Button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800 text-center">
            <p className="text-xs text-secondary-500">{t('surveys.active')}</p>
            <p className="text-2xl font-bold text-primary-600">3</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800 text-center">
            <p className="text-xs text-secondary-500">{t('surveys.participation')}</p>
            <p className="text-2xl font-bold text-emerald-600">87%</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800 text-center">
            <p className="text-xs text-secondary-500">{t('surveys.lastResult')}</p>
            <p className="text-2xl font-bold text-secondary-900 dark:text-white">7.8</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
