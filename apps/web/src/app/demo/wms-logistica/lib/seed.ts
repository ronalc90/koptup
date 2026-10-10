/**
 * Operación de ejemplo generada de forma determinista (misma semilla siempre)
 * con fechas relativas al momento en que abres la demo: lotes con vencimientos
 * creíbles, órdenes de compra por recibir, pedidos del día, envíos, conteos,
 * devoluciones e historial para la prefactura 3PL.
 */
import {
  BASE_PRODUCTS,
  CITIES,
  CUSTOMERS,
  LOCALITIES,
  PICKERS,
  STORAGE_BINS,
  STREETS,
  WAREHOUSES,
  WAREHOUSE_BY_ID,
  WHOLESALERS,
  DEFAULT_TARIFFS,
  CARRIER_BY_ID,
} from './catalog';
import {
  addDays,
  addMinutes,
  backOp,
  clampOp,
  dateOf,
  dayOfMonth,
  daysInMonth,
  fwdOp,
  hhmm,
  minutesBetween,
  minutesOf,
  opClock,
  previousMonth,
  type ISODate,
  type ISODateTime,
} from './dates';
import { abcClasses, allocateFefo, boxFor, orderNetKg, productMap, quotes, shipZone, suggestBin, BOX_TARE } from './engine';
import type {
  AbcClass,
  Channel,
  ClientId,
  CountTask,
  CrossDockTask,
  LogEntry,
  Lot,
  Movement,
  Order,
  OrderLine,
  PurchaseOrder,
  PutawayTask,
  Rma,
  Shipment,
  ShipStatus,
  WarehouseId,
  WmsState,
} from './types';

export const STATE_VERSION = 5;

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const CUTOFF_BY_CHANNEL: Record<Channel, string> = { web: '15:00', meli: '14:00', wholesale: '17:00' };

export function cutoffFor(createdAt: ISODateTime, channel: Channel): ISODateTime {
  const cut = CUTOFF_BY_CHANNEL[channel];
  const [h, m] = cut.split(':').map(Number);
  const date = minutesOf(createdAt) < h * 60 + m ? dateOf(createdAt) : addDays(dateOf(createdAt), 1);
  return `${date}T${cut}`;
}

/** Ventanas de entrega en minutos desde la salida de la ruta. */
const WINDOWS: [number, number][] = [
  [0, 240],
  [60, 300],
  [180, 480],
  [0, 540],
  [30, 270],
];

/** Salida de la flota propia: la próxima media hora después del reloj de operación (entre 7:00 a. m. y 6:00 p. m.). */
export function routeStartFor(now: ISODateTime): number {
  const m = minutesOf(opClock(now)) + 20;
  return Math.min(18 * 60, Math.max(7 * 60, Math.ceil(m / 30) * 30));
}

const OP_CLOSE_MIN = 22 * 60;

/** Redondea una fecha-hora a múltiplos de 10 minutos (hacia abajo). */
const round10 = (dt: ISODateTime): ISODateTime => addMinutes(dt, -(minutesOf(dt) % 10));

export function buildState(now: ISODateTime): WmsState {
  const today = dateOf(now);
  // Reloj de la operación: lo que ya pasó en la bodega ocurre dentro del horario
  // (6:00 a. m. a 10:00 p. m.) y nunca después de la hora real.
  const op = opClock(now);
  const ago = (min: number) => backOp(op, min);
  const routeStart = routeStartFor(now);
  const rnd = mulberry32(20261008);
  const ri = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
  let seq = 100;
  const nid = (prefix: string) => `${prefix}${++seq}`;
  const at = (date: ISODate, min: number): ISODateTime => addMinutes(`${date}T00:00`, min);

  const products = BASE_PRODUCTS.map((p) => ({ ...p, kit: p.kit?.map((k) => ({ ...k })) }));
  const pm = productMap(products);
  const cls = abcClasses(products);

  const lots: Lot[] = [];
  const moves: Movement[] = [];
  const log: LogEntry[] = [];
  const addMove = (m: Omit<Movement, 'id'>) => moves.push({ ...m, id: nid('M') });

  /* ---------- Lotes ---------- */
  for (const w of WAREHOUSES) {
    const used = new Set<string>();
    const take = (zone: 'A' | 'B' | 'C', spread: number) => {
      let list = STORAGE_BINS.filter((b) => b.zone === zone && !used.has(b.id));
      if (!list.length) list = STORAGE_BINS.filter((b) => !used.has(b.id));
      const b = list[Math.floor(rnd() * Math.min(list.length, spread))];
      used.add(b.id);
      return b.id;
    };
    const skus = products.filter((p) => w.clients.includes(p.client) && (!p.kit || w.id === 'fun'));
    for (const p of skus) {
      const n = Math.max(2, Math.min(7, Math.round(p.dailyDemand / 12) + 2));
      for (let i = 0; i < n; i++) {
        const zone = p.bulky ? 'C' : i === 0 && cls[p.sku] === 'A' ? 'A' : 'B';
        const bin = take(zone, i === 0 ? 5 : 12);
        const mfg = addDays(today, -ri(25, 320));
        const shelf = p.client === 'nut' ? 540 : 730;
        const qty = Math.max(6, Math.round((p.dailyDemand * ri(2, 5)) / 6) * 6);
        const lot: Lot = {
          id: nid('LT'),
          wh: w.id,
          sku: p.sku,
          lot: `L${mfg.slice(2, 4)}${mfg.slice(5, 7)}-${ri(100, 999)}`,
          expiry: p.expires ? addDays(mfg, shelf) : null,
          bin,
          qty,
          reserved: 0,
          status: 'available',
        };
        lots.push(lot);
        addMove({ at: at(addDays(today, -ri(2, 20)), ri(420, 1020)), wh: w.id, sku: p.sku, lot: lot.lot, bin, qty, type: 'putaway', ref: `OC-${ri(23800, 24800)}` });
      }
    }
    // Lotes especiales: por vencer, vencido en cuarentena y avería.
    const special = (sku: string, days: number, qty: number, zone: 'A' | 'B', status: Lot['status'] = 'available', bin?: string) => {
      const b = bin ?? take(zone, 6);
      const expiry = days === 9999 ? null : addDays(today, days);
      const lot: Lot = { id: nid('LT'), wh: w.id, sku, lot: `L${today.slice(2, 4)}0${ri(1, 4)}-${ri(100, 999)}`, expiry, bin: b, qty, reserved: 0, status };
      lots.push(lot);
      addMove({ at: at(addDays(today, -ri(30, 60)), ri(420, 900)), wh: w.id, sku, lot: lot.lot, bin: b, qty, type: 'putaway', ref: `OC-${ri(23000, 23700)}` });
      if (status === 'quarantine') addMove({ at: at(addDays(today, -ri(1, 3)), ri(420, 900)), wh: w.id, sku, lot: lot.lot, bin: b, qty, type: 'quarantine', ref: 'Q' });
    };
    if (w.id === 'fun') {
      special('LIR-PRO120', 21, 18, 'A');
      special('NUT-VTC60', 12, 24, 'B');
      special('NUT-COL300', -3, 14, 'B', 'quarantine', 'Q-01-01');
      special('CTH-VAJ16', 9999, 3, 'B', 'quarantine', 'Q-01-02');
    } else if (w.id === 'ita') {
      special('LIR-CRE250', 25, 30, 'B');
    } else {
      special('NUT-OMG90', 18, 12, 'B');
    }
  }

  /* ---------- Pedidos y envíos ---------- */
  const orders: Order[] = [];
  const shipments: Shipment[] = [];
  let orderNo = 58210;
  let rmaNo = 1040;

  const lineFor = (client: ClientId, channel: Channel, wh: WarehouseId): OrderLine[] => {
    const pool = products.filter((p) => p.client === client && (!p.kit || wh === 'fun'));
    const n = Math.min(pool.length, channel === 'wholesale' ? ri(2, 3) : ri(1, 3));
    const chosen = [...pool].sort(() => rnd() - 0.5).slice(0, n);
    return chosen.map((p) => ({
      sku: p.sku,
      qty: channel === 'wholesale' ? (p.bulky ? ri(2, 4) : ri(1, 3) * 6) : p.bulky ? 1 : ri(1, 3),
      alloc: [],
    }));
  };

  type Kind = 'new' | 'picked' | 'own' | 'national' | 'delivered';
  const makeOrder = (wh: WarehouseId, kind: Kind, opts: { client?: ClientId; channel?: Channel; city?: string; lines?: OrderLine[]; created?: ISODateTime; customer?: string } = {}) => {
    const w = WAREHOUSE_BY_ID[wh];
    const client = opts.client ?? pick(w.clients.length === 3 ? ['lir', 'lir', 'cth', 'nut'] : w.clients);
    const local = kind === 'own' || (kind === 'delivered' && rnd() < 0.5) || (kind !== 'national' && rnd() < 0.35);
    const channel: Channel = opts.channel ?? (local ? pick<Channel>(['web', 'web', 'meli']) : pick<Channel>(['web', 'web', 'meli', 'wholesale']));
    let city = opts.city;
    let address = `${pick(STREETS)} ${ri(2, 170)} # ${ri(1, 99)}-${ri(10, 99)}`;
    let stop: Order['stop'];
    if (!city) {
      if (local) {
        const loc = pick(LOCALITIES[w.metro]);
        city = loc.city;
        address = `${address}, ${loc.name}`;
        const win = pick(WINDOWS);
        stop = {
          x: Math.round((loc.x + (rnd() - 0.5) * 1.6) * 10) / 10,
          y: Math.round((loc.y + (rnd() - 0.5) * 1.6) * 10) / 10,
          from: routeStart + win[0],
          to: Math.min(OP_CLOSE_MIN, routeStart + win[1]),
        };
      } else {
        city = pick(CITIES.filter((c) => c.metro !== w.metro && c.region !== 'special')).id;
      }
    }
    // Los pedidos en línea entran a cualquier hora; lo que pasa en la bodega, dentro del horario.
    let created: ISODateTime;
    if (opts.created) created = opts.created;
    else if (kind === 'new') created = addMinutes(now, -ri(10, 230));
    else if (kind === 'picked') created = ago(ri(150, 320));
    else if (kind === 'delivered') created = at(addDays(today, -ri(3, 9)), ri(480, 780));
    else created = ago(ri(260, 560));
    const o: Order = {
      id: `PED-${++orderNo}`,
      wh,
      client,
      channel,
      customer: opts.customer ?? (channel === 'wholesale' ? pick(WHOLESALERS) : pick(CUSTOMERS)),
      city: city!,
      address,
      createdAt: created,
      cutoff: cutoffFor(created, channel),
      lines: opts.lines ?? lineFor(client, channel, wh),
      status: 'new',
      stop,
    };
    orders.push(o);
    return o;
  };

  const fulfill = (o: Order, pickedAt: ISODateTime) => {
    for (const ln of o.lines) {
      const { alloc } = allocateFefo(lots, o.wh, ln.sku, ln.qty, today);
      ln.alloc = alloc.map((a) => ({ ...a, picked: a.qty }));
      const got = ln.alloc.reduce((s, a) => s + a.qty, 0);
      if (got < ln.qty) ln.qty = Math.max(1, got);
      for (const a of ln.alloc) addMove({ at: pickedAt, wh: o.wh, sku: ln.sku, lot: a.lot, bin: a.bin, qty: -a.qty, type: 'pick', ref: o.id });
    }
    o.pickedAt = pickedAt;
    o.verified = Object.fromEntries(o.lines.map((l) => [l.sku, 0]));
  };

  const ship = (o: Order, carrierId: Shipment['carrier'], shippedAt: ISODateTime, status: ShipStatus, deliveredAt?: ISODateTime) => {
    const carrier = CARRIER_BY_ID[carrierId];
    const net = orderNetKg(o, pm);
    const box = boxFor(net);
    const kg = Math.round((net + BOX_TARE[box]) * 100) / 100;
    const q = quotes(o.wh, o.city, kg).find((x) => x.carrier.id === carrierId);
    const flow: ShipStatus[] = carrierId === 'own' ? ['created', 'arrived', 'delivered'] : ['created', 'pickedUp', 'inTransit', 'outForDelivery', 'delivered'];
    const upto = status === 'exception' ? 2 : flow.indexOf(status);
    // Eventos repartidos entre la guía y la entrega (o la hora actual), dentro del horario.
    const end = status === 'delivered' && deliveredAt ? deliveredAt : op;
    const span = Math.max(0, minutesBetween(shippedAt, end));
    const steps = status === 'delivered' ? upto : upto + 1;
    const events: Shipment['events'] = [];
    for (let i = 0; i <= upto; i++) {
      const t = i === 0 ? shippedAt : clampOp(addMinutes(shippedAt, Math.round((span * i) / Math.max(1, steps))));
      events.push({ status: flow[i], at: i === upto && status === 'delivered' && deliveredAt ? deliveredAt : t });
    }
    if (status === 'exception') events.push({ status: 'exception', at: clampOp(addMinutes(shippedAt, Math.round(span * 0.9))), note: 'addressIncomplete' });
    const t = events[events.length - 1].at;
    const s: Shipment = {
      id: `${carrier.prefix}${ri(1000000, 9999999)}`,
      order: o.id,
      wh: o.wh,
      carrier: carrierId,
      city: o.city,
      cost: q?.price ?? 0,
      weightKg: kg,
      box,
      etaDays: q?.days ?? 1,
      status,
      events,
      pod: status === 'delivered' ? { name: o.customer, at: deliveredAt ?? t } : undefined,
    };
    shipments.push(s);
    o.shipment = s.id;
    o.shippedAt = shippedAt;
    o.status = status === 'delivered' ? 'delivered' : 'shipped';
    if (status === 'delivered') o.deliveredAt = deliveredAt;
    return s;
  };

  const waves: WmsState['waves'] = [];
  const counts: CountTask[] = [];
  const rmas: Rma[] = [];
  const crossDock: CrossDockTask[] = [];
  const pos: PurchaseOrder[] = [];
  const putaway: PutawayTask[] = [];
  const routes = {} as WmsState['routes'];
  const waveDoneAgo: Partial<Record<WarehouseId, number>> = {};

  const plan: Record<WarehouseId, { fresh: number; picked: number; own: number; national: number; delivered: number }> = {
    fun: { fresh: 10, picked: 3, own: 9, national: 3, delivered: 6 },
    ita: { fresh: 6, picked: 2, own: 6, national: 2, delivered: 3 },
    baq: { fresh: 4, picked: 1, own: 5, national: 2, delivered: 2 },
  };

  for (const w of WAREHOUSES) {
    const cfg = plan[w.id];
    const delivered: Order[] = [];
    for (let i = 0; i < cfg.delivered; i++) {
      const o = makeOrder(w.id, 'delivered');
      const shippedAt = fwdOp(o.createdAt, ri(60, 180));
      fulfill(o, fwdOp(o.createdAt, ri(30, 50)));
      const localOrder = shipZone(w.id, o.city) === 'local';
      const carrier = localOrder ? 'own' : quotes(w.id, o.city, orderNetKg(o, pm) + 0.4).find((q) => q.ok)!.carrier.id;
      const deliveredAt = localOrder ? fwdOp(shippedAt, ri(60, 240)) : at(addDays(dateOf(shippedAt), ri(1, 2)), ri(570, 1050));
      ship(o, carrier, shippedAt, 'delivered', deliveredAt);
      delivered.push(o);
    }
    for (let i = 0; i < cfg.own; i++) {
      const c = ri(260, 560);
      const o = makeOrder(w.id, 'own', { created: ago(c) });
      fulfill(o, ago(c - ri(30, 60)));
      ship(o, 'own', ago(c - ri(70, 120)), 'created');
    }
    for (let i = 0; i < cfg.national; i++) {
      const c = ri(260, 560);
      const o = makeOrder(w.id, 'national', { channel: i === 0 ? 'wholesale' : undefined, created: ago(c) });
      fulfill(o, ago(c - ri(30, 60)));
      const kg = orderNetKg(o, pm) + 0.4;
      const carrier = quotes(w.id, o.city, kg).find((q) => q.ok)!.carrier.id;
      const status: ShipStatus = w.id === 'fun' && i === 2 ? 'exception' : i === 0 ? 'inTransit' : 'pickedUp';
      ship(o, carrier, ago(c - ri(80, 140)), status);
    }
    const pickedOrders: Order[] = [];
    const waveAgo = ri(100, 140);
    for (let i = 0; i < cfg.picked; i++) {
      const o = makeOrder(w.id, 'picked', { ...(w.id === 'fun' && i === 0 ? { city: 'clo', channel: 'web', client: 'lir' } : {}), created: ago(ri(150, 320)) });
      const pickedAgo = ri(30, 90);
      waveDoneAgo[w.id] = Math.min(waveDoneAgo[w.id] ?? pickedAgo, pickedAgo);
      fulfill(o, ago(pickedAgo));
      o.status = 'picked';
      pickedOrders.push(o);
    }
    if (pickedOrders.length) {
      const waveId = `OLA-${ri(310, 389)}`;
      waves.push({ id: waveId, wh: w.id, at: ago(waveAgo), orders: pickedOrders.map((o) => o.id), strategy: 'batch', status: 'done' });
      pickedOrders.forEach((o) => (o.wave = waveId));
    }
    for (let i = 0; i < cfg.fresh; i++) makeOrder(w.id, 'new');

    // Plan de rutas de la flota propia: en el orden en que se despacharon (sin optimizar).
    const own = orders
      .filter((o) => o.wh === w.id && o.status === 'shipped' && shipments.find((s) => s.id === o.shipment)?.carrier === 'own')
      .sort((a, b) => (a.shippedAt! < b.shippedAt! ? -1 : 1));
    const routePlan: string[][] = w.vehicles.map(() => []);
    own.forEach((o, i) => routePlan[i % w.vehicles.length].push(o.id));
    routes[w.id] = { plan: routePlan, optimized: false, start: hhmm(routeStart) };

    // Devoluciones de pedidos entregados.
    const rmaSeeds: { status: Rma['status']; reason: Rma['reason']; key: string; disposition?: Rma['disposition']; reject?: string }[] =
      w.id === 'fun'
        ? [
            { status: 'requested', reason: 'damaged', key: 'c1' },
            { status: 'approved', reason: 'wrongItem', key: 'c2' },
            { status: 'received', reason: 'withdrawal', key: 'c3', disposition: 'restock' },
            { status: 'closed', reason: 'defect', key: 'c4', disposition: 'quarantine' },
          ]
        : w.id === 'ita'
          ? [
              { status: 'requested', reason: 'withdrawal', key: 'c5' },
              { status: 'rejected', reason: 'withdrawal', key: 'c6', reject: 'outOfTerm' },
            ]
          : [{ status: 'approved', reason: 'damaged', key: 'c1' }];
    // Las devoluciones salen de pedidos ya entregados: el retracto rechazado por plazo usa el
    // pedido entregado hace más tiempo; las demás, los más recientes.
    const byRecent = [...delivered].sort((a, b) => (a.deliveredAt! < b.deliveredAt! ? 1 : -1));
    let nextRecent = 0;
    rmaSeeds.forEach((r) => {
      const o = r.reject === 'outOfTerm' ? byRecent[byRecent.length - 1] : byRecent[nextRecent++ % byRecent.length];
      const ln = o.lines[0];
      const deliveredDay = dateOf(o.deliveredAt ?? today);
      const asked = addDays(today, -ri(0, 2));
      rmas.push({
        id: `DEV-${++rmaNo}`,
        wh: w.id,
        order: o.id,
        client: o.client,
        customer: o.customer,
        sku: ln.sku,
        qty: 1,
        reason: r.reason,
        comments: '',
        commentsKey: r.key,
        date: asked < deliveredDay ? deliveredDay : asked,
        status: r.status,
        disposition: r.disposition,
        rejectReason: r.reject,
      });
    });
  }

  /* ---------- Órdenes de compra ---------- */
  const mfg = addDays(today, -12);
  const lotCode = (n: number) => `L${mfg.slice(2, 4)}${mfg.slice(5, 7)}-${n}`;
  const exp = (sku: string) => (pm[sku].expires ? addDays(mfg, pm[sku].client === 'nut' ? 540 : 730) : null);
  const line = (sku: string, expected: number, onTruck: number, n: number) => ({
    sku,
    expected,
    received: 0,
    damaged: 0,
    lot: lotCode(n),
    expiry: exp(sku),
    onTruck,
  });
  // Llegadas relativas al reloj de la operación: la primera OC ya está en el muelle.
  const etaIn = (min: number) => round10(min <= 0 ? backOp(op, -min) : fwdOp(op, min));

  // Pedido mayorista que espera la OC cross-dock.
  const xdOrder = makeOrder('fun', 'new', {
    client: 'nut',
    channel: 'wholesale',
    city: 'ibg',
    customer: WHOLESALERS[0],
    lines: [
      { sku: 'NUT-VTC60', qty: 120, alloc: [] },
      { sku: 'NUT-OMG90', qty: 48, alloc: [] },
    ],
  });
  xdOrder.crossDockPo = 'OC-24873';
  const xdOrder2 = makeOrder('fun', 'new', {
    client: 'cth',
    channel: 'wholesale',
    city: 'vvc',
    customer: WHOLESALERS[1],
    lines: [{ sku: 'CTH-TOA70', qty: 30, alloc: [] }],
    created: ago(200),
  });
  xdOrder2.crossDockPo = 'OC-24860';

  pos.push(
    {
      id: 'OC-24871',
      wh: 'fun',
      supplier: 'gua',
      client: 'lir',
      eta: etaIn(-10),
      lines: [line('LIR-CHA400', 48, 48, 118), line('LIR-CRE250', 36, 32, 119), line('LIR-PRO120', 24, 24, 120)],
      status: 'expected',
      scans: [],
      issues: [],
    },
    {
      id: 'OC-24872',
      wh: 'fun',
      supplier: 'cal',
      client: 'cth',
      eta: etaIn(90),
      lines: [line('CTH-TOA70', 60, 60, 201), line('CTH-COB220', 20, 21, 202)],
      status: 'expected',
      scans: [],
      issues: [],
    },
    {
      id: 'OC-24873',
      wh: 'fun',
      supplier: 'alt',
      client: 'nut',
      eta: etaIn(210),
      lines: [line('NUT-VTC60', 120, 120, 311), line('NUT-OMG90', 48, 48, 312)],
      status: 'expected',
      scans: [],
      issues: [],
      crossDockOrder: xdOrder.id,
    },
    {
      id: 'OC-24868',
      wh: 'fun',
      supplier: 'pco',
      client: 'cth',
      eta: round10(ago(150)),
      lines: [
        { ...line('CTH-VAJ16', 12, 12, 87), received: 12 },
        { ...line('CTH-SAR24', 24, 24, 88), received: 24 },
      ],
      status: 'closed',
      scans: [],
      issues: [],
      closedAt: ago(80),
    },
    {
      id: 'OC-24860',
      wh: 'fun',
      supplier: 'cal',
      client: 'cth',
      eta: round10(ago(240)),
      lines: [{ ...line('CTH-TOA70', 30, 30, 61), received: 30 }],
      status: 'closed',
      scans: [],
      issues: [],
      closedAt: ago(170),
      crossDockOrder: xdOrder2.id,
    },
    {
      id: 'OC-24865',
      wh: 'fun',
      supplier: 'pco',
      client: 'cth',
      eta: at(addDays(today, -1), 600),
      lines: [{ ...line('CTH-VAJ16', 18, 18, 52), received: 18, damaged: 3 }],
      status: 'closedIssues',
      scans: [],
      issues: [{ type: 'damaged', sku: 'CTH-VAJ16', qty: 3 }],
      closedAt: at(addDays(today, -1), 690),
    },
    {
      id: 'OC-24874',
      wh: 'ita',
      supplier: 'gua',
      client: 'lir',
      eta: etaIn(60),
      lines: [line('LIR-CHA400', 36, 36, 401), line('LIR-ACO400', 24, 24, 402)],
      status: 'expected',
      scans: [],
      issues: [],
    },
    {
      id: 'OC-24875',
      wh: 'ita',
      supplier: 'cal',
      client: 'cth',
      eta: at(addDays(today, 1), 480),
      lines: [line('CTH-TOA70', 40, 38, 403)],
      status: 'expected',
      scans: [],
      issues: [],
    },
    {
      id: 'OC-24876',
      wh: 'baq',
      supplier: 'alt',
      client: 'nut',
      eta: etaIn(120),
      lines: [line('NUT-COL300', 30, 30, 501), line('NUT-PRO907', 20, 18, 502)],
      status: 'expected',
      scans: [],
      issues: [],
    },
    {
      id: 'OC-24877',
      wh: 'baq',
      supplier: 'pco',
      client: 'cth',
      eta: at(addDays(today, 1), 540),
      lines: [line('CTH-SAR24', 24, 24, 503)],
      status: 'expected',
      scans: [],
      issues: [],
    },
  );

  crossDock.push({ id: nid('XD'), wh: 'fun', po: 'OC-24860', order: xdOrder2.id, units: 30, step: 'consolidate' });

  /* ---------- Estado parcial para calcular sugerencias ---------- */
  const partial: WmsState = {
    version: STATE_VERSION,
    baseDate: today,
    createdAt: now,
    seq,
    products,
    lots,
    pos,
    putaway,
    orders,
    waves,
    shipments,
    moves,
    counts,
    countStats: { fun: { total: 169, match: 168 }, ita: { total: 112, match: 110 }, baq: { total: 64, match: 63 } },
    lastCount: {
      fun: { A: addDays(today, -5), B: addDays(today, -20), C: addDays(today, -61) },
      ita: { A: addDays(today, -3), B: addDays(today, -12), C: addDays(today, -40) },
      baq: { A: addDays(today, -6), B: addDays(today, -25), C: addDays(today, -80) },
    },
    rmas,
    crossDock,
    routes,
    preferred: { fun: 'con', ita: 'ran', baq: 'cei' },
    tariffs: JSON.parse(JSON.stringify(DEFAULT_TARIFFS)),
    billing: {} as WmsState['billing'],
    log,
    milestones: [],
  };

  // Ubicación pendiente de lo recibido en la OC-24868.
  for (const l of pos.find((p) => p.id === 'OC-24868')!.lines) {
    const s = suggestBin(partial, 'fun', l.sku);
    putaway.push({ id: nid('UB'), wh: 'fun', sku: l.sku, lot: l.lot, expiry: l.expiry, qty: l.received, ref: 'OC-24868', suggested: s.bin, rule: s.rule, quarantine: false, status: 'pending' });
    addMove({ at: ago(80), wh: 'fun', sku: l.sku, lot: l.lot, bin: 'RECIBO', qty: l.received, type: 'receipt', ref: 'OC-24868' });
  }
  addMove({ at: ago(170), wh: 'fun', sku: 'CTH-TOA70', lot: lotCode(61), bin: 'MUELLE', qty: 30, type: 'crossDock', ref: 'OC-24860' });

  /* ---------- Conteos cíclicos del día ---------- */
  const countPlan: Record<WarehouseId, { cls: AbcClass; n: number; due: number }[]> = {
    fun: [
      { cls: 'A', n: 4, due: 0 },
      { cls: 'B', n: 1, due: 1 },
    ],
    ita: [{ cls: 'A', n: 3, due: 0 }],
    baq: [
      { cls: 'A', n: 1, due: 0 },
      { cls: 'B', n: 1, due: 0 },
    ],
  };
  let countNo = 300;
  for (const w of WAREHOUSES) {
    const usedBins = new Set<string>();
    let who = 0;
    for (const cp of countPlan[w.id]) {
      const candidates = lots.filter((l) => l.wh === w.id && l.status === 'available' && cls[l.sku] === cp.cls && !usedBins.has(l.bin));
      for (let i = 0; i < cp.n && candidates.length; i++) {
        const l = candidates.splice(Math.floor(rnd() * candidates.length), 1)[0];
        usedBins.add(l.bin);
        counts.push({ id: `CC-${++countNo}`, wh: w.id, bin: l.bin, lotId: l.id, sku: l.sku, due: addDays(today, cp.due), assignee: PICKERS[who++ % PICKERS.length], status: 'scheduled' });
      }
    }
  }

  /* ---------- Historial para la prefactura 3PL ---------- */
  const billing = {} as WmsState['billing'];
  const prevDays = daysInMonth(previousMonth(today));
  const mtdDays = dayOfMonth(today) - 1;
  for (const c of ['lir', 'cth', 'nut'] as ClientId[]) {
    const todayOrders = orders.filter((o) => o.client === c && dateOf(o.createdAt) === today);
    const perDay = Math.max(4, todayOrders.length);
    const linesPerOrder = todayOrders.length ? todayOrders.reduce((s, o) => s + o.lines.length, 0) / todayOrders.length : 2;
    const positions = new Set(lots.filter((l) => pm[l.sku]?.client === c).map((l) => `${l.wh}:${l.bin}`)).size;
    const vol = (days: number, factor: number) => ({
      posDays: Math.round(positions * days * factor),
      lines: Math.round(perDay * linesPerOrder * days * factor),
      orders: Math.round(perDay * days * factor),
      parcels: Math.round(perDay * days * factor * 0.97),
      rmas: Math.round(perDay * days * factor * 0.015),
    });
    billing[c] = { prev: vol(prevDays, 0.94), mtd: vol(mtdDays, 1) };
  }
  partial.billing = billing;

  log.push(
    { id: nid('LG'), at: ago(80), wh: 'fun', key: 'poClosed', params: { po: 'OC-24868' } },
    { id: nid('LG'), at: ago(waveDoneAgo.fun ?? 60), wh: 'fun', key: 'waveDone', params: { wave: waves.find((x) => x.wh === 'fun')?.id ?? '' } },
    { id: nid('LG'), at: ago(170), wh: 'fun', key: 'poClosed', params: { po: 'OC-24860' } },
  );
  // La actividad reciente va de la más nueva a la más antigua.
  log.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  partial.seq = seq;
  return partial;
}
