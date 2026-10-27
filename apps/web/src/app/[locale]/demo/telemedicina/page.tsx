'use client';

/**
 * Demo de telemedicina para IPS: orientación de síntomas por reglas, agenda conectada con
 * la sala de espera, vista del paciente (pre-consulta, consentimientos y prueba de cámara),
 * consultorio virtual (videoconsulta simulada, ficha, receta y órdenes, notas SOAP, cierre
 * con resumen), laboratorio y pagos y facturación con factura y RIPS simulados. La jornada es
 * la de hoy, con datos de ejemplo, y todo corre en el navegador (sin backend).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  BanknotesIcon,
  BeakerIcon,
  CalculatorIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CreditCardIcon,
  InformationCircleIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  PresentationChartBarIcon,
  UserGroupIcon,
  UserIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import ConsoleView from './components/ConsoleView';
import PreconsultForm from './components/PreconsultForm';
import TriagePanel from './components/TriagePanel';
import SchedulingPanel from './components/SchedulingPanel';
import { BillingPanel, LabPanel } from './components/LabBillingPanels';
import { useTelemedStore } from './components/store';
import { computeKpis, fmtCOP, fmtDate, toCsv } from './components/logic';
import { downloadText } from './components/pdf';
import { IPS } from './components/mockData';
import { Modal, useAuditText, useDateNames, useLoc, useToast } from './components/ui';
import type { MainTab, SpecKey } from './components/types';

/** Salidas comerciales: demo guiada con esta demo ya elegida y cotización del producto. */
const GUIDED_DEMO_HREF = '/solicitar-demo?demos=telemedicina';
const QUOTE_HREF = '/contact?service=telemedicina';
/** Preferencia de este navegador: los primeros pasos plegados. */
const GUIDE_KEY = 'koptup.telemedicina.guideHidden';

const TABS: { k: MainTab; icon: typeof VideoCameraIcon }[] = [
  { k: 'console', icon: VideoCameraIcon },
  { k: 'patient', icon: UserIcon },
  { k: 'triage', icon: ListBulletIcon },
  { k: 'scheduling', icon: CalendarDaysIcon },
  { k: 'lab', icon: BeakerIcon },
  { k: 'billing', icon: CreditCardIcon },
];

/** Primeros pasos: cada uno lleva a su pestaña y se marca solo cuando aparece su evento en la auditoría. */
const STEPS: { k: string; tab: MainTab; events: string[]; anchor: string }[] = [
  { k: 's1', tab: 'triage', events: ['triageRun'], anchor: 'tm-content' },
  { k: 's2', tab: 'scheduling', events: ['apptBooked'], anchor: 'tm-content' },
  { k: 's3', tab: 'patient', events: ['preconsultAppt', 'preconsultSent'], anchor: 'tm-content' },
  { k: 's4', tab: 'console', events: ['consultStart', 'referred'], anchor: 'tm-queue' },
  { k: 's5', tab: 'console', events: ['consultEnd'], anchor: 'tm-consult-panel' },
  { k: 's6', tab: 'billing', events: ['paid'], anchor: 'tm-content' },
];

export default function TelemedicinaPage() {
  const t = useTranslations('demoTelemed');
  const loc = useLoc();
  const names = useDateNames();
  const store = useTelemedStore();
  const toast = useToast();
  const auditText = useAuditText();
  const [tab, setTab] = useState<MainTab>('console');
  const [bookPreset, setBookPreset] = useState<{ spec: SpecKey; n: number } | null>(null);
  const [patientPreset, setPatientPreset] = useState<{ apptId: string; n: number } | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditQ, setAuditQ] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [guideOpen, setGuideOpen] = useState(true);

  // Se lee después de montar para que el primer render sea igual en el servidor y en el navegador.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(GUIDE_KEY) === '1') setGuideOpen(false);
    } catch {
      /* sin almacenamiento: los pasos quedan abiertos */
    }
  }, []);

  // Al cargar: si había una consulta abierta se retoma; si cambió el día, empieza una jornada nueva.
  const { loadInfo } = store;
  const showToast = toast.show;
  const loadHandled = useRef<typeof loadInfo>(null);
  useEffect(() => {
    if (!loadInfo || loadHandled.current === loadInfo) return;
    loadHandled.current = loadInfo;
    if (loadInfo.resumedPatient) {
      setTab('console');
      showToast(t('toasts.resumed', { name: loadInfo.resumedPatient }));
    } else if (loadInfo.newDay) {
      showToast(t('toasts.newDay'));
    }
  }, [loadInfo, showToast, t]);

  function toggleGuide() {
    const next = !guideOpen;
    setGuideOpen(next);
    try {
      window.localStorage.setItem(GUIDE_KEY, next ? '0' : '1');
    } catch {
      /* sin almacenamiento: solo cambia en esta visita */
    }
  }

  const doneEvents = new Set(store.state.audit.map((e) => e.key));
  const stepsDone = STEPS.map((s) => s.events.some((ev) => doneEvents.has(ev)));
  const doneCount = stepsDone.filter(Boolean).length;

  const k = computeKpis(store.state.patients, store.state.attentions, store.state.day, store.now);
  const kpis = [
    { icon: UserGroupIcon, label: t('kpis.waiting'), value: String(k.waiting), sub: t('kpis.waitingSub'), color: 'text-sky-600 dark:text-sky-400' },
    { icon: ClockIcon, label: t('kpis.avgWait'), value: String(k.avgWait), sub: t('kpis.avgWaitSub'), color: 'text-amber-600 dark:text-amber-400' },
    { icon: CheckCircleIcon, label: t('kpis.done'), value: String(k.done), sub: t('kpis.doneSub'), color: 'text-emerald-600 dark:text-emerald-400' },
    { icon: BanknotesIcon, label: t('kpis.pending'), value: fmtCOP(k.pending, loc), sub: t('kpis.pendingSub'), color: 'text-rose-600 dark:text-rose-400' },
  ];

  const auditRows = useMemo(() => {
    const q = auditQ.trim().toLowerCase();
    return store.state.audit
      .map((e) => ({ e, x: auditText(e) }))
      .filter(({ x }) => !q || x.text.toLowerCase().includes(q) || x.actor.toLowerCase().includes(q));
  }, [store.state.audit, auditQ, auditText]);

  /** Cambia de pestaña y lleva a su contenido (o a la parte que pide el paso), sin quedar debajo del menú fijo del sitio. */
  function goTab(next: MainTab, anchor = 'tm-content') {
    setTab(next);
    if (typeof window === 'undefined') return;
    window.setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  function exportAudit() {
    const rows = auditRows.map(({ e, x }) => [store.state.day, e.at, x.actor, x.text]);
    downloadText(
      `${t('audit.fileName')}-${store.state.day}.csv`,
      toCsv([[t('audit.cols.date'), t('audit.cols.time'), t('audit.cols.actor'), t('audit.cols.event')], ...rows]),
      'text/csv;charset=utf-8',
    );
    toast.show(t('toasts.csv', { count: String(rows.length) }));
  }

  function reset() {
    store.reset();
    setBookPreset(null);
    setPatientPreset(null);
    setConfirmReset(false);
    setTab('console');
    toast.show(t('toasts.reset'));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50 dark:from-secondary-950 dark:to-secondary-900 overflow-x-hidden">
      <header className="bg-gradient-to-br from-red-600 to-rose-800 text-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-4 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <Link href="/demo" className="inline-flex items-center gap-2 rounded-md text-rose-100 hover:text-white text-sm font-medium">
              <ArrowLeftIcon className="w-4 h-4" aria-hidden="true" /> {t('header.back')}
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" className="bg-white text-rose-800 border-white hover:bg-rose-50 gap-1.5" asChild>
                <Link href={GUIDED_DEMO_HREF}>
                  <PresentationChartBarIcon className="w-4 h-4" aria-hidden="true" />
                  {t('header.guidedDemo')}
                </Link>
              </Button>
              <Button size="sm" variant="outline" className="bg-transparent text-white border-white/60 hover:bg-white/10 gap-1.5" asChild>
                <Link href={QUOTE_HREF}>
                  <CalculatorIcon className="w-4 h-4" aria-hidden="true" />
                  {t('header.quote')}
                </Link>
              </Button>
              <Button size="sm" variant="ghost" className="text-rose-50 hover:text-white hover:bg-white/10" onClick={() => setConfirmReset(true)} title={t('header.resetHint')}>
                <ArrowPathIcon className="w-4 h-4 mr-1" aria-hidden="true" /> {t('header.reset')}
              </Button>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-3">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-white/15 flex items-center justify-center" aria-hidden="true">
              <VideoCameraIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-100">{t('header.kicker')}</p>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">{t('header.title')}</h1>
              <p className="mt-1 text-xs sm:text-sm text-rose-50 max-w-4xl">{t('header.subtitle', { ips: IPS.name })}</p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2.5 py-0.5 text-xs" title={t('header.sampleHint')}>
              <BeakerIcon className="w-3.5 h-3.5" aria-hidden="true" /> {t('header.sampleBadge')}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2.5 py-0.5 text-xs">
              <InformationCircleIcon className="w-3.5 h-3.5" aria-hidden="true" /> {t('header.simBadge')}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2.5 py-0.5 text-xs" title={t('header.clockHint')}>
              <CalendarDaysIcon className="w-3.5 h-3.5" aria-hidden="true" />
              {store.loaded
                ? t('header.dayBadge', { date: fmtDate(store.state.day, loc, names, { weekday: true, year: true }), time: store.now })
                : t('header.dayBadgeLoading')}
            </span>
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto px-2 sm:px-6">
          <nav className="flex gap-1 overflow-x-auto pb-0" role="tablist" aria-label={t('header.tabsLabel')}>
            {TABS.map(({ k: key, icon: Icon }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === key ? 'border-white text-white' : 'border-transparent text-rose-100/80 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" /> {t(`tabs.${key}`)}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        <section
          aria-labelledby="tm-guide-title"
          className="rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white/80 dark:bg-secondary-900/60 px-4 py-3"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="tm-guide-title" className="text-sm font-semibold text-secondary-900 dark:text-white">
              {t('route.title')}{' '}
              <span className="font-normal text-secondary-500 dark:text-secondary-400">· {t('route.progress', { done: String(doneCount), total: String(STEPS.length) })}</span>
            </h2>
            <button
              type="button"
              onClick={toggleGuide}
              aria-expanded={guideOpen}
              aria-controls="tm-guide-steps"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-700 dark:text-primary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
            >
              {guideOpen ? t('route.hide') : t('route.show')}
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${guideOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          </div>
          {guideOpen && (
            <>
              <p className="mt-1 text-xs text-secondary-600 dark:text-secondary-300">{t('route.intro')}</p>
              <ol id="tm-guide-steps" className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-2">
                {STEPS.map((s, i) => (
                  <li key={s.k}>
                    <button
                      type="button"
                      onClick={() => goTab(s.tab, s.anchor)}
                      className={`h-full w-full text-left rounded-lg border p-2.5 transition-colors hover:border-rose-400 dark:hover:border-rose-500 ${
                        stepsDone[i]
                          ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-900/20'
                          : 'border-secondary-200 dark:border-secondary-700'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                        <span>
                          {t('route.step', { n: String(i + 1) })} · {t(`tabs.${s.tab}`)}
                        </span>
                        {stepsDone[i] && (
                          <span className="inline-flex items-center gap-0.5 normal-case tracking-normal text-emerald-700 dark:text-emerald-300">
                            <CheckCircleIcon className="w-3.5 h-3.5" aria-hidden="true" /> {t('route.done')}
                          </span>
                        )}
                      </span>
                      <span className="block text-xs text-secondary-700 dark:text-secondary-200 mt-0.5">{t(`route.${s.k}`)}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((x) => (
            <Card key={x.label} padding="sm" variant="bordered">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 uppercase tracking-wide">{x.label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-secondary-900 dark:text-white mt-1 truncate">{x.value}</p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">{x.sub}</p>
                </div>
                <x.icon className={`w-6 h-6 shrink-0 ${x.color}`} />
              </div>
            </Card>
          ))}
        </section>

        <div id="tm-content" className="scroll-mt-24">
          <ConsoleView store={store} visible={tab === 'console'} notify={toast.show} goTab={goTab} onOpenAudit={() => setAuditOpen(true)} />
          <div className={tab === 'patient' ? '' : 'hidden'}>
            <PreconsultForm store={store} visible={tab === 'patient'} notify={toast.show} goConsole={() => goTab('console')} preset={patientPreset} />
          </div>
          <div className={tab === 'triage' ? '' : 'hidden'}>
            <TriagePanel
              log={store.log}
              onBook={(spec) => {
                setBookPreset((p) => ({ spec, n: (p?.n ?? 0) + 1 }));
                goTab('scheduling');
              }}
            />
          </div>
          <div className={tab === 'scheduling' ? '' : 'hidden'}>
            <SchedulingPanel
              store={store}
              notify={toast.show}
              preset={bookPreset}
              onPreconsult={(apptId) => {
                setPatientPreset((p) => ({ apptId, n: (p?.n ?? 0) + 1 }));
                goTab('patient');
              }}
            />
          </div>
          {tab === 'lab' && <LabPanel store={store} notify={toast.show} />}
          {tab === 'billing' && <BillingPanel store={store} notify={toast.show} />}
        </div>

        <section className="rounded-2xl border border-secondary-200 dark:border-secondary-700 bg-white/80 dark:bg-secondary-900/60 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-white flex items-center gap-2">
            <ClipboardDocumentListIcon className="w-5 h-5 text-rose-600" /> {t('how.title')}
          </h2>
          <p className="text-sm text-secondary-600 dark:text-secondary-300 mt-1">{t('how.subtitle')}</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {(['video', 'whatsapp', 'payments', 'invoice', 'signature', 'lab', 'records', 'triage', 'security'] as const).map((key) => (
              <div key={key} className="rounded-xl border border-secondary-200 dark:border-secondary-700 p-3">
                <p className="text-sm font-semibold text-secondary-900 dark:text-white">{t(`how.items.${key}.title`)}</p>
                <p className="text-xs text-secondary-600 dark:text-secondary-300 mt-1">
                  <span className="font-medium text-secondary-800 dark:text-secondary-100">{t('how.inDemo')}:</span> {t(`how.items.${key}.demo`)}
                </p>
                <p className="text-xs text-secondary-600 dark:text-secondary-300 mt-1">
                  <span className="font-medium text-secondary-800 dark:text-secondary-100">{t('how.inProject')}:</span> {t(`how.items.${key}.project`)}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-secondary-600 dark:text-secondary-300">{t('how.regulation')}</p>
        </section>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white/70 dark:bg-secondary-900/50 p-4 text-xs text-secondary-600 dark:text-secondary-300">
          <p className="flex gap-2">
            <InformationCircleIcon className="h-4 w-4 shrink-0 text-secondary-500" />
            {t('footer.sampleNote', { ips: IPS.name })}
          </p>
          <Button size="sm" variant="outline" className="shrink-0" asChild>
            <Link href={QUOTE_HREF}>{t('footer.cta')}</Link>
          </Button>
        </div>
      </div>

      <Modal open={auditOpen} onClose={() => setAuditOpen(false)} title={t('audit.fullTitle')} wide>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" />
              <Input
                className="pl-9"
                value={auditQ}
                onChange={(e) => setAuditQ(e.target.value)}
                placeholder={t('audit.search')}
                aria-label={t('audit.search')}
              />
            </div>
            <Button variant="outline" onClick={exportAudit}>
              <ArrowDownTrayIcon className="w-4 h-4 mr-1" /> CSV
            </Button>
          </div>
          <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('audit.note', { count: String(auditRows.length) })}</p>
          <div className="max-h-[50vh] overflow-auto rounded-lg border border-secondary-200 dark:border-secondary-700">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-secondary-50 dark:bg-secondary-800 text-left text-secondary-500 dark:text-secondary-400">
                <tr>
                  <th className="py-2 px-2">{t('audit.cols.time')}</th>
                  <th className="py-2 px-2">{t('audit.cols.actor')}</th>
                  <th className="py-2 px-2">{t('audit.cols.event')}</th>
                </tr>
              </thead>
              <tbody>
                {auditRows.map(({ e, x }) => (
                  <tr key={e.id} className="border-t border-secondary-100 dark:border-secondary-800">
                    <td className="py-1.5 px-2 font-mono text-secondary-500 whitespace-nowrap">{e.at}</td>
                    <td className="py-1.5 px-2 text-secondary-700 dark:text-secondary-200 whitespace-nowrap">{x.actor}</td>
                    <td className="py-1.5 px-2 text-secondary-900 dark:text-white">{x.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title={t('resetConfirm.title')}>
        <div className="space-y-4 text-sm">
          <p className="text-secondary-700 dark:text-secondary-200">{t('resetConfirm.body')}</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" fullWidth onClick={() => setConfirmReset(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" fullWidth onClick={reset}>
              {t('resetConfirm.confirm')}
            </Button>
          </div>
        </div>
      </Modal>
      {toast.node}
    </div>
  );
}
