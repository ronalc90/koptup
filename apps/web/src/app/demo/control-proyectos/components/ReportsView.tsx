'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, BanknotesIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { addDays, localToday } from '../lib/dates';
import {
  burndown,
  downloadBlob,
  hoursByMember,
  memberById,
  nextInvoiceNumber,
  projectStats,
  slugify,
  toCSV,
  workload,
  type MilestoneStats,
} from '../lib/engine';
import { useDemo } from '../lib/store';
import { STATUSES, type Milestone } from '../lib/types';
import { useDocs } from './docs';
import { Bar, Initials, Modal, STATUS_BAR, SectionTitle, Stat, btn, card, inputCls, labelCls, useFmt, useStatusLabel, selectCls } from './ui';

export default function ReportsView() {
  const t = useTranslations('demoProjectsPro.reports');
  const f = useFmt();
  const { ws, state, today } = useDemo();
  const label = useStatusLabel();
  const project = ws.projects.find((p) => p.id === ws.currentProjectId) ?? ws.projects[0];
  const stats = useMemo(() => projectStats(ws, project, today), [ws, project, today]);
  const ids = useMemo(() => new Set(stats.tasks.map((x) => x.id)), [stats.tasks]);
  const weekFrom = addDays(today, -6);
  const hours7 = hoursByMember(ws, ids, weekFrom, today);
  const hoursTotal7 = hours7.reduce((s, h) => s + h.hours, 0);
  const load = workload(ws, today);
  const [billing, setBilling] = useState<Milestone | null>(null);

  const exportHours = () => {
    const rate = new Map(ws.members.map((m) => [m.id, m.rate]));
    const rows = ws.time
      .filter((e) => ids.has(e.taskId))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => {
        const task = ws.tasks.find((x) => x.id === e.taskId)!;
        return [e.date, memberById(ws, e.memberId)?.name ?? '', task.title, ws.milestones.find((m) => m.id === task.milestoneId)?.name ?? '', e.hours, Math.round(e.hours * (rate.get(e.memberId) ?? 0)), e.note];
      });
    downloadBlob(toCSV([[t('csvDate'), t('csvWho'), t('csvTask'), t('csvMilestone'), t('csvHours'), t('csvCost'), t('csvNote')], ...rows]), `${t('hoursFile')}-${slugify(project.name)}.csv`, 'text/csv;charset=utf-8');
  };

  const maxStatus = Math.max(1, ...STATUSES.map((s) => stats.tasks.filter((x) => x.status === s).length));

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label={t('kpiProgress')} value={`${stats.progress}%`} sub={t('kpiProgressSub')} />
        <Stat label={t('kpiOverdue')} value={stats.overdue.length} tone={stats.overdue.length ? 'red' : 'emerald'} sub={t('kpiOverdueSub')} />
        <Stat label={t('kpiHours')} value={f.hours(hoursTotal7)} sub={t('kpiHoursSub')} />
        <Stat label={t('kpiBudget')} value={`${stats.spent}%`} tone={stats.spent > stats.progress + 10 ? 'amber' : undefined} sub={t('kpiBudgetSub', { cost: f.moneyShort(stats.cost), budget: f.moneyShort(stats.budget) })} />
      </div>

      <section className={`${card} p-4`}>
        <SectionTitle title={t('milestonesTitle')} subtitle={t('milestonesSub')} />
        <div className="space-y-3">
          {stats.milestones.map((m) => (
            <MilestoneRow key={m.milestone.id} m={m} onBill={() => setBilling(m.milestone)} />
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className={`${card} p-4`}>
          <SectionTitle title={t('statusTitle')} subtitle={t('statusSub', { count: stats.tasks.length })} />
          <ul className="space-y-2">
            {STATUSES.map((s) => {
              const n = stats.tasks.filter((x) => x.status === s).length;
              return (
                <li key={s} className="grid grid-cols-[8rem_1fr_2rem] items-center gap-2 text-sm">
                  <span className="truncate text-slate-700 dark:text-slate-200">{label(state.sector, s)}</span>
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded">
                    <div className={`h-full rounded ${STATUS_BAR[s]}`} style={{ width: `${(n / maxStatus) * 100}%` }} />
                  </div>
                  <span className="text-right font-semibold text-slate-900 dark:text-white">{n}</span>
                </li>
              );
            })}
          </ul>
        </section>

        {stats.current && <BurndownCard m={stats.current.milestone} />}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className={`${card} p-4`}>
          <SectionTitle title={t('loadTitle')} subtitle={t('loadSub')} />
          <ul className="space-y-3">
            {load.map((w) => (
              <li key={w.member.id}>
                <div className="flex items-center justify-between gap-2 text-sm mb-1">
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <Initials name={w.member.name} size="xs" />
                    <span className="truncate text-slate-800 dark:text-slate-100">{w.member.name}</span>
                  </span>
                  <span className={`text-xs font-semibold whitespace-nowrap ${w.load > 100 ? 'text-red-600 dark:text-red-400' : w.load > 80 ? 'text-amber-700 dark:text-amber-300' : 'text-slate-600 dark:text-slate-300'}`}>
                    {t('loadValue', { pending: f.num(w.pending), capacity: f.num(w.capacity), pct: w.load })}
                  </span>
                </div>
                <Bar value={w.load} tone={w.load > 100 ? 'red' : w.load > 80 ? 'amber' : 'teal'} />
              </li>
            ))}
          </ul>
        </section>

        <section className={`${card} p-4`}>
          <SectionTitle
            title={t('hoursTitle')}
            subtitle={t('hoursSub', { from: f.date(weekFrom, 'short'), to: f.date(today, 'short') })}
            action={
              <button type="button" className={btn.small} onClick={exportHours}>
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                {t('exportHours')}
              </button>
            }
          />
          {hours7.length === 0 ? (
            <p className="text-sm text-slate-500">{t('noHours')}</p>
          ) : (
            <ul className="space-y-2">
              {hours7.map((h) => (
                <li key={h.member.id} className="grid grid-cols-[1fr_4rem] gap-2 items-center text-sm">
                  <div>
                    <p className="text-slate-800 dark:text-slate-100">{h.member.name}</p>
                    <Bar value={(h.hours / Math.max(...hours7.map((x) => x.hours))) * 100} tone="emerald" />
                  </div>
                  <span className="text-right font-semibold text-slate-900 dark:text-white">{f.hours(h.hours)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Expenses key={ws.currentProjectId} />

      {billing && <BillingModal milestone={billing} onClose={() => setBilling(null)} />}
    </div>
  );
}

function MilestoneRow({ m, onBill }: { m: MilestoneStats; onBill: () => void }) {
  const t = useTranslations('demoProjectsPro.reports');
  const f = useFmt();
  const { downloadInvoice } = useDocs();
  const ms = m.milestone;
  const state = ms.invoice ? 'invoiced' : m.complete || ms.closed ? 'complete' : m.late ? 'late' : 'open';
  const stateCls = {
    invoiced: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    complete: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
    late: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
    open: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  }[state];
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm text-slate-900 dark:text-white">{ms.name}</p>
          <p className="text-xs text-slate-500">
            {f.date(ms.start, 'short')} – {f.date(ms.end, 'short')} · {t('tasksCount', { count: m.tasks.length })}
          </p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${stateCls}`}>{state === 'invoiced' ? t('stateInvoiced', { number: ms.invoice!.number }) : t(`state.${state}`)}</span>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mt-2">
        <div>
          <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 mb-0.5">
            <span>{t('progress')}</span>
            <span className="font-semibold">{m.progress}%</span>
          </div>
          <Bar value={m.progress} />
        </div>
        <div>
          <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 mb-0.5">
            <span>{t('spent', { cost: f.money(m.cost), budget: f.money(ms.budget) })}</span>
            <span className={`font-semibold ${m.spent > 100 ? 'text-red-600' : ''}`}>{m.spent}%</span>
          </div>
          <Bar value={m.spent} tone={m.spent > 100 ? 'red' : m.spent > m.progress + 10 ? 'amber' : 'emerald'} />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-xs">
        <span className="text-slate-600 dark:text-slate-300">{t('billing', { value: f.money(ms.billing) })}</span>
        {ms.invoice ? (
          <button type="button" className={btn.small} onClick={() => downloadInvoice(ms)}>
            <DocumentTextIcon className="w-3.5 h-3.5" />
            {t('downloadInvoice')}
          </button>
        ) : m.complete || ms.closed ? (
          <button type="button" className={btn.small} onClick={onBill}>
            <BanknotesIcon className="w-3.5 h-3.5" />
            {t('bill')}
          </button>
        ) : (
          <span className="text-slate-500">{t('billWhenDone')}</span>
        )}
      </div>
    </div>
  );
}

function BurndownCard({ m }: { m: Milestone }) {
  const t = useTranslations('demoProjectsPro.reports');
  const f = useFmt();
  const { ws, today } = useDemo();
  const bd = burndown(ws, m, today);
  const W = 520;
  const H = 200;
  const P = { l: 40, r: 10, t: 10, b: 28 };
  const n = Math.max(1, bd.days.length - 1);
  const max = Math.max(1, bd.total);
  const X = (i: number) => P.l + (i / n) * (W - P.l - P.r);
  const Y = (v: number) => P.t + (1 - v / max) * (H - P.t - P.b);
  const line = (arr: (number | null)[]) =>
    arr
      .map((v, i) => (v === null ? null : `${X(i).toFixed(1)},${Y(v).toFixed(1)}`))
      .filter(Boolean)
      .join(' ');
  const yTicks = [0, 0.5, 1].map((p) => Math.round(max * p));
  const xTicks = [0, Math.floor(n / 2), n];
  const todayIdx = bd.days.indexOf(today);
  return (
    <section className={`${card} p-4`}>
      <SectionTitle title={t('burndownTitle', { name: m.name })} subtitle={t('burndownSub', { remaining: f.num(bd.remaining), total: f.num(bd.total) })} />
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={t('burndownAria', { name: m.name, remaining: bd.remaining, total: bd.total })}>
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={P.l} x2={W - P.r} y1={Y(v)} y2={Y(v)} stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
            <text x={P.l - 6} y={Y(v) + 4} textAnchor="end" fontSize="11" className="fill-slate-500">
              {v} h
            </text>
          </g>
        ))}
        {xTicks.map((i) => (
          <text key={i} x={X(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === n ? 'end' : 'middle'} fontSize="11" className="fill-slate-500">
            {f.date(bd.days[i], 'short')}
          </text>
        ))}
        {todayIdx >= 0 && <line x1={X(todayIdx)} x2={X(todayIdx)} y1={P.t} y2={H - P.b} stroke="rgb(239,68,68)" strokeDasharray="3 3" />}
        <polyline points={line(bd.ideal)} fill="none" stroke="rgb(148,163,184)" strokeWidth="2" strokeDasharray="5 4" />
        <polyline points={line(bd.actual)} fill="none" stroke="rgb(13,148,136)" strokeWidth="2.5" />
      </svg>
      <div className="flex flex-wrap gap-4 text-[11px] text-slate-600 dark:text-slate-300 mt-1">
        <span className="inline-flex items-center gap-1">
          <span className="w-4 h-0.5 bg-slate-400" aria-hidden="true" />
          {t('ideal')}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-4 h-0.5 bg-teal-600" aria-hidden="true" />
          {t('actual')}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-4 h-0.5 bg-red-500" aria-hidden="true" />
          {t('todayLine')}
        </span>
      </div>
    </section>
  );
}

function Expenses() {
  const t = useTranslations('demoProjectsPro.reports');
  const f = useFmt();
  const { ws, act } = useDemo();
  const milestones = ws.milestones.filter((m) => m.projectId === ws.currentProjectId);
  const list = ws.expenses.filter((x) => x.projectId === ws.currentProjectId).sort((a, b) => b.date.localeCompare(a.date));
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [ms, setMs] = useState(milestones.find((m) => !m.closed)?.id ?? milestones[0]?.id ?? '');
  const [showAll, setShowAll] = useState(false);
  const value = Number(amount.replace(/[^\d]/g, ''));
  return (
    <section className={`${card} p-4`}>
      <SectionTitle title={t('expensesTitle')} subtitle={t('expensesSub')} />
      {list.length === 0 ? (
        <p className="text-sm text-slate-500 mb-3">{t('noExpenses')}</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-sm mb-3">
          {(showAll ? list : list.slice(0, 5)).map((x) => (
            <li key={x.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-2">
              <span className="text-xs text-slate-500 w-16 shrink-0">{f.date(x.date, 'short')}</span>
              <span className="flex-1 min-w-0 text-slate-800 dark:text-slate-100">{x.concept}</span>
              <span className="text-xs text-slate-500">{ws.milestones.find((m) => m.id === x.milestoneId)?.name}</span>
              <span className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">{f.money(x.amount)}</span>
            </li>
          ))}
        </ul>
      )}
      {list.length > 5 && (
        <button type="button" className={`${btn.link} mb-3`} onClick={() => setShowAll((v) => !v)}>
          {showAll ? t('showLess') : t('showAll', { count: list.length })}
        </button>
      )}
      {milestones.length > 0 && (
        <form
          className="grid sm:grid-cols-[1fr_10rem_12rem_auto] gap-2 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (!concept.trim() || !(value > 0) || !ms) return;
            act({ type: 'expense.add', projectId: ws.currentProjectId, milestoneId: ms, date: localToday(), concept, amount: value });
            toast.success(t('expenseAdded'));
            setConcept('');
            setAmount('');
          }}
        >
          <div>
            <label htmlFor="gp-x-concept" className={labelCls}>
              {t('concept')}
            </label>
            <input id="gp-x-concept" className={inputCls} value={concept} onChange={(e) => setConcept(e.target.value)} placeholder={t('conceptPlaceholder')} />
          </div>
          <div>
            <label htmlFor="gp-x-amount" className={labelCls}>
              {t('amount')}
            </label>
            <input id="gp-x-amount" inputMode="numeric" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1.500.000" />
          </div>
          <div>
            <label htmlFor="gp-x-ms" className={labelCls}>
              {t('milestone')}
            </label>
            <select id="gp-x-ms" className={selectCls} value={ms} onChange={(e) => setMs(e.target.value)}>
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={btn.primary} disabled={!concept.trim() || !(value > 0)}>
            {t('addExpense')}
          </button>
        </form>
      )}
    </section>
  );
}

function BillingModal({ milestone, onClose }: { milestone: Milestone; onClose: () => void }) {
  const t = useTranslations('demoProjectsPro.billing');
  const f = useFmt();
  const { ws, act } = useDemo();
  const { downloadInvoice } = useDocs();
  const project = ws.projects.find((p) => p.id === milestone.projectId)!;
  const number = nextInvoiceNumber(ws);
  const iva = Math.round(milestone.billing * 0.19);
  const live = ws.milestones.find((m) => m.id === milestone.id) ?? milestone;
  return (
    <Modal
      title={live.invoice ? t('doneTitle', { number: live.invoice.number }) : t('title')}
      subtitle={`${project.name} · ${milestone.name}`}
      onClose={onClose}
      labelId="gp-billing"
      footer={
        live.invoice ? (
          <>
            <button type="button" className={btn.outline} onClick={onClose}>
              {t('close')}
            </button>
            <button type="button" className={btn.primary} onClick={() => downloadInvoice(live)}>
              <ArrowDownTrayIcon className="w-4 h-4" />
              {t('downloadPdf')}
            </button>
          </>
        ) : (
          <>
            <button type="button" className={btn.outline} onClick={onClose}>
              {t('cancel')}
            </button>
            <button
              type="button"
              className={btn.primary}
              onClick={() => {
                act({ type: 'milestone.invoice', id: milestone.id, number });
                toast.success(t('done', { number }));
              }}
            >
              {t('confirm', { number })}
            </button>
          </>
        )
      }
    >
      <dl className="grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-slate-500">{t('client')}</dt>
        <dd className="text-right text-slate-900 dark:text-white">{project.client}</dd>
        <dt className="text-slate-500">{t('concept')}</dt>
        <dd className="text-right text-slate-900 dark:text-white">{t('conceptValue', { name: milestone.name })}</dd>
        <dt className="text-slate-500">{t('subtotal')}</dt>
        <dd className="text-right text-slate-900 dark:text-white">{f.money(milestone.billing)}</dd>
        <dt className="text-slate-500">{t('iva')}</dt>
        <dd className="text-right text-slate-900 dark:text-white">{f.money(iva)}</dd>
        <dt className="font-semibold text-slate-700 dark:text-slate-200">{t('total')}</dt>
        <dd className="text-right font-bold text-slate-900 dark:text-white">{f.money(milestone.billing + iva)}</dd>
      </dl>
      <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1">
        <p className="font-semibold">{t('simulatedTitle')}</p>
        <p>{t('simulatedBody')}</p>
      </div>
      {live.invoice && <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">{t('sentNote', { who: project.clientContact })}</p>}
    </Modal>
  );
}
