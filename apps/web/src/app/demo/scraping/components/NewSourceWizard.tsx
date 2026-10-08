'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { notify } from '../lib/notify';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { SchedulePreset } from '../lib/cron';
import { DEMO_NOW, addMinutes } from '../lib/format';
import { useDemo } from '../lib/store';
import type { SourceKind } from '../lib/types';
import { Chip, Modal, btn, inputCls } from './ui';

const KINDS: SourceKind[] = ['web', 'api', 'documents'];
const PRESETS: Exclude<SchedulePreset, 'custom'>[] = ['daily6', 'businessHours', 'every4h', 'weeklyMon'];
const DESTINATIONS = ['csv', 'sheets', 'bi', 'api', 'email'] as const;
const SUGGESTED: Record<SourceKind, string[]> = {
  web: ['product', 'price', 'previousPrice', 'availability', 'shipping', 'link'],
  api: ['entity', 'object', 'amount', 'date', 'location', 'status'],
  documents: ['nit', 'companyName', 'legalRep', 'ciiu', 'docDate', 'total'],
};

export function isHttpUrl(v: string): boolean {
  try {
    const u = new URL(v.trim());
    return (u.protocol === 'http:' || u.protocol === 'https:') && !!u.hostname && u.hostname.includes('.');
  } catch {
    return false;
  }
}

export default function NewSourceWizard({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const t = useTranslations('demoScraping');
  const { s, update, selectSource } = useDemo();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [kind, setKind] = useState<SourceKind>('web');
  const [fields, setFields] = useState<string[]>([]);
  const [custom, setCustom] = useState('');
  const [preset, setPreset] = useState<Exclude<SchedulePreset, 'custom'>>('daily6');
  const [destination, setDestination] = useState<(typeof DESTINATIONS)[number]>('csv');
  const [touched, setTouched] = useState(false);

  const urlOk = kind === 'documents' ? url.trim().length >= 3 : isHttpUrl(url);
  const step1Ok = name.trim().length >= 3 && urlOk;
  const step2Ok = fields.length > 0;

  const close = () => {
    setStep(1);
    setName('');
    setUrl('');
    setKind('web');
    setFields([]);
    setCustom('');
    setPreset('daily6');
    setDestination('csv');
    setTouched(false);
    onClose();
  };

  const toggleField = (f: string) => setFields((p) => (p.includes(f) ? p.filter((x) => x !== f) : [...p, f].slice(0, 20)));
  const addCustom = () => {
    const v = custom.trim().slice(0, 40);
    if (!v || fields.includes(v)) return;
    setFields((p) => [...p, v].slice(0, 20));
    setCustom('');
  };
  const label = (f: string) => (SUGGESTED[kind].includes(f) ? t(`wizard.fields.${f}`) : f);

  const finish = () => {
    const id = `custom-${s.nextRuleId}-${s.customSources.length + 1}`;
    update((p) => ({
      ...p,
      nextRuleId: p.nextRuleId + 1,
      customSources: [
        ...p.customSources,
        { id, name: name.trim().slice(0, 60), url: url.trim().slice(0, 300), kind, fields: fields.map(label), preset, destination, createdAt: addMinutes(DEMO_NOW, p.manualRuns * 2) },
      ].slice(-10),
    }));
    selectSource(id);
    notify.success(t('wizard.created'));
    onCreated();
    close();
  };

  return (
    <Modal open={open} onClose={close} title={t('wizard.title', { step, total: 3 })}>
      <ol className="mb-4 flex gap-1" aria-hidden="true">
        {[1, 2, 3].map((n) => <li key={n} className={`h-1 flex-1 rounded-full ${n <= step ? 'bg-emerald-500' : 'bg-secondary-700'}`} />)}
      </ol>
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-xs text-secondary-400">{t('wizard.step1Hint')}</p>
          <label className="block text-xs text-secondary-300">
            {t('wizard.name')}
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('wizard.namePlaceholder')} className={`${inputCls} mt-1`} maxLength={60} />
          </label>
          <fieldset>
            <legend className="mb-1 text-xs text-secondary-300">{t('wizard.kind')}</legend>
            <div className="flex flex-wrap gap-1.5">
              {KINDS.map((k) => (
                <Chip key={k} active={kind === k} onClick={() => { setKind(k); setFields([]); }}>{t(`sources.kind.${k}`)}</Chip>
              ))}
            </div>
          </fieldset>
          <label className="block text-xs text-secondary-300">
            {kind === 'documents' ? t('wizard.originDocs') : t('wizard.url')}
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder={kind === 'documents' ? t('wizard.originDocsPlaceholder') : 'https://'}
              className={`${inputCls} mt-1 ${touched && !urlOk ? '!border-rose-500' : ''}`}
              inputMode={kind === 'documents' ? 'text' : 'url'}
            />
            {touched && !urlOk && <span className="mt-1 block text-rose-300">{t('wizard.urlInvalid')}</span>}
          </label>
          <p className="text-[11px] text-secondary-500">{t('wizard.noVisit')}</p>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-3">
          <p className="text-xs text-secondary-400">{t('wizard.step2Hint')}</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED[kind].map((f) => (
              <Chip key={f} active={fields.includes(f)} onClick={() => toggleField(f)}>{t(`wizard.fields.${f}`)}</Chip>
            ))}
          </div>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); addCustom(); }}>
            <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder={t('wizard.customField')} aria-label={t('wizard.customField')} className={inputCls} />
            <button type="submit" className={btn.secondary} disabled={!custom.trim()}>{t('radar.add')}</button>
          </form>
          {fields.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {fields.map((f) => (
                <li key={f} className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-100">
                  {label(f)}
                  <button type="button" aria-label={t('wizard.removeField', { field: label(f) })} onClick={() => toggleField(f)} className="text-emerald-300 hover:text-white">
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {kind === 'documents' && <p className="text-[11px] text-amber-300">{t('wizard.personalWarning')}</p>}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3">
          <label className="block text-xs text-secondary-300">
            {t('wizard.frequency')}
            <select value={preset} onChange={(e) => setPreset(e.target.value as typeof preset)} className={`${inputCls} mt-1`}>
              {PRESETS.map((p) => <option key={p} value={p}>{t(`alerts.presets.${p}`)}</option>)}
            </select>
          </label>
          <label className="block text-xs text-secondary-300">
            {t('wizard.destination')}
            <select value={destination} onChange={(e) => setDestination(e.target.value as typeof destination)} className={`${inputCls} mt-1`}>
              {DESTINATIONS.map((d) => <option key={d} value={d}>{t(`wizard.destinations.${d}`)}</option>)}
            </select>
          </label>
          <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-3 text-xs text-sky-100">{t('wizard.reviewNote')}</div>
        </div>
      )}
      <div className="mt-5 flex justify-between gap-2">
        <button type="button" className={btn.secondary} onClick={() => (step === 1 ? close() : setStep(step - 1))}>
          {step === 1 ? t('actions.cancel') : t('actions.back')}
        </button>
        {step < 3 ? (
          <button
            type="button"
            className={btn.primary}
            disabled={(step === 1 && !step1Ok) || (step === 2 && !step2Ok)}
            onClick={() => {
              setTouched(true);
              setStep(step + 1);
            }}
          >
            {t('actions.next')}
          </button>
        ) : (
          <button type="button" className={btn.primary} onClick={finish}>{t('wizard.finish')}</button>
        )}
      </div>
    </Modal>
  );
}
