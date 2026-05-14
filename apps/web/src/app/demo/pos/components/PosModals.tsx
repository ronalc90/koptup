'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  XMarkIcon,
  BanknotesIcon,
  CreditCardIcon,
  QrCodeIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
  CheckCircleIcon,
  PrinterIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

type Sz = 'small' | 'medium' | 'large';
export interface ModifiersValue {
  size: Sz;
  extras: string[];
  note: string;
}

export function ModifiersModal({
  productName,
  basePrice,
  onCancel,
  onConfirm,
}: {
  productName: string;
  basePrice: number;
  onCancel: () => void;
  onConfirm: (val: ModifiersValue, deltaPrice: number) => void;
}) {
  const t = useTranslations('demoPos');
  const [size, setSize] = useState<Sz>('medium');
  const [extras, setExtras] = useState<string[]>([]);
  const [note, setNote] = useState('');

  const sizeDelta: Record<Sz, number> = { small: -1500, medium: 0, large: 2500 };
  const extraOptions = ['cheese', 'bacon', 'sauce', 'ice', 'sugar'];
  const extraPrice = (k: string) => (k === 'ice' || k === 'sugar' ? 0 : 2000);
  const delta =
    sizeDelta[size] + extras.reduce((s, k) => s + extraPrice(k), 0);

  const toggle = (k: string) =>
    setExtras((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="pos-modifiers-title" className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-secondary-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 id="pos-modifiers-title" className="text-xl font-bold text-secondary-900 dark:text-white">
              {t('modifiers.title', { name: productName })}
            </h2>
            <button onClick={onCancel} aria-label={t('common.close')} className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-2">
                {t('modifiers.size')}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(['small', 'medium', 'large'] as Sz[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`py-3 rounded-lg font-medium border-2 transition ${
                      size === s
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300'
                        : 'border-secondary-200 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 hover:border-secondary-400'
                    }`}
                  >
                    {t(`modifiers.sizes.${s}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-2">
                {t('modifiers.extras')}
              </p>
              <div className="flex flex-wrap gap-2">
                {extraOptions.map((k) => {
                  const active = extras.includes(k);
                  return (
                    <button
                      key={k}
                      onClick={() => toggle(k)}
                      className={`px-3 py-2 rounded-full text-sm border-2 transition ${
                        active
                          ? 'border-primary-600 bg-primary-600 text-white'
                          : 'border-secondary-300 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300'
                      }`}
                    >
                      {t(`modifiers.extrasItems.${k}`)}
                      {extraPrice(k) > 0 && ` +$${extraPrice(k)}`}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-2">
                {t('modifiers.notes')}
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder={t('modifiers.notesPlaceholder')}
                className="w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center justify-between bg-secondary-50 dark:bg-secondary-800 rounded-lg p-3">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">
                ${basePrice.toLocaleString()} + ${delta.toLocaleString()}
              </span>
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                ${(basePrice + delta).toLocaleString()}
              </span>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                {t('modifiers.cancel')}
              </Button>
              <Button onClick={() => onConfirm({ size, extras, note }, delta)} className="flex-1">
                {t('modifiers.add')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type Method = 'cash' | 'card' | 'qr' | 'wallet' | 'bnpl';
export interface Payment {
  method: Method;
  amount: number;
  cardMode?: 'chip' | 'tap' | 'swipe';
}

export function CheckoutModal({
  total,
  tipPct,
  onTipChange,
  onCancel,
  onApproved,
}: {
  total: number;
  tipPct: number;
  onTipChange: (n: number) => void;
  onCancel: () => void;
  onApproved: (pays: Payment[]) => void;
}) {
  const t = useTranslations('demoPos');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [method, setMethod] = useState<Method>('cash');
  const [amountStr, setAmountStr] = useState('');
  const [cardMode, setCardMode] = useState<'chip' | 'tap' | 'swipe'>('tap');
  const [processing, setProcessing] = useState(false);

  const tipAmount = Math.round(total * (tipPct / 100));
  const grand = total + tipAmount;
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const pending = Math.max(0, grand - paid);
  const change = Math.max(0, paid - grand);

  const methods: { id: Method; icon: any }[] = [
    { id: 'cash', icon: BanknotesIcon },
    { id: 'card', icon: CreditCardIcon },
    { id: 'qr', icon: QrCodeIcon },
    { id: 'wallet', icon: DevicePhoneMobileIcon },
    { id: 'bnpl', icon: ClockIcon },
  ];

  const addPayment = () => {
    const amount = parseFloat(amountStr || `${pending}`);
    if (!amount || amount <= 0) return;
    setPayments([...payments, { method, amount, cardMode: method === 'card' ? cardMode : undefined }]);
    setAmountStr('');
  };

  const remove = (i: number) => setPayments(payments.filter((_, idx) => idx !== i));

  const confirm = () => {
    if (paid < grand) return;
    setProcessing(true);
    setTimeout(() => onApproved(payments), 900);
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="pos-checkout-title" className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-secondary-900 rounded-2xl max-w-2xl w-full my-8">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 id="pos-checkout-title" className="text-2xl font-bold text-secondary-900 dark:text-white">
              {t('checkout.title')}
            </h2>
            <button onClick={onCancel} aria-label={t('common.close')} className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Total / pending */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white rounded-xl p-6 mb-6">
            <div className="text-sm opacity-80">{t('checkout.total')}</div>
            <div className="text-4xl font-bold mb-3">${grand.toLocaleString()}</div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="opacity-80">{t('checkout.received')}</div>
                <div className="font-bold text-lg">${paid.toLocaleString()}</div>
              </div>
              <div>
                <div className="opacity-80">{t('checkout.pending')}</div>
                <div className="font-bold text-lg">${pending.toLocaleString()}</div>
              </div>
              <div>
                <div className="opacity-80">{t('checkout.change')}</div>
                <div className="font-bold text-lg">${change.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Tip */}
          <div className="mb-5">
            <p className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-2">
              {t('checkout.tip')}
            </p>
            <div className="flex gap-2">
              {[0, 10, 15, 20].map((p) => (
                <button
                  key={p}
                  onClick={() => onTipChange(p)}
                  className={`flex-1 py-2 rounded-lg font-medium border-2 ${
                    tipPct === p
                      ? 'border-primary-600 bg-primary-600 text-white'
                      : 'border-secondary-200 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300'
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          {/* Method picker */}
          <div className="mb-3">
            <p className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-2">
              {t('checkout.split')} · <span className="font-normal opacity-70">{t('checkout.splitHint')}</span>
            </p>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {methods.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-lg border-2 transition ${
                      method === m.id
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300'
                        : 'border-secondary-200 dark:border-secondary-700 text-secondary-600 dark:text-secondary-400'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[11px] font-medium">{t(`checkout.methods.${m.id}`)}</span>
                  </button>
                );
              })}
            </div>

            {method === 'card' && (
              <div className="flex gap-2 mb-3">
                {(['chip', 'tap', 'swipe'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCardMode(c)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
                      cardMode === c
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : 'border-secondary-300 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300'
                    }`}
                  >
                    {t(`checkout.cardModes.${c}`)}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="number"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder={`${pending}`}
                className="flex-1 px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button onClick={addPayment} variant="outline" className="flex items-center gap-1">
                <PlusIcon className="h-4 w-4" />
                {t('checkout.addPayment')}
              </Button>
            </div>
          </div>

          {/* Payment list */}
          {payments.length > 0 && (
            <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
              {payments.map((p, i) => (
                <div key={i} className="flex items-center justify-between bg-secondary-50 dark:bg-secondary-800 rounded-lg px-3 py-2">
                  <span className="text-sm text-secondary-700 dark:text-secondary-300">
                    {t(`checkout.methods.${p.method}`)}
                    {p.cardMode && ` · ${t(`checkout.cardModes.${p.cardMode}`)}`}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-secondary-900 dark:text-white">
                      ${p.amount.toLocaleString()}
                    </span>
                    <button onClick={() => remove(i)} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950 p-1 rounded">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              {t('checkout.cancel')}
            </Button>
            <Button onClick={confirm} disabled={paid < grand || processing} className="flex-[2]" size="lg">
              {processing ? t('checkout.processing') : t('checkout.confirm')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReceiptModal({
  ticketNo,
  cashier,
  lines,
  subtotal,
  tax,
  tip,
  total,
  payments,
  onClose,
  onNewSale,
}: {
  ticketNo: string;
  cashier: string;
  lines: { name: string; qty: number; total: number }[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  payments: Payment[];
  onClose: () => void;
  onNewSale: () => void;
}) {
  const t = useTranslations('demoPos');
  const [sent, setSent] = useState<string | null>(null);
  const cufe = 'C' + Math.random().toString(36).slice(2, 12).toUpperCase() + ticketNo;

  const send = (ch: 'email' | 'whatsapp' | 'sms') => {
    setSent(t('receipt.sent', { channel: t(`receipt.${ch}`) }));
    setTimeout(() => setSent(null), 2200);
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="pos-receipt-title" className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-secondary-900 rounded-2xl max-w-md w-full my-6">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 id="pos-receipt-title" className="text-xl font-bold text-secondary-900 dark:text-white">
                {t('receipt.title')}
              </h2>
              <p className="text-xs text-secondary-500">{t('receipt.thermal')}</p>
            </div>
            <button onClick={onClose} aria-label={t('common.close')} className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <Badge variant="success" className="mb-3 flex items-center gap-1 w-fit">
            <CheckCircleIcon className="h-4 w-4" />
            {t('receipt.dian')}
          </Badge>

          {/* Thermal preview */}
          <div className="bg-white text-secondary-900 font-mono text-xs rounded-md border-2 border-dashed border-secondary-300 dark:border-secondary-700 p-4 mb-4">
            <div className="text-center mb-2">
              <div className="font-bold">{t('receipt.store')}</div>
              <div>{t('receipt.address')}</div>
              <div>{t('receipt.nit')}</div>
            </div>
            <div className="border-t border-dashed border-secondary-400 my-2" />
            <div className="flex justify-between">
              <span>{t('receipt.ticket', { n: ticketNo })}</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
            <div>{t('receipt.cashier', { name: cashier })}</div>
            <div className="border-t border-dashed border-secondary-400 my-2" />
            {lines.map((l, i) => (
              <div key={i} className="flex justify-between">
                <span className="truncate pr-2">
                  {l.qty}× {l.name}
                </span>
                <span>${l.total.toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-dashed border-secondary-400 my-2" />
            <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>IVA</span><span>${tax.toLocaleString()}</span></div>
            {tip > 0 && <div className="flex justify-between"><span>Tip</span><span>${tip.toLocaleString()}</span></div>}
            <div className="flex justify-between font-bold text-sm mt-1"><span>TOTAL</span><span>${total.toLocaleString()}</span></div>
            <div className="border-t border-dashed border-secondary-400 my-2" />
            {payments.map((p, i) => (
              <div key={i} className="flex justify-between">
                <span>{t(`checkout.methods.${p.method}`)}</span>
                <span>${p.amount.toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-dashed border-secondary-400 my-2" />
            <div className="text-[10px] break-all opacity-70">{t('receipt.cufe', { code: cufe })}</div>
            <div className="text-center mt-2 font-semibold">{t('receipt.thanks')}</div>
          </div>

          <p className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-2">
            {t('receipt.send')}
          </p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button onClick={() => send('email')} className="flex flex-col items-center gap-1 py-2 rounded-lg border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-800">
              <EnvelopeIcon className="h-5 w-5 text-primary-600" />
              <span className="text-xs">{t('receipt.email')}</span>
            </button>
            <button onClick={() => send('whatsapp')} className="flex flex-col items-center gap-1 py-2 rounded-lg border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-800">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-600" />
              <span className="text-xs">{t('receipt.whatsapp')}</span>
            </button>
            <button onClick={() => send('sms')} className="flex flex-col items-center gap-1 py-2 rounded-lg border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-800">
              <DevicePhoneMobileIcon className="h-5 w-5 text-blue-600" />
              <span className="text-xs">{t('receipt.sms')}</span>
            </button>
          </div>

          {sent && (
            <div className="text-center text-sm text-green-600 dark:text-green-400 mb-2">{sent}</div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1 flex items-center justify-center gap-1">
              <PrinterIcon className="h-4 w-4" />
              {t('receipt.print')}
            </Button>
            <Button onClick={onNewSale} className="flex-1">
              {t('receipt.newSale')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
