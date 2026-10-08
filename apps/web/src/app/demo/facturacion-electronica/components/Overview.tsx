'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  CheckBadgeIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  InboxArrowDownIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import { DEMO_TODAY } from './data';
import { incomingStage } from './docs';
import { SectionTitle } from './ui';
import type { BillingStore, Progress } from './useBillingStore';

function Metric({ icon, label, value, hint, cls }: { icon: ReactNode; label: string; value: string; hint: string; cls: string }) {
  return (
    <div className="rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 p-4 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-secondary-500 dark:text-secondary-400">{label}</p>
        <span className={'inline-flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 ' + cls}>{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-secondary-900 dark:text-white tabular-nums">{value}</p>
      <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">{hint}</p>
    </div>
  );
}

/** Métricas calculadas con los documentos de la simulación (no hay valores fijos). */
export function MetricsRow({ store }: { store: BillingStore }) {
  const t = useTranslations('demoBilling');
  const { docs, incoming } = store.state;
  const month = DEMO_TODAY.slice(0, 7);
  const monthDocs = docs.filter((d) => d.issueDate.startsWith(month) && d.status !== 'rejected');
  const queued = docs.filter((d) => d.status === 'contingency').length;
  const transmitted = docs.filter((d) => d.status !== 'contingency');
  const accepted = transmitted.filter((d) => d.status === 'accepted').length;
  const rate = transmitted.length ? Math.round((accepted / transmitted.length) * 100) : 0;
  const rejected = docs.filter((d) => d.status === 'rejected').length;
  const pendingRadian = incoming.filter((i) => ['new', 'acknowledged', 'received'].includes(incomingStage(i))).length;
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" aria-label={t('metrics.label')}>
      <Metric
        icon={<DocumentTextIcon className="w-5 h-5" />}
        cls="text-primary-600 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-300"
        label={t('metrics.issued')}
        value={String(monthDocs.length)}
        hint={queued ? t('metrics.issuedQueued', { n: queued }) : t('metrics.issuedHint')}
      />
      <Metric
        icon={<CheckBadgeIcon className="w-5 h-5" />}
        cls="text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-300"
        label={t('metrics.acceptance')}
        value={t('metrics.rateValue', { rate })}
        hint={t('metrics.acceptanceHint', { accepted, total: transmitted.length })}
      />
      <Metric
        icon={<ExclamationTriangleIcon className="w-5 h-5" />}
        cls="text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300"
        label={t('metrics.rejected')}
        value={String(rejected)}
        hint={rejected ? t('metrics.rejectedHint') : t('metrics.rejectedNone')}
      />
      <Metric
        icon={<InboxArrowDownIcon className="w-5 h-5" />}
        cls="text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300"
        label={t('metrics.radian')}
        value={String(pendingRadian)}
        hint={t('metrics.radianHint', { total: incoming.length })}
      />
    </section>
  );
}

const STEPS: { key: keyof Progress; target: string }[] = [
  { key: 'invoice', target: 'emision' },
  { key: 'download', target: 'documentos' },
  { key: 'creditNote', target: 'emision' },
  { key: 'radian', target: 'recepcion' },
  { key: 'export', target: 'reportes' },
];

export function TourCard({ store }: { store: BillingStore }) {
  const t = useTranslations('demoBilling');
  const { progress } = store.state;
  const done = STEPS.filter((s) => progress[s.key]).length;
  return (
    <Card variant="bordered" padding="md">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-base font-semibold text-secondary-900 dark:text-white">{t('tour.title')}</h2>
          <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('tour.subtitle')}</p>
        </div>
        <span className="text-sm font-medium text-primary-700 dark:text-primary-300 tabular-nums">{t('tour.done', { done, total: STEPS.length })}</span>
      </div>
      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {STEPS.map((s, i) => {
          const ok = progress[s.key];
          return (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => document.getElementById(s.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className={
                  'w-full h-full text-left rounded-lg border p-3 text-sm transition flex gap-2 ' +
                  (ok
                    ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                    : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-400 text-secondary-700 dark:text-secondary-200')
                }
              >
                {ok ? (
                  <CheckCircleIcon className="w-5 h-5 flex-shrink-0 text-green-600" />
                ) : (
                  <span className="w-5 h-5 flex-shrink-0 rounded-full border border-secondary-300 dark:border-secondary-600 text-[11px] flex items-center justify-center">
                    {i + 1}
                  </span>
                )}
                <span>{t(`tour.steps.${s.key}`)}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

export function ProjectPanel() {
  const t = useTranslations('demoBilling');
  const items = ['provider', 'signature', 'integration', 'storage', 'countries'] as const;
  return (
    <Card variant="bordered" padding="md" className="min-w-0">
      <SectionTitle icon={<WrenchScrewdriverIcon className="w-5 h-5" />} title={t('project.title')} subtitle={t('project.subtitle')} />
      <ul className="space-y-3">
        {items.map((k) => (
          <li key={k} className="text-sm">
            <p className="font-medium text-secondary-900 dark:text-white">{t(`project.items.${k}.title`)}</p>
            <p className="text-secondary-600 dark:text-secondary-300">{t(`project.items.${k}.text`)}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
