'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  CurrencyDollarIcon, UsersIcon, ShoppingBagIcon, ArrowTrendingUpIcon, ArrowPathIcon, CubeIcon,
  LightBulbIcon, ShieldCheckIcon, EnvelopeIcon, ArrowDownTrayIcon, ScaleIcon,
} from '@heroicons/react/24/outline';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatPrice, formatNumber, formatDecimal, formatMillions } from './pricing';
import { CITY_BY_ID } from './data';
import {
  DAY, computeKpis, inWindow, dailySeries, salesByProduct, salesByCategory, salesByCity, ordersByMethod,
  computeInsights, riskQueue, automationAudience, AUTOMATION_IDS, COD_LIMIT, FIRST_ORDER_LIMIT,
  toCsv, downloadBlob, localStamp, orderAge, coverageDays, type AutomationId, type Insight,
} from './analytics';
import { totalStock } from './products';
import { useStore } from './store';
import { Modal, Toggle, SampleNote, StatusBadge } from './ui';

type Period = 7 | 30;
const CATEGORY_COLORS: Record<string, string> = {
  tech: '#2563eb', fashion: '#db2777', home: '#16a34a', sports: '#f59e0b', beauty: '#9333ea', wines: '#dc2626',
};
const COMPLIANCE = ['dian', 'habeasData', 'retracto', 'pci'] as const;

export default function AdminView() {
  const t = useTranslations('demoEcommerce2');
  const { state, clock, productName, notify, restock, reviewRisk } = useStore();
  const [period, setPeriod] = useState<Period>(30);
  const [preview, setPreview] = useState<AutomationId | null>(null);

  const orders = useMemo(() => inWindow(state.orders, clock, 0, period * DAY), [state.orders, clock, period]);
  const kpis = useMemo(() => computeKpis(orders), [orders]);
  const series = useMemo(() => dailySeries(state.orders, clock, period), [state.orders, clock, period]);
  const products = useMemo(() => salesByProduct(orders, state.products), [orders, state.products]);
  const categories = useMemo(() => salesByCategory(products), [products]);
  const cities = useMemo(() => salesByCity(orders).slice(0, 6), [orders]);
  const methods = useMemo(() => ordersByMethod(orders), [orders]);
  const insights = useMemo(() => computeInsights(state.orders, state.products, clock), [state.orders, state.products, clock]);
  const risk = useMemo(() => riskQueue(state.orders, state.products, clock), [state.orders, state.products, clock]);
  const demoOrders = orders.filter((o) => o.demo);

  function exportProducts() {
    const rows: Array<Array<string | number>> = [[t('csv.sku'), t('csv.product'), t('csv.category'), t('csv.units'), t('csv.netSales'), t('csv.stock'), t('csv.coverageDays')]];
    products.forEach((r) => {
      const stock = totalStock(r.product);
      const days = coverageDays(stock, period === 30 ? r.units : (r.units / 7) * 30);
      rows.push([r.product.sku, productName(r.product), t(`categories.${r.product.category}`), r.units, Math.round(r.sales), stock, days === null ? '' : Math.floor(days)]);
    });
    downloadBlob(`ventas-por-producto-${period}d.csv`, toCsv(rows), 'text/csv;charset=utf-8');
    notify(t('toasts.csvDownloaded', { n: products.length }));
  }

  function exportDaily() {
    const now = Date.now();
    const rows: Array<Array<string | number>> = [[t('csv.date'), t('csv.orders'), t('csv.netSales')]];
    series.forEach((d) => rows.push([localStamp(now - d.daysAgo * DAY * 60000).slice(0, 10), d.orders, Math.round(d.sales)]));
    downloadBlob(`ventas-por-dia-${period}d.csv`, toCsv(rows), 'text/csv;charset=utf-8');
    notify(t('toasts.csvDownloaded', { n: series.length }));
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white sm:text-3xl">{t('admin.title')}</h1>
          <p className="text-sm text-secondary-500">{t('admin.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-secondary-300 p-0.5 dark:border-secondary-700" role="group" aria-label={t('admin.period')}>
            {([7, 30] as Period[]).map((p) => (
              <button key={p} type="button" aria-pressed={period === p} onClick={() => setPeriod(p)} className={`rounded-md px-3 py-1 text-sm font-medium ${period === p ? 'bg-primary-600 text-white' : 'text-secondary-700 dark:text-secondary-300'}`}>
                {t('admin.periods', { n: p })}
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={exportProducts} className="flex items-center gap-1"><ArrowDownTrayIcon className="h-4 w-4" />{t('admin.exportProducts')}</Button>
          <Button size="sm" variant="outline" onClick={exportDaily} className="flex items-center gap-1"><ArrowDownTrayIcon className="h-4 w-4" />{t('admin.exportDaily')}</Button>
        </div>
      </header>

      {demoOrders.length > 0 && (
        <div className="rounded-lg border border-primary-200 bg-primary-50 p-3 text-sm text-primary-800 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-200">
          {t('admin.includesYours', { n: demoOrders.length, total: formatPrice(demoOrders.reduce((s, o) => s + o.net, 0)) })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <BigKpi label={t('admin.kpis.sales')} value={formatMillions(kpis.sales)} title={formatPrice(kpis.sales)} icon={<CurrencyDollarIcon className="h-5 w-5" />} />
        <BigKpi label={t('admin.kpis.orders')} value={formatNumber(kpis.orders)} icon={<ShoppingBagIcon className="h-5 w-5" />} />
        <BigKpi label={t('admin.kpis.ticket')} value={formatPrice(kpis.ticket)} icon={<ArrowTrendingUpIcon className="h-5 w-5" />} />
        <BigKpi label={t('admin.kpis.customers')} value={formatNumber(kpis.customers)} icon={<UsersIcon className="h-5 w-5" />} />
        <BigKpi label={t('admin.kpis.repeat')} value={`${formatDecimal(kpis.repeatRate)} %`} icon={<ArrowPathIcon className="h-5 w-5" />} />
        <BigKpi label={t('admin.kpis.units')} value={formatNumber(kpis.units)} icon={<CubeIcon className="h-5 w-5" />} />
      </div>
      <SampleNote>{t('admin.kpis.hint')}</SampleNote>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card variant="bordered" padding="md" className="lg:col-span-2">
          <CardContent>
            <h2 className="mb-4 text-lg font-bold text-secondary-900 dark:text-white">{t('admin.charts.daily', { n: period })}</h2>
            <BarChart data={series} />
          </CardContent>
        </Card>
        <Card variant="bordered" padding="md">
          <CardContent>
            <h2 className="mb-4 text-lg font-bold text-secondary-900 dark:text-white">{t('admin.charts.categories')}</h2>
            <DonutChart data={categories.map((c) => ({ key: c.key, pct: c.pct, color: CATEGORY_COLORS[c.key] }))} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card variant="bordered" padding="md">
          <CardContent>
            <h2 className="mb-4 text-lg font-bold text-secondary-900 dark:text-white">{t('admin.charts.cities')}</h2>
            <BarList rows={cities.map((c) => ({ key: c.cityId, label: CITY_BY_ID[c.cityId]?.name ?? c.cityId, value: c.sales, display: formatMillions(c.sales) }))} />
          </CardContent>
        </Card>
        <Card variant="bordered" padding="md">
          <CardContent>
            <h2 className="mb-4 text-lg font-bold text-secondary-900 dark:text-white">{t('admin.charts.methods')}</h2>
            <BarList rows={methods.map((m) => ({ key: m.method, label: t(`paymentMethods.${m.method}`), value: m.orders, display: `${formatDecimal(m.pct)} %` }))} />
          </CardContent>
        </Card>
        <Card variant="bordered" padding="md">
          <CardContent>
            <h2 className="mb-4 text-lg font-bold text-secondary-900 dark:text-white">{t('admin.charts.topProducts')}</h2>
            <ol className="space-y-2 text-sm">
              {products.slice(0, 6).map((r, i) => (
                <li key={r.product.id} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-secondary-700 dark:text-secondary-300">{i + 1}. {productName(r.product)}</span>
                  <span className="shrink-0 font-semibold text-secondary-900 dark:text-white">{t('admin.unitsShort', { n: formatNumber(r.units) })}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <section>
        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-secondary-900 dark:text-white">
          <LightBulbIcon className="h-5 w-5 text-primary-600" />
          {t('admin.insights.title')}
        </h2>
        <div className="mb-4"><SampleNote>{t('admin.insights.hint')}</SampleNote></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {insights.map((i) => (
            <InsightCard
              key={i.kind}
              insight={i}
              onRestock={(id) => {
                restock(id, 30, 'bog');
                notify(t('toasts.restocked', { n: 30, name: productName(state.products.find((p) => p.id === id)), warehouse: t('warehouses.bog') }));
              }}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-secondary-900 dark:text-white">
          <EnvelopeIcon className="h-5 w-5 text-primary-600" />
          {t('admin.marketing.title')}
        </h2>
        <div className="mb-4"><SampleNote>{t('admin.marketing.hint')}</SampleNote></div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {AUTOMATION_IDS.map((id) => (
            <AutomationCard key={id} id={id} onPreview={() => setPreview(id)} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card variant="bordered" padding="md">
          <CardContent>
            <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-secondary-900 dark:text-white">
              <ShieldCheckIcon className="h-5 w-5 text-primary-600" />
              {t('admin.risk.title')}
            </h2>
            <div className="mb-3"><SampleNote>{t('admin.risk.hint', { cod: formatPrice(COD_LIMIT), first: formatPrice(FIRST_ORDER_LIMIT) })}</SampleNote></div>
            {risk.length === 0 ? (
              <p className="py-4 text-sm text-secondary-500">{t('admin.risk.empty')}</p>
            ) : (
              <ul className="divide-y divide-secondary-100 dark:divide-secondary-800">
                {risk.map(({ order, flags }) => (
                  <li key={order.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs">{order.id}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-secondary-900 dark:text-white">{order.customer} · {formatPrice(order.total)} · {t(`paymentMethods.${order.method}`)}</p>
                    <ul className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                      {flags.map((f) => <li key={f}>• {t(`admin.risk.rules.${f}`)}</li>)}
                    </ul>
                    {order.riskReview ? (
                      <p className="mt-1 text-xs text-secondary-500">{t(`admin.risk.decided.${order.riskReview}`)}</p>
                    ) : (
                      <div className="mt-2 flex gap-3">
                        <button type="button" className="text-xs font-semibold text-green-700 hover:underline dark:text-green-400" onClick={() => { reviewRisk(order.id, 'approved'); notify(t('toasts.riskApproved', { order: order.id })); }}>{t('admin.risk.approve')}</button>
                        <button type="button" className="text-xs font-semibold text-red-600 hover:underline" onClick={() => { reviewRisk(order.id, 'rejected'); notify(t('toasts.riskRejected', { order: order.id })); }}>{t('admin.risk.reject')}</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card variant="bordered" padding="md">
          <CardContent>
            <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-secondary-900 dark:text-white">
              <ScaleIcon className="h-5 w-5 text-primary-600" />
              {t('admin.compliance.title')}
            </h2>
            <p className="mb-4 text-sm text-secondary-500">{t('admin.compliance.subtitle')}</p>
            <ul className="space-y-2 text-sm">
              {COMPLIANCE.map((c) => (
                <li key={c} className="rounded-lg bg-secondary-50 p-3 dark:bg-secondary-800">
                  <p className="font-medium text-secondary-900 dark:text-white">{t(`admin.compliance.items.${c}.title`)}</p>
                  <p className="text-xs text-secondary-500">{t(`admin.compliance.items.${c}.desc`)}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {preview && <AutomationPreview id={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function BigKpi({ label, value, icon, title }: { label: string; value: string; icon: React.ReactNode; title?: string }) {
  return (
    <Card variant="bordered" padding="sm">
      <CardContent>
        <div className="mb-1 flex items-center gap-2 text-primary-600">
          {icon}
          <span className="text-xs font-semibold uppercase tracking-wide text-secondary-500">{label}</span>
        </div>
        <p className="text-lg font-bold text-secondary-900 dark:text-white sm:text-xl" title={title}>{value}</p>
      </CardContent>
    </Card>
  );
}

function BarChart({ data }: { data: Array<{ daysAgo: number; sales: number; orders: number }> }) {
  const t = useTranslations('demoEcommerce2');
  const w = 600;
  const h = 180;
  const max = Math.max(...data.map((d) => d.sales), 1);
  const bw = w / data.length;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h + 20}`} className="h-52 w-full" role="img" aria-label={t('admin.charts.dailyAria')}>
        {data.map((d, i) => {
          const bh = (d.sales / max) * (h - 10);
          const label = d.daysAgo === 0 ? t('admin.charts.today') : t('admin.charts.daysAgo', { n: d.daysAgo });
          return (
            <g key={d.daysAgo}>
              <rect x={i * bw + bw * 0.15} y={h - bh} width={bw * 0.7} height={Math.max(bh, 1)} rx={2} className={d.daysAgo === 0 ? 'fill-primary-700' : 'fill-primary-500'}>
                <title>{`${label}: ${formatPrice(d.sales)} · ${t('admin.charts.ordersCount', { n: d.orders })}`}</title>
              </rect>
            </g>
          );
        })}
        <text x={0} y={h + 15} className="fill-secondary-500 text-[11px]">{t('admin.charts.daysAgo', { n: data.length - 1 })}</text>
        <text x={w} y={h + 15} textAnchor="end" className="fill-secondary-500 text-[11px]">{t('admin.charts.today')}</text>
      </svg>
      <SampleNote>{t('admin.charts.maxDay', { amount: formatPrice(max) })}</SampleNote>
    </div>
  );
}

function DonutChart({ data }: { data: Array<{ key: string; pct: number; color: string }> }) {
  const t = useTranslations('demoEcommerce2');
  const radius = 70;
  const circ = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 200 200" className="h-32 w-32 shrink-0" role="img" aria-label={t('admin.charts.categories')}>
        <circle cx="100" cy="100" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="22" />
        {data.map((d) => {
          const len = (d.pct / 100) * circ;
          const el = <circle key={d.key} cx="100" cy="100" r={radius} fill="none" stroke={d.color} strokeWidth="22" strokeDasharray={`${len} ${circ}`} strokeDashoffset={-offset} transform="rotate(-90 100 100)" />;
          offset += len;
          return el;
        })}
      </svg>
      <ul className="flex-1 space-y-1 text-xs">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: d.color }} />
            <span className="flex-1 text-secondary-700 dark:text-secondary-300">{t(`categories.${d.key}`)}</span>
            <span className="font-bold text-secondary-900 dark:text-white">{formatDecimal(d.pct)} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BarList({ rows }: { rows: Array<{ key: string; label: string; value: number; display: string }> }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-2 text-sm">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="mb-0.5 flex justify-between gap-2">
            <span className="truncate text-secondary-700 dark:text-secondary-300">{r.label}</span>
            <span className="shrink-0 font-semibold text-secondary-900 dark:text-white">{r.display}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary-200 dark:bg-secondary-700">
            <div className="h-full bg-primary-500" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function InsightCard({ insight, onRestock }: { insight: Insight; onRestock: (id: number) => void }) {
  const t = useTranslations('demoEcommerce2');
  const { productName } = useStore();
  const tone = {
    restock: 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200',
    pair: 'bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200',
    trend: 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200',
    wallets: 'bg-purple-50 text-purple-800 dark:bg-purple-950/30 dark:text-purple-200',
  }[insight.kind];
  let text = '';
  if (insight.kind === 'restock') text = t('admin.insights.restock', { name: productName(insight.product), days: formatDecimal(insight.days), stock: insight.stock });
  if (insight.kind === 'pair') text = t('admin.insights.pair', { a: productName(insight.a), b: productName(insight.b), pct: Math.round(insight.pct), n: insight.count });
  if (insight.kind === 'trend') text = t(insight.pct >= 0 ? 'admin.insights.trendUp' : 'admin.insights.trendDown', { category: t(`categories.${insight.category}`), pct: formatDecimal(Math.abs(insight.pct)) });
  if (insight.kind === 'wallets') text = t('admin.insights.wallets', { pct: formatDecimal(insight.pct) });
  return (
    <div className={`flex flex-col justify-between gap-3 rounded-xl p-4 ${tone}`}>
      <div>
        <p className="mb-1 text-xs font-bold uppercase opacity-80">{t(`admin.insights.kinds.${insight.kind}`)}</p>
        <p className="text-sm font-medium">{text}</p>
      </div>
      {insight.kind === 'restock' && (
        <button type="button" onClick={() => onRestock(insight.product.id)} className="self-start text-xs font-semibold underline">
          {t('admin.insights.restockAction')}
        </button>
      )}
    </div>
  );
}

function AutomationCard({ id, onPreview }: { id: AutomationId; onPreview: () => void }) {
  const t = useTranslations('demoEcommerce2');
  const { state, clock, toggleAutomation } = useStore();
  const audience = useMemo(() => automationAudience(id, state.orders, clock), [id, state.orders, clock]);
  const active = state.automations[id];
  const title = t(`admin.marketing.automations.${id}.title`);
  return (
    <Card variant="bordered" padding="md">
      <CardContent>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="font-bold text-secondary-900 dark:text-white">{title}</p>
          <Toggle checked={active} onChange={toggleAutomation.bind(null, id)} label={t('admin.marketing.toggle', { name: title })} />
        </div>
        <p className="mb-3 text-xs text-secondary-500">{t(`admin.marketing.automations.${id}.desc`)}</p>
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-secondary-500">{t('admin.marketing.audience')}</span>
          <span className="font-bold text-secondary-900 dark:text-white">{t('admin.marketing.customers', { n: audience.length })}</span>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant={active ? 'success' : 'default'} size="sm">{active ? t('admin.marketing.active') : t('admin.marketing.paused')}</Badge>
          <button type="button" onClick={onPreview} className="text-xs font-semibold text-primary-600 hover:underline">{t('admin.marketing.preview')}</button>
        </div>
      </CardContent>
    </Card>
  );
}

function AutomationPreview({ id, onClose }: { id: AutomationId; onClose: () => void }) {
  const t = useTranslations('demoEcommerce2');
  const { state, clock, productName, productById } = useStore();
  const audience = automationAudience(id, state.orders, clock);
  const first = audience[0];
  const lastOrder = first
    ? state.orders.filter((o) => o.customerId === first.customerId).sort((a, b) => orderAge(a, clock) - orderAge(b, clock))[0]
    : undefined;
  const product = lastOrder ? productName(productById.get(lastOrder.lines[0].productId)) : '';
  const name = first ? first.customer.split(' ')[0] : t('admin.marketing.sampleName');
  return (
    <Modal title={t('admin.marketing.previewTitle', { name: t(`admin.marketing.automations.${id}.title`) })} onClose={onClose} footer={<Button variant="outline" onClick={onClose}>{t('common.close')}</Button>}>
      <p className="mb-2 text-xs text-secondary-500">{t('admin.marketing.subjectLabel')}</p>
      <p className="mb-4 font-semibold text-secondary-900 dark:text-white">{t(`admin.marketing.automations.${id}.subject`, { name })}</p>
      <p className="mb-2 text-xs text-secondary-500">{t('admin.marketing.bodyLabel')}</p>
      <p className="whitespace-pre-line rounded-lg bg-secondary-50 p-4 text-sm text-secondary-800 dark:bg-secondary-800 dark:text-secondary-100">
        {t(`admin.marketing.automations.${id}.body`, { name, product, order: lastOrder?.id ?? '' })}
      </p>
      <div className="mt-3">
        <SampleNote>{t('admin.marketing.previewNote', { n: audience.length })}</SampleNote>
      </div>
    </Modal>
  );
}
