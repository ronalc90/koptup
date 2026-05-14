'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { MagnifyingGlassIcon, ArrowLeftIcon, PlusIcon, MinusIcon, ChatBubbleLeftEllipsisIcon, PhoneIcon, PaperAirplaneIcon, BoltIcon, CreditCardIcon, UserGroupIcon, FireIcon, SparklesIcon, CakeIcon, ShoppingCartIcon, BeakerIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid, CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid';
import { PhoneFrame, MapPlaceholder, Row, fmt } from './shared';

type View = 'home' | 'restaurant' | 'cart' | 'tracking' | 'chat';

interface MenuItem { id: string; name: string; desc: string; price: number; popular?: boolean }
interface CartItem { id: string; name: string; price: number; qty: number }

export default function CustomerApp() {
  const t = useTranslations('demoDelivery');
  const [view, setView] = useState<View>('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tip, setTip] = useState(10);
  const [orderStatus, setOrderStatus] = useState(0);
  const [payment, setPayment] = useState<'visa' | 'mc' | 'wallet'>('visa');
  const [split, setSplit] = useState(0);
  const [chat, setChat] = useState<{ from: 'driver' | 'you'; text: string }[]>([
    { from: 'driver', text: t('customer.chat.driverHi') },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [membership, setMembership] = useState(false);

  const restaurants = [
    { id: 'r1', name: 'Sushi Lab', cuisine: 'Japanese', rating: 4.8, eta: 25, fee: 2.5, img: '🍣' },
    { id: 'r2', name: 'Bao Bar', cuisine: 'Asian fusion', rating: 4.7, eta: 30, fee: 0, img: '🥟' },
    { id: 'r3', name: 'Pizza Forno', cuisine: 'Italian', rating: 4.6, eta: 35, fee: 3.0, img: '🍕' },
    { id: 'r4', name: 'Healthy Bowl', cuisine: 'Healthy', rating: 4.9, eta: 20, fee: 1.5, img: '🥗' },
  ];

  const menu: MenuItem[] = [
    { id: 'm1', name: t('merchant.items.philly'), desc: 'Salmón, queso crema, pepino', price: 12.5, popular: true },
    { id: 'm2', name: t('merchant.items.spicy'), desc: 'Atún picante, aguacate', price: 13, popular: true },
    { id: 'm3', name: t('merchant.items.tempura'), desc: 'Camarón tempura, mango', price: 14 },
    { id: 'm4', name: t('merchant.items.edamame'), desc: 'Edamame al sal', price: 5 },
    { id: 'm5', name: t('merchant.items.miso'), desc: 'Tofu, alga wakame', price: 4.5 },
    { id: 'm6', name: t('merchant.items.matcha'), desc: 'Matcha ceremonial', price: 6 },
  ];

  const subtotal = cart.reduce((a, c) => a + c.price * c.qty, 0);
  const fee = membership ? 0 : 2.5;
  const service = +(subtotal * 0.05).toFixed(2);
  const tipAmt = +((subtotal * tip) / 100).toFixed(2);
  const total = +(subtotal + fee + service + tipAmt).toFixed(2);

  const add = (m: MenuItem) =>
    setCart((p) => {
      const e = p.find((x) => x.id === m.id);
      return e ? p.map((x) => (x.id === m.id ? { ...x, qty: x.qty + 1 } : x)) : [...p, { id: m.id, name: m.name, price: m.price, qty: 1 }];
    });
  const dec = (id: string) => setCart((p) => p.flatMap((x) => (x.id === id ? (x.qty > 1 ? [{ ...x, qty: x.qty - 1 }] : []) : [x])));

  useEffect(() => {
    if (view !== 'tracking') return;
    const id = setInterval(() => setOrderStatus((s) => (s < 3 ? s + 1 : s)), 3500);
    return () => clearInterval(id);
  }, [view]);

  const send = () => {
    if (!chatInput.trim()) return;
    setChat((m) => [...m, { from: 'you', text: chatInput.trim() }]);
    setChatInput('');
    setTimeout(() => setChat((m) => [...m, { from: 'driver', text: t('customer.chat.driverArrived') }]), 1200);
  };

  const cats = [
    { key: 'food', icon: CakeIcon, color: 'bg-orange-500' },
    { key: 'groceries', icon: ShoppingCartIcon, color: 'bg-emerald-500' },
    { key: 'pharmacy', icon: BeakerIcon, color: 'bg-rose-500' },
    { key: 'tech', icon: CpuChipIcon, color: 'bg-indigo-500' },
  ] as const;

  if (view === 'home')
    return (
      <PhoneFrame label="Customer">
        <div className="p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('customer.address')}</p>
              <h2 className="text-lg font-bold">{t('customer.greeting')}</h2>
            </div>
            <Badge variant="primary" size="sm">
              <SparklesIcon className="h-3 w-3 mr-1" />
              {t('customer.loyalty', { points: 1240 })}
            </Badge>
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400 z-10" />
            <Input className="pl-9" placeholder={t('customer.searchPlaceholder')} />
          </div>
          <div className={`rounded-xl p-3 text-sm font-medium flex items-center justify-between ${membership ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200' : 'bg-gradient-to-r from-primary-600 to-purple-600 text-white'}`}>
            <span className="flex items-center gap-2">
              <BoltIcon className="h-4 w-4" />
              {membership ? t('customer.membership.active') : t('customer.promoBanner')}
            </span>
            {!membership && (
              <button onClick={() => setMembership(true)} className="text-xs font-semibold underline">
                {t('customer.membership.cta')}
              </button>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2">{t('customer.categoriesTitle')}</h3>
            <div className="grid grid-cols-4 gap-2">
              {cats.map((c) => (
                <div key={c.key} className="flex flex-col items-center gap-1.5">
                  <div className={`h-12 w-12 rounded-2xl ${c.color} text-white flex items-center justify-center shadow`}>
                    <c.icon className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] font-medium">{t(`customer.categories.${c.key}` as any)}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">{t('customer.near')}</h3>
              <span className="text-xs text-primary-600 dark:text-primary-400">{t('common.viewAll')}</span>
            </div>
            <div className="space-y-2">
              {restaurants.map((r) => (
                <button key={r.id} onClick={() => setView('restaurant')} className="w-full text-left rounded-xl bg-white dark:bg-secondary-800 p-3 flex items-center gap-3 border border-secondary-200 dark:border-secondary-700 hover:border-primary-500 transition">
                  <div className="h-14 w-14 rounded-xl bg-secondary-100 dark:bg-secondary-700 flex items-center justify-center text-3xl">{r.img}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{r.name}</div>
                    <div className="text-xs text-secondary-500 dark:text-secondary-400">{r.cuisine}</div>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className="inline-flex items-center gap-0.5 text-amber-500"><StarSolid className="h-3 w-3" />{r.rating}</span>
                      <span className="text-secondary-500 dark:text-secondary-400">{t('customer.restaurant.eta', { eta: r.eta })}</span>
                      <span className="text-secondary-500 dark:text-secondary-400">{r.fee === 0 || membership ? t('customer.restaurant.free') : t('customer.restaurant.fee', { fee: fmt(r.fee) })}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </PhoneFrame>
    );

  if (view === 'restaurant')
    return (
      <PhoneFrame label="Customer">
        <div className="relative pb-24">
          <div className="h-32 bg-gradient-to-r from-orange-400 to-rose-500 relative flex items-end">
            <button onClick={() => setView('home')} className="absolute top-3 left-3 h-9 w-9 rounded-full bg-white/90 flex items-center justify-center">
              <ArrowLeftIcon className="h-4 w-4 text-secondary-900" />
            </button>
            <div className="p-4 text-white">
              <h2 className="text-xl font-bold">Sushi Lab</h2>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-0.5"><StarSolid className="h-3 w-3" />4.8</span>
                <span>·</span><span>25 min</span><span>·</span><span>{fmt(2.5)}</span>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-2">
            <h3 className="font-semibold text-sm mb-1">{t('customer.restaurant.categoriesTitle')}</h3>
            {menu.map((m) => (
              <div key={m.id} className="rounded-xl bg-white dark:bg-secondary-800 p-3 border border-secondary-200 dark:border-secondary-700 flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{m.name}</span>
                    {m.popular && <Badge variant="warning" size="sm"><FireIcon className="h-3 w-3 mr-0.5" />{t('customer.restaurant.popular')}</Badge>}
                  </div>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">{m.desc}</p>
                  <p className="text-sm font-bold mt-1">{fmt(m.price)}</p>
                </div>
                <Button size="sm" onClick={() => add(m)}><PlusIcon className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
          {cart.length > 0 && (
            <div className="sticky bottom-0 p-3 bg-white/95 dark:bg-secondary-900/95 backdrop-blur border-t border-secondary-200 dark:border-secondary-700">
              <Button fullWidth onClick={() => setView('cart')}>
                {t('customer.cart.checkout', { total: fmt(total) })} · {cart.reduce((a, c) => a + c.qty, 0)}
              </Button>
            </div>
          )}
        </div>
      </PhoneFrame>
    );

  if (view === 'cart')
    return (
      <PhoneFrame label="Customer">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setView('restaurant')} className="h-9 w-9 rounded-full bg-secondary-200 dark:bg-secondary-800 flex items-center justify-center">
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-bold">{t('customer.cart.title')}</h2>
          </div>
          {cart.length === 0 ? (
            <p className="text-sm text-secondary-500 dark:text-secondary-400 text-center py-12">{t('customer.cart.empty')}</p>
          ) : (
            <>
              <div className="space-y-2">
                {cart.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-xl bg-white dark:bg-secondary-800 p-3 border border-secondary-200 dark:border-secondary-700">
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{c.name}</div>
                      <div className="text-xs text-secondary-500 dark:text-secondary-400">{fmt(c.price)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => dec(c.id)} className="h-7 w-7 rounded-full bg-secondary-100 dark:bg-secondary-700 flex items-center justify-center"><MinusIcon className="h-3 w-3" /></button>
                      <span className="text-sm font-bold w-5 text-center">{c.qty}</span>
                      <button onClick={() => add({ id: c.id, name: c.name, desc: '', price: c.price })} className="h-7 w-7 rounded-full bg-primary-600 text-white flex items-center justify-center"><PlusIcon className="h-3 w-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-white dark:bg-secondary-800 p-3 border border-secondary-200 dark:border-secondary-700">
                <p className="text-xs font-semibold mb-2">{t('customer.cart.tipLabel')}</p>
                <div className="flex gap-2">
                  {[0, 5, 10, 15, 20].map((v) => (
                    <button key={v} onClick={() => setTip(v)} className={`flex-1 rounded-lg py-1.5 text-xs font-semibold ${tip === v ? 'bg-primary-600 text-white' : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-200'}`}>
                      {v}%
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-white dark:bg-secondary-800 p-3 border border-secondary-200 dark:border-secondary-700">
                <p className="text-xs font-semibold mb-2">{t('customer.cart.paymentMethod')}</p>
                <div className="space-y-1.5">
                  {(['visa', 'mc', 'wallet'] as const).map((k) => (
                    <button key={k} onClick={() => setPayment(k)} className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm ${payment === k ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-500' : 'bg-secondary-50 dark:bg-secondary-900 border border-transparent'}`}>
                      <span className="flex items-center gap-2"><CreditCardIcon className="h-4 w-4" />{t(`customer.cart.cards.${k}` as any)}</span>
                      {payment === k && <CheckSolid className="h-4 w-4 text-primary-600" />}
                    </button>
                  ))}
                </div>
                <button onClick={() => setSplit((s) => (s + 1) % 4)} className="mt-2 w-full text-xs text-primary-600 dark:text-primary-400 flex items-center justify-center gap-1">
                  <UserGroupIcon className="h-3.5 w-3.5" />
                  {split > 0 ? t('customer.cart.splitWith', { n: split }) : t('customer.cart.splitPayment')}
                </button>
              </div>
              <div className="rounded-xl bg-white dark:bg-secondary-800 p-3 border border-secondary-200 dark:border-secondary-700 text-sm space-y-1">
                <Row k={t('customer.cart.subtotal')} v={fmt(subtotal)} />
                <Row k={t('customer.cart.deliveryFee')} v={fee === 0 ? t('customer.restaurant.free') : fmt(fee)} />
                <Row k={t('customer.cart.service')} v={fmt(service)} />
                <Row k={t('customer.cart.tip')} v={fmt(tipAmt)} />
                <div className="border-t border-secondary-200 dark:border-secondary-700 pt-1 mt-1">
                  <Row k={t('customer.cart.total')} v={fmt(total)} bold />
                </div>
              </div>
              <Button fullWidth onClick={() => { setView('tracking'); setOrderStatus(0); }}>
                {t('customer.cart.checkout', { total: fmt(total) })}
              </Button>
            </>
          )}
        </div>
      </PhoneFrame>
    );

  if (view === 'tracking') {
    const keys = ['confirmed', 'preparing', 'onTheWay', 'delivered'] as const;
    const dx = 25 + orderStatus * 18;
    const dy = 60 - orderStatus * 6;
    return (
      <PhoneFrame label="Customer">
        <div className="p-4 space-y-4">
          <h2 className="text-lg font-bold">{t('customer.tracking.title')}</h2>
          <MapPlaceholder
            storePos={{ x: 18, y: 78 }}
            driverPos={{ x: dx, y: dy }}
            customerPos={{ x: 82, y: 22 }}
            labels={{ you: t('customer.tracking.you'), driver: t('customer.tracking.driver'), store: t('customer.tracking.store'), hint: t('customer.tracking.mapHint') }}
          />
          <div className="rounded-xl bg-white dark:bg-secondary-800 p-3 border border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('customer.tracking.etaLabel')}</p>
                <p className="text-2xl font-bold">{Math.max(2, 25 - orderStatus * 7)} {t('common.min')}</p>
              </div>
              <Badge variant={orderStatus === 3 ? 'success' : 'info'}>
                {t(`customer.tracking.status.${keys[orderStatus]}` as any)}
              </Badge>
            </div>
            <div className="mt-3 flex items-center gap-1">
              {keys.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= orderStatus ? 'bg-primary-600' : 'bg-secondary-200 dark:bg-secondary-700'}`} />
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-white dark:bg-secondary-800 p-3 border border-secondary-200 dark:border-secondary-700 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 flex items-center justify-center text-white font-bold">D</div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{t('customer.tracking.driverName')}</div>
              <div className="text-xs text-secondary-500 dark:text-secondary-400 flex items-center gap-1">
                <StarSolid className="h-3 w-3 text-amber-500" /> {t('customer.tracking.driverRating')} · {t('customer.tracking.driverPlate')}
              </div>
            </div>
            <button onClick={() => setView('chat')} className="h-9 w-9 rounded-full bg-primary-600 text-white flex items-center justify-center"><ChatBubbleLeftEllipsisIcon className="h-4 w-4" /></button>
            <button className="h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center"><PhoneIcon className="h-4 w-4" /></button>
          </div>
          <Button variant="outline" fullWidth onClick={() => { setView('home'); setCart([]); setOrderStatus(0); }}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />{t('common.back')}
          </Button>
        </div>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame label="Customer">
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-secondary-200 dark:border-secondary-700 flex items-center gap-2">
          <button onClick={() => setView('tracking')} className="h-8 w-8 rounded-full bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center">
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
          <div className="font-semibold text-sm">{t('customer.chat.title', { name: t('customer.tracking.driverName') })}</div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[420px]">
          {chat.map((m, i) => (
            <div key={i} className={`flex ${m.from === 'you' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-1.5 text-sm ${m.from === 'you' ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-secondary-200 dark:bg-secondary-700 text-secondary-900 dark:text-white rounded-bl-sm'}`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <div className="p-2 flex flex-wrap gap-1 border-t border-secondary-200 dark:border-secondary-700">
          {(['outside', 'ring', 'leave'] as const).map((k) => (
            <button key={k} onClick={() => setChat((m) => [...m, { from: 'you', text: t(`customer.chat.quick.${k}` as any) }])} className="text-xs rounded-full px-2.5 py-1 bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-200">
              {t(`customer.chat.quick.${k}` as any)}
            </button>
          ))}
        </div>
        <div className="p-2 flex items-center gap-2 border-t border-secondary-200 dark:border-secondary-700">
          <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={t('customer.chat.placeholder')} onKeyDown={(e) => e.key === 'Enter' && send()} />
          <Button size="sm" onClick={send}><PaperAirplaneIcon className="h-4 w-4" /></Button>
        </div>
      </div>
    </PhoneFrame>
  );
}
