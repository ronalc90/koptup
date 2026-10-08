'use client';

import { useTranslations } from 'next-intl';
import { HrProvider, useHr } from './lib/store';
import { Banner, HeaderActions, TabBar } from './components/Header';
import HomeTab from './components/HomeTab';
import PeopleTab from './components/PeopleTab';
import AbsencesTab from './components/AbsencesTab';
import TalentTab from './components/TalentTab';
import PerformanceTab from './components/PerformanceTab';
import PayrollTab from './components/PayrollTab';
import LearningTab from './components/LearningTab';
import ProfilePanel from './components/ProfilePanel';
import EmployeeApp from './components/EmployeeApp';

export default function HrmsDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <HrProvider fallback={<Loading />}>
          <HrmsDemo />
        </HrProvider>
      </div>
    </div>
  );
}

function Loading() {
  const t = useTranslations('demoHrms.common');
  return (
    <>
      <Banner />
      <TabBar active={null} />
      <div className="h-64 rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white/60 dark:bg-secondary-900/60 animate-pulse flex items-center justify-center text-sm text-secondary-500" aria-busy="true">
        {t('loading')}
      </div>
    </>
  );
}

function HrmsDemo() {
  const t = useTranslations('demoHrms');
  const { tab, setTab, state } = useHr();
  const pending = state.leaves.filter((l) => l.status === 'pending').length;
  return (
    <>
      <Banner actions={<HeaderActions />} />
      <TabBar active={tab} onSelect={setTab} counts={{ absences: pending }} />
      <section id="hrms-panel" role="tabpanel" aria-label={t(`tabs.${tab}`)}>
        {tab === 'home' && <HomeTab />}
        {tab === 'people' && <PeopleTab />}
        {tab === 'absences' && <AbsencesTab />}
        {tab === 'talent' && <TalentTab />}
        {tab === 'performance' && <PerformanceTab />}
        {tab === 'payroll' && <PayrollTab />}
        {tab === 'learning' && <LearningTab />}
      </section>
      <footer className="pt-2 pb-6 text-xs text-secondary-500 dark:text-secondary-400 space-y-1 max-w-4xl">
        <p>{t('footer.sample')}</p>
        <p>{t('footer.integrations')}</p>
        <p>{t('footer.storage')}</p>
      </footer>
      <ProfilePanel />
      <EmployeeApp />
    </>
  );
}
