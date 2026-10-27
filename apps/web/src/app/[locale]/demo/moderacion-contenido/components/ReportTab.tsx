'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { CATEGORY_MIX, REPORT_MONTHS } from '../lib/data';
import { downloadReportPdf } from '../lib/files';
import { fmtDate, fmtMonth, fmtNumber, fmtPct, previousMonths } from '../lib/format';
import { useModeration } from '../lib/store';
import { CATEGORIES } from '../lib/types';
import { BarChart, CategoryBars, SectionTitle, SimNote, Stat } from './ui';
import { useText } from './useText';

export default function ReportTab() {
  const t = useTranslations('demoModeration');
  const { s, lang, now, views, toast } = useModeration();
  const { ruleText } = useText();
  const [busy, setBusy] = useState(false);
  const months = previousMonths(now, REPORT_MONTHS.length);
  const removed = REPORT_MONTHS.reduce((a, m) => a + m.removed, 0);
  const appeals = REPORT_MONTHS.reduce((a, m) => a + m.appeals, 0);
  const reinstated = REPORT_MONTHS.reduce((a, m) => a + m.reinstated, 0);
  const period = `${fmtMonth(months[0], lang, true)} – ${fmtMonth(months[months.length - 1], lang, true)}`;

  const count = (status: string) => views.filter((v) => v.status === status).length;
  const session: Array<[string, number]> = [
    [t('report.sApproved'), count('approved')],
    [t('report.sRejected'), count('rejected')],
    [t('report.sEscalated'), count('escalated')],
    [t('report.sAuto'), count('auto')],
    [t('report.sUpheld'), s.appeals.filter((a) => a.status === 'upheld').length],
    [t('report.sReversed'), s.appeals.filter((a) => a.status === 'reversed').length],
  ];
  const catRows = CATEGORIES.map((c) => ({ label: c, value: CATEGORY_MIX[c], display: fmtPct(CATEGORY_MIX[c] / 100, lang) })).sort((a, b) => b.value - a.value);

  const download = async () => {
    setBusy(true);
    try {
      await downloadReportPdf(
        {
          title: t('report.pdfTitle'),
          disclaimer: t('report.pdfDisclaimer'),
          generated: t('report.pdfGenerated', { date: fmtDate(Date.now(), lang) }),
          period: t('report.period', { period }),
          kpisTitle: t('report.kpisTitle'),
          kpis: [
            [t('report.removed'), fmtNumber(removed, lang)],
            [t('report.appealsReceived'), fmtNumber(appeals, lang)],
            [t('report.reinstated'), `${fmtNumber(reinstated, lang)} (${fmtPct(reinstated / appeals, lang, 1)})`],
          ],
          monthsTitle: t('report.byMonth'),
          monthHeaders: [t('report.month'), t('report.colRemoved'), t('report.colAppeals'), t('report.colReinstated')],
          months: REPORT_MONTHS.map((m, i) => [fmtMonth(months[i], lang, true), fmtNumber(m.removed, lang), fmtNumber(m.appeals, lang), fmtNumber(m.reinstated, lang)]),
          categoriesTitle: t('report.byCategory'),
          categories: catRows.map((r) => [t(`categories.${r.label}.name`), r.display]),
          sessionTitle: t('report.sessionTitle'),
          session: session.map(([k, v]) => [k, fmtNumber(v, lang)]),
          rulesTitle: t('report.rulesTitle'),
          rules: s.rules.map((r, i) => `${i + 1}. ${ruleText(r)}${r.active ? '' : ` (${t('rules.paused')})`}`),
          footer: t('report.pdfFooter'),
        },
        `informe-transparencia-ejemplo-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
      toast(t('report.downloaded'));
    } catch {
      toast(t('report.downloadError'), 'warn');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <SectionTitle
        title={t('report.title')}
        subtitle={t('report.subtitle', { period })}
        actions={
          <Button variant="outline" size="sm" onClick={download} isLoading={busy} disabled={busy} className="gap-1 whitespace-nowrap">
            {!busy && <DocumentArrowDownIcon className="h-4 w-4" aria-hidden />}
            {t('report.download')}
          </Button>
        }
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label={t('report.removed')} value={fmtNumber(removed, lang)} hint={t('report.sample')} />
        <Stat label={t('report.appealsReceived')} value={fmtNumber(appeals, lang)} hint={t('report.sample')} />
        <Stat label={t('report.reinstated')} value={fmtPct(reinstated / appeals, lang, 1)} hint={t('report.reinstatedHint', { n: fmtNumber(reinstated, lang) })} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-secondary-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-900">
          <h3 className="mb-4 text-lg font-semibold text-secondary-900 dark:text-white">{t('report.byMonth')}</h3>
          <BarChart ariaLabel={t('report.byMonth')} data={REPORT_MONTHS.map((m, i) => ({ label: fmtMonth(months[i], lang), value: m.removed, display: fmtNumber(m.removed, lang) }))} />
        </div>
        <div className="rounded-xl border border-secondary-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-900">
          <h3 className="mb-4 text-lg font-semibold text-secondary-900 dark:text-white">{t('report.byCategory')}</h3>
          <CategoryBars rows={catRows} />
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-secondary-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-900">
        <h3 className="mb-1 text-lg font-semibold text-secondary-900 dark:text-white">{t('report.sessionTitle')}</h3>
        <p className="mb-3 text-xs text-secondary-500 dark:text-secondary-400">{t('report.sessionHint')}</p>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {session.map(([k, v]) => (
            <div key={k} className="rounded-lg bg-secondary-50 p-2 dark:bg-secondary-800/60">
              <dt className="text-xs text-secondary-600 dark:text-secondary-400">{k}</dt>
              <dd className="text-xl font-bold text-secondary-900 dark:text-white">{fmtNumber(v, lang)}</dd>
            </div>
          ))}
        </dl>
      </div>
      <SimNote className="mt-4">{t('report.note')}</SimNote>
    </section>
  );
}
