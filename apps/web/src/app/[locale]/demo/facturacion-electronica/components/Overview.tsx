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
import { Link } from '@/i18n/navigation';
import Card from '@/components/ui/Card';
import { incomingStage, isPendingStage } from './docs';
import { focusRing, SectionTitle, useMonthLabel } from './ui';
import type { BillingStore, EmissionTab, Progress } from './useBillingStore';
import { GUIDED_DEMO_HREF } from './links';

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
  const monthLabel = useMonthLabel();
  const { docs, incoming } = store.state;
  const month = store.today.slice(0, 7);
  const monthDocs = docs.filter((d) => d.issueDate.startsWith(month) && d.status !== 'rejected');
  const queued = docs.filter((d) => d.status === 'contingency').length;
  const transmitted = docs.filter((d) => d.status !== 'contingency');
  const accepted = transmitted.filter((d) => d.status === 'accepted').length;
  const rate = transmitted.length ? Math.round((accepted / transmitted.length) * 100) : 0;
  const rejected = docs.filter((d) => d.status === 'rejected').length;
  const pendingRadian = incoming.filter((i) => isPendingStage(incomingStage(i, store.today))).length;
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" aria-label={t('metrics.label')}>
      <Metric
        icon={<DocumentTextIcon className="w-5 h-5" />}
        cls="text-primary-600 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-300"
        label={t('metrics.issued', { month: monthLabel(month) })}
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

const STEPS: { key: keyof Progress; target: string; tab?: EmissionTab }[] = [
  { key: 'invoice', target: 'emision', tab: 'factura' },
  { key: 'download', target: 'documentos' },
  { key: 'creditNote', target: 'emision', tab: 'notaCredito' },
  { key: 'radian', target: 'recepcion' },
  { key: 'export', target: 'reportes' },
];

export const TOUR_ID = 'recorrido';

export function TourCard({ store }: { store: BillingStore }) {
  const t = useTranslations('demoBilling');
  const { progress } = store.state;
  const done = STEPS.filter((s) => progress[s.key]).length;
  const nextKey = STEPS.find((s) => !progress[s.key])?.key;

  const go = (s: (typeof STEPS)[number]) => {
    // Los pasos de emisión abren la pestaña que toca (si no hay un envío en curso).
    if (s.tab && s.tab !== store.tab) store.setTab(s.tab);
    document.getElementById(s.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Card variant="bordered" padding="md" id={TOUR_ID} className="scroll-mt-24">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-base font-semibold text-secondary-900 dark:text-white">{t('tour.title')}</h2>
          <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('tour.subtitle')}</p>
        </div>
        <span className="text-sm font-medium text-primary-700 dark:text-primary-300 tabular-nums" aria-live="polite">
          {t('tour.done', { done, total: STEPS.length })}
        </span>
      </div>
      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {STEPS.map((s, i) => {
          const ok = progress[s.key];
          const isNext = s.key === nextKey;
          return (
            <li key={s.key}>
              <button
                type="button"
                data-tour-step={s.key}
                onClick={() => go(s)}
                aria-describedby={isNext ? 'fe-tour-next' : undefined}
                className={
                  'w-full h-full text-left rounded-lg border p-3 text-sm transition flex gap-2 ' +
                  focusRing +
                  ' ' +
                  (ok
                    ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                    : isNext
                      ? 'border-primary-400 dark:border-primary-500 bg-primary-50/60 dark:bg-primary-950/30 text-secondary-800 dark:text-secondary-100 hover:border-primary-500'
                      : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-400 text-secondary-700 dark:text-secondary-200')
                }
              >
                {ok ? (
                  <CheckCircleIcon className="w-5 h-5 flex-shrink-0 text-green-600" aria-label={t('tour.doneStep')} />
                ) : (
                  <span className="w-5 h-5 flex-shrink-0 rounded-full border border-secondary-300 dark:border-secondary-600 text-[11px] flex items-center justify-center">
                    {i + 1}
                  </span>
                )}
                <span className="min-w-0">
                  {t(`tour.steps.${s.key}`)}
                  {isNext && (
                    <span id="fe-tour-next" className="mt-1 block text-[11px] font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">
                      {t('tour.next')}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      {done === STEPS.length && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-800 dark:text-green-200">
          <span>{t('tour.finished')}</span>
          <Link href={GUIDED_DEMO_HREF} className={'font-semibold underline ' + focusRing}>
            {t('tour.finishedCta')}
          </Link>
        </div>
      )}
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
