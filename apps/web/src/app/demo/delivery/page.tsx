'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  ShoppingBagIcon, TruckIcon, BuildingStorefrontIcon, ChartBarSquareIcon, BoltIcon, ArrowPathIcon, CheckCircleIcon, MapIcon,
  PlayIcon, PauseIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import CustomerApp from './components/CustomerApp';
import DriverApp from './components/DriverApp';
import MerchantApp from './components/MerchantApp';
import OpsApp from './components/OpsApp';
import { DeliveryProvider, useDelivery, resetStorage, type AppTab } from './components/store';
import { Modal, Toasts } from './components/ui';
import { fmtTime, isActive, opsAlerts } from './components/engine';
import type { LogEntry } from './components/types';

const TABS: { key: AppTab; icon: typeof ShoppingBagIcon }[] = [
  { key: 'customer', icon: ShoppingBagIcon },
  { key: 'merchant', icon: BuildingStorefrontIcon },
  { key: 'ops', icon: ChartBarSquareIcon },
  { key: 'driver', icon: TruckIcon },
];

export default function DeliveryDemoPage() {
  return (
    <DeliveryProvider>
      <Shell />
    </DeliveryProvider>
  );
}

function Shell() {
  const t = useTranslations('demoDelivery');
  const { state, dispatch, notify } = useDelivery();
  const [confirmReset, setConfirmReset] = useState(false);
  const tab = state.tab;

  const alerts = opsAlerts(state.orders, state.now).filter((a) => !a.fraud || !state.reviews[a.id]);
  const counts: Record<AppTab, number> = {
    customer: state.customer.cart.reduce((a, l) => a + l.qty, 0),
    merchant: state.orders.filter((o) => o.stage === 'pending').length,
    ops: alerts.length,
    driver: state.orders.filter((o) => o.driverStatus === 'offered' && isActive(o)).length,
  };

  return (
    <div className="min-h-screen bg-secondary-50 text-secondary-900 dark:bg-secondary-950 dark:text-white">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <section className="mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 p-6 text-white shadow-lg md:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur">
              <BoltIcon className="mr-1 h-3 w-3" />
              {t('meta.badge')}
            </span>
            <span className="rounded-full border border-white/40 bg-white/10 px-2.5 py-0.5 text-xs font-semibold" title={t('meta.sampleDataHint')}>
              {t('meta.sampleData')}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t('meta.title')}</h1>
          <p className="mt-2 max-w-3xl text-base text-orange-50/90 md:text-lg">{t('meta.subtitle')}</p>
        </section>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label={t('tabs.label')}>
            {TABS.map(({ key, icon: Icon }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => dispatch({ type: 'set', patch: { tab: key } })}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                  tab === key
                    ? 'border-l-4 border-orange-500 bg-orange-100 text-orange-800 shadow-sm dark:bg-orange-950/60 dark:text-orange-300'
                    : 'border border-secondary-200 bg-white text-secondary-700 hover:border-orange-400 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(`tabs.${key}`)}
                {counts[key] > 0 && (
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white" title={t(`tabs.count.${key}`, { n: counts[key] })}>
                    {counts[key]}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              role="switch"
              aria-checked={state.auto}
              onClick={() => {
                dispatch({ type: 'auto' });
                notify(state.auto ? t('controls.autoOffToast') : t('controls.autoOnToast'), 'info');
              }}
              title={t('controls.autoHint')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-semibold ${state.auto ? 'bg-emerald-600 text-white' : 'border border-secondary-200 bg-white text-secondary-700 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-200'}`}
            >
              {state.auto ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
              {state.auto ? t('controls.autoOn') : t('controls.autoOff')}
            </button>
            <button type="button" onClick={() => setConfirmReset(true)} className="inline-flex items-center gap-1 rounded-lg px-2 py-2 font-medium text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800" title={t('controls.resetHint')}>
              <ArrowPathIcon className="h-4 w-4" />{t('controls.reset')}
            </button>
          </div>
        </div>

        <TourBar />

        <div id="delivery-apps" className={`scroll-mt-24 ${tab === 'ops' ? 'space-y-6' : 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]'}`}>
          <div role="tabpanel" aria-label={t(`tabs.${tab}`)} className="min-w-0">
            {tab === 'customer' && <CustomerApp />}
            {tab === 'merchant' && <MerchantApp />}
            {tab === 'ops' && <OpsApp />}
            {tab === 'driver' && <DriverApp />}
          </div>
          <ActivityPanel />
        </div>

        <p className="mt-6 text-xs text-secondary-500 dark:text-secondary-400">{t('meta.footer')}</p>
      </div>

      <Toasts />

      {confirmReset && (
        <Modal
          title={t('controls.resetTitle')}
          onClose={() => setConfirmReset(false)}
          footer={
            <>
              <Button size="sm" variant="outline" onClick={() => setConfirmReset(false)}>{t('common.cancel')}</Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  resetStorage();
                  dispatch({ type: 'reset' });
                  setConfirmReset(false);
                  notify(t('controls.resetToast'), 'info');
                }}
              >
                {t('controls.resetConfirm')}
              </Button>
            </>
          }
        >
          <p className="text-sm text-secondary-700 dark:text-secondary-300">{t('controls.resetBody', { n: state.orders.filter((o) => o.own).length })}</p>
        </Modal>
      )}
    </div>
  );
}

type StepId = 'order' | 'accept' | 'assign' | 'deliver' | 'rate';
const STEPS: { id: StepId; tab: AppTab }[] = [
  { id: 'order', tab: 'customer' },
  { id: 'accept', tab: 'merchant' },
  { id: 'assign', tab: 'ops' },
  { id: 'deliver', tab: 'driver' },
  { id: 'rate', tab: 'customer' },
];

function TourBar() {
  const t = useTranslations('demoDelivery');
  const { state, dispatch, notify } = useDelivery();
  const own = state.orders.filter((o) => o.own);
  const o = own[own.length - 1];
  const failed = !!o && (o.stage === 'rejected' || o.stage === 'cancelled');
  const live = o && !failed ? o : undefined;
  const done: Record<StepId, boolean> = {
    order: !!live,
    accept: !!live && live.stage !== 'pending',
    assign: !!live && (!!live.driverId || live.stage === 'pickedUp' || live.stage === 'delivered'),
    deliver: !!live && live.stage === 'delivered',
    rate: !!live && !!live.rating,
  };
  const completed = STEPS.filter((s) => done[s.id]).length;
  const nextStep = STEPS.find((s) => !done[s.id]);

  const go = (s: (typeof STEPS)[number]) => {
    const patch: { tab: AppTab; merchantSede?: typeof state.merchantSede; driverView?: string } = { tab: s.tab };
    if (s.tab === 'merchant' && live) patch.merchantSede = live.sedeId;
    if (s.tab === 'driver' && live?.driverId) patch.driverView = live.driverId;
    const view = live ? 'tracking' : 'home';
    const already = state.tab === s.tab && (s.tab !== 'customer' || state.customer.view === view);
    dispatch({ type: 'set', patch });
    if (s.tab === 'customer') dispatch({ type: 'customer', patch: live ? { view, activeOrderId: live.id } : { view } });
    // Si ya estás en esa app, lo dice y baja hasta ella (el botón nunca queda sin respuesta).
    if (already) notify(done[s.id] ? t('tour.doneHere') : t('tour.here', { step: t(`tour.steps.${s.id}`) }), 'info');
    document.getElementById('delivery-apps')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!state.tourOpen) {
    return (
      <div className="mb-4">
        <button type="button" onClick={() => dispatch({ type: 'set', patch: { tourOpen: true } })} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400">
          <MapIcon className="h-4 w-4" />{t('tour.show', { done: completed, total: STEPS.length })}
        </button>
      </div>
    );
  }

  return (
    <section className="mb-5 rounded-xl border border-orange-200 bg-white p-3 dark:border-orange-900 dark:bg-secondary-900" aria-label={t('tour.title')}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <MapIcon className="h-5 w-5 text-orange-500" />
          {t('tour.title')} <span className="font-normal text-secondary-500">({completed}/{STEPS.length})</span>
        </p>
        <button type="button" onClick={() => dispatch({ type: 'set', patch: { tourOpen: false } })} className="text-xs text-secondary-500 hover:underline">{t('tour.hide')}</button>
      </div>
      <ol className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0 md:pb-0">
        {STEPS.map((s, i) => (
          <li key={s.id} className="min-w-[180px] md:min-w-0">
            <button
              type="button"
              onClick={() => go(s)}
              className={`flex h-full w-full items-start gap-2 rounded-lg p-2 text-left text-xs transition-colors ${
                done[s.id]
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'
                  : nextStep?.id === s.id
                    ? 'bg-orange-50 text-orange-900 ring-1 ring-orange-300 dark:bg-orange-950/30 dark:text-orange-100'
                    : 'bg-secondary-50 text-secondary-700 hover:bg-secondary-100 dark:bg-secondary-800 dark:text-secondary-300'
              }`}
            >
              {done[s.id] ? <CheckCircleIcon className="h-4 w-4 shrink-0" /> : <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current text-[10px]">{i + 1}</span>}
              <span>
                <span className="block font-semibold">{t(`tabs.${s.tab}`)}</span>
                {t(`tour.steps.${s.id}`)}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-secondary-600 dark:text-secondary-300">
        {failed && o
          ? t('tour.failed', { id: o.id })
          : nextStep
            ? t(`tour.next.${nextStep.id}`, { id: live?.id ?? '' })
            : t('tour.done')}
      </p>
    </section>
  );
}

function ActivityPanel() {
  const t = useTranslations('demoDelivery');
  const locale = useLocale();
  const { state } = useDelivery();

  const text = (e: LogEntry) => {
    const p: Record<string, string | number> = { ...(e.params ?? {}) };
    if (typeof p.sede === 'string') p.sede = t(`sedes.${p.sede}`);
    if (typeof p.item === 'string') p.item = t(`menu.items.${p.item}.name`);
    if (typeof p.method === 'string') p.method = e.key === 'delivered' ? t(`pod.mode.${p.method}`) : t(`payments.${p.method}.name`);
    if (typeof p.reason === 'string') {
      const group = e.key === 'driverRejected' ? 'driver' : e.key === 'cancelled' ? 'cancel' : 'reject';
      p.reason = t(`reasons.${group}.${p.reason}`);
    }
    if (typeof p.alert === 'string') p.alert = t(`ops.review.rule.${p.alert}`);
    if (typeof p.doc === 'string') p.doc = t(`docs.items.${p.doc}`);
    return t(`log.${e.key}`, p);
  };

  return (
    <aside className="h-fit min-w-0 rounded-xl border border-secondary-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-900" aria-label={t('activity.title')}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{t('activity.title')}</h2>
        <span className="font-mono text-xs text-secondary-500 dark:text-secondary-400" title={t('activity.clockHint')}>{fmtTime(state.now, locale)}</span>
      </div>
      <p className="mb-3 text-[11px] text-secondary-500 dark:text-secondary-400">{t('activity.hint')}</p>
      {state.log.length === 0 ? (
        <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('activity.empty')}</p>
      ) : (
        <ol className="max-h-[520px] space-y-2 overflow-y-auto pr-1 text-xs">
          {state.log.map((e, i) => (
            <li key={`${e.at}-${i}`} className="flex gap-2">
              <span className="w-16 shrink-0 font-mono text-[10px] text-secondary-500 dark:text-secondary-400">{fmtTime(e.at, locale)}</span>
              <span className="min-w-0">
                <span className="mr-1 rounded bg-secondary-100 px-1 text-[10px] font-semibold text-secondary-700 dark:bg-secondary-800 dark:text-secondary-200">{t(`activity.app.${e.app}`)}</span>
                {text(e)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
