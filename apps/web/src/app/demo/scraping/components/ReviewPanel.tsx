'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { notify } from '../lib/notify';
import { ClipboardDocumentIcon, ClockIcon, TrashIcon } from '@heroicons/react/24/outline';
import { dateTime } from '../lib/format';
import { useDemo } from '../lib/store';
import type { CustomSource } from '../lib/types';
import { TRIAL_HREF } from './Tour';
import { Panel, Section, btn, copyText } from './ui';

const CHECKS = ['terms', 'robots', 'personal', 'api', 'pace'] as const;

export default function ReviewPanel({ source }: { source: CustomSource }) {
  const t = useTranslations('demoScraping');
  const { loc, update, selectSource } = useDemo();

  const summary = [
    t('review.summaryTitle'),
    `${t('wizard.name')}: ${source.name}`,
    `${source.kind === 'documents' ? t('wizard.originDocs') : t('wizard.url')}: ${source.url}`,
    `${t('wizard.kind')}: ${t(`sources.kind.${source.kind}`)}`,
    `${t('review.fields')}: ${source.fields.join(', ')}`,
    `${t('wizard.frequency')}: ${t(`alerts.presets.${source.preset}`)}`,
    `${t('wizard.destination')}: ${t(`wizard.destinations.${source.destination}`)}`,
  ].join('\n');

  return (
    <Section title={source.name} subtitle={t('review.subtitle', { when: dateTime(source.createdAt, loc) })}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="space-y-3 lg:col-span-2">
          <dl className="grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-secondary-500">{source.kind === 'documents' ? t('wizard.originDocs') : t('wizard.url')}</dt>
              <dd className="break-all font-mono text-[11px] text-secondary-100">{source.url}</dd>
            </div>
            <div>
              <dt className="text-secondary-500">{t('wizard.kind')}</dt>
              <dd className="text-secondary-100">{t(`sources.kind.${source.kind}`)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-secondary-500">{t('review.fields')}</dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {source.fields.map((f) => <span key={f} className="rounded-full bg-secondary-800 px-2 py-0.5 text-[11px] text-secondary-100">{f}</span>)}
              </dd>
            </div>
            <div>
              <dt className="text-secondary-500">{t('wizard.frequency')}</dt>
              <dd className="text-secondary-100">{t(`alerts.presets.${source.preset}`)}</dd>
            </div>
            <div>
              <dt className="text-secondary-500">{t('wizard.destination')}</dt>
              <dd className="text-secondary-100">{t(`wizard.destinations.${source.destination}`)}</dd>
            </div>
          </dl>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-white">{t('review.checksTitle')}</h3>
            <ul className="space-y-1.5">
              {CHECKS.map((c) => (
                <li key={c} className="flex items-start gap-2 text-xs text-secondary-200">
                  <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                  <span>
                    {t(`review.checks.${c}`)} <span className="text-sky-300">· {t('review.pending')}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[11px] text-secondary-500">{t('review.demoNote')}</p>
        </Panel>
        <Panel className="space-y-3">
          <h3 className="text-sm font-semibold text-white">{t('review.nextTitle')}</h3>
          <p className="text-xs text-secondary-400">{t('review.nextText')}</p>
          <button
            type="button"
            className={`${btn.secondary} w-full`}
            onClick={async () => {
              const ok = await copyText(summary);
              if (ok) notify.success(t('actions.copied'));
              else notify.error(t('actions.copyFailed'));
            }}
          >
            <ClipboardDocumentIcon className="h-4 w-4" />
            {t('review.copySummary')}
          </button>
          <Link href={TRIAL_HREF} className={`${btn.primary} w-full`}>{t('actions.requestTrial')}</Link>
          <button
            type="button"
            className={`${btn.danger} w-full`}
            onClick={() => {
              update((p) => ({ ...p, customSources: p.customSources.filter((c) => c.id !== source.id) }));
              selectSource('contratacion');
              notify.success(t('review.deleted'));
            }}
          >
            <TrashIcon className="h-4 w-4" />
            {t('review.delete')}
          </button>
        </Panel>
      </div>
    </Section>
  );
}
