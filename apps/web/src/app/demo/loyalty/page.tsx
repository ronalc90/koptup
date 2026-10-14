'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  BeakerIcon,
  CalculatorIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  DevicePhoneMobileIcon,
  InformationCircleIcon,
  PresentationChartBarIcon,
  ShoppingCartIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import AdminView, { type AdminTab } from './components/AdminView';
import AnalyticsView from './components/AnalyticsView';
import CashierView, { PREFILL_SALE_EVENT, type PrefillSale } from './components/CashierView';
import MemberView from './components/MemberView';
import { CLUB, type Segment } from './components/data';
import { tierIndex } from './components/engine';
import { LoyaltyProvider, useLoyalty, useLoyaltyStatus } from './components/store';
import { ToastProvider, focusRing, useToast } from './components/ui';

type MainTab = 'cashier' | 'member' | 'config' | 'results';
const TABS: MainTab[] = ['cashier', 'member', 'config', 'results'];
const TAB_ICON = { cashier: ShoppingCartIcon, member: DevicePhoneMobileIcon, config: Cog6ToothIcon, results: ChartBarIcon } as const;

/** Salidas comerciales: demo guiada con esta demo ya elegida y cotización del producto del catálogo. */
const GUIDED_DEMO_HREF = '/solicitar-demo?demos=loyalty';
const QUOTE_HREF = '/contact?service=loyalty-fidelizacion';
/** Preferencia de este navegador: «Primeros pasos» oculto. */
const GUIDE_KEY = 'koptup-demo-loyalty:guide-hidden';

type StepId = 's1' | 's2' | 's3' | 's4' | 's5';
const STEPS: { k: StepId; tab: MainTab }[] = [
  { k: 's1', tab: 'cashier' },
  { k: 's2', tab: 'cashier' },
  { k: 's3', tab: 'member' },
  { k: 's4', tab: 'config' },
  { k: 's5', tab: 'results' },
];

export default function LoyaltyDemoPage() {
  return (
    <ToastProvider>
      <LoyaltyProvider>
        <LoyaltyDemo />
      </LoyaltyProvider>
    </ToastProvider>
  );
}

function LoyaltyDemo() {
  const t = useTranslations('demoLoyalty');
  const { ready } = useLoyaltyStatus();

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      {/* Encabezado: qué es, para quién, salidas al catálogo y comerciales */}
      <section className="bg-gradient-to-br from-amber-600 to-orange-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-amber-50 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" /> {t('header.back')}
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" className="bg-white text-orange-800 border-white hover:bg-amber-50 gap-1.5" asChild>
                <Link href={GUIDED_DEMO_HREF}>
                  <PresentationChartBarIcon className="h-4 w-4" aria-hidden="true" />
                  {t('header.guidedDemo')}
                </Link>
              </Button>
              <Button size="sm" variant="outline" className="bg-transparent text-white border-white/70 hover:bg-white/10 gap-1.5" asChild>
                <Link href={QUOTE_HREF}>
                  <CalculatorIcon className="h-4 w-4" aria-hidden="true" />
                  {t('header.quote')}
                </Link>
              </Button>
              {ready && <ResetControl />}
            </div>
          </div>
          <div className="mt-3 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-white/15 shrink-0" aria-hidden="true">
              <SparklesIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-100">{t('header.kicker')}</p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">{t('pageTitle')}</h1>
              <p className="text-sm text-amber-50 mt-1 max-w-4xl">{t('pageSubtitle')}</p>
              <p className="text-sm text-amber-50 mt-1 max-w-4xl">
                <span className="font-semibold text-white">{t('header.forWhomLabel')}</span> {t('header.forWhom')}
              </p>
              <p className="text-xs text-amber-100 mt-1">{t('pageBrand', { club: CLUB.club, brand: CLUB.brand })}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/10 px-2.5 py-0.5 text-xs" title={t('sampleHint', { club: CLUB.club, brand: CLUB.brand, nit: CLUB.nit })}>
              <BeakerIcon className="h-3.5 w-3.5" aria-hidden="true" /> {t('sampleBadge')}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/10 px-2.5 py-0.5 text-xs">
              <InformationCircleIcon className="h-3.5 w-3.5" aria-hidden="true" /> {t('header.simBadge')}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/10 px-2.5 py-0.5 text-xs">
              <CircleStackIcon className="h-3.5 w-3.5" aria-hidden="true" /> {t('header.localBadge')}
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">{ready ? <DemoBody /> : <Loading />}</div>
    </div>
  );
}

function Loading() {
  const t = useTranslations('demoLoyalty');
  return (
    <p role="status" className="py-16 text-center text-sm text-secondary-500 dark:text-secondary-400">
      {t('header.loading')}
    </p>
  );
}

/** «Restablecer datos» con confirmación en línea (Escape la cancela). */
function ResetControl() {
  const t = useTranslations('demoLoyalty');
  const notify = useToast();
  const store = useLoyalty();
  const [confirm, setConfirm] = useState(false);
  const openerRef = useRef<HTMLButtonElement>(null);
  const yesRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirm) yesRef.current?.focus();
  }, [confirm]);

  const close = () => {
    setConfirm(false);
    requestAnimationFrame(() => openerRef.current?.focus());
  };

  if (!confirm) {
    return (
      <Button ref={openerRef} size="sm" variant="ghost" onClick={() => setConfirm(true)} className="gap-1.5 text-amber-50 hover:text-white hover:bg-white/10" title={t('reset.hint')}>
        <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
        {t('reset.button')}
      </Button>
    );
  }
  return (
    <div
      role="group"
      aria-label={t('reset.button')}
      className="flex flex-wrap items-center gap-2 rounded-lg bg-white/15 px-2.5 py-1"
      onKeyDown={(e) => {
        if (e.key === 'Escape') close();
      }}
    >
      <span className="text-xs text-white">{t('reset.confirm')}</span>
      <Button
        ref={yesRef}
        size="sm"
        variant="danger"
        onClick={() => {
          store.reset();
          window.dispatchEvent(new Event(RESET_EVENT));
          close();
          notify(t('reset.done'));
        }}
      >
        {t('reset.yes')}
      </Button>
      <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={close}>
        {t('common.cancel')}
      </Button>
    </div>
  );
}

/** Al restablecer, la demo vuelve a la Caja y a la primera subpestaña de Configuración. */
const RESET_EVENT = 'ly:reset';

function DemoBody() {
  const t = useTranslations('demoLoyalty');
  const store = useLoyalty();
  const { notice, dismissNotice } = useLoyaltyStatus();
  const { state } = store;
  const [tab, setTab] = useState<MainTab>('cashier');
  const [adminSub, setAdminSub] = useState<AdminTab>('points');
  const [prefill, setPrefill] = useState<Segment | null>(null);
  const [guideOpen, setGuideOpen] = useState(true);
  const [stepGo, setStepGo] = useState<{ k: StepId; n: number } | null>(null);
  const tabRefs = useRef<Record<MainTab, HTMLButtonElement | null>>({ cashier: null, member: null, config: null, results: null });

  // Preferencia guardada en este navegador (se lee después de montar).
  useEffect(() => {
    try {
      if (window.localStorage.getItem(GUIDE_KEY) === '1') setGuideOpen(false);
    } catch {
      /* sin almacenamiento: los pasos quedan a la vista */
    }
  }, []);

  useEffect(() => {
    const onReset = () => {
      setTab('cashier');
      setAdminSub('points');
      setPrefill(null);
    };
    window.addEventListener(RESET_EVENT, onReset);
    return () => window.removeEventListener(RESET_EVENT, onReset);
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

  const go = (k: MainTab) => {
    setTab(k);
    document.getElementById('ly-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const clearPrefill = useCallback(() => setPrefill(null), []);

  // Avance de los primeros pasos: sale de lo que ya hiciste en la demo.
  const stepDone: Record<StepId, boolean> = {
    s1: state.sales.some((s) => !s.reversed),
    s2: state.sales.some((s) => !s.reversed && tierIndex(s.tierAfter) > tierIndex(s.tierBefore)),
    s3: state.coupons.some((c) => c.kind === 'reward'),
    s4: !!state.tour.ruleChanged,
    s5: state.campaigns.some((c) => c.session),
  };
  const doneCount = STEPS.filter((x) => stepDone[x.k]).length;

  const goStep = (k: StepId) => {
    const step = STEPS.find((x) => x.k === k);
    if (!step) return;
    if (step.k === 's1' || step.k === 's2') store.setActiveMember('m-laura');
    if (step.k === 's4') setAdminSub('points');
    setTab(step.tab);
    setStepGo((g) => ({ k, n: (g?.n ?? 0) + 1 }));
  };

  // Ya pintada la pestaña: deja lista la acción del paso y lleva la vista (y el foco) a su lugar.
  useEffect(() => {
    if (!stepGo) return;
    const focusOn = (id: string, block: ScrollLogicalPosition = 'center') => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: 'smooth', block });
      if (el && el.tabIndex < 0 && !/^(BUTTON|INPUT|SELECT|TEXTAREA|A)$/.test(el.tagName)) el.setAttribute('tabindex', '-1');
      el?.focus({ preventScroll: true });
    };
    if (stepGo.k === 's1') {
      window.dispatchEvent(new CustomEvent<PrefillSale>(PREFILL_SALE_EVENT, { detail: { lines: [{ category: 'personalCare', amount: 185000 }] } }));
      focusOn('ly-submit-sale');
    } else if (stepGo.k === 's2') {
      window.dispatchEvent(new CustomEvent<PrefillSale>(PREFILL_SALE_EVENT, { detail: { lines: [{ category: 'dermo', amount: 420000 }] } }));
      focusOn('ly-submit-sale');
    } else if (stepGo.k === 's3') focusOn('ly-rewards', 'start');
    else if (stepGo.k === 's4') focusOn('cf-day-mult');
    else focusOn('ly-segments', 'start');
  }, [stepGo]);

  // Pestañas con flechas, Inicio y Fin.
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, k: MainTab) => {
    const i = TABS.indexOf(k);
    let next: MainTab | null = null;
    if (e.key === 'ArrowRight') next = TABS[(i + 1) % TABS.length];
    if (e.key === 'ArrowLeft') next = TABS[(i - 1 + TABS.length) % TABS.length];
    if (e.key === 'Home') next = TABS[0];
    if (e.key === 'End') next = TABS[TABS.length - 1];
    if (!next) return;
    e.preventDefault();
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="space-y-4">
      {notice && (
        <div role="status" className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <InformationCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="flex-1">{t(`notice.${notice}`)}</span>
          <button type="button" onClick={dismissNotice} aria-label={t('common.close')} className={`p-1 -m-1 rounded ${focusRing}`}>
            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Primeros pasos */}
      <section aria-labelledby="ly-guide-title" className="rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white/80 dark:bg-secondary-900/70 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="ly-guide-title" className="text-sm font-semibold text-secondary-900 dark:text-white">
            {t('guide.title')}{' '}
            <span className="font-normal text-secondary-500 dark:text-secondary-400">· {t('guide.progress', { done: doneCount, total: STEPS.length })}</span>
          </h2>
          <button
            type="button"
            onClick={toggleGuide}
            aria-expanded={guideOpen}
            aria-controls="ly-guide-steps"
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-700 dark:text-primary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800 ${focusRing}`}
          >
            {guideOpen ? t('guide.hide') : t('guide.show')}
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${guideOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
        </div>
        {guideOpen && (
          <div id="ly-guide-steps">
            <p className="mt-1 text-xs text-secondary-600 dark:text-secondary-300">{t('guide.intro')}</p>
            {/* En el celular los pasos se desplazan de lado para no empujar la demo hacia abajo. */}
            <ol className="mt-3 -mx-1 px-1 pb-1 flex gap-2 overflow-x-auto snap-x snap-mandatory sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-5 sm:overflow-visible">
              {STEPS.map((step, i) => {
                const done = stepDone[step.k];
                return (
                  <li key={step.k} className="min-w-0 shrink-0 w-[80%] snap-start sm:w-auto">
                    <button
                      type="button"
                      onClick={() => goStep(step.k)}
                      className={`h-full w-full text-left rounded-lg border p-2.5 transition-colors hover:border-amber-400 dark:hover:border-amber-500 ${focusRing} ${
                        done ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-900/20' : 'border-secondary-200 dark:border-secondary-700'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                        <span>
                          {t('guide.step', { n: i + 1 })} · {t(`guide.steps.${step.k}.title`)}
                        </span>
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
            {doneCount === STEPS.length && (
              <p className="mt-3 text-sm text-emerald-800 dark:text-emerald-200">
                {t('guide.finished')}{' '}
                <Link href={GUIDED_DEMO_HREF} className={`font-semibold underline rounded ${focusRing}`}>
                  {t('header.guidedDemo')}
                </Link>
              </p>
            )}
          </div>
        )}
      </section>

      <details className="group rounded-lg border border-secondary-200 dark:border-secondary-800 bg-white/70 dark:bg-secondary-900/70 px-3 py-2 text-sm">
        <summary className={`cursor-pointer list-none flex items-center gap-2 font-medium text-secondary-800 dark:text-secondary-200 rounded ${focusRing}`}>
          <InformationCircleIcon className="h-4 w-4 text-primary-600 dark:text-primary-400 shrink-0" aria-hidden="true" />
          {t('howItWorks.title')}
          <span className="ml-auto text-xs text-secondary-500 group-open:hidden">{t('common.show')}</span>
          <span className="ml-auto text-xs text-secondary-500 hidden group-open:inline">{t('common.hide')}</span>
        </summary>
        <ul className="mt-2 space-y-1.5 text-secondary-700 dark:text-secondary-300 list-disc pl-5">
          <li>{t('sampleHint', { club: CLUB.club, brand: CLUB.brand, nit: CLUB.nit })}</li>
          <li>{t('howItWorks.real')}</li>
          <li>{t('howItWorks.simulated')}</li>
          <li>{t('howItWorks.dates')}</li>
          <li>{t('howItWorks.project')}</li>
        </ul>
      </details>

      <div
        id="ly-tabs"
        className="grid grid-cols-4 sm:flex gap-1 sm:gap-2 border-b border-secondary-200 dark:border-secondary-800 scroll-mt-24"
        role="tablist"
        aria-label={t('tabs.label')}
      >
        {TABS.map((k) => {
          const Icon = TAB_ICON[k];
          const active = tab === k;
          return (
            <button
              key={k}
              ref={(el) => {
                tabRefs.current[k] = el;
              }}
              id={`ly-tab-${k}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls="ly-panel"
              tabIndex={active ? 0 : -1}
              onClick={() => go(k)}
              onKeyDown={(e) => onTabKey(e, k)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1 sm:px-4 py-2 sm:py-3 text-[11px] leading-tight sm:text-sm font-medium border-b-2 transition-colors text-center rounded-t ${focusRing} ${
                active ? 'border-amber-600 text-amber-700 dark:text-amber-300' : 'border-transparent text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {t(`tabs.${k}`)}
            </button>
          );
        })}
      </div>

      <div id="ly-panel" data-testid="ly-content" role="tabpanel" aria-labelledby={`ly-tab-${tab}`} className="pt-2">
        {tab === 'cashier' && <CashierView onOpenMember={() => go('member')} />}
        {tab === 'member' && <MemberView />}
        {tab === 'config' && <AdminView sub={adminSub} onSub={setAdminSub} prefillSegment={prefill} onPrefillUsed={clearPrefill} />}
        {tab === 'results' && (
          <AnalyticsView
            onCreateCampaign={(s) => {
              setPrefill(s);
              setAdminSub('campaigns');
              setTab('config');
            }}
          />
        )}
      </div>
    </div>
  );
}
