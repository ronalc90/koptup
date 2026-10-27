'use client';

import { useTranslations } from 'next-intl';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import ClientPortal from './components/ClientPortal';
import Intro from './components/Intro';
import ProjectWorkspace from './components/ProjectWorkspace';
import { NotificationsView, PortfolioView, PreferencesView } from './components/Sections';
import { MobileNav, SampleBar, Sidebar } from './components/Shell';
import TaskDrawer from './components/TaskDrawer';
import { DemoProvider, useDemo } from './lib/store';

export default function GestionProyectosDemo() {
  return (
    <div id="gp-top" className="min-h-screen flex flex-col bg-gradient-to-br from-teal-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Intro />
      <DemoProvider fallback={<Loading />}>
        <Demo />
      </DemoProvider>
    </div>
  );
}

/** Mientras se arman los datos de ejemplo con la fecha de hoy (unos instantes después de cargar la página). */
function Loading() {
  const t = useTranslations('demoProjectsPro.meta');
  return (
    <div className="flex-1 m-4 sm:m-6 min-h-[60vh] rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 flex items-center justify-center gap-3 text-sm text-slate-600 dark:text-slate-300" role="status" aria-live="polite" aria-busy="true">
      <ArrowPathIcon className="w-5 h-5 animate-spin text-teal-600" aria-hidden="true" />
      {t('loading')}
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
