'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { formatMoney, SectionHeader, CountryBadge } from './shared';

type StockStatus = 'ok' | 'lowStock' | 'out';
type DianStatus = 'accepted' | 'pending' | 'rejected';

export function InventoryModule({ currencyCode }: { currencyCode: string }) {
  const t = useTranslations('demoErp.inventory');
  const [method, setMethod] = useState<'FIFO' | 'LIFO'>('FIFO');

  const items: { sku: string; product: string; wh: string; stock: number; min: number; cost: number; status: StockStatus }[] = [
    { sku: 'SKU-0021', product: 'Laptop Pro 14"', wh: 'wh1', stock: 42, min: 20, cost: 1180, status: 'ok' },
    { sku: 'SKU-0048', product: 'Monitor 27" 4K', wh: 'wh1', stock: 8, min: 15, cost: 420, status: 'lowStock' },
    { sku: 'SKU-0102', product: 'Teclado mecánico', wh: 'wh2', stock: 0, min: 30, cost: 95, status: 'out' },
    { sku: 'SKU-0118', product: 'Mouse inalámbrico', wh: 'wh2', stock: 156, min: 40, cost: 28, status: 'ok' },
    { sku: 'SKU-0203', product: 'Webcam HD', wh: 'wh3', stock: 12, min: 25, cost: 78, status: 'lowStock' },
    { sku: 'SKU-0245', product: 'Dock Thunderbolt', wh: 'wh3', stock: 28, min: 15, cost: 320, status: 'ok' },
  ];

  const alerts = items.filter((i) => i.status !== 'ok');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <Card variant="bordered" padding="md" className="lg:col-span-3">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <SectionHeader title={t('title')} subtitle={t('subtitle')} />
          <div className="flex gap-1 bg-secondary-100 dark:bg-secondary-800 p-1 rounded-lg">
            {(['FIFO', 'LIFO'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`px-3 py-1 text-xs font-semibold rounded ${
                  method === m
                    ? 'bg-white dark:bg-secondary-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-secondary-600 dark:text-secondary-400'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-xs uppercase text-secondary-500 dark:text-secondary-400 border-b border-secondary-200 dark:border-secondary-700">
                <th className="py-2 pr-3">{t('sku')}</th>
                <th className="py-2 pr-3">{t('product')}</th>
                <th className="py-2 pr-3">{t('warehouse')}</th>
                <th className="py-2 pr-3 text-right">{t('stock')}</th>
                <th className="py-2 pr-3 text-right">{t('min')}</th>
                <th className="py-2 pr-3 text-right">{t('unitCost')}</th>
                <th className="py-2 pr-3 text-right">{t('totalValue')}</th>
                <th className="py-2 pl-3">{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.sku} className="border-b border-secondary-100 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-800/40">
                  <td className="py-2.5 pr-3 font-mono text-xs text-primary-600 dark:text-primary-400">{it.sku}</td>
                  <td className="py-2.5 pr-3 text-secondary-900 dark:text-white">{it.product}</td>
                  <td className="py-2.5 pr-3 text-secondary-700 dark:text-secondary-300">{t(it.wh as any)}</td>
                  <td className="py-2.5 pr-3 text-right text-secondary-900 dark:text-white font-medium">{it.stock}</td>
                  <td className="py-2.5 pr-3 text-right text-secondary-600 dark:text-secondary-400">{it.min}</td>
                  <td className="py-2.5 pr-3 text-right text-secondary-700 dark:text-secondary-300">{formatMoney(it.cost, currencyCode)}</td>
                  <td className="py-2.5 pr-3 text-right text-secondary-900 dark:text-white font-semibold">{formatMoney(it.stock * it.cost, currencyCode)}</td>
                  <td className="py-2.5 pl-3">
                    {it.status === 'ok' && <Badge variant="success">{t('ok')}</Badge>}
                    {it.status === 'lowStock' && <Badge variant="warning">{t('lowStock')}</Badge>}
                    {it.status === 'out' && <Badge variant="danger">{t('out')}</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-secondary-500 dark:text-secondary-500 mt-3">
          {t('method')}: <span className="font-semibold text-primary-600 dark:text-primary-400">{method}</span>
        </p>
      </Card>

      <Card variant="bordered" padding="md">
        <h3 className="font-bold text-secondary-900 dark:text-white mb-3 flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
          {t('alerts')}
        </h3>
        <div className="space-y-2">
          {alerts.map((a) => (
            <div key={a.sku} className="p-2.5 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50/50 dark:bg-secondary-800/40">
              <p className="font-mono text-xs text-primary-600 dark:text-primary-400">{a.sku}</p>
              <p className="text-sm text-secondary-900 dark:text-white truncate">{a.product}</p>
              <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                {a.status === 'out' ? t('alertOut') : t('alertLow')} · {a.stock}/{a.min}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function SalesModule({ openDetail, currencyCode }: { openDetail: (ref: string) => void; currencyCode: string }) {
  const t = useTranslations('demoErp.sales');
  const [invoices, setInvoices] = useState<
    { id: string; customer: string; date: string; amount: number; tax: number; status: DianStatus; type: 'inv' | 'cn' | 'dn'; country: string }[]
  >([
    { id: 'FE-9821', customer: 'Acme S.A.', date: '2026-05-12', amount: 45000, tax: 8550, status: 'accepted', type: 'inv', country: 'CO' },
    { id: 'FE-9822', customer: 'GlobalTech LLC', date: '2026-05-12', amount: 18250, tax: 2920, status: 'accepted', type: 'inv', country: 'MX' },
    { id: 'NC-0144', customer: 'Retail Plus', date: '2026-05-13', amount: -3200, tax: -608, status: 'pending', type: 'cn', country: 'CO' },
    { id: 'FE-9823', customer: 'Innova Group', date: '2026-05-13', amount: 9420, tax: 1790, status: 'rejected', type: 'inv', country: 'AR' },
    { id: 'ND-0021', customer: 'Distrib. Sur', date: '2026-05-14', amount: 1850, tax: 351, status: 'accepted', type: 'dn', country: 'CL' },
    { id: 'FE-9824', customer: 'LATAM SAS', date: '2026-05-14', amount: 32100, tax: 6099, status: 'accepted', type: 'inv', country: 'PE' },
  ]);

  const resend = (id: string) => {
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, status: i.status === 'rejected' ? 'pending' : 'accepted' } : i)));
  };

  const statusBadge = (s: DianStatus) => {
    if (s === 'accepted')
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircleIcon className="w-3 h-3" />
          {t('accepted')}
        </Badge>
      );
    if (s === 'pending')
      return (
        <Badge variant="warning" className="gap-1">
          <ClockIcon className="w-3 h-3" />
          {t('pending')}
        </Badge>
      );
    return (
      <Badge variant="danger" className="gap-1">
        <XCircleIcon className="w-3 h-3" />
        {t('rejected')}
      </Badge>
    );
  };

  const typeLabel = (tp: 'inv' | 'cn' | 'dn') => (tp === 'inv' ? t('typeInv') : tp === 'cn' ? t('typeCN') : t('typeDN'));

  return (
    <Card variant="bordered" padding="md">
      <SectionHeader title={t('title')} subtitle={t('subtitle')} />
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-xs uppercase text-secondary-500 dark:text-secondary-400 border-b border-secondary-200 dark:border-secondary-700">
              <th className="py-2 pr-3">{t('invoice')}</th>
              <th className="py-2 pr-3">{t('type')}</th>
              <th className="py-2 pr-3">{t('customer')}</th>
              <th className="py-2 pr-3">{t('date')}</th>
              <th className="py-2 pr-3 text-right">{t('amount')}</th>
              <th className="py-2 pr-3 text-right">{t('tax')}</th>
              <th className="py-2 pr-3">{t('status')}</th>
              <th className="py-2 pl-3"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-secondary-100 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-800/40">
                <td className="py-2.5 pr-3 font-mono text-xs text-primary-600 dark:text-primary-400">{inv.id}</td>
                <td className="py-2.5 pr-3 text-secondary-700 dark:text-secondary-300 text-xs">{typeLabel(inv.type)}</td>
                <td className="py-2.5 pr-3 text-secondary-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <CountryBadge code={inv.country} />
                    {inv.customer}
                  </div>
                </td>
                <td className="py-2.5 pr-3 text-secondary-600 dark:text-secondary-400 whitespace-nowrap">{inv.date}</td>
                <td className="py-2.5 pr-3 text-right text-secondary-900 dark:text-white font-medium">{formatMoney(inv.amount, currencyCode)}</td>
                <td className="py-2.5 pr-3 text-right text-secondary-600 dark:text-secondary-400">{formatMoney(inv.tax, currencyCode)}</td>
                <td className="py-2.5 pr-3">{statusBadge(inv.status)}</td>
                <td className="py-2.5 pl-3">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => openDetail(inv.id)}
                      className="p-1.5 rounded-md hover:bg-primary-50 dark:hover:bg-primary-950/50 text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      aria-label={t('view')}
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    {inv.status !== 'accepted' && (
                      <button
                        onClick={() => resend(inv.id)}
                        className="p-1.5 rounded-md hover:bg-primary-50 dark:hover:bg-primary-950/50 text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        aria-label={t('resend')}
                      >
                        <ArrowPathIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
