'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  MapPinIcon, ChatBubbleLeftEllipsisIcon, PhoneIcon, CheckBadgeIcon, ArrowPathIcon, BanknotesIcon, InformationCircleIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { SEDES, SEDE_BY_ID } from './data';
import { DRIVER_BASE_PAY, DRIVER_PAY_PER_KM, driverPay, fmtKm, fmtNum, isActive, km, navSteps, planRoute, streetName, travelMin, type NavStep } from './engine';
import type { Order } from './types';
import { Modal, PhoneFrame, Stars, useMoney } from './ui';
import { useDelivery } from './store';
import { ChatComposer, ChatThread, MaskedCall } from './CustomerTracking';
import ProofOfDelivery from './ProofOfDelivery';
import DriverDocs from './DriverDocs';

export const DRIVER_REJECT_REASONS = ['tooFar', 'noSpace', 'finishing'] as const;

export function useNavText() {
  const t = useTranslations('demoDelivery.nav');
  const locale = useLocale();
  return (s: NavStep, address: string) => {
    if (s.kind === 'arrive') return t('arrive', { address });
    const street = streetName(s.street, s.num);
    const heading = t(`heading.${s.heading}`);
    const dist = fmtKm(s.km ?? 0, locale);
    if (s.kind === 'turn') return t('turn', { dir: t(`dir.${s.turn}`), street, heading, km: dist });
    if (s.untilStreet) return t('followUntil', { street, heading, km: dist, until: streetName(s.untilStreet, s.untilNum ?? 0) });
    return t('follow', { street, heading, km: dist });
  };
}

export default function DriverApp() {
  const t = useTranslations('demoDelivery');
  const locale = useLocale();
  const money = useMoney();
  const navText = useNavText();
  const { state, dispatch, notify } = useDelivery();
  const driver = state.drivers.find((d) => d.id === state.driverView) ?? state.drivers[0];
  const [rejecting, setRejecting] = useState<Order | null>(null);
  const [reason, setReason] = useState<(typeof DRIVER_REJECT_REASONS)[number]>('tooFar');
  const [pod, setPod] = useState<Order | null>(null);
  const [call, setCall] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [navIdx, setNavIdx] = useState(0);

  const mine = state.orders.filter((o) => o.driverId === driver.id);
  const offers = mine.filter((o) => o.driverStatus === 'offered' && isActive(o));
  const active = mine.filter((o) => o.driverStatus === 'accepted' && isActive(o));
  const delivered = mine.filter((o) => o.stage === 'delivered');
  const earnings = delivered.reduce((a, o) => a + driverPay(o, SEDES), 0);
  const tips = delivered.reduce((a, o) => a + o.pricing.tip, 0);
  const rated = delivered.filter((o) => o.rating).sort((a, b) => (b.t.delivered ?? 0) - (a.t.delivered ?? 0));
  const avgRating = rated.length ? rated.reduce((a, o) => a + o.rating!.stars, 0) / rated.length : 0;

  const route = planRoute(
    driver.place,
    active.map((o) => ({
      orderId: o.id,
      pickup: SEDE_BY_ID[o.sedeId].place,
      pickupLabel: t(`sedes.${o.sedeId}`),
      dropoff: o.customer.place,
      dropoffLabel: o.customer.address,
      picked: o.stage === 'pickedUp',
    })),
  );
  const next = route.stops[0];
  const current = next ? active.find((o) => o.id === next.orderId) : undefined;
  const from = next?.kind === 'dropoff' && current ? SEDE_BY_ID[current.sedeId].place : driver.place;
  const steps = next ? navSteps(from, next.place) : [];
  const step = Math.min(navIdx, Math.max(0, steps.length - 1));

  const toggleOnline = () => {
    if (driver.online && mine.some(isActive)) return notify(t('driver.cantGoOffline'), 'warn');
    dispatch({ type: 'driverOnline', driverId: driver.id });
    notify(driver.online ? t('driver.offlineToast') : t('driver.onlineToast'), 'info');
  };

  let overlay = null;
  if (rejecting) {
    overlay = (
      <ModalReject
        order={rejecting}
        reason={reason}
        setReason={setReason}
        onClose={() => setRejecting(null)}
        onConfirm={() => {
          dispatch({ type: 'driverReject', id: rejecting.id, reason });
          notify(t('driver.rejectedToast', { id: rejecting.id }), 'info');
          setRejecting(null);
        }}
      />
    );
  } else if (pod) {
    overlay = <ProofOfDelivery order={pod} onClose={() => setPod(null)} />;
  } else if (call && current) {
    overlay = <MaskedCall name={current.customer.name} onClose={() => setCall(false)} />;
  }

  return (
    <PhoneFrame label={t('tabs.driver')} overlay={overlay}>
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold">{t('driver.hello', { name: driver.name.split(' ')[0] })}</h2>
            <p className="text-xs text-secondary-500 dark:text-secondary-400">
              {t(`vehicle.${driver.vehicle}`)}{driver.plate && ` · ${driver.plate}`} · {driver.online ? t('driver.online') : t('driver.offline')}
            </p>
          </div>
          <button type="button" role="switch" aria-checked={driver.online} aria-label={t('driver.onlineSwitch')} title={t('driver.onlineSwitch')} onClick={toggleOnline} className={`relative h-7 w-14 shrink-0 rounded-full transition ${driver.online ? 'bg-emerald-500' : 'bg-secondary-400'}`}>
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${driver.online ? 'left-7' : 'left-0.5'}`} />
          </button>
        </div>

        <label className="block text-xs">
          <span className="mb-0.5 block text-secondary-500 dark:text-secondary-400">{t('driver.viewAs')}</span>
          <select
            value={driver.id}
            onChange={(e) => { dispatch({ type: 'set', patch: { driverView: e.target.value } }); setNavIdx(0); setChatOpen(false); }}
            className="block w-full rounded-lg border border-secondary-300 bg-white px-2 py-1.5 dark:border-secondary-600 dark:bg-secondary-800"
          >
            {state.drivers.map((d) => {
              const offersN = state.orders.filter((o) => o.driverId === d.id && o.driverStatus === 'offered' && isActive(o)).length;
              return (
                <option key={d.id} value={d.id}>
                  {d.name} · {d.online ? t('driver.online') : t('driver.offline')}{offersN ? ` · ${t('driver.offersN', { n: offersN })}` : ''}
                </option>
              );
            })}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-secondary-200 bg-white p-3 dark:border-secondary-700 dark:bg-secondary-800">
            <p className="text-[10px] uppercase text-secondary-500 dark:text-secondary-400">{t('driver.earningsToday')}</p>
            <p className="text-lg font-bold">{money(earnings)}</p>
            <p className="text-[10px] text-secondary-500 dark:text-secondary-400">{t('driver.trips', { n: delivered.length })} · {t('driver.tips', { tips: money(tips) })}</p>
          </div>
          <div className="rounded-xl border border-secondary-200 bg-white p-3 dark:border-secondary-700 dark:bg-secondary-800">
            <p className="text-[10px] uppercase text-secondary-500 dark:text-secondary-400">{t('driver.ratingTitle')}</p>
            <p className="text-lg font-bold">{rated.length ? fmtNum(avgRating, locale, 1) : '—'}</p>
            <p className="text-[10px] text-secondary-500 dark:text-secondary-400">{t('driver.ratingsN', { n: rated.length })}</p>
          </div>
        </div>
        <p className="-mt-2 text-[10px] text-secondary-500 dark:text-secondary-400">{t('driver.payRule', { base: money(DRIVER_BASE_PAY), perKm: money(DRIVER_PAY_PER_KM) })}</p>

        {!driver.online && <p className="rounded-lg bg-secondary-200 px-3 py-2 text-xs dark:bg-secondary-800">{t('driver.offlineNote')}</p>}

        <section aria-label={t('driver.offers')}>
          <h3 className="mb-2 text-sm font-semibold">{t('driver.offers')} ({offers.length})</h3>
          {offers.length === 0 && <p className="text-xs text-secondary-500 dark:text-secondary-400">{driver.online ? t('driver.noOffers') : t('driver.offlineNoOffers')}</p>}
          <div className="space-y-2">
            {offers.map((o) => {
              const sede = SEDE_BY_ID[o.sedeId];
              const toSede = km(driver.place, sede.place);
              const ride = km(sede.place, o.customer.place);
              return (
                <div key={o.id} className="rounded-xl border-2 border-primary-400 bg-primary-50 p-3 text-xs dark:bg-primary-900/20">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">{o.id}{o.own && <span className="ml-1 rounded bg-primary-600 px-1 text-[9px] text-white">{t('common.yours')}</span>}</span>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{money(driverPay(o, SEDES))}</span>
                  </div>
                  <p className="mt-1">{t('driver.pickupAt', { sede: t(`sedes.${o.sedeId}`), address: sede.address })} · {fmtKm(toSede, locale)}</p>
                  <p>{t('driver.deliverTo', { zone: t(`zones.${o.customer.zone}`) })} · {fmtKm(ride, locale)} · ~{travelMin(ride, driver.vehicle)} {t('common.min')}</p>
                  {o.driverBonus > 0 && <p className="font-semibold text-sky-700 dark:text-sky-300">{t('driver.rainBonus', { bonus: money(o.driverBonus) })}</p>}
                  <p className="text-secondary-500 dark:text-secondary-400">{t('driver.payBreakdown', { tip: money(o.pricing.tip) })}</p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" fullWidth onClick={() => { setReason('tooFar'); setRejecting(o); }}>{t('driver.reject')}</Button>
                    <Button size="sm" fullWidth disabled={!driver.online} onClick={() => { dispatch({ type: 'driverAccept', id: o.id }); setNavIdx(0); notify(t('driver.acceptedToast', { id: o.id })); }}>{t('driver.accept')}</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {active.length > 0 && next && current && (
          <section aria-label={t('driver.currentTask')} className="space-y-3 rounded-xl border border-secondary-200 bg-white p-3 text-xs dark:border-secondary-700 dark:bg-secondary-800">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{t('driver.currentTask')}</h3>
              <span className="font-semibold">{current.id}</span>
            </div>
            {next.kind === 'pickup' ? (
              <>
                <p className="flex items-start gap-1"><MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />{t('driver.goToSede', { sede: t(`sedes.${current.sedeId}`), address: SEDE_BY_ID[current.sedeId].address })}</p>
                {current.stage === 'ready' ? (
                  <Button size="sm" fullWidth onClick={() => { dispatch({ type: 'pickup', id: current.id }); setNavIdx(0); notify(t('driver.pickedToast', { id: current.id })); }}>{t('driver.pickup')}</Button>
                ) : (
                  <p className="rounded-lg bg-secondary-100 px-2 py-1.5 dark:bg-secondary-900">
                    {t('driver.waitingSede', { min: Math.max(0, (current.prepMin ?? 15) - Math.floor((state.now - (current.t.accepted ?? current.t.created)) / 60)) })}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="flex items-start gap-1"><MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />{t('driver.deliverAt', { name: current.customer.name, address: current.customer.address })}</p>
                <p className="flex items-start gap-1 rounded-lg bg-amber-50 px-2 py-1.5 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">
                  <BanknotesIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  {current.payment === 'cash'
                    ? current.cashWith
                      ? t('driver.collectCashChange', { total: money(current.pricing.total), with: money(current.cashWith), change: money(current.cashWith - current.pricing.total) })
                      : t('driver.collectCash', { total: money(current.pricing.total) })
                    : current.payment === 'dataphone'
                      ? t('driver.collectDataphone', { total: money(current.pricing.total) })
                      : t('driver.prepaid', { method: t(`payments.${current.payment}.name`) })}
                </p>
                {current.note && <p className="text-orange-700 dark:text-orange-300">{t('merchant.note', { note: current.note })}</p>}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" fullWidth onClick={() => setChatOpen((v) => !v)}>
                    <ChatBubbleLeftEllipsisIcon className="mr-1 h-4 w-4" />{t('driver.chat')}{current.chat.some((m) => m.from === 'customer') && ' •'}
                  </Button>
                  <Button size="sm" variant="outline" fullWidth onClick={() => setCall(true)}>
                    <PhoneIcon className="mr-1 h-4 w-4" />{t('driver.call')}
                  </Button>
                </div>
                <Button size="sm" fullWidth onClick={() => setPod(current)}>
                  <CheckBadgeIcon className="mr-1 h-4 w-4" />{t('driver.confirmDelivery')}
                </Button>
              </>
            )}

            {chatOpen && next.kind === 'dropoff' && (
              <div className="space-y-2 rounded-lg border border-secondary-200 p-2 dark:border-secondary-700">
                <ChatThread order={current} me="driver" />
                <ChatComposer order={current} from="driver" quick={['onMyWay', 'atDoor', 'cantFind']} />
              </div>
            )}

            <div className="rounded-lg bg-secondary-50 p-2 dark:bg-secondary-900">
              <p className="mb-1 font-semibold">{t('driver.navigation')}</p>
              <ol className="space-y-1">
                {steps.map((s, i) => (
                  <li key={i} className={`rounded px-1.5 py-1 ${i === step ? 'bg-primary-100 font-semibold dark:bg-primary-900/40' : ''}`}>
                    {i + 1}. {navText(s, next.label)}
                  </li>
                ))}
              </ol>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-[10px] text-secondary-500 dark:text-secondary-400">{t('driver.navNote')}</span>
                <button type="button" onClick={() => setNavIdx((x) => (x + 1) % Math.max(1, steps.length))} className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary-600 hover:underline dark:text-primary-400">
                  <ArrowPathIcon className="h-3.5 w-3.5" />{t('driver.nextStep')}
                </button>
              </div>
            </div>
          </section>
        )}

        {active.length > 0 && (
          <section aria-label={t('driver.route')} className="rounded-xl border border-secondary-200 bg-white p-3 text-xs dark:border-secondary-700 dark:bg-secondary-800">
            <h3 className="text-sm font-semibold">{t('driver.route')}</h3>
            <p className="mb-2 text-[11px] text-secondary-500 dark:text-secondary-400">{t('driver.routeHint', { km: fmtKm(route.km, locale), n: route.stops.length })}</p>
            <ol className="space-y-1">
              {route.stops.map((s, i) => (
                <li key={`${s.orderId}-${s.kind}`} className="flex items-center gap-2">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${s.kind === 'pickup' ? 'bg-amber-500' : 'bg-sky-500'}`}>{i + 1}</span>
                  <span className="min-w-0 truncate">{t(s.kind === 'pickup' ? 'driver.stopPickup' : 'driver.stopDropoff', { place: s.label, id: s.orderId })}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section aria-label={t('driver.recentRatings')} className="rounded-xl border border-secondary-200 bg-white p-3 text-xs dark:border-secondary-700 dark:bg-secondary-800">
          <h3 className="mb-2 text-sm font-semibold">{t('driver.recentRatings')}</h3>
          {rated.length === 0 && <p className="text-secondary-500 dark:text-secondary-400">{t('driver.noRatings')}</p>}
          <ul className="space-y-1">
            {rated.slice(0, 3).map((o) => (
              <li key={o.id} className="flex items-start gap-2">
                <Stars value={o.rating!.stars} size="h-3 w-3" />
                <span className="min-w-0 text-secondary-600 dark:text-secondary-300">{o.rating!.comment ?? (o.rating!.commentKey ? t(`ratingComments.${o.rating!.commentKey}`) : '')} <span className="whitespace-nowrap text-secondary-400">({o.id})</span></span>
              </li>
            ))}
          </ul>
        </section>

        <DriverDocs driverId={driver.id} />

        <p className="flex items-start gap-1 text-[10px] text-secondary-500 dark:text-secondary-400">
          <InformationCircleIcon className="h-3.5 w-3.5 shrink-0" />{t('driver.footer')}
        </p>
      </div>
    </PhoneFrame>
  );
}

function ModalReject({
  order, reason, setReason, onClose, onConfirm,
}: { order: Order; reason: (typeof DRIVER_REJECT_REASONS)[number]; setReason: (r: (typeof DRIVER_REJECT_REASONS)[number]) => void; onClose: () => void; onConfirm: () => void }) {
  const t = useTranslations('demoDelivery');
  return (
    <ModalShell title={t('driver.rejectTitle', { id: order.id })} onClose={onClose} onConfirm={onConfirm} confirm={t('driver.reject')}>
      <p className="mb-2 text-xs text-secondary-600 dark:text-secondary-300">{t('driver.rejectHint')}</p>
      <div className="space-y-1" role="radiogroup">
        {DRIVER_REJECT_REASONS.map((r) => (
          <label key={r} className="flex cursor-pointer items-center gap-2 rounded-lg bg-secondary-50 px-3 py-2 text-xs dark:bg-secondary-800">
            <input type="radio" name="driver-reject" checked={reason === r} onChange={() => setReason(r)} />
            <span className="first-letter:uppercase">{t(`reasons.driver.${r}`)}</span>
          </label>
        ))}
      </div>
    </ModalShell>
  );
}


function ModalShell({ title, onClose, onConfirm, confirm, children }: { title: string; onClose: () => void; onConfirm: () => void; confirm: string; children: React.ReactNode }) {
  const t = useTranslations('demoDelivery.common');
  return (
    <Modal
      scope="phone"
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="outline" onClick={onClose}>{t('cancel')}</Button>
          <Button size="sm" variant="danger" onClick={onConfirm}>{confirm}</Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
