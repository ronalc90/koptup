'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowLeftIcon, PlusIcon, MinusIcon, CreditCardIcon, BanknotesIcon, DevicePhoneMobileIcon, BuildingLibraryIcon, CalculatorIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid';
import Button from '@/components/ui/Button';
import { MENU_BY_ID } from './data';
import { CLUB_FREE_FROM, fmtNum, POINTS_REDEEM, POINTS_REDEEM_VALUE, TIP_OPTIONS, splitAmount } from './engine';
import type { PaymentId } from './types';
import { Row, useMoney } from './ui';
import { useDelivery, cartPricing, placeOrderCheck, selectedSede, type PlaceError } from './store';

const PAYMENTS: { id: PaymentId; icon: typeof CreditCardIcon }[] = [
  { id: 'nequi', icon: DevicePhoneMobileIcon },
  { id: 'daviplata', icon: DevicePhoneMobileIcon },
  { id: 'pse', icon: BuildingLibraryIcon },
  { id: 'card', icon: CreditCardIcon },
  { id: 'cash', icon: BanknotesIcon },
  { id: 'dataphone', icon: CalculatorIcon },
];

export const ONLINE: PaymentId[] = ['nequi', 'daviplata', 'pse', 'card'];

export default function CustomerCart() {
  const t = useTranslations('demoDelivery');
  const locale = useLocale();
  const money = useMoney();
  const { state, dispatch, notify } = useDelivery();
  const [error, setError] = useState<PlaceError | null>(null);
  const c = state.customer;
  const pricing = cartPricing(state);
  const { option } = selectedSede(state);
  const cod = !ONLINE.includes(c.payment);
  const back = () => dispatch({ type: 'customer', patch: { view: 'home' } });

  const submit = () => {
    const err = placeOrderCheck(state);
    setError(err);
    if (err) return;
    const id = `P-${state.seq}`;
    dispatch({ type: 'placeOrder' });
    notify(cod ? t('customer.cart.sentCod', { id }) : t('customer.cart.paidOnline', { id, method: t(`payments.${c.payment}.name`) }));
  };

  if (!c.cart.length) {
    return (
      <div className="space-y-4 p-4">
        <Header title={t('customer.cart.title')} onBack={back} backLabel={t('common.back')} />
        <p className="py-12 text-center text-sm text-secondary-500 dark:text-secondary-400">{t('customer.cart.empty')}</p>
        <Button fullWidth variant="outline" onClick={back}>{t('customer.cart.goMenu')}</Button>
      </div>
    );
  }

  const soldOut = option ? state.soldOut[option.sede.id] : [];

  return (
    <div className="space-y-3 p-4">
      <Header title={t('customer.cart.title')} onBack={back} backLabel={t('common.back')} />
      {option && <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('customer.cart.from', { sede: t(`sedes.${option.sede.id}`) })}</p>}

      <div className="space-y-2">
        {c.cart.map((l) => (
          <div key={l.key} className="flex items-center gap-2 rounded-xl border border-secondary-200 bg-white p-3 dark:border-secondary-700 dark:bg-secondary-800">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{t(`menu.items.${l.itemId}.name`)}</div>
              {l.options.length > 0 && <div className="text-[11px] text-secondary-500 dark:text-secondary-400">{l.options.map((o) => t(`menu.options.${o}`)).join(' · ')}</div>}
              <div className="text-xs text-secondary-500 dark:text-secondary-400">{money(l.unit)}</div>
              {soldOut.includes(l.itemId) && <div className="text-[11px] font-semibold text-red-600">{t('customer.cart.lineSoldOut')}</div>}
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => dispatch({ type: 'qty', key: l.key, delta: -1 })} aria-label={l.qty === 1 ? t('customer.cart.remove') : t('common.less')} className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-700">
                {l.qty === 1 ? <TrashIcon className="h-3.5 w-3.5" /> : <MinusIcon className="h-3 w-3" />}
              </button>
              <span className="w-5 text-center text-sm font-bold">{l.qty}</span>
              <button type="button" onClick={() => dispatch({ type: 'qty', key: l.key, delta: 1 })} aria-label={t('common.more')} className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-white">
                <PlusIcon className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <label className="block rounded-xl border border-secondary-200 bg-white p-3 dark:border-secondary-700 dark:bg-secondary-800">
        <span className="mb-1 block text-xs font-semibold">{t('customer.cart.noteLabel')}</span>
        <textarea
          value={c.note}
          maxLength={140}
          rows={2}
          onChange={(e) => dispatch({ type: 'customer', patch: { note: e.target.value } })}
          placeholder={t('customer.cart.notePlaceholder')}
          className="block w-full resize-none rounded-lg border border-secondary-300 bg-white px-2 py-1.5 text-xs dark:border-secondary-600 dark:bg-secondary-900"
        />
      </label>

      <div className="rounded-xl border border-secondary-200 bg-white p-3 dark:border-secondary-700 dark:bg-secondary-800">
        <p className="text-xs font-semibold">{t('customer.cart.tipLabel')}</p>
        <p className="mb-2 text-[11px] text-secondary-500 dark:text-secondary-400">{t('customer.cart.tipHint')}</p>
        <div className="grid grid-cols-4 gap-1.5">
          {TIP_OPTIONS.map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={c.tip === v}
              onClick={() => dispatch({ type: 'customer', patch: { tip: v } })}
              className={`rounded-lg py-1.5 text-[11px] font-semibold ${c.tip === v ? 'bg-primary-600 text-white' : 'bg-secondary-100 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-200'}`}
            >
              {v === 0 ? t('customer.cart.noTip') : money(v)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-secondary-200 bg-white p-3 dark:border-secondary-700 dark:bg-secondary-800">
        <p className="mb-2 text-xs font-semibold">{t('customer.cart.paymentMethod')}</p>
        <div className="space-y-1.5" role="radiogroup" aria-label={t('customer.cart.paymentMethod')}>
          {PAYMENTS.map(({ id, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={c.payment === id}
              onClick={() => dispatch({ type: 'customer', patch: { payment: id, cashWith: null } })}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs ${c.payment === id ? 'border border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border border-transparent bg-secondary-50 dark:bg-secondary-900'}`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0">
                  <span className="block font-semibold">{t(`payments.${id}.name`)}</span>
                  <span className="block text-[10px] text-secondary-500 dark:text-secondary-400">{t(`payments.${id}.desc`)}</span>
                </span>
              </span>
              {c.payment === id && <CheckSolid className="h-4 w-4 shrink-0 text-primary-600" />}
            </button>
          ))}
        </div>
        {c.payment === 'cash' && (
          <label className="mt-2 block text-xs">
            <span className="mb-1 block font-semibold">{t('customer.cart.cashWith')}</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              value={c.cashWith ?? ''}
              onChange={(e) => dispatch({ type: 'customer', patch: { cashWith: e.target.value === '' ? null : Math.max(0, parseInt(e.target.value, 10) || 0) } })}
              placeholder={t('customer.cart.cashPlaceholder')}
              className="block w-full rounded-lg border border-secondary-300 bg-white px-2 py-1.5 dark:border-secondary-600 dark:bg-secondary-900"
            />
            {c.cashWith !== null && c.cashWith >= pricing.total && (
              <span className="mt-1 block text-emerald-700 dark:text-emerald-300">{t('customer.cart.change', { change: money(c.cashWith - pricing.total) })}</span>
            )}
          </label>
        )}
        <p className="mt-2 text-[10px] text-secondary-500 dark:text-secondary-400">{t('customer.cart.paymentNote')}</p>
      </div>

      <div className="space-y-2 rounded-xl border border-secondary-200 bg-white p-3 text-xs dark:border-secondary-700 dark:bg-secondary-800">
        {c.points >= POINTS_REDEEM ? (
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={c.usePoints} onChange={() => dispatch({ type: 'customer', patch: { usePoints: !c.usePoints } })} />
            {t('customer.cart.usePoints', { points: POINTS_REDEEM, value: money(POINTS_REDEEM_VALUE), balance: fmtNum(c.points, locale) })}
          </label>
        ) : (
          <p className="text-secondary-500 dark:text-secondary-400">{t('customer.cart.pointsMissing', { n: POINTS_REDEEM - c.points })}</p>
        )}
        <label className="flex items-center justify-between gap-2">
          <span>{t('customer.cart.split')}</span>
          <select
            value={c.split}
            onChange={(e) => dispatch({ type: 'customer', patch: { split: parseInt(e.target.value, 10) } })}
            className="rounded-lg border border-secondary-300 bg-white px-2 py-1 dark:border-secondary-600 dark:bg-secondary-900"
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>{t('customer.cart.people', { n })}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-1 rounded-xl border border-secondary-200 bg-white p-3 text-sm dark:border-secondary-700 dark:bg-secondary-800">
        <Row k={t('customer.cart.subtotal')} v={money(pricing.subtotal)} />
        <Row
          k={t('customer.cart.deliveryFee')}
          v={pricing.fee === 0 ? t('customer.cart.freeClub') : money(pricing.fee)}
        />
        {c.club && pricing.fee > 0 && <p className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('customer.cart.clubMissing', { n: money(CLUB_FREE_FROM - pricing.subtotal) })}</p>}
        {pricing.rainFee > 0 && <Row k={t('customer.cart.rainFee')} v={money(pricing.rainFee)} />}
        {pricing.discount > 0 && <Row k={t('customer.cart.pointsDiscount')} v={`-${money(pricing.discount)}`} tone="green" />}
        <Row k={t('customer.cart.tip')} v={money(pricing.tip)} />
        <div className="mt-1 border-t border-secondary-200 pt-1 dark:border-secondary-700">
          <Row k={t('customer.cart.total')} v={money(pricing.total)} bold />
          {c.split > 1 && <p className="text-right text-[11px] text-secondary-500 dark:text-secondary-400">{t('customer.cart.perPerson', { n: c.split, amount: money(splitAmount(pricing.total, c.split)) })}</p>}
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-200">
          {t(`customer.cart.errors.${error}`)}
        </p>
      )}

      <Button fullWidth onClick={submit}>
        {cod ? t('customer.cart.placeCod', { total: money(pricing.total) }) : t('customer.cart.pay', { total: money(pricing.total) })}
      </Button>
      <p className="text-center text-[10px] text-secondary-500 dark:text-secondary-400">{t('customer.cart.items', { n: c.cart.reduce((a, l) => a + l.qty, 0), lines: c.cart.map((l) => MENU_BY_ID[l.itemId] ? t(`menu.items.${l.itemId}.name`) : l.itemId).join(', ') })}</p>
    </div>
  );
}

export function Header({ title, onBack, backLabel, right }: { title: string; onBack: () => void; backLabel: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onBack} aria-label={backLabel} title={backLabel} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-200 dark:bg-secondary-800">
        <ArrowLeftIcon className="h-4 w-4" />
      </button>
      <h2 className="min-w-0 flex-1 truncate text-lg font-bold">{title}</h2>
      {right}
    </div>
  );
}
