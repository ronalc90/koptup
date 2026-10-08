'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  ActivityEvent,
  Deal,
  OWNERS,
  Recommendation,
  ScoreFactor,
  daysSince,
  formatCOP,
  formatCOPShort,
  formatDate,
} from './crm';

/** Textos y formatos del CRM de ejemplo en el idioma activo. */
export function useCrmText() {
  const t = useTranslations('demoCrm');
  const locale = useLocale();
  const months = t.raw('dates.months') as string[];

  const dataText = (d: Deal, field: 'role' | 'title' | 'nextAction') => {
    const own = d[field];
    if (own) return own;
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
    return t(`events.${e.key}`, p);
  };

  const factorLabel = (d: Deal, f: ScoreFactor) => {
    switch (f.id) {
      case 'fit':
        return t('customer360.factors.fit', { size: t(`sizes.${d.size}`) });
      case 'engagement':
        return t('customer360.factors.engagement', { count: d.interactions30d });
      case 'recency':
        return t('customer360.factors.recency', { ago: t('dates.ago', { days: daysSince(d.lastContact) }) });
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

  return {
    t,
    locale,
    factorLabel,
    recText,
    role: (d: Deal) => dataText(d, 'role'),
    title: (d: Deal) => dataText(d, 'title'),
    nextAction: (d: Deal) => dataText(d, 'nextAction'),
    ownerName: (d: Deal) => OWNERS[d.owner]?.name ?? '',
    pct: (n: number) => (locale === 'en' ? `${n}%` : `${n} %`),
    money: (v: number) => formatCOP(v, locale),
    moneyShort: (v: number) => formatCOPShort(v, locale),
    date: (iso: string) => formatDate(iso, months, locale),
    ago: (iso: string) => t('dates.ago', { days: daysSince(iso) }),
    eventText,
  };
}

export type CrmText = ReturnType<typeof useCrmText>;
