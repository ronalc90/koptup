'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  BanknotesIcon,
  CreditCardIcon,
  QrCodeIcon,
  GiftIcon,
  CheckCircleIcon,
  PrinterIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
  ScaleIcon,
  CloudArrowUpIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { PRESETS, SCALE_READINGS, type Customer, type ModGroup, type PayMethod, type PresetId, type Product } from './data';
import { dateTimeLabel, docLabel, phoneLabel, plainNumber, type Payment, type Totals } from './engine';
import type { Buyer, Closure, Sale } from './usePosStore';
import { Modal, employeeName, inputCls, printById, selectCls, useFmt } from './ui';

// ---------------------------------------------------------------------------
// Modificadores
// ---------------------------------------------------------------------------

export const MOD_OPTIONS: Record<ModGroup, { key: string; delta: number }[]> = {
  plate: [
    { key: 'half', delta: -8000 },
    { key: 'avocado', delta: 4000 },
    { key: 'egg', delta: 3000 },
    { key: 'chicharron', delta: 7000 },
    { key: 'noOnion', delta: 0 },
  ],
  drink: [
    { key: 'milk', delta: 1500 },
    { key: 'noSugar', delta: 0 },
    { key: 'noIce', delta: 0 },
  ],
};

export function ModifiersModal({
  product,
  basePrice,
  onCancel,
  onConfirm,
}: {
  product: Product;
  basePrice: number;
  onCancel: () => void;
  onConfirm: (mods: string[], note: string, unitPrice: number) => void;
}) {
  const t = useTranslations('demoPos');
  const f = useFmt();
  const [mods, setMods] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const options = MOD_OPTIONS[product.mods ?? 'plate'];
  const delta = options.filter((o) => mods.includes(o.key)).reduce((s, o) => s + o.delta, 0);
  const toggle = (k: string) => setMods((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  return (
    <Modal labelId="pos-mod-title" title={t('modifiers.title', { name: product.name })} subtitle={t('modifiers.subtitle')} onClose={onCancel}>
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {options.map((o) => {
            const active = mods.includes(o.key);
            return (
              <button
                key={o.key}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(o.key)}
                className={`px-3 py-2 rounded-full text-sm border-2 transition ${
                  active
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-secondary-300 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300'
                }`}
              >
                {t(`modifiers.items.${o.key}`)}
                {o.delta !== 0 && ` ${o.delta > 0 ? '+' : ''}${f.money(o.delta)}`}
              </button>
            );
          })}
        </div>
        <div>
          <label htmlFor="pos-mod-note" className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-2 block">
            {t('modifiers.notes')}
          </label>
          <textarea
            id="pos-mod-note"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 80))}
            rows={2}
            placeholder={t('modifiers.notesPlaceholder')}
            className={inputCls}
          />
        </div>
        <div className="flex items-center justify-between bg-secondary-50 dark:bg-secondary-800 rounded-lg p-3">
          <span className="text-sm text-secondary-600 dark:text-secondary-400">
            {f.money(basePrice)} {delta >= 0 ? '+' : '−'} {f.money(Math.abs(delta))}
          </span>
          <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{f.money(basePrice + delta)}</span>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            {t('common.cancel')}
          </Button>
          <Button onClick={() => onConfirm(mods, note.trim(), basePrice + delta)} className="flex-1">
            {t('modifiers.add')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Balanza
// ---------------------------------------------------------------------------

export function WeighModal({
  product,
  pricePerKg,
  available,
  scaleIdx,
  onRead,
  onCancel,
  onConfirm,
}: {
  product: Product;
  pricePerKg: number;
  available: number;
  scaleIdx: number;
  onRead: () => void;
  onCancel: () => void;
  onConfirm: (kg: number) => void;
}) {
  const t = useTranslations('demoPos');
  const f = useFmt();
  const [kgStr, setKgStr] = useState('');
  const kg = Number(kgStr.replace(',', '.'));
  const valid = Number.isFinite(kg) && kg >= 0.01 && kg <= 20;
  const enough = valid && kg <= available + 1e-9;

  const read = () => {
    const v = SCALE_READINGS[scaleIdx % SCALE_READINGS.length];
    setKgStr(f.locale === 'en' ? v.toFixed(3) : v.toFixed(3).replace('.', ','));
    onRead();
  };

  return (
    <Modal labelId="pos-weigh-title" title={t('weigh.title', { name: product.name })} subtitle={t('weigh.subtitle', { price: f.money(pricePerKg) })} onClose={onCancel} size="sm">
      <div className="space-y-4">
        <Button variant="outline" fullWidth onClick={read} className="gap-2">
          <ScaleIcon className="h-5 w-5" />
          {t('weigh.read')}
        </Button>
        <div>
          <label htmlFor="pos-weigh-kg" className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1 block">
            {t('weigh.manual')}
          </label>
          <input
            id="pos-weigh-kg"
            inputMode="decimal"
            value={kgStr}
            onChange={(e) => setKgStr(e.target.value.replace(/[^0-9.,]/g, '').slice(0, 7))}
            placeholder={f.locale === 'en' ? '0.500' : '0,500'}
            className={inputCls}
          />
          <p className="text-[11px] text-secondary-500 mt-1">{t('weigh.available', { kg: f.qty(available, true) })}</p>
          {kgStr && !valid && <p className="text-xs text-red-600 mt-1">{t('weigh.invalid')}</p>}
          {valid && !enough && <p className="text-xs text-red-600 mt-1">{t('errors.stock')}</p>}
        </div>
        <div className="flex items-center justify-between bg-secondary-50 dark:bg-secondary-800 rounded-lg p-3">
          <span className="text-sm text-secondary-600 dark:text-secondary-400">{valid ? `${f.qty(kg, true)} × ${f.money(pricePerKg)}` : '—'}</span>
          <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{valid ? f.money(Math.round(kg * pricePerKg)) : f.money(0)}</span>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            {t('common.cancel')}
          </Button>
          <Button onClick={() => onConfirm(Math.round(kg * 1000) / 1000)} disabled={!valid || !enough} className="flex-1">
            {t('modifiers.add')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Cobro
// ---------------------------------------------------------------------------

const METHOD_ICON: Record<PayMethod, typeof BanknotesIcon> = {
  cash: BanknotesIcon,
  card: CreditCardIcon,
  qr: QrCodeIcon,
  gift: GiftIcon,
};

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

export function CheckoutModal({
  preset,
  totals,
  customer,
  giftCards,
  onCancel,
  onConfirm,
}: {
  preset: PresetId;
  totals: Totals;
  customer?: Customer;
  giftCards: Record<string, number>;
  onCancel: () => void;
  onConfirm: (input: { payments: Payment[]; tipPct: number; buyer: Buyer }) => Promise<void>;
}) {
  const t = useTranslations('demoPos');
  const f = useFmt();
  const isRestaurant = preset === 'restaurant';
  const [tipPct, setTipPct] = useState<number | null>(isRestaurant ? null : 0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [method, setMethod] = useState<PayMethod>('cash');
  const [amountStr, setAmountStr] = useState('');
  const [giftCode, setGiftCode] = useState('');
  const [device, setDevice] = useState<PayMethod | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [wantsInvoice, setWantsInvoice] = useState(false);
  const [docType, setDocType] = useState<Buyer['docType']>('CC');
  const [doc, setDoc] = useState(customer?.doc ?? '');
  const [name, setName] = useState(customer?.name ?? '');
  const [email, setEmail] = useState('');

  const tip = isRestaurant && tipPct ? Math.round(totals.base * (tipPct / 100)) : 0;
  const grand = totals.net + tip;
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const pending = Math.max(0, grand - paid);
  const change = Math.max(0, paid - grand);
  const amount = amountStr ? Number(amountStr) : pending;

  const usedGift = (code: string) => payments.filter((p) => p.method === 'gift' && p.ref === code).reduce((s, p) => s + p.amount, 0);

  const quick = useMemo(() => {
    if (pending <= 0) return [];
    const opts = [pending, Math.ceil(pending / 10000) * 10000, Math.ceil(pending / 50000) * 50000, 100000];
    return Array.from(new Set(opts.filter((v) => v >= pending))).slice(0, 4);
  }, [pending]);

  const buyerDigits = doc.replace(/[^0-9]/g, '');
  const buyerValid = !wantsInvoice || (buyerDigits.length >= 5 && buyerDigits.length <= 12 && name.trim().length >= 3 && emailOk(email));

  const add = (m: PayMethod, value: number) => {
    setError(null);
    if (!Number.isFinite(value) || value <= 0) return setError(t('checkout.errors.amount'));
    if (pending <= 0) return setError(t('checkout.errors.covered'));
    if (m === 'cash') {
      setPayments((p) => [...p, { method: 'cash', amount: Math.round(value) }]);
      setAmountStr('');
      return;
    }
    const capped = Math.min(Math.round(value), pending);
    if (m === 'gift') {
      const code = giftCode.trim().toUpperCase();
      if (!(code in giftCards)) return setError(t('checkout.errors.giftUnknown'));
      const balance = giftCards[code] - usedGift(code);
      if (balance <= 0) return setError(t('checkout.errors.giftEmpty'));
      setPayments((p) => [...p, { method: 'gift', amount: Math.min(capped, balance), ref: code }]);
      setAmountStr('');
      setGiftCode('');
      return;
    }
    setDevice(m);
    window.setTimeout(() => {
      const seed = (paid + capped + payments.length * 7919) % 900000;
      const ref = m === 'card' ? String(100000 + seed) : `QR-${String(seed).padStart(6, '0')}`;
      setPayments((p) => [...p, { method: m, amount: capped, ref }]);
      setAmountStr('');
      setDevice(null);
    }, 900);
  };

  const confirm = async () => {
    if (paid < grand || tipPct === null || !buyerValid || saving) return;
    setSaving(true);
    const buyer: Buyer = wantsInvoice
      ? { kind: 'identified', docType, doc: docType === 'NIT' ? doc.replace(/[^0-9-]/g, '') : buyerDigits, name: name.trim(), email: email.trim() }
      : { kind: 'final', docType: 'CC', doc: '222222222222', name: t('receipt.finalConsumer') };
    await onConfirm({ payments, tipPct: tipPct ?? 0, buyer });
  };

  const missing: string[] = [];
  if (tipPct === null) missing.push(t('checkout.missing.tip'));
  if (pending > 0) missing.push(t('checkout.missing.pending', { amount: f.money(pending) }));
  if (!buyerValid) missing.push(t('checkout.missing.buyer'));

  return (
    <Modal labelId="pos-checkout-title" title={t('checkout.title')} onClose={onCancel} size="lg">
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white rounded-xl p-4 sm:p-5 mb-5">
        <div className="text-sm opacity-80">{t('checkout.total')}</div>
        <div className="text-3xl sm:text-4xl font-bold mb-3">{f.money(grand)}</div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <div className="opacity-80">{t('checkout.received')}</div>
            <div className="font-bold text-base sm:text-lg">{f.money(paid)}</div>
          </div>
          <div>
            <div className="opacity-80">{t('checkout.pending')}</div>
            <div className="font-bold text-base sm:text-lg">{f.money(pending)}</div>
          </div>
          <div>
            <div className="opacity-80">{t('checkout.change')}</div>
            <div className="font-bold text-base sm:text-lg">{f.money(change)}</div>
          </div>
        </div>
      </div>

      {isRestaurant && (
        <fieldset className="mb-5">
          <legend className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-1">{t('checkout.tip.title')}</legend>
          <p className="text-[11px] text-secondary-500 mb-2">{t('checkout.tip.hint', { base: f.money(totals.base) })}</p>
          <div className="grid grid-cols-3 gap-2">
            {[0, 5, 10].map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={tipPct === p}
                onClick={() => setTipPct(p)}
                className={`py-2 rounded-lg text-sm font-medium border-2 ${
                  tipPct === p
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-secondary-200 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300'
                }`}
              >
                {p === 0 ? t('checkout.tip.none') : p === 10 ? t('checkout.tip.suggested') : `${p} %`}
              </button>
            ))}
          </div>
          {tipPct !== null && tipPct > 0 && <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1.5">{t('checkout.tip.amount', { amount: f.money(tip) })}</p>}
        </fieldset>
      )}

      <div className="mb-4">
        <p className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-2">
          {t('checkout.methodsTitle')} · <span className="font-normal opacity-70">{t('checkout.splitHint')}</span>
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {(['cash', 'card', 'qr', 'gift'] as PayMethod[]).map((m) => {
            const Icon = METHOD_ICON[m];
            return (
              <button
                key={m}
                type="button"
                aria-pressed={method === m}
                onClick={() => {
                  setMethod(m);
                  setError(null);
                }}
                className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg border-2 transition ${
                  method === m
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300'
                    : 'border-secondary-200 dark:border-secondary-700 text-secondary-600 dark:text-secondary-400'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium text-center leading-tight">{t(`checkout.methods.${m}`)}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-secondary-500 mb-2">{t(`checkout.methodHints.${method}`)}</p>

        {method === 'gift' && (
          <input
            value={giftCode}
            onChange={(e) => setGiftCode(e.target.value.slice(0, 20))}
            placeholder={t('checkout.giftPlaceholder')}
            aria-label={t('checkout.giftPlaceholder')}
            className={`${inputCls} mb-2 uppercase`}
          />
        )}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9]/g, '').slice(0, 9))}
            placeholder={String(pending)}
            aria-label={t('checkout.amount')}
            className={`${inputCls} flex-1`}
          />
          <Button onClick={() => add(method, amount)} variant="outline" disabled={device !== null || pending <= 0}>
            {t(`checkout.add.${method}`)}
          </Button>
        </div>
        {method === 'cash' && quick.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {quick.map((v, i) => (
              <button
                key={v}
                type="button"
                onClick={() => add('cash', v)}
                className="text-xs px-2.5 py-1 rounded-full border border-secondary-300 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800"
              >
                {i === 0 ? t('checkout.exact', { amount: f.money(v) }) : f.money(v)}
              </button>
            ))}
          </div>
        )}
        {device && (
          <p role="status" className="mt-2 text-sm text-primary-700 dark:text-primary-300 flex items-center gap-2">
            <ClockIcon className="h-4 w-4 animate-spin" />
            {t(`checkout.device.${device === 'card' ? 'card' : 'qr'}`)}
          </p>
        )}
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>

      {payments.length > 0 && (
        <ul className="space-y-2 mb-4">
          {payments.map((p, i) => (
            <li key={i} className="flex items-center justify-between gap-2 bg-secondary-50 dark:bg-secondary-800 rounded-lg px-3 py-2">
              <span className="text-sm text-secondary-700 dark:text-secondary-300 min-w-0">
                {t(`checkout.methods.${p.method}`)}
                {p.ref && <span className="text-[11px] text-secondary-500"> · {p.method === 'card' ? t('checkout.auth', { code: p.ref }) : p.ref}</span>}
                {(p.method === 'card' || p.method === 'qr') && <span className="text-[11px] text-secondary-500"> · {t('common.simulated')}</span>}
              </span>
              <span className="flex items-center gap-2">
                <span className="font-bold text-secondary-900 dark:text-white">{f.money(p.amount)}</span>
                <button
                  type="button"
                  onClick={() => setPayments(payments.filter((_, idx) => idx !== i))}
                  aria-label={t('checkout.remove')}
                  className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950 p-1 rounded"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <fieldset className="mb-5 rounded-lg border border-secondary-200 dark:border-secondary-700 p-3">
        <legend className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 px-1">{t('checkout.buyer.title')}</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[false, true].map((inv) => (
            <label
              key={String(inv)}
              className={`flex items-start gap-2 rounded-lg border-2 p-2.5 cursor-pointer text-sm ${
                wantsInvoice === inv ? 'border-primary-600 bg-primary-50 dark:bg-primary-950' : 'border-secondary-200 dark:border-secondary-700'
              }`}
            >
              <input type="radio" name="pos-buyer" checked={wantsInvoice === inv} onChange={() => setWantsInvoice(inv)} className="mt-0.5" />
              <span>
                <span className="font-medium text-secondary-900 dark:text-white block">{inv ? t('checkout.buyer.invoice') : t('checkout.buyer.final')}</span>
                <span className="text-[11px] text-secondary-500">{inv ? t('checkout.buyer.invoiceHint') : t('checkout.buyer.finalHint')}</span>
              </span>
            </label>
          ))}
        </div>
        {wantsInvoice && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
            <select value={docType} onChange={(e) => setDocType(e.target.value as Buyer['docType'])} aria-label={t('checkout.buyer.docType')} className={selectCls}>
              <option value="CC">{t('checkout.buyer.docTypes.CC')}</option>
              <option value="NIT">{t('checkout.buyer.docTypes.NIT')}</option>
              <option value="CE">{t('checkout.buyer.docTypes.CE')}</option>
            </select>
            <input value={doc} onChange={(e) => setDoc(e.target.value.slice(0, 15))} placeholder={t('checkout.buyer.doc')} aria-label={t('checkout.buyer.doc')} className={`${inputCls} sm:col-span-2`} />
            <input value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} placeholder={t('checkout.buyer.name')} aria-label={t('checkout.buyer.name')} className={`${inputCls} sm:col-span-3`} />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value.slice(0, 80))} placeholder={t('checkout.buyer.email')} aria-label={t('checkout.buyer.email')} className={`${inputCls} sm:col-span-3`} />
          </div>
        )}
      </fieldset>

      {missing.length > 0 && (
        <ul className="mb-3 text-xs text-amber-700 dark:text-amber-300 list-disc pl-5 space-y-0.5">
          {missing.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}
      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <Button variant="outline" onClick={onCancel} className="sm:flex-1">
          {t('common.cancel')}
        </Button>
        <Button onClick={confirm} disabled={missing.length > 0 || saving || device !== null} className="sm:flex-[2]" size="lg">
          {saving ? t('checkout.processing') : t('checkout.confirm')}
        </Button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Recibo / documento equivalente POS
// ---------------------------------------------------------------------------

export function ReceiptDoc({ sale, preset, id }: { sale: Sale; preset: PresetId; id: string }) {
  const t = useTranslations('demoPos');
  const f = useFmt();
  const p = PRESETS[preset];
  const sedeIdx = p.sedes.findIndex((s) => s.id === sale.sede);
  const sede = p.sedes[sedeIdx];
  const isPos = sale.docType === 'pos';
  const waiter = employeeName(preset, sale.waiterId);
  const seller = employeeName(preset, sale.sellerId);
  return (
    <div id={id} className="bg-white text-secondary-900 font-mono text-[11px] sm:text-xs rounded-md border-2 border-dashed border-secondary-300 p-3 sm:p-4">
      <div className="text-center mb-2">
        <div className="font-bold text-sm">{p.business.name}</div>
        <div>{p.business.legalName}</div>
        <div>NIT {p.business.nit}</div>
        <div>{sede?.address}</div>
        <div className="mt-1 font-bold">{isPos ? t('receipt.docPos') : t('receipt.docInvoice')}</div>
        <div>{t('receipt.number', { n: sale.number })}</div>
        <div className="text-[10px] opacity-80">{t('receipt.resolution', { n: p.business.resolution, prefix: isPos ? sede?.prefix ?? '' : `${p.business.invoicePrefix}${sedeIdx + 1}` })}</div>
      </div>
      <div className="border-t border-dashed border-secondary-400 my-2" />
      <div>{t('receipt.date', { date: dateTimeLabel(sale.createdAt, f.locale) })}</div>
      <div>{t('receipt.cashier', { name: employeeName(preset, sale.cashierId) })}</div>
      {sale.target.startsWith('t') && (
        <div>
          {t('receipt.table', { n: sale.target.slice(1) })}
          {waiter && ` · ${t('receipt.waiter', { name: waiter })}`}
        </div>
      )}
      {seller && <div>{t('receipt.seller', { name: seller })}</div>}
      <div>
        {t('receipt.buyer')}: {sale.buyer.kind === 'final' ? `${t('receipt.finalConsumer')} · 222222222222` : `${sale.buyer.name} · ${sale.buyer.docType} ${docLabel(sale.buyer.doc)}`}
      </div>
      <div className="border-t border-dashed border-secondary-400 my-2" />
      {sale.lines.map((l, i) => (
        <div key={i} className="mb-0.5">
          <div className="flex justify-between gap-2">
            <span className="min-w-0 break-words">
              {l.byWeight ? f.qty(l.qty, true) : `${l.qty}×`} {l.name}
            </span>
            <span className="shrink-0">{f.money(l.amount)}</span>
          </div>
          {l.byWeight && <div className="pl-2 opacity-80">{t('receipt.perKg', { price: f.money(l.unitPrice) })}</div>}
          {(l.mods?.length || l.note) && (
            <div className="pl-2 opacity-80">
              {[...(l.mods ?? []).map((m) => t(`modifiers.items.${m}`)), ...(l.note ? [l.note] : [])].join(', ')}
            </div>
          )}
        </div>
      ))}
      <div className="border-t border-dashed border-secondary-400 my-2" />
      <Row label={t('ticket.gross')} value={f.money(sale.gross)} />
      {sale.discount > 0 && <Row label={t('ticket.pointsDiscount', { points: plainNumber(sale.pointsRedeemed, f.locale) })} value={`−${f.money(sale.discount)}`} />}
      <Row label={t('ticket.base')} value={f.money(sale.base)} />
      {sale.taxes
        .filter((x) => x.kind !== 'exento')
        .map((x) => (
          <Row key={x.kind} label={`${t(`tax.${x.kind}`)} (${t('ticket.onBase', { base: f.money(x.base) })})`} value={f.money(x.tax)} />
        ))}
      {sale.taxes.some((x) => x.kind === 'exento') && (
        <Row label={t('tax.exento')} value={f.money(sale.taxes.find((x) => x.kind === 'exento')?.base ?? 0)} />
      )}
      {sale.tip > 0 && <Row label={t('receipt.tip')} value={f.money(sale.tip)} />}
      <div className="flex justify-between font-bold text-sm mt-1">
        <span>{t('ticket.total')}</span>
        <span>{f.money(sale.total)}</span>
      </div>
      <div className="border-t border-dashed border-secondary-400 my-2" />
      {sale.payments.map((p2, i) => (
        <Row key={i} label={`${t(`checkout.methods.${p2.method}`)}${p2.ref ? ` · ${p2.ref}` : ''}`} value={f.money(p2.amount)} />
      ))}
      {sale.change > 0 && <Row label={t('checkout.change')} value={f.money(sale.change)} />}
      {sale.customerId && (
        <div className="mt-1">{t('receipt.points', { earned: plainNumber(sale.pointsEarned, f.locale), redeemed: plainNumber(sale.pointsRedeemed, f.locale) })}</div>
      )}
      <div className="border-t border-dashed border-secondary-400 my-2" />
      <div className="text-[10px] break-all">
        {isPos ? 'CUDE' : 'CUFE'}: {sale.cude}
      </div>
      <div className="text-[10px] mt-1 opacity-80">{t('receipt.cudeNote')}</div>
      {sale.refunded && <div className="mt-2 font-bold">{t('receipt.refunded', { nc: sale.creditNote ?? '' })}</div>}
      <div className="text-center mt-2 font-semibold">{t('receipt.thanks')}</div>
      <div className="text-center text-[10px] mt-1">{t('receipt.sampleFooter')}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="min-w-0">{label}</span>
      <span className="shrink-0">{value}</span>
    </div>
  );
}

export function StatusBadge({ status }: { status: Sale['status'] }) {
  const t = useTranslations('demoPos');
  if (status === 'sent')
    return (
      <Badge variant="success" size="sm" className="gap-1">
        <CheckCircleIcon className="h-3.5 w-3.5" />
        {t('status.sent')}
      </Badge>
    );
  if (status === 'sending')
    return (
      <Badge variant="info" size="sm" className="gap-1">
        <CloudArrowUpIcon className="h-3.5 w-3.5 animate-pulse" />
        {t('status.sending')}
      </Badge>
    );
  return (
    <Badge variant="warning" size="sm" className="gap-1">
      <ClockIcon className="h-3.5 w-3.5" />
      {t('status.queued')}
    </Badge>
  );
}

export function ReceiptModal({
  sale,
  preset,
  customer,
  onClose,
  notify,
}: {
  sale: Sale;
  preset: PresetId;
  customer?: Customer;
  onClose: () => void;
  notify: (m: string) => void;
}) {
  const t = useTranslations('demoPos');
  const [channel, setChannel] = useState<'email' | 'whatsapp'>(sale.buyer.email ? 'email' : 'whatsapp');
  const [dest, setDest] = useState(sale.buyer.email ?? (customer ? phoneLabel(customer.phone) : ''));
  const [sent, setSent] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const send = () => {
    setErr(null);
    const d = dest.trim();
    if (channel === 'email' ? !emailOk(d) : d.replace(/\D/g, '').length !== 10) {
      setErr(channel === 'email' ? t('receipt.errors.email') : t('receipt.errors.phone'));
      return;
    }
    setSent(t('receipt.sentMsg', { dest: channel === 'email' ? d : phoneLabel(d), channel: t(`receipt.channels.${channel}`) }));
  };

  return (
    <Modal
      labelId="pos-receipt-title"
      title={sale.docType === 'pos' ? t('receipt.titlePos') : t('receipt.titleInvoice')}
      subtitle={t('receipt.thermal')}
      onClose={onClose}
    >
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <StatusBadge status={sale.status} />
        <span className="text-[11px] text-secondary-500">{t(`status.hint.${sale.status}`)}</span>
      </div>
      <div className="max-h-[45vh] overflow-y-auto mb-4">
        <ReceiptDoc sale={sale} preset={preset} id="pos-receipt-print" />
      </div>

      <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-3 mb-4">
        <p className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-2">{t('receipt.send')}</p>
        <div className="flex gap-2 mb-2">
          {(['whatsapp', 'email'] as const).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={channel === c}
              onClick={() => {
                setChannel(c);
                setSent(null);
                setErr(null);
                setDest(c === 'email' ? sale.buyer.email ?? '' : customer ? phoneLabel(customer.phone) : '');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm ${
                channel === c ? 'border-primary-600 bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300' : 'border-secondary-200 dark:border-secondary-700'
              }`}
            >
              {c === 'email' ? <EnvelopeIcon className="h-4 w-4" /> : <ChatBubbleLeftRightIcon className="h-4 w-4" />}
              {t(`receipt.channels.${c}`)}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={dest}
            onChange={(e) => setDest(e.target.value.slice(0, 80))}
            placeholder={channel === 'email' ? t('receipt.emailPlaceholder') : t('receipt.phonePlaceholder')}
            aria-label={channel === 'email' ? t('receipt.emailPlaceholder') : t('receipt.phonePlaceholder')}
            className={`${inputCls} flex-1`}
          />
          <Button variant="outline" onClick={send}>
            {t('receipt.sendBtn')}
          </Button>
        </div>
        {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
        {sent && (
          <p role="status" className="text-xs text-green-700 dark:text-green-400 mt-2">
            {sent}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          onClick={() => {
            notify(t('receipt.printing'));
            printById('pos-receipt-print');
          }}
          className="flex-1 gap-1"
        >
          <PrinterIcon className="h-4 w-4" />
          {t('receipt.print')}
        </Button>
        <Button onClick={onClose} className="flex-1">
          {t('receipt.done')}
        </Button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Caja: apertura y cierre (Z)
// ---------------------------------------------------------------------------

export function OpenShiftModal({
  preset,
  sede,
  staffIn,
  onCancel,
  onConfirm,
}: {
  preset: PresetId;
  sede: string;
  staffIn: (id: string) => boolean;
  onCancel: () => void;
  onConfirm: (base: number, cashierId: string) => void;
}) {
  const t = useTranslations('demoPos');
  const f = useFmt();
  const candidates = PRESETS[preset].employees.filter((e) => e.sede === sede && (e.role === 'cashier' || e.role === 'supervisor'));
  const [base, setBase] = useState('200000');
  const [cashier, setCashier] = useState(candidates.find((c) => staffIn(c.id))?.id ?? candidates[0]?.id ?? '');
  const value = Number(base);
  const ok = Number.isFinite(value) && value >= 0 && value <= 5_000_000 && !!cashier;
  return (
    <Modal labelId="pos-open-title" title={t('shift.openTitle')} subtitle={t('shift.openSubtitle')} onClose={onCancel} size="sm">
      <div className="space-y-3">
        <label className="block text-sm">
          <span className="text-secondary-700 dark:text-secondary-300 font-medium">{t('shift.base')}</span>
          <input
            type="number"
            min={0}
            value={base}
            onChange={(e) => setBase(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
            className={`${inputCls} mt-1`}
          />
          <span className="text-[11px] text-secondary-500">{ok ? f.money(value) : t('shift.baseInvalid')}</span>
        </label>
        <label className="block text-sm">
          <span className="text-secondary-700 dark:text-secondary-300 font-medium">{t('shift.cashier')}</span>
          <select value={cashier} onChange={(e) => setCashier(e.target.value)} className={`${selectCls} w-full mt-1`}>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {t(`staff.roles.${c.role}`)}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            {t('common.cancel')}
          </Button>
          <Button onClick={() => ok && onConfirm(value, cashier)} disabled={!ok} className="flex-1">
            {t('shift.openConfirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function CloseShiftModal({
  base,
  netCash,
  salesCount,
  onCancel,
  onConfirm,
}: {
  base: number;
  netCash: number;
  salesCount: number;
  onCancel: () => void;
  onConfirm: (counted: number) => void;
}) {
  const t = useTranslations('demoPos');
  const f = useFmt();
  const [counted, setCounted] = useState('');
  const expected = base + netCash;
  const value = Number(counted);
  const ok = counted !== '' && Number.isFinite(value) && value >= 0;
  const diff = ok ? value - expected : 0;
  return (
    <Modal labelId="pos-close-title" title={t('shift.closeTitle')} subtitle={t('shift.closeSubtitle', { n: salesCount })} onClose={onCancel} size="sm">
      <div className="space-y-3 text-sm">
        <div className="rounded-lg bg-secondary-50 dark:bg-secondary-800 p-3 space-y-1">
          <div className="flex justify-between">
            <span>{t('shift.base')}</span>
            <span>{f.money(base)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('shift.cashSales')}</span>
            <span>{f.money(netCash)}</span>
          </div>
          <div className="flex justify-between font-bold border-t border-secondary-200 dark:border-secondary-700 pt-1">
            <span>{t('shift.expected')}</span>
            <span>{f.money(expected)}</span>
          </div>
        </div>
        <label className="block">
          <span className="text-secondary-700 dark:text-secondary-300 font-medium">{t('shift.counted')}</span>
          <input
            type="number"
            min={0}
            value={counted}
            onChange={(e) => setCounted(e.target.value.replace(/[^0-9]/g, '').slice(0, 9))}
            placeholder={String(expected)}
            className={`${inputCls} mt-1`}
          />
        </label>
        {ok && (
          <p className={diff === 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600'}>
            {diff === 0 ? t('shift.diffZero') : t(diff > 0 ? 'shift.diffOver' : 'shift.diffShort', { amount: f.money(Math.abs(diff)) })}
          </p>
        )}
        <button type="button" onClick={() => setCounted(String(expected))} className="text-xs text-primary-700 dark:text-primary-300 underline">
          {t('shift.useExpected')}
        </button>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={() => ok && onConfirm(value)} disabled={!ok} className="flex-1">
            {t('shift.closeConfirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function ZReportModal({ closure, preset, onClose, notify }: { closure: Closure; preset: PresetId; onClose: () => void; notify: (m: string) => void }) {
  const t = useTranslations('demoPos');
  const f = useFmt();
  const p = PRESETS[preset];
  const sede = p.sedes.find((s) => s.id === closure.sede);
  const r = closure.report;
  return (
    <Modal labelId="pos-z-title" title={t('z.title', { n: closure.z })} subtitle={sede?.name} onClose={onClose} size="sm">
      <div id="pos-z-print" className="bg-white text-secondary-900 font-mono text-xs rounded-md border-2 border-dashed border-secondary-300 p-3 mb-4 space-y-0.5">
        <div className="text-center font-bold">{p.business.name}</div>
        <div className="text-center">{sede?.name}</div>
        <div className="text-center font-bold mt-1">{t('z.title', { n: closure.z })}</div>
        <div>{t('receipt.date', { date: dateTimeLabel(closure.closedAt, f.locale) })}</div>
        <div>{t('receipt.cashier', { name: employeeName(preset, closure.cashierId) })}</div>
        <div className="border-t border-dashed border-secondary-400 my-2" />
        <Row label={t('reports.docs')} value={String(r.count)} />
        <Row label={t('reports.sales')} value={f.money(r.total)} />
        {(['cash', 'card', 'qr', 'gift'] as PayMethod[]).map((m) => (
          <Row key={m} label={`· ${t(`checkout.methods.${m}`)}`} value={f.money(r.byMethod[m])} />
        ))}
        {r.taxes.map((x) => (
          <Row key={x.kind} label={`${t(`tax.${x.kind}`)}`} value={f.money(x.tax)} />
        ))}
        {r.tips > 0 && <Row label={t('reports.tips')} value={f.money(r.tips)} />}
        <Row label={t('reports.refunds')} value={`${r.refundsCount} · ${f.money(r.refundsTotal)}`} />
        <Row label={t('reports.voids')} value={String(closure.voids)} />
        <div className="border-t border-dashed border-secondary-400 my-2" />
        <Row label={t('shift.base')} value={f.money(closure.base)} />
        <Row label={t('shift.expected')} value={f.money(closure.expectedCash)} />
        <Row label={t('shift.counted')} value={f.money(closure.counted)} />
        <div className="flex justify-between font-bold">
          <span>{t('shift.diff')}</span>
          <span>{f.money(closure.diff)}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 gap-1"
          onClick={() => {
            notify(t('receipt.printing'));
            printById('pos-z-print');
          }}
        >
          <PrinterIcon className="h-4 w-4" />
          {t('receipt.print')}
        </Button>
        <Button onClick={onClose} className="flex-1">
          {t('common.close')}
        </Button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Abrir mesa
// ---------------------------------------------------------------------------

export function OpenTableModal({
  table,
  seats,
  waiters,
  onCancel,
  onConfirm,
}: {
  table: number;
  seats: number;
  waiters: { id: string; name: string }[];
  onCancel: () => void;
  onConfirm: (waiterId: string, guests: number) => void;
}) {
  const t = useTranslations('demoPos');
  const [waiter, setWaiter] = useState(waiters[0]?.id ?? '');
  const [guests, setGuests] = useState(Math.min(2, seats));
  return (
    <Modal labelId="pos-table-title" title={t('tables.openTitle', { n: table })} onClose={onCancel} size="sm">
      {waiters.length === 0 ? (
        <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">{t('tables.noWaiters')}</p>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="text-secondary-700 dark:text-secondary-300 font-medium">{t('tables.waiter')}</span>
            <select value={waiter} onChange={(e) => setWaiter(e.target.value)} className={`${selectCls} w-full mt-1`}>
              {waiters.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
          <div className="text-sm">
            <span className="text-secondary-700 dark:text-secondary-300 font-medium">{t('tables.guests')}</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {Array.from({ length: seats }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={guests === n}
                  onClick={() => setGuests(n)}
                  className={`w-9 h-9 rounded-lg border-2 text-sm font-medium ${
                    guests === n ? 'border-primary-600 bg-primary-600 text-white' : 'border-secondary-200 dark:border-secondary-700'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          {t('common.cancel')}
        </Button>
        <Button onClick={() => waiter && onConfirm(waiter, guests)} disabled={!waiter} className="flex-1">
          {t('tables.openConfirm')}
        </Button>
      </div>
    </Modal>
  );
}
