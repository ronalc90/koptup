'use client';

/**
 * Enterprise RAG Chatbot — flagship demo.
 *
 * Orquesta:
 *  - Sidebar de 19 capas de plataforma (primarias + collapse "más")
 *  - Chat central con streaming token-by-token y citas inline
 *  - PipelinePanel en vivo a la derecha (collapse on demand)
 *  - SourcePanel para "source highlighting" del chunk citado
 *  - CapabilityPanel modal con bullets por capa
 *  - StatsWidget flotante colapsable con telemetría agregada
 *  - TopBar con tenant / model / locale / device toggle / run sample
 *  - Onboarding tour de 4 pasos (dismiss persistido en localStorage)
 *
 * Toda la data es mock (ver components/data.ts). Llamada real opcional via chatWithBot.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  ChevronDoubleRightIcon,
  ChevronDoubleLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

import Sidebar from './components/Sidebar';
import ChatPanel, { type ChatMessage } from './components/ChatPanel';
import PipelinePanel from './components/PipelinePanel';
import CapabilityPanel from './components/CapabilityPanel';
import SourcePanel from './components/SourcePanel';
import StatsWidget from './components/StatsWidget';
import TopBar from './components/TopBar';
import ModeToggle, { type ChatbotMode } from './components/builder/ModeToggle';
import BuilderMode from './components/builder/BuilderMode';
import { chatWithBot, createBot, type RemoteChatReplySource } from './components/builder/api';
import Tooltip from './components/ui/Tooltip';
import InfoIcon from './components/ui/InfoIcon';
import DeviceFrame, { type DeviceKind } from './components/ui/DeviceFrame';
import {
  CONNECTED_SOURCES,
  SCENARIO_DATA,
  type LayerKey,
  type PipelineStepData,
  type ScenarioKey,
  type SourceChunk,
  TENANTS,
} from './components/data';

type TenantId = (typeof TENANTS)[number]['id'];

const STREAM_CHAR_INTERVAL_MS = 18;
const ONBOARDING_LS_KEY = 'koptup.demo.chatbot.onboarded';
const PLAYGROUND_BOT_LS_KEY = 'koptup.chatbot.demoBotId';

/**
 * Convierte las citas que devuelve el backend (RAG real sobre docs subidos
 * por el usuario) al shape `SourceChunk` que esperan ChatPanel/SourcePanel.
 * Si el backend no envía sources, devolvemos undefined para que la UI caiga
 * al payload del escenario.
 */
function mapRemoteSources(remote: RemoteChatReplySource[] | undefined): SourceChunk[] | undefined {
  if (!remote || remote.length === 0) return undefined;
  return remote.map((s) => ({
    id: s.id,
    // El backend no clasifica la fuente; usamos 'confluence' como placeholder
    // y exponemos `sourceName` para que la UI muestre el nombre real del doc.
    sourceKey: 'confluence' as SourceChunk['sourceKey'],
    sourceName: s.name,
    score: typeof s.score === 'number' ? s.score : 0,
    rerankScore: typeof s.score === 'number' ? s.score : 0,
    updated: new Date().toISOString().slice(0, 10),
    snippet: s.chunk ?? '',
  }));
}

/**
 * Resuelve el botId del Playground: 1) URL `?botId=`, 2) localStorage,
 * 3) si no existe ninguno, crea uno nuevo en el backend y lo cachea.
 */
async function resolvePlaygroundBotId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('botId');
    if (fromUrl) return fromUrl;
    const cached = window.localStorage.getItem(PLAYGROUND_BOT_LS_KEY);
    if (cached) return cached;
    const created = await createBot({ name: 'Playground Demo' });
    window.localStorage.setItem(PLAYGROUND_BOT_LS_KEY, created.botId);
    return created.botId;
  } catch {
    return null;
  }
}

/**
 * Hook auxiliar: simula la animación step-by-step del pipeline.
 * Devuelve el índice del step activo (o -1/length para idle/done).
 */
function usePipelineRunner(steps: PipelineStepData[], running: boolean): number {
  const [stepIndex, setStepIndex] = useState<number>(-1);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!running || steps.length === 0) return;
    setStepIndex(0);
    let i = 0;
    const tick = () => {
      i += 1;
      if (i >= steps.length) {
        setStepIndex(steps.length);
        return;
      }
      setStepIndex(i);
      const wait = Math.max(80, Math.min(420, steps[i].durationMs / 3));
      timeoutRef.current = setTimeout(tick, wait);
    };
    const firstWait = Math.max(80, Math.min(420, steps[0].durationMs / 3));
    timeoutRef.current = setTimeout(tick, firstWait);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [running, steps]);

  // Reset when steps reference changes and we're not running.
  useEffect(() => {
    if (!running) setStepIndex(steps.length > 0 ? steps.length : -1);
  }, [running, steps]);

  return stepIndex;
}

/**
 * Hook auxiliar: anima la escritura char-by-char del último mensaje del assistant.
 */
function useStreamingMessage(
  messageId: string | null,
  fullText: string | null,
  onDone: () => void,
): number {
  const [chars, setChars] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!messageId || !fullText) {
      setChars(0);
      return;
    }
    setChars(0);
    let i = 0;
    const step = () => {
      i = Math.min(i + 2, fullText.length);
      setChars(i);
      if (i >= fullText.length) {
        onDoneRef.current();
        return;
      }
      timer = setTimeout(step, STREAM_CHAR_INTERVAL_MS);
    };
    let timer = setTimeout(step, 350);
    return () => clearTimeout(timer);
  }, [messageId, fullText]);

  return chars;
}

export default function ChatbotDemoPage() {
  const t = useTranslations('demoChatbot');

  // UI state
  const [mode, setMode] = useState<ChatbotMode>('playground');
  const [tenant, setTenant] = useState<TenantId>('acme');
  const [modelId, setModelId] = useState<string>('gpt-4o-mini');
  const [locale, setLocale] = useState<'es' | 'en'>('es');
  const [activeLayer, setActiveLayer] = useState<LayerKey | null>(null);
  const [openChunk, setOpenChunk] = useState<SourceChunk | null>(null);
  const [showPipeline, setShowPipeline] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSources, setShowSources] = useState(false);
  const [device, setDevice] = useState<DeviceKind>('desktop');
  const [showSettings, setShowSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [thinkingId, setThinkingId] = useState<string | null>(null);

  // Pipeline state
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStepData[]>([]);
  const [pipelineTotals, setPipelineTotals] = useState<{
    latencyMs: number;
    tokens: number;
    cost: number;
  }>({ latencyMs: 0, tokens: 0, cost: 0 });
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const stepIndex = usePipelineRunner(pipelineSteps, pipelineRunning);

  // Telemetría agregada
  const [aggTokens, setAggTokens] = useState(0);
  const [aggLatency, setAggLatency] = useState(0);
  const [aggCost, setAggCost] = useState(0);
  const [cacheHit, setCacheHit] = useState(64.2);
  const [drift, setDrift] = useState(0.8);
  const [faithfulness, setFaithfulness] = useState(94);
  const [hallucination, setHallucination] = useState(0.6);

  // Drift / faithfulness / hallucination drift cada 4s (visual)
  useEffect(() => {
    const id = setInterval(() => {
      setCacheHit((v) => Math.max(40, Math.min(95, v + (Math.random() - 0.5) * 4)));
      setDrift((v) => Math.max(0.1, Math.min(3.5, v + (Math.random() - 0.5) * 0.4)));
      setFaithfulness((v) => Math.max(80, Math.min(99, v + (Math.random() - 0.5) * 2)));
      setHallucination((v) => Math.max(0.1, Math.min(3, v + (Math.random() - 0.5) * 0.3)));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  // Animación de streaming
  const streamingMsg = messages.find((m) => m.id === thinkingId && m.role === 'assistant');
  const targetText = streamingMsg && !streamingMsg.done ? streamingMsg.content : null;
  const streamedChars = useStreamingMessage(thinkingId, targetText, () => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === thinkingId ? { ...m, done: true, streamedChars: m.content.length } : m,
      ),
    );
    setIsStreaming(false);
    setThinkingId(null);
    setPipelineRunning(false);
  });

  // Reflejar streamedChars en el mensaje
  useEffect(() => {
    if (!thinkingId) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === thinkingId ? { ...m, streamedChars } : m)),
    );
  }, [streamedChars, thinkingId]);

  const runScenario = useCallback(
    (key: ScenarioKey) => {
      if (isStreaming) return;
      const payload = SCENARIO_DATA[key];
      const question = t(`scenarios.${key}.question`);
      const answer = t(`scenarios.${key}.answer`);

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: question,
      };
      const asstId = `a-${Date.now() + 1}`;
      const asstMsg: ChatMessage = {
        id: asstId,
        role: 'assistant',
        content: answer,
        scenario: key,
        sources: payload.sources,
        confidence: payload.confidence,
        streamedChars: 0,
        done: false,
      };

      setMessages((prev) => [...prev, userMsg, asstMsg]);
      setInput('');
      setPipelineSteps(payload.pipeline);
      setPipelineTotals({
        latencyMs: payload.totalLatencyMs,
        tokens: payload.totalTokens,
        cost: payload.costUsd,
      });
      setAggTokens((v) => v + payload.totalTokens);
      setAggLatency(payload.totalLatencyMs);
      setAggCost((v) => v + payload.costUsd);
      setPipelineRunning(true);
      setIsStreaming(true);
      setThinkingId(asstId);
    },
    [isStreaming, t],
  );

  const handleSend = useCallback(() => {
    if (!input.trim() || isStreaming) return;
    const q = input.toLowerCase();
    const key: ScenarioKey =
      /sql|revenue|facturar|warehouse|snowflake/.test(q) ? 'sql'
      : /code|funcion|función|class|implement|refresh|token/.test(q) ? 'code'
      : /graph|depend|teams|service|equipo/.test(q) ? 'graph'
      : /ticket|incident|payments|multi-hop|relacion/.test(q) ? 'multiHop'
      : 'docs';
    const payload = SCENARIO_DATA[key];
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: input };
    const asstId = `a-${Date.now() + 1}`;

    // Mensaje provisional con la respuesta de escenario; lo reemplazamos cuando
    // llegue la respuesta del backend (que cita los docs realmente cargados).
    const provisional = t(`scenarios.${key}.answer`);
    const asstMsg: ChatMessage = {
      id: asstId,
      role: 'assistant',
      content: provisional,
      scenario: key,
      sources: payload.sources,
      confidence: payload.confidence,
      streamedChars: 0,
      done: false,
    };
    setMessages((prev) => [...prev, userMsg, asstMsg]);
    const sentInput = input;
    setInput('');
    setPipelineSteps(payload.pipeline);
    setPipelineTotals({
      latencyMs: payload.totalLatencyMs,
      tokens: payload.totalTokens,
      cost: payload.costUsd,
    });
    setAggTokens((v) => v + payload.totalTokens);
    setAggLatency(payload.totalLatencyMs);
    setAggCost((v) => v + payload.costUsd);
    setPipelineRunning(true);
    setIsStreaming(true);
    setThinkingId(asstId);

    // Disparamos la llamada REAL al backend con retrieval BM25-lite sobre los
    // documentos que el usuario haya subido. Si todavía no hay docs (o no
    // matchea ninguno), el backend responde honestamente y la UI lo refleja.
    void (async () => {
      const botId = await resolvePlaygroundBotId();
      if (!botId) return;
      try {
        const res = await chatWithBot(botId, sentInput, [], modelId);
        const mappedSources = mapRemoteSources(res.sources);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstId
              ? {
                  ...m,
                  content: res.reply || provisional,
                  // Si hay sources reales del backend, las usamos; si no,
                  // mantenemos el payload del escenario (UX consistente).
                  sources: mappedSources ?? m.sources,
                  confidence:
                    typeof res.confidence === 'number'
                      ? Math.round(res.confidence * 100)
                      : m.confidence,
                }
              : m,
          ),
        );
        if (typeof res.latencyMs === 'number') setAggLatency(res.latencyMs);
        if (typeof res.costUSD === 'number') setAggCost((v) => v + res.costUSD!);
        if (res.tokens?.total) setAggTokens((v) => v + res.tokens!.total!);
      } catch {
        /* offline / error → mantenemos el provisional */
      }
    })();
  }, [input, isStreaming, modelId, t]);

  const handleCiteClick = useCallback((c: SourceChunk) => setOpenChunk(c), []);

  // Inicializar con un saludo
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content:
            t('chat.assistant') +
            ' · ' +
            t('chat.subtitle') +
            '\n\n→ ' +
            t('chat.scenarios') +
            ': ' +
            [t('chat.scenarioLabels.docs'), t('chat.scenarioLabels.multiHop'), t('chat.scenarioLabels.code'), t('chat.scenarioLabels.sql'), t('chat.scenarioLabels.graph')].join(' · '),
          done: true,
          streamedChars: undefined,
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Onboarding: si nunca se completó, mostrar el tour. Se persiste en localStorage.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const dismissed = window.localStorage.getItem(ONBOARDING_LS_KEY);
      if (!dismissed) setShowOnboarding(true);
    } catch {
      // localStorage no disponible (modo privado, etc.); no bloqueamos.
    }
  }, []);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(ONBOARDING_LS_KEY, '1');
      } catch {
        /* noop */
      }
    }
  }, []);

  // Cuando cambia locale via dropdown, actualizamos cookie + recargamos (best-effort).
  const handleLocaleChange = useCallback((l: 'es' | 'en') => {
    setLocale(l);
    if (typeof document !== 'undefined') {
      document.cookie = `locale=${l}; path=/; max-age=31536000`;
      // Soft reload para que next-intl tome el nuevo locale.
      if (typeof window !== 'undefined') window.location.reload();
    }
  }, []);

  const sourcesPanel = useMemo(
    () => (
      <div className="border-b border-secondary-200 px-4 py-3 dark:border-secondary-800">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary-500 dark:text-secondary-400">
            {t('ingestionStats.title')}
          </p>
          <InfoIcon content={t('ux.sectionInfo.sources')} side="bottom" align="end" />
        </div>
        <ul className="mt-2 space-y-1.5">
          {CONNECTED_SOURCES.map((s) => (
            <li
              key={s.key}
              className="flex items-center justify-between gap-2 rounded-md bg-secondary-50 px-2.5 py-1.5 text-xs ring-1 ring-secondary-100 transition hover:ring-primary-200 dark:bg-secondary-800/60 dark:ring-secondary-700/60 dark:hover:ring-primary-800"
            >
              <div className="min-w-0">
                <div className="truncate font-semibold text-secondary-800 dark:text-secondary-100">
                  {t(`sources.${s.key}`)}
                </div>
                <div className="text-[10px] text-secondary-500 dark:text-secondary-400">
                  {t('ingestionStats.lastSync')}: {s.lastSync}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-xs font-bold text-secondary-900 dark:text-white">
                  {s.count.toLocaleString()}
                </div>
                <div className="text-[10px] text-secondary-500 dark:text-secondary-400">
                  {t(`ingestionStats.${s.unitKey}`)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    ),
    [t],
  );

  const isDesktop = device === 'desktop';

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-secondary-50 text-secondary-900 dark:bg-secondary-950 dark:text-secondary-100 md:h-[calc(100vh-5rem)]">
      <TopBar
        tenant={tenant}
        onTenantChange={setTenant}
        modelId={modelId}
        onModelChange={setModelId}
        locale={locale}
        onLocaleChange={handleLocaleChange}
        onRunSample={runScenario}
        isStreaming={isStreaming}
        device={device}
        onDeviceChange={setDevice}
        onOpenSettings={() => setShowSettings(true)}
      />

      <ModeToggle mode={mode} onChange={setMode} />

      {mode === 'builder' ? <BuilderMode /> : (
      <>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (oculto en mobile-view) */}
        {showSidebar && isDesktop ? (
          <div className="hidden w-72 shrink-0 flex-col overflow-hidden md:flex">
            {sourcesPanel}
            <Sidebar activeLayer={activeLayer} onSelect={(k) => setActiveLayer(k)} />
          </div>
        ) : null}

        {/* Center: chat (envuelto en device frame cuando device=mobile) */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-secondary-200 bg-white/85 px-3 py-2 backdrop-blur dark:border-secondary-800 dark:bg-secondary-900/85">
            <Tooltip content={t('ux.tooltips.toggleSidebar')} side="bottom">
              <button
                type="button"
                onClick={() => setShowSidebar((v) => !v)}
                disabled={!isDesktop}
                className="hidden items-center gap-1 rounded-md border border-secondary-200 px-2 py-1 text-[11px] font-medium text-secondary-600 transition hover:border-primary-300 hover:bg-secondary-50 hover:text-secondary-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-secondary-700 dark:text-secondary-300 dark:hover:bg-secondary-800 dark:hover:text-white md:inline-flex"
                aria-label={t('ux.tooltips.toggleSidebar')}
              >
                {showSidebar ? (
                  <ChevronDoubleLeftIcon className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDoubleRightIcon className="h-3.5 w-3.5" />
                )}
                <BookOpenIcon className="h-3.5 w-3.5" />
                {t('sidebar.title')}
              </button>
            </Tooltip>
            <Tooltip content={t('ux.tooltips.toggleSources')} side="bottom">
              <button
                type="button"
                onClick={() => setShowSources((v) => !v)}
                className="inline-flex items-center gap-1 rounded-md border border-secondary-200 px-2 py-1 text-[11px] font-medium text-secondary-600 transition hover:border-primary-300 hover:bg-secondary-50 hover:text-secondary-900 dark:border-secondary-700 dark:text-secondary-300 dark:hover:bg-secondary-800 dark:hover:text-white md:hidden"
              >
                <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
                {t('ingestionStats.title')}
              </button>
            </Tooltip>
            <Tooltip content={t('ux.tooltips.togglePipeline')} side="bottom" align="end">
              <button
                type="button"
                onClick={() => setShowPipeline((v) => !v)}
                disabled={!isDesktop}
                className="inline-flex items-center gap-1 rounded-md border border-secondary-200 px-2 py-1 text-[11px] font-medium text-secondary-600 transition hover:border-primary-300 hover:bg-secondary-50 hover:text-secondary-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-secondary-700 dark:text-secondary-300 dark:hover:bg-secondary-800 dark:hover:text-white"
                aria-label={t('ux.tooltips.togglePipeline')}
              >
                {showPipeline ? (
                  <ChevronDoubleRightIcon className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDoubleLeftIcon className="h-3.5 w-3.5" />
                )}
                {t('pipeline.title')}
              </button>
            </Tooltip>
          </div>

          <div className="flex-1 overflow-hidden">
            <DeviceFrame
              device={device}
              label={device === 'mobile' ? t('ux.device.mobileFrameLabel') : undefined}
              ariaLabel={t('ux.device.label')}
            >
              <ChatPanel
                messages={messages}
                input={input}
                onInput={setInput}
                onSend={handleSend}
                onRunScenario={runScenario}
                onCiteClick={handleCiteClick}
                isStreaming={isStreaming}
                thinkingMessageId={
                  thinkingId && streamedChars === 0 ? thinkingId : null
                }
              />
            </DeviceFrame>
          </div>
        </main>

        {/* Pipeline right (oculto en mobile-view) */}
        {showPipeline && isDesktop ? (
          <div className="hidden w-80 shrink-0 lg:flex">
            <PipelinePanel
              running={pipelineRunning}
              activeStepIndex={stepIndex}
              steps={pipelineSteps}
              totalLatencyMs={pipelineTotals.latencyMs}
              totalTokens={pipelineTotals.tokens}
              costUsd={pipelineTotals.cost}
            />
          </div>
        ) : null}
      </div>

      {/* Modales */}
      <CapabilityPanel layerKey={activeLayer} onClose={() => setActiveLayer(null)} />
      <SourcePanel chunk={openChunk} onClose={() => setOpenChunk(null)} />

      {/* Drawer mobile de sources */}
      {showSources ? (
        <div
          className="fixed inset-0 z-40 flex items-stretch bg-black/50 md:hidden"
          onClick={() => setShowSources(false)}
        >
          <div
            className="w-72 bg-white shadow-2xl dark:bg-secondary-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-bold">{t('sidebar.title')}</span>
              <button
                type="button"
                onClick={() => setShowSources(false)}
                aria-label={t('sourcePanel.close')}
                className="rounded p-1 hover:bg-secondary-100 dark:hover:bg-secondary-800"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            {sourcesPanel}
            <Sidebar
              activeLayer={activeLayer}
              onSelect={(k) => {
                setActiveLayer(k);
                setShowSources(false);
              }}
            />
          </div>
        </div>
      ) : null}

      {/* Settings drawer (presentación: explicación + CTA a Builder Mode) */}
      {showSettings ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-secondary-200 bg-white p-6 shadow-2xl dark:border-secondary-700 dark:bg-secondary-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="settings-title"
                  className="text-lg font-bold tracking-tight text-secondary-900 dark:text-white"
                >
                  {t('ux.advancedConfig.title')}
                </h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-secondary-600 dark:text-secondary-300">
                  {t('ux.advancedConfig.body')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                aria-label={t('ux.advancedConfig.close')}
                className="rounded-md p-1.5 text-secondary-500 transition hover:bg-secondary-100 hover:text-secondary-900 dark:hover:bg-secondary-800 dark:hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="rounded-md border border-secondary-200 bg-white px-3 py-1.5 text-xs font-medium text-secondary-700 transition hover:bg-secondary-50 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-200 dark:hover:bg-secondary-800"
              >
                {t('ux.advancedConfig.close')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSettings(false);
                  setMode('builder');
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700"
              >
                {t('ux.advancedConfig.cta')}
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <StatsWidget
        tokens={aggTokens}
        latencyMs={aggLatency}
        costUsd={aggCost}
        cacheHitPct={cacheHit}
        driftPct={drift}
        faithfulnessPct={faithfulness}
        hallucinationPct={hallucination}
      />

      {/* Onboarding tour: 4 pasos. Persistido en localStorage. */}
      {showOnboarding ? (
        <OnboardingTour
          step={onboardingStep}
          onNext={() => setOnboardingStep((s) => Math.min(3, s + 1))}
          onSkip={dismissOnboarding}
          onDone={dismissOnboarding}
        />
      ) : null}
      </>
      )}
    </div>
  );
}

/**
 * Onboarding inline. Overlay sutil + tarjeta central con 4 pasos.
 * Dismiss persistido en localStorage para no molestar en visitas siguientes.
 */
function OnboardingTour({
  step,
  onNext,
  onSkip,
  onDone,
}: {
  step: number;
  onNext: () => void;
  onSkip: () => void;
  onDone: () => void;
}) {
  const t = useTranslations('demoChatbot');
  const steps = [
    { title: t('ux.onboarding.step1Title'), body: t('ux.onboarding.step1Body') },
    { title: t('ux.onboarding.step2Title'), body: t('ux.onboarding.step2Body') },
    { title: t('ux.onboarding.step3Title'), body: t('ux.onboarding.step3Body') },
    { title: t('ux.onboarding.step4Title'), body: t('ux.onboarding.step4Body') },
  ];
  const current = steps[Math.min(step, steps.length - 1)];
  const isLast = step >= steps.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-secondary-200 bg-white p-6 shadow-2xl dark:border-secondary-700 dark:bg-secondary-900">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-300">
          {t('ux.onboarding.title')} · {step + 1}/{steps.length}
        </p>
        <h2
          id="onboarding-title"
          className="mt-1.5 text-lg font-bold tracking-tight text-secondary-900 dark:text-white"
        >
          {current.title}
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-secondary-600 dark:text-secondary-300">
          {current.body}
        </p>
        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="text-[11px] font-medium text-secondary-500 transition hover:text-secondary-800 dark:text-secondary-400 dark:hover:text-secondary-100"
          >
            {t('ux.onboarding.skip')}
          </button>
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition ${
                  i === step
                    ? 'bg-primary-600 dark:bg-primary-400'
                    : 'bg-secondary-300 dark:bg-secondary-700'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={isLast ? onDone : onNext}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700"
          >
            {isLast ? t('ux.onboarding.done') : t('ux.onboarding.next')}
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
