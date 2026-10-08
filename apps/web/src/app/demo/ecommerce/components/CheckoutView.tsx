'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  CheckCircleIcon, ShoppingCartIcon, MapPinIcon, CreditCardIcon, ClipboardDocumentCheckIcon,
  TrashIcon, PlusIcon, MinusIcon, ArrowLeftIcon, ArrowRightIcon, TruckIcon, ExclamationTriangleIcon,
  BuildingLibraryIcon, DevicePhoneMobileIcon, BanknotesIcon, CalendarDaysIcon, ArrowDownTrayIcon,
  ChatBubbleLeftEllipsisIcon, ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatPrice, IVA_RATE, FREE_SHIPPING_FROM, type CartPricing } from './pricing';
import { CITIES, CITY_BY_ID, ADDI_MIN, PAYMENT_METHODS, SELLER, nitCheckDigit, type Order, type PaymentMethodId } from './data';
import {
  luhnValid, cardBrand, expiryValid, mobileValid, emailValid, computeCufe, localStamp,
  DECLINED_TEST_CARD,
} from './analytics';
import { useStore, type CheckoutInput } from './store';
import { ProductImage, FieldLabel, inputClass, inputErrorClass, SampleNote } from './ui';
import { downloadInvoicePdf } from './invoicePdf';

type Step = 0 | 1 | 2 | 3;
const DOC_TYPES = ['CC', 'CE', 'PP'] as const;
const METHOD_ICONS: Record<PaymentMethodId, React.ComponentType<{ className?: string }>> = {
  card: CreditCardIcon,
  pse: BuildingLibraryIcon,
  nequi: DevicePhoneMobileIcon,
  daviplata: DevicePhoneMobileIcon,
  cod: BanknotesIcon,
  addi: CalendarDaysIcon,
};

interface Details {
  fullName: string;
  docType: (typeof DOC_TYPES)[number];
  docNumber: string;
  email: string;
  phone: string;
  cityId: string;
  address: string;
  wantsCompany: boolean;
  companyName: string;
  companyNit: string;
  consent: boolean;
}

const EMPTY_DETAILS: Details = {
  fullName: '', docType: 'CC', docNumber: '', email: '', phone: '', cityId: 'bogota', address: '',
  wantsCompany: false, companyName: '', companyNit: '', consent: false,
};

const SAMPLE_DETAILS: Details = {
  fullName: 'Laura Martínez', docType: 'CC', docNumber: '1020304050', email: 'laura.martinez@example.com',
  phone: '3001234567', cityId: 'bogota', address: 'Carrera 7 # 72-41, apto 502',
  wantsCompany: false, companyName: '', companyNit: '', consent: true,
};

function detailErrors(d: Details): Partial<Record<keyof Details, string>> {
  const e: Partial<Record<keyof Details, string>> = {};
  if (d.fullName.trim().length < 3) e.fullName = 'fullName';
  const doc = d.docNumber.replace(/[.\s-]/g, '');
  if (d.docType === 'PP' ? !/^[A-Za-z0-9]{5,12}$/.test(doc) : !/^\d{5,12}$/.test(doc)) e.docNumber = 'docNumber';
  if (!emailValid(d.email)) e.email = 'email';
  if (!mobileValid(d.phone)) e.phone = 'phone';
  if (!CITY_BY_ID[d.cityId]) e.cityId = 'cityId';
  if (d.address.trim().length < 6) e.address = 'address';
  if (d.wantsCompany) {
    if (d.companyName.trim().length < 3) e.companyName = 'companyName';
    if (!/^\d{9}$/.test(d.companyNit.replace(/\D/g, ''))) e.companyNit = 'companyNit';
  }
  if (!d.consent) e.consent = 'consent';
  return e;
}

export default function CheckoutView() {
  const t = useTranslations('demoEcommerce2');
  const store = useStore();
  const { cartLines, pricing, setCartQty, removeFromCart, applyCoupon, clearCoupon, placeOrder, setView, productName, state, notify, setOrderCufe } = store;
  const [step, setStep] = useState<Step>(0);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState(false);
  const [details, setDetails] = useState<Details>(EMPTY_DETAILS);
  const [showErrors, setShowErrors] = useState(false);
  const [method, setMethod] = useState<PaymentMethodId>('card');
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [walletPhone, setWalletPhone] = useState('');
  const [payErrors, setPayErrors] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [orderLines, setOrderLines] = useState<Array<{ name: string; qty: number; unitPrice: number }>>([]);

  // Al cambiar de paso, vuelve al inicio del formulario (en móvil queda fuera de vista).
  const firstStep = useRef(true);
  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const errors = detailErrors(details);
  const city = CITY_BY_ID[details.cityId];
  const set = <K extends keyof Details>(k: K, v: Details[K]) => setDetails((d) => ({ ...d, [k]: v }));

  function submitCoupon() {
    if (!couponInput.trim()) return;
    const ok = applyCoupon(couponInput);
    setCouponError(!ok);
    if (ok) setCouponInput('');
  }

  function goNext() {
    if (step === 0 && cartLines.length) setStep(1);
    if (step === 1) {
      setShowErrors(true);
      if (Object.keys(errors).length === 0) {
        if (!walletPhone) setWalletPhone(details.phone);
        setStep(2);
      }
    }
  }

  function validatePayment(): string[] {
    const errs: string[] = [];
    if (method === 'card') {
      if (!luhnValid(card.number)) errs.push('cardNumber');
      if (card.name.trim().length < 3) errs.push('cardName');
      if (!expiryValid(card.expiry, Date.now())) errs.push('cardExpiry');
      if (!/^\d{3,4}$/.test(card.cvv)) errs.push('cardCvv');
    }
    if ((method === 'nequi' || method === 'daviplata') && !mobileValid(walletPhone)) errs.push('walletPhone');
    if (method === 'addi' && pricing.net < ADDI_MIN) errs.push('addiMin');
    return errs;
  }

  function pay() {
    const errs = validatePayment();
    setPayErrors(errs);
    setDeclined(false);
    if (errs.length) return;
    setProcessing(true);
    const lines = cartLines.map((l) => ({ name: productName(l.product), qty: l.qty, unitPrice: l.product.price }));
    window.setTimeout(() => {
      if (method === 'card' && card.number.replace(/\D/g, '') === DECLINED_TEST_CARD) {
        setProcessing(false);
        setDeclined(true);
        return;
      }
      const input: CheckoutInput = {
        customer: details.fullName,
        email: details.email,
        phone: details.phone,
        docType: details.wantsCompany ? 'NIT' : details.docType,
        docNumber: details.wantsCompany ? `${details.companyNit.replace(/\D/g, '')}-${nitCheckDigit(details.companyNit)}` : details.docNumber.replace(/[.\s-]/g, ''),
        cityId: details.cityId,
        address: details.address,
        company: details.wantsCompany ? details.companyName : undefined,
        method,
      };
      const created = placeOrder(input);
      setProcessing(false);
      if (!created) {
        notify(t('checkout.payment.stockChanged'));
        setStep(0);
        return;
      }
      setOrder(created);
      setOrderLines(lines);
      setStep(3);
      computeCufe([
        created.id, String(created.createdAt), created.total.toFixed(2), '01', created.ivaIncluded.toFixed(2),
        SELLER.nit, created.docNumber ?? '', 'clave-tecnica-de-ejemplo', '2',
      ]).then((cufe) => {
        if (cufe) {
          setOrderCufe(created.id, cufe);
          setOrder((o) => (o && o.id === created.id ? { ...o, cufe } : o));
        }
      });
    }, 1400);
  }

  const stepIcons = [ShoppingCartIcon, MapPinIcon, CreditCardIcon, ClipboardDocumentCheckIcon];
  const stepKeys = ['cart', 'address', 'payment', 'confirmation'] as const;
  const fieldError = (k: keyof Details) => (showErrors && errors[k] ? t(`checkout.errors.${errors[k]}`) : null);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <button type="button" onClick={() => setView('storefront')} className="flex items-center gap-1 text-sm text-primary-600 hover:underline">
          <ArrowLeftIcon className="h-4 w-4" />
          {t('checkout.backToStore')}
        </button>
      </div>

      <ol className="mx-auto mb-8 flex max-w-3xl items-center justify-between" aria-label={t('checkout.stepsLabel')}>
        {stepKeys.map((k, i) => {
          const Icon = stepIcons[i];
          const done = i < step;
          const active = i === step;
          return (
            <li key={k} className="flex flex-1 items-center" aria-current={active ? 'step' : undefined}>
              <div className="flex flex-col items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 sm:h-12 sm:w-12 ${done ? 'border-green-600 bg-green-600 text-white' : active ? 'border-primary-600 bg-primary-600 text-white' : 'border-secondary-300 bg-white text-secondary-400 dark:border-secondary-600 dark:bg-secondary-800'}`}>
                  {done ? <CheckCircleIcon className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={`mt-2 text-[11px] font-medium sm:text-xs ${active || done ? 'text-secondary-900 dark:text-white' : 'text-secondary-400'}`}>{t(`checkout.steps.${k}`)}</span>
              </div>
              {i < 3 && <div className={`mx-1 mb-5 h-1 flex-1 sm:mx-2 ${i < step ? 'bg-green-600' : 'bg-secondary-200 dark:bg-secondary-700'}`} />}
            </li>
          );
        })}
      </ol>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {step === 0 && (
            <Card variant="bordered" padding="md">
              <h2 className="mb-4 text-xl font-bold text-secondary-900 dark:text-white">{t('checkout.cart.title')}</h2>
              {cartLines.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="mb-4 text-secondary-500">{t('checkout.cart.empty')}</p>
                  <Button onClick={() => setView('storefront')}>{t('checkout.backToStore')}</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartLines.map((l) => (
                    <div key={l.product.id} className="flex gap-3 rounded-lg bg-secondary-50 p-3 dark:bg-secondary-800 sm:gap-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg sm:h-20 sm:w-20">
                        <ProductImage product={l.product} alt={productName(l.product)} size={160} sizes="80px" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-secondary-900 dark:text-white">{productName(l.product)}</p>
                        <p className="text-sm text-secondary-500">{l.product.sku}</p>
                        <p className="font-bold text-primary-600">{formatPrice(l.product.price)}</p>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <button type="button" onClick={() => removeFromCart(l.product.id)} className="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950" aria-label={t('checkout.cart.removeNamed', { name: productName(l.product) })}>
                          <TrashIcon className="h-4 w-4" />
                        </button>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setCartQty(l.product.id, l.qty - 1)} className="rounded bg-secondary-200 p-1 dark:bg-secondary-700" aria-label={t('checkout.cart.decrease')}>
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{l.qty}</span>
                          <button type="button" onClick={() => setCartQty(l.product.id, l.qty + 1)} className="rounded bg-secondary-200 p-1 dark:bg-secondary-700" aria-label={t('checkout.cart.increase')}>
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4">
                    {state.coupon ? (
                      <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950/30 dark:text-green-200">
                        <span>{t('checkout.cart.couponApplied', { code: state.coupon })}</span>
                        <button type="button" onClick={clearCoupon} className="font-semibold hover:underline">{t('checkout.cart.removeCoupon')}</button>
                      </div>
                    ) : (
                      <form
                        className="flex gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          submitCoupon();
                        }}
                      >
                        <input value={couponInput} onChange={(e) => { setCouponInput(e.target.value); setCouponError(false); }} placeholder={t('checkout.cart.couponPlaceholder')} aria-label={t('checkout.cart.couponPlaceholder')} className={`${inputClass} flex-1 ${couponError ? inputErrorClass : ''}`} />
                        <Button type="submit" variant="outline">{t('checkout.cart.applyCoupon')}</Button>
                      </form>
                    )}
                    {couponError && <p className="mt-1 text-sm text-red-600">{t('checkout.cart.couponInvalid')}</p>}
                    <SampleNote>{t('checkout.cart.couponHint')}</SampleNote>
                  </div>
                </div>
              )}
            </Card>
          )}

          {step === 1 && (
            <Card variant="bordered" padding="md">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-xl font-bold text-secondary-900 dark:text-white">
                  <MapPinIcon className="h-6 w-6 text-primary-600" />
                  {t('checkout.address.title')}
                </h2>
                <Button size="sm" variant="ghost" onClick={() => { setDetails(SAMPLE_DETAILS); setShowErrors(false); }}>
                  {t('checkout.address.fillSample')}
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field id="co-name" label={t('checkout.address.fullName')} value={details.fullName} onChange={(v) => set('fullName', v)} error={fieldError('fullName')} autoComplete="name" />
                <div>
                  <FieldLabel htmlFor="co-doc" required>{t('checkout.address.document')}</FieldLabel>
                  <div className="flex gap-2">
                    <select aria-label={t('checkout.address.docType')} value={details.docType} onChange={(e) => set('docType', e.target.value as Details['docType'])} className={`${inputClass} w-24`}>
                      {DOC_TYPES.map((d) => <option key={d} value={d}>{t(`checkout.address.docTypes.${d}`)}</option>)}
                    </select>
                    <input id="co-doc" inputMode="numeric" value={details.docNumber} onChange={(e) => set('docNumber', e.target.value)} className={`${inputClass} flex-1 ${fieldError('docNumber') ? inputErrorClass : ''}`} aria-invalid={!!fieldError('docNumber')} />
                  </div>
                  {fieldError('docNumber') && <p className="mt-1 text-xs text-red-600">{fieldError('docNumber')}</p>}
                </div>
                <Field id="co-email" type="email" label={t('checkout.address.email')} value={details.email} onChange={(v) => set('email', v)} error={fieldError('email')} autoComplete="email" />
                <Field id="co-phone" type="tel" label={t('checkout.address.phone')} value={details.phone} onChange={(v) => set('phone', v)} error={fieldError('phone')} placeholder="300 123 4567" autoComplete="tel" />
                <div>
                  <FieldLabel htmlFor="co-city" required>{t('checkout.address.city')}</FieldLabel>
                  <select id="co-city" value={details.cityId} onChange={(e) => set('cityId', e.target.value)} className={inputClass}>
                    {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.department})</option>)}
                  </select>
                </div>
                <Field id="co-address" label={t('checkout.address.address')} value={details.address} onChange={(v) => set('address', v)} error={fieldError('address')} placeholder="Calle 10 # 20-30, apto 101" autoComplete="street-address" />
              </div>
              {city && (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-primary-50 p-3 text-sm text-primary-800 dark:bg-primary-950/40 dark:text-primary-200">
                  <TruckIcon className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>{t('checkout.address.deliveryEstimate', { city: city.name, min: city.days[0], max: city.days[1], warehouse: t(`warehouses.${city.warehouse}`) })}</span>
                </div>
              )}
              <label className="mt-4 flex items-start gap-2 text-sm text-secondary-700 dark:text-secondary-300">
                <input type="checkbox" checked={details.wantsCompany} onChange={(e) => set('wantsCompany', e.target.checked)} className="mt-1" />
                <span>{t('checkout.address.wantsCompany')}</span>
              </label>
              {details.wantsCompany && (
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Field id="co-company" label={t('checkout.address.companyName')} value={details.companyName} onChange={(v) => set('companyName', v)} error={fieldError('companyName')} />
                  <div>
                    <Field id="co-nit" label={t('checkout.address.companyNit')} value={details.companyNit} onChange={(v) => set('companyNit', v)} error={fieldError('companyNit')} placeholder="900123456" />
                    {/^\d{9}$/.test(details.companyNit.replace(/\D/g, '')) && (
                      <p className="mt-1 text-xs text-secondary-500">{t('checkout.address.nitDv', { dv: nitCheckDigit(details.companyNit) })}</p>
                    )}
                  </div>
                </div>
              )}
              <label className={`mt-4 flex items-start gap-2 text-sm ${fieldError('consent') ? 'text-red-600' : 'text-secondary-700 dark:text-secondary-300'}`}>
                <input type="checkbox" checked={details.consent} onChange={(e) => set('consent', e.target.checked)} className="mt-1" aria-invalid={!!fieldError('consent')} />
                <span>{t('checkout.address.consent')}</span>
              </label>
              <SampleNote>{t('checkout.address.privacyNote')}</SampleNote>
            </Card>
          )}

          {step === 2 && (
            <Card variant="bordered" padding="md">
              <h2 className="mb-1 flex items-center gap-2 text-xl font-bold text-secondary-900 dark:text-white">
                <CreditCardIcon className="h-6 w-6 text-primary-600" />
                {t('checkout.payment.title')}
              </h2>
              <p className="mb-4 text-sm text-secondary-500">{t('checkout.payment.subtitle')}</p>
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label={t('checkout.payment.title')}>
                {PAYMENT_METHODS.map((pm) => {
                  const Icon = METHOD_ICONS[pm];
                  return (
                    <button
                      key={pm}
                      type="button"
                      role="radio"
                      aria-checked={method === pm}
                      onClick={() => { setMethod(pm); setPayErrors([]); setDeclined(false); }}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${method === pm ? 'border-primary-600 bg-primary-50 dark:bg-primary-950' : 'border-secondary-200 hover:border-secondary-400 dark:border-secondary-700'}`}
                    >
                      <Icon className="h-6 w-6 text-primary-600" />
                      <span className="text-center text-xs font-medium text-secondary-900 dark:text-white">{t(`paymentMethods.${pm}`)}</span>
                    </button>
                  );
                })}
              </div>

              {method === 'card' && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Field
                      id="co-card"
                      label={t('checkout.payment.cardNumber')}
                      value={card.number}
                      onChange={(v) => setCard({ ...card, number: v.replace(/[^\d ]/g, '').slice(0, 23) })}
                      error={payErrors.includes('cardNumber') ? t('checkout.errors.cardNumber') : null}
                      placeholder="4242 4242 4242 4242"
                      inputMode="numeric"
                      autoComplete="off"
                    />
                    {cardBrand(card.number) && <p className="mt-1 text-xs text-secondary-500">{t(`checkout.payment.brands.${cardBrand(card.number)}`)}</p>}
                  </div>
                  <Field id="co-card-name" label={t('checkout.payment.cardName')} value={card.name} onChange={(v) => setCard({ ...card, name: v })} error={payErrors.includes('cardName') ? t('checkout.errors.cardName') : null} autoComplete="off" />
                  <div className="grid grid-cols-2 gap-3">
                    <Field id="co-card-exp" label={t('checkout.payment.cardExpiry')} value={card.expiry} onChange={(v) => setCard({ ...card, expiry: v.slice(0, 5) })} error={payErrors.includes('cardExpiry') ? t('checkout.errors.cardExpiry') : null} placeholder="12/28" autoComplete="off" />
                    <Field id="co-card-cvv" label={t('checkout.payment.cardCvv')} value={card.cvv} onChange={(v) => setCard({ ...card, cvv: v.replace(/\D/g, '').slice(0, 4) })} error={payErrors.includes('cardCvv') ? t('checkout.errors.cardCvv') : null} placeholder="123" inputMode="numeric" autoComplete="off" />
                  </div>
                  <div className="md:col-span-2 flex flex-wrap items-center gap-2">
                    <SampleNote>{t('checkout.payment.cardHint')}</SampleNote>
                    <button type="button" className="text-xs font-semibold text-primary-600 hover:underline" onClick={() => setCard({ number: '4242 4242 4242 4242', name: details.fullName.toUpperCase() || 'LAURA MARTINEZ', expiry: '12/29', cvv: '123' })}>
                      {t('checkout.payment.useTestCard')}
                    </button>
                    <button type="button" className="text-xs font-semibold text-primary-600 hover:underline" onClick={() => setCard({ number: '4000 0000 0000 0002', name: details.fullName.toUpperCase() || 'LAURA MARTINEZ', expiry: '12/29', cvv: '123' })}>
                      {t('checkout.payment.useDeclinedCard')}
                    </button>
                  </div>
                </div>
              )}
              {method === 'pse' && <MethodNote>{t('checkout.payment.pseHint')}</MethodNote>}
              {(method === 'nequi' || method === 'daviplata') && (
                <div className="space-y-2">
                  <Field id="co-wallet" type="tel" label={t('checkout.payment.walletPhone', { wallet: t(`paymentMethods.${method}`) })} value={walletPhone} onChange={setWalletPhone} error={payErrors.includes('walletPhone') ? t('checkout.errors.phone') : null} />
                  <MethodNote>{t('checkout.payment.walletHint', { wallet: t(`paymentMethods.${method}`) })}</MethodNote>
                </div>
              )}
              {method === 'cod' && <MethodNote>{t('checkout.payment.codHint')}</MethodNote>}
              {method === 'addi' && (
                <MethodNote tone={payErrors.includes('addiMin') ? 'error' : 'info'}>
                  {t('checkout.payment.addiHint', { min: formatPrice(ADDI_MIN) })}
                </MethodNote>
              )}

              {declined && (
                <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
                  <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
                  <span>{t('checkout.payment.declined')}</span>
                </div>
              )}
            </Card>
          )}

          {step === 3 && order && (
            <Confirmation order={order} lines={orderLines} onContinue={() => setView('storefront')} />
          )}

          {step < 3 && (
            <div className="mt-6 flex gap-3">
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep((s) => (s - 1) as Step)} disabled={processing} className="flex items-center gap-2">
                  <ArrowLeftIcon className="h-4 w-4" /> {t('checkout.back')}
                </Button>
              )}
              {step < 2 ? (
                <Button onClick={goNext} disabled={step === 0 && cartLines.length === 0} className="ml-auto flex items-center gap-2">
                  {t('checkout.continue')}
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={pay} isLoading={processing} disabled={processing || cartLines.length === 0} className="ml-auto">
                  {processing ? t('checkout.payment.processing') : t('checkout.placeOrder', { amount: formatPrice(pricing.total) })}
                </Button>
              )}
            </div>
          )}
          {step === 1 && showErrors && Object.keys(errors).length > 0 && (
            <p role="alert" className="mt-2 text-right text-sm text-red-600">{t('checkout.errors.summary')}</p>
          )}
        </div>

        <div className="lg:col-span-1">
          {step < 3 ? (
            <Summary pricing={pricing} count={cartLines.reduce((s, l) => s + l.qty, 0)} />
          ) : (
            order && <Summary pricing={{ subtotal: order.subtotal, adjustments: [], discount: order.discount, net: order.net, shipping: order.shipping, ivaIncluded: order.ivaIncluded, total: order.total }} count={order.lines.reduce((s, l) => s + l.qty, 0)} paid />
          )}
        </div>
      </div>
    </div>
  );
}

function Summary({ pricing, count, paid }: { pricing: CartPricing; count: number; paid?: boolean }) {
  const t = useTranslations('demoEcommerce2');
  const { state } = useStore();
  const missing = FREE_SHIPPING_FROM - pricing.net;
  return (
    <Card variant="elevated" padding="md" className="lg:sticky lg:top-40">
      <CardContent>
        <h3 className="mb-3 font-bold text-secondary-900 dark:text-white">{paid ? t('checkout.summary.paidTitle') : t('checkout.summary.title')}</h3>
        <div className="space-y-2 text-sm">
          <Row label={t('checkout.summary.subtotal', { n: count })} value={formatPrice(pricing.subtotal)} />
          {pricing.adjustments.map((a) => (
            <Row key={a.key} label={t(`checkout.summary.adjustments.${a.key}`, { code: state.coupon ?? '' })} value={`-${formatPrice(a.amount)}`} accent />
          ))}
          {paid && pricing.discount > 0 && <Row label={t('checkout.summary.discount')} value={`-${formatPrice(pricing.discount)}`} accent />}
          <Row label={t('checkout.summary.shipping')} value={pricing.shipping === 0 ? t('checkout.summary.free') : formatPrice(pricing.shipping)} />
          <div className="mt-2 border-t border-secondary-200 pt-2 dark:border-secondary-700">
            <Row label={t('checkout.summary.total')} value={formatPrice(pricing.total)} bold />
          </div>
          <Row label={t('checkout.summary.taxIncluded', { rate: Math.round(IVA_RATE * 100) })} value={formatPrice(pricing.ivaIncluded)} muted />
        </div>
        {!paid && pricing.net > 0 && (
          <p className="mt-3 text-xs text-secondary-500">
            {!state.rules.freeShipping
              ? t('checkout.summary.shippingFlat')
              : pricing.shipping === 0
                ? `✓ ${t('checkout.summary.freeShippingApplied')}`
                : t('checkout.summary.freeShippingMissing', { amount: formatPrice(missing) })}
          </p>
        )}
        {!paid && <p className="mt-2 text-xs text-secondary-500">{t('checkout.summary.rulesNote')}</p>}
      </CardContent>
    </Card>
  );
}

function Confirmation({ order, lines, onContinue }: { order: Order; lines: Array<{ name: string; qty: number; unitPrice: number }>; onContinue: () => void }) {
  const t = useTranslations('demoEcommerce2');
  const { setView, notify } = useStore();
  const city = CITY_BY_ID[order.cityId];
  const methodLabel = t(`paymentMethods.${order.method}`);
  const whatsapp = t('checkout.confirmation.whatsappText', {
    name: order.customer.split(' ')[0],
    order: order.id,
    total: formatPrice(order.total),
    method: methodLabel,
    city: city?.name ?? '',
    min: city?.days[0] ?? 1,
    max: city?.days[1] ?? 3,
  });

  async function downloadPdf() {
    await downloadInvoicePdf(
      order,
      lines,
      {
        title: t('invoice.title'), notValid: t('invoice.notValid'), seller: t('invoice.seller'), buyer: t('invoice.buyer'),
        document: t('invoice.document'), address: t('invoice.address'), order: t('invoice.order'), date: t('invoice.date'),
        payment: t('invoice.payment'), product: t('invoice.product'), qty: t('invoice.qty'), unit: t('invoice.unit'),
        amount: t('invoice.amount'), subtotal: t('invoice.subtotal'), discount: t('invoice.discount'), shipping: t('invoice.shipping'),
        total: t('invoice.total'), ivaIncluded: t('invoice.ivaIncluded', { rate: Math.round(IVA_RATE * 100) }), cufe: t('invoice.cufe'), cufePending: t('invoice.cufePending'),
        footer: t('invoice.footer'),
      },
      methodLabel,
      localStamp(order.createdAt ?? Date.now()),
    );
    notify(t('toasts.invoiceDownloaded', { order: order.id }));
  }

  async function copyWhatsapp() {
    try {
      await navigator.clipboard.writeText(whatsapp);
      notify(t('toasts.copied'));
    } catch {
      notify(t('toasts.copyFailed'));
    }
  }

  return (
    <Card variant="bordered" padding="md">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <CheckCircleIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-secondary-900 dark:text-white">{order.method === 'cod' ? t('checkout.confirmation.titleCod') : t('checkout.confirmation.title')}</h2>
        <p className="mb-6 text-secondary-500">{t('checkout.confirmation.subtitle')}</p>
      </div>
      <div className="mb-6 space-y-3 rounded-lg bg-secondary-50 p-4 text-left text-sm dark:bg-secondary-800">
        <Row label={t('checkout.confirmation.orderNumber')} value={order.id} mono />
        <Row label={t('checkout.confirmation.method')} value={`${methodLabel}${order.method === 'cod' ? ` · ${t('checkout.confirmation.pendingPayment')}` : ` · ${t('checkout.confirmation.approved')}`}`} />
        <Row label={t('checkout.confirmation.email')} value={order.email ?? ''} />
        <Row label={t('checkout.confirmation.total')} value={formatPrice(order.total)} />
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-secondary-500">{t('checkout.confirmation.cufe')}</span>
            <span className="truncate font-mono text-xs text-secondary-900 dark:text-white" title={order.cufe}>
              {order.cufe ? `${order.cufe.slice(0, 24)}…` : t('invoice.cufePending')}
            </span>
          </div>
          <SampleNote>{t('checkout.confirmation.cufeHint')}</SampleNote>
        </div>
      </div>
      <div className="mb-6 flex items-center justify-center gap-2 rounded-lg bg-green-50 p-4 text-green-700 dark:bg-green-950/30 dark:text-green-300">
        <TruckIcon className="h-5 w-5 shrink-0" />
        <span className="text-sm">{t('checkout.confirmation.delivery', { city: city?.name ?? '', min: city?.days[0] ?? 1, max: city?.days[1] ?? 3 })}</span>
      </div>
      <div className="mb-6 rounded-lg border border-secondary-200 p-4 dark:border-secondary-700">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-secondary-900 dark:text-white">
          <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-green-600" />
          {t('checkout.confirmation.whatsappTitle')}
        </p>
        <p className="whitespace-pre-line rounded-lg bg-green-50 p-3 text-sm text-secondary-800 dark:bg-green-950/30 dark:text-secondary-100">{whatsapp}</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <SampleNote>{t('checkout.confirmation.whatsappHint')}</SampleNote>
          <Button size="sm" variant="ghost" onClick={copyWhatsapp} className="flex items-center gap-1">
            <ClipboardDocumentIcon className="h-4 w-4" /> {t('checkout.confirmation.copy')}
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
        <Button variant="outline" onClick={downloadPdf} className="flex items-center justify-center gap-2">
          <ArrowDownTrayIcon className="h-4 w-4" /> {t('checkout.confirmation.downloadInvoice')}
        </Button>
        <Button variant="outline" onClick={() => setView('vendor')}>{t('checkout.confirmation.seeInPanel')}</Button>
        <Button onClick={onContinue}>{t('checkout.confirmation.continueShopping')}</Button>
      </div>
    </Card>
  );
}

function MethodNote({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'error' }) {
  return (
    <div className={`rounded-lg p-4 text-sm ${tone === 'error' ? 'border border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200' : 'bg-secondary-50 text-secondary-600 dark:bg-secondary-800 dark:text-secondary-300'}`}>
      {children}
    </div>
  );
}

function Field({ id, label, value, onChange, type = 'text', placeholder, error, inputMode, autoComplete }: {
  id: string; label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; error?: string | null;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']; autoComplete?: string;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id} required>{label}</FieldLabel>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        className={`${inputClass} ${error ? inputErrorClass : ''}`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Row({ label, value, mono = false, bold = false, muted = false, accent = false }: { label: string; value: string; mono?: boolean; bold?: boolean; muted?: boolean; accent?: boolean }) {
  const valueClass = bold
    ? 'text-lg font-bold text-primary-600'
    : muted
      ? 'text-xs text-secondary-500'
      : accent
        ? 'font-medium text-green-700 dark:text-green-400'
        : 'font-medium text-secondary-900 dark:text-white';
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={`text-secondary-500 ${muted ? 'text-xs' : ''}`}>{label}</span>
      <span className={`${valueClass} ${mono ? 'font-mono text-xs' : ''} text-right`}>{value}</span>
    </div>
  );
}
