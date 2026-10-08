'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ShoppingBagIcon,
  CreditCardIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  MapIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { StoreProvider, useStore, type ViewId } from './components/store';
import { Modal, Toasts } from './components/ui';
import StorefrontView from './components/StorefrontView';
import CheckoutView from './components/CheckoutView';
import VendorView from './components/VendorView';
import OperationsView from './components/OperationsView';
import AdminView from './components/AdminView';

interface ViewMeta {
  id: ViewId;
  icon: React.ComponentType<{ className?: string }>;
}

const VIEWS: ViewMeta[] = [
  { id: 'storefront', icon: ShoppingBagIcon },
  { id: 'checkout', icon: CreditCardIcon },
  { id: 'vendor', icon: BuildingStorefrontIcon },
  { id: 'operations', icon: TruckIcon },
  { id: 'admin', icon: ChartBarIcon },
];

export default function EcommerceDemoPage() {
  return (
    <StoreProvider>
      <ViewShell />
    </StoreProvider>
  );
}

function ViewShell() {
  const t = useTranslations('demoEcommerce2');
  const { view, setView, cartCount, state, reset } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      <nav
        className="sticky top-16 z-40 border-b border-secondary-200 bg-white/95 shadow-sm backdrop-blur dark:border-secondary-800 dark:bg-secondary-900/95 md:top-20"
        aria-label={t('viewSelector')}
      >
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
          <div className="-mx-2 flex items-center gap-1 overflow-x-auto px-2 py-3 sm:gap-2">
            {VIEWS.map((v) => {
              const Icon = v.icon;
              const active = view === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setView(v.id)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all sm:px-4 ${
                    active ? 'bg-primary-600 text-white shadow' : 'text-secondary-700 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800'
                  }`}
                  aria-pressed={active}
                >
                  <Icon className="h-5 w-5" />
                  <span>{t(`views.${v.id}`)}</span>
                  {v.id === 'checkout' && cartCount > 0 && (
                    <span className={`ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-xs font-bold ${active ? 'bg-white text-primary-600' : 'bg-primary-600 text-white'}`}>
                      {cartCount}
                    </span>
                  )}
                </button>
              );
            })}
            <span className="ml-auto flex shrink-0 items-center gap-2 pl-2">
              <span
                className="whitespace-nowrap rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
                title={t('sampleDataHint')}
              >
                {t('sampleData')}
              </span>
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-xs font-medium text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800"
                title={t('reset.hint')}
              >
                <ArrowPathIcon className="h-4 w-4" />
                <span>{t('reset.button')}</span>
              </button>
            </span>
          </div>
        </div>
      </nav>

      <TourBar />

      <div id="demo-ecommerce-view" className="animate-fade-in py-6 sm:py-8" key={view}>
        {view === 'storefront' && <StorefrontView />}
        {view === 'checkout' && <CheckoutView />}
        {view === 'vendor' && <VendorView />}
        {view === 'operations' && <OperationsView />}
        {view === 'admin' && <AdminView />}
      </div>

      <p className="mx-auto max-w-7xl px-4 pb-8 text-xs text-secondary-500 sm:px-6 lg:px-8">{t('footerNote')}</p>

      <Toasts />

      {confirmReset && (
        <Modal
          title={t('reset.title')}
          onClose={() => setConfirmReset(false)}
          footer={
            <>
              <Button variant="outline" onClick={() => setConfirmReset(false)}>{t('common.cancel')}</Button>
              <Button variant="danger" onClick={() => { reset(); setConfirmReset(false); }}>{t('reset.confirm')}</Button>
            </>
          }
        >
          <p className="text-sm text-secondary-700 dark:text-secondary-300">{t('reset.body', { n: state.orders.filter((o) => o.demo).length })}</p>
        </Modal>
      )}
    </div>
  );
}

const TOUR_STEPS: Array<{ id: string; view: ViewId }> = [
  { id: 'cart', view: 'storefront' },
  { id: 'pay', view: 'checkout' },
  { id: 'prepare', view: 'vendor' },
  { id: 'ship', view: 'operations' },
  { id: 'reports', view: 'admin' },
];

function TourBar() {
  const t = useTranslations('demoEcommerce2');
  const { state, view, setView, setTourOpen, notify } = useStore();
  const demo = state.orders.filter((o) => o.demo);
  const done: Record<string, boolean> = {
    cart: state.cart.length > 0 || demo.length > 0,
    pay: demo.length > 0,
    prepare: demo.some((o) => o.status !== 'new'),
    ship: demo.some((o) => !!o.guide),
    reports: state.tour.reportsSeen,
  };
  const completed = TOUR_STEPS.filter((s) => done[s.id]).length;

  if (!state.tour.open) {
    return (
      <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
        <button type="button" onClick={() => setTourOpen(true)} className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline">
          <MapIcon className="h-4 w-4" /> {t('tour.show', { done: completed, total: TOUR_STEPS.length })}
        </button>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8" aria-label={t('tour.title')}>
      <div className="rounded-xl border border-primary-200 bg-white p-3 dark:border-primary-900 dark:bg-secondary-900">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-semibold text-secondary-900 dark:text-white">
            <MapIcon className="h-5 w-5 text-primary-600" />
            {t('tour.title')} <span className="font-normal text-secondary-500">({completed}/{TOUR_STEPS.length})</span>
          </p>
          <button type="button" onClick={() => setTourOpen(false)} className="text-xs text-secondary-500 hover:underline">{t('tour.hide')}</button>
        </div>
        <ol className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0 sm:pb-0">
          {TOUR_STEPS.map((s, i) => (
            <li key={s.id} className="min-w-[170px] sm:min-w-0">
              <button
                type="button"
                onClick={() => {
                  if (view !== s.view) return setView(s.view);
                  // Ya estás en esa vista: lo dice y baja hasta donde se hace el paso.
                  notify(done[s.id] ? t('tour.doneHere') : t('tour.here', { step: t(`tour.steps.${s.id}`) }));
                  const target = document.getElementById(s.id === 'cart' ? 'ecommerce-productos' : 'demo-ecommerce-view');
                  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`flex h-full w-full items-start gap-2 rounded-lg p-2 text-left text-xs transition-colors ${done[s.id] ? 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200' : 'bg-secondary-50 text-secondary-700 hover:bg-secondary-100 dark:bg-secondary-800 dark:text-secondary-300'}`}
              >
                {done[s.id] ? <CheckCircleIcon className="h-4 w-4 shrink-0" /> : <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current text-[10px]">{i + 1}</span>}
                <span>{t(`tour.steps.${s.id}`)}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
