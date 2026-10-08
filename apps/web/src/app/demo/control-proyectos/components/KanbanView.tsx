'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  LockClosedIcon,
  PaperClipIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { diffDays } from '../lib/dates';
import { blockers, checklistProgress, isOverdue, loggedHours, memberById } from '../lib/engine';
import { useDemo } from '../lib/store';
import { STATUSES, type StatusId, type Task } from '../lib/types';
import { Bar, Initials, Modal, PriorityChip, STATUS_BAR, btn, useFmt, useStatusLabel } from './ui';

export default function KanbanView({ tasks, onNew }: { tasks: Task[]; onNew: (s: StatusId) => void }) {
  const t = useTranslations('demoProjectsPro.kanban');
  const { state, act } = useDemo();
  const label = useStatusLabel();
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<StatusId | null>(null);

  return (
    <div className="overflow-x-auto p-4 sm:p-6">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{t('hint')}</p>
      <div className="flex gap-4 items-start">
        {STATUSES.map((status) => {
          const col = tasks.filter((x) => x.status === status);
          return (
            <section
              key={status}
              data-gp-column={status}
              aria-label={label(state.sector, status)}
              className={`flex-shrink-0 w-72 rounded-xl p-2 transition-colors ${over === status ? 'bg-teal-100/70 dark:bg-teal-900/30' : status === 'client' ? 'bg-violet-50/70 dark:bg-violet-950/20' : 'bg-slate-100/60 dark:bg-slate-900/40'}`}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(status);
              }}
              onDragLeave={() => setOver((o) => (o === status ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                const id = dragId ?? e.dataTransfer.getData('text/plain');
                if (id) act({ type: 'task.move', id, status });
                setDragId(null);
                setOver(null);
              }}
            >
              <div className="flex items-center justify-between px-1 mb-2">
                <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${STATUS_BAR[status]}`} aria-hidden="true" />
                  {label(state.sector, status)}
                  <span className="text-xs font-normal text-slate-500">{col.length}</span>
                </h2>
                <button type="button" onClick={() => onNew(status)} className="p-1 rounded hover:bg-white dark:hover:bg-slate-800" aria-label={t('addIn', { column: label(state.sector, status) })}>
                  <PlusIcon className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              {status === 'client' && <p className="px-1 mb-2 text-[11px] text-violet-700 dark:text-violet-300">{t('clientHint')}</p>}
              <div className="space-y-2 min-h-[3rem]">
                {col.map((task) => (
                  <Card key={task.id} task={task} onDragStart={() => setDragId(task.id)} onDragEnd={() => setDragId(null)} />
                ))}
                {col.length === 0 && <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">{t('empty')}</p>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Card({ task, onDragStart, onDragEnd }: { task: Task; onDragStart: () => void; onDragEnd: () => void }) {
  const t = useTranslations('demoProjectsPro.kanban');
  const f = useFmt();
  const { ws, state, today, act, openTask } = useDemo();
  const label = useStatusLabel();
  const [menu, setMenu] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const assignee = memberById(ws, task.assigneeId);
  const milestone = ws.milestones.find((m) => m.id === task.milestoneId);
  const late = isOverdue(task, today);
  const dueIn = diffDays(today, task.due);
  const blocked = blockers(ws, task);
  const logged = loggedHours(ws, task.id);
  const cp = checklistProgress(task);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={`relative bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-3 cursor-grab active:cursor-grabbing ${late ? 'border-red-300 dark:border-red-800' : 'border-slate-200 dark:border-slate-800 hover:border-teal-400'}`}
    >
      <div className="flex items-start gap-2">
        <button type="button" onClick={() => openTask(task.id)} className="flex-1 min-w-0 text-left">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white leading-snug hover:text-teal-700 dark:hover:text-teal-300">{task.title}</h3>
        </button>
        <div className="relative" ref={menuRef}>
          <button type="button" onClick={() => setMenu((v) => !v)} className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={t('menu', { task: task.title })} aria-expanded={menu}>
            <EllipsisVerticalIcon className="w-5 h-5 text-slate-400" />
          </button>
          {menu && (
            <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-20 py-1 text-sm">
              <p className="px-3 pt-1 pb-0.5 text-[11px] font-semibold text-slate-500 uppercase">{t('moveTo')}</p>
              {STATUSES.filter((s) => s !== task.status).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    act({ type: 'task.move', id: task.id, status: s });
                    setMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <span className={`w-2 h-2 rounded-full ${STATUS_BAR[s]}`} aria-hidden="true" />
                  {label(state.sector, s)}
                </button>
              ))}
              <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
              <button
                type="button"
                onClick={() => {
                  act({ type: 'task.duplicate', id: task.id, suffix: t('copySuffix') });
                  setMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <DocumentDuplicateIcon className="w-4 h-4" />
                {t('duplicate')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmDel(true);
                  setMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <TrashIcon className="w-4 h-4" />
                {t('delete')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        <PriorityChip p={task.priority} />
        {milestone && <span className="px-1.5 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 max-w-[10rem] truncate">{milestone.name}</span>}
        {task.clientVisible && (
          <span className="inline-flex items-center gap-0.5 text-[11px] text-violet-700 dark:text-violet-300" title={t('visibleToClient')}>
            <EyeIcon className="w-3.5 h-3.5" />
            <span className="sr-only">{t('visibleToClient')}</span>
          </span>
        )}
        {task.clientApproved && (
          <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            {t('approved')}
          </span>
        )}
      </div>

      {blocked.length > 0 && (
        <p className="flex items-start gap-1 mt-2 text-[11px] text-amber-700 dark:text-amber-300">
          <LockClosedIcon className="w-3.5 h-3.5 shrink-0 mt-px" />
          <span>{t('blockedBy', { task: blocked[0].title })}</span>
        </p>
      )}

      {task.checklist.length > 0 && (
        <div className="mt-2">
          <div className="flex justify-between text-[11px] text-slate-500 mb-0.5">
            <span>{t('checklist', { done: task.checklist.filter((c) => c.done).length, total: task.checklist.length })}</span>
            <span>{cp}%</span>
          </div>
          <Bar value={cp} />
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`inline-flex items-center gap-0.5 ${late ? 'text-red-600 dark:text-red-400 font-semibold' : task.status !== 'done' && dueIn <= 2 ? 'text-amber-700 dark:text-amber-300' : ''}`} title={t('due')}>
            <CalendarIcon className="w-3.5 h-3.5" />
            {f.date(task.due, 'short')}
            {late && ` · ${t('lateDays', { count: -dueIn })}`}
          </span>
          <span className="inline-flex items-center gap-0.5" title={t('hours')}>
            <ClockIcon className="w-3.5 h-3.5" />
            {f.num(logged)}/{f.num(task.estimate)} h
          </span>
          {task.comments.length > 0 && (
            <span className="inline-flex items-center gap-0.5" title={t('comments')}>
              <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
              {task.comments.length}
            </span>
          )}
          {task.attachments.length > 0 && (
            <span className="inline-flex items-center gap-0.5" title={t('attachments')}>
              <PaperClipIcon className="w-3.5 h-3.5" />
              {task.attachments.length}
            </span>
          )}
        </div>
        {assignee ? <Initials name={assignee.name} size="xs" /> : <span className="text-[11px] italic">{t('unassigned')}</span>}
      </div>

      {confirmDel && (
        <Modal
          title={t('deleteTitle')}
          onClose={() => setConfirmDel(false)}
          size="sm"
          labelId={`gp-del-${task.id}`}
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
    </article>
  );
}
