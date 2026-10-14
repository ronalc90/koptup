'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CalculatorIcon,
  ClockIcon,
  ForwardIcon,
  InformationCircleIcon,
  PauseIcon,
  PlayIcon,
  PresentationChartBarIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import {
  BRANDS,
  CATEGORIES,
  SEED_SURVEY_IDS,
  SEED_TICKET_IDS,
  type BrandId,
  type Category,
  type Channel,
  type KbArticle,
  type Priority,
} from './components/data';
import { computeMetrics, customerText as customerTextOf } from './components/engine';
import Inbox from './components/Inbox';
import { EscalateModal, MacroBuilderModal, NewTicketModal, SurveyModal } from './components/Modals';
import { GettingStarted, MetricsRow, RoutingBanner, type GuideStep } from './components/Overview';
import { AutoReplyPanel, CsatPanel, MacrosPanel } from './components/Panels';
import PqrsPanel from './components/PqrsPanel';
import Sidebar from './components/Sidebar';
import TicketDetail from './components/TicketDetail';
import { Toast } from './components/ui';
import { useHelpdeskStore, type IncomingResult } from './components/useHelpdeskStore';
import { useHelpdeskText } from './components/useHelpdeskText';

/** Salidas comerciales: demo guiada con la demo ya elegida y cotización del producto. */
const REQUEST_DEMO_HREF = '/solicitar-demo?demos=helpdesk-ia';
const QUOTE_HREF = '/contact?service=helpdesk-ia';
/** Preferencia de este navegador: los primeros pasos plegados. */
const GUIDE_KEY = 'koptup.helpdesk.guideHidden';

export default function HelpdeskIaDemoPage() {
  const hd = useHelpdeskText();
  const { t, tx } = hd;
  const { state, dispatch, incoming, autoAssign } = useHelpdeskStore();

  const [brand, setBrand] = useState<BrandId | 'all'>('all');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [channel, setChannel] = useState<Channel | 'all'>('all');
  const [priority, setPriority] = useState<Priority | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>('TCK-1041');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [newOpen, setNewOpen] = useState(false);
  const [escalateId, setEscalateId] = useState<string | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [routing, setRouting] = useState<IncomingResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [guideOpen, setGuideOpen] = useState(true);
  const detailRef = useRef<HTMLElement>(null);

  // Se lee después de montar para que el primer render sea igual en el servidor y en el navegador.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(GUIDE_KEY) === '1') setGuideOpen(false);
    } catch {
      /* sin almacenamiento: los pasos quedan abiertos */
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

  const notify = useCallback((msg: string) => setToast(msg), []);
  const clearToast = useCallback(() => setToast(null), []);

  const { tickets, clock } = state;
  const selected = tickets.find((tk) => tk.id === selectedId) ?? null;
  const selectedText = useMemo(() => (selected ? customerTextOf(selected, tx) : ''), [selected, tx]);
  const metrics = useMemo(() => computeMetrics(tickets, state.surveys, state.autoLog, clock), [tickets, state.surveys, state.autoLog, clock]);
  const draft = selected ? drafts[selected.id] ?? '' : '';
  const setDraft = (id: string, text: string) => setDrafts((d) => ({ ...d, [id]: text }));

  // Ticket resuelto para la encuesta: el seleccionado o el último resuelto.
  const surveyTicketId = useMemo(() => {
    if (selected?.status === 'resolved') return selected.id;
    const resolved = tickets.filter((tk) => tk.status === 'resolved').sort((a, b) => (b.resolvedAt ?? 0) - (a.resolvedAt ?? 0));
    return resolved[0]?.id ?? null;
  }, [selected, tickets]);

  const openTicket = (id: string, scroll: boolean) => {
    setSelectedId(id);
    if (scroll || (typeof window !== 'undefined' && window.innerWidth < 1024)) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  /** Lleva al cuadro «Tu respuesta» del ticket seleccionado (o del primero sin resolver). */
  const goToReply = () => {
    const target = selected && selected.status !== 'resolved' ? selected : tickets.find((tk) => tk.status !== 'resolved');
    if (!target) return;
    setSelectedId(target.id);
    window.setTimeout(() => {
      const el = document.getElementById('hd-reply');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.focus({ preventScroll: true });
    }, 60);
  };

  const advanceClock = () => {
    dispatch({ type: 'tick', minutes: 15 });
    dispatch({ type: 'tourSla' });
    notify(t('clock.advanced'));
  };

  const togglePause = () => {
    dispatch({ type: 'pause', paused: !state.paused });
    notify(state.paused ? t('clock.resumedToast') : t('clock.pausedToast'));
  };

  const guideSteps: GuideStep[] = [
    {
      id: 'incoming',
      done: tickets.some((tk) => !SEED_TICKET_IDS.has(tk.id)),
      onAction: () => setNewOpen(true),
    },
    {
      id: 'reply',
      done: tickets.some((tk) => tk.messages.some((m) => m.from === 'agent' && m.author === 'you')),
      onAction: goToReply,
    },
    {
      id: 'resolve',
      done: state.surveys.some((sv) => !SEED_SURVEY_IDS.has(sv.id)),
      onAction: () => {
        if (!selected) setSelectedId(tickets.find((tk) => tk.status !== 'resolved')?.id ?? null);
        requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      },
    },
    {
      id: 'sla',
      done: state.tourSla,
      onAction: () => {
        dispatch({ type: 'tourSla' });
        document.getElementById('hd-pqrs-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
    },
  ];

  const insertText = (text: string) => {
    if (!selected) return;
    setDraft(selected.id, draft.trim() ? `${draft.trim()}\n\n${text}` : text);
  };

  const insertArticle = (a: KbArticle) => {
    if (!selected || selected.status === 'resolved') return;
    insertText(t(`kb.articles.${a.id}.reply`, { name: hd.firstName(selected.customer) }));
    notify(t('toasts.articleInserted', { title: t(`kb.articles.${a.id}.title`) }));
  };

  const escalateTicket = tickets.find((tk) => tk.id === escalateId) ?? null;
  const surveyTicket = tickets.find((tk) => tk.id === surveyId) ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-secondary-50 dark:from-secondary-950 dark:via-black dark:to-secondary-950 py-8 sm:py-12 overflow-x-hidden">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Volver al catálogo y salidas comerciales */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-3">
          <Link
            href="/demo"
            className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-secondary-700 hover:text-secondary-900 dark:text-secondary-300 dark:hover:text-white"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            {t('shell.back')}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={REQUEST_DEMO_HREF} className="gap-1.5">
                <PresentationChartBarIcon className="h-4 w-4" aria-hidden="true" />
                {t('shell.requestDemo')}
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={QUOTE_HREF} className="gap-1.5">
                <CalculatorIcon className="h-4 w-4" aria-hidden="true" />
                {t('shell.quote')}
              </Link>
            </Button>
          </div>
        </div>

        {/* Encabezado: qué es, para quién y filtros de marca y área */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 to-rose-800 p-6 sm:p-8 shadow-lg mb-4">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_25%_25%,white,transparent_45%)]" aria-hidden="true" />
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-100">{t('shell.kicker')}</p>
              <h1 className="mt-1 text-3xl md:text-4xl font-bold tracking-tight text-white">{t('pageTitle')}</h1>
              <p className="text-sm sm:text-base text-rose-50 mt-2 max-w-3xl">{t('pageSubtitle')}</p>
            </div>
            <div className="flex flex-wrap lg:flex-nowrap lg:flex-shrink-0 gap-3">
              <label className="block">
                <span className="block text-xs font-medium text-rose-100 mb-1">{t('brandLabel')}</span>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value as BrandId | 'all')}
                  className="pl-3 pr-9 py-2 rounded-lg border border-white/30 bg-white/95 text-sm text-secondary-900 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  <option value="all">{t('brands.all')}</option>
                  {BRANDS.map((b) => (
                    <option key={b} value={b}>
                      {t(`brands.${b}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-rose-100 mb-1">{t('categoryLabel')}</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category | 'all')}
                  className="pl-3 pr-9 py-2 rounded-lg border border-white/30 bg-white/95 text-sm text-secondary-900 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  <option value="all">{t('categories.all')}</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {t(`categories.${c}`)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* Rótulo de datos de ejemplo, qué es real, reloj y restablecer */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-3 mb-4">
          <span
            className="self-start inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
            title={t('sampleBadgeHint')}
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
              <li>{t('sampleBadgeHint')}</li>
              <li>{t('howItWorks.real')}</li>
              <li>{t('howItWorks.ai')}</li>
              <li>{t('howItWorks.simulated')}</li>
              <li>{t('howItWorks.project')}</li>
            </ul>
          </details>
          <div className="self-start flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-lg border border-secondary-200 dark:border-secondary-800 bg-white/70 dark:bg-secondary-900/70 px-2.5 py-1.5 text-xs text-secondary-700 dark:text-secondary-300"
              title={t('clock.hint')}
            >
              <ClockIcon className="h-4 w-4" aria-hidden="true" />
              {t('clock.label', { date: hd.date(Math.floor(clock / 1440)), time: hd.hhmm(clock) })}
              {state.paused && <span className="font-semibold text-amber-700 dark:text-amber-300">{t('clock.pausedLabel')}</span>}
            </span>
            <Button size="sm" variant="ghost" onClick={togglePause} className="gap-1" aria-pressed={state.paused} title={t('clock.pauseHint')}>
              {state.paused ? <PlayIcon className="h-4 w-4" aria-hidden="true" /> : <PauseIcon className="h-4 w-4" aria-hidden="true" />}
              {state.paused ? t('clock.resume') : t('clock.pause')}
            </Button>
            <Button size="sm" variant="ghost" onClick={advanceClock} className="gap-1" title={t('clock.advanceHint')}>
              <ForwardIcon className="h-4 w-4" aria-hidden="true" />
              {t('clock.advance')}
            </Button>
            {!confirmReset ? (
              <Button size="sm" variant="ghost" onClick={() => setConfirmReset(true)} className="gap-1">
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
                    dispatch({ type: 'reset' });
                    setConfirmReset(false);
                    setSelectedId('TCK-1041');
                    setDrafts({});
                    setRouting(null);
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

        <GettingStarted hd={hd} steps={guideSteps} open={guideOpen} onToggle={toggleGuide} />

        <MetricsRow hd={hd} m={metrics} />

        {routing && (
          <RoutingBanner
            hd={hd}
            result={routing}
            onClose={() => setRouting(null)}
            onOpen={() => openTicket(routing.ticketId, true)}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          <Sidebar
            hd={hd}
            tickets={tickets}
            channel={channel}
            onChannel={setChannel}
            priority={priority}
            onPriority={setPriority}
            selected={selected}
            selectedText={selectedText}
            onUseArticle={insertArticle}
          />
          <Inbox
            hd={hd}
            tickets={tickets}
            clock={clock}
            channel={channel}
            priority={priority}
            brand={brand}
            category={category}
            selectedId={selectedId}
            onSelect={(id) => openTicket(id, false)}
            onNewTicket={() => setNewOpen(true)}
            notify={notify}
          />
          <section ref={detailRef} className="order-3 lg:order-none lg:col-span-5 min-w-0 scroll-mt-20">
            {!selected ? (
              <Card variant="bordered" className="flex items-center justify-center text-secondary-500 text-sm py-20">
                {t('detail.empty')}
              </Card>
            ) : (
              <TicketDetail
                hd={hd}
                ticket={selected}
                clock={clock}
                customerText={selectedText}
                macros={state.macros}
                draft={draft}
                onDraft={(text) => setDraft(selected.id, text)}
                onSend={() => {
                  if (!draft.trim()) return;
                  dispatch({ type: 'reply', id: selected.id, text: draft.trim() });
                  setDraft(selected.id, '');
                  notify(t('toasts.replySent', { channel: t(`channels.${selected.channel}`) }));
                }}
                onCustomerReply={() => {
                  dispatch({ type: 'customerReply', id: selected.id });
                  notify(t('toasts.customerReplied'));
                }}
                onNote={(text) => {
                  dispatch({ type: 'note', id: selected.id, text });
                  notify(t('toasts.noteAdded'));
                }}
                onResolve={() => {
                  dispatch({ type: 'resolve', id: selected.id });
                  notify(t('toasts.resolved'));
                }}
                onReopen={() => {
                  dispatch({ type: 'reopen', id: selected.id });
                  notify(t('toasts.reopened'));
                }}
                onAssign={(agent) => {
                  dispatch({ type: 'assign', id: selected.id, agent });
                  notify(agent ? t('toasts.assigned', { agent: hd.agentName(agent) }) : t('toasts.unassigned'));
                }}
                onAutoAssign={() => {
                  const r = autoAssign(selected.id, hd.lang);
                  if (r) notify(t('toasts.autoAssigned', { agent: hd.agentName(r.agent) }));
                }}
                onPriority={(p) => {
                  dispatch({ type: 'priority', id: selected.id, priority: p });
                  notify(t('toasts.priority', { priority: t(`priorities.${p}`) }));
                }}
                onCategory={(c) => {
                  dispatch({ type: 'category', id: selected.id, category: c });
                  notify(t('toasts.category', { area: t(`categories.${c}`) }));
                }}
                onEscalate={() => setEscalateId(selected.id)}
                onPqrs={(type) => {
                  dispatch({ type: 'pqrs', id: selected.id, pqrsType: type });
                  notify(type ? t('toasts.pqrs', { type: t(`pqrs.types.${type}`) }) : t('toasts.pqrsRemoved'));
                }}
                onApplyMacro={(macroId) => {
                  const m = state.macros.find((x) => x.id === macroId);
                  dispatch({ type: 'applyMacro', id: selected.id, macroId });
                  if (m) notify(t('toasts.macroApplied', { name: tx(m.name) }));
                }}
                onSurvey={() => setSurveyId(selected.id)}
                hasSurvey={state.surveys.some((s) => s.ticketId === selected.id)}
                onInsertArticle={insertArticle}
              />
            )}
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mt-6">
          <AutoReplyPanel
            hd={hd}
            settings={state.settings}
            log={state.autoLog}
            onSettings={(s) => dispatch({ type: 'settings', settings: s })}
            onOpenTicket={(id) => openTicket(id, true)}
          />
          <MacrosPanel
            hd={hd}
            macros={state.macros}
            onCreate={() => setBuilderOpen(true)}
            onToggle={(id) => dispatch({ type: 'toggleMacro', macroId: id })}
            onDelete={(id) => {
              const m = state.macros.find((x) => x.id === id);
              dispatch({ type: 'deleteMacro', macroId: id });
              if (m) notify(t('toasts.macroDeleted', { name: tx(m.name) }));
            }}
          />
          <CsatPanel hd={hd} surveys={state.surveys} surveyTicketId={surveyTicketId} onOpenSurvey={() => surveyTicketId && setSurveyId(surveyTicketId)} />
        </div>

        <PqrsPanel hd={hd} tickets={tickets} clock={clock} onOpenTicket={(id) => openTicket(id, true)} notify={notify} />
      </div>

      {newOpen && (
        <NewTicketModal
          hd={hd}
          onClose={() => setNewOpen(false)}
          onCreate={(input) => {
            const result = incoming(input, hd.lang);
            setNewOpen(false);
            setRouting(result);
            setChannel('all');
            setPriority('all');
            setBrand('all');
            setCategory('all');
            setSelectedId(result.ticketId);
          }}
        />
      )}
      {escalateTicket && (
        <EscalateModal
          hd={hd}
          ticket={escalateTicket}
          onClose={() => setEscalateId(null)}
          onConfirm={(target, reason, raise) => {
            dispatch({ type: 'escalate', id: escalateTicket.id, target, reason, raise });
            setEscalateId(null);
            notify(t('toasts.escalated', { target: t(`escalate.targets.${target}`) }));
          }}
        />
      )}
      {builderOpen && (
        <MacroBuilderModal
          hd={hd}
          onClose={() => setBuilderOpen(false)}
          onSave={(name, conditions, actions, auto) => {
            dispatch({ type: 'addMacro', name, conditions, actions, auto });
            setBuilderOpen(false);
            notify(t('toasts.macroCreated', { name }));
          }}
        />
      )}
      {surveyTicket && (
        <SurveyModal
          hd={hd}
          ticket={surveyTicket}
          onClose={() => setSurveyId(null)}
          onSubmit={(score, nps, comment) => {
            dispatch({ type: 'survey', ticketId: surveyTicket.id, score, nps, comment });
            setSurveyId(null);
            notify(t('toasts.survey', { channel: t(`channels.${surveyTicket.channel}`) }));
          }}
        />
      )}
      <Toast message={toast} onDone={clearToast} />
    </div>
  );
}
