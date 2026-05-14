'use client';

import { useTranslations } from 'next-intl';
import {
  CurrencyDollarIcon, UsersIcon, ShoppingBagIcon, ArrowTrendingUpIcon,
  ChartBarIcon, SparklesIcon, ShieldCheckIcon, EnvelopeIcon,
} from '@heroicons/react/24/outline';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { formatPrice } from './shared';

const SALES_30D = [
  35, 42, 38, 50, 46, 55, 60, 58, 62, 70, 68, 72, 80, 76, 84, 88, 92, 90, 95, 100, 98, 105, 110, 108, 115, 120, 118, 125, 130, 134,
];

const CATEGORIES_SHARE = [
  { key: 'tech',    pct: 38, color: '#2563eb' },
  { key: 'fashion', pct: 24, color: '#db2777' },
  { key: 'home',    pct: 16, color: '#16a34a' },
  { key: 'sports',  pct: 11, color: '#f59e0b' },
  { key: 'beauty',  pct: 7,  color: '#9333ea' },
  { key: 'wines',   pct: 4,  color: '#dc2626' },
];

const AI_INSIGHTS = [
  { id: 'i1', toneKey: 'down',    accentClass: 'bg-red-50    dark:bg-red-950/30    text-red-700    dark:text-red-300'    },
  { id: 'i2', toneKey: 'up',      accentClass: 'bg-green-50  dark:bg-green-950/30  text-green-700  dark:text-green-300'  },
  { id: 'i3', toneKey: 'insight', accentClass: 'bg-blue-50   dark:bg-blue-950/30   text-blue-700   dark:text-blue-300'   },
  { id: 'i4', toneKey: 'warn',    accentClass: 'bg-amber-50  dark:bg-amber-950/30  text-amber-700  dark:text-amber-300'  },
];

const MARKETING_CAMPAIGNS = [
  { id: 'abandonment',   icon: '🛒' },
  { id: 'postPurchase',  icon: '📦' },
  { id: 'winBack',       icon: '🎯' },
  { id: 'replenishment', icon: '🔁' },
];

const COMPLIANCE = ['PCI DSS', 'GDPR', 'DIAN', 'Habeas Data CO', 'ISO 27001'];

export default function AdminView() {
  const t = useTranslations('demoEcommerce2');
  const revenue = 384720, gmv = 512430, customers = 12480;
  const aov = revenue / 1240, ltv = 489, cac = 38;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-white">{t('admin.title')}</h1>
        <p className="text-sm text-secondary-500">{t('admin.subtitle')}</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <BigKpi label={t('admin.kpis.revenue')}   value={formatPrice(revenue)} icon={<CurrencyDollarIcon className="h-5 w-5" />} />
        <BigKpi label={t('admin.kpis.gmv')}       value={formatPrice(gmv)}     icon={<ShoppingBagIcon className="h-5 w-5" />} />
        <BigKpi label={t('admin.kpis.customers')} value={customers.toLocaleString()} icon={<UsersIcon className="h-5 w-5" />} />
        <BigKpi label={t('admin.kpis.aov')}       value={formatPrice(aov)}     icon={<ArrowTrendingUpIcon className="h-5 w-5" />} />
        <BigKpi label={t('admin.kpis.ltv')}       value={formatPrice(ltv)}     icon={<ChartBarIcon className="h-5 w-5" />} />
        <BigKpi label={t('admin.kpis.cac')}       value={formatPrice(cac)}     icon={<UsersIcon className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="bordered" padding="md" className="lg:col-span-2">
          <CardContent>
            <h2 className="text-lg font-bold text-secondary-900 dark:text-white mb-4">{t('admin.charts.sales30d')}</h2>
            <LineChart data={SALES_30D} />
          </CardContent>
        </Card>
        <Card variant="bordered" padding="md">
          <CardContent>
            <h2 className="text-lg font-bold text-secondary-900 dark:text-white mb-4">{t('admin.charts.topCategories')}</h2>
            <DonutChart data={CATEGORIES_SHARE} t={t} />
          </CardContent>
        </Card>
      </div>

      <section>
        <h2 className="text-lg font-bold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-primary-600" />
          {t('admin.ai.title')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {AI_INSIGHTS.map((i) => (
            <div key={i.id} className={`rounded-xl p-4 ${i.accentClass}`}>
              <p className="text-xs uppercase font-bold opacity-80 mb-1">{t(`admin.ai.tone.${i.toneKey}`)}</p>
              <p className="text-sm font-medium">{t(`admin.ai.${i.id}`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
          <EnvelopeIcon className="h-5 w-5 text-primary-600" />
          {t('admin.marketing.title')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {MARKETING_CAMPAIGNS.map((c, idx) => (
            <Card key={c.id} variant="bordered" padding="md">
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{c.icon}</span>
                  <Badge variant="success" size="sm">{t('admin.marketing.active')}</Badge>
                </div>
                <p className="font-bold text-secondary-900 dark:text-white">{t(`admin.marketing.campaigns.${c.id}.title`)}</p>
                <p className="text-xs text-secondary-500 mb-2">{t(`admin.marketing.campaigns.${c.id}.desc`)}</p>
                <div className="flex justify-between text-xs">
                  <span className="text-secondary-500">{t('admin.marketing.openRate')}</span>
                  <span className="font-bold text-secondary-900 dark:text-white">{32 + idx * 4}%</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="bordered" padding="md">
          <CardContent>
            <h2 className="text-lg font-bold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-primary-600" />
              {t('admin.fraud.title')}
            </h2>
            <div className="space-y-3">
              <FraudRow label={t('admin.fraud.score')}    value="12 / 100" tone="success" />
              <FraudRow label={t('admin.fraud.blocked')}  value="34"       tone="danger"  />
              <FraudRow label={t('admin.fraud.review')}   value="78"       tone="warning" />
              <FraudRow label={t('admin.fraud.approved')} value="1,432"    tone="success" />
            </div>
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-sm text-green-700 dark:text-green-300">
              ✓ {t('admin.fraud.summary')}
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered" padding="md">
          <CardContent>
            <h2 className="text-lg font-bold text-secondary-900 dark:text-white mb-4">{t('admin.compliance.title')}</h2>
            <p className="text-sm text-secondary-500 mb-4">{t('admin.compliance.subtitle')}</p>
            <div className="flex flex-wrap gap-2">
              {COMPLIANCE.map((c) => (
                <Badge key={c} variant="primary" className="font-mono">✓ {c}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BigKpi({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card variant="bordered" padding="sm">
      <CardContent>
        <div className="flex items-center gap-2 mb-1 text-primary-600">
          {icon}
          <span className="text-xs uppercase tracking-wide text-secondary-500 font-semibold">{label}</span>
        </div>
        <p className="text-xl font-bold text-secondary-900 dark:text-white">{value}</p>
      </CardContent>
    </Card>
  );
}

function LineChart({ data }: { data: number[] }) {
  const w = 600, h = 180;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 20) - 10;
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-44">
      <defs>
        <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M0,${h} L${pts.join(' L')} L${w},${h} Z`} fill="url(#g)" />
      <path d={`M${pts.join(' L')}`} stroke="#2563eb" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => {
        const [x, y] = p.split(',');
        return i % 5 === 0 ? <circle key={i} cx={x} cy={y} r="3" fill="#2563eb" /> : null;
      })}
    </svg>
  );
}

function DonutChart({ data, t }: { data: Array<{ key: string; pct: number; color: string }>; t: ReturnType<typeof useTranslations> }) {
  const radius = 70;
  const circ = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 200 200" className="w-32 h-32">
        <circle cx="100" cy="100" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="22" />
        {data.map((d) => {
          const len = (d.pct / 100) * circ;
          const el = <circle key={d.key} cx="100" cy="100" r={radius} fill="none" stroke={d.color} strokeWidth="22" strokeDasharray={`${len} ${circ}`} strokeDashoffset={-offset} transform="rotate(-90 100 100)" />;
          offset += len;
          return el;
        })}
      </svg>
      <ul className="text-xs space-y-1 flex-1">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: d.color }} />
            <span className="flex-1 text-secondary-700 dark:text-secondary-300">{t(`categories.${d.key}`)}</span>
            <span className="font-bold text-secondary-900 dark:text-white">{d.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FraudRow({ label, value, tone }: { label: string; value: string; tone: 'success' | 'warning' | 'danger' }) {
  const colors = { success: 'text-green-600', warning: 'text-amber-600', danger: 'text-red-600' };
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-secondary-600 dark:text-secondary-300">{label}</span>
      <span className={`text-lg font-bold ${colors[tone]}`}>{value}</span>
    </div>
  );
}
