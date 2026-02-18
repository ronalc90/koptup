'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

export default function AdminOrdersPage() {
  const t = useTranslations('adminOrders');
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
    if (!confirm(t('confirmApprove', { id: order.id, name: order.user?.name }))) {
      return;
    }

    try {
      setProcessingOrder(order.id);
      await api.post(`/api/admin/orders/${order.id}/approve`);
      await loadOrders();
      alert(t('approvedSuccess'));
    } catch (error) {
      console.error('Error approving order:', error);
      alert(t('approveError'));
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleReject = async () => {
    if (!orderToReject) return;

    try {
      setProcessingOrder(orderToReject.id);
      await api.post(`/api/admin/orders/${orderToReject.id}/reject`, {
        reason: rejectionReason || t('notSpecified'),
      });
      await loadOrders();
      setShowRejectModal(false);
      setRejectionReason('');
      setOrderToReject(null);
      alert(t('rejectedSuccess'));
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert(t('rejectError'));
    } finally {
      setProcessingOrder(null);
    }
  };

  const openRejectModal = (order: any) => {
    setOrderToReject(order);
    setShowRejectModal(true);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (!confirm(t('confirmStatusChange', { status: newStatus }))) {
      return;
    }

    try {
      setProcessingOrder(orderId);
      await api.patch(`/api/admin/orders/${orderId}/status`, { status: newStatus });
      await loadOrders();
      alert(t('statusUpdated'));
    } catch (error) {
      console.error('Error updating order status:', error);
      alert(t('statusUpdateError'));
    } finally {
      setProcessingOrder(null);
    }
  };

  const getApprovalBadge = (status: string) => {
    const badges: Record<string, { variant: any; text: string; icon: any }> = {
      pending: { variant: 'secondary', text: t('approvalBadge.pending'), icon: ClockIcon },
      approved: { variant: 'primary', text: t('approvalBadge.approved'), icon: CheckCircleIcon },
      rejected: { variant: 'danger', text: t('approvalBadge.rejected'), icon: XCircleIcon },
    };
    // Si no tiene approvalStatus, asumimos que es pending
    const actualStatus = status || 'pending';
    const badge = badges[actualStatus] || badges.pending;
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
            {t('title')}
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            {t('subtitle')}
          </p>
        </div>

        {/* Filters */}
        <Card variant="bordered">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Approval Status Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  {t('approvalStatus')}
                </label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={approvalFilter === 'all' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setApprovalFilter('all')}
                  >
                    {t('all')}
                  </Button>
                  <Button
                    variant={approvalFilter === 'pending' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setApprovalFilter('pending')}
                  >
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {t('pending')}
                  </Button>
                  <Button
                    variant={approvalFilter === 'approved' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setApprovalFilter('approved')}
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    {t('approved')}
                  </Button>
                  <Button
                    variant={approvalFilter === 'rejected' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setApprovalFilter('rejected')}
                  >
                    <XCircleIcon className="h-4 w-4 mr-1" />
                    {t('rejected')}
                  </Button>
                </div>
              </div>

              {/* Order Status Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  {t('orderStatus')}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {['all', 'pending', 'in_progress', 'shipped', 'completed', 'cancelled'].map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={statusFilter === s ? 'primary' : 'outline'}
                      onClick={() => setStatusFilter(s)}
                    >
                      {s === 'all' ? t('all') : s}
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
            <CardTitle>{t('allOrders')} ({orders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-secondary-600 dark:text-secondary-400">
                  {t('noOrders')}
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
                          {t('client')}: {order.user?.name}
                        </p>
                        <p className="text-xs text-secondary-600 dark:text-secondary-400">
                          {order.user?.email}
                        </p>
                      </div>
                      <div className="text-right text-xs text-secondary-500">
                        <p>{t('date')}: {formatDate(order.date)}</p>
                        <p>ID: {order.id}</p>
                      </div>
                    </div>

                    {/* Items */}
                    {order.items && order.items.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                          {t('orderItems')}:
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
                                x{item.quantity} · ${item.price} {t('perUnit')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comentarios del cliente */}
                    {order.comments && order.comments.length > 0 && (
                      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                          <ChatBubbleLeftRightIcon className="h-4 w-4" />
                          {t('clientDescription')}:
                        </p>
                        {order.comments.map((comment: any, idx: number) => (
                          <div key={idx} className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-wrap">
                            {comment.text}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Archivos adjuntos */}
                    {order.attachments && order.attachments.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2 flex items-center gap-2">
                          <ClockIcon className="h-4 w-4" />
                          {t('attachments')} ({order.attachments.length}):
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {order.attachments.map((file: any, idx: number) => (
                            <a
                              key={idx}
                              href={file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 bg-white dark:bg-secondary-950 rounded border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-900 transition-colors"
                            >
                              <CurrencyDollarIcon className="h-4 w-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                                  {file.fileName}
                                </p>
                                <p className="text-xs text-secondary-500">
                                  {(file.fileSize / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {order.approvalStatus === 'rejected' && order.rejectionReason && (
                      <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                        <p className="text-sm font-medium text-red-900 dark:text-red-400 mb-1">
                          {t('rejectionReason')}:
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          {order.rejectionReason}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3">
                      {/* Approval Actions */}
                      <div>
                        <p className="text-xs font-medium text-secondary-500 mb-2">{t('orderApproval')}:</p>
                        <div className="flex gap-2 flex-wrap">
                          {(!order.approvalStatus || order.approvalStatus !== 'approved') && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleApprove(order)}
                              disabled={processingOrder === order.id}
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-2" />
                              {order.approvalStatus === 'rejected' ? t('reApprove') : t('approveOrder')}
                            </Button>
                          )}
                          {(!order.approvalStatus || order.approvalStatus !== 'rejected') && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => openRejectModal(order)}
                              disabled={processingOrder === order.id}
                            >
                              <XCircleIcon className="h-4 w-4 mr-2" />
                              {t('rejectOrder')}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Status Change Actions */}
                      {(order.approvalStatus === 'approved' || !order.approvalStatus) && order.status !== 'completed' && order.status !== 'cancelled' && (
                        <div>
                          <p className="text-xs font-medium text-secondary-500 mb-2">{t('changeOrderStatus')}:</p>
                          <div className="flex gap-2 flex-wrap">
                            {order.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(order.id, 'in_progress')}
                                disabled={processingOrder === order.id}
                              >
                                {t('startProgress')}
                              </Button>
                            )}
                            {order.status === 'in_progress' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(order.id, 'shipped')}
                                disabled={processingOrder === order.id}
                              >
                                {t('markShipped')}
                              </Button>
                            )}
                            {(order.status === 'in_progress' || order.status === 'shipped') && (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleStatusChange(order.id, 'completed')}
                                disabled={processingOrder === order.id}
                              >
                                {t('completeOrder')}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Conversation Link */}
                      <div>
                        {order.conversationId && (
                          <Link href={`/admin/conversations/${order.conversationId}`}>
                            <Button size="sm" variant="outline">
                              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                              {t('viewConversation')}
                            </Button>
                          </Link>
                        )}
                      </div>
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
                {t('rejectOrder')}
              </h3>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">
                {t('rejectModalDesc')} <strong>{orderToReject?.id}</strong>?
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t('rejectPlaceholder')}
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
                  {t('cancel')}
                </Button>
                <Button variant="danger" onClick={handleReject} disabled={!rejectionReason.trim()}>
                  {t('rejectOrder')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
