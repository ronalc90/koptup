'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  BoltIcon,
  BriefcaseIcon,
  CalculatorIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  InformationCircleIcon,
  PhoneIcon,
  PresentationChartBarIcon,
  SparklesIcon,
  Squares2X2Icon,
  TrophyIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AssistantView from './components/AssistantView';
import CallsView from './components/CallsView';
import ContactsView from './components/ContactsView';
import Customer360Modal from './components/Customer360Modal';
import ForecastView from './components/ForecastView';
import GettingStarted, { GuideStepId, QUOTE_HREF, REQUEST_DEMO_HREF } from './components/GettingStarted';
import NewDealModal from './components/NewDealModal';
import PipelineBoard from './components/PipelineBoard';
import SequencesView from './components/SequencesView';
import { LostReason, StageId, computeMetrics, isOpen } from './components/crm';
import { Modal, Toast, labelCls, selectCls, tabKeyDown } from './components/ui';
import { CrmStore, useCrmStore } from './components/useCrmStore';
import { CrmRefContext, useCrmText } from './components/useCrmText';

type TabId = 'pipeline' | 'contacts' | 'forecast' | 'assistant' | 'calls' | 'sequences';

const TABS: { id: TabId; icon: typeof ChartBarIcon }[] = [
  { id: 'pipeline', icon: Squares2X2Icon },
  { id: 'contacts', icon: UserGroupIcon },
  { id: 'forecast', icon: ChartBarIcon },
  { id: 'assistant', icon: SparklesIcon },
  { id: 'calls', icon: PhoneIcon },
  { id: 'sequences', icon: BoltIcon },
];
const TAB_IDS = TABS.map((x) => x.id);

const LOST_REASONS: LostReason[] = ['price', 'competitor', 'timing', 'noResponse'];

/** Negocio que usa el recorrido para abrir la ficha y el asistente (el lead caliente de los datos de ejemplo). */
const GUIDE_DEAL = 'd1';

export default function CrmAiDemoPage() {
  const store = useCrmStore();
  return (
    <CrmRefContext.Provider value={store.state.refDate}>
      <CrmDemo store={store} />
    </CrmRefContext.Provider>
  );
}

function CrmDemo({ store }: { store: CrmStore }) {
  const tx = useCrmText();
  const { t } = tx;
  const { state, hydrated } = store;

  const [tab, setTab] = useState<TabId>('pipeline');
  const [openId, setOpenId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [lostFor, setLostFor] = useState<string | null>(null);
  const [lostReason, setLostReason] = useState<LostReason>('price');
  const [toast, setToast] = useState<string | null>(null);
  const [assistantDeal, setAssistantDeal] = useState<string | null>(null);
  const [assistantKey, setAssistantKey] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const { markGuide } = store;

  const notify = useCallback((msg: string) => setToast(msg), []);
  const clearToast = useCallback(() => setToast(null), []);
  const metrics = useMemo(() => computeMetrics(state.deals, state.refDate), [state.deals, state.refDate]);
  const openDeal = state.deals.find((d) => d.id === openId) ?? null;
  const lostDeal = state.deals.find((d) => d.id === lostFor) ?? null;

  // Paso «Revisa el pronóstico» del recorrido: se marca al ver la pestaña.
  useEffect(() => {
    if (hydrated && tab === 'forecast') markGuide('forecast');
  }, [hydrated, tab, markGuide]);

  const openProfile = useCallback(
    (id: string) => {
      setOpenId(id);
      markGuide('opened');
    },
    [markGuide],
  );

  const scrollToTabs = () =>
    requestAnimationFrame(() => tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));

  const showTab = (id: TabId) => {
    setTab(id);
    scrollToTabs();
  };

  const requestMove = (id: string, stage: StageId) => {
    const d = state.deals.find((x) => x.id === id);
    if (!d || d.stage === stage) return;
    if (stage === 'lost') {
      setLostReason('price');
      setLostFor(id);
      return;
    }
    store.moveDeal(id, stage);
    notify(
      stage === 'won'
        ? t('pipeline.wonToast', { company: d.company, value: tx.moneyShort(d.value) })
        : t('pipeline.moved', { company: d.company, stage: t(`stages.${stage}`) }),
    );
  };

  const confirmLost = () => {
    if (!lostDeal) return;
    store.moveDeal(lostDeal.id, 'lost', lostReason);
    notify(t('pipeline.lostToast', { company: lostDeal.company, reason: t(`lostReasons.${lostReason}`) }));
    setLostFor(null);
  };

  const goToAssistant = (id: string) => {
    setAssistantDeal(id);
    setAssistantKey((k) => k + 1);
    setOpenId(null);
    showTab('assistant');
  };

  /** Negocio para los pasos del recorrido: el de ejemplo si sigue abierto; si no, el primero abierto. */
  const guideDeal = () => {
    const preferred = state.deals.find((d) => d.id === GUIDE_DEAL && isOpen(d));
    return preferred ?? state.deals.find(isOpen) ?? state.deals[0];
  };

  const onGuideAction = (step: GuideStepId) => {
    if (step === 'move') showTab('pipeline');
    else if (step === 'open') {
      const d = guideDeal();
      if (d) openProfile(d.id);
    } else if (step === 'draft') {
      const d = guideDeal();
      if (d) goToAssistant(d.id);
    } else if (step === 'forecast') showTab('forecast');
    else showTab('sequences');
  };

  const cards = [
    {
      icon: BriefcaseIcon,
      tone: 'text-primary-600 bg-primary-100 dark:bg-primary-950 dark:text-primary-400',
      label: t('metrics.openDeals'),
      value: String(metrics.openCount),
      sub: t('metrics.openDealsSub', { value: tx.moneyShort(metrics.openValue) }),
    },
    {
      icon: CurrencyDollarIcon,
      tone: 'text-green-600 bg-green-100 dark:bg-green-950 dark:text-green-400',
      label: t('metrics.weighted'),
      value: tx.moneyShort(metrics.weighted),
      sub: t('metrics.weightedSub'),
    },
    {
      icon: TrophyIcon,
      tone: 'text-amber-600 bg-amber-100 dark:bg-amber-950 dark:text-amber-400',
      label: t('metrics.winRate'),
      value: metrics.winRate === null ? '—' : tx.pct(metrics.winRate),
      sub:
        metrics.winRate === null
          ? t('metrics.winRateEmpty')
          : t('metrics.winRateSub', { won: metrics.won, total: metrics.closed }),
    },
    {
      icon: ClockIcon,
      tone: 'text-blue-600 bg-blue-100 dark:bg-blue-950 dark:text-blue-400',
      label: t('metrics.cycle'),
      value: metrics.cycle === null ? '—' : t('metrics.cycleValue', { days: metrics.cycle }),
      sub: t('metrics.cycleSub'),
    },
  ];

  const headerLink =
    'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/40 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-secondary-50 dark:from-secondary-950 dark:via-black dark:to-secondary-950 py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado: qué es, para quién, por dónde empezar y salidas */}
        <Link
          href="/demo"
          className="inline-flex items-center gap-1.5 mb-3 rounded-md text-sm font-medium text-secondary-700 hover:text-secondary-900 dark:text-secondary-300 dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          {t('header.back')}
        </Link>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 sm:p-8 shadow-lg mb-4 text-white">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_30%,white,transparent_50%)]" aria-hidden="true" />
          <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="min-w-0">
              <span
                title={t('sampleBadgeHint')}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/30 mb-3"
              >
                {t('sampleBadge')}
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">{t('pageTitle')}</h1>
              <p className="text-base sm:text-lg text-indigo-50/90 mt-2 max-w-3xl">{t('pageSubtitle')}</p>
              <p className="text-sm text-indigo-100/90 mt-2 max-w-3xl">{t('header.audience')}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Link href={REQUEST_DEMO_HREF} className={headerLink}>
                  <PresentationChartBarIcon className="h-4 w-4" aria-hidden="true" />
                  {t('header.requestDemo')}
                </Link>
                <Link href={QUOTE_HREF} className={headerLink}>
                  <CalculatorIcon className="h-4 w-4" aria-hidden="true" />
                  {t('header.quote')}
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-2 lg:items-end shrink-0">
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="self-start lg:self-end inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/20 border border-white/30 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ArrowPathIcon className="w-4 h-4" aria-hidden="true" />
                {t('reset.button')}
              </button>
              <p className="text-xs text-indigo-100/90 lg:text-right">
                {t('header.company', { name: t('data.seller') })}
                <br />
                <span className={hydrated ? '' : 'invisible'}>{t('header.asOf', { date: tx.date(state.refDate) })}</span>
              </p>
            </div>
          </div>
        </div>

        <details className="group mb-4 rounded-lg border border-secondary-200 dark:border-secondary-800 bg-white/70 dark:bg-secondary-900/70 px-3 py-2 text-sm">
          <summary className="cursor-pointer list-none flex items-center gap-2 font-medium text-secondary-800 dark:text-secondary-200 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
            <InformationCircleIcon className="h-4 w-4 text-primary-600 dark:text-primary-400 flex-shrink-0" aria-hidden="true" />
            {t('howItWorks.title')}
            <span className="ml-auto text-xs text-secondary-500 group-open:hidden">{t('howItWorks.show')}</span>
            <span className="ml-auto text-xs text-secondary-500 hidden group-open:inline">{t('howItWorks.hide')}</span>
          </summary>
          <ul className="mt-2 space-y-1.5 text-secondary-700 dark:text-secondary-300 list-disc pl-5">
            <li>{t('sampleBadgeHint')}</li>
            <li>{t('howItWorks.real')}</li>
            <li>{t('howItWorks.dates')}</li>
            <li>{t('howItWorks.simulated')}</li>
            <li>{t('howItWorks.project')}</li>
          </ul>
        </details>

        <GettingStarted events={state.events} flags={state.guide} onAction={onGuideAction} />

        {/* Métricas calculadas con los negocios del estado */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6" aria-busy={!hydrated}>
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.label} variant="bordered" padding="none" className="p-4 sm:p-5">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${c.tone}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <p className="text-xs sm:text-sm text-secondary-600 dark:text-secondary-400 leading-tight">{c.label}</p>
                </div>
                <p className={`text-xl sm:text-2xl font-bold text-secondary-900 dark:text-white ${hydrated ? '' : 'invisible'}`}>{c.value}</p>
                <p className={`text-xs text-secondary-500 mt-1 ${hydrated ? '' : 'invisible'}`}>{c.sub}</p>
              </Card>
            );
          })}
        </div>

        {/* Pestañas */}
        <div ref={tabsRef} className="scroll-mt-24">
          <Card variant="elevated" padding="none" className="shadow-xl overflow-hidden">
            <div
              className="flex border-b border-secondary-200 dark:border-secondary-700 overflow-x-auto px-2 sm:px-4"
              role="tablist"
              aria-label={t('tabs.label')}
              onKeyDown={(e) => tabKeyDown(e, TAB_IDS, tab, setTab)}
            >
              {TABS.map(({ id, icon: Icon }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    id={`crm-tab-${id}`}
                    aria-selected={active}
                    aria-controls="crm-tabpanel"
                    tabIndex={active ? 0 : -1}
                    onClick={() => setTab(id)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 font-medium transition-colors border-b-2 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 ${
                      active
                        ? 'border-primary-600 text-primary-700 dark:text-primary-300'
                        : 'border-transparent text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                    <span className="text-sm sm:text-base">{t(`tabs.${id}`)}</span>
                  </button>
                );
              })}
            </div>

            <div id="crm-tabpanel" role="tabpanel" aria-labelledby={`crm-tab-${tab}`} aria-busy={!hydrated} className="p-4 sm:p-6">
              {!hydrated ? (
                <div className="space-y-3 animate-pulse" aria-hidden="true">
                  <div className="h-6 w-48 rounded bg-secondary-100 dark:bg-secondary-800" />
                  <div className="h-4 w-full max-w-xl rounded bg-secondary-100 dark:bg-secondary-800" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="h-40 rounded-xl bg-secondary-100 dark:bg-secondary-800" />
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {tab === 'pipeline' && (
                    <PipelineBoard deals={state.deals} onOpen={openProfile} onMove={requestMove} onNew={() => setNewOpen(true)} />
                  )}
                  {tab === 'contacts' && <ContactsView deals={state.deals} onOpen={openProfile} notify={notify} />}
                  {tab === 'forecast' && <ForecastView deals={state.deals} onOpen={openProfile} />}
                  {tab === 'assistant' && (
                    <AssistantView
                      key={assistantKey}
                      deals={state.deals}
                      events={state.events}
                      initialDealId={assistantDeal}
                      onSent={(dealId, channel, preview) => {
                        store.registerSent(dealId, channel, preview);
                        const d = state.deals.find((x) => x.id === dealId);
                        notify(t('assistant.sentToast', { name: d?.contactName ?? '' }));
                      }}
                    />
                  )}
                  {tab === 'calls' && (
                    <CallsView
                      deals={state.deals}
                      doneActions={state.doneActions}
                      onToggleAction={store.toggleAction}
                      onOpen={openProfile}
                    />
                  )}
                  {tab === 'sequences' && (
                    <SequencesView
                      deals={state.deals}
                      enrollments={state.enrollments}
                      onEnroll={store.enroll}
                      onRunStep={store.runStep}
                      onStatus={store.setEnrollmentStatus}
                      onRemove={(id) => {
                        store.unenroll(id);
                        const d = state.deals.find((x) => x.id === id);
                        notify(t('sequences.removedToast', { company: d?.company ?? '' }));
                      }}
                      onOpen={openProfile}
                      notify={notify}
                    />
                  )}
                </>
              )}
            </div>
          </Card>
        </div>
      </div>

      {openDeal && (
        <Customer360Modal
          key={openDeal.id}
          deal={openDeal}
          events={state.events}
          onClose={() => setOpenId(null)}
          onMove={requestMove}
          onLog={store.logActivity}
          onUpdate={store.updateDeal}
          onDelete={(id) => {
            const d = state.deals.find((x) => x.id === id);
            store.deleteDeal(id);
            setOpenId(null);
            notify(t('customer360.deleted', { company: d?.company ?? '' }));
          }}
          onDraft={goToAssistant}
          notify={notify}
        />
      )}

      {newOpen && (
        <NewDealModal
          onClose={() => setNewOpen(false)}
          onCreate={(input) => {
            store.addDeal(input);
            setNewOpen(false);
            notify(t('newDeal.created', { company: input.company, stage: t(`stages.${input.stage}`) }));
          }}
        />
      )}

      {lostDeal && (
        <Modal
          labelId="crm-lost-title"
          title={t('pipeline.lostTitle', { company: lostDeal.company })}
          subtitle={t('pipeline.lostText')}
          onClose={() => setLostFor(null)}
          closeLabel={t('common.close')}
          footer={
            <>
              <Button variant="ghost" onClick={() => setLostFor(null)}>
                {t('common.cancel')}
              </Button>
              <Button variant="danger" onClick={confirmLost}>
                {t('pipeline.lostConfirm')}
              </Button>
            </>
          }
        >
          <label htmlFor="crm-lost-reason" className={labelCls}>
            {t('pipeline.lostReason')}
          </label>
          <select
            id="crm-lost-reason"
            value={lostReason}
            onChange={(e) => setLostReason(e.target.value as LostReason)}
            className={selectCls}
          >
            {LOST_REASONS.map((r) => (
              <option key={r} value={r}>
                {t(`lostReasons.${r}`)}
              </option>
            ))}
          </select>
        </Modal>
      )}

      {confirmReset && (
        <Modal
          labelId="crm-reset-title"
          title={t('reset.title')}
          onClose={() => setConfirmReset(false)}
          closeLabel={t('common.close')}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  store.reset();
                  setConfirmReset(false);
                  setOpenId(null);
                  setTab('pipeline');
                  notify(t('reset.done'));
                }}
              >
                {t('reset.yes')}
              </Button>
            </>
          }
        >
          <p className="text-sm text-secondary-700 dark:text-secondary-300">{t('reset.confirm')}</p>
        </Modal>
      )}

      <Toast message={toast} onDone={clearToast} />
    </div>
  );
}
