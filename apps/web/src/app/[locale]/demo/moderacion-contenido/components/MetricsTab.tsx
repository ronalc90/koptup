'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fmtNumber, fmtPct } from '../lib/format';
import { evaluate } from '../lib/logic';
import { useModeration } from '../lib/store';
import { CategoryChip, SectionTitle, SimNote, Stat, focusRing } from './ui';

export default function MetricsTab() {
  const t = useTranslations('demoModeration');
  const { s, lang, views } = useModeration();
  const ev = useMemo(() => evaluate(lang), [lang]);
  const [showErrors, setShowErrors] = useState(false);
  const pct = (x: number | null) => (x === null ? '—' : fmtPct(x, lang));
  const yours = views.filter((v) => v.decision && v.decision.kind !== 'auto');
  const avg = s.session.timedDecisions ? Math.round(s.session.decisionSeconds / s.session.timedDecisions) : null;
  const corrected = views.filter((v) => v.corrected).length;

  return (
    <section>
      <SectionTitle title={t('metrics.title')} subtitle={t('metrics.subtitle', { n: ev.total })} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t('metrics.accuracy')} value={fmtPct(ev.accuracy, lang)} hint={t('metrics.accuracyHint', { ok: ev.correct, n: ev.total })} />
        <Stat label={t('metrics.benignFlagged')} value={fmtPct(ev.benign ? ev.benignFlagged / ev.benign : 0, lang)} hint={t('metrics.benignHint', { k: ev.benignFlagged, n: ev.benign })} />
        <Stat label={t('metrics.yourDecisions')} value={fmtNumber(yours.length, lang)} hint={avg === null ? t('metrics.noTime') : t('metrics.avgTime', { n: avg })} />
        <Stat label={t('metrics.corrections')} value={fmtNumber(corrected, lang)} hint={t('metrics.correctionsHint')} />
      </div>

      <div className="overflow-hidden rounded-xl border border-secondary-200 bg-white dark:border-secondary-700 dark:bg-secondary-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary-50 text-secondary-600 dark:bg-secondary-800/60 dark:text-secondary-300">
              <tr>
                <th className="px-2 py-2 sm:px-3 text-left font-medium">{t('metrics.category')}</th>
                <th className="px-2 py-2 sm:px-3 text-right font-medium">{t('metrics.examples')}</th>
                <th className="px-2 py-2 sm:px-3 text-right font-medium">{t('metrics.precision')}</th>
                <th className="px-2 py-2 sm:px-3 text-right font-medium">{t('metrics.recall')}</th>
              </tr>
            </thead>
            <tbody>
              {ev.perCategory.map((m) => (
                <tr key={m.cat} className="border-t border-secondary-100 dark:border-secondary-800">
                  <td className="px-2 py-2 sm:px-3">
                    <CategoryChip label={m.cat} wrap />
                  </td>
                  <td className="px-2 py-2 sm:px-3 text-right font-mono">{fmtNumber(m.support, lang)}</td>
                  <td className="px-2 py-2 sm:px-3 text-right font-mono">{pct(m.precision)}</td>
                  <td className="px-2 py-2 sm:px-3 text-right font-mono">{pct(m.recall)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-2 text-xs text-secondary-500 dark:text-secondary-400">{t('metrics.definitions')}</p>

      <div className="mt-4 rounded-xl border border-secondary-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-900">
        <button type="button" aria-expanded={showErrors} onClick={() => setShowErrors((x) => !x)} className={`rounded text-sm font-semibold text-secondary-900 dark:text-white ${focusRing}`}>
          {t('metrics.errorsTitle', { n: ev.errors.length })} {showErrors ? '▴' : '▾'}
        </button>
        {showErrors && (
          <ul className="mt-3 space-y-2 text-sm">
            {ev.errors.map((e) => (
              <li key={e.id} className="rounded-lg bg-secondary-50 p-2 dark:bg-secondary-800/60">
                <p className="text-secondary-800 dark:text-secondary-100">«{e.text}»</p>
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-secondary-600 dark:text-secondary-400">
                  {t('metrics.expected')} <CategoryChip label={e.expected} /> {t('metrics.got')} <CategoryChip label={e.got} />
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <SimNote className="mt-4">{t('metrics.note')}</SimNote>
    </section>
  );
}
