'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchTerm, statusFilter, orders]);

  const loadOrders = async () => {
    try {
      // Cargar pedidos desde la API
      const ordersData = await api.getOrders();
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { className: string; text: string }> = {
      pending: { className: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300', text: 'Pendiente' },
      in_progress: { className: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300', text: 'En Proceso' },
      shipped: { className: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300', text: 'Enviado' },
      completed: { className: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300', text: 'Completado' },
      cancelled: { className: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300', text: 'Cancelado' },
    };
    const badge = badges[status] || { className: 'bg-secondary-100', text: status };
    return <Badge variant="secondary" size="sm" className={badge.className}>{badge.text}</Badge>;
  };

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'in_progress', label: 'En Proceso' },
    { value: 'shipped', label: 'Enviado' },
    { value: 'completed', label: 'Completado' },
    { value: 'cancelled', label: 'Cancelado' },
  ];

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
              Mis Pedidos
            </h1>
            <p className="text-secondary-600 dark:text-secondary-400">
              Gestiona y rastrea todos tus pedidos
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/orders/new">Nuevo Pedido</Link>
          </Button>
        </div>

        {/* Filters */}
        <Card variant="bordered">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="w-full md:w-48">
                <div className="relative">
                  <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card variant="bordered">
              <CardContent className="p-12 text-center">
                <p className="text-secondary-600 dark:text-secondary-400">
                  No se encontraron pedidos
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id} variant="bordered" className="hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                              {order.name}
                            </h3>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">
                            {order.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-500">
                            <span className="font-mono">{order.id}</span>
                            <span>•</span>
                            <span>{order.date}</span>
                            <span>•</span>
                            <span>{order.items} artículos</span>
                            {order.tracking && (
                              <>
                                <span>•</span>
                                <span className="font-mono">{order.tracking}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right mr-4">
                        <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                          ${order.amount.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/orders/${order.id}`}>
                            <EyeIcon className="h-4 w-4 mr-2" />
                            Ver Detalle
                          </Link>
                        </Button>
                        {order.status === 'completed' && (
                          <Button variant="outline" size="sm">
                            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                            Factura
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary */}
        <Card variant="bordered">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {statusOptions.slice(1).map(option => {
                const count = orders.filter(o => o.status === option.value).length;
                return (
                  <div key={option.value} className="text-center">
                    <p className="text-2xl font-bold text-secondary-900 dark:text-white mb-1">
                      {count}
                    </p>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      {option.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
