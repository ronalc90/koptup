'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { DocumentPlusIcon, PlusIcon, PuzzlePieceIcon } from '@heroicons/react/24/outline';
import { workday } from '../lib/dates';
import { me } from '../lib/engine';
import { TEMPLATES, type Template } from '../lib/seed';
import { useDemo } from '../lib/store';
import { Modal, btn, inputCls, labelCls } from './ui';

export const COLORS = ['bg-teal-500', 'bg-sky-500', 'bg-indigo-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-lime-500'] as const;

export default function NewProjectModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('demoProjectsPro.newProject');
  const tTpl = useTranslations('demoProjectsPro.templates');
  const tColor = useTranslations('demoProjectsPro.colors');
  const { ws, state, today, act, setSection, setView } = useDemo();
  const [tpl, setTpl] = useState<Template | 'blank' | null>(null);
  const [form, setForm] = useState({ name: '', client: '', contact: '', city: ws.company.city, color: COLORS[0] as string, budget: '' });
  const templates = TEMPLATES[state.sector];

  const choose = (x: Template | 'blank') => {
    setTpl(x);
    setForm((f) => ({ ...f, name: x === 'blank' ? '' : tTpl(`${x.id}.name`) }));
  };

  const create = () => {
    if (!tpl || !form.name.trim() || !form.client.trim()) return;
    const roleMember = (role: string) => ws.members.find((m) => m.role === role)?.id ?? me(ws).id;
    const budget = Number(form.budget.replace(/[^\d]/g, '')) || 0;
    const ms =
      tpl === 'blank'
        ? [{ name: t('blankMilestone'), kind: 'milestone' as const, start: today, end: workday(today, 30), budget, billing: 0 }]
        : tpl.ms.map((m) => ({ name: m.name, kind: m.kind ?? ('milestone' as const), start: workday(today, m.s), end: workday(today, m.e), budget: tpl.ms.length ? Math.round(budget / tpl.ms.length) : 0, billing: 0 }));
    const tasks =
      tpl === 'blank'
        ? []
        : tpl.tasks.map((x) => ({
            title: x.t,
            description: x.d,
            assigneeId: roleMember(x.role),
            start: workday(today, x.s),
            due: workday(today, x.e),
            priority: 'medium' as const,
            status: 'todo' as const,
            estimate: x.est,
            clientVisible: !!x.cv,
            depIdx: x.dep,
            msIdx: x.ms,
          }));
    const end = ms.reduce((a, m) => (m.end > a ? m.end : a), today);
    act({
      type: 'project.create',
      project: { name: form.name.trim(), client: form.client.trim(), clientContact: form.contact.trim() || form.client.trim(), city: form.city.trim(), description: tpl === 'blank' ? '' : tTpl(`${tpl.id}.desc`), color: form.color, start: today, end },
      milestones: ms,
      tasks,
    });
    setSection('project');
    setView('kanban');
    toast.success(t('created', { name: form.name.trim(), count: tasks.length }));
    onClose();
  };

  return (
    <Modal
      title={t('title')}
      subtitle={tpl ? t('step2') : t('step1')}
      onClose={onClose}
      size="lg"
      labelId="gp-new-project"
      footer={
        tpl ? (
          <>
            <button type="button" className={btn.outline} onClick={() => setTpl(null)}>
              {t('back')}
            </button>
            <button type="submit" form="gp-np-form" className={btn.primary} disabled={!form.name.trim() || !form.client.trim()}>
              {t('create')}
            </button>
          </>
        ) : undefined
      }
    >
      {!tpl ? (
        <div>
          <button
            type="button"
            onClick={() => choose('blank')}
            className="w-full mb-4 p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-all flex items-center gap-3 text-left"
          >
            <span className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <PlusIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
            </span>
            <span>
              <span className="block font-semibold text-slate-900 dark:text-white">{t('blank')}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">{t('blankDesc')}</span>
            </span>
          </button>
          <p className="text-[11px] uppercase font-semibold text-slate-500 dark:text-slate-400 mb-2 tracking-wide">{t('templatesFor')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {templates.map((x) => (
              <button key={x.id} type="button" onClick={() => choose(x)} className="text-left rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-teal-500 hover:shadow-md transition-all">
                <PuzzlePieceIcon className="w-6 h-6 text-teal-600 mb-2" />
                <span className="block font-semibold text-sm text-slate-900 dark:text-white">{tTpl(`${x.id}.name`)}</span>
                <span className="block text-xs text-slate-500 mt-1">{tTpl(`${x.id}.desc`)}</span>
                <span className="block text-[11px] text-teal-700 dark:text-teal-300 font-semibold mt-2">{t('includes', { tasks: x.tasks.length, milestones: x.ms.length })}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <form
          id="gp-np-form"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            create();
          }}
        >
          <p className="sm:col-span-2 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <DocumentPlusIcon className="w-5 h-5 text-teal-600" />
            {tpl === 'blank' ? t('blank') : t('fromTemplate', { name: tTpl(`${tpl.id}.name`), tasks: tpl.tasks.length })}
          </p>
          <div className="sm:col-span-2">
            <label htmlFor="gp-np-name" className={labelCls}>
              {t('name')}
            </label>
            <input id="gp-np-name" required autoFocus className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label htmlFor="gp-np-client" className={labelCls}>
              {t('client')}
            </label>
            <input id="gp-np-client" required className={inputCls} value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} placeholder={t('clientPlaceholder')} />
          </div>
          <div>
            <label htmlFor="gp-np-contact" className={labelCls}>
              {t('contact')}
            </label>
            <input id="gp-np-contact" className={inputCls} value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder={t('contactPlaceholder')} />
          </div>
          <div>
            <label htmlFor="gp-np-city" className={labelCls}>
              {t('city')}
            </label>
            <input id="gp-np-city" className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <label htmlFor="gp-np-budget" className={labelCls}>
              {t('budget')}
            </label>
            <input id="gp-np-budget" inputMode="numeric" className={inputCls} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="45.000.000" />
          </div>
          <fieldset className="sm:col-span-2">
            <legend className={labelCls}>{t('color')}</legend>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <label key={c} className="cursor-pointer">
                  <input type="radio" name="gp-np-color" value={c} checked={form.color === c} onChange={() => setForm({ ...form, color: c })} className="sr-only peer" />
                  <span className={`block w-8 h-8 rounded-full ${c} ring-offset-2 dark:ring-offset-slate-900 peer-checked:ring-2 peer-checked:ring-slate-900 dark:peer-checked:ring-white peer-focus-visible:ring-2 peer-focus-visible:ring-teal-500`} title={tColor(c.replace('bg-', '').replace('-500', ''))} />
                  <span className="sr-only">{tColor(c.replace('bg-', '').replace('-500', ''))}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="sm:col-span-2 text-[11px] text-slate-500">{t('datesNote')}</p>
        </form>
      )}
    </Modal>
  );
}
