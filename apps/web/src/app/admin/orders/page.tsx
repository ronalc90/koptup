'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [status, setStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.adminGetOrders(status === 'all' ? undefined : status);
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [status]);

  const updateStatus = async (id: string, next: string) => {
    await api.adminUpdateOrderStatus(id, next as any);
    await load();
  };

  const createInvoice = async (id: string) => {
    await api.adminCreateInvoiceFromOrder(id);
    await load();
  };
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <div className="flex gap-2">
            {['all', 'pending', 'in_progress', 'shipped', 'completed', 'cancelled'].map(s => (
              <Button key={s} size="sm" variant={status === s ? 'primary' : 'outline'} onClick={() => setStatus(s)}>
                {s}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <Card key={o.id} variant="bordered">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{o.name}</h3>
                      <p className="text-sm text-secondary-600">Usuario: {o.user?.name} · {o.user?.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{o.status}</Badge>
                      <p className="text-xl font-bold">${(o.amount || 0).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {o.status !== 'completed' && o.status !== 'cancelled' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(o.id, 'in_progress')}>En progreso</Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(o.id, 'shipped')}>Enviado</Button>
                        <Button size="sm" variant="primary" onClick={() => updateStatus(o.id, 'completed')}>Completar</Button>
                        <Button size="sm" variant="danger" onClick={() => updateStatus(o.id, 'cancelled')}>Cancelar</Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" onClick={() => createInvoice(o.id)}>Generar factura</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
