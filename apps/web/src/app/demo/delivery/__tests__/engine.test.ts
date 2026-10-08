/**
 * Lógica de la demo de domicilios: tarifas, direcciones, rutas, reportes y
 * alertas calculados (nada escrito a mano) y el recorrido de un pedido por
 * las 4 apps.
 */
import {
  ACCEPT_WINDOW_S, CLUB_FREE_FROM, FEE_BASE, RAIN_FEE, computeKpis, deliveryCode, deliveryFee, fmtMoney, fmtNum, fmtTime, km,
  navSteps, nearestSede, opsAlerts, placeFromAddress, planRoute, priceOrder, stageTimes, docStatus, daysUntil,
} from '../components/engine';
import { DRIVER_DOCS, SAVED_ADDRESSES, SEDES, SEDE_BY_ID, START_SOD, generateSampleDay } from '../components/data';
import { __test, initialState, type DemoState } from '../components/store';

const { reducer } = __test;
const casa = SAVED_ADDRESSES[0].place;

describe('distancias y tarifas', () => {
  it('mide por cuadras y cobra el domicilio por tramos', () => {
    expect(km(casa, SEDE_BY_ID.chapinero.place)).toBe(2.8);
    expect(deliveryFee(1.5)).toBe(FEE_BASE);
    expect(deliveryFee(2.8)).toBe(FEE_BASE + 800);
    expect(deliveryFee(5)).toBe(FEE_BASE + 3 * 800);
  });

  it('elige la sede abierta más cercana dentro de la cobertura', () => {
    const open = { chapinero: true, usaquen: true, cedritos: true };
    expect(nearestSede(casa, SEDES, open)?.sede.id).toBe('chapinero');
    expect(nearestSede(casa, SEDES, { ...open, chapinero: false })?.sede.id).toBe('usaquen');
    expect(nearestSede({ calle: -38, carrera: 78 }, SEDES, open)).toBeNull();
  });
});

describe('direcciones colombianas', () => {
  it('convierte la nomenclatura en calle y carrera', () => {
    expect(placeFromAddress('calle', '85', '15')).toEqual({ calle: 85, carrera: 15 });
    expect(placeFromAddress('carrera', '7', '72A')).toEqual({ calle: 72, carrera: 7 });
    expect(placeFromAddress('calle', '38 Sur', '78')).toEqual({ calle: -38, carrera: 78 });
    expect(placeFromAddress('diagonal', '127C Bis', '15')).toEqual({ calle: 127, carrera: 15 });
    expect(placeFromAddress('calle', 'abc', '15')).toBeNull();
    expect(placeFromAddress('calle', '', '15')).toBeNull();
  });
});

describe('precios del carrito', () => {
  const lines = [{ key: 'ajiaco', itemId: 'ajiaco', qty: 1, unit: 32900, options: [] }];
  it('suma domicilio, recargo por lluvia, propina y descuento por puntos', () => {
    const p = priceOrder({ lines, distanceKm: 2.8, club: false, rain: true, tip: 2000, usePoints: true, points: 1240 });
    expect(p).toEqual({ subtotal: 32900, fee: 4700, rainFee: RAIN_FEE, discount: 5000, tip: 2000, total: 32900 + 4700 + RAIN_FEE - 5000 + 2000 });
  });
  it('el club solo regala el domicilio desde el mínimo', () => {
    expect(priceOrder({ lines, distanceKm: 2.8, club: true, rain: false, tip: 0, usePoints: false, points: 0 }).fee).toBe(4700);
    const big = [{ ...lines[0], qty: 2 }];
    expect(2 * 32900).toBeGreaterThanOrEqual(CLUB_FREE_FROM);
    expect(priceOrder({ lines: big, distanceKm: 2.8, club: true, rain: false, tip: 0, usePoints: false, points: 0 }).fee).toBe(0);
  });
  it('no descuenta puntos si no alcanzan', () => {
    expect(priceOrder({ lines, distanceKm: 1, club: false, rain: false, tip: 0, usePoints: true, points: 100 }).discount).toBe(0);
  });
});

describe('rutas e indicaciones', () => {
  it('da indicaciones por cuadras con el giro correcto', () => {
    const steps = navSteps({ calle: 72, carrera: 11 }, { calle: 63, carrera: 9 });
    expect(steps[0]).toMatchObject({ kind: 'follow', street: 'calle', num: 72, heading: 'east', untilNum: 9 });
    expect(steps[1]).toMatchObject({ kind: 'turn', street: 'carrera', num: 9, heading: 'south', turn: 'right', km: 0.9 });
    expect(steps[2].kind).toBe('arrive');
  });

  it('recoge cada pedido antes de entregarlo', () => {
    const r = planRoute({ calle: 70, carrera: 10 }, [
      { orderId: 'A', pickup: { calle: 63, carrera: 9 }, pickupLabel: 'sede', dropoff: { calle: 85, carrera: 15 }, dropoffLabel: 'a', picked: false },
      { orderId: 'B', pickup: { calle: 63, carrera: 9 }, pickupLabel: 'sede', dropoff: { calle: 72, carrera: 11 }, dropoffLabel: 'b', picked: false },
    ]);
    const idx = (id: string, kind: string) => r.stops.findIndex((s) => s.orderId === id && s.kind === kind);
    expect(idx('A', 'pickup')).toBeLessThan(idx('A', 'dropoff'));
    expect(idx('B', 'pickup')).toBeLessThan(idx('B', 'dropoff'));
    expect(r.stops).toHaveLength(4);
  });
});

describe('jornada de ejemplo', () => {
  const day = generateSampleDay();
  it('es determinista y coherente con la hora de la demo', () => {
    expect(generateSampleDay()).toEqual(day);
    const ids = day.orders.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    day.orders.filter((o) => o.stage === 'delivered').forEach((o) => {
      expect(o.t.delivered!).toBeLessThan(START_SOD);
      expect(o.t.created).toBeLessThan(o.t.accepted!);
      expect(o.t.accepted!).toBeLessThan(o.t.ready!);
      expect(o.t.ready!).toBeLessThan(o.t.pickedUp!);
      expect(o.t.pickedUp!).toBeLessThan(o.t.delivered!);
    });
  });

  it('calcula los KPI y tiempos desde los pedidos', () => {
    const k = computeKpis(day.orders);
    expect(k.orders).toBeGreaterThan(20);
    expect(k.active).toBe(5);
    expect(k.onTimePct).toBeGreaterThan(50);
    expect(k.onTimePct).toBeLessThan(100);
    expect(k.avgDeliveryMin).toBeGreaterThan(15);
    const st = stageTimes(day.orders);
    expect(st.samples).toBe(k.delivered);
    expect(st.prep).toBeGreaterThan(st.accept);
  });

  it('dispara las alertas por reglas de ejemplo', () => {
    const rules = new Set(opsAlerts(day.orders, START_SOD).map((a) => a.rule));
    ['gpsFar', 'sharedPhone', 'bigCash', 'late', 'unassigned'].forEach((r) => expect(rules.has(r as never)).toBe(true));
    expect(rules.has('noResponse')).toBe(false);
    const later = new Set(opsAlerts(day.orders, START_SOD + ACCEPT_WINDOW_S).map((a) => a.rule));
    expect(later.has('noResponse')).toBe(true);
  });

  it('marca el SOAT que vence en 12 días', () => {
    const soat = DRIVER_DOCS.d1.find((d) => d.id === 'soat')!;
    expect(daysUntil(soat.expires!)).toBe(12);
    expect(docStatus(soat.expires)).toBe('expiring');
    expect(docStatus('2026-10-01')).toBe('expired');
  });
});

describe('un pedido recorre las 4 apps', () => {
  const run = (s: DemoState, ...actions: Parameters<typeof reducer>[1][]) => actions.reduce(reducer, s);

  it('del carrito a la entrega con código y la calificación', () => {
    let s = initialState();
    s = run(s, { type: 'addToCart', itemId: 'bandeja', options: ['sinHuevo'], qty: 1 }, { type: 'addToCart', itemId: 'limonada', options: [], qty: 2 });
    s = run(s, { type: 'customer', patch: { payment: 'nequi', tip: 3000 } }, { type: 'placeOrder' });
    const id = s.customer.activeOrderId!;
    let o = s.orders.find((x) => x.id === id)!;
    expect(o).toMatchObject({ own: true, stage: 'pending', sedeId: 'chapinero', code: deliveryCode(o.seq) });
    expect(o.pricing.total).toBe(38900 + 2 * 9900 + 4700 + 3000);
    expect(s.customer.cart).toHaveLength(0);

    s = run(s, { type: 'accept', id, prepMin: 15 });
    const best = s.drivers.find((d) => d.id === 'd1')!;
    s = run(s, { type: 'assign', id, driverId: best.id }, { type: 'driverAccept', id });
    expect(s.driverView).toBe(best.id);
    // No se puede recoger antes de que la sede lo marque listo.
    s = run(s, { type: 'pickup', id });
    expect(s.orders.find((x) => x.id === id)!.stage).toBe('preparing');
    s = run(s, { type: 'ready', id }, { type: 'pickup', id }, { type: 'deliver', id, method: 'code' });
    o = s.orders.find((x) => x.id === id)!;
    expect(o.stage).toBe('delivered');
    expect(s.customer.points).toBe(1240 + Math.floor((38900 + 2 * 9900) / 1000));
    expect(s.drivers.find((d) => d.id === best.id)!.place).toEqual(o.customer.place);
    s = run(s, { type: 'rate', id, stars: 5, comment: 'Excelente' });
    expect(s.orders.find((x) => x.id === id)!.rating).toEqual({ stars: 5, comment: 'Excelente' });
    expect(s.log.map((l) => l.key)).toEqual(expect.arrayContaining(['orderPlaced', 'accepted', 'assigned', 'driverAccepted', 'ready', 'pickedUp', 'delivered', 'rated']));
  });

  it('el agotado de la sede bloquea el pedido y el rechazo devuelve los puntos', () => {
    let s = initialState();
    s = run(s, { type: 'addToCart', itemId: 'ajiaco', options: [], qty: 1 }, { type: 'soldOut', sede: 'chapinero', itemId: 'ajiaco' }, { type: 'placeOrder' });
    expect(s.orders.some((o) => o.own)).toBe(false);
    s = run(s, { type: 'soldOut', sede: 'chapinero', itemId: 'ajiaco' }, { type: 'customer', patch: { usePoints: true } }, { type: 'placeOrder' });
    const id = s.customer.activeOrderId!;
    expect(s.customer.points).toBe(1240 - 500);
    s = run(s, { type: 'reject', id, reason: 'busy' });
    expect(s.orders.find((o) => o.id === id)!.stage).toBe('rejected');
    expect(s.customer.points).toBe(1240);
  });

  it('el avance automático completa el pedido con el reloj', () => {
    let s = initialState();
    s = run(s, { type: 'addToCart', itemId: 'arepa', options: [], qty: 1 }, { type: 'placeOrder' }, { type: 'auto' });
    const id = s.customer.activeOrderId!;
    for (let i = 0; i < 60; i++) s = reducer(s, { type: 'tick' });
    expect(s.orders.find((o) => o.id === id)!.stage).toBe('delivered');
    expect(s.now).toBe(START_SOD + 60);
  });
});

describe('formatos', () => {
  it('muestra pesos y horas sin depender de la zona horaria', () => {
    expect(fmtMoney(38900, 'es')).toBe('$ 38.900');
    expect(fmtMoney(1234567, 'en')).toBe('COP 1,234,567');
    expect(fmtTime(START_SOD, 'es')).toBe('7:05 p. m.');
    expect(fmtTime(9 * 3600, 'en')).toBe('9:00 AM');
    expect(fmtNum(4.75, 'es', 1)).toBe('4,8');
    expect(fmtNum(1240, 'es')).toBe('1.240');
  });
});
