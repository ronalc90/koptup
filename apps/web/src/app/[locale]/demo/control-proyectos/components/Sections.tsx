'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { BellAlertIcon, CheckIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { projectStats, type HealthLevel } from '../lib/engine';
import { useDemo } from '../lib/store';
import { VIEWS, type Automations, type ViewId } from '../lib/types';
import { Bar, Empty, HealthBadge, Modal, Toggle, btn, card, labelCls, selectCls, useFmt } from './ui';

export function PortfolioView() {
  const t = useTranslations('demoProjectsPro.portfolio');
  const th = useTranslations('demoProjectsPro.healthReason');
  const f = useFmt();
  const { ws, today, act, setSection } = useDemo();
  const [onlyFav, setOnlyFav] = useState(false);
  const rows = useMemo(() => ws.projects.map((p) => projectStats(ws, p, today)), [ws, today]);
  const shown = rows.filter((r) => !onlyFav || r.project.favorite);
  const count = (lvl: HealthLevel) => rows.filter((r) => r.health.level === lvl).length;
  const totalBudget = rows.reduce((s, r) => s + r.budget, 0);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('title')}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">{t('subtitle', { company: ws.company.name })}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`${card} p-4`}>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('active')}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{rows.length}</p>
        </div>
        <div className={`${card} p-4`}>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('byHealth')}</p>
          <p className="text-sm mt-1 space-x-2">
            <span className="text-emerald-700 dark:text-emerald-300 font-semibold">{t('ok', { count: count('ok') })}</span>
            <span className="text-amber-700 dark:text-amber-300 font-semibold">{t('risk', { count: count('risk') })}</span>
            <span className="text-red-700 dark:text-red-300 font-semibold">{t('late', { count: count('late') })}</span>
          </p>
        </div>
        <div className={`${card} p-4`}>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('budget')}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{f.moneyShort(totalBudget)}</p>
        </div>
        <div className={`${card} p-4`}>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('cost')}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{f.moneyShort(totalCost)}</p>
          <p className="text-[11px] text-slate-500">{t('costPct', { pct: totalBudget ? Math.round((totalCost / totalBudget) * 100) : 0 })}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl">{t('rules')}</p>
        <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input type="checkbox" checked={onlyFav} onChange={(e) => setOnlyFav(e.target.checked)} className="rounded text-teal-600" />
          {t('onlyFavorites')}
        </label>
      </div>
      {shown.length === 0 ? (
        <div className={card}>
          <Empty>{t('noFavorites')}</Empty>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {shown.map((r) => (
            <article key={r.project.id} className={`${card} p-4 flex flex-col`}>
              <div className="flex items-start gap-2">
                <span className={`w-3 h-3 mt-1.5 rounded-full shrink-0 ${r.project.color}`} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-slate-900 dark:text-white leading-snug">{r.project.name}</h2>
                  <p className="text-xs text-slate-500">{r.project.client}</p>
                </div>
                <button
                  type="button"
                  onClick={() => act({ type: 'project.favorite', id: r.project.id })}
                  className={btn.ghost}
                  aria-pressed={r.project.favorite}
                  aria-label={r.project.favorite ? t('unfavorite', { name: r.project.name }) : t('favorite', { name: r.project.name })}
                >
                  {r.project.favorite ? <StarSolid className="w-5 h-5 text-yellow-500" /> : <StarOutline className="w-5 h-5" />}
                </button>
              </div>
              <div className="mt-3">
                <HealthBadge level={r.health.level} />
                <ul className="mt-1.5 space-y-0.5">
                  {r.health.reasons.length === 0 ? (
                    <li className="text-xs text-slate-500">{th('none')}</li>
                  ) : (
                    r.health.reasons.map((x, i) => (
                      <li key={i} className="text-xs text-slate-600 dark:text-slate-300">
                        {th(x.key, x.params)}
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div className="mt-3 space-y-2">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 mb-0.5">
                    <span>{t('progress')}</span>
                    <span className="font-semibold">{r.progress}%</span>
                  </div>
                  <Bar value={r.progress} />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 mb-0.5">
                    <span>{t('spent', { cost: f.moneyShort(r.cost), budget: f.moneyShort(r.budget) })}</span>
                    <span className="font-semibold">{r.spent}%</span>
                  </div>
                  <Bar value={r.spent} tone={r.spent > r.progress + 10 ? 'amber' : 'emerald'} />
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-3">
                {r.current ? t('current', { name: r.current.milestone.name, date: f.date(r.current.milestone.end, 'short') }) : t('noMilestone')}
              </p>
              <button
                type="button"
                className={`${btn.outline} mt-3 self-start`}
                onClick={() => {
                  act({ type: 'project.select', id: r.project.id });
                  setSection('project');
                }}
              >
                {t('open')}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function NotificationsView() {
  const t = useTranslations('demoProjectsPro.notifications');
  const tn = useTranslations('demoProjectsPro.notif');
  const f = useFmt();
  const { ws, act, setSection, openTask } = useDemo();
  const unread = ws.notifications.filter((n) => !n.read).length;
  return (
    <div className="p-4 sm:p-6 max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('title')}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('subtitle', { count: unread })}</p>
        </div>
        <button type="button" className={btn.outline} onClick={() => act({ type: 'notif.readAll' })} disabled={unread === 0}>
          <CheckIcon className="w-4 h-4" />
          {t('markAll')}
        </button>
      </div>
      {ws.notifications.length === 0 ? (
        <div className={card}>
          <Empty>{t('empty')}</Empty>
        </div>
      ) : (
        <ul className="space-y-2">
          {ws.notifications.map((n) => {
            const project = ws.projects.find((p) => p.id === n.projectId);
            const taskExists = n.taskId && ws.tasks.some((x) => x.id === n.taskId);
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    act({ type: 'notif.read', id: n.id });
                    if (project) {
                      act({ type: 'project.select', id: project.id });
                      setSection('project');
                      if (taskExists) openTask(n.taskId!);
                    }
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${n.read ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800' : 'bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800'}`}
                >
                  <div className="flex items-start gap-3">
                    <BellAlertIcon className={`w-5 h-5 mt-0.5 shrink-0 ${n.read ? 'text-slate-400' : 'text-teal-600'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${n.read ? 'text-slate-700 dark:text-slate-300' : 'font-semibold text-slate-900 dark:text-white'}`}>{tn(n.key, n.params)}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {f.dateTime(n.at)}
                        {project && ` · ${project.name}`} · {t(`kind.${n.kind}`)}
                      </p>
                    </div>
                    {!n.read && <span className="text-[10px] font-bold uppercase text-teal-700 dark:text-teal-300">{t('new')}</span>}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function PreferencesView() {
  const t = useTranslations('demoProjectsPro.prefs');
  const tv = useTranslations('demoProjectsPro.views');
  const ta = useTranslations('demoProjectsPro.automations');
  const tSector = useTranslations('demoProjectsPro.sector');
  const { state, ws, act, setView, reset } = useDemo();
  const [confirm, setConfirm] = useState<'all' | 'sector' | null>(null);
  const autoKeys: (keyof Automations)[] = ['clientApproval', 'notifyClient', 'overdueRaise'];
  return (
    <div className="p-4 sm:p-6 max-w-3xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('title')}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">{t('subtitle')}</p>
      </div>

      <section className={`${card} p-4`}>
        <h2 className="font-bold text-slate-900 dark:text-white">{t('viewTitle')}</h2>
        <div className="mt-2 max-w-xs">
          <label htmlFor="gp-p-view" className={labelCls}>
            {t('defaultView')}
          </label>
          <select
            id="gp-p-view"
            className={selectCls}
            value={state.prefs.defaultView}
            onChange={(e) => {
              const v = e.target.value as ViewId;
              act({ type: 'prefs.set', prefs: { defaultView: v } });
              setView(v);
              toast.success(t('viewSaved', { view: tv(v) }));
            }}
          >
            {VIEWS.map((v) => (
              <option key={v} value={v}>
                {tv(v)}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500 mt-1">{t('defaultViewHint')}</p>
        </div>
      </section>

      <section className={`${card} px-4 pt-4 pb-1`}>
        <h2 className="font-bold text-slate-900 dark:text-white">{t('notifyTitle')}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{t('notifySub')}</p>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {(['client', 'due', 'sent'] as const).map((k) => (
            <Toggle key={k} id={`gp-n-${k}`} checked={state.prefs.notify[k]} onChange={(v) => act({ type: 'prefs.set', prefs: { notify: { ...state.prefs.notify, [k]: v } } })} label={t(`notify.${k}`)} description={t(`notify.${k}Desc`)} />
          ))}
        </div>
      </section>

      <section className={`${card} px-4 pt-4 pb-1`}>
        <h2 className="font-bold text-slate-900 dark:text-white">{ta('title')}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{ta('subtitle', { sector: tSector(state.sector) })}</p>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {autoKeys.map((k) => (
            <Toggle key={k} id={`gp-a-${k}`} checked={ws.automations[k]} onChange={(v) => act({ type: 'automation.set', key: k, value: v })} label={ta(`${k}.name`)} description={ta(`${k}.desc`)} />
          ))}
        </div>
      </section>

      <section className={`${card} p-4`}>
        <h2 className="font-bold text-slate-900 dark:text-white">{t('dataTitle')}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{t('dataSub')}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btn.outline} onClick={() => setConfirm('sector')}>
            {t('resetSector', { sector: tSector(state.sector) })}
          </button>
          <button type="button" className={`${btn.outline} text-red-600 dark:text-red-400`} onClick={() => setConfirm('all')}>
            {t('resetAll')}
          </button>
        </div>
      </section>

      {confirm && (
        <Modal
          title={confirm === 'all' ? t('resetAllTitle') : t('resetSectorTitle', { sector: tSector(state.sector) })}
          onClose={() => setConfirm(null)}
          size="sm"
          labelId="gp-reset-prefs"
          footer={
            <>
              <button type="button" className={btn.outline} onClick={() => setConfirm(null)}>
                {t('cancel')}
              </button>
              <button
                type="button"
                className={btn.danger}
                onClick={() => {
                  if (confirm === 'all') reset();
                  else act({ type: 'workspace.reset', base: state.baseDate });
                  setConfirm(null);
                  toast.success(t('resetDone'));
                }}
              >
                {t('resetConfirm')}
              </button>
            </>
          }
        >
          <p className="text-sm text-slate-700 dark:text-slate-300">{confirm === 'all' ? t('resetAllBody') : t('resetSectorBody')}</p>
        </Modal>
      )}
    </div>
  );
}
