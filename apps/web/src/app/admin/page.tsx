'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardContent } from '@/components/ui/Card';
import Link from 'next/link';

export default function AdminHomePage() {
  return (
    <AdminLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="bordered">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">Pedidos</h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">Revisa y actualiza el estado de pedidos.</p>
            <Link href="/admin/orders" className="text-primary-600 hover:text-primary-500">Ir a pedidos</Link>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">Entregables</h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">Aprueba o rechaza entregables.</p>
            <Link href="/admin/deliverables" className="text-primary-600 hover:text-primary-500">Ir a entregables</Link>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">Facturas</h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">Consulta facturas y estados.</p>
            <Link href="/admin/invoices" className="text-primary-600 hover:text-primary-500">Ir a facturas</Link>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

