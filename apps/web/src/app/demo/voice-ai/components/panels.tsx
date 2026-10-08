'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowRightCircleIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ArrowsRightLeftIcon,
  BoltIcon,
  BookOpenIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
  DocumentTextIcon,
  LanguageIcon,
  QueueListIcon,
  ShieldCheckIcon,
  SignalIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { ComplianceRow, ContextRow, PanelTitle, SentimentGauge, SentimentPill } from './parts';
import type { CheckState, T } from './parts';
import type { FlowNode, FnKey, FnStatus, Phase, Scenario, Sentiment, Turn } from './types';
import { fmtTime } from './types';

/** Todo lo que los paneles necesitan saber de la llamada actual (derivado en page.tsx). */
export interface CallView {
  t: T;
  locale: string;
  scenario: Scenario;
  phase: Phase;
  cursor: number;
  turnFinished: boolean;
  shownTurns: Turn[];
  at: number[];
  textOf: (i: number) => string;
  agentName: string;
  companyName: string;
  human: string;
  team: string;
  sentiment: Sentiment | null;
  firstSentiment: Sentiment | null;
  trend: 'improving' | 'stable' | 'declining';
  intentTurn: Turn | undefined;
  fnStatus: Record<FnKey, FnStatus>;
  verified: boolean;
  maskedCount: number;
  noticeDone: boolean;
  manualTransfer: boolean;
  endReason: 'completed' | 'transferred' | 'hungup' | null;
  clock: number;
}

const callOver = (p: Phase) => p === 'ended' || p === 'transferred';

/* ------------------------------ Sentimiento ------------------------------ */

export function SentimentPanel({ v }: { v: CallView }) {
  const { t } = v;
  return (
    <Card variant="bordered" className="bg-slate-900/60 border-slate-800" padding="md">
      <PanelTitle icon={<ChartBarIcon className="h-4 w-4 text-cyan-400" />} title={t('sentiment.title')} subtitle={t('sentiment.subtitle')} />
      {v.sentiment ? (
        <>
          <SentimentGauge value={v.sentiment} t={t} />
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-slate-400">{t('sentiment.trend')}</span>
            <span
              className={cn(
                'flex items-center gap-1 font-medium',
                v.trend === 'improving' && 'text-emerald-400',
                v.trend === 'stable' && 'text-cyan-400',
                v.trend === 'declining' && 'text-rose-400',
              )}
            >
              {v.trend === 'improving' && <ArrowTrendingUpIcon className="h-3.5 w-3.5" />}
              {v.trend === 'declining' && <ArrowTrendingDownIcon className="h-3.5 w-3.5" />}
              {v.trend === 'stable' && <SignalIcon className="h-3.5 w-3.5" />}
              {t(`sentiment.${v.trend}`)}
            </span>
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-400">{t('sentiment.waiting')}</p>
      )}
    </Card>
  );
}

/* ------------------------------- Intención ------------------------------- */

export function IntentPanel({ v }: { v: CallView }) {
  const { t, intentTurn } = v;
  const conf = Math.round((intentTurn?.confidence ?? 0) * 100);
  return (
    <Card variant="bordered" className="bg-slate-900/60 border-slate-800" padding="md">
      <PanelTitle icon={<BoltIcon className="h-4 w-4 text-amber-400" />} title={t('intent.title')} subtitle={t('intent.subtitle')} />
      {intentTurn?.intent ? (
        <>
          <div className="text-base font-semibold text-white" data-testid="voice-intent">
            {t(`intents.${intentTurn.intent}`)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>{t('intent.confidence')}</span>
            <span className="font-mono text-emerald-300">{conf}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400" style={{ width: `${conf}%` }} />
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-400">{t('intent.none')}</p>
      )}
      <p className="mt-3 text-[11px] text-slate-500">{t('intent.note')}</p>
    </Card>
  );
}

/* ----------------------------- Transcripción ----------------------------- */

export function TranscriptPanel({ v, onDownload }: { v: CallView; onDownload: () => void }) {
  const { t } = v;
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [v.cursor, v.phase]);

  return (
    <Card variant="bordered" className="lg:col-span-2 bg-slate-900/60 border-slate-800" padding="md">
      <PanelTitle
        icon={<LanguageIcon className="h-4 w-4 text-violet-400" />}
        title={t('transcript.title')}
        subtitle={t('transcript.subtitle')}
        right={
          <button
            type="button"
            onClick={onDownload}
            disabled={v.shownTurns.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/60 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed px-2.5 py-1 text-xs text-slate-100"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            {t('transcript.download')}
          </button>
        }
      />
      <div ref={box} className="space-y-3 max-h-[440px] overflow-y-auto pr-1 voice-scroll" data-testid="voice-transcript">
        {v.shownTurns.length === 0 && <div className="text-sm text-slate-400 py-10 text-center">{t('transcript.empty')}</div>}
        {v.shownTurns.map((turn, i) => {
          const isAI = turn.speaker === 'ai';
          const live = v.phase === 'playing' && i === v.cursor && !v.turnFinished;
          return (
            <div key={turn.key} className={cn('flex gap-2.5', isAI ? 'flex-row' : 'flex-row-reverse')}>
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold',
                  isAI ? 'bg-gradient-to-br from-cyan-500 to-violet-600 text-white' : 'bg-slate-700 text-slate-200',
                )}
                aria-hidden="true"
              >
                {isAI ? t('transcript.aiShort') : t('transcript.customerShort')}
              </div>
              <div
                className={cn(
                  'min-w-0 max-w-[85%] rounded-2xl px-3.5 py-2.5 border transition-colors',
                  isAI ? 'bg-violet-500/10 border-violet-500/20 rounded-tl-sm' : 'bg-slate-800/70 border-slate-700/60 rounded-tr-sm',
                  live && 'ring-2 ring-cyan-400/50',
                )}
              >
                <div className="flex items-center justify-between gap-3 mb-1 text-[10px] text-slate-400">
                  <span className="font-medium text-slate-300">
                    {isAI ? t('transcript.ai', { agent: v.agentName }) : t('transcript.customer')}
                    {live && <span className="ml-1.5 text-cyan-300">· {t('transcript.speaking')}</span>}
                  </span>
                  <span className="font-mono">{fmtTime(v.at[i])}</span>
                </div>
                <div className="text-sm text-slate-100 leading-relaxed break-words">{v.textOf(i)}</div>
                {(turn.sentiment && !isAI) || turn.masked || turn.notice ? (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {!isAI && <SentimentPill value={turn.sentiment} t={t} />}
                    {turn.masked && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        <ShieldCheckIcon className="h-2.5 w-2.5" /> {t('transcript.masked')}
                      </span>
                    )}
                    {turn.notice && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <ShieldCheckIcon className="h-2.5 w-2.5" /> {t('transcript.notice')}
                      </span>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
        {v.phase === 'transferred' && (
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-3 text-xs text-violet-200 flex items-start gap-2">
            <ArrowRightCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />
            {t(v.manualTransfer ? 'transcript.transferredManual' : 'transcript.transferredAuto', { human: v.human, team: v.team })}
          </div>
        )}
        {v.phase === 'ended' && v.endReason === 'hungup' && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 text-xs text-rose-200">{t('transcript.hungUp')}</div>
        )}
      </div>
    </Card>
  );
}

/* --------------------------- Flujo de la llamada --------------------------- */

export function FlowPanel({ v }: { v: CallView }) {
  const { t, scenario } = v;
  const endsWithTransfer = scenario.turns.some((tn) => tn.node === 'transfer');
  // Pasos en el orden en que el guion los recorre por primera vez.
  const nodes: FlowNode[] = [];
  scenario.turns.forEach((tn) => {
    if (!nodes.includes(tn.node)) nodes.push(tn.node);
  });
  if (v.manualTransfer && !endsWithTransfer) {
    const i = nodes.indexOf('close');
    if (i >= 0) nodes[i] = 'transfer';
    else nodes.push('transfer');
  }
  const visited = new Set<FlowNode>(v.shownTurns.map((tn) => tn.node));
  if (v.manualTransfer) visited.add('transfer');
  const active = v.phase === 'playing' || v.phase === 'paused';
  const current = active && v.cursor >= 0 ? scenario.turns[v.cursor].node : null;

  return (
    <Card variant="bordered" className="bg-slate-900/60 border-slate-800" padding="md">
      <PanelTitle icon={<QueueListIcon className="h-4 w-4 text-sky-400" />} title={t('flow.title')} subtitle={t('flow.subtitle')} />
      <ol className="space-y-2" data-testid="voice-flow">
        {nodes.map((n, i) => {
          const state = current === n ? 'current' : visited.has(n) ? 'done' : 'pending';
          const descKey = n === 'close' || n === 'transfer' ? (v.manualTransfer && !endsWithTransfer ? null : 'end') : n;
          return (
            <li
              key={n}
              className={cn(
                'relative rounded-lg border p-2.5 text-xs',
                state === 'current' && 'border-cyan-400/60 bg-cyan-500/10',
                state === 'done' && 'border-emerald-500/30 bg-emerald-500/5',
                state === 'pending' && 'border-slate-700/60 bg-slate-800/30',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-100">
                  {i + 1}. {t(`flow.nodes.${n}`)}
                </span>
                <span
                  className={cn(
                    'text-[10px] uppercase tracking-wide',
                    state === 'current' ? 'text-cyan-300' : state === 'done' ? 'text-emerald-300' : 'text-slate-500',
                  )}
                >
                  {t(`flow.${state}`)}
                </span>
              </div>
              <p className="mt-0.5 text-slate-400">
                {descKey ? t(`scenarios.${scenario.id}.flow.${descKey}`) : t('transcript.transferredManual', { human: v.human, team: v.team })}
              </p>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

/* ---------------------------- Acciones del agente ---------------------------- */

const STATUS_TONE: Record<FnStatus, string> = {
  pending: 'bg-slate-700/40 text-slate-300 border border-slate-600/40',
  running: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  done: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  skipped: 'bg-slate-800 text-slate-400 border border-slate-700',
};

export function ActionsPanel({ v }: { v: CallView }) {
  const { t, scenario } = v;
  const [open, setOpen] = useState<FnKey | null>(null);
  const done = scenario.fns.filter((f) => v.fnStatus[f.key] === 'done').length;
  return (
    <Card variant="bordered" className="lg:col-span-2 bg-slate-900/60 border-slate-800" padding="md">
      <PanelTitle
        icon={<BoltIcon className="h-4 w-4 text-amber-400" />}
        title={t('actions.title')}
        subtitle={t('actions.subtitle')}
        right={<span className="text-xs text-slate-400">{t('actions.progress', { done, total: scenario.fns.length })}</span>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="voice-actions">
        {scenario.fns.map((fn) => {
          const st = v.fnStatus[fn.key];
          const isOpen = open === fn.key;
          return (
            <div
              key={fn.key}
              className={cn(
                'rounded-xl border p-3 transition-colors min-w-0',
                st === 'done' ? 'border-emerald-500/30 bg-emerald-500/5' : st === 'running' ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-700/60 bg-slate-800/30',
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <code className="text-xs font-mono text-cyan-300 break-all">{t(`fns.${fn.key}.name`)}()</code>
                <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] shrink-0', STATUS_TONE[st])}>
                  {st === 'done' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
                  {t(`actions.status.${st}`)}
                </span>
              </div>
              <div className="text-xs text-slate-400">{t(`fns.${fn.key}.desc`)}</div>
              {st === 'done' && (
                <div className="mt-2 text-xs text-slate-200 bg-slate-950/50 rounded-md px-2 py-1.5 border border-slate-800">
                  {t(`scenarios.${scenario.id}.results.${fn.key}`)}
                </div>
              )}
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : fn.key)}
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-cyan-300 hover:text-cyan-200"
              >
                <ChevronDownIcon className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')} />
                {isOpen ? t('actions.hideDetail') : t('actions.showDetail')}
              </button>
              {isOpen && (
                <div className="mt-2 space-y-1.5 text-[11px]">
                  <div className="text-slate-400">{t('actions.request')}</div>
                  <pre className="overflow-x-auto rounded-md bg-slate-950/70 border border-slate-800 p-2 font-mono text-slate-200 whitespace-pre-wrap break-all">
                    {JSON.stringify({ [t('actions.jsonFn')]: t(`fns.${fn.key}.name`), [t('actions.jsonArgs')]: fn.args }, null, 2)}
                  </pre>
                  <div className="text-slate-400">{t('actions.response')}</div>
                  <p className="rounded-md bg-slate-950/70 border border-slate-800 p-2 text-slate-200">
                    {st === 'done' ? t(`scenarios.${scenario.id}.results.${fn.key}`) : t(`actions.status.${st}`)}
                  </p>
                  <p className="text-slate-500">{t('actions.simulated', { system: t(`systems.${fn.system}`) })}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------------------------- Transferencia ---------------------------- */

export function HandoffPanel({ v, onTransfer }: { v: CallView; onTransfer: () => void }) {
  const { t, scenario } = v;
  const active = v.phase === 'playing' || v.phase === 'paused';
  const doneFns = scenario.fns.filter((f) => v.fnStatus[f.key] === 'done' && f.key !== 'transferToHuman' && f.key !== 'logCallCrm');
  const doc = scenario.maskedData.doc ?? scenario.maskedData.email ?? '';
  return (
    <Card variant="bordered" className="bg-slate-900/60 border-slate-800" padding="md">
      <PanelTitle icon={<UserGroupIcon className="h-4 w-4 text-violet-400" />} title={t('handoff.title')} subtitle={t('handoff.subtitle')} />
      <p className={cn('text-[11px] mb-2', v.phase === 'transferred' ? 'text-violet-300' : 'text-slate-400')}>
        {v.phase === 'transferred'
          ? t('handoff.sent', { human: v.human, team: v.team })
          : v.phase === 'ended'
            ? t('handoff.ended')
            : t('handoff.preview')}
      </p>
      <div className="space-y-1.5 text-xs mb-4" data-testid="voice-handoff">
        <ContextRow label={t('handoff.reason')} value={v.intentTurn?.intent ? t(`intents.${v.intentTurn.intent}`) : '—'} />
        <ContextRow label={t('handoff.identity')} value={v.verified ? t('handoff.verified', { doc }) : t('handoff.notVerified')} />
        <ContextRow
          label={t('handoff.actionsDone')}
          value={doneFns.length ? doneFns.map((f) => t(`fns.${f.key}.name`)).join(', ') : t('handoff.none')}
        />
        <ContextRow label={t('handoff.mood')} value={v.sentiment ? <SentimentPill value={v.sentiment} t={t} /> : '—'} />
        <ContextRow label={t('handoff.next')} value={t(`scenarios.${scenario.id}.nextStep`)} />
      </div>
      <button
        type="button"
        onClick={onTransfer}
        disabled={!active}
        title={v.phase === 'idle' ? t('handoff.needsCall') : undefined}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          active ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20' : 'bg-violet-500/15 text-violet-300 cursor-not-allowed',
        )}
      >
        <ArrowsRightLeftIcon className="h-4 w-4" />
        {v.phase === 'transferred' ? t('handoff.done') : t('handoff.button')}
      </button>
      {v.phase === 'idle' && <p className="mt-2 text-[11px] text-slate-500">{t('handoff.needsCall')}</p>}
    </Card>
  );
}

export function AssistPanel({ v }: { v: CallView }) {
  const { t, scenario } = v;
  const [open, setOpen] = useState<string | null>(null);
  const active = v.phase === 'transferred';
  return (
    <Card variant="bordered" className="bg-slate-900/60 border-slate-800" padding="md">
      <PanelTitle icon={<SparklesIcon className="h-4 w-4 text-cyan-400" />} title={t('assist.title')} subtitle={t('assist.subtitle')} />
      <p className={cn('text-[11px] mb-2', active ? 'text-emerald-300' : 'text-slate-400')}>
        {active ? t('assist.active', { human: v.human }) : t('assist.inactive')}
      </p>
      <ul className={cn('space-y-2 text-xs mb-4 transition-opacity', !active && 'opacity-60')}>
        {(['s1', 's2', 's3'] as const).map((s) => (
          <li key={s} className="flex items-start gap-2 rounded-lg bg-slate-800/40 border border-slate-700/40 p-2">
            <CheckCircleIcon className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
            <span className="text-slate-200">{t(`scenarios.${scenario.id}.assist.${s}`)}</span>
          </li>
        ))}
      </ul>
      <div className="pt-3 border-t border-slate-800">
        <div className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1">
          <BookOpenIcon className="h-3.5 w-3.5 text-cyan-400" />
          {t('assist.kbTitle')}
        </div>
        <div className="text-[11px] text-slate-500 mb-2">{t('assist.kbHint')}</div>
        <ul className="space-y-1.5 text-xs">
          {(['a1', 'a2'] as const).map((a) => {
            const isOpen = open === a;
            return (
              <li key={a}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : a)}
                  className="flex w-full items-center justify-between gap-2 text-left text-cyan-300 hover:text-cyan-200"
                >
                  <span className="flex items-center gap-1.5">
                    <DocumentTextIcon className="h-3.5 w-3.5 shrink-0" />
                    {t(`scenarios.${scenario.id}.kb.${a}.title`)}
                  </span>
                  <ChevronDownIcon className={cn('h-3.5 w-3.5 shrink-0 transition-transform', isOpen && 'rotate-180')} />
                </button>
                {isOpen && (
                  <p className="mt-1 rounded-md bg-slate-800/50 border border-slate-700/50 p-2 text-slate-300">
                    {t(`scenarios.${scenario.id}.kb.${a}.body`)}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}

/* ------------------------------ Cumplimiento ------------------------------ */

export function CompliancePanel({
  v,
  window: win,
}: {
  v: CallView;
  window: { state: CheckState; desc: string };
}) {
  const { t } = v;
  const label = (s: CheckState) => t(s === 'ok' ? 'compliance.statusOk' : s === 'pending' ? 'compliance.statusPending' : 'compliance.statusNa');
  const notice: CheckState = v.noticeDone ? 'ok' : 'pending';
  const masking: CheckState = v.maskedCount > 0 ? 'ok' : 'pending';
  const identity: CheckState = v.verified ? 'ok' : 'pending';
  return (
    <Card variant="bordered" className="bg-slate-900/60 border-slate-800" padding="md">
      <PanelTitle icon={<ShieldCheckIcon className="h-4 w-4 text-emerald-400" />} title={t('compliance.title')} subtitle={t('compliance.subtitle')} />
      <ul className="space-y-2 text-xs" data-testid="voice-compliance">
        <ComplianceRow
          title={t('compliance.notice')}
          desc={v.noticeDone ? t('compliance.noticeOk') : t('compliance.noticePending')}
          state={notice}
          label={label(notice)}
        />
        <ComplianceRow
          title={t('compliance.identity')}
          desc={v.verified ? t('compliance.identityOk') : t('compliance.identityPending')}
          state={identity}
          label={label(identity)}
        />
        <ComplianceRow
          title={t('compliance.masking')}
          desc={v.maskedCount > 0 ? t('compliance.maskingOk', { count: v.maskedCount }) : t('compliance.maskingPending')}
          state={masking}
          label={label(masking)}
        />
        <ComplianceRow title={t('compliance.window')} desc={win.desc} state={win.state} label={label(win.state)} />
      </ul>
    </Card>
  );
}

/* ------------------------------- Resumen ------------------------------- */

export function SummaryPanel({
  v,
  onCopy,
  onDownload,
}: {
  v: CallView;
  onCopy: () => void;
  onDownload: () => void;
}) {
  const { t, scenario } = v;
  if (!callOver(v.phase)) return null;
  const result = v.endReason === 'transferred' ? 'transferred' : v.endReason === 'hungup' ? 'abandoned' : 'resolved';
  const done = scenario.fns.filter((f) => v.fnStatus[f.key] === 'done').length;
  return (
    <Card variant="bordered" className="bg-slate-900/60 border-cyan-500/30 mt-6" padding="md" data-testid="voice-summary">
      <PanelTitle
        icon={<ClipboardDocumentIcon className="h-4 w-4 text-cyan-400" />}
        title={t('summary.title')}
        subtitle={t('summary.subtitle')}
        right={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1 text-xs text-slate-100"
            >
              <ClipboardDocumentIcon className="h-4 w-4" />
              {t('summary.copy')}
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1 text-xs text-slate-100"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              {t('summary.downloadShort')}
            </button>
          </div>
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
        <SummaryItem label={t('summary.duration')} value={fmtTime(v.clock)} />
        <SummaryItem label={t('summary.result')} value={t(`summary.results.${result}`)} />
        <SummaryItem label={t('summary.reason')} value={v.intentTurn?.intent ? t(`intents.${v.intentTurn.intent}`) : '—'} />
        <SummaryItem label={t('summary.actions')} value={t('summary.actionsValue', { done, total: scenario.fns.length })} />
        <SummaryItem
          label={t('summary.sentiment')}
          value={
            v.firstSentiment && v.sentiment ? `${t(`sentiment.${v.firstSentiment}`)} → ${t(`sentiment.${v.sentiment}`)}` : '—'
          }
        />
        <SummaryItem label={t('summary.masked')} value={String(v.maskedCount)} />
      </div>
      <p className="mt-3 text-[11px] text-slate-400">{t('summary.savedToLog')}</p>
    </Card>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-800/30 px-2.5 py-2 min-w-0">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-sm font-semibold text-white break-words">{value}</div>
    </div>
  );
}
