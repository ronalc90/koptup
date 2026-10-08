'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import {
  BuildingLibraryIcon,
  CheckCircleIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  DocumentArrowDownIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { checkCoupon, EMAIL_RE, luhn, PHONE_CO_RE, pick, totals } from '../lib/engine';
import { useLmsReady } from '../lib/store';
import { courseById, salesList } from '../lib/selectors';
import type { PayMethod } from '../lib/types';
import { downloadReceipt } from './receipt';
import { Modal, SimNote, btn, inputCls, labelCls, selectCls, useFmt } from './ui';

type Step = 'form' | 'processing' | 'done';

const METHODS: { id: PayMethod; icon: typeof CreditCardIcon }[] = [
  { id: 'pse', icon: BuildingLibraryIcon },
  { id: 'card', icon: CreditCardIcon },
  { id: 'nequi', icon: DevicePhoneMobileIcon },
];

export default function CheckoutModal({ courseId, onClose, onLearn }: { courseId: string; onClose: () => void; onLearn: (id: string) => void }) {
  const t = useTranslations('demoLms');
  const f = useFmt();
  const { state, today, dispatch } = useLmsReady();
  const course = courseById(state, courseId);
  const [step, setStep] = useState<Step>('form');
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<{ code: string; pct: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [name, setName] = useState(state.profile.name);
  const [email, setEmail] = useState(state.profile.email);
  const [doc, setDoc] = useState(state.profile.doc);
  const [method, setMethod] = useState<PayMethod>('pse');
  const [personType, setPersonType] = useState<'natural' | 'juridica'>('natural');
  const [card, setCard] = useState({ number: '', exp: '', cvv: '' });
  const [phone, setPhone] = useState('');
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const tt = useMemo(() => totals(course?.price ?? 0, coupon?.pct ?? 0), [course, coupon]);
  const sale = useMemo(() => {
    if (step !== 'done') return null;
    return salesList(state).find((x) => x.mine && x.courseId === courseId) ?? null;
  }, [step, state, courseId]);

  if (!course) return null;
  const free = course.price === 0;

  const applyCoupon = () => {
    const r = checkCoupon(couponInput, state.coupons);
    if (r.ok) {
      setCoupon({ code: r.coupon.code, pct: r.coupon.pct });
      setCouponMsg({ ok: true, text: t('checkout.couponApplied', { code: r.coupon.code, pct: r.coupon.pct }) });
    } else {
      setCoupon(null);
      setCouponMsg({ ok: false, text: t(`checkout.coupon_${r.reason}`) });
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 3) e.name = t('checkout.errName');
    if (!EMAIL_RE.test(email.trim())) e.email = t('checkout.errEmail');
    if (!/^\d{5,12}$/.test(doc.replace(/\D/g, '')) || doc.replace(/\D/g, '') !== doc.trim()) e.doc = t('checkout.errDoc');
    if (!free) {
      if (method === 'card') {
        if (!luhn(card.number)) e.cardNumber = t('checkout.errCard');
        const m = card.exp.match(/^(\d{2})\/(\d{2})$/);
        const month = m ? Number(m[1]) : 0;
        const year = m ? 2000 + Number(m[2]) : 0;
        const [ty, tm] = today.split('-').map(Number);
        if (!m || month < 1 || month > 12 || year < ty || (year === ty && month < tm)) e.cardExp = t('checkout.errExp');
        if (!/^\d{3,4}$/.test(card.cvv)) e.cardCvv = t('checkout.errCvv');
      }
      if (method === 'nequi' && !PHONE_CO_RE.test(phone.replace(/\D/g, ''))) e.phone = t('checkout.errPhone');
    }
    if (!terms) e.terms = t('checkout.errTerms');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pay = () => {
    if (!validate()) return;
    const profile = { name: name.trim(), email: email.trim(), doc: doc.trim() };
    if (profile.name !== state.profile.name || profile.email !== state.profile.email || profile.doc !== state.profile.doc) {
      dispatch({ type: 'profile.update', profile });
    }
    if (free) {
      dispatch({ type: 'enroll.free', courseId: course.id });
      toast.success(t('checkout.enrolledFree'));
      onLearn(course.id);
      return;
    }
    setStep('processing');
    timer.current = setTimeout(() => {
      dispatch({
        type: 'purchase',
        courseId: course.id,
        method,
        coupon: coupon?.code,
        last4: method === 'card' ? card.number.replace(/\D/g, '').slice(-4) : undefined,
        buyer: profile.name,
        email: profile.email,
        doc: profile.doc,
      });
      setStep('done');
    }, 1400);
  };

  const clearErr = (...keys: string[]) =>
    setErrors((e) => {
      if (!keys.some((k) => e[k])) return e;
      const n = { ...e };
      keys.forEach((k) => delete n[k]);
      return n;
    });

  const err = (k: string) => (errors[k] ? <p className="text-[11px] text-red-600 dark:text-red-400 mt-1">{errors[k]}</p> : null);

  return (
    <Modal
      open
      onClose={step === 'processing' ? () => undefined : onClose}
      title={step === 'done' ? t('checkout.doneTitle') : free ? t('checkout.titleFree') : t('checkout.title')}
      labelledBy="lms-checkout-title"
      size="lg"
      closeLabel={t('common.close')}
    >
      {step === 'form' && (
        <div className="p-5 grid md:grid-cols-5 gap-5">
          <div className="md:col-span-3 space-y-4">
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-secondary-900 dark:text-white mb-1">{t('checkout.buyer')}</legend>
              <div>
                <label className={labelCls} htmlFor="lms-co-name">
                  {t('checkout.name')}
                </label>
                <input id="lms-co-name" className={inputCls} value={name} onChange={(e) => {
                    setName(e.target.value);
                    clearErr('name');
                  }} autoComplete="off" />
                {err('name')}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="lms-co-email">
                    {t('checkout.email')}
                  </label>
                  <input id="lms-co-email" type="email" className={inputCls} value={email} onChange={(e) => {
                      setEmail(e.target.value);
                      clearErr('email');
                    }} autoComplete="off" />
                  {err('email')}
                </div>
                <div>
                  <label className={labelCls} htmlFor="lms-co-doc">
                    {t('checkout.doc')}
                  </label>
                  <input id="lms-co-doc" inputMode="numeric" className={inputCls} value={doc} onChange={(e) => {
                      setDoc(e.target.value);
                      clearErr('doc');
                    }} autoComplete="off" />
                  {err('doc')}
                </div>
              </div>
            </fieldset>

            {!free && (
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-secondary-900 dark:text-white mb-1">{t('checkout.method')}</legend>
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('checkout.method')}>
                  {METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={method === m.id}
                      onClick={() => setMethod(m.id)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium transition ${
                        method === m.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200'
                          : 'border-secondary-200 dark:border-secondary-700 text-secondary-700 dark:text-secondary-200 hover:border-primary-300'
                      }`}
                    >
                      <m.icon className="w-5 h-5" />
                      {t(`pay.${m.id}`)}
                    </button>
                  ))}
                </div>

                {method === 'pse' && (
                  <div>
                    <label className={labelCls} htmlFor="lms-co-person">
                      {t('checkout.personType')}
                    </label>
                    <select id="lms-co-person" className={selectCls} value={personType} onChange={(e) => setPersonType(e.target.value as 'natural' | 'juridica')}>
                      <option value="natural">{t('checkout.personNatural')}</option>
                      <option value="juridica">{t('checkout.personLegal')}</option>
                    </select>
                    <p className="text-[11px] text-secondary-500 dark:text-secondary-400 mt-1">{t('checkout.pseHint')}</p>
                  </div>
                )}

                {method === 'card' && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <label className={labelCls} htmlFor="lms-co-card">
                          {t('checkout.cardNumber')}
                        </label>
                        <button
                          type="button"
                          className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:underline mb-1"
                          onClick={() => {
                            setCard({ number: '4242 4242 4242 4242', exp: '12/30', cvv: '123' });
                            clearErr('cardNumber', 'cardExp', 'cardCvv');
                          }}
                        >
                          {t('checkout.testCard')}
                        </button>
                      </div>
                      <input
                        id="lms-co-card"
                        inputMode="numeric"
                        className={inputCls}
                        value={card.number}
                        placeholder="0000 0000 0000 0000"
                        onChange={(e) => {
                          clearErr('cardNumber');
                          setCard((c) => ({
                            ...c,
                            number: e.target.value
                              .replace(/\D/g, '')
                              .slice(0, 19)
                              .replace(/(\d{4})(?=\d)/g, '$1 '),
                          }));
                        }}
                        autoComplete="off"
                      />
                      {err('cardNumber')}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls} htmlFor="lms-co-exp">
                          {t('checkout.cardExp')}
                        </label>
                        <input
                          id="lms-co-exp"
                          className={inputCls}
                          placeholder={t('checkout.cardExpPlaceholder')}
                          value={card.exp}
                          onChange={(e) => {
                            clearErr('cardExp');
                            const d = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setCard((c) => ({ ...c, exp: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }));
                          }}
                          autoComplete="off"
                        />
                        {err('cardExp')}
                      </div>
                      <div>
                        <label className={labelCls} htmlFor="lms-co-cvv">
                          CVV
                        </label>
                        <input
                          id="lms-co-cvv"
                          inputMode="numeric"
                          className={inputCls}
                          value={card.cvv}
                          onChange={(e) => {
                            clearErr('cardCvv');
                            setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }));
                          }}
                          autoComplete="off"
                        />
                        {err('cardCvv')}
                      </div>
                    </div>
                  </div>
                )}

                {method === 'nequi' && (
                  <div>
                    <label className={labelCls} htmlFor="lms-co-phone">
                      {t('checkout.phone')}
                    </label>
                    <input id="lms-co-phone" inputMode="numeric" className={inputCls} placeholder="3001234567" value={phone} onChange={(e) => {
                        setPhone(e.target.value);
                        clearErr('phone');
                      }} autoComplete="off" />
                    {err('phone')}
                    <p className="text-[11px] text-secondary-500 dark:text-secondary-400 mt-1">{t('checkout.nequiHint')}</p>
                  </div>
                )}
              </fieldset>
            )}

            <div>
              <label className="flex items-start gap-2 text-xs text-secondary-700 dark:text-secondary-200">
                <input type="checkbox" className="mt-0.5 rounded" checked={terms} onChange={(e) => {
                    setTerms(e.target.checked);
                    clearErr('terms');
                  }} />
                <span>{t('checkout.terms')}</span>
              </label>
              {err('terms')}
            </div>
          </div>

          <aside className="md:col-span-2 space-y-4">
            <div className="rounded-xl border border-secondary-200 dark:border-secondary-700 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">{t('checkout.summary')}</p>
              <p className="text-sm font-bold text-secondary-900 dark:text-white">{pick(course.title, f.locale)}</p>
              {!free && (
                <>
                  <div className="flex gap-2">
                    <input
                      className={inputCls}
                      placeholder={t('checkout.couponPlaceholder')}
                      value={couponInput}
                      aria-label={t('checkout.couponPlaceholder')}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                    />
                    <button type="button" className={btn.outline} onClick={applyCoupon}>
                      {t('checkout.apply')}
                    </button>
                  </div>
                  {couponMsg && <p className={`text-[11px] ${couponMsg.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600 dark:text-red-400'}`}>{couponMsg.text}</p>}
                  <p className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('checkout.couponHint')}</p>
                  <dl className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-secondary-600 dark:text-secondary-300">{t('checkout.price')}</dt>
                      <dd>{f.money(tt.gross)}</dd>
                    </div>
                    {tt.discount > 0 && (
                      <div className="flex justify-between text-emerald-700 dark:text-emerald-300">
                        <dt>{t('checkout.discount', { code: coupon?.code ?? '' })}</dt>
                        <dd>- {f.money(tt.discount)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold border-t border-secondary-200 dark:border-secondary-700 pt-2 mt-2 text-secondary-900 dark:text-white">
                      <dt>{t('checkout.total')}</dt>
                      <dd>{f.money(tt.total)}</dd>
                    </div>
                    <p className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('checkout.ivaNote', { iva: f.money(tt.iva) })}</p>
                  </dl>
                </>
              )}
            </div>
            <button type="button" className={`${btn.primary} w-full py-3`} onClick={pay}>
              <LockClosedIcon className="w-4 h-4" />
              {free ? t('checkout.enrollFree') : t('checkout.pay', { total: f.money(tt.total) })}
            </button>
            <SimNote>{t('checkout.simNote')}</SimNote>
          </aside>
        </div>
      )}

      {step === 'processing' && (
        <div className="p-10 flex flex-col items-center text-center gap-4" role="status" aria-live="polite">
          <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
          <p className="text-sm font-medium text-secondary-800 dark:text-secondary-100">{t(`checkout.processing_${method}`)}</p>
          <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('checkout.processingNote')}</p>
        </div>
      )}

      {step === 'done' && (
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="w-10 h-10 text-emerald-500 shrink-0" />
            <div>
              <p className="text-lg font-bold text-secondary-900 dark:text-white">{t('checkout.approved')}</p>
              <p className="text-sm text-secondary-600 dark:text-secondary-300">{t('checkout.approvedBody', { course: pick(course.title, f.locale) })}</p>
            </div>
          </div>
          {sale && (
            <dl className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800/50">
                <dt className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('receipt.ref')}</dt>
                <dd className="font-mono font-semibold text-secondary-900 dark:text-white">{sale.ref}</dd>
              </div>
              <div className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800/50">
                <dt className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('receipt.invoice')}</dt>
                <dd className="font-mono font-semibold text-secondary-900 dark:text-white">
                  {sale.invoice} <span className="font-sans font-normal text-[11px] text-secondary-500">({t('receipt.invoiceSim')})</span>
                </dd>
              </div>
              <div className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800/50">
                <dt className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('receipt.method')}</dt>
                <dd className="font-semibold text-secondary-900 dark:text-white">
                  {t(`pay.${sale.method}`)}
                  {sale.last4 ? ` •••• ${sale.last4}` : ''}
                </dd>
              </div>
              <div className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800/50">
                <dt className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('receipt.total')}</dt>
                <dd className="font-semibold text-secondary-900 dark:text-white">{f.money(sale.total)}</dd>
              </div>
            </dl>
          )}
          <SimNote>{t('checkout.doneNote', { email: state.profile.email })}</SimNote>
          <div className="flex flex-col sm:flex-row gap-2">
            {sale && (
              <button
                type="button"
                className={`${btn.outline} flex-1`}
                onClick={() => {
                  downloadReceipt(sale, pick(course.title, f.locale), t, f).catch(() => toast.error(t('common.pdfError')));
                }}
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                {t('checkout.downloadReceipt')}
              </button>
            )}
            <button type="button" className={`${btn.primary} flex-1`} onClick={() => onLearn(course.id)}>
              {t('checkout.goToCourse')}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
