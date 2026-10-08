'use client';

/**
 * Consultorio virtual (vista del profesional): sala de espera con signos de alarma,
 * videoconsulta (paciente simulado + tu cámara opcional), chat con guion, ficha,
 * laboratorios del paciente, receta y órdenes, notas SOAP y cierre con resumen.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import {
  ArrowDownTrayIcon,
  BeakerIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ComputerDesktopIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  PhoneArrowUpRightIcon,
  PhoneXMarkIcon,
  ShieldCheckIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import PatientRecordPanel from './PatientRecordPanel';
import PrescriptionEditor, { ConsultDraft, EMPTY_DRAFT } from './PrescriptionEditor';
import { flagBadge } from './LabBillingPanels';
import { DEMO_DATE, IPS, LAB_ORDERS, PROFESSIONAL } from './mockData';
import { avatarColor, demoClock, fmtCOP, fmtDate, fmtDec, fmtTimer, initials, payerOf, priceFor, sortQueue, tx } from './logic';
import { makePdf } from './pdf';
import { attachStream, useCameraAllowed, useLocalMedia } from './useLocalMedia';
import { Modal, PRIORITY_STYLES, SimTag, useAuditText, useDateNames, useLoc } from './ui';
import type { TelemedStore } from './store';
import type { Attention, ChatMessage, ConsultTab, MainTab, Patient, Priority, Soap } from './types';

interface Props {
  store: TelemedStore;
  visible: boolean;
  notify: (text: string, tone?: 'ok' | 'warn') => void;
  goTab: (tab: MainTab) => void;
  onOpenAudit: () => void;
}

const EMPTY_SOAP: Soap = { s: '', o: '', a: '', p: '' };

export default function ConsoleView({ store, visible, notify, goTab, onOpenAudit }: Props) {
  const t = useTranslations('demoTelemed');
  const loc = useLoc();
  const names = useDateNames();
  const auditText = useAuditText();
  const { state, log, updatePatient, addAttention, nextRxNumber } = store;

  const [filter, setFilter] = useState<'all' | Priority>('all');
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [consultTab, setConsultTab] = useState<ConsultTab>('record');
  const [seconds, setSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState('');
  const [micOn, setMicOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const scriptIdx = useRef(0);
  const [draft, setDraft] = useState<ConsultDraft>(EMPTY_DRAFT);
  const [soap, setSoap] = useState<Soap>(EMPTY_SOAP);
  const [showEnd, setShowEnd] = useState(false);
  const [summary, setSummary] = useState<{
    attention: Attention;
    patient: Patient;
    soap: Soap;
    draft: ConsultDraft;
  } | null>(null);
  const [referTarget, setReferTarget] = useState<Patient | null>(null);
  const chatBox = useRef<HTMLDivElement | null>(null);
  const videoBox = useRef<HTMLDivElement | null>(null);
  const media = useLocalMedia();
  const camAllowed = useCameraAllowed();

  const active = state.patients.find((p) => p.id === activeId) ?? null;

  // Si la consulta abierta deja de existir (p. ej. al restablecer los datos), se cierra.
  useEffect(() => {
    if (activeId && (!active || active.status !== 'inConsult')) {
      setActiveId(null);
      setShowEnd(false);
      setRecording(false);
      setSharing(false);
      media.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, active?.status]);

  useEffect(() => {
    if (!activeId) return;
    const i = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(i);
  }, [activeId]);

  // Si el consultorio se oculta (cambio de pestaña), se apaga tu cámara.
  useEffect(() => {
    if (!visible) media.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    // Desplaza solo la caja del chat (no la página).
    if (chatBox.current) chatBox.current.scrollTop = chatBox.current.scrollHeight;
  }, [chat, typing]);

  const queue = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortQueue(state.patients.filter((p) => p.status === 'waiting')).filter(
      (p) => (filter === 'all' || p.priority === filter) && (!q || p.name.toLowerCase().includes(q) || tx(p.reason, loc).toLowerCase().includes(q)),
    );
  }, [state.patients, filter, search, loc]);

  function callPatient(p: Patient) {
    if (activeId) return;
    setActiveId(p.id);
    updatePatient(p.id, { status: 'inConsult' });
    setSeconds(0);
    setStartedAt(demoClock());
    setConsultTab('record');
    scriptIdx.current = 0;
    setChat([{ id: 'c0', from: 'patient', text: t('chat.hello'), at: demoClock() }]);
    setDraft(EMPTY_DRAFT);
    setSoap(EMPTY_SOAP);
    setMicOn(true);
    setSharing(false);
    setRecording(false);
    log('doctor', 'consultStart', { patient: p.name });
    // Si el video no está a la vista (celular, o la sala de espera quedó desplazada), se lleva a la vista.
    window.setTimeout(() => {
      const el = videoBox.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      // 80 px de margen para que la barra superior del sitio no tape el video.
      if (top < 80 || top > window.innerHeight * 0.6) window.scrollTo({ top: top + window.scrollY - 80, behavior: 'smooth' });
    }, 50);
  }

  function referPatient(p: Patient) {
    updatePatient(p.id, { status: 'referred' });
    addAttention({
      kind: 'referral',
      billable: false,
      patientName: p.name,
      docType: p.docType,
      doc: p.doc,
      payerId: p.payerId,
      spec: 'general',
      date: DEMO_DATE,
      time: demoClock(),
      durationMin: 0,
      dx: null,
      value: 0,
      patientShare: 0,
      payerShare: 0,
      payStatus: 'na',
      rips: false,
      rx: null,
      orders: [],
      soap: null,
    });
    log('doctor', 'referred', { patient: p.name });
    notify(t('toasts.referred', { name: p.name }));
    setReferTarget(null);
  }

  function sendChat() {
    const text = chatDraft.trim();
    if (!text || !active) return;
    setChat((c) => [...c, { id: `d${c.length}`, from: 'doctor', text, at: demoClock() }]);
    setChatDraft('');
    setTyping(true);
    const script = active.script;
    window.setTimeout(() => {
      const idx = scriptIdx.current;
      scriptIdx.current += 1;
      const reply = idx < script.length ? tx(script[idx], loc) : t('chat.generic');
      setChat((c) => [...c, { id: `p${c.length}`, from: 'patient', text: reply, at: demoClock() }]);
      setTyping(false);
    }, 1100);
  }

  async function toggleCamera() {
    if (media.stream) {
      media.stop();
      log('doctor', 'camOff');
      return;
    }
    const ok = await media.start(true);
    if (ok) {
      media.setAudioEnabled(micOn);
      log('doctor', 'camOn');
    } else {
      notify(t('video.camError'), 'warn');
    }
  }

  function toggleMic() {
    const next = !micOn;
    setMicOn(next);
    media.setAudioEnabled(next);
    log('doctor', next ? 'micOn' : 'micOff');
  }

  function toggleRecording() {
    if (!active) return;
    if (!recording && !active.preconsult?.consentRec) {
      notify(t('toasts.noRecConsent'), 'warn');
      log('system', 'recBlocked', { patient: active.name });
      return;
    }
    setRecording((r) => !r);
    log('doctor', recording ? 'recStop' : 'recStart');
  }

  function signRx() {
    if (!active || !draft.dx) return;
    const number = nextRxNumber();
    setDraft((d) => ({
      ...d,
      rx: {
        number,
        signedAt: demoClock(),
        meds: d.meds.map(({ name, dose, freq, duration, instructions }) => ({
          name,
          dose,
          freq,
          duration,
          instructions,
        })),
      },
      rxSent: false,
    }));
    log('doctor', 'rxSigned', { number, patient: active.name });
  }

  function importPreconsult() {
    if (!active) return;
    const pre = active.preconsult;
    const v = active.vitals;
    const s = pre
      ? t('soap.importS', {
          reason: tx(pre.reason, loc),
          onset: tx(pre.onset, loc) || '—',
          intensity: String(pre.intensity),
          prev: tx(pre.prev, loc) || '—',
        })
      : tx(active.reason, loc);
    const parts: string[] = [];
    if (v.hr !== undefined) parts.push(`${t('record.hr')} ${v.hr} ${t('record.hrUnit')}`);
    if (v.bp) parts.push(`${t('record.bp')} ${v.bp} mmHg`);
    if (v.spo2 !== undefined) parts.push(`SpO2 ${v.spo2} %`);
    if (v.temp !== undefined) parts.push(`${t('record.temp')} ${fmtDec(v.temp, loc)} °C`);
    if (v.glucose !== undefined) parts.push(`${t('record.glucose')} ${v.glucose} mg/dL`);
    setSoap((x) => ({
      ...x,
      s: x.s ? `${x.s}\n${s}` : s,
      o: x.o || (parts.length ? `${t('soap.importO')}: ${parts.join(', ')}.` : x.o),
    }));
    log('doctor', 'soapImported', { patient: active.name });
  }

  const endChecks = {
    dx: !!draft.dx,
    rx: draft.meds.length === 0 || !!draft.rx,
    notes: !!(soap.a.trim() || soap.p.trim()),
  };

  function finalize() {
    if (!active || !endChecks.dx || !endChecks.rx) return;
    const kind = payerOf(active.payerId).kind;
    const price = priceFor('general', kind);
    const durationMin = Math.max(1, Math.round(seconds / 60));
    const attention: Omit<Attention, 'id' | 'invoice'> = {
      kind: 'consult',
      patientName: active.name,
      docType: active.docType,
      doc: active.doc,
      payerId: active.payerId,
      spec: 'general',
      date: DEMO_DATE,
      time: startedAt,
      durationMin,
      dx: draft.dx ? { code: draft.dx.code, label: draft.dx.label } : null,
      value: price.value,
      patientShare: price.patient,
      payerShare: price.payer,
      payStatus: 'pending',
      rips: true,
      rx: draft.rx,
      orders: draft.orders,
      soap,
    };
    const { id, invoice } = addAttention({ ...attention, billable: true });
    updatePatient(active.id, { status: 'done' });
    log('doctor', 'consultEnd', {
      patient: active.name,
      duration: fmtTimer(seconds),
    });
    log('billing', 'invoiceCreated', { invoice: invoice ?? '', attention: id });
    setSummary({
      attention: { ...attention, id, invoice },
      patient: active,
      soap,
      draft,
    });
    setActiveId(null);
    setShowEnd(false);
    setRecording(false);
    setSharing(false);
    media.stop();
  }

  async function downloadSummary() {
    if (!summary) return;
    const { attention: a, patient: p, soap: s, draft: d } = summary;
    await makePdf({
      filename: `${t('summary.fileName')}-${a.id}.pdf`,
      title: t('summary.pdfTitle'),
      subtitle: `${a.id} · ${fmtDate(a.date, loc, names, { year: true })} ${a.time} · ${t('summary.duration', { min: String(a.durationMin) })}`,
      sample: t('pdf.sample'),
      ipsLine: t('pdf.ipsLine', { nit: IPS.nit, city: IPS.city[loc] }),
      sections: [
        {
          heading: t('rx.pdf.patient'),
          rows: [
            [t('rx.pdf.name'), p.name],
            [t('rx.pdf.doc'), `${p.docType} ${p.doc}`],
            [t('rx.pdf.age'), `${p.age} ${t('record.years')}`],
            [t('rx.pdf.payer'), tx(payerOf(p.payerId).name, loc)],
            [t('summary.modality'), t('summary.modalityValue')],
            [t('summary.professional'), `${PROFESSIONAL.name} · ${t('specialties.general')}`],
          ],
        },
        {
          heading: t('summary.clinical'),
          rows: [
            [t('rx.pdf.dx'), a.dx ? `${a.dx.code} · ${tx(a.dx.label, loc)}` : '—'],
            [t('soap.s'), s.s],
            [t('soap.o'), s.o],
            [t('soap.a'), s.a],
            [t('soap.p'), s.p],
          ],
        },
        ...(d.rx
          ? [
              {
                heading: `${t('rx.pdf.meds')} · ${d.rx.number}`,
                table: {
                  head: [t('rx.med'), t('rx.dose'), t('rx.freq'), t('rx.duration')],
                  rows: d.rx.meds.map((m) => [tx(m.name, loc), tx(m.dose, loc), tx(m.freq, loc), tx(m.duration, loc)]),
                  widths: [70, 30, 45, 35],
                },
              },
            ]
          : []),
        ...(d.orders.length
          ? [
              {
                heading: t('rx.pdf.orders'),
                paragraphs: d.orders.map((o) => `• ${tx(LAB_ORDERS.find((x) => x.id === o)?.label, loc)}`),
              },
            ]
          : []),
        {
          heading: t('summary.billing'),
          rows: [
            [t('billing.cols.value'), fmtCOP(a.value, loc)],
            [t('billing.cols.patientShare'), fmtCOP(a.patientShare, loc)],
            [t('billing.cols.payerShare'), fmtCOP(a.payerShare, loc)],
            [t('billing.cols.invoice'), `${a.invoice ?? '—'} (${t('common.simulated')})`],
            ['RIPS', t('billing.ripsGenerated')],
          ],
        },
      ],
      signature: {
        name: PROFESSIONAL.name,
        detail: t('rx.pdf.signature', { reg: PROFESSIONAL.reg, time: a.time }),
      },
      footer: t('pdf.footer'),
    });
    notify(t('toasts.pdf', { name: `${t('summary.fileName')}-${a.id}.pdf` }));
  }

  const ctrl = (on: boolean) =>
    `w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-colors ${on ? 'bg-white/90 text-secondary-900 hover:bg-white' : 'bg-white/20 text-white hover:bg-white/30'}`;

  return (
    <section className={visible ? 'grid grid-cols-1 lg:grid-cols-12 gap-4' : 'hidden'} aria-hidden={!visible}>
      {/* Sala de espera + auditoría */}
      <div className="lg:col-span-3 space-y-4 min-w-0">
        <Card variant="bordered" padding="sm">
          <CardHeader className="mb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">{t('queue.title')}</CardTitle>
              <span className="rounded-full bg-primary-100 dark:bg-primary-900/40 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:text-primary-200">
                {queue.length}
              </span>
            </div>
            <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">{t('queue.subtitle')}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" />
              <Input
                className="pl-9"
                placeholder={t('queue.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label={t('queue.search')}
              />
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('queue.filterLabel')}>
              {(['all', 'red', 'yellow', 'green'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    filter === f
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white dark:bg-secondary-800 border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-200 hover:border-primary-400'
                  }`}
                >
                  {t(`queue.filter.${f}`)}
                </button>
              ))}
            </div>
            <ul className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {queue.length === 0 && <li className="text-sm text-secondary-500 dark:text-secondary-400 text-center py-6">{t('queue.empty')}</li>}
              {queue.map((p) => (
                <li
                  key={p.id}
                  className={`p-3 rounded-xl border bg-white dark:bg-secondary-800 ${p.priority === 'red' ? 'border-red-300 dark:border-red-700' : 'border-secondary-200 dark:border-secondary-700'}`}
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
                        <span className={`w-2 h-2 shrink-0 rounded-full ${PRIORITY_STYLES[p.priority].dot}`} aria-hidden="true" />
                      </div>
                      <p className="text-xs text-secondary-600 dark:text-secondary-300 line-clamp-2">{tx(p.reason, loc)}</p>
                      <p className="text-[11px] text-secondary-500 dark:text-secondary-400 mt-0.5 truncate">
                        {p.age} {t('record.years')} · {tx(payerOf(p.payerId).name, loc)}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="text-secondary-500 dark:text-secondary-400 flex items-center gap-1">
                          <ClockIcon className="w-3.5 h-3.5" />
                          {t('queue.waiting', { min: String(p.waitMin) })}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${PRIORITY_STYLES[p.priority].chip}`}>
                          {t(`priority.${p.priority}`)}
                        </span>
                      </div>
                      {p.priority === 'red' ? (
                        <div className="mt-2 space-y-1.5">
                          <p className="flex gap-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 p-2 text-[11px] text-red-800 dark:text-red-200">
                            <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
                            {t('queue.alarm')}
                          </p>
                          <Button size="sm" variant="danger" fullWidth onClick={() => setReferTarget(p)} aria-label={`${t('queue.refer')} ${p.name}`}>
                            <PhoneArrowUpRightIcon className="w-4 h-4 mr-1" /> {t('queue.refer')}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          fullWidth
                          className="mt-2"
                          onClick={() => callPatient(p)}
                          disabled={!!activeId}
                          title={activeId ? t('queue.busy') : undefined}
                          aria-label={`${t('queue.call')} ${p.name}`}
                        >
                          {t('queue.call')}
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {activeId && <p className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('queue.busy')}</p>}
          </CardContent>
        </Card>

        <Card variant="bordered" padding="sm">
          <CardHeader className="mb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheckIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {t('audit.title')}
              </CardTitle>
              <button type="button" onClick={onOpenAudit} className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">
                {t('audit.viewAll')}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 max-h-48 overflow-y-auto text-xs">
              {state.audit.slice(0, 8).map((a) => {
                const x = auditText(a);
                return (
                  <li key={a.id} className="flex items-start gap-2">
                    <span className="font-mono text-secondary-500 dark:text-secondary-400 shrink-0">{a.at.slice(0, 5)}</span>
                    <span className="text-secondary-700 dark:text-secondary-200">{x.text}</span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Video y chat */}
      <div className="lg:col-span-6 space-y-4 min-w-0">
        <Card variant="bordered" padding="none" className="overflow-hidden">
          <div
            ref={videoBox}
            className="relative w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950"
            style={{ aspectRatio: '16 / 9', minHeight: 280 }}
          >
            {!active && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white/80 px-6">
                <VideoCameraSlashIcon className="w-14 h-14 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-semibold">{t('video.noActive')}</p>
                <p className="text-sm text-white/60 mt-1">{t('video.noActiveHint')}</p>
              </div>
            )}
            {active && (
              <>
                <div className="absolute inset-x-0 top-0 bottom-16 flex flex-col items-center justify-center gap-2">
                  <div
                    className={`w-20 h-20 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br ${avatarColor(active.name)} flex items-center justify-center text-white text-3xl sm:text-5xl font-bold shadow-2xl ring-4 ring-white/20`}
                  >
                    {initials(active.name)}
                  </div>
                  <span className="rounded bg-black/50 px-2 py-0.5 text-[11px] text-white/80">{t('video.patientSimulated')}</span>
                </div>
                <div className="absolute top-3 right-3 w-24 h-[68px] sm:w-40 sm:h-[90px] rounded-lg overflow-hidden bg-slate-700 ring-1 ring-white/30 shadow-lg">
                  {media.stream ? (
                    <video
                      ref={attachStream(media.stream)}
                      autoPlay
                      playsInline
                      muted
                      className="h-full w-full object-cover -scale-x-100"
                      aria-label={t('video.selfView')}
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-center text-white/80 px-1">
                      <VideoCameraSlashIcon className="w-5 h-5" />
                      <span className="text-[10px] leading-tight mt-1">{camAllowed ? t('video.camOffSelf') : t('video.selfSimulated')}</span>
                    </div>
                  )}
                  <span className="absolute bottom-0 inset-x-0 bg-black/50 text-[10px] text-white text-center">{t('video.you')}</span>
                </div>
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                  <span className="px-2 py-1 rounded bg-black/60 text-white text-xs flex items-center gap-1 font-mono">
                    <ClockIcon className="w-3.5 h-3.5" />
                    {fmtTimer(seconds)}
                  </span>
                  {recording && (
                    <span className="px-2 py-1 rounded bg-red-600/90 text-white text-xs flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      {t('video.recBadge')}
                    </span>
                  )}
                  {sharing && <span className="px-2 py-1 rounded bg-blue-600/90 text-white text-xs">{t('video.sharingBadge')}</span>}
                  {!micOn && <span className="px-2 py-1 rounded bg-black/60 text-white text-xs">{t('video.muted')}</span>}
                </div>
                <div className="hidden sm:block absolute bottom-16 left-3 px-2 py-1 rounded bg-black/60 text-white text-xs">{active.name}</div>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3 flex items-center justify-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={toggleMic}
                    className={ctrl(micOn)}
                    aria-label={micOn ? t('video.mute') : t('video.unmute')}
                    title={micOn ? t('video.mute') : t('video.unmute')}
                    aria-pressed={!micOn}
                  >
                    <span className="relative">
                      <MicrophoneIcon className="w-5 h-5" />
                      {!micOn && <span className="absolute left-1/2 top-1/2 h-0.5 w-6 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-current" />}
                    </span>
                  </button>
                  {camAllowed && (
                    <button
                      type="button"
                      onClick={toggleCamera}
                      disabled={media.starting}
                      className={ctrl(!!media.stream)}
                      aria-label={media.stream ? t('video.camStop') : t('video.camStart')}
                      title={media.stream ? t('video.camStop') : t('video.camStart')}
                      aria-pressed={!!media.stream}
                    >
                      {media.stream ? <VideoCameraIcon className="w-5 h-5" /> : <VideoCameraSlashIcon className="w-5 h-5" />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSharing((s) => !s);
                      log('doctor', sharing ? 'shareStop' : 'shareStart');
                    }}
                    className={ctrl(sharing)}
                    aria-label={sharing ? t('video.shareStop') : t('video.share')}
                    title={sharing ? t('video.shareStop') : t('video.share')}
                    aria-pressed={sharing}
                  >
                    <ComputerDesktopIcon className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={ctrl(recording)}
                    aria-label={recording ? t('video.recStop') : t('video.rec')}
                    title={recording ? t('video.recStop') : t('video.rec')}
                    aria-pressed={recording}
                  >
                    <span className={`block rounded-full ${recording ? 'w-3.5 h-3.5 rounded-sm bg-red-600' : 'w-4 h-4 bg-red-500 ring-2 ring-current'}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEnd(true)}
                    className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 text-sm font-medium shadow-lg"
                  >
                    <PhoneXMarkIcon className="w-5 h-5" /> {t('video.end')}
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="px-4 py-2.5 text-[11px] text-secondary-500 dark:text-secondary-400 border-t border-secondary-200 dark:border-secondary-700 flex flex-wrap items-center gap-2">
            <SimTag>{t('video.simTag')}</SimTag>
            <span>{camAllowed ? t('video.note') : t('video.noteNoCam')}</span>
            {media.error && <span className="text-amber-700 dark:text-amber-300">{t(`video.errors.${media.error}`)}</span>}
          </div>
        </Card>

        {active && (
          <Card variant="bordered" padding="sm">
            <CardHeader className="mb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  {t('chat.title')}
                </CardTitle>
                <SimTag>{t('chat.scripted')}</SimTag>
              </div>
            </CardHeader>
            <CardContent>
              <div
                ref={chatBox}
                className="h-48 overflow-y-auto space-y-2 pr-1 mb-2 bg-secondary-50 dark:bg-secondary-950/40 rounded-lg p-2"
                aria-live="polite"
              >
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
                {typing && <p className="text-xs text-secondary-500 italic">{t('chat.typing', { name: active.name.split(' ')[0] })}</p>}
              </div>
              <div className="flex gap-2">
                <Input
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') sendChat();
                  }}
                  placeholder={t('chat.placeholder')}
                  aria-label={t('chat.placeholder')}
                />
                <Button onClick={sendChat} disabled={!chatDraft.trim()} aria-label={t('chat.send')}>
                  <PaperAirplaneIcon className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Panel de la consulta */}
      <div className="lg:col-span-3 min-w-0">
        <Card variant="bordered" padding="sm" className="h-full">
          <CardHeader className="mb-3">
            <div className="flex flex-wrap gap-1" role="tablist" aria-label={t('consult.panelLabel')}>
              {(
                [
                  { k: 'record', icon: HeartIcon },
                  { k: 'labs', icon: BeakerIcon },
                  { k: 'rx', icon: DocumentTextIcon },
                  { k: 'notes', icon: PencilSquareIcon },
                ] as { k: ConsultTab; icon: typeof HeartIcon }[]
              ).map(({ k, icon: Icon }) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={consultTab === k}
                  onClick={() => setConsultTab(k)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    consultTab === k
                      ? 'bg-rose-600 text-white'
                      : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-200 hover:bg-secondary-200 dark:hover:bg-secondary-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {t(`consult.tabs.${k}`)}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {!active && <p className="text-sm text-secondary-500 dark:text-secondary-400">{t('consult.noActive')}</p>}
            {active && consultTab === 'record' && <PatientRecordPanel patient={active} />}
            {active && consultTab === 'labs' && (
              <div className="space-y-3">
                {active.labs.length === 0 ? (
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('lab.noResults')}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="text-secondary-500 dark:text-secondary-400 text-left">
                        <tr>
                          <th className="py-1 pr-2">{t('lab.cols.test')}</th>
                          <th className="pr-2">{t('lab.cols.value')}</th>
                          <th>{t('lab.cols.flag')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {active.labs.map((r, i) => (
                          <tr key={i} className="border-t border-secondary-100 dark:border-secondary-800">
                            <td className="py-1.5 pr-2 text-secondary-700 dark:text-secondary-200">
                              {tx(r.test, loc)}
                              <span className="block text-[10px] text-secondary-400">{fmtDate(r.date, loc, names, { year: true })}</span>
                            </td>
                            <td className="pr-2 text-secondary-900 dark:text-white font-medium whitespace-nowrap">{tx(r.value, loc)}</td>
                            <td>{flagBadge(r.flag, t)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {draft.orders.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400 mb-1">{t('lab.orderedToday')}</p>
                    <ul className="space-y-0.5 text-xs text-secondary-700 dark:text-secondary-200">
                      {draft.orders.map((o) => (
                        <li key={o}>• {tx(LAB_ORDERS.find((x) => x.id === o)?.label, loc)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {active && consultTab === 'rx' && (
              <PrescriptionEditor
                patient={active}
                draft={draft}
                onChange={setDraft}
                onDx={(dx) => {
                  setDraft((d) => ({ ...d, dx }));
                  log('doctor', 'dxSet', {
                    code: dx.code,
                    patient: active.name,
                  });
                }}
                onSign={signRx}
                onUnsign={() => {
                  if (draft.rx) log('doctor', 'rxVoided', { number: draft.rx.number });
                  setDraft((d) => ({ ...d, rx: null, rxSent: false }));
                }}
                onSend={() => {
                  setDraft((d) => ({ ...d, rxSent: true }));
                  if (draft.rx)
                    log('doctor', 'rxSent', {
                      number: draft.rx.number,
                      patient: active.name,
                    });
                  notify(t('toasts.rxSent', { name: active.name }));
                }}
                notify={notify}
              />
            )}
            {active && consultTab === 'notes' && (
              <div className="space-y-2">
                <Button size="sm" variant="outline" fullWidth onClick={importPreconsult}>
                  {t('soap.import')}
                </Button>
                {(['s', 'o', 'a', 'p'] as const).map((k) => (
                  <Textarea
                    key={k}
                    label={t(`soap.${k}`)}
                    value={soap[k]}
                    onChange={(e) => setSoap((x) => ({ ...x, [k]: e.target.value }))}
                    rows={k === 's' ? 4 : 3}
                    placeholder={t(`soap.${k}Ph`)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Derivación a urgencias */}
      <Modal open={!!referTarget} onClose={() => setReferTarget(null)} title={t('refer.title')}>
        {referTarget && (
          <div className="space-y-3 text-sm">
            <p className="text-secondary-700 dark:text-secondary-200">{t('refer.body', { name: referTarget.name })}</p>
            <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800/50 p-3 text-xs text-secondary-700 dark:text-secondary-200">
              <p className="font-semibold mb-1">{t('refer.messageTitle')}</p>
              <p>{t('refer.message', { name: referTarget.name.split(' ')[0] })}</p>
            </div>
            <p className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('refer.note')}</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" fullWidth onClick={() => setReferTarget(null)}>
                {t('common.cancel')}
              </Button>
              <Button variant="danger" fullWidth onClick={() => referPatient(referTarget)}>
                {t('refer.confirm')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmación de cierre */}
      <Modal open={showEnd} onClose={() => setShowEnd(false)} title={t('end.title')}>
        <div className="space-y-3 text-sm">
          <ul className="space-y-1.5">
            {(
              [
                ['dx', endChecks.dx, true],
                ['rx', endChecks.rx, true],
                ['notes', endChecks.notes, false],
              ] as const
            ).map(([k, ok, required]) => (
              <li key={k} className="flex items-start gap-2">
                {ok ? (
                  <CheckCircleIcon className="w-5 h-5 shrink-0 text-emerald-600" />
                ) : required ? (
                  <XCircleIcon className="w-5 h-5 shrink-0 text-red-600" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 shrink-0 text-amber-500" />
                )}
                <span className="text-secondary-700 dark:text-secondary-200">{t(`end.checks.${k}.${ok ? 'ok' : 'missing'}`)}</span>
              </li>
            ))}
          </ul>
          {active && (
            <p className="text-xs text-secondary-500 dark:text-secondary-400">
              {t('end.billingPreview', {
                value: fmtCOP(priceFor('general', payerOf(active.payerId).kind).value, loc),
                share: fmtCOP(priceFor('general', payerOf(active.payerId).kind).patient, loc),
                payer: tx(payerOf(active.payerId).name, loc),
              })}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            {(!endChecks.dx || !endChecks.rx) && (
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setConsultTab('rx');
                  setShowEnd(false);
                }}
              >
                {t('end.goRx')}
              </Button>
            )}
            {endChecks.dx && endChecks.rx && (
              <Button variant="outline" fullWidth onClick={() => setShowEnd(false)}>
                {t('end.continue')}
              </Button>
            )}
            <Button variant="danger" fullWidth onClick={finalize} disabled={!endChecks.dx || !endChecks.rx}>
              {t('end.confirm')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Resumen de la atención */}
      <Modal open={!!summary} onClose={() => setSummary(null)} title={t('summary.title')} wide>
        {summary && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-3">
                <p className="text-[10px] uppercase tracking-wide text-secondary-500">{t('summary.patient')}</p>
                <p className="font-semibold text-secondary-900 dark:text-white">{summary.patient.name}</p>
                <p className="text-xs text-secondary-500">
                  {summary.patient.docType} {summary.patient.doc} · {tx(payerOf(summary.patient.payerId).name, loc)}
                </p>
                <p className="text-xs text-secondary-500 mt-1">
                  {summary.attention.id} · {summary.attention.time} ·{' '}
                  {t('summary.duration', {
                    min: String(summary.attention.durationMin),
                  })}
                </p>
              </div>
              <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-3">
                <p className="text-[10px] uppercase tracking-wide text-secondary-500">{t('rx.pdf.dx')}</p>
                <p className="text-secondary-900 dark:text-white">
                  {summary.attention.dx ? `${summary.attention.dx.code} · ${tx(summary.attention.dx.label, loc)}` : '—'}
                </p>
                <p className="text-xs text-secondary-500 mt-1">
                  {summary.draft.rx
                    ? t('summary.rxIncluded', {
                        number: summary.draft.rx.number,
                        count: String(summary.draft.rx.meds.length),
                      })
                    : t('summary.noRx')}
                  {summary.draft.orders.length > 0 && ` · ${t('summary.orders', { count: String(summary.draft.orders.length) })}`}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-3">
              <p className="text-[10px] uppercase tracking-wide text-secondary-500 mb-1">{t('summary.billing')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <p className="text-secondary-500">{t('billing.cols.value')}</p>
                  <p className="font-semibold text-secondary-900 dark:text-white">{fmtCOP(summary.attention.value, loc)}</p>
                </div>
                <div>
                  <p className="text-secondary-500">{t('billing.cols.patientShare')}</p>
                  <p className="font-semibold text-secondary-900 dark:text-white">{fmtCOP(summary.attention.patientShare, loc)}</p>
                </div>
                <div>
                  <p className="text-secondary-500">{t('billing.cols.payerShare')}</p>
                  <p className="font-semibold text-secondary-900 dark:text-white">{fmtCOP(summary.attention.payerShare, loc)}</p>
                </div>
                <div>
                  <p className="text-secondary-500">{t('billing.cols.invoice')}</p>
                  <p className="font-mono font-semibold text-secondary-900 dark:text-white">{summary.attention.invoice}</p>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-secondary-500">{t('summary.billingNote')}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button size="sm" variant="outline" fullWidth onClick={downloadSummary}>
                <ArrowDownTrayIcon className="w-4 h-4 mr-1" /> {t('summary.download')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                fullWidth
                onClick={() => {
                  log('doctor', 'summarySent', {
                    patient: summary.patient.name,
                  });
                  notify(t('toasts.summarySent', { name: summary.patient.name }));
                }}
              >
                <PaperAirplaneIcon className="w-4 h-4 mr-1" /> {t('summary.send')}
              </Button>
              <Button
                size="sm"
                fullWidth
                onClick={() => {
                  setSummary(null);
                  goTab('billing');
                }}
              >
                {t('summary.goBilling')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
