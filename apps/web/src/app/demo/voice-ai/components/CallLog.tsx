'use client';

import { useState } from 'react';
import { ArrowDownTrayIcon, ChartBarIcon, PhoneIcon, PlayCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { computeKpis, downloadText, toCsv } from './engine';
import { decimal, pct } from './format';
import { KpiCard, PanelTitle, SentimentPill, Tabs } from './parts';
import type { T } from './parts';
import type { CallRow, ScenarioId } from './types';
import { RESULT_TONE, fmtTime } from './types';

type Tab = 'all' | 'inbound' | 'outbound';

export function KpiPanel({ rows, t, locale }: { rows: CallRow[]; t: T; locale: string }) {
  const k = computeKpis(rows);
  return (
    <Card variant="bordered" className="bg-slate-900/60 border-slate-800 lg:col-span-2" padding="md">
      <PanelTitle icon={<ChartBarIcon className="h-4 w-4 text-cyan-400" />} title={t('kpis.title')} subtitle={t('kpis.subtitle')} />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3" data-testid="voice-kpis">
        <KpiCard label={t('kpis.total')} sub={t('kpis.totalSub', { answered: k.answered })} value={String(k.total)} tone="sky" />
        <KpiCard label={t('kpis.containment')} sub={t('kpis.containmentSub')} value={pct(k.containment, locale)} tone="fuchsia" />
        <KpiCard label={t('kpis.aht')} sub={t('kpis.ahtSub')} value={fmtTime(Math.round(k.aht))} tone="cyan" />
        <KpiCard label={t('kpis.transferred')} sub={t('kpis.transferredSub')} value={String(k.transferred)} tone="violet" />
        <KpiCard
          label={t('kpis.csat')}
          sub={k.csat === null ? t('kpis.csatNone') : t('kpis.csatSub', { n: k.csatResponses })}
          value={k.csat === null ? '—' : `${decimal(k.csat, locale)}/5`}
          tone="emerald"
        />
        <KpiCard label={t('kpis.positive')} sub={t('kpis.positiveSub')} value={pct(k.positive, locale)} tone="amber" />
      </div>
    </Card>
  );
}

export default function CallLog({
  rows,
  t,
  onOpen,
  onClearMine,
  notify,
}: {
  rows: CallRow[];
  t: T;
  onOpen: (id: ScenarioId) => void;
  onClearMine: () => void;
  notify: (msg: string) => void;
}) {
  const [tab, setTab] = useState<Tab>('all');
  const shown = rows.filter((r) => tab === 'all' || r.direction === tab);
  const hasMine = rows.some((r) => r.mine);

  const exportCsv = () => {
    const data: (string | number)[][] = [
      [
        t('log.columns.time'),
        t('log.columns.number'),
        t('call.channel'),
        t('log.columns.reason'),
        t('log.columns.duration'),
        t('log.columns.result'),
        t('log.columns.sentiment'),
        t('log.columns.csat'),
      ],
      ...shown.map((r) => [
        r.mine ? `${r.time} (${t('log.mine')})` : r.time,
        r.number,
        t(`direction.${r.direction}`),
        t(`intents.${r.intent}`),
        fmtTime(r.durationSec),
        t(`log.results.${r.result}`),
        t(`sentiment.${r.sentiment}`),
        r.csat ?? '',
      ]),
    ];
    downloadText(t('log.fileName'), toCsv(data), 'text/csv');
    notify(t('log.exported'));
  };

  return (
    <Card variant="bordered" className="bg-slate-900/60 border-slate-800" padding="md">
      <PanelTitle
        icon={<PhoneIcon className="h-4 w-4 text-emerald-400" />}
        title={t('log.title')}
        subtitle={t('log.subtitle')}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Tabs<Tab>
              label={t('log.title')}
              value={tab}
              onChange={setTab}
              items={[
                { key: 'all', label: t('log.tabs.all') },
                { key: 'inbound', label: t('log.tabs.inbound') },
                { key: 'outbound', label: t('log.tabs.outbound') },
              ]}
            />
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1 text-xs text-slate-100"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              {t('log.export')}
            </button>
            {hasMine && (
              <button
                type="button"
                onClick={onClearMine}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 text-xs text-rose-200"
              >
                <TrashIcon className="h-4 w-4" />
                {t('log.clearMine')}
              </button>
            )}
          </div>
        }
      />

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-xs min-w-[720px]" data-testid="voice-call-log">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-800 bg-slate-900/60">
              <th className="font-medium px-2.5 py-2">{t('log.columns.time')}</th>
              <th className="font-medium px-2.5 py-2">{t('log.columns.number')}</th>
              <th className="font-medium px-2.5 py-2">{t('log.columns.reason')}</th>
              <th className="font-medium px-2.5 py-2">{t('log.columns.duration')}</th>
              <th className="font-medium px-2.5 py-2">{t('log.columns.result')}</th>
              <th className="font-medium px-2.5 py-2">{t('log.columns.sentiment')}</th>
              <th className="font-medium px-2.5 py-2 text-right">{t('log.columns.csat')}</th>
              <th className="font-medium px-2.5 py-2 text-right">{t('log.columns.scenario')}</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={8} className="px-2.5 py-6 text-center text-slate-400">
                  {t('log.empty')}
                </td>
              </tr>
            )}
            {shown.map((r) => (
              <tr key={r.id} className={cn('border-b border-slate-800/60', r.mine && 'bg-cyan-500/5')}>
                <td className="px-2.5 py-2 font-mono text-slate-300 whitespace-nowrap">
                  {r.time}
                  {r.mine && (
                    <span className="ml-1.5 rounded-full bg-cyan-500/15 px-1.5 py-0.5 font-sans text-[10px] text-cyan-300">{t('log.mine')}</span>
                  )}
                </td>
                <td className="px-2.5 py-2 font-mono text-slate-200 whitespace-nowrap">
                  {r.number}
                  <span className="ml-1.5 font-sans text-[10px] text-slate-500">{t(`direction.${r.direction}`)}</span>
                </td>
                <td className="px-2.5 py-2 text-slate-200">{t(`intents.${r.intent}`)}</td>
                <td className="px-2.5 py-2 font-mono text-slate-300">{fmtTime(r.durationSec)}</td>
                <td className="px-2.5 py-2">
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap', RESULT_TONE[r.result])}>
                    {t(`log.results.${r.result}`)}
                  </span>
                </td>
                <td className="px-2.5 py-2">
                  <SentimentPill value={r.sentiment} t={t} />
                </td>
                <td className="px-2.5 py-2 text-right font-mono text-slate-200">{r.csat ?? t('log.noCsat')}</td>
                <td className="px-2.5 py-2 text-right">
                  {r.scenario && (
                    <button
                      type="button"
                      onClick={() => onOpen(r.scenario as ScenarioId)}
                      title={t('log.openHint')}
                      className="inline-flex items-center gap-1 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-200 hover:bg-cyan-500/20"
                    >
                      <PlayCircleIcon className="h-3.5 w-3.5" />
                      {t('log.open')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
