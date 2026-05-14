'use client';

import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import { ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { ArchNode } from './shared';

export default function OverviewTab() {
  const t = useTranslations('demoSaas');

  return (
    <section className="space-y-6">
      <Card variant="bordered">
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">{t('overview.title')}</h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">{t('overview.subtitle')}</p>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <ArchNode title={t('overview.nodes.frontend')} sub={t('overview.nodes.frontendSub')} accent="border-primary-300 dark:border-primary-700" />
          <ArchNode title={t('overview.nodes.api')} sub={t('overview.nodes.apiSub')} accent="border-blue-300 dark:border-blue-700" />
          <ArchNode title={t('overview.nodes.auth')} sub={t('overview.nodes.authSub')} accent="border-emerald-300 dark:border-emerald-700" />
          <ArchNode title={t('overview.nodes.cache')} sub={t('overview.nodes.cacheSub')} accent="border-red-300 dark:border-red-700" />
        </div>
        <div className="mt-3 flex justify-center text-secondary-400">
          <ArrowRightIcon className="w-5 h-5 rotate-90" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ArchNode title={t('overview.nodes.db')} sub={t('overview.nodes.dbSub')} accent="border-fuchsia-300 dark:border-fuchsia-700" />
          <ArchNode title={t('overview.nodes.queue')} sub={t('overview.nodes.queueSub')} accent="border-amber-300 dark:border-amber-700" />
          <ArchNode title={t('overview.nodes.webhooks')} sub={t('overview.nodes.webhooksSub')} accent="border-cyan-300 dark:border-cyan-700" />
          <ArchNode title={t('overview.nodes.billing')} sub={t('overview.nodes.billingSub')} accent="border-violet-300 dark:border-violet-700" />
        </div>
      </Card>

      <Card variant="bordered">
        <h3 className="text-base font-semibold text-secondary-900 dark:text-white mb-3">{t('overview.highlights.title')}</h3>
        <ul className="space-y-2">
          {(t.raw('overview.highlights.items') as string[]).map((it) => (
            <li key={it} className="flex items-start gap-2 text-sm text-secondary-700 dark:text-secondary-300">
              <CheckCircleIcon className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
