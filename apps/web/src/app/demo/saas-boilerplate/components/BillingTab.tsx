'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { CheckCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { ProgressBar } from './shared';

type Plan = 'starter' | 'pro' | 'enterprise';

export default function BillingTab() {
  const t = useTranslations('demoSaas');
  const [selectedPlan, setSelectedPlan] = useState<Plan>('pro');
  const [checkoutState, setCheckoutState] = useState<'idle' | 'processing' | 'success'>('idle');

  const startCheckout = () => {
    setCheckoutState('processing');
    setTimeout(() => setCheckoutState('success'), 1400);
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">{t('billing.title')}</h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">{t('billing.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['starter', 'pro', 'enterprise'] as Plan[]).map((p) => {
          const isCurrent = selectedPlan === p;
          const isPro = p === 'pro';
          return (
            <Card key={p} variant="bordered" className={`relative ${isCurrent ? 'ring-2 ring-primary-500 border-primary-500' : ''}`}>
              {isPro && <Badge variant="primary" className="absolute -top-2 right-4">{t('billing.trial')}</Badge>}
              <div className="font-semibold text-secondary-900 dark:text-white">{t(`billing.plans.${p}.name`)}</div>
              <div className="mt-2">
                <span className="text-3xl font-bold text-secondary-900 dark:text-white">{t(`billing.plans.${p}.price`)}</span>
                <span className="text-sm text-secondary-500 dark:text-secondary-400"> / mo</span>
              </div>
              <div className="text-xs text-secondary-500 dark:text-secondary-400">{t('billing.billed')}</div>
              <ul className="mt-4 space-y-1.5">
                {(t.raw(`billing.plans.${p}.features`) as string[]).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-secondary-700 dark:text-secondary-300">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={isCurrent ? 'outline' : 'primary'}
                fullWidth
                className="mt-4"
                onClick={() => {
                  setSelectedPlan(p);
                  setCheckoutState('idle');
                }}
              >
                {isCurrent ? t('billing.currentPlan') : t('billing.selectPlan')}
              </Button>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card variant="bordered">
          <h3 className="text-base font-semibold text-secondary-900 dark:text-white">{t('billing.checkout.title')}</h3>
          <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-4">{t('billing.checkout.subtitle')}</p>
          {checkoutState !== 'success' ? (
            <div className="space-y-3">
              <Input placeholder={t('billing.checkout.email')} type="email" />
              <Input placeholder={t('billing.checkout.cardPlaceholder')} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder={t('billing.checkout.expiry')} />
                <Input placeholder={t('billing.checkout.cvc')} />
              </div>
              <Button onClick={startCheckout} isLoading={checkoutState === 'processing'} fullWidth>
                {checkoutState === 'processing' ? t('billing.checkout.processing') : t('billing.checkout.pay')}
              </Button>
            </div>
          ) : (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 flex items-center gap-3">
              <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
              <div>
                <div className="font-semibold text-emerald-900 dark:text-emerald-100">{t('billing.checkout.success')}</div>
                <div className="text-xs text-emerald-700 dark:text-emerald-300">
                  {t(`billing.plans.${selectedPlan}.name`)} - {t(`billing.plans.${selectedPlan}.price`)}/mo
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card variant="bordered">
          <h3 className="text-base font-semibold text-secondary-900 dark:text-white">{t('billing.usage.title')}</h3>
          <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-4">{t('billing.usage.subtitle')}</p>
          <div className="space-y-4">
            {[
              { label: t('billing.usage.apiCalls'), value: 78400, max: 100000, tone: 'warning' as const, unit: '' },
              { label: t('billing.usage.storage'), value: 42, max: 100, tone: 'primary' as const, unit: ' GB' },
              { label: t('billing.usage.seats'), value: 18, max: 25, tone: 'primary' as const, unit: '' },
            ].map((u) => (
              <div key={u.label}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-secondary-700 dark:text-secondary-300">{u.label}</span>
                  <span className="font-mono text-secondary-900 dark:text-white">
                    {u.value.toLocaleString()}{u.unit} <span className="text-secondary-500">{t('billing.usage.of')} {u.max.toLocaleString()}{u.unit}</span>
                  </span>
                </div>
                <ProgressBar value={u.value} max={u.max} tone={u.tone} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card variant="bordered">
        <h3 className="text-base font-semibold text-secondary-900 dark:text-white">{t('billing.dunning.title')}</h3>
        <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-4">{t('billing.dunning.subtitle')}</p>
        <div className="space-y-2">
          {(t.raw('billing.dunning.items') as { day: string; subject: string }[]).map((d, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-secondary-200 dark:border-secondary-700 px-3 py-2.5">
              <Badge variant={i === 3 ? 'danger' : i === 2 ? 'warning' : 'info'} size="sm">{d.day}</Badge>
              <EnvelopeIcon className="w-4 h-4 text-secondary-400 shrink-0" />
              <span className="text-sm text-secondary-700 dark:text-secondary-300 truncate">{d.subject}</span>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
