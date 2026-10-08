'use client';

import { useTranslations } from 'next-intl';
import { notify } from '../lib/notify';
import { ArrowDownTrayIcon, CheckCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { sourceMeta } from '../lib/data';
import { DEMO_TODAY, dateTime } from '../lib/format';
import { useDemo } from '../lib/store';
import type { SourceId } from '../lib/types';
import { Panel, Section, btn, downloadText } from './ui';

const SHEET_FIELDS = ['sourceType', 'terms', 'robots', 'rate', 'identification', 'personalData', 'legalBasis', 'retention', 'owner', 'reviewed'] as const;
const PRINCIPLES = ['apiFirst', 'review', 'pace', 'noEvasion', 'personal', 'log'] as const;

export default function Compliance({ sourceId }: { sourceId: SourceId }) {
  const t = useTranslations('demoScraping');
  const { loc, fullHistory } = useDemo();
  const meta = sourceMeta(sourceId);
  const log = fullHistory.filter((h) => h.sourceId === sourceId).slice(0, 8);
  const name = t(`sources.${sourceId}.name`);

  const download = () => {
    const lines = [
      t('compliance.fileTitle', { source: name }),
      t('compliance.fileSample'),
      '',
      `${t('compliance.origin')}: ${meta.origin}`,
      ...SHEET_FIELDS.map((f) => `${t(`compliance.fields.${f}`)}: ${t(`compliance.sheets.${sourceId}.${f}`)}`),
      '',
      `${t('compliance.logTitle')}:`,
      ...log.map((h) => `- ${dateTime(h.at, loc)} · ${t(`values.trigger.${h.trigger}`)} · ${t(`values.runStatus.${h.status}`)} · ${t('compliance.logRecords', { count: h.records })}`),
    ];
    const file = `koptup-demo-ficha-${sourceId}-${DEMO_TODAY}.txt`;
    downloadText(file, `﻿${lines.join('\r\n')}\r\n`, 'text/plain;charset=utf-8');
    notify.success(t('delivery.downloaded', { file }));
  };

  return (
    <Section
      id="scraping-compliance"
      title={t('compliance.title')}
      subtitle={t('compliance.subtitle')}
      right={
        <button type="button" className={btn.secondary} onClick={download}>
          <ArrowDownTrayIcon className="h-4 w-4" />
          {t('compliance.download')}
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white">{t('compliance.sheetTitle', { source: name })}</h3>
            <span className="rounded-full bg-secondary-800 px-2 py-0.5 text-[10px] text-secondary-300">{t('compliance.readOnly')}</span>
          </div>
          <dl className="divide-y divide-secondary-800 text-xs">
            <div className="grid gap-1 py-2 sm:grid-cols-3">
              <dt className="text-secondary-400">{t('compliance.origin')}</dt>
              <dd className="break-words font-mono text-[11px] text-secondary-200 sm:col-span-2">{meta.origin}</dd>
            </div>
            {SHEET_FIELDS.map((f) => (
              <div key={f} className="grid gap-1 py-2 sm:grid-cols-3">
                <dt className="text-secondary-400">{t(`compliance.fields.${f}`)}</dt>
                <dd className="text-secondary-100 sm:col-span-2">{t(`compliance.sheets.${sourceId}.${f}`)}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[11px] text-secondary-500">{t('compliance.sampleNote')}</p>
        </Panel>
        <Panel>
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5 text-emerald-300" />
            <h3 className="text-sm font-semibold text-white">{t('compliance.principlesTitle')}</h3>
          </div>
          <ul className="space-y-2">
            {PRINCIPLES.map((p) => (
              <li key={p} className="flex items-start gap-2 text-xs text-secondary-200">
                <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                {t(`compliance.principles.${p}`)}
              </li>
            ))}
          </ul>
          <p className="mt-3 rounded-lg bg-emerald-500/5 px-3 py-2 text-xs text-emerald-100">{t('compliance.promise')}</p>
        </Panel>
      </div>
      <Panel>
        <h3 className="mb-2 text-sm font-semibold text-white">{t('compliance.logTitle')}</h3>
        <ul className="space-y-1 font-mono text-[11px] text-secondary-300">
          {log.map((h) => (
            <li key={h.id} className="break-words">
              {dateTime(h.at, loc)} · {t(`values.trigger.${h.trigger}`)} · {t(`values.runStatus.${h.status}`)} · {t('compliance.logRecords', { count: h.records })}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-secondary-500">{t('compliance.logNote')}</p>
      </Panel>
    </Section>
  );
}
