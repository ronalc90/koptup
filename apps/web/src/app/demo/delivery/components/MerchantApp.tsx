'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  ChartBarSquareIcon, ShoppingBagIcon, ClockIcon, BanknotesIcon, ExclamationTriangleIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { BRAND, MENU, SEDES } from './data';
import { ACCEPT_WINDOW_S, computeKpis, fmtHour, fmtNum, fmtTime, salesByHour, topItems } from './engine';
import type { Order, SedeId } from './types';
import { Kpi, Modal, PhoneFrame, Stars, useMoney } from './ui';
import { useDelivery } from './store';

const PREP_OPTIONS = [15, 20, 30];
export const REJECT_REASONS = ['soldOut', 'busy', 'outOfArea', 'closing'] as const;

export default function MerchantApp() {
  const t = useTranslations('demoDelivery');
  const locale = useLocale();
  const money = useMoney();
  const { state, dispatch, notify } = useDelivery();
  const sedeId = state.merchantSede;
  const [prep, setPrep] = useState<Record<string, number>>({});
  const [rejecting, setRejecting] = useState<Order | null>(null);
  const [reason, setReason] = useState<(typeof REJECT_REASONS)[number]>('soldOut');

  const mine = state.orders.filter((o) => o.sedeId === sedeId);
  const pending = mine.filter((o) => o.stage === 'pending').sort((a, b) => a.t.created - b.t.created);
  const preparing = mine.filter((o) => o.stage === 'preparing');
  const ready = mine.filter((o) => o.stage === 'ready');
  const k = computeKpis(mine);
  const hours = salesByHour(mine, 11, 20);
  const maxHour = Math.max(1, ...hours.map((h) => h.sales));
  const top = topItems(mine, 3);
  const reviews = mine.filter((o) => o.rating).sort((a, b) => (b.t.delivered ?? 0) - (a.t.delivered ?? 0)).slice(0, 3);
  const open = state.sedeOpen[sedeId];
  const soldOut = state.soldOut[sedeId];

  const driverName = (o: Order) => state.drivers.find((d) => d.id === o.driverId)?.name ?? '';

  const overlay = rejecting ? (
    <Modal
      scope="phone"
      title={t('merchant.rejectTitle', { id: rejecting.id })}
      onClose={() => setRejecting(null)}
      footer={
        <>
          <Button size="sm" variant="outline" onClick={() => setRejecting(null)}>{t('common.cancel')}</Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              dispatch({ type: 'reject', id: rejecting.id, reason });
              notify(t('merchant.rejectedToast', { id: rejecting.id }), 'info');
              setRejecting(null);
            }}
          >
            {t('merchant.reject')}
          </Button>
        </>
      }
    >
      <p className="mb-2 text-xs text-secondary-600 dark:text-secondary-300">{t('merchant.rejectHint')}</p>
      <div className="space-y-1" role="radiogroup">
        {REJECT_REASONS.map((r) => (
          <label key={r} className="flex cursor-pointer items-center gap-2 rounded-lg bg-secondary-50 px-3 py-2 text-xs dark:bg-secondary-800">
            <input type="radio" name="reject-reason" checked={reason === r} onChange={() => setReason(r)} />
            <span className="first-letter:uppercase">{t(`reasons.reject.${r}`)}</span>
          </label>
        ))}
      </div>
    </Modal>
  ) : null;

  return (
    <PhoneFrame label={t('tabs.merchant')} overlay={overlay}>
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold">{BRAND}</h2>
            <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('merchant.subtitle')}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={open}
            onClick={() => {
              dispatch({ type: 'sedeOpen', sede: sedeId });
              notify(open ? t('merchant.closedToast', { sede: t(`sedes.${sedeId}`) }) : t('merchant.openedToast', { sede: t(`sedes.${sedeId}`) }), 'info');
            }}
            className={`flex shrink-0 items-center gap-2 rounded-full px-2 py-1 text-[11px] font-semibold ${open ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-secondary-200 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-200'}`}
          >
            <span className={`relative h-4 w-7 rounded-full transition ${open ? 'bg-emerald-500' : 'bg-secondary-400'}`}>
              <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${open ? 'left-3.5' : 'left-0.5'}`} />
            </span>
            {open ? t('merchant.open') : t('merchant.closed')}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1 rounded-xl bg-secondary-200 p-1 dark:bg-secondary-800" role="tablist" aria-label={t('merchant.sedePicker')}>
          {SEDES.map((s) => {
            const n = state.orders.filter((o) => o.sedeId === s.id && o.stage === 'pending').length;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={sedeId === s.id}
                onClick={() => dispatch({ type: 'set', patch: { merchantSede: s.id as SedeId } })}
                className={`relative rounded-lg px-1 py-1.5 text-[11px] font-semibold ${sedeId === s.id ? 'bg-white text-secondary-900 shadow dark:bg-secondary-900 dark:text-white' : 'text-secondary-600 dark:text-secondary-300'}`}
              >
                {t(`sedes.${s.id}`).replace(/^Sede\s/, '')}
                {n > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] text-white">{n}</span>}
              </button>
            );
          })}
        </div>

        {!open && <p className="rounded-lg bg-secondary-200 px-3 py-2 text-xs dark:bg-secondary-800">{t('merchant.closedNote')}</p>}

        <div className="grid grid-cols-2 gap-2">
          <Kpi title={t('merchant.kpis.sales')} value={money(k.sales)} icon={BanknotesIcon} color="text-emerald-500" />
          <Kpi title={t('merchant.kpis.orders')} value={String(k.orders)} hint={t('merchant.kpis.rejected', { n: k.rejected })} icon={ShoppingBagIcon} color="text-primary-500" />
          <Kpi title={t('merchant.kpis.avgTicket')} value={money(k.avgTicket)} icon={ChartBarSquareIcon} color="text-sky-500" />
          <Kpi title={t('merchant.kpis.peak')} value={k.peakHour === null ? '—' : fmtHour(k.peakHour, locale)} icon={ClockIcon} color="text-amber-500" />
        </div>
        <p className="-mt-2 text-[10px] text-secondary-500 dark:text-secondary-400">{t('merchant.kpis.note')}</p>

        <section aria-label={t('merchant.incoming')}>
          <h3 className="mb-2 text-sm font-semibold">{t('merchant.incoming')} ({pending.length})</h3>
          {pending.length === 0 && <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('merchant.noIncoming')}</p>}
          <div className="space-y-2">
            {pending.map((o) => {
              const left = Math.max(0, ACCEPT_WINDOW_S - (state.now - o.t.created));
              const p = prep[o.id] ?? 15;
              return (
                <div key={o.id} className={`rounded-lg border p-2 text-xs ${left === 0 ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20' : 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{o.id}{o.own && <span className="ml-1 rounded bg-primary-600 px-1 text-[9px] text-white">{t('common.yours')}</span>}</span>
                    {left > 0 ? (
                      <span className="rounded-full bg-amber-200 px-2 py-0.5 font-semibold text-amber-900 dark:bg-amber-800 dark:text-amber-100">{t('merchant.respondIn', { s: left })}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-200 px-2 py-0.5 font-semibold text-red-900 dark:bg-red-800 dark:text-red-100">
                        <ExclamationTriangleIcon className="h-3 w-3" />{t('merchant.escalated')}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-secondary-700 dark:text-secondary-200">{o.lines.map((l) => `${l.qty}× ${t(`menu.items.${l.itemId}.name`)}${l.options.length ? ` (${l.options.map((x) => t(`menu.options.${x}`)).join(', ')})` : ''}`).join(' · ')}</p>
                  {o.note && <p className="mt-0.5 font-medium text-orange-700 dark:text-orange-300">{t('merchant.note', { note: o.note })}</p>}
                  <p className="mt-0.5 text-secondary-500 dark:text-secondary-400">{o.customer.name} · {money(o.pricing.total)} · {t(`payments.${o.payment}.name`)}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <label className="sr-only" htmlFor={`prep-${o.id}`}>{t('merchant.prepTime')}</label>
                    <select id={`prep-${o.id}`} value={p} onChange={(e) => setPrep((x) => ({ ...x, [o.id]: parseInt(e.target.value, 10) }))} className="rounded-lg border border-secondary-300 bg-white px-1 py-1 text-[11px] dark:border-secondary-600 dark:bg-secondary-900">
                      {PREP_OPTIONS.map((m) => <option key={m} value={m}>{t('merchant.prepOption', { min: m })}</option>)}
                    </select>
                    <Button size="sm" variant="outline" className="flex-1 !px-2" onClick={() => { setReason('soldOut'); setRejecting(o); }}>{t('merchant.reject')}</Button>
                    <Button size="sm" className="flex-1 !px-2" onClick={() => { dispatch({ type: 'accept', id: o.id, prepMin: p }); notify(t('merchant.acceptedToast', { id: o.id, min: p })); }}>{t('merchant.accept')}</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section aria-label={t('merchant.preparing')}>
          <h3 className="mb-2 text-sm font-semibold">{t('merchant.preparing')} ({preparing.length})</h3>
          {preparing.length === 0 && <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('merchant.none')}</p>}
          <div className="space-y-2">
            {preparing.map((o) => {
              const elapsed = Math.floor((state.now - (o.t.accepted ?? o.t.created)) / 60);
              const late = elapsed > (o.prepMin ?? 15);
              return (
                <div key={o.id} className="rounded-lg border border-secondary-200 bg-white p-2 text-xs dark:border-secondary-700 dark:bg-secondary-800">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{o.id}{o.own && <span className="ml-1 rounded bg-primary-600 px-1 text-[9px] text-white">{t('common.yours')}</span>}</span>
                    <span className={late ? 'font-semibold text-red-600' : 'text-secondary-500 dark:text-secondary-400'}>{t('merchant.prepProgress', { elapsed, min: o.prepMin ?? 15 })}</span>
                  </div>
                  <p className="mt-0.5 text-secondary-500 dark:text-secondary-400">
                    {o.driverId ? (o.driverStatus === 'accepted' ? t('merchant.driverComing', { driver: driverName(o) }) : t('merchant.driverOffered', { driver: driverName(o) })) : t('merchant.noDriver')}
                  </p>
                  <Button size="sm" fullWidth className="mt-2" onClick={() => { dispatch({ type: 'ready', id: o.id }); notify(t('merchant.readyToast', { id: o.id })); }}>
                    <CheckCircleIcon className="mr-1 h-4 w-4" />{t('merchant.markReady')}
                  </Button>
                </div>
              );
            })}
          </div>
        </section>

        <section aria-label={t('merchant.ready')}>
          <h3 className="mb-2 text-sm font-semibold">{t('merchant.ready')} ({ready.length})</h3>
          {ready.length === 0 && <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('merchant.none')}</p>}
          <ul className="space-y-1 text-xs">
            {ready.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2 rounded-lg bg-violet-50 px-2 py-1.5 dark:bg-violet-900/20">
                <span className="font-semibold">{o.id}</span>
                <span className="truncate text-secondary-600 dark:text-secondary-300">{o.driverId ? t('merchant.waitingDriver', { driver: driverName(o) }) : t('merchant.noDriver')}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label={t('merchant.menuTitle')} className="rounded-xl border border-secondary-200 bg-white p-3 dark:border-secondary-700 dark:bg-secondary-800">
          <h3 className="text-sm font-semibold">{t('merchant.menuTitle')}</h3>
          <p className="mb-2 text-[11px] text-secondary-500 dark:text-secondary-400">{t('merchant.menuHint')}</p>
          <div className="space-y-1">
            {MENU.map((m) => {
              const out = soldOut.includes(m.id);
              return (
                <div key={m.id} className="flex items-center justify-between gap-2 rounded-lg bg-secondary-50 px-2 py-1.5 text-xs dark:bg-secondary-900">
                  <span className="min-w-0">
                    <span className={`block truncate font-semibold ${out ? 'text-secondary-400 line-through' : ''}`}>{t(`menu.items.${m.id}.name`)}</span>
                    <span className="text-secondary-500 dark:text-secondary-400">{out ? t('merchant.soldOut') : money(m.price)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      dispatch({ type: 'soldOut', sede: sedeId, itemId: m.id });
                      notify(out ? t('merchant.availableToast', { item: t(`menu.items.${m.id}.name`) }) : t('merchant.soldOutToast', { item: t(`menu.items.${m.id}.name`) }), 'info');
                    }}
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${out ? 'bg-emerald-600' : 'bg-red-500'}`}
                  >
                    {out ? t('merchant.makeAvailable') : t('merchant.markSoldOut')}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section aria-label={t('merchant.analytics')} className="rounded-xl border border-secondary-200 bg-white p-3 dark:border-secondary-700 dark:bg-secondary-800">
          <h3 className="mb-2 text-sm font-semibold">{t('merchant.analytics')}</h3>
          <p className="mb-1 text-xs text-secondary-500 dark:text-secondary-400">{t('merchant.topItems')}</p>
          <div className="space-y-1">
            {top.map((s) => (
              <div key={s.itemId} className="flex items-center gap-2 text-xs">
                <span className="w-28 truncate">{t(`menu.items.${s.itemId}.name`)}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary-100 dark:bg-secondary-700">
                  <div className="h-full bg-orange-500" style={{ width: `${(s.qty / Math.max(1, top[0]?.qty ?? 1)) * 100}%` }} />
                </div>
                <span className="w-6 text-right font-semibold">{s.qty}</span>
              </div>
            ))}
          </div>
          <p className="mb-1 mt-3 text-xs text-secondary-500 dark:text-secondary-400">{t('merchant.salesByHour')}</p>
          <div className="flex h-20 items-end gap-1" role="img" aria-label={t('merchant.salesByHour')}>
            {hours.map((h) => (
              <div key={h.hour} className="flex h-full flex-1 flex-col justify-end" title={`${fmtHour(h.hour, locale)} · ${money(h.sales)} · ${h.orders}`}>
                <div className="rounded-t bg-gradient-to-t from-orange-500 to-red-400" style={{ height: `${(h.sales / maxHour) * 100}%`, minHeight: h.sales ? 2 : 0 }} />
              </div>
            ))}
          </div>
          <div className="mt-0.5 flex justify-between text-[9px] text-secondary-500 dark:text-secondary-400">
            <span>{fmtHour(11, locale)}</span>
            <span>{fmtHour(20, locale)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span>{t('merchant.rating', { n: k.ratings })}</span>
            <span className="inline-flex items-center gap-1 font-bold text-amber-500">
              <Stars value={Math.round(k.avgRating)} size="h-3 w-3" /> {k.ratings ? fmtNum(k.avgRating, locale, 1) : '—'}
            </span>
          </div>
          {reviews.length > 0 && (
            <ul className="mt-2 space-y-1 text-[11px] text-secondary-600 dark:text-secondary-300">
              {reviews.map((o) => (
                <li key={o.id}>
                  <span className="font-semibold">{o.rating!.stars}★</span> · {o.rating!.comment ?? (o.rating!.commentKey ? t(`ratingComments.${o.rating!.commentKey}`) : '')} <span className="text-secondary-400">({o.id} · {fmtTime(o.t.delivered ?? o.t.created, locale)})</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PhoneFrame>
  );
}
