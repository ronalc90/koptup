'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { abcClasses, abcSummary, COUNT_FREQUENCY_DAYS } from '../lib/engine';
import { addDays } from '../lib/dates';
import { fmtCOP, fmtDate, fmtNum, fmtPct } from '../lib/format';
import { now, useWms } from '../lib/store';
import type { AbcClass, CountTask } from '../lib/types';
import { Empty, Panel, Pill, SimNote, baseInputCls, tdCls, thCls, useProductName, useT } from './ui';

const CLASS_COLOR: Record<AbcClass, string> = {
  A: 'from-emerald-600 to-emerald-700',
  B: 'from-sky-600 to-sky-700',
  C: 'from-slate-500 to-slate-600',
};

export default function CycleCount() {
  const t = useT();
  const name = useProductName();
  const { state, nav, lang, today, dispatch, notify } = useWms();
  const summary = abcSummary(state.products);
  const cls = abcClasses(state.products);
  const stats = state.countStats[nav.wh];
  const tasks = state.counts
    .filter((c) => c.wh === nav.wh)
    .sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done') || Number(!!b.urgent) - Number(!!a.urgent) || (a.due < b.due ? -1 : 1));
  const [values, setValues] = useState<Record<string, string>>({});

  const simulate = (c: CountTask) => {
    const lot = state.lots.find((l) => l.id === c.lotId);
    const sys = lot?.qty ?? 0;
    // Conteo físico de ejemplo: la mayoría cuadra; algunas ubicaciones tienen 2 unidades menos.
    const n = Number(c.id.replace(/\D/g, '')) || 0;
    const physical = n % 3 === 2 && sys >= 2 ? sys - 2 : sys;
    setValues((v) => ({ ...v, [c.id]: String(physical) }));
  };

  return (
    <div className="space-y-5">
      <Panel title={t('counts.title')} subtitle={t('counts.subtitle')}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {(['A', 'B', 'C'] as AbcClass[]).map((c) => {
            const last = state.lastCount[nav.wh][c];
            const next = addDays(last, COUNT_FREQUENCY_DAYS[c]);
            const overdue = next < today;
            return (
              <div key={c} className={`rounded-xl bg-gradient-to-br ${CLASS_COLOR[c]} p-4 text-white shadow-sm`}>
                <div className="text-xs uppercase tracking-wider opacity-90">{t('counts.class', { c })}</div>
                <div className="mt-1 text-2xl font-bold">{t('counts.skus', { n: summary[c].skus })}</div>
                <div className="text-sm opacity-90">{t(`counts.classDesc.${c}`)}</div>
                <dl className="mt-3 grid grid-cols-2 gap-1 text-xs">
                  <dt className="opacity-80">{t('counts.valuePct')}</dt>
                  <dd className="text-right font-semibold">{fmtPct(summary[c].value * 100, lang, 0)}</dd>
                  <dt className="opacity-80">{t('counts.lastCount')}</dt>
                  <dd className="text-right">{fmtDate(last, lang)}</dd>
                  <dt className="opacity-80">{t('counts.nextCount')}</dt>
                  <dd className="text-right font-semibold">
                    {fmtDate(next, lang)}
                    {overdue ? ` · ${t('counts.overdue')}` : ''}
                  </dd>
                </dl>
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: 'count.generate', wh: nav.wh, cls: c, at: now() });
                    notify(t('counts.generated', { c }));
                  }}
                  className="mt-3 w-full rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold hover:bg-white/30"
                >
                  {t('counts.generate', { c })}
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <Pill tone={stats.total && stats.match / stats.total >= 0.99 ? 'success' : 'warning'}>
            {t('counts.accuracy', { pct: fmtPct(stats.total ? (stats.match / stats.total) * 100 : 100, lang) })}
          </Pill>
          <span className="text-secondary-500">{t('counts.accuracyHint', { match: stats.match, total: stats.total })}</span>
        </div>
        <SimNote className="mt-3">{t('counts.abcNote')}</SimNote>
      </Panel>

      <Panel title={t('counts.tasks')} subtitle={t('counts.tasksSubtitle')}>
        {tasks.length === 0 ? (
          <Empty>{t('counts.noTasks')}</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <th className={thCls}>{t('counts.task')}</th>
                  <th className={thCls}>{t('common.bin')}</th>
                  <th className={thCls}>{t('common.product')}</th>
                  <th className={thCls}>{t('counts.due')}</th>
                  <th className={thCls}>{t('counts.assignee')}</th>
                  <th className={thCls}>{t('counts.result')}</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((c) => {
                  const lot = state.lots.find((l) => l.id === c.lotId);
                  const product = state.products.find((p) => p.sku === c.sku);
                  const diff = (c.counted ?? 0) - (c.system ?? 0);
                  return (
                    <tr key={c.id} className="border-b border-secondary-100 dark:border-secondary-800">
                      <td className={`${tdCls} font-mono text-xs`}>
                        {c.id}
                        {c.urgent && <Pill tone="danger" className="ml-1">{t('counts.urgent')}</Pill>}
                        <div className="text-secondary-500">{t('counts.classShort', { c: cls[c.sku] ?? 'C' })}</div>
                      </td>
                      <td className={`${tdCls} font-mono text-xs`}>{c.bin}</td>
                      <td className={tdCls}>
                        <div>{name(c.sku)}</div>
                        <div className="font-mono text-xs text-secondary-500">{lot ? `${t('common.lot')} ${lot.lot}` : c.sku}</div>
                      </td>
                      <td className={`${tdCls} text-xs`}>{c.due === today ? t('common.today') : fmtDate(c.due, lang)}</td>
                      <td className={`${tdCls} text-xs`}>{c.assignee}</td>
                      <td className={tdCls}>
                        {c.status === 'scheduled' && (
                          <form
                            className="flex flex-wrap items-center gap-1.5"
                            onSubmit={(e) => {
                              e.preventDefault();
                              const v = Number(values[c.id]);
                              if (!Number.isFinite(v) || values[c.id] === '' || v < 0) return;
                              dispatch({ type: 'count.submit', task: c.id, counted: v, at: now() });
                              setValues((x) => ({ ...x, [c.id]: '' }));
                            }}
                          >
                            <input
                              type="number"
                              min={0}
                              className={`${baseInputCls} w-24`}
                              value={values[c.id] ?? ''}
                              onChange={(e) => setValues((x) => ({ ...x, [c.id]: e.target.value }))}
                              placeholder={t('counts.countedPh')}
                              aria-label={t('counts.counted', { bin: c.bin })}
                            />
                            <Button size="sm" type="submit" disabled={values[c.id] === undefined || values[c.id] === ''}>
                              {t('counts.submit')}
                            </Button>
                            <button type="button" onClick={() => simulate(c)} className="text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400">
                              {t('counts.simulate')}
                            </button>
                          </form>
                        )}
                        {c.status === 'review' && (
                          <div className="space-y-1.5">
                            <div className="text-xs">
                              {t('counts.reviewText', { system: c.system ?? 0, counted: c.counted ?? 0 })}{' '}
                              <span className={diff < 0 ? 'font-semibold text-red-600' : 'font-semibold text-emerald-600'}>
                                ({diff > 0 ? `+${diff}` : diff} · {fmtCOP(diff * (product?.unitCost ?? 0), lang)})
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              <Button
                                size="sm"
                                onClick={() => {
                                  dispatch({ type: 'count.approve', task: c.id, at: now() });
                                  notify(t('counts.adjusted', { bin: c.bin }), 'warn');
                                }}
                              >
                                {t('counts.approve')}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'count.recount', task: c.id })}>
                                {t('counts.recount')}
                              </Button>
                            </div>
                          </div>
                        )}
                        {c.status === 'done' && (
                          <Pill tone={c.result === 'match' ? 'success' : 'warning'}>
                            {c.result === 'match' ? t('counts.match', { n: fmtNum(c.counted ?? 0, lang) }) : t('counts.adjustedPill', { diff: diff > 0 ? `+${diff}` : String(diff) })}
                          </Pill>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <SimNote className="mt-3">{t('counts.note')}</SimNote>
      </Panel>
    </div>
  );
}
