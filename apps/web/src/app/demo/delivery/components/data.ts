// Datos de ejemplo de la demo: una marca ficticia ("Fogón Demo") con 3 sedes
// en Bogotá, su menú en COP, repartidores ficticios y los pedidos de una
// jornada (jueves 8 de octubre de 2026). Se generan con una semilla fija, así
// que son iguales en cada carga y en el servidor.

import type {
  CartLine, Driver, DriverDoc, MenuItem, Order, PaymentId, Place, SavedAddress, Sede, SedeId, ZoneId,
} from './types';
import {
  deliveryCode, deliveryFee, km, lineKey, priceOrder, travelMin, unitPrice, ZONE_CENTERS,
} from './engine';

export const BRAND = 'Fogón Demo';

/** La demo empieza a las 7:05 p. m. (segundos del día). */
export const START_SOD = 19 * 3600 + 5 * 60;

export const SEDES: Sede[] = [
  { id: 'chapinero', zone: 'chapinero', address: 'Calle 63 # 9-24', place: { calle: 63, carrera: 9 } },
  { id: 'usaquen', zone: 'usaquen', address: 'Carrera 6 # 119-15', place: { calle: 119, carrera: 6 } },
  { id: 'cedritos', zone: 'cedritos', address: 'Calle 140 # 19-30', place: { calle: 140, carrera: 19 } },
];

export const SEDE_BY_ID: Record<SedeId, Sede> = Object.fromEntries(SEDES.map((s) => [s.id, s])) as Record<SedeId, Sede>;

export const ZONES: ZoneId[] = ['chapinero', 'usaquen', 'cedritos', 'suba', 'teusaquillo', 'kennedy', 'fontibon'];

export const MENU: MenuItem[] = [
  { id: 'bandeja', cat: 'platos', price: 38900, popular: true, extras: [{ id: 'sinChicharron', delta: 0 }, { id: 'sinHuevo', delta: 0 }, { id: 'aguacateExtra', delta: 3000 }] },
  { id: 'churrasco', cat: 'platos', price: 44900, choice: { id: 'termino', options: [{ id: 'terminoMedio', delta: 0 }, { id: 'terminoTresCuartos', delta: 0 }, { id: 'terminoBienAsado', delta: 0 }] }, extras: [{ id: 'papaCriolla', delta: 0 }] },
  { id: 'pollo', cat: 'platos', price: 29900 },
  { id: 'ajiaco', cat: 'sopas', price: 32900, popular: true, extras: [{ id: 'sinCrema', delta: 0 }, { id: 'sinAlcaparras', delta: 0 }, { id: 'conArroz', delta: 3500 }] },
  { id: 'sancocho', cat: 'sopas', price: 34900 },
  { id: 'arepa', cat: 'antojos', price: 14900, popular: true },
  { id: 'empanadas', cat: 'antojos', price: 12900, extras: [{ id: 'ajiAparte', delta: 0 }] },
  { id: 'patacon', cat: 'antojos', price: 16900 },
  { id: 'limonada', cat: 'bebidas', price: 9900, popular: true },
  { id: 'jugoLulo', cat: 'bebidas', price: 7900, choice: { id: 'base', options: [{ id: 'enAgua', delta: 0 }, { id: 'enLeche', delta: 1000 }] } },
  { id: 'aguaGas', cat: 'bebidas', price: 4500 },
  { id: 'natas', cat: 'postres', price: 11900 },
  { id: 'arrozLeche', cat: 'postres', price: 9900 },
];

export const MENU_BY_ID: Record<string, MenuItem> = Object.fromEntries(MENU.map((m) => [m.id, m]));

export const DRIVERS: Driver[] = [
  { id: 'd1', name: 'Camilo Rojas', vehicle: 'moto', plate: 'KTR 42F', place: { calle: 72, carrera: 11 }, online: true },
  { id: 'd2', name: 'Yeimy Pardo', vehicle: 'moto', plate: 'PLM 18C', place: { calle: 127, carrera: 15 }, online: true },
  { id: 'd3', name: 'Andrés Gil', vehicle: 'bici', plate: '', place: { calle: 60, carrera: 12 }, online: true },
  { id: 'd4', name: 'Luisa Mora', vehicle: 'moto', plate: 'BXN 07E', place: { calle: 136, carrera: 21 }, online: true },
  { id: 'd5', name: 'Wilson Cárdenas', vehicle: 'moto', plate: 'QWE 55A', place: { calle: 100, carrera: 19 }, online: false },
  { id: 'd6', name: 'Daniela Ortiz', vehicle: 'moto', plate: 'HJU 31B', place: { calle: 52, carrera: 14 }, online: true },
];

export const DRIVER_DOCS: Record<string, DriverDoc[]> = Object.fromEntries(
  DRIVERS.map((d, i) => [
    d.id,
    d.vehicle === 'bici'
      ? [
          { id: 'cedula' },
          { id: 'seguridadSocial', expires: '2026-10-31' },
        ]
      : [
          { id: 'cedula' },
          { id: 'licencia', expires: `${2028 + (i % 3)}-0${(i % 8) + 1}-14` },
          { id: 'soat', expires: i === 0 ? '2026-10-20' : `2027-0${(i % 8) + 1}-0${(i % 9) + 1}` },
          { id: 'tecnomecanica', expires: i === 0 ? '2027-02-02' : `2027-0${((i + 3) % 8) + 1}-1${i % 9}` },
          { id: 'tarjetaPropiedad' },
          { id: 'seguridadSocial', expires: '2026-10-31' },
        ],
  ]),
) as Record<string, DriverDoc[]>;

export const SAVED_ADDRESSES: SavedAddress[] = [
  { id: 'casa', label: 'casa', address: 'Calle 85 # 15-32, apto 402', place: { calle: 85, carrera: 15 }, zone: 'chapinero' },
  { id: 'oficina', label: 'oficina', address: 'Carrera 11 # 93-46, oficina 301', place: { calle: 93, carrera: 11 }, zone: 'chapinero' },
];

export const CUSTOMER = { id: 'c-demo', name: 'Mariana', phone: '+57 300 555 0142' };
export const INITIAL_POINTS = 1240;

// ---------------------------------------------------------------------------
// Jornada de ejemplo
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMES = [
  'Laura M.', 'Juan P.', 'Natalia R.', 'Carlos D.', 'Paola G.', 'Sergio T.', 'Diana C.', 'Felipe O.',
  'Catalina B.', 'Jorge H.', 'Mónica S.', 'Esteban L.', 'Valeria Q.', 'Ricardo N.', 'Sandra V.', 'Tomás A.',
];

const ZONES_BY_SEDE: Record<SedeId, ZoneId[]> = {
  chapinero: ['chapinero', 'chapinero', 'teusaquillo'],
  usaquen: ['usaquen', 'usaquen', 'chapinero'],
  cedritos: ['cedritos', 'cedritos', 'suba', 'usaquen'],
};

const PAYMENTS: PaymentId[] = ['nequi', 'nequi', 'card', 'card', 'cash', 'cash', 'daviplata', 'pse', 'dataphone', 'dataphone'];
const RATING_COMMENT_KEYS = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5'];

function pick<T>(r: () => number, list: T[]): T {
  return list[Math.floor(r() * list.length) % list.length];
}

function addressFor(r: () => number, zone: ZoneId): { address: string; place: Place } {
  const c = ZONE_CENTERS[zone];
  const place: Place = { calle: c.calle + Math.round((r() - 0.5) * 14), carrera: Math.max(2, c.carrera + Math.round((r() - 0.5) * 10)) };
  const placa = 10 + Math.floor(r() * 80);
  const calleTxt = place.calle < 0 ? `${-place.calle} Sur` : String(place.calle);
  const address = r() < 0.5 ? `Calle ${calleTxt} # ${place.carrera}-${placa}` : `Carrera ${place.carrera} # ${calleTxt}-${placa}`;
  return { address, place };
}

function linesFor(r: () => number): CartLine[] {
  const roll = r();
  const n = roll < 0.45 ? 1 : roll < 0.85 ? 2 : 3;
  const lines: CartLine[] = [];
  for (let i = 0; i < n; i++) {
    const item = pick(r, MENU);
    const options = item.choice ? [item.choice.options[Math.floor(r() * item.choice.options.length)].id] : [];
    const key = lineKey(item.id, options);
    const existing = lines.find((l) => l.key === key);
    if (existing) existing.qty += 1;
    else lines.push({ key, itemId: item.id, qty: 1 + (r() < 0.15 ? 1 : 0), unit: unitPrice(item, options), options });
  }
  return lines;
}

function makeLines(spec: [string, number][]): CartLine[] {
  return spec.map(([id, qty]) => {
    const item = MENU_BY_ID[id];
    const options = item.choice ? [item.choice.options[0].id] : [];
    return { key: lineKey(id, options), itemId: id, qty, unit: unitPrice(item, options), options };
  });
}

/** Horas de creación de los pedidos de la jornada (picos de almuerzo y comida). */
const HOUR_WEIGHTS: [number, number][] = [[11, 2], [12, 7], [13, 7], [14, 3], [15, 2], [16, 2], [17, 4], [18, 7]];

export interface SampleDay {
  orders: Order[];
  nextSeq: number;
}

export function generateSampleDay(seed = 20261008): SampleDay {
  const r = mulberry32(seed);
  const orders: Order[] = [];
  let seq = 1001;
  const onlineDrivers = DRIVERS.filter((d) => d.id !== 'd5');

  HOUR_WEIGHTS.forEach(([hour, count]) => {
    for (let i = 0; i < count; i++) {
      const minute = Math.floor(((i + r()) / count) * 60);
      const created = hour * 3600 + Math.min(59, minute) * 60 + Math.floor(r() * 60);
      if (created > START_SOD - 35 * 60) continue;
      const sedeId = pick<SedeId>(r, ['chapinero', 'chapinero', 'chapinero', 'usaquen', 'usaquen', 'cedritos', 'cedritos']);
      const sede = SEDE_BY_ID[sedeId];
      const zone = pick(r, ZONES_BY_SEDE[sedeId]);
      const { address, place } = addressFor(r, zone);
      const distance = km(sede.place, place);
      const lines = linesFor(r);
      const tip = pick(r, [0, 0, 0, 2000, 3000, 5000]);
      const pricing = priceOrder({ lines, distanceKm: distance, club: false, rain: false, tip, usePoints: false, points: 0 });
      const nameIdx = Math.floor(r() * NAMES.length);
      const driver = pick(r, onlineDrivers);
      const prepMin = pick(r, [15, 15, 20, 20, 25]);
      const ride = travelMin(distance, driver.vehicle);
      const accepted = created + 20 + Math.floor(r() * 100);
      const ready = accepted + prepMin * 60 + Math.floor((r() - 0.4) * 300);
      const pickedUp = ready + 60 + Math.floor(r() * 300);
      const delivered = pickedUp + ride * 60 + Math.floor((r() - 0.3) * 240);
      const promisedMin = prepMin + ride + 7;
      if (delivered > START_SOD - 120) continue;
      const thisSeq = seq++;
      const order: Order = {
        id: `P-${thisSeq}`,
        seq: thisSeq,
        own: false,
        sedeId,
        customer: { id: `c${nameIdx}`, name: NAMES[nameIdx], phone: `+57 3${10 + nameIdx} 555 0${100 + nameIdx * 7}`, address, place, zone, isNew: r() < 0.2 },
        lines,
        pricing,
        payment: pick(r, PAYMENTS),
        driverBonus: 0,
        code: deliveryCode(thisSeq),
        stage: 'delivered',
        prepMin,
        promisedMin,
        driverId: driver.id,
        driverStatus: 'accepted',
        t: { created, accepted, ready, assigned: accepted + 30, pickedUp, delivered, closed: delivered },
        pod: { method: r() < 0.85 ? 'code' : 'photoSignature', distanceM: 8 + Math.floor(r() * 70) },
        chat: [],
        driverRejections: 0,
      };
      if (r() < 0.6) {
        const roll = r();
        const stars = roll < 0.7 ? 5 : roll < 0.93 ? 4 : 3;
        order.rating = { stars, commentKey: stars === 3 ? 'c5' : pick(r, RATING_COMMENT_KEYS.slice(0, 5)) };
      }
      orders.push(order);
    }
  });

  // Casos que activan las reglas de revisión de Operaciones.
  const gpsCase = orders[orders.length - 6];
  if (gpsCase) {
    gpsCase.pod = { method: 'code', distanceM: 850 };
    gpsCase.driverId = 'd6';
  }
  const sharedPhone = '+57 301 555 0187';
  [3, 11, 19].forEach((idx, k) => {
    const o = orders[idx];
    if (!o) return;
    o.customer = { ...o.customer, id: `cx${k}`, name: ['Kevin R.', 'Brayan R.', 'Jhon R.'][k], phone: sharedPhone, isNew: true };
  });
  const cashCase = orders[orders.length - 10];
  if (cashCase) {
    cashCase.lines = makeLines([['bandeja', 4], ['churrasco', 2], ['limonada', 6]]);
    const d = km(SEDE_BY_ID[cashCase.sedeId].place, cashCase.customer.place);
    cashCase.pricing = priceOrder({ lines: cashCase.lines, distanceKm: d, club: false, rain: false, tip: 0, usePoints: false, points: 0 });
    cashCase.payment = 'cash';
    cashCase.customer = { ...cashCase.customer, isNew: true };
  }
  // Un rechazo y una cancelación durante el día.
  const rejected = orders[8];
  if (rejected) {
    Object.assign(rejected, { stage: 'rejected', rejectReason: 'soldOut', driverId: undefined, driverStatus: undefined, pod: undefined, rating: undefined, t: { created: rejected.t.created, closed: rejected.t.created + 70 } });
  }
  const cancelled = orders[22];
  if (cancelled) {
    Object.assign(cancelled, { stage: 'cancelled', cancelReason: 'customer', driverId: undefined, driverStatus: undefined, pod: undefined, rating: undefined, t: { created: cancelled.t.created, accepted: cancelled.t.created + 40, closed: cancelled.t.created + 260 } });
  }

  orders.sort((a, b) => a.t.created - b.t.created);

  // Pedidos en curso a las 7:05 p. m.
  const active = (spec: {
    sedeId: SedeId; zone: ZoneId; addr: { address: string; place: Place }; lines: [string, number][]; payment: PaymentId;
    name: string; createdAgo: number; stage: Order['stage']; prepMin?: number; driverId?: string; driverStatus?: Order['driverStatus'];
    acceptedAgo?: number; readyAgo?: number; pickedAgo?: number; tip?: number;
  }): Order => {
    const thisSeq = seq++;
    const lines = makeLines(spec.lines);
    const d = km(SEDE_BY_ID[spec.sedeId].place, spec.addr.place);
    const pricing = priceOrder({ lines, distanceKm: d, club: false, rain: false, tip: spec.tip ?? 0, usePoints: false, points: 0 });
    const vehicle = DRIVERS.find((x) => x.id === spec.driverId)?.vehicle ?? 'moto';
    const prep = spec.prepMin;
    return {
      id: `P-${thisSeq}`,
      seq: thisSeq,
      own: false,
      sedeId: spec.sedeId,
      customer: { id: `ca${thisSeq}`, name: spec.name, phone: `+57 315 555 0${thisSeq % 1000}`, address: spec.addr.address, place: spec.addr.place, zone: spec.zone, isNew: false },
      lines,
      pricing,
      payment: spec.payment,
      driverBonus: 0,
      code: deliveryCode(thisSeq),
      stage: spec.stage,
      prepMin: prep,
      promisedMin: prep ? prep + travelMin(d, vehicle) + 10 : undefined,
      driverId: spec.driverId,
      driverStatus: spec.driverStatus,
      t: {
        created: START_SOD - spec.createdAgo,
        accepted: spec.acceptedAgo !== undefined ? START_SOD - spec.acceptedAgo : undefined,
        ready: spec.readyAgo !== undefined ? START_SOD - spec.readyAgo : undefined,
        assigned: spec.driverId && spec.acceptedAgo !== undefined ? START_SOD - spec.acceptedAgo + 40 : undefined,
        pickedUp: spec.pickedAgo !== undefined ? START_SOD - spec.pickedAgo : undefined,
      },
      chat: [],
      driverRejections: 0,
    };
  };

  orders.push(
    active({ sedeId: 'chapinero', zone: 'teusaquillo', addr: { address: 'Carrera 20 # 39-14', place: { calle: 39, carrera: 20 } }, lines: [['ajiaco', 2], ['limonada', 2]], payment: 'nequi', name: 'Andrea F.', createdAgo: 43 * 60, stage: 'preparing', prepMin: 15, acceptedAgo: 42 * 60, driverId: 'd6', driverStatus: 'accepted' }),
    active({ sedeId: 'usaquen', zone: 'usaquen', addr: { address: 'Calle 134 # 9-51', place: { calle: 134, carrera: 9 } }, lines: [['bandeja', 1], ['jugoLulo', 1]], payment: 'card', name: 'Martín E.', createdAgo: 31 * 60, stage: 'pickedUp', prepMin: 15, acceptedAgo: 30 * 60, readyAgo: 13 * 60, pickedAgo: 4 * 60, driverId: 'd2', driverStatus: 'accepted', tip: 3000 }),
    active({ sedeId: 'cedritos', zone: 'cedritos', addr: { address: 'Calle 147 # 17-08', place: { calle: 147, carrera: 17 } }, lines: [['churrasco', 1], ['patacon', 1], ['aguaGas', 2]], payment: 'cash', name: 'Gloria P.', createdAgo: 19 * 60, stage: 'ready', prepMin: 15, acceptedAgo: 18 * 60, readyAgo: 2 * 60 }),
    active({ sedeId: 'chapinero', zone: 'chapinero', addr: { address: 'Calle 70 # 12-33', place: { calle: 70, carrera: 12 } }, lines: [['sancocho', 1], ['natas', 1]], payment: 'daviplata', name: 'Hernán U.', createdAgo: 9 * 60, stage: 'preparing', prepMin: 20, acceptedAgo: 8 * 60, driverId: 'd3', driverStatus: 'offered' }),
    active({ sedeId: 'usaquen', zone: 'usaquen', addr: { address: 'Carrera 7 # 124-20', place: { calle: 124, carrera: 7 } }, lines: [['empanadas', 2], ['limonada', 1]], payment: 'pse', name: 'Lina K.', createdAgo: 15, stage: 'pending' }),
  );

  return { orders, nextSeq: seq };
}

/** Recomputa la tarifa base (sin club ni lluvia) para mostrarla en el listado de sedes. */
export function baseFeeFor(place: Place, sedeId: SedeId): number {
  return deliveryFee(km(place, SEDE_BY_ID[sedeId].place));
}
