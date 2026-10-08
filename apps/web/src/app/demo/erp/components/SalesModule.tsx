'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, EyeIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { COMPANIES, CUSTOMERS, CUSTOMER_BY_ID, INVOICE_PREFIX, ITEMS, ITEM_BY_SKU, WAREHOUSES, WORK_DATE } from '../lib/catalog';
import { docTotals, inCompany, periodRange, saleOpenAt, valuationAt, stockOf } from '../lib/engine';
import { csvMoney, diffDays, downloadCsv, fmtNit } from '../lib/format';
import { saleListDate, saleMatches } from '../lib/search';
import { pad } from '../lib/seed';
import { useErp } from '../lib/store';
import type { CompanyId, DocLine, PayMethod, SaleDoc, WarehouseId } from '../lib/types';
import { Empty, FieldLabel, Modal, MoreButton, Note, SectionHeader, SubTabs, Th, btn, inputCls, plainSelectCls, rowCls, theadCls, useFmt, usePager } from './ui';

type View = 'all' | 'quote' | 'order' | 'invoiced';

export function docNo(s: SaleDoc) {
  return s.invoiceNo || s.orderNo || s.quoteNo;
}

const docDate = saleListDate;

/** Faltantes de inventario para facturar un documento en su bodega. */
export function useShortages() {
  const { computed } = useErp();
  const current = useMemo(() => valuationAt(computed.movements, '9999-12-31'), [computed]);
  return (s: SaleDoc) =>
    s.lines
      .filter((l) => ITEM_BY_SKU[l.sku].kind !== 'service')
      .map((l) => ({ sku: l.sku, need: l.qty, have: stockOf(current, l.sku, s.warehouse) }))
      .filter((x) => x.have < x.need);
}

export default function SalesModule() {
  const t = useTranslations('demoErp.sales');
  const tc = useTranslations('demoErp.common');
  const { state, computed, filters, locale } = useErp();
  const f = useFmt();
  const [view, setView] = useState<View>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);
  const r = periodRange(filters.period);

  const rows = useMemo(
    () =>
      state.sales
        .filter((s) => inCompany(s.company, filters.company))
        .filter((s) => view === 'all' || s.status === view)
        .filter((s) => {
          const d = docDate(s);
          return (d >= r.start && d <= r.end) || (s.creditNote && s.creditNote.date >= r.start && s.creditNote.date <= r.end);
        })
        .filter((s) => saleMatches(s, filters.search))
        .sort((a, b) => (docDate(b) > docDate(a) ? 1 : docDate(b) < docDate(a) ? -1 : (b.invoiceSeq || 0) - (a.invoiceSeq || 0) || (b.user ? 1 : 0) - (a.user ? 1 : 0))),
    [state.sales, filters.company, filters.search, view, r.start, r.end],
  );
  const pager = usePager(rows, 15);

  const all = state.sales.filter((s) => inCompany(s.company, filters.company));
  const quotes = all.filter((s) => s.status === 'quote');
  const orders = all.filter((s) => s.status === 'order');
  const invoiced = all.filter((s) => s.status === 'invoiced' && s.invoiceDate! >= r.start && s.invoiceDate! <= r.end && !s.creditNote);
  const sum = (xs: SaleDoc[]) => xs.reduce((a, s) => a + docTotals(s.lines).total, 0);

  const exportCsv = () => {
    const head = [t('csv.doc'), t('csv.status'), t('csv.company'), t('csv.customer'), t('csv.nit'), t('csv.date'), t('csv.subtotal'), t('csv.vat'), t('csv.total'), t('csv.open'), t('csv.dian'), t('csv.currency')];
    const data = rows.map((s) => {
      const tt = docTotals(s.lines);
      const c = CUSTOMER_BY_ID[s.customerId];
      return [
        docNo(s),
        t(`status.${s.status}`),
        COMPANIES[s.company].name,
        c.name,
        fmtNit(c.nit),
        docDate(s),
        csvMoney(tt.subtotal, filters.currency),
        csvMoney(tt.vat, filters.currency),
        csvMoney(tt.total, filters.currency),
        csvMoney(saleOpenAt(s, computed, WORK_DATE), filters.currency),
        s.invoiceNo ? t('dianSimulated') : '',
        filters.currency,
      ];
    });
    downloadCsv(`ventas-${filters.period}.csv`, [head, ...data], locale);
    toast.success(tc('csvDone', { n: data.length }));
  };

  const open = openId ? state.sales.find((s) => s.id === openId) : null;

  return (
    <Card variant="bordered" padding="md">
      <SectionHeader title={t('title')} subtitle={t('subtitle')}>
        <button className={btn.outline} onClick={exportCsv} disabled={!rows.length}>
          <ArrowDownTrayIcon className="w-4 h-4" />
          {tc('exportCsv')}
        </button>
        <button className={btn.primary} onClick={() => setCreating(true)}>
          <PlusIcon className="w-4 h-4" />
          {t('newQuote')}
        </button>
      </SectionHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <Summary label={t('summary.quotes')} count={quotes.length} value={f.moneyShort(sum(quotes))} onClick={() => setView('quote')} />
        <Summary label={t('summary.orders')} count={orders.length} value={f.moneyShort(sum(orders))} onClick={() => setView('order')} />
        <Summary label={t('summary.invoiced')} count={invoiced.length} value={f.moneyShort(sum(invoiced))} onClick={() => setView('invoiced')} />
      </div>

      <div className="mb-3">
        <SubTabs
          value={view}
          onChange={setView}
          tabs={[
            { id: 'all', label: t('views.all') },
            { id: 'quote', label: t('views.quote') },
            { id: 'order', label: t('views.order') },
            { id: 'invoiced', label: t('views.invoiced') },
          ]}
        />
      </div>

      {rows.length === 0 ? (
        <Empty>{filters.search ? tc('noResults') : t('empty')}</Empty>
      ) : (
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className={theadCls}>
                <Th>{t('cols.doc')}</Th>
                <Th>{t('cols.status')}</Th>
                <Th>{t('cols.customer')}</Th>
                <Th>{t('cols.date')}</Th>
                <Th right>{t('cols.total')}</Th>
                <Th right>{t('cols.open')}</Th>
                <Th className="text-right pr-0">{t('cols.actions')}</Th>
              </tr>
            </thead>
            <tbody>
              {pager.visible.map((s) => (
                <SaleRow key={s.id} s={s} onView={() => setOpenId(s.id)} onPay={() => setPaying(s.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <MoreButton pager={pager} />

      {open && <SaleModal sale={open} onClose={() => setOpenId(null)} onPay={() => setPaying(open.id)} />}
      {creating && <QuoteForm onClose={() => setCreating(false)} />}
      {paying && <PaymentForm saleId={paying} onClose={() => setPaying(null)} />}
    </Card>
  );
}

function Summary({ label, count, value, onClick }: { label: string; count: number; value: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left p-3 rounded-lg border border-secondary-200 dark:border-secondary-700 hover:border-primary-400 transition-colors">
      <p className="text-[11px] uppercase font-semibold text-secondary-500 dark:text-secondary-400">{label}</p>
      <p className="text-sm font-bold text-secondary-900 dark:text-white">
        {count} · {value}
      </p>
    </button>
  );
}

export function SaleStatusBadge({ s }: { s: SaleDoc }) {
  const t = useTranslations('demoErp.sales');
  const { computed } = useErp();
  if (s.status === 'quote') return <Badge variant="default">{t('status.quote')}</Badge>;
  if (s.status === 'order') return <Badge variant="info">{t('status.order')}</Badge>;
  if (s.creditNote) return <Badge variant="danger">{t('status.credited', { doc: s.creditNote.no })}</Badge>;
  const open = saleOpenAt(s, computed, WORK_DATE);
  if (open <= 0) return <Badge variant="success">{t('status.paid')}</Badge>;
  const overdue = diffDays(WORK_DATE, s.dueDate!);
  if (overdue > 0) return <Badge variant="warning">{t('status.overdue', { days: overdue })}</Badge>;
  return <Badge variant="primary">{t('status.receivable')}</Badge>;
}

function SaleRow({ s, onView, onPay }: { s: SaleDoc; onView: () => void; onPay: () => void }) {
  const t = useTranslations('demoErp.sales');
  const { computed, dispatch, ensureOpenPeriod } = useErp();
  const f = useFmt();
  const c = CUSTOMER_BY_ID[s.customerId];
  const tt = docTotals(s.lines);
  const open = saleOpenAt(s, computed, WORK_DATE);
  const toOrder = () => {
    dispatch({ type: 'toOrder', id: s.id });
    if (ensureOpenPeriod()) toast(t('periodSwitched'));
    toast.success(t('toasts.ordered', { doc: s.quoteNo }));
  };
  return (
    <tr className={`${rowCls} hover:bg-secondary-50 dark:hover:bg-secondary-800/40`}>
      <td className="py-2.5 pr-3">
        <button onClick={onView} className="font-mono text-xs text-primary-600 dark:text-primary-400 hover:underline">
          {docNo(s)}
        </button>
        {s.user && <span className="ml-1.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">{t('yours')}</span>}
      </td>
      <td className="py-2.5 pr-3">
        <SaleStatusBadge s={s} />
      </td>
      <td className="py-2.5 pr-3 text-secondary-900 dark:text-white">
        <span className="block max-w-[220px] truncate">{c.name}</span>
        <span className="block text-[11px] text-secondary-500">{c.city}</span>
      </td>
      <td className="py-2.5 pr-3 text-secondary-600 dark:text-secondary-400 whitespace-nowrap">{f.date(docDate(s))}</td>
      <td className="py-2.5 pr-3 text-right font-medium text-secondary-900 dark:text-white whitespace-nowrap">{f.money(tt.total)}</td>
      <td className="py-2.5 pr-3 text-right text-secondary-700 dark:text-secondary-300 whitespace-nowrap">{s.status === 'invoiced' ? f.money(open) : '—'}</td>
      <td className="py-2.5 text-right whitespace-nowrap">
        <div className="flex justify-end gap-1">
          {s.status === 'quote' && (
            <button className={btn.outline} onClick={toOrder}>
              {t('actions.toOrder')}
            </button>
          )}
          {s.status === 'order' && (
            <button className={btn.primary} onClick={onView}>
              {t('actions.invoice')}
            </button>
          )}
          {s.status === 'invoiced' && open > 0 && !s.creditNote && (
            <button className={btn.outline} onClick={onPay}>
              {t('actions.pay')}
            </button>
          )}
          <button onClick={onView} className="p-1.5 rounded-md text-secondary-600 dark:text-secondary-400 hover:bg-primary-50 dark:hover:bg-primary-950/50 hover:text-primary-600" aria-label={t('actions.view', { doc: docNo(s) })}>
            <EyeIcon className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function SaleModal({ sale: s, onClose, onPay }: { sale: SaleDoc; onClose: () => void; onPay: () => void }) {
  const t = useTranslations('demoErp.sales');
  const tc = useTranslations('demoErp.common');
  const tw = useTranslations('demoErp.warehouses');
  const { computed, dispatch, invoice, goTo, ensureOpenPeriod, state } = useErp();
  const f = useFmt();
  const shortages = useShortages();
  const [confirmCn, setConfirmCn] = useState(false);
  const c = CUSTOMER_BY_ID[s.customerId];
  const tt = docTotals(s.lines);
  const open = saleOpenAt(s, computed, WORK_DATE);
  const receipts = state.receipts.filter((r) => r.saleId === s.id);
  const short = s.status !== 'invoiced' ? shortages(s) : [];
  const entries = computed.entriesBySource[s.id] || [];

  const doInvoice = () => {
    if (short.length) return;
    const prefix = INVOICE_PREFIX[s.company];
    const n = state.counters[prefix];
    invoice(s.id);
    if (ensureOpenPeriod()) toast(t('periodSwitched'));
    toast.success(t('toasts.invoiced', { doc: `${prefix}-${n}` }));
  };
  const doOrder = () => {
    dispatch({ type: 'toOrder', id: s.id });
    if (ensureOpenPeriod()) toast(t('periodSwitched'));
    toast.success(t('toasts.ordered', { doc: s.quoteNo }));
  };
  const doCreditNote = () => {
    const n = state.counters.NC;
    dispatch({ type: 'creditNote', id: s.id });
    if (ensureOpenPeriod()) toast(t('periodSwitched'));
    toast.success(t('toasts.credited', { doc: `NC-${pad(n)}` }));
    setConfirmCn(false);
  };

  return (
    <Modal
      wide
      title={`${t(`docType.${s.status}`)} ${docNo(s)}`}
      subtitle={`${COMPANIES[s.company].name} · ${c.name}`}
      onClose={onClose}
      footer={
        <>
          {s.status === 'quote' && (
            <button className={btn.primary} onClick={doOrder}>
              {t('actions.toOrder')}
            </button>
          )}
          {s.status === 'order' && (
            <button className={btn.primary} onClick={doInvoice} disabled={short.length > 0}>
              {t('actions.invoice')}
            </button>
          )}
          {s.status === 'invoiced' && open > 0 && !s.creditNote && (
            <button className={btn.primary} onClick={onPay}>
              {t('actions.pay')}
            </button>
          )}
          {s.status === 'invoiced' && !s.creditNote && receipts.length === 0 && (
            <button className={btn.danger} onClick={() => setConfirmCn(true)}>
              {t('actions.creditNote')}
            </button>
          )}
          <button className={btn.outline} onClick={onClose}>
            {tc('close')}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
        <Info k={t('info.nit')} v={fmtNit(c.nit)} />
        <Info k={t('info.city')} v={c.city} />
        <Info k={t('info.warehouse')} v={ITEM_BY_SKU[s.lines[0]?.sku]?.kind === 'service' ? '—' : tw(s.warehouse)} />
        <Info k={t('info.term')} v={t('info.termDays', { days: c.termDays })} />
        <Info k={t('info.quote')} v={`${s.quoteNo} · ${f.date(s.quoteDate)}`} />
        <Info k={t('info.order')} v={s.orderNo ? `${s.orderNo} · ${f.date(s.orderDate)}` : '—'} />
        <Info k={t('info.invoice')} v={s.invoiceNo ? `${s.invoiceNo} · ${f.date(s.invoiceDate)}` : '—'} />
        <Info k={t('info.due')} v={s.dueDate ? f.date(s.dueDate) : '—'} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[520px]">
          <thead>
            <tr className={theadCls}>
              <Th>{t('lines.item')}</Th>
              <Th right>{t('lines.qty')}</Th>
              <Th right>{t('lines.price')}</Th>
              <Th right>{t('lines.vat')}</Th>
              <Th right>{t('lines.subtotal')}</Th>
            </tr>
          </thead>
          <tbody>
            {s.lines.map((l, i) => (
              <tr key={i} className={rowCls}>
                <td className="py-1.5 pr-3 text-secondary-900 dark:text-white">
                  <span className="font-mono text-[10px] text-secondary-500 mr-1.5">{l.sku}</span>
                  {f.item(l.sku)}
                </td>
                <td className="py-1.5 pr-3 text-right">{f.qty(l.qty)}</td>
                <td className="py-1.5 pr-3 text-right">{f.money(l.price)}</td>
                <td className="py-1.5 pr-3 text-right">{l.vat ? `${l.vat} %` : t('lines.excluded')}</td>
                <td className="py-1.5 pr-3 text-right font-medium">{f.money(Math.round(l.qty * l.price))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 ml-auto max-w-xs space-y-1 text-sm">
        <Total k={t('lines.subtotal')} v={f.money(tt.subtotal)} />
        <Total k={t('lines.vatTotal')} v={f.money(tt.vat)} />
        <Total k={t('lines.total')} v={f.money(tt.total)} bold />
        {s.status === 'invoiced' && <Total k={t('lines.open')} v={f.money(open)} />}
      </div>

      {short.length > 0 && (
        <div className="mt-4">
          <Note tone="warn">
            <p className="font-semibold mb-1">{t('shortage.title', { wh: tw(s.warehouse) })}</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {short.map((x) => (
                <li key={x.sku}>{t('shortage.line', { item: f.item(x.sku), need: f.qty(x.need), have: f.qty(x.have) })}</li>
              ))}
            </ul>
            <button className={`${btn.ghost} mt-2 px-0`} onClick={() => goTo('inventory')}>
              {t('shortage.go')}
            </button>
          </Note>
        </div>
      )}

      {s.status === 'invoiced' && (
        <div className="mt-4 space-y-3">
          <Note>
            <p className="font-semibold">{s.dian === 'sending' ? t('dian.sending') : t('dian.accepted')}</p>
            <p className="mt-1">{t('dian.note')}</p>
            <Link href="/demo/facturacion-electronica" className="inline-block mt-1 font-semibold underline">
              {t('dian.link')}
            </Link>
          </Note>
          <div className="text-xs text-secondary-700 dark:text-secondary-300">
            <p className="font-semibold text-secondary-900 dark:text-white mb-1">{t('trace.title')}</p>
            <ul className="space-y-1">
              {entries.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-2">
                  <span>{t(`trace.${e.source}`, { doc: e.no })}</span>
                  <button className="text-primary-700 dark:text-primary-300 underline" onClick={() => goTo('accounting', e.no)}>
                    {t('trace.seeEntry')}
                  </button>
                </li>
              ))}
              {receipts.map((r) => (
                <li key={r.id}>{t('trace.receipt', { doc: r.no, date: f.date(r.date), amount: f.money(r.amount) })}</li>
              ))}
              {s.lines.some((l) => ITEM_BY_SKU[l.sku].kind !== 'service') && <li>{t('trace.stock', { wh: tw(s.warehouse) })}</li>}
            </ul>
          </div>
        </div>
      )}

      {confirmCn && (
        <Modal
          title={t('creditNote.title', { doc: s.invoiceNo! })}
          onClose={() => setConfirmCn(false)}
          footer={
            <>
              <button className={btn.outline} onClick={() => setConfirmCn(false)}>
                {tc('cancel')}
              </button>
              <button className={btn.danger} onClick={doCreditNote}>
                {t('creditNote.confirm')}
              </button>
            </>
          }
        >
          <p className="text-sm text-secondary-700 dark:text-secondary-300">{t('creditNote.body', { wh: tw(s.warehouse) })}</p>
        </Modal>
      )}
    </Modal>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase font-semibold text-secondary-500 dark:text-secondary-400">{k}</p>
      <p className="text-secondary-900 dark:text-white break-words">{v}</p>
    </div>
  );
}

function Total({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${bold ? 'font-bold border-t border-secondary-200 dark:border-secondary-700 pt-1' : ''}`}>
      <span className="text-secondary-600 dark:text-secondary-400">{k}</span>
      <span className="text-secondary-900 dark:text-white">{v}</span>
    </div>
  );
}

function QuoteForm({ onClose }: { onClose: () => void }) {
  const t = useTranslations('demoErp.sales');
  const tc = useTranslations('demoErp.common');
  const tw = useTranslations('demoErp.warehouses');
  const { filters, computed, dispatch, state, ensureOpenPeriod } = useErp();
  const f = useFmt();
  const [company, setCompany] = useState<CompanyId>(filters.company === 'log' ? 'log' : 'com');
  const customers = CUSTOMERS.filter((c) => c.companies.includes(company));
  const [customerId, setCustomerId] = useState(customers[0].id);
  const [warehouse, setWarehouse] = useState<WarehouseId>(customers[0].warehouse);
  const catalog = ITEMS.filter((i) => (company === 'log' ? i.kind === 'service' : i.kind === 'merch' || i.kind === 'finished'));
  const [lines, setLines] = useState<{ sku: string; qty: string }[]>([{ sku: catalog[0].sku, qty: '' }]);
  const current = useMemo(() => valuationAt(computed.movements, '9999-12-31'), [computed]);
  const [error, setError] = useState('');

  const changeCompany = (c: CompanyId) => {
    setCompany(c);
    const first = CUSTOMERS.filter((x) => x.companies.includes(c))[0];
    setCustomerId(first.id);
    setWarehouse(first.warehouse);
    const cat = ITEMS.filter((i) => (c === 'log' ? i.kind === 'service' : i.kind === 'merch' || i.kind === 'finished'));
    setLines([{ sku: cat[0].sku, qty: '' }]);
  };

  const parsed: DocLine[] = lines
    .map((l) => ({ sku: l.sku, qty: Math.round(Number(l.qty)), price: ITEM_BY_SKU[l.sku].price, vat: ITEM_BY_SKU[l.sku].vat }))
    .filter((l) => l.qty > 0);
  const tt = docTotals(parsed);

  const save = () => {
    if (!parsed.length) return setError(t('form.errorLines'));
    if (new Set(parsed.map((l) => l.sku)).size !== parsed.length) return setError(t('form.errorDup'));
    const n = state.counters.COT;
    dispatch({ type: 'createQuote', company, customerId, warehouse: company === 'log' ? 'bog' : warehouse, lines: parsed });
    if (ensureOpenPeriod()) toast(t('periodSwitched'));
    toast.success(t('toasts.quoted', { doc: `COT-${pad(n)}` }));
    onClose();
  };

  return (
    <Modal
      wide
      title={t('form.title')}
      subtitle={t('form.subtitle', { date: f.date(WORK_DATE) })}
      onClose={onClose}
      footer={
        <>
          <button className={btn.outline} onClick={onClose}>
            {tc('cancel')}
          </button>
          <button className={btn.primary} onClick={save}>
            {t('form.save')}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <label className="block">
          <FieldLabel>{t('form.company')}</FieldLabel>
          <select className={plainSelectCls} value={company} onChange={(e) => changeCompany(e.target.value as CompanyId)}>
            <option value="com">{COMPANIES.com.name}</option>
            <option value="log">{COMPANIES.log.name}</option>
          </select>
        </label>
        <label className="block">
          <FieldLabel>{t('form.customer')}</FieldLabel>
          <select
            className={plainSelectCls}
            value={customerId}
            onChange={(e) => {
              setCustomerId(e.target.value);
              setWarehouse(CUSTOMER_BY_ID[e.target.value].warehouse);
            }}
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {company === 'com' && (
          <label className="block">
            <FieldLabel>{t('form.warehouse')}</FieldLabel>
            <select className={plainSelectCls} value={warehouse} onChange={(e) => setWarehouse(e.target.value as WarehouseId)}>
              {WAREHOUSES.map((w) => (
                <option key={w} value={w}>
                  {tw(w)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="space-y-2">
        {lines.map((l, i) => {
          const it = ITEM_BY_SKU[l.sku];
          const have = it.kind === 'service' ? null : stockOf(current, l.sku, warehouse);
          return (
            <div key={i} className="grid grid-cols-12 gap-2 items-end">
              <label className="col-span-12 sm:col-span-6 block">
                {i === 0 && <FieldLabel>{t('form.item')}</FieldLabel>}
                <select className={plainSelectCls} value={l.sku} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, sku: e.target.value } : x)))}>
                  {catalog.map((c) => (
                    <option key={c.sku} value={c.sku}>
                      {c.sku} · {f.item(c.sku)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="col-span-5 sm:col-span-2 block">
                {i === 0 && <FieldLabel>{t('form.qty')}</FieldLabel>}
                <input className={inputCls} inputMode="numeric" value={l.qty} placeholder="0" onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, qty: e.target.value.replace(/[^\d]/g, '') } : x)))} aria-label={t('form.qty')} />
              </label>
              <div className="col-span-5 sm:col-span-3 text-[11px] text-secondary-600 dark:text-secondary-400 pb-2">
                {f.money(it.price)} {it.vat ? `+ IVA ${it.vat} %` : `· ${t('lines.excluded')}`}
                {have !== null && <span className="block">{t('form.available', { qty: f.qty(have) })}</span>}
              </div>
              <div className="col-span-2 sm:col-span-1 pb-1 text-right">
                <button className="p-2 rounded-md text-secondary-500 hover:text-red-600 disabled:opacity-30" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} disabled={lines.length === 1} aria-label={t('form.removeLine')}>
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <button className={`${btn.ghost} mt-2`} onClick={() => setLines((ls) => [...ls, { sku: catalog.find((c) => !ls.some((x) => x.sku === c.sku))?.sku || catalog[0].sku, qty: '' }])}>
        <PlusIcon className="w-4 h-4" />
        {t('form.addLine')}
      </button>
      <div className="mt-3 text-sm text-right text-secondary-800 dark:text-secondary-200">
        {t('form.totals', { subtotal: f.money(tt.subtotal), vat: f.money(tt.vat), total: f.money(tt.total) })}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <p className="mt-3 text-[11px] text-secondary-500">{t('form.note')}</p>
    </Modal>
  );
}

function PaymentForm({ saleId, onClose }: { saleId: string; onClose: () => void }) {
  const t = useTranslations('demoErp.sales');
  const tc = useTranslations('demoErp.common');
  const { state, computed, dispatch, ensureOpenPeriod } = useErp();
  const f = useFmt();
  const s = state.sales.find((x) => x.id === saleId)!;
  const open = saleOpenAt(s, computed, WORK_DATE);
  const [amount, setAmount] = useState(String(open));
  const [method, setMethod] = useState<PayMethod>('pse');
  const [error, setError] = useState('');
  const save = () => {
    const v = Math.round(Number(amount));
    if (!v || v <= 0 || v > open) return setError(t('payment.error', { max: f.cop(open) }));
    const n = state.counters.RC;
    dispatch({ type: 'receipt', saleId, amount: v, method });
    if (ensureOpenPeriod()) toast(t('periodSwitched'));
    toast.success(t('toasts.paid', { doc: `RC-${pad(n)}`, inv: s.invoiceNo! }));
    onClose();
  };
  return (
    <Modal
      title={t('payment.title', { doc: s.invoiceNo! })}
      subtitle={CUSTOMER_BY_ID[s.customerId].name}
      onClose={onClose}
      footer={
        <>
          <button className={btn.outline} onClick={onClose}>
            {tc('cancel')}
          </button>
          <button className={btn.primary} onClick={save}>
            {t('payment.save')}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-secondary-700 dark:text-secondary-300">{t('payment.open', { amount: f.cop(open) })}</p>
        <label className="block">
          <FieldLabel>{t('payment.amount')}</FieldLabel>
          <input className={inputCls} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))} />
        </label>
        <label className="block">
          <FieldLabel>{t('payment.method')}</FieldLabel>
          <select className={plainSelectCls} value={method} onChange={(e) => setMethod(e.target.value as PayMethod)}>
            {(['pse', 'transfer', 'deposit'] as PayMethod[]).map((m) => (
              <option key={m} value={m}>
                {t(`payment.methods.${m}`)}
              </option>
            ))}
          </select>
        </label>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <p className="text-[11px] text-secondary-500">{t('payment.note', { date: f.date(WORK_DATE) })}</p>
      </div>
    </Modal>
  );
}
