'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ArrowPathIcon,
  BellIcon,
  ChartPieIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  PlusIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { projectStats } from '../lib/engine';
import { formatNit } from '../lib/seed';
import { useDemo } from '../lib/store';
import { SECTORS, type SectorId } from '../lib/types';
import NewProjectModal from './NewProjectModal';
import { HealthDot, Modal, btn } from './ui';

/** Franja superior: rótulo de datos de ejemplo, empresa ficticia, sector y restablecer. */
export function SampleBar() {
  const t = useTranslations('demoProjectsPro.bar');
  const tSector = useTranslations('demoProjectsPro.sector');
  const { state, ws, act, reset } = useDemo();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 sm:px-6 py-3 bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-xs">
      <div className="min-w-0 basis-full lg:basis-auto lg:flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{t('title')}</h1>
          <span title={t('sampleHint')} className="inline-flex items-center px-2.5 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-900">
            {t('sample')}
          </span>
        </div>
        <p className="text-slate-600 dark:text-slate-300 mt-0.5">{t('subtitle')}</p>
        <p className="text-slate-500 dark:text-slate-400 mt-0.5">{t('company', { name: ws.company.name, nit: formatNit(ws.company.nit), city: ws.company.city })}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="gp-sector" className="font-semibold text-slate-600 dark:text-slate-300">
          {t('sector')}
        </label>
        <select
          id="gp-sector"
          value={state.sector}
          onChange={(e) => act({ type: 'sector', sector: e.target.value as SectorId })}
          className="pl-2 pr-8 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          {SECTORS.map((s) => (
            <option key={s} value={s}>
              {tSector(s)}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setConfirm(true)} className={btn.small}>
          <ArrowPathIcon className="w-3.5 h-3.5" />
          {t('reset')}
        </button>
      </div>
      {confirm && (
        <Modal
          title={t('resetTitle')}
          onClose={() => setConfirm(false)}
          size="sm"
          labelId="gp-reset-title"
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

function useSortedProjects() {
  const { ws, today } = useDemo();
  return useMemo(
    () =>
      [...ws.projects]
        .sort((a, b) => Number(b.favorite) - Number(a.favorite))
        .map((p) => ({ project: p, stats: projectStats(ws, p, today) })),
    [ws, today],
  );
}

/** Barra lateral (escritorio). */
export function Sidebar() {
  const t = useTranslations('demoProjectsPro.nav');
  const { ws, section, setSection, act, clientMode } = useDemo();
  const [newOpen, setNewOpen] = useState(false);
  const projects = useSortedProjects();
  const unread = ws.notifications.filter((n) => !n.read).length;
  const item = (active: boolean) =>
    `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-200' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`;
  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div className="p-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center shrink-0">
            <RectangleStackIcon className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 dark:text-white leading-tight">{t('appName')}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{ws.company.name}</p>
          </div>
        </div>
        <button type="button" onClick={() => setNewOpen(true)} className={`${btn.primary} w-full py-2.5`}>
          <PlusIcon className="w-5 h-5" />
          {t('newProject')}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label={t('label')}>
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 px-3">{t('projects')}</p>
        {projects.map(({ project, stats }) => {
          const active = section === 'project' && ws.currentProjectId === project.id;
          return (
            <button
              key={project.id}
              type="button"
              onClick={() => {
                act({ type: 'project.select', id: project.id });
                setSection('project');
              }}
              aria-current={active ? 'page' : undefined}
              className={`${item(active)} items-start`}
            >
              <span className={`w-3 h-3 mt-1 rounded-full shrink-0 ${project.color}`} aria-hidden="true" />
              <span className="flex-1 min-w-0 text-left">
                <span className="block truncate">{project.name}</span>
                <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                  <HealthDot level={stats.health.level} />
                  <span className="truncate">
                    {t('progress', { pct: stats.progress })}
                    {active && clientMode && <span className="text-violet-600 dark:text-violet-300"> · {t('clientView')}</span>}
                  </span>
                </span>
              </span>
              {project.favorite && <StarSolid className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" aria-label={t('favorite')} />}
            </button>
          );
        })}

        <div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-3 space-y-1">
          <button type="button" onClick={() => setSection('portfolio')} className={item(section === 'portfolio')} aria-current={section === 'portfolio' ? 'page' : undefined}>
            <ChartPieIcon className="w-5 h-5" />
            {t('portfolio')}
          </button>
          <button type="button" onClick={() => setSection('notifications')} className={item(section === 'notifications')} aria-current={section === 'notifications' ? 'page' : undefined}>
            <BellIcon className="w-5 h-5" />
            {t('notifications')}
            {unread > 0 && <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unread}</span>}
          </button>
          <button type="button" onClick={() => setSection('preferences')} className={item(section === 'preferences')} aria-current={section === 'preferences' ? 'page' : undefined}>
            <Cog6ToothIcon className="w-5 h-5" />
            {t('preferences')}
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-teal-300 dark:border-teal-800 p-3 text-xs text-slate-600 dark:text-slate-300">
          <p className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <ChatBubbleLeftRightIcon className="w-4 h-4 text-teal-600" />
            {t('ragTitle')}
          </p>
          <p className="mt-1">{t('ragBody')}</p>
          <Link href="/demo/chatbot" className="inline-block mt-2 font-semibold text-teal-700 dark:text-teal-300 hover:underline">
            {t('ragLink')} →
          </Link>
        </div>
      </nav>
      {newOpen && <NewProjectModal onClose={() => setNewOpen(false)} />}
    </aside>
  );
}

/** Navegación compacta para celular (la barra lateral se oculta). */
export function MobileNav() {
  const t = useTranslations('demoProjectsPro.nav');
  const { ws, section, setSection, act } = useDemo();
  const [newOpen, setNewOpen] = useState(false);
  const projects = useSortedProjects();
  const unread = ws.notifications.filter((n) => !n.read).length;
  const pill = (active: boolean) =>
    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border ${
      active ? 'bg-teal-600 text-white border-teal-600' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
    }`;
  return (
    <div className="md:hidden px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-2">
      <div className="flex items-center gap-2">
        <label htmlFor="gp-project-mobile" className="sr-only">
          {t('projects')}
        </label>
        <select
          id="gp-project-mobile"
          value={section === 'project' ? ws.currentProjectId : ''}
          onChange={(e) => {
            act({ type: 'project.select', id: e.target.value });
            setSection('project');
          }}
          className="flex-1 min-w-0 pl-3 pr-9 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          {section !== 'project' && <option value="">{t('chooseProject')}</option>}
          {projects.map(({ project, stats }) => (
            <option key={project.id} value={project.id}>
              {project.favorite ? '★ ' : ''}
              {project.name} · {stats.progress}%
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setNewOpen(true)} className={btn.primary} aria-label={t('newProject')}>
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        <button type="button" className={pill(section === 'portfolio')} onClick={() => setSection('portfolio')}>
          <ChartPieIcon className="w-4 h-4" />
          {t('portfolio')}
        </button>
        <button type="button" className={pill(section === 'notifications')} onClick={() => setSection('notifications')}>
          <BellIcon className="w-4 h-4" />
          {t('notifications')}
          {unread > 0 && <span className="bg-red-500 text-white px-1.5 rounded-full">{unread}</span>}
        </button>
        <button type="button" className={pill(section === 'preferences')} onClick={() => setSection('preferences')}>
          <Cog6ToothIcon className="w-4 h-4" />
          {t('preferences')}
        </button>
      </div>
      {newOpen && <NewProjectModal onClose={() => setNewOpen(false)} />}
    </div>
  );
}
