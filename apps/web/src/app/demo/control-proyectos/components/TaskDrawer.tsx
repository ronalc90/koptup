'use client';

import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  PaperClipIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import useModalClose from '@/hooks/useModalClose';
import { localToday } from '../lib/dates';
import { blockers, checklistProgress, dependsOnTransitively, isOverdue, loggedHours, me, memberById } from '../lib/engine';
import type { TaskPatch } from '../lib/reducer';
import { MENTION_RE } from '../lib/seed';
import { uploadedFiles, useDemo } from '../lib/store';
import { PRIORITIES, STATUSES, type Priority, type StatusId, type Task } from '../lib/types';
import { useDocs, useHistoryText } from './docs';
import { Bar, Initials, Modal, STATUS_DOT, btn, inputCls, labelCls, useFmt, useStatusLabel, selectCls } from './ui';

const MAX_UPLOAD = 10 * 1024 * 1024;

export default function TaskDrawer() {
  const { ws, taskId, openTask } = useDemo();
  const task = ws.tasks.find((x) => x.id === taskId);
  // Si la tarea desaparece (eliminada o se cambió de sector), se cierra el panel.
  useEffect(() => {
    if (taskId && !task) openTask(null);
  }, [taskId, task, openTask]);
  if (!task) return null;
  return <Drawer key={task.id} task={task} onClose={() => openTask(null)} />;
}

function Drawer({ task, onClose }: { task: Task; onClose: () => void }) {
  const t = useTranslations('demoProjectsPro.task');
  const tp = useTranslations('demoProjectsPro.priority');
  const f = useFmt();
  const { ws, state, today, act } = useDemo();
  const label = useStatusLabel();
  const [confirmDel, setConfirmDel] = useState(false);
  useModalClose(!confirmDel, onClose);
  const [title, setTitle] = useState(task.title);
  const [desc, setDesc] = useState(task.description);
  useEffect(() => setTitle(task.title), [task.title]);
  useEffect(() => setDesc(task.description), [task.description]);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);

  const project = ws.projects.find((p) => p.id === task.projectId)!;
  const milestones = ws.milestones.filter((m) => m.projectId === task.projectId);
  const blocked = blockers(ws, task);
  const late = isOverdue(task, today);
  const update = (patch: TaskPatch) => act({ type: 'task.update', id: task.id, patch });

  return createPortal(
    <div className="fixed inset-0 z-[200]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <aside ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="gp-task-title" className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col outline-none">
        <div className="flex items-start gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{project.name}</p>
            <label htmlFor="gp-task-title" className="sr-only">
              {t('title')}
            </label>
            <input
              id="gp-task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => title.trim() && title !== task.title && update({ title: title.trim() })}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              className="w-full text-lg sm:text-xl font-bold text-slate-900 dark:text-white bg-transparent rounded px-1 -mx-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button type="button" onClick={onClose} className={btn.ghost} aria-label={t('close')}>
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {(late || blocked.length > 0) && (
            <div className="space-y-2">
              {late && (
                <p className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">
                  <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
                  {t('overdue', { date: f.date(task.due, 'short') })}
                </p>
              )}
              {blocked.length > 0 && (
                <p className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 rounded-lg px-3 py-2">
                  <LockClosedIcon className="w-4 h-4 shrink-0" />
                  {t('blocked', { tasks: blocked.map((b) => b.title).join(', ') })}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={t('status')} id="gp-f-status">
              <select id="gp-f-status" className={selectCls} value={task.status} onChange={(e) => act({ type: 'task.move', id: task.id, status: e.target.value as StatusId })}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {label(state.sector, s)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('assignee')} id="gp-f-assignee">
              <select id="gp-f-assignee" className={selectCls} value={task.assigneeId ?? ''} onChange={(e) => update({ assigneeId: e.target.value || null })}>
                <option value="">{t('unassigned')}</option>
                {ws.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.me ? ` (${t('you')})` : ''}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('start')} id="gp-f-start">
              <input id="gp-f-start" type="date" className={inputCls} value={task.start} max={task.due} onChange={(e) => e.target.value && update({ start: e.target.value })} />
            </Field>
            <Field label={t('due')} id="gp-f-due">
              <input id="gp-f-due" type="date" className={inputCls} value={task.due} min={task.start} onChange={(e) => e.target.value && update({ due: e.target.value })} />
            </Field>
            <Field label={t('priority')} id="gp-f-priority">
              <select id="gp-f-priority" className={selectCls} value={task.priority} onChange={(e) => update({ priority: e.target.value as Priority })}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {tp(p)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('milestone')} id="gp-f-ms">
              <select id="gp-f-ms" className={selectCls} value={task.milestoneId ?? ''} onChange={(e) => update({ milestoneId: e.target.value || null })}>
                <option value="">{t('noMilestone')}</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('estimate')} id="gp-f-est">
              <input
                id="gp-f-est"
                type="number"
                min={0}
                step={1}
                className={inputCls}
                value={task.estimate}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v) && v >= 0) update({ estimate: v });
                }}
              />
            </Field>
            <div className="flex items-end pb-2">
              <label className="inline-flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input type="checkbox" checked={task.clientVisible} onChange={(e) => update({ clientVisible: e.target.checked })} className="mt-0.5 rounded text-teal-600" />
                <span>
                  {t('clientVisible')}
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">{t('clientVisibleHint')}</span>
                </span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="gp-f-desc" className={labelCls}>
              {t('description')}
            </label>
            <textarea id="gp-f-desc" rows={3} className={inputCls} value={desc} onChange={(e) => setDesc(e.target.value)} onBlur={() => desc !== task.description && update({ description: desc })} />
          </div>

          <Dependencies task={task} />
          <Checklist task={task} />
          <Hours task={task} />
          <Comments task={task} />
          <Attachments task={task} />
          <History task={task} />
        </div>

        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-between gap-2">
          <button
            type="button"
            className={btn.outline}
            onClick={() => {
              act({ type: 'task.duplicate', id: task.id, suffix: t('copySuffix') });
              toast.success(t('duplicated'));
            }}
          >
            <DocumentDuplicateIcon className="w-4 h-4" />
            {t('duplicate')}
          </button>
          <button type="button" className={`${btn.outline} text-red-600 dark:text-red-400`} onClick={() => setConfirmDel(true)}>
            <TrashIcon className="w-4 h-4" />
            {t('delete')}
          </button>
        </div>
      </aside>
      {confirmDel && (
        <Modal
          title={t('deleteTitle')}
          onClose={() => setConfirmDel(false)}
          size="sm"
          labelId="gp-del-drawer"
          footer={
            <>
              <button type="button" className={btn.outline} onClick={() => setConfirmDel(false)}>
                {t('cancel')}
              </button>
              <button
                type="button"
                className={btn.danger}
                onClick={() => {
                  act({ type: 'task.delete', id: task.id });
                  setConfirmDel(false);
                  onClose();
                }}
              >
                {t('deleteConfirm')}
              </button>
            </>
          }
        >
          <p className="text-sm text-slate-700 dark:text-slate-300">{t('deleteBody', { task: task.title })}</p>
        </Modal>
      )}
    </div>,
    document.body,
  );
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Block({ title, children, action }: { title: ReactNode; children: ReactNode; action?: ReactNode }) {
  return (
    <section>
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Dependencies({ task }: { task: Task }) {
  const t = useTranslations('demoProjectsPro.task');
  const f = useFmt();
  const { ws, state, act, openTask } = useDemo();
  const label = useStatusLabel();
  const preds = task.dependsOn.map((id) => ws.tasks.find((x) => x.id === id)).filter((x): x is Task => !!x);
  const candidates = ws.tasks.filter((x) => x.projectId === task.projectId && x.id !== task.id && !task.dependsOn.includes(x.id) && !dependsOnTransitively(ws, x.id, task.id));
  return (
    <Block title={t('dependsOn')}>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">{t('dependsHint')}</p>
      {preds.length > 0 && (
        <ul className="space-y-1.5 mb-2">
          {preds.map((p) => (
            <li key={p.id} className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[p.status]}`} aria-hidden="true" />
              <button type="button" className="flex-1 min-w-0 text-left truncate hover:text-teal-700 dark:hover:text-teal-300" onClick={() => openTask(p.id)}>
                {p.title}
              </button>
              <span className="text-[11px] text-slate-500 whitespace-nowrap">
                {label(state.sector, p.status)} · {f.date(p.due, 'short')}
              </span>
              <button type="button" className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700" aria-label={t('removeDep', { task: p.title })} onClick={() => act({ type: 'task.update', id: task.id, patch: { dependsOn: task.dependsOn.filter((d) => d !== p.id) } })}>
                <XMarkIcon className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {candidates.length > 0 && (
        <select
          aria-label={t('addDep')}
          className={selectCls}
          value=""
          onChange={(e) => e.target.value && act({ type: 'task.update', id: task.id, patch: { dependsOn: [...task.dependsOn, e.target.value] } })}
        >
          <option value="">{t('addDep')}</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      )}
    </Block>
  );
}

function Checklist({ task }: { task: Task }) {
  const t = useTranslations('demoProjectsPro.task');
  const { act } = useDemo();
  const [text, setText] = useState('');
  const done = task.checklist.filter((c) => c.done).length;
  return (
    <Block title={t('checklist', { done, total: task.checklist.length })}>
      {task.checklist.length > 0 && <Bar value={checklistProgress(task)} className="mb-2" />}
      <ul className="space-y-1.5">
        {task.checklist.map((c) => (
          <li key={c.id} className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <input id={`gp-c-${c.id}`} type="checkbox" checked={c.done} onChange={() => act({ type: 'check.toggle', taskId: task.id, itemId: c.id })} className="w-4 h-4 rounded text-teal-600" />
            <label htmlFor={`gp-c-${c.id}`} className={`flex-1 text-sm cursor-pointer ${c.done ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
              {c.text}
            </label>
            <button type="button" className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700" aria-label={t('removeItem', { item: c.text })} onClick={() => act({ type: 'check.remove', taskId: task.id, itemId: c.id })}>
              <XMarkIcon className="w-4 h-4 text-slate-500" />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="flex gap-2 mt-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          act({ type: 'check.add', taskId: task.id, text });
          setText('');
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('addItem')} aria-label={t('addItem')} className={inputCls} />
        <button type="submit" className={btn.outline} disabled={!text.trim()}>
          <PlusIcon className="w-4 h-4" />
          <span className="sr-only">{t('addItem')}</span>
        </button>
      </form>
    </Block>
  );
}

function Hours({ task }: { task: Task }) {
  const t = useTranslations('demoProjectsPro.task');
  const f = useFmt();
  const { ws, act } = useDemo();
  const [who, setWho] = useState(task.assigneeId ?? me(ws).id);
  const [date, setDate] = useState(() => localToday());
  const [hours, setHours] = useState('2');
  const [note, setNote] = useState('');
  const entries = ws.time.filter((e) => e.taskId === task.id).sort((a, b) => b.date.localeCompare(a.date));
  const total = loggedHours(ws, task.id);
  const rate = new Map(ws.members.map((m) => [m.id, m.rate]));
  const cost = entries.reduce((s, e) => s + e.hours * (rate.get(e.memberId) ?? 0), 0);
  const pct = task.estimate > 0 ? Math.round((total / task.estimate) * 100) : 0;
  const [showAll, setShowAll] = useState(false);
  return (
    <Block title={t('hours')}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="text-slate-700 dark:text-slate-200">{t('hoursSummary', { logged: f.num(total), estimate: f.num(task.estimate), pct })}</span>
        <span className="text-xs text-slate-500">{t('hoursCost', { cost: f.money(cost) })}</span>
      </div>
      <Bar value={pct} tone={pct > 100 ? 'red' : 'teal'} className="mt-1.5 mb-3" />
      <form
        className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end"
        onSubmit={(e) => {
          e.preventDefault();
          const h = Number(hours.replace(',', '.'));
          if (!(h > 0 && h <= 24)) {
            toast.error(t('hoursInvalid'));
            return;
          }
          act({ type: 'time.add', taskId: task.id, memberId: who, date, hours: h, note });
          setNote('');
          toast.success(t('hoursAdded', { hours: f.num(h) }));
        }}
      >
        <div className="col-span-2 sm:col-span-2">
          <label htmlFor="gp-h-who" className={labelCls}>
            {t('who')}
          </label>
          <select id="gp-h-who" className={selectCls} value={who} onChange={(e) => setWho(e.target.value)}>
            {ws.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="gp-h-date" className={labelCls}>
            {t('date')}
          </label>
          <input id="gp-h-date" type="date" className={inputCls} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </div>
        <div>
          <label htmlFor="gp-h-hours" className={labelCls}>
            {t('hoursLabel')}
          </label>
          <input id="gp-h-hours" inputMode="decimal" className={inputCls} value={hours} onChange={(e) => setHours(e.target.value)} />
        </div>
        <button type="submit" className={btn.primary}>
          {t('logHours')}
        </button>
        <div className="col-span-2 sm:col-span-5">
          <label htmlFor="gp-h-note" className="sr-only">
            {t('note')}
          </label>
          <input id="gp-h-note" className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('notePlaceholder')} />
        </div>
      </form>
      {entries.length > 0 && (
        <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800 text-sm">
          {(showAll ? entries : entries.slice(0, 4)).map((e) => {
            const m = memberById(ws, e.memberId);
            return (
              <li key={e.id} className="flex items-center gap-2 py-1.5">
                <span className="text-xs text-slate-500 w-16 shrink-0">{f.date(e.date, 'short')}</span>
                <span className="flex-1 min-w-0 truncate text-slate-700 dark:text-slate-200">
                  {m?.name}
                  {e.note && <span className="text-slate-500"> · {e.note}</span>}
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">{f.hours(e.hours)}</span>
                <button type="button" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={t('removeHours')} onClick={() => act({ type: 'time.remove', id: e.id })}>
                  <XMarkIcon className="w-4 h-4 text-slate-500" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {entries.length > 4 && (
        <button type="button" className={`${btn.link} mt-1`} onClick={() => setShowAll((v) => !v)}>
          {showAll ? t('showLess') : t('showAll', { count: entries.length })}
        </button>
      )}
    </Block>
  );
}

export function CommentText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(MENTION_RE)) {
    const i = m.index ?? 0;
    if (i > last) parts.push(text.slice(last, i));
    parts.push(
      <span key={i} className="font-semibold text-teal-700 dark:text-teal-300">
        {m[0]}
      </span>,
    );
    last = i + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>{p}</Fragment>
      ))}
    </>
  );
}

function Comments({ task }: { task: Task }) {
  const t = useTranslations('demoProjectsPro.task');
  const f = useFmt();
  const { ws, act } = useDemo();
  const [text, setText] = useState('');
  const others = ws.members.filter((m) => !m.me);
  return (
    <Block title={t('comments', { count: task.comments.length })}>
      <ul className="space-y-2">
        {task.comments.map((c) => (
          <li key={c.id} className={`p-3 rounded-lg ${c.fromClient ? 'bg-violet-50 dark:bg-violet-950/40' : 'bg-slate-50 dark:bg-slate-800'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Initials name={c.author} size="xs" />
              <span className="font-semibold text-sm text-slate-900 dark:text-white">{c.author}</span>
              {c.fromClient && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-200 text-violet-900 dark:bg-violet-900 dark:text-violet-100">{t('clientTag')}</span>}
              <span className="text-[11px] text-slate-500 ml-auto">{f.dateTime(c.at)}</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              <CommentText text={c.text} />
            </p>
          </li>
        ))}
      </ul>
      <form
        className="mt-2"
        onSubmit={(e) => {
          e.preventDefault();
          const value = text.trim();
          if (!value) return;
          act({ type: 'comment.add', taskId: task.id, text: value });
          const mentioned = others.filter((m) => value.includes(`@${m.name}`)).map((m) => m.name);
          if (mentioned.length) toast.success(t('mentionSent', { names: mentioned.join(', ') }));
          setText('');
        }}
      >
        <label htmlFor={`gp-cm-${task.id}`} className="sr-only">
          {t('addComment')}
        </label>
        <textarea id={`gp-cm-${task.id}`} rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('commentPlaceholder')} className={inputCls} />
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          <span className="text-[11px] text-slate-500">{t('mention')}</span>
          {others.map((m) => (
            <button key={m.id} type="button" className={btn.small} onClick={() => setText((v) => `${v}${v && !v.endsWith(' ') ? ' ' : ''}@${m.name} `)}>
              @{m.name.split(' ')[0]}
            </button>
          ))}
          <button type="submit" className={`${btn.primary} ml-auto`} disabled={!text.trim()}>
            {t('addComment')}
          </button>
        </div>
      </form>
    </Block>
  );
}

function Attachments({ task }: { task: Task }) {
  const t = useTranslations('demoProjectsPro.task');
  const f = useFmt();
  const { act } = useDemo();
  const { downloadAttachment } = useDocs();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  return (
    <Block
      title={t('attachments', { count: task.attachments.length })}
      action={
        <>
          <button type="button" className={btn.small} onClick={() => input.current?.click()}>
            <PaperClipIcon className="w-3.5 h-3.5" />
            {t('attach')}
          </button>
          <input
            ref={input}
            type="file"
            className="hidden"
            aria-label={t('attach')}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              if (file.size > MAX_UPLOAD) {
                toast.error(t('fileTooBig'));
                return;
              }
              const id = `up-${task.id}-${file.name}-${file.size}-${file.lastModified}`;
              uploadedFiles.set(id, file);
              act({ type: 'attach.add', taskId: task.id, id, name: file.name, size: file.size });
              toast.success(t('attached', { name: file.name }));
            }}
          />
        </>
      }
    >
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">{t('attachHint')}</p>
      {task.attachments.length === 0 ? (
        <p className="text-sm text-slate-500">{t('noAttachments')}</p>
      ) : (
        <ul className="space-y-1.5">
          {task.attachments.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <PaperClipIcon className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-slate-800 dark:text-slate-100">{a.name}</p>
                <p className="text-[11px] text-slate-500">{a.source === 'sample' ? t('sampleDoc') : t('uploadedDoc', { size: f.num((a.size ?? 0) / 1024) })}</p>
              </div>
              <button
                type="button"
                className={btn.small}
                disabled={busy === a.id}
                onClick={async () => {
                  setBusy(a.id);
                  try {
                    await downloadAttachment(task, a);
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                {t('download')}
              </button>
              {a.source === 'upload' && (
                <button
                  type="button"
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                  aria-label={t('removeAttachment', { name: a.name })}
                  onClick={() => {
                    uploadedFiles.delete(a.id);
                    act({ type: 'attach.remove', taskId: task.id, id: a.id });
                  }}
                >
                  <XMarkIcon className="w-4 h-4 text-slate-500" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Block>
  );
}

function History({ task }: { task: Task }) {
  const t = useTranslations('demoProjectsPro.task');
  const f = useFmt();
  const text = useHistoryText();
  const items = [...task.history].reverse();
  return (
    <Block title={t('history')}>
      <ol className="space-y-2">
        {items.map((h, i) => (
          <li key={`${h.at}-${i}`} className="flex items-start gap-2.5">
            <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${h.key.startsWith('client') ? 'bg-violet-500' : h.actor ? 'bg-teal-600' : 'bg-amber-500'}`} aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm text-slate-700 dark:text-slate-200">
                {text(h)}
                {h.client && <CheckCircleIcon className="inline w-3.5 h-3.5 ml-1 text-violet-500" aria-label={t('visibleInPortal')} />}
              </p>
              <p className="text-[11px] text-slate-500">{f.dateTime(h.at)}</p>
            </div>
          </li>
        ))}
      </ol>
    </Block>
  );
}
