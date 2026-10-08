'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BUCKETS, forecastVsGoal, pnl } from '../lib/engine';
import { slugify } from '../lib/format';
import type { ReportData } from '../lib/pdf';
import { formatNit } from '../lib/presets';
import { useDashboard } from '../lib/store';
import { useNarrative } from './narrative';
import { NS, useFmt, useLabels } from './ui';

/** Arma el informe PDF del período con las mismas cifras del tablero. */
export function useReportPdf() {
  const t = useTranslations(NS);
  const fmt = useFmt();
  const labels = useLabels();
  const { ctx, period, company, dataset, alerts, findings, notify } = useDashboard();
  const { alertTitle, alertText, findingText, range } = useNarrative();
  const [busy, setBusy] = useState(false);

  const build = useCallback((): ReportData => {
    const k = ctx.kpis;
    const sample = dataset.source === 'sample';
    const kpis: ReportData['kpis'] = [
      {
        label: t('kpis.sales.title'),
        value: fmt.moneyM(k.sales),
        note: k.compliance !== null ? t('kpis.sales.note', { pct: fmt.pct(k.compliance, 0), budget: fmt.moneyM(k.budget ?? 0) }) : t('kpis.sales.noGoal'),
      },
    ];
    if (k.margin !== null)
      kpis.push({ label: t('kpis.margin.title'), value: fmt.pct(k.margin), note: k.marginPrev !== null ? t('kpis.margin.note', { delta: fmt.signedPts(k.margin - k.marginPrev) }) : '' });
    if (k.over60 !== null) kpis.push({ label: t('kpis.overdue.title'), value: fmt.moneyM(k.over60), note: t('kpis.overdue.note', { date: fmt.date(ctx.aging?.asOf ?? dataset.cutoff) }) });
    else kpis.push({ label: t('kpis.customers.title'), value: fmt.num(k.activeCustomers), note: k.activeCustomersYoy !== null ? t('kpis.yoy', { pct: fmt.signedPct(k.activeCustomersYoy) }) : '' });
    kpis.push({ label: t('kpis.ticket.title'), value: fmt.moneyM(k.ticket), note: t('kpis.ticket.note', { count: k.invoices }) });

    const sections: ReportData['sections'] = [];
    if (findings.length) sections.push({ title: t('report.findings'), bullets: findings.map(findingText) });

    const lines = pnl(ctx.idx, period.months, ctx.params.goalGrowth);
    const pnlName = (key: string, kind: string) => (kind === 'expense' ? labels.expense(key) : t(`finance.pnl.rows.${key}`));
    sections.push({
      title: t('finance.pnl.title'),
      table: {
        headers: [t('finance.pnl.concept'), t('finance.pnl.real'), t('finance.pnl.budget'), t('finance.pnl.variance')],
        rows: lines.map((l) => [
          pnlName(l.key, l.kind),
          fmt.moneyM(l.real),
          l.budget !== null ? fmt.moneyM(l.budget) : '—',
          l.budget ? fmt.signedPct(l.real / l.budget - 1) : '—',
        ]),
        widths: [40, 20, 20, 16],
        align: ['l', 'r', 'r', 'r'],
        bold: lines.map((l, i) => (l.kind === 'expense' ? -1 : i)).filter((i) => i >= 0),
      },
    });

    sections.push({
      title: t('report.byCity', { dim: labels.cityDimPlural.toLowerCase() }),
      table: {
        headers: [labels.cityDim, t('report.sales'), t('report.goal'), t('report.compliance'), t('report.share')],
        rows: ctx.cities.map((c) => [c.key, fmt.moneyM(c.sales), c.budget !== null ? fmt.moneyM(c.budget) : '—', c.compliance !== null ? fmt.pct(c.compliance, 0) : '—', fmt.pct(c.share, 0)]),
        widths: [30, 18, 18, 16, 14],
        align: ['l', 'r', 'r', 'r', 'r'],
      },
    });
    sections.push({
      title: t('report.byLine'),
      table: {
        headers: [t('report.line'), t('report.sales'), t('report.share'), t('report.margin'), t('report.marginPrev')],
        rows: ctx.lines.map((l) => [
          labels.line(l.key),
          fmt.moneyM(l.sales),
          fmt.pct(l.share, 0),
          dataset.hasCost ? fmt.pct(l.margin) : '—',
          dataset.hasCost && l.prevMargin !== null ? fmt.pct(l.prevMargin) : '—',
        ]),
        widths: [34, 18, 14, 14, 18],
        align: ['l', 'r', 'r', 'r', 'r'],
      },
    });
    sections.push({
      title: t('report.topCustomers'),
      table: {
        headers: [t('report.customer'), t('report.sales'), t('report.yoy'), t('report.margin'), t('report.overdue')],
        rows: ctx.customers.slice(0, 10).map((c) => [
          c.name,
          fmt.moneyM(c.sales),
          c.yoy !== null ? fmt.signedPct(c.yoy) : '—',
          c.margin !== null ? fmt.pct(c.margin) : '—',
          dataset.hasReceivables ? fmt.moneyM(c.overdue) : '—',
        ]),
        widths: [40, 16, 14, 12, 16],
        align: ['l', 'r', 'r', 'r', 'r'],
      },
    });
    if (ctx.aging) {
      sections.push({
        title: t('report.aging', { date: fmt.date(ctx.aging.asOf) }),
        table: {
          headers: [t('finance.aging.bucket'), t('report.amount'), t('report.share')],
          rows: BUCKETS.map((b) => [t(`finance.aging.buckets.${b}`), fmt.moneyM(ctx.aging!.buckets[b]), fmt.pct(ctx.aging!.total ? ctx.aging!.buckets[b] / ctx.aging!.total : 0, 0)]),
          widths: [40, 20, 14],
          align: ['l', 'r', 'r'],
        },
      });
    }
    if (ctx.cash) {
      sections.push({
        title: t('report.cash', { date: fmt.date(dataset.cutoff) }),
        paragraphs: [t('report.cashNote', { start: fmt.moneyM(ctx.cash.start), min: fmt.moneyM(ctx.cash.min.balance), week: fmt.date(ctx.cash.min.start) })],
        table: {
          headers: [t('finance.cash.week'), t('finance.cash.inflows'), t('finance.cash.outflows'), t('finance.cash.balance')],
          rows: ctx.cash.weeks.map((w) => [
            `${w.n} · ${fmt.date(w.start)}`,
            fmt.moneyM(w.collections + w.newSales),
            fmt.moneyM(w.suppliers + w.payroll + w.rent + w.other + w.tax),
            fmt.moneyM(w.balance),
          ]),
          widths: [30, 20, 20, 20],
          align: ['l', 'r', 'r', 'r'],
        },
      });
    }
    sections.push({
      title: t('report.alerts'),
      bullets: alerts.length ? alerts.map((a) => `${alertTitle(a)}: ${alertText(a)}`) : [t('alerts.empty')],
    });
    const fq = forecastVsGoal(ctx);
    sections.push({
      title: t('report.method'),
      paragraphs: [
        t('report.methodGoal', { goal: fmt.num(ctx.params.goalGrowth, 1) }),
        fq ? t('report.methodForecast', { range: range(fq.months[0], fq.months[fq.months.length - 1]), sigma: fmt.pct(ctx.fc.sigma) }) : t('report.noForecast'),
        sample ? t('report.methodSample') : t('report.methodUpload'),
      ],
    });

    return {
      title: t('report.title', { period: fmt.period(period) }),
      subtitle: sample
        ? t('report.subtitle', { company: company.name, nit: formatNit(company.nit), city: company.city, cutoff: fmt.date(dataset.cutoff) })
        : t('report.subtitleUpload', { file: dataset.fileName ?? '', cutoff: fmt.date(dataset.cutoff) }),
      badge: sample ? t('report.badgeSample') : t('report.badgeUpload'),
      kpis,
      sections,
      footer: t('report.footer'),
      pageLabel: (n, total) => t('report.page', { n, total }),
      fileName: `informe-ejecutivo-${slugify(sample ? company.name : dataset.fileName ?? 'archivo')}-${period.key.replace(':', '-')}.pdf`,
    };
  }, [ctx, period, company, dataset, alerts, findings, t, fmt, labels, alertTitle, alertText, findingText, range]);

  const download = useCallback(async () => {
    setBusy(true);
    try {
      const { buildReportPdf } = await import('../lib/pdf');
      const data = build();
      buildReportPdf(data).save(data.fileName);
      notify(t('report.done', { file: data.fileName }));
    } catch {
      notify(t('report.error'), 'error');
    } finally {
      setBusy(false);
    }
  }, [build, notify, t]);

  return { download, busy };
}
