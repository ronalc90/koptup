'use client';

/**
 * Demo de telemedicina para IPS: vista del paciente (pre-consulta y prueba de cámara),
 * orientación de síntomas por reglas, agenda, consultorio virtual (videoconsulta
 * simulada, ficha, receta y órdenes, notas SOAP, cierre con resumen), laboratorio y
 * pagos y facturación con factura y RIPS simulados. Todo con datos de ejemplo y sin backend.
 */
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  BanknotesIcon,
  BeakerIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CreditCardIcon,
  InformationCircleIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
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
import { DEMO_DATE, IPS } from './components/mockData';
import { Modal, useAuditText, useDateNames, useLoc, useToast } from './components/ui';
import type { MainTab, SpecKey } from './components/types';

const REQUEST_HREF = '/contact?service=telemedicina';

const TABS: { k: MainTab; icon: typeof VideoCameraIcon }[] = [
  { k: 'console', icon: VideoCameraIcon },
  { k: 'patient', icon: UserIcon },
  { k: 'triage', icon: ListBulletIcon },
  { k: 'scheduling', icon: CalendarDaysIcon },
  { k: 'lab', icon: BeakerIcon },
  { k: 'billing', icon: CreditCardIcon },
];

const STEPS: { k: string; tab: MainTab }[] = [
  { k: 's1', tab: 'patient' },
  { k: 's2', tab: 'triage' },
  { k: 's3', tab: 'console' },
  { k: 's4', tab: 'console' },
  { k: 's5', tab: 'billing' },
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
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditQ, setAuditQ] = useState('');

  const k = computeKpis(store.state.patients, store.state.attentions);
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

  function goTab(next: MainTab) {
    setTab(next);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function exportAudit() {
    const rows = auditRows.map(({ e, x }) => [DEMO_DATE, e.at, x.actor, x.text]);
    downloadText(
      `${t('audit.fileName')}-${DEMO_DATE}.csv`,
      toCsv([[t('audit.cols.date'), t('audit.cols.time'), t('audit.cols.actor'), t('audit.cols.event')], ...rows]),
      'text/csv;charset=utf-8',
    );
    toast.show(t('toasts.csv', { count: String(rows.length) }));
  }

  function reset() {
    store.reset();
    setBookPreset(null);
    toast.show(t('toasts.reset'));
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50 dark:from-secondary-950 dark:to-secondary-900 overflow-x-hidden">
      <header className="bg-gradient-to-br from-red-600 to-rose-800 text-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-4 pb-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link href="/demo" className="inline-flex items-center gap-2 text-rose-100 hover:text-white text-sm font-medium">
              <ArrowLeftIcon className="w-4 h-4" /> {t('header.back')}
            </Link>
            <div className="mt-2 flex items-center gap-3">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-white/15 flex items-center justify-center">
                <VideoCameraIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">{t('header.title')}</h1>
                <p className="text-xs sm:text-sm text-rose-100/90">{t('header.subtitle', { ips: IPS.name })}</p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2.5 py-0.5 text-xs">
                <BeakerIcon className="w-3.5 h-3.5" /> {t('header.sampleBadge')}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2.5 py-0.5 text-xs">
                <InformationCircleIcon className="w-3.5 h-3.5" /> {t('header.simBadge')}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2.5 py-0.5 text-xs">
                <CalendarDaysIcon className="w-3.5 h-3.5" /> {t('header.dayBadge', { date: fmtDate(DEMO_DATE, loc, names, { weekday: true, year: true }) })}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button size="sm" variant="outline" className="bg-white text-rose-800 border-white hover:bg-rose-50" asChild>
              <Link href={REQUEST_HREF}>{t('header.request')}</Link>
            </Button>
            <Button size="sm" variant="ghost" className="text-rose-50 hover:text-white hover:bg-white/10" onClick={reset} title={t('header.resetHint')}>
              <ArrowPathIcon className="w-4 h-4 mr-1" /> {t('header.reset')}
            </Button>
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

        <details className="group rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white/70 dark:bg-secondary-900/60 px-4 py-3">
          <summary className="cursor-pointer select-none text-sm font-semibold text-secondary-900 dark:text-white">{t('route.title')}</summary>
          <ol className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-2">
            {STEPS.map((s, i) => (
              <li key={s.k}>
                <button
                  type="button"
                  onClick={() => goTab(s.tab)}
                  className="h-full w-full text-left rounded-lg border border-secondary-200 dark:border-secondary-700 p-2.5 hover:border-rose-400 dark:hover:border-rose-500"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                    {t('route.step', { n: String(i + 1) })} · {t(`tabs.${s.tab}`)}
                  </span>
                  <span className="block text-xs text-secondary-700 dark:text-secondary-200 mt-0.5">{t(`route.${s.k}`)}</span>
                </button>
              </li>
            ))}
          </ol>
        </details>

        <ConsoleView store={store} visible={tab === 'console'} notify={toast.show} goTab={goTab} onOpenAudit={() => setAuditOpen(true)} />
        <div className={tab === 'patient' ? '' : 'hidden'}>
          <PreconsultForm store={store} visible={tab === 'patient'} notify={toast.show} goConsole={() => goTab('console')} />
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
          <SchedulingPanel store={store} notify={toast.show} preset={bookPreset} />
        </div>
        {tab === 'lab' && <LabPanel store={store} notify={toast.show} />}
        {tab === 'billing' && <BillingPanel store={store} notify={toast.show} />}

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
            <Link href={REQUEST_HREF}>{t('footer.cta')}</Link>
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
      {toast.node}
    </main>
  );
}
