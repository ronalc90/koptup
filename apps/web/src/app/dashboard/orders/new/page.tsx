'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';

export default function NewOrderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<Array<{ description: string; quantity: number; unitPrice: number }>>([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);

  const handleItemChange = (index: number, field: 'description' | 'quantity' | 'unitPrice', value: string | number) => {
    const next = [...items];
    // @ts-expect-error narrow
    next[index][field] = field === 'description' ? String(value) : Number(value);
    setItems(next);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    const next = items.filter((_, i) => i !== index);
    setItems(next);
  };

  const totalAmount = items.reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('El nombre del pedido es requerido');
      return;
    }

    const payloadItems = items
      .filter((it) => it.description.trim() && it.quantity > 0 && it.unitPrice >= 0)
      .map((it) => ({ name: it.description.trim(), quantity: it.quantity, price: it.unitPrice }));

    if (payloadItems.length === 0) {
      setError('Debes agregar al menos un ítem válido');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await api.createOrder({
        name,
        description,
        items: payloadItems,
      });
      setSuccess('Pedido creado exitosamente');
      // Ir al detalle del pedido si tenemos id, si no al listado
      const id = data?.id;
      router.push(id ? `/dashboard/orders/${id}` : '/dashboard/orders');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Error al crear el pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Nuevo Pedido</h1>
          <Link href="/dashboard/orders" className="text-primary-600 hover:text-primary-500">Volver al listado</Link>
        </div>

        <Card variant="elevated" className="shadow-xl">
          <CardContent className="p-6">
            {error && (
              <div className="mb-4 p-3 border border-red-300 bg-red-50 dark:bg-red-950 rounded">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 border border-green-300 bg-green-50 dark:bg-green-950 rounded">
                <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">Nombre del pedido *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-3 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ej. Sitio web corporativo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">Descripción</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="block w-full px-3 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Detalles del pedido"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Ítems *</label>
                  <button type="button" onClick={addItem} className="text-primary-600 hover:text-primary-500">Añadir ítem</button>
                </div>

                <div className="space-y-4">
                  {items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      <div className="md:col-span-6">
                        <input
                          type="text"
                          value={it.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="block w-full px-3 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Descripción del ítem"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input
                          type="number"
                          min={1}
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          className="block w-full px-3 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Cantidad"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={it.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                          className="block w-full px-3 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Precio unitario (USD)"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="px-3 py-2 border rounded-lg text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800"
                          disabled={items.length === 1}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-700 dark:text-secondary-300">Total estimado: <strong>${totalAmount.toFixed(2)}</strong> USD</span>
                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? 'Creando...' : 'Crear pedido'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

