'use client';

import { useTranslations } from 'next-intl';
import { ArrowPathIcon, BuildingLibraryIcon, CreditCardIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { depositOf } from '../lib/engine';
import type { PayMethod, Service } from '../lib/types';
import { SimNote, btnPrimary, btnSecondary, useFmt } from './ui';

export type PayOption = 'deposit' | 'full' | 'onsite';

const METHODS: { id: Exclude<PayMethod, 'onsite'>; icon: typeof CreditCardIcon }[] = [
  { id: 'pse', icon: BuildingLibraryIcon },
  { id: 'nequi', icon: DevicePhoneMobileIcon },
  { id: 'card', icon: CreditCardIcon },
];

/** Pago simulado: no se cobra nada ni se piden datos de tarjeta. */
export default function PayStep({
  service,
  option,
  setOption,
  method,
  setMethod,
  amount,
  processing,
  onBack,
  onPay,
}: {
  service: Service;
  option: PayOption;
  setOption: (o: PayOption) => void;
  method: PayMethod;
  setMethod: (m: PayMethod) => void;
  amount: number;
  processing: boolean;
  onBack: () => void;
  onPay: () => void;
}) {
  const t = useTranslations('demoReservas.pay');
  const f = useFmt();
  const requiresDeposit = service.deposit > 0;
  const options: { id: PayOption; title: string; detail: string; disabled?: boolean }[] = requiresDeposit
    ? [
        { id: 'deposit', title: t('deposit', { pct: service.deposit, amount: f.money(depositOf(service)) }), detail: t('depositDetail', { rest: f.money(service.price - depositOf(service)) }) },
        { id: 'full', title: t('full', { amount: f.money(service.price) }), detail: t('fullDetail') },
        { id: 'onsite', title: t('onsite'), detail: t('onsiteBlocked'), disabled: true },
      ]
    : [
        { id: 'onsite', title: t('onsite'), detail: t('onsiteDetail') },
        { id: 'full', title: t('full', { amount: f.money(service.price) }), detail: t('fullDetail') },
      ];

  if (processing) {
    return (
      <div className="py-10 text-center" role="status" aria-live="polite">
        <ArrowPathIcon className="mx-auto h-10 w-10 animate-spin text-orange-600" />
        <p className="mt-4 font-semibold text-slate-900 dark:text-white">{t(`processing.${method}`)}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('processingNote')}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{t('title')}</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{requiresDeposit ? t('whyDeposit', { pct: service.deposit }) : t('noDepositNeeded')}</p>

      <div role="radiogroup" aria-label={t('title')} className="grid gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={option === o.id}
            disabled={o.disabled}
            onClick={() => setOption(o.id)}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
              option === o.id ? 'border-orange-600 bg-orange-50 dark:bg-orange-950/40' : 'border-slate-200 dark:border-slate-700 hover:border-orange-400'
            } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200`}
          >
            <span className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${option === o.id ? 'border-orange-600 bg-orange-600 ring-2 ring-white ring-inset' : 'border-slate-300'}`} />
            <span>
              <span className="block text-sm font-semibold text-slate-900 dark:text-white">{o.title}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">{o.detail}</span>
            </span>
          </button>
        ))}
      </div>

      {option !== 'onsite' && (
        <div className="mt-5">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">{t('method')}</p>
          <div role="radiogroup" aria-label={t('method')} className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={method === m.id}
                onClick={() => setMethod(m.id)}
                className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs sm:text-sm font-medium transition-colors ${
                  method === m.id
                    ? 'border-orange-600 bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-orange-400'
                }`}
              >
                <m.icon className="h-6 w-6" />
                {t(`methods.${m.id}`)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t(`methodHint.${method === 'onsite' ? 'pse' : method}`)}</p>
        </div>
      )}

      <div className="mt-5">
        <SimNote>{t('simNote')}</SimNote>
      </div>

      <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-between">
        <button type="button" className={btnSecondary} onClick={onBack}>
          {t('back')}
        </button>
        <button type="button" className={btnPrimary} onClick={onPay}>
          {option === 'onsite' ? t('confirmOnsite') : t('payNow', { amount: f.money(amount) })}
        </button>
      </div>
    </div>
  );
}
