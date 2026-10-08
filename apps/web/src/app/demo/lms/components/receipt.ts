import { totals } from '../lib/engine';
import { receiptPdf } from '../lib/pdf';
import type { Sale } from '../lib/types';

type T = (key: string, values?: Record<string, string | number>) => string;
interface Fmt {
  money: (n: number) => string;
  date: (d: string, style?: 'short' | 'long') => string;
}

/** Comprobante de pago con los datos de la factura electrónica de ejemplo. */
export function downloadReceipt(sale: Sale, courseTitle: string, t: T, f: Fmt) {
  const tt = totals(sale.total, 0);
  const method = t(`pay.${sale.method}`) + (sale.last4 ? ` **** ${sale.last4}` : '');
  return receiptPdf({
    filename: `comprobante-${sale.ref}.pdf`,
    title: t('receipt.title'),
    sample: t('receipt.sample'),
    rows: [
      [t('receipt.ref'), sale.ref],
      [t('receipt.invoice'), `${sale.invoice} (${t('receipt.invoiceSim')})`],
      [t('receipt.date'), f.date(sale.date, 'long')],
      [t('receipt.buyer'), sale.buyer],
      [t('receipt.email'), sale.email],
      ...(sale.doc ? ([[t('receipt.doc'), sale.doc]] as [string, string][]) : []),
      [t('receipt.course'), courseTitle],
      [t('receipt.method'), method],
    ],
    lines: [
      { label: t('receipt.price'), value: f.money(sale.gross) },
      ...(sale.discount > 0 ? [{ label: t('receipt.discount', { code: sale.coupon ?? '' }), value: `- ${f.money(sale.discount)}` }] : []),
      { label: t('receipt.base'), value: f.money(tt.base) },
      { label: t('receipt.iva'), value: f.money(tt.iva) },
      { label: t('receipt.total'), value: f.money(sale.total), bold: true },
    ],
    footer: t('receipt.footer'),
  });
}
