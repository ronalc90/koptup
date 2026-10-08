'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  CalendarDaysIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  EyeIcon,
  FunnelIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PresentationChartLineIcon,
  ViewColumnsIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { diffDays } from '../lib/dates';
import { applyFilters, burndown, filtersActive, projectMilestones, projectStats } from '../lib/engine';
import { useDemo } from '../lib/store';
import { EMPTY_FILTERS, VIEWS, type Priority, type StatusId, type ViewId } from '../lib/types';
import MonthCalendar from './MonthCalendar';
import KanbanView from './KanbanView';
import TaskList from './TaskList';
import ProjectSettings from './ProjectSettings';
import ReportsView from './ReportsView';
import TaskFormModal from './TaskFormModal';
import Schedule from './Schedule';
import WeeklyReportModal from './WeeklyReportModal';
import { Bar, HealthBadge, Modal, btn, inputCls, selectCls, useFmt } from './ui';

const VIEW_ICON: Record<ViewId, typeof ViewColumnsIcon> = {
  kanban: ViewColumnsIcon,
  list: ListBulletIcon,
  calendar: CalendarDaysIcon,
  timeline: PresentationChartLineIcon,
  reports: ChartBarIcon,
};

const GUIDE_KEY = 'koptup.gestion-proyectos.guide-hidden';

export default function ProjectWorkspace() {
  const t = useTranslations('demoProjectsPro.header');
  const { ws, today, view, setView, setClientMode, act, filters } = useDemo();
  const project = ws.projects.find((p) => p.id === ws.currentProjectId) ?? ws.projects[0];
  const stats = useMemo(() => projectStats(ws, project, today), [ws, project, today]);
  const [settings, setSettings] = useState(false);
  const [weekly, setWeekly] = useState(false);
  const [newTask, setNewTask] = useState<StatusId | null>(null);
  const filtered = useMemo(() => applyFilters(stats.tasks, filters, today), [stats.tasks, filters, today]);

  return (
    <div className="min-w-0">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-start gap-2">
              <span className={`w-3 h-3 mt-2.5 shrink-0 rounded-full ${project.color}`} aria-hidden="true" />
              <h2 className="flex-1 min-w-0 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white break-words">{project.name}</h2>
              <button
                type="button"
                onClick={() => act({ type: 'project.favorite', id: project.id })}
                className={`${btn.ghost} shrink-0`}
                aria-pressed={project.favorite}
                aria-label={project.favorite ? t('unfavorite') : t('favorite')}
                title={project.favorite ? t('unfavorite') : t('favorite')}
              >
                {project.favorite ? <StarSolid className="w-5 h-5 text-yellow-500" /> : <StarOutline className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              {t('client', { client: project.client, contact: project.clientContact, city: project.city })}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-600 dark:text-slate-300">
              <HealthBadge level={stats.health.level} />
              <span>{t('summary', { tasks: stats.tasks.length, progress: stats.progress })}</span>
              {stats.overdue.length > 0 && <span className="text-red-600 dark:text-red-400 font-semibold">{t('overdue', { count: stats.overdue.length })}</span>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button type="button" onClick={() => setClientMode(true)} className={btn.outline}>
              <EyeIcon className="w-4 h-4" />
              {t('clientView')}
            </button>
            <button type="button" onClick={() => setWeekly(true)} className={btn.outline}>
              <DocumentTextIcon className="w-4 h-4" />
              {t('weekly')}
            </button>
            <button type="button" onClick={() => setSettings(true)} className={btn.outline}>
              <Cog6ToothIcon className="w-4 h-4" />
              {t('settings')}
            </button>
          </div>
        </div>
      </header>

      <MilestoneStrip />
      <Guide onWeekly={() => setWeekly(true)} />

      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2 space-y-2">
        <ViewTabs view={view} onChange={setView} />
        {view !== 'reports' && <FilterBar onNew={() => setNewTask('todo')} count={filtered.length} total={stats.tasks.length} />}
      </div>

      <div className="min-w-0">
        {view === 'kanban' && <KanbanView tasks={filtered} onNew={setNewTask} />}
        {view === 'list' && <TaskList tasks={filtered} />}
        {view === 'calendar' && <MonthCalendar tasks={filtered} />}
        {view === 'timeline' && <Schedule tasks={filtered} />}
        {view === 'reports' && <ReportsView />}
      </div>

      {settings && <ProjectSettings onClose={() => setSettings(false)} />}
      {weekly && <WeeklyReportModal onClose={() => setWeekly(false)} />}
      {newTask && <TaskFormModal status={newTask} onClose={() => setNewTask(null)} />}
    </div>
  );
}

function ViewTabs({ view, onChange }: { view: ViewId; onChange: (v: ViewId) => void }) {
  const t = useTranslations('demoProjectsPro.views');
  return (
    <>
      <div role="tablist" aria-label={t('label')} className="hidden sm:flex gap-1 overflow-x-auto">
        {VIEWS.map((id) => {
          const Icon = VIEW_ICON[id];
          const selected = view === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                selected ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t(id)}
            </button>
          );
        })}
      </div>
      <div className="sm:hidden flex items-center gap-2">
        <label htmlFor="gp-view-mobile" className="text-xs font-semibold text-slate-500">
          {t('label')}
        </label>
        <select id="gp-view-mobile" value={view} onChange={(e) => onChange(e.target.value as ViewId)} className={`${selectCls} py-1.5`}>
          {VIEWS.map((id) => (
            <option key={id} value={id}>
              {t(id)}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

function FilterBar({ onNew, count, total }: { onNew: () => void; count: number; total: number }) {
  const t = useTranslations('demoProjectsPro.filters');
  const tp = useTranslations('demoProjectsPro.priority');
  const { ws, filters, setFilters } = useDemo();
  const milestones = projectMilestones(ws, ws.currentProjectId);
  const [open, setOpen] = useState(false);
  const active = filtersActive(filters);
  // Si cambia el proyecto, el filtro de hito anterior ya no aplica.
  useEffect(() => {
    if (filters.milestone && !milestones.some((m) => m.id === filters.milestone)) setFilters({ ...filters, milestone: '' });
  }, [filters, milestones, setFilters]);
  const sel = 'pl-2 pr-8 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-w-0';
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[10rem] max-w-sm">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            placeholder={t('search')}
            aria-label={t('search')}
            className={`${inputCls} pl-8 py-1.5`}
          />
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} className={`${btn.outline} py-1.5 lg:hidden`} aria-expanded={open}>
          <FunnelIcon className="w-4 h-4" />
          {t('filters')}
          {active && <span className="w-2 h-2 rounded-full bg-teal-600" aria-hidden="true" />}
        </button>
        <div className={`${open ? 'flex' : 'hidden'} lg:flex flex-wrap items-center gap-2 w-full lg:w-auto`}>
          <select aria-label={t('assignee')} value={filters.assignee} onChange={(e) => setFilters({ ...filters, assignee: e.target.value })} className={sel}>
            <option value="">{t('anyone')}</option>
            {ws.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
            <option value="none">{t('unassigned')}</option>
          </select>
          <select aria-label={t('priority')} value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value as '' | Priority })} className={sel}>
            <option value="">{t('anyPriority')}</option>
            {(['high', 'medium', 'low'] as Priority[]).map((p) => (
              <option key={p} value={p}>
                {tp(p)}
              </option>
            ))}
          </select>
          <select aria-label={t('milestone')} value={filters.milestone} onChange={(e) => setFilters({ ...filters, milestone: e.target.value })} className={`${sel} max-w-[14rem]`}>
            <option value="">{t('anyMilestone')}</option>
            {milestones.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <label className="inline-flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-200">
            <input type="checkbox" checked={filters.overdueOnly} onChange={(e) => setFilters({ ...filters, overdueOnly: e.target.checked })} className="rounded text-teal-600" />
            {t('overdueOnly')}
          </label>
          {active && (
            <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className={btn.small}>
              <XMarkIcon className="w-3.5 h-3.5" />
              {t('clear')}
            </button>
          )}
        </div>
        <button type="button" onClick={onNew} className={`${btn.primary} py-1.5 ml-auto`}>
          <PlusIcon className="w-4 h-4" />
          {t('newTask')}
        </button>
      </div>
      {active && <p className="text-xs text-slate-500 dark:text-slate-400">{t('showing', { count, total })}</p>}
    </div>
  );
}

function MilestoneStrip() {
  const t = useTranslations('demoProjectsPro.strip');
  const f = useFmt();
  const { ws, today, act } = useDemo();
  const project = ws.projects.find((p) => p.id === ws.currentProjectId) ?? ws.projects[0];
  const stats = useMemo(() => projectStats(ws, project, today), [ws, project, today]);
  const cur = stats.current;
  const [confirmClose, setConfirmClose] = useState(false);
  if (!cur) {
    return <div className="px-4 sm:px-6 py-3 text-xs text-slate-500 bg-teal-50/60 dark:bg-teal-950/30 border-b border-teal-100 dark:border-teal-900/60">{t('none')}</div>;
  }
  const m = cur.milestone;
  const isSprint = m.kind === 'sprint';
  const left = diffDays(today, m.end);
  const bd = burndown(ws, m, today);
  const w = 150;
  const h = 40;
  const n = Math.max(1, bd.days.length - 1);
  const max = Math.max(1, bd.total);
  const pts = (arr: (number | null)[]) =>
    arr
      .map((v, i) => (v === null ? null : `${((i / n) * w).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`))
      .filter(Boolean)
      .join(' ');
  const open = cur.tasks.filter((x) => x.status !== 'done').length;
  const nums = ws.milestones.filter((x) => x.projectId === m.projectId && x.kind === 'sprint').map((x) => Number(x.name.replace(/\D/g, '')) || 0);
  const nextName = t('sprintName', { n: Math.max(0, ...nums) + 1 });
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 sm:px-6 py-3 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40 border-b border-teal-100 dark:border-teal-900/60">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-teal-800/80 dark:text-teal-300/80 font-semibold">{isSprint ? t('currentSprint') : t('currentMilestone')}</p>
        <p className="text-sm font-bold text-slate-900 dark:text-white">{m.name}</p>
        <p className={`text-xs font-medium ${cur.late ? 'text-red-600 dark:text-red-400' : left <= 3 ? 'text-amber-700 dark:text-amber-300' : 'text-slate-600 dark:text-slate-300'}`}>
          {t('range', { from: f.date(m.start, 'short'), to: f.date(m.end, 'short') })} ·{' '}
          {left > 0 ? t('daysLeft', { count: left }) : left === 0 ? t('endsToday') : t('endedAgo', { count: -left })}
        </p>
      </div>
      <div className="w-36">
        <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 mb-1">
          <span>{t('progress')}</span>
          <span className="font-semibold">{cur.progress}%</span>
        </div>
        <Bar value={cur.progress} />
      </div>
      <div className="w-36">
        <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 mb-1">
          <span>{t('budget')}</span>
          <span className={`font-semibold ${cur.spent > cur.progress + 10 ? 'text-amber-700 dark:text-amber-300' : ''}`}>{cur.spent}%</span>
        </div>
        <Bar value={cur.spent} tone={cur.spent > 100 ? 'red' : cur.spent > cur.progress + 10 ? 'amber' : 'emerald'} />
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{t('budgetOf', { cost: f.moneyShort(cur.cost), budget: f.moneyShort(m.budget) })}</p>
      </div>
      <div className="hidden sm:block">
        <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-semibold mb-0.5">{t('burndown')}</p>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" role="img" aria-label={t('burndownAria', { total: bd.total, remaining: bd.remaining })}>
          <polyline points={pts(bd.ideal)} fill="none" stroke="rgb(148,163,184)" strokeWidth="1.5" strokeDasharray="3 3" />
          <polyline points={pts(bd.actual)} fill="none" stroke="rgb(13,148,136)" strokeWidth="2" />
        </svg>
        <p className="text-[10px] text-slate-500 dark:text-slate-400">{t('remaining', { remaining: f.num(bd.remaining), total: f.num(bd.total) })}</p>
      </div>
      {isSprint && !m.closed && (
        <button type="button" onClick={() => setConfirmClose(true)} className={`${btn.outline} sm:ml-auto`}>
          {t('closeSprint')}
        </button>
      )}
      {confirmClose && (
        <Modal
          title={t('closeTitle', { name: m.name })}
          onClose={() => setConfirmClose(false)}
          size="sm"
          labelId="gp-close-sprint"
          footer={
            <>
              <button type="button" className={btn.outline} onClick={() => setConfirmClose(false)}>
                {t('cancel')}
              </button>
              <button
                type="button"
                className={btn.primary}
                onClick={() => {
                  act({ type: 'sprint.close', id: m.id, nextName });
                  setConfirmClose(false);
                }}
              >
                {t('closeConfirm')}
              </button>
            </>
          }
        >
          <p className="text-sm text-slate-700 dark:text-slate-300">{t('closeBody', { count: open })}</p>
        </Modal>
      )}
    </div>
  );
}

function Guide({ onWeekly }: { onWeekly: () => void }) {
  const t = useTranslations('demoProjectsPro.guide');
  const { setSection, setClientMode, setView } = useDemo();
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    try {
      setHidden(window.localStorage.getItem(GUIDE_KEY) === '1');
    } catch {
      setHidden(false);
    }
  }, []);
  if (hidden) return null;
  const steps: { key: string; action: () => void }[] = [
    { key: 'portfolio', action: () => setSection('portfolio') },
    {
      key: 'move',
      action: () => {
        setView('kanban');
        // Lleva la vista a la columna de revisión del cliente y la resalta un momento.
        setTimeout(() => {
          const col = document.querySelector<HTMLElement>('[data-gp-column="client"]');
          if (!col) return;
          col.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          col.classList.add('ring-4', 'ring-violet-400');
          setTimeout(() => col.classList.remove('ring-4', 'ring-violet-400'), 1800);
        }, 50);
      },
    },
    { key: 'client', action: () => setClientMode(true) },
    { key: 'reports', action: () => setView('reports') },
    { key: 'weekly', action: onWeekly },
  ];
  return (
    <div className="px-4 sm:px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{t('title')}</p>
        <button
          type="button"
          className={btn.link}
          onClick={() => {
            setHidden(true);
            try {
              window.localStorage.setItem(GUIDE_KEY, '1');
            } catch {
              /* sin almacenamiento: se oculta solo en esta visita */
            }
          }}
        >
          {t('hide')}
        </button>
      </div>
      <ol className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {steps.map((s, i) => (
          <li key={s.key}>
            <button
              type="button"
              onClick={s.action}
              className="w-full h-full text-left rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 hover:border-teal-400 dark:hover:border-teal-600 transition-colors"
            >
              <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300">{t('step', { n: i + 1 })}</span>
              <span className="block text-xs text-slate-700 dark:text-slate-200 mt-0.5">{t(s.key)}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
