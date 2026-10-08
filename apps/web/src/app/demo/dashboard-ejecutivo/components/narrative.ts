'use client';

/**
 * Textos armados con plantillas a partir de las cifras (alertas, hallazgos del
 * resumen automático y el "resumen del lunes"). No usan IA: cada frase cita los
 * números calculados por el motor, así coinciden con el tablero y con el PDF.
 */
import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { Alert, Finding } from '../lib/engine';
import { forecastVsGoal } from '../lib/engine';
import { useDashboard } from '../lib/store';
import type { MonthKey, Recipient } from '../lib/types';
import { NS, useFmt, useLabels } from './ui';

export function useNarrative() {
  const t = useTranslations(NS);
  const fmt = useFmt();
  const { line } = useLabels();
  const { period, ctx, alerts, company } = useDashboard();
  const periodName = fmt.periodIn(period);
  const range = useCallback((from: MonthKey, to: MonthKey) => (from === to ? fmt.month(from) : `${fmt.month(from, true)} – ${fmt.month(to, true)}`), [fmt]);

  const alertTitle = useCallback(
    (a: Alert) => {
      switch (a.kind) {
        case 'cityGoal':
          return t('alerts.items.cityGoal.title', { city: a.labels.city });
        case 'lineMargin':
          return t('alerts.items.lineMargin.title', { line: line(a.labels.line) });
        case 'customersRisk':
          return t('alerts.items.customersRisk.title', { count: a.values.count });
        default:
          return t(`alerts.items.${a.kind}.title`);
      }
    },
    [t, line],
  );

  const alertText = useCallback(
    (a: Alert) => {
      const v = a.values;
      switch (a.kind) {
        case 'salesGoal':
          return t('alerts.items.salesGoal.text', { period: periodName, sales: fmt.moneyM(v.sales), gap: fmt.pct(v.gap), budget: fmt.moneyM(v.budget) });
        case 'cityGoal':
          return t('alerts.items.cityGoal.text', { city: a.labels.city, sales: fmt.moneyM(v.sales), gap: fmt.pct(v.gap), budget: fmt.moneyM(v.budget) });
        case 'lineMargin':
          return t('alerts.items.lineMargin.text', { line: line(a.labels.line), margin: fmt.pct(v.margin), prev: fmt.pct(v.prev), drop: fmt.num(v.drop, 1) });
        case 'overdue90':
          return t('alerts.items.overdue90.text', { before: fmt.moneyM(v.before), now: fmt.moneyM(v.now), growth: fmt.signedPct(v.growth) });
        case 'cashFloor':
          return t('alerts.items.cashFloor.text', { start: fmt.date(a.labels.start), end: fmt.date(a.labels.end), balance: fmt.moneyM(v.balance), floor: fmt.moneyM(v.floor) });
        case 'customersRisk':
          return t('alerts.items.customersRisk.text', { count: v.count, names: a.labels.names, lost: fmt.moneyM(v.lost), drop: fmt.num(ctx.params.thresholds.riskDrop) });
        case 'forecastGoal':
          return t('alerts.items.forecastGoal.text', { range: range(a.labels.from, a.labels.to), value: fmt.moneyM(v.value), compliance: fmt.pct(v.compliance, 0) });
        default:
          return '';
      }
    },
    [t, fmt, line, periodName, range, ctx.params.thresholds.riskDrop],
  );

  const findingText = useCallback(
    (f: Finding) => {
      const v = f.values;
      switch (f.kind) {
        case 'sales':
          return t(v.compliance < 1 ? 'findings.salesBelow' : 'findings.salesAbove', {
            period: periodName,
            sales: fmt.moneyM(v.sales),
            gap: fmt.pct(Math.abs(1 - v.compliance)),
            budget: fmt.moneyM(v.budget),
            city: f.labels.city,
            cityDiff: fmt.moneyM(Math.abs(v.cityDiff)),
            cityCompliance: fmt.pct(v.cityCompliance, 0),
          });
        case 'margin':
          return t('findings.margin', {
            margin: fmt.pct(v.margin),
            prev: fmt.pct(v.prev),
            delta: fmt.signedPts(v.margin - v.prev),
            line: f.labels.line ? line(f.labels.line) : '—',
            linePrev: fmt.pct(v.linePrev),
            lineMargin: fmt.pct(v.lineMargin),
          });
        case 'overdue':
          return t('findings.overdue', { over90: fmt.moneyM(v.over90), count: v.count, share: fmt.pct(v.share, 0), names: f.labels.names });
        case 'forecast':
          return t(v.hasBudget ? 'findings.forecast' : 'findings.forecastNoBudget', {
            range: range(f.labels.from, f.labels.to),
            value: fmt.moneyM(v.value),
            low: fmt.moneyM(v.low),
            high: fmt.moneyM(v.high),
            compliance: fmt.pct(v.compliance, 0),
          });
        default:
          return '';
      }
    },
    [t, fmt, line, periodName, range],
  );

  const recipientName = useCallback((r: Recipient) => r.name.trim() || (r.role ? t(`settings.roles.${r.role}`) : r.address), [t]);

  /** Texto del resumen semanal (WhatsApp / correo). `link` se agrega al compartir. */
  const weekly = useMemo(() => {
    const k = ctx.kpis;
    const lines: string[] = [t('weekly.title', { company: company.name })];
    lines.push(
      k.compliance !== null
        ? t('weekly.sales', { period: periodName, sales: fmt.moneyM(k.sales), compliance: fmt.pct(k.compliance, 0) })
        : t('weekly.salesNoGoal', { period: periodName, sales: fmt.moneyM(k.sales) }),
    );
    if (k.margin !== null) lines.push(k.marginPrev !== null ? t('weekly.margin', { margin: fmt.pct(k.margin), delta: fmt.signedPts(k.margin - k.marginPrev) }) : t('weekly.marginNoPrev', { margin: fmt.pct(k.margin) }));
    if (k.over60 !== null) lines.push(t('weekly.overdue', { over60: fmt.moneyM(k.over60) }));
    lines.push(alerts.length ? t('weekly.alerts', { count: alerts.length, top: alertTitle(alerts[0]) }) : t('weekly.noAlerts'));
    const fq = forecastVsGoal(ctx);
    if (fq) lines.push(t('weekly.forecast', { range: range(fq.months[0], fq.months[fq.months.length - 1]), value: fmt.moneyM(fq.value) }));
    return lines;
  }, [ctx, alerts, company.name, periodName, fmt, t, alertTitle, range]);

  return { alertTitle, alertText, findingText, recipientName, weekly, periodName, range };
}
