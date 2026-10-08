'use client';

/**
 * Demo RAG (producto principal de KopTup) — /demo/chatbot.
 *
 * Tres modos:
 *  - "Prueba el asistente" (Playground): tres empresas FICTICIAS con sus
 *    documentos (`components/sampleKnowledge.ts`). Al elegir una, el navegador
 *    crea un bot real en el backend y le sube esos textos; cada pregunta va a
 *    `POST /api/chatbot/bots/:id/chat` (búsqueda BM25 top 5 → modelo de OpenAI
 *    o modo extractivo → citas). No hay respuestas prefabricadas, métricas
 *    aleatorias ni pasos simulados: todo lo que se muestra sale de la
 *    respuesta del backend o se mide en el navegador.
 *  - "Prueba con tu documento": `components/upload/` (API /api/demo-rag).
 *  - "Configura el tuyo": `components/builder/` (bot propio, widget real y
 *    código para insertar).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import {
  ArrowRightIcon,
  BookOpenIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  DocumentTextIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import Sidebar, { type KbPhase } from './components/Sidebar';
import ChatPanel from './components/ChatPanel';
import PipelinePanel from './components/PipelinePanel';
import CapabilityPanel from './components/CapabilityPanel';
import SourcePanel from './components/SourcePanel';
import DocumentViewer from './components/DocumentViewer';
import StatsWidget, { type SessionStats } from './components/StatsWidget';
import TopBar, { type AiStatus } from './components/TopBar';
import ModeToggle, { type ChatbotMode } from './components/builder/ModeToggle';
import BuilderMode from './components/builder/BuilderMode';
import UploadDemo from './components/upload/UploadDemo';
import DeviceFrame, { type DeviceKind } from './components/ui/DeviceFrame';
import { trackDemoStart, type DemoEventMode } from './components/demoEvents';
import {
  BotApiError,
  chatWithBot,
  getBot,
  isGenerativeReply,
  isNotFoundReply,
  listModels,
  type RemoteModelMeta,
} from './components/builder/api';
import { ensureSampleBot, resetSampleBot, type SampleBotState } from './components/sampleBot';
import {
  findSampleDocument,
  getSampleCompanies,
  getSampleCompany,
  type SampleCompany,
  type SampleCompanyKey,
  type SampleDocument,
  type SampleLocale,
} from './components/sampleKnowledge';
import {
  DEFAULT_MODEL_ID,
  countCitations,
  type AnswerMeta,
  type ChatMessage,
  type IncludedKey,
  type SourceChunk,
} from './components/data';

const ONBOARDING_LS_KEY = 'koptup.demo.chatbot.tour.v2';
const MODES: readonly ChatbotMode[] = ['playground', 'upload', 'builder'];
const HISTORY_TURNS = 10;

function welcomeMessage(company: SampleCompany): ChatMessage {
  return { id: `welcome-${company.key}`, role: 'assistant', content: company.welcome, welcome: true };
}

/** Historial que se envía al backend (solo turnos reales, sin bienvenida ni errores). */
function toHistory(messages: ChatMessage[]): Array<{ role: string; content: string }> {
  return messages
    .filter((m) => !m.welcome && !m.pending && !m.errorKey && m.content.trim().length > 0)
    .slice(-HISTORY_TURNS)
    .map((m) => ({ role: m.role, content: m.content }));
}

export default function ChatbotDemoPage() {
  const t = useTranslations('demoChatbot');
  const locale: SampleLocale = useLocale() === 'en' ? 'en' : 'es';
  const companies = useMemo(() => getSampleCompanies(locale), [locale]);

  // --- UI ---------------------------------------------------------------
  const [mode, setMode] = useState<ChatbotMode>('playground');
  /** true cuando ya se leyó ?mode= de la URL (evita indexar la empresa si se entra a otro modo). */
  const [modeResolved, setModeResolved] = useState(false);
  const [companyKey, setCompanyKey] = useState<SampleCompanyKey>('rrhh');
  const company = useMemo(() => getSampleCompany(companyKey, locale), [companyKey, locale]);
  const [device, setDevice] = useState<DeviceKind>('desktop');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showPipeline, setShowPipeline] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [activeIncluded, setActiveIncluded] = useState<IncludedKey | null>(null);
  const [openChunk, setOpenChunk] = useState<SourceChunk | null>(null);
  const [viewer, setViewer] = useState<{ doc: SampleDocument; highlight: string | null } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  // --- IA (estado real del backend) --------------------------------------
  const [models, setModels] = useState<RemoteModelMeta[]>([]);
  const [aiStatus, setAiStatus] = useState<AiStatus>('checking');
  const [modelId, setModelId] = useState<string>(DEFAULT_MODEL_ID);

  // --- Base de conocimiento de la empresa de ejemplo ----------------------
  const [kbPhase, setKbPhase] = useState<KbPhase>('preparing');
  const [botState, setBotState] = useState<SampleBotState | null>(null);
  const [kbAttempt, setKbAttempt] = useState(0);
  const botPromiseRef = useRef<Promise<SampleBotState> | null>(null);

  // --- Chat --------------------------------------------------------------
  const [messages, setMessages] = useState<ChatMessage[]>(() => [welcomeMessage(getSampleCompany('rrhh', locale))]);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  // Respuestas de empresas anteriores en esta pestaña (para las métricas de la sesión).
  const [archived, setArchived] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const idRef = useRef(0);
  const askedRef = useRef<Set<string>>(new Set());

  // `demo_start` = primera pregunta de la visita (documento de ejemplo o propio).
  const demoStartedRef = useRef(false);
  const markDemoStart = useCallback((demoMode: DemoEventMode) => {
    if (demoStartedRef.current) return;
    demoStartedRef.current = true;
    trackDemoStart({ mode: demoMode });
  }, []);
  const markUploadQuestion = useCallback(() => markDemoStart('upload'), [markDemoStart]);

  // Modo inicial desde la URL (?mode=upload|builder), solo en el cliente.
  useEffect(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get('mode');
      if (fromUrl && (MODES as readonly string[]).includes(fromUrl)) setMode(fromUrl as ChatbotMode);
    } catch {
      /* URL no disponible */
    }
    setModeResolved(true);
  }, []);

  const changeMode = useCallback((next: ChatbotMode) => {
    setMode(next);
    try {
      const url = new URL(window.location.href);
      if (next === 'playground') url.searchParams.delete('mode');
      else url.searchParams.set('mode', next);
      if (next !== 'builder') url.searchParams.delete('botId');
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`);
    } catch {
      /* sin History API: el modo igual cambia */
    }
  }, []);

  // Modelos y estado de la IA: GET /api/chatbot/models.
  useEffect(() => {
    let cancelled = false;
    listModels()
      .then((data) => {
        if (cancelled) return;
        setModels(data.available);
        setAiStatus(data.activeProvider ? 'generative' : 'extractive');
        const enabled = data.available.filter((m) => m.enabled);
        setModelId((current) =>
          enabled.some((m) => m.id === current) ? current : (enabled.find((m) => m.recommended) ?? enabled[0])?.id ?? current,
        );
      })
      .catch(() => {
        if (!cancelled) setAiStatus('offline');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Indexa (o reutiliza) el bot de la empresa elegida en el backend (solo en este modo).
  const inPlayground = mode === 'playground';
  useEffect(() => {
    if (!modeResolved || !inPlayground) return;
    let cancelled = false;
    setKbPhase('preparing');
    setBotState(null);
    const p = ensureSampleBot(company, locale);
    botPromiseRef.current = p;
    p.then((state) => {
      if (cancelled) return;
      setBotState(state);
      setKbPhase('ready');
    }).catch(() => {
      if (!cancelled) setKbPhase('error');
    });
    return () => {
      cancelled = true;
    };
  }, [company, locale, kbAttempt, inPlayground, modeResolved]);

  // Recorrido de bienvenida (se guarda en localStorage al cerrarlo).
  useEffect(() => {
    try {
      if (!window.localStorage.getItem(ONBOARDING_LS_KEY)) setShowOnboarding(true);
    } catch {
      /* localStorage no disponible: no mostramos el recorrido */
    }
  }, []);

  // El panel lateral en móvil se cierra con Escape.
  useEffect(() => {
    if (!showDrawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowDrawer(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showDrawer]);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    try {
      window.localStorage.setItem(ONBOARDING_LS_KEY, '1');
    } catch {
      /* noop */
    }
  }, []);

  const handleCompanyChange = useCallback(
    (key: SampleCompanyKey) => {
      if (key === companyKey) return;
      setCompanyKey(key);
      setArchived((prev) => [...prev, ...messagesRef.current.filter((m) => m.meta || m.feedback)]);
      setMessages([welcomeMessage(getSampleCompany(key, locale))]);
      askedRef.current = new Set();
      setOpenChunk(null);
      setViewer(null);
      setInput('');
    },
    [companyKey, locale],
  );

  /** ¿El bot sigue teniendo sus documentos? (si el servidor perdió su estado, se reindexa). */
  const botStillIndexed = useCallback(
    async (botId: string) => {
      try {
        const bot = await getBot(botId);
        return (bot.docs?.length ?? 0) >= company.docs.length;
      } catch (err) {
        return !(err instanceof BotApiError && err.status === 404);
      }
    },
    [company],
  );

  /** Pregunta real al backend. `replaceId` reutiliza una respuesta existente ("Volver a preguntar"). */
  const ask = useCallback(
    async (question: string, replaceId?: string) => {
      const q = question.trim();
      if (!q || busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      markDemoStart('sample');
      askedRef.current.add(q);

      const current = messagesRef.current;
      let asstId: string;
      let history: Array<{ role: string; content: string }>;
      if (replaceId) {
        asstId = replaceId;
        const idx = current.findIndex((m) => m.id === replaceId);
        // Historial: todo lo anterior a la pregunta que originó esta respuesta.
        history = toHistory(current.slice(0, Math.max(0, idx - 1)));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === replaceId
              ? { ...m, pending: true, errorKey: undefined, content: '', sources: undefined, meta: undefined, feedback: undefined }
              : m,
          ),
        );
      } else {
        idRef.current += 1;
        const userId = `u-${idRef.current}`;
        asstId = `a-${idRef.current}`;
        history = toHistory(current);
        setMessages((prev) => [
          ...prev,
          { id: userId, role: 'user', content: q },
          { id: asstId, role: 'assistant', content: '', pending: true, question: q },
        ]);
      }

      try {
        let state = await (botPromiseRef.current ?? ensureSampleBot(company, locale));
        let started = performance.now();
        let res = await chatWithBot(state.botId, q, history, modelId);
        if (res.sources.length === 0 && !(await botStillIndexed(state.botId))) {
          // El backend perdió los documentos (p. ej. se reinició): se reindexa y se repite una vez.
          resetSampleBot(company, locale);
          setKbPhase('preparing');
          const p = ensureSampleBot(company, locale);
          botPromiseRef.current = p;
          state = await p;
          setBotState(state);
          setKbPhase('ready');
          started = performance.now();
          res = await chatWithBot(state.botId, q, history, modelId);
        }
        const clientLatencyMs = Math.round(performance.now() - started);
        const sources: SourceChunk[] = res.sources.map((s, i) => ({
          id: s.id,
          index: s.index ?? i + 1,
          docName: s.name,
          score: typeof s.score === 'number' ? s.score : 0,
          text: s.chunk ?? '',
        }));
        const generative = isGenerativeReply(res);
        const notFound = isNotFoundReply(res);
        const meta: AnswerMeta = {
          model: res.model ?? '—',
          generative,
          providerError: !!res.error,
          backendLatencyMs: generative ? res.latencyMs : undefined,
          clientLatencyMs,
          tokens: res.tokens,
          costUSD: res.costUSD,
          notFound,
          citationsUsed: countCitations(res.reply, sources.length),
          docsIndexed: state.docs.length,
        };
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstId ? { ...m, pending: false, content: res.reply, sources, meta, question: q } : m,
          ),
        );
      } catch (err) {
        const errorKey = err instanceof BotApiError && err.status === 0 ? 'errorNetwork' : 'errorGeneric';
        setMessages((prev) =>
          prev.map((m) => (m.id === asstId ? { ...m, pending: false, errorKey, question: q } : m)),
        );
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [botStillIndexed, company, locale, markDemoStart, modelId],
  );

  const handleSend = useCallback(() => {
    const q = input.trim();
    if (!q || busyRef.current) return;
    setInput('');
    void ask(q);
  }, [ask, input]);

  const handleRegenerate = useCallback(
    (messageId: string) => {
      const msg = messagesRef.current.find((m) => m.id === messageId);
      if (msg?.question) void ask(msg.question, messageId);
    },
    [ask],
  );

  const handleFeedback = useCallback(
    (messageId: string, value: 'up' | 'down') => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, feedback: m.feedback === value ? undefined : value } : m)),
      );
      toast.success(t('chat.feedbackSaved'), { id: 'chatbot-feedback' });
    },
    [t],
  );

  /** "Pregunta de ejemplo": la siguiente sugerida que aún no se ha hecho. */
  const handleAskSample = useCallback(() => {
    if (mode !== 'playground') changeMode('playground');
    const all = [...company.questions, company.outOfScope];
    let next = all.find((q) => !askedRef.current.has(q));
    if (!next) {
      askedRef.current = new Set();
      next = all[0];
    }
    void ask(next);
  }, [ask, changeMode, company, mode]);

  const handleOpenChunkDocument = useCallback(
    (chunk: SourceChunk) => {
      const doc = findSampleDocument(company, chunk.docName);
      if (!doc) return;
      setOpenChunk(null);
      setViewer({ doc, highlight: chunk.text });
    },
    [company],
  );

  const closeChunk = useCallback(() => setOpenChunk(null), []);
  const closeViewer = useCallback(() => setViewer(null), []);
  const closeIncluded = useCallback(() => setActiveIncluded(null), []);

  // Última respuesta (para "Cómo se respondió").
  const lastAnswer = useMemo(
    () => [...messages].reverse().find((m) => m.role === 'assistant' && !m.welcome && (m.meta || m.pending)),
    [messages],
  );

  // Métricas de la sesión con las respuestas reales.
  const stats: SessionStats = useMemo(() => {
    const all = [...archived, ...messages];
    const answers = all.filter((m) => m.role === 'assistant' && m.meta);
    const latencies = answers.map((m) => m.meta!.clientLatencyMs);
    return {
      questions: answers.length,
      withSources: answers.filter((m) => !m.meta!.notFound && (m.sources?.length ?? 0) > 0).length,
      notFound: answers.filter((m) => m.meta!.notFound).length,
      avgLatencyMs: latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0,
      tokens: answers.reduce((sum, m) => sum + (m.meta!.tokens?.total ?? 0), 0),
      costUSD: answers.reduce((sum, m) => sum + (m.meta!.costUSD ?? 0), 0),
      feedbackUp: all.filter((m) => m.feedback === 'up').length,
      feedbackDown: all.filter((m) => m.feedback === 'down').length,
    };
  }, [archived, messages]);

  // Si hay clave de IA pero la última llamada al proveedor falló, se dice en la barra.
  const effectiveAiStatus: AiStatus =
    aiStatus === 'generative' && lastAnswer?.meta?.providerError ? 'degraded' : aiStatus;

  const isDesktop = device === 'desktop';
  const chunkDocAvailable = openChunk ? !!findSampleDocument(company, openChunk.docName) : false;

  const sidebar = (
    <Sidebar
      company={company}
      kbPhase={kbPhase}
      docsIndexed={botState?.docs.length ?? 0}
      onRetry={() => setKbAttempt((n) => n + 1)}
      onOpenDocument={(doc) => {
        setShowDrawer(false);
        setViewer({ doc, highlight: null });
      }}
      activeIncluded={activeIncluded}
      onSelectIncluded={(k) => {
        setShowDrawer(false);
        setActiveIncluded(k);
      }}
    />
  );

  return (
    <div
      className={`flex flex-col bg-secondary-50 text-secondary-900 dark:bg-secondary-950 dark:text-secondary-100 ${
        mode === 'playground' ? 'h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]' : 'min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)]'
      }`}
    >
      <TopBar
        aiStatus={effectiveAiStatus}
        showPlaygroundControls={mode === 'playground'}
        companies={companies}
        companyKey={companyKey}
        onCompanyChange={handleCompanyChange}
        models={models}
        modelId={modelId}
        onModelChange={setModelId}
        onAskSample={handleAskSample}
        askDisabled={busy}
        device={device}
        onDeviceChange={setDevice}
      />

      <ModeToggle mode={mode} onChange={changeMode} />

      {mode === 'builder' ? (
        <BuilderMode />
      ) : mode === 'upload' ? (
        <UploadDemo onUseSample={() => changeMode('playground')} onQuestion={markUploadQuestion} />
      ) : (
        <>
          <div className="flex min-h-0 flex-1 overflow-hidden">
            {showSidebar && isDesktop ? (
              <div className="hidden w-72 shrink-0 flex-col overflow-hidden md:flex">{sidebar}</div>
            ) : null}

            <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-secondary-200 bg-white/85 px-3 py-1.5 backdrop-blur dark:border-secondary-800 dark:bg-secondary-900/85">
                <button
                  type="button"
                  onClick={() => setShowSidebar((v) => !v)}
                  disabled={!isDesktop}
                  aria-expanded={showSidebar && isDesktop}
                  className="hidden items-center gap-1 rounded-md border border-secondary-200 px-2 py-1 text-[11px] font-medium text-secondary-600 transition hover:border-primary-300 hover:bg-secondary-50 hover:text-secondary-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-secondary-700 dark:text-secondary-300 dark:hover:bg-secondary-800 dark:hover:text-white md:inline-flex"
                >
                  {showSidebar ? <ChevronDoubleLeftIcon className="h-3.5 w-3.5" /> : <ChevronDoubleRightIcon className="h-3.5 w-3.5" />}
                  <BookOpenIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('kb.title')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDrawer(true)}
                  className="inline-flex items-center gap-1 rounded-md border border-secondary-200 px-2 py-1 text-[11px] font-medium text-secondary-600 transition hover:border-primary-300 hover:bg-secondary-50 hover:text-secondary-900 dark:border-secondary-700 dark:text-secondary-300 dark:hover:bg-secondary-800 dark:hover:text-white md:hidden"
                >
                  <DocumentTextIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('kb.title')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPipeline((v) => !v)}
                  disabled={!isDesktop}
                  aria-expanded={showPipeline && isDesktop}
                  className="hidden items-center gap-1 rounded-md border border-secondary-200 px-2 py-1 text-[11px] font-medium text-secondary-600 transition hover:border-primary-300 hover:bg-secondary-50 hover:text-secondary-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-secondary-700 dark:text-secondary-300 dark:hover:bg-secondary-800 dark:hover:text-white lg:inline-flex"
                >
                  {showPipeline ? <ChevronDoubleRightIcon className="h-3.5 w-3.5" /> : <ChevronDoubleLeftIcon className="h-3.5 w-3.5" />}
                  {t('pipeline.toggle')}
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden">
                <DeviceFrame
                  device={device}
                  label={device === 'mobile' ? t('topBar.device.mobileFrameLabel') : undefined}
                  ariaLabel={t('topBar.device.label')}
                >
                  <ChatPanel
                    companyName={company.name}
                    messages={messages}
                    input={input}
                    onInput={setInput}
                    onSend={handleSend}
                    suggestions={company.questions}
                    outOfScope={company.outOfScope}
                    onAsk={(q) => void ask(q)}
                    onCiteClick={setOpenChunk}
                    onFeedback={handleFeedback}
                    onRegenerate={handleRegenerate}
                    busy={busy}
                    preparing={kbPhase === 'preparing'}
                  />
                </DeviceFrame>
              </div>
            </main>

            {showPipeline && isDesktop ? (
              <div className="hidden w-80 shrink-0 lg:flex">
                <PipelinePanel
                  running={!!lastAnswer?.pending}
                  meta={lastAnswer?.pending ? null : lastAnswer?.meta ?? null}
                  sources={lastAnswer?.sources ?? []}
                />
              </div>
            ) : null}
          </div>

          <CapabilityPanel itemKey={activeIncluded} onClose={closeIncluded} />
          <SourcePanel
            chunk={openChunk}
            onClose={closeChunk}
            onOpenDocument={chunkDocAvailable ? handleOpenChunkDocument : undefined}
          />
          <DocumentViewer
            doc={viewer?.doc ?? null}
            companyName={company.name}
            highlight={viewer?.highlight}
            onClose={closeViewer}
          />

          {showDrawer ? (
            <div className="fixed inset-0 z-[150] flex items-stretch bg-black/50 md:hidden" onClick={() => setShowDrawer(false)}>
              <div
                className="flex w-80 max-w-[85vw] flex-col bg-white shadow-2xl dark:bg-secondary-900"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={t('kb.title')}
              >
                <div className="flex items-center justify-between border-b border-secondary-200 px-4 py-3 dark:border-secondary-800">
                  <span className="text-sm font-bold">{t('kb.title')}</span>
                  <button
                    type="button"
                    onClick={() => setShowDrawer(false)}
                    aria-label={t('sourcePanel.close')}
                    className="rounded p-1 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex min-h-0 flex-1 flex-col">{sidebar}</div>
              </div>
            </div>
          ) : null}

          <StatsWidget stats={stats} />

          {showOnboarding ? (
            <OnboardingTour
              step={onboardingStep}
              onNext={() => setOnboardingStep((s) => Math.min(4, s + 1))}
              onSkip={dismissOnboarding}
              onDone={dismissOnboarding}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

/** Recorrido de 5 pasos. Se guarda en localStorage para no repetirlo. */
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
  const t = useTranslations('demoChatbot.onboarding');
  const steps = [1, 2, 3, 4, 5].map((n) => ({ title: t(`step${n}Title`), body: t(`step${n}Body`) }));
  const current = steps[Math.min(step, steps.length - 1)];
  const isLast = step >= steps.length - 1;

  return (
    <div
      className="fixed inset-0 z-[220] flex items-end justify-center bg-black/30 p-4 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-secondary-200 bg-white p-6 shadow-2xl dark:border-secondary-700 dark:bg-secondary-900">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-300">
          {t('title')} · {step + 1}/{steps.length}
        </p>
        <h2 id="onboarding-title" className="mt-1.5 text-lg font-bold tracking-tight text-secondary-900 dark:text-white">
          {current.title}
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-secondary-600 dark:text-secondary-300">{current.body}</p>
        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="text-[11px] font-medium text-secondary-500 transition hover:text-secondary-800 dark:text-secondary-400 dark:hover:text-secondary-100"
          >
            {t('skip')}
          </button>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition ${
                  i === step ? 'bg-primary-600 dark:bg-primary-400' : 'bg-secondary-300 dark:bg-secondary-700'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={isLast ? onDone : onNext}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700"
          >
            {isLast ? t('done') : t('next')}
            <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
