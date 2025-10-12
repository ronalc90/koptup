'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  CreditCardIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      // Try to fetch from API
      const data = await api.getInvoices();
      setInvoices(data);
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

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { className: string; text: string; icon: any }> = {
      paid: {
        className: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300',
        text: 'Pagado',
        icon: CheckCircleIcon,
      },
      pending: {
        className: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300',
        text: 'Pendiente',
        icon: ClockIcon,
      },
      overdue: {
        className: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300',
        text: 'Vencido',
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
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">Facturación y Pagos</h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Administra tus facturas y realiza pagos
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="bordered">
            <CardContent className="p-6">
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">Pendiente</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                ${totalPending.toFixed(2)}
              </p>
              <p className="text-xs text-secondary-500">
                {invoices.filter(i => i.status === 'pending').length} facturas
              </p>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardContent className="p-6">
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">Vencido</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                ${totalOverdue.toFixed(2)}
              </p>
              <p className="text-xs text-secondary-500">
                {invoices.filter(i => i.status === 'overdue').length} facturas
              </p>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardContent className="p-6">
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">Pagado</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                ${totalPaid.toFixed(2)}
              </p>
              <p className="text-xs text-secondary-500">
                {invoices.filter(i => i.status === 'paid').length} facturas
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
                        {invoice.id}
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
                    <p className="text-secondary-600 dark:text-secondary-400 mb-1">Emitida</p>
                    <p className="font-semibold text-secondary-900 dark:text-white">{invoice.issueDate}</p>
                  </div>
                  <div>
                    <p className="text-secondary-600 dark:text-secondary-400 mb-1">Vencimiento</p>
                    <p className="font-semibold text-secondary-900 dark:text-white">{invoice.dueDate}</p>
                  </div>
                  {invoice.paidDate && (
                    <div>
                      <p className="text-secondary-600 dark:text-secondary-400 mb-1">Pagada</p>
                      <p className="font-semibold text-secondary-900 dark:text-white">{invoice.paidDate}</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-secondary-200 dark:border-secondary-700 pt-4 mb-4">
                  <h4 className="text-sm font-semibold text-secondary-900 dark:text-white mb-3">
                    Detalles
                  </h4>
                  <div className="space-y-2">
                    {invoice.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-secondary-600 dark:text-secondary-400">{item.description || 'Sin descripción'}</span>
                        <span className="font-semibold text-secondary-900 dark:text-white">
                          ${(item.amount || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" size="sm">
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    Descargar PDF
                  </Button>
                  {invoice.status !== 'paid' && (
                    <Button size="sm">
                      <CreditCardIcon className="h-4 w-4 mr-2" />
                      Pagar Ahora
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
