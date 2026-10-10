'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import type { InvoicePaymentMethod } from '@/types/api.types';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { PortalEmpty, PortalError, PortalLoading } from '@/components/dashboard/PortalStates';
import { useErrorText } from '@/hooks/useErrorText';
import { useInvoicePdf } from '@/hooks/useInvoicePdf';
import { apiRequest } from '@/lib/demo-system';
import { INVOICE_STATUS_BADGE, formatDay, formatMoney, type InvoiceStatus, type InvoiceView } from '@/lib/portal';
import { CreditCardIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

type Filter = 'all' | 'unpaid' | 'paid' | 'cancelled';

/** Totales por moneda (sin mezclar COP y USD). */
function totalsByCurrency(invoices: InvoiceView[], locale: string): string {
  if (invoices.length === 0) return formatMoney(0, 'COP', locale);
  const totals = new Map<string, number>();
  for (const inv of invoices) totals.set(inv.currency, (totals.get(inv.currency) ?? 0) + inv.total);
  return Array.from(totals.entries())
    .map(([cur, amount]) => formatMoney(amount, cur, locale))
    .join(' · ');
}

function BillingContent() {
  const t = useTranslations('billingPage');
  const tc = useTranslations('portalCommon');
  const locale = useLocale();
  const errorText = useErrorText();
  const { download, downloading } = useInvoicePdf();
  const [invoices, setInvoices] = useState<InvoiceView[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  // Métodos de pago reales configurados por el equipo. Sin métodos, el portal
  // no ofrece "Cómo pagar" (el pago lo registra el equipo, nunca el cliente).
  const [paymentMethods, setPaymentMethods] = useState<InvoicePaymentMethod[]>([]);
  const [payingId, setPayingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setInvoices(null);
    setLoadError('');
    try {
      const data = await apiRequest<InvoiceView[]>('/invoices');
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      setLoadError(errorText(err));
    }
  }, [errorText]);

  useEffect(() => {
    void load();
    api
      .getInvoicePaymentMethods()
      .then(setPaymentMethods)
      .catch(() => setPaymentMethods([]));
  }, [load]);

  const byStatus = (statuses: InvoiceStatus[]) => (invoices ?? []).filter((i) => statuses.includes(i.status));
  const pending = byStatus(['pending']);
  const overdue = byStatus(['overdue']);
  const paid = byStatus(['paid']);

  const visible = useMemo(() => {
    const list = invoices ?? [];
    if (filter === 'unpaid') return list.filter((i) => i.status === 'pending' || i.status === 'overdue');
    if (filter === 'paid') return list.filter((i) => i.status === 'paid');
    if (filter === 'cancelled') return list.filter((i) => i.status === 'cancelled');
    return list;
  }, [invoices, filter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">{t('title')}</h1>
        <p className="text-secondary-600 dark:text-secondary-400">{t('subtitle')}</p>
      </div>

      {loadError ? (
        <PortalError message={loadError} onRetry={() => void load()} />
      ) : !invoices ? (
        <PortalLoading />
      ) : invoices.length === 0 ? (
        <PortalEmpty icon={CreditCardIcon} title={t('emptyTitle')} body={t('emptyBody')} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: tc('invoiceStatus.pending'), list: pending, color: 'text-yellow-600 dark:text-yellow-400' },
              { label: tc('invoiceStatus.overdue'), list: overdue, color: 'text-red-600 dark:text-red-400' },
              { label: tc('invoiceStatus.paid'), list: paid, color: 'text-green-600 dark:text-green-400' },
            ].map((card) => (
              <Card key={card.label} variant="bordered">
                <CardContent className="p-6">
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">{card.label}</p>
                  <p className={`text-2xl font-bold mb-2 break-words ${card.color}`}>{totalsByCurrency(card.list, locale)}</p>
                  <p className="text-xs text-secondary-500">{t('invoiceCount', { count: card.list.length })}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label={t('filterLabel')}>
            {(['all', 'unpaid', 'paid', 'cancelled'] as Filter[]).map((f) => (
              <Button key={f} size="sm" variant={filter === f ? 'primary' : 'outline'} aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {t(`filters.${f}`)}
              </Button>
            ))}
          </div>

          <div className="space-y-4" data-testid="invoices-list">
            {visible.length === 0 ? (
              <Card variant="bordered">
                <CardContent className="p-10 text-center text-secondary-600 dark:text-secondary-400">{t('noResults')}</CardContent>
              </Card>
            ) : (
              visible.map((invoice) => {
                const unpaid = invoice.status === 'pending' || invoice.status === 'overdue';
                return (
                  <Card key={invoice.id} variant="bordered" data-invoice={invoice.invoiceNumber}>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-1">
                            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white font-mono">{invoice.invoiceNumber}</h2>
                            <Badge variant="secondary" size="sm" className={INVOICE_STATUS_BADGE[invoice.status]}>
                              {tc(`invoiceStatus.${invoice.status}`)}
                            </Badge>
                          </div>
                          <p className="text-secondary-600 dark:text-secondary-400 text-sm">
                            {[invoice.projectName ? t('project', { name: invoice.projectName }) : null, invoice.orderId ? t('order', { id: invoice.orderId }) : null]
                              .filter(Boolean)
                              .join(' · ') || t('noReference')}
                          </p>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-white">{formatMoney(invoice.total, invoice.currency, locale)}</p>
                      </div>

                      <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <dt className="text-secondary-600 dark:text-secondary-400 mb-1">{t('issued')}</dt>
                          <dd className="font-semibold text-secondary-900 dark:text-white">{formatDay(invoice.issueDate, locale)}</dd>
                        </div>
                        <div>
                          <dt className="text-secondary-600 dark:text-secondary-400 mb-1">{t('dueDate')}</dt>
                          <dd className="font-semibold text-secondary-900 dark:text-white">{formatDay(invoice.dueDate, locale)}</dd>
                        </div>
                        {invoice.paidDate && (
                          <div>
                            <dt className="text-secondary-600 dark:text-secondary-400 mb-1">{t('paidDate')}</dt>
                            <dd className="font-semibold text-secondary-900 dark:text-white">{formatDay(invoice.paidDate, locale)}</dd>
                          </div>
                        )}
                      </dl>

                      <div className="border-t border-secondary-200 dark:border-secondary-700 pt-4 mb-4">
                        <h3 className="text-sm font-semibold text-secondary-900 dark:text-white mb-3">{t('details')}</h3>
                        <ul className="space-y-2">
                          {invoice.items.map((item, idx) => (
                            <li key={idx} className="flex items-center justify-between gap-3 text-sm">
                              <span className="text-secondary-600 dark:text-secondary-400 min-w-0 break-words">
                                {item.description || t('noDescription')}
                                {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                              </span>
                              <span className="font-semibold text-secondary-900 dark:text-white flex-shrink-0">{formatMoney(item.total, invoice.currency, locale)}</span>
                            </li>
                          ))}
                          {invoice.taxRate > 0 && (
                            <li className="flex items-center justify-between text-sm border-t border-secondary-100 dark:border-secondary-800 pt-2">
                              <span className="text-secondary-600 dark:text-secondary-400">{t('tax', { rate: Math.round(invoice.taxRate * 100) })}</span>
                              <span className="font-semibold text-secondary-900 dark:text-white">{formatMoney(invoice.taxAmount, invoice.currency, locale)}</span>
                            </li>
                          )}
                        </ul>
                        {invoice.notes && <p className="text-xs text-secondary-500 mt-3 whitespace-pre-wrap">{invoice.notes}</p>}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button variant="outline" size="sm" onClick={() => void download(invoice.id)} isLoading={downloading === invoice.id}>
                          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                          {t('downloadPdf')}
                        </Button>
                        {unpaid && paymentMethods.length > 0 && (
                          <Button size="sm" aria-expanded={payingId === invoice.id} aria-controls={`pay-${invoice.id}`} onClick={() => setPayingId(payingId === invoice.id ? null : invoice.id)}>
                            <CreditCardIcon className="h-4 w-4 mr-2" />
                            {payingId === invoice.id ? t('payHide') : t('payNow')}
                          </Button>
                        )}
                      </div>

                      {payingId === invoice.id && unpaid && paymentMethods.length > 0 && (
                        <div id={`pay-${invoice.id}`} className="mt-4 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-900 p-4 text-sm">
                          {paymentMethods.map((method) => (
                            <div key={method.tipo}>
                              <h3 className="font-semibold text-secondary-900 dark:text-white mb-2">{t('payTransferTitle')}</h3>
                              <p className="whitespace-pre-line text-secondary-700 dark:text-secondary-300">{method.instrucciones}</p>
                            </div>
                          ))}
                          <p className="mt-3 text-secondary-700 dark:text-secondary-300">{t('payReference', { number: invoice.invoiceNumber })}</p>
                          <p className="mt-1 text-secondary-500 dark:text-secondary-400">{t('payConfirmNote')}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Portal › Facturación: facturas reales del cliente. Si la API falla, error
 * con reintento (antes mostraba facturas de ejemplo como si fueran suyas).
 */
export default function BillingPage() {
  return (
    <DashboardLayout>
      <BillingContent />
    </DashboardLayout>
  );
}
