/**
 * Lógica de la demo de domicilios: tarifas, direcciones, rutas, reportes y
 * alertas calculados (nada escrito a mano) y el recorrido de un pedido por
 * las 4 apps.
 */
import {
  ACCEPT_WINDOW_S, CLUB_FREE_FROM, DEMO_DATE, FEE_BASE, RAIN_FEE, computeKpis, deliveryCode, deliveryFee, fmtMoney, fmtNum, fmtTime, km,
  navSteps, nearestSede, opsAlerts, orderEta, placeFromAddress, planRoute, priceOrder, stageTimes, docStatus, daysUntil, shiftDate,
  todayInBogota, travelMin,
} from '../components/engine';
import { DRIVER_DOCS, SAVED_ADDRESSES, SEDES, SEDE_BY_ID, START_SOD, generateSampleDay } from '../components/data';
import { __test, clockJumpMinutes, initialState, migrateSaved, withDate, type DemoState } from '../components/store';

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
    expect(daysUntil(soat.expires!, DEMO_DATE)).toBe(12);
    expect(docStatus(soat.expires, DEMO_DATE)).toBe('expiring');
    expect(docStatus('2026-10-01', DEMO_DATE)).toBe('expired');
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

  it('el avance automático completa el pedido con tiempos realistas', () => {
    let s = initialState();
    s = run(s, { type: 'addToCart', itemId: 'arepa', options: [], qty: 1 }, { type: 'placeOrder' }, { type: 'auto' });
    const id = s.customer.activeOrderId!;
    for (let i = 0; i < 60; i++) s = reducer(s, { type: 'tick' });
    const o = s.orders.find((x) => x.id === id)!;
    expect(o.stage).toBe('delivered');
    // La preparación (15 min) y el trayecto se reflejan en el reloj: nada de "entregado en 1 minuto".
    const minutes = (o.t.delivered! - o.t.created) / 60;
    expect(minutes).toBeGreaterThanOrEqual(15 + travelMin(km(SEDE_BY_ID[o.sedeId].place, o.customer.place)));
    expect(o.t.ready! - o.t.accepted!).toBe(15 * 60);
    expect(s.log.some((l) => l.key === 'clockJump')).toBe(true);
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

describe('reloj de la demo', () => {
  const run = (s: DemoState, ...actions: Parameters<typeof reducer>[1][]) => actions.reduce(reducer, s);
  const ordered = () => {
    let s = initialState();
    s = run(s, { type: 'addToCart', itemId: 'ajiaco', options: [], qty: 1 }, { type: 'placeOrder' });
    return { s, id: s.customer.activeOrderId! };
  };

  it('«listo» adelanta el reloj hasta el fin de la preparación', () => {
    let { s, id } = ordered();
    s = run(s, { type: 'accept', id, prepMin: 20 });
    expect(clockJumpMinutes(s, 'ready', id)).toBe(20);
    s = run(s, { type: 'ready', id });
    const o = s.orders.find((x) => x.id === id)!;
    expect(o.t.ready! - o.t.accepted!).toBe(20 * 60);
    expect(s.now).toBe(o.t.ready);
    expect(s.log[0]).toMatchObject({ key: 'ready' });
    expect(s.log.find((l) => l.key === 'clockJump')).toMatchObject({ app: 'system', params: { id, min: 20, why: 'prep' } });
  });

  it('recoger espera a que el repartidor llegue y entregar suma el trayecto', () => {
    let { s, id } = ordered();
    s = run(s, { type: 'accept', id, prepMin: 15 }, { type: 'assign', id, driverId: 'd1' }, { type: 'driverAccept', id }, { type: 'ready', id });
    s = run(s, { type: 'pickup', id });
    let o = s.orders.find((x) => x.id === id)!;
    expect(o.stage).toBe('pickedUp');
    const sede = SEDE_BY_ID[o.sedeId];
    const ride = travelMin(km(sede.place, o.customer.place), 'moto');
    // La llegada estimada (y la del WhatsApp) es la salida + el trayecto.
    expect(orderEta(o, s.drivers.find((d) => d.id === 'd1'), sede)).toBe(o.t.pickedUp! + ride * 60);
    expect(clockJumpMinutes(s, 'deliver', id)).toBe(ride);
    s = run(s, { type: 'deliver', id, method: 'code' });
    o = s.orders.find((x) => x.id === id)!;
    expect(o.t.delivered! - o.t.pickedUp!).toBe(ride * 60);
    expect(s.now).toBe(o.t.delivered);
  });

  it('el resto de la operación termina los pedidos de ejemplo que ya estaban en curso', () => {
    let s = initialState();
    const before = s.orders.filter((o) => o.plan);
    expect(before.length).toBeGreaterThan(0);
    for (let i = 0; i < 25 * 60; i++) s = reducer(s, { type: 'tick' });
    const andrea = s.orders.find((o) => o.customer.name === 'Andrea F.')!;
    const martin = s.orders.find((o) => o.customer.name === 'Martín E.')!;
    expect(andrea.stage).toBe('delivered');
    expect(martin.stage).toBe('delivered');
    expect(andrea.t.ready! < andrea.t.pickedUp! && andrea.t.pickedUp! < andrea.t.delivered!).toBe(true);
    // Los que esperan una acción (aceptar, asignar) no avanzan solos.
    expect(s.orders.find((o) => o.customer.name === 'Lina K.')!.stage).toBe('pending');
    expect(s.orders.find((o) => o.customer.name === 'Gloria P.')!.stage).toBe('ready');
    // La actividad queda en orden (lo más reciente primero).
    const at = s.log.map((l) => l.at);
    expect([...at].sort((a, b) => b - a)).toEqual(at);
  });
});

describe('el resto de la operación al adelantar el reloj', () => {
  it('los pedidos de ejemplo en curso avanzan hasta la nueva hora y quedan en la actividad', () => {
    let s = initialState();
    s = [
      { type: 'addToCart', itemId: 'ajiaco', options: [], qty: 1 },
      { type: 'placeOrder' },
    ].reduce((acc, a) => reducer(acc, a as Parameters<typeof reducer>[1]), s);
    const id = s.customer.activeOrderId!;
    s = reducer(s, { type: 'accept', id, prepMin: 20 });
    s = reducer(s, { type: 'ready', id });
    const andrea = s.orders.find((o) => o.customer.name === 'Andrea F.')!;
    expect(andrea.stage).toBe('delivered');
    expect(s.log.some((l) => l.key === 'delivered' && l.params?.id === andrea.id)).toBe(true);
    const at = s.log.map((l) => l.at);
    expect([...at].sort((a, b) => b - a)).toEqual(at);
  });
});

describe('pago rechazado (simulado)', () => {
  it('no crea el pedido y el siguiente intento se aprueba', () => {
    let s = initialState();
    s = [
      { type: 'addToCart', itemId: 'arepa', options: [], qty: 1 },
      { type: 'customer', patch: { payment: 'card', declineNext: true } },
      { type: 'placeOrder' },
    ].reduce((acc, a) => reducer(acc, a as Parameters<typeof reducer>[1]), s);
    expect(s.orders.some((o) => o.own)).toBe(false);
    expect(s.customer.cart).toHaveLength(1);
    expect(s.customer.declineNext).toBe(false);
    expect(s.log[0]).toMatchObject({ key: 'paymentDeclined', params: { method: 'card' } });
    s = reducer(s, { type: 'placeOrder' });
    expect(s.orders.some((o) => o.own)).toBe(true);
  });

  it('en efectivo no aplica el rechazo de prueba', () => {
    let s = initialState();
    s = [
      { type: 'addToCart', itemId: 'arepa', options: [], qty: 1 },
      { type: 'customer', patch: { payment: 'cash', declineNext: true } },
      { type: 'placeOrder' },
    ].reduce((acc, a) => reducer(acc, a as Parameters<typeof reducer>[1]), s);
    expect(s.orders.some((o) => o.own)).toBe(true);
  });
});

describe('fecha de la jornada', () => {
  it('usa la fecha de hoy en Colombia y corre los vencimientos', () => {
    expect(todayInBogota(new Date('2026-10-15T03:00:00Z'))).toBe('2026-10-14');
    expect(shiftDate('2026-10-31', 1)).toBe('2026-11-01');
    const s = withDate(initialState(), '2026-10-14');
    expect(s.date).toBe('2026-10-14');
    const soat = s.docs.d1.find((d) => d.id === 'soat')!;
    expect(daysUntil(soat.expires!, s.date)).toBe(12);
    expect(soat.expires).toBe('2026-10-26');
  });

  it('migra lo guardado por la versión 1 sin perder pedidos', () => {
    const old = { ...initialState(), v: 1 } as Partial<DemoState>;
    delete old.date;
    const m = migrateSaved(JSON.parse(JSON.stringify(old)))!;
    expect(m.v).toBe(2);
    expect(m.date).toBe(DEMO_DATE);
    expect(m.customer.declineNext).toBe(false);
    expect(m.orders).toHaveLength(old.orders!.length);
    // Los pedidos de ejemplo en curso recuperan su plan (si no, quedarían quietos al adelantar el reloj).
    const noPlan = { ...initialState(), v: 1, orders: initialState().orders.map((o) => ({ ...o, plan: undefined })) };
    expect(migrateSaved(JSON.parse(JSON.stringify(noPlan)))!.orders.filter((o) => o.plan)).toHaveLength(3);
    expect(migrateSaved({ v: 99 })).toBeNull();
  });
});
