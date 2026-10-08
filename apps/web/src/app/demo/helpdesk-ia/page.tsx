'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { ArrowPathIcon, ClockIcon, ForwardIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { BRANDS, CATEGORIES, type BrandId, type Category, type Channel, type KbArticle, type Priority } from './components/data';
import { computeMetrics, customerText as customerTextOf } from './components/engine';
import Inbox from './components/Inbox';
import { EscalateModal, MacroBuilderModal, NewTicketModal, SurveyModal } from './components/Modals';
import { MetricsRow, RoutingBanner } from './components/Overview';
import { AutoReplyPanel, CsatPanel, MacrosPanel } from './components/Panels';
import PqrsPanel from './components/PqrsPanel';
import Sidebar from './components/Sidebar';
import TicketDetail from './components/TicketDetail';
import { Toast } from './components/ui';
import { useHelpdeskStore, type IncomingResult } from './components/useHelpdeskStore';
import { useHelpdeskText } from './components/useHelpdeskText';

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
  const detailRef = useRef<HTMLElement>(null);

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
        {/* Encabezado */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 to-rose-800 p-6 sm:p-8 shadow-lg mb-4">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_25%_25%,white,transparent_45%)]" aria-hidden="true" />
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">{t('pageTitle')}</h1>
              <p className="text-sm sm:text-base text-rose-100 mt-2 max-w-3xl">{t('pageSubtitle')}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="block">
                <span className="block text-xs font-medium text-rose-100 mb-1">{t('brandLabel')}</span>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value as BrandId | 'all')}
                  className="px-3 py-2 rounded-lg border border-white/30 bg-white/95 text-sm text-secondary-900 focus:outline-none focus:ring-2 focus:ring-white"
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
                  className="px-3 py-2 rounded-lg border border-white/30 bg-white/95 text-sm text-secondary-900 focus:outline-none focus:ring-2 focus:ring-white"
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
        <div className="flex flex-col lg:flex-row lg:items-start gap-3 mb-6">
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
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                dispatch({ type: 'tick', minutes: 15 });
                notify(t('clock.advanced'));
              }}
              className="gap-1"
              title={t('clock.advanceHint')}
            >
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
