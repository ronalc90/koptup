'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  MagnifyingGlassIcon, MapPinIcon, PlusIcon, MinusIcon, SparklesIcon, FireIcon, ShoppingBagIcon, ClipboardDocumentListIcon,
  BuildingStorefrontIcon, ChevronRightIcon, ExclamationTriangleIcon, NoSymbolIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { BRAND, CUSTOMER, MENU } from './data';
import { CLUB_FREE_FROM, fmtKm, fmtNum, isActive, travelMin, unitPrice } from './engine';
import type { CategoryId, MenuItem } from './types';
import { PhoneFrame, Modal, StageBadge, useMoney } from './ui';
import { useDelivery, selectedSede, cartPricing } from './store';
import CustomerCart from './CustomerCart';
import { CustomerTracking, CustomerChat } from './CustomerTracking';
import { CustomerOrders, CustomerAddress } from './CustomerExtras';

const CATS: (CategoryId | 'all')[] = ['all', 'platos', 'sopas', 'antojos', 'bebidas', 'postres'];

export default function CustomerApp() {
  const t = useTranslations('demoDelivery');
  const { state } = useDelivery();
  const [sheet, setSheet] = useState<MenuItem | null>(null);
  const view = state.customer.view;

  const overlay = sheet ? <ItemSheet item={sheet} onClose={() => setSheet(null)} /> : null;

  return (
    <PhoneFrame label={t('tabs.customer')} overlay={overlay}>
      {view === 'home' && <CustomerHome onOpenItem={setSheet} />}
      {view === 'cart' && <CustomerCart />}
      {view === 'tracking' && <CustomerTracking />}
      {view === 'chat' && <CustomerChat />}
      {view === 'orders' && <CustomerOrders />}
      {view === 'address' && <CustomerAddress />}
    </PhoneFrame>
  );
}

function CustomerHome({ onOpenItem }: { onOpenItem: (m: MenuItem) => void }) {
  const t = useTranslations('demoDelivery');
  const locale = useLocale();
  const money = useMoney();
  const { state, dispatch, notify } = useDelivery();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<CategoryId | 'all'>('all');
  const [pickSede, setPickSede] = useState(false);
  const { address, option, options } = selectedSede(state);
  const c = state.customer;
  const soldOut = option ? state.soldOut[option.sede.id] : [];
  const pricing = cartPricing(state);
  const cartCount = c.cart.reduce((a, l) => a + l.qty, 0);
  const active = [...state.orders].reverse().find((o) => o.own && isActive(o));
  const blocked = state.blocked.includes(CUSTOMER.id);

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return MENU.filter((m) => (cat === 'all' || m.cat === cat) && (!needle || `${t(`menu.items.${m.id}.name`)} ${t(`menu.items.${m.id}.desc`)}`.toLowerCase().includes(needle)));
  }, [q, cat, t]);

  const quickAdd = (m: MenuItem) => {
    if (m.choice || m.extras) return onOpenItem(m);
    dispatch({ type: 'addToCart', itemId: m.id, options: [], qty: 1 });
    notify(t('customer.home.added', { item: t(`menu.items.${m.id}.name`) }));
  };

  const ride = option ? travelMin(option.km) : 0;
  const addressLabel = ['casa', 'oficina'].includes(address.label) ? t(`customer.addressLabels.${address.label}`) : address.label;

  return (
    <div className="min-h-full pb-2">
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <button type="button" onClick={() => dispatch({ type: 'customer', patch: { view: 'address' } })} className="min-w-0 text-left">
            <span className="flex items-center gap-1 text-[11px] text-secondary-500 dark:text-secondary-400">
              <MapPinIcon className="h-3.5 w-3.5" />
              {t('customer.home.deliverTo', { label: addressLabel })}
            </span>
            <span className="block truncate text-xs font-semibold text-primary-700 underline-offset-2 hover:underline dark:text-primary-300">{address.address}</span>
          </button>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-200">
            <SparklesIcon className="h-3 w-3" />
            {t('customer.home.points', { points: fmtNum(c.points, locale) })}
          </span>
        </div>
        <h2 className="text-lg font-bold">{t('customer.home.greeting', { name: CUSTOMER.name, brand: BRAND })}</h2>

        {blocked && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-800 dark:bg-red-900/30 dark:text-red-200">
            <NoSymbolIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t('customer.home.blocked')}</span>
          </div>
        )}

        {active && (
          <button
            type="button"
            onClick={() => dispatch({ type: 'customer', patch: { view: 'tracking', activeOrderId: active.id } })}
            className="flex w-full items-center justify-between gap-2 rounded-xl bg-secondary-900 px-3 py-2 text-left text-xs text-white dark:bg-secondary-700"
          >
            <span className="min-w-0 space-y-1">
              <span className="block font-semibold">{t('customer.home.activeOrder', { id: active.id })}</span>
              <StageBadge stage={active.stage} />
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap font-semibold">{t('customer.home.track')}<ChevronRightIcon className="h-4 w-4" /></span>
          </button>
        )}

        {option ? (
          <div className="rounded-xl border border-secondary-200 bg-white p-3 text-xs dark:border-secondary-700 dark:bg-secondary-800">
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <BuildingStorefrontIcon className="h-5 w-5 shrink-0 text-orange-500" />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{t('customer.home.servedBy', { sede: t(`sedes.${option.sede.id}`) })}</span>
                  <span className="text-secondary-500 dark:text-secondary-400">
                    {fmtKm(option.km, locale)} · {t('customer.home.fee', { fee: money(option.fee) })} · {t('customer.home.eta', { from: 15 + ride, to: 25 + ride })}
                  </span>
                </span>
              </span>
              <button type="button" onClick={() => setPickSede(true)} className="shrink-0 font-semibold text-primary-600 hover:underline dark:text-primary-400">
                {t('customer.home.changeSede')}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">
            <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {t('customer.home.noCoverage')}{' '}
              <button type="button" onClick={() => setPickSede(true)} className="font-semibold underline">{t('customer.home.seeSedes')}</button>
            </span>
          </div>
        )}

        <div className={`flex items-center justify-between gap-2 rounded-xl p-3 text-xs font-medium ${c.club ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'}`}>
          <span>{c.club ? t('customer.club.active', { min: money(CLUB_FREE_FROM) }) : t('customer.club.offer', { brand: BRAND, min: money(CLUB_FREE_FROM) })}</span>
          <button
            type="button"
            onClick={() => {
              dispatch({ type: 'customer', patch: { club: !c.club } });
              notify(c.club ? t('customer.club.cancelled') : t('customer.club.activated'), 'info');
            }}
            className="shrink-0 rounded-lg bg-white/90 px-2 py-1 text-[11px] font-semibold text-secondary-900"
          >
            {c.club ? t('customer.club.cancel') : t('customer.club.cta')}
          </button>
        </div>

        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('customer.home.search')}
            aria-label={t('customer.home.search')}
            className="block w-full rounded-lg border border-secondary-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-800"
          />
        </div>

        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1" role="tablist" aria-label={t('customer.home.categories')}>
          {CATS.map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={cat === k}
              onClick={() => setCat(k)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${cat === k ? 'bg-orange-500 text-white' : 'bg-white text-secondary-700 ring-1 ring-secondary-200 dark:bg-secondary-800 dark:text-secondary-200 dark:ring-secondary-700'}`}
            >
              {t(`menu.categories.${k}`)}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {items.length === 0 && (
            <div className="py-6 text-center text-xs text-secondary-500 dark:text-secondary-400">
              <p>{t('customer.home.noResults', { q })}</p>
              <button type="button" onClick={() => { setQ(''); setCat('all'); }} className="mt-1 font-semibold text-primary-600 hover:underline dark:text-primary-400">
                {t('customer.home.viewAll')}
              </button>
            </div>
          )}
          {items.map((m) => {
            const out = soldOut.includes(m.id);
            const name = t(`menu.items.${m.id}.name`);
            return (
              <div key={m.id} className={`flex items-start justify-between gap-2 rounded-xl border border-secondary-200 bg-white p-3 dark:border-secondary-700 dark:bg-secondary-800 ${out ? 'opacity-60' : ''}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold">{name}</span>
                    {m.popular && !out && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                        <FireIcon className="mr-0.5 h-3 w-3" />
                        {t('customer.home.popular')}
                      </span>
                    )}
                    {out && <span className="rounded-full bg-secondary-200 px-1.5 text-[10px] font-semibold text-secondary-700 dark:bg-secondary-700 dark:text-secondary-200">{t('customer.home.soldOut')}</span>}
                  </div>
                  <p className="mt-0.5 text-xs text-secondary-500 dark:text-secondary-400">{t(`menu.items.${m.id}.desc`)}</p>
                  <p className="mt-1 text-sm font-bold">{money(m.price)}</p>
                </div>
                <Button size="sm" onClick={() => quickAdd(m)} disabled={out || !option} aria-label={t('customer.home.add', { item: name })} title={t('customer.home.add', { item: name })}>
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>

        <button type="button" onClick={() => dispatch({ type: 'customer', patch: { view: 'orders' } })} className="flex w-full items-center justify-center gap-1 py-2 text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400">
          <ClipboardDocumentListIcon className="h-4 w-4" />
          {t('customer.home.myOrders', { n: state.orders.filter((o) => o.own).length })}
        </button>
      </div>

      {cartCount > 0 && (
        <div className="sticky bottom-0 border-t border-secondary-200 bg-white/95 p-3 backdrop-blur dark:border-secondary-700 dark:bg-secondary-900/95">
          <Button fullWidth onClick={() => dispatch({ type: 'customer', patch: { view: 'cart' } })}>
            <ShoppingBagIcon className="mr-2 h-4 w-4" />
            {t('customer.home.viewCart', { n: cartCount, total: money(pricing.subtotal) })}
          </Button>
        </div>
      )}

      {pickSede && (
        <Modal scope="phone" title={t('customer.home.pickSede')} onClose={() => setPickSede(false)}>
          <p className="mb-2 text-xs text-secondary-500 dark:text-secondary-400">{t('customer.home.pickSedeHint', { address: address.address })}</p>
          <div className="space-y-2">
            {options.map((o) => {
              const disabled = !o.open || !o.inCoverage;
              const selected = option?.sede.id === o.sede.id;
              return (
                <button
                  key={o.sede.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    dispatch({ type: 'customer', patch: { sedeId: o.sede.id } });
                    setPickSede(false);
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-xs disabled:cursor-not-allowed disabled:opacity-50 ${selected ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-secondary-200 dark:border-secondary-700'}`}
                >
                  <span className="block font-semibold">{t(`sedes.${o.sede.id}`)} · {o.sede.address}</span>
                  <span className="text-secondary-500 dark:text-secondary-400">
                    {fmtKm(o.km, locale)} · {money(o.fee)} · {!o.open ? t('customer.home.closed') : !o.inCoverage ? t('customer.home.outOfCoverage') : selected ? t('customer.home.selected') : t('customer.home.available')}
                  </span>
                </button>
              );
            })}
          </div>
          {state.customer.sedeId && (
            <button type="button" onClick={() => { dispatch({ type: 'customer', patch: { sedeId: null } }); setPickSede(false); }} className="mt-3 text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400">
              {t('customer.home.useNearest')}
            </button>
          )}
        </Modal>
      )}
    </div>
  );
}

function ItemSheet({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const t = useTranslations('demoDelivery');
  const money = useMoney();
  const { dispatch, notify } = useDelivery();
  const [choice, setChoice] = useState<string | null>(item.choice?.options[0].id ?? null);
  const [extras, setExtras] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const options = [...(choice ? [choice] : []), ...extras];
  const unit = unitPrice(item, options);
  const name = t(`menu.items.${item.id}.name`);

  return (
    <Modal
      scope="phone"
      title={name}
      onClose={onClose}
      footer={
        <div className="flex w-full items-center gap-2">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setQty((x) => Math.max(1, x - 1))} aria-label={t('common.less')} className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-700"><MinusIcon className="h-4 w-4" /></button>
            <span className="w-5 text-center text-sm font-bold">{qty}</span>
            <button type="button" onClick={() => setQty((x) => Math.min(20, x + 1))} aria-label={t('common.more')} className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-700"><PlusIcon className="h-4 w-4" /></button>
          </div>
          <Button
            className="flex-1"
            size="sm"
            onClick={() => {
              dispatch({ type: 'addToCart', itemId: item.id, options, qty });
              notify(t('customer.home.added', { item: name }));
              onClose();
            }}
          >
            {t('customer.item.add', { total: money(unit * qty) })}
          </Button>
        </div>
      }
    >
      <p className="text-xs text-secondary-500 dark:text-secondary-400">{t(`menu.items.${item.id}.desc`)}</p>
      <p className="mt-1 font-bold">{money(item.price)}</p>
      {item.choice && (
        <fieldset className="mt-3">
          <legend className="mb-1 text-xs font-semibold">{t(`menu.choices.${item.choice.id}`)} <span className="font-normal text-secondary-500">· {t('customer.item.required')}</span></legend>
          <div className="space-y-1">
            {item.choice.options.map((o) => (
              <label key={o.id} className="flex cursor-pointer items-center justify-between rounded-lg bg-secondary-50 px-3 py-2 text-xs dark:bg-secondary-800">
                <span className="flex items-center gap-2">
                  <input type="radio" name={`choice-${item.id}`} checked={choice === o.id} onChange={() => setChoice(o.id)} />
                  {t(`menu.options.${o.id}`)}
                </span>
                {o.delta > 0 && <span>+{money(o.delta)}</span>}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {item.extras && (
        <fieldset className="mt-3">
          <legend className="mb-1 text-xs font-semibold">{t('customer.item.extras')}</legend>
          <div className="space-y-1">
            {item.extras.map((o) => (
              <label key={o.id} className="flex cursor-pointer items-center justify-between rounded-lg bg-secondary-50 px-3 py-2 text-xs dark:bg-secondary-800">
                <span className="flex items-center gap-2">
                  <input type="checkbox" checked={extras.includes(o.id)} onChange={() => setExtras((x) => (x.includes(o.id) ? x.filter((y) => y !== o.id) : [...x, o.id]))} />
                  {t(`menu.options.${o.id}`)}
                </span>
                {o.delta > 0 && <span>+{money(o.delta)}</span>}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <p className="mt-3 text-[11px] text-secondary-500 dark:text-secondary-400">{t('customer.item.noteHint')}</p>
    </Modal>
  );
}
