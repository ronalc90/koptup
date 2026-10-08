'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  CurrencyDollarIcon, ShoppingBagIcon, ArrowTrendingUpIcon, CubeIcon, BoltIcon, ArrowDownTrayIcon, MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatPrice, formatNumber, formatDecimal, RULE_IDS, FREE_SHIPPING_FROM, VOLUME_DISCOUNT_FROM, SHIPPING_FEE } from './pricing';
import { CITY_BY_ID, type Order, type OrderStatus } from './data';
import { DAY, computeKpis, deltaVsWeek, inWindow, orderAge, toCsv, downloadBlob, localStamp, type Kpis } from './analytics';
import { useStore } from './store';
import { StatusBadge, Toggle, useAgeLabel, SampleNote } from './ui';
import { GuideModal, OrderAction, OrderDetailModal } from './OrderModals';
import CatalogPanel from './CatalogPanel';

type StatusFilter = 'all' | OrderStatus;
const STATUS_FILTERS: StatusFilter[] = ['all', 'new', 'preparing', 'shipped', 'delivered', 'cancelled'];
type Period = 1 | 7 | 30;
const PAGE = 10;

export default function VendorView() {
  const t = useTranslations('demoEcommerce2');
  const { state, clock, toggleRule, productName, productById, notify } = useStore();
  const ageLabel = useAgeLabel();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [period, setPeriod] = useState<Period>(1);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [shipId, setShipId] = useState<string | null>(null);

  const today = useMemo(() => computeKpis(inWindow(state.orders, clock, 0, DAY)), [state.orders, clock]);
  const delta = (pick: (k: Kpis) => number) => deltaVsWeek(state.orders, clock, pick);

  const periodOrders = useMemo(
    () => state.orders.filter((o) => orderAge(o, clock) < period * DAY),
    [state.orders, clock, period],
  );
  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: periodOrders.length, new: 0, preparing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    periodOrders.forEach((o) => { c[o.status] += 1; });
    return c;
  }, [periodOrders]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return periodOrders
      .filter((o) => statusFilter === 'all' || o.status === statusFilter)
      .filter((o) => !q || o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) || (CITY_BY_ID[o.cityId]?.name.toLowerCase().includes(q) ?? false))
      .sort((a, b) => orderAge(a, clock) - orderAge(b, clock));
  }, [periodOrders, statusFilter, query, clock]);

  function exportCsv() {
    const now = Date.now();
    const rows: Array<Array<string | number>> = [[
      t('csv.order'), t('csv.date'), t('csv.customer'), t('csv.city'), t('csv.department'), t('csv.products'), t('csv.units'),
      t('csv.subtotal'), t('csv.discount'), t('csv.shipping'), t('csv.total'), t('csv.iva'), t('csv.method'), t('csv.paid'), t('csv.status'), t('csv.carrier'), t('csv.guide'),
    ]];
    filtered.forEach((o: Order) => {
      const city = CITY_BY_ID[o.cityId];
      rows.push([
        o.id, localStamp(now - orderAge(o, clock) * 60000), o.customer, city?.name ?? '', city?.department ?? '',
        o.lines.map((l) => `${productName(productById.get(l.productId))} x${l.qty}`).join(' | '),
        o.lines.reduce((s, l) => s + l.qty, 0), o.subtotal, o.discount, o.shipping, o.total, o.ivaIncluded,
        t(`paymentMethods.${o.method}`), o.paid ? t('csv.yes') : t('csv.no'), t(`orderStatus.${o.status}`),
        o.carrier ? t(`carriers.${o.carrier}`) : '', o.guide ?? '',
      ]);
    });
    downloadBlob(`pedidos-tienda-ejemplo-${period}d.csv`, toCsv(rows), 'text/csv;charset=utf-8');
    notify(t('toasts.csvDownloaded', { n: filtered.length }));
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-white sm:text-3xl">{t('vendor.title')}</h1>
        <p className="text-sm text-secondary-500">{t('vendor.subtitle')}</p>
      </header>

      <section aria-label={t('vendor.kpis.title')}>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold text-secondary-900 dark:text-white">{t('vendor.kpis.title')}</h2>
          <SampleNote>{t('vendor.kpis.hint')}</SampleNote>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard icon={<CurrencyDollarIcon className="h-6 w-6" />} label={t('vendor.kpis.sales')} value={formatPrice(today.sales)} delta={delta((k) => k.sales)} />
          <KpiCard icon={<ShoppingBagIcon className="h-6 w-6" />} label={t('vendor.kpis.orders')} value={formatNumber(today.orders)} delta={delta((k) => k.orders)} />
          <KpiCard icon={<ArrowTrendingUpIcon className="h-6 w-6" />} label={t('vendor.kpis.ticket')} value={formatPrice(today.ticket)} delta={delta((k) => k.ticket)} />
          <KpiCard icon={<CubeIcon className="h-6 w-6" />} label={t('vendor.kpis.units')} value={formatNumber(today.units)} delta={delta((k) => k.units)} />
        </div>
      </section>

      <Card variant="bordered" padding="md">
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-lg font-bold text-secondary-900 dark:text-white">{t('vendor.orders.title')}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <select aria-label={t('vendor.orders.period')} value={period} onChange={(e) => { setPeriod(Number(e.target.value) as Period); setLimit(PAGE); }} className="rounded-lg border border-secondary-300 bg-white px-2 py-1.5 text-sm dark:border-secondary-700 dark:bg-secondary-800">
                {[1, 7, 30].map((p) => <option key={p} value={p}>{t(`vendor.orders.periods.${p}`)}</option>)}
              </select>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
                <input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }} placeholder={t('vendor.orders.search')} aria-label={t('vendor.orders.search')} className="w-56 rounded-lg border border-secondary-300 bg-white py-1.5 pl-7 pr-2 text-sm dark:border-secondary-700 dark:bg-secondary-800" />
              </div>
              <Button size="sm" variant="outline" onClick={exportCsv} disabled={!filtered.length} className="flex items-center gap-1">
                <ArrowDownTrayIcon className="h-4 w-4" /> {t('vendor.orders.export')}
              </Button>
            </div>
          </div>
          <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label={t('vendor.orders.statusFilter')}>
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={statusFilter === s}
                onClick={() => { setStatusFilter(s); setLimit(PAGE); }}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-300'}`}
              >
                {s === 'all' ? t('vendor.orders.all') : t(`orderStatus.${s}`)} ({counts[s]})
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-secondary-500">
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <th className="py-2 pr-3">{t('vendor.orders.number')}</th>
                  <th className="py-2 pr-3">{t('vendor.orders.customer')}</th>
                  <th className="py-2 pr-3">{t('vendor.orders.city')}</th>
                  <th className="py-2 pr-3 text-right">{t('vendor.orders.total')}</th>
                  <th className="py-2 pr-3">{t('vendor.orders.payment')}</th>
                  <th className="py-2 pr-3">{t('vendor.orders.status')}</th>
                  <th className="py-2 pr-3">{t('vendor.orders.when')}</th>
                  <th className="py-2 pr-3">{t('vendor.orders.action')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, limit).map((o) => (
                  <tr key={o.id} className={`border-b border-secondary-100 dark:border-secondary-800 ${o.demo ? 'bg-primary-50/60 dark:bg-primary-950/30' : 'hover:bg-secondary-50 dark:hover:bg-secondary-800/50'}`}>
                    <td className="py-2.5 pr-3">
                      <button type="button" onClick={() => setDetailId(o.id)} className="font-mono text-xs text-primary-600 hover:underline">{o.id}</button>
                      {o.demo && <Badge variant="primary" size="sm" className="ml-2">{t('vendor.orders.yours')}</Badge>}
                    </td>
                    <td className="py-2.5 pr-3 text-secondary-900 dark:text-white">{o.customer}</td>
                    <td className="py-2.5 pr-3">{CITY_BY_ID[o.cityId]?.name}</td>
                    <td className="py-2.5 pr-3 text-right font-semibold">{formatPrice(o.total)}</td>
                    <td className="py-2.5 pr-3 whitespace-nowrap">{t(`paymentMethods.${o.method}`)}{!o.paid && o.status !== 'cancelled' && <span className="ml-1 text-xs text-amber-600">({t('vendor.orders.unpaid')})</span>}</td>
                    <td className="py-2.5 pr-3"><StatusBadge status={o.status} /></td>
                    <td className="py-2.5 pr-3 whitespace-nowrap text-xs text-secondary-500">{ageLabel(o)}</td>
                    <td className="py-2.5 pr-3"><OrderAction order={o} onShip={setShipId} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="py-8 text-center text-sm text-secondary-500">{t('vendor.orders.empty')}</p>}
          </div>
          {filtered.length > limit && (
            <div className="mt-3 text-center">
              <Button size="sm" variant="ghost" onClick={() => setLimit((l) => l + PAGE)}>{t('vendor.orders.more', { n: filtered.length - limit })}</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <CatalogPanel />

      <Card variant="bordered" padding="md">
        <CardContent>
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-secondary-900 dark:text-white">
              <BoltIcon className="h-5 w-5 text-primary-600" />
              {t('vendor.pricing.title')}
            </h2>
            <SampleNote>{t('vendor.pricing.subtitle')}</SampleNote>
          </div>
          <div className="space-y-2">
            {RULE_IDS.map((r) => {
              const label = t(`vendor.pricing.rules.${r}`, { from: formatPrice(r === 'volume10' ? VOLUME_DISCOUNT_FROM : FREE_SHIPPING_FROM), fee: formatPrice(SHIPPING_FEE) });
              return (
                <div key={r} className="flex items-center justify-between gap-3 rounded-lg bg-secondary-50 p-3 dark:bg-secondary-800">
                  <div>
                    <p className="text-sm font-medium text-secondary-900 dark:text-white">{label}</p>
                    <p className="text-xs text-secondary-500">{state.rules[r] ? t('vendor.pricing.on') : t('vendor.pricing.off')}</p>
                  </div>
                  <Toggle checked={state.rules[r]} onChange={() => toggleRule(r)} label={label} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {detailId && <OrderDetailModal orderId={detailId} onClose={() => setDetailId(null)} onShip={setShipId} />}
      {shipId && <GuideModal orderId={shipId} onClose={() => setShipId(null)} />}
    </div>
  );
}

function KpiCard({ icon, label, value, delta }: { icon: React.ReactNode; label: string; value: string; delta: number | null }) {
  const t = useTranslations('demoEcommerce2');
  const tone = delta == null ? 'neutral' : delta >= 0 ? 'up' : 'down';
  const toneClass = tone === 'up' ? 'text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-950/30' : tone === 'down' ? 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950/30' : 'text-secondary-600 bg-secondary-50 dark:bg-secondary-800';
  return (
    <Card variant="bordered" padding="md">
      <CardContent>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="rounded-lg bg-primary-50 p-2 text-primary-600 dark:bg-primary-950">{icon}</div>
          {delta != null && (
            <span className={`rounded-full px-2 py-1 text-xs font-bold ${toneClass}`} title={t('vendor.kpis.deltaHint')}>
              {delta >= 0 ? '+' : ''}{formatDecimal(delta)} %
            </span>
          )}
        </div>
        <p className="text-xs text-secondary-500">{label}</p>
        <p className="text-lg font-bold text-secondary-900 dark:text-white sm:text-2xl">{value}</p>
      </CardContent>
    </Card>
  );
}
