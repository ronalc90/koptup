'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { addDays } from '../lib/dates';
import { projectMilestones } from '../lib/engine';
import { useDemo } from '../lib/store';
import type { Milestone } from '../lib/types';
import { COLORS } from './NewProjectModal';
import { Initials, Modal, btn, inputCls, labelCls, useFmt } from './ui';

type Tab = 'general' | 'milestones' | 'team' | 'integrations';
const TABS: Tab[] = ['general', 'milestones', 'team', 'integrations'];

/** Plan según el catálogo de "Gestión de proyectos"; 'custom' = se cotiza aparte en la implementación. */
const INTEGRATIONS = [
  { key: 'workspace', plan: 'custom' },
  { key: 'whatsapp', plan: 'custom' },
  { key: 'accounting', plan: 'custom' },
  { key: 'payments', plan: 'custom' },
  { key: 'chat', plan: 'pro' },
  { key: 'devtools', plan: 'pro' },
  { key: 'bi', plan: 'enterprise' },
  { key: 'sso', plan: 'enterprise' },
] as const;

export default function ProjectSettings({ onClose }: { onClose: () => void }) {
  const t = useTranslations('demoProjectsPro.settings');
  const { ws } = useDemo();
  const project = ws.projects.find((p) => p.id === ws.currentProjectId) ?? ws.projects[0];
  const [tab, setTab] = useState<Tab>('general');
  return (
    <Modal title={t('title')} subtitle={project.name} onClose={onClose} size="lg" labelId="gp-settings">
      <div role="tablist" aria-label={t('title')} className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800 mb-4 -mt-1">
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${tab === id ? 'border-teal-600 text-teal-700 dark:text-teal-300' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            {t(`tab.${id}`)}
          </button>
        ))}
      </div>
      {tab === 'general' && <General onDeleted={onClose} />}
      {tab === 'milestones' && <Milestones />}
      {tab === 'team' && <Team />}
      {tab === 'integrations' && <Integrations />}
    </Modal>
  );
}

function General({ onDeleted }: { onDeleted: () => void }) {
  const t = useTranslations('demoProjectsPro.settings');
  const tColor = useTranslations('demoProjectsPro.colors');
  const { ws, act } = useDemo();
  const project = ws.projects.find((p) => p.id === ws.currentProjectId) ?? ws.projects[0];
  const [form, setForm] = useState({ name: project.name, client: project.client, clientContact: project.clientContact, city: project.city, description: project.description, color: project.color });
  const [confirm, setConfirm] = useState(false);
  const dirty = (Object.keys(form) as (keyof typeof form)[]).some((k) => form[k] !== project[k]);
  return (
    <form
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.client.trim()) return;
        act({ type: 'project.update', id: project.id, patch: { ...form, name: form.name.trim(), client: form.client.trim(), clientContact: form.clientContact.trim() || form.client.trim() } });
        toast.success(t('saved'));
      }}
    >
      <div className="sm:col-span-2">
        <label htmlFor="gp-s-name" className={labelCls}>
          {t('name')}
        </label>
        <input id="gp-s-name" required className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <label htmlFor="gp-s-client" className={labelCls}>
          {t('client')}
        </label>
        <input id="gp-s-client" required className={inputCls} value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} />
      </div>
      <div>
        <label htmlFor="gp-s-contact" className={labelCls}>
          {t('contact')}
        </label>
        <input id="gp-s-contact" className={inputCls} value={form.clientContact} onChange={(e) => setForm({ ...form, clientContact: e.target.value })} />
      </div>
      <div>
        <label htmlFor="gp-s-city" className={labelCls}>
          {t('city')}
        </label>
        <input id="gp-s-city" className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
      </div>
      <fieldset>
        <legend className={labelCls}>{t('color')}</legend>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <label key={c} className="cursor-pointer">
              <input type="radio" name="gp-s-color" value={c} checked={form.color === c} onChange={() => setForm({ ...form, color: c })} className="sr-only peer" />
              <span className={`block w-7 h-7 rounded-full ${c} ring-offset-2 dark:ring-offset-slate-900 peer-checked:ring-2 peer-checked:ring-slate-900 dark:peer-checked:ring-white peer-focus-visible:ring-2 peer-focus-visible:ring-teal-500`} title={tColor(c.replace('bg-', '').replace('-500', ''))} />
              <span className="sr-only">{tColor(c.replace('bg-', '').replace('-500', ''))}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="sm:col-span-2">
        <label htmlFor="gp-s-desc" className={labelCls}>
          {t('description')}
        </label>
        <textarea id="gp-s-desc" rows={3} className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="sm:col-span-2 flex flex-wrap justify-between gap-2 pt-1">
        <button type="button" className={`${btn.outline} text-red-600 dark:text-red-400`} onClick={() => setConfirm(true)} disabled={ws.projects.length <= 1} title={ws.projects.length <= 1 ? t('cantDeleteLast') : undefined}>
          <TrashIcon className="w-4 h-4" />
          {t('delete')}
        </button>
        <button type="submit" className={btn.primary} disabled={!dirty || !form.name.trim() || !form.client.trim()}>
          {t('save')}
        </button>
      </div>
      {confirm && (
        <Modal
          title={t('deleteTitle')}
          onClose={() => setConfirm(false)}
          size="sm"
          labelId="gp-del-project"
          footer={
            <>
              <button type="button" className={btn.outline} onClick={() => setConfirm(false)}>
                {t('cancel')}
              </button>
              <button
                type="button"
                className={btn.danger}
                onClick={() => {
                  act({ type: 'project.delete', id: project.id });
                  setConfirm(false);
                  toast.success(t('deleted', { name: project.name }));
                  onDeleted();
                }}
              >
                {t('deleteConfirm')}
              </button>
            </>
          }
        >
          <p className="text-sm text-slate-700 dark:text-slate-300">{t('deleteBody', { name: project.name })}</p>
        </Modal>
      )}
    </form>
  );
}

function Milestones() {
  const t = useTranslations('demoProjectsPro.settings');
  const f = useFmt();
  const { ws, today, act } = useDemo();
  const list = projectMilestones(ws, ws.currentProjectId);
  const sprints = list.length > 0 && list.every((m) => m.kind === 'sprint');
  const last = list[list.length - 1];
  const nextSprintNum = Math.max(0, ...list.map((m) => Number(m.name.replace(/\D/g, '')) || 0)) + 1;
  const [form, setForm] = useState({ name: '', start: today, end: addDays(today, 30), budget: '', billing: '' });
  const num = (s: string) => Number(s.replace(/[^\d]/g, '')) || 0;
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 dark:text-slate-400">{t('milestonesHint')}</p>
      <ul className="space-y-2">
        {list.map((m) => (
          <MilestoneEditor key={m.id} m={m} />
        ))}
      </ul>
      {sprints && last ? (
        <button
          type="button"
          className={btn.outline}
          onClick={() => {
            const start = addDays(last.end, 1);
            act({ type: 'milestone.add', projectId: ws.currentProjectId, milestone: { name: t('sprintName', { n: nextSprintNum }), kind: 'sprint', start, end: addDays(start, 13), budget: last.budget, billing: last.billing } });
            toast.success(t('sprintAdded', { n: nextSprintNum }));
          }}
        >
          <PlusIcon className="w-4 h-4" />
          {t('addSprint', { n: nextSprintNum, from: f.date(addDays(last.end, 1), 'short') })}
        </button>
      ) : (
        <form
          className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-end rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim() || form.end < form.start) return;
            act({ type: 'milestone.add', projectId: ws.currentProjectId, milestone: { name: form.name.trim(), kind: 'milestone', start: form.start, end: form.end, budget: num(form.budget), billing: num(form.billing) } });
            toast.success(t('milestoneAdded'));
            setForm({ ...form, name: '', budget: '', billing: '' });
          }}
        >
          <div className="col-span-2">
            <label htmlFor="gp-m-name" className={labelCls}>
              {t('milestoneName')}
            </label>
            <input id="gp-m-name" className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label htmlFor="gp-m-start" className={labelCls}>
              {t('start')}
            </label>
            <input id="gp-m-start" type="date" className={inputCls} value={form.start} onChange={(e) => e.target.value && setForm({ ...form, start: e.target.value })} />
          </div>
          <div>
            <label htmlFor="gp-m-end" className={labelCls}>
              {t('end')}
            </label>
            <input id="gp-m-end" type="date" min={form.start} className={inputCls} value={form.end} onChange={(e) => e.target.value && setForm({ ...form, end: e.target.value })} />
          </div>
          <div>
            <label htmlFor="gp-m-budget" className={labelCls}>
              {t('budget')}
            </label>
            <input id="gp-m-budget" inputMode="numeric" className={inputCls} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
          </div>
          <div>
            <label htmlFor="gp-m-billing" className={labelCls}>
              {t('billing')}
            </label>
            <input id="gp-m-billing" inputMode="numeric" className={inputCls} value={form.billing} onChange={(e) => setForm({ ...form, billing: e.target.value })} />
          </div>
          <button type="submit" className={`${btn.primary} col-span-2 sm:col-span-6 justify-self-end`} disabled={!form.name.trim() || form.end < form.start}>
            <PlusIcon className="w-4 h-4" />
            {t('addMilestone')}
          </button>
        </form>
      )}
    </div>
  );
}

function MilestoneEditor({ m }: { m: Milestone }) {
  const t = useTranslations('demoProjectsPro.settings');
  const f = useFmt();
  const { act } = useDemo();
  const [budget, setBudget] = useState(String(m.budget));
  const [billing, setBilling] = useState(String(m.billing));
  const num = (s: string) => Number(s.replace(/[^\d]/g, '')) || 0;
  const changed = num(budget) !== m.budget || num(billing) !== m.billing;
  return (
    <li className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
      <div className="flex flex-wrap justify-between gap-2">
        <p className="font-semibold text-sm text-slate-900 dark:text-white">{m.name}</p>
        <p className="text-xs text-slate-500">
          {f.date(m.start, 'short')} – {f.date(m.end, 'short')}
          {m.closed && ` · ${t('closed')}`}
          {m.invoice && ` · ${m.invoice.number}`}
        </p>
      </div>
      <form
        className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end mt-2"
        onSubmit={(e) => {
          e.preventDefault();
          act({ type: 'milestone.update', id: m.id, patch: { budget: num(budget), billing: num(billing) } });
          toast.success(t('milestoneSaved'));
        }}
      >
        <div>
          <label htmlFor={`gp-mb-${m.id}`} className={labelCls}>
            {t('budget')}
          </label>
          <input id={`gp-mb-${m.id}`} inputMode="numeric" className={inputCls} value={budget} onChange={(e) => setBudget(e.target.value)} />
        </div>
        <div>
          <label htmlFor={`gp-mf-${m.id}`} className={labelCls}>
            {t('billing')}
          </label>
          <input id={`gp-mf-${m.id}`} inputMode="numeric" className={inputCls} value={billing} onChange={(e) => setBilling(e.target.value)} disabled={!!m.invoice} />
        </div>
        <button type="submit" className={`${btn.outline} col-span-2 sm:col-span-1`} disabled={!changed}>
          {t('save')}
        </button>
      </form>
      <p className="text-[11px] text-slate-500 mt-1">{t('moneyPreview', { budget: f.money(num(budget)), billing: f.money(num(billing)) })}</p>
    </li>
  );
}

function Team() {
  const t = useTranslations('demoProjectsPro.settings');
  const tRole = useTranslations('demoProjectsPro.roles');
  const f = useFmt();
  const { ws } = useDemo();
  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{t('teamHint')}</p>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {ws.members.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-3 py-2.5">
            <Initials name={m.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {m.name}
                {m.me && <span className="ml-1.5 text-[11px] font-semibold text-teal-700 dark:text-teal-300">{t('you')}</span>}
              </p>
              <p className="text-xs text-slate-500">{tRole(m.role)}</p>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 text-right">
              {t('rate', { rate: f.money(m.rate) })}
              <br />
              {t('capacity', { hours: m.capacity })}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Integrations() {
  const t = useTranslations('demoProjectsPro.settings');
  const tInt = useTranslations('demoProjectsPro.integrations');
  return (
    <div>
      <p className="text-sm text-slate-700 dark:text-slate-200 mb-3">{tInt('intro')}</p>
      <ul className="grid sm:grid-cols-2 gap-2">
        {INTEGRATIONS.map((i) => (
          <li key={i.key} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{tInt(`${i.key}.name`)}</p>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap">{t(`plan.${i.plan}`)}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tInt(`${i.key}.desc`)}</p>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-3">{tInt('note')}</p>
    </div>
  );
}
