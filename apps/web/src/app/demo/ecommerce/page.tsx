'use client';

import { useTranslations } from 'next-intl';
import {
  ShoppingBagIcon,
  CreditCardIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { CartProvider, useCart, ViewId } from './components/shared';
import StorefrontView from './components/StorefrontView';
import CheckoutView from './components/CheckoutView';
import VendorView from './components/VendorView';
import OperationsView from './components/OperationsView';
import AdminView from './components/AdminView';

interface ViewMeta {
  id: ViewId;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const VIEWS: ViewMeta[] = [
  { id: 'storefront',  labelKey: 'views.storefront',  icon: ShoppingBagIcon },
  { id: 'checkout',    labelKey: 'views.checkout',    icon: CreditCardIcon },
  { id: 'vendor',      labelKey: 'views.vendor',      icon: BuildingStorefrontIcon },
  { id: 'operations',  labelKey: 'views.operations',  icon: TruckIcon },
  { id: 'admin',       labelKey: 'views.admin',       icon: ChartBarIcon },
];

export default function EcommerceDemoPage() {
  return (
    <CartProvider>
      <ViewShell />
    </CartProvider>
  );
}

function ViewShell() {
  const t = useTranslations('demoEcommerce2');
  const { view, setView, itemCount } = useCart();

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      {/* Sticky view selector */}
      <nav
        className="sticky top-16 md:top-20 z-40 bg-white/95 dark:bg-secondary-900/95 backdrop-blur border-b border-secondary-200 dark:border-secondary-800 shadow-sm"
        aria-label={t('viewSelector')}
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto py-3 -mx-2 px-2">
            {VIEWS.map((v) => {
              const Icon = v.icon;
              const active = view === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setView(v.id)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-all ${
                    active
                      ? 'bg-primary-600 text-white shadow'
                      : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                  }`}
                  aria-pressed={active}
                >
                  <Icon className="h-5 w-5" />
                  <span>{t(v.labelKey)}</span>
                  {v.id === 'checkout' && itemCount > 0 && (
                    <span
                      className={`ml-1 inline-flex items-center justify-center text-xs font-bold rounded-full h-5 min-w-[20px] px-1 ${
                        active ? 'bg-white text-primary-600' : 'bg-primary-600 text-white'
                      }`}
                    >
                      {itemCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="py-6 sm:py-8 animate-fade-in" key={view}>
        {view === 'storefront' && <StorefrontView />}
        {view === 'checkout' && <CheckoutView />}
        {view === 'vendor' && <VendorView />}
        {view === 'operations' && <OperationsView />}
        {view === 'admin' && <AdminView />}
      </main>
    </div>
  );
}
