'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { useModalClose } from '@/hooks/useModalClose';
import {
  ArrowLeftIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  MicrophoneIcon,
  ComputerDesktopIcon,
  PhoneXMarkIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  ClockIcon,
  UserGroupIcon,
  HeartIcon,
  FaceSmileIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  BellAlertIcon,
  SignalIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

import {
  AuditEntry,
  ChatMessage,
  ConsultTab,
  MainTab,
  PRIORITY_STYLES,
  Priority,
  QueuePatient,
  avatarColor,
  fmtTimer,
  initials,
  nowHHMM,
} from './components/types';
import { INITIAL_QUEUE } from './components/mockData';
import PatientRecordPanel from './components/PatientRecordPanel';
import PrescriptionEditor from './components/PrescriptionEditor';
import TriagePanel from './components/TriagePanel';
import SchedulingPanel from './components/SchedulingPanel';
import { LabPanel, BillingPanel, flagBadge } from './components/LabBillingPanels';
import PreconsultForm from './components/PreconsultForm';
import { LAB_ROWS } from './components/mockData';

export default function TelemedicinaPage() {
  const t = useTranslations('demoTelemed');
  const [tab, setTab] = useState<MainTab>('console');

  const [queue, setQueue] = useState<QueuePatient[]>(INITIAL_QUEUE);
  const [queueFilter, setQueueFilter] = useState<'all' | Priority>('all');
  const [queueSearch, setQueueSearch] = useState('');

  const [active, setActive] = useState<QueuePatient | null>(null);
  const [consultTab, setConsultTab] = useState<ConsultTab>('record');
  const [callTimer, setCallTimer] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  useModalClose(showEndConfirm, () => setShowEndConfirm(false));

  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [notes, setNotes] = useState('');

  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const logAudit = (action: string, actor: string = 'Dr. González') =>
    setAudit((a) => [{ at: nowHHMM(), actor, action }, ...a].slice(0, 40));

  useEffect(() => {
    setAudit((a) =>
      a.length === 0
        ? [{ at: nowHHMM(), actor: 'system', action: 'Sesión iniciada · TLS 1.3 · AES-256' }]
        : a,
    );
  }, []);

  useEffect(() => {
    if (!active) return;
    const i = setInterval(() => setCallTimer((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, [active]);

  function callPatient(p: QueuePatient) {
    setActive(p);
    setCallTimer(0);
    setConsultTab('record');
    setChat([{ id: 'm0', from: 'patient', text: 'Hola Doctor, gracias por atenderme.', at: nowHHMM() }]);
    setNotes('');
    setQueue((q) => q.filter((x) => x.id !== p.id));
    logAudit(`Inició consulta con paciente ${p.name}`);
  }

  function endConsult() {
    if (!active) return;
    logAudit(`Finalizó consulta con ${active.name} · duración ${fmtTimer(callTimer)}`);
    setActive(null);
    setShowEndConfirm(false);
    setCallTimer(0);
    setSharing(false);
    setRecording(false);
  }

  function sendChat() {
    if (!chatDraft.trim() || !active) return;
    const msg: ChatMessage = { id: `m${Date.now()}`, from: 'doctor', text: chatDraft.trim(), at: nowHHMM() };
    setChat((c) => [...c, msg]);
    setChatDraft('');
    setTimeout(() => {
      setChat((c) => [...c, { id: `m${Date.now() + 1}`, from: 'patient', text: 'Entendido, doctor.', at: nowHHMM() }]);
    }, 1200);
  }

  const filteredQueue = queue.filter(
    (p) =>
      (queueFilter === 'all' || p.priority === queueFilter) &&
      (queueSearch.trim() === '' || p.name.toLowerCase().includes(queueSearch.toLowerCase())),
  );

  const kpis = [
    { icon: UserGroupIcon, label: t('kpis.queue'), value: queue.length.toString(), sub: t('kpis.queueSub'), color: 'text-sky-600 dark:text-sky-400' },
    { icon: ClockIcon, label: t('kpis.avgWait'), value: '12', sub: t('kpis.avgWaitSub'), color: 'text-amber-600 dark:text-amber-400' },
    { icon: VideoCameraIcon, label: t('kpis.todayCalls'), value: '47', sub: t('kpis.todayCallsSub'), color: 'text-emerald-600 dark:text-emerald-400' },
    { icon: FaceSmileIcon, label: t('kpis.satisfaction'), value: '4.8', sub: t('kpis.satisfactionSub'), color: 'text-rose-600 dark:text-rose-400' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50 dark:from-secondary-950 dark:to-secondary-900">
      <header className="bg-gradient-to-br from-red-600 to-rose-800 text-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/demo"
              className="flex items-center gap-2 text-rose-100 hover:text-white text-sm font-medium"
            >
              <ArrowLeftIcon className="w-4 h-4" /> {t('backToDemos')}
            </Link>
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white">
                <VideoCameraIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white leading-tight">{t('pageTitle')}</h1>
                <p className="text-xs text-rose-100/90 line-clamp-1 max-w-xl">{t('pageSubtitle')}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success" size="sm" className="gap-1">
              <LockClosedIcon className="w-3.5 h-3.5" />
              {t('compliance.encrypted')}
            </Badge>
            <Badge variant="info" size="sm">{t('compliance.hipaa')}</Badge>
            <Badge variant="info" size="sm">{t('compliance.gdpr')}</Badge>
            <Badge variant="info" size="sm">{t('compliance.habeasData')}</Badge>
            <Badge variant="info" size="sm">{t('compliance.ley1581')}</Badge>
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto px-2 sm:px-6">
          <nav className="flex gap-1 overflow-x-auto pb-2 -mb-px" role="tablist">
            {(
              [
                { k: 'console', icon: VideoCameraIcon, label: t('tabs.console') },
                { k: 'triage', icon: SparklesIcon, label: t('tabs.triage') },
                { k: 'scheduling', icon: CalendarDaysIcon, label: t('tabs.scheduling') },
                { k: 'lab', icon: BeakerIcon, label: t('tabs.lab') },
                { k: 'billing', icon: CreditCardIcon, label: t('tabs.billing') },
                { k: 'preconsult', icon: ClipboardDocumentListIcon, label: t('tabs.preconsult') },
              ] as { k: MainTab; icon: typeof VideoCameraIcon; label: string }[]
            ).map(({ k, icon: Icon, label }) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === k
                    ? 'border-white text-white'
                    : 'border-transparent text-rose-100/80 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((k) => (
            <Card key={k.label} padding="sm" variant="bordered">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 uppercase tracking-wide">{k.label}</p>
                  <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">{k.value}</p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">{k.sub}</p>
                </div>
                <k.icon className={`w-6 h-6 ${k.color}`} />
              </div>
            </Card>
          ))}
        </section>

        {tab === 'console' && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-3 space-y-4">
              <Card variant="bordered" padding="sm">
                <CardHeader className="mb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{t('queue.title')}</CardTitle>
                    <Badge variant="primary" size="sm">{filteredQueue.length}</Badge>
                  </div>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">{t('queue.subtitle')}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative">
                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" />
                    <Input
                      className="pl-9"
                      placeholder={t('queue.search')}
                      value={queueSearch}
                      onChange={(e) => setQueueSearch(e.target.value)}
                      aria-label={t('queue.search')}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(['all', 'red', 'yellow', 'green'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setQueueFilter(f)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          queueFilter === f
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white dark:bg-secondary-800 border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-200 hover:border-primary-400'
                        }`}
                      >
                        {t(`queue.filter.${f}`)}
                      </button>
                    ))}
                  </div>
                  <ul className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
                    {filteredQueue.length === 0 && (
                      <li className="text-sm text-secondary-500 dark:text-secondary-400 text-center py-6">{t('queue.empty')}</li>
                    )}
                    {filteredQueue.map((p) => (
                      <li
                        key={p.id}
                        className={`p-3 rounded-xl border bg-white dark:bg-secondary-800 border-secondary-200 dark:border-secondary-700 hover:border-primary-400 dark:hover:border-primary-500 transition-colors ${
                          active?.id === p.id ? 'ring-2 ring-primary-500' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor(p.name)} flex items-center justify-center text-white text-sm font-semibold shrink-0`}
                          >
                            {initials(p.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-secondary-900 dark:text-white truncate">{p.name}</p>
                              <span
                                className={`w-2 h-2 rounded-full ${PRIORITY_STYLES[p.priority].dot}`}
                                aria-label={t(`queue.priority.${p.priority}`)}
                              />
                            </div>
                            <p className="text-xs text-secondary-600 dark:text-secondary-300 line-clamp-2">{p.reason}</p>
                            <div className="flex items-center justify-between mt-2 text-xs">
                              <span className="text-secondary-500 dark:text-secondary-400 flex items-center gap-1">
                                <ClockIcon className="w-3.5 h-3.5" />
                                {p.waitingSince} {t('common.min')}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${PRIORITY_STYLES[p.priority].chip}`}>
                                {t(`queue.priority.${p.priority}`)}
                              </span>
                            </div>
                            <Button size="sm" fullWidth className="mt-2" onClick={() => callPatient(p)} aria-label={`${t('queue.callNow')} ${p.name}`}>
                              {t('queue.callNow')}
                            </Button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card variant="bordered" padding="sm">
                <CardHeader className="mb-2 flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShieldCheckIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    {t('compliance.auditLogTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 max-h-48 overflow-y-auto text-xs">
                    {audit.slice(0, 8).map((a, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="font-mono text-secondary-500 dark:text-secondary-400 shrink-0">{a.at}</span>
                        <span className="text-secondary-700 dark:text-secondary-200">{a.action}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-6 space-y-4">
              <Card variant="bordered" padding="none" className="overflow-hidden">
                <div className="relative aspect-video bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center">
                  {!active && (
                    <div className="text-center text-white/80 px-6">
                      <VideoCameraSlashIcon className="w-16 h-16 mx-auto mb-3 opacity-50" />
                      <p className="text-lg font-semibold">{t('consultation.noActive')}</p>
                      <p className="text-sm text-white/60 mt-1">{t('consultation.noActiveHint')}</p>
                    </div>
                  )}
                  {active && (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center">
                        {camOn ? (
                          <div
                            className={`w-40 h-40 sm:w-52 sm:h-52 rounded-full bg-gradient-to-br ${avatarColor(active.name)} flex items-center justify-center text-white text-5xl font-bold shadow-2xl ring-4 ring-white/20`}
                          >
                            {initials(active.name)}
                          </div>
                        ) : (
                          <div className="text-white/70 text-center">
                            <VideoCameraSlashIcon className="w-14 h-14 mx-auto mb-2" />
                            <p className="text-sm">{t('consultation.controls.camOff')}</p>
                          </div>
                        )}
                      </div>
                      <div className="absolute top-3 right-3 w-28 h-20 sm:w-36 sm:h-24 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white text-xs font-semibold shadow-lg ring-1 ring-white/30">
                        <span>{t('consultation.you')}</span>
                      </div>
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                        <span className="px-2 py-1 rounded bg-black/60 text-white text-xs flex items-center gap-1 font-mono">
                          <ClockIcon className="w-3.5 h-3.5" />
                          {fmtTimer(callTimer)}
                        </span>
                        <span className="px-2 py-1 rounded bg-black/60 text-white text-xs flex items-center gap-1">
                          <SignalIcon className="w-3.5 h-3.5 text-emerald-400" />
                          {t('consultation.good')}
                        </span>
                        {recording && (
                          <span className="px-2 py-1 rounded bg-red-600/90 text-white text-xs flex items-center gap-1 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-white" />
                            REC
                          </span>
                        )}
                        {sharing && <span className="px-2 py-1 rounded bg-blue-600/90 text-white text-xs">{t('consultation.sharing')}</span>}
                      </div>
                      <div className="absolute bottom-16 left-3 px-2 py-1 rounded bg-black/60 text-white text-xs">{active.name}</div>
                    </>
                  )}
                  {active && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3 flex items-center justify-center gap-2 flex-wrap">
                      <CtrlBtn
                        onClick={() => {
                          setMicOn((v) => !v);
                          logAudit(micOn ? 'Micrófono silenciado' : 'Micrófono activado');
                        }}
                        active={micOn}
                        label={micOn ? t('consultation.controls.mute') : t('consultation.controls.unmute')}
                      >
                        <MicrophoneIcon className="w-5 h-5" />
                      </CtrlBtn>
                      <CtrlBtn
                        onClick={() => {
                          setCamOn((v) => !v);
                          logAudit(camOn ? 'Cámara apagada' : 'Cámara encendida');
                        }}
                        active={camOn}
                        label={t('consultation.controls.camOn')}
                      >
                        {camOn ? <VideoCameraIcon className="w-5 h-5" /> : <VideoCameraSlashIcon className="w-5 h-5" />}
                      </CtrlBtn>
                      <CtrlBtn
                        onClick={() => {
                          setSharing((v) => !v);
                          logAudit(sharing ? 'Detuvo compartir' : 'Comparte pantalla');
                        }}
                        active={sharing}
                        label={sharing ? t('consultation.controls.shareStop') : t('consultation.controls.share')}
                      >
                        <ComputerDesktopIcon className="w-5 h-5" />
                      </CtrlBtn>
                      <CtrlBtn
                        onClick={() => {
                          setRecording((v) => !v);
                          logAudit(recording ? 'Detuvo grabación' : 'Inició grabación');
                        }}
                        active={recording}
                        label={recording ? t('consultation.controls.stopRec') : t('consultation.controls.record')}
                      >
                        <BellAlertIcon className="w-5 h-5" />
                      </CtrlBtn>
                      <button
                        onClick={() => setShowEndConfirm(true)}
                        className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 text-sm font-medium shadow-lg"
                        aria-label={t('consultation.controls.end')}
                      >
                        <PhoneXMarkIcon className="w-5 h-5" /> {t('consultation.controls.end')}
                      </button>
                    </div>
                  )}
                </div>
              </Card>

              {active && (
                <Card variant="bordered" padding="sm">
                  <CardHeader className="mb-2 flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ChatBubbleLeftRightIcon className="w-4 h-4" />
                      {t('consultation.chat.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 overflow-y-auto space-y-2 pr-1 mb-2 bg-secondary-50 dark:bg-secondary-950/40 rounded-lg p-2">
                      {chat.map((m) => (
                        <div key={m.id} className={`flex ${m.from === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                              m.from === 'doctor'
                                ? 'bg-primary-600 text-white'
                                : 'bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white border border-secondary-200 dark:border-secondary-700'
                            }`}
                          >
                            <p>{m.text}</p>
                            <p className={`text-[10px] mt-1 ${m.from === 'doctor' ? 'text-white/70' : 'text-secondary-500'}`}>{m.at}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={chatDraft}
                        onChange={(e) => setChatDraft(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                        placeholder={t('consultation.chat.placeholder')}
                        aria-label={t('consultation.chat.placeholder')}
                      />
                      <Button onClick={sendChat} aria-label={t('consultation.chat.send')}>
                        <PaperAirplaneIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="lg:col-span-3">
              <Card variant="bordered" padding="sm" className="h-full">
                <CardHeader className="mb-3">
                  <div className="flex gap-1 overflow-x-auto -mx-1 px-1">
                    {(
                      [
                        { k: 'record', icon: HeartIcon, label: t('consultation.tabs.record') },
                        { k: 'labs', icon: BeakerIcon, label: t('consultation.tabs.labs') },
                        { k: 'prescription', icon: DocumentTextIcon, label: t('consultation.tabs.prescription') },
                        { k: 'notes', icon: PencilSquareIcon, label: t('consultation.tabs.notes') },
                      ] as { k: ConsultTab; icon: typeof HeartIcon; label: string }[]
                    ).map(({ k, icon: Icon, label }) => (
                      <button
                        key={k}
                        onClick={() => setConsultTab(k)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                          consultTab === k
                            ? 'bg-rose-600 text-white'
                            : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-200 hover:bg-secondary-200'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" /> {label}
                      </button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  {!active && <p className="text-sm text-secondary-500 dark:text-secondary-400">{t('consultation.noActive')}</p>}
                  {active && consultTab === 'record' && <PatientRecordPanel patient={active} />}
                  {active && consultTab === 'labs' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="text-secondary-500 dark:text-secondary-400 text-left">
                          <tr>
                            <th className="py-1">{t('lab.test')}</th>
                            <th>{t('lab.value')}</th>
                            <th>{t('lab.flag')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {LAB_ROWS.slice(0, 6).map((r, i) => (
                            <tr key={i} className="border-t border-secondary-100 dark:border-secondary-800">
                              <td className="py-1.5 text-secondary-700 dark:text-secondary-200">{r.test}</td>
                              <td className="text-secondary-900 dark:text-white font-medium">{r.value}</td>
                              <td>{flagBadge(r.flag, t)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {active && consultTab === 'prescription' && (
                    <div className="space-y-2">
                      <p className="text-xs text-secondary-500 dark:text-secondary-400">Editor completo de receta disponible en la pestaña <strong>{t('tabs.preconsult')}</strong>.</p>
                      <Button size="sm" fullWidth onClick={() => setTab('preconsult')}>
                        Abrir editor
                      </Button>
                    </div>
                  )}
                  {active && consultTab === 'notes' && (
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={8}
                      placeholder={t('consultation.notesPlaceholder')}
                      aria-label={t('consultation.tabs.notes')}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {tab === 'triage' && <TriagePanel onBook={() => setTab('scheduling')} />}
        {tab === 'scheduling' && <SchedulingPanel onAudit={logAudit} />}
        {tab === 'lab' && <LabPanel />}
        {tab === 'billing' && <BillingPanel />}
        {tab === 'preconsult' && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PreconsultForm onAudit={logAudit} />
            <PrescriptionEditor patient={active} onAudit={logAudit} />
          </section>
        )}
      </div>

      {showEndConfirm && (
        <div className="fixed inset-0 z-50 p-4" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowEndConfirm(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full items-center justify-center">
            <Card variant="elevated" className="max-w-sm w-full relative">
              <button
                type="button"
                onClick={() => setShowEndConfirm(false)}
                aria-label={t('consultation.endConfirmNo')}
                className="absolute right-2 top-2 z-10 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
                  {t('consultation.endConfirm')}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2 mt-4">
                <Button variant="outline" fullWidth onClick={() => setShowEndConfirm(false)}>
                  {t('consultation.endConfirmNo')}
                </Button>
                <Button variant="danger" fullWidth onClick={endConsult}>
                  {t('consultation.endConfirmYes')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </main>
  );
}

function CtrlBtn({
  children,
  onClick,
  active,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-colors ${
        active ? 'bg-white/90 text-secondary-900 hover:bg-white' : 'bg-white/20 text-white hover:bg-white/30'
      }`}
    >
      {children}
    </button>
  );
}
