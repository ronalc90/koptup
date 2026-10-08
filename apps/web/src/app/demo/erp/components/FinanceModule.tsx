'use client';

import { Fragment, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, ChatBubbleLeftEllipsisIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { COMPANIES, CUSTOMER_BY_ID, WORK_DATE } from '../lib/catalog';
import { AGING_BUCKETS, bucketOf, cashFlowByMonth, inCompany, payables, periodRange, receivables, saleOpenAt, type OpenItem } from '../lib/engine';
import { addDays, csvMoney, downloadCsv, downloadText, norm, toDays } from '../lib/format';
import { bankMatches } from '../lib/search';
import { useErp } from '../lib/store';
import type { BankLine, CompanyId, SaleDoc } from '../lib/types';
import { Empty, FieldLabel, Modal, MoreButton, Note, SectionHeader, SubTabs, Th, btn, plainSelectCls, rowCls, theadCls, useFmt, usePager } from './ui';

const BUCKET_COLORS = ['bg-emerald-500', 'bg-blue-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'];

export default function FinanceModule() {
  const t = useTranslations('demoErp.finance');
  const { computed, filters, state } = useErp();
  const f = useFmt();
  const r = periodRange(filters.period);
  const months = useMemo(() => {
    const endM = r.end.slice(0, 7);
    const all = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];
    const idx = all.indexOf(endM);
    return filters.period === 'ytd' ? all : all.slice(Math.max(0, idx - 5), idx + 1);
  }, [r.end, filters.period]);
  const flow = useMemo(() => cashFlowByMonth(computed.entries, filters.company, months), [computed, filters.company, months]);
  const maxVal = Math.max(1, ...flow.flatMap((x) => [x.inflow, x.outflow]));
  const inPeriod = flow.filter((x) => r.months.includes(x.month));
  const net = inPeriod.reduce((a, x) => a + x.inflow - x.outflow, 0);
  const ar = useMemo(() => receivables(state, computed, filters.company, r.end), [state, computed, filters.company, r.end]);
  const ap = useMemo(() => payables(state, computed, filters.company, r.end), [state, computed, filters.company, r.end]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card variant="bordered" padding="md" className="lg:col-span-2 min-w-0">
        <SectionHeader title={t('cash.title')} subtitle={t('cash.subtitle')} />
        <div className="flex items-end gap-2 sm:gap-4 h-48 mt-2" role="img" aria-label={t('cash.aria')}>
          {flow.map((m) => (
            <div key={m.month} className="flex-1 min-w-0 flex flex-col items-center gap-1" title={t('cash.tooltip', { month: f.month(m.month, true), inflow: f.money(m.inflow), outflow: f.money(m.outflow) })}>
              <div className="w-full flex justify-center items-end gap-0.5 sm:gap-1 h-40">
                <div className="w-1/2 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t" style={{ height: `${(m.inflow / maxVal) * 100}%` }} />
                <div className="w-1/2 bg-gradient-to-t from-rose-600 to-rose-400 rounded-t" style={{ height: `${(m.outflow / maxVal) * 100}%` }} />
              </div>
              <span className={`text-[11px] ${r.months.includes(m.month) ? 'font-bold text-secondary-900 dark:text-white' : 'text-secondary-500'}`}>{f.month(m.month)}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4 text-xs flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-secondary-700 dark:text-secondary-300">{t('cash.inflows')}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500" />
            <span className="text-secondary-700 dark:text-secondary-300">{t('cash.outflows')}</span>
          </span>
          <span className={`ml-auto font-semibold ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{t('cash.net', { value: f.money(net) })}</span>
        </div>
      </Card>

      <div className="space-y-4 min-w-0">
        <AgingCard kind="ar" items={ar} cutoff={r.end} />
        <AgingCard kind="ap" items={ap} cutoff={r.end} />
      </div>

      <ArCustomers items={ar} cutoff={r.end} />
      <Reconciliation />
    </div>
  );
}

function AgingCard({ kind, items, cutoff }: { kind: 'ar' | 'ap'; items: OpenItem[]; cutoff: string }) {
  const t = useTranslations('demoErp.finance');
  const f = useFmt();
  const sums = AGING_BUCKETS.map((b) => items.filter((x) => bucketOf(x.daysOverdue) === b).reduce((a, x) => a + x.open, 0));
  const total = sums.reduce((a, b) => a + b, 0);
  return (
    <Card variant="bordered" padding="md">
      <div className="flex items-center justify-between mb-1 gap-2">
        <h3 className="font-bold text-secondary-900 dark:text-white">{t(`aging.${kind}`)}</h3>
        <span className="text-sm font-semibold text-secondary-900 dark:text-white">{f.moneyShort(total)}</span>
      </div>
      <p className="text-[11px] text-secondary-500 mb-2">{t('aging.cutoff', { date: f.date(cutoff), n: items.length })}</p>
      <div className="space-y-2">
        {AGING_BUCKETS.map((b, i) => (
          <div key={b}>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-secondary-600 dark:text-secondary-400">{t(`aging.buckets.${b}`)}</span>
              <span className="font-semibold text-secondary-900 dark:text-white">{f.money(sums[i])}</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary-100 dark:bg-secondary-800 overflow-hidden">
              <div className={`h-full ${BUCKET_COLORS[i]}`} style={{ width: `${total ? (sums[i] / total) * 100 : 0}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ArCustomers({ items, cutoff }: { items: OpenItem[]; cutoff: string }) {
  const t = useTranslations('demoErp.finance');
  const tc = useTranslations('demoErp.common');
  const { filters, locale, goTo } = useErp();
  const f = useFmt();
  const [reminder, setReminder] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const byCustomer = useMemo(() => {
    const m: Record<string, { id: string; open: number; overdue: number; over60: number; items: OpenItem[] }> = {};
    for (const x of items) {
      const k = `${x.company}|${x.thirdId}`;
      const row = (m[k] ||= { id: k, open: 0, overdue: 0, over60: 0, items: [] });
      row.open += x.open;
      if (x.daysOverdue > 0) row.overdue += x.open;
      if (x.daysOverdue > 60) row.over60 += x.open;
      row.items.push(x);
    }
    return Object.values(m)
      .filter((row) => {
        const c = CUSTOMER_BY_ID[row.id.split('|')[1]];
        return !filters.search || norm(c.name).includes(norm(filters.search)) || row.items.some((x) => norm(x.doc).includes(norm(filters.search)));
      })
      .sort((a, b) => b.overdue - a.overdue || b.open - a.open);
  }, [items, filters.search]);
  const exportCsv = () => {
    const head = [t('ar.customer'), t('ar.company'), t('ar.doc'), t('ar.date'), t('ar.due'), t('ar.days'), t('ar.open'), tc('currency')];
    const data = items.map((x) => [CUSTOMER_BY_ID[x.thirdId].name, COMPANIES[x.company].name, x.doc, x.date, x.due, Math.max(0, x.daysOverdue), csvMoney(x.open, filters.currency), filters.currency]);
    downloadCsv(`cartera-${cutoff}.csv`, [head, ...data], locale);
    toast.success(tc('csvDone', { n: data.length }));
  };
  const rem = reminder ? byCustomer.find((x) => x.id === reminder) : null;
  return (
    <Card variant="bordered" padding="md" className="lg:col-span-3 min-w-0">
      <SectionHeader title={t('ar.title')} subtitle={t('ar.subtitle', { date: f.date(cutoff) })}>
        <button className={btn.outline} onClick={exportCsv} disabled={!items.length}>
          <ArrowDownTrayIcon className="w-4 h-4" />
          {tc('exportCsv')}
        </button>
      </SectionHeader>
      {byCustomer.length === 0 ? (
        <Empty>{t('ar.empty')}</Empty>
      ) : (
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className={theadCls}>
                <Th>{t('ar.customer')}</Th>
                <Th right>{t('ar.invoices')}</Th>
                <Th right>{t('ar.open')}</Th>
                <Th right>{t('ar.overdue')}</Th>
                <Th right>{t('ar.over60')}</Th>
                <Th className="text-right pr-0">{t('ar.actions')}</Th>
              </tr>
            </thead>
            <tbody>
              {byCustomer.map((row) => {
                const [company, cid] = row.id.split('|') as [CompanyId, string];
                const c = CUSTOMER_BY_ID[cid];
                return (
                  <Fragment key={row.id}>
                    <tr className={rowCls}>
                      <td className="py-2 pr-3">
                        <button className="text-left text-secondary-900 dark:text-white hover:underline" onClick={() => setExpanded(expanded === row.id ? null : row.id)} aria-expanded={expanded === row.id}>
                          {c.name}
                        </button>
                        <span className="block text-[11px] text-secondary-500">{COMPANIES[company].short}</span>
                      </td>
                      <td className="py-2 pr-3 text-right">{row.items.length}</td>
                      <td className="py-2 pr-3 text-right whitespace-nowrap">{f.money(row.open)}</td>
                      <td className="py-2 pr-3 text-right whitespace-nowrap">{row.overdue ? f.money(row.overdue) : '—'}</td>
                      <td className={`py-2 pr-3 text-right whitespace-nowrap ${row.over60 ? 'text-red-600 dark:text-red-400 font-semibold' : ''}`}>{row.over60 ? f.money(row.over60) : '—'}</td>
                      <td className="py-2 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1">
                          <button className={btn.ghost} onClick={() => setExpanded(expanded === row.id ? null : row.id)}>
                            {expanded === row.id ? t('ar.hide') : t('ar.show')}
                          </button>
                          {row.overdue > 0 && (
                            <button className={btn.outline} onClick={() => setReminder(row.id)}>
                              <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                              {t('ar.remind')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expanded === row.id && (
                      <tr className="bg-secondary-50/60 dark:bg-secondary-800/30">
                        <td colSpan={6} className="px-3 py-2">
                          <ul className="text-xs space-y-1">
                            {row.items.map((x) => (
                              <li key={x.id} className="flex flex-wrap gap-x-3">
                                <button className="font-mono text-primary-700 dark:text-primary-300 underline" onClick={() => goTo('sales', x.doc)}>
                                  {x.doc}
                                </button>
                                <span>{t('ar.line', { date: f.date(x.date), due: f.date(x.due) })}</span>
                                <span className={x.daysOverdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}>{x.daysOverdue > 0 ? t('ar.daysOverdue', { days: x.daysOverdue }) : t('ar.notDue')}</span>
                                <span className="font-semibold">{f.money(x.open)}</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {rem && <ReminderModal row={rem} onClose={() => setReminder(null)} />}
    </Card>
  );
}

function ReminderModal({ row, onClose }: { row: { id: string; items: OpenItem[]; overdue: number }; onClose: () => void }) {
  const t = useTranslations('demoErp.finance');
  const tc = useTranslations('demoErp.common');
  const f = useFmt();
  const [company, cid] = row.id.split('|') as [CompanyId, string];
  const c = CUSTOMER_BY_ID[cid];
  const overdue = row.items.filter((x) => x.daysOverdue > 0);
  const text = t('reminder.text', {
    customer: c.name,
    company: COMPANIES[company].name,
    n: overdue.length,
    amount: f.cop(row.overdue),
    list: overdue.map((x) => `${x.doc} (${f.cop(x.open)})`).join(', '),
  });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('reminder.copied'));
    } catch {
      toast.error(t('reminder.copyError'));
    }
  };
  return (
    <Modal
      title={t('reminder.title')}
      subtitle={`${c.name} · ${c.phone}`}
      onClose={onClose}
      footer={
        <>
          <button className={btn.outline} onClick={onClose}>
            {tc('close')}
          </button>
          <button className={btn.primary} onClick={copy}>
            {t('reminder.copy')}
          </button>
        </>
      }
    >
      <textarea readOnly value={text} className="w-full min-h-[140px] text-sm rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 p-3 text-secondary-900 dark:text-white" aria-label={t('reminder.title')} />
      <div className="mt-3">
        <Note>{t('reminder.note')}</Note>
      </div>
    </Modal>
  );
}

// ---------------- Conciliación bancaria ----------------

interface Suggestion {
  kind: 'receipt' | 'bankFee' | 'gmf' | 'unidentified';
  sale?: SaleDoc;
  reasons: string[];
  confidence: 'high' | 'medium';
}

function useSuggest() {
  const { state, computed } = useErp();
  return (b: BankLine): Suggestion | null => {
    if (b.match) return null;
    const d = norm(b.desc);
    if (b.amount < 0) {
      if (d.includes('gmf') || d.includes('4x1000')) return { kind: 'gmf', reasons: ['gmf'], confidence: 'high' };
      if (d.includes('comision') || d.includes('cuota de manejo')) return { kind: 'bankFee', reasons: ['fee'], confidence: 'high' };
      return { kind: 'bankFee', reasons: ['outflow'], confidence: 'medium' };
    }
    let best: { s: SaleDoc; score: number; reasons: string[] } | null = null;
    for (const s of state.sales) {
      if (s.company !== b.company || s.status !== 'invoiced' || s.creditNote) continue;
      const open = saleOpenAt(s, computed, WORK_DATE);
      if (open <= 0) continue;
      let score = 0;
      const reasons: string[] = [];
      if (s.invoiceNo && d.includes(norm(s.invoiceNo))) {
        score += 60;
        reasons.push('reference');
      }
      if (Math.abs(open - b.amount) <= 1) {
        score += 30;
        reasons.push('amount');
      }
      const c = CUSTOMER_BY_ID[s.customerId];
      const words = norm(c.name)
        .replace(/s\.a\.s\./g, '')
        .split(/\s+/)
        .filter((w) => w.length > 3);
      if (words.length && words.every((w) => d.includes(w))) {
        score += 15;
        reasons.push('customer');
      }
      if (b.date >= s.invoiceDate! && toDays(b.date) - toDays(s.invoiceDate!) < 200) score += 1;
      if (score >= 40 && (!best || score > best.score)) best = { s, score, reasons };
    }
    if (best) return { kind: 'receipt', sale: best.s, reasons: best.reasons, confidence: best.score >= 75 ? 'high' : 'medium' };
    return { kind: 'unidentified', reasons: ['noMatch'], confidence: 'medium' };
  };
}

function Reconciliation() {
  const t = useTranslations('demoErp.finance');
  const tc = useTranslations('demoErp.common');
  const { state, filters, dispatch, ensureOpenPeriod, computed } = useErp();
  const f = useFmt();
  const suggest = useSuggest();
  const [view, setView] = useState<'pending' | 'matched' | 'all'>('pending');
  const [importing, setImporting] = useState(false);
  const r = periodRange(filters.period);
  const lines = useMemo(
    () =>
      state.bank
        .filter((b) => inCompany(b.company, filters.company) && b.date >= r.start && b.date <= r.end)
        .filter((b) => (view === 'pending' ? !b.match : view === 'matched' ? !!b.match : true))
        .filter((b) => bankMatches(b, filters.search))
        .slice()
        .reverse(),
    [state.bank, filters.company, filters.search, r.start, r.end, view],
  );
  const pager = usePager(lines, 10);
  const pendingCount = state.bank.filter((b) => inCompany(b.company, filters.company) && b.date >= r.start && b.date <= r.end && !b.match).length;

  const docOf = (b: BankLine) => {
    if (!b.match) return '';
    const id = b.match.docId;
    return state.receipts.find((x) => x.id === id)?.no || state.payments.find((x) => x.id === id)?.no || state.expenses.find((x) => x.id === id)?.no || state.payroll.find((x) => x.id === id)?.no || state.taxes.find((x) => x.id === id)?.no || '';
  };

  const accept = (b: BankLine, s: Suggestion, saleId?: string) => {
    if (s.kind === 'receipt') {
      const sale = state.sales.find((x) => x.id === (saleId || s.sale!.id))!;
      const open = saleOpenAt(sale, computed, WORK_DATE);
      dispatch({ type: 'receipt', saleId: sale.id, amount: Math.min(open, b.amount), method: norm(b.desc).startsWith('pse') ? 'pse' : 'transfer', bankLineId: b.id });
      toast.success(t('recon.toasts.receipt', { doc: sale.invoiceNo! }));
    } else {
      dispatch({ type: 'bankExpense', lineId: b.id, kind: s.kind });
      toast.success(t(`recon.toasts.${s.kind}`));
    }
    if (ensureOpenPeriod()) toast(t('periodSwitched'));
  };

  return (
    <Card variant="bordered" padding="md" className="lg:col-span-3 min-w-0">
      <SectionHeader title={t('recon.title')} subtitle={t('recon.subtitle')}>
        <button className={btn.outline} onClick={() => setImporting(true)}>
          <DocumentArrowUpIcon className="w-4 h-4" />
          {t('recon.import')}
        </button>
      </SectionHeader>
      <div className="mb-3">
        <SubTabs
          value={view}
          onChange={setView}
          tabs={[
            { id: 'pending', label: t('recon.views.pending', { n: pendingCount }) },
            { id: 'matched', label: t('recon.views.matched') },
            { id: 'all', label: t('recon.views.all') },
          ]}
        />
      </div>
      {lines.length === 0 ? (
        <Empty>{view === 'pending' ? t('recon.nonePending') : tc('noResults')}</Empty>
      ) : (
        <div className="space-y-2">
          {pager.visible.map((b) => (
            <BankRow key={b.id} line={b} suggestion={suggest(b)} doc={docOf(b)} onAccept={accept} />
          ))}
        </div>
      )}
      <MoreButton pager={pager} />
      <p className="text-[11px] text-secondary-500 mt-3">{t('recon.note')}</p>
      {importing && <ImportBank onClose={() => setImporting(false)} />}
    </Card>
  );
}

function BankRow({ line: b, suggestion: s, doc, onAccept }: { line: BankLine; suggestion: Suggestion | null; doc: string; onAccept: (b: BankLine, s: Suggestion, saleId?: string) => void }) {
  const t = useTranslations('demoErp.finance');
  const { state, computed } = useErp();
  const f = useFmt();
  const [alt, setAlt] = useState('');
  const candidates = useMemo(() => {
    if (!s || b.amount <= 0) return [];
    return state.sales
      .filter((x) => x.company === b.company && x.status === 'invoiced' && !x.creditNote && saleOpenAt(x, computed, WORK_DATE) > 0)
      .map((x) => ({ x, open: saleOpenAt(x, computed, WORK_DATE) }))
      .filter((c) => c.open >= b.amount - 1)
      .sort((a, c) => Math.abs(a.open - b.amount) - Math.abs(c.open - b.amount))
      .slice(0, 6);
  }, [s, b, state.sales, computed]);
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg border border-secondary-200 dark:border-secondary-700">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-secondary-500">
          {f.date(b.date)} · {COMPANIES[b.company].short}
          {b.imported && ` · ${t('recon.imported')}`}
        </p>
        <p className="font-mono text-xs text-secondary-800 dark:text-secondary-200 break-words">{b.desc}</p>
        {b.match ? (
          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">{t(b.match.by === 'user' ? 'recon.matchedByYou' : 'recon.matchedWith', { doc })}</p>
        ) : s ? (
          <div className="text-xs mt-1 text-secondary-700 dark:text-secondary-300">
            <span className="font-semibold">{t('recon.suggestion')}: </span>
            {s.kind === 'receipt' ? t('recon.suggest.receipt', { doc: s.sale!.invoiceNo!, customer: CUSTOMER_BY_ID[s.sale!.customerId].name }) : t(`recon.suggest.${s.kind}`)}
            <span className="block text-[11px] text-secondary-500">
              {t('recon.why')}: {s.reasons.map((x) => t(`recon.reasons.${x}`)).join(' · ')}
            </span>
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <span className={`font-semibold text-sm whitespace-nowrap ${b.amount >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>{f.money(b.amount)}</span>
        {b.match ? (
          <Badge variant="success">{t('recon.matched')}</Badge>
        ) : s ? (
          <>
            <Badge variant={s.confidence === 'high' ? 'info' : 'warning'}>{t(`recon.confidence.${s.confidence}`)}</Badge>
            {candidates.length > 0 && (
              <select className={`${plainSelectCls} w-auto max-w-[200px] py-1 text-xs`} value={alt} onChange={(e) => setAlt(e.target.value)} aria-label={t('recon.applyTo')}>
                <option value="">{s.kind === 'receipt' ? t('recon.useSuggested') : t('recon.applyTo')}</option>
                {candidates.map(({ x, open }) => (
                  <option key={x.id} value={x.id}>
                    {x.invoiceNo} · {f.money(open)}
                  </option>
                ))}
              </select>
            )}
            <button className={btn.primary} onClick={() => onAccept(b, alt ? { kind: 'receipt', reasons: [], confidence: 'medium' } : s, alt || undefined)}>
              {alt || s.kind === 'receipt' ? t('recon.acceptReceipt') : t(`recon.accept.${s.kind}`)}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function parseAmount(raw: string) {
  let s = raw.replace(/[^\d,.-]/g, '');
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
  else if (s.includes(',')) s = s.replace(',', '.');
  else if (/\.\d{3}(\.|$)/.test(s)) s = s.replace(/\./g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function parseDate(raw: string) {
  const s = raw.trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return '';
}

function ImportBank({ onClose }: { onClose: () => void }) {
  const t = useTranslations('demoErp.finance');
  const tc = useTranslations('demoErp.common');
  const { state, computed, dispatch, filters, locale, ensureOpenPeriod } = useErp();
  const [company, setCompany] = useState<CompanyId>(filters.company === 'log' ? 'log' : 'com');
  const [preview, setPreview] = useState<{ date: string; desc: string; amount: number }[] | null>(null);
  const [skipped, setSkipped] = useState(0);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const f = useFmt();

  const sample = () => {
    const open = state.sales.filter((s) => s.company === company && s.status === 'invoiced' && !s.creditNote && saleOpenAt(s, computed, WORK_DATE) > 0).slice(-2);
    const sep = locale === 'es' ? ';' : ',';
    const rows = [['fecha', 'descripcion', 'valor'].join(sep)];
    open.forEach((s, i) => {
      const c = CUSTOMER_BY_ID[s.customerId];
      const desc = i === 0 ? `PSE ${norm(c.name).toUpperCase().replace(' S.A.S.', '')} REF ${s.invoiceNo}` : `TRANSF ${norm(c.name).toUpperCase().replace(' S.A.S.', '')}`;
      rows.push([WORK_DATE, desc, String(saleOpenAt(s, computed, WORK_DATE))].join(sep));
    });
    rows.push([addDays(WORK_DATE, -1), 'COMISION TRANSFERENCIA INTERBANCARIA', '-8900'].join(sep));
    downloadText(`extracto-ejemplo-${company}.csv`, '﻿' + rows.join('\r\n'), 'text/csv;charset=utf-8');
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    setError('');
    if (file.size > 1_000_000) return setError(t('import.errors.tooBig'));
    const text = (await file.text()).replace(/^﻿/, '');
    const rows = text.split(/\r?\n/).filter((x) => x.trim());
    if (!rows.length) return setError(t('import.errors.empty'));
    const sep = rows[0].includes(';') ? ';' : rows[0].includes('\t') ? '\t' : ',';
    const out: { date: string; desc: string; amount: number }[] = [];
    let bad = 0;
    rows.forEach((row, i) => {
      const cols = row.split(sep).map((c) => c.replace(/^"|"$/g, '').trim());
      if (i === 0 && !parseDate(cols[0] || '')) return;
      const date = parseDate(cols[0] || '');
      const amount = parseAmount(cols[2] || '');
      const desc = (cols[1] || '').slice(0, 80);
      if (!date || date < '2026-01-01' || date > WORK_DATE || !desc || !Number.isFinite(amount) || amount === 0) {
        bad++;
        return;
      }
      out.push({ date, desc: desc.toUpperCase(), amount });
    });
    if (!out.length) return setError(t('import.errors.noRows'));
    setSkipped(bad);
    setPreview(out.slice(0, 200));
  };

  const save = () => {
    if (!preview) return;
    dispatch({ type: 'importBank', company, lines: preview });
    if (ensureOpenPeriod()) toast(t('periodSwitched'));
    toast.success(t('import.done', { n: preview.length }));
    onClose();
  };

  return (
    <Modal
      wide
      title={t('import.title')}
      subtitle={t('import.subtitle')}
      onClose={onClose}
      footer={
        <>
          <button className={btn.outline} onClick={onClose}>
            {tc('cancel')}
          </button>
          <button className={btn.primary} onClick={save} disabled={!preview}>
            {t('import.save', { n: preview?.length || 0 })}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <label className="block">
          <FieldLabel>{t('import.company')}</FieldLabel>
          <select className={plainSelectCls} value={company} onChange={(e) => setCompany(e.target.value as CompanyId)}>
            <option value="com">{COMPANIES.com.name}</option>
            <option value="log">{COMPANIES.log.name}</option>
          </select>
        </label>
        <div className="flex items-end gap-2 flex-wrap">
          <button className={btn.outline} onClick={() => fileRef.current?.click()}>
            <DocumentArrowUpIcon className="w-4 h-4" />
            {t('import.choose')}
          </button>
          <button className={btn.ghost} onClick={sample}>
            <ArrowDownTrayIcon className="w-4 h-4" />
            {t('import.sample')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv,.txt"
            className="hidden"
            aria-label={t('import.choose')}
            onChange={(e) => {
              void onFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
      </div>
      <p className="text-[11px] text-secondary-500 mb-3">{t('import.format', { max: f.date(WORK_DATE) })}</p>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      {preview && (
        <>
          <p className="text-xs text-secondary-700 dark:text-secondary-300 mb-2">{t('import.preview', { n: preview.length, skipped })}</p>
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-xs min-w-[420px]">
              <thead>
                <tr className={theadCls}>
                  <Th>{t('import.date')}</Th>
                  <Th>{t('import.desc')}</Th>
                  <Th right>{t('import.amount')}</Th>
                </tr>
              </thead>
              <tbody>
                {preview.map((p, i) => (
                  <tr key={i} className={rowCls}>
                    <td className="py-1 pr-3 whitespace-nowrap">{f.date(p.date)}</td>
                    <td className="py-1 pr-3 font-mono">{p.desc}</td>
                    <td className="py-1 text-right whitespace-nowrap">{f.cop(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <div className="mt-3">
        <Note>{t('import.note')}</Note>
      </div>
    </Modal>
  );
}
