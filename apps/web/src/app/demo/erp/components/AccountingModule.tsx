'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, CheckCircleIcon, ExclamationTriangleIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { ACCOUNTS, COMPANIES, INCOME_TAX_RATE } from '../lib/catalog';
import { balance, inCompany, periodRange, pnl, trialBalance } from '../lib/engine';
import { csvMoney, downloadCsv } from '../lib/format';
import { entryMatches } from '../lib/search';
import { pad } from '../lib/seed';
import { useErp } from '../lib/store';
import type { CompanyId, Entry, ModuleId } from '../lib/types';
import { Empty, FieldLabel, Modal, MoreButton, Note, SectionHeader, SubTabs, Th, btn, inputCls, plainSelectCls, rowCls, theadCls, useEntryDesc, useFmt, usePager } from './ui';

type Tab = 'journal' | 'trial' | 'statements';

const SOURCE_MODULE: Record<string, ModuleId> = {
  sale: 'sales',
  creditNote: 'sales',
  receipt: 'sales',
  purchase: 'purchases',
  payment: 'purchases',
  prodStart: 'manufacturing',
  prodFinish: 'manufacturing',
  payroll: 'hr',
  expense: 'finance',
  tax: 'finance',
};

export default function AccountingModule() {
  const t = useTranslations('demoErp.accounting');
  const [tab, setTab] = useState<Tab>('journal');
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SubTabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'journal', label: t('tabs.journal') },
            { id: 'trial', label: t('tabs.trial') },
            { id: 'statements', label: t('tabs.statements') },
          ]}
        />
      </div>
      {tab === 'journal' && <Journal />}
      {tab === 'trial' && <TrialBalance />}
      {tab === 'statements' && <Statements />}
    </div>
  );
}

function useAccountName() {
  const t = useTranslations('demoErp.accounts');
  return (code: string) => `${code} ${t(code)}`;
}

function Journal() {
  const t = useTranslations('demoErp.accounting');
  const tc = useTranslations('demoErp.common');
  const { computed, filters, locale } = useErp();
  const f = useFmt();
  const descOf = useEntryDesc();
  const acc = useAccountName();
  const [open, setOpen] = useState<Entry | null>(null);
  const [creating, setCreating] = useState(false);
  const r = periodRange(filters.period);
  const list = useMemo(
    () =>
      computed.entries
        .filter((e) => inCompany(e.company, filters.company) && e.date >= r.start && e.date <= r.end)
        .filter((e) => entryMatches(e, filters.search, descOf(e)))
        .slice()
        .reverse(),
    // descOf depende del idioma
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [computed, filters.company, filters.search, r.start, r.end, locale],
  );
  const pager = usePager(list, 12);
  const totals = list.reduce((a, e) => ({ d: a.d + e.lines.reduce((s, l) => s + l.debit, 0), c: a.c + e.lines.reduce((s, l) => s + l.credit, 0) }), { d: 0, c: 0 });

  const exportCsv = () => {
    const head = [t('cols.date'), t('cols.entry'), t('cols.company'), t('cols.account'), t('cols.description'), t('cols.third'), t('cols.debit'), t('cols.credit'), tc('currency')];
    const data = list.flatMap((e) => e.lines.map((l) => [e.date, e.no, COMPANIES[e.company].name, acc(l.account), descOf(e), l.third || '', csvMoney(l.debit, filters.currency), csvMoney(l.credit, filters.currency), filters.currency]));
    downloadCsv(`libro-diario-${filters.period}.csv`, [head, ...data], locale);
    toast.success(tc('csvDone', { n: data.length }));
  };

  return (
    <Card variant="bordered" padding="md">
      <SectionHeader title={t('journal.title')} subtitle={t('journal.subtitle')}>
        <button className={btn.outline} onClick={exportCsv} disabled={!list.length}>
          <ArrowDownTrayIcon className="w-4 h-4" />
          {tc('exportCsv')}
        </button>
        <button className={btn.primary} onClick={() => setCreating(true)}>
          <PlusIcon className="w-4 h-4" />
          {t('manual.open')}
        </button>
      </SectionHeader>
      {list.length === 0 ? (
        <Empty>{filters.search ? tc('noResults') : t('journal.empty')}</Empty>
      ) : (
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className={theadCls}>
                <Th>{t('cols.date')}</Th>
                <Th>{t('cols.entry')}</Th>
                <Th>{t('cols.account')}</Th>
                <Th>{t('cols.description')}</Th>
                <Th right>{t('cols.debit')}</Th>
                <Th right>{t('cols.credit')}</Th>
              </tr>
            </thead>
            <tbody>
              {pager.visible.map((e) =>
                e.lines.map((l, i) => (
                  <tr key={`${e.id}-${i}`} onClick={() => setOpen(e)} className={`cursor-pointer hover:bg-primary-50/50 dark:hover:bg-primary-950/30 ${i === e.lines.length - 1 ? 'border-b border-secondary-200 dark:border-secondary-700' : ''}`}>
                    <td className="py-1.5 pr-3 text-secondary-700 dark:text-secondary-300 whitespace-nowrap">{i === 0 ? f.date(e.date) : ''}</td>
                    <td className="py-1.5 pr-3 whitespace-nowrap">
                      {i === 0 && (
                        <button className="font-mono text-xs text-primary-600 dark:text-primary-400 hover:underline" onClick={() => setOpen(e)}>
                          {e.no}
                        </button>
                      )}
                      {i === 0 && e.user && <span className="ml-1.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">{t('yours')}</span>}
                    </td>
                    <td className="py-1.5 pr-3 text-secondary-800 dark:text-secondary-200 whitespace-nowrap">
                      <span className={l.credit ? 'pl-4' : ''}>{acc(l.account)}</span>
                    </td>
                    <td className="py-1.5 pr-3 text-secondary-600 dark:text-secondary-400 text-xs max-w-[280px] truncate">{i === 0 ? descOf(e) : l.third || ''}</td>
                    <td className="py-1.5 pr-3 text-right whitespace-nowrap">{l.debit ? f.money(l.debit) : ''}</td>
                    <td className="py-1.5 text-right whitespace-nowrap">{l.credit ? f.money(l.credit) : ''}</td>
                  </tr>
                )),
              )}
              <tr className="font-bold bg-secondary-50 dark:bg-secondary-800/50">
                <td colSpan={4} className="py-2 pr-3 text-right text-secondary-700 dark:text-secondary-300">
                  {t('journal.totals', { n: list.length })}
                </td>
                <td className="py-2 pr-3 text-right whitespace-nowrap">{f.money(totals.d)}</td>
                <td className="py-2 text-right whitespace-nowrap">{f.money(totals.c)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <MoreButton pager={pager} />
      {open && <EntryModal entry={open} onClose={() => setOpen(null)} />}
      {creating && <ManualEntryForm onClose={() => setCreating(false)} />}
    </Card>
  );
}

function EntryModal({ entry: e, onClose }: { entry: Entry; onClose: () => void }) {
  const t = useTranslations('demoErp.accounting');
  const tc = useTranslations('demoErp.common');
  const { goTo, state } = useErp();
  const f = useFmt();
  const descOf = useEntryDesc();
  const acc = useAccountName();
  const d = e.lines.reduce((s, l) => s + l.debit, 0);
  const c = e.lines.reduce((s, l) => s + l.credit, 0);
  const mod = SOURCE_MODULE[e.source];
  const searchFor = e.source === 'receipt' ? state.sales.find((s) => s.id === state.receipts.find((r) => r.id === e.sourceId)?.saleId)?.invoiceNo : e.source === 'payment' ? state.pos.find((p) => p.id === state.payments.find((x) => x.id === e.sourceId)?.poId)?.no : e.no;
  return (
    <Modal
      wide
      title={`${t('entry.title')} ${e.no}`}
      subtitle={`${f.date(e.date)} · ${COMPANIES[e.company].name}`}
      onClose={onClose}
      footer={
        <>
          {mod && (
            <button
              className={btn.outline}
              onClick={() => {
                goTo(mod, searchFor || e.no);
                onClose();
              }}
            >
              {t('entry.goSource', { module: tc(`moduleNames.${mod}`) })}
            </button>
          )}
          <button className={btn.primary} onClick={onClose}>
            {tc('close')}
          </button>
        </>
      }
    >
      <p className="text-sm text-secondary-800 dark:text-secondary-200 mb-3">{descOf(e)}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[520px]">
          <thead>
            <tr className={theadCls}>
              <Th>{t('cols.account')}</Th>
              <Th>{t('cols.third')}</Th>
              <Th right>{t('cols.debit')}</Th>
              <Th right>{t('cols.credit')}</Th>
            </tr>
          </thead>
          <tbody>
            {e.lines.map((l, i) => (
              <tr key={i} className={rowCls}>
                <td className="py-1.5 pr-3">{acc(l.account)}</td>
                <td className="py-1.5 pr-3">{l.third || ''}</td>
                <td className="py-1.5 pr-3 text-right">{l.debit ? f.money(l.debit) : ''}</td>
                <td className="py-1.5 text-right">{l.credit ? f.money(l.credit) : ''}</td>
              </tr>
            ))}
            <tr className="font-bold">
              <td colSpan={2} className="py-1.5 pr-3 text-right">
                {t('entry.totals')}
              </td>
              <td className="py-1.5 pr-3 text-right">{f.money(d)}</td>
              <td className="py-1.5 text-right">{f.money(c)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-secondary-600 dark:text-secondary-400">
        {d === c ? (
          <Badge variant="success" className="gap-1">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            {t('entry.balanced')}
          </Badge>
        ) : (
          <Badge variant="danger">{t('entry.unbalanced')}</Badge>
        )}
        <span>{e.source === 'manual' ? t('entry.manual') : t(`entry.source.${e.source}`)}</span>
      </div>
    </Modal>
  );
}

function ManualEntryForm({ onClose }: { onClose: () => void }) {
  const t = useTranslations('demoErp.accounting');
  const tc = useTranslations('demoErp.common');
  const { filters, dispatch, state, ensureOpenPeriod } = useErp();
  const f = useFmt();
  const acc = useAccountName();
  const [company, setCompany] = useState<CompanyId>(filters.company === 'log' ? 'log' : 'com');
  const [desc, setDesc] = useState('');
  const [lines, setLines] = useState([
    { account: '5195', debit: '', credit: '' },
    { account: '1110', debit: '', credit: '' },
  ]);
  const [error, setError] = useState('');
  const parsed = lines.map((l) => ({ account: l.account, debit: Math.round(Number(l.debit) || 0), credit: Math.round(Number(l.credit) || 0) }));
  const d = parsed.reduce((s, l) => s + l.debit, 0);
  const c = parsed.reduce((s, l) => s + l.credit, 0);
  const save = () => {
    if (!desc.trim()) return setError(t('manual.errorDesc'));
    const valid = parsed.filter((l) => l.debit > 0 || l.credit > 0);
    if (valid.length < 2) return setError(t('manual.errorLines'));
    if (valid.some((l) => l.debit > 0 && l.credit > 0)) return setError(t('manual.errorBoth'));
    if (d !== c || d === 0) return setError(t('manual.errorBalance'));
    const n = state.counters.AJ;
    dispatch({ type: 'manualEntry', company, desc: desc.trim().slice(0, 120), lines: valid });
    if (ensureOpenPeriod()) toast(t('periodSwitched'));
    toast.success(t('manual.done', { doc: `AJ-${pad(n)}` }));
    onClose();
  };
  const upd = (i: number, k: 'account' | 'debit' | 'credit', v: string) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, [k]: k === 'account' ? v : v.replace(/[^\d]/g, '') } : x)));
  return (
    <Modal
      wide
      title={t('manual.title')}
      subtitle={t('manual.subtitle')}
      onClose={onClose}
      footer={
        <>
          <button className={btn.outline} onClick={onClose}>
            {tc('cancel')}
          </button>
          <button className={btn.primary} onClick={save}>
            {t('manual.save')}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <label className="block">
          <FieldLabel>{t('manual.company')}</FieldLabel>
          <select className={plainSelectCls} value={company} onChange={(e) => setCompany(e.target.value as CompanyId)}>
            <option value="com">{COMPANIES.com.name}</option>
            <option value="log">{COMPANIES.log.name}</option>
          </select>
        </label>
        <label className="block sm:col-span-2">
          <FieldLabel>{t('manual.desc')}</FieldLabel>
          <input className={inputCls} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t('manual.descPlaceholder')} />
        </label>
      </div>
      <div className="space-y-2">
        {lines.map((l, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-end">
            <label className="col-span-12 sm:col-span-6 block">
              {i === 0 && <FieldLabel>{t('cols.account')}</FieldLabel>}
              <select className={plainSelectCls} value={l.account} onChange={(e) => upd(i, 'account', e.target.value)}>
                {ACCOUNTS.map((a) => (
                  <option key={a} value={a}>
                    {acc(a)}
                  </option>
                ))}
              </select>
            </label>
            <label className="col-span-5 sm:col-span-3 block">
              {i === 0 && <FieldLabel>{t('cols.debit')}</FieldLabel>}
              <input className={inputCls} inputMode="numeric" value={l.debit} placeholder="0" aria-label={t('cols.debit')} onChange={(e) => upd(i, 'debit', e.target.value)} />
            </label>
            <label className="col-span-5 sm:col-span-2 block">
              {i === 0 && <FieldLabel>{t('cols.credit')}</FieldLabel>}
              <input className={inputCls} inputMode="numeric" value={l.credit} placeholder="0" aria-label={t('cols.credit')} onChange={(e) => upd(i, 'credit', e.target.value)} />
            </label>
            <div className="col-span-2 sm:col-span-1 pb-1 text-right">
              <button className="p-2 rounded-md text-secondary-500 hover:text-red-600 disabled:opacity-30" disabled={lines.length <= 2} onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} aria-label={t('manual.removeLine')}>
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button className={`${btn.ghost} mt-2`} onClick={() => setLines((ls) => [...ls, { account: '5135', debit: '', credit: '' }])} disabled={lines.length >= 8}>
        <PlusIcon className="w-4 h-4" />
        {t('manual.addLine')}
      </button>
      <p className={`mt-3 text-sm text-right ${d === c && d > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-secondary-700 dark:text-secondary-300'}`}>
        {t('manual.sums', { debit: f.cop(d), credit: f.cop(c), diff: f.cop(Math.abs(d - c)) })}
      </p>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <p className="mt-3 text-[11px] text-secondary-500">{t('manual.note')}</p>
    </Modal>
  );
}

function TrialBalance() {
  const t = useTranslations('demoErp.accounting');
  const tc = useTranslations('demoErp.common');
  const { computed, filters, locale } = useErp();
  const f = useFmt();
  const acc = useAccountName();
  const r = periodRange(filters.period);
  const rows = useMemo(() => trialBalance(computed.entries, filters.company, r), [computed, filters.company, r.start, r.end]); // eslint-disable-line react-hooks/exhaustive-deps
  const tot = rows.reduce((a, x) => ({ o: a.o + x.opening, d: a.d + x.debit, c: a.c + x.credit, cl: a.cl + x.closing }), { o: 0, d: 0, c: 0, cl: 0 });
  const ok = tot.d === tot.c && Math.round(tot.cl) === 0;
  const exportCsv = () => {
    const head = [t('cols.account'), t('trial.opening'), t('cols.debit'), t('cols.credit'), t('trial.closing'), tc('currency')];
    const data = rows.map((x) => [acc(x.account), csvMoney(x.opening, filters.currency), csvMoney(x.debit, filters.currency), csvMoney(x.credit, filters.currency), csvMoney(x.closing, filters.currency), filters.currency]);
    downloadCsv(`balance-de-prueba-${filters.period}.csv`, [head, ...data], locale);
    toast.success(tc('csvDone', { n: data.length }));
  };
  return (
    <Card variant="bordered" padding="md">
      <SectionHeader title={t('trial.title')} subtitle={t('trial.subtitle', { from: f.date(r.start), to: f.date(r.end) })}>
        <Badge variant={ok ? 'success' : 'danger'} className="gap-1">
          {ok ? <CheckCircleIcon className="w-3.5 h-3.5" /> : <ExclamationTriangleIcon className="w-3.5 h-3.5" />}
          {ok ? t('trial.ok') : t('trial.notOk')}
        </Badge>
        <button className={btn.outline} onClick={exportCsv}>
          <ArrowDownTrayIcon className="w-4 h-4" />
          {tc('exportCsv')}
        </button>
      </SectionHeader>
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className={theadCls}>
              <Th>{t('cols.account')}</Th>
              <Th right>{t('trial.opening')}</Th>
              <Th right>{t('cols.debit')}</Th>
              <Th right>{t('cols.credit')}</Th>
              <Th right>{t('trial.closing')}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.account} className={rowCls}>
                <td className="py-1.5 pr-3 whitespace-nowrap">{acc(x.account)}</td>
                <td className="py-1.5 pr-3 text-right whitespace-nowrap">{f.money(x.opening)}</td>
                <td className="py-1.5 pr-3 text-right whitespace-nowrap">{f.money(x.debit)}</td>
                <td className="py-1.5 pr-3 text-right whitespace-nowrap">{f.money(x.credit)}</td>
                <td className="py-1.5 text-right whitespace-nowrap font-medium">{f.money(x.closing)}</td>
              </tr>
            ))}
            <tr className="font-bold bg-secondary-50 dark:bg-secondary-800/50">
              <td className="py-2 pr-3">{t('trial.totals')}</td>
              <td className="py-2 pr-3 text-right">{f.money(tot.o)}</td>
              <td className="py-2 pr-3 text-right">{f.money(tot.d)}</td>
              <td className="py-2 pr-3 text-right">{f.money(tot.c)}</td>
              <td className="py-2 text-right">{f.money(tot.cl)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-secondary-500 mt-2">{t('trial.note')}</p>
    </Card>
  );
}

function Statements() {
  const t = useTranslations('demoErp.accounting');
  const { computed, filters } = useErp();
  const f = useFmt();
  const r = periodRange(filters.period);
  const p = useMemo(() => pnl(computed.entries, filters.company, r, INCOME_TAX_RATE), [computed, filters.company, r.start, r.end]); // eslint-disable-line react-hooks/exhaustive-deps
  const bal = (pre: string[]) => balance(computed.entries, filters.company, pre, null, r.end);
  const current = bal(['11', '13', '14']);
  const fixed = bal(['15']);
  const assets = current + fixed;
  const liabilities = -bal(['2']);
  const capital = -bal(['3']);
  const result = -balance(computed.entries, filters.company, ['4', '5', '6'], '2026-01-01', r.end);
  const equity = capital + result;
  const ok = Math.round(assets - liabilities - equity) === 0;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card variant="bordered" padding="md">
        <SectionHeader title={t('pl.title')} subtitle={t('pl.subtitle', { from: f.date(r.start), to: f.date(r.end) })} />
        <Row label={t('pl.revenue')} value={f.money(p.revenue)} />
        <Row label={t('pl.cogs')} value={f.money(-p.cogs)} />
        <Row label={t('pl.gross')} value={f.money(p.gross)} bold />
        <Row label={t('pl.opex')} value={f.money(-p.opex)} />
        <Row label={t('pl.operating')} value={f.money(p.operating)} bold />
        <Row label={t('pl.nonOperating')} value={f.money(-p.nonOperating)} />
        <Row label={t('pl.preTax')} value={f.money(p.preTax)} bold />
        <Row label={t('pl.tax', { pct: f.dec(INCOME_TAX_RATE * 100, 0) })} value={f.money(-p.tax)} />
        <Row label={t('pl.net')} value={f.money(p.net)} bold highlight />
        <div className="mt-3 pt-3 border-t border-dashed border-secondary-200 dark:border-secondary-700">
          <Row label={t('pl.ebitda')} value={f.money(p.ebitda)} highlight />
          <p className="text-[11px] text-secondary-500 mt-1">{t('pl.ebitdaNote', { dep: f.money(p.depreciation) })}</p>
        </div>
        <p className="text-[11px] text-secondary-500 mt-2">{t('pl.taxNote')}</p>
      </Card>
      <Card variant="bordered" padding="md">
        <SectionHeader title={t('bs.title')} subtitle={t('bs.subtitle', { date: f.date(r.end) })}>
          <Badge variant={ok ? 'success' : 'danger'} className="gap-1">
            {ok ? <CheckCircleIcon className="w-3.5 h-3.5" /> : <ExclamationTriangleIcon className="w-3.5 h-3.5" />}
            {ok ? t('bs.ok') : t('bs.notOk')}
          </Badge>
        </SectionHeader>
        <Row label={t('bs.currentAssets')} value={f.money(current)} />
        <Row label={t('bs.fixedAssets')} value={f.money(fixed)} />
        <Row label={t('bs.assets')} value={f.money(assets)} bold />
        <Bar pct={100} color="bg-blue-500" />
        <Row label={t('bs.liabilities')} value={f.money(liabilities)} bold />
        <Bar pct={assets ? (liabilities / assets) * 100 : 0} color="bg-rose-500" />
        <Row label={t('bs.capital')} value={f.money(capital)} />
        <Row label={t('bs.result')} value={f.money(result)} />
        <Row label={t('bs.equity')} value={f.money(equity)} bold />
        <Bar pct={assets ? (equity / assets) * 100 : 0} color="bg-emerald-500" />
        <div className="mt-3">
          <Note>{t('bs.note')}</Note>
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 py-1.5 text-sm ${bold ? 'border-t border-secondary-200 dark:border-secondary-700 font-bold' : ''} ${highlight ? 'text-primary-700 dark:text-primary-300' : 'text-secondary-700 dark:text-secondary-300'}`}>
      <span>{label}</span>
      <span className="whitespace-nowrap">{value}</span>
    </div>
  );
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 rounded-full bg-secondary-100 dark:bg-secondary-800 overflow-hidden mb-2">
      <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}
