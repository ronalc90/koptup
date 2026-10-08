'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useTranslations } from 'next-intl';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useReservas } from '../lib/store';
import { Field, btnPrimary, btnSecondary, inputCls } from './ui';

export interface FormState {
  name: string;
  phone: string;
  email: string;
  comments: string;
  consent: boolean;
  remindWa: boolean;
  remindEmail: boolean;
}

export const EMPTY_FORM: FormState = { name: '', phone: '', email: '', comments: '', consent: false, remindWa: true, remindEmail: true };

export type FormErrors = Partial<Record<'name' | 'phone' | 'email' | 'consent', string>>;

export default function DetailsStep({
  form,
  setForm,
  errors,
  onBack,
  onNext,
}: {
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
  errors: FormErrors;
  onBack: () => void;
  onNext: () => void;
}) {
  const t = useTranslations('demoReservas.details');
  const { biz } = useReservas();
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((s) => ({ ...s, [k]: v }));

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
    >
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('title')}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('name')} htmlFor="rv-name" error={errors.name && t(`errors.${errors.name}`)}>
          <input
            id="rv-name"
            className={inputCls}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder={t('namePh')}
            autoComplete="name"
            aria-invalid={!!errors.name}
          />
        </Field>
        <Field label={t('phone')} htmlFor="rv-phone" error={errors.phone && t(`errors.${errors.phone}`)} hint={t('phoneHint')}>
          <input
            id="rv-phone"
            type="tel"
            inputMode="tel"
            className={inputCls}
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="300 555 0123"
            autoComplete="tel"
            aria-invalid={!!errors.phone}
          />
        </Field>
        <Field label={t('email')} htmlFor="rv-email" error={errors.email && t(`errors.${errors.email}`)} hint={t('emailHint')}>
          <input
            id="rv-email"
            type="email"
            className={inputCls}
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder={t('emailPh')}
            autoComplete="email"
            aria-invalid={!!errors.email}
          />
        </Field>
        <Field label={t('comments')} htmlFor="rv-comments">
          <input id="rv-comments" className={inputCls} value={form.comments} onChange={(e) => set('comments', e.target.value)} placeholder={t(biz.healthData ? 'commentsPhHealth' : 'commentsPh')} />
        </Field>
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">{t('remindTitle')}</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700 dark:text-slate-200">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded border-slate-300 text-orange-600 focus:ring-orange-500" checked={form.remindWa} onChange={(e) => set('remindWa', e.target.checked)} />
            {t('remindWa')}
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded border-slate-300 text-orange-600 focus:ring-orange-500" checked={form.remindEmail} onChange={(e) => set('remindEmail', e.target.checked)} />
            {t('remindEmail')}
          </label>
        </div>
      </fieldset>

      <div className="mt-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4 space-y-3 text-sm">
        <p className="text-slate-700 dark:text-slate-200">
          <span className="font-semibold">{t('policyTitle')}</span> {t('policy', { hours: biz.cancelHours })}
        </p>
        {biz.healthData && (
          <p className="flex items-start gap-2 text-slate-700 dark:text-slate-200">
            <ShieldCheckIcon className="h-5 w-5 shrink-0 text-emerald-600" />
            <span>{t('sensitive')}</span>
          </p>
        )}
        <label className="flex items-start gap-2 text-slate-800 dark:text-slate-100">
          <input
            type="checkbox"
            className="mt-0.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
            checked={form.consent}
            onChange={(e) => set('consent', e.target.checked)}
            aria-invalid={!!errors.consent}
            aria-describedby={errors.consent ? 'rv-consent-err' : undefined}
          />
          <span>{t('consent', { business: biz.name, nit: biz.nit })}</span>
        </label>
        {errors.consent && (
          <p id="rv-consent-err" role="alert" className="text-xs text-red-600 dark:text-red-400">
            {t(`errors.${errors.consent}`)}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-between">
        <button type="button" className={btnSecondary} onClick={onBack}>
          {t('back')}
        </button>
        <button type="submit" className={btnPrimary}>
          {t('next')}
        </button>
      </div>
    </form>
  );
}
