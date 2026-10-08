'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowPathIcon,
  CodeBracketIcon,
  CubeIcon,
  DocumentTextIcon,
  HomeIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { COMPANY } from '../lib/seed';
import { useCms } from '../lib/store';
import type { ViewId } from '../lib/types';
import ApiView from './ApiView';
import Dashboard from './Dashboard';
import EntriesView from './EntriesView';
import EntryEditor from './EntryEditor';
import MediaView from './MediaView';
import ModelsView from './ModelsView';
import PublishingView from './PublishingView';
import RolesView from './RolesView';
import { btn, Modal, Note, Toasts } from './ui';

const NAV: { id: Exclude<ViewId, 'editor'>; icon: typeof HomeIcon }[] = [
  { id: 'home', icon: HomeIcon },
  { id: 'entries', icon: DocumentTextIcon },
  { id: 'models', icon: CubeIcon },
  { id: 'media', icon: PhotoIcon },
  { id: 'publishing', icon: PaperAirplaneIcon },
  { id: 'api', icon: CodeBracketIcon },
  { id: 'roles', icon: ShieldCheckIcon },
];

function SampleBar() {
  const t = useTranslations('demoCms.bar');
  const tRole = useTranslations('demoCms.roles');
  const { state, me, act, reset, toast, storageOk } = useCms();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="px-4 sm:px-6 py-3 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1 basis-full lg:basis-auto">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{t('title')}</h1>
            <span title={t('sampleHint')} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-900">
              {t('sample')}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{t('subtitle')}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('company', { name: COMPANY.name })}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="cms-role" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
              {t('viewAs')}
            </label>
            <select
              id="cms-role"
              value={me.id}
              onChange={(e) => {
                act({ type: 'user.switch', userId: e.target.value });
                const p = state.people.find((x) => x.id === e.target.value);
                if (p) toast(t('switched', { name: p.name, role: tRole(`${p.role}.name`) }), 'info');
              }}
              className="pl-2 pr-8 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white max-w-[16rem]"
            >
              {state.people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {tRole(`${p.role}.name`)}
                </option>
              ))}
            </select>
          </div>
          <button type="button" onClick={() => setConfirm(true)} className={btn.outline}>
            <ArrowPathIcon className="w-4 h-4" />
            {t('reset')}
          </button>
        </div>
      </div>
      {!storageOk && (
        <div className="mt-2">
          <Note tone="warn">{t('storageOff')}</Note>
        </div>
      )}
      {confirm && (
        <Modal
          title={t('resetTitle')}
          onClose={() => setConfirm(false)}
          size="sm"
          labelId="cms-reset-title"
          footer={
            <>
              <button type="button" className={btn.outline} onClick={() => setConfirm(false)}>
                {t('cancel')}
              </button>
              <button
                type="button"
                className={btn.danger}
                onClick={() => {
                  reset();
                  setConfirm(false);
                  toast(t('resetDone'));
                }}
              >
                {t('resetConfirm')}
              </button>
            </>
          }
        >
          <p className="text-sm text-slate-700 dark:text-slate-300">{t('resetBody')}</p>
        </Modal>
      )}
    </div>
  );
}

function useBadges() {
  const { state, me } = useCms();
  const pending = state.entries.filter((e) => e.status === 'review' || e.status === 'approved').length;
  return {
    entries: state.entries.length,
    publishing: me.role === 'writer' ? 0 : pending,
  } as Partial<Record<ViewId, number>>;
}

function Nav() {
  const t = useTranslations('demoCms.nav');
  const { view, go } = useCms();
  const badges = useBadges();
  const active = (id: ViewId) => view === id || (id === 'entries' && view === 'editor');
  return (
    <>
      <aside className="hidden md:block md:w-56 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <nav aria-label={t('label')} className="p-3 space-y-1 sticky top-20">
          {NAV.map(({ id, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => go(id)}
              aria-current={active(id) ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active(id) ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="flex-1 text-left leading-snug">{t(id)}</span>
              {!!badges[id] && <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{badges[id]}</span>}
            </button>
          ))}
        </nav>
      </aside>
      <nav aria-label={t('label')} className="md:hidden flex gap-1 overflow-x-auto px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {NAV.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => go(id)}
            aria-current={active(id) ? 'page' : undefined}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              active(id) ? 'bg-pink-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {t(id)}
          </button>
        ))}
      </nav>
    </>
  );
}

export default function Shell() {
  const { view, editingId } = useCms();
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <SampleBar />
      <div className="md:flex">
        <Nav />
        <main className="flex-1 min-w-0 p-3 sm:p-6">
          {view === 'home' && <Dashboard />}
          {view === 'entries' && <EntriesView />}
          {view === 'editor' && editingId && <EntryEditor key={editingId} id={editingId} />}
          {view === 'models' && <ModelsView />}
          {view === 'media' && <MediaView />}
          {view === 'publishing' && <PublishingView />}
          {view === 'api' && <ApiView />}
          {view === 'roles' && <RolesView />}
        </main>
      </div>
      <Toasts />
    </div>
  );
}
