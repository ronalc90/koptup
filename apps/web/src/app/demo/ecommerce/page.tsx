'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ShoppingBagIcon,
  CreditCardIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  ChartBarIcon,
  CheckCircleIcon,
  MapIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { StoreProvider, useStore, type ViewId } from './components/store';
import { Modal, Toasts } from './components/ui';
import Intro, { GUIDED_DEMO_HREF, QUOTE_HREF } from './components/Intro';
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
  const { view, setView, cartCount, state, reset, setTourOpen, notify } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const done = useTourProgress();
  const viewsRef = useRef<HTMLDivElement>(null);

  // En el celular la barra de vistas se desplaza de lado: deja a la vista la vista activa.
  useEffect(() => {
    const bar = viewsRef.current;
    const active = bar?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!bar || !active) return;
    const left = active.offsetLeft; // la barra es «relative»: offsetLeft ya es relativo a ella
    if (left < bar.scrollLeft || left + active.offsetWidth > bar.scrollLeft + bar.clientWidth) {
      bar.scrollTo({ left: Math.max(0, left - 16), behavior: 'smooth' });
    }
  }, [view]);

  // «Empezar el recorrido»: abre el panel, lleva a la vista del primer paso
  // pendiente y pone el foco en ese paso.
  const startTour = useCallback(() => {
    setTourOpen(true);
    const next = TOUR_STEPS.find((s) => !done[s.id]) ?? TOUR_STEPS[0];
    const index = TOUR_STEPS.indexOf(next);
    setView(next.view);
    notify(
      done[next.id]
        ? t('tour.startDone')
        : t('tour.startToast', { n: index + 1, total: TOUR_STEPS.length, step: t(`tour.steps.${next.id}`) }),
    );
    window.setTimeout(() => {
      document.getElementById('ecommerce-recorrido')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.querySelector<HTMLElement>(`[data-tour-step="${next.id}"]`)?.focus({ preventScroll: true });
    }, 60);
  }, [done, notify, setTourOpen, setView, t]);

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      <Intro onStartTour={startTour} onReset={() => setConfirmReset(true)} />
      <nav
        className="sticky top-16 z-40 border-b border-secondary-200 bg-white/95 shadow-sm backdrop-blur dark:border-secondary-800 dark:bg-secondary-900/95 md:top-20"
        aria-label={t('viewSelector')}
      >
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
          <div ref={viewsRef} className="relative -mx-2 flex items-center gap-1 overflow-x-auto px-2 py-3 sm:gap-2">
            {VIEWS.map((v) => {
              const Icon = v.icon;
              const active = view === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    // La vista activa: lleva al inicio de su contenido.
                    if (active) document.getElementById('demo-ecommerce-view')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    else setView(v.id);
                  }}
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
          </div>
        </div>
      </nav>

      <TourBar />

      <div id="demo-ecommerce-view" className="animate-fade-in scroll-mt-32 py-6 sm:py-8 md:scroll-mt-36" key={view}>
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

const TOUR_STEPS: Array<{ id: TourStepId; view: ViewId }> = [
  { id: 'cart', view: 'storefront' },
  { id: 'pay', view: 'checkout' },
  { id: 'prepare', view: 'vendor' },
  { id: 'ship', view: 'operations' },
  { id: 'reports', view: 'admin' },
];
type TourStepId = 'cart' | 'pay' | 'prepare' | 'ship' | 'reports';

/** Qué pasos del recorrido ya se hicieron, según el estado de la demo (se marcan solos). */
function useTourProgress(): Record<TourStepId, boolean> {
  const { state } = useStore();
  const demo = state.orders.filter((o) => o.demo);
  return {
    cart: state.cart.length > 0 || demo.length > 0,
    pay: demo.length > 0,
    prepare: demo.some((o) => o.status !== 'new'),
    ship: demo.some((o) => !!o.guide),
    reports: state.tour.reportsSeen,
  };
}

function TourBar() {
  const t = useTranslations('demoEcommerce2');
  const { state, view, setView, setTourOpen, notify } = useStore();
  const done = useTourProgress();
  const completed = TOUR_STEPS.filter((s) => done[s.id]).length;
  const nextId = TOUR_STEPS.find((s) => !done[s.id])?.id;
  const listRef = useRef<HTMLOListElement>(null);

  // En el celular los pasos se desplazan de lado: deja a la vista el siguiente paso.
  useEffect(() => {
    const list = listRef.current;
    const step = nextId ? list?.querySelector<HTMLElement>(`[data-tour-step="${nextId}"]`)?.parentElement : null;
    if (!list || !step || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: Math.max(0, step.offsetLeft - 8) });
  }, [nextId, state.tour.open]);

  if (!state.tour.open) {
    return (
      <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
        <button type="button" onClick={() => setTourOpen(true)} aria-expanded={false} className="flex items-center gap-1 rounded text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400">
          <MapIcon className="h-4 w-4" aria-hidden="true" /> {t('tour.show', { done: completed, total: TOUR_STEPS.length })}
        </button>
      </div>
    );
  }

  return (
    <section id="ecommerce-recorrido" className="mx-auto max-w-7xl scroll-mt-36 px-4 pt-4 sm:px-6 md:scroll-mt-40 lg:px-8" aria-labelledby="ecommerce-recorrido-titulo">
      <div className="rounded-xl border border-primary-200 bg-white p-3 dark:border-primary-900 dark:bg-secondary-900">
        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 id="ecommerce-recorrido-titulo" className="flex items-center gap-2 text-sm font-semibold text-secondary-900 dark:text-white">
              <MapIcon className="h-5 w-5 text-primary-600" aria-hidden="true" />
              {t('tour.title')} <span className="font-normal text-secondary-500 dark:text-secondary-400" aria-live="polite">({completed}/{TOUR_STEPS.length})</span>
            </h2>
            <p className="mt-0.5 text-xs text-secondary-500 dark:text-secondary-400">{t('tour.subtitle')}</p>
          </div>
          <button type="button" onClick={() => setTourOpen(false)} aria-expanded className="rounded text-xs text-secondary-500 hover:underline dark:text-secondary-400">{t('tour.hide')}</button>
        </div>
        <ol ref={listRef} className="relative -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0 sm:pb-0">
          {TOUR_STEPS.map((s, i) => {
            const isDone = done[s.id];
            const isNext = s.id === nextId;
            return (
              <li key={s.id} className="min-w-[170px] sm:min-w-0">
                <button
                  type="button"
                  data-tour-step={s.id}
                  aria-current={isNext ? 'step' : undefined}
                  aria-label={`${i + 1}. ${t(`tour.steps.${s.id}`)} (${isDone ? t('tour.stateDone') : isNext ? t('tour.stateNext') : t('tour.statePending')})`}
                  onClick={() => {
                    if (view !== s.view) return setView(s.view);
                    // Ya estás en esa vista: lo dice y baja hasta donde se hace el paso.
                    notify(isDone ? t('tour.doneHere') : t('tour.here', { step: t(`tour.steps.${s.id}`) }));
                    const target = document.getElementById(s.id === 'cart' ? 'ecommerce-productos' : 'demo-ecommerce-view');
                    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`flex h-full w-full items-start gap-2 rounded-lg p-2 text-left text-xs transition-colors ${
                    isDone
                      ? 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200'
                      : isNext
                        ? 'bg-primary-50 text-primary-900 ring-1 ring-primary-400 hover:bg-primary-100 dark:bg-primary-950/40 dark:text-primary-100 dark:ring-primary-700'
                        : 'bg-secondary-50 text-secondary-700 hover:bg-secondary-100 dark:bg-secondary-800 dark:text-secondary-300'
                  }`}
                >
                  {isDone ? (
                    <CheckCircleIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current text-[10px]" aria-hidden="true">{i + 1}</span>
                  )}
                  <span>
                    {t(`tour.steps.${s.id}`)}
                    {isNext && <span className="mt-0.5 block font-semibold text-primary-700 dark:text-primary-300">{t('tour.next')}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {completed === TOUR_STEPS.length && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-900 dark:bg-green-950/30 dark:text-green-100 sm:text-sm">
            <p className="min-w-0 flex-1">{t('tour.complete')}</p>
            <div className="flex flex-wrap gap-2">
              <Link href={GUIDED_DEMO_HREF} className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700">{t('intro.guidedDemo')}</Link>
              <Link href={QUOTE_HREF} className="rounded-lg border border-green-300 bg-white px-3 py-1.5 text-xs font-semibold text-green-900 hover:bg-green-100 dark:border-green-700 dark:bg-secondary-900 dark:text-green-100">{t('intro.quote')}</Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
