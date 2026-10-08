'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid';
import Button from '@/components/ui/Button';
import { SEDES } from './data';
import { STREET_TYPES, fmtKm, fmtTime, nearestSede, placeFromAddress, validPlaca, zoneOf, type StreetType } from './engine';
import { StageBadge, useMoney } from './ui';
import { useDelivery } from './store';
import { Header } from './CustomerCart';

export const STREET_LABEL: Record<StreetType, string> = {
  calle: 'Calle',
  carrera: 'Carrera',
  avCalle: 'Avenida Calle',
  avCarrera: 'Avenida Carrera',
  diagonal: 'Diagonal',
  transversal: 'Transversal',
};

export function CustomerOrders() {
  const t = useTranslations('demoDelivery');
  const locale = useLocale();
  const money = useMoney();
  const { state, dispatch } = useDelivery();
  const own = state.orders.filter((o) => o.own).reverse();
  return (
    <div className="space-y-3 p-4">
      <Header title={t('customer.orders.title')} onBack={() => dispatch({ type: 'customer', patch: { view: 'home' } })} backLabel={t('common.back')} />
      {own.length === 0 ? (
        <p className="py-10 text-center text-sm text-secondary-500 dark:text-secondary-400">{t('customer.orders.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {own.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => dispatch({ type: 'customer', patch: { view: 'tracking', activeOrderId: o.id } })}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-secondary-200 bg-white p-3 text-left text-xs hover:border-primary-500 dark:border-secondary-700 dark:bg-secondary-800"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{o.id} · {t(`sedes.${o.sedeId}`)}</span>
                  <span className="text-secondary-500 dark:text-secondary-400">{fmtTime(o.t.created, locale)} · {money(o.pricing.total)} · {t(`payments.${o.payment}.name`)}</span>
                </span>
                <StageBadge stage={o.stage} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CustomerAddress() {
  const t = useTranslations('demoDelivery');
  const locale = useLocale();
  const money = useMoney();
  const { state, dispatch, notify } = useDelivery();
  const [type, setType] = useState<StreetType>('calle');
  const [main, setMain] = useState('');
  const [cross, setCross] = useState('');
  const [placa, setPlaca] = useState('');
  const [extra, setExtra] = useState('');
  const [label, setLabel] = useState('');
  const [touched, setTouched] = useState(false);

  const place = placeFromAddress(type, main, cross);
  const placaOk = validPlaca(placa);
  const valid = !!place && placaOk;
  const formatted = `${STREET_LABEL[type]} ${main.trim()} # ${cross.trim()}-${placa.trim()}${extra.trim() ? `, ${extra.trim()}` : ''}`;
  const coverage = place ? nearestSede(place, SEDES, state.sedeOpen) : null;

  const save = () => {
    setTouched(true);
    if (!valid || !place) return;
    dispatch({ type: 'addAddress', address: { label: label.trim() || t('customer.address.defaultLabel'), address: formatted, place, zone: zoneOf(place) } });
    notify(t('customer.address.saved'));
  };

  const field = 'block w-full rounded-lg border border-secondary-300 bg-white px-2 py-1.5 text-xs dark:border-secondary-600 dark:bg-secondary-900';

  return (
    <div className="space-y-3 p-4">
      <Header title={t('customer.address.title')} onBack={() => dispatch({ type: 'customer', patch: { view: 'home' } })} backLabel={t('common.back')} />

      <div className="space-y-1.5" role="radiogroup" aria-label={t('customer.address.savedList')}>
        {state.customer.addresses.map((a) => {
          const selected = a.id === state.customer.addressId;
          const lbl = ['casa', 'oficina'].includes(a.label) ? t(`customer.addressLabels.${a.label}`) : a.label;
          return (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => dispatch({ type: 'customer', patch: { addressId: a.id, sedeId: null, view: 'home' } })}
              className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs ${selected ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-secondary-200 bg-white dark:border-secondary-700 dark:bg-secondary-800'}`}
            >
              <span className="min-w-0">
                <span className="block font-semibold">{lbl}</span>
                <span className="block truncate text-secondary-500 dark:text-secondary-400">{a.address}</span>
              </span>
              {selected && <CheckSolid className="h-4 w-4 shrink-0 text-primary-600" />}
            </button>
          );
        })}
      </div>

      <form
        className="space-y-2 rounded-xl border border-secondary-200 bg-white p-3 text-xs dark:border-secondary-700 dark:bg-secondary-800"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        noValidate
      >
        <p className="font-semibold">{t('customer.address.newTitle')}</p>
        <label className="block">
          <span className="mb-0.5 block text-secondary-600 dark:text-secondary-300">{t('customer.address.streetType')}</span>
          <select value={type} onChange={(e) => setType(e.target.value as StreetType)} className={field}>
            {STREET_TYPES.map((s) => <option key={s} value={s}>{STREET_LABEL[s]}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-end gap-1">
          <label className="block min-w-0">
            <span className="mb-0.5 block text-secondary-600 dark:text-secondary-300">{t('customer.address.main')}</span>
            <input value={main} onChange={(e) => setMain(e.target.value)} placeholder="85" className={field} />
          </label>
          <span className="pb-1.5 font-bold">#</span>
          <label className="block min-w-0">
            <span className="mb-0.5 block text-secondary-600 dark:text-secondary-300">{t('customer.address.cross')}</span>
            <input value={cross} onChange={(e) => setCross(e.target.value)} placeholder="15" className={field} />
          </label>
          <span className="pb-1.5 font-bold">-</span>
          <label className="block min-w-0">
            <span className="mb-0.5 block text-secondary-600 dark:text-secondary-300">{t('customer.address.placa')}</span>
            <input value={placa} onChange={(e) => setPlaca(e.target.value)} placeholder="32" className={field} />
          </label>
        </div>
        <label className="block">
          <span className="mb-0.5 block text-secondary-600 dark:text-secondary-300">{t('customer.address.extra')}</span>
          <input value={extra} onChange={(e) => setExtra(e.target.value)} maxLength={60} placeholder={t('customer.address.extraPlaceholder')} className={field} />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-secondary-600 dark:text-secondary-300">{t('customer.address.label')}</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={30} placeholder={t('customer.address.labelPlaceholder')} className={field} />
        </label>

        {(main || cross || placa) && (
          <div className="rounded-lg bg-secondary-50 p-2 dark:bg-secondary-900">
            <p className="font-semibold">{formatted}</p>
            {place ? (
              coverage ? (
                <p className="text-emerald-700 dark:text-emerald-300">{t('customer.address.covered', { sede: t(`sedes.${coverage.sede.id}`), km: fmtKm(coverage.km, locale), fee: money(coverage.fee) })}</p>
              ) : (
                <p className="text-amber-700 dark:text-amber-300">{t('customer.address.notCovered')}</p>
              )
            ) : null}
          </div>
        )}
        {touched && !valid && <p role="alert" className="font-medium text-red-600">{t('customer.address.invalid')}</p>}
        <p className="text-[10px] text-secondary-500 dark:text-secondary-400">{t('customer.address.note')}</p>
        <Button type="submit" size="sm" fullWidth>{t('customer.address.save')}</Button>
      </form>
    </div>
  );
}
