'use client';

// Estado único de la demo: el pedido que haces en la app del Cliente llega a la
// sede (Comercio), a Operaciones y al Repartidor, y la entrega lo cierra en las
// 4 apps. Todo corre en este navegador (se guarda en localStorage) y se puede
// reiniciar. El reloj de la demo arranca a las 7:05 p. m. y avanza en tiempo real.

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import type {
  AlertResolution, CartLine, ChatMsg, Driver, DriverDoc, LogEntry, Order, PaymentId, SavedAddress, SedeId,
} from './types';
import {
  DRIVERS, DRIVER_DOCS, CUSTOMER, INITIAL_POINTS, MENU_BY_ID, SAVED_ADDRESSES, SEDES, SEDE_BY_ID, START_SOD, generateSampleDay,
} from './data';
import {
  RAIN_BONUS, POINTS_REDEEM, deliveryCode, isActive, km, lineKey, nearestSede, pointsEarned, priceOrder, suggestDrivers,
  travelMin, unitPrice, sedeOptions, type SedeOption,
} from './engine';

export type AppTab = 'customer' | 'merchant' | 'ops' | 'driver';
export type CustomerView = 'home' | 'cart' | 'tracking' | 'chat' | 'orders' | 'address';

const STORAGE_KEY = 'koptup-demo-delivery-v1';
const VERSION = 1;
/** Cada cuánto da un paso el avance automático (segundos). */
export const AUTO_STEP_S = 4;
/** Los recorridos en el mapa van 10 veces más rápido que el tiempo estimado. */
export const MAP_SPEEDUP = 10;

export interface DemoState {
  v: number;
  now: number;
  orders: Order[];
  seq: number;
  drivers: Driver[];
  docs: Record<string, DriverDoc[]>;
  sedeOpen: Record<SedeId, boolean>;
  soldOut: Record<SedeId, string[]>;
  rain: { surcharge: boolean; bonus: boolean };
  reviews: Record<string, AlertResolution>;
  blocked: string[];
  customer: {
    addresses: SavedAddress[];
    addressId: string;
    sedeId: SedeId | null;
    cart: CartLine[];
    note: string;
    tip: number;
    payment: PaymentId;
    cashWith: number | null;
    club: boolean;
    usePoints: boolean;
    points: number;
    split: number;
    activeOrderId: string | null;
    view: CustomerView;
  };
  tab: AppTab;
  merchantSede: SedeId;
  driverView: string;
  auto: boolean;
  lastAuto: number;
  log: LogEntry[];
  tourOpen: boolean;
  savings: { pct: number; cost: number };
}

export function initialState(): DemoState {
  const day = generateSampleDay();
  return {
    v: VERSION,
    now: START_SOD,
    orders: day.orders,
    seq: day.nextSeq,
    drivers: DRIVERS.map((d) => ({ ...d, place: { ...d.place } })),
    docs: JSON.parse(JSON.stringify(DRIVER_DOCS)),
    sedeOpen: { chapinero: true, usaquen: true, cedritos: true },
    soldOut: { chapinero: [], usaquen: ['sancocho'], cedritos: ['natas'] },
    rain: { surcharge: false, bonus: false },
    reviews: {},
    blocked: [],
    customer: {
      addresses: SAVED_ADDRESSES,
      addressId: 'casa',
      sedeId: null,
      cart: [],
      note: '',
      tip: 0,
      payment: 'nequi',
      cashWith: null,
      club: false,
      usePoints: false,
      points: INITIAL_POINTS,
      split: 1,
      activeOrderId: null,
      view: 'home',
    },
    tab: 'customer',
    merchantSede: 'chapinero',
    driverView: 'd1',
    auto: false,
    lastAuto: START_SOD,
    log: [],
    tourOpen: true,
    savings: { pct: 25, cost: 6000 },
  };
}

// ---------------------------------------------------------------------------
// Transiciones (funciones puras sobre el estado)
// ---------------------------------------------------------------------------

function log(s: DemoState, app: LogEntry['app'], key: string, params?: LogEntry['params']): DemoState {
  return { ...s, log: [{ at: s.now, app, key, params }, ...s.log].slice(0, 60) };
}

function patchOrder(s: DemoState, id: string, patch: (o: Order) => Order): DemoState {
  return { ...s, orders: s.orders.map((o) => (o.id === id ? patch(o) : o)) };
}

function find(s: DemoState, id: string): Order | undefined {
  return s.orders.find((o) => o.id === id);
}

function refundPoints(s: DemoState, o: Order): DemoState {
  if (!o.own || !o.pointsUsed) return s;
  return { ...s, customer: { ...s.customer, points: s.customer.points + o.pointsUsed } };
}

export function selectedSede(s: DemoState): { address: SavedAddress; option: SedeOption | null; options: SedeOption[] } {
  const address = s.customer.addresses.find((a) => a.id === s.customer.addressId) ?? s.customer.addresses[0];
  const options = sedeOptions(address.place, SEDES, s.sedeOpen);
  const manual = s.customer.sedeId ? options.find((o) => o.sede.id === s.customer.sedeId && o.open && o.inCoverage) : undefined;
  return { address, option: manual ?? nearestSede(address.place, SEDES, s.sedeOpen), options };
}

export function cartPricing(s: DemoState) {
  const { option } = selectedSede(s);
  return priceOrder({
    lines: s.customer.cart,
    distanceKm: option?.km ?? 0,
    club: s.customer.club,
    rain: s.rain.surcharge,
    tip: s.customer.tip,
    usePoints: s.customer.usePoints,
    points: s.customer.points,
  });
}

export type PlaceError = 'empty' | 'noSede' | 'soldOut' | 'cash' | 'blocked';

export function placeOrderCheck(s: DemoState): PlaceError | null {
  if (!s.customer.cart.length) return 'empty';
  if (s.blocked.includes(CUSTOMER.id)) return 'blocked';
  const { option } = selectedSede(s);
  if (!option) return 'noSede';
  if (s.customer.cart.some((l) => s.soldOut[option.sede.id].includes(l.itemId))) return 'soldOut';
  const pricing = cartPricing(s);
  if (s.customer.payment === 'cash' && s.customer.cashWith !== null && s.customer.cashWith < pricing.total) return 'cash';
  return null;
}

function placeOrder(s: DemoState): DemoState {
  if (placeOrderCheck(s)) return s;
  const { address, option } = selectedSede(s);
  const sede = option!.sede;
  const pricing = cartPricing(s);
  const seq = s.seq;
  const pointsUsed = pricing.discount > 0 ? POINTS_REDEEM : 0;
  const order: Order = {
    id: `P-${seq}`,
    seq,
    own: true,
    sedeId: sede.id,
    customer: { id: CUSTOMER.id, name: CUSTOMER.name, phone: CUSTOMER.phone, address: address.address, place: address.place, zone: address.zone, isNew: s.orders.every((o) => !o.own) },
    lines: s.customer.cart,
    note: s.customer.note.trim() || undefined,
    pricing,
    payment: s.customer.payment,
    cashWith: s.customer.payment === 'cash' ? s.customer.cashWith ?? undefined : undefined,
    pointsUsed: pointsUsed || undefined,
    driverBonus: s.rain.bonus ? RAIN_BONUS : 0,
    code: deliveryCode(seq),
    stage: 'pending',
    t: { created: s.now },
    chat: [],
    driverRejections: 0,
  };
  const next: DemoState = {
    ...s,
    seq: seq + 1,
    orders: [...s.orders, order],
    merchantSede: sede.id,
    customer: {
      ...s.customer,
      cart: [],
      note: '',
      tip: 0,
      cashWith: null,
      usePoints: false,
      split: 1,
      points: s.customer.points - pointsUsed,
      activeOrderId: order.id,
      view: 'tracking',
    },
  };
  return log(next, 'customer', 'orderPlaced', { id: order.id, sede: sede.id, method: order.payment });
}

function accept(s: DemoState, id: string, prepMin: number, by: 'merchant' | 'ops' = 'merchant'): DemoState {
  const o = find(s, id);
  if (!o || o.stage !== 'pending') return s;
  const ride = travelMin(km(SEDE_BY_ID[o.sedeId].place, o.customer.place));
  const elapsed = Math.ceil((s.now - o.t.created) / 60);
  const next = patchOrder(s, id, (x) => ({ ...x, stage: 'preparing', prepMin, promisedMin: elapsed + prepMin + ride + 5, t: { ...x.t, accepted: s.now } }));
  return log(next, by, by === 'ops' ? 'acceptedByOps' : 'accepted', { id, sede: o.sedeId, min: prepMin });
}

function reject(s: DemoState, id: string, reason: string): DemoState {
  const o = find(s, id);
  if (!o || o.stage !== 'pending') return s;
  const next = patchOrder(refundPoints(s, o), id, (x) => ({ ...x, stage: 'rejected', rejectReason: reason, t: { ...x.t, closed: s.now } }));
  return log(next, 'merchant', 'rejected', { id, sede: o.sedeId, reason });
}

function markReady(s: DemoState, id: string): DemoState {
  const o = find(s, id);
  if (!o || o.stage !== 'preparing') return s;
  return log(patchOrder(s, id, (x) => ({ ...x, stage: 'ready', t: { ...x.t, ready: s.now } })), 'merchant', 'ready', { id, sede: o.sedeId });
}

function assign(s: DemoState, id: string, driverId: string): DemoState {
  const o = find(s, id);
  const driver = s.drivers.find((d) => d.id === driverId);
  if (!o || !driver || !isActive(o) || o.stage === 'pickedUp' || o.stage === 'pending' || !driver.online || s.blocked.includes(driverId)) return s;
  const prev = o.driverId;
  let next = patchOrder(s, id, (x) => ({ ...x, driverId, driverStatus: 'offered', t: { ...x.t, assigned: s.now } }));
  if (o.own) next = { ...next, driverView: driverId };
  return log(next, 'ops', prev && prev !== driverId ? 'reassigned' : 'assigned', { id, driver: driver.name });
}

function driverAccept(s: DemoState, id: string): DemoState {
  const o = find(s, id);
  if (!o || o.driverStatus !== 'offered') return s;
  const driver = s.drivers.find((d) => d.id === o.driverId);
  return log(patchOrder(s, id, (x) => ({ ...x, driverStatus: 'accepted', t: { ...x.t, assigned: s.now } })), 'driver', 'driverAccepted', { id, driver: driver?.name ?? '' });
}

function driverReject(s: DemoState, id: string, reason: string): DemoState {
  const o = find(s, id);
  if (!o || !o.driverId || o.stage === 'pickedUp') return s;
  const driver = s.drivers.find((d) => d.id === o.driverId);
  const next = patchOrder(s, id, (x) => ({ ...x, driverId: undefined, driverStatus: undefined, driverRejections: x.driverRejections + 1 }));
  return log(next, 'driver', 'driverRejected', { id, driver: driver?.name ?? '', reason });
}

function pickup(s: DemoState, id: string): DemoState {
  const o = find(s, id);
  if (!o || o.stage !== 'ready' || o.driverStatus !== 'accepted') return s;
  return log(patchOrder(s, id, (x) => ({ ...x, stage: 'pickedUp', t: { ...x.t, pickedUp: s.now } })), 'driver', 'pickedUp', { id });
}

function deliver(s: DemoState, id: string, method: 'code' | 'photoSignature', photoName?: string): DemoState {
  const o = find(s, id);
  if (!o || o.stage !== 'pickedUp') return s;
  let next = patchOrder(s, id, (x) => ({
    ...x,
    stage: 'delivered',
    pod: { method, distanceM: 6 + (x.seq % 25), photoName },
    t: { ...x.t, delivered: s.now, closed: s.now },
  }));
  next = { ...next, drivers: next.drivers.map((d) => (d.id === o.driverId ? { ...d, place: { ...o.customer.place } } : d)) };
  if (o.own) next = { ...next, customer: { ...next.customer, points: next.customer.points + pointsEarned(o.pricing.subtotal) } };
  return log(next, 'driver', 'delivered', { id, method });
}

function cancel(s: DemoState, id: string, by: 'customer' | 'ops', reason: string): DemoState {
  const o = find(s, id);
  if (!o || !isActive(o) || (by === 'customer' && o.stage !== 'pending')) return s;
  const next = patchOrder(refundPoints(s, o), id, (x) => ({ ...x, stage: 'cancelled', cancelReason: reason, t: { ...x.t, closed: s.now } }));
  return log(next, by, 'cancelled', { id, reason });
}

/** Un paso del avance automático sobre el pedido propio más reciente que siga activo. */
function autoStep(s: DemoState): DemoState {
  const own = [...s.orders].reverse().find((o) => o.own && isActive(o));
  if (!own) return s;
  if (own.stage === 'pending') return accept(s, own.id, 15);
  if ((own.stage === 'preparing' || own.stage === 'ready') && !own.driverId) {
    const best = suggestDrivers(own, s.drivers, s.orders, SEDES).find((x) => !s.blocked.includes(x.driver.id));
    return best ? assign(s, own.id, best.driver.id) : s;
  }
  if (own.driverStatus === 'offered') return driverAccept(s, own.id);
  if (own.stage === 'preparing') return markReady(s, own.id);
  if (own.stage === 'ready') return pickup(s, own.id);
  if (own.stage === 'pickedUp' && s.now - (own.t.pickedUp ?? s.now) >= AUTO_STEP_S * 2) return deliver(s, own.id, 'code');
  return s;
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

type Action =
  | { type: 'tick' }
  | { type: 'hydrate'; state: DemoState }
  | { type: 'reset' }
  | { type: 'set'; patch: Partial<Pick<DemoState, 'tab' | 'merchantSede' | 'driverView' | 'tourOpen' | 'savings'>> }
  | { type: 'customer'; patch: Partial<DemoState['customer']> }
  | { type: 'addAddress'; address: Omit<SavedAddress, 'id'> }
  | { type: 'addToCart'; itemId: string; options: string[]; qty: number }
  | { type: 'qty'; key: string; delta: number }
  | { type: 'placeOrder' }
  | { type: 'accept'; id: string; prepMin: number; by?: 'merchant' | 'ops' }
  | { type: 'reject'; id: string; reason: string }
  | { type: 'ready'; id: string }
  | { type: 'assign'; id: string; driverId: string }
  | { type: 'driverAccept'; id: string }
  | { type: 'driverReject'; id: string; reason: string }
  | { type: 'pickup'; id: string }
  | { type: 'deliver'; id: string; method: 'code' | 'photoSignature'; photoName?: string }
  | { type: 'cancel'; id: string; by: 'customer' | 'ops'; reason: string }
  | { type: 'chat'; id: string; msg: Omit<ChatMsg, 'at'> }
  | { type: 'rate'; id: string; stars: number; comment?: string }
  | { type: 'notifyLate'; id: string }
  | { type: 'soldOut'; sede: SedeId; itemId: string }
  | { type: 'sedeOpen'; sede: SedeId }
  | { type: 'rain'; key: 'surcharge' | 'bonus' }
  | { type: 'resolve'; alertId: string; resolution: AlertResolution; accounts: string[] }
  | { type: 'unblock'; account: string }
  | { type: 'driverOnline'; driverId: string }
  | { type: 'doc'; driverId: string; docId: DriverDoc['id']; expires?: string; fileName: string }
  | { type: 'auto' };

function reducer(s: DemoState, a: Action): DemoState {
  switch (a.type) {
    case 'tick': {
      let next: DemoState = { ...s, now: s.now + 1 };
      if (next.auto && next.now - next.lastAuto >= AUTO_STEP_S) {
        const stepped = autoStep(next);
        next = { ...stepped, lastAuto: stepped === next ? next.lastAuto : next.now };
      }
      return next;
    }
    case 'hydrate':
      return a.state;
    case 'reset':
      return initialState();
    case 'set':
      return { ...s, ...a.patch };
    case 'customer':
      return { ...s, customer: { ...s.customer, ...a.patch } };
    case 'addAddress': {
      const id = `n${s.customer.addresses.length + 1}`;
      return { ...s, customer: { ...s.customer, addresses: [...s.customer.addresses, { ...a.address, id }], addressId: id, sedeId: null, view: 'home' } };
    }
    case 'addToCart': {
      const item = MENU_BY_ID[a.itemId];
      if (!item) return s;
      const key = lineKey(a.itemId, a.options);
      const cart = s.customer.cart.some((l) => l.key === key)
        ? s.customer.cart.map((l) => (l.key === key ? { ...l, qty: Math.min(20, l.qty + a.qty) } : l))
        : [...s.customer.cart, { key, itemId: a.itemId, qty: a.qty, unit: unitPrice(item, a.options), options: a.options }];
      return { ...s, customer: { ...s.customer, cart } };
    }
    case 'qty':
      return {
        ...s,
        customer: {
          ...s.customer,
          cart: s.customer.cart.flatMap((l) => (l.key !== a.key ? [l] : l.qty + a.delta <= 0 ? [] : [{ ...l, qty: Math.min(20, l.qty + a.delta) }])),
        },
      };
    case 'placeOrder':
      return placeOrder(s);
    case 'accept':
      return accept(s, a.id, a.prepMin, a.by);
    case 'reject':
      return reject(s, a.id, a.reason);
    case 'ready':
      return markReady(s, a.id);
    case 'assign':
      return assign(s, a.id, a.driverId);
    case 'driverAccept':
      return driverAccept(s, a.id);
    case 'driverReject':
      return driverReject(s, a.id, a.reason);
    case 'pickup':
      return pickup(s, a.id);
    case 'deliver':
      return deliver(s, a.id, a.method, a.photoName);
    case 'cancel':
      return cancel(s, a.id, a.by, a.reason);
    case 'chat':
      return patchOrder(s, a.id, (o) => ({ ...o, chat: [...o.chat, { ...a.msg, at: s.now }].slice(-40) }));
    case 'rate': {
      const o = find(s, a.id);
      if (!o || o.stage !== 'delivered') return s;
      return log(patchOrder(s, a.id, (x) => ({ ...x, rating: { stars: a.stars, comment: a.comment?.trim() || undefined } })), 'customer', 'rated', { id: a.id, stars: a.stars });
    }
    case 'notifyLate': {
      const next = patchOrder(s, a.id, (o) => ({ ...o, lateNotified: true, chat: [...o.chat, { from: 'ops', key: 'lateNotice', at: s.now }] }));
      return log(next, 'ops', 'lateNotified', { id: a.id });
    }
    case 'soldOut': {
      const list = s.soldOut[a.sede];
      const out = list.includes(a.itemId);
      const next = { ...s, soldOut: { ...s.soldOut, [a.sede]: out ? list.filter((x) => x !== a.itemId) : [...list, a.itemId] } };
      return log(next, 'merchant', out ? 'available' : 'soldOut', { sede: a.sede, item: a.itemId });
    }
    case 'sedeOpen': {
      const open = !s.sedeOpen[a.sede];
      return log({ ...s, sedeOpen: { ...s.sedeOpen, [a.sede]: open } }, 'merchant', open ? 'sedeOpened' : 'sedeClosed', { sede: a.sede });
    }
    case 'rain': {
      const on = !s.rain[a.key];
      return log({ ...s, rain: { ...s.rain, [a.key]: on } }, 'ops', `${a.key}${on ? 'On' : 'Off'}`);
    }
    case 'resolve': {
      const blocked = a.resolution === 'blocked' ? Array.from(new Set([...s.blocked, ...a.accounts])) : s.blocked;
      return log({ ...s, reviews: { ...s.reviews, [a.alertId]: a.resolution }, blocked }, 'ops', a.resolution === 'blocked' ? 'alertBlocked' : 'alertDismissed', { alert: a.alertId.split(':')[0] });
    }
    case 'unblock':
      return log({ ...s, blocked: s.blocked.filter((x) => x !== a.account) }, 'ops', 'unblocked');
    case 'driverOnline': {
      const d = s.drivers.find((x) => x.id === a.driverId);
      if (!d) return s;
      if (d.online && s.orders.some((o) => o.driverId === d.id && isActive(o))) return s;
      const next = { ...s, drivers: s.drivers.map((x) => (x.id === d.id ? { ...x, online: !x.online } : x)) };
      return log(next, 'driver', d.online ? 'driverOffline' : 'driverOnline', { driver: d.name });
    }
    case 'doc': {
      const docs = (s.docs[a.driverId] ?? []).map((d) => (d.id === a.docId ? { ...d, expires: a.expires ?? d.expires, fileName: a.fileName } : d));
      return log({ ...s, docs: { ...s.docs, [a.driverId]: docs } }, 'driver', 'docUpdated', { doc: a.docId });
    }
    case 'auto':
      return log({ ...s, auto: !s.auto, lastAuto: s.now }, 'system', s.auto ? 'autoOff' : 'autoOn');
    default:
      return s;
  }
}

// ---------------------------------------------------------------------------
// Proveedor
// ---------------------------------------------------------------------------

export interface Toast {
  id: number;
  text: string;
  tone: 'ok' | 'info' | 'warn';
}

interface Ctx {
  state: DemoState;
  hydrated: boolean;
  dispatch: (a: Action) => void;
  notify: (text: string, tone?: Toast['tone']) => void;
  toasts: Toast[];
  dismissToast: (id: number) => void;
}

const DeliveryContext = createContext<Ctx | null>(null);

function readStorage(): DemoState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoState;
    if (!parsed || parsed.v !== VERSION || !Array.isArray(parsed.orders)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStorage(s: DemoState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // Sin almacenamiento (modo privado o bloqueado): la demo sigue funcionando sin guardar.
  }
}

export function DeliveryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);

  useEffect(() => {
    const saved = readStorage();
    if (saved) dispatch({ type: 'hydrate', state: saved });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const id = window.setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => window.clearInterval(id);
  }, [hydrated]);

  useEffect(() => {
    if (hydrated) writeStorage(state);
  }, [state, hydrated]);

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const notify = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    toastSeq.current += 1;
    const id = toastSeq.current;
    setToasts((t) => [...t.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const value = useMemo(() => ({ state, hydrated, dispatch, notify, toasts, dismissToast }), [state, hydrated, notify, toasts, dismissToast]);
  return <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>;
}

export function useDelivery(): Ctx {
  const ctx = useContext(DeliveryContext);
  if (!ctx) throw new Error('useDelivery debe usarse dentro de DeliveryProvider');
  return ctx;
}

export function resetStorage() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nada que borrar
  }
}

// Exportados para las pruebas de la lógica.
export const __test = { reducer, accept, reject, markReady, assign, driverAccept, driverReject, pickup, deliver, cancel, autoStep, placeOrder };
