'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { PortalEmpty, PortalError, PortalLoading } from '@/components/dashboard/PortalStates';
import { useErrorText } from '@/hooks/useErrorText';
import { apiRequest } from '@/lib/demo-system';
import { formatDay, formatMoney, ORDER_STATUS_BADGE, ORDER_STATUSES, type ApprovalStatus, type OrderStatus } from '@/lib/portal';
import { EyeIcon, FunnelIcon, MagnifyingGlassIcon, PlusIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

interface OrderRow {
  id: string;
  name: string;
  description: string;
  status: OrderStatus;
  approvalStatus: ApprovalStatus;
  date: string;
  amount: number;
  currency: string;
  items: number;
  tracking?: string;
}

function OrdersContent() {
  const t = useTranslations('ordersPage');
  const tc = useTranslations('portalCommon');
  const locale = useLocale();
  const errorText = useErrorText();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');

  const load = useCallback(async () => {
    setOrders(null);
    setLoadError('');
    try {
      const data = await apiRequest<OrderRow[]>('/orders');
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setLoadError(errorText(err));
    }
  }, [errorText]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return (orders ?? []).filter(
      (o) => (statusFilter === 'all' || o.status === statusFilter) && (!q || o.name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q)),
    );
  }, [orders, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">{t('title')}</h1>
          <p className="text-secondary-600 dark:text-secondary-400">{t('subtitle')}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/orders/new">
            <PlusIcon className="h-5 w-5 mr-2" />
            {t('newOrder')}
          </Link>
        </Button>
      </div>

      {loadError ? (
        <PortalError message={loadError} onRetry={() => void load()} />
      ) : !orders ? (
        <PortalLoading />
      ) : orders.length === 0 ? (
        <PortalEmpty icon={ShoppingBagIcon} title={t('emptyTitle')} body={t('emptyBody')} action={{ href: '/dashboard/orders/new', label: t('newOrder') }} />
      ) : (
        <>
          <Card variant="bordered">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <label htmlFor="orders-search" className="sr-only">
                    {tc('search')}
                  </label>
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                  <input
                    id="orders-search"
                    type="search"
                    placeholder={t('searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="w-full md:w-56 relative">
                  <label htmlFor="orders-status" className="sr-only">
                    {t('statusFilter')}
                  </label>
                  <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                  <select
                    id="orders-status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | OrderStatus)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">{t('status.all')}</option>
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {tc(`orderStatus.${s}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4" data-testid="orders-list">
            {filtered.length === 0 ? (
              <Card variant="bordered">
                <CardContent className="p-12 text-center">
                  <p className="text-secondary-600 dark:text-secondary-400">{t('noOrders')}</p>
                </CardContent>
              </Card>
            ) : (
              filtered.map((order) => (
                <Card key={order.id} variant="bordered" className="hover:shadow-medium transition-shadow" data-order-id={order.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h2 className="text-lg font-semibold text-secondary-900 dark:text-white break-words">{order.name}</h2>
                          <Badge variant="secondary" size="sm" className={ORDER_STATUS_BADGE[order.status]}>
                            {tc(`orderStatus.${order.status}`)}
                          </Badge>
                          {order.status === 'pending' && (
                            <Badge variant="secondary" size="sm">
                              {tc(`approvalStatus.${order.approvalStatus}`)}
                            </Badge>
                          )}
                        </div>
                        {order.description && <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2 line-clamp-2">{order.description}</p>}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-secondary-500">
                          <span className="font-mono">{order.id}</span>
                          <span aria-hidden="true">•</span>
                          <span>{formatDay(order.date, locale)}</span>
                          <span aria-hidden="true">•</span>
                          <span>{t('itemsCount', { count: order.items })}</span>
                          {order.tracking && (
                            <>
                              <span aria-hidden="true">•</span>
                              <span className="font-mono">{order.tracking}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between lg:justify-end gap-4">
                        <p className="text-2xl font-bold text-secondary-900 dark:text-white">{formatMoney(order.amount, order.currency, locale)}</p>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/orders/${encodeURIComponent(order.id)}`}>
                            <EyeIcon className="h-4 w-4 mr-2" />
                            {t('viewDetail')}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <Card variant="bordered">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {ORDER_STATUSES.map((s) => (
                  <div key={s} className="text-center">
                    <p className="text-2xl font-bold text-secondary-900 dark:text-white mb-1">{orders.filter((o) => o.status === s).length}</p>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">{tc(`orderStatus.${s}`)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

/** Portal › Mis pedidos (datos reales; si la API falla, error con reintento). */
export default function OrdersPage() {
  return (
    <DashboardLayout>
      <OrdersContent />
    </DashboardLayout>
  );
}
