'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Badge from '@/components/ui/Badge';
import { ShoppingBagIcon, TruckIcon, BuildingStorefrontIcon, ChartBarSquareIcon, BoltIcon } from '@heroicons/react/24/outline';
import CustomerApp from './components/CustomerApp';
import DriverApp from './components/DriverApp';
import MerchantApp from './components/MerchantApp';
import OpsApp from './components/OpsApp';

type AppTab = 'customer' | 'driver' | 'merchant' | 'ops';

export default function DeliveryDemoPage() {
  const t = useTranslations('demoDelivery');
  const [tab, setTab] = useState<AppTab>('customer');

  const tabs: { key: AppTab; icon: any }[] = [
    { key: 'customer', icon: ShoppingBagIcon },
    { key: 'driver', icon: TruckIcon },
    { key: 'merchant', icon: BuildingStorefrontIcon },
    { key: 'ops', icon: ChartBarSquareIcon },
  ];

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 text-secondary-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <section className="mb-6 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 md:p-8 shadow-lg">
          <Badge size="sm" className="mb-3 !bg-white/20 !text-white !border-0 backdrop-blur">
            <BoltIcon className="h-3 w-3 mr-1" />
            {t('meta.demo')}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t('meta.title')}</h1>
          <p className="text-lg text-orange-50/90 max-w-3xl mt-2">
            {t('meta.subtitle')}
          </p>
        </section>

        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                tab === key
                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-l-4 border-orange-500 shadow-sm'
                  : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-200 border border-secondary-200 dark:border-secondary-700 hover:border-orange-400'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t(`tabs.${key}` as any)}
            </button>
          ))}
        </div>

        <div>
          {tab === 'customer' && <CustomerApp />}
          {tab === 'driver' && <DriverApp />}
          {tab === 'merchant' && <MerchantApp />}
          {tab === 'ops' && <OpsApp />}
        </div>
      </div>
    </div>
  );
}
