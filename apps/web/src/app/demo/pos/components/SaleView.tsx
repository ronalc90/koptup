'use client';

import { useMemo, useRef, useState } from 'react';
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
  SparklesIcon,
  PrinterIcon,
  ScaleIcon,
  CreditCardIcon,
  ArchiveBoxIcon,
  XMarkIcon,
  StarIcon,
  LockClosedIcon,
  ArrowRightIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { HAPPY_HOUR_OFF, POINTS, PRESETS, type Product } from './data';
import { computeTotals, lineAmount, maxRedeemBlocks, pointsEarned, tierOf, docLabel, phoneLabel, plainNumber } from './engine';
import { orderKey, type PosStore } from './usePosStore';
import { ModifiersModal, WeighModal } from './PosModals';
import { employeeName, inputCls, selectCls, shortName, useFmt } from './ui';

export function SaleView({
  store,
  target,
  goTables,
  notify,
  onCheckout,
  onOpenShift,
  onCloseShift,
}: {
  store: PosStore;
  target: string;
  goTables: () => void;
  notify: (m: string, tone?: 'ok' | 'error') => void;
  onCheckout: () => void;
  onOpenShift: () => void;
  onCloseShift: () => void;
}) {
  const t = useTranslations('demoPos');
  const f = useFmt();
  const { preset, sede, data, state } = store;
  const p = PRESETS[preset];
  const isRestaurant = preset === 'restaurant';
  const shift = data.shifts[sede];
  const order = data.orders[orderKey(sede, target)];
  const lines = useMemo(() => order?.lines ?? [], [order]);
  const customer = order?.customerId ? data.customers.find((c) => c.id === order.customerId) : undefined;

  const [cat, setCat] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [scanOpen, setScanOpen] = useState(false);
  const [scanCode, setScanCode] = useState('');
  const [scanMsg, setScanMsg] = useState<string | null>(null);
  const [modFor, setModFor] = useState<Product | null>(null);
  const [weighFor, setWeighFor] = useState<Product | null>(null);
  const [loyaltyQ, setLoyaltyQ] = useState('');
  const [loyaltyMsg, setLoyaltyMsg] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [reg, setReg] = useState({ name: '', doc: '', phone: '', consent: false });
  const [regErr, setRegErr] = useState<string | null>(null);
  const scanRef = useRef<HTMLInputElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  const unitPrice = (pr: Product) => {
    const base = store.priceOf(pr);
    return state.happyHour && pr.happyHour ? Math.round(base * (1 - HAPPY_HOUR_OFF)) : base;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return p.products.filter((pr) => {
      const okCat = cat === 'all' || pr.category === cat;
      const okQ = !q || pr.name.toLowerCase().includes(q) || pr.barcode?.includes(q) || pr.id === q;
      return okCat && okQ;
    });
  }, [cat, p.products, query]);

  const gross = lines.reduce((s, l) => s + lineAmount(l), 0);
  const redeemValue = Math.min((order?.redeemBlocks ?? 0) * POINTS.blockValue, gross);
  const totals = computeTotals(lines, redeemValue);
  const tier = customer ? tierOf(customer.points) : 'bronze';
  const maxBlocks = customer ? maxRedeemBlocks(customer.points, gross) : 0;
  const pendingSend = lines.reduce((s, l) => s + Math.max(0, l.qty - l.sent), 0);

  const errorToast = (reason: 'closed' | 'stock') => notify(reason === 'closed' ? t('errors.closed') : t('errors.stock'), 'error');

  const add = (pr: Product, opts: { qty?: number; unitPrice: number; mods?: string[]; note?: string }) => {
    const r = store.addLine(target, pr, opts);
    if (!r.ok) return errorToast(r.reason);
    notify(t('catalog.added', { name: pr.name }));
  };

  const onProduct = (pr: Product) => {
    if (!shift.open) return errorToast('closed');
    if (isRestaurant && target !== 'counter' && !order?.waiterId) {
      notify(t('errors.tableNotOpen'), 'error');
      return;
    }
    if (pr.byWeight) return setWeighFor(pr);
    if (pr.mods) return setModFor(pr);
    add(pr, { unitPrice: unitPrice(pr) });
  };

  const scan = (raw: string) => {
    const codeStr = raw.replace(/\D/g, '');
    if (!codeStr) return;
    const pr = p.products.find((x) => x.barcode === codeStr);
    if (!pr) {
      setScanMsg(t('scan.notFound', { code: codeStr }));
      return;
    }
    setScanMsg(null);
    setScanCode('');
    onProduct(pr);
    scanRef.current?.focus();
  };

  const lookup = () => {
    const found = store.findCustomer(loyaltyQ);
    if (found) {
      store.setOrderField(target, { customerId: found.id, redeemBlocks: 0 });
      setLoyaltyMsg(null);
      setLoyaltyQ('');
      setRegistering(false);
    } else {
      setLoyaltyMsg(t('loyalty.notFound'));
      const digits = loyaltyQ.replace(/\D/g, '');
      setReg((r) => ({ ...r, phone: digits.length === 10 && digits.startsWith('3') ? digits : r.phone, doc: digits.length !== 10 || !digits.startsWith('3') ? digits : r.doc }));
    }
  };

  const register = () => {
    setRegErr(null);
    const doc = reg.doc.replace(/\D/g, '');
    const phone = reg.phone.replace(/\D/g, '');
    if (reg.name.trim().length < 3) return setRegErr(t('loyalty.register.errors.name'));
    if (doc.length < 5 || doc.length > 10) return setRegErr(t('loyalty.register.errors.doc'));
    if (phone.length !== 10 || !phone.startsWith('3')) return setRegErr(t('loyalty.register.errors.phone'));
    if (!reg.consent) return setRegErr(t('loyalty.register.errors.consent'));
    const r = store.registerCustomer({ name: reg.name, doc, phone });
    if (!r.ok) return setRegErr(t('loyalty.register.errors.exists'));
    store.setOrderField(target, { customerId: r.id, redeemBlocks: 0 });
    setRegistering(false);
    setLoyaltyMsg(null);
    setLoyaltyQ('');
    setReg({ name: '', doc: '', phone: '', consent: false });
    notify(t('loyalty.register.done'));
  };

  const send = () => {
    const r = store.sendToKitchen(target, (k) => t(`modifiers.items.${k}`));
    if (r.kitchen + r.bar === 0) return;
    notify(t('ticket.sentToast', { kitchen: r.kitchen, bar: r.bar }));
  };

  const sellers = p.employees.filter((e) => e.sede === sede && e.role === 'seller' && data.staff[e.id]?.clockedIn);
  const sampleCodes = p.products.filter((x) => x.barcode).slice(0, 4);
  const tableNo = target.startsWith('t') ? Number(target.slice(1)) : null;

  // Efectivo esperado en caja con lo vendido en el turno.
  const shiftSales = store.shiftSales(sede, shift.number).filter((s) => !s.refunded);
  const netCash = shiftSales.reduce(
    (s, x) => s + x.payments.filter((pay) => pay.method === 'cash').reduce((a, pay) => a + pay.amount, 0) - x.change,
    0,
  );

  const devices = [
    { key: 'printer', icon: PrinterIcon },
    { key: 'scanner', icon: QrCodeIcon },
    { key: 'terminal', icon: CreditCardIcon },
    ...(isRestaurant ? [] : [{ key: 'scale', icon: ScaleIcon }]),
    { key: 'drawer', icon: ArchiveBoxIcon },
  ] as const;

  const testDevice = (key: string) => {
    if (key === 'scanner') {
      setScanOpen(true);
      window.setTimeout(() => scanRef.current?.focus(), 0);
    }
    notify(t(`hardware.test.${key}`));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Catálogo */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4 min-w-0">
        {!shift.open && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30 p-3 text-sm text-amber-900 dark:text-amber-100">
            <LockClosedIcon className="h-5 w-5" />
            <span className="flex-1 min-w-[12rem]">{t('shift.closedBanner')}</span>
            <Button size="sm" onClick={onOpenShift}>
              {t('shift.openTitle')}
            </Button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[12rem]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && /^\d{8,14}$/.test(query.trim())) {
                  scan(query.trim());
                  setQuery('');
                }
              }}
              placeholder={t(isRestaurant ? 'catalog.searchRestaurant' : 'catalog.searchRetail')}
              aria-label={t(isRestaurant ? 'catalog.searchRestaurant' : 'catalog.searchRetail')}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {!isRestaurant && (
            <Button
              variant={scanOpen ? 'primary' : 'outline'}
              aria-expanded={scanOpen}
              onClick={() => {
                setScanOpen((o) => !o);
                setScanMsg(null);
                window.setTimeout(() => scanRef.current?.focus(), 0);
              }}
              className="flex items-center gap-2"
            >
              <QrCodeIcon className="h-5 w-5" />
              {t('scan.button')}
            </Button>
          )}
          {isRestaurant && (
            <button
              type="button"
              aria-pressed={state.happyHour}
              onClick={() => {
                store.toggleHappyHour();
                notify(state.happyHour ? t('catalog.happyHourOff') : t('catalog.happyHourOn'));
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border ${
                state.happyHour
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : 'border-secondary-300 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 bg-white dark:bg-secondary-900'
              }`}
            >
              <FireIcon className="h-4 w-4" />
              {state.happyHour ? t('catalog.happyHourActive') : t('catalog.happyHour')}
            </button>
          )}
        </div>

        {scanOpen && !isRestaurant && (
          <div className="rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/60 dark:bg-primary-950/30 p-3 space-y-2">
            <label htmlFor="pos-scan" className="text-sm font-medium text-secondary-800 dark:text-secondary-200 block">
              {t('scan.label')}
            </label>
            <div className="flex gap-2">
              <input
                id="pos-scan"
                ref={scanRef}
                value={scanCode}
                inputMode="numeric"
                onChange={(e) => setScanCode(e.target.value.replace(/\D/g, '').slice(0, 14))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') scan(scanCode);
                }}
                placeholder={sampleCodes[0]?.barcode}
                className={`${inputCls} font-mono`}
              />
              <Button onClick={() => scan(scanCode)} disabled={!scanCode}>
                {t('scan.add')}
              </Button>
            </div>
            <p className="text-[11px] text-secondary-600 dark:text-secondary-400">{t('scan.hint')}</p>
            <div className="flex flex-wrap gap-1.5">
              {sampleCodes.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => scan(x.barcode as string)}
                  className="text-[11px] font-mono px-2 py-1 rounded border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 hover:border-primary-500"
                  title={x.name}
                >
                  {x.barcode} · {x.name}
                </button>
              ))}
            </div>
            {scanMsg && <p className="text-xs text-red-600">{scanMsg}</p>}
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label={t('catalog.categoriesLabel')}>
          {['all', ...p.categories].map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={cat === c}
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

        {filtered.length === 0 ? (
          <p className="text-sm text-secondary-500 py-8 text-center">{t('catalog.noResults')}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((pr) => {
              const avail = store.available(pr.id);
              const price = unitPrice(pr);
              const out = avail <= 0;
              const hh = state.happyHour && pr.happyHour;
              return (
                <button
                  key={pr.id}
                  type="button"
                  onClick={() => onProduct(pr)}
                  disabled={out}
                  className="group relative text-left rounded-xl bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 p-3 hover:border-primary-500 hover:shadow-md active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
                >
                  <div className="text-3xl sm:text-4xl mb-2" aria-hidden="true">
                    {pr.emoji}
                  </div>
                  <div className="font-semibold text-sm text-secondary-900 dark:text-white line-clamp-2 mb-1">{pr.name}</div>
                  {pr.combo && <div className="text-[10px] text-secondary-500 mb-1 line-clamp-2">{pr.combo.map((c) => c.name).join(' + ')}</div>}
                  <div className="flex items-end justify-between gap-1 flex-wrap">
                    <div>
                      {hh && <div className="text-[11px] text-secondary-400 line-through">{f.money(store.priceOf(pr))}</div>}
                      <div className="text-base font-bold text-primary-600 dark:text-primary-400">
                        {f.money(price)}
                        {pr.byWeight && <span className="text-xs font-medium"> /kg</span>}
                      </div>
                      <div className="text-[10px] text-secondary-500">{t(`tax.${pr.tax}`)}</div>
                    </div>
                    {out ? (
                      <Badge variant="danger" size="sm">{t('catalog.outOfStock')}</Badge>
                    ) : avail <= pr.min ? (
                      <Badge variant="danger" size="sm">{t('catalog.left', { n: f.qty(avail, pr.byWeight) })}</Badge>
                    ) : null}
                  </div>
                  <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                    {hh && (
                      <Badge variant="warning" size="sm" className="gap-1">
                        <FireIcon className="h-3 w-3" />
                        −{Math.round(HAPPY_HOUR_OFF * 100)} %
                      </Badge>
                    )}
                    {pr.combo && <Badge variant="info" size="sm">{t('catalog.combo')}</Badge>}
                    {pr.byWeight && (
                      <Badge variant="secondary" size="sm" className="gap-1">
                        <ScaleIcon className="h-3 w-3" />
                        kg
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <p className="text-[11px] text-secondary-500">{t('catalog.pricesNote')}</p>

        {/* Periféricos y caja */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card variant="bordered" padding="sm">
            <h3 className="font-semibold text-secondary-900 dark:text-white text-sm">{t('hardware.title')}</h3>
            <p className="text-[11px] text-secondary-500 mb-2">{t('hardware.subtitle')}</p>
            <ul className="space-y-1.5">
              {devices.map((d) => {
                const Icon = d.icon;
                return (
                  <li key={d.key} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 text-secondary-700 dark:text-secondary-300 min-w-0">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{t(`hardware.${d.key}`)}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => testDevice(d.key)}
                      className="text-xs px-2 py-1 rounded border border-secondary-300 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800 whitespace-nowrap"
                    >
                      {t(`hardware.testBtn.${d.key}`)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card variant="bordered" padding="sm">
            <h3 className="font-semibold text-secondary-900 dark:text-white text-sm">{t('cash.title')}</h3>
            <p className="text-[11px] text-secondary-500 mb-2">
              {shift.open
                ? t('cash.openSince', { n: shift.number, time: shift.openedAt, name: employeeName(preset, shift.cashierId) })
                : t('shift.closedShort')}
            </p>
            {shift.open && (
              <dl className="text-sm space-y-1 mb-3">
                <div className="flex justify-between">
                  <dt className="text-secondary-600 dark:text-secondary-400">{t('shift.base')}</dt>
                  <dd>{f.money(shift.base)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-secondary-600 dark:text-secondary-400">{t('shift.cashSales')}</dt>
                  <dd>{f.money(netCash)}</dd>
                </div>
                <div className="flex justify-between font-semibold">
                  <dt>{t('shift.expected')}</dt>
                  <dd>{f.money(shift.base + netCash)}</dd>
                </div>
              </dl>
            )}
            {shift.open ? (
              <Button size="sm" variant="outline" fullWidth onClick={onCloseShift}>
                {t('shift.closeTitle')}
              </Button>
            ) : (
              <Button size="sm" fullWidth onClick={onOpenShift}>
                {t('shift.openTitle')}
              </Button>
            )}
          </Card>
        </div>
      </div>

      {/* Ticket */}
      <div className="lg:col-span-5 xl:col-span-4 min-w-0" ref={ticketRef} id="pos-ticket">
        <Card variant="elevated" padding="none" className="lg:sticky lg:top-48 flex flex-col lg:max-h-[calc(100vh-13rem)]">
          <div className="p-4 border-b border-secondary-200 dark:border-secondary-800">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h2 className="text-lg font-bold text-secondary-900 dark:text-white">{t('ticket.title')}</h2>
              {lines.length > 0 && (
                <button type="button" onClick={() => store.clearOrder(target)} className="text-xs text-red-600 hover:underline">
                  {t('ticket.clear')}
                </button>
              )}
            </div>
            {isRestaurant ? (
              <div className="flex flex-wrap items-center gap-2 text-xs text-secondary-600 dark:text-secondary-400">
                <span className="font-medium text-secondary-800 dark:text-secondary-200">
                  {tableNo ? t('ticket.tableInfo', { n: tableNo, guests: order?.guests ?? 0 }) : t('ticket.counter')}
                </span>
                {tableNo && order?.waiterId && <span>· {t('ticket.waiter', { name: shortName(employeeName(preset, order.waiterId)) })}</span>}
                {order?.billRequested && <Badge size="sm" variant="warning">{t('tables.states.bill')}</Badge>}
                <button type="button" onClick={goTables} className="ml-auto text-primary-700 dark:text-primary-300 underline">
                  {t('ticket.changeTable')}
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 text-xs text-secondary-600 dark:text-secondary-400">
                <span>{t('ticket.seller')}</span>
                <select
                  value={order?.sellerId ?? ''}
                  onChange={(e) => store.setOrderField(target, { sellerId: e.target.value || undefined })}
                  className={`${selectCls} !py-1 !text-xs flex-1 min-w-0`}
                >
                  <option value="">{t('ticket.noSeller')}</option>
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {/* Fidelización */}
          <div className="p-3 border-b border-secondary-200 dark:border-secondary-800 bg-secondary-50/60 dark:bg-secondary-800/30">
            {customer ? (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm min-w-0">
                    <div className="font-semibold text-secondary-900 dark:text-white flex items-center gap-1">
                      <StarIcon className="h-4 w-4 text-yellow-500 shrink-0" />
                      <span className="truncate">{customer.name}</span>
                    </div>
                    <div className="text-[11px] text-secondary-500">
                      {t('loyalty.summary', { points: plainNumber(customer.points, f.locale), tier: t(`loyalty.tiers.${tier}`) })} · CC {docLabel(customer.doc)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => store.setOrderField(target, { customerId: undefined, redeemBlocks: 0 })}
                    aria-label={t('loyalty.remove')}
                    className="text-secondary-500 p-1"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => store.setOrderField(target, { redeemBlocks: (order?.redeemBlocks ?? 0) + 1 })}
                    disabled={(order?.redeemBlocks ?? 0) >= maxBlocks}
                    className="text-xs px-2 py-1 rounded bg-primary-600 text-white disabled:opacity-40"
                  >
                    {t('loyalty.redeem', { points: plainNumber(POINTS.blockPoints, f.locale), amount: f.money(POINTS.blockValue) })}
                  </button>
                  {(order?.redeemBlocks ?? 0) > 0 && (
                    <button type="button" onClick={() => store.setOrderField(target, { redeemBlocks: 0 })} className="text-xs text-secondary-600 dark:text-secondary-400 underline">
                      {t('loyalty.undoRedeem')}
                    </button>
                  )}
                  {maxBlocks === 0 && <span className="text-[11px] text-secondary-500">{t('loyalty.cannotRedeem', { points: plainNumber(POINTS.blockPoints, f.locale), amount: f.money(POINTS.blockValue) })}</span>}
                </div>
              </div>
            ) : registering ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-secondary-800 dark:text-secondary-200">{t('loyalty.register.title')}</p>
                <input value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value.slice(0, 60) })} placeholder={t('loyalty.register.name')} aria-label={t('loyalty.register.name')} className={inputCls} />
                <div className="grid grid-cols-2 gap-2">
                  <input value={reg.doc} onChange={(e) => setReg({ ...reg, doc: e.target.value.slice(0, 13) })} placeholder={t('loyalty.register.doc')} aria-label={t('loyalty.register.doc')} inputMode="numeric" className={inputCls} />
                  <input value={reg.phone} onChange={(e) => setReg({ ...reg, phone: e.target.value.slice(0, 13) })} placeholder={t('loyalty.register.phone')} aria-label={t('loyalty.register.phone')} inputMode="numeric" className={inputCls} />
                </div>
                <label className="flex items-start gap-2 text-[11px] text-secondary-600 dark:text-secondary-400">
                  <input type="checkbox" checked={reg.consent} onChange={(e) => setReg({ ...reg, consent: e.target.checked })} className="mt-0.5" />
                  <span>{t('loyalty.register.consent')}</span>
                </label>
                {regErr && <p className="text-[11px] text-red-600">{regErr}</p>}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setRegistering(false)} className="flex-1">
                    {t('common.cancel')}
                  </Button>
                  <Button size="sm" onClick={register} className="flex-1">
                    {t('loyalty.register.save')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <UserPlusIcon className="h-4 w-4 text-secondary-500 shrink-0" />
                  <input
                    value={loyaltyQ}
                    onChange={(e) => setLoyaltyQ(e.target.value.slice(0, 15))}
                    onKeyDown={(e) => e.key === 'Enter' && lookup()}
                    placeholder={t('loyalty.lookupPlaceholder')}
                    aria-label={t('loyalty.lookupPlaceholder')}
                    className="flex-1 min-w-0 text-sm px-2 py-1.5 rounded border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white"
                  />
                  <Button size="sm" variant="outline" onClick={lookup}>
                    {t('loyalty.search')}
                  </Button>
                </div>
                <p className="text-[11px] text-secondary-500">{t('loyalty.hint', { phone: phoneLabel('3001234567'), doc: docLabel('52384917') })}</p>
                {loyaltyMsg && (
                  <p className="text-[11px] text-red-600">
                    {loyaltyMsg}{' '}
                    <button type="button" onClick={() => setRegistering(true)} className="underline text-primary-700 dark:text-primary-300">
                      {t('loyalty.register.open')}
                    </button>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Líneas */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[8rem]">
            {lines.length === 0 ? (
              <div className="text-center py-8 text-sm text-secondary-500">
                <ShoppingBagIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                {t(isRestaurant ? 'ticket.emptyRestaurant' : 'ticket.emptyRetail')}
              </div>
            ) : (
              lines.map((l) => (
                <div key={l.uid} className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-2.5">
                  <div className="flex items-start gap-2">
                    <span className="text-2xl" aria-hidden="true">
                      {l.emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-secondary-900 dark:text-white">{l.name}</div>
                          <div className="text-[11px] text-secondary-500">
                            {l.byWeight ? `${f.qty(l.qty, true)} × ${f.money(l.unitPrice)}/kg` : t('ticket.each', { price: f.money(l.unitPrice) })} · {t(`tax.${l.tax}`)}
                          </div>
                        </div>
                        <button type="button" onClick={() => store.removeLine(target, l.uid)} className="text-red-500 p-0.5" aria-label={t('ticket.removeLine', { name: l.name })}>
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      {(l.mods?.length || l.note) && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {l.mods?.map((m) => (
                            <Badge key={m} size="sm" variant="outline">
                              {t(`modifiers.items.${m}`)}
                            </Badge>
                          ))}
                          {l.note && <div className="text-[10px] italic text-secondary-500 w-full mt-0.5">&ldquo;{l.note}&rdquo;</div>}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-1.5">
                        {l.byWeight ? (
                          <span className="text-[11px] text-secondary-500">{t('ticket.weighed')}</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button type="button" onClick={() => store.changeQty(target, l.uid, -1)} className="p-1 rounded bg-secondary-100 dark:bg-secondary-700" aria-label={t('ticket.less', { name: l.name })}>
                              <MinusIcon className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-7 text-center font-semibold text-sm">{l.qty}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const r = store.changeQty(target, l.uid, 1);
                                if (!r.ok) errorToast(r.reason);
                              }}
                              className="p-1 rounded bg-secondary-100 dark:bg-secondary-700"
                              aria-label={t('ticket.more', { name: l.name })}
                            >
                              <PlusIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {isRestaurant && l.sent > 0 && (
                            <Badge size="sm" variant={l.sent >= l.qty ? 'success' : 'warning'}>
                              {t('ticket.sentBadge', { n: l.sent })}
                            </Badge>
                          )}
                          <span className="font-bold text-primary-600 dark:text-primary-400">{f.money(lineAmount(l))}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totales */}
          <div className="border-t border-secondary-200 dark:border-secondary-800 p-3 space-y-1.5 bg-secondary-50/50 dark:bg-secondary-800/30 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-secondary-600 dark:text-secondary-400">{t('ticket.gross')}</span>
              <span className="font-medium text-secondary-900 dark:text-white">{f.money(totals.gross)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex items-center justify-between text-green-700 dark:text-green-400">
                <span className="flex items-center gap-1">
                  <TagIcon className="h-3.5 w-3.5" />
                  {t('ticket.pointsDiscount', { points: plainNumber((order?.redeemBlocks ?? 0) * POINTS.blockPoints, f.locale) })}
                </span>
                <span>−{f.money(totals.discount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-secondary-600 dark:text-secondary-400">{t('ticket.base')}</span>
              <span className="text-secondary-800 dark:text-secondary-200">{f.money(totals.base)}</span>
            </div>
            {totals.taxes
              .filter((x) => x.kind !== 'exento')
              .map((x) => (
                <div key={x.kind} className="flex items-center justify-between text-xs">
                  <span className="text-secondary-600 dark:text-secondary-400">{t(`tax.${x.kind}`)}</span>
                  <span className="text-secondary-800 dark:text-secondary-200">{f.money(x.tax)}</span>
                </div>
              ))}
            <div className="flex items-center justify-between pt-1.5 border-t border-secondary-200 dark:border-secondary-700">
              <span className="text-base font-bold text-secondary-900 dark:text-white">{t('ticket.total')}</span>
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{f.money(totals.net)}</span>
            </div>
            {customer && totals.net > 0 && (
              <p className="text-[11px] text-secondary-500">
                <SparklesIcon className="h-3 w-3 inline mr-1" />
                {t('loyalty.ptsEarned', { points: plainNumber(pointsEarned(totals.net, tier), f.locale) })}
              </p>
            )}
            {isRestaurant ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button variant="outline" onClick={send} disabled={pendingSend === 0} className="gap-1">
                  <PaperAirplaneIcon className="h-4 w-4" />
                  {t('ticket.send', { n: pendingSend })}
                </Button>
                {tableNo ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      store.setOrderField(target, { billRequested: true });
                      notify(t('ticket.billToast', { n: tableNo }));
                    }}
                    disabled={lines.length === 0 || !!order?.billRequested}
                    className="gap-1"
                  >
                    <DocumentTextIcon className="h-4 w-4" />
                    {t('ticket.bill')}
                  </Button>
                ) : (
                  <span />
                )}
                <Button onClick={onCheckout} disabled={lines.length === 0 || !shift.open} size="lg" className="col-span-2">
                  {t('ticket.pay', { amount: f.money(totals.net) })}
                </Button>
                {tableNo && lines.length === 0 && order && (
                  <Button variant="ghost" size="sm" className="col-span-2" onClick={() => store.releaseTable(target)}>
                    {t('tables.release')}
                  </Button>
                )}
              </div>
            ) : (
              <Button onClick={onCheckout} disabled={lines.length === 0 || !shift.open} size="lg" fullWidth className="mt-1">
                {t('ticket.pay', { amount: f.money(totals.net) })}
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Acceso rápido al ticket en pantallas angostas */}
      {lines.length > 0 && (
        <button
          type="button"
          onClick={() => ticketRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-primary-600 text-white px-4 py-2.5 shadow-lg text-sm font-semibold"
        >
          {t('ticket.goToTicket', { n: lines.length, amount: f.money(totals.net) })}
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      )}

      {modFor && (
        <ModifiersModal
          product={modFor}
          basePrice={unitPrice(modFor)}
          onCancel={() => setModFor(null)}
          onConfirm={(mods, note, price) => {
            add(modFor, { unitPrice: price, mods, note });
            setModFor(null);
          }}
        />
      )}
      {weighFor && (
        <WeighModal
          product={weighFor}
          pricePerKg={unitPrice(weighFor)}
          available={store.available(weighFor.id)}
          scaleIdx={state.scaleIdx}
          onRead={store.nextScaleReading}
          onCancel={() => setWeighFor(null)}
          onConfirm={(kg) => {
            add(weighFor, { qty: kg, unitPrice: unitPrice(weighFor) });
            setWeighFor(null);
          }}
        />
      )}
    </div>
  );
}
