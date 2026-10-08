'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowPathIcon, Bars3Icon, BellAlertIcon, ChartBarSquareIcon, ClockIcon, CursorArrowRaysIcon, ArrowsRightLeftIcon,
  EyeIcon, ScaleIcon, ShieldCheckIcon, XMarkIcon, ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { COMPANY } from './lib/data';
import { nitWithDv } from './lib/nit';
import { DemoProvider, useDemo } from './lib/store';
import { TABS, type SourceId, type Tab } from './lib/types';
import Sidebar from './components/Sidebar';
import Tour from './components/Tour';
import Overview from './components/Overview';
import Builder from './components/Builder';
import Changes from './components/Changes';
import Alerts from './components/Alerts';
import Delivery from './components/Delivery';
import History from './components/History';
import Compliance from './components/Compliance';
import ReviewPanel from './components/ReviewPanel';
import { RunNotice } from './components/RunNotice';

const TAB_ICONS: Record<Tab, typeof ChartBarSquareIcon> = {
  overview: ChartBarSquareIcon,
  builder: CursorArrowRaysIcon,
  changes: EyeIcon,
  alerts: BellAlertIcon,
  delivery: ArrowDownTrayIcon,
  history: ClockIcon,
  compliance: ScaleIcon,
};

export default function ScrapingDemoPage() {
  return (
    <DemoProvider>
      <Shell />
    </DemoProvider>
  );
}

function Shell() {
  const t = useTranslations('demoScraping');
  const { s, ready, running, setTab, runNow } = useDemo();
  const [menuOpen, setMenuOpen] = useState(false);
  const custom = s.customSources.find((c) => c.id === s.activeId) ?? null;
  const sourceId = custom ? null : (s.activeId as SourceId);
  const paused = !!sourceId && s.paused.includes(sourceId);
  const isRunning = !!running;

  return (
    <div className="min-h-screen bg-secondary-950 text-secondary-100">
      <header className="relative z-30 border-b border-secondary-800 bg-secondary-950/95 backdrop-blur lg:sticky lg:top-20">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
          <button
            type="button"
            className="rounded-md p-2 hover:bg-secondary-800 lg:hidden"
            onClick={() => setMenuOpen((x) => !x)}
            aria-label={menuOpen ? t('meta.closeMenu') : t('meta.menu')}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="shrink-0 rounded-lg bg-gradient-to-br from-zinc-600 to-zinc-800 p-2">
              <ArrowsRightLeftIcon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold leading-tight text-white sm:text-base">{t('meta.title')}</h1>
              <p className="truncate text-xs text-secondary-400">{t('meta.company', { company: COMPANY.name, nit: nitWithDv(COMPANY.nit) })}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-200" title={t('meta.sampleHint')}>
              {t('meta.sampleBadge')}
            </span>
            <button
              type="button"
              onClick={() => setTab('compliance')}
              disabled={!sourceId}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-200 hover:bg-emerald-400/20 disabled:opacity-50"
              title={t('meta.responsibleHint')}
            >
              <ShieldCheckIcon className="h-3.5 w-3.5" />
              {t('meta.responsibleSeal')}
            </button>
            {running && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/40 bg-sky-400/10 px-2 py-0.5 text-[11px] font-medium text-sky-200" role="status">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-300" />
                {t('meta.running', { source: t(`sources.${running.sourceId}.short`) })}
              </span>
            )}
            <button
              type="button"
              onClick={() => sourceId && runNow(sourceId)}
              disabled={!ready || !sourceId || isRunning || paused}
              title={paused ? t('run.pausedHint') : !sourceId ? t('run.reviewHint') : t('run.hint')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? t('actions.running') : t('actions.runNow')}
            </button>
          </div>
        </div>
        <nav className="overflow-x-auto px-2 pb-2" aria-label={t('meta.tabsLabel')}>
          <div className="flex min-w-max gap-1" role="tablist">
            {TABS.map((key) => {
              const Icon = TAB_ICONS[key];
              const active = s.tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  disabled={!sourceId}
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    active && sourceId ? 'border-zinc-400/40 bg-zinc-100/10 text-zinc-100' : 'border-transparent text-secondary-400 hover:bg-secondary-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t(`tabs.${key}`)}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <div className="relative flex">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="min-w-0 flex-1 space-y-5 p-4 lg:p-6" id="demo-scraping-main">
          <Tour />
          {!ready ? (
            <div className="rounded-xl border border-secondary-800 bg-secondary-900 p-8 text-center text-sm text-secondary-400" role="status">
              {t('meta.loading')}
            </div>
          ) : custom ? (
            <ReviewPanel source={custom} />
          ) : sourceId ? (
            <>
              <RunNotice sourceId={sourceId} />
              {s.tab === 'overview' && <Overview sourceId={sourceId} />}
              {s.tab === 'builder' && <Builder sourceId={sourceId} />}
              {s.tab === 'changes' && <Changes sourceId={sourceId} />}
              {s.tab === 'alerts' && <Alerts sourceId={sourceId} />}
              {s.tab === 'delivery' && <Delivery sourceId={sourceId} />}
              {s.tab === 'history' && <History sourceId={sourceId} />}
              {s.tab === 'compliance' && <Compliance sourceId={sourceId} />}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
