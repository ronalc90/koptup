'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { notify } from '../lib/notify';
import { ClipboardDocumentIcon, PaperAirplaneIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { PRESET_CRON, nextRuns, parseCron, type SchedulePreset } from '../lib/cron';
import { evaluateRules } from '../lib/engine';
import { DEMO_NOW, addMinutes, cop, dateTime, dayLabel, time } from '../lib/format';
import { useDemo } from '../lib/store';
import type { Channel, Rule, RuleType, SourceId } from '../lib/types';
import { alertText } from './Overview';
import { Chip, Panel, Section, Toggle, btn, copyText, inputCls } from './ui';

const RULE_TYPES: Record<SourceId, RuleType[]> = {
  precios: ['priceDrop', 'stockBelow'],
  contratacion: ['newProcessOver', 'closingSoon'],
  normativa: ['newDoc'],
  documentos: ['docReview'],
};

const DEFAULT_VALUE: Record<RuleType, number | string> = {
  priceDrop: 10,
  stockBelow: 3,
  newProcessOver: 500_000_000,
  closingSoon: 5,
  newDoc: '',
  docReview: 0,
};

const PRESETS: SchedulePreset[] = ['daily6', 'businessHours', 'every4h', 'weeklyMon', 'custom'];
const CHANNELS: Channel[] = ['email', 'teams', 'whatsapp'];

export default function Alerts({ sourceId }: { sourceId: SourceId }) {
  const t = useTranslations('demoScraping');
  const { s, loc, update } = useDemo();
  const schedule = s.schedules[sourceId];
  const [newType, setNewType] = useState<RuleType>(RULE_TYPES[sourceId][0]);
  const cron = schedule.preset === 'custom' ? schedule.cron : PRESET_CRON[schedule.preset];
  const valid = !!parseCron(cron);
  const runs = useMemo(() => (valid ? nextRuns(cron, DEMO_NOW, 5) : []), [cron, valid]);
  const rules = s.rules.filter((r) => r.sourceId === sourceId);
  const r = s.results[sourceId] ?? null;
  const hits = useMemo(() => evaluateRules(r, s.rules, { corrections: s.corrections }), [r, s.rules, s.corrections]);
  const paused = s.paused.includes(sourceId);

  const setSchedule = (patch: Partial<typeof schedule>) => update((p) => ({ ...p, schedules: { ...p.schedules, [sourceId]: { ...p.schedules[sourceId], ...patch } } }));
  const setRule = (id: string, patch: Partial<Rule>) => update((p) => ({ ...p, rules: p.rules.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));

  const sourceName = t(`sources.${sourceId}.name`);
  const message = [
    t('alerts.message.header', { source: sourceName, date: dateTime(r?.at ?? DEMO_NOW, loc) }),
    ...(hits.length ? hits.map((h) => `• ${alertText(t, h, loc)}`) : [t('alerts.message.none')]),
    t('alerts.message.footer'),
  ].join('\n');

  const sentHere = s.sentAlerts.filter((a) => a.sourceId === sourceId).slice().reverse();

  return (
    <Section title={t('alerts.title')} subtitle={t('alerts.subtitle')}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="space-y-4 lg:col-span-2">
          <div>
            <h3 className="text-sm font-semibold text-white">{t('alerts.when')}</h3>
            <p className="text-xs text-secondary-400">{t('alerts.whenHint')}</p>
          </div>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t('alerts.when')}>
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={schedule.preset === p}
                onClick={() => setSchedule(p === 'custom' ? { preset: p, cron: schedule.preset === 'custom' ? schedule.cron : PRESET_CRON[schedule.preset as Exclude<SchedulePreset, 'custom'>] } : { preset: p })}
                className={`rounded-md border px-3 py-1.5 text-xs ${schedule.preset === p ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200' : 'border-secondary-700 text-secondary-300 hover:text-white'}`}
              >
                {t(`alerts.presets.${p}`)}
              </button>
            ))}
          </div>
          {schedule.preset === 'custom' && (
            <label className="block text-xs font-semibold text-secondary-300">
              {t('alerts.cronLabel')}
              <input value={schedule.cron} onChange={(e) => setSchedule({ cron: e.target.value.slice(0, 80) })} spellCheck={false} className={`${inputCls} mt-1 font-mono ${valid ? '' : '!border-rose-500'}`} />
              <span className={`mt-1 block font-normal ${valid ? 'text-secondary-500' : 'text-rose-300'}`}>{valid ? t('alerts.cronHint') : t('alerts.cronInvalid')}</span>
            </label>
          )}
          <div>
            <h4 className="mb-2 text-xs font-semibold text-secondary-300">{t('alerts.nextRuns')}</h4>
            {runs.length === 0 ? (
              <p className="text-xs text-secondary-500">{t('alerts.noRuns')}</p>
            ) : (
              <ol className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
                {runs.map((x) => (
                  <li key={x} className="rounded-md border border-secondary-800 bg-secondary-950 px-2.5 py-1.5 text-xs text-secondary-200">
                    {dayLabel(x, loc)} · <span className="font-mono">{time(x, loc)}</span>
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-2 text-[11px] text-secondary-500">{paused ? t('alerts.pausedNote') : t('alerts.demoClock', { now: dateTime(DEMO_NOW, loc) })}</p>
          </div>

          <div className="border-t border-secondary-800 pt-4">
            <h3 className="text-sm font-semibold text-white">{t('alerts.rulesTitle')}</h3>
            <p className="mb-3 text-xs text-secondary-400">{t('alerts.rulesHint')}</p>
            <ul className="space-y-2">
              {rules.length === 0 && <li className="text-xs text-secondary-500">{t('alerts.noRules')}</li>}
              {rules.map((rule) => (
                <li key={rule.id} className="flex flex-wrap items-center gap-2 rounded-md border border-secondary-800 bg-secondary-950 p-2.5 text-xs">
                  <Toggle value={rule.enabled} onChange={(v) => setRule(rule.id, { enabled: v })} label={t('alerts.ruleToggle')} />
                  <span className="min-w-0 flex-1 text-secondary-200">
                    {t(`alerts.ruleText.${rule.type}`)}
                    {rule.targetLabel && <span className="block text-[11px] text-secondary-400">{t('alerts.onlyFor', { target: rule.targetLabel })}</span>}
                  </span>
                  {rule.type !== 'docReview' && (
                    rule.type === 'newDoc' ? (
                      <input aria-label={t('alerts.valueLabel')} value={String(rule.value)} placeholder={t('alerts.anyKeyword')} onChange={(e) => setRule(rule.id, { value: e.target.value.slice(0, 40) })} className={`${inputCls} !w-40 !py-1 !text-xs`} />
                    ) : (
                      <span className="flex items-center gap-1">
                        <input
                          aria-label={t('alerts.valueLabel')}
                          type="number"
                          min={0}
                          step={rule.type === 'newProcessOver' ? 10_000_000 : 1}
                          value={Number(rule.value)}
                          onChange={(e) => setRule(rule.id, { value: Math.max(0, Number(e.target.value) || 0) })}
                          className={`${inputCls} !py-1 !text-xs ${rule.type === 'newProcessOver' ? '!w-36' : '!w-20'}`}
                        />
                        <span className="text-secondary-400">{rule.type === 'newProcessOver' ? cop(Number(rule.value), loc) : t(`alerts.units.${rule.type}`)}</span>
                      </span>
                    )
                  )}
                  <button type="button" className={btn.danger} onClick={() => update((p) => ({ ...p, rules: p.rules.filter((x) => x.id !== rule.id) }))} aria-label={t('alerts.deleteRule')}>
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select value={newType} onChange={(e) => setNewType(e.target.value as RuleType)} className={`${inputCls} !w-auto !py-1 !text-xs`} aria-label={t('alerts.newRuleType')}>
                {RULE_TYPES[sourceId].map((rt) => <option key={rt} value={rt}>{t(`alerts.ruleText.${rt}`)}</option>)}
              </select>
              <button
                type="button"
                className={btn.secondary}
                onClick={() => {
                  update((p) => ({ ...p, rules: [...p.rules, { id: `r${p.nextRuleId}`, sourceId, type: newType, value: DEFAULT_VALUE[newType], enabled: true }], nextRuleId: p.nextRuleId + 1 }));
                  notify.success(t('alerts.ruleAdded'));
                }}
              >
                <PlusIcon className="h-4 w-4" />
                {t('alerts.addRule')}
              </button>
            </div>
          </div>
        </Panel>

        <Panel className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white">{t('alerts.channelsTitle')}</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CHANNELS.map((c) => (
                <Chip key={c} active={s.channels.includes(c)} onClick={() => update((p) => ({ ...p, channels: p.channels.includes(c) ? p.channels.filter((x) => x !== c) : [...p.channels, c] }))}>
                  {t(`alerts.channels.${c}`)}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-1 text-xs font-semibold text-secondary-300">{t('alerts.previewTitle', { count: hits.length })}</h4>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-secondary-800 bg-secondary-950 p-3 text-[11px] leading-relaxed text-secondary-200">{message}</pre>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={btn.secondary}
              onClick={async () => {
                const ok = await copyText(message);
                if (ok) notify.success(t('actions.copied'));
                else notify.error(t('actions.copyFailed'));
              }}
            >
              <ClipboardDocumentIcon className="h-4 w-4" />
              {t('alerts.copy')}
            </button>
            <button
              type="button"
              className={btn.primary}
              disabled={s.channels.length === 0}
              onClick={() => {
                update((p) => ({
                  ...p,
                  sentAlerts: [...p.sentAlerts, { id: `a${p.sentAlerts.length + 1}`, sourceId, at: addMinutes(DEMO_NOW, p.manualRuns * 2 + p.sentAlerts.length + 1), channels: p.channels, lines: hits.length }].slice(-30),
                }));
                notify.success(t('alerts.sentToast', { channels: s.channels.map((c) => t(`alerts.channels.${c}`)).join(', ') }));
              }}
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              {t('alerts.sendTest')}
            </button>
          </div>
          <p className="text-[11px] text-secondary-500">{t('alerts.simulatedNote')}</p>
          <div>
            <h4 className="mb-1 text-xs font-semibold text-secondary-300">{t('alerts.sentTitle')}</h4>
            {sentHere.length === 0 ? (
              <p className="text-xs text-secondary-500">{t('alerts.sentNone')}</p>
            ) : (
              <ul className="space-y-1.5">
                {sentHere.map((a) => (
                  <li key={a.id} className="rounded-md border border-secondary-800 bg-secondary-950 px-2.5 py-1.5 text-[11px] text-secondary-300">
                    {dateTime(a.at, loc)} · {a.channels.map((c) => t(`alerts.channels.${c}`)).join(', ')} · {t('alerts.sentLines', { count: a.lines })}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>
      </div>
    </Section>
  );
}
