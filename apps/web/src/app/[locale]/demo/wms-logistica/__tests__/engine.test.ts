/**
 * Lógica de la demo WMS: los indicadores, ubicaciones, recorridos, cotizaciones
 * y rutas se calculan con los datos de ejemplo (nada escrito a mano) y el
 * recorrido principal (recibo → ubicación → ola → alistamiento → guía →
 * entrega) cambia el estado de forma coherente.
 */
import { BASE_PRODUCTS, ean13, fmtNit, nitDv, WAREHOUSE_BY_ID } from '../lib/catalog';
import {
  abcClasses,
  allocateFefo,
  evalRoutes,
  importProducts,
  kpis,
  optimizeRoutes,
  pickPlan,
  quotes,
  shipZone,
  suggestBin,
  walkMeters,
  billing,
} from '../lib/engine';
import { buildState } from '../lib/seed';
import { __test, releasePlan } from '../lib/store';
import { routeStops } from '../components/Routes';
import type { WmsState } from '../lib/types';
import { backOp, diffDays, fwdOp, minutesOf, opClock, timeToMinutes } from '../lib/dates';

const NOW = '2026-10-08T09:40';
const { reducer } = __test;
const run = (s: WmsState, ...actions: Parameters<typeof reducer>[1][]) => actions.reduce<WmsState>((acc, a) => reducer(acc, a)!, s);

describe('datos maestros', () => {
  it('calcula el dígito de verificación del NIT y el EAN-13', () => {
    expect(nitDv('900874316')).toBe(7);
    expect(fmtNit('901583217')).toBe('901.583.217-0');
    expect(ean13('200000100001')).toBe('2000001000014');
  });

  it('clasifica ABC por valor despachado (A ≤ 75 %, B ≤ 95 %)', () => {
    const cls = abcClasses(BASE_PRODUCTS);
    expect(cls['LIR-CHA400']).toBe('A');
    expect(cls['NUT-PRO907']).toBe('A');
    expect(cls['CTH-TOA70']).toBe('B');
    expect(cls['LIR-KITBV']).toBe('C');
    const counts = Object.values(cls).reduce<Record<string, number>>((acc, c) => ({ ...acc, [c]: (acc[c] ?? 0) + 1 }), {});
    expect(counts.A).toBeGreaterThanOrEqual(3);
    expect(counts.C).toBeGreaterThanOrEqual(3);
  });
});

describe('operación de ejemplo', () => {
  const s = buildState(NOW);

  it('es determinista y usa la fecha de hoy', () => {
    const again = buildState(NOW);
    expect(again.orders.map((o) => o.id)).toEqual(s.orders.map((o) => o.id));
    expect(s.baseDate).toBe('2026-10-08');
    expect(s.pos.find((p) => p.id === 'OC-24871')?.eta).toBe('2026-10-08T09:30');
  });

  it('los indicadores salen del estado', () => {
    const k = kpis(s, 'fun', s.baseDate);
    expect(k.toRelease).toBe(s.orders.filter((o) => o.wh === 'fun' && o.status === 'new' && !o.crossDockPo).length);
    expect(k.accuracy).toBeCloseTo((168 / 169) * 100, 5);
    expect(k.expired).toBe(1);
    expect(k.occupancy).toBeGreaterThan(30);
  });

  it('sugiere ubicaciones con reglas explicables', () => {
    expect(suggestBin(s, 'fun', 'CTH-VAJ16', { quarantine: true }).rule).toBe('damaged');
    const fresh = { ...s, lots: s.lots.filter((l) => l.sku !== 'LIR-CHA400') };
    const sug = suggestBin(fresh, 'fun', 'LIR-CHA400');
    expect(sug.rule).toBe('highRotation');
    expect(sug.bin.startsWith('A-')).toBe(true);
  });

  it('asigna por FEFO: primero el lote que vence antes y nunca uno vencido', () => {
    const { alloc } = allocateFefo(s.lots, 'fun', 'LIR-PRO120', 30, s.baseDate);
    const lots = alloc.map((a) => s.lots.find((l) => l.id === a.lotId)!);
    expect(lots[0].expiry).toBe('2026-10-29');
    for (let i = 1; i < lots.length; i++) expect(lots[i].expiry! >= lots[i - 1].expiry!).toBe(true);
    const col = allocateFefo(s.lots, 'fun', 'NUT-COL300', 9999, s.baseDate);
    expect(col.alloc.every((a) => s.lots.find((l) => l.id === a.lotId)!.status === 'available')).toBe(true);
  });
});

describe('fechas y horas coherentes con el momento en que abres la demo', () => {
  const inOp = (dt: string) => minutesOf(dt) >= 6 * 60 && minutesOf(dt) <= 22 * 60;
  it.each(['2026-10-10T03:00', '2026-10-10T06:10', '2026-10-10T09:40', '2026-10-10T13:20', '2026-10-10T21:50', '2026-10-10T23:30'])(
    'con la hora %s nada ocurre en el futuro ni de madrugada en la bodega',
    (now) => {
      const s = buildState(now);
      for (const sh of s.shipments) {
        for (let i = 0; i < sh.events.length; i++) {
          const e = sh.events[i];
          expect(e.at <= now).toBe(true);
          expect(inOp(e.at)).toBe(true);
          if (i > 0) expect(e.at >= sh.events[i - 1].at).toBe(true);
        }
      }
      for (const o of s.orders) {
        expect(o.createdAt <= now).toBe(true);
        for (const t of [o.pickedAt, o.shippedAt, o.deliveredAt]) {
          if (!t) continue;
          expect(t <= now).toBe(true);
          expect(inOp(t)).toBe(true);
          expect(t >= o.createdAt || o.status === 'delivered').toBe(true);
        }
        if (o.pickedAt && o.shippedAt) expect(o.shippedAt >= o.pickedAt).toBe(true);
        if (o.stop) {
          expect(o.stop.from).toBeLessThan(o.stop.to);
          expect(o.stop.to).toBeLessThanOrEqual(22 * 60);
        }
      }
      for (const w of s.waves) expect(w.at <= now && inOp(w.at)).toBe(true);
      for (const l of s.log) expect(l.at <= now).toBe(true);
      for (let i = 1; i < s.log.length; i++) expect(s.log[i - 1].at >= s.log[i].at).toBe(true);
      for (const p of s.pos) if (p.closedAt) expect(p.closedAt <= now && inOp(p.closedAt)).toBe(true);
      for (const r of s.rmas) {
        const o = s.orders.find((x) => x.id === r.order)!;
        expect(o.status).toBe('delivered');
        expect(r.date >= o.deliveredAt!.slice(0, 10)).toBe(true);
        expect(r.date <= s.baseDate).toBe(true);
      }
      for (const wh of ['fun', 'ita', 'baq'] as const) {
        const start = timeToMinutes(s.routes[wh].start);
        expect(start).toBeGreaterThanOrEqual(7 * 60);
        expect(start).toBeLessThanOrEqual(18 * 60);
      }
    },
  );

  it('el retracto rechazado por plazo usa el pedido entregado hace más de 5 días hábiles', () => {
    const s = buildState(NOW);
    const r = s.rmas.find((x) => x.rejectReason === 'outOfTerm')!;
    const o = s.orders.find((x) => x.id === r.order)!;
    expect(r.reason).toBe('withdrawal');
    expect(diffDays(o.deliveredAt!.slice(0, 10), s.baseDate)).toBeGreaterThanOrEqual(7);
  });

  it('cuenta minutos de operación saltando la noche', () => {
    expect(backOp('2026-10-10T07:00', 90)).toBe('2026-10-09T21:30');
    expect(fwdOp('2026-10-10T21:30', 60)).toBe('2026-10-11T06:30');
    expect(opClock('2026-10-10T04:00')).toBe('2026-10-09T22:00');
  });
});

describe('recorridos, cotizaciones y rutas', () => {
  it('mide el recorrido con pasillo transversal junto al muelle', () => {
    expect(walkMeters(['A-01-01'])).toBeCloseTo(2 * (1.6 + 3.2), 5);
    expect(walkMeters(['A-01-01', 'A-01-03'])).toBeCloseTo(2 * (4.8 + 3.2), 5);
  });

  it('por lote camina menos que pedido por pedido', () => {
    const s = buildState(NOW);
    const ids = s.orders.filter((o) => o.wh === 'fun' && o.status === 'new' && !o.crossDockPo).map((o) => o.id);
    const after = run(s, { type: 'wave.release', wh: 'fun', orders: ids, strategy: 'wave', at: NOW });
    const orders = after.orders.filter((o) => o.status === 'released');
    const wave = pickPlan(orders, 'wave');
    const batch = pickPlan(orders, 'batch');
    expect(batch.meters).toBeLessThan(wave.meters);
    expect(batch.tasks.length).toBeLessThanOrEqual(wave.tasks.length);
    expect(pickPlan(orders, 'zone').parallel).toBe(true);
  });

  it('cotiza por zona y excluye a quien no cubre o supera el peso', () => {
    expect(shipZone('fun', 'bog')).toBe('local');
    expect(shipZone('fun', 'ibg')).toBe('regional');
    expect(shipZone('fun', 'clo')).toBe('national');
    expect(shipZone('fun', 'let')).toBe('special');
    const cali = quotes('fun', 'clo', 2.4);
    expect(cali.find((q) => q.carrier.id === 'own')?.ok).toBe(false);
    expect(cali.find((q) => q.carrier.id === 'ran')?.price).toBe(15900 + 2 * 1900);
    expect(cali[0].ok).toBe(true);
    expect(cali[0].price).toBeLessThanOrEqual(cali[1].price || Infinity);
  });

  it('la optimización de rutas nunca empeora el plan', () => {
    const s = buildState(NOW);
    const stops = routeStops(s, 'fun');
    const w = WAREHOUSE_BY_ID.fun;
    const before = evalRoutes(s.routes.fun.plan, stops, w.vehicles, 480);
    const res = optimizeRoutes(s.routes.fun.plan, stops, w.vehicles, 480);
    const after = evalRoutes(res.plan, stops, w.vehicles, 480);
    expect(res.plan.flat().sort()).toEqual(s.routes.fun.plan.flat().sort());
    expect(after.km + after.late * 25).toBeLessThanOrEqual(before.km + before.late * 25);
  });
});

describe('importación CSV', () => {
  it('agrega productos válidos y reporta los errores por línea', () => {
    const csv = 'sku;nombre;cliente;codigo_barras;costo_unitario;peso_kg;vence\nLIR-SER30;Sérum 30 ml;Lirio;;27900;0,08;si\nLIR-CHA400;Duplicado;Lirio;;1;1;no\nX;;;\nY-1;Algo;Otro;;1;1;no';
    const r = importProducts(csv, BASE_PRODUCTS);
    expect(r.added.map((p) => p.sku)).toEqual(['LIR-SER30']);
    expect(r.added[0].expires).toBe(true);
    expect(r.errors.map((e) => e.reason)).toEqual(['duplicate', 'missingFields', 'client']);
  });
});

describe('flujo completo en el reducer', () => {
  it('recibo con faltante → ubicación → ola → alistamiento → guía → entrega', () => {
    let s = buildState(NOW);
    s = run(s, { type: 'po.unload', po: 'OC-24871', at: NOW }, { type: 'po.close', po: 'OC-24871', at: NOW });
    const po = s.pos.find((p) => p.id === 'OC-24871')!;
    expect(po.status).toBe('closedIssues');
    expect(po.issues).toEqual([{ type: 'missing', sku: 'LIR-CRE250', qty: 4 }]);
    const tasks = s.putaway.filter((t) => t.ref === 'OC-24871');
    expect(tasks.map((t) => t.qty)).toEqual([48, 32, 24]);

    const stockBefore = s.lots.filter((l) => l.wh === 'fun' && l.sku === 'LIR-CRE250').reduce((a, l) => a + l.qty, 0);
    s = run(s, ...tasks.map((t) => ({ type: 'putaway.confirm' as const, task: t.id, at: NOW })));
    const stockAfter = s.lots.filter((l) => l.wh === 'fun' && l.sku === 'LIR-CRE250').reduce((a, l) => a + l.qty, 0);
    expect(stockAfter - stockBefore).toBe(32);
    expect(s.milestones).toEqual(['received', 'putaway']);

    const ids = s.orders.filter((o) => o.wh === 'fun' && o.status === 'new' && !o.crossDockPo).map((o) => o.id);
    expect(releasePlan(s, ids, s.baseDate).ok.length).toBe(ids.length);
    s = run(s, { type: 'wave.release', wh: 'fun', orders: ids, strategy: 'batch', at: NOW });
    const reserved = s.lots.reduce((a, l) => a + l.reserved, 0);
    expect(reserved).toBe(s.orders.filter((o) => ids.includes(o.id)).reduce((a, o) => a + o.lines.reduce((b, l) => b + l.qty, 0), 0));

    const wave = s.waves[0];
    const plan = pickPlan(wave.orders.map((id) => s.orders.find((o) => o.id === id)!), wave.strategy);
    const unitsBefore = s.lots.reduce((a, l) => a + l.qty, 0);
    s = run(s, { type: 'pick.confirm', items: plan.tasks.flatMap((t) => t.items), at: NOW });
    expect(s.lots.reduce((a, l) => a + l.qty, 0)).toBe(unitsBefore - reserved);
    expect(s.lots.reduce((a, l) => a + l.reserved, 0)).toBe(0);
    expect(s.waves[0].status).toBe('done');
    expect(s.milestones).toContain('picked');

    const order = s.orders.find((o) => o.id === ids[0])!;
    const q = quotes('fun', order.city, 3).find((x) => x.ok)!;
    s = run(s, { type: 'pack.verifyAll', order: order.id }, { type: 'pack.ship', order: order.id, carrier: q.carrier.id, weightKg: 3, box: 'M', at: NOW });
    const shipped = s.orders.find((o) => o.id === order.id)!;
    expect(shipped.status).toBe('shipped');
    expect(s.shipments.find((x) => x.id === shipped.shipment)?.cost).toBe(q.price);

    const own = s.shipments.find((x) => x.wh === 'fun' && x.carrier === 'own' && x.status === 'created')!;
    s = run(s, { type: 'driver.arrive', shipment: own.id, at: NOW }, { type: 'driver.deliver', shipment: own.id, pod: { name: 'Laura M.', at: NOW, signature: 'data:image/png;base64,x' } });
    expect(s.orders.find((o) => o.id === own.order)?.status).toBe('delivered');
    expect(s.milestones).toEqual(['received', 'putaway', 'wave', 'picked', 'shipped', 'delivered']);
  });

  it('un faltante crea un conteo urgente y reasigna desde otro lote', () => {
    let s = buildState(NOW);
    const id = s.orders.find((o) => o.wh === 'fun' && o.status === 'new' && !o.crossDockPo)!.id;
    s = run(s, { type: 'wave.release', wh: 'fun', orders: [id], strategy: 'wave', at: NOW });
    const o = s.orders.find((x) => x.id === id)!;
    const first = { order: id, line: 0, a: 0, qty: o.lines[0].alloc[0].qty };
    s = run(s, { type: 'pick.short', items: [first], at: NOW });
    const after = s.orders.find((x) => x.id === id)!;
    expect(s.counts.some((c) => c.urgent && c.bin === o.lines[0].alloc[0].bin)).toBe(true);
    expect(after.lines[0].alloc.length).toBeGreaterThan(1);
    expect(after.status).toBe('released');
  });

  it('conteo con diferencia queda para aprobación y el ajuste va al kardex', () => {
    let s = buildState(NOW);
    const task = s.counts.find((c) => c.wh === 'fun')!;
    const sys = s.lots.find((l) => l.id === task.lotId)!.qty;
    s = run(s, { type: 'count.submit', task: task.id, counted: sys - 2, at: NOW });
    expect(s.counts.find((c) => c.id === task.id)?.status).toBe('review');
    s = run(s, { type: 'count.approve', task: task.id, at: NOW });
    expect(s.lots.find((l) => l.id === task.lotId)?.qty).toBe(sys - 2);
    expect(s.moves[0]).toMatchObject({ type: 'adjust', qty: -2, ref: task.id });
    expect(s.countStats.fun).toEqual({ total: 170, match: 168 });
  });

  it('la devolución guarda pedido, cliente y motivo por separado y reingresa al inventario', () => {
    let s = buildState(NOW);
    const o = s.orders.find((x) => x.wh === 'fun' && x.status === 'delivered')!;
    s = run(s, {
      type: 'rma.create',
      rma: { wh: 'fun', order: o.id, client: o.client, customer: o.customer, sku: o.lines[0].sku, qty: 1, reason: 'damaged', comments: 'Caja mojada', date: s.baseDate },
      at: NOW,
    });
    const r = s.rmas[0];
    expect(r).toMatchObject({ order: o.id, customer: o.customer, client: o.client, reason: 'damaged', comments: 'Caja mojada', status: 'requested' });
    s = run(s, { type: 'rma.decide', id: r.id, approve: true, at: NOW }, { type: 'rma.receive', id: r.id, disposition: 'restock', at: NOW });
    expect(s.moves[0]).toMatchObject({ type: 'return', qty: 1, ref: r.id });
  });

  it('la prefactura suma la actividad del día al mes en curso', () => {
    const s = buildState(NOW);
    const before = billing(s, 'lir', 'mtd', s.baseDate).subtotal;
    const changed = run(s, { type: 'tariff.set', client: 'lir', field: 'storage', value: 5000 });
    expect(billing(changed, 'lir', 'mtd', s.baseDate).subtotal).toBeGreaterThan(before);
  });
});
