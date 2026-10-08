'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowsRightLeftIcon,
  BeakerIcon,
  ChevronDoubleRightIcon,
  CpuChipIcon,
  InformationCircleIcon,
  MicrophoneIcon,
  PauseCircleIcon,
  PhoneIcon,
  PhoneXMarkIcon,
  PlayCircleIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  WrenchScrewdriverIcon,
  BookOpenIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import Waveform from './components/Waveform';
import CampaignPanel, { blockReasonText } from './components/CampaignPanel';
import CallLog, { KpiPanel } from './components/CallLog';
import {
  ActionsPanel, AssistPanel, CompliancePanel, FlowPanel, HandoffPanel, IntentPanel, SentimentPanel, SummaryPanel, TranscriptPanel,
} from './components/panels';
import type { CallView } from './components/panels';
import { PanelTitle } from './components/parts';
import type { CheckState } from './components/parts';
import { SAMPLE_CALLS, SCENARIOS, getScenario } from './components/scenarios';
import {
  buildTimeline, callClock, checkContactWindow, downloadText, estimateTurnSeconds, fnStatuses, sentimentTrend,
} from './components/engine';
import { formatWhen } from './components/format';
import { useSpeech } from './components/useSpeech';
import type { CallResult, CallRow, Phase, ScenarioId, Sentiment } from './components/types';
import { fmtTime } from './components/types';

/** Solicitud de demo: formulario de contacto con el producto preseleccionado. */
const REQUEST_DEMO_HREF = '/contact?service=voice-ai-callcenter';
const STORAGE_KEY = 'koptup-demo-voice-ai-v1';
/** Registro de ejemplo ordenado por hora (entrantes y salientes mezcladas). */
const SAMPLE_BY_TIME = [...SAMPLE_CALLS].sort((a, b) => a.time.localeCompare(b.time));
const TICK_MS = 200;
const SPEEDS = [1, 1.5, 2] as const;
type Speed = (typeof SPEEDS)[number];
type EndReason = 'completed' | 'transferred' | 'hungup';

interface Saved {
  calls?: CallRow[];
  company?: string;
  agent?: string;
  voiceUri?: string;
  speed?: Speed;
  voiceOn?: boolean;
}

export default function VoiceAIPage() {
  const t = useTranslations('demoVoice');
  const locale = useLocale() === 'en' ? 'en' : 'es';
  const speech = useSpeech(locale);

  const [scenarioId, setScenarioId] = useState<ScenarioId>('banca');
  const scenario = getScenario(scenarioId);
  const [phase, setPhase] = useState<Phase>('idle');
  const [cursor, setCursor] = useState(-1);
  const [elapsed, setElapsed] = useState(0);
  const [endReason, setEndReason] = useState<EndReason | null>(null);
  const [manualTransfer, setManualTransfer] = useState(false);

  const [voiceOn, setVoiceOn] = useState(true);
  const [speed, setSpeed] = useState<Speed>(1);
  const [voiceUri, setVoiceUri] = useState('');
  const [company, setCompany] = useState('');
  const [agent, setAgent] = useState('');
  const [myCalls, setMyCalls] = useState<CallRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const spokenRef = useRef(-1);
  const recordedRef = useRef(false);
  const elapsedRef = useRef(0);
  elapsedRef.current = elapsed;
  const callCardRef = useRef<HTMLDivElement>(null);

  /* ---------------------------- Persistencia ---------------------------- */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Saved;
        if (Array.isArray(s.calls)) setMyCalls(s.calls.slice(0, 50));
        if (typeof s.company === 'string') setCompany(s.company);
        if (typeof s.agent === 'string') setAgent(s.agent);
        if (typeof s.voiceUri === 'string') setVoiceUri(s.voiceUri);
        if (s.speed && SPEEDS.includes(s.speed)) setSpeed(s.speed);
        if (typeof s.voiceOn === 'boolean') setVoiceOn(s.voiceOn);
      }
    } catch {
      /* almacenamiento no disponible */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      const data: Saved = { calls: myCalls, company, agent, voiceUri, speed, voiceOn };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [loaded, myCalls, company, agent, voiceUri, speed, voiceOn]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);
  const notify = useCallback((msg: string) => setToast(msg), []);

  /* ------------------------------ Guion ------------------------------ */
  const agentName = agent.trim() || t('picker.agentPlaceholder');
  const companyName = company.trim() || t(`scenarios.${scenarioId}.company`);
  const human = t(`scenarios.${scenarioId}.human`);
  const team = t(`scenarios.${scenarioId}.team`);

  const texts = useMemo(() => {
    const base = { agent: agentName, company: companyName, human };
    const spoken: Record<string, string> = {};
    Object.keys(scenario.maskedData).forEach((k) => {
      spoken[k] = t(`scenarios.${scenario.id}.spoken.${k}`);
    });
    return scenario.turns.map((tn) => ({
      shown: t(`scenarios.${scenario.id}.turns.${tn.key}`, { ...base, ...scenario.maskedData }),
      spoken: t(`scenarios.${scenario.id}.turns.${tn.key}`, { ...base, ...spoken }),
    }));
  }, [scenario, agentName, companyName, human, t]);

  const durations = useMemo(() => texts.map((x) => estimateTurnSeconds(x.shown)), [texts]);
  const at = useMemo(() => buildTimeline(durations), [durations]);
  const last = scenario.turns.length - 1;
  const endsWithTransfer = scenario.turns[last].fns?.includes('transferToHuman') ?? false;
  const curDurMs = cursor >= 0 ? durations[Math.min(cursor, last)] * 1000 : 0;
  const turnFinished = cursor >= 0 && elapsed >= curDurMs;
  const clock = callClock(at, durations, cursor, elapsed);

  /* --------------------------- Reproductor --------------------------- */
  const finish = useCallback(
    (reason: EndReason) => {
      speech.cancel();
      setEndReason(reason);
      setPhase(reason === 'transferred' ? 'transferred' : 'ended');
    },
    [speech],
  );

  // Reloj del guion: avanza mientras la llamada está en curso.
  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(() => setElapsed((e) => e + TICK_MS * speed), TICK_MS);
    return () => clearInterval(id);
  }, [phase, speed]);

  // Paso al siguiente turno: cuando se cumple el tiempo del guion y la voz terminó.
  useEffect(() => {
    if (phase !== 'playing' || cursor < 0) return;
    const speaking = speech.speakingRef.current;
    const watchdog = elapsed > curDurMs * 3 + 4000;
    if (elapsed < curDurMs || (speaking && !watchdog)) return;
    if (speaking) speech.cancel();
    if (cursor < last) {
      setCursor(cursor + 1);
      setElapsed(0);
    } else {
      finish(endsWithTransfer ? 'transferred' : 'completed');
    }
  }, [elapsed, phase, cursor, curDurMs, last, endsWithTransfer, finish, speech]);

  // Voz: habla cada turno al empezar (o al reanudar si aún queda buena parte del turno).
  useEffect(() => {
    if (phase !== 'playing' || cursor < 0 || !voiceOn || !speech.available) return;
    if (spokenRef.current === cursor && elapsedRef.current > durations[cursor] * 1000 * 0.6) return;
    spokenRef.current = cursor;
    speech.speak(texts[cursor].spoken, {
      voiceUri,
      customer: scenario.turns[cursor].speaker === 'customer',
      rate: 1 + (speed - 1) * 0.7,
    });
    // Solo al cambiar de turno, de fase o al activar la voz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, phase, voiceOn, speech.available]);

  // Registro de la llamada al terminar.
  useEffect(() => {
    if ((phase !== 'ended' && phase !== 'transferred') || recordedRef.current || cursor < 0) return;
    recordedRef.current = true;
    const played = scenario.turns.slice(0, cursor + 1);
    const intentTurn = [...played].reverse().find((x) => x.intent) ?? scenario.turns.find((x) => x.intent);
    const lastCustomer = [...played].reverse().find((x) => x.speaker === 'customer');
    const result: CallResult = endReason === 'transferred' ? 'transferred' : endReason === 'hungup' ? 'abandoned' : 'resolved';
    let time = '--:--';
    try {
      time = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Bogota',
      }).format(new Date());
    } catch {
      /* sin Intl */
    }
    const row: CallRow = {
      id: `mine-${Date.now()}`,
      time,
      number: scenario.number,
      direction: scenario.direction,
      intent: intentTurn?.intent ?? 'orderStatus',
      durationSec: Math.round(callClock(at, durations, cursor, elapsedRef.current)),
      result,
      sentiment: lastCustomer?.sentiment ?? 'neutral',
      csat: null,
      scenario: scenario.id,
      mine: true,
    };
    setMyCalls((prev) => [row, ...prev].slice(0, 50));
  }, [phase, endReason, cursor, scenario, at, durations, locale]);

  const resetCall = useCallback(() => {
    speech.cancel();
    spokenRef.current = -1;
    recordedRef.current = false;
    setPhase('idle');
    setCursor(-1);
    setElapsed(0);
    setEndReason(null);
    setManualTransfer(false);
  }, [speech]);

  const start = () => {
    resetCall();
    setCursor(0);
    setPhase('playing');
  };
  const pause = () => {
    speech.cancel();
    setPhase('paused');
  };
  const resume = () => setPhase('playing');
  const hangup = () => finish(cursor >= last ? (endsWithTransfer ? 'transferred' : 'completed') : 'hungup');
  const transfer = () => {
    setManualTransfer(!endsWithTransfer || cursor < last);
    finish('transferred');
  };
  const skipToEnd = () => {
    speech.cancel();
    spokenRef.current = last;
    setCursor(last);
    setElapsed(durations[last] * 1000);
    finish(endsWithTransfer ? 'transferred' : 'completed');
  };
  const toggleVoice = () => {
    if (voiceOn) speech.cancel();
    setVoiceOn(!voiceOn);
  };
  const chooseScenario = (id: ScenarioId) => {
    resetCall();
    setScenarioId(id);
  };
  const openFromLog = (id: ScenarioId) => {
    chooseScenario(id);
    callCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const resetAll = () => {
    resetCall();
    setScenarioId('banca');
    setMyCalls([]);
    setCompany('');
    setAgent('');
    setVoiceUri('');
    setSpeed(1);
    setVoiceOn(true);
    setResetKey((k) => k + 1);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* almacenamiento no disponible */
    }
    notify(t('header.resetDone'));
  };

  /* --------------------------- Vista derivada --------------------------- */
  const shownTurns = phase === 'idle' ? [] : scenario.turns.slice(0, cursor + 1);
  const customerSeq: Sentiment[] = shownTurns.filter((x) => x.speaker === 'customer').map((x) => x.sentiment);
  const intentTurn = [...shownTurns].reverse().find((x) => x.intent);
  const fnStatus = fnStatuses(scenario, cursor, turnFinished, phase);
  const noticeIdx = scenario.turns.findIndex((x) => x.notice);
  const callOver = phase === 'ended' || phase === 'transferred';
  const view: CallView = {
    t,
    locale,
    scenario,
    phase,
    cursor,
    turnFinished,
    shownTurns,
    at,
    textOf: (i) => texts[i].shown,
    agentName,
    companyName,
    human,
    team,
    sentiment: customerSeq.length ? customerSeq[customerSeq.length - 1] : null,
    firstSentiment: customerSeq.length ? customerSeq[0] : null,
    trend: sentimentTrend(customerSeq),
    intentTurn,
    fnStatus,
    verified: fnStatus.verifyCustomer === 'done',
    maskedCount: shownTurns.filter((x) => x.masked).length,
    noticeDone: noticeIdx >= 0 && (noticeIdx < cursor || (noticeIdx === cursor && (turnFinished || callOver))),
    manualTransfer,
    endReason,
    clock,
  };

  const windowCheck: { state: CheckState; desc: string } = (() => {
    if (scenario.direction === 'inbound') return { state: 'na', desc: t('compliance.windowInbound') };
    if (!scenario.collections || !scenario.scheduled) return { state: 'na', desc: t('compliance.windowNotCollections') };
    const when = formatWhen(t, scenario.scheduled.date, scenario.scheduled.time);
    const r = checkContactWindow(scenario.scheduled.date, scenario.scheduled.time);
    return r.kind === 'allowed'
      ? { state: 'ok', desc: t('compliance.windowOk', { when }) }
      : { state: 'pending', desc: t('compliance.windowBlocked', { when, reason: blockReasonText(t, r) }) };
  })();

  const allCalls = useMemo(() => [...myCalls, ...SAMPLE_BY_TIME], [myCalls]);

  /* ---------------------------- Exportaciones ---------------------------- */
  const transcriptText = () => {
    const lines = [
      t('transcript.fileHeader', { scenario: t(`scenarios.${scenario.id}.name`), company: companyName }),
      t('transcript.fileNote'),
      '',
      ...shownTurns.map(
        (tn, i) => `[${fmtTime(at[i])}] ${tn.speaker === 'ai' ? t('transcript.ai', { agent: agentName }) : t('transcript.customer')}: ${texts[i].shown}`,
      ),
    ];
    if (phase === 'transferred') {
      lines.push('', t(manualTransfer ? 'transcript.transferredManual' : 'transcript.transferredAuto', { human, team }));
    }
    if (phase === 'ended' && endReason === 'hungup') lines.push('', t('transcript.hungUp'));
    return lines.join('\n');
  };
  const downloadTranscript = () => downloadText(t('transcript.fileName', { scenario: scenario.id }), transcriptText(), 'text/plain');

  const summaryText = () => {
    const result = endReason === 'transferred' ? 'transferred' : endReason === 'hungup' ? 'abandoned' : 'resolved';
    const done = scenario.fns.filter((f) => fnStatus[f.key] === 'done').length;
    return [
      `${t('summary.title')} · ${t(`scenarios.${scenario.id}.name`)} · ${companyName}`,
      `${t('summary.duration')}: ${fmtTime(clock)}`,
      `${t('summary.result')}: ${t(`summary.results.${result}`)}`,
      `${t('summary.reason')}: ${intentTurn?.intent ? t(`intents.${intentTurn.intent}`) : '—'}`,
      `${t('summary.actions')}: ${t('summary.actionsValue', { done, total: scenario.fns.length })}`,
      `${t('summary.sentiment')}: ${view.firstSentiment && view.sentiment ? `${t(`sentiment.${view.firstSentiment}`)} → ${t(`sentiment.${view.sentiment}`)}` : '—'}`,
      `${t('summary.masked')}: ${view.maskedCount}`,
      '',
      t('transcript.fileNote'),
    ].join('\n');
  };
  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summaryText());
      notify(t('summary.copied'));
    } catch {
      notify(t('summary.copyFailed'));
    }
  };

  /* ------------------------------- Render ------------------------------- */
  const active = phase === 'playing' || phase === 'paused';
  const currentTurn = cursor >= 0 ? scenario.turns[Math.min(cursor, last)] : null;
  const someoneSpeaking = phase === 'playing' && !!currentTurn && !turnFinished;
  const voiceName = speech.voices.find((vv) => vv.uri === voiceUri)?.name ?? speech.voices[0]?.name ?? '';
  const voiceNote = !speech.supported
    ? t('call.voice.unsupported')
    : !speech.available
      ? t('call.voice.unavailable')
      : !voiceOn
        ? t('call.voice.muted')
        : t('call.voice.available', { voice: voiceName });
  const speedLabel = (s: Speed) => (locale === 'en' ? `${s}×` : `${String(s).replace('.', ',')}×`);

  const statusTone: Record<Phase, string> = {
    idle: 'bg-slate-700/40 text-slate-300 border-slate-600/50',
    playing: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    paused: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    transferred: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    ended: 'bg-slate-700/40 text-slate-300 border-slate-600/50',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-secondary-950 to-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Encabezado */}
        <div className="rounded-2xl bg-gradient-to-br from-sky-600 to-sky-800 p-6 sm:p-8 mb-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <Button variant="ghost" className="mb-3 text-sky-100 hover:text-white hover:bg-white/10" asChild>
                <Link href="/demo">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  {t('header.back')}
                </Link>
              </Button>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3 text-white">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm shadow-lg">
                  <MicrophoneIcon className="h-6 w-6 text-white" />
                </span>
                {t('header.title')}
              </h1>
              <p className="text-base sm:text-lg text-sky-50/90 mt-2 max-w-3xl">{t('header.subtitle')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2.5 py-0.5 text-xs text-white">
                  <BeakerIcon className="h-3.5 w-3.5" />
                  {t('header.sampleBadge')}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2.5 py-0.5 text-xs text-white">
                  <InformationCircleIcon className="h-3.5 w-3.5" />
                  {t('header.scriptBadge')}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="bg-white text-sky-800 border-white hover:bg-sky-50" asChild>
                <Link href={REQUEST_DEMO_HREF}>{t('header.requestDemo')}</Link>
              </Button>
              <Button size="sm" variant="ghost" className="text-sky-50 hover:text-white hover:bg-white/10" onClick={resetAll} title={t('header.resetHint')}>
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                {t('header.reset')}
              </Button>
            </div>
          </div>
        </div>

        {/* 1. Escenario */}
        <Card variant="bordered" className="bg-slate-900/60 border-slate-800 mb-6" padding="md">
          <PanelTitle icon={<PhoneIcon className="h-4 w-4 text-sky-400" />} title={t('picker.title')} subtitle={t('picker.subtitle')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3" role="radiogroup" aria-label={t('picker.title')}>
            {SCENARIOS.map((s) => {
              const sel = s.id === scenarioId;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={sel}
                  onClick={() => chooseScenario(s.id)}
                  className={cn(
                    'text-left rounded-xl border p-3 transition-colors min-w-0',
                    sel ? 'border-cyan-400/60 bg-cyan-500/10' : 'border-slate-700/60 bg-slate-800/30 hover:bg-slate-800/60',
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-wide text-slate-400">
                      {t(`direction.${s.direction}`)} · {t('picker.turns', { count: s.turns.length })}
                    </span>
                    {sel && <span className="text-[10px] font-semibold text-cyan-300">{t('picker.selected')}</span>}
                  </div>
                  <div className="text-sm font-semibold text-white">{t(`scenarios.${s.id}.name`)}</div>
                  <p className="mt-1 text-xs text-slate-400">{t(`scenarios.${s.id}.desc`)}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-4 rounded-lg border border-slate-700/60 bg-slate-800/30 p-3">
            <div className="text-xs font-medium text-slate-200 mb-2">{t('picker.personalizeTitle')}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-[11px] text-slate-400">
                {t('picker.company')}
                <input
                  type="text"
                  value={company}
                  maxLength={40}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder={t('picker.companyPlaceholder')}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-sm text-slate-100 placeholder:text-slate-500"
                />
              </label>
              <label className="text-[11px] text-slate-400">
                {t('picker.agent')}
                <input
                  type="text"
                  value={agent}
                  maxLength={20}
                  onChange={(e) => setAgent(e.target.value)}
                  placeholder={t('picker.agentPlaceholder')}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-sm text-slate-100 placeholder:text-slate-500"
                />
              </label>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">{t('picker.personalizeHint')}</p>
          </div>
        </Card>

        {/* 2. Llamada + sentimiento/intención */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 scroll-mt-24" ref={callCardRef}>
          <Card variant="bordered" className="lg:col-span-2 bg-slate-900/60 border-slate-800 backdrop-blur" padding="md">
            <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold text-white text-base mb-1.5">{t('call.title')}</h2>
                <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
                  <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 font-medium', statusTone[phase])} data-testid="voice-status">
                    {phase === 'playing' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />}
                    {t(`call.status.${phase}`)}
                  </span>
                  <span>
                    {t('call.channel')}: {t(`direction.${scenario.direction}`)}
                  </span>
                  <span>
                    {t('call.number')}: <span className="font-mono">{scenario.number}</span>
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400 uppercase tracking-wider">{t('call.duration')}</div>
                <div className="text-2xl font-mono font-bold text-white tabular-nums" data-testid="voice-clock">
                  {fmtTime(clock)}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center mb-5">
              <div className="relative">
                <div
                  className={cn(
                    'h-24 w-24 rounded-full flex items-center justify-center shadow-2xl transition-colors',
                    currentTurn?.speaker === 'customer' && someoneSpeaking
                      ? 'bg-gradient-to-br from-amber-500 to-rose-500 shadow-amber-500/30'
                      : 'bg-gradient-to-br from-cyan-500 via-violet-500 to-fuchsia-600 shadow-violet-500/30',
                    phase === 'playing' && 'ring-4 ring-violet-500/30',
                  )}
                >
                  {currentTurn?.speaker === 'customer' && someoneSpeaking ? (
                    <UserCircleIcon className="h-11 w-11 text-white" />
                  ) : (
                    <CpuChipIcon className="h-11 w-11 text-white" />
                  )}
                </div>
                {someoneSpeaking && voiceOn && speech.available && (
                  <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-4 border-slate-900 flex items-center justify-center">
                    <SpeakerWaveIcon className="h-3 w-3 text-white" />
                  </span>
                )}
              </div>
              <div className="mt-3 text-center">
                <div className="font-semibold text-lg text-white">{agentName}</div>
                <div className="text-xs text-slate-400">{t('call.agentRole', { company: companyName })}</div>
                <div className="mt-1 text-xs text-cyan-300 min-h-[1rem]" aria-live="polite">
                  {someoneSpeaking
                    ? currentTurn?.speaker === 'ai'
                      ? t('call.speakingAgent', { agent: agentName })
                      : t('call.speakingCustomer')
                    : phase === 'playing'
                      ? t('call.silent')
                      : ''}
                </div>
              </div>
              <Waveform active={someoneSpeaking} speaker={currentTurn?.speaker ?? 'ai'} className="w-full max-w-md mt-3" />
              <div className="mt-1 text-[10px] uppercase tracking-widest text-slate-500">{t('call.waveform')}</div>
            </div>

            <div className="flex justify-center flex-wrap gap-2.5 mb-3">
              {phase === 'idle' && (
                <button
                  type="button"
                  onClick={start}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/30"
                >
                  <PhoneIcon className="h-4 w-4" />
                  {t('call.controls.start')}
                </button>
              )}
              {active && (
                <>
                  <button
                    type="button"
                    onClick={phase === 'playing' ? pause : resume}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                      phase === 'paused' ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' : 'border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800',
                    )}
                  >
                    {phase === 'paused' ? <PlayCircleIcon className="h-4 w-4" /> : <PauseCircleIcon className="h-4 w-4" />}
                    {phase === 'paused' ? t('call.controls.resume') : t('call.controls.pause')}
                  </button>
                  <button
                    type="button"
                    onClick={transfer}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-violet-500/40 bg-violet-500/10 text-violet-300 text-sm font-medium hover:bg-violet-500/20"
                  >
                    <ArrowsRightLeftIcon className="h-4 w-4" />
                    {t('call.controls.transfer')}
                  </button>
                  <button
                    type="button"
                    onClick={skipToEnd}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-200 text-sm font-medium hover:bg-slate-800"
                  >
                    <ChevronDoubleRightIcon className="h-4 w-4" />
                    {t('call.controls.skip')}
                  </button>
                  <button
                    type="button"
                    onClick={hangup}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/30"
                  >
                    <PhoneXMarkIcon className="h-4 w-4" />
                    {t('call.controls.hangup')}
                  </button>
                </>
              )}
              {callOver && (
                <button
                  type="button"
                  onClick={start}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/30"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  {t('call.controls.restart')}
                </button>
              )}
            </div>

            <div className="flex justify-center flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={toggleVoice}
                aria-pressed={voiceOn && speech.available}
                disabled={!speech.available}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                  voiceOn && speech.available ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-slate-600 bg-slate-800/60 text-slate-300',
                )}
              >
                {voiceOn && speech.available ? <SpeakerWaveIcon className="h-4 w-4" /> : <SpeakerXMarkIcon className="h-4 w-4" />}
                {!speech.available ? t('call.controls.voiceUnavailable') : voiceOn ? t('call.controls.voiceOn') : t('call.controls.voiceOff')}
              </button>
              <span className="text-slate-400 ml-1">{t('call.controls.speed')}:</span>
              <div className="inline-flex rounded-lg border border-slate-700 p-0.5 bg-slate-900/60" role="group" aria-label={t('call.controls.speed')}>
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={speed === s}
                    onClick={() => setSpeed(s)}
                    className={cn('px-2 py-0.5 rounded-md', speed === s ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400 hover:text-slate-200')}
                  >
                    {speedLabel(s)}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] text-slate-400" data-testid="voice-note">
              {voiceNote}
            </p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">{t('call.recording')}</p>
          </Card>

          <div className="space-y-6">
            <SentimentPanel v={view} />
            <IntentPanel v={view} />
          </div>
        </div>

        <SummaryPanel v={view} onCopy={copySummary} onDownload={downloadTranscript} />

        {/* Transcripción + flujo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <TranscriptPanel v={view} onDownload={downloadTranscript} />
          <FlowPanel v={view} />
        </div>

        {/* Acciones + transferencia + asistente */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <ActionsPanel v={view} />
          <div className="space-y-6">
            <HandoffPanel v={view} onTransfer={transfer} />
            <AssistPanel v={view} />
          </div>
        </div>

        {/* Cumplimiento + métricas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <CompliancePanel v={view} window={windowCheck} />
          <KpiPanel rows={allCalls} t={t} locale={locale} />
        </div>

        {/* Registro de llamadas */}
        <div className="mt-6">
          <CallLog
            rows={allCalls}
            t={t}
            onOpen={openFromLog}
            onClearMine={() => {
              setMyCalls([]);
              notify(t('log.cleared'));
            }}
            notify={notify}
          />
        </div>

        {/* Campaña saliente */}
        <div className="mt-6">
          <CampaignPanel t={t} notify={notify} resetKey={resetKey} />
        </div>

        {/* Voz + implementación */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <Card variant="bordered" className="bg-slate-900/60 border-slate-800" padding="md">
            <PanelTitle icon={<SpeakerWaveIcon className="h-4 w-4 text-cyan-400" />} title={t('settings.title')} subtitle={t('settings.subtitle')} />
            {speech.available ? (
              <label className="block text-xs text-slate-300">
                {t('settings.voice')}
                <select
                  value={voiceUri}
                  onChange={(e) => setVoiceUri(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-sm text-slate-100"
                >
                  <option value="">{t('settings.voiceAuto', { name: speech.voices[0]?.name ?? '' })}</option>
                  {speech.voices.map((vv) => (
                    <option key={vv.uri} value={vv.uri}>
                      {vv.name} ({vv.lang})
                    </option>
                  ))}
                </select>
                <span className="mt-2 block text-[11px] text-slate-500">{t('settings.customerVoice')}</span>
              </label>
            ) : (
              <p className="text-xs text-slate-400">{speech.supported ? t('settings.noVoices') : t('call.voice.unsupported')}</p>
            )}
          </Card>

          <Card variant="bordered" className="lg:col-span-2 bg-slate-900/60 border-slate-800" padding="md">
            <PanelTitle
              icon={<WrenchScrewdriverIcon className="h-4 w-4 text-amber-400" />}
              title={t('implementation.title')}
              subtitle={t('implementation.subtitle')}
            />
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {(['telephony', 'stt', 'llm', 'tts', 'integrations'] as const).map((k) => (
                <div key={k} className="rounded-lg border border-slate-700/60 bg-slate-800/30 p-2.5">
                  <dt className="font-medium text-slate-100">{t(`implementation.items.${k}.title`)}</dt>
                  <dd className="mt-0.5 text-slate-400">{t(`implementation.items.${k}.desc`)}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[11px] text-slate-400">{t('implementation.costNote')}</p>
          </Card>
        </div>

        {/* Glosario */}
        <Card variant="bordered" className="bg-slate-900/60 border-slate-800 mt-6" padding="md">
          <PanelTitle icon={<BookOpenIcon className="h-4 w-4 text-violet-400" />} title={t('glossary.title')} />
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-xs">
            {(['stt', 'tts', 'intent', 'sentiment', 'functions', 'handoff', 'containment', 'aht', 'csat', 'bargeIn'] as const).map((k) => (
              <div key={k}>
                <dt className="font-medium text-slate-100">{t(`glossary.items.${k}.term`)}</dt>
                <dd className="text-slate-400">{t(`glossary.items.${k}.def`)}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* Nota de datos de ejemplo */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400">
          <p className="flex gap-2">
            <InformationCircleIcon className="h-4 w-4 shrink-0 text-slate-500" />
            {t('footer.sampleNote')}
          </p>
          <Button size="sm" variant="outline" className="!border-slate-500 !text-slate-100 hover:!bg-slate-800 shrink-0" asChild>
            <Link href={REQUEST_DEMO_HREF}>{t('footer.cta')}</Link>
          </Button>
        </div>
      </div>

      <div aria-live="polite" className="fixed bottom-4 right-4 left-4 sm:left-auto z-[120] flex justify-end pointer-events-none">
        {toast && (
          <div className="pointer-events-auto rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 shadow-xl" role="status">
            {toast}
          </div>
        )}
      </div>

      <style jsx global>{`
        .voice-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .voice-scroll::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.25);
          border-radius: 9999px;
        }
        .voice-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
}
