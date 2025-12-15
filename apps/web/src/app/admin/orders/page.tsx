'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [approvalFilter, setApprovalFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [orderToReject, setOrderToReject] = useState<any>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/admin/orders?status=${statusFilter}`);
      let filteredOrders = response.data?.data || [];

      // Filtrar por estado de aprobación
      if (approvalFilter !== 'all') {
        filteredOrders = filteredOrders.filter((o: any) => o.approvalStatus === approvalFilter);
      }

      setOrders(filteredOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, approvalFilter]);

  const handleApprove = async (order: any) => {
    if (!confirm(`¿Aprobar el pedido ${order.id} de ${order.user?.name}?`)) {
      return;
    }

    try {
      setProcessingOrder(order.id);
      await api.post(`/api/admin/orders/${order.id}/approve`);
      await loadOrders();
      alert('Pedido aprobado exitosamente');
    } catch (error) {
      console.error('Error approving order:', error);
      alert('Error al aprobar pedido');
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleReject = async () => {
    if (!orderToReject) return;

    try {
      setProcessingOrder(orderToReject.id);
      await api.post(`/api/admin/orders/${orderToReject.id}/reject`, {
        reason: rejectionReason || 'No especificado',
      });
      await loadOrders();
      setShowRejectModal(false);
      setRejectionReason('');
      setOrderToReject(null);
      alert('Pedido rechazado');
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Error al rechazar pedido');
    } finally {
      setProcessingOrder(null);
    }
  };

  const openRejectModal = (order: any) => {
    setOrderToReject(order);
    setShowRejectModal(true);
  };

  const getApprovalBadge = (status: string) => {
    const badges: Record<string, { variant: any; text: string; icon: any }> = {
      pending: { variant: 'secondary', text: 'Pendiente de Aprobación', icon: ClockIcon },
      approved: { variant: 'primary', text: 'Aprobado', icon: CheckCircleIcon },
      rejected: { variant: 'danger', text: 'Rechazado', icon: XCircleIcon },
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <Badge variant={badge.variant} size="sm" className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {badge.text}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: 'secondary',
      in_progress: 'primary',
      shipped: 'primary',
      completed: 'primary',
      cancelled: 'danger',
    };
    return <Badge variant={variants[status] || 'secondary'} size="sm">{status}</Badge>;
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
            Pedidos
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Gestiona los pedidos de los clientes y aprueba o rechaza solicitudes
          </p>
        </div>

        {/* Filters */}
        <Card variant="bordered">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Approval Status Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Estado de Aprobación
                </label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={approvalFilter === 'all' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setApprovalFilter('all')}
                  >
                    Todos
                  </Button>
                  <Button
                    variant={approvalFilter === 'pending' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setApprovalFilter('pending')}
                  >
                    <ClockIcon className="h-4 w-4 mr-1" />
                    Pendientes
                  </Button>
                  <Button
                    variant={approvalFilter === 'approved' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setApprovalFilter('approved')}
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Aprobados
                  </Button>
                  <Button
                    variant={approvalFilter === 'rejected' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setApprovalFilter('rejected')}
                  >
                    <XCircleIcon className="h-4 w-4 mr-1" />
                    Rechazados
                  </Button>
                </div>
              </div>

              {/* Order Status Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Estado del Pedido
                </label>
                <div className="flex gap-2 flex-wrap">
                  {['all', 'pending', 'in_progress', 'shipped', 'completed', 'cancelled'].map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={statusFilter === s ? 'primary' : 'outline'}
                      onClick={() => setStatusFilter(s)}
                    >
                      {s === 'all' ? 'Todos' : s}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Todos los pedidos ({orders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-secondary-600 dark:text-secondary-400">
                  No hay pedidos para mostrar
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-6 rounded-lg border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-900 transition-colors"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-secondary-900 dark:text-white">
                            {order.name}
                          </h3>
                          {getApprovalBadge(order.approvalStatus)}
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">
                          {order.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                          ${order.amount?.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-xs text-secondary-500">{order.currency || 'USD'}</p>
                      </div>
                    </div>

                    {/* Client Info */}
                    <div className="flex items-center gap-4 mb-4 p-4 bg-secondary-100 dark:bg-secondary-800 rounded-lg">
                      <UserIcon className="h-10 w-10 text-secondary-400" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-secondary-900 dark:text-white">
                          Cliente: {order.user?.name}
                        </p>
                        <p className="text-xs text-secondary-600 dark:text-secondary-400">
                          {order.user?.email}
                        </p>
                      </div>
                      <div className="text-right text-xs text-secondary-500">
                        <p>Fecha: {formatDate(order.date)}</p>
                        <p>ID: {order.id}</p>
                      </div>
                    </div>

                    {/* Items */}
                    {order.items && order.items.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                          Items del pedido:
                        </p>
                        <div className="space-y-2">
                          {order.items.map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-sm p-2 bg-white dark:bg-secondary-950 rounded"
                            >
                              <span className="text-secondary-900 dark:text-white">
                                {item.name} {item.description && `(${item.description})`}
                              </span>
                              <span className="text-secondary-600 dark:text-secondary-400">
                                x{item.quantity} · ${item.price} c/u
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {order.approvalStatus === 'rejected' && order.rejectionReason && (
                      <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                        <p className="text-sm font-medium text-red-900 dark:text-red-400 mb-1">
                          Motivo de rechazo:
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          {order.rejectionReason}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      {/* Approval Actions */}
                      {order.approvalStatus === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleApprove(order)}
                            disabled={processingOrder === order.id}
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                            Aprobar Pedido
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => openRejectModal(order)}
                            disabled={processingOrder === order.id}
                          >
                            <XCircleIcon className="h-4 w-4 mr-2" />
                            Rechazar Pedido
                          </Button>
                        </>
                      )}

                      {/* Conversation Link */}
                      {order.conversationId && (
                        <Link href={`/admin/conversations/${order.conversationId}`}>
                          <Button size="sm" variant="outline">
                            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                            Ver Conversación
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-secondary-900 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-4">
                Rechazar Pedido
              </h3>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">
                ¿Por qué deseas rechazar el pedido <strong>{orderToReject?.id}</strong>?
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Escribe el motivo del rechazo..."
                className="w-full px-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white mb-4"
                rows={4}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                    setOrderToReject(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button variant="danger" onClick={handleReject} disabled={!rejectionReason.trim()}>
                  Rechazar Pedido
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
