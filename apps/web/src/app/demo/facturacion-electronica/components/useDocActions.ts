'use client';

// Descargas reales del documento: PDF (con QR) y XML de muestra, generados en el navegador.

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { RESOLUTION, type BillingDoc } from './data';
import { buildXml, downloadBlob, downloadText, formatDate, qrText } from './docs';
import { formatNit, TAX_CATEGORIES, type TaxCategory } from './fiscal';
import { makeDocPdf } from './pdf';
import type { BillingStore } from './useBillingStore';
import { useMonths } from './ui';

export function useDocActions(store: BillingStore) {
  const t = useTranslations('demoBilling');
  const months = useMonths();
  const { state, markProgress } = store;

  const idLabel = useCallback(
    (doc: BillingDoc) =>
      doc.client.idType === 'NIT'
        ? `NIT ${formatNit(doc.client.idNumber, doc.client.dv)}`
        : doc.client.idType === 'CC'
          ? `${t('form.idTypes.CC')} ${doc.client.idNumber}`
          : doc.client.idNumber,
    [t],
  );

  const downloadPdf = useCallback(
    async (doc: BillingDoc) => {
      if (!doc.cufe) {
        toast.error(t('documents.cufePending'));
        return;
      }
      try {
        const ref = doc.refId ? state.docs.find((d) => d.id === doc.refId) : undefined;
        const fmt = (iso: string) => formatDate(iso, months);
        const taxLabel = Object.fromEntries(
          TAX_CATEGORIES.map((k) => [k, t('summary.base', { tax: t(`taxOptions.${k}`) })]),
        ) as Record<TaxCategory, string>;
        const blob = await makeDocPdf(doc, state.issuer, qrText(doc, state.issuer), {
          title: t(`docTypes.${doc.type}`).toUpperCase(),
          number: t('pdf.number'),
          issued: t('pdf.issued'),
          due: t('pdf.due'),
          payment: t('pdf.payment'),
          paymentValue: `${t(`form.paymentForms.${doc.paymentForm}`)} · ${t(`form.paymentMethods.${doc.paymentMethod}`)}`,
          issuerExtra: t('preview.issuerExtra'),
          buyer: t('preview.buyer'),
          idLabel: idLabel(doc),
          sample: t('pdf.sample'),
          watermark: t('pdf.watermark'),
          reference: ref ? t('pdf.reference', { id: ref.id, date: fmt(ref.issueDate), cufe: ref.cufe.slice(0, 24) + '…' }) : undefined,
          concept: doc.concept
            ? t('pdf.concept', { concept: t(`${doc.type === 'notaCredito' ? 'creditConcepts' : 'debitConcepts'}.${doc.concept}`) })
            : undefined,
          note: doc.note ? t('pdf.note', { note: doc.note }) : undefined,
          cols: [t('pdf.cols.n'), t('pdf.cols.desc'), t('pdf.cols.qty'), t('pdf.cols.unit'), t('pdf.cols.tax'), t('pdf.cols.base')],
          taxLabel,
          subtotal: t('summary.subtotal'),
          ivaTotal: t('summary.ivaTotal'),
          total: t('summary.total'),
          retTitle: t('pdf.retTitle'),
          retFuente: t('summary.retFuente'),
          retIva: t('summary.retIva'),
          retIca: t('summary.retIca'),
          netEstimate: t('summary.net'),
          retNote: t('summary.retNote'),
          resolution:
            doc.type === 'factura'
              ? t('pdf.resolution', {
                  number: RESOLUTION.number,
                  date: fmt(RESOLUTION.date),
                  prefix: doc.prefix,
                  from: RESOLUTION.from,
                  to: RESOLUTION.to,
                  validTo: fmt(RESOLUTION.validTo),
                })
              : undefined,
          cufeLabel: doc.type === 'factura' ? t('success.cufeLabel') : t('success.cudeLabel'),
          qrCaption: t('pdf.qrCaption'),
          footer: t('pdf.footer'),
          date: fmt,
        });
        downloadBlob(`${doc.id}.pdf`, blob);
        markProgress('download');
        toast.success(t('documents.downloaded', { file: `${doc.id}.pdf` }));
      } catch {
        toast.error(t('documents.downloadError'));
      }
    },
    [idLabel, markProgress, months, state.docs, state.issuer, t],
  );

  const downloadXml = useCallback(
    (doc: BillingDoc) => {
      if (!doc.cufe) {
        toast.error(t('documents.cufePending'));
        return;
      }
      const ref = doc.refId ? state.docs.find((d) => d.id === doc.refId) : undefined;
      downloadText(`${doc.id}.xml`, buildXml(doc, state.issuer, ref), 'application/xml');
      markProgress('download');
      toast.success(t('documents.downloaded', { file: `${doc.id}.xml` }));
    },
    [markProgress, state.docs, state.issuer, t],
  );

  return { downloadPdf, downloadXml, idLabel };
}
