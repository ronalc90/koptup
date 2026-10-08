'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_BASE,
  POINTS,
  PRESETS,
  SEED_CUSTOMERS,
  SEED_GIFT_CARDS,
  SEED_KDS,
  SEED_TABLE_ORDERS,
  type Customer,
  type PresetId,
  type Product,
  type Station,
} from './data';
import {
  buildReport,
  computeTotals,
  lineAmount,
  pointsEarned,
  sha384Hex,
  tierOf,
  tipAmount,
  type Payment,
  type ShiftReport,
  type TaxRow,
  type TicketLine,
} from './engine';

/**
 * Estado de la demo POS. Arranca siempre con la semilla (mismo HTML en el
 * servidor y en el navegador) y, ya montado, recupera lo guardado en
 * localStorage de este navegador. Nada se envía a un servidor.
 */
const STORAGE_KEY = 'koptup-demo-pos:v2';

export type SaleStatus = 'sending' | 'sent' | 'queued';

export interface Buyer {
  kind: 'final' | 'identified';
  docType: 'CC' | 'NIT' | 'CE';
  doc: string;
  name: string;
  email?: string;
}

export interface SaleLine {
  name: string;
  emoji: string;
  qty: number;
  unitPrice: number;
  amount: number;
  byWeight?: boolean;
  mods?: string[];
  note?: string;
}

export interface Sale {
  id: string;
  docType: 'pos' | 'invoice';
  number: string;
  sede: string;
  shift: number;
  createdAt: string;
  cashierId: string;
  waiterId?: string;
  sellerId?: string;
  target: string;
  lines: SaleLine[];
  gross: number;
  discount: number;
  taxes: TaxRow[];
  base: number;
  tip: number;
  total: number;
  payments: Payment[];
  change: number;
  customerId?: string;
  pointsEarned: number;
  pointsRedeemed: number;
  buyer: Buyer;
  cude: string;
  status: SaleStatus;
  refunded?: boolean;
  creditNote?: string;
  /** Datos para devolver existencias, puntos y bonos al anular. */
  restock: { productId: string; qty: number }[];
}

export interface Shift {
  number: number;
  open: boolean;
  base: number;
  cashierId: string;
  openedAt: string;
  voids: number;
}

export interface Closure {
  id: string;
  sede: string;
  shift: number;
  z: number;
  closedAt: string;
  cashierId: string;
  base: number;
  expectedCash: number;
  counted: number;
  diff: number;
  voids: number;
  report: ShiftReport;
}

export interface OpenOrder {
  lines: TicketLine[];
  waiterId?: string;
  guests?: number;
  billRequested?: boolean;
  customerId?: string;
  redeemBlocks: number;
  sellerId?: string;
}

export type KdsStatus = 'new' | 'preparing' | 'ready';
export interface KdsOrder {
  id: string;
  number: number;
  sede: string;
  target: string;
  station: Station;
  lines: string[];
  createdAt: number | null;
  ageMin: number;
  status: KdsStatus;
}

export interface StaffStatus {
  clockedIn: boolean;
  since: string;
  lastOut?: string;
}

export interface Transfer {
  id: string;
  productId: string;
  from: string;
  to: string;
  qty: number;
  at: string;
}

export interface PresetData {
  stock: Record<string, Record<string, number>>;
  prices: Record<string, number>;
  customers: Customer[];
  giftCards: Record<string, number>;
  shifts: Record<string, Shift>;
  sales: Sale[];
  closures: Closure[];
  orders: Record<string, OpenOrder>;
  kds: KdsOrder[];
  staff: Record<string, StaffStatus>;
  transfers: Transfer[];
  docSeq: Record<string, number>;
  seq: number;
}

export interface PosState {
  version: 2;
  preset: PresetId;
  sede: Record<PresetId, string>;
  offline: boolean;
  happyHour: boolean;
  scaleIdx: number;
  data: Record<PresetId, PresetData>;
}

export const orderKey = (sede: string, target: string) => `${sede}|${target}`;

/** Hora HH:MM de Colombia (24 h). */
export function hhmm(d = new Date()) {
  try {
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Bogota' });
  } catch {
    return d.toISOString().slice(11, 16);
  }
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

function seedPreset(id: PresetId): PresetData {
  const p = PRESETS[id];
  const stock: PresetData['stock'] = {};
  const shifts: PresetData['shifts'] = {};
  const docSeq: PresetData['docSeq'] = {};
  const orders: PresetData['orders'] = {};
  const kds: KdsOrder[] = [];
  let kdsNumber = 201;
  p.sedes.forEach((s, i) => {
    stock[s.id] = Object.fromEntries(p.products.map((pr) => [pr.id, pr.stock[i]]));
    const cashier = p.employees.find((e) => e.sede === s.id && e.role === 'cashier');
    shifts[s.id] = { number: 12 + i * 7, open: true, base: DEFAULT_BASE, cashierId: cashier?.id ?? '', openedAt: cashier?.since ?? '07:00', voids: 0 };
    docSeq[`${s.id}|pos`] = s.nextNumber;
    docSeq[`${s.id}|fe`] = 1001 + i * 400;
    docSeq[`${s.id}|nc`] = 101;
    if (id === 'restaurant') {
      const waiters = p.employees.filter((e) => e.sede === s.id && e.role === 'waiter');
      for (const o of SEED_TABLE_ORDERS) {
        const lines: TicketLine[] = o.lines.map((l, j) => {
          const pr = p.products.find((x) => x.id === l.productId) as Product;
          return {
            uid: `seed-${s.id}-${o.table}-${j}`,
            productId: pr.id,
            name: pr.name,
            emoji: pr.emoji,
            qty: l.qty,
            unitPrice: pr.price,
            tax: pr.tax,
            station: pr.station,
            note: l.note,
            sent: l.qty,
          };
        });
        orders[orderKey(s.id, `t${o.table}`)] = {
          lines,
          waiterId: waiters[o.waiterIdx]?.id,
          guests: o.guests,
          billRequested: o.billRequested,
          redeemBlocks: 0,
        };
        for (const k of SEED_KDS.filter((x) => x.table === o.table)) {
          const kl = lines.filter((l) => l.station === k.station).map((l) => `${l.qty}× ${l.name}${l.note ? ` · ${l.note}` : ''}`);
          if (kl.length === 0) continue;
          kds.push({ id: `k-${s.id}-${kdsNumber}`, number: kdsNumber++, sede: s.id, target: `t${o.table}`, station: k.station, lines: kl, createdAt: null, ageMin: k.ageMin, status: k.status });
        }
      }
    }
  });
  return {
    stock,
    prices: {},
    customers: SEED_CUSTOMERS.map((c) => ({ ...c })),
    giftCards: { ...SEED_GIFT_CARDS },
    shifts,
    sales: [],
    closures: [],
    orders,
    kds,
    staff: Object.fromEntries(p.employees.map((e) => [e.id, { clockedIn: e.clockedIn, since: e.since }])),
    transfers: [],
    docSeq,
    seq: 1,
  };
}

export function seedState(): PosState {
  return {
    version: 2,
    preset: 'retail',
    sede: { retail: PRESETS.retail.sedes[0].id, restaurant: PRESETS.restaurant.sedes[0].id },
    offline: false,
    happyHour: false,
    scaleIdx: 0,
    data: { retail: seedPreset('retail'), restaurant: seedPreset('restaurant') },
  };
}

function isValid(v: unknown): v is PosState {
  if (!v || typeof v !== 'object') return false;
  const s = v as Partial<PosState>;
  return (
    s.version === 2 &&
    (s.preset === 'retail' || s.preset === 'restaurant') &&
    !!s.data &&
    !!s.data.retail &&
    !!s.data.restaurant &&
    Array.isArray(s.data.retail.sales) &&
    Array.isArray(s.data.restaurant.sales)
  );
}

/** Asigna la hora de creación a las comandas de ejemplo (solo en el navegador). */
function stampKds(d: PresetData, now: number): PresetData {
  if (!d.kds.some((k) => k.createdAt === null)) return d;
  return { ...d, kds: d.kds.map((k) => (k.createdAt === null ? { ...k, createdAt: now - k.ageMin * 60_000 } : k)) };
}

export type AddResult = { ok: true } | { ok: false; reason: 'closed' | 'stock' };
export type CheckoutInput = { target: string; payments: Payment[]; tipPct: number; buyer: Buyer };

export function usePosStore() {
  const [state, setState] = useState<PosState>(seedState);
  const [hydrated, setHydrated] = useState(false);
  const [syncing, setSyncing] = useState(0);
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  // Carga desde localStorage ya montado.
  useEffect(() => {
    const now = Date.now();
    let loaded: PosState | null = null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isValid(parsed)) loaded = parsed;
      }
    } catch {
      loaded = null;
    }
    setState((prev) => {
      const base = loaded ?? prev;
      const fix = (d: PresetData): PresetData =>
        stampKds(
          {
            ...d,
            sales: d.sales.map((s) => (s.status === 'sending' ? { ...s, status: base.offline ? 'queued' : 'sent' } : s)),
          },
          now,
        );
      return { ...base, data: { retail: fix(base.data.retail), restaurant: fix(base.data.restaurant) } };
    });
    setHydrated(true);
    const list = timers.current;
    return () => list.forEach((id) => window.clearTimeout(id));
  }, []);

  // Guarda cada cambio (solo en este navegador).
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // sin almacenamiento: la demo sigue funcionando en memoria
    }
  }, [state, hydrated]);

  const preset = state.preset;
  const sede = state.sede[preset];
  const data = state.data[preset];

  const update = useCallback((fn: (d: PresetData, s: PosState) => PresetData) => {
    setState((s) => ({ ...s, data: { ...s.data, [s.preset]: fn(s.data[s.preset], s) } }));
  }, []);

  const updateOrder = useCallback(
    (target: string, fn: (o: OpenOrder) => OpenOrder | null) => {
      update((d, s) => {
        const key = orderKey(s.sede[s.preset], target);
        const current = d.orders[key] ?? { lines: [], redeemBlocks: 0 };
        const next = fn(current);
        const orders = { ...d.orders };
        if (next === null || (next.lines.length === 0 && !next.waiterId && !next.customerId && !next.sellerId)) delete orders[key];
        else orders[key] = next;
        return { ...d, orders };
      });
    },
    [update],
  );

  const priceOf = useCallback((p: Product) => data.prices[p.id] ?? p.price, [data.prices]);

  /** Cantidad ya comprometida en pedidos abiertos de una sede (por defecto, la activa). */
  const reserved = useCallback(
    (productId: string, sedeId?: string) => {
      const prefix = (sedeId ?? sede) + '|';
      let q = 0;
      for (const [k, o] of Object.entries(data.orders)) {
        if (!k.startsWith(prefix)) continue;
        for (const l of o.lines) if (l.productId === productId) q += l.qty;
      }
      return round3(q);
    },
    [data.orders, sede],
  );

  const available = useCallback(
    (productId: string) => round3((data.stock[sede]?.[productId] ?? 0) - reserved(productId)),
    [data.stock, sede, reserved],
  );

  const addLine = useCallback(
    (target: string, product: Product, opts: { qty?: number; unitPrice: number; mods?: string[]; note?: string }): AddResult => {
      if (!data.shifts[sede]?.open) return { ok: false, reason: 'closed' };
      const qty = round3(opts.qty ?? 1);
      if (available(product.id) < qty - 1e-9) return { ok: false, reason: 'stock' };
      update((d, s) => {
        const key = orderKey(s.sede[s.preset], target);
        const o = d.orders[key] ?? { lines: [], redeemBlocks: 0 };
        const simple = !product.byWeight && !opts.mods?.length && !opts.note;
        const sameIdx = simple
          ? o.lines.findIndex((l) => l.productId === product.id && l.unitPrice === opts.unitPrice && !l.mods && !l.note)
          : -1;
        const lines =
          sameIdx >= 0
            ? o.lines.map((l, i) => (i === sameIdx ? { ...l, qty: l.qty + qty } : l))
            : [
                ...o.lines,
                {
                  uid: `l${d.seq}`,
                  productId: product.id,
                  name: product.name,
                  emoji: product.emoji,
                  qty,
                  unitPrice: opts.unitPrice,
                  tax: product.tax,
                  byWeight: product.byWeight,
                  station: product.station,
                  mods: opts.mods?.length ? opts.mods : undefined,
                  note: opts.note || undefined,
                  combo: product.combo,
                  sent: 0,
                },
              ];
        return { ...d, seq: d.seq + 1, orders: { ...d.orders, [key]: { ...o, lines } } };
      });
      return { ok: true };
    },
    [available, data.shifts, sede, update],
  );

  const bumpVoids = useCallback(
    () => update((d, s) => {
      const id = s.sede[s.preset];
      return { ...d, shifts: { ...d.shifts, [id]: { ...d.shifts[id], voids: d.shifts[id].voids + 1 } } };
    }),
    [update],
  );

  const changeQty = useCallback(
    (target: string, uid: string, delta: number): AddResult => {
      const line = data.orders[orderKey(sede, target)]?.lines.find((l) => l.uid === uid);
      if (!line) return { ok: true };
      if (delta > 0 && available(line.productId) < delta) return { ok: false, reason: 'stock' };
      updateOrder(target, (o) => ({
        ...o,
        lines: o.lines
          .map((l) => (l.uid !== uid ? l : { ...l, qty: l.qty + delta, sent: Math.min(l.sent, Math.max(0, l.qty + delta)) }))
          .filter((l) => l.qty > 0),
      }));
      if (delta < 0 && line.qty + delta < line.sent) bumpVoids();
      return { ok: true };
    },
    [available, bumpVoids, data.orders, sede, updateOrder],
  );

  const removeLine = useCallback(
    (target: string, uid: string) => {
      const line = data.orders[orderKey(sede, target)]?.lines.find((l) => l.uid === uid);
      updateOrder(target, (o) => ({ ...o, lines: o.lines.filter((l) => l.uid !== uid) }));
      if (line && line.sent > 0) bumpVoids();
    },
    [bumpVoids, data.orders, sede, updateOrder],
  );

  /** Vacía el ticket. En una mesa la deja abierta (con su mesero) hasta que se libere. */
  const clearOrder = useCallback(
    (target: string) => {
      const order = data.orders[orderKey(sede, target)];
      updateOrder(target, (o) => (target === 'counter' ? null : { ...o, lines: [], customerId: undefined, redeemBlocks: 0, billRequested: false }));
      if (order?.lines.some((l) => l.sent > 0)) bumpVoids();
    },
    [bumpVoids, data.orders, sede, updateOrder],
  );

  /** Libera una mesa sin consumo. */
  const releaseTable = useCallback((target: string) => updateOrder(target, () => null), [updateOrder]);

  const setOrderField = useCallback(
    (target: string, patch: Partial<OpenOrder>) => updateOrder(target, (o) => ({ ...o, ...patch })),
    [updateOrder],
  );

  const openTable = useCallback(
    (table: number, waiterId: string, guests: number) =>
      updateOrder(`t${table}`, (o) => ({ ...o, waiterId, guests, redeemBlocks: o.redeemBlocks ?? 0 })),
    [updateOrder],
  );

  /** Envía a cocina/bar lo que falta por enviar. Devuelve cuántas comandas creó por estación. */
  const sendToKitchen = useCallback(
    (target: string, modLabel: (key: string) => string) => {
      const order = data.orders[orderKey(sede, target)];
      if (!order) return { kitchen: 0, bar: 0 };
      const byStation: Record<Station, string[]> = { kitchen: [], bar: [] };
      for (const l of order.lines) {
        const pending = l.qty - l.sent;
        if (pending <= 0) continue;
        const extra = [...(l.mods ?? []).map(modLabel), ...(l.note ? [l.note] : [])].join(', ');
        if (l.combo) {
          for (const c of l.combo) byStation[c.station].push(`${pending}× ${c.name}${extra ? ` · ${extra}` : ''} (${l.name})`);
        } else {
          byStation[l.station ?? 'kitchen'].push(`${pending}× ${l.name}${extra ? ` · ${extra}` : ''}`);
        }
      }
      const now = Date.now();
      update((d) => {
        let n = d.kds.reduce((m, k) => Math.max(m, k.number), 200) + 1;
        const created: KdsOrder[] = (['kitchen', 'bar'] as Station[])
          .filter((st) => byStation[st].length > 0)
          .map((st) => ({ id: `k-${sede}-${n}`, number: n++, sede, target, station: st, lines: byStation[st], createdAt: now, ageMin: 0, status: 'new' as KdsStatus }));
        const key = orderKey(sede, target);
        const o = d.orders[key];
        return {
          ...d,
          kds: [...d.kds, ...created],
          orders: o ? { ...d.orders, [key]: { ...o, lines: o.lines.map((l) => ({ ...l, sent: l.qty })) } } : d.orders,
        };
      });
      return { kitchen: byStation.kitchen.length, bar: byStation.bar.length };
    },
    [data.orders, sede, update],
  );

  const advanceKds = useCallback(
    (id: string) =>
      update((d) => ({
        ...d,
        kds: d.kds.map((k) => (k.id !== id ? k : { ...k, status: k.status === 'new' ? 'preparing' : 'ready' })),
      })),
    [update],
  );
  const deliverKds = useCallback((id: string) => update((d) => ({ ...d, kds: d.kds.filter((k) => k.id !== id) })), [update]);

  const findCustomer = useCallback(
    (q: string) => {
      const digits = q.replace(/\D/g, '');
      if (!digits) return null;
      return data.customers.find((c) => c.doc === digits || c.phone === digits) ?? null;
    },
    [data.customers],
  );

  const registerCustomer = useCallback(
    (input: { name: string; doc: string; phone: string }): { ok: true; id: string } | { ok: false; reason: 'exists' } => {
      const doc = input.doc.replace(/\D/g, '');
      const phone = input.phone.replace(/\D/g, '');
      if (data.customers.some((c) => c.doc === doc || c.phone === phone)) return { ok: false, reason: 'exists' };
      const id = `c-new-${data.seq}`;
      update((d) => ({ ...d, seq: d.seq + 1, customers: [...d.customers, { id, name: input.name.trim(), doc, phone, points: 0 }] }));
      return { ok: true, id };
    },
    [data.customers, data.seq, update],
  );

  const markSent = useCallback((ids: string[]) => {
    setState((s) => {
      const fix = (d: PresetData): PresetData => ({
        ...d,
        sales: d.sales.map((x) => (ids.includes(x.id) && x.status === 'sending' ? { ...x, status: 'sent' } : x)),
      });
      return { ...s, data: { retail: fix(s.data.retail), restaurant: fix(s.data.restaurant) } };
    });
  }, []);

  /** Registra la venta: descuenta existencias, puntos y bonos, y emite el documento de ejemplo. */
  const checkout = useCallback(
    async ({ target, payments, tipPct, buyer }: CheckoutInput): Promise<Sale | null> => {
      const p = PRESETS[preset];
      const sedeIdx = p.sedes.findIndex((x) => x.id === sede);
      const sedeObj = p.sedes[sedeIdx];
      const order = data.orders[orderKey(sede, target)];
      if (!order || order.lines.length === 0) return null;
      const customer = order.customerId ? data.customers.find((c) => c.id === order.customerId) : undefined;
      const gross = order.lines.reduce((s, l) => s + lineAmount(l), 0);
      const redeemValue = Math.min(order.redeemBlocks * POINTS.blockValue, gross);
      const totals = computeTotals(order.lines, redeemValue);
      const tip = preset === 'restaurant' ? tipAmount(totals.base, tipPct) : 0;
      const total = totals.net + tip;
      const paid = payments.reduce((s, x) => s + x.amount, 0);
      if (paid < total) return null;
      const change = paid - total;
      const docType: Sale['docType'] = buyer.kind === 'final' ? 'pos' : 'invoice';
      const seqKey = `${sede}|${docType === 'pos' ? 'pos' : 'fe'}`;
      const consecutive = data.docSeq[seqKey];
      const number = docType === 'pos' ? `${sedeObj.prefix}-${consecutive}` : `${p.business.invoicePrefix}${sedeIdx + 1}-${consecutive}`;
      const createdAt = new Date().toISOString();
      const tier = customer ? tierOf(customer.points) : 'bronze';
      const earned = customer ? pointsEarned(totals.net, tier) : 0;
      const redeemed = customer ? order.redeemBlocks * POINTS.blockPoints : 0;
      const cudeInput = [
        number,
        createdAt.slice(0, 10),
        createdAt.slice(11, 19) + '-05:00',
        totals.base.toFixed(2),
        ...totals.taxes.flatMap((t) => [t.kind, t.tax.toFixed(2)]),
        total.toFixed(2),
        p.business.nit.replace(/\D/g, ''),
        buyer.doc.split('-')[0],
        'PIN-DEMO',
        '2',
      ].join('');
      const cude = await sha384Hex(cudeInput);
      const shift = data.shifts[sede];
      const sale: Sale = {
        id: `s-${sede}-${consecutive}-${docType}`,
        docType,
        number,
        sede,
        shift: shift.number,
        createdAt,
        cashierId: shift.cashierId,
        waiterId: order.waiterId,
        sellerId: order.sellerId,
        target,
        lines: order.lines.map((l) => ({
          name: l.name,
          emoji: l.emoji,
          qty: l.qty,
          unitPrice: l.unitPrice,
          amount: lineAmount(l),
          byWeight: l.byWeight,
          mods: l.mods,
          note: l.note,
        })),
        gross: totals.gross,
        discount: totals.discount,
        taxes: totals.taxes,
        base: totals.base,
        tip,
        total,
        payments,
        change,
        customerId: customer?.id,
        pointsEarned: earned,
        pointsRedeemed: redeemed,
        buyer,
        cude,
        status: state.offline ? 'queued' : 'sending',
        restock: order.lines.map((l) => ({ productId: l.productId, qty: l.qty })),
      };
      update((d) => {
        const stockSede = { ...d.stock[sede] };
        for (const r of sale.restock) stockSede[r.productId] = round3((stockSede[r.productId] ?? 0) - r.qty);
        const giftCards = { ...d.giftCards };
        for (const pay of payments) if (pay.method === 'gift' && pay.ref) giftCards[pay.ref] = (giftCards[pay.ref] ?? 0) - pay.amount;
        const orders = { ...d.orders };
        delete orders[orderKey(sede, target)];
        return {
          ...d,
          stock: { ...d.stock, [sede]: stockSede },
          giftCards,
          customers: d.customers.map((c) => (c.id === sale.customerId ? { ...c, points: c.points - redeemed + earned } : c)),
          docSeq: { ...d.docSeq, [seqKey]: consecutive + 1 },
          sales: [...d.sales, sale],
          orders,
        };
      });
      if (!state.offline) later(() => markSent([sale.id]), 1200);
      return sale;
    },
    [data, later, markSent, preset, sede, state.offline, update],
  );

  /** Anula una venta del turno con nota crédito de ejemplo: devuelve existencias, puntos y saldo de bonos. */
  const refundSale = useCallback(
    (id: string) => {
      update((d) => {
        const sale = d.sales.find((x) => x.id === id);
        if (!sale || sale.refunded) return d;
        const ncKey = `${sale.sede}|nc`;
        const nc = d.docSeq[ncKey] ?? 101;
        const sedeIdx = PRESETS[preset].sedes.findIndex((x) => x.id === sale.sede);
        const stockSede = { ...d.stock[sale.sede] };
        for (const r of sale.restock) stockSede[r.productId] = round3((stockSede[r.productId] ?? 0) + r.qty);
        const giftCards = { ...d.giftCards };
        for (const pay of sale.payments) if (pay.method === 'gift' && pay.ref) giftCards[pay.ref] = (giftCards[pay.ref] ?? 0) + pay.amount;
        return {
          ...d,
          stock: { ...d.stock, [sale.sede]: stockSede },
          giftCards,
          customers: d.customers.map((c) =>
            c.id === sale.customerId ? { ...c, points: Math.max(0, c.points - sale.pointsEarned + sale.pointsRedeemed) } : c,
          ),
          docSeq: { ...d.docSeq, [ncKey]: nc + 1 },
          sales: d.sales.map((x) => (x.id === id ? { ...x, refunded: true, creditNote: `NC${sedeIdx + 1}-${nc}` } : x)),
        };
      });
    },
    [preset, update],
  );

  const shiftSales = useCallback(
    (sedeId: string, shiftNo: number) => data.sales.filter((s) => s.sede === sedeId && s.shift === shiftNo),
    [data.sales],
  );

  const closeShift = useCallback(
    (counted: number): Closure | null => {
      const shift = data.shifts[sede];
      if (!shift?.open) return null;
      const report = buildReport(shiftSales(sede, shift.number));
      const expectedCash = shift.base + report.netCash;
      const closure: Closure = {
        id: `z-${sede}-${shift.number}`,
        sede,
        shift: shift.number,
        z: shift.number,
        closedAt: new Date().toISOString(),
        cashierId: shift.cashierId,
        base: shift.base,
        expectedCash,
        counted,
        diff: counted - expectedCash,
        voids: shift.voids,
        report,
      };
      update((d) => ({
        ...d,
        closures: [...d.closures, closure],
        shifts: { ...d.shifts, [sede]: { ...d.shifts[sede], open: false } },
      }));
      return closure;
    },
    [data.shifts, sede, shiftSales, update],
  );

  const openShift = useCallback(
    (base: number, cashierId: string) =>
      update((d) => ({
        ...d,
        shifts: {
          ...d.shifts,
          [sede]: { number: d.shifts[sede].number + 1, open: true, base, cashierId, openedAt: hhmm(), voids: 0 },
        },
      })),
    [sede, update],
  );

  const punch = useCallback(
    (employeeId: string) =>
      update((d) => {
        const st = d.staff[employeeId];
        const now = hhmm();
        return {
          ...d,
          staff: {
            ...d.staff,
            [employeeId]: st.clockedIn ? { ...st, clockedIn: false, lastOut: now } : { clockedIn: true, since: now },
          },
        };
      }),
    [update],
  );

  const transfer = useCallback(
    (productId: string, from: string, to: string, qty: number): boolean => {
      if (state.offline || from === to || qty <= 0) return false;
      const have = (data.stock[from]?.[productId] ?? 0) - reserved(productId, from);
      if (have < qty - 1e-9) return false;
      update((d) => ({
        ...d,
        stock: {
          ...d.stock,
          [from]: { ...d.stock[from], [productId]: round3(d.stock[from][productId] - qty) },
          [to]: { ...d.stock[to], [productId]: round3((d.stock[to][productId] ?? 0) + qty) },
        },
        transfers: [{ id: `tr-${d.seq}`, productId, from, to, qty, at: hhmm() }, ...d.transfers],
        seq: d.seq + 1,
      }));
      return true;
    },
    [data.stock, reserved, state.offline, update],
  );

  const setPrice = useCallback(
    (productId: string, price: number) => update((d) => ({ ...d, prices: { ...d.prices, [productId]: Math.round(price) } })),
    [update],
  );

  const setPreset = useCallback((p: PresetId) => setState((s) => ({ ...s, preset: p })), []);
  const setSede = useCallback((id: string) => setState((s) => ({ ...s, sede: { ...s.sede, [s.preset]: id } })), []);
  const toggleHappyHour = useCallback(() => setState((s) => ({ ...s, happyHour: !s.happyHour })), []);
  const nextScaleReading = useCallback(() => setState((s) => ({ ...s, scaleIdx: s.scaleIdx + 1 })), []);

  /** Cambia el modo sin internet; al reconectar transmite la cola (simulado). */
  const toggleOffline = useCallback(() => {
    const goingOnline = state.offline;
    const queued = [...state.data.retail.sales, ...state.data.restaurant.sales].filter((s) => s.status === 'queued').map((s) => s.id);
    setState((s) => {
      if (!goingOnline) return { ...s, offline: true };
      const fix = (d: PresetData): PresetData => ({
        ...d,
        sales: d.sales.map((x) => (x.status === 'queued' ? { ...x, status: 'sending' } : x)),
      });
      return { ...s, offline: false, data: { retail: fix(s.data.retail), restaurant: fix(s.data.restaurant) } };
    });
    if (goingOnline && queued.length > 0) {
      setSyncing(queued.length);
      later(() => {
        markSent(queued);
        setSyncing(0);
      }, 1800);
    }
  }, [later, markSent, state.data, state.offline]);

  const reset = useCallback(() => {
    const fresh = seedState();
    const now = Date.now();
    setState({ ...fresh, data: { retail: stampKds(fresh.data.retail, now), restaurant: stampKds(fresh.data.restaurant, now) } });
    setSyncing(0);
  }, []);

  const queuedCount = state.data.retail.sales.filter((s) => s.status === 'queued').length + state.data.restaurant.sales.filter((s) => s.status === 'queued').length;

  return {
    state,
    hydrated,
    preset,
    sede,
    data,
    syncing,
    queuedCount,
    priceOf,
    available,
    reserved,
    addLine,
    changeQty,
    removeLine,
    clearOrder,
    releaseTable,
    setOrderField,
    openTable,
    sendToKitchen,
    advanceKds,
    deliverKds,
    findCustomer,
    registerCustomer,
    checkout,
    refundSale,
    shiftSales,
    closeShift,
    openShift,
    punch,
    transfer,
    setPrice,
    setPreset,
    setSede,
    toggleOffline,
    toggleHappyHour,
    nextScaleReading,
    reset,
  };
}

export type PosStore = ReturnType<typeof usePosStore>;
