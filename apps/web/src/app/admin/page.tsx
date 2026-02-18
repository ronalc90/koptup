'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardContent } from '@/components/ui/Card';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function AdminHomePage() {
  const t = useTranslations('adminHome');

  return (
    <AdminLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="bordered">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">{t('orders')}</h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">{t('ordersDesc')}</p>
            <Link href="/admin/orders" className="text-primary-600 hover:text-primary-500">{t('goToOrders')}</Link>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">{t('deliverables')}</h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">{t('deliverablesDesc')}</p>
            <Link href="/admin/deliverables" className="text-primary-600 hover:text-primary-500">{t('goToDeliverables')}</Link>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">{t('invoices')}</h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">{t('invoicesDesc')}</p>
            <Link href="/admin/invoices" className="text-primary-600 hover:text-primary-500">{t('goToInvoices')}</Link>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
