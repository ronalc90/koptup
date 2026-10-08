'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import { addDays, addMonths, firstDayOfMonth, holidayOf, lastDayOfMonth, weekday, type ISODate } from '../lib/dates';
import { csv, download } from '../lib/payroll';
import { useHr } from '../lib/store';
import { active, onLeave, vacationBalance } from '../lib/selectors';
import type { LeaveStatus, LeaveType } from '../lib/types';
import LeaveForm from './LeaveForm';
import LeaveItem from './LeaveItem';
import { Empty, Modal, Pager, SectionTitle, TabIntro, btn, inputCls, usePager, useFmt, usePos } from './ui';

const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

export default function AbsencesTab() {
  const t = useTranslations('demoHrms.absences');
  const tl = useTranslations('demoHrms.leaveTypes');
  const { state } = useHr();
  const [status, setStatus] = useState<LeaveStatus | 'all'>('pending');
  const [type, setType] = useState<LeaveType | 'all'>('all');
  const [creating, setCreating] = useState(false);

  const leaves = useMemo(
    () =>
      state.leaves
        .filter((l) => status === 'all' || l.status === status)
        .filter((l) => type === 'all' || l.type === type)
        .sort((a, b) => (a.from < b.from ? 1 : -1)),
    [state.leaves, status, type],
  );
  const pager = usePager(leaves, 9);
  const { setPage } = pager;
  useEffect(() => setPage(1), [status, type, setPage]);

  return (
    <div className="space-y-6">
      <TabIntro title={t('title')} subtitle={t('subtitle')} />

      <Card variant="bordered">
        <SectionTitle
          title={t('requests')}
          subtitle={t('requestsSub')}
          action={
            <button type="button" className={btn.primary} onClick={() => setCreating(true)}>
              <PlusIcon className="w-4 h-4" />
              {t('new')}
            </button>
          }
        />
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div role="group" aria-label={t('statusFilter')} className="flex flex-wrap gap-1 bg-secondary-100 dark:bg-secondary-800 rounded-lg p-1">
            {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={status === s}
                onClick={() => setStatus(s)}
                className={`px-3 py-1 text-xs font-medium rounded ${status === s ? 'bg-white dark:bg-secondary-700 shadow-sm text-secondary-900 dark:text-white' : 'text-secondary-600 dark:text-secondary-300'}`}
              >
                {t(`status.${s}`)} ({s === 'all' ? state.leaves.length : state.leaves.filter((l) => l.status === s).length})
              </button>
            ))}
          </div>
          <select aria-label={t('typeFilter')} className={`${inputCls} sm:w-56`} value={type} onChange={(e) => setType(e.target.value as LeaveType | 'all')}>
            <option value="all">{t('allTypes')}</option>
            {(['vacation', 'permit', 'unpaid', 'sick'] as const).map((x) => <option key={x} value={x}>{tl(x)}</option>)}
          </select>
        </div>
        {leaves.length === 0 ? (
          <Empty>{t('empty')}</Empty>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {pager.visible.map((l) => <LeaveItem key={l.id} leave={l} />)}
            </div>
            <Pager pager={pager} />
          </>
        )}
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <MonthCalendar />
        <Balances />
      </div>

      {creating && (
        <Modal title={t('new')} onClose={() => setCreating(false)} labelId="hrms-new-leave">
          <LeaveForm idPrefix="abs-leave" onDone={() => setCreating(false)} />
        </Modal>
      )}
    </div>
  );
}

function MonthCalendar() {
  const t = useTranslations('demoHrms.absences.calendar');
  const th = useTranslations('demoHrms.holidays');
  const tl = useTranslations('demoHrms.leaveTypes');
  const { state, openProfile } = useHr();
  const f = useFmt();
  const [month, setMonth] = useState<ISODate>(firstDayOfMonth(state.baseDate));
  const [selected, setSelected] = useState<ISODate>(state.baseDate);
  const first = firstDayOfMonth(month);
  const last = lastDayOfMonth(month);
  const lead = (weekday(first) + 6) % 7; // semana empieza el lunes
  const days: ISODate[] = [];
  for (let d = first; d <= last; d = addDays(d, 1)) days.push(d);
  const names = t('weekdays').split(',');
  const away = onLeave(state, selected);
  const hol = holidayOf(selected);
  const byId = new Map(state.employees.map((e) => [e.id, e]));

  return (
    <Card variant="bordered">
      <SectionTitle
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          <div className="flex items-center gap-1">
            <button type="button" className={btn.small} aria-label={t('prev')} onClick={() => setMonth(addMonths(month, -1))}><ChevronLeftIcon className="w-4 h-4" /></button>
            <span className="text-sm font-semibold w-36 text-center">{cap(f.date(month, 'monthYear'))}</span>
            <button type="button" className={btn.small} aria-label={t('next')} onClick={() => setMonth(addMonths(month, 1))}><ChevronRightIcon className="w-4 h-4" /></button>
          </div>
        }
      />
      <div className="grid grid-cols-7 gap-1 text-xs">
        {names.map((d, i) => <div key={i} className="text-center font-semibold text-secondary-500 py-1">{d}</div>)}
        {Array.from({ length: lead }).map((_, i) => <div key={`e${i}`} />)}
        {days.map((d) => {
          const n = onLeave(state, d).length;
          const holiday = holidayOf(d);
          const weekend = weekday(d) === 0 || weekday(d) === 6;
          const isSel = d === selected;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setSelected(d)}
              aria-pressed={isSel}
              aria-label={`${f.date(d)}${holiday ? ` · ${th(holiday)}` : ''} · ${t('awayCount', { n })}`}
              className={`aspect-square rounded-md flex flex-col items-center justify-center font-medium border transition-colors ${
                isSel ? 'border-violet-600 ring-2 ring-violet-300 dark:ring-violet-800' : 'border-transparent'
              } ${holiday ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200' : weekend ? 'bg-secondary-100 dark:bg-secondary-800 text-secondary-400' : 'bg-secondary-50 dark:bg-secondary-800/60 text-secondary-800 dark:text-secondary-100'} ${d === state.baseDate ? 'underline decoration-2' : ''}`}
            >
              <span>{Number(d.slice(8))}</span>
              {n > 0 && <span className="text-[9px] leading-none mt-0.5 px-1 rounded bg-violet-600 text-white">{n}</span>}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-[11px] text-secondary-500 mt-3">
        <span><span className="inline-block w-3 h-3 rounded bg-rose-200 align-middle mr-1" />{t('legendHoliday')}</span>
        <span><span className="inline-block w-3 h-3 rounded bg-violet-600 align-middle mr-1" />{t('legendAway')}</span>
      </div>
      <div className="mt-4 border-t border-secondary-200 dark:border-secondary-700 pt-3">
        <p className="text-sm font-semibold text-secondary-900 dark:text-white">
          {f.date(selected, 'long')}{hol ? ` · ${th(hol)}` : ''}
        </p>
        {away.length === 0 ? (
          <p className="text-xs text-secondary-500 mt-1">{t('nobody')}</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {away.map((l) => {
              const e = byId.get(l.employeeId);
              if (!e) return null;
              return (
                <li key={l.id} className="text-xs flex justify-between gap-2">
                  <button type="button" className="text-violet-700 dark:text-violet-300 hover:underline text-left" onClick={() => openProfile(e.id)}>{e.name}</button>
                  <span className="text-secondary-500">{tl(l.type)} · {f.date(l.from, 'dayMonth')} → {f.date(l.to, 'dayMonth')}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}

function Balances() {
  const t = useTranslations('demoHrms.absences.balances');
  const pos = usePos();
  const { state, openProfile } = useHr();
  const f = useFmt();
  const [q, setQ] = useState('');
  const rows = useMemo(
    () =>
      active(state)
        .filter((e) => e.contract !== 'apprentice')
        .map((e) => ({ e, b: vacationBalance(state, e) }))
        .filter(({ e }) => !q.trim() || e.name.toLowerCase().includes(q.trim().toLowerCase()))
        .sort((a, b) => b.b.balance - a.b.balance),
    [state, q],
  );
  const pager = usePager(rows, 8);
  const { setPage } = pager;
  useEffect(() => setPage(1), [q, setPage]);

  const exportCsv = () => {
    download(
      `saldos-vacaciones-${state.baseDate}.csv`,
      csv([[t('name'), t('position'), t('accrued'), t('taken'), t('balance'), t('pending')], ...rows.map(({ e, b }) => [e.name, pos(e), b.accrued.toFixed(1), b.taken.toFixed(1), b.balance.toFixed(1), b.pending])]),
    );
    toast.success(t('exported', { n: rows.length }));
  };

  return (
    <Card variant="bordered">
      <SectionTitle
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          <button type="button" className={btn.small} onClick={exportCsv}>
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            CSV
          </button>
        }
      />
      <input type="search" className={`${inputCls} mb-3`} placeholder={t('search')} aria-label={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="relative overflow-x-auto">
        <table className="w-full text-sm min-w-[420px]">
          <thead>
            <tr className="text-left text-xs text-secondary-500 border-b border-secondary-200 dark:border-secondary-700">
              <th className="py-2 pr-2 font-semibold">{t('name')}</th>
              <th className="py-2 px-2 text-right font-semibold">{t('accrued')}</th>
              <th className="py-2 px-2 text-right font-semibold">{t('taken')}</th>
              <th className="py-2 pl-2 text-right font-semibold">{t('balance')}</th>
            </tr>
          </thead>
          <tbody>
            {pager.visible.map(({ e, b }) => (
              <tr key={e.id} className="border-b border-secondary-100 dark:border-secondary-800">
                <td className="py-2 pr-2">
                  <button type="button" className="font-medium text-secondary-900 dark:text-white hover:underline text-left" onClick={() => openProfile(e.id)}>{e.name}</button>
                  <span className="block text-[11px] text-secondary-500">{pos(e)}</span>
                </td>
                <td className="py-2 px-2 text-right">{f.num(b.accrued)}</td>
                <td className="py-2 px-2 text-right">{f.num(b.taken)}</td>
                <td className={`py-2 pl-2 text-right font-semibold ${b.balance >= 30 ? 'text-amber-600' : 'text-secondary-900 dark:text-white'}`}>{f.num(b.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager pager={pager} />
      <p className="text-[11px] text-secondary-500 mt-2">{t('rule')}</p>
    </Card>
  );
}
