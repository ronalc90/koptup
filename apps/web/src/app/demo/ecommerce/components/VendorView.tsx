'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  CurrencyDollarIcon, ShoppingBagIcon, ArrowTrendingUpIcon, CubeIcon,
  PlusIcon, ExclamationTriangleIcon, BoltIcon, XMarkIcon, PhotoIcon,
} from '@heroicons/react/24/outline';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { PRODUCTS, imageUrl } from './products';
import { formatPrice } from './shared';

type OrderStatus = 'new' | 'preparing' | 'shipped' | 'delivered';

interface VendorOrder { id: string; customer: string; items: number; total: number; status: OrderStatus; date: string; }

const MOCK_ORDERS: VendorOrder[] = [
  { id: 'KOP-001', customer: 'María González',  items: 3, total: 348,  status: 'new',       date: '2026-05-14 10:42' },
  { id: 'KOP-002', customer: 'Carlos Ramírez',  items: 1, total: 1199, status: 'preparing', date: '2026-05-14 10:21' },
  { id: 'KOP-003', customer: 'Andrea Suárez',   items: 5, total: 612,  status: 'preparing', date: '2026-05-14 09:55' },
  { id: 'KOP-004', customer: 'Felipe López',    items: 2, total: 198,  status: 'shipped',   date: '2026-05-14 09:18' },
  { id: 'KOP-005', customer: 'Laura Henao',     items: 1, total: 79,   status: 'shipped',   date: '2026-05-14 08:46' },
  { id: 'KOP-006', customer: 'Daniel Cárdenas', items: 4, total: 437,  status: 'delivered', date: '2026-05-13 17:33' },
];

const PRICING_RULES = [
  { id: 'r1', conditionKey: 'pricing.rule1', enabled: true },
  { id: 'r2', conditionKey: 'pricing.rule2', enabled: true },
  { id: 'r3', conditionKey: 'pricing.rule3', enabled: false },
  { id: 'r4', conditionKey: 'pricing.rule4', enabled: true },
];

export default function VendorView() {
  const t = useTranslations('demoEcommerce2');
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [showCreate, setShowCreate] = useState(false);
  const [rules, setRules] = useState(PRICING_RULES);

  const kpis = useMemo(() => {
    const sold = orders.reduce((s, o) => s + o.total, 0);
    return {
      revenue: sold,
      aov: sold / Math.max(orders.length, 1),
      conversion: 3.7,
      activeProducts: PRODUCTS.length,
    };
  }, [orders]);

  const topProducts = useMemo(() => [...PRODUCTS].sort((a, b) => b.sales30d - a.sales30d).slice(0, 4), []);
  const lowStock = useMemo(() => PRODUCTS.filter((p) => p.stock < 20).slice(0, 5), []);

  function advance(id: string) {
    setOrders((prev) => prev.map((o) => {
      if (o.id !== id) return o;
      const flow: OrderStatus[] = ['new', 'preparing', 'shipped', 'delivered'];
      const idx = flow.indexOf(o.status);
      return { ...o, status: flow[Math.min(idx + 1, flow.length - 1)] };
    }));
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-white">{t('vendor.title')}</h1>
          <p className="text-sm text-secondary-500">{t('vendor.subtitle')}</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />{t('vendor.createProduct')}
        </Button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<CurrencyDollarIcon className="h-6 w-6" />} label={t('vendor.kpis.todaySales')} value={formatPrice(kpis.revenue)} delta="+12.4%" tone="green" />
        <KpiCard icon={<ShoppingBagIcon className="h-6 w-6" />} label={t('vendor.kpis.aov')} value={formatPrice(kpis.aov)} delta="+3.1%" tone="green" />
        <KpiCard icon={<ArrowTrendingUpIcon className="h-6 w-6" />} label={t('vendor.kpis.conversion')} value={`${kpis.conversion}%`} delta="+0.4 pts" tone="green" />
        <KpiCard icon={<CubeIcon className="h-6 w-6" />} label={t('vendor.kpis.activeProducts')} value={kpis.activeProducts.toString()} delta="+2" tone="neutral" />
      </div>

      <Card variant="bordered" padding="md">
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-secondary-900 dark:text-white">{t('vendor.liveOrders')}</h2>
            <Badge variant="success" className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-600 animate-pulse" />
              {t('vendor.live')}
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-secondary-500">
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">{t('vendor.order.customer')}</th>
                  <th className="py-2 pr-3">{t('vendor.order.items')}</th>
                  <th className="py-2 pr-3">{t('vendor.order.total')}</th>
                  <th className="py-2 pr-3">{t('vendor.order.status')}</th>
                  <th className="py-2 pr-3">{t('vendor.order.action')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-secondary-100 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
                    <td className="py-3 pr-3 font-mono text-xs">{o.id}</td>
                    <td className="py-3 pr-3 text-secondary-900 dark:text-white">{o.customer}</td>
                    <td className="py-3 pr-3">{o.items}</td>
                    <td className="py-3 pr-3 font-semibold">{formatPrice(o.total)}</td>
                    <td className="py-3 pr-3"><StatusBadge status={o.status} t={t} /></td>
                    <td className="py-3 pr-3">
                      {o.status !== 'delivered' && (
                        <button onClick={() => advance(o.id)} className="text-xs text-primary-600 hover:underline">
                          {t('vendor.order.advance')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="bordered" padding="md" className="lg:col-span-2">
          <CardContent>
            <h2 className="text-lg font-bold text-secondary-900 dark:text-white mb-4">{t('vendor.topProducts')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {topProducts.map((p) => (
                <div key={p.id} className="text-center">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-secondary-100 dark:bg-secondary-800 mb-2">
                    <Image src={imageUrl(p.photoId, 240, 240)} alt={p.sku} fill sizes="120px" className="object-cover" />
                  </div>
                  <p className="text-xs font-semibold text-secondary-900 dark:text-white truncate">{t(`productNames.${p.nameKey}`)}</p>
                  <p className="text-xs text-secondary-500">{p.sales30d} {t('vendor.unitsSold')}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered" padding="md">
          <CardContent>
            <h2 className="text-lg font-bold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
              {t('vendor.lowStock')}
            </h2>
            <ul className="divide-y divide-secondary-200 dark:divide-secondary-700">
              {lowStock.map((p) => (
                <li key={p.id} className="py-2 flex items-center justify-between gap-2">
                  <span className="text-sm text-secondary-900 dark:text-white truncate">{t(`productNames.${p.nameKey}`)}</span>
                  <Badge variant={p.stock < 10 ? 'danger' : 'warning'} size="sm">{p.stock} {t('vendor.units')}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card variant="bordered" padding="md">
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-secondary-900 dark:text-white flex items-center gap-2">
              <BoltIcon className="h-5 w-5 text-primary-600" />
              {t('vendor.pricing.title')}
            </h2>
            <span className="text-xs text-secondary-500">{t('vendor.pricing.subtitle')}</span>
          </div>
          <div className="space-y-2">
            {rules.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                <p className="text-sm text-secondary-700 dark:text-secondary-200">{t(`vendor.${r.conditionKey}`)}</p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox" className="sr-only peer" checked={r.enabled}
                    onChange={() => setRules((rs) => rs.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x)))}
                  />
                  <div className="w-11 h-6 bg-secondary-300 dark:bg-secondary-600 peer-checked:bg-primary-600 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5" />
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {showCreate && <CreateProductModal onClose={() => setShowCreate(false)} t={t} />}
    </div>
  );
}

function KpiCard({ icon, label, value, delta, tone }: { icon: React.ReactNode; label: string; value: string; delta: string; tone: 'green' | 'red' | 'neutral' }) {
  const toneClass = tone === 'green' ? 'text-green-600 bg-green-50 dark:bg-green-950/30' : tone === 'red' ? 'text-red-600 bg-red-50 dark:bg-red-950/30' : 'text-secondary-600 bg-secondary-50 dark:bg-secondary-800';
  return (
    <Card variant="bordered" padding="md">
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950">{icon}</div>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${toneClass}`}>{delta}</span>
        </div>
        <p className="text-xs text-secondary-500">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-secondary-900 dark:text-white">{value}</p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status, t }: { status: OrderStatus; t: ReturnType<typeof useTranslations> }) {
  const map: Record<OrderStatus, { variant: 'info' | 'warning' | 'primary' | 'success'; key: string }> = {
    new: { variant: 'info', key: 'vendor.order.status_new' },
    preparing: { variant: 'warning', key: 'vendor.order.status_preparing' },
    shipped: { variant: 'primary', key: 'vendor.order.status_shipped' },
    delivered: { variant: 'success', key: 'vendor.order.status_delivered' },
  };
  const { variant, key } = map[status];
  return <Badge variant={variant} size="sm">{t(key)}</Badge>;
}

function CreateProductModal({ onClose, t }: { onClose: () => void; t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-secondary-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-secondary-900 dark:text-white">{t('vendor.createForm.title')}</h2>
            <button onClick={onClose} className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <Field label={t('vendor.createForm.name')} placeholder="Sneakers Pro" />
            <Field label={t('vendor.createForm.sku')} placeholder="TEC-XYZ-001" />
            <Field label={t('vendor.createForm.price')} placeholder="129.99" type="number" />
            <Field label={t('vendor.createForm.stock')} placeholder="100" type="number" />
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1">{t('vendor.createForm.description')}</label>
              <textarea rows={3} className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm" placeholder="" />
            </div>
          </div>
          <div className="border-2 border-dashed border-secondary-300 dark:border-secondary-700 rounded-lg p-8 text-center text-secondary-500 mb-4">
            <PhotoIcon className="h-10 w-10 mx-auto mb-2" />
            <p className="text-sm">{t('vendor.createForm.dropImages')}</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>{t('vendor.createForm.cancel')}</Button>
            <Button onClick={onClose}>{t('vendor.createForm.save')}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, placeholder, type = 'text' }: { label: string; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1">{label}</label>
      <input type={type} placeholder={placeholder} className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm" />
    </div>
  );
}
