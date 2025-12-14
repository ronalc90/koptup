'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';
import { api } from '@/lib/api';

interface OrderDetail {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'shipped' | 'completed' | 'cancelled';
  date: string;
  amount: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  tracking?: string;
  carrier?: string;
  history?: Array<{ date: string; status: string; description: string }>;
}

export default function OrderDetailPage() {
  const router = useRouter();
  // next/navigation useParams is only in app router dynamic segments
  const params = useParams() as { id?: string };
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    const id = params?.id as string;
    if (!id) return;
    const fetchOrder = async () => {
      try {
        const data = await api.getOrderById(id);
        setOrder(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Error al cargar el pedido');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

  const cancelOrder = async () => {
    if (!order?.id) return;
    setError('');
    setActionMessage('');
    try {
      await api.cancelOrder(order.id);
      setActionMessage('Pedido cancelado exitosamente');
      setOrder({ ...order, status: 'cancelled' });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'No se pudo cancelar el pedido');
    }
  };

  if (loading) {
    return <div className="p-8 text-secondary-700 dark:text-secondary-300">Cargando pedido...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="mb-4 p-3 border border-red-300 bg-red-50 dark:bg-red-950 rounded">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
        <Link href="/dashboard/orders" className="text-primary-600 hover:text-primary-500">Volver al listado</Link>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Pedido: {order.name}</h1>
          <Link href="/dashboard/orders" className="text-primary-600 hover:text-primary-500">Volver al listado</Link>
        </div>

        <Card variant="elevated" className="shadow-xl">
          <CardContent className="p-6 space-y-4">
            {actionMessage && (
              <div className="p-3 border border-green-300 bg-green-50 dark:bg-green-950 rounded">
                <p className="text-sm text-green-700 dark:text-green-300">{actionMessage}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Estado</p>
                <p className="font-medium">{order.status}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Fecha</p>
                <p className="font-medium">{order.date}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Monto</p>
                <p className="font-medium">${order.amount?.toFixed?.(2) ?? order.amount}</p>
              </div>
              {order.tracking && (
                <div>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">Tracking</p>
                  <p className="font-medium">{order.tracking}</p>
                </div>
              )}
            </div>

            {order.description && (
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">Descripción</p>
                <p className="text-secondary-800 dark:text-secondary-200">{order.description}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">Ítems</p>
              <div className="space-y-2">
                {order.items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 border rounded-lg">
                    <span className="text-secondary-800 dark:text-secondary-200">{it.name} × {it.quantity}</span>
                    <span className="text-secondary-800 dark:text-secondary-200">${(it.price * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {order.history && order.history.length > 0 && (
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">Historial</p>
                <div className="space-y-2">
                  {order.history.map((h: any, idx: number) => {
                    const dateStr =
                      typeof h.date === 'string'
                        ? h.date.split('T')[0]
                        : (h.date && new Date(h.date).toISOString().split('T')[0]) || '';
                    return (
                      <div key={idx} className="flex items-center justify-between p-2 border rounded-lg">
                        <span className="text-secondary-800 dark:text-secondary-200">{h.description || h.status}</span>
                        <span className="text-secondary-500">{dateStr}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => router.push('/dashboard/billing')}>
                Ver facturación
              </Button>
              <Button
                variant="danger"
                onClick={cancelOrder}
                disabled={order.status === 'cancelled' || order.status === 'completed'}
              >
                Cancelar pedido
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
