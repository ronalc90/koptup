'use client';

import { useTranslations } from 'next-intl';
import ClientPortal from './components/ClientPortal';
import ProjectWorkspace from './components/ProjectWorkspace';
import { NotificationsView, PortfolioView, PreferencesView } from './components/Sections';
import { MobileNav, SampleBar, Sidebar } from './components/Shell';
import TaskDrawer from './components/TaskDrawer';
import { DemoProvider, useDemo } from './lib/store';

export default function GestionProyectosDemo() {
  return (
    <div id="gp-top" className="min-h-screen flex flex-col bg-gradient-to-br from-teal-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <DemoProvider fallback={<Loading />}>
        <Demo />
      </DemoProvider>
    </div>
  );
}

function Loading() {
  const t = useTranslations('demoProjectsPro');
  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 sm:px-6 py-3 bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{t('bar.title')}</h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-900">{t('bar.sample')}</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{t('bar.subtitle')}</p>
      </div>
      <div className="flex-1 m-4 sm:m-6 min-h-[60vh] rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 animate-pulse flex items-center justify-center text-sm text-slate-500" aria-busy="true">
        {t('meta.loading')}
      </div>
    </div>
  );
}

function Demo() {
  const t = useTranslations('demoProjectsPro.footer');
  const { section, clientMode } = useDemo();
  return (
    <>
      <SampleBar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 min-w-0 flex flex-col">
          <MobileNav />
          <div className="flex-1 min-w-0">
            {section === 'project' && (clientMode ? <ClientPortal /> : <ProjectWorkspace />)}
            {section === 'portfolio' && <PortfolioView />}
            {section === 'notifications' && <NotificationsView />}
            {section === 'preferences' && <PreferencesView />}
          </div>
          <footer className="px-4 sm:px-6 py-5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p>{t('sample')}</p>
            <p>{t('storage')}</p>
            <p>{t('integrations')}</p>
            <p>{t('ai')}</p>
          </footer>
        </main>
      </div>
      <TaskDrawer />
    </>
  );
}
