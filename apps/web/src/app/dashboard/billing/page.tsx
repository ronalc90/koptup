'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { InvoicePaymentMethod } from '@/types/api.types';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useTranslations } from 'next-intl';
import {
  CreditCardIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function BillingPage() {
  const t = useTranslations('billingPage');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Métodos de pago reales configurados por el equipo. Sin métodos, el portal
  // no ofrece "Cómo pagar" (el pago lo registra el equipo, nunca el cliente).
  const [paymentMethods, setPaymentMethods] = useState<InvoicePaymentMethod[]>([]);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
    api
      .getInvoicePaymentMethods()
      .then(setPaymentMethods)
      .catch(() => setPaymentMethods([]));
  }, []);

  const loadInvoices = async () => {
    try {
      // Try to fetch from API
      const data = await api.getInvoices();
      // La API devuelve `total` y `projectName`; la vista usa `amount` y `project`.
      setInvoices(
        (Array.isArray(data) ? data : []).map((inv: any) => ({
          ...inv,
          amount: Number(inv.amount ?? inv.total ?? 0),
          project: inv.project ?? inv.projectName,
        })),
      );
    } catch (error) {
      console.error('Failed to load invoices from API, using fallback data:', error);

      // Fallback to mock data if API fails
      setInvoices([
        {
          id: 'INV-2025-045',
          project: 'Plataforma E-commerce',
          amount: 5000.00,
          status: 'pending',
          issueDate: '2025-10-01',
          dueDate: '2025-11-15',
          items: [
            { description: 'Desarrollo backend', amount: 3000 },
            { description: 'Integración de pagos', amount: 2000 },
          ],
        },
        {
          id: 'INV-2025-042',
          project: 'Portal de Clientes',
          amount: 3500.00,
          status: 'paid',
          issueDate: '2025-09-15',
          dueDate: '2025-10-15',
          paidDate: '2025-10-10',
          items: [
            { description: 'Diseño UI/UX', amount: 1500 },
            { description: 'Desarrollo frontend', amount: 2000 },
          ],
        },
        {
          id: 'INV-2025-038',
          project: 'App Móvil iOS/Android',
          amount: 2500.00,
          status: 'overdue',
          issueDate: '2025-08-20',
          dueDate: '2025-09-20',
          items: [
            { description: 'Planeación y diseño', amount: 2500 },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (id: string) => {
    try {
      const data = await api.downloadInvoice(id);
      const url = (data?.downloadUrl || data?.url || '').toString();
      if (url) {
        window.open(url, '_blank');
      } else {
        console.warn('No se recibió URL de descarga');
      }
    } catch (error) {
      console.error('Error al descargar la factura', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { className: string; text: string; icon: any }> = {
      paid: {
        className: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300',
        text: t('paid'),
        icon: CheckCircleIcon,
      },
      pending: {
        className: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300',
        text: t('pending'),
        icon: ClockIcon,
      },
      overdue: {
        className: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300',
        text: t('overdue'),
        icon: ExclamationTriangleIcon,
      },
    };
    const badge = badges[status];
    const Icon = badge.icon;
    return (
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <Badge variant="secondary" size="sm" className={badge.className}>
          {badge.text}
        </Badge>
      </div>
    );
  };

  const totalPending = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">{t('title')}</h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            {t('subtitle')}
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="bordered">
            <CardContent className="p-6">
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">{t('pending')}</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                ${totalPending.toFixed(2)}
              </p>
              <p className="text-xs text-secondary-500">
                {invoices.filter(i => i.status === 'pending').length} {t('invoices')}
              </p>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardContent className="p-6">
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">{t('overdue')}</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                ${totalOverdue.toFixed(2)}
              </p>
              <p className="text-xs text-secondary-500">
                {invoices.filter(i => i.status === 'overdue').length} {t('invoices')}
              </p>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardContent className="p-6">
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">{t('paid')}</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                ${totalPaid.toFixed(2)}
              </p>
              <p className="text-xs text-secondary-500">
                {invoices.filter(i => i.status === 'paid').length} {t('invoices')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Invoices */}
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id} variant="bordered">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                        {invoice.invoiceNumber || invoice.id}
                      </h3>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <p className="text-secondary-600 dark:text-secondary-400">{invoice.project}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-secondary-900 dark:text-white">
                      ${invoice.amount.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-secondary-600 dark:text-secondary-400 mb-1">{t('issued')}</p>
                    <p className="font-semibold text-secondary-900 dark:text-white">{invoice.issueDate}</p>
                  </div>
                  <div>
                    <p className="text-secondary-600 dark:text-secondary-400 mb-1">{t('dueDate')}</p>
                    <p className="font-semibold text-secondary-900 dark:text-white">{invoice.dueDate}</p>
                  </div>
                  {invoice.paidDate && (
                    <div>
                      <p className="text-secondary-600 dark:text-secondary-400 mb-1">{t('paidDate')}</p>
                      <p className="font-semibold text-secondary-900 dark:text-white">{invoice.paidDate}</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-secondary-200 dark:border-secondary-700 pt-4 mb-4">
                  <h4 className="text-sm font-semibold text-secondary-900 dark:text-white mb-3">
                    {t('details')}
                  </h4>
                  <div className="space-y-2">
                    {invoice.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-secondary-600 dark:text-secondary-400">
                          {item.description || t('noDescription')}
                        </span>
                        <span className="font-semibold text-secondary-900 dark:text-white">
                          ${Number(item.amount ?? item.total ?? 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" size="sm" onClick={() => downloadInvoice(invoice.id)}>
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    {t('downloadPdf')}
                  </Button>
                  {invoice.status !== 'paid' && paymentMethods.length > 0 && (
                    <Button
                      size="sm"
                      aria-expanded={payingId === invoice.id}
                      aria-controls={`pay-${invoice.id}`}
                      onClick={() => setPayingId(payingId === invoice.id ? null : invoice.id)}
                    >
                      <CreditCardIcon className="h-4 w-4 mr-2" />
                      {payingId === invoice.id ? t('payHide') : t('payNow')}
                    </Button>
                  )}
                </div>

                {payingId === invoice.id && invoice.status !== 'paid' && paymentMethods.length > 0 && (
                  <div
                    id={`pay-${invoice.id}`}
                    className="mt-4 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-900 p-4 text-sm"
                  >
                    {paymentMethods.map((method) => (
                      <div key={method.tipo}>
                        <h4 className="font-semibold text-secondary-900 dark:text-white mb-2">{t('payTransferTitle')}</h4>
                        <p className="whitespace-pre-line text-secondary-700 dark:text-secondary-300">{method.instrucciones}</p>
                      </div>
                    ))}
                    <p className="mt-3 text-secondary-700 dark:text-secondary-300">
                      {t('payReference', { number: invoice.invoiceNumber || invoice.id })}
                    </p>
                    <p className="mt-1 text-secondary-500 dark:text-secondary-400">{t('payConfirmNote')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
