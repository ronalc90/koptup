'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { workday } from '../lib/dates';
import { currentMilestone, me, milestoneStats, projectMilestones } from '../lib/engine';
import { useDemo } from '../lib/store';
import { PRIORITIES, STATUSES, type Priority, type StatusId } from '../lib/types';
import { Modal, btn, inputCls, labelCls, useStatusLabel, selectCls } from './ui';

export default function TaskFormModal({ status, onClose }: { status: StatusId; onClose: () => void }) {
  const t = useTranslations('demoProjectsPro.newTask');
  const tp = useTranslations('demoProjectsPro.priority');
  const { ws, state, today, act } = useDemo();
  const label = useStatusLabel();
  const projectId = ws.currentProjectId;
  const milestones = projectMilestones(ws, projectId);
  const cur = currentMilestone(
    milestones.map((m) => milestoneStats(ws, m, today)),
    today,
  );
  const [form, setForm] = useState({
    title: '',
    description: '',
    assigneeId: me(ws).id,
    start: today,
    due: workday(today, 5),
    priority: 'medium' as Priority,
    status,
    milestoneId: cur?.milestone.id ?? '',
    estimate: '8',
    clientVisible: status === 'client',
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.title.trim().length > 0 && form.due >= form.start;

  const submit = () => {
    if (!valid) return;
    act({
      type: 'task.create',
      task: {
        projectId,
        milestoneId: form.milestoneId || null,
        title: form.title.trim(),
        description: form.description.trim(),
        assigneeId: form.assigneeId || null,
        start: form.start,
        due: form.due,
        priority: form.priority,
        status: form.status,
        estimate: Math.max(0, Number(form.estimate.replace(',', '.')) || 0),
        clientVisible: form.clientVisible,
      },
    });
    toast.success(t('created', { title: form.title.trim() }));
    onClose();
  };

  return (
    <Modal
      title={t('title')}
      subtitle={t('subtitle', { column: label(state.sector, form.status) })}
      onClose={onClose}
      labelId="gp-new-task"
      footer={
        <>
          <button type="button" className={btn.outline} onClick={onClose}>
            {t('cancel')}
          </button>
          <button type="submit" form="gp-new-task-form" className={btn.primary} disabled={!valid}>
            {t('create')}
          </button>
        </>
      }
    >
      <form
        id="gp-new-task-form"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="sm:col-span-2">
          <label htmlFor="gp-nt-title" className={labelCls}>
            {t('taskTitle')}
          </label>
          <input id="gp-nt-title" required autoFocus className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder={t('titlePlaceholder')} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="gp-nt-desc" className={labelCls}>
            {t('description')}
          </label>
          <textarea id="gp-nt-desc" rows={2} className={inputCls} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div>
          <label htmlFor="gp-nt-assignee" className={labelCls}>
            {t('assignee')}
          </label>
          <select id="gp-nt-assignee" className={selectCls} value={form.assigneeId} onChange={(e) => set('assigneeId', e.target.value)}>
            <option value="">{t('unassigned')}</option>
            {ws.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="gp-nt-status" className={labelCls}>
            {t('status')}
          </label>
          <select id="gp-nt-status" className={selectCls} value={form.status} onChange={(e) => set('status', e.target.value as StatusId)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {label(state.sector, s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="gp-nt-start" className={labelCls}>
            {t('start')}
          </label>
          <input id="gp-nt-start" type="date" className={inputCls} value={form.start} onChange={(e) => e.target.value && set('start', e.target.value)} />
        </div>
        <div>
          <label htmlFor="gp-nt-due" className={labelCls}>
            {t('due')}
          </label>
          <input id="gp-nt-due" type="date" className={inputCls} value={form.due} min={form.start} onChange={(e) => e.target.value && set('due', e.target.value)} />
          {form.due < form.start && <p className="text-[11px] text-red-600 mt-0.5">{t('dueBeforeStart')}</p>}
        </div>
        <div>
          <label htmlFor="gp-nt-priority" className={labelCls}>
            {t('priority')}
          </label>
          <select id="gp-nt-priority" className={selectCls} value={form.priority} onChange={(e) => set('priority', e.target.value as Priority)}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {tp(p)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="gp-nt-est" className={labelCls}>
            {t('estimate')}
          </label>
          <input id="gp-nt-est" inputMode="decimal" className={inputCls} value={form.estimate} onChange={(e) => set('estimate', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="gp-nt-ms" className={labelCls}>
            {t('milestone')}
          </label>
          <select id="gp-nt-ms" className={selectCls} value={form.milestoneId} onChange={(e) => set('milestoneId', e.target.value)}>
            <option value="">{t('noMilestone')}</option>
            {milestones.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <label className="sm:col-span-2 inline-flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input type="checkbox" checked={form.clientVisible || form.status === 'client'} disabled={form.status === 'client'} onChange={(e) => set('clientVisible', e.target.checked)} className="mt-0.5 rounded text-teal-600" />
          <span>
            {t('clientVisible')}
            <span className="block text-[11px] text-slate-500">{t('clientVisibleHint')}</span>
          </span>
        </label>
        {form.due < today && form.status !== 'done' && <p className="sm:col-span-2 text-[11px] text-amber-700 dark:text-amber-300">{t('pastDue')}</p>}
      </form>
    </Modal>
  );
}
