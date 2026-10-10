'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { PortalError, PortalLoading } from '@/components/dashboard/PortalStates';
import { useErrorText } from '@/hooks/useErrorText';
import { useInvoicePdf } from '@/hooks/useInvoicePdf';
import { api } from '@/lib/api';
import { apiRequest } from '@/lib/demo-system';
import {
  INVOICE_STATUS_BADGE,
  ORDER_STATUS_BADGE,
  formatDateTime,
  formatDay,
  formatFileSize,
  formatMoney,
  refreshPanelCounts,
  saveBlob,
  type ApprovalStatus,
  type InvoiceStatus,
  type OrderStatus,
} from '@/lib/portal';
import { ArrowDownTrayIcon, ArrowLeftIcon, ChatBubbleLeftRightIcon, PaperClipIcon } from '@heroicons/react/24/outline';

interface OrderDetail {
  id: string;
  name: string;
  description?: string;
  detail: string | null;
  status: OrderStatus;
  approvalStatus: ApprovalStatus;
  /** El cliente puede cancelarlo solo mientras está pendiente de revisión. */
  editable: boolean;
  date: string;
  amount: number;
  currency: string;
  rejectionReason: string | null;
  conversationId: string | null;
  invoice: { id: string; invoiceNumber: string; status: InvoiceStatus } | null;
  items: Array<{ name: string; description?: string; quantity: number; price: number }>;
  attachments: Array<{ id: string; fileName: string; fileSize: number; fileType: string }>;
  tracking?: string;
  carrier?: string;
  history?: Array<{ date: string; status: OrderStatus; description: string }>;
}

function OrderDetailContent() {
  const params = useParams() as { id?: string };
  const orderId = String(params?.id ?? '');
  const t = useTranslations('orderDetailPage');
  const tc = useTranslations('portalCommon');
  const locale = useLocale();
  const errorText = useErrorText();
  const { download: downloadInvoice, downloading } = useInvoicePdf();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loadError, setLoadError] = useState<{ status: number; message: string } | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setOrder(await apiRequest<OrderDetail>(`/orders/${encodeURIComponent(orderId)}`));
    } catch (err) {
      setOrder(null);
      setLoadError({ status: (err as { status?: number }).status ?? 0, message: errorText(err) });
    }
  }, [orderId, errorText]);

  useEffect(() => {
    if (orderId) void load();
  }, [orderId, load]);

  const cancelOrder = async () => {
    try {
      await apiRequest(`/orders/${encodeURIComponent(orderId)}/cancel`, { method: 'POST' });
      toast.success(t('cancelled'));
      setConfirmCancel(false);
      refreshPanelCounts();
      await load();
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const downloadAttachment = async (attachmentId: string, fileName: string) => {
    setDownloadingFile(attachmentId);
    try {
      const blob = await api.downloadOrderAttachment(orderId, attachmentId);
      saveBlob(blob, fileName);
    } catch (err) {
      toast.error(errorText(err, t('downloadError')));
    } finally {
      setDownloadingFile(null);
    }
  };

  if (loadError) {
    return loadError.status === 404 || loadError.status === 403 ? (
      <div className="text-center py-12" role="alert">
        <p className="text-secondary-700 dark:text-secondary-300 mb-4">{t('notFound')}</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/orders">{t('back')}</Link>
        </Button>
      </div>
    ) : (
      <PortalError message={loadError.message} onRetry={() => void load()} />
    );
  }
  if (!order) return <PortalLoading />;

  const canCancel = order.editable && order.status === 'pending';

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Button variant="ghost" size="sm" className="mb-3" asChild>
          <Link href="/dashboard/orders">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            {t('back')}
          </Link>
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-white break-words">{order.name}</h1>
            <p className="text-sm text-secondary-500 font-mono mt-1">{order.id}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className={ORDER_STATUS_BADGE[order.status]} data-testid="order-status">
              {tc(`orderStatus.${order.status}`)}
            </Badge>
            {order.status !== 'cancelled' && (
              <Badge variant="secondary">{tc(`approvalStatus.${order.approvalStatus}`)}</Badge>
            )}
          </div>
        </div>
      </div>

      {order.approvalStatus === 'rejected' && order.rejectionReason && (
        <Card variant="bordered" className="border-red-200 dark:border-red-900">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">{t('rejectedTitle')}</p>
            <p className="text-sm text-secondary-700 dark:text-secondary-300 mt-1 whitespace-pre-wrap">{order.rejectionReason}</p>
          </CardContent>
        </Card>
      )}

      <Card variant="bordered">
        <CardContent className="p-6 space-y-6">
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm text-secondary-600 dark:text-secondary-400">{t('date')}</dt>
              <dd className="font-medium text-secondary-900 dark:text-white">{formatDay(order.date, locale)}</dd>
            </div>
            <div>
              <dt className="text-sm text-secondary-600 dark:text-secondary-400">{t('amount')}</dt>
              <dd className="font-medium text-secondary-900 dark:text-white">{formatMoney(order.amount, order.currency, locale)}</dd>
            </div>
            {order.tracking && (
              <div>
                <dt className="text-sm text-secondary-600 dark:text-secondary-400">{t('tracking')}</dt>
                <dd className="font-medium text-secondary-900 dark:text-white font-mono">
                  {order.tracking}
                  {order.carrier ? ` · ${order.carrier}` : ''}
                </dd>
              </div>
            )}
          </dl>

          {order.description && (
            <div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">{t('description')}</p>
              <p className="text-secondary-800 dark:text-secondary-200 whitespace-pre-wrap">{order.description}</p>
            </div>
          )}
          {order.detail && (
            <div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">{t('detail')}</p>
              <p className="text-secondary-800 dark:text-secondary-200 whitespace-pre-wrap">{order.detail}</p>
            </div>
          )}

          <div>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">{t('items')}</p>
            <ul className="divide-y divide-secondary-200 dark:divide-secondary-800 border border-secondary-200 dark:border-secondary-800 rounded-lg">
              {order.items.map((it, idx) => (
                <li key={idx} className="flex items-center justify-between gap-3 p-3">
                  <span className="text-secondary-800 dark:text-secondary-200 min-w-0 break-words">
                    {it.name} × {it.quantity}
                  </span>
                  <span className="text-secondary-800 dark:text-secondary-200 flex-shrink-0">{formatMoney(it.price * it.quantity, order.currency, locale)}</span>
                </li>
              ))}
            </ul>
          </div>

          {order.attachments.length > 0 && (
            <div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">{t('attachments')}</p>
              <ul className="space-y-2">
                {order.attachments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 p-3 border border-secondary-200 dark:border-secondary-800 rounded-lg">
                    <span className="flex items-center gap-2 min-w-0">
                      <PaperClipIcon className="h-4 w-4 text-secondary-500 flex-shrink-0" />
                      <span className="truncate text-secondary-800 dark:text-secondary-200">{a.fileName}</span>
                      <span className="text-xs text-secondary-500 flex-shrink-0">{formatFileSize(a.fileSize)}</span>
                    </span>
                    <Button size="sm" variant="outline" onClick={() => void downloadAttachment(a.id, a.fileName)} isLoading={downloadingFile === a.id} aria-label={t('downloadFile', { name: a.fileName })}>
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {order.history && order.history.length > 0 && (
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>{t('history')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {order.history.map((h, idx) => (
                <li key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 border border-secondary-200 dark:border-secondary-800 rounded-lg">
                  <span className="text-secondary-800 dark:text-secondary-200">
                    {tc(`orderStatus.${h.status}`)}
                    {locale === 'es' && h.description ? ` — ${h.description}` : ''}
                  </span>
                  <span className="text-sm text-secondary-500">{formatDateTime(h.date, locale)}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      <Card variant="bordered">
        <CardContent className="p-6 space-y-4">
          {order.invoice && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm text-secondary-700 dark:text-secondary-300">
                {t('invoiceIssued', { number: order.invoice.invoiceNumber })}{' '}
                <Badge variant="secondary" size="sm" className={INVOICE_STATUS_BADGE[order.invoice.status]}>
                  {tc(`invoiceStatus.${order.invoice.status}`)}
                </Badge>
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => void downloadInvoice(order.invoice!.id)} isLoading={downloading === order.invoice.id}>
                  {t('downloadInvoice')}
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link href="/dashboard/billing">{t('viewBilling')}</Link>
                </Button>
              </div>
            </div>
          )}
          {!canCancel && order.status !== 'cancelled' && order.status !== 'completed' && (
            <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('notEditable')}</p>
          )}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
            {order.conversationId && (
              <Button variant="outline" asChild>
                <Link href={`/dashboard/messages?c=${encodeURIComponent(order.conversationId)}`}>
                  <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                  {t('openConversation')}
                </Link>
              </Button>
            )}
            {canCancel && (
              <Button variant="danger" onClick={() => setConfirmCancel(true)} data-testid="order-cancel">
                {t('cancel')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {confirmCancel && (
        <ConfirmDialog
          title={t('cancelTitle')}
          message={t('cancelConfirm', { name: order.name })}
          confirmLabel={t('cancelYes')}
          cancelLabel={t('cancelNo')}
          danger
          onConfirm={cancelOrder}
          onClose={() => setConfirmCancel(false)}
        />
      )}
    </div>
  );
}

/** Portal › Detalle de pedido (dentro del marco del portal). */
export default function OrderDetailPage() {
  return (
    <DashboardLayout>
      <OrderDetailContent />
    </DashboardLayout>
  );
}
