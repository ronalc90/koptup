'use client';

import { useTranslations } from 'next-intl';
import { pick, useModeration } from '../lib/store';
import type { AuditEntry, Rule } from '../lib/types';
import { fmtPct } from '../lib/format';

/** Textos derivados que se usan en varias pestañas (tiempos, reglas, auditoría). */
export function useText() {
  const t = useTranslations('demoModeration');
  const { now, lang } = useModeration();

  const ago = (iso: string) => {
    const min = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
    if (min < 1) return t('time.justNow');
    if (min < 60) return t('time.minutesAgo', { n: min });
    if (min < 48 * 60) return t('time.hoursAgo', { n: Math.floor(min / 60) });
    return t('time.daysAgo', { n: Math.floor(min / 1440) });
  };

  const accountAge = (days: number) => {
    if (days <= 0) return '—';
    if (days < 60) return t('time.days', { n: days });
    if (days < 730) return t('time.months', { n: Math.floor(days / 30) });
    return t('time.years', { n: Math.floor(days / 365) });
  };

  const ruleText = (r: Rule) => {
    const cat = r.category === 'any' ? t('rules.anyCategory') : t(`categories.${r.category}.name`);
    const cond =
      r.operator === 'between'
        ? t('rules.condBetween', { a: fmtPct(Math.min(r.threshold, r.threshold2 ?? 1), lang), b: fmtPct(Math.max(r.threshold, r.threshold2 ?? 1), lang) })
        : t(`rules.cond_${r.operator}`, { a: fmtPct(r.threshold, lang) });
    return t('rules.sentence', { category: cat, condition: cond, action: t(`actions.${r.action}`) });
  };

  const actor = (e: AuditEntry) => {
    if (e.actor.kind === 'you') return t('common.you');
    if (e.actor.kind === 'rule') return e.actor.ruleNo ? t('audit.ruleActor', { n: e.actor.ruleNo }) : t('audit.systemActor');
    if (e.actor.kind === 'system') return t('audit.systemActor');
    return e.actor.name ?? '—';
  };

  const detail = (e: AuditEntry) => {
    const parts: string[] = [];
    if (e.action === 'recategorize' && e.from && e.to) parts.push(t('audit.detail.recategorize', { from: t(`categories.${e.from}.name`), to: t(`categories.${e.to}.name`) }));
    else if (e.policy) parts.push(t('audit.detail.policy', { policy: t(`categories.${e.policy}.name`) }));
    if (e.measure) parts.push(t('audit.detail.measure', { measure: t(`measures.${e.measure}`) }));
    if (e.team) parts.push(t('audit.detail.team', { team: t(`teams.${e.team}`) }));
    if (e.ruleAction) parts.push(t('audit.detail.ruleAction', { action: t(`actions.${e.ruleAction}`) }));
    if (e.changes) parts.push(t('audit.detail.changes', { n: e.changes }));
    const note = pick(e.note, lang);
    if (note) parts.push(t('audit.detail.note', { note }));
    return parts.join(' · ') || '—';
  };

  return { ago, accountAge, ruleText, actor, detail };
}
