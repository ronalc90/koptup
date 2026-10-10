'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowTopRightOnSquareIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { INTEGRATIONS, type IntegrationId } from '../lib/data';
import { Modal, Panel, SimNote } from './ui';

export default function Integrations() {
  const t = useTranslations('demoSign');
  const [open, setOpen] = useState<IntegrationId | null>(null);

  return (
    <div className="space-y-5">
      <Panel title={t('integrations.title')} subtitle={t('integrations.subtitle')}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {INTEGRATIONS.map((k) => (
            <div key={k} className="flex min-w-0 flex-col rounded-lg border border-secondary-200 p-4 dark:border-secondary-700">
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lime-100 font-bold text-lime-800 dark:bg-lime-950 dark:text-lime-300" aria-hidden>
                  {t(`integrations.items.${k}.name`).charAt(0)}
                </span>
                <Badge size="sm" variant="outline">
                  {t('integrations.notConnected')}
                </Badge>
              </div>
              <p className="mt-3 break-words font-medium">{t(`integrations.items.${k}.name`)}</p>
              <p className="mt-1 flex-1 text-xs text-secondary-600 dark:text-secondary-400">{t(`integrations.items.${k}.short`)}</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => setOpen(k)}>
                <InformationCircleIcon className="mr-1 h-4 w-4" /> {t('integrations.details')}
              </Button>
            </div>
          ))}
        </div>
      </Panel>
      <SimNote>{t('integrations.simNote')}</SimNote>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open ? t(`integrations.items.${open}.name`) : ''}>
        {open && (
          <div className="space-y-3 text-sm">
            <p className="font-medium">{t('integrations.whatItDoes')}</p>
            <ul className="list-disc space-y-1 pl-5 text-secondary-700 dark:text-secondary-300">
              {(t.raw(`integrations.items.${open}.does`) as string[]).map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <p className="rounded-lg bg-secondary-100 p-2 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-200">{t(`integrations.items.${open}.inDemo`)}</p>
            <p className="text-xs text-secondary-500">{t('integrations.buildNote')}</p>
            <div className="flex justify-end">
              <Link
                href="/solicitar-demo?demos=firma-electronica"
                className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                {t('integrations.ask')} <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
