'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import {
  ArrowLeftIcon,
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
  LockClosedIcon,
  PresentationChartBarIcon,
  CalculatorIcon,
  BeakerIcon,
  CircleStackIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { POINTS, PRESETS, type PresetId } from './components/data';
import { computeTotals, lineAmount } from './components/engine';
import { orderKey, usePosStore, type Closure } from './components/usePosStore';
import { OPEN_SCAN_EVENT, SaleView } from './components/SaleView';
import { TablesPanel, KdsPanel, StaffPanel } from './components/PosTabs';
import { ReportsPanel } from './components/ReportsPanel';
import { ConsolePanel } from './components/ConsolePanel';
import { CheckoutModal, CloseShiftModal, OpenShiftModal, ReceiptModal, ZReportModal } from './components/PosModals';
import { PRINT_CSS, employeeName, selectCls, shortName } from './components/ui';
import { buildReport } from './components/engine';

type Tab = 'sale' | 'tables' | 'kds' | 'reports' | 'console' | 'staff';

/** Salidas comerciales: demo guiada con esta demo ya elegida y cotización del producto del catálogo. */
const GUIDED_DEMO_HREF = '/solicitar-demo?demos=pos';
const QUOTE_HREF = '/contact?service=pos-retail';
/** Preferencia de este navegador: «Primeros pasos» oculto. */
const GUIDE_KEY = 'koptup-demo-pos:guide-hidden';

type StepId = 's1' | 's2' | 's3' | 's4' | 's5';
/** Primeros pasos: cada uno lleva a su lugar de la demo y se marca solo cuando lo haces. */
const STEPS: { k: StepId; preset?: PresetId; tab: Tab }[] = [
  { k: 's1', preset: 'retail', tab: 'sale' },
  { k: 's2', preset: 'retail', tab: 'sale' },
  { k: 's3', tab: 'sale' },
  { k: 's4', preset: 'restaurant', tab: 'tables' },
  { k: 's5', tab: 'reports' },
];
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
  const [guideOpen, setGuideOpen] = useState(true);
  const toastTimer = useRef<number | null>(null);
  /** Pestaña elegida con un clic: la nueva se muestra desde su inicio, bajo la barra fija de la caja. */
  const [tabPick, setTabPick] = useState(0);
  const pickTab = (tb: Tab) => {
    setTab(tb);
    setTabPick((n) => n + 1);
  };
  useEffect(() => {
    if (!tabPick) return;
    const main = document.getElementById('pos-main');
    const bar = document.getElementById('pos-toolbar');
    if (!main || !bar) return;
    const style = getComputedStyle(bar);
    if (style.position !== 'sticky') return;
    // Se mide con la posición fija de la barra (al final de la página la barra sube con su contenedor).
    const gap = main.getBoundingClientRect().top - ((parseFloat(style.top) || 0) + bar.offsetHeight);
    if (gap < 0) window.scrollBy({ top: gap });
  }, [tabPick]);

  // Se lee después de montar para que el primer render sea igual en el servidor y en el navegador.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(GUIDE_KEY) === '1') setGuideOpen(false);
    } catch {
      /* sin almacenamiento: los pasos quedan a la vista */
    }
  }, []);

  const toggleGuide = () => {
    const next = !guideOpen;
    setGuideOpen(next);
    try {
      window.localStorage.setItem(GUIDE_KEY, next ? '0' : '1');
    } catch {
      /* sin almacenamiento: solo cambia en esta visita */
    }
  };

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

  // Lo guardado era de otro día: se avisa que la demo volvió a los datos de ejemplo de hoy.
  const { newDay } = store;
  useEffect(() => {
    if (newDay) notify(t('toasts.newDay'));
  }, [newDay, notify, t]);

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

  // Progreso de los primeros pasos (se calcula con lo que ya hiciste en la demo).
  const allSales = [...state.data.retail.sales, ...state.data.restaurant.sales];
  const tour = state.tour ?? {};
  const stepDone: Record<StepId, boolean> = {
    s1: !!tour.scan && !!tour.weigh,
    s2: allSales.some((x) => new Set(x.payments.map((pay) => pay.method)).size >= 2),
    s3: !!tour.synced,
    s4: !!tour.kitchen,
    s5: state.data.retail.closures.length + state.data.restaurant.closures.length > 0,
  };
  const doneCount = STEPS.filter((x) => stepDone[x.k]).length;

  // Ir a un paso: cambia de negocio y pestaña y, ya pintado, lleva la vista (y el foco) a su lugar.
  const [stepGo, setStepGo] = useState<{ k: StepId; n: number } | null>(null);
  const goStep = (k: StepId) => {
    const step = STEPS.find((x) => x.k === k);
    if (!step) return;
    if (step.preset && step.preset !== preset) switchPreset(step.preset);
    setTab(step.tab);
    setStepGo((g) => ({ k, n: (g?.n ?? 0) + 1 }));
  };
  useEffect(() => {
    if (!stepGo) return;
    const focusOn = (id: string) => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.focus({ preventScroll: true });
    };
    if (stepGo.k === 's1') window.dispatchEvent(new Event(OPEN_SCAN_EVENT));
    // Si el ticket ya tiene cliente, no hay campo de búsqueda: se lleva la vista al ticket.
    else if (stepGo.k === 's2') focusOn(document.getElementById('pos-customer-lookup') ? 'pos-customer-lookup' : 'pos-ticket');
    else if (stepGo.k === 's3') focusOn('pos-net');
    else document.getElementById('pos-toolbar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [stepGo]);

  const toggleNet = () => {
    const goingOffline = !state.offline;
    store.toggleOffline();
    notify(goingOffline ? t('toolbar.offlineToast') : store.queuedCount > 0 ? t('toolbar.onlineSyncToast', { n: store.queuedCount }) : t('toolbar.onlineToast'));
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      <style>{PRINT_CSS}</style>

      {/* Encabezado: qué es, para quién, salidas al catálogo y comerciales */}
      <section className="bg-gradient-to-br from-fuchsia-600 to-fuchsia-800 text-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-fuchsia-50 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" /> {t('header.back')}
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" className="bg-white text-fuchsia-800 border-white hover:bg-fuchsia-50 gap-1.5" asChild>
                <Link href={GUIDED_DEMO_HREF}>
                  <PresentationChartBarIcon className="h-4 w-4" aria-hidden="true" />
                  {t('header.guidedDemo')}
                </Link>
              </Button>
              <Button size="sm" variant="outline" className="bg-transparent text-white border-white/60 hover:bg-white/10 gap-1.5" asChild>
                <Link href={QUOTE_HREF}>
                  <CalculatorIcon className="h-4 w-4" aria-hidden="true" />
                  {t('header.quote')}
                </Link>
              </Button>
              {!confirmReset ? (
                <Button size="sm" variant="ghost" onClick={() => setConfirmReset(true)} className="gap-1.5 text-fuchsia-50 hover:text-white hover:bg-white/10" title={t('reset.hint')}>
                  <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                  {t('reset.button')}
                </Button>
              ) : (
                <div role="group" aria-label={t('reset.button')} className="flex flex-wrap items-center gap-2 rounded-lg bg-white/15 px-2.5 py-1">
                  <span className="text-xs text-white">{t('reset.confirm')}</span>
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
                  <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={() => setConfirmReset(false)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-white/15 shrink-0" aria-hidden="true">
              <BuildingStorefrontIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-fuchsia-100">{t('header.kicker')}</p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">{t('pageTitle')}</h1>
              <p className="text-sm text-fuchsia-50/90 mt-1 max-w-4xl">{t('pageSubtitle')}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2.5 py-0.5 text-xs" title={t('sampleHint')}>
              <BeakerIcon className="h-3.5 w-3.5" aria-hidden="true" /> {t('sampleBadge')}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2.5 py-0.5 text-xs">
              <InformationCircleIcon className="h-3.5 w-3.5" aria-hidden="true" /> {t('header.simBadge')}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2.5 py-0.5 text-xs">
              <CircleStackIcon className="h-3.5 w-3.5" aria-hidden="true" /> {t('header.localBadge')}
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 space-y-3">
        {/* Primeros pasos */}
        <section aria-labelledby="pos-guide-title" className="rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white/80 dark:bg-secondary-900/70 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="pos-guide-title" className="text-sm font-semibold text-secondary-900 dark:text-white">
              {t('guide.title')} <span className="font-normal text-secondary-500 dark:text-secondary-400">· {t('guide.progress', { done: doneCount, total: STEPS.length })}</span>
            </h2>
            <button
              type="button"
              onClick={toggleGuide}
              aria-expanded={guideOpen}
              aria-controls="pos-guide-steps"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-700 dark:text-primary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {guideOpen ? t('guide.hide') : t('guide.show')}
              <ChevronDownIcon className={`h-4 w-4 transition-transform ${guideOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          </div>
          {guideOpen && (
            <>
              <p className="mt-1 text-xs text-secondary-600 dark:text-secondary-300">{t('guide.intro')}</p>
              {/* En el celular los pasos se desplazan de lado para no empujar la caja hacia abajo. */}
              <ol id="pos-guide-steps" className="mt-3 -mx-1 px-1 pb-1 flex gap-2 overflow-x-auto snap-x snap-mandatory sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-5 sm:overflow-visible">
                {STEPS.map((step, i) => {
                  const done = stepDone[step.k];
                  return (
                    <li key={step.k} className="min-w-0 shrink-0 w-[80%] snap-start sm:w-auto">
                      <button
                        type="button"
                        onClick={() => goStep(step.k)}
                        className={`h-full w-full text-left rounded-lg border p-2.5 transition-colors hover:border-fuchsia-400 dark:hover:border-fuchsia-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 ${
                          done ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-900/20' : 'border-secondary-200 dark:border-secondary-700'
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wide text-fuchsia-700 dark:text-fuchsia-300">
                          <span>{t('guide.step', { n: i + 1 })} · {t(`guide.steps.${step.k}.title`)}</span>
                          {done && (
                            <span className="inline-flex items-center gap-0.5 normal-case tracking-normal text-emerald-700 dark:text-emerald-300">
                              <CheckCircleIcon className="h-3.5 w-3.5" aria-hidden="true" /> {t('guide.done')}
                            </span>
                          )}
                        </span>
                        <span className="block text-xs text-secondary-700 dark:text-secondary-200 mt-0.5">{t(`guide.steps.${step.k}.text`)}</span>
                        <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary-700 dark:text-primary-300">
                          {t(`guide.steps.${step.k}.go`)} <ArrowRightIcon className="h-3 w-3" aria-hidden="true" />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </section>

        <details className="group rounded-lg border border-secondary-200 dark:border-secondary-800 bg-white/70 dark:bg-secondary-900/70 px-3 py-2 text-sm">
          <summary className="cursor-pointer list-none flex items-center gap-2 font-medium text-secondary-800 dark:text-secondary-200 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
            <InformationCircleIcon className="h-4 w-4 text-primary-600 dark:text-primary-400 shrink-0" aria-hidden="true" />
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
      </div>

      {/* Barra de la caja */}
      <div id="pos-toolbar" className="relative sm:sticky sm:top-16 md:top-20 z-30 mt-3 bg-white dark:bg-secondary-900 border-y border-secondary-200 dark:border-secondary-800">
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
            id="pos-net"
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
                onClick={() => pickTab(tb)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                  activeTab === tb ? 'bg-fuchsia-600 text-white' : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(`tabs.${tb}`)}
                {badge > 0 && (
                  <>
                    <span aria-hidden="true" title={t(`tabs.badge.${tb === 'kds' ? 'kds' : 'tables'}`, { n: badge })} className={`text-[10px] rounded-full px-1.5 ${activeTab === tb ? 'bg-white/25' : 'bg-secondary-200 dark:bg-secondary-700'}`}>
                      {badge}
                    </span>
                    <span className="sr-only">({t(`tabs.badge.${tb === 'kds' ? 'kds' : 'tables'}`, { n: badge })})</span>
                  </>
                )}
              </button>
            );
          })}
        </nav>
      </div>

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
            key={preset}
            store={store}
            target={target}
            goTables={() => pickTab('tables')}
            notify={notify}
            onCheckout={() => {
              setToast(null);
              setCheckoutOpen(true);
            }}
            onOpenShift={() => setShiftModal('open')}
            onCloseShift={() => setShiftModal('close')}
          />
        )}
        {activeTab === 'tables' && (
          <TablesPanel
            store={store}
            onPick={(tg) => {
              setTarget(tg);
              pickTab('sale');
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
        {activeTab === 'console' && <ConsolePanel key={preset} store={store} notify={notify} />}
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
