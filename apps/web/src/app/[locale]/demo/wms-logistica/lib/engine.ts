/**
 * Lógica de la demo (funciones puras): clasificación ABC, ubicación sugerida
 * por reglas, asignación FEFO, recorridos de alistamiento, cotización de
 * transportadoras, ruteo de flota propia, indicadores y prefactura 3PL.
 * Todo se calcula con los datos de ejemplo que ves en pantalla.
 */
import {
  AISLE_M,
  BIN_BY_ID,
  CARRIERS,
  CITY_BY_ID,
  MODULE_M,
  QUARANTINE_BINS,
  STORAGE_BINS,
  WAREHOUSE_BY_ID,
  WAREHOUSE_REGION,
  type CarrierInfo,
  type ShipZone,
} from './catalog';
import { dateOf, dayOfMonth, diffDays, type ISODate, type ISODateTime } from './dates';
import type {
  AbcClass,
  Allocation,
  CarrierId,
  ClientId,
  Lot,
  Order,
  PickStrategy,
  Product,
  PutawayRule,
  Shipment,
  WarehouseId,
  WmsState,
} from './types';

/* ---------------- Productos y clases ABC ---------------- */

export function productMap(products: Product[]): Record<string, Product> {
  return Object.fromEntries(products.map((p) => [p.sku, p]));
}

/** Clasificación ABC por valor despachado (demanda diaria × costo unitario): acumulado hasta 75 % = A, hasta 95 % = B, el resto C. */
export function abcClasses(products: Product[]): Record<string, AbcClass> {
  const rows = products
    .map((p) => ({ sku: p.sku, value: p.dailyDemand * p.unitCost }))
    .sort((a, b) => b.value - a.value || a.sku.localeCompare(b.sku));
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;
  let acc = 0;
  const out: Record<string, AbcClass> = {};
  for (const r of rows) {
    acc += r.value;
    const share = acc / total;
    out[r.sku] = r.value <= 0 ? 'C' : share <= 0.75 + 1e-9 || acc === r.value ? 'A' : share <= 0.95 + 1e-9 ? 'B' : 'C';
  }
  return out;
}

export function abcSummary(products: Product[]) {
  const cls = abcClasses(products);
  const total = products.reduce((s, p) => s + p.dailyDemand * p.unitCost, 0) || 1;
  const sum = { A: { skus: 0, value: 0 }, B: { skus: 0, value: 0 }, C: { skus: 0, value: 0 } } as Record<AbcClass, { skus: number; value: number }>;
  for (const p of products) {
    const c = cls[p.sku];
    sum[c].skus += 1;
    sum[c].value += (p.dailyDemand * p.unitCost) / total;
  }
  return sum;
}

export const COUNT_FREQUENCY_DAYS: Record<AbcClass, number> = { A: 7, B: 30, C: 90 };

/* ---------------- Ubicaciones ---------------- */

export function lotsIn(state: WmsState, wh: WarehouseId): Lot[] {
  return state.lots.filter((l) => l.wh === wh && l.qty > 0);
}

export function binContents(state: WmsState, wh: WarehouseId): Record<string, Lot[]> {
  const out: Record<string, Lot[]> = {};
  for (const l of lotsIn(state, wh)) (out[l.bin] ||= []).push(l);
  return out;
}

export function availableQty(l: Lot): number {
  return l.status === 'available' ? Math.max(0, l.qty - l.reserved) : 0;
}

export interface Suggestion {
  bin: string;
  rule: PutawayRule;
}

/**
 * Ubicación sugerida por reglas simples y explicables (no IA):
 * averías → cuarentena; mismo SKU ya ubicado → junto a sus lotes;
 * voluminoso → zona C; clase A → zona A (cerca del despacho); resto → zona B.
 */
export function suggestBin(
  state: WmsState,
  wh: WarehouseId,
  sku: string,
  opts: { quarantine?: boolean; exclude?: Set<string> } = {},
): Suggestion {
  const contents = binContents(state, wh);
  const reserved = new Set(opts.exclude ?? []);
  for (const t of state.putaway) if (t.wh === wh && t.status === 'pending') reserved.add(t.suggested);
  if (opts.quarantine) {
    const q = [...QUARANTINE_BINS].sort((a, b) => (contents[a.id]?.length ?? 0) - (contents[b.id]?.length ?? 0))[0];
    return { bin: q.id, rule: 'damaged' };
  }
  const same = Object.entries(contents).find(
    ([bin, lots]) => BIN_BY_ID[bin]?.zone !== 'Q' && lots.every((l) => l.sku === sku && l.status === 'available'),
  );
  if (same) return { bin: same[0], rule: 'sameSku' };
  const products = productMap(state.products);
  const product = products[sku];
  const cls = abcClasses(state.products)[sku] ?? 'C';
  const free = STORAGE_BINS.filter((b) => !contents[b.id] && !reserved.has(b.id));
  const pick = (zone: 'A' | 'B' | 'C') => free.find((b) => b.zone === zone);
  if (product?.bulky) {
    const b = pick('C');
    if (b) return { bin: b.id, rule: 'bulky' };
  } else if (cls === 'A') {
    const b = pick('A');
    if (b) return { bin: b.id, rule: 'highRotation' };
  } else {
    const b = pick('B');
    if (b) return { bin: b.id, rule: 'reserve' };
  }
  const any = free[0];
  return { bin: any ? any.id : STORAGE_BINS[0].id, rule: 'overflow' };
}

/** Ubicaciones vacías (para cambiar la sugerida a mano). */
export function emptyBins(state: WmsState, wh: WarehouseId): string[] {
  const contents = binContents(state, wh);
  const reserved = new Set(state.putaway.filter((t) => t.wh === wh && t.status === 'pending').map((t) => t.suggested));
  return STORAGE_BINS.filter((b) => !contents[b.id] && !reserved.has(b.id)).map((b) => b.id);
}

/* ---------------- Asignación FEFO ---------------- */

/** Primero vence, primero sale; sin vencimiento, el lote más antiguo primero. */
export function fefoSort(a: Lot, b: Lot): number {
  if (a.expiry && b.expiry && a.expiry !== b.expiry) return a.expiry < b.expiry ? -1 : 1;
  if (a.expiry && !b.expiry) return -1;
  if (!a.expiry && b.expiry) return 1;
  return a.lot.localeCompare(b.lot) || a.id.localeCompare(b.id);
}

export function allocateFefo(
  lots: Lot[],
  wh: WarehouseId,
  sku: string,
  qty: number,
  today: ISODate,
  excludeLots: Set<string> = new Set(),
): { alloc: Allocation[]; missing: number } {
  const candidates = lots
    .filter((l) => l.wh === wh && l.sku === sku && !excludeLots.has(l.id) && availableQty(l) > 0 && (!l.expiry || l.expiry >= today))
    .sort(fefoSort);
  const alloc: Allocation[] = [];
  let left = qty;
  for (const l of candidates) {
    if (left <= 0) break;
    const take = Math.min(left, availableQty(l));
    alloc.push({ lotId: l.id, bin: l.bin, lot: l.lot, qty: take, picked: 0, short: 0 });
    left -= take;
  }
  return { alloc, missing: left };
}

export function stockBySku(state: WmsState, wh: WarehouseId, sku: string, today: ISODate) {
  let available = 0;
  let reserved = 0;
  let quarantine = 0;
  let expired = 0;
  for (const l of lotsIn(state, wh)) {
    if (l.sku !== sku) continue;
    if (l.status === 'quarantine') quarantine += l.qty;
    else if (l.expiry && l.expiry < today) expired += l.qty;
    else {
      available += Math.max(0, l.qty - l.reserved);
      reserved += l.reserved;
    }
  }
  return { available, reserved, quarantine, expired };
}

/* ---------------- Recorridos de alistamiento ---------------- */

function binXY(binId: string) {
  const b = BIN_BY_ID[binId];
  return { row: b?.row ?? 0, x: (b?.module ?? 0) * MODULE_M, y: (b?.row ?? 0) * AISLE_M };
}

/** Metros caminados: muelle → ubicaciones → muelle, con un pasillo transversal junto al muelle. */
export function walkMeters(bins: string[]): number {
  if (!bins.length) return 0;
  let d = 0;
  let prev: ReturnType<typeof binXY> | null = null;
  for (const id of bins) {
    const cur = binXY(id);
    if (!prev) d += cur.y + cur.x;
    else if (prev.row === cur.row) d += Math.abs(prev.x - cur.x);
    else d += prev.x + Math.abs(prev.y - cur.y) + cur.x;
    prev = cur;
  }
  if (prev) d += prev.x + prev.y;
  return Math.round(d * 10) / 10;
}

export function routeOrder(bins: string[]): string[] {
  return [...bins].sort((a, b) => {
    const pa = BIN_BY_ID[a];
    const pb = BIN_BY_ID[b];
    return (pa?.row ?? 0) - (pb?.row ?? 0) || (pa?.module ?? 0) - (pb?.module ?? 0);
  });
}

export interface PickItem {
  order: string;
  line: number;
  a: number;
  qty: number;
}

export interface PickTask {
  key: string;
  bin: string;
  sku: string;
  lot: string;
  lotId: string;
  qty: number;
  items: PickItem[];
  trip: number;
  tripLabel: string;
  tote?: number;
  done: boolean;
  short: boolean;
}

export interface PickPlan {
  tasks: PickTask[];
  trips: { label: string; bins: string[]; meters: number }[];
  meters: number;
  naiveMeters: number;
  minutes: number;
  stops: number;
  parallel: boolean;
}

export const WALK_M_PER_MIN = 50;
export const SECONDS_PER_PICK = 20;
export const CART_TOTES = 6;

/**
 * Arma las tareas de una ola según la estrategia:
 * - wave: pedido por pedido dentro de la ola (un recorrido por pedido);
 * - batch: un solo recorrido con las cantidades sumadas por ubicación y lote;
 * - zone: un alistador por zona, en paralelo;
 * - cluster: un carro con hasta 6 canastas (un pedido por canasta).
 * La línea base ("sin optimizar") es un recorrido por pedido en el orden en que llegaron las líneas.
 */
export function pickPlan(orders: Order[], strategy: PickStrategy): PickPlan {
  type Raw = PickItem & { bin: string; sku: string; lot: string; lotId: string; done: boolean; short: boolean; orderIdx: number };
  const raw: Raw[] = [];
  orders.forEach((o, orderIdx) =>
    o.lines.forEach((ln, li) =>
      ln.alloc.forEach((al, ai) =>
        raw.push({
          order: o.id,
          line: li,
          a: ai,
          qty: al.qty,
          bin: al.bin,
          sku: ln.sku,
          lot: al.lot,
          lotId: al.lotId,
          done: al.picked + al.short >= al.qty,
          short: al.short > 0,
          orderIdx,
        }),
      ),
    ),
  );

  const naiveMeters = orders.reduce((s, o) => s + walkMeters(o.lines.flatMap((l) => l.alloc.map((a) => a.bin))), 0);

  const groups = new Map<string, { label: string; tote?: (r: Raw) => number; items: Raw[] }>();
  const groupKey = (r: Raw): [string, string] => {
    switch (strategy) {
      case 'wave':
        return [`o${String(r.orderIdx).padStart(3, '0')}`, r.order];
      case 'batch':
        return ['all', ''];
      case 'zone':
        return [`z${BIN_BY_ID[r.bin]?.zone ?? 'A'}`, BIN_BY_ID[r.bin]?.zone ?? 'A'];
      case 'cluster':
      default:
        return [`c${Math.floor(r.orderIdx / CART_TOTES)}`, String(Math.floor(r.orderIdx / CART_TOTES) + 1)];
    }
  };
  for (const r of raw) {
    const [k, label] = groupKey(r);
    if (!groups.has(k)) groups.set(k, { label, items: [] });
    groups.get(k)!.items.push(r);
  }

  const tasks: PickTask[] = [];
  const trips: PickPlan['trips'] = [];
  [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([, g], tripIdx) => {
      const bins = routeOrder([...new Set(g.items.map((i) => i.bin))]);
      trips.push({ label: g.label, bins, meters: walkMeters(bins) });
      const sorted = [...g.items].sort((x, y) => bins.indexOf(x.bin) - bins.indexOf(y.bin) || x.orderIdx - y.orderIdx);
      if (strategy === 'batch') {
        const merged = new Map<string, PickTask>();
        for (const r of sorted) {
          const key = `${r.lotId}`;
          const cur = merged.get(key);
          if (cur) {
            cur.qty += r.qty;
            cur.items.push({ order: r.order, line: r.line, a: r.a, qty: r.qty });
            cur.done = cur.done && r.done;
            cur.short = cur.short || r.short;
          } else {
            merged.set(key, {
              key: `b-${key}`,
              bin: r.bin,
              sku: r.sku,
              lot: r.lot,
              lotId: r.lotId,
              qty: r.qty,
              items: [{ order: r.order, line: r.line, a: r.a, qty: r.qty }],
              trip: tripIdx,
              tripLabel: g.label,
              done: r.done,
              short: r.short,
            });
          }
        }
        tasks.push(...merged.values());
      } else {
        for (const r of sorted) {
          tasks.push({
            key: `${strategy}-${r.order}-${r.line}-${r.a}`,
            bin: r.bin,
            sku: r.sku,
            lot: r.lot,
            lotId: r.lotId,
            qty: r.qty,
            items: [{ order: r.order, line: r.line, a: r.a, qty: r.qty }],
            trip: tripIdx,
            tripLabel: g.label,
            tote: strategy === 'cluster' ? (r.orderIdx % CART_TOTES) + 1 : undefined,
            done: r.done,
            short: r.short,
          });
        }
      }
    });

  const meters = Math.round(trips.reduce((s, t) => s + t.meters, 0) * 10) / 10;
  const stops = trips.reduce((s, t) => s + t.bins.length, 0);
  const parallel = strategy === 'zone';
  const walkMin = parallel ? Math.max(0, ...trips.map((t) => t.meters)) / WALK_M_PER_MIN : meters / WALK_M_PER_MIN;
  const pickMin = parallel
    ? Math.max(0, ...trips.map((t) => tasks.filter((x) => x.tripLabel === t.label).length)) * (SECONDS_PER_PICK / 60)
    : tasks.length * (SECONDS_PER_PICK / 60);
  return { tasks, trips, meters, naiveMeters: Math.round(naiveMeters * 10) / 10, minutes: Math.round((walkMin + pickMin) * 10) / 10, stops, parallel };
}

/* ---------------- Pedidos: peso, caja y cotización ---------------- */

export function pickedQty(o: Order, lineIdx: number): number {
  return o.lines[lineIdx].alloc.reduce((s, a) => s + a.picked, 0);
}

export function orderUnits(o: Order, picked = false): number {
  return o.lines.reduce((s, l, i) => s + (picked ? pickedQty(o, i) : l.qty), 0);
}

export const BOX_TARE: Record<'S' | 'M' | 'L' | 'P', number> = { S: 0.2, M: 0.4, L: 0.7, P: 18 };

export function boxFor(netKg: number): 'S' | 'M' | 'L' | 'P' {
  if (netKg <= 2) return 'S';
  if (netKg <= 8) return 'M';
  if (netKg <= 25) return 'L';
  return 'P';
}

export function orderNetKg(o: Order, products: Record<string, Product>, picked = true): number {
  const kg = o.lines.reduce((s, l, i) => s + (products[l.sku]?.weightKg ?? 0.5) * (picked ? pickedQty(o, i) : l.qty), 0);
  return Math.round(kg * 100) / 100;
}

export function shipZone(wh: WarehouseId, cityId: string): ShipZone {
  const city = CITY_BY_ID[cityId];
  if (!city) return 'national';
  if (city.region === 'special') return 'special';
  if (city.metro && city.metro === WAREHOUSE_BY_ID[wh].metro) return 'local';
  if (city.region === WAREHOUSE_REGION[wh]) return 'regional';
  return 'national';
}

export interface Quote {
  carrier: CarrierInfo;
  price: number;
  days: number;
  ok: boolean;
  reason?: 'noCoverage' | 'overweight';
}

export function quote(carrier: CarrierInfo, wh: WarehouseId, cityId: string, kg: number): Quote {
  const zone = shipZone(wh, cityId);
  const tariff = carrier.zones[zone];
  if (!tariff) return { carrier, price: 0, days: 0, ok: false, reason: 'noCoverage' };
  if (kg > carrier.maxKg) return { carrier, price: 0, days: tariff[1], ok: false, reason: 'overweight' };
  const extra = Math.max(0, Math.ceil(kg) - carrier.includedKg);
  return { carrier, price: tariff[0] + extra * carrier.perKg, days: tariff[1], ok: true };
}

/** Cotizaciones ordenadas: primero las disponibles, de la más económica a la más cara. */
export function quotes(wh: WarehouseId, cityId: string, kg: number): Quote[] {
  return CARRIERS.map((c) => quote(c, wh, cityId, kg)).sort(
    (a, b) => Number(b.ok) - Number(a.ok) || a.price - b.price || a.days - b.days,
  );
}

export function bestQuotes(list: Quote[]): { cheapest?: CarrierId; fastest?: CarrierId } {
  const ok = list.filter((q) => q.ok);
  if (!ok.length) return {};
  const cheapest = [...ok].sort((a, b) => a.price - b.price || a.days - b.days)[0].carrier.id;
  const fastest = [...ok].sort((a, b) => a.days - b.days || a.price - b.price)[0].carrier.id;
  return { cheapest, fastest };
}

/* ---------------- Ruteo de la flota propia ---------------- */

export const ROAD_FACTOR = 1.3;
export const SPEED_KMH = 25;
export const SERVICE_MIN = 6;

export interface RouteStop {
  order: string;
  x: number;
  y: number;
  from: number;
  to: number;
  kg: number;
}

export interface VehicleRoute {
  vehicle: string;
  capacityKg: number;
  stops: { order: string; arrive: number; late: boolean }[];
  km: number;
  minutes: number;
  kg: number;
  overCapacity: boolean;
}

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y) * ROAD_FACTOR;

export function evalRoutes(
  plan: string[][],
  stops: Record<string, RouteStop>,
  vehicles: { id: string; capacityKg: number }[],
  startMin: number,
): { routes: VehicleRoute[]; km: number; late: number; minutes: number } {
  const routes = vehicles.map((v, i) => {
    let pos = { x: 0, y: 0 };
    let t = startMin;
    let km = 0;
    let kg = 0;
    const out: VehicleRoute['stops'] = [];
    for (const id of plan[i] ?? []) {
      const s = stops[id];
      if (!s) continue;
      const leg = dist(pos, s);
      km += leg;
      t += (leg / SPEED_KMH) * 60;
      if (t < s.from) t = s.from;
      out.push({ order: id, arrive: Math.round(t), late: t > s.to });
      t += SERVICE_MIN;
      kg += s.kg;
      pos = s;
    }
    const back = dist(pos, { x: 0, y: 0 });
    km += back;
    t += (back / SPEED_KMH) * 60;
    return {
      vehicle: v.id,
      capacityKg: v.capacityKg,
      stops: out,
      km: Math.round(km * 10) / 10,
      minutes: Math.round(t - startMin),
      kg: Math.round(kg * 10) / 10,
      overCapacity: kg > v.capacityKg,
    };
  });
  return {
    routes,
    km: Math.round(routes.reduce((s, r) => s + r.km, 0) * 10) / 10,
    late: routes.reduce((s, r) => s + r.stops.filter((x) => x.late).length, 0),
    minutes: routes.reduce((s, r) => s + r.minutes, 0),
  };
}

function routeCost(e: ReturnType<typeof evalRoutes>): number {
  const over = e.routes.reduce((s, r) => s + (r.overCapacity ? 1 : 0), 0);
  return e.km + e.late * 25 + over * 1000;
}

function twoOpt(seq: string[], score: (s: string[]) => number): string[] {
  let best = seq;
  let bestScore = score(best);
  let improved = true;
  let guard = 0;
  while (improved && guard < 50) {
    improved = false;
    guard += 1;
    for (let i = 0; i < best.length - 1; i++) {
      for (let k = i + 1; k < best.length; k++) {
        const cand = [...best.slice(0, i), ...best.slice(i, k + 1).reverse(), ...best.slice(k + 1)];
        const sc = score(cand);
        if (sc + 1e-9 < bestScore) {
          best = cand;
          bestScore = sc;
          improved = true;
        }
      }
    }
  }
  return best;
}

/**
 * Heurística simple calculada en el navegador: barrido angular para repartir
 * paradas entre vehículos (respetando capacidad), vecino más cercano y mejora
 * 2-opt por vehículo. Si no mejora el plan actual, se conserva el actual.
 */
export function optimizeRoutes(
  current: string[][],
  stops: Record<string, RouteStop>,
  vehicles: { id: string; capacityKg: number }[],
  startMin: number,
): { plan: string[][]; improved: boolean } {
  const ids = current.flat().filter((id) => stops[id]);
  const sorted = [...ids].sort((a, b) => Math.atan2(stops[a].y, stops[a].x) - Math.atan2(stops[b].y, stops[b].x));
  const per = Math.ceil(ids.length / Math.max(1, vehicles.length));
  const buckets: string[][] = vehicles.map(() => []);
  const loads = vehicles.map(() => 0);
  let j = 0;
  for (const id of sorted) {
    const kg = stops[id].kg;
    if (buckets[j].length >= per && j < vehicles.length - 1) j += 1;
    let k = j;
    for (let t = 0; t < vehicles.length; t++) {
      const c = (j + t) % vehicles.length;
      if (loads[c] + kg <= vehicles[c].capacityKg) {
        k = c;
        break;
      }
    }
    buckets[k].push(id);
    loads[k] += kg;
  }
  const plan = buckets.map((bucket, i) => {
    // vecino más cercano desde la bodega
    const left = [...bucket];
    const seq: string[] = [];
    let pos = { x: 0, y: 0 };
    while (left.length) {
      left.sort((a, b) => dist(pos, stops[a]) - dist(pos, stops[b]));
      const next = left.shift()!;
      seq.push(next);
      pos = stops[next];
    }
    const score = (s: string[]) => {
      const p = buckets.map(() => [] as string[]);
      p[i] = s;
      const e = evalRoutes(p, stops, vehicles, startMin);
      return e.routes[i].km + e.routes[i].stops.filter((x) => x.late).length * 25;
    };
    return twoOpt(seq, score);
  });
  const before = routeCost(evalRoutes(current, stops, vehicles, startMin));
  const after = routeCost(evalRoutes(plan, stops, vehicles, startMin));
  if (after + 1e-9 < before) return { plan, improved: true };
  return { plan: current, improved: false };
}

/* ---------------- Indicadores ---------------- */

export function isToday(dt: ISODateTime | undefined, today: ISODate) {
  return !!dt && dateOf(dt) === today;
}

export function onTime(o: Order): boolean {
  return !!o.shippedAt && o.shippedAt <= o.cutoff;
}

export function kpis(state: WmsState, wh: WarehouseId, today: ISODate) {
  const orders = state.orders.filter((o) => o.wh === wh);
  const shippedToday = orders.filter((o) => isToday(o.shippedAt, today));
  const pending = orders.filter((o) => ['new', 'released', 'picked'].includes(o.status));
  const dueToday = pending.filter((o) => dateOf(o.cutoff) <= today);
  const lots = lotsIn(state, wh);
  const usedBins = new Set(lots.filter((l) => BIN_BY_ID[l.bin]?.zone !== 'Q').map((l) => l.bin));
  const stats = state.countStats[wh];
  const expiring = lots.filter((l) => l.expiry && l.expiry >= today && diffDays(today, l.expiry) <= 30);
  const expired = lots.filter((l) => l.expiry && l.expiry < today);
  return {
    ordersToday: orders.filter((o) => isToday(o.createdAt, today)).length,
    toRelease: orders.filter((o) => o.status === 'new' && !o.crossDockPo).length,
    inPicking: orders.filter((o) => o.status === 'released').length,
    toPack: orders.filter((o) => o.status === 'picked').length,
    shippedToday: shippedToday.length,
    onTimePct: shippedToday.length ? (shippedToday.filter(onTime).length / shippedToday.length) * 100 : 100,
    dueToday: dueToday.length,
    accuracy: stats.total ? (stats.match / stats.total) * 100 : 100,
    counted: stats.total,
    occupancy: (usedBins.size / STORAGE_BINS.length) * 100,
    usedBins: usedBins.size,
    posOpen: state.pos.filter((p) => p.wh === wh && (p.status === 'expected' || p.status === 'receiving')).length,
    putawayPending: state.putaway.filter((t) => t.wh === wh && t.status === 'pending').length,
    expiring: expiring.length,
    expired: expired.length,
    rmasOpen: state.rmas.filter((r) => r.wh === wh && (r.status === 'requested' || r.status === 'approved')).length,
    countsDue: state.counts.filter((c) => c.wh === wh && c.status !== 'done' && c.due <= today).length,
    inTransit: state.shipments.filter((s) => s.wh === wh && s.status !== 'delivered').length,
  };
}

/* ---------------- Prefactura 3PL ---------------- */

export interface BillingLine {
  concept: 'storage' | 'line' | 'order' | 'parcel' | 'rma';
  qty: number;
  unit: number;
  total: number;
}

export function clientOf(state: WmsState, sku: string): ClientId | undefined {
  return state.products.find((p) => p.sku === sku)?.client;
}

/** Actividad de hoy (lo que pasa en la demo) para un cliente del 3PL. */
export function todayActivity(state: WmsState, client: ClientId, today: ISODate) {
  const positions = new Set(
    state.lots.filter((l) => l.qty > 0 && clientOf(state, l.sku) === client).map((l) => `${l.wh}:${l.bin}`),
  ).size;
  const orders = state.orders.filter((o) => o.client === client);
  const lines = orders
    .filter((o) => isToday(o.pickedAt, today))
    .reduce((s, o) => s + o.lines.filter((_, i) => pickedQty(o, i) > 0).length, 0);
  const shipped = orders.filter((o) => isToday(o.shippedAt, today)).length;
  const parcels = state.shipments.filter((s) => orders.some((o) => o.id === s.order) && isToday(s.events[0]?.at, today)).length;
  const rmas = state.rmas.filter(
    (r) => r.client === client && (r.status === 'received' || r.status === 'closed') && r.date.slice(0, 7) === today.slice(0, 7),
  ).length;
  return { positions, lines, orders: shipped, parcels, rmas };
}

export function billing(state: WmsState, client: ClientId, period: 'prev' | 'mtd', today: ISODate) {
  const h = state.billing[client];
  const t = state.tariffs[client];
  let q = { ...h[period] };
  if (period === 'mtd') {
    const act = todayActivity(state, client, today);
    q = {
      posDays: q.posDays + act.positions,
      lines: q.lines + act.lines,
      orders: q.orders + act.orders,
      parcels: q.parcels + act.parcels,
      rmas: q.rmas + act.rmas,
    };
  }
  const lines: BillingLine[] = [
    { concept: 'storage', qty: q.posDays, unit: t.storage, total: q.posDays * t.storage },
    { concept: 'line', qty: q.lines, unit: t.line, total: q.lines * t.line },
    { concept: 'order', qty: q.orders, unit: t.order, total: q.orders * t.order },
    { concept: 'parcel', qty: q.parcels, unit: t.parcel, total: q.parcels * t.parcel },
    { concept: 'rma', qty: q.rmas, unit: t.rma, total: q.rmas * t.rma },
  ];
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  return { lines, subtotal, days: period === 'mtd' ? dayOfMonth(today) : 0 };
}

/* ---------------- CSV ---------------- */

export function toCsv(rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v ?? '');
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + rows.map((r) => r.map(esc).join(';')).join('\r\n');
}

export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, '');
  const firstLine = clean.split(/\r?\n/)[0] ?? '';
  const sep = (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      row.push(cell.trim());
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      row.push(cell.trim());
      if (row.some((c) => c !== '')) rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  row.push(cell.trim());
  if (row.some((c) => c !== '')) rows.push(row);
  return rows;
}

export type ImportError = { line: number; reason: 'missingFields' | 'duplicate' | 'client' | 'number' | 'barcode' };

const CLIENT_ALIASES: Record<string, ClientId> = { lir: 'lir', lirio: 'lir', cth: 'cth', 'casa tejo': 'cth', nut: 'nut', nutrilia: 'nut' };

/** Importa productos desde CSV: sku; nombre; cliente; codigo_barras; costo_unitario; peso_kg; vence (si/no). */
export function importProducts(text: string, existing: Product[]): { added: Product[]; errors: ImportError[] } {
  const rows = parseCsv(text);
  const added: Product[] = [];
  const errors: ImportError[] = [];
  const skus = new Set(existing.map((p) => p.sku.toUpperCase()));
  const header = (rows[0] ?? []).map((h) => h.toLowerCase());
  const start = header.includes('sku') ? 1 : 0;
  for (let i = start; i < rows.length; i++) {
    const [skuRaw, name, clientRaw, barcodeRaw, costRaw, weightRaw, expiresRaw] = rows[i];
    const line = i + 1;
    if (!skuRaw || !name || !clientRaw) {
      errors.push({ line, reason: 'missingFields' });
      continue;
    }
    const sku = skuRaw.toUpperCase().replace(/\s+/g, '-').slice(0, 24);
    if (skus.has(sku)) {
      errors.push({ line, reason: 'duplicate' });
      continue;
    }
    const client = CLIENT_ALIASES[clientRaw.trim().toLowerCase()] ?? CLIENT_ALIASES[clientRaw.trim().toLowerCase().split(' ')[0]];
    if (!client) {
      errors.push({ line, reason: 'client' });
      continue;
    }
    const num = (s: string | undefined, def: number) => {
      if (!s) return def;
      const n = Number(s.replace(/\./g, '').replace(',', '.'));
      return Number.isFinite(n) && n >= 0 ? n : NaN;
    };
    const unitCost = num(costRaw, 0);
    const weightKg = weightRaw ? Number(weightRaw.replace(',', '.')) : 0.5;
    if (Number.isNaN(unitCost) || !Number.isFinite(weightKg) || weightKg <= 0) {
      errors.push({ line, reason: 'number' });
      continue;
    }
    let barcode = (barcodeRaw ?? '').replace(/\D/g, '');
    if (barcode && barcode.length !== 13 && barcode.length !== 12 && barcode.length !== 8) {
      errors.push({ line, reason: 'barcode' });
      continue;
    }
    if (!barcode) barcode = `29${String(existing.length + added.length + 1).padStart(10, '0')}`;
    skus.add(sku);
    added.push({
      sku,
      name: name.slice(0, 80),
      client,
      barcode,
      unitCost,
      weightKg,
      bulky: weightKg > 5,
      expires: /^(s|si|sí|y|yes|1|true)$/i.test((expiresRaw ?? '').trim()),
      dailyDemand: 0,
      imported: true,
    });
  }
  return { added, errors };
}

export function shipmentOf(state: WmsState, order: Order): Shipment | undefined {
  return order.shipment ? state.shipments.find((s) => s.id === order.shipment) : undefined;
}
