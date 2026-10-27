'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { REPORT_MONTHS } from '../lib/data';
import { fmtMonth, fmtNumber, fmtPct, previousMonths } from '../lib/format';
import { buildBatch, evaluate, simulate } from '../lib/logic';
import { useModeration } from '../lib/store';
import { CATEGORIES, type Label } from '../lib/types';
import { BarChart, CategoryBars, SectionTitle, SimNote, Stat } from './ui';

export default function DashboardTab() {
  const t = useTranslations('demoModeration.dashboard');
  const tm = useTranslations('demoModeration');
  const { s, lang, now, queue, views, go } = useModeration();
  const batch = useMemo(() => buildBatch(), []);
  const sim = useMemo(() => simulate(s.rules, batch), [s.rules, batch]);
  const ev = useMemo(() => evaluate(lang), [lang]);
  const months = previousMonths(now, REPORT_MONTHS.length);

  const openAppeals = s.appeals.filter((a) => a.status === 'open');
  const overdue = openAppeals.filter((a) => now - new Date(a.receivedAt).getTime() > 24 * 3_600_000).length;
  const yours = views.filter((v) => v.decision && v.decision.kind !== 'auto').length;
  const avg = s.session.timedDecisions ? Math.round(s.session.decisionSeconds / s.session.timedDecisions) : null;

  const byCat = CATEGORIES.map((c) => ({ label: c as Label, value: queue.filter((v) => v.label === c).length }))
    .concat([{ label: 'none', value: queue.filter((v) => v.label === 'none').length }])
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((r) => ({ ...r, display: fmtNumber(r.value, lang) }));

  return (
    <section>
      <SectionTitle title={t('title')} subtitle={t('subtitle')} />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t('queueNow')} value={fmtNumber(queue.length, lang)} hint={t('queueNowHint', { platform: tm(`platforms.${s.platform}`) })} />
        <Stat label={t('decisions')} value={fmtNumber(yours, lang)} hint={t('decisionsHint')} />
        <Stat label={t('avgTime')} value={avg === null ? '—' : t('seconds', { n: avg })} hint={t('avgTimeHint')} />
        <Stat label={t('appeals')} value={fmtNumber(openAppeals.length, lang)} hint={t('appealsHint', { n: overdue })} />
        <Stat label={t('autoShare')} value={fmtPct(sim.automatic / sim.total, lang)} hint={t('batchHint', { n: fmtNumber(sim.total, lang) })} />
        <Stat label={t('humanShare')} value={fmtPct(sim.human / sim.total, lang)} hint={t('batchHint', { n: fmtNumber(sim.total, lang) })} />
        <Stat label={t('errors')} value={fmtNumber(sim.falsePositives + sim.falseNegatives, lang)} hint={t('errorsHint', { fp: sim.falsePositives, fn: sim.falseNegatives })} />
        <Stat label={t('accuracy')} value={fmtPct(ev.accuracy, lang)} hint={t('accuracyHint', { n: ev.total })} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-secondary-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-900 lg:col-span-2">
          <h3 className="mb-1 text-lg font-semibold text-secondary-900 dark:text-white">{t('monthsTitle')}</h3>
          <p className="mb-4 text-xs text-secondary-500 dark:text-secondary-400">{t('monthsHint')}</p>
          <BarChart
            ariaLabel={t('monthsTitle')}
            data={REPORT_MONTHS.map((m, i) => ({ label: fmtMonth(months[i], lang), value: m.removed, display: fmtNumber(m.removed, lang) }))}
          />
        </div>
        <div className="rounded-xl border border-secondary-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-900">
          <h3 className="mb-1 text-lg font-semibold text-secondary-900 dark:text-white">{t('byCategoryTitle')}</h3>
          <p className="mb-4 text-xs text-secondary-500 dark:text-secondary-400">{t('byCategoryHint')}</p>
          {byCat.length ? (
            <CategoryBars rows={byCat} />
          ) : (
            <p className="text-sm text-secondary-500 dark:text-secondary-400">
              {t('emptyQueue')}{' '}
              <button type="button" onClick={() => go('classifier')} className="font-medium text-primary-700 underline dark:text-primary-300">
                {t('tryText')}
              </button>
            </p>
          )}
        </div>
      </div>
      <SimNote className="mt-4">{t('note')}</SimNote>
    </section>
  );
}
