'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { ChatBubbleLeftRightIcon, TrashIcon } from '@heroicons/react/24/outline';
import { forecastVsGoal, hasMonths, totals, yearBefore } from '../lib/engine';
import { useDashboard } from '../lib/store';
import { btn, card, inputCls, Note, NS, SectionTitle, useFmt, useLabels } from './ui';

export type QuestionId = 'margin' | 'customersDown' | 'cash8' | 'cityGoal' | 'overdue' | 'forecast';
const QUESTIONS: QuestionId[] = ['customersDown', 'margin', 'cityGoal', 'overdue', 'cash8', 'forecast'];

/** Palabras clave (sin tildes) que llevan a cada pregunta guiada. */
const KEYWORDS: Record<QuestionId, string[]> = {
  margin: ['margen', 'margin', 'rentabil', 'utilidad bruta', 'profit'],
  customersDown: ['cliente', 'compran menos', 'customer', 'clients', 'buy less', 'perdi', 'riesgo'],
  cash8: ['caja', 'efectivo', 'liquidez', 'cash', 'flujo'],
  cityGoal: ['ciudad', 'sede', 'meta', 'city', 'branch', 'goal', 'presupuesto', 'budget'],
  overdue: ['cartera', 'vencid', 'deben', 'deuda', 'cobr', 'overdue', 'receivable', 'owe'],
  forecast: ['proyecc', 'pronostic', 'trimestre', 'cierre', 'cerrar', 'forecast', 'quarter', 'projection', 'proximo'],
};

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export function matchQuestion(text: string): QuestionId | null {
  const n = normalize(text);
  let best: QuestionId | null = null;
  let bestScore = 0;
  for (const q of QUESTIONS) {
    const score = KEYWORDS[q].reduce((s, k) => s + (n.includes(k) ? k.length : 0), 0);
    if (score > bestScore) {
      best = q;
      bestScore = score;
    }
  }
  return best;
}

interface AnswerRow {
  label: string;
  value: string;
  extra?: string;
  /** 0–1 para la barra. */
  bar?: number;
  tone?: 'good' | 'bad';
}

interface Answer {
  id: number;
  question: string;
  headline: string;
  rows: AnswerRow[];
  how: string;
  period: string;
}

export default function Ask() {
  const t = useTranslations(`${NS}.ask`);
  const fmt = useFmt();
  const labels = useLabels();
  const { ctx, period, dataset } = useDashboard();
  const [text, setText] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [miss, setMiss] = useState<string | null>(null);
  const seq = useRef(0);

  const available: Record<QuestionId, boolean> = {
    margin: dataset.hasCost && ctx.kpis.marginPrev !== null,
    customersDown: hasMonths(ctx.idx, yearBefore(period.months)),
    cash8: !!ctx.cash,
    cityGoal: ctx.cities.some((c) => c.budget !== null),
    overdue: !!ctx.aging,
    forecast: ctx.fc.points.length > 0,
  };

  const compute = (q: QuestionId): Omit<Answer, 'id' | 'question' | 'period'> => {
    const pName = fmt.periodIn(period);
    switch (q) {
      case 'margin': {
        const k = ctx.kpis;
        const rows = ctx.lines
          .filter((l) => l.prevMargin !== null && l.sales > 0)
          .map((l) => ({ l, d: l.margin - (l.prevMargin ?? 0) }))
          .sort((a, b) => a.d - b.d)
          .map(({ l, d }) => ({
            label: labels.line(l.key),
            value: `${fmt.pct(l.prevMargin ?? 0)} → ${fmt.pct(l.margin)}`,
            extra: `${fmt.signedPts(d)} · ${t('share', { pct: fmt.pct(l.share, 0) })}`,
            tone: d < 0 ? ('bad' as const) : ('good' as const),
          }));
        const worst = rows[0];
        return {
          headline: t('a.margin', { period: pName, prev: fmt.pct(k.marginPrev ?? 0), now: fmt.pct(k.margin ?? 0), delta: fmt.signedPts((k.margin ?? 0) - (k.marginPrev ?? 0)), line: worst?.label ?? '—' }),
          rows,
          how: t('how.margin', { prevYear: period.year - 1 }),
        };
      }
      case 'customersDown': {
        const down = ctx.customers.filter((c) => c.prevSales && c.yoy !== null && c.yoy < 0).sort((a, b) => (a.sales - (a.prevSales ?? 0)) - (b.sales - (b.prevSales ?? 0)));
        const lost = down.reduce((s, c) => s + ((c.prevSales ?? 0) - c.sales), 0);
        const maxLost = Math.max(1, ...down.map((c) => (c.prevSales ?? 0) - c.sales));
        return {
          headline: down.length ? t('a.customersDown', { count: down.length, lost: fmt.moneyM(lost), period: pName }) : t('a.customersDownNone', { period: pName }),
          rows: down.slice(0, 8).map((c) => ({
            label: c.name,
            value: fmt.signedPct(c.yoy ?? 0),
            extra: `${fmt.moneyM(c.prevSales ?? 0)} → ${fmt.moneyM(c.sales)}`,
            bar: ((c.prevSales ?? 0) - c.sales) / maxLost,
            tone: 'bad' as const,
          })),
          how: t('how.customersDown', { prevYear: period.year - 1 }),
        };
      }
      case 'cash8': {
        const cash = ctx.cash!;
        const w8 = cash.weeks[7];
        return {
          headline: t('a.cash8', { date: fmt.date(w8.end), balance: fmt.moneyM(w8.balance), min: fmt.moneyM(cash.min.balance), minDate: fmt.date(cash.min.start) }),
          rows: cash.weeks.slice(0, 8).map((w) => ({
            label: t('weekLabel', { n: w.n, date: fmt.date(w.start) }),
            value: fmt.moneyM(w.balance),
            extra: t('weekFlows', { inflow: fmt.moneyM(w.collections + w.newSales), outflow: fmt.moneyM(w.suppliers + w.payroll + w.rent + w.other + w.tax) }),
            bar: Math.max(0, w.balance) / Math.max(1, ...cash.weeks.slice(0, 8).map((x) => x.balance)),
            tone: w.balance < ctx.params.thresholds.cashFloor * 1e6 ? ('bad' as const) : undefined,
          })),
          how: t('how.cash8', { date: fmt.date(dataset.cutoff), start: fmt.moneyM(cash.start) }),
        };
      }
      case 'cityGoal': {
        const list = ctx.cities.filter((c) => c.compliance !== null).sort((a, b) => (a.compliance ?? 0) - (b.compliance ?? 0));
        const worst = list[0];
        return {
          headline: worst
            ? t('a.cityGoal', { dim: labels.cityDim.toLowerCase(), city: worst.key, pct: fmt.pct(worst.compliance ?? 0, 0), gap: fmt.moneyM((worst.budget ?? 0) - worst.sales), period: pName })
            : t('a.noData'),
          rows: list.map((c) => ({
            label: c.key,
            value: fmt.pct(c.compliance ?? 0, 0),
            extra: `${fmt.moneyM(c.sales)} / ${fmt.moneyM(c.budget ?? 0)}`,
            bar: Math.min(1.2, c.compliance ?? 0) / 1.2,
            tone: (c.compliance ?? 0) >= 1 ? ('good' as const) : ('bad' as const),
          })),
          how: t('how.cityGoal', { goal: fmt.num(ctx.params.goalGrowth, 1), prevYear: period.year - 1 }),
        };
      }
      case 'overdue': {
        const ag = ctx.aging!;
        const top = ag.customers.filter((c) => c.over60 > 0).slice(0, 5);
        const share = ag.over60 ? top.reduce((s, c) => s + c.over60, 0) / ag.over60 : 0;
        return {
          headline: t('a.overdue', { total: fmt.moneyM(ag.over60), date: fmt.date(ag.asOf), count: top.length, share: fmt.pct(share, 0) }),
          rows: top.map((c) => ({
            label: c.customer,
            value: fmt.moneyM(c.over60),
            extra: t('over90', { value: fmt.moneyM(c.over90) }),
            bar: ag.over60 ? c.over60 / ag.over60 : 0,
            tone: 'bad' as const,
          })),
          how: t('how.overdue'),
        };
      }
      case 'forecast': {
        const fq = forecastVsGoal(ctx)!;
        const last3 = ctx.idx.ds.months.slice(-3);
        const growth = hasMonths(ctx.idx, yearBefore(last3)) ? totals(ctx.idx, last3).sales / totals(ctx.idx, yearBefore(last3)).sales - 1 : null;
        return {
          headline: fq.budget
            ? t('a.forecast', { from: fmt.month(fq.months[0], true), to: fmt.month(fq.months[fq.months.length - 1], true), value: fmt.moneyM(fq.value), pct: fmt.pct(fq.value / fq.budget, 0), low: fmt.moneyM(fq.low), high: fmt.moneyM(fq.high) })
            : t('a.forecastNoGoal', { from: fmt.month(fq.months[0], true), to: fmt.month(fq.months[fq.months.length - 1], true), value: fmt.moneyM(fq.value), low: fmt.moneyM(fq.low), high: fmt.moneyM(fq.high) }),
          rows: ctx.fc.points.map((p) => ({
            label: fmt.monthTitle(p.month),
            value: fmt.moneyM(p.value),
            extra: t('range', { low: fmt.moneyM(p.low), high: fmt.moneyM(p.high) }),
          })),
          how:
            ctx.fc.method === 'seasonal'
              ? t('how.forecastSeasonal', { growth: growth !== null ? fmt.signedPct(growth) : '—', sigma: fmt.pct(ctx.fc.sigma) })
              : t('how.forecastTrend', { sigma: fmt.pct(ctx.fc.sigma) }),
        };
      }
    }
  };

  const ask = (q: QuestionId, question: string) => {
    setMiss(null);
    const a = compute(q);
    setAnswers((list) => [{ id: ++seq.current, question, period: fmt.period(period), ...a }, ...list].slice(0, 10));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    const q = matchQuestion(value);
    if (q && available[q]) {
      ask(q, value);
      setText('');
    } else setMiss(value);
  };

  return (
    <div className="space-y-6">
      <section className={`${card} p-5 sm:p-6`} aria-labelledby="ask-title">
        <SectionTitle
          title={
            <span id="ask-title" className="inline-flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-purple-600" aria-hidden="true" />
              {t('title')}
            </span>
          }
          subtitle={t('subtitle', { period: fmt.periodIn(period) })}
        />
        <div className="flex flex-wrap gap-2 mb-4">
          {QUESTIONS.filter((q) => available[q]).map((q) => (
            <button key={q} type="button" className="px-3 py-2 rounded-full text-sm border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-left" onClick={() => ask(q, t(`q.${q}`))}>
              {t(`q.${q}`)}
            </button>
          ))}
        </div>
        <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
          <label htmlFor="ask-input" className="sr-only">
            {t('inputLabel')}
          </label>
          <input id="ask-input" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('placeholder')} className={inputCls} maxLength={200} />
          <button type="submit" className={btn.primary} disabled={!text.trim()}>
            {t('send')}
          </button>
        </form>
        {miss && (
          <div className="mt-3">
            <Note tone="amber">{t('miss', { text: miss })}</Note>
          </div>
        )}
        <div className="mt-3">
          <Note>{t('note')}</Note>
        </div>
      </section>

      {answers.length > 0 && (
        <div className="flex justify-end">
          <button type="button" className={btn.small} onClick={() => setAnswers([])}>
            <TrashIcon className="w-4 h-4" aria-hidden="true" />
            {t('clear')}
          </button>
        </div>
      )}
      <ol className="space-y-4" aria-live="polite">
        {answers.map((a) => (
          <li key={a.id} className={`${card} p-5`}>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('youAsked')} · {a.period}
            </p>
            <p className="font-semibold text-slate-900 dark:text-white mb-2">“{a.question}”</p>
            <p className="text-sm text-slate-800 dark:text-slate-100 mb-3">{a.headline}</p>
            {a.rows.length > 0 && (
              <ul className="space-y-2 mb-3">
                {a.rows.map((r) => (
                  <li key={r.label} className="text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-700 dark:text-slate-200 truncate">{r.label}</span>
                      <span className={`font-semibold whitespace-nowrap ${r.tone === 'bad' ? 'text-red-700 dark:text-red-400' : r.tone === 'good' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>{r.value}</span>
                    </div>
                    {r.extra && <div className="text-xs text-slate-500 dark:text-slate-400">{r.extra}</div>}
                    {r.bar !== undefined && (
                      <div className="h-1.5 mt-1 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className={`h-1.5 rounded-full ${r.tone === 'bad' ? 'bg-red-500' : r.tone === 'good' ? 'bg-emerald-500' : 'bg-[#7c3aed] dark:bg-[#9085e9]'}`} style={{ width: `${Math.max(2, Math.min(100, r.bar * 100))}%` }} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <details className="text-xs text-slate-600 dark:text-slate-300">
              <summary className="cursor-pointer font-semibold text-purple-700 dark:text-purple-300">{t('howTitle')}</summary>
              <p className="mt-1">{a.how}</p>
            </details>
          </li>
        ))}
      </ol>
    </div>
  );
}
