'use client';

import { FormEvent, useState } from 'react';
import {
  CITIES,
  ChannelId,
  EMAIL_RE,
  OPEN_STAGES,
  OWNERS,
  OWNER_IDS,
  OwnerId,
  SizeId,
  SourceId,
  StageId,
  checkNit,
} from './crm';
import { capitalize, inputCls, labelCls, selectCls } from './ui';
import { useCrmText } from './useCrmText';

/** Valores del formulario de negocio (crear o editar). */
export interface DealFormValues {
  company: string;
  contactName: string;
  role: string;
  nit: string;
  city: string;
  email: string;
  phone: string;
  channel: ChannelId;
  source: SourceId;
  title: string;
  value: string;
  stage: StageId;
  owner: OwnerId;
  closeDate: string;
  size: SizeId;
  budgetConfirmed: boolean;
  decisionMaker: boolean;
  nextAction: string;
}

/** Datos ya validados y normalizados. */
export interface DealFormResult extends Omit<DealFormValues, 'value' | 'nit' | 'role' | 'nextAction'> {
  value: number;
  nit: string;
  role?: string;
  nextAction: string;
}

type Field = 'company' | 'contactName' | 'title' | 'value' | 'closeDate' | 'email' | 'nit';

interface Props {
  formId: string;
  mode: 'create' | 'edit';
  initial: DealFormValues;
  /** En edición de un negocio cerrado, la fecha de cierre real no se cambia. */
  closeDateLocked?: boolean;
  onSubmit: (values: DealFormResult) => void;
}

/** Formulario de negocio: lo usan «Nuevo negocio» y «Editar datos» de la ficha. */
export default function DealForm({ formId, mode, initial, closeDateLocked, onSubmit }: Props) {
  const tx = useCrmText();
  const { t } = tx;
  const [form, setForm] = useState<DealFormValues>(initial);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const id = (k: string) => `${formId}-${k}`;

  const set = <K extends keyof DealFormValues>(k: K, v: DealFormValues[K]) => setForm((f) => ({ ...f, [k]: v }));
  const valueNumber = Number(form.value.replace(/\D/g, ''));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Partial<Record<Field, string>> = {};
    if (!form.company.trim()) errs.company = t('newDeal.errors.required');
    if (!form.contactName.trim()) errs.contactName = t('newDeal.errors.required');
    if (!form.title.trim()) errs.title = t('newDeal.errors.required');
    if (!valueNumber || valueNumber <= 0) errs.value = t('newDeal.errors.value');
    // Al editar, una fecha ya vencida que no se toca se deja como está (la ficha avisa que venció).
    const closeChanged = mode === 'create' || form.closeDate !== initial.closeDate;
    if (!closeDateLocked && closeChanged && (!form.closeDate || form.closeDate < tx.ref)) {
      errs.closeDate = t('newDeal.errors.closeDate', { date: tx.date(tx.ref) });
    }
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) errs.email = t('newDeal.errors.email');
    let nit = '';
    if (form.nit.trim()) {
      const check = checkNit(form.nit);
      if (check.ok) nit = check.formatted;
      else errs.nit = check.reason === 'dv' ? t('newDeal.errors.nitDv', { dv: check.expected }) : t('newDeal.errors.nit');
    }
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = (['company', 'contactName', 'nit', 'email', 'title', 'value', 'closeDate'] as Field[]).find((k) => errs[k]);
      if (first) document.getElementById(id(first))?.focus();
      return;
    }
    onSubmit({
      ...form,
      company: form.company.trim(),
      contactName: form.contactName.trim(),
      role: form.role.trim() || undefined,
      nit,
      email: form.email.trim(),
      phone: form.phone.trim(),
      title: form.title.trim(),
      value: valueNumber,
      nextAction: form.nextAction.trim() || t('newDeal.defaultNextAction'),
    });
  };

  const err = (k: Field) =>
    errors[k] ? (
      <p id={id(`${k}-err`)} className="text-xs text-red-600 dark:text-red-400 mt-1">
        {errors[k]}
      </p>
    ) : null;
  const aria = (k: Field) => ({
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? id(`${k}-err`) : undefined,
  });

  return (
    <form id={formId} onSubmit={submit} noValidate className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2">
        <label htmlFor={id('company')} className={labelCls}>
          {t('newDeal.fields.company')} *
        </label>
        <input id={id('company')} value={form.company} onChange={(e) => set('company', e.target.value)} maxLength={80} className={inputCls} {...aria('company')} />
        {err('company')}
      </div>
      <div>
        <label htmlFor={id('contactName')} className={labelCls}>
          {t('newDeal.fields.contactName')} *
        </label>
        <input id={id('contactName')} value={form.contactName} onChange={(e) => set('contactName', e.target.value)} maxLength={60} className={inputCls} {...aria('contactName')} />
        {err('contactName')}
      </div>
      <div>
        <label htmlFor={id('role')} className={labelCls}>
          {t('newDeal.fields.role')}
        </label>
        <input id={id('role')} value={form.role} onChange={(e) => set('role', e.target.value)} maxLength={60} className={inputCls} />
      </div>
      <div>
        <label htmlFor={id('nit')} className={labelCls}>
          {t('newDeal.fields.nit')}
        </label>
        <input
          id={id('nit')}
          value={form.nit}
          onChange={(e) => set('nit', e.target.value)}
          placeholder={t('newDeal.nitPlaceholder')}
          maxLength={14}
          className={inputCls}
          {...aria('nit')}
        />
        {err('nit') ?? <p className="text-[11px] text-secondary-500 mt-1">{t('newDeal.nitHint')}</p>}
      </div>
      <div>
        <label htmlFor={id('city')} className={labelCls}>
          {t('newDeal.fields.city')}
        </label>
        <select id={id('city')} value={form.city} onChange={(e) => set('city', e.target.value)} className={selectCls}>
          {(CITIES.includes(form.city) ? CITIES : [form.city, ...CITIES]).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={id('email')} className={labelCls}>
          {t('newDeal.fields.email')}
        </label>
        <input id={id('email')} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} maxLength={80} className={inputCls} {...aria('email')} />
        {err('email')}
      </div>
      <div>
        <label htmlFor={id('phone')} className={labelCls}>
          {t('newDeal.fields.phone')}
        </label>
        <input id={id('phone')} type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} maxLength={20} placeholder="+57 300 000 0000" className={inputCls} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={id('title')} className={labelCls}>
          {t('newDeal.fields.title')} *
        </label>
        <input
          id={id('title')}
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
        <label htmlFor={id('value')} className={labelCls}>
          {t('newDeal.fields.value')} *
        </label>
        <input
          id={id('value')}
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
        <label htmlFor={id('closeDate')} className={labelCls}>
          {closeDateLocked ? t('newDeal.fields.closedOn') : `${t('newDeal.fields.closeDate')} *`}
        </label>
        <input
          id={id('closeDate')}
          type="date"
          min={closeDateLocked ? undefined : tx.ref}
          value={form.closeDate}
          onChange={(e) => set('closeDate', e.target.value)}
          disabled={closeDateLocked}
          className={inputCls}
          {...aria('closeDate')}
        />
        {err('closeDate')}
      </div>
      {mode === 'create' && (
        <div>
          <label htmlFor={id('stage')} className={labelCls}>
            {t('newDeal.fields.stage')}
          </label>
          <select id={id('stage')} value={form.stage} onChange={(e) => set('stage', e.target.value as StageId)} className={selectCls}>
            {OPEN_STAGES.map((s) => (
              <option key={s} value={s}>
                {t(`stages.${s}`)}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label htmlFor={id('owner')} className={labelCls}>
          {t('newDeal.fields.owner')}
        </label>
        <select id={id('owner')} value={form.owner} onChange={(e) => set('owner', e.target.value as OwnerId)} className={selectCls}>
          {OWNER_IDS.map((o) => (
            <option key={o} value={o}>
              {OWNERS[o].name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={id('channel')} className={labelCls}>
          {t('newDeal.fields.channel')}
        </label>
        <select id={id('channel')} value={form.channel} onChange={(e) => set('channel', e.target.value as ChannelId)} className={selectCls}>
          {(['whatsapp', 'email', 'call'] as const).map((c) => (
            <option key={c} value={c}>
              {t(`channels.${c}`)}
            </option>
          ))}
        </select>
      </div>
      {mode === 'create' && (
        <div>
          <label htmlFor={id('source')} className={labelCls}>
            {t('newDeal.fields.source')}
          </label>
          <select id={id('source')} value={form.source} onChange={(e) => set('source', e.target.value as SourceId)} className={selectCls}>
            {(['web', 'referral', 'fair', 'inbound', 'import'] as const).map((s) => (
              <option key={s} value={s}>
                {capitalize(t(`sources.${s}`))}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className={mode === 'create' ? 'sm:col-span-2' : ''}>
        <label htmlFor={id('size')} className={labelCls}>
          {t('newDeal.fields.size')}
        </label>
        <select id={id('size')} value={form.size} onChange={(e) => set('size', e.target.value as SizeId)} className={selectCls}>
          {(['small', 'medium', 'large'] as const).map((s) => (
            <option key={s} value={s}>
              {capitalize(t(`sizes.${s}`))}
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
        <label htmlFor={id('nextAction')} className={labelCls}>
          {t('newDeal.fields.nextAction')}
        </label>
        <input
          id={id('nextAction')}
          value={form.nextAction}
          onChange={(e) => set('nextAction', e.target.value)}
          maxLength={120}
          placeholder={t('newDeal.defaultNextAction')}
          className={inputCls}
        />
      </div>
      <p className="sm:col-span-2 text-xs text-secondary-500">{t(mode === 'create' ? 'newDeal.scoreHint' : 'customer360.editHint')}</p>
    </form>
  );
}
