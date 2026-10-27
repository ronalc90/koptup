'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  MegaphoneIcon,
  NoSymbolIcon,
  PlayIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrashIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { CAMPAIGN_CONTACTS } from './scenarios';
import { campaignTotals, checkContactWindow, downloadText, evaluateCampaign, maskColombianNumber, sortContacts, toCsv } from './engine';
import { formatWhen } from './format';
import { Metric, PanelTitle } from './parts';
import type { T } from './parts';
import { CAMPAIGN_OUTCOMES } from './types';
import type { CampaignContact, CampaignOutcome, ContactCheck } from './types';

const STEP_MS = 350;
const CAMPAIGN_KEY = 'koptup-demo-voice-ai-campaign-v1';
const MAX_CONTACTS = 40;
const TEST_DEFAULT = { date: '2026-10-11', time: '11:00' };
const FORM_DEFAULT = { name: '', number: '', date: '2026-10-14', time: '10:00', outcome: 'agreement' as CampaignOutcome };

interface CampaignSaved {
  contacts?: CampaignContact[];
  processed?: number;
}

export function blockReasonText(t: T, r: Extract<ContactCheck, { kind: 'blocked' }>): string {
  if (r.reason === 'holiday') return t('campaign.blocked.holiday', { name: t(`holidays.${r.holiday}`) });
  return t(`campaign.blocked.${r.reason}`);
}

function isContact(x: unknown): x is CampaignContact {
  if (!x || typeof x !== 'object') return false;
  const c = x as Record<string, unknown>;
  return (
    typeof c.id === 'string' &&
    typeof c.name === 'string' &&
    typeof c.number === 'string' &&
    typeof c.date === 'string' &&
    typeof c.time === 'string' &&
    CAMPAIGN_OUTCOMES.includes(c.outcome as CampaignOutcome)
  );
}

const DEFAULT_CONTACTS = sortContacts(CAMPAIGN_CONTACTS);

export default function CampaignPanel({
  t,
  notify,
  resetKey,
  onFinished,
}: {
  t: T;
  notify: (msg: string) => void;
  resetKey: number;
  onFinished: () => void;
}) {
  const [contacts, setContacts] = useState<CampaignContact[]>(DEFAULT_CONTACTS);
  const [processed, setProcessed] = useState(0);
  const [running, setRunning] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [testDate, setTestDate] = useState(TEST_DEFAULT.date);
  const [testTime, setTestTime] = useState(TEST_DEFAULT.time);

  const [form, setForm] = useState(FORM_DEFAULT);
  const [formError, setFormError] = useState<string | null>(null);

  /* ---------------------------- Persistencia ---------------------------- */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CAMPAIGN_KEY);
      if (raw) {
        const s = JSON.parse(raw) as CampaignSaved;
        if (Array.isArray(s.contacts) && s.contacts.every(isContact)) {
          const list = sortContacts(s.contacts.slice(0, MAX_CONTACTS));
          setContacts(list);
          if (typeof s.processed === 'number' && s.processed >= 0) setProcessed(Math.min(Math.floor(s.processed), list.length));
        }
      }
    } catch {
      /* almacenamiento no disponible */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      const data: CampaignSaved = { contacts, processed };
      window.localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(data));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [loaded, contacts, processed]);

  // «Restablecer» de la página: vuelve a los contactos de ejemplo (no se ejecuta al montar).
  const lastReset = useRef(resetKey);
  useEffect(() => {
    if (lastReset.current === resetKey) return;
    lastReset.current = resetKey;
    setRunning(false);
    setProcessed(0);
    setContacts(DEFAULT_CONTACTS);
    setTestDate(TEST_DEFAULT.date);
    setTestTime(TEST_DEFAULT.time);
    setForm(FORM_DEFAULT);
    setFormError(null);
    try {
      window.localStorage.removeItem(CAMPAIGN_KEY);
    } catch {
      /* almacenamiento no disponible */
    }
  }, [resetKey]);

  /* ------------------------------ Marcador ------------------------------ */
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
    if (running && processed >= contacts.length) {
      setRunning(false);
      onFinished();
    }
  }, [running, processed, contacts.length, onFinished]);

  const checks = useMemo(() => evaluateCampaign(contacts), [contacts]);
  const totals = campaignTotals(contacts, processed, checks);
  const finished = contacts.length > 0 && processed >= contacts.length;
  const test = checkContactWindow(testDate, testTime);
  const testWhen = testDate && testTime ? formatWhen(t, testDate, testTime) : '';

  const statusText = (i: number) => {
    if (i >= processed) return t('campaign.waiting');
    const r = checks[i];
    if (r.kind === 'blocked') return blockReasonText(t, r);
    return t(`campaign.outcomes.${contacts[i].outcome}`);
  };

  /* ------------------------------ Edición ------------------------------ */
  const edit = (next: CampaignContact[]) => {
    if (processed > 0) notify(t('campaign.edited'));
    setProcessed(0);
    setContacts(sortContacts(next));
  };

  const toggleExcluded = (c: CampaignContact) => {
    if (running) return;
    edit(contacts.map((x) => (x.id === c.id ? { ...x, excluded: !x.excluded } : x)));
    if (processed === 0) notify(t(c.excluded ? 'campaign.includedToast' : 'campaign.excludedToast', { name: c.name }));
  };

  const removeContact = (c: CampaignContact) => {
    if (running) return;
    edit(contacts.filter((x) => x.id !== c.id));
    if (processed === 0) notify(t('campaign.removedToast', { name: c.name }));
  };

  const addContact = (e: FormEvent) => {
    e.preventDefault();
    if (running || contacts.length >= MAX_CONTACTS) return;
    const name = form.name.trim().slice(0, 40);
    if (!name) {
      setFormError(t('campaign.form.errorName'));
      return;
    }
    const number = maskColombianNumber(form.number);
    if (!number) {
      setFormError(t('campaign.form.errorNumber'));
      return;
    }
    const when = checkContactWindow(form.date, form.time);
    if (when.kind === 'blocked' && (when.reason === 'invalid' || when.reason === 'outOfRange')) {
      setFormError(t('campaign.form.errorWhen'));
      return;
    }
    const nextId = contacts.reduce((m, c) => Math.max(m, Number(c.id.replace(/\D/g, '')) || 0), 100) + 1;
    edit([...contacts, { id: `u${nextId}`, name, number, date: form.date, time: form.time, outcome: form.outcome, custom: true }]);
    setForm({ ...FORM_DEFAULT, date: form.date, time: form.time });
    setFormError(null);
    if (processed === 0) notify(t('campaign.form.added', { name }));
  };

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      [t('campaign.columns.contact'), t('campaign.columns.number'), t('campaign.columns.scheduled'), t('campaign.columns.result')],
      ...contacts.map((c, i) => [c.name, c.number, formatWhen(t, c.date, c.time), statusText(i)]),
    ];
    downloadText(t('campaign.fileName'), toCsv(rows), 'text/csv');
    notify(t('campaign.exported'));
  };

  const inputCls =
    'mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 [color-scheme:dark] disabled:opacity-50';

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
                  min="2024-01-01"
                  max="2099-12-31"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className={inputCls}
                />
              </label>
              <label className="text-[11px] text-slate-400 min-w-0">
                {t('campaign.tester.time')}
                <input type="time" value={testTime} onChange={(e) => setTestTime(e.target.value)} className={inputCls} />
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
                  : test.reason === 'invalid' || test.reason === 'outOfRange'
                    ? t(`campaign.blocked.${test.reason}`)
                    : t('campaign.tester.blocked', { reason: blockReasonText(t, test), when: testWhen })}
              </span>
            </div>
          </div>

          <form onSubmit={addContact} noValidate className="rounded-lg border border-slate-700/60 bg-slate-800/30 p-3" aria-labelledby="voice-add-contact">
            <div id="voice-add-contact" className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
              <UserPlusIcon className="h-4 w-4 text-violet-300" />
              {t('campaign.form.title')}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 mb-2">{t('campaign.form.hint')}</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="col-span-2 sm:col-span-1 lg:col-span-2 text-[11px] text-slate-400 min-w-0">
                {t('campaign.form.name')}
                <input
                  type="text"
                  autoComplete="off"
                  value={form.name}
                  maxLength={40}
                  disabled={running}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t('campaign.form.namePlaceholder')}
                  className={inputCls}
                />
              </label>
              <label className="col-span-2 sm:col-span-1 lg:col-span-2 text-[11px] text-slate-400 min-w-0">
                {t('campaign.form.number')}
                <input
                  type="tel"
                  autoComplete="off"
                  inputMode="numeric"
                  value={form.number}
                  maxLength={16}
                  disabled={running}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  placeholder={t('campaign.form.numberPlaceholder')}
                  className={inputCls}
                />
              </label>
              <label className="text-[11px] text-slate-400 min-w-0">
                {t('campaign.form.date')}
                <input
                  type="date"
                  min="2024-01-01"
                  max="2099-12-31"
                  value={form.date}
                  disabled={running}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label className="text-[11px] text-slate-400 min-w-0">
                {t('campaign.form.time')}
                <input
                  type="time"
                  value={form.time}
                  disabled={running}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label className="col-span-2 text-[11px] text-slate-400 min-w-0">
                {t('campaign.form.outcome')}
                <select
                  value={form.outcome}
                  disabled={running}
                  onChange={(e) => setForm({ ...form, outcome: e.target.value as CampaignOutcome })}
                  className={inputCls}
                >
                  {CAMPAIGN_OUTCOMES.map((o) => (
                    <option key={o} value={o}>
                      {t(`campaign.outcomes.${o}`)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {formError && (
              <p role="alert" className="mt-2 text-[11px] text-rose-300">
                {formError}
              </p>
            )}
            {contacts.length >= MAX_CONTACTS && (
              <p className="mt-2 text-[11px] text-amber-200" data-testid="voice-campaign-full">
                {t('campaign.form.full', { max: MAX_CONTACTS })}
              </p>
            )}
            <button
              type="submit"
              disabled={running || contacts.length >= MAX_CONTACTS}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-medium text-violet-200"
            >
              <PlusIcon className="h-4 w-4" />
              {t('campaign.form.submit')}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 min-w-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs mb-3" data-testid="voice-campaign-metrics">
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
                disabled={running || contacts.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-semibold text-white"
              >
                <PlayIcon className="h-4 w-4" />
                {running ? t('campaign.running') : processed > 0 ? t('campaign.continue') : t('campaign.run')}
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
              disabled={contacts.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/60 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-medium text-slate-100"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              {t('campaign.export')}
            </button>
          </div>
          {running && <p className="mb-2 text-[11px] text-slate-400">{t('campaign.lockedWhileRunning')}</p>}

          <div className="relative overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-xs" data-testid="voice-campaign">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-800 bg-slate-900/60">
                  <th className="font-medium px-2.5 py-2">{t('campaign.columns.contact')}</th>
                  <th className="font-medium px-2.5 py-2 hidden sm:table-cell">{t('campaign.columns.scheduled')}</th>
                  <th className="font-medium px-2.5 py-2">{t('campaign.columns.result')}</th>
                  <th className="font-medium px-2.5 py-2 text-right">
                    <span className="sr-only sm:not-sr-only">{t('campaign.columns.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {contacts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-2.5 py-6 text-center text-slate-400">
                      {t('campaign.empty')}
                    </td>
                  </tr>
                )}
                {contacts.map((c, i) => {
                  const r = i < processed ? checks[i] : null;
                  return (
                    <tr key={c.id} className={cn('border-b border-slate-800/60', i === processed && running && 'bg-cyan-500/5')}>
                      <td className="px-2.5 py-2 min-w-0">
                        <div className="text-slate-100 flex flex-wrap items-center gap-1.5">
                          {c.name}
                          {c.custom && (
                            <span className="rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[10px] text-violet-200">{t('campaign.custom')}</span>
                          )}
                          {c.excluded && <NoSymbolIcon className="h-3.5 w-3.5 text-rose-300" aria-hidden="true" />}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 whitespace-nowrap">{c.number}</div>
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
                      <td className="px-2.5 py-2">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => toggleExcluded(c)}
                            disabled={running}
                            aria-pressed={!!c.excluded}
                            aria-label={c.excluded ? t('campaign.include', { name: c.name }) : t('campaign.exclude', { name: c.name })}
                            title={c.excluded ? t('campaign.include', { name: c.name }) : t('campaign.exclude', { name: c.name })}
                            className={cn(
                              'rounded-md border p-1.5 disabled:opacity-40 disabled:cursor-not-allowed',
                              c.excluded ? 'border-rose-500/40 bg-rose-500/15 text-rose-200' : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white',
                            )}
                          >
                            <NoSymbolIcon className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeContact(c)}
                            disabled={running}
                            aria-label={t('campaign.remove', { name: c.name })}
                            title={t('campaign.remove', { name: c.name })}
                            className="rounded-md border border-slate-700 bg-slate-800/60 p-1.5 text-slate-300 hover:text-rose-200 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
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
