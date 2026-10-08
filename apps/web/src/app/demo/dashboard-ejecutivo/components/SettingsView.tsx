'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatNit, PRESETS } from '../lib/presets';
import { useDashboard } from '../lib/store';
import { SECTORS, type Recipient, type SectorId, type Settings, type Thresholds } from '../lib/types';
import { useNarrative } from './narrative';
import { btn, card, inputCls, labelCls, Modal, Note, NS, SectionTitle, selectCls, useFmt } from './ui';

const THRESHOLD_KEYS: (keyof Thresholds)[] = ['goalGap', 'marginDrop', 'overdueGrowth', 'riskDrop', 'cashFloor'];

export default function SettingsView() {
  const t = useTranslations(`${NS}.settings`);
  const ts = useTranslations(`${NS}.sectors`);
  const fmt = useFmt();
  const { settings, saveSettings, resetAll, notify, dataset } = useDashboard();
  const { recipientName } = useNarrative();
  const [draft, setDraft] = useState<Settings>(settings);
  const [confirmReset, setConfirmReset] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  useEffect(() => setDraft(settings), [settings]);

  const sector = draft.sector;
  const company = draft.companies[sector] ?? PRESETS[sector].company;
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  const setCompany = (patch: Partial<typeof company>) => setDraft((d) => ({ ...d, companies: { ...d.companies, [sector]: { ...company, ...patch } } }));
  const setThreshold = (k: keyof Thresholds, v: number) => setDraft((d) => ({ ...d, thresholds: { ...d.thresholds, [sector]: { ...d.thresholds[sector], [k]: v } } }));
  const setRecipient = (id: string, patch: Partial<Recipient>) => setDraft((d) => ({ ...d, recipients: d.recipients.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));

  const validate = (s: Settings): string[] => {
    const errs: string[] = [];
    const c = s.companies[s.sector] ?? PRESETS[s.sector].company;
    if (!c.name.trim()) errs.push(t('errors.name'));
    if (c.nit.trim() && !/^\d{6,10}(-\d)?$/.test(c.nit.replace(/\./g, '').trim())) errs.push(t('errors.nit'));
    const g = s.goals[s.sector];
    if (!Number.isFinite(g) || g < -50 || g > 100) errs.push(t('errors.goal'));
    for (const k of THRESHOLD_KEYS) {
      const v = s.thresholds[s.sector][k];
      if (!Number.isFinite(v) || v < 0 || (k !== 'cashFloor' && v > 100) || v > 100_000) errs.push(t('errors.threshold', { field: t(`thresholds.${k}`) }));
    }
    for (const r of s.recipients) {
      if (r.channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.address.trim())) errs.push(t('errors.email', { name: recipientName(r) }));
      if (r.channel === 'whatsapp' && r.address.replace(/\D/g, '').length < 10) errs.push(t('errors.phone', { name: recipientName(r) }));
    }
    return errs;
  };

  const save = () => {
    const clean: Settings = {
      ...draft,
      companies: { ...draft.companies, [sector]: { name: company.name.trim(), nit: company.nit.replace(/\./g, '').trim(), city: company.city.trim() } },
    };
    const errs = validate(clean);
    setErrors(errs);
    if (errs.length) return;
    saveSettings(clean);
    notify(t('saved'));
  };

  const num = (v: string) => (v.trim() === '' ? NaN : Number(v.replace(',', '.')));

  return (
    <div className="space-y-6">
      <section className={`${card} p-5 sm:p-6`} aria-labelledby="set-company">
        <SectionTitle title={<span id="set-company">{t('companyTitle')}</span>} subtitle={t('companySubtitle')} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="lg:col-span-2">
            <label htmlFor="set-sector" className={labelCls}>
              {t('sector')}
            </label>
            <select id="set-sector" value={sector} onChange={(e) => setDraft((d) => ({ ...d, sector: e.target.value as SectorId }))} className={selectCls}>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {ts(`${s}.name`)}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{ts(`${sector}.description`)}</p>
            {dataset.source === 'upload' && <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">{t('sectorUploadNote')}</p>}
          </div>
          <div>
            <label htmlFor="set-name" className={labelCls}>
              {t('companyName')}
            </label>
            <input id="set-name" value={company.name} maxLength={120} onChange={(e) => setCompany({ name: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label htmlFor="set-nit" className={labelCls}>
              {t('companyNit')}
            </label>
            <input id="set-nit" value={company.nit} maxLength={20} onChange={(e) => setCompany({ nit: e.target.value })} className={inputCls} inputMode="numeric" />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('nitHint', { nit: formatNit(company.nit.replace(/\./g, '')) })}</p>
          </div>
          <div>
            <label htmlFor="set-city" className={labelCls}>
              {t('companyCity')}
            </label>
            <input id="set-city" value={company.city} maxLength={60} onChange={(e) => setCompany({ city: e.target.value })} className={inputCls} />
          </div>
        </div>
      </section>

      <section className={`${card} p-5 sm:p-6`} aria-labelledby="set-goals">
        <SectionTitle title={<span id="set-goals">{t('goalsTitle')}</span>} subtitle={t('goalsSubtitle')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="set-goal" className={labelCls}>
              {t('goal')}
            </label>
            <div className="relative">
              <input
                id="set-goal"
                type="number"
                step="0.5"
                min={-50}
                max={100}
                value={Number.isFinite(draft.goals[sector]) ? draft.goals[sector] : ''}
                onChange={(e) => setDraft((d) => ({ ...d, goals: { ...d.goals, [sector]: num(e.target.value) } }))}
                className={`${inputCls} pr-10`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">%</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('goalHint')}</p>
          </div>
          {THRESHOLD_KEYS.map((k) => (
            <div key={k}>
              <label htmlFor={`set-th-${k}`} className={labelCls}>
                {t(`thresholds.${k}`)}
              </label>
              <div className="relative">
                <input
                  id={`set-th-${k}`}
                  type="number"
                  step={k === 'cashFloor' ? 10 : 0.5}
                  min={0}
                  value={Number.isFinite(draft.thresholds[sector][k]) ? draft.thresholds[sector][k] : ''}
                  onChange={(e) => setThreshold(k, num(e.target.value))}
                  className={`${inputCls} pr-14`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">{t(`units.${k}`)}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t(`thresholdHints.${k}`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`${card} p-5 sm:p-6`} aria-labelledby="set-recipients">
        <SectionTitle
          title={<span id="set-recipients">{t('recipientsTitle')}</span>}
          subtitle={t('recipientsSubtitle')}
          actions={
            <button
              type="button"
              className={btn.small}
              disabled={draft.recipients.length >= 10}
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  recipients: [...d.recipients, { id: `r${Date.now().toString(36)}`, name: '', channel: 'email', address: '' }],
                }))
              }
            >
              <PlusIcon className="w-4 h-4" aria-hidden="true" />
              {t('addRecipient')}
            </button>
          }
        />
        {draft.recipients.length ? (
          <ul className="space-y-3">
            {draft.recipients.map((r, i) => (
              <li key={r.id} className="grid grid-cols-1 sm:grid-cols-[1fr_140px_1fr_auto] gap-2 items-end">
                <div>
                  <label htmlFor={`rec-name-${r.id}`} className={labelCls}>
                    {t('recipientName', { n: i + 1 })}
                  </label>
                  <input id={`rec-name-${r.id}`} value={r.name} placeholder={r.role ? t(`roles.${r.role}`) : ''} onChange={(e) => setRecipient(r.id, { name: e.target.value })} className={inputCls} maxLength={80} />
                </div>
                <div>
                  <label htmlFor={`rec-ch-${r.id}`} className={labelCls}>
                    {t('channel')}
                  </label>
                  <select id={`rec-ch-${r.id}`} value={r.channel} onChange={(e) => setRecipient(r.id, { channel: e.target.value as Recipient['channel'] })} className={selectCls}>
                    <option value="email">{t('channels.email')}</option>
                    <option value="whatsapp">{t('channels.whatsapp')}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={`rec-addr-${r.id}`} className={labelCls}>
                    {r.channel === 'email' ? t('email') : t('phone')}
                  </label>
                  <input id={`rec-addr-${r.id}`} value={r.address} onChange={(e) => setRecipient(r.id, { address: e.target.value })} className={inputCls} maxLength={120} inputMode={r.channel === 'email' ? 'email' : 'tel'} />
                </div>
                <button type="button" className={btn.ghost} aria-label={t('removeRecipient', { name: recipientName(r) })} onClick={() => setDraft((d) => ({ ...d, recipients: d.recipients.filter((x) => x.id !== r.id) }))}>
                  <TrashIcon className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">{t('noRecipients')}</p>
        )}
        <div className="mt-3">
          <Note tone="amber">{t('recipientsNote')}</Note>
        </div>
      </section>

      {errors.length > 0 && (
        <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-4" role="alert">
          <p className="text-sm font-semibold text-red-800 dark:text-red-200">{t('errors.title')}</p>
          <ul className="list-disc pl-5 text-sm text-red-700 dark:text-red-300">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <button type="button" className={`${btn.outline} text-red-700 dark:text-red-300`} onClick={() => setConfirmReset(true)}>
          {t('resetAll')}
        </button>
        <div className="flex flex-col sm:flex-row gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 self-center">{dirty ? t('unsaved') : t('upToDate')}</span>
          <button
            type="button"
            className={btn.outline}
            disabled={!dirty}
            onClick={() => {
              setDraft(settings);
              setErrors([]);
            }}
          >
            {t('discard')}
          </button>
          <button type="button" className={btn.primary} onClick={save} disabled={!dirty}>
            {t('save')}
          </button>
        </div>
      </div>
      <Note>{t('storageNote', { goal: fmt.num(settings.goals[settings.sector], 1) })}</Note>

      {confirmReset && (
        <Modal
          title={t('resetTitle')}
          onClose={() => setConfirmReset(false)}
          size="sm"
          labelId="set-reset-title"
          footer={
            <>
              <button type="button" className={btn.outline} onClick={() => setConfirmReset(false)}>
                {t('cancel')}
              </button>
              <button
                type="button"
                className={btn.danger}
                onClick={() => {
                  resetAll();
                  setConfirmReset(false);
                  setErrors([]);
                  notify(t('resetDone'));
                }}
              >
                {t('resetConfirm')}
              </button>
            </>
          }
        >
          <p className="text-sm text-slate-700 dark:text-slate-300">{t('resetText')}</p>
        </Modal>
      )}
    </div>
  );
}
