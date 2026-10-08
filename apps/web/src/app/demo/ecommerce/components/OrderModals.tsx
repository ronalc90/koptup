'use client';

// Detalle de pedido, generación de guía (simulada) y acción siguiente de un
// pedido. Los usan el panel de la tienda y la vista de logística.

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatPrice } from './pricing';
import { CARRIERS, CITY_BY_ID, TRACKING_STEPS, LAST_TRACKING_STEP, carrierQuote, type CarrierId, type Order } from './data';
import { useStore } from './store';
import { Modal, StatusBadge, useAgeLabel, SampleNote } from './ui';

/** Botón con la siguiente acción del flujo del pedido. */
export function OrderAction({ order, onShip }: { order: Order; onShip: (id: string) => void }) {
  const t = useTranslations('demoEcommerce2');
  const { advanceOrder, advanceTracking, notify } = useStore();
  if (order.status === 'new') {
    return (
      <button type="button" className="whitespace-nowrap text-xs font-semibold text-primary-600 hover:underline" onClick={() => { advanceOrder(order.id); notify(t('toasts.toPreparing', { order: order.id })); }}>
        {t('orderActions.prepare')}
      </button>
    );
  }
  if (order.status === 'preparing') {
    return (
      <button type="button" className="whitespace-nowrap text-xs font-semibold text-primary-600 hover:underline" onClick={() => onShip(order.id)}>
        {t('orderActions.ship')}
      </button>
    );
  }
  if (order.status === 'shipped') {
    return (
      <button
        type="button"
        className="whitespace-nowrap text-xs font-semibold text-primary-600 hover:underline"
        title={t(`tracking.${TRACKING_STEPS[order.trackingStep ?? 0]}`)}
        onClick={() => {
          const next = Math.min(LAST_TRACKING_STEP, (order.trackingStep ?? 0) + 1);
          advanceTracking(order.id);
          notify(t('toasts.trackingStep', { order: order.id, step: t(`tracking.${TRACKING_STEPS[next]}`) }));
        }}
      >
        {t('orderActions.track')}
      </button>
    );
  }
  return <span className="text-xs text-secondary-400">—</span>;
}

export function GuideModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const t = useTranslations('demoEcommerce2');
  const { state, shipOrder, notify } = useStore();
  const order = state.orders.find((o) => o.id === orderId);
  const enabled = CARRIERS.filter((c) => state.carriers[c.id]);
  const [carrier, setCarrier] = useState<CarrierId>(enabled[0]?.id ?? 'coordinadora');
  if (!order) return null;
  const city = CITY_BY_ID[order.cityId];

  function confirm() {
    shipOrder(order!.id, carrier);
    notify(t('toasts.guideCreated', { order: order!.id, carrier: t(`carriers.${carrier}`) }), { label: t('toasts.seeTracking'), view: 'operations' });
    onClose();
  }

  return (
    <Modal
      title={t('guide.title', { order: order.id })}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={confirm}>{t('guide.confirm')}</Button>
        </>
      }
    >
      <p className="mb-3 text-sm text-secondary-600 dark:text-secondary-300">
        {t('guide.destination', { city: city?.name ?? '', department: city?.department ?? '', warehouse: t(`warehouses.${order.warehouse}`) })}
      </p>
      <div className="space-y-2" role="radiogroup" aria-label={t('guide.carrier')}>
        {enabled.map((c) => {
          const q = city ? carrierQuote(c, city) : { cost: c.base, days: [1, 3] as [number, number] };
          return (
            <label key={c.id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border-2 p-3 ${carrier === c.id ? 'border-primary-600 bg-primary-50 dark:bg-primary-950/40' : 'border-secondary-200 dark:border-secondary-700'}`}>
              <span className="flex items-center gap-2">
                <input type="radio" name="carrier" checked={carrier === c.id} onChange={() => setCarrier(c.id)} />
                <span className="font-medium text-secondary-900 dark:text-white">{t(`carriers.${c.id}`)}</span>
              </span>
              <span className="text-right text-sm text-secondary-600 dark:text-secondary-300">
                {formatPrice(q.cost)} · {t('guide.days', { min: q.days[0], max: q.days[1] })}
              </span>
            </label>
          );
        })}
      </div>
      <div className="mt-3">
        <SampleNote>{t('guide.simulatedNote')}</SampleNote>
      </div>
    </Modal>
  );
}

export function OrderDetailModal({ orderId, onClose, onShip }: { orderId: string; onClose: () => void; onShip: (id: string) => void }) {
  const t = useTranslations('demoEcommerce2');
  const { state, productById, productName } = useStore();
  const ageLabel = useAgeLabel();
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return null;
  const city = CITY_BY_ID[order.cityId];
  return (
    <Modal title={t('orderDetail.title', { order: order.id })} onClose={onClose} footer={<Button variant="outline" onClick={onClose}>{t('common.close')}</Button>}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={order.status} />
        {order.demo && <Badge variant="primary" size="sm">{t('vendor.orders.yours')}</Badge>}
        <span className="text-xs text-secondary-500">{ageLabel(order)}</span>
      </div>
      <div className="mb-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <Info label={t('orderDetail.customer')} value={order.company ? `${order.company} (${order.customer})` : order.customer} />
        <Info label={t('orderDetail.city')} value={city ? `${city.name}, ${city.department}` : order.cityId} />
        {order.address && <Info label={t('orderDetail.address')} value={order.address} />}
        {order.email && <Info label={t('orderDetail.email')} value={order.email} />}
        {order.docNumber && <Info label={t('orderDetail.document')} value={`${order.docType} ${order.docNumber}`} />}
        <Info label={t('orderDetail.payment')} value={`${t(`paymentMethods.${order.method}`)} · ${order.paid ? t('orderDetail.paid') : t('orderDetail.unpaid')}`} />
        <Info label={t('orderDetail.warehouse')} value={t(`warehouses.${order.warehouse}`)} />
        {order.guide && <Info label={t('orderDetail.guide')} value={`${t(`carriers.${order.carrier}`)} · ${order.guide}`} />}
      </div>
      <table className="mb-4 w-full text-sm">
        <thead className="text-left text-secondary-500">
          <tr className="border-b border-secondary-200 dark:border-secondary-700">
            <th className="py-1 pr-2">{t('orderDetail.product')}</th>
            <th className="py-1 pr-2 text-right">{t('orderDetail.qty')}</th>
            <th className="py-1 text-right">{t('orderDetail.amount')}</th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map((l) => (
            <tr key={l.productId} className="border-b border-secondary-100 dark:border-secondary-800">
              <td className="py-1.5 pr-2">{productName(productById.get(l.productId))}</td>
              <td className="py-1.5 pr-2 text-right">{l.qty}</td>
              <td className="py-1.5 text-right">{formatPrice(l.unitPrice * l.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ml-auto max-w-xs space-y-1 text-sm">
        <Line label={t('checkout.summary.subtotal', { n: order.lines.reduce((s, l) => s + l.qty, 0) })} value={formatPrice(order.subtotal)} />
        {order.discount > 0 && <Line label={t('checkout.summary.discount')} value={`-${formatPrice(order.discount)}`} />}
        <Line label={t('checkout.summary.shipping')} value={order.shipping ? formatPrice(order.shipping) : t('checkout.summary.free')} />
        <Line label={t('checkout.summary.total')} value={formatPrice(order.total)} bold />
      </div>
      {order.status === 'shipped' || order.status === 'delivered' ? (
        <ol className="mt-4 space-y-1 text-sm">
          {TRACKING_STEPS.map((s, i) => (
            <li key={s} className={i <= (order.trackingStep ?? 0) ? 'font-medium text-secondary-900 dark:text-white' : 'text-secondary-400'}>
              {i <= (order.trackingStep ?? 0) ? '●' : '○'} {t(`tracking.${s}`)}
            </li>
          ))}
        </ol>
      ) : null}
      {order.status !== 'delivered' && order.status !== 'cancelled' && (
        <div className="mt-4 flex justify-end">
          <OrderAction order={order} onShip={(id) => { onClose(); onShip(id); }} />
        </div>
      )}
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-secondary-500">{label}</p>
      <p className="font-medium text-secondary-900 dark:text-white">{value}</p>
    </div>
  );
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${bold ? 'font-bold text-secondary-900 dark:text-white' : 'text-secondary-600 dark:text-secondary-300'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
