'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { CheckCircleIcon, ChartBarSquareIcon, ShoppingBagIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { PhoneFrame, Kpi, fmt } from './shared';

interface Order {
  id: string;
  items: number;
  total: number;
  timer: number;
  status: 'pending' | 'accepted' | 'rejected';
}

export default function MerchantApp() {
  const t = useTranslations('demoDelivery');
  const [orders, setOrders] = useState<Order[]>([
    { id: 'A1024', items: 3, total: 34.5, timer: 45, status: 'pending' },
    { id: 'A1025', items: 5, total: 58, timer: 32, status: 'pending' },
    { id: 'A1026', items: 2, total: 21, timer: 18, status: 'pending' },
  ]);
  const [stock, setStock] = useState<Record<string, { qty: number; out: boolean }>>({
    philly: { qty: 12, out: false },
    spicy: { qty: 8, out: false },
    tempura: { qty: 0, out: true },
    edamame: { qty: 25, out: false },
  });

  useEffect(() => {
    const id = setInterval(() => {
      setOrders((prev) => prev.map((o) => (o.status === 'pending' && o.timer > 0 ? { ...o, timer: o.timer - 1 } : o)));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const act = (id: string, status: 'accepted' | 'rejected') =>
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  const toggleOut = (k: string) => setStock((s) => ({ ...s, [k]: { ...s[k], out: !s[k].out } }));

  const top = [
    { name: t('merchant.items.philly'), n: 124 },
    { name: t('merchant.items.spicy'), n: 98 },
    { name: t('merchant.items.tempura'), n: 71 },
  ];
  const bars = [3, 6, 4, 8, 12, 18, 14, 7];

  return (
    <PhoneFrame label="Merchant">
      <div className="p-4 space-y-4">
        <div>
          <h2 className="text-lg font-bold">{t('merchant.header')}</h2>
          <Badge variant="success" size="sm">
            <CheckCircleIcon className="h-3 w-3 mr-1" />{t('merchant.openLabel')}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Kpi title={t('merchant.kpis.salesToday')} value="$1,284" icon={CurrencyDollarIcon} color="text-emerald-500" />
          <Kpi title={t('merchant.kpis.aov')} value="$28.40" icon={ChartBarSquareIcon} color="text-sky-500" />
          <Kpi title={t('merchant.kpis.orders')} value="45" icon={ShoppingBagIcon} color="text-primary-500" />
          <Kpi title={t('merchant.kpis.peakHour')} value="20:00" icon={ClockIcon} color="text-amber-500" />
        </div>

        <Card padding="sm" variant="bordered">
          <h3 className="text-sm font-semibold mb-2">{t('merchant.incoming.title')}</h3>
          <div className="space-y-2">
            {orders.map((o) => (
              <div key={o.id} className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">#{o.id}</span>
                  {o.status === 'pending' && <Badge variant="warning" size="sm">{t('merchant.incoming.timer', { s: o.timer })}</Badge>}
                  {o.status === 'accepted' && <Badge variant="success" size="sm">OK</Badge>}
                  {o.status === 'rejected' && <Badge variant="danger" size="sm">X</Badge>}
                </div>
                <p className="text-secondary-500 dark:text-secondary-400 mt-0.5">
                  {t('merchant.incoming.items', { n: o.items, total: fmt(o.total) })}
                </p>
                <p className="text-secondary-500 dark:text-secondary-400">
                  {t('merchant.incoming.prepTime', { min: 12 })}
                </p>
                {o.status === 'pending' && (
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" fullWidth onClick={() => act(o.id, 'rejected')}>
                      {t('common.reject')}
                    </Button>
                    <Button size="sm" fullWidth onClick={() => act(o.id, 'accepted')}>
                      {t('common.accept')}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card padding="sm" variant="bordered">
          <h3 className="text-sm font-semibold mb-2">{t('merchant.menu.title')}</h3>
          <div className="space-y-1.5">
            {Object.keys(stock).map((k) => (
              <div key={k} className="flex items-center justify-between text-xs rounded-lg bg-secondary-50 dark:bg-secondary-900 px-2 py-1.5">
                <div>
                  <div className="font-semibold">{t(`merchant.items.${k}` as any)}</div>
                  <div className="text-secondary-500 dark:text-secondary-400">
                    {stock[k].out ? t('merchant.menu.outOfStock') : t('merchant.menu.stock', { n: stock[k].qty })}
                  </div>
                </div>
                <button onClick={() => toggleOut(k)} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${stock[k].out ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                  {stock[k].out ? t('merchant.menu.markIn') : t('merchant.menu.markOut')}
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="sm" variant="bordered">
          <h3 className="text-sm font-semibold mb-2">{t('merchant.analytics.title')}</h3>
          <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-1">{t('merchant.analytics.topSellers')}</p>
          <div className="space-y-1">
            {top.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-24 truncate">{s.name}</span>
                <div className="flex-1 h-2 rounded-full bg-secondary-100 dark:bg-secondary-800 overflow-hidden">
                  <div className="h-full bg-primary-500" style={{ width: `${(s.n / 124) * 100}%` }} />
                </div>
                <span className="font-semibold w-8 text-right">{s.n}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-3 mb-1">{t('merchant.analytics.salesTrend')}</p>
          <div className="flex items-end gap-1 h-16">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 bg-gradient-to-t from-primary-600 to-purple-500 rounded-t" style={{ height: `${(h / 18) * 100}%` }} />
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 text-xs">
            <span>{t('merchant.analytics.ratingsAvg')}</span>
            <span className="font-bold text-amber-500 inline-flex items-center gap-1">
              <StarSolid className="h-3 w-3" /> 4.8
            </span>
          </div>
        </Card>
      </div>
    </PhoneFrame>
  );
}
