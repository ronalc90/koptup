'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BuildingStorefrontIcon, TruckIcon, ArrowPathIcon, MapPinIcon, ClipboardDocumentListIcon, PlusIcon } from '@heroicons/react/24/outline';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { Product } from './products';
import { formatPrice, formatNumber } from './pricing';
import {
  CARRIERS, CITY_BY_ID, WAREHOUSES, TRACKING_STEPS, LAST_TRACKING_STEP, RETURN_REASONS, carrierQuote,
  type ReturnReason, type ReturnRequest,
} from './data';
import { orderAge } from './analytics';
import { useStore } from './store';
import { Modal, Toggle, useAgeLabel, SampleNote, FieldLabel, inputClass } from './ui';
import { GuideModal, OrderDetailModal } from './OrderModals';

const PAGE = 6;

export default function OperationsView() {
  const t = useTranslations('demoEcommerce2');
  const { state, clock, advanceTracking, toggleCarrier, resolveReturn, productById, productName, notify } = useStore();
  const ageLabel = useAgeLabel();
  const [shipId, setShipId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [dispatchLimit, setDispatchLimit] = useState(PAGE);
  const [trackLimit, setTrackLimit] = useState(PAGE);
  const [newReturn, setNewReturn] = useState(false);

  const byAgeDesc = (a: { ageMin?: number; createdAt?: number }, b: { ageMin?: number; createdAt?: number }) => orderAge(b, clock) - orderAge(a, clock);
  const toDispatch = useMemo(() => state.orders.filter((o) => o.status === 'preparing').sort(byAgeDesc), [state.orders, clock]); // eslint-disable-line react-hooks/exhaustive-deps
  const toConfirm = state.orders.filter((o) => o.status === 'new').length;
  const inTransit = useMemo(() => state.orders.filter((o) => o.status === 'shipped').sort((a, b) => orderAge(a, clock) - orderAge(b, clock)), [state.orders, clock]);

  const warehouses = WAREHOUSES.map((w) => {
    const units = state.products.reduce((s, p) => s + p.warehouses[w.id], 0);
    const pending = state.orders.filter((o) => (o.status === 'new' || o.status === 'preparing') && o.warehouse === w.id).length;
    const shipped = state.orders.filter((o) => o.status === 'shipped' && o.warehouse === w.id).length;
    return { ...w, units, pending, shipped, use: Math.min(100, Math.round((units / w.capacity) * 100)) };
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-white sm:text-3xl">{t('ops.title')}</h1>
        <p className="text-sm text-secondary-500">{t('ops.subtitle')}</p>
      </header>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-secondary-900 dark:text-white">
          <BuildingStorefrontIcon className="h-5 w-5 text-primary-600" />
          {t('ops.warehouses.title')}
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {warehouses.map((w) => (
            <Card key={w.id} variant="bordered" padding="md">
              <CardContent>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-secondary-900 dark:text-white">{t(`warehouses.${w.id}`)}</p>
                    <p className="text-xs text-secondary-500">{t('ops.warehouses.capacityOf', { n: formatNumber(w.capacity) })}</p>
                  </div>
                  <MapPinIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="mb-3">
                  <div className="mb-1 flex justify-between text-xs text-secondary-500">
                    <span>{t('ops.warehouses.occupancy', { n: formatNumber(w.units) })}</span>
                    <span className="font-semibold text-secondary-900 dark:text-white">{w.use} %</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary-200 dark:bg-secondary-700">
                    <div className={`h-full ${w.use > 85 ? 'bg-red-500' : w.use > 65 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${w.use}%` }} />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-500">{t('ops.warehouses.pendingOrders')}</span>
                  <span className="font-bold text-secondary-900 dark:text-white">{w.pending}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-500">{t('ops.warehouses.inTransit')}</span>
                  <span className="font-bold text-secondary-900 dark:text-white">{w.shipped}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card variant="bordered" padding="md">
        <CardContent>
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-secondary-900 dark:text-white">
              <ClipboardDocumentListIcon className="h-5 w-5 text-primary-600" />
              {t('ops.dispatch.title', { n: toDispatch.length })}
            </h2>
            <SampleNote>{t('ops.dispatch.hint', { n: toConfirm })}</SampleNote>
          </div>
          {toDispatch.length === 0 ? (
            <p className="py-6 text-center text-sm text-secondary-500">{t('ops.dispatch.empty')}</p>
          ) : (
            <ul className="divide-y divide-secondary-100 dark:divide-secondary-800">
              {toDispatch.slice(0, dispatchLimit).map((o) => (
                <li key={o.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <button type="button" onClick={() => setDetailId(o.id)} className="font-mono text-xs text-primary-600 hover:underline">{o.id}</button>
                    {o.demo && <Badge variant="primary" size="sm" className="ml-2">{t('vendor.orders.yours')}</Badge>}
                    <p className="text-sm text-secondary-900 dark:text-white">
                      {o.customer} · {CITY_BY_ID[o.cityId]?.name} · {t('ops.dispatch.units', { n: o.lines.reduce((s, l) => s + l.qty, 0) })}
                    </p>
                    <p className="text-xs text-secondary-500">{t('ops.dispatch.from', { warehouse: t(`warehouses.${o.warehouse}`) })} · {ageLabel(o)}</p>
                  </div>
                  <Button size="sm" onClick={() => setShipId(o.id)} className="flex shrink-0 items-center gap-1">
                    <TruckIcon className="h-4 w-4" /> {t('orderActions.ship')}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {toDispatch.length > dispatchLimit && (
            <div className="mt-2 text-center">
              <Button size="sm" variant="ghost" onClick={() => setDispatchLimit((l) => l + PAGE)}>{t('common.showMore', { n: toDispatch.length - dispatchLimit })}</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card variant="bordered" padding="md">
        <CardContent>
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-secondary-900 dark:text-white">
              <MapPinIcon className="h-5 w-5 text-primary-600" />
              {t('ops.tracking.title', { n: inTransit.length })}
            </h2>
            <SampleNote>{t('ops.tracking.hint')}</SampleNote>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {inTransit.slice(0, trackLimit).map((o) => {
              const step = o.trackingStep ?? 0;
              return (
                <div key={o.id} className={`rounded-lg border p-3 ${o.demo ? 'border-primary-300 dark:border-primary-700' : 'border-secondary-200 dark:border-secondary-700'}`}>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <button type="button" onClick={() => setDetailId(o.id)} className="font-mono text-xs text-primary-600 hover:underline">{o.id}</button>
                      <p className="truncate text-sm font-medium text-secondary-900 dark:text-white">{t(`carriers.${o.carrier}`)} · {o.guide}</p>
                    </div>
                    <Badge variant={step >= 3 ? 'warning' : 'info'} size="sm" className="whitespace-nowrap">{t(`tracking.${TRACKING_STEPS[step]}`)}</Badge>
                  </div>
                  <div className="mb-2 flex items-center gap-2 text-xs text-secondary-500">
                    <span>{t(`warehouses.${o.warehouse}`)}</span>
                    <span className="h-1 flex-1 overflow-hidden rounded-full bg-secondary-200 dark:bg-secondary-700">
                      <span className="block h-full bg-primary-600" style={{ width: `${(step / LAST_TRACKING_STEP) * 100}%` }} />
                    </span>
                    <span>{CITY_BY_ID[o.cityId]?.name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-secondary-500">{ageLabel(o)}</span>
                    <button
                      type="button"
                      className="text-xs font-semibold text-primary-600 hover:underline"
                      onClick={() => {
                        advanceTracking(o.id);
                        notify(step + 1 === LAST_TRACKING_STEP ? t('toasts.delivered', { order: o.id }) : t('toasts.trackingStep', { order: o.id, step: t(`tracking.${TRACKING_STEPS[step + 1]}`) }));
                      }}
                    >
                      {t('orderActions.track')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {inTransit.length === 0 && <p className="py-6 text-center text-sm text-secondary-500">{t('ops.tracking.empty')}</p>}
          {inTransit.length > trackLimit && (
            <div className="mt-2 text-center">
              <Button size="sm" variant="ghost" onClick={() => setTrackLimit((l) => l + PAGE)}>{t('common.showMore', { n: inTransit.length - trackLimit })}</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card variant="bordered" padding="md">
        <CardContent>
          <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-secondary-900 dark:text-white">
            <TruckIcon className="h-5 w-5 text-primary-600" />
            {t('ops.carriers.title')}
          </h2>
          <div className="mb-3"><SampleNote>{t('ops.carriers.hint')}</SampleNote></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-left text-secondary-500">
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <th className="py-2 pr-3">{t('ops.carriers.carrier')}</th>
                  <th className="py-2 pr-3">{t('ops.carriers.sla')}</th>
                  <th className="py-2 pr-3 text-right">{t('ops.carriers.cost')}</th>
                  <th className="py-2 pr-3">{t('ops.carriers.rating')}</th>
                  <th className="py-2 pr-3">{t('ops.carriers.enabled')}</th>
                </tr>
              </thead>
              <tbody>
                {CARRIERS.map((c) => {
                  const q = carrierQuote(c, CITY_BY_ID.bogota);
                  const label = t(`carriers.${c.id}`);
                  return (
                    <tr key={c.id} className="border-b border-secondary-100 dark:border-secondary-800">
                      <td className="py-3 pr-3 font-medium text-secondary-900 dark:text-white">{label}</td>
                      <td className="py-3 pr-3">{t('guide.days', { min: q.days[0], max: q.days[1] })}</td>
                      <td className="py-3 pr-3 text-right font-semibold">{formatPrice(q.cost)}</td>
                      <td className="py-3 pr-3">★ {c.rating.toString().replace('.', ',')}</td>
                      <td className="py-3 pr-3"><Toggle checked={state.carriers[c.id]} onChange={() => toggleCarrier(c.id)} label={t('ops.carriers.toggle', { carrier: label })} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card variant="bordered" padding="md">
        <CardContent>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-secondary-900 dark:text-white">
                <ArrowPathIcon className="h-5 w-5 text-primary-600" />
                {t('ops.returns.title')}
              </h2>
              <SampleNote>{t('ops.returns.hint')}</SampleNote>
            </div>
            <Button size="sm" variant="outline" onClick={() => setNewReturn(true)} className="flex shrink-0 items-center gap-1">
              <PlusIcon className="h-4 w-4" /> {t('ops.returns.create')}
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-secondary-500">
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <th className="py-2 pr-3">{t('ops.returns.id')}</th>
                  <th className="py-2 pr-3">{t('ops.returns.order')}</th>
                  <th className="py-2 pr-3">{t('ops.returns.product')}</th>
                  <th className="py-2 pr-3">{t('ops.returns.reason')}</th>
                  <th className="py-2 pr-3 text-right">{t('ops.returns.amount')}</th>
                  <th className="py-2 pr-3">{t('ops.returns.statusLabel')}</th>
                  <th className="py-2 pr-3">{t('ops.returns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {state.returns.map((r: ReturnRequest) => (
                  <tr key={r.id} className="border-b border-secondary-100 dark:border-secondary-800">
                    <td className="py-3 pr-3 font-mono text-xs">{r.id}</td>
                    <td className="py-3 pr-3"><button type="button" className="font-mono text-xs text-primary-600 hover:underline" onClick={() => setDetailId(r.orderId)}>{r.orderId}</button></td>
                    <td className="max-w-[200px] truncate py-3 pr-3">{productName(productById.get(r.productId))}</td>
                    <td className="py-3 pr-3">{t(`ops.returns.reasons.${r.reason}`)}</td>
                    <td className="py-3 pr-3 text-right">{formatPrice(r.amount)}</td>
                    <td className="py-3 pr-3">
                      <Badge variant={r.status === 'approved' ? 'success' : r.status === 'pending' ? 'warning' : 'danger'} size="sm">{t(`ops.returns.status.${r.status}`)}</Badge>
                      {r.status === 'approved' && <p className="mt-1 text-xs text-secondary-500">{r.restocked ? t('ops.returns.restocked') : t('ops.returns.toWarranty')}</p>}
                    </td>
                    <td className="py-3 pr-3">
                      {r.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button type="button" className="text-xs font-semibold text-green-700 hover:underline dark:text-green-400" onClick={() => { resolveReturn(r.id, true); notify(t('toasts.returnApproved', { id: r.id })); }}>{t('ops.returns.approve')}</button>
                          <button type="button" className="text-xs font-semibold text-red-600 hover:underline" onClick={() => { resolveReturn(r.id, false); notify(t('toasts.returnRejected', { id: r.id })); }}>{t('ops.returns.reject')}</button>
                        </div>
                      ) : (
                        <span className="text-xs text-secondary-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {shipId && <GuideModal orderId={shipId} onClose={() => setShipId(null)} />}
      {detailId && <OrderDetailModal orderId={detailId} onClose={() => setDetailId(null)} onShip={setShipId} />}
      {newReturn && <ReturnModal onClose={() => setNewReturn(false)} />}
    </div>
  );
}

function ReturnModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('demoEcommerce2');
  const { state, clock, addReturn, productById, productName, notify } = useStore();
  const delivered = useMemo(
    () => state.orders.filter((o) => o.status === 'delivered').sort((a, b) => orderAge(a, clock) - orderAge(b, clock)).slice(0, 40),
    [state.orders, clock],
  );
  const [orderId, setOrderId] = useState(delivered[0]?.id ?? '');
  const order = delivered.find((o) => o.id === orderId);
  const [productId, setProductId] = useState<number>(order?.lines[0]?.productId ?? 0);
  const [reason, setReason] = useState<ReturnReason>('retracto');
  const lineProducts = (order?.lines ?? []).map((l) => productById.get(l.productId)).filter((p): p is Product => !!p);
  const already = state.returns.some((r) => r.orderId === orderId && r.productId === productId);

  return (
    <Modal
      title={t('ops.returns.createTitle')}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            disabled={!order || !productId || already}
            onClick={() => {
              addReturn(orderId, productId, reason);
              notify(t('toasts.returnCreated', { order: orderId }));
              onClose();
            }}
          >
            {t('ops.returns.createConfirm')}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <FieldLabel htmlFor="rt-order" required>{t('ops.returns.order')}</FieldLabel>
          <select
            id="rt-order"
            value={orderId}
            onChange={(e) => {
              setOrderId(e.target.value);
              const o = delivered.find((x) => x.id === e.target.value);
              setProductId(o?.lines[0]?.productId ?? 0);
            }}
            className={inputClass}
          >
            {delivered.map((o) => (
              <option key={o.id} value={o.id}>{o.id} · {o.customer} · {formatPrice(o.total)}</option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="rt-product" required>{t('ops.returns.product')}</FieldLabel>
          <select id="rt-product" value={productId} onChange={(e) => setProductId(Number(e.target.value))} className={inputClass}>
            {lineProducts.map((p) => <option key={p.id} value={p.id}>{productName(p)}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="rt-reason" required>{t('ops.returns.reason')}</FieldLabel>
          <select id="rt-reason" value={reason} onChange={(e) => setReason(e.target.value as ReturnReason)} className={inputClass}>
            {RETURN_REASONS.map((r) => <option key={r} value={r}>{t(`ops.returns.reasons.${r}`)}</option>)}
          </select>
          <div className="mt-1"><SampleNote>{t(`ops.returns.reasonHelp.${reason}`)}</SampleNote></div>
        </div>
        {already && <p className="text-xs text-red-600">{t('ops.returns.already')}</p>}
      </div>
    </Modal>
  );
}
