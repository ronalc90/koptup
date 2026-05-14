'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  PlayIcon,
  StopIcon,
  BookmarkSquareIcon,
  Squares2X2Icon,
  CommandLineIcon,
  ServerStackIcon,
  CloudIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import WorkflowCanvas from './components/WorkflowCanvas';
import NodePalette from './components/NodePalette';
import NodeInspector from './components/NodeInspector';
import ExecutionLogs from './components/ExecutionLogs';
import MarketplaceModal from './components/MarketplaceModal';
import CodeEditorModal from './components/CodeEditorModal';
import SdkModal from './components/SdkModal';
import type { NodeKind, NodeStatus, WorkflowNode, RunRecord } from './components/types';

type EnvKey = 'dev' | 'staging' | 'prod';

const INITIAL_NODES: WorkflowNode[] = [
  { id: 'trigger', kind: 'trigger', x: 40, y: 40, status: 'idle' },
  { id: 'filter', kind: 'filter', x: 250, y: 40, status: 'idle' },
  { id: 'http', kind: 'http', x: 460, y: 40, status: 'idle' },
  { id: 'llm', kind: 'llm', x: 670, y: 40, status: 'idle' },
  { id: 'transform', kind: 'transform', x: 460, y: 170, status: 'idle' },
  { id: 'slack', kind: 'slack', x: 250, y: 170, status: 'idle' },
  { id: 'subflow', kind: 'subflow', x: 40, y: 170, status: 'idle' },
];

// Visual order matches execution order; we just reorder visit list.
const RUN_ORDER: NodeKind[] = [
  'trigger',
  'filter',
  'http',
  'llm',
  'transform',
  'slack',
  'subflow',
];

const INITIAL_RUNS: RunRecord[] = [
  {
    id: 'run_8f2a',
    startedAt: '14:02:11',
    durationMs: 1842,
    status: 'success',
    trigger: 'webhook POST',
    steps: [
      { nodeId: 'trigger', durationMs: 12, status: 'success' },
      { nodeId: 'filter', durationMs: 4, status: 'success' },
      { nodeId: 'http', durationMs: 612, status: 'success' },
      { nodeId: 'llm', durationMs: 980, status: 'success' },
      { nodeId: 'transform', durationMs: 18, status: 'success' },
      { nodeId: 'slack', durationMs: 142, status: 'success' },
      { nodeId: 'subflow', durationMs: 74, status: 'success' },
    ],
  },
  {
    id: 'run_8f1b',
    startedAt: '13:58:02',
    durationMs: 2410,
    status: 'retry',
    trigger: 'webhook POST',
    steps: [
      { nodeId: 'trigger', durationMs: 10, status: 'success' },
      { nodeId: 'filter', durationMs: 5, status: 'success' },
      { nodeId: 'http', durationMs: 1200, status: 'retry' },
      { nodeId: 'http', durationMs: 580, status: 'success' },
      { nodeId: 'llm', durationMs: 605, status: 'success' },
    ],
  },
  {
    id: 'run_8f0c',
    startedAt: '13:45:30',
    durationMs: 312,
    status: 'failed',
    trigger: 'schedule cron',
    steps: [
      { nodeId: 'trigger', durationMs: 8, status: 'success' },
      { nodeId: 'filter', durationMs: 4, status: 'success' },
      { nodeId: 'http', durationMs: 300, status: 'failed' },
    ],
  },
  {
    id: 'run_8eff',
    startedAt: '13:20:08',
    durationMs: 1620,
    status: 'success',
    trigger: 'webhook POST',
    steps: [
      { nodeId: 'trigger', durationMs: 11, status: 'success' },
      { nodeId: 'filter', durationMs: 4, status: 'success' },
      { nodeId: 'http', durationMs: 540, status: 'success' },
      { nodeId: 'llm', durationMs: 920, status: 'success' },
      { nodeId: 'slack', durationMs: 145, status: 'success' },
    ],
  },
];

const COMMITS = [
  { sha: 'a4f12c9', author: 'Ronald', ts: '14:02', key: 'c1' as const, current: true },
  { sha: 'd8e1b04', author: 'Lucía', ts: '12:31', key: 'c2' as const, current: false },
  { sha: '6c0f88a', author: 'Ronald', ts: 'ayer', key: 'c3' as const, current: false },
  { sha: '21bbe17', author: 'Mateo', ts: '-2d', key: 'c4' as const, current: false },
  { sha: '0099fa2', author: 'Ronald', ts: '-5d', key: 'c5' as const, current: false },
];

export default function AutomationDemoPage() {
  const t = useTranslations('demoAutomation');

  const [nodes, setNodes] = useState<WorkflowNode[]>(INITIAL_NODES);
  const [selectedId, setSelectedId] = useState<NodeKind | null>('llm');
  const [runs, setRuns] = useState<RunRecord[]>(INITIAL_RUNS);
  const [running, setRunning] = useState(false);
  const [activeEdgeIndex, setActiveEdgeIndex] = useState(-1);
  const [env, setEnv] = useState<EnvKey>('dev');
  const [envOpen, setEnvOpen] = useState(false);
  const [selfHosted, setSelfHosted] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [sdkOpen, setSdkOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);

  const handleRun = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setActiveEdgeIndex(-1);
    setNodes((prev) => prev.map((n) => ({ ...n, status: 'idle' as NodeStatus })));

    for (let i = 0; i < RUN_ORDER.length; i++) {
      const id = RUN_ORDER[i];
      setNodes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'running' } : n)),
      );
      setActiveEdgeIndex(i - 1);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 520));
      setNodes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'success' } : n)),
      );
    }
    setActiveEdgeIndex(RUN_ORDER.length - 1);

    // Append a synthetic run to logs
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const newRun: RunRecord = {
      id: `run_${Math.random().toString(16).slice(2, 6)}`,
      startedAt: `${hh}:${mm}:${ss}`,
      durationMs: 1600 + Math.floor(Math.random() * 700),
      status: 'success',
      trigger: 'manual run',
      steps: RUN_ORDER.map((nodeId) => ({
        nodeId,
        durationMs: 50 + Math.floor(Math.random() * 900),
        status: 'success' as const,
      })),
    };
    setRuns((prev) => [newRun, ...prev]);
    setRunning(false);
  }, [running]);

  const quotaExec = useMemo(() => ({ used: 42_300, total: 100_000 }), []);
  const quotaTokens = useMemo(
    () => ({ used: 1_840_000, total: 5_000_000 }),
    [],
  );
  const quotaStorage = useMemo(() => ({ used: 18, total: 50 }), []);

  return (
    <div className="min-h-screen bg-secondary-950 text-secondary-100 flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-secondary-800 bg-secondary-900/80 backdrop-blur-sm">
        <div className="px-3 sm:px-5 py-2.5 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setPaletteOpen((v) => !v)}
            className="lg:hidden p-1.5 rounded-md hover:bg-secondary-800"
            title={t('palette.title')}
          >
            <Bars3Icon className="h-4 w-4 text-secondary-300" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/20">
              <Squares2X2Icon className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-white truncate tracking-tight">
                {t('pageTitle')}
              </h1>
              <p className="text-[11px] text-secondary-500 truncate hidden sm:block">
                {t('header.workflow')} ·{' '}
                <span className="text-secondary-300">
                  {t('header.workflowName')}
                </span>
              </p>
            </div>
          </div>

          <div className="flex-1" />

          {/* Env selector */}
          <div className="relative">
            <button
              onClick={() => setEnvOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border border-secondary-700 bg-secondary-950 hover:bg-secondary-800 text-secondary-200"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  env === 'prod'
                    ? 'bg-rose-400'
                    : env === 'staging'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                }`}
              />
              <span className="font-mono">{t(`header.envs.${env}`)}</span>
              <span className="text-secondary-500 hidden sm:inline">
                · {t('header.version')}3
              </span>
              <ChevronDownIcon className="h-3 w-3" />
            </button>
            {envOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-secondary-900 border border-secondary-800 rounded-md shadow-xl z-30 p-1">
                {(['dev', 'staging', 'prod'] as EnvKey[]).map((e) => (
                  <button
                    key={e}
                    onClick={() => {
                      setEnv(e);
                      setEnvOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 text-xs rounded hover:bg-secondary-800 font-mono ${
                      env === e ? 'text-primary-300' : 'text-secondary-300'
                    }`}
                  >
                    {t(`header.envs.${e}`)}
                  </button>
                ))}
                <div className="border-t border-secondary-800 my-1" />
                <button className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-secondary-800 text-primary-300">
                  {t('actions.promote')}
                </button>
              </div>
            )}
          </div>

          {/* Self-hosted toggle */}
          <button
            onClick={() => setSelfHosted((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
              selfHosted
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                : 'border-secondary-700 bg-secondary-950 text-secondary-400 hover:text-secondary-200'
            }`}
            title={t('actions.selfHosted')}
          >
            {selfHosted ? (
              <ServerStackIcon className="h-3.5 w-3.5" />
            ) : (
              <CloudIcon className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">
              {selfHosted ? t('actions.selfHosted') : t('actions.cloud')}
            </span>
          </button>

          <button
            onClick={() => setMarketplaceOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border border-secondary-700 hover:bg-secondary-800 text-secondary-200"
          >
            <BookmarkSquareIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('actions.templates')}</span>
          </button>

          <button
            onClick={handleRun}
            disabled={running}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/20 disabled:opacity-70"
          >
            {running ? (
              <>
                <StopIcon className="h-3.5 w-3.5 animate-pulse" />
                {t('actions.running')}
              </>
            ) : (
              <>
                <PlayIcon className="h-3.5 w-3.5" />
                {t('actions.run')}
              </>
            )}
          </button>

          <button
            onClick={() => setInspectorOpen((v) => !v)}
            className="lg:hidden p-1.5 rounded-md hover:bg-secondary-800"
            title={t('inspector.title')}
          >
            <CommandLineIcon className="h-4 w-4 text-secondary-300" />
          </button>
        </div>
      </header>

      {/* Main 3-col layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left sidebar: palette */}
        <aside
          className={`${
            paletteOpen ? 'w-60' : 'w-0'
          } transition-all duration-200 border-r border-secondary-800 bg-secondary-900/50 overflow-hidden hidden lg:flex lg:flex-col`}
        >
          <NodePalette onOpenCode={() => setCodeOpen(true)} />
        </aside>

        {/* Mobile palette overlay */}
        {paletteOpen && (
          <div role="dialog" aria-modal="true" aria-label={t('palette.title')} className="lg:hidden fixed inset-0 z-40 flex">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setPaletteOpen(false)}
              aria-hidden="true"
            />
            <aside className="relative w-64 bg-secondary-900 border-r border-secondary-800 flex flex-col">
              <div className="flex justify-end p-2">
                <button onClick={() => setPaletteOpen(false)} aria-label={t('actions.close')}>
                  <XMarkIcon className="h-5 w-5 text-secondary-400" />
                </button>
              </div>
              <NodePalette onOpenCode={() => setCodeOpen(true)} />
            </aside>
          </div>
        )}

        {/* Center: canvas + bottom panel */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Canvas */}
          <div className="flex-1 min-h-[320px] p-3 flex">
            <WorkflowCanvas
              nodes={nodes}
              selectedId={selectedId}
              onSelect={setSelectedId}
              running={running}
              activeEdgeIndex={activeEdgeIndex}
            />
          </div>

          {/* Quotas + Versions row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 px-3 pb-2">
            <QuotasCard
              executions={quotaExec}
              tokens={quotaTokens}
              storage={quotaStorage}
            />
            <VersionsCard />
            <AlertsCard onOpen={() => setAlertsOpen(true)} />
          </div>

          {/* Logs panel */}
          <div className="border-t border-secondary-800 h-[260px] flex-shrink-0">
            <ExecutionLogs runs={runs} />
          </div>
        </main>

        {/* Right sidebar: inspector */}
        <aside
          className={`${
            inspectorOpen ? 'w-72' : 'w-0'
          } transition-all duration-200 border-l border-secondary-800 bg-secondary-900/50 overflow-hidden hidden lg:flex lg:flex-col`}
        >
          <NodeInspector nodeKind={selectedId} />
        </aside>

        {/* Mobile inspector overlay */}
        {inspectorOpen && (
          <div role="dialog" aria-modal="true" aria-label={t('inspector.title')} className="lg:hidden fixed inset-0 z-40 flex justify-end">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setInspectorOpen(false)}
              aria-hidden="true"
            />
            <aside className="relative w-72 bg-secondary-900 border-l border-secondary-800 flex flex-col">
              <div className="flex justify-end p-2">
                <button onClick={() => setInspectorOpen(false)} aria-label={t('actions.close')}>
                  <XMarkIcon className="h-5 w-5 text-secondary-400" />
                </button>
              </div>
              <NodeInspector nodeKind={selectedId} />
            </aside>
          </div>
        )}
      </div>

      {/* Footer with SDK button */}
      <footer className="border-t border-secondary-800 bg-secondary-900/80 px-4 py-2 flex items-center justify-between text-[11px] text-secondary-500">
        <div className="flex items-center gap-3">
          <span>© {t('pageTitle')}</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline font-mono">
            {t('header.lastRun')}: 14:02:11
          </span>
        </div>
        <button
          onClick={() => setSdkOpen(true)}
          className="inline-flex items-center gap-1.5 text-primary-400 hover:text-primary-300"
        >
          <CommandLineIcon className="h-3.5 w-3.5" />
          {t('actions.openSdk')}
        </button>
      </footer>

      {/* Modals */}
      <MarketplaceModal
        open={marketplaceOpen}
        onClose={() => setMarketplaceOpen(false)}
      />
      <CodeEditorModal open={codeOpen} onClose={() => setCodeOpen(false)} />
      <SdkModal open={sdkOpen} onClose={() => setSdkOpen(false)} />
      <AlertsModal open={alertsOpen} onClose={() => setAlertsOpen(false)} />
    </div>
  );

  // ---- Inline subcomponents (kept here to limit file count) ----

  function QuotasCard({
    executions,
    tokens,
    storage,
  }: {
    executions: { used: number; total: number };
    tokens: { used: number; total: number };
    storage: { used: number; total: number };
  }) {
    const tq = useTranslations('demoAutomation.quotas');
    const items = [
      {
        label: tq('executions'),
        used: executions.used,
        total: executions.total,
        format: (n: number) => n.toLocaleString(),
        color: 'from-emerald-500 to-emerald-400',
      },
      {
        label: tq('tokens'),
        used: tokens.used,
        total: tokens.total,
        format: (n: number) => `${(n / 1_000_000).toFixed(2)}M`,
        color: 'from-fuchsia-500 to-fuchsia-400',
      },
      {
        label: tq('storage'),
        used: storage.used,
        total: storage.total,
        format: (n: number) => `${n} GB`,
        color: 'from-sky-500 to-sky-400',
      },
    ];

    return (
      <div className="rounded-lg border border-secondary-800 bg-secondary-900/60 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <ArrowTrendingUpIcon className="h-3.5 w-3.5 text-primary-400" />
            <h3 className="text-xs font-semibold text-secondary-200">
              {tq('title')}
            </h3>
          </div>
          <Badge variant="primary" size="sm">
            {tq('plan')}: {tq('planName')}
          </Badge>
        </div>
        <div className="space-y-2">
          {items.map((it) => {
            const pct = Math.round((it.used / it.total) * 100);
            return (
              <div key={it.label}>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-secondary-400">{it.label}</span>
                  <span className="font-mono text-secondary-300">
                    {it.format(it.used)} / {it.format(it.total)}
                  </span>
                </div>
                <div className="h-1.5 bg-secondary-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${it.color}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-2 text-[10px] text-secondary-500">
          <span className="flex items-center gap-1">
            <ClockIcon className="h-3 w-3" />
            {tq('renewIn')} 12 {tq('days')}
          </span>
          <button className="text-primary-400 hover:text-primary-300 font-semibold">
            {tq('upgrade')} →
          </button>
        </div>
      </div>
    );
  }

  function VersionsCard() {
    const tv = useTranslations('demoAutomation.version');
    return (
      <div className="rounded-lg border border-secondary-800 bg-secondary-900/60 p-3">
        <h3 className="text-xs font-semibold text-secondary-200 mb-2">
          {tv('title')}
        </h3>
        <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
          {COMMITS.map((c) => (
            <div key={c.sha} className="flex items-center gap-2 text-[11px]">
              <span
                className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                  c.current ? 'bg-primary-400 ring-2 ring-primary-400/30' : 'bg-secondary-700'
                }`}
              />
              <span className="font-mono text-secondary-500 w-14 flex-shrink-0">
                {c.sha}
              </span>
              <span className="text-secondary-300 flex-1 truncate">
                {tv(`commits.${c.key}`)}
              </span>
              <span className="text-secondary-600 font-mono">{c.ts}</span>
            </div>
          ))}
        </div>
        <button className="mt-2 w-full text-[11px] text-primary-400 hover:text-primary-300 font-semibold py-1 rounded border border-primary-500/30 hover:bg-primary-500/10 transition-colors">
          {tv('promote')}
        </button>
      </div>
    );
  }

  function AlertsCard({ onOpen }: { onOpen: () => void }) {
    const ta = useTranslations('demoAutomation.alerts');
    return (
      <div className="rounded-lg border border-secondary-800 bg-secondary-900/60 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <ShieldExclamationIcon className="h-3.5 w-3.5 text-amber-400" />
            <h3 className="text-xs font-semibold text-secondary-200">
              {ta('title')}
            </h3>
          </div>
          <Badge variant="warning" size="sm">
            3
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center mb-2">
          <div className="rounded-md bg-secondary-950 border border-secondary-800 p-2">
            <p className="text-lg font-bold text-rose-400">14</p>
            <p className="text-[10px] text-secondary-500">{ta('dlqCount')}</p>
          </div>
          <div className="rounded-md bg-secondary-950 border border-secondary-800 p-2">
            <p className="text-lg font-bold text-amber-400">3</p>
            <p className="text-[10px] text-secondary-500">
              {ta('alertsActive')}
            </p>
          </div>
        </div>
        <button
          onClick={onOpen}
          className="w-full text-[11px] text-amber-300 hover:text-amber-200 font-semibold py-1 rounded border border-amber-500/30 hover:bg-amber-500/10 transition-colors"
        >
          {ta('reprocess')}
        </button>
      </div>
    );
  }

  function AlertsModal({
    open,
    onClose,
  }: {
    open: boolean;
    onClose: () => void;
  }) {
    const ta = useTranslations('demoAutomation.alerts');
    if (!open) return null;
    return (
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-secondary-900 border border-secondary-800 rounded-xl w-full max-w-lg flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-secondary-800">
            <div>
              <h2 className="text-base font-semibold text-white">
                {ta('title')}
              </h2>
              <p className="text-xs text-secondary-500">{ta('subtitle')}</p>
            </div>
            <button onClick={onClose} className="text-secondary-500 hover:text-white">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="p-5 space-y-3">
            {[
              { id: 'msg_a1', err: 'TimeoutError after 30s', node: 'http' },
              { id: 'msg_a2', err: '429 Rate limited by upstream', node: 'http' },
              { id: 'msg_a3', err: 'JSON parse failed at $.body', node: 'transform' },
            ].map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-2.5 rounded-md border border-rose-500/30 bg-rose-500/5"
              >
                <div className="min-w-0">
                  <p className="text-xs font-mono text-rose-300 truncate">
                    {m.id} · {m.node}
                  </p>
                  <p className="text-[11px] text-secondary-400 truncate">
                    {m.err}
                  </p>
                </div>
                <button className="text-[11px] px-2 py-1 rounded bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 flex-shrink-0 ml-2">
                  {ta('reprocess')}
                </button>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-secondary-800 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-secondary-300 hover:text-white"
            >
              {t('actions.close')}
            </button>
            <button className="px-3 py-1.5 text-xs bg-rose-600 hover:bg-rose-500 text-white rounded-md">
              {ta('purge')}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
