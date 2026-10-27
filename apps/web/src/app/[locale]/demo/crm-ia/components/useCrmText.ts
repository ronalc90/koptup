'use client';

import { createContext, useContext } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  ActivityEvent,
  Deal,
  OWNERS,
  PeriodId,
  Recommendation,
  SEED_REF_DATE,
  ScoreFactor,
  daysSince,
  formatCOP,
  formatCOPShort,
  formatDate,
  periodRange,
  probabilityOf,
  recommendationsFor,
  scoreFactors,
  scoreOf,
  timelineFor,
  weightedValue,
} from './crm';

/**
 * Fecha de corte de la demo («hoy»). La página la provee con la del estado:
 * la semilla en el primer render y la fecha de hoy (Colombia) ya montada.
 */
export const CrmRefContext = createContext<string>(SEED_REF_DATE);

/** Textos, formatos y cálculos del CRM de ejemplo en el idioma activo y con la fecha de corte vigente. */
export function useCrmText() {
  const t = useTranslations('demoCrm');
  const locale = useLocale();
  const ref = useContext(CrmRefContext);
  const months = t.raw('dates.months') as string[];
  const monthsLong = t.raw('dates.monthsLong') as string[];

  const dataText = (d: Deal, field: 'role' | 'title' | 'nextAction') => {
    if (field === 'nextAction' && d.nextActionAuto) return t(`nextActionAuto.${d.nextActionAuto}`);
    // Un texto propio, aunque esté vacío (p. ej. un cargo borrado al editar), reemplaza al de ejemplo.
    const own = d[field];
    if (own !== undefined) return own;
    return d.i18n ? t(`data.deals.${d.id}.${field}`) : '';
  };

  const eventText = (e: ActivityEvent) => {
    if (e.text) return e.text;
    const p: Record<string, string | number> = { ...(e.params ?? {}) };
    if (typeof p.stage === 'string') p.stage = t(`stages.${p.stage}`);
    if (typeof p.channel === 'string') p.channel = t(`channels.${p.channel}`);
    if (typeof p.reason === 'string') p.reason = t(`lostReasons.${p.reason}`);
    if (typeof p.source === 'string') p.source = t(`sources.${p.source}`);
    if (typeof p.step === 'string') p.step = t(`sequences.steps.${p.step}`);
    if (typeof p.fields === 'string') {
      p.fields = p.fields
        .split(',')
        .filter(Boolean)
        .map((f) => t(`customer360.fieldNames.${f}`))
        .join(', ');
    }
    return t(`events.${e.key}`, p);
  };

  const factorLabel = (d: Deal, f: ScoreFactor) => {
    switch (f.id) {
      case 'fit':
        return t('customer360.factors.fit', { size: t(`sizes.${d.size}`) });
      case 'engagement':
        return t('customer360.factors.engagement', { count: d.interactions30d });
      case 'recency':
        return t('customer360.factors.recency', { ago: t('dates.ago', { days: daysSince(d.lastContact, ref) }) });
      case 'budget':
        return t(d.budgetConfirmed ? 'customer360.factors.budget' : 'customer360.factors.budgetNo');
      case 'decision':
        return t(d.decisionMaker ? 'customer360.factors.decision' : 'customer360.factors.decisionNo');
    }
  };

  const recText = (r: Recommendation) => {
    switch (r.id) {
      case 'lost':
        return t('recs.lost', { reason: t(`lostReasons.${r.reason}`) });
      case 'overdue':
      case 'stale':
        return t(`recs.${r.id}`, { days: r.days });
      case 'stageNext':
        return t(`recs.stageNext.${r.stage}`);
      case 'channel':
        return t('recs.channel', { channel: t(`channels.${r.channel}`) });
      default:
        return t(`recs.${r.id}`);
    }
  };

  /**
   * «octubre 2026» o «4.º trimestre 2026», según la fecha de corte. Con
   * `capitalize` sirve de rótulo («Octubre 2026»); sin él, va dentro de una frase.
   */
  const periodLabel = (period: PeriodId, capitalize = false) => {
    const r = periodRange(period, ref);
    const label =
      period === 'month'
        ? t('forecast.period.month', { month: monthsLong[r.month - 1] ?? '', year: r.year })
        : t('forecast.period.quarter', { quarter: r.quarter, year: r.year });
    return capitalize ? label.charAt(0).toUpperCase() + label.slice(1) : label;
  };

  return {
    t,
    locale,
    ref,
    factorLabel,
    recText,
    periodLabel,
    role: (d: Deal) => dataText(d, 'role'),
    title: (d: Deal) => dataText(d, 'title'),
    nextAction: (d: Deal) => dataText(d, 'nextAction'),
    ownerName: (d: Deal) => OWNERS[d.owner]?.name ?? '',
    pct: (n: number) => (locale === 'en' ? `${n}%` : `${n}\u00a0%`),
    money: (v: number) => formatCOP(v, locale),
    moneyShort: (v: number) => formatCOPShort(v, locale),
    date: (iso: string) => formatDate(iso, months, locale),
    monthShort: (ym: string) => months[Number(ym.slice(5, 7)) - 1] ?? ym,
    monthLong: (ym: string) => monthsLong[Number(ym.slice(5, 7)) - 1] ?? ym,
    ago: (iso: string) => t('dates.ago', { days: daysSince(iso, ref) }),
    daysSince: (iso: string) => daysSince(iso, ref),
    score: (d: Deal) => scoreOf(d, ref),
    factors: (d: Deal) => scoreFactors(d, ref),
    prob: (d: Deal) => probabilityOf(d, ref),
    weighted: (d: Deal) => weightedValue(d, ref),
    recs: (d: Deal) => recommendationsFor(d, ref),
    timeline: (d: Deal, events: ActivityEvent[]) => timelineFor(d, events, ref),
    eventText,
  };
}

export type CrmText = ReturnType<typeof useCrmText>;
