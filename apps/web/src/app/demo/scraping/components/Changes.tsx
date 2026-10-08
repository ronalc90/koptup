'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { notify } from '../lib/notify';
import { BellAlertIcon, CheckIcon } from '@heroicons/react/24/outline';
import { DEMO_YESTERDAY, cop, date as fmtDate, dateTime, num, signedPct, type Loc } from '../lib/format';
import { scheduledTime } from '../lib/engine';
import { useDemo } from '../lib/store';
import type { Change, Column, FieldDiff, Rule, RuleType, SourceId } from '../lib/types';
import { Chip, Panel, Section, btn, type T } from './ui';

type KindFilter = 'all' | Change['kind'];

function diffLabel(d: FieldDiff, t: T) {
  return d.label ?? t(`columns.${d.labelKey}`);
}

function diffValue(raw: string, col: Column | undefined, t: T, loc: Loc): string {
  if (raw === '') return '—';
  if (!col) return raw;
  if (col.type === 'price' && !Number.isNaN(Number(raw))) return cop(Number(raw), loc);
  if (col.type === 'number' && !Number.isNaN(Number(raw))) return num(Number(raw), loc);
  if (col.type === 'date') return fmtDate(raw, loc);
  if (col.type === 'status' && col.valueKey) return t(`values.${col.valueKey}.${raw}`);
  return raw;
}

/** Regla que propone "Crear alerta" para un cambio (o null si no aplica). */
function ruleFor(sourceId: SourceId, ch: Change): { type: RuleType; value: number } | null {
  if (sourceId === 'precios' && ch.kind === 'modified') {
    if (typeof ch.meta?.pricePct === 'number') return { type: 'priceDrop', value: 1 };
    if (typeof ch.meta?.stockAfter === 'number') return { type: 'stockBelow', value: Math.max(0, Number(ch.meta.stockAfter)) };
  }
  if (sourceId === 'contratacion' && ch.kind !== 'removed') return { type: 'closingSoon', value: 3 };
  return null;
}

export default function Changes({ sourceId }: { sourceId: SourceId }) {
  const t = useTranslations('demoScraping');
  const { s, loc, update } = useDemo();
  const [kind, setKind] = useState<KindFilter>('all');
  const r = s.results[sourceId];
  if (!r) return null;
  const list = r.changes.filter((c) => kind === 'all' || c.kind === kind);
  const counts = {
    all: r.changes.length,
    added: r.changes.filter((c) => c.kind === 'added').length,
    modified: r.changes.filter((c) => c.kind === 'modified').length,
    removed: r.changes.filter((c) => c.kind === 'removed').length,
  };

  const createRule = (ch: Change, proposal: { type: RuleType; value: number }) => {
    update((p) => {
      const rule: Rule = { id: `r${p.nextRuleId}`, sourceId, type: proposal.type, value: proposal.value, enabled: true, targetKey: ch.key, targetLabel: ch.subtitle ? `${ch.title} · ${ch.subtitle}` : ch.title };
      return { ...p, rules: [...p.rules, rule], nextRuleId: p.nextRuleId + 1 };
    });
    notify.success(t('changes.ruleCreated', { title: ch.title }));
  };

  return (
    <Section
      id="scraping-changes"
      title={t('changes.title')}
      subtitle={t('changes.subtitle', { before: dateTime(`${DEMO_YESTERDAY}T${scheduledTime(sourceId)}`, loc), after: dateTime(r.at, loc) })}
    >
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('changes.filterLabel')}>
        {(['all', 'added', 'modified', 'removed'] as KindFilter[]).map((k) => (
          <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
            {t(`changes.kinds.${k}`)} ({counts[k]})
          </Chip>
        ))}
      </div>
      {list.length === 0 ? (
        <Panel>
          <p className="text-sm text-secondary-400">{r.changes.length === 0 ? t('changes.none') : t('changes.noneFiltered')}</p>
        </Panel>
      ) : (
        <ul className="space-y-3">
          {list.map((ch) => {
            const proposal = ruleFor(sourceId, ch);
            const exists = proposal && s.rules.some((x) => x.sourceId === sourceId && x.type === proposal.type && x.targetKey === ch.key);
            return (
              <li key={ch.id}>
                <Panel>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <span className={`mr-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${ch.kind === 'added' ? 'bg-emerald-500/15 text-emerald-200' : ch.kind === 'removed' ? 'bg-rose-500/15 text-rose-200' : 'bg-amber-500/15 text-amber-200'}`}>
                        {t(`changes.badge.${ch.kind}`)}
                      </span>
                      <span className="text-sm font-medium text-white">{ch.title}</span>
                      {ch.subtitle && <div className="mt-0.5 text-xs text-secondary-400">{ch.subtitle}</div>}
                    </div>
                    {proposal && (
                      <button type="button" className={`${btn.secondary} self-start`} disabled={!!exists} onClick={() => createRule(ch, proposal)}>
                        {exists ? <CheckIcon className="h-4 w-4" /> : <BellAlertIcon className="h-4 w-4" />}
                        {exists ? t('changes.ruleExists') : t(`changes.createRule.${proposal.type}`)}
                      </button>
                    )}
                  </div>
                  {ch.diffs.length > 0 && (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[420px] text-xs">
                        <thead className="text-[11px] uppercase tracking-wider text-secondary-500">
                          <tr>
                            <th className="py-1 pr-3 text-left font-medium">{t('changes.field')}</th>
                            <th className="py-1 pr-3 text-left font-medium">{t('changes.before')}</th>
                            <th className="py-1 pr-3 text-left font-medium">{t('changes.after')}</th>
                            <th className="py-1 text-right font-medium">{t('changes.variation')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-800">
                          {ch.diffs.map((d) => {
                            const col = r.columns.find((c) => c.key === d.field);
                            return (
                              <tr key={d.field}>
                                <td className="py-1.5 pr-3 text-secondary-300">{diffLabel(d, t)}</td>
                                <td className="py-1.5 pr-3 font-mono text-rose-200/90 line-through decoration-rose-400/60">{diffValue(d.before, col, t, loc)}</td>
                                <td className="py-1.5 pr-3 font-mono text-emerald-200">{diffValue(d.after, col, t, loc)}</td>
                                <td className={`py-1.5 text-right font-mono ${d.pct === undefined ? 'text-secondary-500' : d.pct < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                                  {d.pct === undefined ? '—' : signedPct(d.pct, loc)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Panel>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-[11px] text-secondary-500">{t(`changes.note.${sourceId}`)}</p>
    </Section>
  );
}
