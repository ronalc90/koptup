'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, ArrowUturnLeftIcon, CheckCircleIcon, DocumentTextIcon, EyeIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import { addDays } from '../lib/dates';
import { projectStats } from '../lib/engine';
import { useDemo } from '../lib/store';
import type { Task } from '../lib/types';
import { CommentText } from './TaskDrawer';
import WeeklyReportModal from './WeeklyReportModal';
import { useDocs, useHistoryText } from './docs';
import { Bar, Initials, btn, card, inputCls, useFmt } from './ui';

export default function ClientPortal() {
  const t = useTranslations('demoProjectsPro.portal');
  const tOut = useTranslations('demoProjectsPro.outbox');
  const f = useFmt();
  const { ws, today, setClientMode } = useDemo();
  const project = ws.projects.find((p) => p.id === ws.currentProjectId) ?? ws.projects[0];
  const stats = useMemo(() => projectStats(ws, project, today), [ws, project, today]);
  const historyText = useHistoryText();
  const { downloadAttachment } = useDocs();
  const [weekly, setWeekly] = useState(false);

  const visible = stats.tasks.filter((x) => x.clientVisible);
  const pending = visible.filter((x) => x.status === 'client' && !x.clientApproved);
  const approvedWaiting = visible.filter((x) => x.status === 'client' && x.clientApproved);
  const delivered = visible
    .filter((x) => x.status === 'done')
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
    .slice(0, 6);
  const upcoming = visible.filter((x) => x.status !== 'done' && x.status !== 'client' && x.due >= today && x.due <= addDays(today, 30)).sort((a, b) => a.due.localeCompare(b.due));
  const docs = visible.flatMap((x) => x.attachments.filter((a) => a.source === 'sample').map((a) => ({ task: x, att: a })));
  const updates = visible
    .flatMap((x) => x.history.filter((h) => h.client).map((h) => ({ task: x, h })))
    .sort((a, b) => b.h.at.localeCompare(a.h.at))
    .slice(0, 8);
  const sent = ws.outbox.filter((o) => o.projectId === project.id).slice(0, 5);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-300 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/40 px-4 py-3">
        <p className="flex items-start gap-2 text-sm text-violet-900 dark:text-violet-100">
          <EyeIcon className="w-5 h-5 shrink-0" />
          <span>{t('banner', { client: project.client })}</span>
        </p>
        <button type="button" onClick={() => setClientMode(false)} className={btn.outline}>
          <ArrowUturnLeftIcon className="w-4 h-4" />
          {t('back')}
        </button>
      </div>

      <header className={`${card} overflow-hidden`}>
        <div className={`h-2 ${project.color}`} aria-hidden="true" />
        <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('portalOf', { client: project.client })}</p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white break-words">{project.name}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{t('executedBy', { company: ws.company.name, contact: project.clientContact })}</p>
          </div>
          <div className="md:w-72">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600 dark:text-slate-300">{t('progress')}</span>
              <span className="font-bold text-slate-900 dark:text-white">{stats.progress}%</span>
            </div>
            <Bar value={stats.progress} />
            {stats.current && (
              <p className="text-xs text-slate-500 mt-1.5">
                {t('currentMilestone', { name: stats.current.milestone.name, date: f.date(stats.current.milestone.end, 'short') })}
              </p>
            )}
            <button type="button" className={`${btn.small} mt-2`} onClick={() => setWeekly(true)}>
              <DocumentTextIcon className="w-3.5 h-3.5" />
              {t('weekly')}
            </button>
          </div>
        </div>
      </header>

      <section className={`${card} p-4`}>
        <h2 className="font-bold text-slate-900 dark:text-white">{t('pendingTitle', { count: pending.length })}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{t('pendingSub')}</p>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-500">{t('pendingEmpty')}</p>
        ) : (
          <div className="space-y-3">
            {pending.map((x) => (
              <Deliverable key={x.id} task={x} onDownload={downloadAttachment} />
            ))}
          </div>
        )}
        {approvedWaiting.length > 0 && (
          <ul className="mt-3 space-y-1">
            {approvedWaiting.map((x) => (
              <li key={x.id} className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                <CheckCircleIcon className="w-4 h-4" />
                {t('approvedWaiting', { task: x.title })}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid lg:grid-cols-2 gap-5">
        <section className={`${card} p-4`}>
          <h2 className="font-bold text-slate-900 dark:text-white mb-3">{t('milestonesTitle')}</h2>
          <ul className="space-y-3">
            {stats.milestones.map((m) => (
              <li key={m.milestone.id}>
                <div className="flex flex-wrap justify-between gap-2 text-sm">
                  <span className="font-medium text-slate-800 dark:text-slate-100">{m.milestone.name}</span>
                  <span className="text-xs text-slate-500">
                    {m.complete || m.milestone.closed ? t('milestoneDone') : t('milestoneDue', { date: f.date(m.milestone.end, 'short') })}
                  </span>
                </div>
                <Bar value={m.progress} tone={m.late ? 'red' : m.complete ? 'emerald' : 'teal'} className="mt-1" />
              </li>
            ))}
          </ul>
        </section>

        <section className={`${card} p-4`}>
          <h2 className="font-bold text-slate-900 dark:text-white mb-3">{t('upcomingTitle')}</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-500">{t('upcomingEmpty')}</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {upcoming.map((x) => (
                <li key={x.id} className="flex justify-between gap-3">
                  <span className="text-slate-800 dark:text-slate-100">{x.title}</span>
                  <span className="text-xs text-slate-500 whitespace-nowrap">{f.date(x.due, 'short')}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${card} p-4`}>
          <h2 className="font-bold text-slate-900 dark:text-white mb-3">{t('deliveredTitle')}</h2>
          {delivered.length === 0 ? (
            <p className="text-sm text-slate-500">{t('deliveredEmpty')}</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {delivered.map((x) => (
                <li key={x.id} className="flex justify-between gap-3">
                  <span className="text-slate-800 dark:text-slate-100">
                    {x.title}
                    {x.clientApproved && <span className="ml-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">{t('approvedByYou')}</span>}
                  </span>
                  <span className="text-xs text-slate-500 whitespace-nowrap">{x.completedAt && f.date(x.completedAt, 'short')}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${card} p-4`}>
          <h2 className="font-bold text-slate-900 dark:text-white mb-3">{t('docsTitle')}</h2>
          {docs.length === 0 ? (
            <p className="text-sm text-slate-500">{t('docsEmpty')}</p>
          ) : (
            <ul className="space-y-1.5">
              {docs.map(({ task, att }) => (
                <li key={att.id} className="flex items-center gap-2 text-sm">
                  <PaperClipIcon className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="flex-1 min-w-0 truncate text-slate-800 dark:text-slate-100" title={att.name}>
                    {att.name}
                  </span>
                  <button type="button" className={btn.small} onClick={() => downloadAttachment(task, att)}>
                    <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                    {t('download')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <section className={`${card} p-4`}>
          <h2 className="font-bold text-slate-900 dark:text-white mb-3">{t('updatesTitle')}</h2>
          {updates.length === 0 ? (
            <p className="text-sm text-slate-500">{t('updatesEmpty')}</p>
          ) : (
            <ul className="space-y-2">
              {updates.map(({ task, h }, i) => (
                <li key={`${task.id}-${i}`} className="text-sm">
                  <p className="text-slate-800 dark:text-slate-100">
                    <span className="font-medium">{task.title}</span>: {historyText(h)}
                  </p>
                  <p className="text-[11px] text-slate-500">{f.dateTime(h.at)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className={`${card} p-4`}>
          <h2 className="font-bold text-slate-900 dark:text-white">{t('noticesTitle')}</h2>
          <p className="text-xs text-amber-800 dark:text-amber-300 mb-3">{t('noticesSub')}</p>
          {sent.length === 0 ? (
            <p className="text-sm text-slate-500">{t('noticesEmpty')}</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {sent.map((o) => (
                <li key={o.id} className="text-slate-700 dark:text-slate-200">
                  <span className="text-xs text-slate-500">
                    {f.dateTime(o.at)} · {tOut(`channel.${o.channel}`)}
                  </span>
                  <br />
                  {tOut(o.key, o.params)}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      {weekly && <WeeklyReportModal onClose={() => setWeekly(false)} />}
    </div>
  );
}

function Deliverable({ task, onDownload }: { task: Task; onDownload: ReturnType<typeof useDocs>['downloadAttachment'] }) {
  const t = useTranslations('demoProjectsPro.portal');
  const f = useFmt();
  const { ws, act } = useDemo();
  const [mode, setMode] = useState<'none' | 'approve' | 'changes'>('none');
  const [text, setText] = useState('');
  const project = ws.projects.find((p) => p.id === task.projectId)!;
  const clientComments = task.comments.filter((c) => c.fromClient);
  return (
    <article className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-white">{task.title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">{task.description}</p>
        </div>
        <span className="text-xs text-slate-500 whitespace-nowrap">{t('dueBy', { date: f.date(task.due, 'short') })}</span>
      </div>
      {task.attachments.filter((a) => a.source === 'sample').length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {task.attachments
            .filter((a) => a.source === 'sample')
            .map((a) => (
              <button key={a.id} type="button" className={btn.small} onClick={() => onDownload(task, a)}>
                <PaperClipIcon className="w-3.5 h-3.5" />
                {a.name}
              </button>
            ))}
        </div>
      )}
      {clientComments.length > 0 && (
        <ul className="mt-2 space-y-1">
          {clientComments.map((c) => (
            <li key={c.id} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
              <Initials name={c.author} size="xs" />
              <span>
                <span className="font-semibold">{c.author}</span> · {f.dateTime(c.at)}
                <br />
                <CommentText text={c.text} />
              </span>
            </li>
          ))}
        </ul>
      )}
      {mode === 'none' ? (
        <div className="flex flex-wrap gap-2 mt-3">
          <button type="button" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => setMode('approve')}>
            <CheckCircleIcon className="w-4 h-4" />
            {t('approve')}
          </button>
          <button type="button" className={btn.outline} onClick={() => setMode('changes')}>
            {t('requestChanges')}
          </button>
        </div>
      ) : (
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === 'changes' && !text.trim()) return;
            if (mode === 'approve') {
              act({ type: 'client.approve', taskId: task.id, comment: text });
              toast.success(ws.automations.clientApproval ? t('approvedToast') : t('approvedManualToast'));
            } else {
              act({ type: 'client.changes', taskId: task.id, comment: text });
              toast.success(t('changesToast'));
            }
            setMode('none');
            setText('');
          }}
        >
          <label htmlFor={`gp-pc-${task.id}`} className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {mode === 'approve' ? t('approveComment') : t('changesComment')}
          </label>
          <textarea id={`gp-pc-${task.id}`} rows={2} className={inputCls} value={text} onChange={(e) => setText(e.target.value)} required={mode === 'changes'} placeholder={mode === 'approve' ? t('approvePlaceholder') : t('changesPlaceholder')} />
          <p className="text-[11px] text-slate-500">{t('signedAs', { who: project.clientContact })}</p>
          <div className="flex gap-2">
            <button type="button" className={btn.outline} onClick={() => setMode('none')}>
              {t('cancel')}
            </button>
            <button type="submit" className={mode === 'approve' ? 'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700' : btn.primary} disabled={mode === 'changes' && !text.trim()}>
              {mode === 'approve' ? t('confirmApprove') : t('sendChanges')}
            </button>
          </div>
        </form>
      )}
    </article>
  );
}
