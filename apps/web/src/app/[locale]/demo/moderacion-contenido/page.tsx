'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  AdjustmentsHorizontalIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  BeakerIcon,
  ChartBarIcon,
  CheckBadgeIcon,
  ClipboardDocumentListIcon,
  CodeBracketIcon,
  CpuChipIcon,
  HandRaisedIcon,
  InformationCircleIcon,
  PresentationChartLineIcon,
  QueueListIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { ModerationProvider, useModeration } from './lib/store';
import { PLATFORMS, TABS, type PlatformView, type TabKey } from './lib/types';
import { focusRing, Toasts } from './components/ui';
import Wellness from './components/Wellness';
import DashboardTab from './components/DashboardTab';
import QueueTab from './components/QueueTab';
import ClassifierTab from './components/ClassifierTab';
import RulesTab from './components/RulesTab';
import AppealsTab from './components/AppealsTab';
import AuditTab from './components/AuditTab';
import ReportTab from './components/ReportTab';
import MetricsTab from './components/MetricsTab';
import ApiTab from './components/ApiTab';

const TAB_ICONS: Record<TabKey, typeof ChartBarIcon> = {
  dashboard: ChartBarIcon,
  queue: QueueListIcon,
  classifier: CpuChipIcon,
  rules: AdjustmentsHorizontalIcon,
  appeals: HandRaisedIcon,
  audit: ClipboardDocumentListIcon,
  report: PresentationChartLineIcon,
  metrics: CheckBadgeIcon,
  api: CodeBracketIcon,
};

function Header({ selector }: { selector?: ReactNode }) {
  const t = useTranslations('demoModeration');
  return (
    <section className="rounded-2xl bg-gradient-to-br from-red-700 to-red-900 p-5 text-white shadow-lg sm:p-7">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-amber-300/15 px-2.5 py-0.5 text-xs font-semibold text-amber-100"
          title={t('shell.sampleHint')}
        >
          <BeakerIcon className="h-3.5 w-3.5" aria-hidden />
          {t('shell.sampleBadge')}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-white/40 px-2.5 py-0.5 text-xs font-semibold text-white/90" title={t('shell.rulesHint')}>
          <InformationCircleIcon className="h-3.5 w-3.5" aria-hidden />
          {t('shell.rulesBadge')}
        </span>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{t('shell.title')}</h1>
          <p className="max-w-3xl text-base text-red-50/90 sm:text-lg">{t('shell.subtitle')}</p>
        </div>
        {selector}
      </div>
    </section>
  );
}

function PlatformSelector() {
  const t = useTranslations('demoModeration');
  const { s, setPlatform, views } = useModeration();
  const pendingIn = (p: PlatformView) => views.filter((v) => v.status === 'pending' && (p === 'all' || v.platforms.includes(p))).length;
  return (
    <label className="block shrink-0">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-red-100/90">{t('shell.platformLabel')}</span>
      <select
        value={s.platform}
        onChange={(e) => setPlatform(e.target.value as PlatformView)}
        className="w-full rounded-lg border border-white/30 bg-white/95 py-2 pl-3 pr-9 text-sm text-secondary-900 focus:outline-none focus:ring-2 focus:ring-white sm:w-80"
      >
        {(['all', ...PLATFORMS] as PlatformView[]).map((p) => (
          <option key={p} value={p}>
            {t('shell.platformOption', { name: t(`platforms.${p}`), n: pendingIn(p) })}
          </option>
        ))}
      </select>
    </label>
  );
}

function HowItWorks() {
  const t = useTranslations('demoModeration');
  const { reset, toast } = useModeration();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start">
      <details className="group min-w-0 flex-1 rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm dark:border-secondary-800 dark:bg-secondary-900">
        <summary className={`flex cursor-pointer list-none items-center gap-2 rounded font-medium text-secondary-800 dark:text-secondary-200 ${focusRing}`}>
          <InformationCircleIcon className="h-4 w-4 shrink-0 text-red-700 dark:text-red-400" aria-hidden />
          {t('how.title')}
          <span className="ml-auto text-xs text-secondary-500 group-open:hidden">{t('common.show')}</span>
          <span className="ml-auto hidden text-xs text-secondary-500 group-open:inline">{t('common.hide')}</span>
        </summary>
        <div className="mt-3 grid gap-4 text-secondary-700 dark:text-secondary-300 md:grid-cols-2">
          <div>
            <p className="mb-1 font-semibold text-secondary-900 dark:text-white">{t('how.realTitle')}</p>
            <ul className="list-disc space-y-1 pl-5">
              {(t.raw('how.real') as string[]).map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-1 font-semibold text-secondary-900 dark:text-white">{t('how.simTitle')}</p>
            <ul className="list-disc space-y-1 pl-5">
              {(t.raw('how.sim') as string[]).map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-2">
            <p className="mb-1 font-semibold text-secondary-900 dark:text-white">{t('how.tourTitle')}</p>
            <ol className="list-decimal space-y-1 pl-5">
              {(t.raw('how.tour') as string[]).map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
            <p className="mt-2">{t('how.project')}</p>
          </div>
        </div>
      </details>
      {!confirm ? (
        <Button size="sm" variant="ghost" onClick={() => setConfirm(true)} className="gap-1 self-start">
          <ArrowPathIcon className="h-4 w-4" aria-hidden />
          {t('shell.reset')}
        </Button>
      ) : (
        <div className="flex flex-wrap items-center gap-2 self-start rounded-lg border border-secondary-200 bg-white px-3 py-1.5 dark:border-secondary-800 dark:bg-secondary-900" role="alert">
          <span className="text-xs text-secondary-700 dark:text-secondary-300">{t('shell.resetConfirm')}</span>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              reset();
              setConfirm(false);
              toast(t('shell.resetDone'), 'info');
            }}
          >
            {t('shell.resetYes')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>
            {t('common.cancel')}
          </Button>
        </div>
      )}
    </div>
  );
}

function Tabs() {
  const t = useTranslations('demoModeration');
  const { tab, go, queue, s } = useModeration();
  const refs = useRef<Partial<Record<TabKey, HTMLButtonElement | null>>>({});
  useEffect(() => {
    const el = refs.current[tab];
    const bar = el?.closest('[data-tabbar]');
    if (el && bar instanceof HTMLElement) {
      const left = el.offsetLeft - bar.clientWidth / 2 + el.clientWidth / 2;
      bar.scrollTo({ left: Math.max(0, left) });
    }
  }, [tab]);
  const openAppeals = s.appeals.filter((a) => a.status === 'open').length;
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
    go(next);
    refs.current[next]?.focus();
  };
  return (
    <div data-tabbar className="relative mb-4 overflow-x-auto border-b border-secondary-200 dark:border-secondary-800">
      <div role="tablist" aria-label={t('tabs.label')} className="flex min-w-max gap-1">
        {TABS.map((k, i) => {
          const Icon = TAB_ICONS[k];
          const active = tab === k;
          const count = k === 'queue' ? queue.length : k === 'appeals' ? openAppeals : null;
          return (
            <button
              key={k}
              ref={(el) => {
                refs.current[k] = el;
              }}
              type="button"
              role="tab"
              id={`mod-tab-${k}`}
              aria-selected={active}
              aria-controls="mod-panel"
              tabIndex={active ? 0 : -1}
              onClick={() => go(k)}
              onKeyDown={(e) => onKey(e, i)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${focusRing} ${
                active
                  ? 'border-red-600 bg-red-50/60 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                  : 'border-transparent text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {t(`tabs.${k}`)}
              {count !== null && count > 0 && (
                <span className="rounded-full bg-secondary-200 px-1.5 text-[11px] font-semibold text-secondary-700 dark:bg-secondary-700 dark:text-secondary-200">{count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Shell() {
  const t = useTranslations('demoModeration');
  const { tab } = useModeration();
  return (
    <>
      <div className="mb-5">
        <Header selector={<PlatformSelector />} />
      </div>
      <HowItWorks />
      <Wellness />
      <Tabs />
      <p className="mb-5 flex items-start gap-1.5 text-xs text-secondary-600 dark:text-secondary-400">
        <ShieldCheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        {t('compliance')}
      </p>
      <div id="mod-panel" role="tabpanel" aria-labelledby={`mod-tab-${tab}`}>
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'queue' && <QueueTab />}
        {tab === 'classifier' && <ClassifierTab />}
        {tab === 'rules' && <RulesTab />}
        {tab === 'appeals' && <AppealsTab />}
        {tab === 'audit' && <AuditTab />}
        {tab === 'report' && <ReportTab />}
        {tab === 'metrics' && <MetricsTab />}
        {tab === 'api' && <ApiTab />}
      </div>
      <Toasts />
    </>
  );
}

export default function ModeracionContenidoPage() {
  const t = useTranslations('demoModeration');
  return (
    <div className="min-h-screen bg-secondary-50 text-secondary-900 dark:bg-secondary-950 dark:text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Link
          href="/demo"
          className={`mb-3 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-secondary-600 hover:text-red-700 dark:text-secondary-300 dark:hover:text-red-300 ${focusRing}`}
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden />
          {t('shell.back')}
        </Link>
        <ModerationProvider
          fallback={
            <>
              <div className="mb-5">
                <Header />
              </div>
              <div role="status" className="rounded-2xl border border-secondary-200 bg-white p-10 text-center text-sm text-secondary-500 dark:border-secondary-800 dark:bg-secondary-900 dark:text-secondary-400">
                {t('shell.loading')}
              </div>
            </>
          }
        >
          <Shell />
        </ModerationProvider>
      </div>
    </div>
  );
}
