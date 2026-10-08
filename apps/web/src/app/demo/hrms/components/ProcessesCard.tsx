'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { diffDays } from '../lib/dates';
import { SITE_CITY } from '../lib/catalog';
import { useHr } from '../lib/store';
import { vacationBalance } from '../lib/selectors';
import { settlement } from '../lib/talent';
import { OFF_TASKS, ON_TASKS, type Offboarding, type OffTask, type Onboarding, type OnTask } from '../lib/types';
import { useDocuments } from './useDocuments';
import { Empty, Progress, SectionTitle, btn, useFmt, usePos } from './ui';

/** Ingresos y retiros con lista de chequeo colombiana y su estado real. */
export default function ProcessesCard() {
  const t = useTranslations('demoHrms.processes');
  const { state } = useHr();
  const [kind, setKind] = useState<'in' | 'out'>('in');
  const [showClosed, setShowClosed] = useState(false);
  const list = state.processes.filter((p) => p.kind === kind && p.closed === showClosed);
  const openCount = (k: 'in' | 'out') => state.processes.filter((p) => p.kind === k && !p.closed).length;
  const closedCount = state.processes.filter((p) => p.kind === kind && p.closed).length;

  return (
    <Card variant="bordered">
      <SectionTitle
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          <div role="group" aria-label={t('title')} className="flex gap-1 bg-secondary-100 dark:bg-secondary-800 rounded-lg p-1">
            {(['in', 'out'] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={kind === k}
                onClick={() => setKind(k)}
                className={`px-3 py-1 text-xs font-medium rounded ${kind === k ? 'bg-white dark:bg-secondary-700 shadow-sm text-secondary-900 dark:text-white' : 'text-secondary-600 dark:text-secondary-300'}`}
              >
                {t(k === 'in' ? 'onboarding' : 'offboarding')} ({openCount(k)})
              </button>
            ))}
          </div>
        }
      />
      <div className="space-y-3">
        {list.length === 0 && <Empty>{showClosed ? t('noneClosed') : t('none')}</Empty>}
        {list.map((p) => (p.kind === 'in' ? <OnCard key={p.id} p={p} /> : <OffCard key={p.id} p={p} />))}
      </div>
      <button type="button" className={`${btn.link} mt-3`} onClick={() => setShowClosed((s) => !s)}>
        {showClosed ? t('showOpen') : t('showClosed', { n: closedCount })}
      </button>
    </Card>
  );
}

function TaskButton({ done, label, note, onClick, disabled }: { done: boolean; label: string; note?: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={done}
      className={`flex items-start gap-2 text-left text-xs p-2 rounded-md border transition-colors ${
        done ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40' : 'border-secondary-200 dark:border-secondary-700 hover:border-violet-400'
      } disabled:cursor-default`}
    >
      {done ? <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" /> : <span className="w-4 h-4 rounded-full border-2 border-secondary-400 shrink-0" />}
      <span>
        <span className={done ? 'text-secondary-500 line-through' : 'text-secondary-800 dark:text-secondary-100'}>{label}</span>
        {note && <span className="block text-[10px] text-secondary-500 no-underline">{note}</span>}
      </span>
    </button>
  );
}

function OnCard({ p }: { p: Onboarding }) {
  const t = useTranslations('demoHrms.processes');
  const pos = usePos();
  const { state, dispatch } = useHr();
  const f = useFmt();
  const pct = Math.round((p.done.length / ON_TASKS.length) * 100);
  const daysTo = diffDays(state.baseDate, p.startDate);
  const toggle = (task: OnTask) => {
    if (p.closed) return;
    const wasDone = p.done.includes(task);
    dispatch({ type: 'process.toggle', id: p.id, task });
    if (task === 'contract' && !wasDone) toast.success(t('signed', { name: p.name }));
  };
  return (
    <div className="p-4 rounded-lg bg-secondary-50 dark:bg-secondary-800">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-semibold text-secondary-900 dark:text-white">{p.name}</p>
          <p className="text-xs text-secondary-500">{pos(p)} · {SITE_CITY[p.site]} · {t('starts', { date: f.date(p.startDate), n: daysTo })}</p>
        </div>
        <Badge variant={p.closed ? 'success' : p.done.includes('contract') ? 'info' : 'warning'} size="sm">
          {p.closed ? t('closedIn') : p.done.includes('contract') ? t('contractSigned') : t('contractPending')}
        </Badge>
      </div>
      <div className="flex items-center justify-between text-xs text-secondary-500 mb-1"><span>{t('progress')}</span><span>{pct}%</span></div>
      <Progress value={pct} tone={pct === 100 ? 'emerald' : 'violet'} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
        {ON_TASKS.map((task) => (
          <TaskButton
            key={task}
            done={p.done.includes(task)}
            disabled={p.closed}
            label={task === 'contract' && !p.done.includes(task) ? t('tasks.contractSend') : t(`tasks.${task}`)}
            note={task === 'arl' ? t('tasks.arlNote') : task === 'contract' ? t('tasks.contractNote') : undefined}
            onClick={() => toggle(task)}
          />
        ))}
      </div>
      {!p.closed && (
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <button
            type="button"
            className={btn.primary}
            disabled={p.done.length < ON_TASKS.length}
            onClick={() => {
              dispatch({ type: 'process.close', id: p.id });
              toast.success(t('activated', { name: p.name }));
            }}
          >
            {t('activate')}
          </button>
          {p.done.length < ON_TASKS.length && <span className="text-xs text-secondary-500">{t('activateHint', { n: ON_TASKS.length - p.done.length })}</span>}
        </div>
      )}
    </div>
  );
}

function OffCard({ p }: { p: Offboarding }) {
  const t = useTranslations('demoHrms.processes');
  const pos = usePos();
  const tx = useTranslations('demoHrms.exitReasons');
  const { state, dispatch, openProfile } = useHr();
  const f = useFmt();
  const docs = useDocuments();
  const e = state.employees.find((x) => x.id === p.employeeId);
  if (!e) return null;
  const s = settlement(e, p.lastDay, p.reason, vacationBalance(state, e).balance);
  const pct = Math.round((p.done.length / OFF_TASKS.length) * 100);
  const toggle = (task: OffTask) => {
    if (p.closed) return;
    if (task === 'certificate' && !p.done.includes(task)) {
      docs.certificate(e, true);
    }
    dispatch({ type: 'process.toggle', id: p.id, task });
  };
  const rows: [string, number, string?][] = [
    [t('settle.pending'), s.pendingSalary, t('settle.days', { n: s.pendingDays })],
    [t('settle.severance'), s.severance, t('settle.days', { n: s.severanceDays })],
    [t('settle.interest'), s.interest],
    [t('settle.prima'), s.prima, t('settle.days', { n: s.primaDays })],
    [t('settle.vacation'), s.vacation, t('settle.vacDays', { n: f.num(s.vacationDays) })],
    [t('settle.indemnity'), s.indemnity],
  ];
  return (
    <div className="p-4 rounded-lg bg-secondary-50 dark:bg-secondary-800">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div>
          <button type="button" className="font-semibold text-secondary-900 dark:text-white hover:underline" onClick={() => openProfile(e.id)}>{e.name}</button>
          <p className="text-xs text-secondary-500">{pos(e)} · {SITE_CITY[e.site]} · {tx(p.reason)} · {t('lastDay', { date: f.date(p.lastDay) })}</p>
        </div>
        <Badge variant={p.closed ? 'default' : 'warning'} size="sm">{p.closed ? t('closedOut') : t('inProgress')}</Badge>
      </div>
      <div className="flex items-center justify-between text-xs text-secondary-500 mb-1"><span>{t('progress')}</span><span>{pct}%</span></div>
      <Progress value={pct} tone={pct === 100 ? 'emerald' : 'violet'} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        <div className="grid grid-cols-1 gap-2 content-start">
          {OFF_TASKS.map((task) => (
            <TaskButton
              key={task}
              done={p.done.includes(task)}
              disabled={p.closed}
              label={task === 'certificate' && !p.done.includes(task) ? t('tasks.certificateGen') : t(`tasks.${task}`)}
              onClick={() => toggle(task)}
            />
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold text-secondary-700 dark:text-secondary-200 mb-1">{t('settle.title')}</p>
          <table className="w-full text-xs">
            <tbody>
              {rows.map(([k, v, note]) => (
                <tr key={k} className="border-b border-secondary-200 dark:border-secondary-700">
                  <td className="py-1 pr-2">{k}{note && <span className="block text-[10px] text-secondary-500">{note}</span>}</td>
                  <td className="py-1 text-right font-medium">{f.money(v)}</td>
                </tr>
              ))}
              <tr>
                <td className="py-1.5 pr-2 font-bold">{t('settle.total')}</td>
                <td className="py-1.5 text-right font-bold">{f.money(s.total)}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-[10px] text-secondary-500 mt-1">{t('settle.note')}</p>
        </div>
      </div>
      {!p.closed && (
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <button
            type="button"
            className={btn.primary}
            disabled={p.done.length < OFF_TASKS.length}
            onClick={() => {
              dispatch({ type: 'process.close', id: p.id });
              toast.success(t('closedToast', { name: e.name }));
            }}
          >
            {t('finish')}
          </button>
          {p.done.length < OFF_TASKS.length && <span className="text-xs text-secondary-500">{t('activateHint', { n: OFF_TASKS.length - p.done.length })}</span>}
        </div>
      )}
    </div>
  );
}
