'use client';

import { useTranslations } from 'next-intl';
import {
  BuildingStorefrontIcon, TruckIcon, ArrowPathIcon, MapPinIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { PRODUCTS } from './products';

const WAREHOUSES = [
  { id: 'bog', city: 'Bogotá',  capacity: 87, pending: 142 },
  { id: 'mde', city: 'Medellín', capacity: 64, pending: 86  },
  { id: 'cli', city: 'Cali',     capacity: 52, pending: 71  },
];

const CARRIERS = [
  { id: 'fedex',           sla: '24h', cost: 18.5, rating: 4.7 },
  { id: 'dhl',             sla: '24h', cost: 22.0, rating: 4.8 },
  { id: 'servientrega',    sla: '48h', cost: 9.5,  rating: 4.4 },
  { id: 'coordinadora',    sla: '48h', cost: 8.0,  rating: 4.3 },
  { id: 'interrapidisimo', sla: '72h', cost: 6.5,  rating: 4.2 },
  { id: 'tcc',             sla: '72h', cost: 7.0,  rating: 4.1 },
];

const SHIPMENTS = [
  { id: 'SH-9001', carrier: 'fedex',        from: 'Bogotá',   to: 'Cartagena',    status: 'in_transit',      eta: '2026-05-15' },
  { id: 'SH-9002', carrier: 'dhl',          from: 'Medellín', to: 'Cali',         status: 'out_for_delivery',eta: '2026-05-14' },
  { id: 'SH-9003', carrier: 'servientrega', from: 'Bogotá',   to: 'Barranquilla', status: 'in_transit',      eta: '2026-05-16' },
  { id: 'SH-9004', carrier: 'coordinadora', from: 'Cali',     to: 'Pereira',      status: 'delivered',       eta: '2026-05-13' },
];

const RETURNS = [
  { id: 'RMA-401', sku: 'TEC-HDP-WL',  reasonKey: 'returns.reasons.defective',       status: 'approved'   },
  { id: 'RMA-402', sku: 'MOD-JCK-CUE', reasonKey: 'returns.reasons.size',            status: 'pending'    },
  { id: 'RMA-403', sku: 'TEC-IPH-15P', reasonKey: 'returns.reasons.notAsDescribed',  status: 'reviewing'  },
  { id: 'RMA-404', sku: 'MOD-SNK-RED', reasonKey: 'returns.reasons.changeMind',      status: 'approved'   },
];

export default function OperationsView() {
  const t = useTranslations('demoEcommerce2');
  const totalPicks = PRODUCTS.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-white">{t('ops.title')}</h1>
        <p className="text-sm text-secondary-500">{t('ops.subtitle')}</p>
      </header>

      <section>
        <h2 className="text-lg font-bold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
          <BuildingStorefrontIcon className="h-5 w-5 text-primary-600" />
          {t('ops.warehouses.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {WAREHOUSES.map((w) => (
            <Card key={w.id} variant="bordered" padding="md">
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-secondary-900 dark:text-white">{w.city}</p>
                    <p className="text-xs text-secondary-500">WH-{w.id.toUpperCase()}</p>
                  </div>
                  <MapPinIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-secondary-500 mb-1">
                    <span>{t('ops.warehouses.capacity')}</span>
                    <span className="font-semibold text-secondary-900 dark:text-white">{w.capacity}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary-200 dark:bg-secondary-700 overflow-hidden">
                    <div
                      className={`h-full ${w.capacity > 80 ? 'bg-red-500' : w.capacity > 60 ? 'bg-amber-500' : 'bg-green-500'}`}
                      style={{ width: `${w.capacity}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-500">{t('ops.warehouses.pendingOrders')}</span>
                  <span className="font-bold text-secondary-900 dark:text-white">{w.pending}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card variant="bordered" padding="md">
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-secondary-900 dark:text-white flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-primary-600" />
              {t('ops.picking.title')}
            </h2>
            <Badge variant="info">{totalPicks} {t('ops.picking.items')}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {['wave1', 'wave2', 'wave3'].map((w, i) => (
              <div key={w} className="p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold">{t(`ops.picking.${w}`)}</span>
                  <Badge variant={i === 0 ? 'success' : i === 1 ? 'warning' : 'default'} size="sm">
                    {i === 0 ? t('ops.picking.complete') : i === 1 ? t('ops.picking.inProgress') : t('ops.picking.queued')}
                  </Badge>
                </div>
                <p className="text-xs text-secondary-500">{8 + i * 3} {t('ops.picking.items')}</p>
                <div className="h-1.5 rounded-full bg-secondary-200 dark:bg-secondary-700 mt-2 overflow-hidden">
                  <div className="h-full bg-primary-600" style={{ width: `${i === 0 ? 100 : i === 1 ? 60 : 10}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card variant="bordered" padding="md">
        <CardContent>
          <h2 className="text-lg font-bold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
            <TruckIcon className="h-5 w-5 text-primary-600" />
            {t('ops.carriers.title')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-secondary-500">
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <th className="py-2 pr-3">{t('ops.carriers.carrier')}</th>
                  <th className="py-2 pr-3">{t('ops.carriers.sla')}</th>
                  <th className="py-2 pr-3">{t('ops.carriers.cost')}</th>
                  <th className="py-2 pr-3">{t('ops.carriers.rating')}</th>
                  <th className="py-2 pr-3">{t('ops.carriers.status')}</th>
                </tr>
              </thead>
              <tbody>
                {CARRIERS.map((c) => (
                  <tr key={c.id} className="border-b border-secondary-100 dark:border-secondary-800">
                    <td className="py-3 pr-3 font-medium text-secondary-900 dark:text-white">{t(`ops.carriers.names.${c.id}`)}</td>
                    <td className="py-3 pr-3">{c.sla}</td>
                    <td className="py-3 pr-3 font-semibold">${c.cost.toFixed(2)}</td>
                    <td className="py-3 pr-3">★ {c.rating}</td>
                    <td className="py-3 pr-3"><Badge variant="success" size="sm">{t('ops.carriers.active')}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card variant="bordered" padding="md">
        <CardContent>
          <h2 className="text-lg font-bold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPinIcon className="h-5 w-5 text-primary-600" />
            {t('ops.tracking.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SHIPMENTS.map((s) => (
              <div key={s.id} className="border border-secondary-200 dark:border-secondary-700 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-mono text-xs text-secondary-500">{s.id}</p>
                    <p className="text-sm font-medium text-secondary-900 dark:text-white">{t(`ops.carriers.names.${s.carrier}`)}</p>
                  </div>
                  <Badge variant={s.status === 'delivered' ? 'success' : s.status === 'out_for_delivery' ? 'warning' : 'info'} size="sm">
                    {t(`ops.tracking.status.${s.status}`)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-secondary-500 mb-2">
                  <span>{s.from}</span>
                  <span className="flex-1 h-px bg-secondary-300 dark:bg-secondary-700" />
                  <span>{s.to}</span>
                </div>
                <p className="text-xs text-secondary-500">ETA: {s.eta}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card variant="bordered" padding="md">
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-secondary-900 dark:text-white flex items-center gap-2">
              <ArrowPathIcon className="h-5 w-5 text-primary-600" />
              {t('ops.returns.title')}
            </h2>
            <Button variant="outline" size="sm">{t('ops.returns.openPortal')}</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-secondary-500">
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <th className="py-2 pr-3">RMA</th>
                  <th className="py-2 pr-3">SKU</th>
                  <th className="py-2 pr-3">{t('ops.returns.reason')}</th>
                  <th className="py-2 pr-3">{t('ops.returns.statusLabel')}</th>
                </tr>
              </thead>
              <tbody>
                {RETURNS.map((r) => (
                  <tr key={r.id} className="border-b border-secondary-100 dark:border-secondary-800">
                    <td className="py-3 pr-3 font-mono text-xs">{r.id}</td>
                    <td className="py-3 pr-3">{r.sku}</td>
                    <td className="py-3 pr-3">{t(`ops.${r.reasonKey}`)}</td>
                    <td className="py-3 pr-3">
                      <Badge variant={r.status === 'approved' ? 'success' : r.status === 'pending' ? 'warning' : 'info'} size="sm">
                        {t(`ops.returns.status.${r.status}`)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
