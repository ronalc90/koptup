'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import {
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  TableCellsIcon,
  ComputerDesktopIcon,
  ChartBarIcon,
  UsersIcon,
  BuildingOffice2Icon,
  WifiIcon,
  SignalSlashIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  MapIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { POINTS, PRESETS, type PresetId } from './components/data';
import { computeTotals, lineAmount } from './components/engine';
import { orderKey, usePosStore, type Closure } from './components/usePosStore';
import { SaleView } from './components/SaleView';
import { TablesPanel, KdsPanel, StaffPanel } from './components/PosTabs';
import { ReportsPanel } from './components/ReportsPanel';
import { ConsolePanel } from './components/ConsolePanel';
import { CheckoutModal, CloseShiftModal, OpenShiftModal, ReceiptModal, ZReportModal } from './components/PosModals';
import { PRINT_CSS, employeeName, selectCls, shortName } from './components/ui';
import { buildReport } from './components/engine';

type Tab = 'sale' | 'tables' | 'kds' | 'reports' | 'console' | 'staff';
const TABS: Record<PresetId, Tab[]> = {
  retail: ['sale', 'reports', 'console', 'staff'],
  restaurant: ['sale', 'tables', 'kds', 'reports', 'console', 'staff'],
};
const TAB_ICON = {
  sale: ShoppingBagIcon,
  tables: TableCellsIcon,
  kds: ComputerDesktopIcon,
  reports: ChartBarIcon,
  console: BuildingOffice2Icon,
  staff: UsersIcon,
} as const;

export default function PosDemoPage() {
  const t = useTranslations('demoPos');
  const store = usePosStore();
  const { preset, sede, data, state } = store;
  const p = PRESETS[preset];
  const [tab, setTab] = useState<Tab>('sale');
  const [target, setTarget] = useState('counter');
  const [toast, setToast] = useState<{ msg: string; tone: 'ok' | 'error' } | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [shiftModal, setShiftModal] = useState<'open' | 'close' | null>(null);
  const [zView, setZView] = useState<Closure | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // Al cambiar de sede (desde la barra o la consola) el ticket vuelve al mostrador de esa sede.
  useEffect(() => {
    setTarget('counter');
  }, [sede]);

  const notify = useCallback((msg: string, tone: 'ok' | 'error' = 'ok') => {
    setToast({ msg, tone });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const tabs = TABS[preset];
  const activeTab: Tab = tabs.includes(tab) ? tab : 'sale';
  const shift = data.shifts[sede];
  const order = data.orders[orderKey(sede, target)];
  const customer = order?.customerId ? data.customers.find((c) => c.id === order.customerId) : undefined;
  const totals = useMemo(() => {
    const lines = order?.lines ?? [];
    const gross = lines.reduce((s, l) => s + lineAmount(l), 0);
    return computeTotals(lines, Math.min((order?.redeemBlocks ?? 0) * POINTS.blockValue, gross));
  }, [order]);
  const receiptSale = receiptId ? data.sales.find((s) => s.id === receiptId) : undefined;
  const shiftReport = buildReport(store.shiftSales(sede, shift.number));

  const switchPreset = (id: PresetId) => {
    store.setPreset(id);
    setTarget('counter');
    if (!TABS[id].includes(tab)) setTab('sale');
  };

  const toggleNet = () => {
    const goingOffline = !state.offline;
    store.toggleOffline();
    notify(goingOffline ? t('toolbar.offlineToast') : store.queuedCount > 0 ? t('toolbar.onlineSyncToast', { n: store.queuedCount }) : t('toolbar.onlineToast'));
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      <style>{PRINT_CSS}</style>

      {/* Encabezado */}
      <section className="bg-gradient-to-br from-fuchsia-600 to-fuchsia-800 text-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-white/15 shrink-0">
              <BuildingStorefrontIcon className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">{t('pageTitle')}</h1>
              <p className="text-sm sm:text-base text-fuchsia-50/90 mt-1 max-w-3xl">{t('pageSubtitle')}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 flex flex-col lg:flex-row lg:items-start gap-3">
        <span
          className="self-start inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200 whitespace-nowrap"
          title={t('sampleHint')}
        >
          {t('sampleBadge')}
        </span>
        <details className="group flex-1 min-w-0 rounded-lg border border-secondary-200 dark:border-secondary-800 bg-white/70 dark:bg-secondary-900/70 px-3 py-2 text-sm">
          <summary className="cursor-pointer list-none flex items-center gap-2 font-medium text-secondary-800 dark:text-secondary-200">
            <InformationCircleIcon className="h-4 w-4 text-primary-600 dark:text-primary-400 shrink-0" />
            {t('howItWorks.title')}
            <span className="ml-auto text-xs text-secondary-500 group-open:hidden">{t('common.show')}</span>
            <span className="ml-auto text-xs text-secondary-500 hidden group-open:inline">{t('common.hide')}</span>
          </summary>
          <ul className="mt-2 space-y-1.5 text-secondary-700 dark:text-secondary-300 list-disc pl-5">
            <li>{t('sampleHint')}</li>
            <li>{t('howItWorks.real')}</li>
            <li>{t('howItWorks.scanner')}</li>
            <li>{t('howItWorks.simulated')}</li>
            <li>{t('howItWorks.project')}</li>
          </ul>
        </details>
        <details className="group flex-1 min-w-0 rounded-lg border border-secondary-200 dark:border-secondary-800 bg-white/70 dark:bg-secondary-900/70 px-3 py-2 text-sm">
          <summary className="cursor-pointer list-none flex items-center gap-2 font-medium text-secondary-800 dark:text-secondary-200">
            <MapIcon className="h-4 w-4 text-primary-600 dark:text-primary-400 shrink-0" />
            {t('tour.title')}
            <span className="ml-auto text-xs text-secondary-500 group-open:hidden">{t('common.show')}</span>
            <span className="ml-auto text-xs text-secondary-500 hidden group-open:inline">{t('common.hide')}</span>
          </summary>
          <ol className="mt-2 space-y-1.5 text-secondary-700 dark:text-secondary-300 list-decimal pl-5">
            {(['1', '2', '3', '4', '5'] as const).map((k) => (
              <li key={k}>{t(`tour.steps.${k}`)}</li>
            ))}
          </ol>
        </details>
        <div className="self-start">
          {!confirmReset ? (
            <Button size="sm" variant="ghost" onClick={() => setConfirmReset(true)} className="gap-1.5">
              <ArrowPathIcon className="h-4 w-4" />
              {t('reset.button')}
            </Button>
          ) : (
            <div role="alert" className="flex flex-wrap items-center gap-2 rounded-lg border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 px-3 py-1.5">
              <span className="text-xs text-secondary-700 dark:text-secondary-300">{t('reset.confirm')}</span>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  store.reset();
                  setConfirmReset(false);
                  setTarget('counter');
                  setReceiptId(null);
                  setTab('sale');
                  notify(t('reset.done'));
                }}
              >
                {t('reset.yes')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Barra de la caja */}
      <header className="relative sm:sticky sm:top-16 md:top-20 z-30 mt-3 bg-white dark:bg-secondary-900 border-y border-secondary-200 dark:border-secondary-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex gap-1 p-1 rounded-lg bg-secondary-100 dark:bg-secondary-800" role="group" aria-label={t('presets.label')}>
            {(['retail', 'restaurant'] as PresetId[]).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={preset === m}
                onClick={() => switchPreset(m)}
                className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                  preset === m ? 'bg-white dark:bg-secondary-900 text-primary-700 dark:text-primary-300 shadow-sm' : 'text-secondary-600 dark:text-secondary-400'
                }`}
              >
                {t(`presets.${m}`)}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-xs text-secondary-600 dark:text-secondary-400 min-w-0">
            <span className="hidden sm:inline">{t('toolbar.sede')}</span>
            <select
              value={sede}
              onChange={(e) => {
                store.setSede(e.target.value);
                setTarget('counter');
                notify(t('toolbar.sedeToast', { name: p.sedes.find((s) => s.id === e.target.value)?.name ?? '' }));
              }}
              aria-label={t('toolbar.sede')}
              className={`${selectCls} max-w-[13rem]`}
            >
              {p.sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={toggleNet}
            aria-pressed={state.offline}
            title={state.offline ? t('toolbar.onlineTitle') : t('toolbar.offlineTitle')}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border whitespace-nowrap ${
              store.syncing > 0
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700'
                : state.offline
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700'
            }`}
          >
            {store.syncing > 0 ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                {t('toolbar.syncing', { n: store.syncing })}
              </>
            ) : state.offline ? (
              <>
                <SignalSlashIcon className="h-4 w-4" />
                {t('toolbar.offline')} · {t('toolbar.queued', { n: store.queuedCount })}
              </>
            ) : (
              <>
                <WifiIcon className="h-4 w-4" />
                {t('toolbar.online')}
              </>
            )}
          </button>
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap ${
              shift.open ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-100' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-100'
            }`}
          >
            {!shift.open && <LockClosedIcon className="h-3.5 w-3.5" />}
            {shift.open ? t('toolbar.shiftOpen', { n: shift.number, name: shortName(employeeName(preset, shift.cashierId)) }) : t('toolbar.shiftClosed')}
          </span>
        </div>
        <nav className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-2.5 flex gap-1 overflow-x-auto" aria-label={t('tabs.label')}>
          {tabs.map((tb) => {
            const Icon = TAB_ICON[tb];
            const badge =
              tb === 'kds' ? data.kds.filter((k) => k.sede === sede).length : tb === 'tables' ? Object.keys(data.orders).filter((k) => k.startsWith(sede + '|t')).length : 0;
            return (
              <button
                key={tb}
                type="button"
                aria-current={activeTab === tb ? 'page' : undefined}
                onClick={() => setTab(tb)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                  activeTab === tb ? 'bg-fuchsia-600 text-white' : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(`tabs.${tb}`)}
                {badge > 0 && (
                  <span className={`text-[10px] rounded-full px-1.5 ${activeTab === tb ? 'bg-white/25' : 'bg-secondary-200 dark:bg-secondary-700'}`}>{badge}</span>
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {toast &&
        createPortal(
          <div
            role="status"
            className={`fixed top-24 md:top-28 left-1/2 -translate-x-1/2 z-[300] max-w-[90vw] text-center text-sm px-4 py-2 rounded-full shadow-lg ${
              toast.tone === 'error' ? 'bg-red-600 text-white' : 'bg-secondary-900 text-white dark:bg-white dark:text-secondary-900'
            }`}
          >
            {toast.msg}
          </div>,
          document.body,
        )}

      <div id="pos-main" className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5">
        {activeTab === 'sale' && (
          <SaleView
            store={store}
            target={target}
            goTables={() => setTab('tables')}
            notify={notify}
            onCheckout={() => setCheckoutOpen(true)}
            onOpenShift={() => setShiftModal('open')}
            onCloseShift={() => setShiftModal('close')}
          />
        )}
        {activeTab === 'tables' && (
          <TablesPanel
            store={store}
            onPick={(tg) => {
              setTarget(tg);
              setTab('sale');
            }}
          />
        )}
        {activeTab === 'kds' && <KdsPanel store={store} now={now} />}
        {activeTab === 'reports' && (
          <ReportsPanel
            store={store}
            notify={notify}
            onView={setReceiptId}
            onClose={() => setShiftModal('close')}
            onOpen={() => setShiftModal('open')}
            onViewZ={setZView}
          />
        )}
        {activeTab === 'console' && <ConsolePanel store={store} notify={notify} />}
        {activeTab === 'staff' && <StaffPanel store={store} notify={notify} />}
      </div>

      {checkoutOpen && order && order.lines.length > 0 && (
        <CheckoutModal
          preset={preset}
          totals={totals}
          customer={customer}
          giftCards={data.giftCards}
          onCancel={() => setCheckoutOpen(false)}
          onConfirm={async (input) => {
            const sale = await store.checkout({ target, ...input });
            setCheckoutOpen(false);
            if (sale) {
              setReceiptId(sale.id);
              if (target !== 'counter') setTarget('counter');
            } else notify(t('errors.checkout'), 'error');
          }}
        />
      )}
      {receiptSale && (
        <ReceiptModal
          sale={receiptSale}
          preset={preset}
          customer={receiptSale.customerId ? data.customers.find((c) => c.id === receiptSale.customerId) : undefined}
          onClose={() => setReceiptId(null)}
          notify={notify}
        />
      )}
      {shiftModal === 'open' && (
        <OpenShiftModal
          preset={preset}
          sede={sede}
          staffIn={(id) => !!data.staff[id]?.clockedIn}
          onCancel={() => setShiftModal(null)}
          onConfirm={(base, cashierId) => {
            store.openShift(base, cashierId);
            setShiftModal(null);
            notify(t('shift.openedToast'));
          }}
        />
      )}
      {shiftModal === 'close' && shift.open && (
        <CloseShiftModal
          base={shift.base}
          netCash={shiftReport.netCash}
          salesCount={shiftReport.count}
          onCancel={() => setShiftModal(null)}
          onConfirm={(counted) => {
            const z = store.closeShift(counted);
            setShiftModal(null);
            if (z) setZView(z);
          }}
        />
      )}
      {zView && <ZReportModal closure={zView} preset={preset} onClose={() => setZView(null)} notify={notify} />}
    </div>
  );
}
