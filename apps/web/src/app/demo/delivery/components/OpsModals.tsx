'use client';

import { useLocale, useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import { SEDES, SEDE_BY_ID } from './data';
import { fmtKm, fmtTime, suggestDrivers } from './engine';
import type { Order } from './types';
import { Modal, Row, StageBadge, useMoney } from './ui';
import { useDelivery } from './store';

export function AssignModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const t = useTranslations('demoDelivery');
  const locale = useLocale();
  const { state, dispatch, notify } = useDelivery();
  const options = suggestDrivers(order, state.drivers, state.orders, SEDES).filter((o) => !state.blocked.includes(o.driver.id));
  const offline = state.drivers.length - options.length;
  return (
    <Modal title={t('ops.assignTitle', { id: order.id, sede: t(`sedes.${order.sedeId}`) })} onClose={onClose}>
      <p className="mb-2 text-xs text-secondary-600 dark:text-secondary-300">{t('ops.assignHint')}</p>
      {options.length === 0 && <p className="text-xs text-amber-700">{t('ops.noDrivers')}</p>}
      <ul className="space-y-1.5">
        {options.map((o, i) => {
          const current = order.driverId === o.driver.id;
          return (
            <li key={o.driver.id} className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs ${i === 0 ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-secondary-200 dark:border-secondary-700'}`}>
              <span className="min-w-0">
                <span className="block font-semibold">
                  {o.driver.name}
                  {i === 0 && <span className="ml-1 rounded bg-emerald-600 px-1 text-[9px] text-white">{t('ops.suggested')}</span>}
                </span>
                <span className="text-secondary-500 dark:text-secondary-400">
                  {t(`vehicle.${o.driver.vehicle}`)} · {fmtKm(o.kmToSede, locale)} · ~{o.minToSede} {t('common.min')} · {o.load ? t('ops.drivers.busy', { n: o.load }) : t('ops.drivers.free')}
                </span>
              </span>
              {current ? (
                <span className="shrink-0 text-[11px] font-semibold text-secondary-500">{t('ops.current')}</span>
              ) : (
                <Button
                  size="sm"
                  className="shrink-0 !px-2 !py-1 !text-xs"
                  onClick={() => {
                    dispatch({ type: 'assign', id: order.id, driverId: o.driver.id });
                    notify(t('ops.assignedToast', { id: order.id, driver: o.driver.name }));
                    onClose();
                  }}
                >
                  {t('ops.assign')}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {offline > 0 && <p className="mt-2 text-[11px] text-secondary-500 dark:text-secondary-400">{t('ops.offlineCount', { n: offline })}</p>}
    </Modal>
  );
}

export function DetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const t = useTranslations('demoDelivery');
  const locale = useLocale();
  const money = useMoney();
  const { state } = useDelivery();
  const driver = state.drivers.find((d) => d.id === order.driverId);
  const steps: [string, number | undefined][] = [
    ['created', order.t.created], ['accepted', order.t.accepted], ['ready', order.t.ready], ['assigned', order.t.assigned], ['pickedUp', order.t.pickedUp], ['delivered', order.t.delivered],
  ];
  return (
    <Modal title={t('ops.detailTitle', { id: order.id })} onClose={onClose}>
      <div className="space-y-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <StageBadge stage={order.stage} />
          <span>{t(`sedes.${order.sedeId}`)} · {SEDE_BY_ID[order.sedeId].address}</span>
        </div>
        <div>
          <p className="font-semibold">{order.customer.name} · {order.customer.phone}</p>
          <p className="text-secondary-500 dark:text-secondary-400">{order.customer.address} · {t(`zones.${order.customer.zone}`)}</p>
        </div>
        <div className="space-y-0.5">
          {order.lines.map((l) => <Row key={l.key} k={`${l.qty} × ${t(`menu.items.${l.itemId}.name`)}`} v={money(l.unit * l.qty)} />)}
          <Row k={t('customer.cart.total')} v={`${money(order.pricing.total)} · ${t(`payments.${order.payment}.name`)}`} bold />
        </div>
        <div>
          <p className="mb-1 font-semibold">{t('ops.timeline')}</p>
          <ol className="space-y-0.5">
            {steps.filter(([, v]) => v !== undefined).map(([k, v]) => (
              <li key={k} className="flex justify-between"><span>{t(`ops.events.${k}`)}</span><span>{fmtTime(v!, locale)}</span></li>
            ))}
          </ol>
        </div>
        <p>{t('ops.detailDriver', { driver: driver?.name ?? t('ops.noDriver') })} · {t('ops.detailCode', { code: order.code })}</p>
        {order.rejectReason && <p className="text-red-600">{t('ops.rejectReason', { reason: t(`reasons.reject.${order.rejectReason}`) })}</p>}
        {order.rating && <p>{t('ops.detailRating', { stars: order.rating.stars })}</p>}
      </div>
    </Modal>
  );
}
