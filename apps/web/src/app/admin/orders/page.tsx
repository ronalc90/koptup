'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/admin/demos/shared';
import { api } from '@/lib/api';
import { apiRequest } from '@/lib/demo-system';
import {
  ORDER_STATUSES,
  describeError,
  formatDay,
  formatFileSize,
  formatMoney,
  todayInColombia,
  type ApprovalStatus,
  type OrderStatus,
} from '@/lib/portal';
import {
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  BanknotesIcon,
  MagnifyingGlassIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';

interface AdminOrder {
  id: string;
  name: string;
  description: string;
  status: OrderStatus;
  approvalStatus: ApprovalStatus;
  date: string | null;
  amount: number;
  currency: string;
  items: Array<{ name: string; description?: string; quantity: number; price: number }>;
  attachments: Array<{ _id: string; fileName: string; fileSize: number }>;
  comments: Array<{ text: string }>;
  user: { _id?: string; name?: string; email?: string; phone?: string | null };
  project: { _id: string; name: string } | null;
  conversationId: string | null;
  invoice: { id: string; invoiceNumber: string; status: string } | null;
  rejectionReason?: string;
}

type PendingAction =
  | { kind: 'approve'; order: AdminOrder }
  | { kind: 'status'; order: AdminOrder; status: OrderStatus }
  | { kind: 'reject'; order: AdminOrder }
  | { kind: 'invoice'; order: AdminOrder };

const APPROVAL_FILTERS = ['all', 'pending', 'approved', 'rejected'] as const;

/** Siguientes estados que el equipo puede dar a un pedido aprobado. */
function nextStatuses(status: OrderStatus): OrderStatus[] {
  if (status === 'pending') return ['in_progress'];
  if (status === 'in_progress') return ['shipped', 'completed'];
  if (status === 'shipped') return ['completed'];
  return [];
}

const STATUS_VARIANT: Record<OrderStatus, 'secondary' | 'primary' | 'success' | 'danger' | 'info'> = {
  pending: 'secondary',
  in_progress: 'info',
  shipped: 'primary',
  completed: 'success',
  cancelled: 'danger',
};

export default function AdminOrdersPage() {
  const t = useTranslations('adminOrders');
  const tc = useTranslations('portalCommon');
  const locale = useLocale();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [approvalFilter, setApprovalFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [action, setAction] = useState<PendingAction | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [invoiceDue, setInvoiceDue] = useState(todayInColombia(15));
  const [invoiceTax, setInvoiceTax] = useState('19');
  // Error de descarga de un adjunto, por pedido (se muestra bajo la lista).
  const [attachmentErrors, setAttachmentErrors] = useState<Record<string, string>>({});
  const [downloadingAttachment, setDownloadingAttachment] = useState<string | null>(null);

  const errorTexts = { network: tc('errors.network'), rateLimited: tc('errors.rateLimited'), server: tc('errors.server'), generic: tc('errors.generic') };

  /** Descarga un adjunto con la sesión (GET /api/orders/:id/attachments/:attachmentId). */
  const downloadAttachment = async (order: AdminOrder, file: AdminOrder['attachments'][number]) => {
    const key = `${order.id}:${file._id}`;
    setDownloadingAttachment(key);
    setAttachmentErrors((prev) => ({ ...prev, [order.id]: '' }));
    try {
      const blob = await api.downloadOrderAttachment(order.id, String(file._id));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName || 'adjunto';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error: any) {
      const status = error?.response?.status ?? error?.status;
      setAttachmentErrors((prev) => ({
        ...prev,
        [order.id]: status === 410 ? t('attachmentGone', { name: file.fileName }) : t('attachmentError', { name: file.fileName }),
      }));
    } finally {
      setDownloadingAttachment(null);
    }
  };

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams({ status: statusFilter, approval: approvalFilter });
      if (query) params.set('q', query);
      const data = await apiRequest<AdminOrder[]>(`/admin/orders?${params.toString()}`);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setOrders([]);
      setLoadError(describeError(err, locale, errorTexts));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, approvalFilter, query, locale]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const runAction = async () => {
    if (!action) return;
    const { order } = action;
    try {
      if (action.kind === 'approve') {
        await apiRequest(`/admin/orders/${encodeURIComponent(order.id)}/approve`, { method: 'POST' });
        toast.success(t('approvedSuccess'));
      } else if (action.kind === 'status') {
        await apiRequest(`/admin/orders/${encodeURIComponent(order.id)}/status`, { method: 'PATCH', body: { status: action.status } });
        toast.success(t('statusUpdated'));
      } else if (action.kind === 'reject') {
        await apiRequest(`/admin/orders/${encodeURIComponent(order.id)}/reject`, { method: 'POST', body: { reason: rejectionReason.trim() } });
        toast.success(t('rejectedSuccess'));
      } else {
        const tax = Math.min(100, Math.max(0, Number(invoiceTax) || 0)) / 100;
        const inv = await apiRequest<{ invoiceNumber: string }>(`/admin/orders/${encodeURIComponent(order.id)}/invoice`, {
          method: 'POST',
          body: { dueDate: invoiceDue, taxRate: tax },
        });
        toast.success(t('invoiceIssued', { number: inv.invoiceNumber }));
      }
      setAction(null);
      setRejectionReason('');
      await loadOrders();
    } catch (err) {
      toast.error(describeError(err, locale, errorTexts));
    }
  };

  const approvalBadge = (status: ApprovalStatus) => {
    const map: Record<ApprovalStatus, { variant: 'secondary' | 'success' | 'danger'; icon: typeof ClockIcon }> = {
      pending: { variant: 'secondary', icon: ClockIcon },
      approved: { variant: 'success', icon: CheckCircleIcon },
      rejected: { variant: 'danger', icon: XCircleIcon },
    };
    const b = map[status] ?? map.pending;
    const Icon = b.icon;
    return (
      <Badge variant={b.variant} size="sm" className="flex items-center gap-1" data-approval={status}>
        <Icon className="h-3 w-3" />
        {tc(`approvalStatus.${status}`)}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">{t('title')}</h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">{t('subtitle')}</p>
        </div>

        {/* Filtros */}
        <Card variant="bordered">
          <CardContent className="p-4">
            <div className="space-y-4">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setQuery(search.trim());
                }}
              >
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    aria-label={t('searchPlaceholder')}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white"
                  />
                </div>
                <Button type="submit" size="sm">
                  {tc('search')}
                </Button>
              </form>
              <div>
                <p className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">{t('approvalStatus')}</p>
                <div className="flex gap-2 flex-wrap">
                  {APPROVAL_FILTERS.map((f) => (
                    <Button key={f} variant={approvalFilter === f ? 'primary' : 'outline'} size="sm" onClick={() => setApprovalFilter(f)} aria-pressed={approvalFilter === f}>
                      {f === 'all' ? t('all') : tc(`approvalStatus.${f}`)}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <p className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">{t('orderStatus')}</p>
                <div className="flex gap-2 flex-wrap">
                  {(['all', ...ORDER_STATUSES] as const).map((s) => (
                    <Button key={s} size="sm" variant={statusFilter === s ? 'primary' : 'outline'} onClick={() => setStatusFilter(s)} aria-pressed={statusFilter === s}>
                      {s === 'all' ? t('all') : tc(`orderStatus.${s}`)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardHeader>
            <CardTitle>
              {t('allOrders')} ({orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : loadError ? (
              <div className="text-center py-12" role="alert">
                <p className="text-red-600 dark:text-red-400 mb-4">{loadError}</p>
                <Button variant="outline" onClick={() => void loadOrders()}>
                  {tc('retry')}
                </Button>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-secondary-600 dark:text-secondary-400">{query || statusFilter !== 'all' || approvalFilter !== 'all' ? t('noResults') : t('noOrders')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 sm:p-6 rounded-lg border border-secondary-200 dark:border-secondary-700" data-order={order.id}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-secondary-900 dark:text-white break-words">{order.name}</h3>
                          {approvalBadge(order.approvalStatus)}
                          <Badge variant={STATUS_VARIANT[order.status] ?? 'secondary'} size="sm" data-status={order.status}>
                            {tc(`orderStatus.${order.status}`)}
                          </Badge>
                        </div>
                        {order.description && <p className="text-sm text-secondary-600 dark:text-secondary-400">{order.description}</p>}
                      </div>
                      <div className="sm:text-right">
                        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{formatMoney(order.amount, order.currency, locale)}</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 p-4 bg-secondary-100 dark:bg-secondary-800 rounded-lg">
                      <UserIcon className="h-8 w-8 text-secondary-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-secondary-900 dark:text-white">
                          {t('client')}: {order.user?.name}
                        </p>
                        <p className="text-xs text-secondary-600 dark:text-secondary-400 break-all">{order.user?.email}</p>
                      </div>
                      <div className="sm:text-right text-xs text-secondary-500">
                        <p>
                          {t('date')}: {formatDay(order.date, locale)}
                        </p>
                        <p>ID: {order.id}</p>
                      </div>
                    </div>

                    {order.items?.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">{t('orderItems')}:</p>
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm p-2 bg-white dark:bg-secondary-950 rounded">
                              <span className="text-secondary-900 dark:text-white">
                                {item.name} {item.description && `(${item.description})`}
                              </span>
                              <span className="text-secondary-600 dark:text-secondary-400">
                                x{item.quantity} · {formatMoney(item.price, order.currency, locale)} {t('perUnit')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {order.comments?.length > 0 && (
                      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                          <ChatBubbleLeftRightIcon className="h-4 w-4" />
                          {t('clientDescription')}:
                        </p>
                        {order.comments.map((comment, idx) => (
                          <div key={idx} className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-wrap">
                            {comment.text}
                          </div>
                        ))}
                      </div>
                    )}

                    {order.attachments?.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2 flex items-center gap-2">
                          <PaperClipIcon className="h-4 w-4" />
                          {t('attachments')} ({order.attachments.length}):
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {order.attachments.map((file, idx) => (
                            <button
                              key={file._id ?? idx}
                              type="button"
                              onClick={() => downloadAttachment(order, file)}
                              disabled={downloadingAttachment === `${order.id}:${file._id}`}
                              aria-label={t('downloadAttachment', { name: file.fileName })}
                              title={t('downloadAttachment', { name: file.fileName })}
                              className="flex items-center gap-2 p-2 text-left bg-white dark:bg-secondary-950 rounded border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-900 transition-colors disabled:opacity-60 disabled:cursor-wait"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4 text-primary-600 dark:text-primary-400 flex-shrink-0" aria-hidden="true" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">{file.fileName}</p>
                                <p className="text-xs text-secondary-500">{formatFileSize(file.fileSize)}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                        {attachmentErrors[order.id] && (
                          <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">
                            {attachmentErrors[order.id]}
                          </p>
                        )}
                      </div>
                    )}

                    {order.approvalStatus === 'rejected' && order.rejectionReason && (
                      <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                        <p className="text-sm font-medium text-red-900 dark:text-red-400 mb-1">{t('rejectionReason')}:</p>
                        <p className="text-sm text-red-700 dark:text-red-300">{order.rejectionReason}</p>
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="text-xs font-medium text-secondary-500 mb-2">{t('orderApproval')}:</p>
                        <div className="flex gap-2 flex-wrap">
                          {order.approvalStatus !== 'approved' && (
                            <Button size="sm" variant="primary" onClick={() => setAction({ kind: 'approve', order })}>
                              <CheckCircleIcon className="h-4 w-4 mr-2" />
                              {order.approvalStatus === 'rejected' ? t('reApprove') : t('approveOrder')}
                            </Button>
                          )}
                          {order.approvalStatus !== 'rejected' && (
                            <Button size="sm" variant="danger" onClick={() => setAction({ kind: 'reject', order })}>
                              <XCircleIcon className="h-4 w-4 mr-2" />
                              {t('rejectOrder')}
                            </Button>
                          )}
                        </div>
                      </div>

                      {order.approvalStatus === 'approved' && nextStatuses(order.status).length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-secondary-500 mb-2">{t('changeOrderStatus')}:</p>
                          <div className="flex gap-2 flex-wrap">
                            {nextStatuses(order.status).map((s) => (
                              <Button key={s} size="sm" variant={s === 'completed' ? 'primary' : 'outline'} onClick={() => setAction({ kind: 'status', order, status: s })}>
                                {t(`moveTo.${s}`)}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        {order.conversationId && (
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/conversations/${order.conversationId}`}>
                              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                              {t('viewConversation')}
                            </Link>
                          </Button>
                        )}
                        {order.invoice ? (
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/invoices?q=${encodeURIComponent(order.invoice.invoiceNumber)}`}>
                              <BanknotesIcon className="h-4 w-4 mr-2" />
                              {t('viewInvoice', { number: order.invoice.invoiceNumber })}
                            </Link>
                          </Button>
                        ) : (
                          order.approvalStatus === 'approved' && (
                            <Button size="sm" variant="outline" onClick={() => setAction({ kind: 'invoice', order })}>
                              <BanknotesIcon className="h-4 w-4 mr-2" />
                              {t('issueInvoice')}
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {action?.kind === 'approve' && (
          <ConfirmDialog
            title={t('approveOrder')}
            message={t('confirmApprove', { id: action.order.id, name: action.order.user?.name ?? '' })}
            confirmLabel={t('approveOrder')}
            cancelLabel={t('cancel')}
            onConfirm={runAction}
            onClose={() => setAction(null)}
          />
        )}
        {action?.kind === 'status' && (
          <ConfirmDialog
            title={t('changeOrderStatus')}
            message={t('confirmStatusChange', { status: tc(`orderStatus.${action.status}`) })}
            confirmLabel={t(`moveTo.${action.status}`)}
            cancelLabel={t('cancel')}
            onConfirm={runAction}
            onClose={() => setAction(null)}
          />
        )}
        {action?.kind === 'reject' && (
          <ConfirmDialog
            title={t('rejectOrder')}
            message={
              <>
                {t('rejectModalDesc')} <strong>{action.order.id}</strong>?
              </>
            }
            confirmLabel={t('rejectOrder')}
            cancelLabel={t('cancel')}
            danger
            onConfirm={async () => {
              if (rejectionReason.trim().length < 3) {
                toast.error(t('rejectReasonRequired'));
                return;
              }
              await runAction();
            }}
            onClose={() => {
              setAction(null);
              setRejectionReason('');
            }}
          >
            <label htmlFor="reject-reason" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              {t('rejectionReason')}
            </label>
            <textarea
              id="reject-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t('rejectPlaceholder')}
              className="w-full px-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white"
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-secondary-500 mt-1">{t('rejectNotice')}</p>
          </ConfirmDialog>
        )}
        {action?.kind === 'invoice' && (
          <Modal title={t('issueInvoice')} onClose={() => setAction(null)}>
            <p className="text-sm text-secondary-700 dark:text-secondary-300 mb-4">
              {t('issueInvoiceHelp', { id: action.order.id, name: action.order.user?.name ?? '' })}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="inv-due" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  {t('invoiceDue')}
                </label>
                <input
                  id="inv-due"
                  type="date"
                  value={invoiceDue}
                  min={todayInColombia()}
                  onChange={(e) => setInvoiceDue(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="inv-tax" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  {t('invoiceTax')}
                </label>
                <input
                  id="inv-tax"
                  type="number"
                  min={0}
                  max={100}
                  value={invoiceTax}
                  onChange={(e) => setInvoiceTax(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white"
                />
              </div>
            </div>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-4">
              {t('invoiceSubtotal', { amount: formatMoney(action.order.amount, action.order.currency, locale) })}
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setAction(null)}>
                {t('cancel')}
              </Button>
              <Button onClick={() => void runAction()}>{t('issueInvoice')}</Button>
            </div>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
}
