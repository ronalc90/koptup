'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default function PerformanceTab() {
  const t = useTranslations('demoHrms');
  const [scores, setScores] = useState<Record<string, number>>({ q1: 4, q2: 5, q3: 4, q4: 4, q5: 3 });

  const okrs = [
    { name: 'Reducir TTFB en 30%', owner: 'Camila R.', progress: 68 },
    { name: 'Lanzar módulo Payroll MX', owner: 'Lucía V.', progress: 42 },
    { name: 'eNPS > +40 en Q2', owner: 'Carolina P.', progress: 95 },
    { name: 'Cerrar 14 posiciones críticas', owner: 'Valentina C.', progress: 57 },
  ];

  const succession = [
    { name: 'Felipe Quintero', role: 'QA Lead → QA Manager', ready: 'readyNow' as const },
    { name: 'Camila Rojas', role: 'Senior FE → Tech Lead', ready: 'ready1y' as const },
    { name: 'Mariana López', role: 'Data Analyst → Sr Analyst', ready: 'ready1y' as const },
    { name: 'Jorge Salas', role: 'Backend → Staff Engineer', ready: 'ready2y' as const },
  ];

  const accruals = [
    { c: 'CO', accrual: '15', taken: '7', balance: '12' },
    { c: 'MX', accrual: '12', taken: '4', balance: '10' },
    { c: 'AR', accrual: '14', taken: '8', balance: '14' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-secondary-900 dark:text-white">{t('performance.title')}</h2>
        <p className="text-secondary-600 dark:text-secondary-400 text-sm">{t('performance.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="bordered">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-secondary-900 dark:text-white">{t('performance.review.title')}</h3>
            <Badge variant="primary" size="sm">{t('performance.review.cycle')} Q2 2026</Badge>
          </div>
          <p className="text-xs text-secondary-500 mb-4">{t('performance.review.scale')}</p>
          <div className="flex gap-1 mb-4 text-xs flex-wrap">
            {['selfReview', 'peerReview', 'managerReview', 'subordinateReview'].map((r) => (
              <Badge key={r} variant="outline" size="sm">{t(`performance.review.${r}`)}</Badge>
            ))}
          </div>
          <div className="space-y-3">
            {(['q1', 'q2', 'q3', 'q4', 'q5'] as const).map((q) => (
              <div key={q}>
                <p className="text-sm text-secondary-800 dark:text-secondary-200 mb-1">{t(`performance.questions.${q}`)}</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setScores((s) => ({ ...s, [q]: n }))}
                      className={`flex-1 h-8 text-xs font-bold rounded transition-all ${
                        scores[q] >= n ? 'bg-primary-600 text-white' : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-400'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Button variant="primary" size="sm" fullWidth className="mt-4">{t('performance.review.submit')}</Button>
        </Card>

        <Card variant="bordered">
          <h3 className="font-bold text-secondary-900 dark:text-white mb-4">{t('performance.okrs.title')}</h3>
          <div className="space-y-3">
            {okrs.map((okr) => (
              <div key={okr.name} className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-semibold text-secondary-900 dark:text-white">{okr.name}</p>
                  <span className="text-xs font-bold text-primary-600">{okr.progress}%</span>
                </div>
                <p className="text-xs text-secondary-500 mb-2">{t('performance.okrs.owner')}: {okr.owner}</p>
                <div className="h-1.5 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600" style={{ width: `${okr.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="bordered">
          <div className="mb-3">
            <h3 className="font-bold text-secondary-900 dark:text-white">{t('performance.succession.title')}</h3>
            <p className="text-xs text-secondary-500">{t('performance.succession.subtitle')}</p>
          </div>
          <div className="space-y-2">
            {succession.map((s) => (
              <div key={s.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800">
                <div>
                  <p className="text-sm font-semibold text-secondary-900 dark:text-white">{s.name}</p>
                  <p className="text-xs text-secondary-500">{s.role}</p>
                </div>
                <Badge variant={s.ready === 'readyNow' ? 'success' : s.ready === 'ready1y' ? 'info' : 'default'} size="sm">
                  {t(`performance.succession.${s.ready}`)}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="bordered">
          <div className="mb-3">
            <h3 className="font-bold text-secondary-900 dark:text-white">{t('performance.timeOff.title')}</h3>
            <p className="text-xs text-secondary-500">{t('performance.timeOff.subtitle')}</p>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-4 text-xs">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
              <div key={i} className="text-center font-semibold text-secondary-500">{d}</div>
            ))}
            {Array.from({ length: 30 }).map((_, i) => {
              const taken = [4, 5, 12, 13, 14, 19, 22, 25].includes(i + 1);
              return (
                <div key={i} className={`aspect-square rounded text-center text-xs flex items-center justify-center font-medium ${taken ? 'bg-primary-600 text-white' : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-500'}`}>
                  {i + 1}
                </div>
              );
            })}
          </div>
          <div className="space-y-2 text-sm">
            {accruals.map((r) => (
              <div key={r.c} className="grid grid-cols-4 gap-2 text-xs items-center p-2 rounded bg-secondary-50 dark:bg-secondary-800">
                <Badge variant="outline" size="sm">{r.c}</Badge>
                <span><span className="text-secondary-500">{t('performance.timeOff.accrual')}:</span> {r.accrual}</span>
                <span><span className="text-secondary-500">{t('performance.timeOff.taken')}:</span> {r.taken}</span>
                <span className="font-semibold"><span className="text-secondary-500 font-normal">{t('performance.timeOff.balance')}:</span> {r.balance}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
