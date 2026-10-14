'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, DocumentChartBarIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { BillingDoc, IncomingInvoice } from './data';
import { docTotals, downloadBlob, downloadText, formatDate, incomingIva, incomingStage, incomingTotal, isIssued, toCsv } from './docs';
import { formatCOP } from './fiscal';
import { makeBookPdf } from './pdf';
import { focusRing, inputCls, onTabsKeyDown, SectionTitle, useMonthLabel, useMonths } from './ui';
import type { BillingStore } from './useBillingStore';

type Book = 'sales' | 'purchases' | 'vat' | 'withholding';
const BOOKS: Book[] = ['sales', 'purchases', 'vat', 'withholding'];

interface Table {
  head: string[];
  /** Filas para CSV (números sin formato). */
  raw: (string | number)[][];
  align: ('l' | 'r')[];
  widths: number[];
  /** Columnas numéricas (se formatean en pantalla y PDF). */
  money: boolean[];
  total?: (string | number)[];
}

/** Meses con movimientos (documentos o compras) más el mes en curso, del más reciente al más antiguo. */
export function periodsOf(docs: BillingDoc[], incoming: IncomingInvoice[], today: string): string[] {
  const set = new Set<string>([today.slice(0, 7)]);
  docs.forEach((d) => set.add(d.issueDate.slice(0, 7)));
  incoming.forEach((i) => set.add(i.issueDate.slice(0, 7)));
  return Array.from(set).sort().reverse();
}

export function ReportsPanel({ store }: { store: BillingStore }) {
  const t = useTranslations('demoBilling');
  const months = useMonths();
  const monthLabel = useMonthLabel();
  const { state, today, markProgress } = store;
  const periods = useMemo(() => periodsOf(state.docs, state.incoming, today), [state.docs, state.incoming, today]);
  // Arranca en el mes en curso; si aún no tiene documentos (primeros días del mes), en el anterior.
  const [period, setPeriod] = useState<string>(() => {
    const current = today.slice(0, 7);
    return state.docs.some((d) => isIssued(d) && d.issueDate.startsWith(current)) ? current : periods[1] || current;
  });
  const [book, setBook] = useState<Book>('sales');

  const docs = useMemo(
    () => state.docs.filter((d) => isIssued(d) && (period === 'all' || d.issueDate.startsWith(period))),
    [state.docs, period],
  );
  const purchases = useMemo(
    () =>
      state.incoming.filter((i) => {
        const stage = incomingStage(i, today);
        return stage !== 'claimed' && stage !== 'returned' && (period === 'all' || i.issueDate.startsWith(period));
      }),
    [state.incoming, period, today],
  );

  const table: Table = useMemo(() => buildTable(book, docs, purchases, t, today), [book, docs, purchases, t, today]);
  const oldest = periods[periods.length - 1];
  const newest = periods[0];
  const periodLabel =
    period === 'all' ? t('reports.periodAll', { from: monthLabel(oldest), to: monthLabel(newest) }) : monthLabel(period, true);
  const fmtCell = (v: string | number, i: number) => (table.money[i] && typeof v === 'number' ? formatCOP(v) : String(v));
  const bookName = t(`reports.books.${book}`);
  const fileBase = `${t(`reports.files.${book}`)}-${period === 'all' ? t('reports.files.allSuffix', { from: oldest, to: newest }) : period}`;

  const exportCsv = () => {
    downloadText(`${fileBase}.csv`, toCsv([table.head, ...table.raw, ...(table.total ? [table.total] : [])]), 'text/csv');
    markProgress('export');
    toast.success(t('reports.downloaded', { file: `${fileBase}.csv` }));
  };
  const exportPdf = async () => {
    try {
      const rows = [...table.raw, ...(table.total ? [table.total] : [])].map((r) => r.map((v, i) => fmtCell(v, i)));
      const blob = await makeBookPdf({
        title: bookName,
        subtitle: `${state.issuer.name} · NIT ${state.issuer.nit}-${state.issuer.dv} · ${periodLabel}`,
        sample: t('reports.pdfSample'),
        head: table.head,
        rows,
        align: table.align,
        widths: table.widths,
        boldLast: !!table.total,
      });
      downloadBlob(`${fileBase}.pdf`, blob);
      markProgress('export');
      toast.success(t('reports.downloaded', { file: `${fileBase}.pdf` }));
    } catch {
      toast.error(t('documents.downloadError'));
    }
  };

  return (
    <Card variant="bordered" padding="md" id="reportes" className="scroll-mt-24">
      <SectionTitle icon={<DocumentChartBarIcon className="w-5 h-5" />} title={t('reports.title')} subtitle={t('reports.subtitle')} />
      <div className="flex flex-col md:flex-row md:items-end gap-3 mb-3">
        <div>
          <label htmlFor="fe-period" className="block text-xs font-medium text-secondary-600 dark:text-secondary-300 mb-1">
            {t('reports.period')}
          </label>
          <select id="fe-period" className={inputCls + ' md:w-48'} value={period} onChange={(e) => setPeriod(e.target.value)}>
            {periods.map((p) => (
              <option key={p} value={p}>
                {monthLabel(p, true)}
              </option>
            ))}
            <option value="all">{t('reports.periodAll', { from: monthLabel(oldest), to: monthLabel(newest) })}</option>
          </select>
        </div>
        <div role="tablist" aria-label={t('reports.title')} className="flex flex-wrap gap-2 flex-1" onKeyDown={(e) => onTabsKeyDown(e, BOOKS, book, setBook)}>
          {BOOKS.map((b) => (
            <button
              key={b}
              id={`fe-book-${b}`}
              type="button"
              role="tab"
              aria-selected={book === b}
              aria-controls="fe-book-panel"
              tabIndex={book === b ? 0 : -1}
              onClick={() => setBook(b)}
              className={
                'px-3 py-1.5 rounded-lg text-sm transition ' +
                focusRing +
                ' ' +
                (book === b
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-200 hover:bg-secondary-200 dark:hover:bg-secondary-700')
              }
            >
              {t(`reports.books.${b}`)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <ArrowDownTrayIcon className="w-4 h-4 mr-1" /> {t('reports.csv')}
          </Button>
          <Button size="sm" variant="outline" onClick={exportPdf}>
            <ArrowDownTrayIcon className="w-4 h-4 mr-1" /> PDF
          </Button>
        </div>
      </div>
      <div id="fe-book-panel" role="tabpanel" aria-labelledby={`fe-book-${book}`}>
      <p className="text-xs text-secondary-500 mb-2">
        {t('reports.rows', { n: table.raw.length })} · {t(`reports.notes.${book}`)}
      </p>
      <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-lg border border-secondary-200 dark:border-secondary-700" tabIndex={0} role="region" aria-label={`${bookName} · ${periodLabel}`}>
        <table className="w-full min-w-[640px] text-xs">
          <thead className="sticky top-0 bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-300">
            <tr>
              {table.head.map((h, i) => (
                <th key={h} className={'px-2 py-2 font-medium ' + (table.align[i] === 'r' ? 'text-right' : 'text-left')}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
            {table.raw.length === 0 && (
              <tr>
                <td colSpan={table.head.length} className="px-2 py-6 text-center text-secondary-500">
                  {t('reports.empty')}
                </td>
              </tr>
            )}
            {table.raw.map((r, ri) => (
              <tr key={ri}>
                {r.map((v, i) => (
                  <td key={i} className={'px-2 py-1.5 ' + (table.align[i] === 'r' ? 'text-right tabular-nums whitespace-nowrap' : '')}>
                    {i === 0 && /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? formatDate(String(v), months) : fmtCell(v, i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {table.total && table.raw.length > 0 && (
            <tfoot className="bg-secondary-50 dark:bg-secondary-800/60 font-semibold">
              <tr>
                {table.total.map((v, i) => (
                  <td key={i} className={'px-2 py-2 ' + (table.align[i] === 'r' ? 'text-right tabular-nums whitespace-nowrap' : '')}>
                    {fmtCell(v, i)}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      </div>
    </Card>
  );
}

type T = (key: string, values?: Record<string, string | number>) => string;

function buildTable(book: Book, docs: BillingDoc[], purchases: IncomingInvoice[], t: T, today: string): Table {
  const c = (k: string) => t(`reports.cols.${k}`);
  const nit = (d: BillingDoc) => (d.client.idType === 'NIT' ? `${d.client.idNumber}-${d.client.dv}` : d.client.idNumber);
  const sorted = docs.slice().sort((a, b) => (a.issueDate + a.issueTime).localeCompare(b.issueDate + b.issueTime));

  if (book === 'sales') {
    const raw = sorted.map((d) => {
      const tt = docTotals(d);
      const s = d.type === 'notaCredito' ? -1 : 1;
      return [d.issueDate, d.id, t(`docTypesShort.${d.type}`), d.client.name, nit(d), s * tt.subtotal, s * tt.iva, s * tt.total, t(`status.${d.status}`)];
    });
    const sum = (i: number) => raw.reduce((a, r) => a + (r[i] as number), 0);
    return {
      head: [c('date'), c('doc'), c('type'), c('client'), c('nit'), c('base'), c('iva'), c('total'), c('status')],
      raw,
      align: ['l', 'l', 'l', 'l', 'l', 'r', 'r', 'r', 'l'],
      widths: [11, 10, 10, 30, 13, 14, 12, 14, 12],
      money: [false, false, false, false, false, true, true, true, false],
      total: [t('reports.totalRow'), '', '', '', '', sum(5), sum(6), sum(7), ''],
    };
  }
  if (book === 'purchases') {
    const raw = purchases
      .slice()
      .sort((a, b) => a.issueDate.localeCompare(b.issueDate))
      .map((i) => [i.issueDate, i.supplier.name, `${i.supplier.nit}-${i.supplier.dv}`, i.number, i.concept, i.base, incomingIva(i), incomingTotal(i), t(`reception.stage.${incomingStage(i, today)}`)]);
    const sum = (k: number) => raw.reduce((a, r) => a + (r[k] as number), 0);
    return {
      head: [c('date'), c('supplier'), c('nit'), c('doc'), c('concept'), c('base'), c('iva'), c('total'), c('status')],
      raw,
      align: ['l', 'l', 'l', 'l', 'l', 'r', 'r', 'r', 'l'],
      widths: [11, 24, 13, 10, 26, 13, 11, 13, 13],
      money: [false, false, false, false, false, true, true, true, false],
      total: [t('reports.totalRow'), '', '', '', '', sum(5), sum(6), sum(7), ''],
    };
  }
  if (book === 'vat') {
    const acc = { b19: 0, i19: 0, b5: 0, i5: 0, ex: 0, excl: 0, ncBase: 0, ncIva: 0, ndBase: 0, ndIva: 0 };
    for (const d of docs) {
      const tt = docTotals(d);
      if (d.type === 'notaCredito') {
        acc.ncBase += tt.subtotal;
        acc.ncIva += tt.iva;
        continue;
      }
      if (d.type === 'notaDebito') {
        acc.ndBase += tt.subtotal;
        acc.ndIva += tt.iva;
        continue;
      }
      acc.b19 += tt.byTax.iva19.base;
      acc.i19 += tt.byTax.iva19.tax;
      acc.b5 += tt.byTax.iva5.base;
      acc.i5 += tt.byTax.iva5.tax;
      acc.ex += tt.byTax.exento.base;
      acc.excl += tt.byTax.excluido.base;
    }
    const dedBase = purchases.reduce((a, i) => a + i.base, 0);
    const dedIva = purchases.reduce((a, i) => a + incomingIva(i), 0);
    const balance = acc.i19 + acc.i5 - acc.ncIva + acc.ndIva - dedIva;
    const v = (k: string) => t(`reports.vat.${k}`);
    return {
      head: [c('concept'), c('base'), c('iva')],
      raw: [
        [v('generated19'), acc.b19, acc.i19],
        [v('generated5'), acc.b5, acc.i5],
        [v('exempt'), acc.ex, 0],
        [v('excluded'), acc.excl, 0],
        [v('creditNotes'), -acc.ncBase, -acc.ncIva],
        [v('debitNotes'), acc.ndBase, acc.ndIva],
        [v('deductible'), -dedBase, -dedIva],
      ],
      align: ['l', 'r', 'r'],
      widths: [50, 20, 20],
      money: [false, true, true],
      total: [v('balance'), '', balance],
    };
  }
  const raw = sorted
    .filter((d) => d.type === 'factura')
    .map((d) => {
      const tt = docTotals(d);
      return [d.issueDate, d.id, d.client.name, nit(d), tt.rete.fuente, tt.rete.iva, tt.rete.ica, tt.rete.total];
    })
    .filter((r) => (r[7] as number) > 0);
  const sum = (k: number) => raw.reduce((a, r) => a + (r[k] as number), 0);
  return {
    head: [c('date'), c('doc'), c('client'), c('nit'), c('retFuente'), c('retIva'), c('retIca'), c('total')],
    raw,
    align: ['l', 'l', 'l', 'l', 'r', 'r', 'r', 'r'],
    widths: [11, 10, 32, 13, 13, 13, 13, 13],
    money: [false, false, false, false, true, true, true, true],
    total: [t('reports.totalRow'), '', '', '', sum(4), sum(5), sum(6), sum(7)],
  };
}
