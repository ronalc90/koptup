'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { PlusCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { fmtNumber, fmtPct } from '../lib/format';
import { BATCH_SIZE, buildBatch, countRuleChanges, simulate, type Simulation } from '../lib/logic';
import { useModeration } from '../lib/store';
import { CATEGORIES, RULE_ACTIONS, type Operator, type Rule, type RuleAction } from '../lib/types';
import { SectionTitle, SimNote, focusRing } from './ui';

const THRESHOLDS = Array.from({ length: 19 }, (_, i) => Math.round((i + 1) * 5) / 100);
const ruleSelect =
  'min-w-0 rounded-md border border-secondary-300 bg-white py-1 pl-2 pr-7 text-xs text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-800 dark:text-white';

function SimRow({ label, saved, draft, total, lang, worse }: { label: string; saved: number; draft: number | null; total: number; lang: 'es' | 'en'; worse?: 'up' | 'down' }) {
  const delta = draft === null ? 0 : draft - saved;
  const bad = worse === 'up' ? delta > 0 : worse === 'down' ? delta < 0 : false;
  return (
    <tr className="border-t border-secondary-100 dark:border-secondary-800">
      <td className="py-1.5 pr-2 text-secondary-700 dark:text-secondary-300">{label}</td>
      <td className="py-1.5 pr-2 text-right font-mono">
        {fmtNumber(saved, lang)} <span className="text-xs text-secondary-500">({fmtPct(saved / total, lang)})</span>
      </td>
      {draft !== null && (
        <td className="py-1.5 text-right font-mono">
          {fmtNumber(draft, lang)}{' '}
          {delta !== 0 && (
            <span className={`text-xs ${bad ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
              ({delta > 0 ? '+' : ''}
              {fmtNumber(delta, lang)})
            </span>
          )}
        </td>
      )}
    </tr>
  );
}

function Simulator({ saved, draft }: { saved: Simulation; draft: Simulation | null }) {
  const t = useTranslations('demoModeration.rules');
  const { lang } = useModeration();
  const cur = draft ?? saved;
  const segs: Array<{ key: string; n: number; cls: string }> = [
    { key: 'autoReject', n: cur.byAction.autoReject, cls: 'bg-red-500' },
    { key: 'warnLimit', n: cur.byAction.warn + cur.byAction.limit, cls: 'bg-amber-500' },
    { key: 'autoApprove', n: cur.byAction.autoApprove, cls: 'bg-emerald-500' },
    { key: 'humanReview', n: cur.byAction.humanReview, cls: 'bg-sky-500' },
    { key: 'escalate', n: cur.byAction.escalate, cls: 'bg-purple-500' },
  ];
  return (
    <div className="rounded-xl border border-secondary-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-900">
      <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">{t('simTitle')}</h3>
      <p className="mb-3 text-xs text-secondary-500 dark:text-secondary-400">{t('simHint', { n: fmtNumber(BATCH_SIZE, lang) })}</p>
      <div className="mb-2 flex h-3 overflow-hidden rounded-full bg-secondary-100 dark:bg-secondary-800" role="img" aria-label={t('simTitle')}>
        {segs.map((sg) => (
          <div key={sg.key} className={sg.cls} style={{ width: `${(sg.n / cur.total) * 100}%` }} />
        ))}
      </div>
      <ul className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-secondary-600 dark:text-secondary-400">
        {segs.map((sg) => (
          <li key={sg.key} className="inline-flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${sg.cls}`} aria-hidden />
            {t(`seg.${sg.key}`)}
          </li>
        ))}
      </ul>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-secondary-500 dark:text-secondary-400">
              <th className="pb-1 text-left font-medium">{t('simOutcome')}</th>
              <th className="pb-1 text-right font-medium">{t('simSaved')}</th>
              {draft && <th className="pb-1 text-right font-medium">{t('simDraft')}</th>}
            </tr>
          </thead>
          <tbody>
            <SimRow label={t('seg.automatic')} saved={saved.automatic} draft={draft?.automatic ?? null} total={saved.total} lang={lang} />
            <SimRow label={t('seg.autoReject')} saved={saved.byAction.autoReject} draft={draft?.byAction.autoReject ?? null} total={saved.total} lang={lang} />
            <SimRow label={t('seg.warnLimit')} saved={saved.byAction.warn + saved.byAction.limit} draft={draft ? draft.byAction.warn + draft.byAction.limit : null} total={saved.total} lang={lang} />
            <SimRow label={t('seg.autoApprove')} saved={saved.byAction.autoApprove} draft={draft?.byAction.autoApprove ?? null} total={saved.total} lang={lang} />
            <SimRow label={t('seg.humanReview')} saved={saved.byAction.humanReview} draft={draft?.byAction.humanReview ?? null} total={saved.total} lang={lang} worse="up" />
            <SimRow label={t('seg.escalate')} saved={saved.byAction.escalate} draft={draft?.byAction.escalate ?? null} total={saved.total} lang={lang} />
            <SimRow label={t('fp')} saved={saved.falsePositives} draft={draft?.falsePositives ?? null} total={saved.total} lang={lang} worse="up" />
            <SimRow label={t('fn')} saved={saved.falseNegatives} draft={draft?.falseNegatives ?? null} total={saved.total} lang={lang} worse="up" />
          </tbody>
        </table>
      </div>
      <SimNote className="mt-3">{t('simNote')}</SimNote>
    </div>
  );
}

export default function RulesTab() {
  const t = useTranslations('demoModeration');
  const { s, lang, editRules, saveRules, discardDraft, toast, go } = useModeration();
  const rules = s.draft ?? s.rules;
  const batch = useMemo(() => buildBatch(), []);
  const simSaved = useMemo(() => simulate(s.rules, batch), [s.rules, batch]);
  const simDraft = useMemo(() => (s.draft ? simulate(s.draft, batch) : null), [s.draft, batch]);
  const changes = s.draft ? countRuleChanges(s.rules, s.draft) : 0;
  const perRule = (simDraft ?? simSaved).perRule;

  const patch = (id: string, p: Partial<Rule>) => editRules((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const nextId = () => {
    const nums = rules.map((r) => Number(r.id.replace(/\D/g, '')) || 0);
    return `r-${Math.max(0, ...nums) + 1}`;
  };

  return (
    <section>
      <SectionTitle
        title={t('rules.title')}
        subtitle={t('rules.subtitle')}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => editRules((rs) => [...rs, { id: nextId(), category: 'spam', operator: 'gt', threshold: 0.7, action: 'humanReview', active: true }])}
            >
              <PlusCircleIcon className="h-4 w-4" aria-hidden />
              {t('rules.add')}
            </Button>
            {s.draft && (
              <Button variant="ghost" size="sm" onClick={() => discardDraft()}>
                {t('rules.discard')}
              </Button>
            )}
            <Button
              size="sm"
              disabled={!changes}
              onClick={() => {
                const n = saveRules();
                toast(t('rules.saved', { n }));
              }}
            >
              {t('rules.save')}
            </Button>
          </>
        }
      />
      {changes > 0 && (
        <p className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100" role="status">
          {t('rules.unsaved', { n: changes })}
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="space-y-2 xl:col-span-3">
          {rules.map((r, i) => (
            <div
              key={r.id}
              className={`rounded-lg border p-3 ${r.active ? 'border-secondary-200 bg-white dark:border-secondary-700 dark:bg-secondary-900' : 'border-dashed border-secondary-300 bg-secondary-50 opacity-80 dark:border-secondary-700 dark:bg-secondary-900/50'}`}
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 text-xs">
                  <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded bg-secondary-200 px-1 font-semibold text-secondary-700 dark:bg-secondary-700 dark:text-secondary-200">{i + 1}</span>
                  <span className="font-semibold uppercase tracking-wide text-secondary-500">{t('rules.if')}</span>
                  <select aria-label={t('rules.category', { n: i + 1 })} value={r.category} onChange={(e) => patch(r.id, { category: e.target.value as Rule['category'] })} className={ruleSelect}>
                    <option value="any">{t('rules.anyCategory')}</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {t(`categories.${c}.name`)}
                      </option>
                    ))}
                  </select>
                  <span className="text-secondary-600 dark:text-secondary-300">{t('rules.hasConfidence')}</span>
                  <select
                    aria-label={t('rules.operator', { n: i + 1 })}
                    value={r.operator}
                    onChange={(e) => {
                      const op = e.target.value as Operator;
                      patch(r.id, op === 'between' ? { operator: op, threshold2: r.threshold2 ?? Math.min(0.95, r.threshold + 0.2) } : { operator: op });
                    }}
                    className={ruleSelect}
                  >
                    {(['gt', 'lt', 'between'] as Operator[]).map((o) => (
                      <option key={o} value={o}>
                        {t(`operators.${o}`)}
                      </option>
                    ))}
                  </select>
                  <select aria-label={t('rules.threshold', { n: i + 1 })} value={String(r.threshold)} onChange={(e) => patch(r.id, { threshold: Number(e.target.value) })} className={ruleSelect}>
                    {THRESHOLDS.map((x) => (
                      <option key={x} value={String(x)}>
                        {fmtPct(x, lang)}
                      </option>
                    ))}
                  </select>
                  {r.operator === 'between' && (
                    <>
                      <span className="text-secondary-500">{t('rules.and')}</span>
                      <select aria-label={t('rules.threshold2', { n: i + 1 })} value={String(r.threshold2 ?? 0.9)} onChange={(e) => patch(r.id, { threshold2: Number(e.target.value) })} className={ruleSelect}>
                        {THRESHOLDS.map((x) => (
                          <option key={x} value={String(x)}>
                            {fmtPct(x, lang)}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                  <span className="font-semibold uppercase tracking-wide text-secondary-500">{t('rules.then')}</span>
                  <select aria-label={t('rules.action', { n: i + 1 })} value={r.action} onChange={(e) => patch(r.id, { action: e.target.value as RuleAction })} className={ruleSelect}>
                    {RULE_ACTIONS.map((a) => (
                      <option key={a} value={a}>
                        {t(`actions.${a}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    aria-pressed={r.active}
                    onClick={() => patch(r.id, { active: !r.active })}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${focusRing} ${
                      r.active ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' : 'bg-secondary-200 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-200'
                    }`}
                  >
                    {r.active ? t('rules.active') : t('rules.paused')}
                  </button>
                  <button
                    type="button"
                    onClick={() => editRules((rs) => rs.filter((x) => x.id !== r.id))}
                    className={`rounded-md p-1 text-secondary-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 ${focusRing}`}
                    aria-label={t('rules.delete', { n: i + 1 })}
                    title={t('rules.delete', { n: i + 1 })}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-1.5 text-[11px] text-secondary-500 dark:text-secondary-400">{t('rules.matches', { n: perRule[i] ?? 0 })}</p>
            </div>
          ))}
          {!rules.length && <p className="rounded-lg border border-dashed border-secondary-300 p-4 text-sm text-secondary-500 dark:border-secondary-700">{t('rules.empty')}</p>}
          <p className="text-xs text-secondary-500 dark:text-secondary-400">
            {t('rules.howApply')}{' '}
            <button type="button" onClick={() => go('queue')} className={`rounded font-medium text-primary-700 underline dark:text-primary-300 ${focusRing}`}>
              {t('rules.goQueue')}
            </button>
          </p>
        </div>
        <div className="xl:col-span-2">
          <Simulator saved={simSaved} draft={simDraft} />
        </div>
      </div>
    </section>
  );
}
