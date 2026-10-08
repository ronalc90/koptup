'use client';

import { FormEvent, useState } from 'react';
import Button from '@/components/ui/Button';
import {
  CITIES,
  ChannelId,
  EMAIL_RE,
  NIT_RE,
  OPEN_STAGES,
  OWNERS,
  OWNER_IDS,
  OwnerId,
  REF_DATE,
  SizeId,
  SourceId,
  StageId,
  addDays,
} from './crm';
import { Modal, inputCls, labelCls } from './ui';
import { useCrmText } from './useCrmText';
import type { NewDealInput } from './useCrmStore';

interface Props {
  onClose: () => void;
  onCreate: (input: NewDealInput) => void;
}

type Field = 'company' | 'contactName' | 'title' | 'value' | 'closeDate' | 'email' | 'nit';

/** Da formato 900.123.456-7 a un NIT escrito solo con números. */
function formatNit(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 10) return raw.trim();
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export default function NewDealModal({ onClose, onCreate }: Props) {
  const tx = useCrmText();
  const { t } = tx;
  const [form, setForm] = useState({
    company: '',
    contactName: '',
    role: '',
    nit: '',
    city: 'Bogotá',
    email: '',
    phone: '',
    channel: 'whatsapp' as ChannelId,
    source: 'web' as SourceId,
    title: '',
    value: '',
    stage: 'prospect' as StageId,
    owner: 'vr' as OwnerId,
    closeDate: addDays(REF_DATE, 45),
    size: 'medium' as SizeId,
    budgetConfirmed: false,
    decisionMaker: false,
    nextAction: '',
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const valueNumber = Number(form.value.replace(/\D/g, ''));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Partial<Record<Field, string>> = {};
    if (!form.company.trim()) errs.company = t('newDeal.errors.required');
    if (!form.contactName.trim()) errs.contactName = t('newDeal.errors.required');
    if (!form.title.trim()) errs.title = t('newDeal.errors.required');
    if (!valueNumber || valueNumber <= 0) errs.value = t('newDeal.errors.value');
    if (!form.closeDate || form.closeDate < REF_DATE) errs.closeDate = t('newDeal.errors.closeDate', { date: tx.date(REF_DATE) });
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) errs.email = t('newDeal.errors.email');
    if (form.nit.trim() && !NIT_RE.test(form.nit.trim())) errs.nit = t('newDeal.errors.nit');
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onCreate({
      contactName: form.contactName.trim(),
      company: form.company.trim(),
      role: form.role.trim() || undefined,
      nit: form.nit.trim() ? formatNit(form.nit) : '',
      city: form.city,
      email: form.email.trim(),
      phone: form.phone.trim(),
      channel: form.channel,
      source: form.source,
      owner: form.owner,
      value: valueNumber,
      stage: form.stage,
      closeDate: form.closeDate,
      size: form.size,
      budgetConfirmed: form.budgetConfirmed,
      decisionMaker: form.decisionMaker,
      title: form.title.trim(),
      nextAction: form.nextAction.trim() || t('newDeal.defaultNextAction'),
    });
  };

  const err = (k: Field) =>
    errors[k] ? (
      <p id={`crm-nd-${k}-err`} className="text-xs text-red-600 dark:text-red-400 mt-1">
        {errors[k]}
      </p>
    ) : null;
  const aria = (k: Field) => ({
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? `crm-nd-${k}-err` : undefined,
  });

  return (
    <Modal
      labelId="crm-new-deal-title"
      title={t('newDeal.title')}
      subtitle={t('newDeal.subtitle')}
      onClose={onClose}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="crm-new-deal-form">
            {t('newDeal.submit')}
          </Button>
        </>
      }
    >
      <form id="crm-new-deal-form" onSubmit={submit} noValidate className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label htmlFor="crm-nd-company" className={labelCls}>
            {t('newDeal.fields.company')} *
          </label>
          <input id="crm-nd-company" value={form.company} onChange={(e) => set('company', e.target.value)} maxLength={80} className={inputCls} {...aria('company')} />
          {err('company')}
        </div>
        <div>
          <label htmlFor="crm-nd-contact" className={labelCls}>
            {t('newDeal.fields.contactName')} *
          </label>
          <input id="crm-nd-contact" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} maxLength={60} className={inputCls} {...aria('contactName')} />
          {err('contactName')}
        </div>
        <div>
          <label htmlFor="crm-nd-role" className={labelCls}>
            {t('newDeal.fields.role')}
          </label>
          <input id="crm-nd-role" value={form.role} onChange={(e) => set('role', e.target.value)} maxLength={60} className={inputCls} />
        </div>
        <div>
          <label htmlFor="crm-nd-nit" className={labelCls}>
            {t('newDeal.fields.nit')}
          </label>
          <input id="crm-nd-nit" value={form.nit} onChange={(e) => set('nit', e.target.value)} placeholder="900.123.456-7" maxLength={14} className={inputCls} {...aria('nit')} />
          {err('nit')}
        </div>
        <div>
          <label htmlFor="crm-nd-city" className={labelCls}>
            {t('newDeal.fields.city')}
          </label>
          <select id="crm-nd-city" value={form.city} onChange={(e) => set('city', e.target.value)} className={inputCls}>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="crm-nd-email" className={labelCls}>
            {t('newDeal.fields.email')}
          </label>
          <input id="crm-nd-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} maxLength={80} className={inputCls} {...aria('email')} />
          {err('email')}
        </div>
        <div>
          <label htmlFor="crm-nd-phone" className={labelCls}>
            {t('newDeal.fields.phone')}
          </label>
          <input id="crm-nd-phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} maxLength={20} placeholder="+57 300 000 0000" className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="crm-nd-title" className={labelCls}>
            {t('newDeal.fields.title')} *
          </label>
          <input
            id="crm-nd-title"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            maxLength={80}
            placeholder={t('newDeal.titlePlaceholder')}
            className={inputCls}
            {...aria('title')}
          />
          {err('title')}
        </div>
        <div>
          <label htmlFor="crm-nd-value" className={labelCls}>
            {t('newDeal.fields.value')} *
          </label>
          <input
            id="crm-nd-value"
            inputMode="numeric"
            value={form.value}
            onChange={(e) => set('value', e.target.value)}
            placeholder="85000000"
            maxLength={15}
            className={inputCls}
            {...aria('value')}
          />
          {valueNumber > 0 && !errors.value && <p className="text-xs text-secondary-500 mt-1">{tx.money(valueNumber)}</p>}
          {err('value')}
        </div>
        <div>
          <label htmlFor="crm-nd-close" className={labelCls}>
            {t('newDeal.fields.closeDate')} *
          </label>
          <input id="crm-nd-close" type="date" min={REF_DATE} value={form.closeDate} onChange={(e) => set('closeDate', e.target.value)} className={inputCls} {...aria('closeDate')} />
          {err('closeDate')}
        </div>
        <div>
          <label htmlFor="crm-nd-stage" className={labelCls}>
            {t('newDeal.fields.stage')}
          </label>
          <select id="crm-nd-stage" value={form.stage} onChange={(e) => set('stage', e.target.value as StageId)} className={inputCls}>
            {OPEN_STAGES.map((s) => (
              <option key={s} value={s}>
                {t(`stages.${s}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="crm-nd-owner" className={labelCls}>
            {t('newDeal.fields.owner')}
          </label>
          <select id="crm-nd-owner" value={form.owner} onChange={(e) => set('owner', e.target.value as OwnerId)} className={inputCls}>
            {OWNER_IDS.map((id) => (
              <option key={id} value={id}>
                {OWNERS[id].name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="crm-nd-channel" className={labelCls}>
            {t('newDeal.fields.channel')}
          </label>
          <select id="crm-nd-channel" value={form.channel} onChange={(e) => set('channel', e.target.value as ChannelId)} className={inputCls}>
            {(['whatsapp', 'email', 'call'] as const).map((c) => (
              <option key={c} value={c}>
                {t(`channels.${c}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="crm-nd-source" className={labelCls}>
            {t('newDeal.fields.source')}
          </label>
          <select id="crm-nd-source" value={form.source} onChange={(e) => set('source', e.target.value as SourceId)} className={inputCls}>
            {(['web', 'referral', 'fair', 'inbound', 'import'] as const).map((s) => (
              <option key={s} value={s}>
                {t(`sources.${s}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="crm-nd-size" className={labelCls}>
            {t('newDeal.fields.size')}
          </label>
          <select id="crm-nd-size" value={form.size} onChange={(e) => set('size', e.target.value as SizeId)} className={inputCls}>
            {(['small', 'medium', 'large'] as const).map((s) => (
              <option key={s} value={s}>
                {t(`sizes.${s}`)}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-secondary-700 dark:text-secondary-300">
          <input
            type="checkbox"
            checked={form.budgetConfirmed}
            onChange={(e) => set('budgetConfirmed', e.target.checked)}
            className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
          />
          {t('newDeal.fields.budget')}
        </label>
        <label className="flex items-center gap-2 text-sm text-secondary-700 dark:text-secondary-300">
          <input
            type="checkbox"
            checked={form.decisionMaker}
            onChange={(e) => set('decisionMaker', e.target.checked)}
            className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
          />
          {t('newDeal.fields.decision')}
        </label>
        <div className="sm:col-span-2">
          <label htmlFor="crm-nd-next" className={labelCls}>
            {t('newDeal.fields.nextAction')}
          </label>
          <input
            id="crm-nd-next"
            value={form.nextAction}
            onChange={(e) => set('nextAction', e.target.value)}
            maxLength={120}
            placeholder={t('newDeal.defaultNextAction')}
            className={inputCls}
          />
        </div>
        <p className="sm:col-span-2 text-xs text-secondary-500">{t('newDeal.scoreHint')}</p>
      </form>
    </Modal>
  );
}
