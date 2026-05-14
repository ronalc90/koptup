'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  CheckCircleIcon, ShoppingCartIcon, MapPinIcon, CreditCardIcon, ClipboardDocumentCheckIcon,
  TrashIcon, PlusIcon, MinusIcon, ArrowLeftIcon, ArrowRightIcon, TruckIcon,
} from '@heroicons/react/24/outline';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useCart, formatPrice, calcTotals, generateCufe, generateOrderNumber } from './shared';
import { imageUrl } from './products';

type Step = 0 | 1 | 2 | 3;

const PAYMENT_METHODS = [
  { id: 'card',        icon: '💳' },
  { id: 'pse',         icon: '🏦' },
  { id: 'nequi',       icon: '📱' },
  { id: 'daviplata',   icon: '💜' },
  { id: 'mercadoPago', icon: '🛒' },
  { id: 'wompi',       icon: '⚡' },
  { id: 'applePay',    icon: '🍎' },
  { id: 'googlePay',   icon: 'G' },
  { id: 'addi',        icon: '🅰️' },
] as const;

export default function CheckoutView() {
  const t = useTranslations('demoEcommerce2');
  const { lines, setQty, remove, subtotal, clear, setView } = useCart();
  const [step, setStep] = useState<Step>(0);
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(0);
  const [shipping, setShipping] = useState({
    fullName: '', email: '', phone: '', address: '', city: 'Bogotá', zip: '110111', country: 'CO',
  });
  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number]['id']>('card');
  const [orderNumber] = useState(generateOrderNumber());
  const [cufe] = useState(generateCufe());

  const discount = +(subtotal * appliedCoupon).toFixed(2);
  const totals = useMemo(() => calcTotals(Math.max(0, subtotal - discount)), [subtotal, discount]);

  function applyCoupon() {
    const c = coupon.trim().toUpperCase();
    if (c === 'KOP10') setAppliedCoupon(0.1);
    else if (c === 'KOP20') setAppliedCoupon(0.2);
    else setAppliedCoupon(0);
  }
  function next() { setStep((s) => (s < 3 ? ((s + 1) as Step) : s)); }
  function back() { setStep((s) => (s > 0 ? ((s - 1) as Step) : s)); }

  const stepIcons = [ShoppingCartIcon, MapPinIcon, CreditCardIcon, ClipboardDocumentCheckIcon];
  const stepKeys = ['cart', 'address', 'payment', 'confirmation'] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <button onClick={() => setView('storefront')} className="text-sm text-primary-600 hover:underline flex items-center gap-1">
          <ArrowLeftIcon className="h-4 w-4" />
          {t('checkout.backToStore')}
        </button>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {stepKeys.map((k, i) => {
            const Icon = stepIcons[i];
            const done = i < step;
            const active = i === step;
            return (
              <div key={k} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 ${
                    done ? 'bg-green-600 border-green-600 text-white' : active ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white dark:bg-secondary-800 border-secondary-300 dark:border-secondary-600 text-secondary-400'
                  }`}>
                    {done ? <CheckCircleIcon className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs mt-2 font-medium hidden sm:block ${active || done ? 'text-secondary-900 dark:text-white' : 'text-secondary-400'}`}>
                    {t(`checkout.steps.${k}`)}
                  </span>
                </div>
                {i < 3 && <div className={`flex-1 h-1 mx-2 ${i < step ? 'bg-green-600' : 'bg-secondary-200 dark:bg-secondary-700'}`} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {step === 0 && (
            <Card variant="bordered" padding="md">
              <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-4">{t('checkout.cart.title')}</h2>
              {lines.length === 0 ? (
                <p className="text-center py-12 text-secondary-500">{t('checkout.cart.empty')}</p>
              ) : (
                <div className="space-y-3">
                  {lines.map((l) => (
                    <div key={l.product.id} className="flex gap-4 p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                        <Image src={imageUrl(l.product.photoId, 160, 160)} alt={l.product.sku} fill sizes="80px" className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-secondary-900 dark:text-white truncate">{t(`productNames.${l.product.nameKey}`)}</p>
                        <p className="text-sm text-secondary-500">SKU: {l.product.sku}</p>
                        <p className="text-primary-600 font-bold">{formatPrice(l.product.price)}</p>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <button onClick={() => remove(l.product.id)} className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded" aria-label={t('checkout.cart.remove')}>
                          <TrashIcon className="h-4 w-4" />
                        </button>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setQty(l.product.id, Math.max(0, l.quantity - 1))} className="p-1 bg-secondary-200 dark:bg-secondary-700 rounded" aria-label="-">
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{l.quantity}</span>
                          <button onClick={() => setQty(l.product.id, l.quantity + 1)} className="p-1 bg-secondary-200 dark:bg-secondary-700 rounded" aria-label="+">
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-4">
                    <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder={t('checkout.cart.couponPlaceholder')} className="flex-1 px-3 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white" />
                    <Button variant="outline" onClick={applyCoupon}>{t('checkout.cart.applyCoupon')}</Button>
                  </div>
                  {appliedCoupon > 0 && (
                    <p className="text-sm text-green-600">✓ {t('checkout.cart.couponApplied', { value: Math.round(appliedCoupon * 100) })}</p>
                  )}
                </div>
              )}
            </Card>
          )}

          {step === 1 && (
            <Card variant="bordered" padding="md">
              <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPinIcon className="h-6 w-6 text-primary-600" />
                {t('checkout.address.title')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField label={t('checkout.address.fullName')} value={shipping.fullName} onChange={(v) => setShipping({ ...shipping, fullName: v })} placeholder="Ronald Pérez" />
                <FormField label={t('checkout.address.email')} type="email" value={shipping.email} onChange={(v) => setShipping({ ...shipping, email: v })} placeholder="ronald@example.com" />
                <FormField label={t('checkout.address.phone')} type="tel" value={shipping.phone} onChange={(v) => setShipping({ ...shipping, phone: v })} placeholder="+57 300 000 0000" />
                <FormField label={t('checkout.address.address')} value={shipping.address} onChange={(v) => setShipping({ ...shipping, address: v })} placeholder="Cra 11 #93-46" />
                <FormField label={t('checkout.address.city')} value={shipping.city} onChange={(v) => setShipping({ ...shipping, city: v })} />
                <FormField label={t('checkout.address.zip')} value={shipping.zip} onChange={(v) => setShipping({ ...shipping, zip: v })} />
              </div>
              <div className="mt-4 h-40 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center text-primary-700 dark:text-primary-200">
                <div className="text-center">
                  <MapPinIcon className="h-10 w-10 mx-auto mb-1" />
                  <p className="text-sm font-medium">{t('checkout.address.mapHint')}</p>
                </div>
              </div>
            </Card>
          )}

          {step === 2 && (
            <Card variant="bordered" padding="md">
              <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
                <CreditCardIcon className="h-6 w-6 text-primary-600" />
                {t('checkout.payment.title')}
              </h2>
              <p className="text-sm text-secondary-500 mb-4">{t('checkout.payment.subtitle')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setMethod(pm.id)}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                      method === pm.id ? 'border-primary-600 bg-primary-50 dark:bg-primary-950' : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-400'
                    }`}
                  >
                    <span className="text-2xl">{pm.icon}</span>
                    <span className="text-xs font-medium text-secondary-900 dark:text-white text-center">{t(`checkout.payment.methods.${pm.id}`)}</span>
                  </button>
                ))}
              </div>

              {method === 'card' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField label={t('checkout.payment.cardNumber')} value="" onChange={() => {}} placeholder="4242 4242 4242 4242" className="md:col-span-2" />
                  <FormField label={t('checkout.payment.cardName')} value="" onChange={() => {}} placeholder="RONALD PEREZ" />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="MM/YY" value="" onChange={() => {}} placeholder="12/28" />
                    <FormField label="CVV" value="" onChange={() => {}} placeholder="123" />
                  </div>
                </div>
              )}
              {method === 'addi' && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">{t('checkout.payment.addiHint')}</p>
                </div>
              )}
              {(method === 'pse' || method === 'nequi' || method === 'daviplata' || method === 'mercadoPago' || method === 'wompi') && (
                <div className="bg-secondary-50 dark:bg-secondary-800 rounded-lg p-4 text-sm text-secondary-600 dark:text-secondary-300">
                  {t('checkout.payment.redirectHint')}
                </div>
              )}
              {(method === 'applePay' || method === 'googlePay') && (
                <div className="bg-secondary-50 dark:bg-secondary-800 rounded-lg p-4 text-sm text-secondary-600 dark:text-secondary-300">
                  {t('checkout.payment.walletHint')}
                </div>
              )}
            </Card>
          )}

          {step === 3 && (
            <Card variant="bordered" padding="md" className="text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                <CheckCircleIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">{t('checkout.confirmation.title')}</h2>
              <p className="text-secondary-500 mb-6">{t('checkout.confirmation.subtitle')}</p>
              <div className="bg-secondary-50 dark:bg-secondary-800 rounded-lg p-4 text-left space-y-3 mb-6">
                <Row label={t('checkout.confirmation.orderNumber')} value={orderNumber} mono />
                <Row label={t('checkout.confirmation.cufe')} value={cufe.slice(0, 32) + '…'} mono />
                <Row label={t('checkout.confirmation.email')} value={shipping.email || 'ronald@example.com'} />
                <Row label={t('checkout.confirmation.total')} value={formatPrice(totals.total)} />
              </div>
              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 flex items-center justify-center gap-2 text-green-700 dark:text-green-300 mb-6">
                <TruckIcon className="h-5 w-5" />
                <span className="text-sm">{t('checkout.confirmation.delivery')}</span>
              </div>
              <Button onClick={() => { clear(); setView('storefront'); }}>{t('checkout.confirmation.continueShopping')}</Button>
            </Card>
          )}

          {step < 3 && (
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <Button variant="outline" onClick={back} className="flex items-center gap-2">
                  <ArrowLeftIcon className="h-4 w-4" /> {t('checkout.back')}
                </Button>
              )}
              <Button onClick={next} disabled={lines.length === 0 && step === 0} className="ml-auto flex items-center gap-2">
                {step === 2 ? t('checkout.placeOrder') : t('checkout.continue')}
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card variant="elevated" padding="md" className="sticky top-24">
            <CardContent>
              <h3 className="font-bold text-secondary-900 dark:text-white mb-3">{t('checkout.summary.title')}</h3>
              <div className="space-y-2 text-sm">
                <Row label={t('checkout.summary.subtotal')} value={formatPrice(subtotal)} />
                {discount > 0 && <Row label={t('checkout.summary.discount')} value={`-${formatPrice(discount)}`} />}
                <Row label={t('checkout.summary.shipping')} value={totals.shipping === 0 ? t('checkout.summary.free') : formatPrice(totals.shipping)} />
                <Row label={t('checkout.summary.tax')} value={formatPrice(totals.tax)} />
                <div className="border-t border-secondary-200 dark:border-secondary-700 pt-2 mt-2">
                  <Row label={t('checkout.summary.total')} value={formatPrice(totals.total)} bold />
                </div>
              </div>
              {totals.shipping === 0 && subtotal > 0 && (
                <Badge variant="success" className="mt-3 w-full justify-center">✓ {t('checkout.summary.freeShippingApplied')}</Badge>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text', placeholder, className }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
      />
    </div>
  );
}

function Row({ label, value, mono = false, bold = false }: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-secondary-500">{label}</span>
      <span className={`${bold ? 'text-lg font-bold text-primary-600' : 'font-medium text-secondary-900 dark:text-white'} ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
