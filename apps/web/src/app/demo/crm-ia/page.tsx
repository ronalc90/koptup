'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ArrowPathIcon,
  BoltIcon,
  BriefcaseIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  InformationCircleIcon,
  PhoneIcon,
  SparklesIcon,
  Squares2X2Icon,
  TrophyIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import Card, { CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AssistantView from './components/AssistantView';
import CallsView from './components/CallsView';
import ContactsView from './components/ContactsView';
import Customer360Modal from './components/Customer360Modal';
import ForecastView from './components/ForecastView';
import NewDealModal from './components/NewDealModal';
import PipelineBoard from './components/PipelineBoard';
import SequencesView from './components/SequencesView';
import { LostReason, REF_DATE, StageId, computeMetrics } from './components/crm';
import { Modal, Toast, inputCls, labelCls } from './components/ui';
import { useCrmStore } from './components/useCrmStore';
import { useCrmText } from './components/useCrmText';

type TabId = 'pipeline' | 'contacts' | 'forecast' | 'assistant' | 'calls' | 'sequences';

const TABS: { id: TabId; icon: typeof ChartBarIcon }[] = [
  { id: 'pipeline', icon: Squares2X2Icon },
  { id: 'contacts', icon: UserGroupIcon },
  { id: 'forecast', icon: ChartBarIcon },
  { id: 'assistant', icon: SparklesIcon },
  { id: 'calls', icon: PhoneIcon },
  { id: 'sequences', icon: BoltIcon },
];

const LOST_REASONS: LostReason[] = ['price', 'competitor', 'timing', 'noResponse'];

export default function CrmAiDemoPage() {
  const tx = useCrmText();
  const { t } = tx;
  const store = useCrmStore();
  const { state } = store;

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

  const notify = useCallback((msg: string) => setToast(msg), []);
  const clearToast = useCallback(() => setToast(null), []);
  const metrics = useMemo(() => computeMetrics(state.deals), [state.deals]);
  const openDeal = state.deals.find((d) => d.id === openId) ?? null;
  const lostDeal = state.deals.find((d) => d.id === lostFor) ?? null;

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
    setTab('assistant');
    requestAnimationFrame(() => tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-secondary-50 dark:from-secondary-950 dark:via-black dark:to-secondary-950 py-8 sm:py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 sm:p-10 shadow-lg mb-4 text-center">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_30%,white,transparent_50%)]" aria-hidden="true" />
          <div className="relative">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-3 sm:mb-4">{t('pageTitle')}</h1>
            <p className="text-base sm:text-lg lg:text-xl text-indigo-100 max-w-3xl mx-auto px-2">{t('pageSubtitle')}</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-start gap-3 mb-6 sm:mb-8">
          <span
            className="self-start inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
            title={t('sampleBadgeHint', { date: tx.date(REF_DATE) })}
          >
            {t('sampleBadge')}
          </span>
          <details className="group flex-1 min-w-0 rounded-lg border border-secondary-200 dark:border-secondary-800 bg-white/70 dark:bg-secondary-900/70 px-3 py-2 text-sm">
            <summary className="cursor-pointer list-none flex items-center gap-2 font-medium text-secondary-800 dark:text-secondary-200">
              <InformationCircleIcon className="h-4 w-4 text-primary-600 dark:text-primary-400 flex-shrink-0" aria-hidden="true" />
              {t('howItWorks.title')}
              <span className="ml-auto text-xs text-secondary-500 group-open:hidden">{t('howItWorks.show')}</span>
              <span className="ml-auto text-xs text-secondary-500 hidden group-open:inline">{t('howItWorks.hide')}</span>
            </summary>
            <ul className="mt-2 space-y-1.5 text-secondary-700 dark:text-secondary-300 list-disc pl-5">
              <li>{t('sampleBadgeHint', { date: tx.date(REF_DATE) })}</li>
              <li>{t('howItWorks.real')}</li>
              <li>{t('howItWorks.simulated')}</li>
              <li>{t('howItWorks.project')}</li>
            </ul>
          </details>
          <div className="self-start flex flex-wrap items-center gap-2">
            {!confirmReset ? (
              <Button size="sm" variant="ghost" onClick={() => setConfirmReset(true)} className="gap-1.5">
                <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                {t('reset.button')}
              </Button>
            ) : (
              <div
                className="flex flex-wrap items-center gap-2 rounded-lg border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 px-3 py-1.5"
                role="alert"
              >
                <span className="text-xs text-secondary-700 dark:text-secondary-300">{t('reset.confirm')}</span>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    store.reset();
                    setConfirmReset(false);
                    setOpenId(null);
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

        {/* Métricas calculadas con los negocios del estado */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.label} variant="bordered">
                <CardContent className="p-4 sm:p-5">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${c.tone}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-0.5">{c.label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-secondary-900 dark:text-white">{c.value}</p>
                  <p className="text-xs text-secondary-500 mt-1">{c.sub}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pestañas */}
        <div ref={tabsRef} className="scroll-mt-24">
          <Card variant="elevated" className="shadow-xl overflow-hidden">
            <CardHeader>
              <div
                className="flex border-b border-secondary-200 dark:border-secondary-700 overflow-x-auto -mx-6 px-6"
                role="tablist"
                aria-label={t('tabs.label')}
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
                      onClick={() => setTab(id)}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
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
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              <div id="crm-tabpanel" role="tabpanel" aria-labelledby={`crm-tab-${tab}`}>
                {tab === 'pipeline' && (
                  <PipelineBoard deals={state.deals} onOpen={setOpenId} onMove={requestMove} onNew={() => setNewOpen(true)} />
                )}
                {tab === 'contacts' && <ContactsView deals={state.deals} onOpen={setOpenId} notify={notify} />}
                {tab === 'forecast' && <ForecastView deals={state.deals} onOpen={setOpenId} />}
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
                    onOpen={setOpenId}
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
                    onOpen={setOpenId}
                    notify={notify}
                  />
                )}
              </div>
            </CardContent>
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
            className={inputCls}
          >
            {LOST_REASONS.map((r) => (
              <option key={r} value={r}>
                {t(`lostReasons.${r}`)}
              </option>
            ))}
          </select>
        </Modal>
      )}

      <Toast message={toast} onDone={clearToast} />
    </div>
  );
}
