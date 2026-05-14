'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon, ServerStackIcon, BoltIcon } from '@heroicons/react/24/outline';
import useModalClose from '@/hooks/useModalClose';
import {
  CmsDrawer,
  AiPanel,
  WorkflowPanel,
  MultisitePanel,
  I18nPanel,
  SeoPanel,
  AbPanel,
  EdgePanel,
  HeadlessPanel,
  IsrPanel,
  WorkflowStep,
  SiteKey,
} from './CmsProShared';

export function AiDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('demoCmsPro.ai');
  return (
    <CmsDrawer open={open} onClose={onClose} title={t('title')} subtitle={t('desc')}>
      <AiPanel />
    </CmsDrawer>
  );
}

export function WorkflowDrawer({
  open,
  onClose,
  current,
  onChange,
  site,
}: {
  open: boolean;
  onClose: () => void;
  current: WorkflowStep;
  onChange: (s: WorkflowStep) => void;
  site: SiteKey;
}) {
  const t = useTranslations('demoCmsPro.workflow');
  return (
    <CmsDrawer open={open} onClose={onClose} title={t('title')} subtitle={t('desc')}>
      <WorkflowPanel current={current} onChange={onChange} />
      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
        <MultisitePanel site={site} />
      </div>
    </CmsDrawer>
  );
}

export function I18nDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('demoCmsPro.i18n');
  return (
    <CmsDrawer
      open={open}
      onClose={onClose}
      title={t('title')}
      subtitle={t('desc')}
      widthClass="w-full sm:w-[32rem] md:w-[40rem]"
    >
      <I18nPanel />
    </CmsDrawer>
  );
}

export function SeoDrawer({
  open,
  onClose,
  experimentMode,
}: {
  open: boolean;
  onClose: () => void;
  experimentMode: boolean;
}) {
  const t = useTranslations('demoCmsPro.seo');
  const tAb = useTranslations('demoCmsPro.ab');
  return (
    <CmsDrawer
      open={open}
      onClose={onClose}
      title={t('title')}
      subtitle={t('desc')}
      widthClass="w-full sm:w-[32rem] md:w-[40rem]"
    >
      <SeoPanel />
      {experimentMode && (
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-300 dark:border-amber-800">
            {tAb('title')}
          </div>
          <AbPanel />
        </div>
      )}
    </CmsDrawer>
  );
}

export function PersonalizationDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('demoCmsPro.edge');
  return (
    <CmsDrawer
      open={open}
      onClose={onClose}
      title={t('title')}
      subtitle={t('desc')}
      widthClass="w-full sm:w-[32rem] md:w-[44rem]"
    >
      <EdgePanel />
    </CmsDrawer>
  );
}

type TechTab = 'headless' | 'isr';

export function TechConfigModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('demoCmsPro.techConfig');
  const tDrawer = useTranslations('demoCmsPro.drawer');
  const [tab, setTab] = useState<TechTab>('headless');
  useModalClose(open, onClose);
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} aria-hidden="true" />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl max-h-[90vh] p-4"
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
      >
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
          <header className="flex items-start justify-between gap-3 p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-slate-950 dark:to-slate-900">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('title')}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{t('subtitle')}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800 transition-colors"
              aria-label={tDrawer('close')}
            >
              <XMarkIcon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </button>
          </header>
          <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-2 bg-slate-50 dark:bg-slate-950 flex flex-wrap gap-1">
            <button
              onClick={() => setTab('headless')}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'headless'
                  ? 'bg-pink-600 text-white shadow'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
              aria-pressed={tab === 'headless'}
            >
              <ServerStackIcon className="w-4 h-4" />
              {t('tabs.headless')}
            </button>
            <button
              onClick={() => setTab('isr')}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'isr'
                  ? 'bg-pink-600 text-white shadow'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
              aria-pressed={tab === 'isr'}
            >
              <BoltIcon className="w-4 h-4" />
              {t('tabs.isr')}
            </button>
          </div>
          <div className="p-5 overflow-y-auto">
            {tab === 'headless' && <HeadlessPanel />}
            {tab === 'isr' && <IsrPanel />}
          </div>
        </div>
      </div>
    </>
  );
}
