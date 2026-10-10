'use client';

import { useCallback, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { downloadInvoicePdf, type InvoicePdfData } from '@/lib/invoice-pdf';
import { describeError } from '@/lib/portal';

/**
 * Descarga el PDF de una factura (portal y panel): pide los datos al backend
 * (solo el cliente dueño o el equipo) y arma el PDF en el navegador.
 */
export function useInvoicePdf() {
  const t = useTranslations('invoicePdf');
  const tc = useTranslations('portalCommon');
  const locale = useLocale();
  const [downloading, setDownloading] = useState<string | null>(null);

  const download = useCallback(
    async (id: string) => {
      setDownloading(id);
      try {
        const data = (await api.downloadInvoice(id)) as InvoicePdfData;
        await downloadInvoicePdf(
          data,
          {
            title: t('title'),
            issuer: t('issuer'),
            client: t('client'),
            number: t('number'),
            issued: t('issued'),
            due: t('due'),
            paid: t('paid'),
            status: t('status'),
            statusValue: tc(`invoiceStatus.${data.status}`),
            project: t('project'),
            order: t('order'),
            description: t('description'),
            qty: t('qty'),
            unit: t('unit'),
            amount: t('amount'),
            subtotal: t('subtotal'),
            tax: t('tax'),
            total: t('total'),
            notes: t('notes'),
            terms: t('terms'),
            disclaimer: t('disclaimer'),
          },
          locale,
        );
        toast.success(t('downloaded'));
      } catch (err) {
        toast.error(
          describeError(err, locale, {
            network: tc('errors.network'),
            rateLimited: tc('errors.rateLimited'),
            server: tc('errors.server'),
            generic: t('error'),
          }),
        );
      } finally {
        setDownloading(null);
      }
    },
    [t, tc, locale],
  );

  return { download, downloading };
}
