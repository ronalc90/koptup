'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  MegaphoneIcon,
  NoSymbolIcon,
  PlayIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { CAMPAIGN_CONTACTS } from './scenarios';
import { campaignTotals, checkContactWindow, downloadText, evaluateContact, sortContacts, toCsv } from './engine';
import { formatWhen } from './format';
import { Metric, PanelTitle } from './parts';
import type { T } from './parts';
import type { ContactCheck } from './types';

const STEP_MS = 350;

export function blockReasonText(t: T, r: Extract<ContactCheck, { kind: 'blocked' }>): string {
  if (r.reason === 'holiday') return t('campaign.blocked.holiday', { name: t(`holidays.${r.holiday}`) });
  return t(`campaign.blocked.${r.reason}`);
}

export default function CampaignPanel({ t, notify, resetKey }: { t: T; notify: (msg: string) => void; resetKey: number }) {
  const contacts = useMemo(() => sortContacts(CAMPAIGN_CONTACTS), []);
  const [processed, setProcessed] = useState(0);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [testDate, setTestDate] = useState('2026-10-11');
  const [testTime, setTestTime] = useState('11:00');

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => {
      setProcessed((p) => Math.min(p + 1, contacts.length));
    }, STEP_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running, contacts.length]);

  useEffect(() => {
    if (running && processed >= contacts.length) setRunning(false);
  }, [running, processed, contacts.length]);

  // "Restablecer" de la página reinicia la campaña.
  useEffect(() => {
    setRunning(false);
    setProcessed(0);
    setTestDate('2026-10-11');
    setTestTime('11:00');
  }, [resetKey]);

  const totals = campaignTotals(contacts, processed);
  const finished = processed >= contacts.length;
  const test = checkContactWindow(testDate, testTime);
  const testWhen = testDate && testTime ? formatWhen(t, testDate, testTime) : '';

  const statusText = (i: number) => {
    if (i >= processed) return t('campaign.waiting');
    const r = evaluateContact(contacts[i]);
    if (r.kind === 'blocked') return blockReasonText(t, r);
    return t(`campaign.outcomes.${contacts[i].outcome}`);
  };

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      [t('campaign.columns.contact'), t('campaign.columns.number'), t('campaign.columns.scheduled'), t('campaign.columns.result')],
      ...contacts.map((c, i) => [c.name, c.number, formatWhen(t, c.date, c.time), statusText(i)]),
    ];
    downloadText(t('campaign.fileName'), toCsv(rows), 'text/csv');
    notify(t('campaign.exported'));
  };

  return (
    <Card variant="bordered" className="bg-slate-900/60 border-slate-800" padding="md">
      <PanelTitle
        icon={<MegaphoneIcon className="h-4 w-4 text-emerald-400" />}
        title={t('campaign.title')}
        subtitle={t('campaign.subtitle', { count: contacts.length })}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-4 min-w-0">
          <div className="rounded-lg border border-slate-700/60 bg-slate-800/30 p-3">
            <div className="text-xs font-medium text-slate-200 mb-2 flex items-center gap-1.5">
              <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
              {t('campaign.rulesTitle')}
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300 list-disc pl-4">
              <li>{t('campaign.rules.window')}</li>
              <li>{t('campaign.rules.noSunday')}</li>
              <li>{t('campaign.rules.frequency')}</li>
              <li>{t('campaign.rules.exclusion')}</li>
            </ul>
            <p className="mt-2 text-[11px] text-slate-400">{t('campaign.legalNote')}</p>
          </div>

          <div className="rounded-lg border border-slate-700/60 bg-slate-800/30 p-3">
            <div className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
              <CalendarDaysIcon className="h-4 w-4 text-cyan-400" />
              {t('campaign.tester.title')}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 mb-2">{t('campaign.tester.subtitle')}</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] text-slate-400 min-w-0">
                {t('campaign.tester.date')}
                <input
                  type="date"
                  min="2026-01-01"
                  max="2026-12-31"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 [color-scheme:dark]"
                />
              </label>
              <label className="text-[11px] text-slate-400 min-w-0">
                {t('campaign.tester.time')}
                <input
                  type="time"
                  value={testTime}
                  onChange={(e) => setTestTime(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 [color-scheme:dark]"
                />
              </label>
            </div>
            <div
              data-testid="voice-rule-result"
              aria-live="polite"
              className={cn(
                'mt-2 rounded-md px-2.5 py-2 text-xs flex items-start gap-1.5',
                test.kind === 'allowed' ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-200 border border-rose-500/30',
              )}
            >
              {test.kind === 'allowed' ? <CheckCircleIcon className="h-4 w-4 shrink-0" /> : <NoSymbolIcon className="h-4 w-4 shrink-0" />}
              <span>
                {test.kind === 'allowed'
                  ? t('campaign.tester.allowed', { when: testWhen })
                  : test.reason === 'invalid'
                    ? t('campaign.blocked.invalid')
                    : t('campaign.tester.blocked', { reason: blockReasonText(t, test), when: testWhen })}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 min-w-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs mb-3">
            <Metric label={t('campaign.metrics.scheduled')} value={totals.scheduled} />
            <Metric label={t('campaign.metrics.blocked')} value={totals.blocked} />
            <Metric label={t('campaign.metrics.dialed')} value={totals.dialed} />
            <Metric label={t('campaign.metrics.connected')} value={totals.connected} />
            <Metric label={t('campaign.metrics.voicemail')} value={totals.voicemail} />
            <Metric label={t('campaign.metrics.agreements')} value={totals.agreements} />
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {!finished ? (
              <button
                type="button"
                onClick={() => setRunning(true)}
                disabled={running}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-3 py-1.5 text-xs font-semibold text-white"
              >
                <PlayIcon className="h-4 w-4" />
                {running ? t('campaign.running') : t('campaign.run')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setProcessed(0)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/60 hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100"
              >
                <ArrowPathIcon className="h-4 w-4" />
                {t('campaign.reset')}
              </button>
            )}
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/60 hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              {t('campaign.export')}
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-800 bg-slate-900/60">
                  <th className="font-medium px-2.5 py-2">{t('campaign.columns.contact')}</th>
                  <th className="font-medium px-2.5 py-2 hidden sm:table-cell">{t('campaign.columns.scheduled')}</th>
                  <th className="font-medium px-2.5 py-2">{t('campaign.columns.result')}</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c, i) => {
                  const r = i < processed ? evaluateContact(c) : null;
                  return (
                    <tr key={c.id} className={cn('border-b border-slate-800/60', i === processed && running && 'bg-cyan-500/5')}>
                      <td className="px-2.5 py-2">
                        <div className="text-slate-100">{c.name}</div>
                        <div className="font-mono text-[11px] text-slate-400">{c.number}</div>
                        <div className="sm:hidden text-[11px] text-slate-300">{formatWhen(t, c.date, c.time, 'short')}</div>
                      </td>
                      <td className="px-2.5 py-2 text-slate-300 whitespace-nowrap hidden sm:table-cell">{formatWhen(t, c.date, c.time, 'short')}</td>
                      <td className="px-2.5 py-2">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[11px]',
                            !r && 'bg-slate-700/40 text-slate-400',
                            r?.kind === 'blocked' && 'bg-rose-500/15 text-rose-300',
                            r?.kind === 'allowed' && 'bg-emerald-500/15 text-emerald-300',
                          )}
                        >
                          {statusText(i)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">{t('campaign.simulated')}</p>
        </div>
      </div>
    </Card>
  );
}
