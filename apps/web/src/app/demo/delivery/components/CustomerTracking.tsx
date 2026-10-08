'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  ChatBubbleLeftEllipsisIcon, PhoneIcon, PaperAirplaneIcon, ClipboardDocumentIcon, ShieldCheckIcon, InformationCircleIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { BRAND, SEDES, SEDE_BY_ID } from './data';
import { ACCEPT_WINDOW_S, avg, driverPosition, fmtNum, fmtTime, km, pointsEarned, travelMin } from './engine';
import type { Order } from './types';
import { MapView, Modal, Row, StageBadge, Stars, useMoney, type MapPoint, type MapRoute } from './ui';
import { useDelivery, MAP_SPEEDUP } from './store';
import { Header } from './CustomerCart';

const STEPS = ['pending', 'preparing', 'ready', 'pickedUp', 'delivered'] as const;

function useOrder(): Order | undefined {
  const { state } = useDelivery();
  const own = state.orders.filter((o) => o.own);
  return own.find((o) => o.id === state.customer.activeOrderId) ?? own[own.length - 1];
}

export function trackingText(t: ReturnType<typeof useTranslations>, o: Order, locale: string): string {
  return t('customer.tracking.whatsapp.message', {
    brand: BRAND,
    id: o.id,
    time: fmtTime(o.t.created + (o.promisedMin ?? 40) * 60, locale),
    code: o.code,
    link: `tu-dominio.com/seguimiento/${o.id}`,
  });
}

export function CustomerTracking() {
  const t = useTranslations('demoDelivery');
  const locale = useLocale();
  const money = useMoney();
  const { state, dispatch, notify } = useDelivery();
  const order = useOrder();
  const [call, setCall] = useState(false);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const home = () => dispatch({ type: 'customer', patch: { view: 'home' } });

  if (!order) {
    return (
      <div className="space-y-4 p-4">
        <Header title={t('customer.tracking.noOrderTitle')} onBack={home} backLabel={t('common.back')} />
        <p className="py-10 text-center text-sm text-secondary-500 dark:text-secondary-400">{t('customer.tracking.noOrder')}</p>
        <Button fullWidth onClick={home}>{t('customer.cart.goMenu')}</Button>
      </div>
    );
  }

  const sede = SEDE_BY_ID[order.sedeId];
  const driver = state.drivers.find((d) => d.id === order.driverId);
  const accepted = order.driverStatus === 'accepted' && driver;
  const stepIdx = STEPS.indexOf(order.stage as (typeof STEPS)[number]);
  const left = Math.max(0, ACCEPT_WINDOW_S - (state.now - order.t.created));
  const ride = travelMin(km(sede.place, order.customer.place), driver?.vehicle);
  const eta = order.stage === 'pickedUp' && order.t.pickedUp ? order.t.pickedUp + ride * 60 : order.promisedMin ? order.t.created + order.promisedMin * 60 : null;
  const driverRating = driver ? avg(state.orders.filter((o) => o.driverId === driver.id && o.rating).map((o) => o.rating!.stars)) : 0;
  const live = order.stage === 'preparing' || order.stage === 'ready' || order.stage === 'pickedUp';

  const points: MapPoint[] = [
    { id: 'sede', place: sede.place, kind: 'sede', label: t(`sedes.${sede.id}`) },
    { id: 'me', place: order.customer.place, kind: 'customer', label: t('customer.tracking.you') },
  ];
  const routes: MapRoute[] = [{ id: 'r2', from: sede.place, to: order.customer.place, color: '#0ea5e9', dashed: order.stage !== 'pickedUp' }];
  if (accepted && live) {
    const pos = driverPosition(driver, state.orders, SEDES, state.now, MAP_SPEEDUP);
    points.push({ id: 'drv', place: pos, kind: 'driver', label: driver.name.split(' ')[0], pulse: true });
    if (order.stage !== 'pickedUp') routes.push({ id: 'r1', from: pos, to: sede.place, color: '#10b981', dashed: true });
  }

  const copy = () => {
    const text = trackingText(t, order, locale);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => notify(t('common.copied')), () => notify(t('common.copyFailed'), 'warn'));
    } else notify(t('common.copyFailed'), 'warn');
  };

  return (
    <div className="space-y-3 p-4">
      <Header title={t('customer.tracking.title', { id: order.id })} onBack={home} backLabel={t('common.back')} right={<StageBadge stage={order.stage} />} />

      <div className="rounded-xl border border-secondary-200 bg-white p-3 dark:border-secondary-700 dark:bg-secondary-800">
        <p className="text-sm font-bold">{t(`customer.tracking.headline.${order.stage}`)}</p>
        <p className="mt-0.5 text-xs text-secondary-600 dark:text-secondary-300">
          {order.stage === 'pending' && (left > 0 ? t('customer.tracking.sub.pending', { s: left }) : t('customer.tracking.sub.pendingLate'))}
          {order.stage === 'preparing' && t('customer.tracking.sub.preparing', { min: order.prepMin ?? 15, sede: t(`sedes.${sede.id}`) })}
          {order.stage === 'ready' && (accepted ? t('customer.tracking.sub.readyDriver', { driver: driver.name }) : t('customer.tracking.sub.readyNoDriver'))}
          {order.stage === 'pickedUp' && t('customer.tracking.sub.pickedUp', { driver: driver?.name ?? '' })}
          {order.stage === 'delivered' && t('customer.tracking.sub.delivered', { time: fmtTime(order.t.delivered ?? state.now, locale), min: Math.max(1, Math.round(((order.t.delivered ?? state.now) - order.t.created) / 60)) })}
          {order.stage === 'rejected' && t('customer.tracking.sub.rejected', { reason: t(`reasons.reject.${order.rejectReason ?? 'busy'}`) })}
          {order.stage === 'cancelled' && t('customer.tracking.sub.cancelled')}
        </p>
        {stepIdx >= 0 && (
          <div className="mt-3 flex items-center gap-1" aria-hidden="true">
            {STEPS.map((s, i) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= stepIdx ? 'bg-primary-600' : 'bg-secondary-200 dark:bg-secondary-700'}`} />
            ))}
          </div>
        )}
        {eta && live && (
          <div className="mt-3 flex items-center justify-between gap-2 text-xs">
            <span>
              <span className="block text-secondary-500 dark:text-secondary-400">{t('customer.tracking.eta')}</span>
              <span className="text-lg font-bold">{fmtTime(eta, locale)}</span>
              {order.promisedMin && order.stage === 'pickedUp' && <span className="block text-[10px] text-secondary-500 dark:text-secondary-400">{t('customer.tracking.promised', { time: fmtTime(order.t.created + order.promisedMin * 60, locale) })}</span>}
            </span>
            <span className="rounded-lg bg-amber-50 px-2 py-1 text-right dark:bg-amber-900/30">
              <span className="block text-[10px] text-amber-800 dark:text-amber-200">{t('customer.tracking.code')}</span>
              <span className="font-mono text-lg font-bold tracking-widest">{order.code}</span>
            </span>
          </div>
        )}
        {order.stage === 'pending' && (
          <div className="mt-3 space-y-2">
            <p className="flex items-start gap-1.5 rounded-lg bg-sky-50 p-2 text-[11px] text-sky-900 dark:bg-sky-900/30 dark:text-sky-100">
              <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {t('customer.tracking.demoHint')}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" fullWidth onClick={() => dispatch({ type: 'set', patch: { tab: 'merchant', merchantSede: order.sedeId } })}>{t('customer.tracking.goMerchant')}</Button>
              <Button size="sm" variant="danger" fullWidth onClick={() => { dispatch({ type: 'cancel', id: order.id, by: 'customer', reason: 'customer' }); notify(t('customer.tracking.cancelledToast', { id: order.id }), 'info'); }}>
                {t('customer.tracking.cancel')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {(live || order.stage === 'pending') && (
        <MapView points={points} routes={routes} fit={points.map((p) => p.place)} hint={t('common.mapHint')} />
      )}

      {order.driverId && driver && order.driverStatus === 'offered' && live && (
        <p className="rounded-lg bg-secondary-100 px-3 py-2 text-xs dark:bg-secondary-800">{t('customer.tracking.offered', { driver: driver.name })}</p>
      )}

      {accepted && live && (
        <div className="flex items-center gap-3 rounded-xl border border-secondary-200 bg-white p-3 dark:border-secondary-700 dark:bg-secondary-800">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 font-bold text-white">{driver.name[0]}</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{driver.name}</div>
            <div className="flex flex-wrap items-center gap-1 text-[11px] text-secondary-500 dark:text-secondary-400">
              {driverRating > 0 && <><Stars value={Math.round(driverRating)} size="h-3 w-3" /> {fmtNum(driverRating, locale, 1)} ·{' '}</>}
              {t(`vehicle.${driver.vehicle}`)}{driver.plate && ` · ${driver.plate}`}
            </div>
          </div>
          <button type="button" onClick={() => dispatch({ type: 'customer', patch: { view: 'chat' } })} aria-label={t('customer.tracking.chat')} title={t('customer.tracking.chat')} className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-white">
            <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
            {order.chat.some((m) => m.from !== 'customer') && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500" />}
          </button>
          <button type="button" onClick={() => setCall(true)} aria-label={t('customer.tracking.call')} title={t('customer.tracking.call')} className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white">
            <PhoneIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {order.stage !== 'pending' && order.stage !== 'rejected' && order.stage !== 'cancelled' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs dark:border-emerald-800 dark:bg-emerald-900/20">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="font-semibold text-emerald-900 dark:text-emerald-100">{t('customer.tracking.whatsapp.title')}</span>
            <button type="button" onClick={copy} className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:underline dark:text-emerald-200">
              <ClipboardDocumentIcon className="h-3.5 w-3.5" />{t('common.copy')}
            </button>
          </div>
          <p className="whitespace-pre-line rounded-lg bg-white p-2 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-100">{trackingText(t, order, locale)}</p>
          <p className="mt-1 text-[10px] text-emerald-900/80 dark:text-emerald-200/80">{t('customer.tracking.whatsapp.note')}</p>
        </div>
      )}

      {order.stage === 'delivered' && (
        <div className="rounded-xl border border-secondary-200 bg-white p-3 text-xs dark:border-secondary-700 dark:bg-secondary-800">
          {order.rating ? (
            <div className="space-y-1">
              <p className="font-semibold">{t('customer.tracking.rated')}</p>
              <Stars value={order.rating.stars} />
              <p className="text-secondary-500 dark:text-secondary-400">{t('customer.tracking.pointsEarned', { n: pointsEarned(order.pricing.subtotal), balance: fmtNum(state.customer.points, locale) })}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-semibold">{t('customer.tracking.rateTitle')}</p>
              <Stars value={stars} onChange={setStars} size="h-6 w-6" label={t('customer.tracking.rateTitle')} />
              <textarea
                value={comment}
                maxLength={140}
                rows={2}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('customer.tracking.ratePlaceholder')}
                className="block w-full resize-none rounded-lg border border-secondary-300 bg-white px-2 py-1.5 dark:border-secondary-600 dark:bg-secondary-900"
              />
              <Button size="sm" fullWidth onClick={() => { dispatch({ type: 'rate', id: order.id, stars, comment }); notify(t('customer.tracking.thanks')); }}>
                {t('customer.tracking.sendRating')}
              </Button>
            </div>
          )}
        </div>
      )}

      <details className="rounded-xl border border-secondary-200 bg-white p-3 text-xs dark:border-secondary-700 dark:bg-secondary-800">
        <summary className="cursor-pointer font-semibold">{t('customer.tracking.summary', { total: money(order.pricing.total) })}</summary>
        <div className="mt-2 space-y-1">
          {order.lines.map((l) => (
            <Row key={l.key} k={`${l.qty} × ${t(`menu.items.${l.itemId}.name`)}${l.options.length ? ` (${l.options.map((o) => t(`menu.options.${o}`)).join(', ')})` : ''}`} v={money(l.unit * l.qty)} />
          ))}
          {order.note && <p className="text-secondary-500 dark:text-secondary-400">{t('customer.tracking.note', { note: order.note })}</p>}
          <Row k={t('customer.cart.deliveryFee')} v={money(order.pricing.fee)} />
          {order.pricing.rainFee > 0 && <Row k={t('customer.cart.rainFee')} v={money(order.pricing.rainFee)} />}
          {order.pricing.discount > 0 && <Row k={t('customer.cart.pointsDiscount')} v={`-${money(order.pricing.discount)}`} tone="green" />}
          <Row k={t('customer.cart.tip')} v={money(order.pricing.tip)} />
          <Row k={t('customer.cart.total')} v={money(order.pricing.total)} bold />
          <p className="text-secondary-500 dark:text-secondary-400">{t(`payments.${order.payment}.name`)} · {order.customer.address}</p>
        </div>
      </details>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" fullWidth onClick={home}>{t('customer.tracking.keepShopping')}</Button>
        <Button size="sm" variant="ghost" fullWidth onClick={() => dispatch({ type: 'customer', patch: { view: 'orders' } })}>{t('customer.tracking.myOrders')}</Button>
      </div>

      {call && driver && <MaskedCall name={driver.name} onClose={() => setCall(false)} />}
    </div>
  );
}

export function MaskedCall({ name, onClose }: { name: string; onClose: () => void }) {
  const t = useTranslations('demoDelivery');
  return (
    <Modal scope="phone" title={t('call.title')} onClose={onClose} footer={<Button size="sm" onClick={onClose}>{t('common.understood')}</Button>}>
      <div className="flex flex-col items-center gap-2 py-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
          <ShieldCheckIcon className="h-7 w-7" />
        </div>
        <p className="font-semibold">{t('call.connecting', { name })}</p>
        <p className="font-mono text-xs text-secondary-500">+57 601 ••• •• 42</p>
        <p className="text-xs text-secondary-600 dark:text-secondary-300">{t('call.body')}</p>
      </div>
    </Modal>
  );
}

export function ChatThread({ order, me }: { order: Order; me: 'customer' | 'driver' }) {
  const t = useTranslations('demoDelivery');
  const locale = useLocale();
  if (!order.chat.length) return <p className="py-6 text-center text-xs text-secondary-500 dark:text-secondary-400">{t('chat.empty')}</p>;
  return (
    <div className="space-y-2">
      {order.chat.map((m, i) => {
        const text = m.key ? t(`chat.quick.${m.key}`) : m.text;
        if (m.from === 'ops') {
          return (
            <p key={i} className="mx-auto max-w-[90%] rounded-lg bg-amber-50 px-2 py-1 text-center text-[11px] text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">
              {t('chat.fromOps')}: {text} · {fmtTime(m.at, locale)}
            </p>
          );
        }
        const mine = m.from === me;
        return (
          <div key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[78%] rounded-2xl px-3 py-1.5 text-sm ${mine ? 'rounded-br-sm bg-primary-600 text-white' : 'rounded-bl-sm bg-secondary-200 text-secondary-900 dark:bg-secondary-700 dark:text-white'}`}>
              {text}
              <span className={`block text-right text-[9px] ${mine ? 'text-white/70' : 'text-secondary-500 dark:text-secondary-400'}`}>{fmtTime(m.at, locale)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ChatComposer({ order, from, quick }: { order: Order; from: 'customer' | 'driver'; quick: string[] }) {
  const t = useTranslations('demoDelivery');
  const { dispatch } = useDelivery();
  const [text, setText] = useState('');
  const send = () => {
    const v = text.trim();
    if (!v) return;
    dispatch({ type: 'chat', id: order.id, msg: { from, text: v.slice(0, 200) } });
    setText('');
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {quick.map((k) => (
          <button key={k} type="button" onClick={() => dispatch({ type: 'chat', id: order.id, msg: { from, key: k } })} className="rounded-full bg-secondary-100 px-2.5 py-1 text-xs text-secondary-700 dark:bg-secondary-800 dark:text-secondary-200">
            {t(`chat.quick.${k}`)}
          </button>
        ))}
      </div>
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('chat.placeholder')}
          aria-label={t('chat.placeholder')}
          maxLength={200}
          className="block w-full min-w-0 rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm dark:border-secondary-600 dark:bg-secondary-800"
        />
        <Button size="sm" type="submit" aria-label={t('chat.send')} title={t('chat.send')} disabled={!text.trim()}>
          <PaperAirplaneIcon className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

export function CustomerChat() {
  const t = useTranslations('demoDelivery');
  const { state, dispatch } = useDelivery();
  const order = useOrder();
  const back = () => dispatch({ type: 'customer', patch: { view: 'tracking' } });
  const driver = order ? state.drivers.find((d) => d.id === order.driverId) : undefined;
  const canChat = order && driver && order.driverStatus === 'accepted' && (order.stage === 'preparing' || order.stage === 'ready' || order.stage === 'pickedUp');
  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b border-secondary-200 p-3 dark:border-secondary-700">
        <Header title={t('chat.title', { name: driver?.name ?? t('chat.driver') })} onBack={back} backLabel={t('common.back')} />
      </div>
      <div className="flex-1 p-3">{order ? <ChatThread order={order} me="customer" /> : null}</div>
      <div className="border-t border-secondary-200 p-3 dark:border-secondary-700">
        {canChat ? (
          <>
            <ChatComposer order={order} from="customer" quick={['comingDown', 'ringBell', 'leaveReception']} />
            <p className="mt-2 text-[10px] text-secondary-500 dark:text-secondary-400">{t('chat.customerNote')}</p>
          </>
        ) : (
          <p className="text-center text-xs text-secondary-500 dark:text-secondary-400">{t('chat.closed')}</p>
        )}
      </div>
    </div>
  );
}
