'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { csv, download } from '../lib/payroll';
import { useHr } from '../lib/store';
import { kpis } from '../lib/selectors';
import { COMPETENCIES, type Competency, type Review } from '../lib/types';
import { Empty, Field, Modal, Pager, Progress, SectionTitle, TabIntro, btn, inputCls, usePager, useFmt, usePos } from './ui';

const avg = (r: Review) => COMPETENCIES.reduce((a, c) => a + (r.scores[c] ?? 0), 0) / COMPETENCIES.length;
const band = (n: number) => (n >= 4.5 ? 'outstanding' : n >= 3.5 ? 'meets' : n >= 2.5 ? 'developing' : 'low');

export default function PerformanceTab() {
  const t = useTranslations('demoHrms.performance');
  const pos = usePos();
  const { state, openProfile } = useHr();
  const f = useFmt();
  const [filter, setFilter] = useState<'pending' | 'done'>('pending');
  const [editing, setEditing] = useState<string | null>(null);
  const byId = useMemo(() => new Map(state.employees.map((e) => [e.id, e])), [state.employees]);
  const done = state.reviews.filter((r) => r.status === 'done');
  const list = state.reviews.filter((r) => r.status === filter);
  const pager = usePager(list, 8);
  const { setPage } = pager;
  useEffect(() => setPage(1), [filter, setPage]);
  const year = state.baseDate.slice(0, 4);
  const half = Number(state.baseDate.slice(5, 7)) >= 7 ? 2 : 1;
  const mean = done.length ? done.reduce((a, r) => a + avg(r), 0) / done.length : 0;
  const bands = (['outstanding', 'meets', 'developing', 'low'] as const).map((b) => ({ b, n: done.filter((r) => band(avg(r)) === b).length }));
  const current = editing ? state.reviews.find((r) => r.employeeId === editing) : undefined;

  const exportCsv = () => {
    download(
      `evaluaciones-${year}-${half}.csv`,
      csv([
        [t('csv.name'), t('csv.position'), t('csv.evaluator'), ...COMPETENCIES.map((c) => t(`competencies.${c}`)), t('csv.average'), t('csv.status')],
        ...state.reviews.map((r) => {
          const e = byId.get(r.employeeId)!;
          return [e.name, pos(e), byId.get(e.managerId ?? '')?.name ?? '', ...COMPETENCIES.map((c) => r.scores[c] ?? ''), r.status === 'done' ? avg(r).toFixed(1) : '', t(`status.${r.status}`)];
        }),
      ]),
    );
    toast.success(t('exported', { n: state.reviews.length }));
  };

  return (
    <div className="space-y-6">
      <TabIntro title={t('title')} subtitle={t('subtitle')} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="bordered" className="lg:col-span-2 min-w-0">
          <SectionTitle
            title={t('cycle', { year, half })}
            subtitle={t('cycleSub', { done: done.length, total: state.reviews.length })}
            action={
              <button type="button" className={btn.small} onClick={exportCsv}>
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                CSV
              </button>
            }
          />
          <Progress value={(done.length / Math.max(1, state.reviews.length)) * 100} />
          <div className="flex flex-wrap gap-1 bg-secondary-100 dark:bg-secondary-800 rounded-lg p-1 mt-4 w-fit" role="group" aria-label={t('filter')}>
            {(['pending', 'done'] as const).map((s) => (
              <button key={s} type="button" aria-pressed={filter === s} onClick={() => setFilter(s)} className={`px-3 py-1 text-xs font-medium rounded ${filter === s ? 'bg-white dark:bg-secondary-700 shadow-sm text-secondary-900 dark:text-white' : 'text-secondary-600 dark:text-secondary-300'}`}>
                {t(`status.${s}`)} ({state.reviews.filter((r) => r.status === s).length})
              </button>
            ))}
          </div>
          {list.length === 0 ? (
            <Empty>{t('empty')}</Empty>
          ) : (
            <div className="relative overflow-x-auto mt-3">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="text-left text-xs text-secondary-500 border-b border-secondary-200 dark:border-secondary-700">
                    <th className="py-2 pr-2 font-semibold">{t('csv.name')}</th>
                    <th className="py-2 px-2 font-semibold">{t('csv.evaluator')}</th>
                    <th className="py-2 px-2 text-right font-semibold">{t('csv.average')}</th>
                    <th className="py-2 pl-2"><span className="sr-only">{t('csv.status')}</span></th>
                  </tr>
                </thead>
                <tbody>
                  {pager.visible.map((r) => {
                    const e = byId.get(r.employeeId)!;
                    return (
                      <tr key={r.employeeId} className="border-b border-secondary-100 dark:border-secondary-800">
                        <td className="py-2 pr-2">
                          <button type="button" className="font-medium text-secondary-900 dark:text-white hover:underline text-left" onClick={() => openProfile(e.id)}>{e.name}</button>
                          <span className="block text-[11px] text-secondary-500">{pos(e)}</span>
                        </td>
                        <td className="py-2 px-2 text-xs text-secondary-600 dark:text-secondary-300">{byId.get(e.managerId ?? '')?.name ?? t('board')}</td>
                        <td className="py-2 px-2 text-right font-semibold">{r.status === 'done' ? f.num(avg(r)) : '—'}</td>
                        <td className="py-2 pl-2 text-right">
                          <button type="button" className={btn.small} onClick={() => setEditing(r.employeeId)}>{r.status === 'done' ? t('view') : t('evaluate')}</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Pager pager={pager} />
            </div>
          )}
        </Card>

        <Card variant="bordered">
          <SectionTitle title={t('results')} subtitle={t('resultsSub', { avg: f.num(mean) })} />
          <ul className="space-y-2">
            {bands.map(({ b, n }) => (
              <li key={b}>
                <div className="flex justify-between text-xs mb-1"><span>{t(`bands.${b}`)}</span><span className="font-semibold">{n}</span></div>
                <Progress value={(n / Math.max(1, done.length)) * 100} tone={b === 'low' ? 'red' : b === 'outstanding' ? 'emerald' : 'violet'} />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Objectives />
        <Succession />
      </div>

      {current && <ReviewModal review={current} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ReviewModal({ review, onClose }: { review: Review; onClose: () => void }) {
  const t = useTranslations('demoHrms.performance');
  const pos = usePos();
  const { state, dispatch } = useHr();
  const f = useFmt();
  const e = state.employees.find((x) => x.id === review.employeeId)!;
  const readOnly = review.status === 'done';
  const [scores, setScores] = useState<Partial<Record<Competency, number>>>(review.scores);
  const [comment, setComment] = useState(review.comment);
  const complete = COMPETENCIES.every((c) => scores[c]);
  return (
    <Modal title={readOnly ? t('viewTitle') : t('formTitle')} subtitle={`${e.name} · ${pos(e)}`} onClose={onClose} labelId="hrms-review-title">
      <div className="space-y-3">
        <p className="text-xs text-secondary-500">{t('scale')}</p>
        {COMPETENCIES.map((c) => (
          <div key={c}>
            <p className="text-sm text-secondary-800 dark:text-secondary-200 mb-1">{t(`competencies.${c}`)}</p>
            <div className="flex gap-1" role="radiogroup" aria-label={t(`competencies.${c}`)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={scores[c] === n}
                  disabled={readOnly}
                  onClick={() => setScores((s) => ({ ...s, [c]: n }))}
                  className={`flex-1 h-8 text-xs font-bold rounded transition-all ${(scores[c] ?? 0) >= n ? 'bg-violet-600 text-white' : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-500'} disabled:cursor-default`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
        <Field label={t('comment')} htmlFor="review-comment">
          <textarea id="review-comment" className={inputCls} rows={3} value={comment} disabled={readOnly} maxLength={400} onChange={(ev) => setComment(ev.target.value)} />
        </Field>
        {readOnly ? (
          <p className="text-sm font-semibold">{t('average', { n: f.num(avg(review)) })}</p>
        ) : (
          <div className="flex justify-end gap-2">
            <button type="button" className={btn.outline} onClick={onClose}>{t('cancel')}</button>
            <button
              type="button"
              className={btn.primary}
              disabled={!complete}
              onClick={() => {
                dispatch({ type: 'review.submit', employeeId: e.id, scores: scores as Record<Competency, number>, comment: comment.trim() });
                toast.success(t('submitted', { name: e.name }));
                onClose();
              }}
            >
              {t('submit')}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Objectives() {
  const t = useTranslations('demoHrms.performance.objectives');
  const { state } = useHr();
  const f = useFmt();
  const k = kpis(state);
  const assigned = state.courses.reduce((a, c) => a + c.assigned.length, 0);
  const completed = state.courses.reduce((a, c) => a + c.completed.length, 0);
  const training = (completed / Math.max(1, assigned)) * 100;
  const items: { key: string; value: string; target: string; progress: number; live: boolean }[] = [
    { key: 'turnover', value: f.pct(k.turnover), target: f.pct(12), progress: Math.min(100, (12 / Math.max(0.1, k.turnover)) * 100), live: true },
    { key: 'training', value: f.pct(training), target: f.pct(95), progress: Math.min(100, (training / 95) * 100), live: true },
    { key: 'oee', value: f.pct(74), target: f.pct(78), progress: 95, live: false },
    { key: 'waste', value: f.pct(1.9), target: f.pct(1.5), progress: 79, live: false },
    { key: 'accidents', value: '2', target: '0', progress: 60, live: false },
  ];
  return (
    <Card variant="bordered">
      <SectionTitle title={t('title')} subtitle={t('subtitle')} />
      <ul className="space-y-3">
        {items.map((o) => (
          <li key={o.key} className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-sm font-semibold text-secondary-900 dark:text-white">{t(`items.${o.key}`)}</p>
              <Badge variant={o.live ? 'info' : 'default'} size="sm">{o.live ? t('live') : t('sample')}</Badge>
            </div>
            <p className="text-xs text-secondary-500 mb-2">{t(`targets.${o.key}`, { value: o.value, target: o.target })}</p>
            <Progress value={o.progress} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Succession() {
  const t = useTranslations('demoHrms.performance.succession');
  const tp = useTranslations('demoHrms.positions');
  const pos = usePos();
  const { state, openProfile } = useHr();
  const pick = (pos: string, n = 0) => state.employees.filter((e) => e.positionId === pos && e.status !== 'retired')[n];
  const rows = [
    { e: pick('supervisor', 0), to: 'plantDirector', ready: 'ready1y' },
    { e: pick('qualityAnalyst', 1), to: 'qualityHead', ready: 'readyNow' },
    { e: pick('technician', 3), to: 'maintenanceHead', ready: 'ready2y' },
    { e: pick('accountant', 0), to: 'cfo', ready: 'ready2y' },
  ].filter((r) => r.e);
  return (
    <Card variant="bordered">
      <SectionTitle title={t('title')} subtitle={t('subtitle')} />
      <ul className="space-y-2">
        {rows.map(({ e, to, ready }) => (
          <li key={e.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800">
            <button type="button" className="min-w-0 text-left" onClick={() => openProfile(e.id)}>
              <span className="block text-sm font-semibold text-secondary-900 dark:text-white hover:underline">{e.name}</span>
              <span className="block text-xs text-secondary-500">{pos(e)} → {tp(to)}</span>
            </button>
            <Badge variant={ready === 'readyNow' ? 'success' : ready === 'ready1y' ? 'info' : 'default'} size="sm">{t(ready)}</Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}
