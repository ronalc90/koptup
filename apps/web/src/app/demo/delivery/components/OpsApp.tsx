'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  TruckIcon, UserGroupIcon, ClockIcon, CheckBadgeIcon, ShoppingBagIcon, BanknotesIcon, ExclamationTriangleIcon, ShieldCheckIcon,
  ArrowPathIcon, ArrowDownTrayIcon, CloudIcon, ChartBarSquareIcon, EyeIcon,
} from '@heroicons/react/24/outline';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { BRAND, SEDES, SEDE_BY_ID, ZONES } from './data';
import {
  DEMO_DATE, GPS_FAR_M, BIG_CASH_LIMIT, RAIN_BONUS, RAIN_FEE, commissionSaved, computeKpis, driverLoad, driverPosition, fmtDate, fmtKm, fmtNum,
  fmtTime, isActive, isLate, opsAlerts, ordersByZone, stageTimes, suggestDrivers, toCsv, type OpsAlert,
} from './engine';
import type { Order } from './types';
import { Kpi, MapView, Modal, Row, StageBadge, useMoney, useMonths, type MapPoint } from './ui';
import { useDelivery, MAP_SPEEDUP } from './store';
import { AssignModal, DetailModal } from './OpsModals';

export default function OpsApp() {
  const t = useTranslations('demoDelivery');
  const locale = useLocale();
  const money = useMoney();
  const months = useMonths();
  const { state, dispatch, notify } = useDelivery();
  const [assigning, setAssigning] = useState<Order | null>(null);
  const [detail, setDetail] = useState<Order | null>(null);
  const [review, setReview] = useState<OpsAlert | null>(null);

  const k = computeKpis(state.orders);
  const online = state.drivers.filter((d) => d.online);
  const active = state.orders.filter(isActive).sort((a, b) => a.t.created - b.t.created);
  const alerts = opsAlerts(state.orders, state.now);
  const operational = alerts.filter((a) => !a.fraud);
  const fraud = alerts.filter((a) => a.fraud);
  const st = stageTimes(state.orders);
  const zones = ordersByZone(state.orders);
  const maxZone = Math.max(1, ...zones.map((z) => z.orders));
  const savings = commissionSaved(state.orders, state.savings.pct, state.savings.cost);
  const order = (id: string) => state.orders.find((o) => o.id === id);
  const driverName = (id?: string) => state.drivers.find((d) => d.id === id)?.name ?? '';

  const points: MapPoint[] = [
    ...SEDES.map((s) => ({ id: `s-${s.id}`, place: s.place, kind: 'sede' as const, label: t(`sedes.${s.id}`), muted: !state.sedeOpen[s.id] })),
    ...active.map((o) => ({ id: `o-${o.id}`, place: o.customer.place, kind: 'order' as const, label: o.id })),
    ...online.map((d) => ({ id: `d-${d.id}`, place: driverPosition(d, state.orders, SEDES, state.now, MAP_SPEEDUP), kind: 'driver' as const, label: d.name.split(' ')[0], pulse: driverLoad(d.id, state.orders) > 0 })),
  ];

  const exportCsv = () => {
    const rows: (string | number)[][] = [[
      t('ops.csv.order'), t('ops.csv.sede'), t('ops.csv.zone'), t('ops.csv.status'), t('ops.csv.created'), t('ops.csv.delivered'), t('ops.csv.minutes'),
      t('ops.csv.onTime'), t('ops.csv.subtotal'), t('ops.csv.fee'), t('ops.csv.tip'), t('ops.csv.total'), t('ops.csv.payment'), t('ops.csv.driver'), t('ops.csv.rating'),
    ]];
    state.orders.forEach((o) => {
      rows.push([
        o.id, t(`sedes.${o.sedeId}`), t(`zones.${o.customer.zone}`), t(`stage.${o.stage}`), fmtTime(o.t.created, locale),
        o.t.delivered ? fmtTime(o.t.delivered, locale) : '', o.t.delivered ? Math.round((o.t.delivered - o.t.created) / 60) : '',
        o.stage === 'delivered' ? (isLate(o, o.t.delivered ?? 0) ? t('common.no') : t('common.yes')) : '',
        o.pricing.subtotal, o.pricing.fee + o.pricing.rainFee, o.pricing.tip, o.pricing.total, t(`payments.${o.payment}.name`), driverName(o.driverId), o.rating?.stars ?? '',
      ]);
    });
    const blob = new Blob([`﻿${toCsv(rows)}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedidos-fogon-demo-${DEMO_DATE}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify(t('ops.csvToast', { n: state.orders.length }));
  };

  const alertText = (a: OpsAlert) => {
    const p = { ...a.params } as Record<string, string | number>;
    if (a.rule === 'bigCash') p.total = money(Number(p.total));
    return t(`ops.alerts.${a.rule}`, p);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card variant="bordered" className="lg:col-span-3">
        <CardContent>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <ChartBarSquareIcon className="h-5 w-5 text-primary-500" />
                {t('ops.title', { brand: BRAND })}
              </h2>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('ops.subtitle', { date: fmtDate(DEMO_DATE, months), time: fmtTime(state.now, locale) })}</p>
            </div>
            <Button size="sm" variant="outline" onClick={exportCsv}>
              <ArrowDownTrayIcon className="mr-1 h-4 w-4" />{t('ops.exportCsv')}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Kpi title={t('ops.kpis.orders')} value={String(k.orders)} hint={t('ops.kpis.ordersHint', { n: k.rejected })} icon={ShoppingBagIcon} color="text-primary-500" />
            <Kpi title={t('ops.kpis.active')} value={String(k.active)} icon={TruckIcon} color="text-orange-500" />
            <Kpi title={t('ops.kpis.drivers')} value={`${online.length}/${state.drivers.length}`} icon={UserGroupIcon} color="text-emerald-500" />
            <Kpi title={t('ops.kpis.avgDelivery')} value={`${k.avgDeliveryMin} ${t('common.min')}`} icon={ClockIcon} color="text-amber-500" />
            <Kpi title={t('ops.kpis.onTime')} value={`${k.onTimePct} %`} icon={CheckBadgeIcon} color="text-sky-500" />
            <Kpi title={t('ops.kpis.avgTicket')} value={money(k.avgTicket)} icon={BanknotesIcon} color="text-violet-500" />
          </div>
          <p className="mt-2 text-[11px] text-secondary-500 dark:text-secondary-400">{t('ops.kpis.note')}</p>
        </CardContent>
      </Card>

      <Card variant="bordered" className="lg:col-span-2">
        <CardContent>
          <h3 className="mb-3 text-sm font-semibold">{t('ops.mapTitle')}</h3>
          <MapView points={points} height="h-80" hint={t('common.mapHintOps')} zones={ZONES.map((z) => ({ id: z, label: t(`zones.${z}`) }))} fit={[...SEDES.map((s) => s.place), ...points.map((p) => p.place)]} />
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-secondary-600 dark:text-secondary-300">
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />{t('ops.legend.sede')}</span>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />{t('ops.legend.driver')}</span>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" />{t('ops.legend.order')}</span>
          </div>
        </CardContent>
      </Card>

      <Card variant="bordered">
        <CardContent>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />{t('ops.alertsTitle')} ({operational.length})
          </h3>
          {operational.length === 0 && <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('ops.noAlerts')}</p>}
          <ul className="space-y-2 text-xs">
            {operational.map((a) => {
              const o = order(a.orderIds[0]);
              if (!o) return null;
              return (
                <li key={a.id} className={`rounded-lg border px-3 py-2 ${a.severity === 'high' ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20' : 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'}`}>
                  <p className="font-medium">{alertText(a)}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {a.rule === 'noResponse' && (
                      <>
                        <Button size="sm" className="!px-2 !py-1 !text-xs" onClick={() => { dispatch({ type: 'accept', id: o.id, prepMin: 20, by: 'ops' }); notify(t('ops.acceptedByOps', { id: o.id })); }}>{t('ops.acceptForSede')}</Button>
                        <Button size="sm" variant="outline" className="!px-2 !py-1 !text-xs" onClick={() => { dispatch({ type: 'cancel', id: o.id, by: 'ops', reason: 'noResponse' }); notify(t('ops.cancelledToast', { id: o.id }), 'info'); }}>{t('ops.cancelOrder')}</Button>
                      </>
                    )}
                    {(a.rule === 'unassigned' || a.rule === 'driverRejected') && (
                      <Button size="sm" className="!px-2 !py-1 !text-xs" onClick={() => setAssigning(o)}>{t('ops.assign')}</Button>
                    )}
                    {a.rule === 'late' && (o.lateNotified ? (
                      <span className="text-secondary-500 dark:text-secondary-400">{t('ops.customerNotified')}</span>
                    ) : (
                      <Button size="sm" variant="outline" className="!px-2 !py-1 !text-xs" onClick={() => { dispatch({ type: 'notifyLate', id: o.id }); notify(t('ops.notifiedToast', { id: o.id })); }}>{t('ops.notifyCustomer')}</Button>
                    ))}
                    <Button size="sm" variant="ghost" className="!px-2 !py-1 !text-xs" onClick={() => setDetail(o)}>{t('ops.detail')}</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card variant="bordered" className="lg:col-span-2">
        <CardContent>
          <h3 className="mb-1 text-sm font-semibold">{t('ops.dispatchTitle')} ({active.length})</h3>
          <p className="mb-3 text-[11px] text-secondary-500 dark:text-secondary-400">{t('ops.dispatchHint')}</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="text-[10px] uppercase text-secondary-500 dark:text-secondary-400">
                <tr>
                  <th className="py-1 pr-2">{t('ops.table.order')}</th>
                  <th className="py-1 pr-2">{t('ops.table.sede')}</th>
                  <th className="py-1 pr-2">{t('ops.table.status')}</th>
                  <th className="py-1 pr-2">{t('ops.table.driver')}</th>
                  <th className="py-1 pr-2">{t('ops.table.promised')}</th>
                  <th className="py-1 text-right">{t('ops.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {active.map((o) => {
                  const late = isLate(o, state.now);
                  const canAssign = o.stage === 'preparing' || o.stage === 'ready';
                  return (
                    <tr key={o.id} className="border-t border-secondary-100 dark:border-secondary-800">
                      <td className="py-2 pr-2 font-semibold">
                        {o.id}
                        {o.own && <span className="ml-1 rounded bg-primary-600 px-1 text-[9px] text-white">{t('common.yours')}</span>}
                        <span className="block text-[10px] font-normal text-secondary-500 dark:text-secondary-400">{t(`zones.${o.customer.zone}`)} · {fmtTime(o.t.created, locale)}</span>
                      </td>
                      <td className="py-2 pr-2">{t(`sedes.${o.sedeId}`)}</td>
                      <td className="py-2 pr-2"><StageBadge stage={o.stage} /></td>
                      <td className="py-2 pr-2">
                        {o.driverId ? (
                          <>
                            {driverName(o.driverId)}
                            <span className="block text-[10px] text-secondary-500 dark:text-secondary-400">{o.driverStatus === 'offered' ? t('ops.offerSent') : t('ops.driverAccepted')}</span>
                          </>
                        ) : (
                          <span className="text-amber-700 dark:text-amber-300">{o.stage === 'pending' ? t('ops.waitingSede') : t('ops.noDriver')}</span>
                        )}
                      </td>
                      <td className={`py-2 pr-2 ${late ? 'font-semibold text-red-600' : ''}`}>
                        {o.promisedMin ? fmtTime(o.t.created + o.promisedMin * 60, locale) : '—'}
                        {late && <span className="block text-[10px]">{t('ops.lateBy', { min: Math.round((state.now - (o.t.created + (o.promisedMin ?? 0) * 60)) / 60) })}</span>}
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex justify-end gap-1">
                          {canAssign && (
                            <Button size="sm" variant="outline" className="!px-2 !py-1 !text-xs" onClick={() => setAssigning(o)}>
                              <ArrowPathIcon className="mr-1 h-3.5 w-3.5" />{o.driverId ? t('ops.reassign') : t('ops.assign')}
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="!px-2 !py-1 !text-xs" onClick={() => setDetail(o)} aria-label={t('ops.detailOf', { id: o.id })} title={t('ops.detailOf', { id: o.id })}>
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {active.length === 0 && <p className="py-4 text-center text-xs text-secondary-500 dark:text-secondary-400">{t('ops.noActive')}</p>}
          </div>
        </CardContent>
      </Card>

      <Card variant="bordered">
        <CardContent>
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold"><CloudIcon className="h-4 w-4 text-sky-500" />{t('ops.rain.title')}</h3>
          <p className="mb-3 text-[11px] text-secondary-500 dark:text-secondary-400">{t('ops.rain.hint')}</p>
          {(['surcharge', 'bonus'] as const).map((key) => (
            <label key={key} className="mb-2 flex cursor-pointer items-start gap-2 rounded-lg bg-secondary-50 p-2 text-xs dark:bg-secondary-900">
              <input type="checkbox" className="mt-0.5" checked={state.rain[key]} onChange={() => { dispatch({ type: 'rain', key }); notify(state.rain[key] ? t(`ops.rain.${key}Off`) : t(`ops.rain.${key}On`), 'info'); }} />
              <span>
                <span className="block font-semibold">{t(`ops.rain.${key}`, { amount: money(key === 'surcharge' ? RAIN_FEE : RAIN_BONUS) })}</span>
                <span className="text-secondary-500 dark:text-secondary-400">{t(`ops.rain.${key}Desc`)}</span>
              </span>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card variant="bordered" className="lg:col-span-2">
        <CardContent>
          <h3 className="mb-1 text-sm font-semibold">{t('ops.reports.title')}</h3>
          <p className="mb-3 text-[11px] text-secondary-500 dark:text-secondary-400">{t('ops.reports.hint', { n: st.samples })}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 text-xs">
              <p className="font-semibold">{t('ops.reports.stages')}</p>
              {(['accept', 'prep', 'waitPickup', 'ride'] as const).map((s) => {
                const total = st.accept + st.prep + st.waitPickup + st.ride || 1;
                return (
                  <div key={s}>
                    <div className="flex justify-between"><span>{t(`ops.reports.stage.${s}`)}</span><span className="font-semibold">{fmtNum(st[s], locale, 1)} {t('common.min')}</span></div>
                    <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-secondary-100 dark:bg-secondary-800">
                      <div className="h-full bg-primary-500" style={{ width: `${(st[s] / total) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="space-y-2 text-xs">
              <p className="font-semibold">{t('ops.reports.byZone')}</p>
              {zones.map((z) => (
                <div key={z.zone} className="flex items-center gap-2">
                  <span className="w-24 truncate">{t(`zones.${z.zone}`)}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary-100 dark:bg-secondary-800">
                    <div className="h-full bg-orange-500" style={{ width: `${(z.orders / maxZone) * 100}%` }} />
                  </div>
                  <span className="w-6 text-right font-semibold">{z.orders}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card variant="bordered">
        <CardContent>
          <h3 className="mb-1 text-sm font-semibold">{t('ops.savings.title')}</h3>
          <p className="mb-3 text-[11px] text-secondary-500 dark:text-secondary-400">{t('ops.savings.hint')}</p>
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
            <label className="block">
              <span className="mb-0.5 block text-secondary-600 dark:text-secondary-300">{t('ops.savings.pct')}</span>
              <input type="number" min={0} max={40} value={state.savings.pct} onChange={(e) => dispatch({ type: 'set', patch: { savings: { ...state.savings, pct: Math.min(40, Math.max(0, Number(e.target.value) || 0)) } } })} className="block w-full rounded-lg border border-secondary-300 bg-white px-2 py-1 dark:border-secondary-600 dark:bg-secondary-900" />
            </label>
            <label className="block">
              <span className="mb-0.5 block text-secondary-600 dark:text-secondary-300">{t('ops.savings.cost')}</span>
              <input type="number" min={0} step={500} value={state.savings.cost} onChange={(e) => dispatch({ type: 'set', patch: { savings: { ...state.savings, cost: Math.max(0, Number(e.target.value) || 0) } } })} className="block w-full rounded-lg border border-secondary-300 bg-white px-2 py-1 dark:border-secondary-600 dark:bg-secondary-900" />
            </label>
          </div>
          <div className="space-y-1 text-xs">
            <Row k={t('ops.savings.base', { n: savings.deliveries })} v={money(savings.base)} />
            <Row k={t('ops.savings.gross', { pct: state.savings.pct })} v={money(savings.gross)} />
            <Row k={t('ops.savings.ownCost')} v={`-${money(savings.ownCost)}`} />
            <Row k={t('ops.savings.fees')} v={`+${money(savings.feesCharged)}`} />
            <div className="border-t border-secondary-200 pt-1 dark:border-secondary-700">
              <Row k={t('ops.savings.net')} v={money(savings.net)} bold tone={savings.net >= 0 ? 'green' : undefined} />
            </div>
          </div>
          <p className="mt-2 text-[10px] text-secondary-500 dark:text-secondary-400">{t('ops.savings.note')}</p>
        </CardContent>
      </Card>

      <Card variant="bordered" className="lg:col-span-2">
        <CardContent>
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold"><ShieldCheckIcon className="h-4 w-4 text-rose-500" />{t('ops.review.title')}</h3>
          <p className="mb-3 text-[11px] text-secondary-500 dark:text-secondary-400">{t('ops.review.hint', { m: GPS_FAR_M, total: money(BIG_CASH_LIMIT) })}</p>
          <ul className="space-y-2 text-xs">
            {fraud.map((a) => {
              const res = state.reviews[a.id];
              return (
                <li key={a.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 ${res ? 'border-secondary-200 bg-secondary-50 dark:border-secondary-700 dark:bg-secondary-900' : 'border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/20'}`}>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{alertText(a)}</span>
                    <span className="text-[10px] text-secondary-500 dark:text-secondary-400">{t(`ops.review.rule.${a.rule}`)}</span>
                  </span>
                  {res ? (
                    <span className="rounded-full bg-secondary-200 px-2 py-0.5 text-[10px] font-semibold dark:bg-secondary-700">{t(`ops.review.resolved.${res}`)}</span>
                  ) : (
                    <Button size="sm" variant="outline" className="!px-2 !py-1 !text-xs" onClick={() => setReview(a)}>{t('ops.review.review')}</Button>
                  )}
                </li>
              );
            })}
          </ul>
          {state.blocked.length > 0 && (
            <div className="mt-3 rounded-lg bg-secondary-50 p-2 text-xs dark:bg-secondary-900">
              <p className="mb-1 font-semibold">{t('ops.review.blocked')}</p>
              <ul className="space-y-1">
                {state.blocked.map((acc) => {
                  const o = state.orders.find((x) => x.customer.id === acc);
                  const d = state.drivers.find((x) => x.id === acc);
                  return (
                    <li key={acc} className="flex items-center justify-between gap-2">
                      <span>{d ? `${d.name} · ${t('ops.drivers.suspended')}` : o ? `${o.customer.name} · ${o.customer.phone}` : acc}</span>
                      <button type="button" onClick={() => { dispatch({ type: 'unblock', account: acc }); notify(t('ops.review.unblockedToast'), 'info'); }} className="font-semibold text-primary-600 hover:underline dark:text-primary-400">{t('ops.review.unblock')}</button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card variant="bordered">
        <CardContent>
          <h3 className="mb-3 text-sm font-semibold">{t('ops.drivers.title')}</h3>
          <ul className="space-y-1.5 text-xs">
            {state.drivers.map((d) => {
              const load = driverLoad(d.id, state.orders);
              const done = state.orders.filter((o) => o.driverId === d.id && o.stage === 'delivered').length;
              return (
                <li key={d.id} className="flex items-center justify-between gap-2 rounded-lg bg-secondary-50 px-2 py-1.5 dark:bg-secondary-900">
                  <span className="min-w-0">
                    <span className="block font-semibold">{d.name}</span>
                    <span className="text-secondary-500 dark:text-secondary-400">
                      {t(`vehicle.${d.vehicle}`)} · {state.blocked.includes(d.id) ? t('ops.drivers.suspended') : !d.online ? t('ops.drivers.offline') : load ? t('ops.drivers.busy', { n: load }) : t('ops.drivers.free')} · {t('ops.drivers.done', { n: done })}
                    </span>
                  </span>
                  <button type="button" onClick={() => dispatch({ type: 'set', patch: { driverView: d.id, tab: 'driver' } })} className="shrink-0 font-semibold text-primary-600 hover:underline dark:text-primary-400">{t('ops.drivers.open')}</button>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {assigning && <AssignModal order={assigning} onClose={() => setAssigning(null)} />}
      {detail && <DetailModal order={state.orders.find((o) => o.id === detail.id) ?? detail} onClose={() => setDetail(null)} />}
      {review && (
        <Modal
          title={t('ops.review.modalTitle')}
          onClose={() => setReview(null)}
          footer={
            <>
              <Button size="sm" variant="outline" onClick={() => { dispatch({ type: 'resolve', alertId: review.id, resolution: 'dismissed', accounts: [] }); notify(t('ops.review.dismissedToast'), 'info'); setReview(null); }}>{t('ops.review.dismiss')}</Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  const accounts = review.rule === 'gpsFar' ? [order(review.orderIds[0])?.driverId ?? ''] : Array.from(new Set(review.orderIds.map((id) => order(id)?.customer.id ?? '')));
                  dispatch({ type: 'resolve', alertId: review.id, resolution: 'blocked', accounts: accounts.filter(Boolean) });
                  notify(t('ops.review.blockedToast'), 'warn');
                  setReview(null);
                }}
              >
                {review.rule === 'gpsFar' ? t('ops.review.suspendDriver') : t('ops.review.block')}
              </Button>
            </>
          }
        >
          <p className="mb-2 font-medium">{alertText(review)}</p>
          <p className="mb-2 text-xs text-secondary-600 dark:text-secondary-300">{t(`ops.review.explain.${review.rule}`)}</p>
          <ul className="space-y-1 text-xs">
            {review.orderIds.map((id) => {
              const o = order(id);
              if (!o) return null;
              return (
                <li key={id} className="rounded-lg bg-secondary-50 px-2 py-1.5 dark:bg-secondary-800">
                  <span className="font-semibold">{o.id}</span> · {o.customer.name} · {o.customer.phone} · {money(o.pricing.total)} · {t(`payments.${o.payment}.name`)}
                  {o.pod && <span className="block text-secondary-500">{t('ops.review.podInfo', { m: o.pod.distanceM, driver: driverName(o.driverId) })}</span>}
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[10px] text-secondary-500 dark:text-secondary-400">{t('ops.review.note')}</p>
        </Modal>
      )}
    </div>
  );
}
