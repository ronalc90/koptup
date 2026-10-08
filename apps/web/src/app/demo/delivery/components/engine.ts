// Lógica pura de la demo de domicilios: distancias por cuadras, tarifa de
// domicilio, precios, sugerencia de repartidor, orden de paradas, indicaciones
// de ruta, reportes y alertas por reglas. Nada aquí usa la hora real ni azar:
// así el servidor y el navegador muestran lo mismo y se puede probar.

import type {
  CartLine, Driver, MenuItem, Order, Place, Pricing, Sede, SedeId, Stage, Vehicle, ZoneId,
} from './types';

// ---------------------------------------------------------------------------
// Distancias y tarifas
// ---------------------------------------------------------------------------

/** Una cuadra en Bogotá mide unos 100 m. Distancia "por cuadras" (Manhattan). */
export const KM_PER_BLOCK = 0.1;
/** Radio de cobertura de cada sede. */
export const COVERAGE_KM = 8;
export const FEE_BASE = 3900;
export const FEE_BASE_KM = 2;
export const FEE_PER_KM = 800;
export const CLUB_FREE_FROM = 40000;
export const RAIN_FEE = 2000;
export const RAIN_BONUS = 1500;
export const POINTS_REDEEM = 500;
export const POINTS_REDEEM_VALUE = 5000;
/** Puntos que se ganan por cada $1.000 del subtotal de un pedido entregado. */
export const POINTS_PER_THOUSAND = 1;
export const ACCEPT_WINDOW_S = 45;
export const DRIVER_BASE_PAY = 4000;
export const DRIVER_PAY_PER_KM = 700;
export const TIP_OPTIONS = [0, 2000, 3000, 5000];
export const BIG_CASH_LIMIT = 200000;
export const GPS_FAR_M = 300;
export const DEMO_DATE = '2026-10-08';

export function km(a: Place, b: Place): number {
  return round1((Math.abs(a.calle - b.calle) + Math.abs(a.carrera - b.carrera)) * KM_PER_BLOCK);
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function deliveryFee(distanceKm: number): number {
  if (distanceKm <= FEE_BASE_KM) return FEE_BASE;
  return FEE_BASE + Math.ceil(distanceKm - FEE_BASE_KM) * FEE_PER_KM;
}

/** Minutos de trayecto estimados (tráfico urbano): moto 3 min/km, bici 4 min/km, + 2 de parqueo. */
export function travelMin(distanceKm: number, vehicle: Vehicle = 'moto'): number {
  return Math.ceil(distanceKm * (vehicle === 'bici' ? 4 : 3)) + 2;
}

export interface SedeOption {
  sede: Sede;
  km: number;
  fee: number;
  open: boolean;
  inCoverage: boolean;
}

export function sedeOptions(place: Place, sedes: Sede[], open: Record<SedeId, boolean>): SedeOption[] {
  return sedes
    .map((sede) => {
      const d = km(place, sede.place);
      return { sede, km: d, fee: deliveryFee(d), open: open[sede.id], inCoverage: d <= COVERAGE_KM };
    })
    .sort((a, b) => a.km - b.km);
}

/** Sede abierta más cercana dentro de la cobertura (o null si ninguna cubre la dirección). */
export function nearestSede(place: Place, sedes: Sede[], open: Record<SedeId, boolean>): SedeOption | null {
  return sedeOptions(place, sedes, open).find((o) => o.open && o.inCoverage) ?? null;
}

// ---------------------------------------------------------------------------
// Direcciones colombianas
// ---------------------------------------------------------------------------

export type StreetType = 'calle' | 'carrera' | 'avCalle' | 'avCarrera' | 'diagonal' | 'transversal';
export const STREET_TYPES: StreetType[] = ['calle', 'carrera', 'avCalle', 'avCarrera', 'diagonal', 'transversal'];

const NUM_RE = /^(\d{1,3})\s*([A-Za-z])?(\s*bis)?(\s*[A-Za-z])?(\s+(sur|este))?$/i;

/** Valida un número de vía como "85", "85A", "127C Bis" o "38 Sur". */
export function parseStreetNumber(raw: string): { n: number; sur: boolean } | null {
  const m = raw.trim().match(NUM_RE);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (!Number.isFinite(n) || n < 1 || n > 250) return null;
  return { n, sur: (m[6] || '').toLowerCase() === 'sur' };
}

/**
 * Convierte "Calle 85 # 15-32" (tipo + vía principal + número generador) en
 * calle/carrera. Calles, diagonales y avenidas calle corren de oriente a
 * occidente; carreras, transversales y avenidas carrera, de sur a norte.
 */
export function placeFromAddress(type: StreetType, main: string, cross: string): Place | null {
  const a = parseStreetNumber(main);
  const b = parseStreetNumber(cross);
  if (!a || !b) return null;
  const isCalle = type === 'calle' || type === 'avCalle' || type === 'diagonal';
  if (isCalle) return { calle: a.sur ? -a.n : a.n, carrera: b.n };
  return { calle: b.sur ? -b.n : b.n, carrera: a.n };
}

export function validPlaca(raw: string): boolean {
  return /^\d{1,3}[A-Za-z]?$/.test(raw.trim());
}

export const ZONE_CENTERS: Record<ZoneId, Place> = {
  chapinero: { calle: 64, carrera: 11 },
  usaquen: { calle: 120, carrera: 7 },
  cedritos: { calle: 142, carrera: 17 },
  suba: { calle: 145, carrera: 91 },
  teusaquillo: { calle: 39, carrera: 20 },
  kennedy: { calle: -38, carrera: 78 },
  fontibon: { calle: 17, carrera: 100 },
};

export function zoneOf(place: Place): ZoneId {
  let best: ZoneId = 'chapinero';
  let bestKm = Infinity;
  (Object.keys(ZONE_CENTERS) as ZoneId[]).forEach((z) => {
    const d = km(place, ZONE_CENTERS[z]);
    if (d < bestKm) {
      bestKm = d;
      best = z;
    }
  });
  return best;
}

// ---------------------------------------------------------------------------
// Carrito y precios
// ---------------------------------------------------------------------------

export function unitPrice(item: MenuItem, options: string[]): number {
  let p = item.price;
  item.choice?.options.forEach((o) => { if (options.includes(o.id)) p += o.delta; });
  item.extras?.forEach((o) => { if (options.includes(o.id)) p += o.delta; });
  return p;
}

export function lineKey(itemId: string, options: string[]): string {
  return [itemId, ...[...options].sort()].join('|');
}

export interface PriceInput {
  lines: CartLine[];
  distanceKm: number;
  club: boolean;
  rain: boolean;
  tip: number;
  usePoints: boolean;
  points: number;
}

export function priceOrder(i: PriceInput): Pricing {
  const subtotal = i.lines.reduce((a, l) => a + l.unit * l.qty, 0);
  const baseFee = deliveryFee(i.distanceKm);
  const fee = i.club && subtotal >= CLUB_FREE_FROM ? 0 : baseFee;
  const rainFee = i.rain ? RAIN_FEE : 0;
  const discount = i.usePoints && i.points >= POINTS_REDEEM ? Math.min(POINTS_REDEEM_VALUE, subtotal) : 0;
  const tip = Math.max(0, Math.round(i.tip));
  return { subtotal, fee, rainFee, discount, tip, total: subtotal + fee + rainFee - discount + tip };
}

export function pointsEarned(subtotal: number): number {
  return Math.floor(subtotal / 1000) * POINTS_PER_THOUSAND;
}

/** Código de entrega de 4 dígitos, determinista a partir del consecutivo del pedido. */
export function deliveryCode(seq: number): string {
  return String(((seq * 7919 + 4821) % 9000) + 1000);
}

export function splitAmount(total: number, people: number): number {
  return Math.ceil(total / Math.max(1, people) / 100) * 100;
}

// ---------------------------------------------------------------------------
// Repartidores y rutas
// ---------------------------------------------------------------------------

export const ACTIVE_STAGES: Stage[] = ['pending', 'preparing', 'ready', 'pickedUp'];

export function isActive(o: Order): boolean {
  return ACTIVE_STAGES.includes(o.stage);
}

export function driverLoad(driverId: string, orders: Order[]): number {
  return orders.filter((o) => o.driverId === driverId && isActive(o)).length;
}

export interface DriverSuggestion {
  driver: Driver;
  kmToSede: number;
  minToSede: number;
  load: number;
}

/**
 * Repartidores conectados ordenados por cercanía a la sede del pedido; los que
 * ya llevan pedidos van después de los libres. Es una regla simple, no un
 * modelo de IA.
 */
export function suggestDrivers(order: Order, drivers: Driver[], orders: Order[], sedes: Sede[]): DriverSuggestion[] {
  const sede = sedes.find((s) => s.id === order.sedeId)!;
  return drivers
    .filter((d) => d.online)
    .map((driver) => {
      const kmToSede = km(driver.place, sede.place);
      return { driver, kmToSede, minToSede: travelMin(kmToSede, driver.vehicle), load: driverLoad(driver.id, orders.filter((o) => o.id !== order.id)) };
    })
    .sort((a, b) => a.load - b.load || a.kmToSede - b.kmToSede);
}

export interface RouteStop {
  orderId: string;
  kind: 'pickup' | 'dropoff';
  place: Place;
  label: string;
}

/**
 * Orden de paradas por "vecino más cercano" respetando que cada pedido se
 * recoja antes de entregarlo. Heurística simple para la demo.
 */
export function planRoute(start: Place, legs: { orderId: string; pickup: Place; pickupLabel: string; dropoff: Place; dropoffLabel: string; picked: boolean }[]): { stops: RouteStop[]; km: number } {
  const pending: RouteStop[] = [];
  const picked = new Set<string>();
  legs.forEach((l) => {
    if (l.picked) picked.add(l.orderId);
    else pending.push({ orderId: l.orderId, kind: 'pickup', place: l.pickup, label: l.pickupLabel });
    pending.push({ orderId: l.orderId, kind: 'dropoff', place: l.dropoff, label: l.dropoffLabel });
  });
  const stops: RouteStop[] = [];
  let here = start;
  let total = 0;
  while (pending.length) {
    let bestIdx = -1;
    let bestKm = Infinity;
    pending.forEach((s, idx) => {
      if (s.kind === 'dropoff' && !picked.has(s.orderId)) return;
      const d = km(here, s.place);
      if (d < bestKm) {
        bestKm = d;
        bestIdx = idx;
      }
    });
    if (bestIdx < 0) break;
    const [s] = pending.splice(bestIdx, 1);
    if (s.kind === 'pickup') picked.add(s.orderId);
    stops.push(s);
    total += bestKm;
    here = s.place;
  }
  return { stops, km: round1(total) };
}

export type Heading = 'north' | 'south' | 'east' | 'west';
export interface NavStep {
  kind: 'follow' | 'turn' | 'arrive';
  street: 'calle' | 'carrera';
  num: number;
  heading?: Heading;
  turn?: 'left' | 'right';
  km?: number;
  untilStreet?: 'calle' | 'carrera';
  untilNum?: number;
}

// En Bogotá las calles crecen hacia el norte y las carreras hacia el occidente.
const VEC: Record<Heading, [number, number]> = { north: [0, 1], south: [0, -1], east: [1, 0], west: [-1, 0] };

function turnBetween(a: Heading, b: Heading): 'left' | 'right' {
  const [ax, ay] = VEC[a];
  const [bx, by] = VEC[b];
  return ax * by - ay * bx > 0 ? 'left' : 'right';
}

/** Indicaciones por cuadras: primero por la calle de origen y luego por la carrera de destino. */
export function navSteps(from: Place, to: Place): NavStep[] {
  const steps: NavStep[] = [];
  const dCarrera = to.carrera - from.carrera;
  const dCalle = to.calle - from.calle;
  let h1: Heading | undefined;
  if (dCarrera !== 0) {
    h1 = dCarrera > 0 ? 'west' : 'east';
    steps.push({ kind: 'follow', street: 'calle', num: from.calle, heading: h1, km: round1(Math.abs(dCarrera) * KM_PER_BLOCK), untilStreet: 'carrera', untilNum: to.carrera });
  }
  if (dCalle !== 0) {
    const h2: Heading = dCalle > 0 ? 'north' : 'south';
    if (h1) steps.push({ kind: 'turn', street: 'carrera', num: to.carrera, heading: h2, turn: turnBetween(h1, h2), km: round1(Math.abs(dCalle) * KM_PER_BLOCK) });
    else steps.push({ kind: 'follow', street: 'carrera', num: from.carrera, heading: h2, km: round1(Math.abs(dCalle) * KM_PER_BLOCK) });
  }
  steps.push({ kind: 'arrive', street: 'calle', num: to.calle });
  return steps;
}

/** Punto intermedio del recorrido por cuadras (primero por la calle, luego por la carrera). */
export function pointAlong(from: Place, to: Place, p: number): Place {
  const total = Math.abs(to.carrera - from.carrera) + Math.abs(to.calle - from.calle);
  if (total === 0) return from;
  let left = Math.max(0, Math.min(1, p)) * total;
  const legA = Math.abs(to.carrera - from.carrera);
  if (left <= legA) return { calle: from.calle, carrera: from.carrera + Math.sign(to.carrera - from.carrera) * left };
  left -= legA;
  return { calle: from.calle + Math.sign(to.calle - from.calle) * left, carrera: to.carrera };
}

export function driverPay(o: Order, sedes: Sede[]): number {
  const sede = sedes.find((s) => s.id === o.sedeId)!;
  const d = km(sede.place, o.customer.place);
  return DRIVER_BASE_PAY + Math.round((d * DRIVER_PAY_PER_KM) / 100) * 100 + o.driverBonus + o.pricing.tip;
}

// ---------------------------------------------------------------------------
// Reportes (todo calculado desde los pedidos)
// ---------------------------------------------------------------------------

export function isLate(o: Order, now: number): boolean {
  if (!o.promisedMin) return false;
  const limit = o.t.created + o.promisedMin * 60;
  if (o.stage === 'delivered') return (o.t.delivered ?? 0) > limit;
  return isActive(o) && now > limit;
}

export function lateMinutes(o: Order, now: number): number {
  if (!o.promisedMin) return 0;
  const end = o.stage === 'delivered' ? o.t.delivered ?? now : now;
  return Math.max(0, Math.round((end - (o.t.created + o.promisedMin * 60)) / 60));
}

export function avg(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

export interface Kpis {
  orders: number;
  active: number;
  delivered: number;
  rejected: number;
  sales: number;
  avgTicket: number;
  avgDeliveryMin: number;
  onTimePct: number;
  peakHour: number | null;
  avgRating: number;
  ratings: number;
}

export function computeKpis(orders: Order[]): Kpis {
  const valid = orders.filter((o) => o.stage !== 'rejected' && o.stage !== 'cancelled');
  const delivered = orders.filter((o) => o.stage === 'delivered');
  const sales = valid.reduce((a, o) => a + o.pricing.subtotal, 0);
  const byHour = new Map<number, number>();
  valid.forEach((o) => {
    const h = Math.floor(o.t.created / 3600) % 24;
    byHour.set(h, (byHour.get(h) ?? 0) + 1);
  });
  let peakHour: number | null = null;
  let peak = 0;
  byHour.forEach((n, h) => {
    if (n > peak || (n === peak && peakHour !== null && h < peakHour)) {
      peak = n;
      peakHour = h;
    }
  });
  const rated = orders.filter((o) => o.rating);
  const onTime = delivered.filter((o) => !isLate(o, o.t.delivered ?? 0)).length;
  return {
    orders: valid.length,
    active: orders.filter(isActive).length,
    delivered: delivered.length,
    rejected: orders.filter((o) => o.stage === 'rejected' || o.stage === 'cancelled').length,
    sales,
    avgTicket: valid.length ? Math.round(sales / valid.length) : 0,
    avgDeliveryMin: Math.round(avg(delivered.map((o) => ((o.t.delivered ?? 0) - o.t.created) / 60))),
    onTimePct: delivered.length ? Math.round((onTime / delivered.length) * 100) : 0,
    peakHour,
    avgRating: rated.length ? Math.round(avg(rated.map((o) => o.rating!.stars)) * 10) / 10 : 0,
    ratings: rated.length,
  };
}

export interface StageTimes {
  accept: number;
  prep: number;
  waitPickup: number;
  ride: number;
  samples: number;
}

/** Minutos promedio por etapa en los pedidos entregados. */
export function stageTimes(orders: Order[]): StageTimes {
  const d = orders.filter((o) => o.stage === 'delivered' && o.t.accepted && o.t.ready && o.t.pickedUp && o.t.delivered);
  const m = (f: (o: Order) => number) => Math.round(avg(d.map(f)) / 6) / 10;
  return {
    accept: m((o) => o.t.accepted! - o.t.created),
    prep: m((o) => o.t.ready! - o.t.accepted!),
    waitPickup: m((o) => o.t.pickedUp! - o.t.ready!),
    ride: m((o) => o.t.delivered! - o.t.pickedUp!),
    samples: d.length,
  };
}

export function salesByHour(orders: Order[], from = 11, to = 21): { hour: number; orders: number; sales: number }[] {
  const out: { hour: number; orders: number; sales: number }[] = [];
  for (let h = from; h <= to; h++) out.push({ hour: h, orders: 0, sales: 0 });
  orders
    .filter((o) => o.stage !== 'rejected' && o.stage !== 'cancelled')
    .forEach((o) => {
      const h = Math.floor(o.t.created / 3600) % 24;
      const row = out.find((r) => r.hour === h);
      if (row) {
        row.orders += 1;
        row.sales += o.pricing.subtotal;
      }
    });
  return out;
}

export function topItems(orders: Order[], n = 3): { itemId: string; qty: number }[] {
  const map = new Map<string, number>();
  orders
    .filter((o) => o.stage !== 'rejected' && o.stage !== 'cancelled')
    .forEach((o) => o.lines.forEach((l) => map.set(l.itemId, (map.get(l.itemId) ?? 0) + l.qty)));
  return [...map.entries()].map(([itemId, qty]) => ({ itemId, qty })).sort((a, b) => b.qty - a.qty || a.itemId.localeCompare(b.itemId)).slice(0, n);
}

export function ordersByZone(orders: Order[]): { zone: ZoneId; orders: number }[] {
  const map = new Map<ZoneId, number>();
  orders
    .filter((o) => o.stage !== 'rejected' && o.stage !== 'cancelled')
    .forEach((o) => map.set(o.customer.zone, (map.get(o.customer.zone) ?? 0) + 1));
  return [...map.entries()].map(([zone, n]) => ({ zone, orders: n })).sort((a, b) => b.orders - a.orders);
}

/** Comisión que se habría pagado a un agregador, menos el costo propio de cada domicilio. */
export function commissionSaved(orders: Order[], commissionPct: number, costPerDelivery: number) {
  const delivered = orders.filter((o) => o.stage === 'delivered');
  const base = delivered.reduce((a, o) => a + o.pricing.subtotal, 0);
  const gross = Math.round((base * commissionPct) / 100);
  const ownCost = delivered.length * costPerDelivery;
  const feesCharged = delivered.reduce((a, o) => a + o.pricing.fee + o.pricing.rainFee, 0);
  return { deliveries: delivered.length, base, gross, ownCost, feesCharged, net: gross - ownCost + feesCharged };
}

// ---------------------------------------------------------------------------
// Alertas por reglas (no IA)
// ---------------------------------------------------------------------------

export type AlertRule = 'noResponse' | 'unassigned' | 'late' | 'driverRejected' | 'gpsFar' | 'sharedPhone' | 'bigCash';

export interface OpsAlert {
  id: string;
  rule: AlertRule;
  orderIds: string[];
  severity: 'high' | 'medium';
  params: Record<string, string | number>;
  fraud: boolean;
}

export function opsAlerts(orders: Order[], now: number): OpsAlert[] {
  const out: OpsAlert[] = [];
  orders.forEach((o) => {
    if (o.stage === 'pending' && now - o.t.created >= ACCEPT_WINDOW_S) {
      out.push({ id: `noResponse:${o.id}`, rule: 'noResponse', orderIds: [o.id], severity: 'high', params: { id: o.id, s: now - o.t.created }, fraud: false });
    }
    if ((o.stage === 'preparing' || o.stage === 'ready') && !o.driverId && o.driverRejections === 0) {
      out.push({ id: `unassigned:${o.id}`, rule: 'unassigned', orderIds: [o.id], severity: o.stage === 'ready' ? 'high' : 'medium', params: { id: o.id }, fraud: false });
    }
    if (isActive(o) && isLate(o, now)) {
      out.push({ id: `late:${o.id}`, rule: 'late', orderIds: [o.id], severity: 'high', params: { id: o.id, min: lateMinutes(o, now) }, fraud: false });
    }
    if (isActive(o) && o.driverRejections > 0 && !o.driverId) {
      out.push({ id: `driverRejected:${o.id}`, rule: 'driverRejected', orderIds: [o.id], severity: 'medium', params: { id: o.id, n: o.driverRejections }, fraud: false });
    }
    if (o.pod && o.pod.distanceM > GPS_FAR_M) {
      out.push({ id: `gpsFar:${o.id}`, rule: 'gpsFar', orderIds: [o.id], severity: 'high', params: { id: o.id, m: o.pod.distanceM }, fraud: true });
    }
    if ((o.payment === 'cash' || o.payment === 'dataphone') && o.customer.isNew && o.pricing.total > BIG_CASH_LIMIT && o.stage !== 'rejected' && o.stage !== 'cancelled') {
      out.push({ id: `bigCash:${o.id}`, rule: 'bigCash', orderIds: [o.id], severity: 'medium', params: { id: o.id, total: o.pricing.total }, fraud: true });
    }
  });
  const byPhone = new Map<string, Order[]>();
  orders.forEach((o) => byPhone.set(o.customer.phone, [...(byPhone.get(o.customer.phone) ?? []), o]));
  byPhone.forEach((list, phone) => {
    const accounts = new Set(list.map((o) => o.customer.id));
    if (accounts.size >= 3) {
      out.push({ id: `sharedPhone:${phone}`, rule: 'sharedPhone', orderIds: list.map((o) => o.id), severity: 'medium', params: { phone, n: accounts.size }, fraud: true });
    }
  });
  return out;
}

// ---------------------------------------------------------------------------
// Formatos (sin depender de la zona horaria ni de Intl)
// ---------------------------------------------------------------------------

export function fmtMoney(n: number, locale: string): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(Math.round(n));
  const sep = locale === 'en' ? ',' : '.';
  const s = String(abs).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  return locale === 'en' ? `${sign}COP ${s}` : `${sign}$ ${s}`;
}

export function fmtNum(n: number, locale: string, decimals = 0): string {
  const fixed = Math.abs(n).toFixed(decimals);
  const [int, dec] = fixed.split('.');
  const sep = locale === 'en' ? ',' : '.';
  const s = int.replace(/\B(?=(\d{3})+(?!\d))/g, sep) + (dec ? (locale === 'en' ? '.' : ',') + dec : '');
  return n < 0 ? `-${s}` : s;
}

export function fmtKm(n: number, locale: string): string {
  const s = round1(n).toFixed(1);
  return `${locale === 'en' ? s : s.replace('.', ',')} km`;
}

/** Hora del día de la demo ("7:05 p. m." / "7:05 PM") desde segundos del día. */
export function fmtTime(sod: number, locale: string): string {
  const total = ((Math.floor(sod / 60) % 1440) + 1440) % 1440;
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const mm = String(m).padStart(2, '0');
  if (locale === 'en') return `${h12}:${mm} ${h24 < 12 ? 'AM' : 'PM'}`;
  return `${h12}:${mm} ${h24 < 12 ? 'a. m.' : 'p. m.'}`;
}

export function fmtHour(h: number, locale: string): string {
  return fmtTime(h * 3600, locale).replace(':00', '');
}

export function streetName(street: 'calle' | 'carrera', num: number): string {
  if (street === 'calle') return num < 0 ? `Calle ${-num} Sur` : `Calle ${num}`;
  return `Carrera ${num}`;
}

/** Días entre la fecha de la demo y una fecha AAAA-MM-DD (negativo = ya pasó). */
export function daysUntil(date: string, today = DEMO_DATE): number {
  const p = (s: string) => {
    const [y, m, d] = s.split('-').map((x) => parseInt(x, 10));
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((p(date) - p(today)) / 86400000);
}

export function docStatus(expires: string | undefined, today = DEMO_DATE): 'valid' | 'expiring' | 'expired' {
  if (!expires) return 'valid';
  const d = daysUntil(expires, today);
  if (d < 0) return 'expired';
  if (d <= 15) return 'expiring';
  return 'valid';
}

export function fmtDate(date: string, months: string[]): string {
  const [y, m, d] = date.split('-').map((x) => parseInt(x, 10));
  return `${d} ${months[m - 1] ?? m} ${y}`;
}

export function csvCell(v: string | number): string {
  const s = String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map(csvCell).join(',')).join('\n');
}

/** Posición simulada del repartidor en el mapa (los recorridos van acelerados). */
export function driverPosition(driver: Driver, orders: Order[], sedes: Sede[], now: number, speedup = 10): Place {
  const mine = orders.filter((o) => o.driverId === driver.id && o.driverStatus === 'accepted' && (o.stage === 'preparing' || o.stage === 'ready' || o.stage === 'pickedUp'));
  const riding = mine.find((o) => o.stage === 'pickedUp');
  if (riding) {
    const from = sedes.find((s) => s.id === riding.sedeId)!.place;
    const secs = (travelMin(km(from, riding.customer.place), driver.vehicle) * 60) / speedup;
    return pointAlong(from, riding.customer.place, Math.min(0.95, (now - (riding.t.pickedUp ?? now)) / secs));
  }
  const heading = mine[0];
  if (heading) {
    const to = sedes.find((s) => s.id === heading.sedeId)!.place;
    const secs = Math.max(1, (travelMin(km(driver.place, to), driver.vehicle) * 60) / speedup);
    return pointAlong(driver.place, to, Math.min(1, (now - (heading.t.assigned ?? now)) / secs));
  }
  return driver.place;
}
