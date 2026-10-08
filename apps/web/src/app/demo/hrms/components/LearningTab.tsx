'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { AcademicCapIcon, ArrowDownTrayIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { diffDays } from '../lib/dates';
import { csv, download } from '../lib/payroll';
import { useHr } from '../lib/store';
import type { Course } from '../lib/types';
import { Progress, SectionTitle, Stat, TabIntro, btn, useFmt, usePos } from './ui';

type CourseState = 'done' | 'late' | 'soon' | 'onTrack';

export function courseState(c: Course, base: string, activeIds: Set<string>): { state: CourseState; assigned: number; completed: number; pending: string[] } {
  const assigned = c.assigned.filter((id) => activeIds.has(id));
  const completed = c.completed.filter((id) => activeIds.has(id));
  const pending = assigned.filter((id) => !completed.includes(id));
  const state: CourseState = pending.length === 0 ? 'done' : c.due < base ? 'late' : diffDays(base, c.due) <= 15 ? 'soon' : 'onTrack';
  return { state, assigned: assigned.length, completed: completed.length, pending };
}

const variant: Record<CourseState, 'success' | 'danger' | 'warning' | 'info'> = { done: 'success', late: 'danger', soon: 'warning', onTrack: 'info' };

export default function LearningTab() {
  const t = useTranslations('demoHrms.learning');
  const tc = useTranslations('demoHrms.courses');
  const pos = usePos();
  const { state, dispatch, openProfile } = useHr();
  const f = useFmt();
  const [open, setOpen] = useState<string | null>(null);
  const activeIds = new Set(state.employees.filter((e) => e.status !== 'retired').map((e) => e.id));
  const byId = new Map(state.employees.map((e) => [e.id, e]));
  const rows = state.courses.map((c) => ({ c, ...courseState(c, state.baseDate, activeIds) }));
  const assigned = rows.reduce((a, r) => a + r.assigned, 0);
  const completed = rows.reduce((a, r) => a + r.completed, 0);
  const late = rows.filter((r) => r.state === 'late');

  const exportCsv = () => {
    const out: (string | number)[][] = [[t('csv.course'), t('csv.name'), t('csv.position'), t('csv.status'), t('csv.due')]];
    rows.forEach(({ c }) => c.assigned.filter((id) => activeIds.has(id)).forEach((id) => {
      const e = byId.get(id)!;
      out.push([tc(c.id), e.name, pos(e), c.completed.includes(id) ? t('csv.done') : t('csv.pending'), c.due]);
    }));
    download(`plan-formacion-${state.baseDate}.csv`, csv(out));
    toast.success(t('exported', { n: out.length - 1 }));
  };

  return (
    <div className="space-y-6">
      <TabIntro title={t('title')} subtitle={t('subtitle')} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label={t('stat.compliance')} value={f.pct((completed / Math.max(1, assigned)) * 100)} sub={t('stat.complianceSub', { done: completed, total: assigned })} />
        <Stat label={t('stat.courses')} value={state.courses.length} sub={t('stat.coursesSub')} />
        <Stat label={t('stat.late')} value={late.length} sub={t('stat.lateSub', { n: late.reduce((a, r) => a + r.pending.length, 0) })} />
        <Stat label={t('stat.hours')} value={f.int(rows.reduce((a, r) => a + r.c.hours * r.completed, 0))} sub={t('stat.hoursSub')} />
      </div>

      <Card variant="bordered">
        <SectionTitle
          title={t('plan')}
          subtitle={t('planSub')}
          action={
            <>
              <button type="button" className={btn.outline} onClick={exportCsv}><ArrowDownTrayIcon className="w-4 h-4" />CSV</button>
              <Link href="/demo/lms" className={btn.outline}>
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                {t('openLms')}
              </Link>
            </>
          }
        />
        <ul className="space-y-3">
          {rows.map(({ c, state: st, assigned: a, completed: d, pending }) => {
            const pct = (d / Math.max(1, a)) * 100;
            return (
              <li key={c.id} className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <AcademicCapIcon className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-secondary-900 dark:text-white">{tc(c.id)}</p>
                      <p className="text-xs text-secondary-500">{t('meta', { hours: c.hours, date: f.date(c.due), audience: t(`audience.${c.id}`) })}</p>
                    </div>
                  </div>
                  <Badge variant={variant[st]} size="sm">{t(`state.${st}`)}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1"><Progress value={pct} tone={st === 'late' ? 'red' : st === 'done' ? 'emerald' : 'violet'} /></div>
                  <span className="text-xs font-semibold w-20 text-right">{d}/{a}</span>
                </div>
                {pending.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <button type="button" className={btn.small} onClick={() => setOpen(open === c.id ? null : c.id)} aria-expanded={open === c.id}>
                      {open === c.id ? t('hidePending') : t('showPending', { n: pending.length })}
                    </button>
                    {c.remindedOn === state.baseDate ? (
                      <span className="text-xs text-emerald-700 dark:text-emerald-300">{t('reminded')}</span>
                    ) : (
                      <button
                        type="button"
                        className={btn.small}
                        onClick={() => {
                          dispatch({ type: 'course.remind', id: c.id });
                          toast.success(t('remindedToast', { n: pending.length }));
                        }}
                      >
                        {t('remind')}
                      </button>
                    )}
                  </div>
                )}
                {open === c.id && (
                  <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                    {pending.map((id) => (
                      <li key={id}>
                        <button type="button" onClick={() => openProfile(id)} className="text-xs text-violet-700 dark:text-violet-300 hover:underline text-left">
                          {byId.get(id)?.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
        <p className="text-[11px] text-secondary-500 mt-3">{t('note')}</p>
      </Card>
    </div>
  );
}
