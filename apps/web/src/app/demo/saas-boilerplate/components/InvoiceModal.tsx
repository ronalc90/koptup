'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { useDemo } from '../lib/store';
import { VENDOR } from '../lib/data';
import { formatNit } from '../lib/format';
import { cufeInput, sha384Hex } from '../lib/crypto';
import { downloadInvoicePdf } from '../lib/files';
import { useFmt } from '../lib/useFmt';
import { Modal } from './ui';

/** Representación gráfica de ejemplo de la factura electrónica de un cobro. */
export default function InvoiceModal({ invoiceId, onClose }: { invoiceId: string | null; onClose: () => void }) {
  const t = useTranslations('demoSaas');
  const f = useFmt();
  const { s, markInvoiceOpened } = useDemo();
  const inv = invoiceId ? s.invoices.find((i) => i.id === invoiceId) : null;
  const buyer = inv ? s.tenants.find((x) => x.id === inv.tenantId) : null;
  const [cufe, setCufe] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [busy, setBusy] = useState(false);
  const input = inv && buyer ? cufeInput(inv, buyer) : '';

  useEffect(() => {
    if (!invoiceId) return;
    markInvoiceOpened(invoiceId);
  }, [invoiceId, markInvoiceOpened]);

  useEffect(() => {
    let alive = true;
    setCufe(null);
    setShowInput(false);
    if (!input) return;
    sha384Hex(input).then((h) => {
      if (alive) setCufe(h);
    });
    return () => {
      alive = false;
    };
  }, [input]);

  if (!inv || !buyer) return null;

  const lineLabel =
    inv.concept === 'proration'
      ? t('invoice.lineProration', { plan: t(`plans.${inv.plan}.name`), period: f.period(inv.period) })
      : t('invoice.line', { product: VENDOR.product, plan: t(`plans.${inv.plan}.name`), period: f.period(inv.period) });

  const download = async () => {
    if (!cufe) return;
    setBusy(true);
    try {
      await downloadInvoicePdf(
        inv,
        buyer,
        {
          title: t('invoice.title'),
          notValid: t('invoice.notValid'),
          seller: t('invoice.seller'),
          buyer: t('invoice.buyer'),
          number: t('invoice.number'),
          issued: t('invoice.issued'),
          period: t('invoice.period'),
          method: t('invoice.method'),
          description: t('invoice.description'),
          amount: t('invoice.amount'),
          line: lineLabel,
          discount: t('invoice.discount'),
          subtotal: t('invoice.subtotal'),
          iva: t('invoice.iva'),
          total: t('invoice.total'),
          cufe: t('invoice.cufe'),
          cufeNote: t('invoice.cufeNote'),
          footer: t('invoice.footer'),
        },
        { issued: f.dateTime(inv.issuedAt), period: f.period(inv.period), method: t(`methods.${inv.method}`), money: f.money },
        cufe,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={!!inv} onClose={onClose} title={t('invoice.modalTitle', { number: inv.number })} wide>
      <div className="space-y-4 text-sm">
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">{t('invoice.notValid')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-secondary-500">{t('invoice.seller')}</div>
            <div className="font-medium text-secondary-900 dark:text-white">{VENDOR.name}</div>
            <div className="text-xs text-secondary-600 dark:text-secondary-300">NIT {formatNit(VENDOR.nit)} · {VENDOR.city}</div>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-secondary-500">{t('invoice.buyer')}</div>
            <div className="font-medium text-secondary-900 dark:text-white">{buyer.name}</div>
            <div className="break-words text-xs text-secondary-600 dark:text-secondary-300">NIT {formatNit(buyer.nit)} · {buyer.city} · {buyer.email}</div>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-2 rounded-lg bg-secondary-50 p-3 text-xs dark:bg-secondary-800/60 sm:grid-cols-4">
          <div><dt className="text-secondary-500">{t('invoice.number')}</dt><dd className="font-semibold text-secondary-900 dark:text-white">{inv.number}</dd></div>
          <div><dt className="text-secondary-500">{t('invoice.issued')}</dt><dd className="text-secondary-900 dark:text-white">{f.dateTime(inv.issuedAt)}</dd></div>
          <div><dt className="text-secondary-500">{t('invoice.period')}</dt><dd className="text-secondary-900 dark:text-white">{f.period(inv.period)}</dd></div>
          <div><dt className="text-secondary-500">{t('invoice.method')}</dt><dd className="text-secondary-900 dark:text-white">{t(`methods.${inv.method}`)}</dd></div>
        </dl>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-secondary-200 text-left text-xs text-secondary-500 dark:border-secondary-700">
              <th className="py-2 font-medium">{t('invoice.description')}</th>
              <th className="py-2 text-right font-medium">{t('invoice.amount')}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-secondary-100 dark:border-secondary-800">
              <td className="py-2 pr-2 text-secondary-800 dark:text-secondary-200">{lineLabel}</td>
              <td className="py-2 text-right text-secondary-900 dark:text-white">{f.money(inv.gross)}</td>
            </tr>
          </tbody>
          <tfoot className="text-secondary-700 dark:text-secondary-300">
            {inv.discount > 0 && (
              <tr><td className="pt-2 text-right">{t('invoice.discount')}</td><td className="pt-2 text-right">-{f.money(inv.discount)}</td></tr>
            )}
            <tr><td className="pt-2 text-right">{t('invoice.subtotal')}</td><td className="pt-2 text-right">{f.money(inv.subtotal)}</td></tr>
            <tr><td className="pt-1 text-right">{t('invoice.iva')}</td><td className="pt-1 text-right">{f.money(inv.iva)}</td></tr>
            <tr className="font-semibold text-secondary-900 dark:text-white"><td className="pt-1 text-right">{t('invoice.total')}</td><td className="pt-1 text-right">{f.money(inv.total)}</td></tr>
          </tfoot>
        </table>
        <div>
          <div className="text-xs font-semibold text-secondary-700 dark:text-secondary-200">{t('invoice.cufe')}</div>
          <code className="mt-1 block break-all rounded bg-secondary-100 p-2 font-mono text-[11px] text-secondary-800 dark:bg-secondary-800 dark:text-secondary-100" data-testid="cufe">
            {cufe ?? t('invoice.cufeCalculating')}
          </code>
          <p className="mt-1 text-[11px] text-secondary-500">{t('invoice.cufeNote')}</p>
          <button type="button" onClick={() => setShowInput((x) => !x)} className="mt-1 text-xs font-medium text-primary-700 hover:underline dark:text-primary-300" aria-expanded={showInput}>
            {showInput ? t('invoice.hideInput') : t('invoice.showInput')}
          </button>
          {showInput && <code className="mt-1 block break-all rounded bg-secondary-100 p-2 font-mono text-[11px] text-secondary-700 dark:bg-secondary-800 dark:text-secondary-200">{input}</code>}
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-secondary-200 pt-3 dark:border-secondary-700">
          <Button size="sm" variant="ghost" onClick={onClose}>{t('common.close')}</Button>
          <Button size="sm" onClick={download} disabled={!cufe} isLoading={busy}>
            <ArrowDownTrayIcon className="mr-1 h-4 w-4" />
            {t('invoice.downloadPdf')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
