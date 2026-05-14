'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ArrowLeftIcon,
  PhoneIcon,
  PhoneXMarkIcon,
  MicrophoneIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  ArrowsRightLeftIcon,
  SignalIcon,
  SparklesIcon,
  ShieldCheckIcon,
  BoltIcon,
  CheckCircleIcon,
  ChartBarIcon,
  UserGroupIcon,
  LanguageIcon,
  BookOpenIcon,
  ServerStackIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowRightCircleIcon,
  CpuChipIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from '@heroicons/react/24/outline';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import Waveform from './components/Waveform';
import {
  TURNS, STT_PROVIDERS, TTS_PROVIDERS, TELE_PROVIDERS, INBOUND, OUTBOUND,
  SENTIMENT_TONE, STATUS_TONE, fmtTime,
} from './components/types';
import type { Sentiment, FnKey } from './components/types';
import {
  TranscriptTurn, SentimentGauge, ProviderGroup, ContextRow, ComplianceRow, Metric, KpiCard,
} from './components/parts';

export default function VoiceAIPage() {
  const t = useTranslations('demoVoice');

  const [callActive, setCallActive] = useState(true);
  const [muted, setMuted] = useState(false);
  const [onHold, setOnHold] = useState(false);
  const [duration, setDuration] = useState(132);
  const [visibleTurns, setVisibleTurns] = useState(4);

  const [stt, setStt] = useState<typeof STT_PROVIDERS[number]['id']>('deepgram');
  const [tts, setTts] = useState<typeof TTS_PROVIDERS[number]['id']>('eleven');
  const [tele, setTele] = useState<typeof TELE_PROVIDERS[number]['id']>('twilio');
  const [bargeIn, setBargeIn] = useState(true);
  const [language, setLanguage] = useState<'es' | 'en' | 'mixed'>('mixed');

  const [queueTab, setQueueTab] = useState<'inbound' | 'outbound'>('inbound');
  const [handedOff, setHandedOff] = useState(false);
  const [predictive, setPredictive] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!callActive || onHold) return;
    timerRef.current = setInterval(() => {
      setDuration((d) => d + 1);
      setVisibleTurns((v) => (v < TURNS.length ? v + (Math.random() > 0.55 ? 1 : 0) : v));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callActive, onHold]);

  const shownTurns = TURNS.slice(0, visibleTurns);
  const lastTurn = shownTurns[shownTurns.length - 1];
  const currentSentiment: Sentiment = lastTurn?.sentiment ?? 'neutral';

  const order: Record<Sentiment, number> = { negative: 0, neutral: 1, positive: 2 };
  const trend = useMemo<'improving' | 'stable' | 'declining'>(() => {
    if (shownTurns.length < 2) return 'stable';
    const a = order[shownTurns[shownTurns.length - 2].sentiment];
    const b = order[shownTurns[shownTurns.length - 1].sentiment];
    return b > a ? 'improving' : b < a ? 'declining' : 'stable';
  }, [shownTurns]);

  const sttLatency = STT_PROVIDERS.find((p) => p.id === stt)!.latency;
  const latencyGood = sttLatency < 300;

  const executedFns = useMemo(() => {
    const set = new Set<FnKey>();
    shownTurns.forEach((tn) => tn.fn && set.add(tn.fn));
    if (handedOff) set.add('transfer_human');
    return Array.from(set);
  }, [shownTurns, handedOff]);

  const lastIntentTurn = [...shownTurns].reverse().find((x) => x.intentKey);

  const handleStartStop = () => {
    if (callActive) setCallActive(false);
    else {
      setCallActive(true);
      setDuration(0);
      setVisibleTurns(1);
      setHandedOff(false);
      setOnHold(false);
    }
  };

  const queueRows = queueTab === 'inbound' ? INBOUND : OUTBOUND;
  const langLabel = (l: typeof language) => t(`providers.language${l === 'es' ? 'Es' : l === 'en' ? 'En' : 'Mixed'}`);
  const trendLabel = t(`sentiment.trend${trend.charAt(0).toUpperCase() + trend.slice(1)}`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-secondary-950 to-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-sky-600 to-sky-800 p-6 sm:p-8 mb-8 shadow-sm flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link href="/demo">
              <Button variant="ghost" className="mb-3 text-sky-100 hover:text-white hover:bg-white/10">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />{t('back')}
              </Button>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3 text-white">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm shadow-lg">
                <SparklesIcon className="h-6 w-6 text-white" />
              </span>
              {t('pageTitle')}
            </h1>
            <p className="text-lg text-sky-50/90 mt-2 max-w-3xl">{t('pageSubtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {TELE_PROVIDERS.map((p) => (
              <button key={p.id} onClick={() => setTele(p.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors',
                  tele === p.id
                    ? 'border-emerald-300/60 bg-emerald-500/20 text-emerald-100'
                    : 'border-white/20 bg-white/10 text-sky-50/80 hover:bg-white/15 hover:text-white'
                )}>
                <span className={cn('h-1.5 w-1.5 rounded-full', tele === p.id ? 'bg-emerald-300 animate-pulse' : 'bg-white/40')} />
                {t(`providers.items.${p.id}`)}
              </button>
            ))}
          </div>
        </div>

        {/* CALL + sentiment/intent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card variant="bordered" className="lg:col-span-2 bg-slate-900/60 border-slate-800 backdrop-blur" padding="lg">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                  {callActive ? t('status.live') : t('status.ended')}
                </Badge>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-slate-400">{t('call.channel')}: {t('call.channelInbound')}</span>
                {bargeIn && <Badge className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">{t('call.barge')}</Badge>}
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 uppercase tracking-wider">{t('call.duration')}</div>
                <div className="text-2xl font-mono font-bold text-white tabular-nums">{fmtTime(duration)}</div>
              </div>
            </div>

            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div className={cn(
                  'h-28 w-28 rounded-full bg-gradient-to-br from-cyan-500 via-violet-500 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-violet-500/30',
                  callActive && !onHold && 'ring-4 ring-violet-500/40 animate-pulse'
                )}>
                  <CpuChipIcon className="h-12 w-12 text-white" />
                </div>
                {callActive && !onHold && (
                  <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-4 border-slate-900 flex items-center justify-center">
                    <SpeakerWaveIcon className="h-3 w-3 text-white" />
                  </span>
                )}
              </div>
              <div className="mt-3 text-center">
                <div className="font-semibold text-lg text-white">{t('call.agentName')}</div>
                <div className="text-xs text-slate-400">{t('call.agentRole')}</div>
              </div>
              <Waveform active={callActive && !onHold && !muted} className="w-full max-w-md mt-5" />
              <div className="mt-2 text-[10px] uppercase tracking-widest text-slate-500">{t('waveform')}</div>
            </div>

            <div className="flex justify-center flex-wrap gap-3 mb-2">
              <button onClick={() => setMuted(!muted)}
                className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                  muted ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                        : 'border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800')}>
                {muted ? <SpeakerXMarkIcon className="h-4 w-4" /> : <MicrophoneIcon className="h-4 w-4" />}
                {muted ? t('call.controls.unmute') : t('call.controls.mute')}
              </button>
              <button onClick={() => setOnHold(!onHold)}
                className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                  onHold ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                         : 'border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800')}>
                {onHold ? <PlayCircleIcon className="h-4 w-4" /> : <PauseCircleIcon className="h-4 w-4" />}
                {onHold ? t('call.controls.resume') : t('call.controls.hold')}
              </button>
              <button onClick={() => setHandedOff(true)} disabled={handedOff}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-violet-500/40 bg-violet-500/10 text-violet-300 text-sm font-medium hover:bg-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                <ArrowsRightLeftIcon className="h-4 w-4" />{t('call.controls.transfer')}
              </button>
              <button onClick={handleStartStop}
                className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg transition-colors',
                  callActive ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/30' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30')}>
                {callActive ? <PhoneXMarkIcon className="h-4 w-4" /> : <PhoneIcon className="h-4 w-4" />}
                {callActive ? t('call.controls.hangup') : t('call.controls.start')}
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheckIcon className="h-3.5 w-3.5" />{t('call.recording')}
            </div>
          </Card>

          <div className="space-y-6">
            <Card variant="bordered" className="bg-slate-900/60 border-slate-800" padding="md">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold text-white flex items-center gap-2">
                    <ChartBarIcon className="h-4 w-4 text-cyan-400" />{t('sentiment.title')}
                  </div>
                  <div className="text-xs text-slate-500">{t('sentiment.subtitle')}</div>
                </div>
              </div>
              <SentimentGauge value={currentSentiment} t={t} />
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-slate-500">{t('sentiment.trend')}</span>
                <span className={cn('flex items-center gap-1 font-medium',
                  trend === 'improving' && 'text-emerald-400',
                  trend === 'stable' && 'text-cyan-400',
                  trend === 'declining' && 'text-rose-400')}>
                  {trend === 'improving' && <ArrowTrendingUpIcon className="h-3.5 w-3.5" />}
                  {trend === 'declining' && <ArrowTrendingDownIcon className="h-3.5 w-3.5" />}
                  {trend === 'stable' && <SignalIcon className="h-3.5 w-3.5" />}
                  {trendLabel}
                </span>
              </div>
            </Card>

            <Card variant="bordered" className="bg-slate-900/60 border-slate-800" padding="md">
              <div className="font-semibold text-white flex items-center gap-2">
                <BoltIcon className="h-4 w-4 text-amber-400" />{t('intent.title')}
              </div>
              <div className="text-xs text-slate-500 mb-3">{t('intent.subtitle')}</div>
              {lastIntentTurn ? (
                <>
                  <div className="text-base font-semibold text-white">{t(`intent.items.${lastIntentTurn.intentKey}`)}</div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span>{t('intent.confidence')}</span>
                    <span className="font-mono text-emerald-300">{Math.round((lastIntentTurn.confidence ?? 0) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400" style={{ width: `${Math.round((lastIntentTurn.confidence ?? 0) * 100)}%` }} />
                  </div>
                </>
              ) : <div className="text-sm text-slate-500">{t('transcript.empty')}</div>}
            </Card>
          </div>
        </div>

        {/* TRANSCRIPT + PROVIDERS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <Card variant="bordered" className="lg:col-span-2 bg-slate-900/60 border-slate-800" padding="md">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <div className="font-semibold text-white flex items-center gap-2">
                  <LanguageIcon className="h-4 w-4 text-violet-400" />{t('transcript.title')}
                </div>
                <div className="text-xs text-slate-500">{t('transcript.subtitle')}</div>
              </div>
              <Badge className={cn('border',
                latencyGood ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30')}>
                {t('transcript.latency')}: {sttLatency}{t('transcript.ms')} · {latencyGood ? t('transcript.good') : t('transcript.warn')}
              </Badge>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 voice-scroll">
              {shownTurns.length === 0 && <div className="text-sm text-slate-500 py-10 text-center">{t('transcript.empty')}</div>}
              {shownTurns.map((turn) => <TranscriptTurn key={turn.id} turn={turn} t={t} index={turn.id} totalDur={duration} />)}
              {handedOff && (
                <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-3 text-xs text-violet-200 flex items-start gap-2">
                  <ArrowRightCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />{t('handoff.transferred')}
                </div>
              )}
            </div>
          </Card>

          <Card variant="bordered" className="bg-slate-900/60 border-slate-800" padding="md">
            <div className="font-semibold text-white flex items-center gap-2">
              <ServerStackIcon className="h-4 w-4 text-cyan-400" />{t('providers.title')}
            </div>
            <div className="text-xs text-slate-500 mb-4">{t('providers.subtitle')}</div>

            <ProviderGroup label={t('providers.stt')}
              options={STT_PROVIDERS.map((p) => ({ id: p.id, label: t(`providers.items.${p.id}`), meta: `${p.latency}${t('transcript.ms')}` }))}
              value={stt} onChange={(v) => setStt(v as typeof stt)} />
            <div className="mt-4">
              <ProviderGroup label={t('providers.tts')}
                options={TTS_PROVIDERS.map((p) => ({ id: p.id, label: t(`providers.items.${p.id}`) }))}
                value={tts} onChange={(v) => setTts(v as typeof tts)} />
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800">
              <div className="text-xs font-medium text-slate-300 mb-2">{t('providers.language')}</div>
              <div className="flex flex-wrap gap-2">
                {(['es', 'en', 'mixed'] as const).map((l) => (
                  <button key={l} onClick={() => setLanguage(l)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs border transition-colors',
                      language === l ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                                     : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-slate-200')}>
                    {langLabel(l)}
                  </button>
                ))}
              </div>
            </div>

            <label className="mt-5 pt-4 border-t border-slate-800 flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={bargeIn} onChange={(e) => setBargeIn(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500" />
              <span>
                <span className="block text-sm font-medium text-white">{t('providers.bargeIn')}</span>
                <span className="block text-xs text-slate-500">{t('providers.bargeInHint')}</span>
              </span>
            </label>
          </Card>
        </div>

        {/* FUNCTIONS + HANDOFF + ASSIST */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <Card variant="bordered" className="lg:col-span-2 bg-slate-900/60 border-slate-800" padding="md">
            <div className="font-semibold text-white flex items-center gap-2">
              <BoltIcon className="h-4 w-4 text-amber-400" />{t('functions.title')}
            </div>
            <div className="text-xs text-slate-500 mb-4">{t('functions.subtitle')}</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(['check_balance', 'unblock_card', 'schedule_appointment', 'transfer_human'] as FnKey[]).map((fk) => {
                const done = executedFns.includes(fk);
                return (
                  <div key={fk}
                    className={cn('rounded-xl border p-3 transition-colors',
                      done ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-700/60 bg-slate-800/30')}>
                    <div className="flex items-center justify-between mb-1.5">
                      <code className="text-xs font-mono text-cyan-300">{t(`functions.items.${fk}.name`)}()</code>
                      <Badge size="sm" className={cn(done
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-700/40 text-slate-400 border border-slate-600/40')}>
                        {done ? <><CheckCircleIcon className="h-3 w-3 mr-1" />{t('functions.done')}</> : t('functions.running')}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-400 mb-2">{t(`functions.items.${fk}.desc`)}</div>
                    {done && (
                      <div className="text-xs text-slate-200 bg-slate-950/50 rounded-md px-2 py-1.5 border border-slate-800">
                        <span className="text-slate-500">{t('functions.result')}: </span>
                        {t(`functions.items.${fk}.result`, { card: '1234' })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="space-y-6">
            <Card variant="bordered" className="bg-slate-900/60 border-slate-800" padding="md">
              <div className="font-semibold text-white flex items-center gap-2">
                <UserGroupIcon className="h-4 w-4 text-violet-400" />{t('handoff.title')}
              </div>
              <div className="text-xs text-slate-500 mb-3">{t('handoff.subtitle')}</div>

              <div className="space-y-1.5 text-xs mb-4">
                <ContextRow label={t('handoff.items.intent')}  value={lastIntentTurn ? t(`intent.items.${lastIntentTurn.intentKey}`) : '—'} />
                <ContextRow label={t('handoff.items.history')} value={t('handoff.values.historyVal')} />
                <ContextRow label={t('handoff.items.value')}   value={t('handoff.values.valueVal')} />
                <ContextRow label={t('handoff.items.lang')}    value={langLabel(language)} />
                <ContextRow label={t('handoff.items.mood')}    value={t(`sentiment.${currentSentiment}`)} />
              </div>

              <button onClick={() => setHandedOff(true)} disabled={handedOff}
                className={cn('w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  handedOff ? 'bg-violet-500/20 text-violet-300 cursor-not-allowed'
                            : 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20')}>
                <ArrowsRightLeftIcon className="h-4 w-4" />
                {handedOff ? t('handoff.transferred') : t('handoff.button')}
              </button>
            </Card>

            <Card variant="bordered" className="bg-slate-900/60 border-slate-800" padding="md">
              <div className="font-semibold text-white flex items-center gap-2">
                <SparklesIcon className="h-4 w-4 text-cyan-400" />{t('assist.title')}
              </div>
              <div className="text-xs text-slate-500 mb-3">{t('assist.subtitle')}</div>

              <ul className="space-y-2 text-xs mb-4">
                {(['s1', 's2', 's3'] as const).map((s) => (
                  <li key={s} className="flex items-start gap-2 rounded-lg bg-slate-800/40 border border-slate-700/40 p-2">
                    <CheckCircleIcon className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-slate-200">{t(`assist.suggestions.${s}`)}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-3 border-t border-slate-800">
                <div className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <BookOpenIcon className="h-3.5 w-3.5 text-cyan-400" />{t('assist.kbTitle')}
                </div>
                <div className="text-[11px] text-slate-500 mb-2">{t('assist.kbHint')}</div>
                <ul className="space-y-1.5 text-xs">
                  {(['a1', 'a2', 'a3'] as const).map((a) => (
                    <li key={a} className="text-cyan-300 hover:text-cyan-200 cursor-pointer">{t(`assist.kb.${a}`)}</li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>
        </div>

        {/* QUEUE + CAMPAIGN */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <Card variant="bordered" className="lg:col-span-2 bg-slate-900/60 border-slate-800" padding="md">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div>
                <div className="font-semibold text-white flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4 text-emerald-400" />{t('queues.title')}
                </div>
                <div className="text-xs text-slate-500">{t('queues.subtitle')}</div>
              </div>
              <div className="inline-flex rounded-lg border border-slate-700 p-0.5 bg-slate-900/60">
                {(['inbound', 'outbound'] as const).map((tab) => (
                  <button key={tab} onClick={() => setQueueTab(tab)}
                    className={cn('px-3 py-1 text-xs rounded-md transition-colors',
                      queueTab === tab ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400 hover:text-slate-200')}>
                    {t(`queues.tabs.${tab}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-800">
                    <th className="font-medium px-2 py-2">{t('queues.columns.number')}</th>
                    <th className="font-medium px-2 py-2">{t('queues.columns.duration')}</th>
                    <th className="font-medium px-2 py-2">{t('queues.columns.status')}</th>
                    <th className="font-medium px-2 py-2">{t('queues.columns.sentiment')}</th>
                    <th className="font-medium px-2 py-2 text-right">{t('queues.columns.confidence')}</th>
                  </tr>
                </thead>
                <tbody>
                  {queueRows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                      <td className="px-2 py-2.5 font-mono text-slate-200">{row.number}</td>
                      <td className="px-2 py-2.5 font-mono text-slate-300">{row.duration}</td>
                      <td className="px-2 py-2.5">
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px]', STATUS_TONE[row.status])}>
                          {row.status === 'live' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />}
                          {t(`queues.statuses.${row.status}`)}
                        </span>
                      </td>
                      <td className="px-2 py-2.5">
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border', SENTIMENT_TONE[row.sentiment])}>
                          {t(`sentiment.${row.sentiment}`)}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono text-slate-200">{Math.round(row.confidence * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card variant="bordered" className="bg-slate-900/60 border-slate-800" padding="md">
            <div className="font-semibold text-white flex items-center gap-2">
              <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-400" />{t('campaign.title')}
            </div>
            <div className="text-xs text-slate-500 mb-3">{t('campaign.subtitle')}</div>

            <div className="rounded-lg border border-slate-700/60 bg-slate-800/40 p-3 mb-3">
              <div className="text-sm font-medium text-white">{t('campaign.name')}</div>
              <label className="mt-2 flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={predictive} onChange={(e) => setPredictive(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500" />
                <span>
                  <span className="block text-xs font-medium text-slate-200">{t('campaign.predictive')}</span>
                  <span className="block text-[11px] text-slate-500">{t('campaign.predictiveHint')}</span>
                </span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <Metric label={t('campaign.metrics.contacted')} value="1.284" />
              <Metric label={t('campaign.metrics.connected')} value="612" />
              <Metric label={t('campaign.metrics.voicemail')} value="298" />
              <Metric label={t('campaign.metrics.answerRate')} value="47.6%" />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="text-xs font-medium text-slate-300 mb-2">{t('campaign.events.title')}</div>
              <ul className="space-y-1.5 text-[11px] text-slate-400 font-mono">
                <li><span className="text-emerald-400">●</span> {t('campaign.events.human', { number: '+56 9 4521 8830' })}</li>
                <li><span className="text-amber-400">●</span> {t('campaign.events.amd',    { number: '+56 9 2233 9087' })}</li>
                <li><span className="text-cyan-400">●</span> {t('campaign.events.drop',   { number: '+56 9 2233 9087' })}</li>
                <li><span className="text-rose-400">●</span> {t('campaign.events.dnc',    { number: '+54 11 4456 9912' })}</li>
              </ul>
            </div>
          </Card>
        </div>

        {/* COMPLIANCE + ANALYTICS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <Card variant="bordered" className="bg-slate-900/60 border-slate-800" padding="md">
            <div className="font-semibold text-white flex items-center gap-2">
              <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />{t('compliance.title')}
            </div>
            <div className="text-xs text-slate-500 mb-3">{t('compliance.subtitle')}</div>
            <ul className="space-y-2 text-xs">
              <ComplianceRow title={t('compliance.dnc')}       desc={t('compliance.dncOk')} />
              <ComplianceRow title={t('compliance.recording')} desc={t('compliance.recordingOk')} />
              <ComplianceRow title={t('compliance.pci')}       desc={t('compliance.pciOk')} highlight />
              <ComplianceRow title={t('compliance.gdpr')}      desc={t('compliance.gdprOk')} />
            </ul>
          </Card>

          <Card variant="bordered" className="lg:col-span-2 bg-slate-900/60 border-slate-800" padding="md">
            <div className="font-semibold text-white flex items-center gap-2">
              <ChartBarIcon className="h-4 w-4 text-cyan-400" />{t('analytics.title')}
            </div>
            <div className="text-xs text-slate-500 mb-4">{t('analytics.subtitle')}</div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <KpiCard label={t('analytics.csat')}        sub={t('analytics.csatSub')}        value="4.7/5" tone="emerald" />
              <KpiCard label={t('analytics.aht')}         sub={t('analytics.ahtSub')}         value="2:48" tone="cyan" />
              <KpiCard label={t('analytics.fcr')}         sub={t('analytics.fcrSub')}         value="82%" tone="violet" />
              <KpiCard label={t('analytics.containment')} sub={t('analytics.containmentSub')} value="64%" tone="fuchsia" />
              <KpiCard label={t('analytics.volume')}      sub={t('analytics.volumeSub')}      value="3.412" tone="amber" />
            </div>
          </Card>
        </div>
      </div>

      <style jsx global>{`
        .voice-scroll::-webkit-scrollbar { width: 6px; }
        .voice-scroll::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.25); border-radius: 9999px; }
        .voice-scroll::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}
