'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDownTrayIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { customerMonths, openInvoices, periodEnd, rowsIn, type CustomerStat, type Segment } from '../lib/engine';
import { toCsv } from '../lib/csv';
import { slugify } from '../lib/format';
import { useDashboard } from '../lib/store';
import { MiniBars } from './charts';
import { btn, card, downloadText, inputCls, Modal, Note, NS, selectCls, SectionTitle, useFmt, useLabels } from './ui';

type SortKey = 'sales' | 'yoy' | 'margin' | 'overdue' | 'name';

const SEGMENT_STYLE: Record<Segment, string> = {
  nuevo: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  recurrente: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  riesgo: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300',
};

export function SegmentBadge({ segment }: { segment: Segment }) {
  const t = useTranslations(`${NS}.customers.segments`);
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${SEGMENT_STYLE[segment]}`}>{t(segment)}</span>;
}

export default function Customers() {
  const t = useTranslations(`${NS}.customers`);
  const fmt = useFmt();
  const labels = useLabels();
  const { ctx, period, dataset, openCustomer, notify, company } = useDashboard();
  const [q, setQ] = useState('');
  const [segment, setSegment] = useState<'all' | Segment>('all');
  const [city, setCity] = useState('all');
  const [sort, setSort] = useState<SortKey>('sales');
  const [dir, setDir] = useState<'desc' | 'asc'>('desc');

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = ctx.customers.filter(
      (c) =>
        (segment === 'all' || c.segment === segment) &&
        (city === 'all' || c.city === city) &&
        (!needle || c.name.toLowerCase().includes(needle) || c.seller.toLowerCase().includes(needle) || c.city.toLowerCase().includes(needle)),
    );
    const val = (c: CustomerStat): number | string => (sort === 'name' ? c.name : sort === 'yoy' ? c.yoy ?? -Infinity : sort === 'margin' ? c.margin ?? -Infinity : sort === 'overdue' ? c.overdue : c.sales);
    out.sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return dir === 'asc' ? cmp : -cmp;
    });
    return out;
  }, [ctx.customers, q, segment, city, sort, dir]);

  const counts = useMemo(() => {
    const c: Record<Segment, number> = { nuevo: 0, recurrente: 0, riesgo: 0 };
    for (const x of ctx.customers) c[x.segment]++;
    return c;
  }, [ctx.customers]);

  const toggleSort = (k: SortKey) => {
    if (sort === k) setDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else {
      setSort(k);
      setDir(k === 'name' ? 'asc' : 'desc');
    }
  };

  const exportCsv = () => {
    const csv = toCsv(
      [t('csv.customer'), labels.cityDim, t('csv.seller'), t('csv.sales'), t('csv.prevSales'), t('csv.yoy'), t('csv.margin'), t('csv.invoices'), t('csv.overdue'), t('csv.segment')],
      list.map((c) => [
        c.name,
        c.city,
        c.seller,
        Math.round(c.sales),
        c.prevSales !== null ? Math.round(c.prevSales) : null,
        c.yoy !== null ? (c.yoy * 100).toFixed(1) : null,
        c.margin !== null ? (c.margin * 100).toFixed(1) : null,
        c.invoices,
        dataset.hasReceivables ? Math.round(c.overdue) : null,
        t(`segments.${c.segment}`),
      ]),
      fmt.loc,
    );
    const file = `clientes-${slugify(dataset.source === 'sample' ? company.name : dataset.fileName ?? 'archivo')}-${period.key.replace(':', '-')}.csv`;
    downloadText(csv, file, 'text/csv;charset=utf-8');
    notify(t('exported', { file, count: list.length }));
  };

  const header = (k: SortKey, label: string, align: 'left' | 'right' = 'right') => (
    <th className={`py-2 px-2 font-semibold ${align === 'right' ? 'text-right' : 'text-left'}`} aria-sort={sort === k ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="inline-flex items-center gap-1 hover:text-purple-700 dark:hover:text-purple-300" onClick={() => toggleSort(k)}>
        {label}
        <span aria-hidden="true">{sort === k ? (dir === 'asc' ? '▲' : '▼') : ''}</span>
      </button>
    </th>
  );

  return (
    <section className={`${card} overflow-hidden`} aria-labelledby="cust-title">
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800">
        <SectionTitle
          title={<span id="cust-title">{t('title')}</span>}
          subtitle={t('subtitle', { period: fmt.period(period), drop: fmt.num(ctx.params.thresholds.riskDrop) })}
          actions={
            <button type="button" className={btn.small} onClick={exportCsv} disabled={!list.length}>
              <ArrowDownTrayIcon className="w-4 h-4" aria-hidden="true" />
              {t('export')}
            </button>
          }
        />
        <div className="flex flex-wrap gap-2 mb-4">
          {(['all', 'nuevo', 'recurrente', 'riesgo'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSegment(s)}
              aria-pressed={segment === s}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                segment === s ? 'bg-purple-600 text-white border-purple-600' : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {s === 'all' ? t('all', { count: ctx.customers.length }) : `${t(`segments.${s}`)} (${counts[s]})`}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <label htmlFor="cust-q" className="sr-only">
              {t('search')}
            </label>
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input id="cust-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search')} className={`${inputCls} pl-9`} />
          </div>
          <div>
            <label htmlFor="cust-city" className="sr-only">
              {labels.cityDim}
            </label>
            <select id="cust-city" value={city} onChange={(e) => setCity(e.target.value)} className={selectCls}>
              <option value="all">{t('allCities', { dim: labels.cityDimPlural.toLowerCase() })}</option>
              {ctx.idx.cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cust-sort" className="sr-only">
              {t('sortBy')}
            </label>
            <select id="cust-sort" value={`${sort}:${dir}`} onChange={(e) => {
              const [k, d] = e.target.value.split(':');
              setSort(k as SortKey);
              setDir(d as 'asc' | 'desc');
            }} className={selectCls}>
              {(['sales:desc', 'yoy:asc', 'yoy:desc', 'margin:desc', 'overdue:desc', 'name:asc'] as const)
                .filter((o) => (o.startsWith('overdue') ? dataset.hasReceivables : o.startsWith('margin') ? dataset.hasCost : true))
                .map((o) => (
                  <option key={o} value={o}>
                    {t(`sort.${o.replace(':', '_')}`)}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
          {t('showing', { count: list.length, total: ctx.customers.length })}
        </p>
      </div>

      {list.length === 0 ? (
        <p className="p-6 text-sm text-slate-500">{t('empty')}</p>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
                <tr>
                  {header('name', t('col.customer'), 'left')}
                  <th className="py-2 px-2 text-left font-semibold">{labels.cityDim}</th>
                  {header('sales', t('col.sales'))}
                  {header('yoy', t('col.yoy'))}
                  {dataset.hasCost && header('margin', t('col.margin'))}
                  {dataset.hasReceivables && header('overdue', t('col.overdue'))}
                  <th className="py-2 px-2 text-left font-semibold">{t('col.segment')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {list.map((c) => (
                  <tr key={c.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="py-2.5 px-2">
                      <button type="button" className="text-left font-semibold text-slate-900 dark:text-white hover:text-purple-700 dark:hover:text-purple-300 hover:underline" onClick={() => openCustomer(c.name)}>
                        {c.name}
                      </button>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{c.seller}</div>
                    </td>
                    <td className="py-2.5 px-2 text-slate-700 dark:text-slate-300">{c.city}</td>
                    <td className="py-2.5 px-2 text-right font-semibold whitespace-nowrap">{fmt.moneyM(c.sales)}</td>
                    <td className={`py-2.5 px-2 text-right whitespace-nowrap ${c.yoy === null ? '' : c.yoy >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                      {c.yoy !== null ? fmt.signedPct(c.yoy) : t('noPrev')}
                    </td>
                    {dataset.hasCost && <td className="py-2.5 px-2 text-right whitespace-nowrap">{c.margin !== null ? fmt.pct(c.margin) : '—'}</td>}
                    {dataset.hasReceivables && <td className={`py-2.5 px-2 text-right whitespace-nowrap ${c.over60 > 0 ? 'text-red-700 dark:text-red-400 font-semibold' : ''}`}>{c.overdue ? fmt.moneyM(c.overdue) : '—'}</td>}
                    <td className="py-2.5 px-2">
                      <SegmentBadge segment={c.segment} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {list.map((c) => (
              <li key={c.name} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <button type="button" className="text-left font-semibold text-slate-900 dark:text-white hover:underline min-w-0" onClick={() => openCustomer(c.name)}>
                    {c.name}
                  </button>
                  <SegmentBadge segment={c.segment} />
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {c.city} · {c.seller}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-slate-500">{t('col.sales')}</div>
                    <div className="font-semibold">{fmt.moneyM(c.sales)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">{t('col.yoy')}</div>
                    <div className={`font-semibold ${c.yoy === null ? '' : c.yoy >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>{c.yoy !== null ? fmt.signedPct(c.yoy) : t('noPrev')}</div>
                  </div>
                  {dataset.hasReceivables ? (
                    <div>
                      <div className="text-slate-500">{t('col.overdue')}</div>
                      <div className="font-semibold">{c.overdue ? fmt.moneyM(c.overdue) : '—'}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-slate-500">{t('col.margin')}</div>
                      <div className="font-semibold">{c.margin !== null ? fmt.pct(c.margin) : '—'}</div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="p-5 sm:p-6 pt-0 sm:pt-0">
        <Note>{t('segmentNote', { drop: fmt.num(ctx.params.thresholds.riskDrop) })}</Note>
      </div>
    </section>
  );
}

/** Detalle de un cliente (se abre desde Clientes, Finanzas o el buscador). */
export function CustomerModal() {
  const t = useTranslations(`${NS}.customers.detail`);
  const tc = useTranslations(`${NS}.customers`);
  const fmt = useFmt();
  const labels = useLabels();
  const { customer, openCustomer, ctx, period, dataset, openInvoice, notify } = useDashboard();
  const stat = ctx.customers.find((c) => c.name === customer) ?? null;
  const info = customer ? ctx.idx.customerMap.get(customer) ?? null : null;
  const months = useMemo(() => (customer ? customerMonths(ctx.idx, customer, period) : []), [ctx.idx, customer, period]);
  const invoices = useMemo(() => (customer ? rowsIn(ctx.idx, period.months, { customer }).sort((a, b) => (a.date < b.date ? 1 : -1)) : []), [ctx.idx, customer, period.months]);
  const open = useMemo(() => (customer ? openInvoices(ctx.idx, periodEnd(dataset, period), { customer }).sort((a, b) => b.daysOverdue - a.daysOverdue) : []), [ctx.idx, customer, dataset, period]);
  if (!customer || !info) return null;
  const close = () => openCustomer(null);

  const exportInvoices = () => {
    const csv = toCsv(
      [tc('csv.invoice'), tc('csv.date'), labels.cityDim, tc('csv.line'), tc('csv.sales'), tc('csv.cost'), tc('csv.due'), tc('csv.paid')],
      invoices.map((r) => [r.id, r.date, r.city, labels.line(r.line), Math.round(r.value), r.cost !== null ? Math.round(r.cost) : null, r.due, r.paid]),
      fmt.loc,
    );
    const file = `facturas-${slugify(customer)}-${period.key.replace(':', '-')}.csv`;
    downloadText(csv, file, 'text/csv;charset=utf-8');
    notify(tc('exported', { file, count: invoices.length }));
  };

  return (
    <Modal
      title={customer}
      subtitle={t('subtitle', { city: info.city, seller: info.seller, since: fmt.date(info.first) })}
      onClose={close}
      size="lg"
      labelId="cust-detail-title"
      footer={
        <>
          <button type="button" className={btn.outline} onClick={exportInvoices} disabled={!invoices.length}>
            <ArrowDownTrayIcon className="w-4 h-4" aria-hidden="true" />
            {t('export')}
          </button>
          <button type="button" className={btn.primary} onClick={close}>
            {t('close')}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
          <div className="text-xs text-slate-500">{t('sales', { period: fmt.period(period) })}</div>
          <div className="font-bold text-slate-900 dark:text-white">{fmt.moneyM(stat?.sales ?? 0)}</div>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
          <div className="text-xs text-slate-500">{t('yoy')}</div>
          <div className="font-bold text-slate-900 dark:text-white">{stat?.yoy !== null && stat?.yoy !== undefined ? fmt.signedPct(stat.yoy) : tc('noPrev')}</div>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
          <div className="text-xs text-slate-500">{t('margin')}</div>
          <div className="font-bold text-slate-900 dark:text-white">{stat?.margin !== null && stat?.margin !== undefined ? fmt.pct(stat.margin) : '—'}</div>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
          <div className="text-xs text-slate-500">{t('payment')}</div>
          <div className="font-bold text-slate-900 dark:text-white">
            {info.term !== null ? t('paymentValue', { term: info.term, delay: info.avgDelay ?? 0 }) : '—'}
          </div>
        </div>
      </div>
      {stat && (
        <div className="mb-2 flex items-center gap-2">
          <SegmentBadge segment={stat.segment} />
          <span className="text-xs text-slate-500 dark:text-slate-400">{t(`segmentWhy.${stat.segment}`, { drop: fmt.num(ctx.params.thresholds.riskDrop) })}</span>
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-4 mb-2">{t('last12')}</h3>
      <MiniBars data={months} fmt={fmt} highlight={period.months} />

      {dataset.hasReceivables && (
        <>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-6 mb-2">{t('openTitle', { date: fmt.date(periodEnd(dataset, period)) })}</h3>
          {open.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[420px]">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-1.5 text-left font-semibold">{tc('csv.invoice')}</th>
                    <th className="py-1.5 px-2 text-left font-semibold">{tc('csv.due')}</th>
                    <th className="py-1.5 px-2 text-right font-semibold">{tc('csv.daysOverdue')}</th>
                    <th className="py-1.5 pl-2 text-right font-semibold">{tc('csv.sales')}</th>
                  </tr>
                </thead>
                <tbody>
                  {open.slice(0, 12).map((o) => (
                    <tr key={o.row.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-1.5">
                        <button type="button" className="text-purple-700 dark:text-purple-300 hover:underline" onClick={() => openInvoice(o.row.id)}>
                          {o.row.id}
                        </button>
                      </td>
                      <td className="py-1.5 px-2">{o.row.due ? fmt.date(o.row.due) : '—'}</td>
                      <td className={`py-1.5 px-2 text-right ${o.daysOverdue > 60 ? 'text-red-700 dark:text-red-400 font-semibold' : ''}`}>{o.daysOverdue > 0 ? o.daysOverdue : t('notDue')}</td>
                      <td className="py-1.5 pl-2 text-right">{fmt.money(o.row.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {open.length > 12 && <p className="text-xs text-slate-500 mt-1">{t('more', { count: open.length - 12 })}</p>}
            </div>
          ) : (
            <p className="text-sm text-slate-500">{t('noOpen')}</p>
          )}
        </>
      )}

      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-6 mb-2">{t('invoicesTitle', { count: invoices.length })}</h3>
      {invoices.length ? (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
          {invoices.slice(0, 8).map((r) => (
            <li key={r.id} className="py-1.5 flex items-center justify-between gap-2">
              <button type="button" className="text-purple-700 dark:text-purple-300 hover:underline" onClick={() => openInvoice(r.id)}>
                {r.id}
              </button>
              <span className="text-xs text-slate-500 truncate">
                {fmt.date(r.date)} · {labels.line(r.line)}
              </span>
              <span className="font-semibold whitespace-nowrap">{fmt.money(r.value)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">{t('noInvoices')}</p>
      )}
      {invoices.length > 8 && <p className="text-xs text-slate-500 mt-1">{t('moreInvoices', { count: invoices.length - 8 })}</p>}
    </Modal>
  );
}

export function InvoiceModal() {
  const t = useTranslations(`${NS}.customers.invoice`);
  const fmt = useFmt();
  const labels = useLabels();
  const { invoice, openInvoice, dataset, openCustomer } = useDashboard();
  const row = invoice ? dataset.rows.find((r) => r.id === invoice) ?? null : null;
  if (!invoice || !row) return null;
  const status = !dataset.hasReceivables ? null : row.paid ? 'paid' : 'open';
  const fields: [string, string][] = [
    [t('date'), fmt.date(row.date)],
    [t('customer'), row.customer],
    [labels.cityDim, row.city],
    [t('line'), labels.line(row.line)],
    [t('seller'), row.seller],
    [t('value'), fmt.money(row.value)],
  ];
  if (row.cost !== null) {
    fields.push([t('cost'), fmt.money(row.cost)]);
    fields.push([t('margin'), fmt.pct(row.value ? (row.value - row.cost) / row.value : 0)]);
  }
  if (row.due) fields.push([t('due'), fmt.date(row.due)]);
  if (status) fields.push([t('status'), row.paid ? t('paidOn', { date: fmt.date(row.paid) }) : t('pending')]);
  return (
    <Modal
      title={t('title', { id: row.id })}
      onClose={() => openInvoice(null)}
      size="sm"
      labelId="inv-detail-title"
      footer={
        <>
          <button
            type="button"
            className={btn.outline}
            onClick={() => {
              openInvoice(null);
              openCustomer(row.customer);
            }}
          >
            {t('viewCustomer')}
          </button>
          <button type="button" className={btn.primary} onClick={() => openInvoice(null)}>
            {t('close')}
          </button>
        </>
      }
    >
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {fields.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
            <dd className="font-medium text-slate-900 dark:text-white text-right break-words">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4">
        <Note>{dataset.source === 'sample' ? t('noteSample') : t('noteUpload')}</Note>
      </div>
    </Modal>
  );
}

