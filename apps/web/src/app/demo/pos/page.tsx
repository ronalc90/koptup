'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  MagnifyingGlassIcon,
  QrCodeIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  UserPlusIcon,
  TagIcon,
  FireIcon,
  ShoppingBagIcon,
  ComputerDesktopIcon,
  BuildingStorefrontIcon,
  SparklesIcon,
  PrinterIcon,
  WifiIcon,
  ScaleIcon,
  CreditCardIcon,
  ArchiveBoxIcon,
  BoltIcon,
  XMarkIcon,
  ArrowPathIcon,
  ChartBarIcon,
  UsersIcon,
  TableCellsIcon,
  CurrencyDollarIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import {
  CheckoutModal,
  ModifiersModal,
  ReceiptModal,
  type Payment,
  type ModifiersValue,
} from './components/PosModals';
import {
  TablesPanel,
  KdsPanel,
  ReportsPanel,
  EmployeesPanel,
  type TableInfo,
  type KdsOrder,
  type Employee,
} from './components/PosTabs';

type Category = 'drinks' | 'food' | 'snacks' | 'desserts';
type Mode = 'restaurant' | 'retail' | 'selfcheckout' | 'kiosk';
type Tab = 'sale' | 'tables' | 'kds' | 'reports' | 'employees';

interface Product {
  id: number;
  name: string;
  price: number;
  category: Category;
  emoji: string;
  stock: number;
  happyHour?: boolean;
  combo?: boolean;
}
interface TicketLine {
  uid: string;
  product: Product;
  qty: number;
  unitPrice: number;
  modifiers?: ModifiersValue;
}
interface Customer {
  id: string;
  name: string;
  phone: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold';
}

const CATEGORIES: Category[] = ['drinks', 'food', 'snacks', 'desserts'];
const PRODUCTS: Product[] = [
  { id: 1, name: 'Cappuccino', price: 8500, category: 'drinks', emoji: '☕', stock: 80, happyHour: true },
  { id: 2, name: 'Latte', price: 9500, category: 'drinks', emoji: '🥛', stock: 60 },
  { id: 3, name: 'Limonada de coco', price: 12000, category: 'drinks', emoji: '🍋', stock: 45 },
  { id: 4, name: 'Cerveza artesanal', price: 14000, category: 'drinks', emoji: '🍺', stock: 8, happyHour: true },
  { id: 5, name: 'Hamburguesa BBQ', price: 28000, category: 'food', emoji: '🍔', stock: 25, combo: true },
  { id: 6, name: 'Pizza Margherita', price: 32000, category: 'food', emoji: '🍕', stock: 18, combo: true },
  { id: 7, name: 'Ensalada César', price: 22000, category: 'food', emoji: '🥗', stock: 30 },
  { id: 8, name: 'Pasta Alfredo', price: 26000, category: 'food', emoji: '🍝', stock: 22 },
  { id: 9, name: 'Tacos al pastor', price: 24000, category: 'food', emoji: '🌮', stock: 35 },
  { id: 10, name: 'Papas fritas', price: 9000, category: 'snacks', emoji: '🍟', stock: 90 },
  { id: 11, name: 'Nachos', price: 14000, category: 'snacks', emoji: '🌽', stock: 40 },
  { id: 12, name: 'Alitas BBQ', price: 19000, category: 'snacks', emoji: '🍗', stock: 28, combo: true },
  { id: 13, name: 'Cheesecake', price: 11000, category: 'desserts', emoji: '🍰', stock: 12 },
  { id: 14, name: 'Brownie con helado', price: 13000, category: 'desserts', emoji: '🍫', stock: 16 },
  { id: 15, name: 'Tiramisú', price: 12500, category: 'desserts', emoji: '🍮', stock: 9 },
  { id: 16, name: 'Helado artesanal', price: 8500, category: 'desserts', emoji: '🍦', stock: 50 },
];
const CUSTOMERS: Customer[] = [
  { id: '1010', name: 'María López', phone: '3001234567', points: 1240, tier: 'gold' },
  { id: '2020', name: 'Carlos Pérez', phone: '3157654321', points: 380, tier: 'silver' },
  { id: '3030', name: 'Laura Gómez', phone: '3204445566', points: 90, tier: 'bronze' },
];

const TAX_RATE = 0.19;

export default function PosDemoPage() {
  const t = useTranslations('demoPos');

  // top-level
  const [mode, setMode] = useState<Mode>('restaurant');
  const [tab, setTab] = useState<Tab>('sale');
  const [currency, setCurrency] = useState<'COP' | 'USD' | 'MXN'>('COP');
  const [offline, setOffline] = useState(false);
  const [store, setStore] = useState<'main' | 'north' | 'airport'>('main');

  // catalog
  const [cat, setCat] = useState<Category | 'all'>('all');
  const [query, setQuery] = useState('');

  // ticket
  const [lines, setLines] = useState<TicketLine[]>([]);
  const [discountPct, setDiscountPct] = useState(0);
  const [tipPct, setTipPct] = useState(10);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activeTable, setActiveTable] = useState<number | null>(1);
  const [toast, setToast] = useState<string | null>(null);

  // modals
  const [modifierFor, setModifierFor] = useState<Product | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receipt, setReceipt] = useState<{ no: string; pays: Payment[] } | null>(null);
  const [loyaltyQ, setLoyaltyQ] = useState('');
  const [loyaltyMsg, setLoyaltyMsg] = useState<string | null>(null);
  const [cashModal, setCashModal] = useState<null | 'open' | 'close'>(null);
  const [countedCash, setCountedCash] = useState('');

  // tables / kds / employees
  const [tables, setTables] = useState<TableInfo[]>([
    { id: 1, seats: 4, status: 'busy', waiter: 'ana' },
    { id: 2, seats: 2, status: 'free' },
    { id: 3, seats: 6, status: 'bill', waiter: 'luis' },
    { id: 4, seats: 4, status: 'busy', waiter: 'sofia' },
    { id: 5, seats: 2, status: 'free' },
    { id: 6, seats: 8, status: 'free' },
    { id: 7, seats: 4, status: 'busy', waiter: 'diego' },
    { id: 8, seats: 2, status: 'bill', waiter: 'ana' },
  ]);
  const [kds, setKds] = useState<KdsOrder[]>([
    { id: 101, table: 1, lines: ['1× Hamburguesa BBQ', '1× Papas fritas'], createdAt: Date.now() - 8 * 60_000, status: 'cooking' },
    { id: 102, table: 4, lines: ['2× Tacos al pastor', '1× Nachos'], createdAt: Date.now() - 3 * 60_000, status: 'new' },
    { id: 103, table: 7, lines: ['1× Pizza Margherita'], createdAt: Date.now() - 14 * 60_000, status: 'ready' },
  ]);
  const [employees, setEmployees] = useState<Employee[]>([
    { id: 1, name: 'Ana Martínez', role: 'Mesera', clockedIn: true, hours: 5.2, commission: 42000 },
    { id: 2, name: 'Luis Gómez', role: 'Barista', clockedIn: true, hours: 3.5, commission: 28000 },
    { id: 3, name: 'Sofía Pérez', role: 'Cajera', clockedIn: true, hours: 6.0, commission: 51000 },
    { id: 4, name: 'Diego Ruiz', role: 'Cocina', clockedIn: false, hours: 0, commission: 0 },
  ]);

  const hardware = [
    { key: 'printer', icon: PrinterIcon, status: 'connected' },
    { key: 'scanner', icon: QrCodeIcon, status: 'connected' },
    { key: 'reader', icon: CreditCardIcon, status: 'connected' },
    { key: 'scale', icon: ScaleIcon, status: 'disconnected' },
    { key: 'drawer', icon: ArchiveBoxIcon, status: 'connected' },
  ] as const;

  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const okCat = cat === 'all' || p.category === cat;
      const okQ = !query || p.name.toLowerCase().includes(query.toLowerCase()) || String(p.id) === query;
      return okCat && okQ;
    });
  }, [cat, query]);

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const discountAmt = Math.round(subtotal * (discountPct / 100));
  const taxable = subtotal - discountAmt;
  const tax = Math.round(taxable * TAX_RATE);
  const total = taxable + tax;
  const earnPts = Math.round(total / 1000);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 1500);
  };

  const addProduct = (p: Product, mods?: ModifiersValue, deltaPrice = 0) => {
    const price = p.happyHour ? Math.round(p.price * 0.8) : p.price;
    const unit = price + deltaPrice;
    const uid = `${p.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setLines((prev) => {
      if (!mods) {
        const existing = prev.find((l) => l.product.id === p.id && !l.modifiers);
        if (existing) return prev.map((l) => (l === existing ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { uid, product: p, qty: 1, unitPrice: unit, modifiers: mods }];
    });
    showToast(t('products.addedToast', { name: p.name }));
  };

  const onProductClick = (p: Product) => {
    if (p.category === 'food') setModifierFor(p);
    else addProduct(p);
  };

  const updateQty = (uid: string, delta: number) =>
    setLines((prev) =>
      prev.map((l) => (l.uid === uid ? { ...l, qty: l.qty + delta } : l)).filter((l) => l.qty > 0)
    );
  const removeLine = (uid: string) => setLines((prev) => prev.filter((l) => l.uid !== uid));
  const clearTicket = () => {
    setLines([]);
    setDiscountPct(0);
    setCustomer(null);
  };

  const lookupCustomer = () => {
    const found = CUSTOMERS.find((c) => c.id === loyaltyQ || c.phone === loyaltyQ);
    if (found) {
      setCustomer(found);
      setLoyaltyMsg(null);
    } else setLoyaltyMsg(t('loyalty.notFound'));
  };
  const redeem = () => {
    if (!customer) return;
    const pct = customer.tier === 'gold' ? 15 : customer.tier === 'silver' ? 10 : 5;
    setDiscountPct(pct);
    showToast(`-${pct}%`);
  };

  const startCheckout = () => {
    if (lines.length === 0) return;
    setCheckoutOpen(true);
  };
  const onPaymentApproved = (pays: Payment[]) => {
    const no = String(Math.floor(1000 + Math.random() * 9000));
    setReceipt({ no, pays });
    setCheckoutOpen(false);
  };
  const finishSale = () => {
    if (activeTable) {
      setTables((prev) => prev.map((tb) => (tb.id === activeTable ? { ...tb, status: 'free', waiter: undefined } : tb)));
    }
    setReceipt(null);
    clearTicket();
  };

  const sendToKitchen = () => {
    if (lines.length === 0) return;
    const id = 100 + kds.length + 1;
    setKds((p) => [
      ...p,
      { id, table: activeTable ?? 0, lines: lines.map((l) => `${l.qty}× ${l.product.name}`), createdAt: Date.now(), status: 'new' },
    ]);
    showToast('→ KDS');
  };
  const advanceKds = (id: number) =>
    setKds((prev) =>
      prev.map((o) =>
        o.id !== id ? o : o.status === 'new' ? { ...o, status: 'cooking' } : o.status === 'cooking' ? { ...o, status: 'ready' } : o
      )
    );
  const deliverKds = (id: number) => setKds((prev) => prev.filter((o) => o.id !== id));
  const punch = (id: number) =>
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, clockedIn: !e.clockedIn } : e)));

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      {/* Hero banner */}
      <section className="bg-gradient-to-br from-fuchsia-600 to-fuchsia-800 text-white">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-8 sm:py-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-sm">
              <BuildingStorefrontIcon className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t('meta.title')}</h1>
              <p className="text-lg text-fuchsia-50/90 mt-1">{t('meta.demo')}</p>
            </div>
          </div>
        </div>
      </section>
      {/* Top bar */}
      <header className="sticky top-16 md:top-20 z-40 bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-800">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 mr-auto">
            <BuildingStorefrontIcon className="h-7 w-7 text-fuchsia-600 dark:text-fuchsia-400" />
            <div>
              <h1 className="text-lg md:text-xl font-bold text-secondary-900 dark:text-white leading-tight">
                {t('meta.title')}
              </h1>
              <p className="text-[11px] text-secondary-500">{t('meta.demo')}</p>
            </div>
          </div>

          <select value={store} onChange={(e) => setStore(e.target.value as any)} className="text-sm px-2 py-1.5 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-800 dark:text-secondary-100">
            <option value="main">{t('topbar.stores.main')}</option>
            <option value="north">{t('topbar.stores.north')}</option>
            <option value="airport">{t('topbar.stores.airport')}</option>
          </select>
          <select value={currency} onChange={(e) => setCurrency(e.target.value as any)} className="text-sm px-2 py-1.5 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-800 dark:text-secondary-100">
            <option>COP</option>
            <option>USD</option>
            <option>MXN</option>
          </select>

          <button
            onClick={() => setOffline((o) => !o)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
              offline
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700 animate-pulse'
                : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700'
            }`}
          >
            <WifiIcon className="h-4 w-4" />
            {offline ? t('topbar.offlineHint', { n: 3 }) : t('topbar.online')}
          </button>

          <Badge variant="info" className="hidden md:inline-flex items-center gap-1">
            <BoltIcon className="h-3 w-3" />
            {t('topbar.shift')} · {t('topbar.shiftBy', { name: 'Sofía P.' })}
          </Badge>
        </div>

        <div className="max-w-[1400px] mx-auto px-3 sm:px-6 pb-3 flex flex-wrap items-center gap-2">
          <div className="flex gap-1 p-1 rounded-lg bg-secondary-100 dark:bg-secondary-800">
            {(['restaurant', 'retail', 'selfcheckout', 'kiosk'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition ${
                  mode === m
                    ? 'bg-white dark:bg-secondary-900 text-primary-700 dark:text-primary-300 shadow-sm'
                    : 'text-secondary-600 dark:text-secondary-400'
                }`}
              >
                {t(`modes.${m}`)}
              </button>
            ))}
          </div>

          <div className="flex gap-1 ml-auto overflow-x-auto">
            {(['sale', 'tables', 'kds', 'reports', 'employees'] as Tab[]).map((tb) => {
              const Icon =
                tb === 'sale' ? ShoppingBagIcon : tb === 'tables' ? TableCellsIcon : tb === 'kds' ? ComputerDesktopIcon : tb === 'reports' ? ChartBarIcon : UsersIcon;
              return (
                <button
                  key={tb}
                  onClick={() => setTab(tb)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                    tab === tb
                      ? 'bg-fuchsia-600 text-white'
                      : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(`tabs.${tb}`)}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {toast && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[300] bg-secondary-900 text-white text-sm px-4 py-2 rounded-full shadow-lg animate-in fade-in">
          {toast}
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-5">
        {tab === 'sale' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* LEFT: Catalog */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('topbar.searchPlaceholder')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                  <QrCodeIcon className="h-5 w-5" />
                  {t('topbar.scan')}
                </Button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {(['all', ...CATEGORIES] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                      cat === c
                        ? 'bg-primary-600 text-white'
                        : 'bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300'
                    }`}
                  >
                    {t(`categories.${c}`)}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onProductClick(p)}
                    className="group relative text-left rounded-xl bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 p-3 hover:border-primary-500 hover:shadow-md active:scale-[0.98] transition"
                  >
                    <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                      {p.happyHour && (
                        <Badge variant="warning" size="sm" className="flex items-center gap-1">
                          <FireIcon className="h-3 w-3" />
                          {t('products.happyHour')}
                        </Badge>
                      )}
                      {p.combo && <Badge variant="info" size="sm">{t('products.combo')}</Badge>}
                    </div>
                    <div className="text-4xl mb-2">{p.emoji}</div>
                    <div className="font-semibold text-sm text-secondary-900 dark:text-white line-clamp-2 mb-1">{p.name}</div>
                    <div className="flex items-center justify-between">
                      <div>
                        {p.happyHour && (
                          <div className="text-[11px] text-secondary-400 line-through">${p.price.toLocaleString()}</div>
                        )}
                        <div className="text-base font-bold text-primary-600 dark:text-primary-400">
                          ${(p.happyHour ? Math.round(p.price * 0.8) : p.price).toLocaleString()}
                        </div>
                      </div>
                      {p.stock < 15 && <Badge variant="danger" size="sm">{t('products.stock', { n: p.stock })}</Badge>}
                    </div>
                  </button>
                ))}
              </div>

              {/* Hardware + cash */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card variant="bordered" padding="sm">
                  <h3 className="font-semibold text-secondary-900 dark:text-white text-sm">{t('hardware.title')}</h3>
                  <p className="text-[11px] text-secondary-500 mb-2">{t('hardware.subtitle')}</p>
                  <ul className="space-y-1.5">
                    {hardware.map((h) => {
                      const Icon = h.icon;
                      const ok = h.status === 'connected';
                      return (
                        <li key={h.key} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-secondary-700 dark:text-secondary-300">
                            <Icon className="h-4 w-4" />
                            {t(`hardware.${h.key}`)}
                          </span>
                          {ok ? (
                            <Badge variant="success" size="sm">{t('hardware.connected')}</Badge>
                          ) : (
                            <button className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <ArrowPathIcon className="h-3 w-3" />
                              {t('hardware.reconnect')}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </Card>

                <Card variant="bordered" padding="sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-secondary-900 dark:text-white text-sm">{t('cash.title')}</h3>
                      <p className="text-[11px] text-secondary-500">{t('topbar.shiftBy', { name: 'Sofía P.' })}</p>
                    </div>
                    <CurrencyDollarIcon className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" onClick={() => setCashModal('open')}>{t('cash.open')}</Button>
                    <Button size="sm" variant="outline" onClick={() => setCashModal('close')}>{t('cash.close')}</Button>
                  </div>
                  <p className="text-[11px] text-secondary-500 mt-2">
                    {t('cash.expected')}: <span className="font-semibold text-secondary-800 dark:text-secondary-200">$720.000</span>
                  </p>
                </Card>
              </div>
            </div>

            {/* RIGHT: Ticket */}
            <div className="lg:col-span-4">
              <Card variant="elevated" padding="none" className="sticky top-44 flex flex-col max-h-[calc(100vh-180px)]">
                <div className="p-4 border-b border-secondary-200 dark:border-secondary-800">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-bold text-secondary-900 dark:text-white">{t('ticket.title')}</h2>
                    {lines.length > 0 && (
                      <button onClick={clearTicket} className="text-xs text-red-600 hover:underline">{t('ticket.clear')}</button>
                    )}
                  </div>
                  {mode === 'restaurant' && activeTable && (
                    <p className="text-xs text-secondary-500">
                      {t('ticket.table', { n: activeTable })} · {t('ticket.waiter', { name: t('tables.waiters.ana') })}
                    </p>
                  )}
                </div>

                {/* Loyalty */}
                <div className="p-3 border-b border-secondary-200 dark:border-secondary-800 bg-secondary-50/60 dark:bg-secondary-800/30">
                  {customer ? (
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-semibold text-secondary-900 dark:text-white flex items-center gap-1">
                          <StarIcon className="h-4 w-4 text-yellow-500" />
                          {customer.name}
                        </div>
                        <div className="text-[11px] text-secondary-500">
                          {customer.points} pts · {t(`loyalty.tiers.${customer.tier}`)}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={redeem} className="text-xs px-2 py-1 rounded bg-primary-600 text-white">
                          {t('loyalty.redeem', { points: 200, amount: '-' + (customer.tier === 'gold' ? 15 : 10) + '%' })}
                        </button>
                        <button onClick={() => setCustomer(null)} className="text-xs text-secondary-500">
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <UserPlusIcon className="h-4 w-4 text-secondary-500" />
                        <input
                          value={loyaltyQ}
                          onChange={(e) => setLoyaltyQ(e.target.value)}
                          placeholder={t('loyalty.lookupPlaceholder')}
                          className="flex-1 text-sm px-2 py-1.5 rounded border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white"
                        />
                        <Button size="sm" variant="outline" onClick={lookupCustomer}>{t('loyalty.search')}</Button>
                      </div>
                      {loyaltyMsg && <p className="text-[11px] text-red-600">{loyaltyMsg}</p>}
                    </div>
                  )}
                </div>

                {/* Lines */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {lines.length === 0 ? (
                    <div className="text-center py-10 text-sm text-secondary-500">
                      <ShoppingBagIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      {t('ticket.empty')}
                    </div>
                  ) : (
                    lines.map((l) => (
                      <div key={l.uid} className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-2.5">
                        <div className="flex items-start gap-2">
                          <span className="text-2xl">{l.product.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-semibold text-sm text-secondary-900 dark:text-white">{l.product.name}</div>
                                <div className="text-[11px] text-secondary-500">${l.unitPrice.toLocaleString()} c/u</div>
                              </div>
                              <button onClick={() => removeLine(l.uid)} className="text-red-500 p-0.5">
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                            {l.modifiers && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                <Badge size="sm" variant="secondary">{t(`modifiers.sizes.${l.modifiers.size}`)}</Badge>
                                {l.modifiers.extras.map((e) => (
                                  <Badge key={e} size="sm" variant="outline">{t(`modifiers.extrasItems.${e}`)}</Badge>
                                ))}
                                {l.modifiers.note && (
                                  <div className="text-[10px] italic text-secondary-500 w-full mt-1">&ldquo;{l.modifiers.note}&rdquo;</div>
                                )}
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-1.5">
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => updateQty(l.uid, -1)} className="p-1 rounded bg-secondary-100 dark:bg-secondary-700">
                                  <MinusIcon className="h-3.5 w-3.5" />
                                </button>
                                <span className="w-7 text-center font-semibold text-sm">{l.qty}</span>
                                <button onClick={() => updateQty(l.uid, 1)} className="p-1 rounded bg-secondary-100 dark:bg-secondary-700">
                                  <PlusIcon className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <div className="font-bold text-primary-600 dark:text-primary-400">
                                ${(l.unitPrice * l.qty).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Totals */}
                <div className="border-t border-secondary-200 dark:border-secondary-800 p-3 space-y-2 bg-secondary-50/50 dark:bg-secondary-800/30">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary-600 dark:text-secondary-400">{t('ticket.subtotal')}</span>
                    <span className="font-medium text-secondary-900 dark:text-white">${subtotal.toLocaleString()}</span>
                  </div>
                  {discountPct > 0 && (
                    <div className="flex items-center justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1">
                        <TagIcon className="h-3.5 w-3.5" />
                        {t('ticket.discount')} ({discountPct}%)
                      </span>
                      <span>-${discountAmt.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary-600 dark:text-secondary-400">{t('ticket.tax')}</span>
                    <span className="font-medium text-secondary-900 dark:text-white">${tax.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-secondary-200 dark:border-secondary-700">
                    <span className="text-base font-bold text-secondary-900 dark:text-white">{t('ticket.total')}</span>
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">${total.toLocaleString()}</span>
                  </div>
                  {customer && (
                    <p className="text-[11px] text-secondary-500">
                      <SparklesIcon className="h-3 w-3 inline mr-1" />
                      {t('loyalty.ptsEarned', { points: earnPts })}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button variant="outline" onClick={sendToKitchen} disabled={lines.length === 0}>{t('ticket.send')}</Button>
                    <Button onClick={startCheckout} disabled={lines.length === 0} size="lg">{t('ticket.pay')}</Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === 'tables' && (
          <TablesPanel
            tables={tables}
            onSelect={(id) => {
              setActiveTable(id);
              setTab('sale');
            }}
          />
        )}
        {tab === 'kds' && <KdsPanel orders={kds} onAdvance={advanceKds} onDeliver={deliverKds} />}
        {tab === 'reports' && <ReportsPanel />}
        {tab === 'employees' && <EmployeesPanel employees={employees} onPunch={punch} />}
      </div>

      {modifierFor && (
        <ModifiersModal
          productName={modifierFor.name}
          basePrice={modifierFor.happyHour ? Math.round(modifierFor.price * 0.8) : modifierFor.price}
          onCancel={() => setModifierFor(null)}
          onConfirm={(val, delta) => {
            addProduct(modifierFor, val, delta);
            setModifierFor(null);
          }}
        />
      )}

      {checkoutOpen && (
        <CheckoutModal
          total={total}
          tipPct={tipPct}
          onTipChange={setTipPct}
          onCancel={() => setCheckoutOpen(false)}
          onApproved={onPaymentApproved}
        />
      )}

      {receipt && (
        <ReceiptModal
          ticketNo={receipt.no}
          cashier="Sofía P."
          lines={lines.map((l) => ({ name: l.product.name, qty: l.qty, total: l.unitPrice * l.qty }))}
          subtotal={subtotal}
          tax={tax}
          tip={Math.round(total * (tipPct / 100))}
          total={total + Math.round(total * (tipPct / 100))}
          payments={receipt.pays}
          onClose={() => setReceipt(null)}
          onNewSale={finishSale}
        />
      )}

      {cashModal && (
        <div role="dialog" aria-modal="true" aria-labelledby="pos-cash-modal-title" className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-secondary-900 rounded-2xl max-w-sm w-full p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 id="pos-cash-modal-title" className="font-bold text-secondary-900 dark:text-white">
                {cashModal === 'open' ? t('cash.open') : t('cash.close')}
              </h3>
              <button onClick={() => setCashModal(null)} aria-label={t('common.close')} className="p-1">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <label className="block text-sm text-secondary-600 dark:text-secondary-400 mb-1">
              {cashModal === 'open' ? t('cash.opening') : t('cash.counted')}
            </label>
            <input
              type="number"
              value={countedCash}
              onChange={(e) => setCountedCash(e.target.value)}
              placeholder="200000"
              className="w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white"
            />
            {cashModal === 'close' && countedCash && (
              <p className="text-xs mt-2 text-secondary-500">
                {t('cash.diff')}:{' '}
                <span className={parseFloat(countedCash) - 720000 === 0 ? 'text-green-600' : 'text-red-600'}>
                  ${(parseFloat(countedCash) - 720000).toLocaleString()}
                </span>
              </p>
            )}
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setCashModal(null)} className="flex-1">
                {t('common.close')}
              </Button>
              <Button onClick={() => { setCashModal(null); setCountedCash(''); showToast('OK'); }} className="flex-1">
                {t('cash.confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
