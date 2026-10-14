'use client';

import { useState, type ComponentType } from 'react';
import {
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ArchiveBoxIcon,
  ArrowUpTrayIcon,
  TruckIcon,
  ArrowUturnLeftIcon,
  Squares2X2Icon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { COMPANY, WAREHOUSES, fmtNit } from '../lib/catalog';
import { kpis } from '../lib/engine';
import { fmtNum, fmtPct } from '../lib/format';
import { useWms } from '../lib/store';
import type { Milestone, ViewId, WarehouseId } from '../lib/types';
import { Modal, Toasts, useT } from './ui';
import Dashboard from './Dashboard';
import Receiving from './Receiving';
import CrossDockKits from './CrossDockKits';
import WarehouseMap from './WarehouseMap';
import Stock from './Stock';
import CycleCount from './CycleCount';
import Orders from './Orders';
import Picking from './Picking';
import Packing from './Packing';
import Carriers from './Carriers';
import RoutesView from './Routes';
import DriverApp from './DriverApp';
import Tracking from './Tracking';
import Returns from './Returns';
import Billing from './Billing';

type AreaId = 'home' | 'inbound' | 'inventory' | 'outbound' | 'transport' | 'after';

const AREAS: { id: AreaId; icon: ComponentType<{ className?: string }>; views: ViewId[] }[] = [
  { id: 'home', icon: Squares2X2Icon, views: ['dashboard'] },
  { id: 'inbound', icon: ArrowDownTrayIcon, views: ['receiving', 'crossdock'] },
  { id: 'inventory', icon: ArchiveBoxIcon, views: ['map', 'stock', 'counts'] },
  { id: 'outbound', icon: ArrowUpTrayIcon, views: ['orders', 'picking', 'packing'] },
  { id: 'transport', icon: TruckIcon, views: ['carriers', 'routes', 'driver', 'tracking'] },
  { id: 'after', icon: ArrowUturnLeftIcon, views: ['returns', 'billing'] },
];

const VIEWS: Record<ViewId, ComponentType> = {
  dashboard: Dashboard,
  receiving: Receiving,
  crossdock: CrossDockKits,
  map: WarehouseMap,
  stock: Stock,
  counts: CycleCount,
  orders: Orders,
  picking: Picking,
  packing: Packing,
  carriers: Carriers,
  routes: RoutesView,
  driver: DriverApp,
  tracking: Tracking,
  returns: Returns,
  billing: Billing,
};

export const TOUR: { id: Milestone; view: ViewId; focus?: string }[] = [
  { id: 'received', view: 'receiving', focus: 'OC-24871' },
  { id: 'putaway', view: 'receiving', focus: 'OC-24871' },
  { id: 'wave', view: 'orders' },
  { id: 'picked', view: 'picking' },
  { id: 'shipped', view: 'packing' },
  { id: 'delivered', view: 'driver' },
];

export default function Shell() {
  const t = useT();
  const { state, nav, go, setWh, reset, lang, today, saved, notify } = useWms();
  const [confirmReset, setConfirmReset] = useState(false);
  const [tourOpen, setTourOpen] = useState(true);
  const area = AREAS.find((a) => a.views.includes(nav.view)) ?? AREAS[0];
  const View = VIEWS[nav.view] ?? Dashboard;
  const done = state.milestones.length;

  return (
    <div className="space-y-5">
      {/* Empresa ficticia y acciones */}
      <div className="flex flex-col gap-3 rounded-2xl border border-secondary-200 bg-white p-4 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-secondary-700 dark:bg-secondary-900">
        <div className="min-w-0">
          <div className="font-semibold text-secondary-900 dark:text-white">
            {COMPANY.name} · NIT {fmtNit(COMPANY.nit)}
          </div>
          <div className="text-xs text-secondary-500 dark:text-secondary-400">{t('shell.company')}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-secondary-500 dark:text-secondary-400">{saved ? t('shell.saved') : t('shell.notSaved')}</span>
          <Button size="sm" variant="ghost" onClick={() => setConfirmReset(true)}>
            <ArrowPathIcon className="mr-1.5 h-4 w-4" />
            {t('shell.reset')}
          </Button>
        </div>
      </div>

      {/* Selector de bodegas */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3" role="radiogroup" aria-label={t('shell.warehouses')}>
        {WAREHOUSES.map((w) => {
          const k = kpis(state, w.id, today);
          const active = w.id === nav.wh;
          return (
            <button
              key={w.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setWh(w.id as WarehouseId)}
              className={`min-w-0 rounded-2xl border p-4 text-left shadow-sm transition ${
                active
                  ? 'border-stone-600 bg-stone-50 ring-1 ring-stone-600 dark:bg-stone-900/40'
                  : 'border-secondary-200 bg-white hover:border-stone-400 dark:border-secondary-700 dark:bg-secondary-900'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-secondary-900 dark:text-white">{w.name}</div>
                  <div className="flex items-center gap-1 text-xs text-secondary-500 dark:text-secondary-400">
                    <MapPinIcon className="h-3.5 w-3.5" /> {w.city} · {t(`shell.whType.${w.id}`)}
                  </div>
                </div>
                {active && <CheckCircleIcon className="h-5 w-5 shrink-0 text-stone-600" aria-hidden />}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-secondary-500 dark:text-secondary-400">{t('shell.occupancy')}</div>
                  <div className="font-semibold text-secondary-900 dark:text-white">{fmtPct(k.occupancy, lang, 0)}</div>
                </div>
                <div>
                  <div className="text-secondary-500 dark:text-secondary-400">{t('shell.ordersToday')}</div>
                  <div className="font-semibold text-secondary-900 dark:text-white">{fmtNum(k.ordersToday, lang)}</div>
                </div>
                <div>
                  <div className="text-secondary-500 dark:text-secondary-400">{t('shell.accuracy')}</div>
                  <div className="font-semibold text-secondary-900 dark:text-white">{fmtPct(k.accuracy, lang)}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Recorrido sugerido */}
      <section className="rounded-2xl border border-stone-300 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-900/30" aria-label={t('tour.title')}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-secondary-900 dark:text-white">
              {t('tour.title')} · {t('tour.progress', { done, total: TOUR.length })}
            </h2>
            <p className="text-xs text-secondary-600 dark:text-secondary-400">{t('tour.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => setTourOpen((v) => !v)}
            aria-expanded={tourOpen}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            {tourOpen ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
            {tourOpen ? t('tour.hide') : t('tour.show')}
          </button>
        </div>
        {tourOpen && (
          <ol className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2 lg:grid-cols-3">
            {TOUR.map((step, i) => {
              const ok = state.milestones.includes(step.id);
              return (
                <li key={step.id} className={`flex min-w-0 items-start gap-2 rounded-xl border p-2 text-sm sm:p-3 ${ok ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20' : 'border-secondary-200 bg-white dark:border-secondary-700 dark:bg-secondary-900'}`}>
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${ok ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-800 dark:bg-stone-700 dark:text-white'}`}>
                    {ok ? '✓' : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-secondary-900 dark:text-white">{t(`tour.steps.${step.id}.title`)}</div>
                    <div className="hidden text-xs text-secondary-500 sm:block dark:text-secondary-400">{t(`tour.steps.${step.id}.text`)}</div>
                    {!ok && (
                      <button type="button" onClick={() => go(step.view, { wh: 'fun', focus: step.focus })} className="mt-0.5 text-xs font-semibold text-primary-600 hover:underline sm:mt-1 dark:text-primary-400">
                        {t('tour.go')}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* Navegación por áreas */}
      <nav id="wms-workspace" aria-label={t('shell.nav')} className="space-y-2">
        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-1 border-b border-secondary-200 dark:border-secondary-700" role="tablist" aria-label={t('shell.areasLabel')}>
            {AREAS.map((a) => {
              const active = a.id === area.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => go(a.views[0])}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition sm:px-4 ${
                    active ? 'border-stone-600 font-semibold text-stone-800 dark:text-stone-200' : 'border-transparent text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-white'
                  }`}
                >
                  <a.icon className="h-4 w-4" />
                  {t(`areas.${a.id}`)}
                </button>
              );
            })}
          </div>
        </div>
        {area.views.length > 1 && (
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={t(`areas.${area.id}`)}>
            {area.views.map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={nav.view === v}
                onClick={() => go(v)}
                className={`rounded-full px-3 py-1 text-sm transition ${
                  nav.view === v ? 'bg-stone-700 text-white' : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-200 dark:hover:bg-secondary-700'
                }`}
              >
                {t(`views.${v}`)}
              </button>
            ))}
          </div>
        )}
      </nav>

      <View />

      <Toasts />

      {confirmReset && (
        <Modal
          title={t('shell.resetTitle')}
          onClose={() => setConfirmReset(false)}
          footer={
            <>
              <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  reset();
                  setConfirmReset(false);
                  notify(t('shell.resetDone'));
                }}
              >
                {t('shell.resetConfirm')}
              </Button>
            </>
          }
        >
          <p>{t('shell.resetText')}</p>
        </Modal>
      )}
    </div>
  );
}
