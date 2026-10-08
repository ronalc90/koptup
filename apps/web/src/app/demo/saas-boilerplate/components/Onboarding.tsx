'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircleIcon, CheckIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { useDemo } from '../lib/store';
import { BASE_DOMAIN, BRAND_COLORS, CITIES, PLANS, TRIAL_DAYS, DEMO_TODAY } from '../lib/data';
import { addDays, nitDv, slugify } from '../lib/format';
import { isEmail, slugError, suggestedPlan } from '../lib/logic';
import { useFmt } from '../lib/useFmt';
import type { PlanId } from '../lib/types';
import { PLAN_IDS } from '../lib/types';
import { FieldError, Panel, ScreenHeader, SimNote, TenantAvatar, inputCls, selectCls } from './ui';

const MAX_LOGO_BYTES = 200 * 1024;
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

interface Form {
  name: string;
  city: string;
  nit: string;
  email: string;
  units: string;
  slug: string;
  slugTouched: boolean;
  plan: PlanId | '';
  color: string;
  logo?: string;
}

const EMPTY: Form = { name: '', city: CITIES[0], nit: '', email: '', units: '', slug: '', slugTouched: false, plan: '', color: BRAND_COLORS[0] };

export default function Onboarding() {
  const t = useTranslations('demoSaas');
  const f = useFmt();
  const { s, createTenant, go, select } = useDemo();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>(EMPTY);
  const [showErrors, setShowErrors] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  const units = Number(form.units);
  const nitClean = form.nit.replace(/\D/g, '');
  const errors1 = {
    name: form.name.trim().length < 3 ? t('onboarding.errors.name') : null,
    nit: !/^\d{9}$/.test(nitClean) ? t('onboarding.errors.nit') : null,
    email: !isEmail(form.email) ? t('onboarding.errors.email') : null,
    units: !Number.isInteger(units) || units < 1 || units > 5000 ? t('onboarding.errors.units') : null,
  };
  const slugErr = slugError(s, form.slug);
  const errors2 = {
    slug: slugErr ? t(`onboarding.errors.slug_${slugErr}`) : null,
    plan: !form.plan ? t('onboarding.errors.plan') : form.plan && units > PLANS[form.plan].maxUnits ? t('onboarding.errors.planUnits') : null,
  };
  const valid1 = Object.values(errors1).every((e) => !e);
  const valid2 = Object.values(errors2).every((e) => !e);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((p) => ({ ...p, [k]: v }));

  const next = () => {
    if (step === 1 && !valid1) return setShowErrors(true);
    if (step === 2 && !valid2) return setShowErrors(true);
    setShowErrors(false);
    if (step === 1) {
      setForm((p) => ({
        ...p,
        slug: p.slugTouched ? p.slug : slugify(p.name),
        plan: p.plan || suggestedPlan(units),
      }));
    }
    setStep((x) => Math.min(3, x + 1));
  };

  const onLogo = (file: File | undefined) => {
    setLogoError(null);
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) return setLogoError(t('onboarding.errors.logoType'));
    if (file.size > MAX_LOGO_BYTES) return setLogoError(t('onboarding.errors.logoSize'));
    const reader = new FileReader();
    reader.onload = () => set('logo', typeof reader.result === 'string' ? reader.result : undefined);
    reader.onerror = () => setLogoError(t('onboarding.errors.logoType'));
    reader.readAsDataURL(file);
  };

  const finish = () => {
    if (!valid1 || !valid2 || !form.plan) return setShowErrors(true);
    const id = createTenant({
      name: form.name, city: form.city, nit: nitClean, email: form.email, units, slug: form.slug, plan: form.plan, color: form.color, logo: form.logo,
    });
    setCreated(id);
  };

  const createdTenant = created ? s.tenants.find((x) => x.id === created) : null;

  if (createdTenant) {
    const open = (area: 'billing' | 'portal' | 'access') => {
      select(area, createdTenant.id);
      go(area);
    };
    return (
      <div className="space-y-5">
        <ScreenHeader title={t('screens.onboarding.title')} subtitle={t('screens.onboarding.subtitle')} />
        <Panel>
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="h-7 w-7 shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-secondary-900 dark:text-white">{t('onboarding.done.title', { name: createdTenant.name })}</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-secondary-700 dark:text-secondary-300">
                <li>{t('onboarding.done.trial', { date: f.date(createdTenant.trialEndsAt ?? DEMO_TODAY) })}</li>
                <li className="break-words">{t('onboarding.done.url', { url: `${createdTenant.slug}.${BASE_DOMAIN}` })}</li>
                <li className="break-words">{t('onboarding.done.invite', { email: createdTenant.email })}</li>
                <li>{t('onboarding.done.modules', { n: createdTenant.modules.length })}</li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => open('billing')}>{t('onboarding.done.charge')}</Button>
                <Button size="sm" variant="outline" onClick={() => open('portal')}>{t('onboarding.done.portal')}</Button>
                <Button size="sm" variant="outline" onClick={() => go('dashboard')}>{t('onboarding.done.dashboard')}</Button>
                <Button size="sm" variant="ghost" onClick={() => { setCreated(null); setForm(EMPTY); setStep(1); }}>{t('onboarding.done.another')}</Button>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  const preview = { name: form.name.trim() || t('onboarding.previewName'), color: form.color, logo: form.logo };

  return (
    <div className="space-y-5">
      <ScreenHeader title={t('screens.onboarding.title')} subtitle={t('screens.onboarding.subtitle')} />

      <ol className="grid grid-cols-3 gap-2 text-xs">
        {[1, 2, 3].map((n) => (
          <li
            key={n}
            className={`flex items-center gap-2 rounded-lg border px-2 py-2 sm:px-3 ${
              n === step ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' : 'border-secondary-200 bg-white dark:border-secondary-700 dark:bg-secondary-900'
            }`}
            aria-current={n === step ? 'step' : undefined}
          >
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${n < step ? 'bg-emerald-600 text-white' : n === step ? 'bg-primary-600 text-white' : 'bg-secondary-200 text-secondary-600 dark:bg-secondary-700 dark:text-secondary-200'}`}>
              {n < step ? <CheckIcon className="h-3 w-3" /> : n}
            </span>
            <span className="min-w-0 font-medium leading-tight text-secondary-800 dark:text-secondary-100">{t(`onboarding.steps.${n}`)}</span>
          </li>
        ))}
      </ol>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Panel>
          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="ob-name" className="mb-1 block text-sm font-medium text-secondary-700 dark:text-secondary-200">{t('onboarding.fields.name')}</label>
                <input id="ob-name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={t('onboarding.placeholders.name')} className={inputCls} maxLength={60} />
                <FieldError msg={showErrors ? errors1.name : null} />
              </div>
              <div>
                <label htmlFor="ob-city" className="mb-1 block text-sm font-medium text-secondary-700 dark:text-secondary-200">{t('onboarding.fields.city')}</label>
                <select id="ob-city" value={form.city} onChange={(e) => set('city', e.target.value)} className={`${selectCls} w-full`}>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="ob-nit" className="mb-1 block text-sm font-medium text-secondary-700 dark:text-secondary-200">{t('onboarding.fields.nit')}</label>
                <div className="flex items-center gap-2">
                  <input id="ob-nit" inputMode="numeric" value={form.nit} onChange={(e) => set('nit', e.target.value.replace(/[^\d.]/g, '').slice(0, 11))} placeholder="900123456" className={inputCls} />
                  <span className="shrink-0 rounded-md bg-secondary-100 px-2 py-2 text-xs font-medium text-secondary-700 dark:bg-secondary-800 dark:text-secondary-200" title={t('onboarding.dvHint')}>
                    DV {/^\d{9}$/.test(nitClean) ? nitDv(nitClean) : '–'}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-secondary-500">{t('onboarding.dvHint')}</p>
                <FieldError msg={showErrors ? errors1.nit : null} />
              </div>
              <div>
                <label htmlFor="ob-email" className="mb-1 block text-sm font-medium text-secondary-700 dark:text-secondary-200">{t('onboarding.fields.email')}</label>
                <input id="ob-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder={t('onboarding.placeholders.email')} className={inputCls} />
                <FieldError msg={showErrors ? errors1.email : null} />
              </div>
              <div>
                <label htmlFor="ob-units" className="mb-1 block text-sm font-medium text-secondary-700 dark:text-secondary-200">{t('onboarding.fields.units')}</label>
                <input id="ob-units" type="number" min={1} max={5000} value={form.units} onChange={(e) => set('units', e.target.value)} placeholder="120" className={inputCls} />
                <FieldError msg={showErrors ? errors1.units : null} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="ob-slug" className="mb-1 block text-sm font-medium text-secondary-700 dark:text-secondary-200">{t('onboarding.fields.slug')}</label>
                <div className="flex min-w-0 items-stretch overflow-hidden rounded-lg border border-secondary-300 focus-within:ring-2 focus-within:ring-primary-500 dark:border-secondary-600">
                  <input
                    id="ob-slug"
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 24), slugTouched: true }))}
                    className="min-w-0 flex-1 bg-white px-3 py-2 text-sm text-secondary-900 focus:outline-none dark:bg-secondary-800 dark:text-white"
                  />
                  <span className="flex shrink-0 items-center bg-secondary-100 px-2 text-xs text-secondary-600 dark:bg-secondary-700 dark:text-secondary-200">.{BASE_DOMAIN}</span>
                </div>
                <FieldError msg={showErrors || form.slugTouched ? errors2.slug : null} />
              </div>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-secondary-700 dark:text-secondary-200">{t('onboarding.fields.plan')}</legend>
                <div className="grid gap-3 md:grid-cols-3">
                  {PLAN_IDS.map((p) => {
                    const plan = PLANS[p];
                    const tooSmall = units > plan.maxUnits;
                    const chosen = form.plan === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        disabled={tooSmall}
                        aria-pressed={chosen}
                        onClick={() => set('plan', p)}
                        className={`rounded-xl border-2 p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${chosen ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' : 'border-secondary-200 hover:border-primary-300 dark:border-secondary-700'}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-secondary-900 dark:text-white">{t(`plans.${p}.name`)}</span>
                          {suggestedPlan(units) === p && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100">{t('onboarding.suggested')}</span>}
                        </div>
                        <div className="mt-1 text-sm font-bold text-secondary-900 dark:text-white">{f.money(plan.price)} <span className="text-xs font-normal text-secondary-500">{t('common.plusIvaMonth')}</span></div>
                        <div className="mt-1 text-xs text-secondary-600 dark:text-secondary-400">{t('plans.limits', { units: f.num(plan.maxUnits), staff: plan.maxStaff, storage: plan.storageGb })}</div>
                        {tooSmall && <div className="mt-1 text-[11px] text-red-600">{t('onboarding.tooSmall', { units: f.num(units) })}</div>}
                      </button>
                    );
                  })}
                </div>
                <FieldError msg={showErrors ? errors2.plan : null} />
              </fieldset>
              <p className="text-xs text-secondary-600 dark:text-secondary-400">{t('onboarding.trialNote', { days: TRIAL_DAYS, date: f.date(addDays(DEMO_TODAY, TRIAL_DAYS)) })}</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-secondary-700 dark:text-secondary-200">{t('onboarding.fields.color')}</legend>
                <div className="flex flex-wrap items-center gap-2">
                  {BRAND_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={form.color === c}
                      aria-label={c}
                      onClick={() => set('color', c)}
                      className={`h-8 w-8 rounded-full ring-offset-2 dark:ring-offset-secondary-900 ${form.color === c ? 'ring-2 ring-secondary-900 dark:ring-white' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <label className="ml-1 flex items-center gap-2 text-xs text-secondary-600 dark:text-secondary-300">
                    {t('onboarding.customColor')}
                    <input type="color" value={form.color} onChange={(e) => set('color', e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-secondary-300 bg-transparent" />
                  </label>
                </div>
              </fieldset>
              <div>
                <span className="mb-2 block text-sm font-medium text-secondary-700 dark:text-secondary-200">{t('onboarding.fields.logo')}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center rounded-lg border-2 border-primary-600 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950">
                    {t('onboarding.uploadLogo')}
                    <input type="file" accept={LOGO_TYPES.join(',')} className="sr-only" onChange={(e) => onLogo(e.target.files?.[0])} />
                  </label>
                  {form.logo && (
                    <Button size="sm" variant="ghost" onClick={() => set('logo', undefined)}>{t('onboarding.removeLogo')}</Button>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-secondary-500">{t('onboarding.logoHint')}</p>
                <FieldError msg={logoError} />
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-secondary-200 pt-4 dark:border-secondary-700">
            <Button variant="ghost" size="sm" onClick={() => { setShowErrors(false); setStep((x) => Math.max(1, x - 1)); }} disabled={step === 1}>
              {t('common.back')}
            </Button>
            {step < 3 ? (
              <Button size="sm" onClick={next}>{t('common.next')}</Button>
            ) : (
              <Button size="sm" onClick={finish}>{t('onboarding.create')}</Button>
            )}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title={t('onboarding.previewTitle')}>
            <div className="overflow-hidden rounded-lg ring-1 ring-secondary-200 dark:ring-secondary-700">
              <div className="flex items-center gap-2 px-3 py-3 text-white" style={{ backgroundColor: preview.color }}>
                <TenantAvatar tenant={{ ...preview, color: 'rgba(255,255,255,0.25)' }} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{preview.name}</div>
                  <div className="truncate text-[11px] opacity-80">{(form.slug || slugify(form.name) || 'tuconjunto')}.{BASE_DOMAIN}</div>
                </div>
              </div>
              <div className="space-y-1.5 bg-white p-3 dark:bg-secondary-900">
                <div className="h-2 w-2/3 rounded bg-secondary-200 dark:bg-secondary-700" />
                <div className="h-2 w-1/2 rounded bg-secondary-200 dark:bg-secondary-700" />
                <div className="mt-2 inline-block rounded px-2 py-1 text-[10px] font-semibold text-white" style={{ backgroundColor: preview.color }}>{t('onboarding.previewButton')}</div>
              </div>
            </div>
          </Panel>
          <Panel title={t('onboarding.effectsTitle')}>
            <ul className="list-disc space-y-1 pl-4 text-xs text-secondary-600 dark:text-secondary-300">
              {(t.raw('onboarding.effects') as string[]).map((x) => <li key={x}>{x}</li>)}
            </ul>
            <SimNote>{t('onboarding.simNote')}</SimNote>
          </Panel>
        </div>
      </div>
    </div>
  );
}
