// Datos de ejemplo de la tienda: ciudades, clientes ficticios, medios de pago,
// transportadoras y 30 días de pedidos generados de forma determinista (misma
// semilla → mismos pedidos en el servidor y en el navegador, sin errores de
// hidratación). Todos los reportes de la demo se calculan con estos pedidos más
// los que el visitante hace en la propia demo.
//
// Los clientes son combinaciones de nombres y apellidos comunes en Colombia; no
// corresponden a personas reales.

import { PRODUCTS, COFFEE_ID, type Product, type WarehouseId } from './products';
import { priceCart, DEFAULT_RULES, type CartPricing } from './pricing';

// ---------------------------------------------------------------------------
// Ciudades (departamento, bodega que despacha y días hábiles de entrega)
// ---------------------------------------------------------------------------
export interface City {
  id: string;
  name: string;
  department: string;
  warehouse: WarehouseId;
  days: [number, number];
  weight: number;
}

export const CITIES: City[] = [
  { id: 'bogota',        name: 'Bogotá',        department: 'Bogotá D.C.',     warehouse: 'bog', days: [1, 2], weight: 34 },
  { id: 'medellin',      name: 'Medellín',      department: 'Antioquia',       warehouse: 'mde', days: [1, 2], weight: 18 },
  { id: 'cali',          name: 'Cali',          department: 'Valle del Cauca', warehouse: 'cli', days: [1, 2], weight: 12 },
  { id: 'barranquilla',  name: 'Barranquilla',  department: 'Atlántico',       warehouse: 'mde', days: [2, 4], weight: 9 },
  { id: 'cartagena',     name: 'Cartagena',     department: 'Bolívar',         warehouse: 'mde', days: [2, 4], weight: 6 },
  { id: 'bucaramanga',   name: 'Bucaramanga',   department: 'Santander',       warehouse: 'bog', days: [2, 3], weight: 6 },
  { id: 'pereira',       name: 'Pereira',       department: 'Risaralda',       warehouse: 'mde', days: [2, 3], weight: 4 },
  { id: 'ibague',        name: 'Ibagué',        department: 'Tolima',          warehouse: 'bog', days: [2, 3], weight: 3 },
  { id: 'villavicencio', name: 'Villavicencio', department: 'Meta',            warehouse: 'bog', days: [2, 3], weight: 3 },
  { id: 'manizales',     name: 'Manizales',     department: 'Caldas',          warehouse: 'mde', days: [2, 3], weight: 3 },
  { id: 'pasto',         name: 'Pasto',         department: 'Nariño',          warehouse: 'cli', days: [3, 5], weight: 2 },
];

export const CITY_BY_ID: Record<string, City> = Object.fromEntries(CITIES.map((c) => [c.id, c]));

export const WAREHOUSES: Array<{ id: WarehouseId; city: string; capacity: number }> = [
  { id: 'bog', city: 'Bogotá', capacity: 1200 },
  { id: 'mde', city: 'Medellín', capacity: 900 },
  { id: 'cli', city: 'Cali', capacity: 600 },
];

// ---------------------------------------------------------------------------
// Medios de pago y transportadoras
// ---------------------------------------------------------------------------
export type PaymentMethodId = 'card' | 'pse' | 'nequi' | 'daviplata' | 'cod' | 'addi';
export const PAYMENT_METHODS: PaymentMethodId[] = ['card', 'pse', 'nequi', 'daviplata', 'cod', 'addi'];
const METHOD_WEIGHTS: Record<PaymentMethodId, number> = { pse: 30, card: 27, nequi: 18, cod: 12, daviplata: 7, addi: 6 };
/** Monto mínimo de ejemplo para pagar a cuotas con Addi. */
export const ADDI_MIN = 150000;

export type CarrierId = 'coordinadora' | 'servientrega' | 'interrapidisimo' | 'tcc';
export interface Carrier { id: CarrierId; prefix: string; base: number; extraDays: number; rating: number }
// Tarifas ilustrativas en COP por paquete estándar (no son cotizaciones reales).
export const CARRIERS: Carrier[] = [
  { id: 'coordinadora',    prefix: 'COO', base: 11500, extraDays: 0, rating: 4.4 },
  { id: 'servientrega',    prefix: 'SER', base: 12900, extraDays: 0, rating: 4.3 },
  { id: 'interrapidisimo', prefix: 'INT', base: 9800,  extraDays: 1, rating: 4.2 },
  { id: 'tcc',             prefix: 'TCC', base: 13900, extraDays: 1, rating: 4.1 },
];
export const CARRIER_BY_ID: Record<CarrierId, Carrier> = Object.fromEntries(CARRIERS.map((c) => [c.id, c])) as Record<CarrierId, Carrier>;

/** Tarifa de ejemplo: base de la transportadora + recargo si la ciudad no tiene bodega propia. */
export function carrierQuote(carrier: Carrier, city: City): { cost: number; days: [number, number] } {
  const remote = city.days[1] - 2;
  return {
    cost: carrier.base + Math.max(0, remote) * 2500,
    days: [city.days[0] + carrier.extraDays, city.days[1] + carrier.extraDays],
  };
}

/** Pasos del seguimiento de un envío (simulado en la demo). */
export const TRACKING_STEPS = ['labelCreated', 'pickedUp', 'inTransit', 'outForDelivery', 'delivered'] as const;
export const LAST_TRACKING_STEP = TRACKING_STEPS.length - 1;

// ---------------------------------------------------------------------------
// Pedidos
// ---------------------------------------------------------------------------
export type OrderStatus = 'new' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
export const ORDER_FLOW: OrderStatus[] = ['new', 'preparing', 'shipped', 'delivered'];

export interface OrderLine {
  productId: number;
  qty: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  customerId: string;
  customer: string;
  cityId: string;
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  net: number;
  shipping: number;
  ivaIncluded: number;
  total: number;
  coupon?: string;
  method: PaymentMethodId;
  paid: boolean;
  status: OrderStatus;
  /** Antigüedad en minutos al abrir la demo (pedidos de ejemplo). */
  ageMin?: number;
  /** Fecha real de creación (pedidos hechos en la demo). */
  createdAt?: number;
  demo?: boolean;
  email?: string;
  phone?: string;
  docType?: string;
  docNumber?: string;
  address?: string;
  company?: string;
  cufe?: string;
  warehouse: WarehouseId;
  carrier?: CarrierId;
  guide?: string;
  trackingStep?: number;
  riskReview?: 'approved' | 'rejected';
}

export type ReturnReason = 'retracto' | 'warranty' | 'size' | 'notAsDescribed';
export const RETURN_REASONS: ReturnReason[] = ['retracto', 'warranty', 'size', 'notAsDescribed'];
export type ReturnStatus = 'pending' | 'approved' | 'rejected';

export interface ReturnRequest {
  id: string;
  orderId: string;
  productId: number;
  qty: number;
  reason: ReturnReason;
  status: ReturnStatus;
  amount: number;
  restocked?: boolean;
  createdAt?: number;
  ageMin?: number;
}

// ---------------------------------------------------------------------------
// Generador determinista
// ---------------------------------------------------------------------------
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T>(rnd: () => number, items: T[], weight: (item: T) => number): T {
  const total = items.reduce((s, i) => s + weight(i), 0);
  let r = rnd() * total;
  for (const item of items) {
    r -= weight(item);
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

const FIRST_NAMES = [
  'María Fernanda', 'Juan Camilo', 'Valentina', 'Santiago', 'Daniela', 'Andrés', 'Laura', 'Carlos',
  'Natalia', 'Sebastián', 'Camila', 'Felipe', 'Paula', 'Julián', 'Catalina', 'Diego', 'Manuela',
  'Alejandro', 'Sara', 'Mateo', 'Luisa', 'Nicolás', 'Ana María', 'David', 'Isabela', 'Jorge',
  'Mariana', 'Esteban', 'Carolina', 'Óscar',
];
const LAST_NAMES = [
  'Rojas', 'Gómez', 'Martínez', 'Rodríguez', 'López', 'Hernández', 'García', 'Díaz', 'Moreno',
  'Castro', 'Vargas', 'Ramírez', 'Torres', 'Ortiz', 'Jiménez', 'Ruiz', 'Suárez', 'Mejía', 'Cárdenas',
  'Ospina', 'Restrepo', 'Salazar', 'Pineda', 'Arango', 'Quintero', 'Ríos', 'Valencia', 'Montoya',
  'Cortés', 'Bermúdez',
];

export interface Customer { id: string; name: string; cityId: string }

function buildCustomers(rnd: () => number, count: number): Customer[] {
  const used = new Set<string>();
  const out: Customer[] = [];
  while (out.length < count) {
    const name = `${FIRST_NAMES[Math.floor(rnd() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(rnd() * LAST_NAMES.length)]}`;
    if (used.has(name)) continue;
    used.add(name);
    out.push({ id: `C-${String(out.length + 1).padStart(4, '0')}`, name, cityId: pickWeighted(rnd, CITIES, (c) => c.weight).id });
  }
  return out;
}

/** Productos que suelen comprarse juntos en los datos de ejemplo. */
const COMPANIONS: Record<number, { id: number; p: number }> = {
  [COFFEE_ID]: { id: 15, p: 0.3 },  // café → prensa francesa
  17: { id: 20, p: 0.25 },          // tenis de running → maletín deportivo
  23: { id: 24, p: 0.3 },           // malbec → chardonnay
  2: { id: 7, p: 0.3 },             // smartphone → audífonos in-ear
};

export function orderPricing(lines: OrderLine[], products: Product[], coupon?: string | null): CartPricing {
  const byId = new Map(products.map((p) => [p.id, p]));
  return priceCart(
    lines.map((l) => ({ ...l, category: byId.get(l.productId)?.category ?? 'home' })),
    DEFAULT_RULES,
    coupon,
  );
}

export function orderNumber(seq: number): string {
  return `TDA-${seq}`;
}

export const FIRST_ORDER_SEQ = 1001;

function statusForAge(age: number, rnd: () => number): Pick<Order, 'status' | 'trackingStep'> {
  if (age < 120) return { status: 'new' };
  if (age < 1440) return { status: 'preparing' };
  if (age < 4320) return { status: 'shipped', trackingStep: age < 2160 ? 1 : age < 3600 ? 2 : 3 };
  if (rnd() < 0.02) return { status: 'cancelled' };
  return { status: 'delivered', trackingStep: LAST_TRACKING_STEP };
}

function buildOrder(
  seq: number,
  customer: Customer,
  lines: OrderLine[],
  method: PaymentMethodId,
  age: number,
  rnd: () => number,
  coupon?: string,
): Order {
  const pricing = orderPricing(lines, PRODUCTS, coupon);
  const city = CITY_BY_ID[customer.cityId];
  const { status, trackingStep } = statusForAge(age, rnd);
  const order: Order = {
    id: orderNumber(seq),
    customerId: customer.id,
    customer: customer.name,
    cityId: customer.cityId,
    lines,
    subtotal: pricing.subtotal,
    discount: pricing.discount,
    net: pricing.net,
    shipping: pricing.shipping,
    ivaIncluded: pricing.ivaIncluded,
    total: pricing.total,
    coupon,
    method,
    paid: method !== 'cod' || status === 'delivered',
    status,
    ageMin: Math.round(age),
    warehouse: city.warehouse,
  };
  if (status === 'shipped' || status === 'delivered') {
    const carrier = CARRIERS[seq % CARRIERS.length];
    order.carrier = carrier.id;
    order.guide = `${carrier.prefix}-${String(480000 + seq * 7).padStart(7, '0')}`;
    order.trackingStep = trackingStep;
  }
  return order;
}

export interface SampleData {
  customers: Customer[];
  orders: Order[];
  returns: ReturnRequest[];
  nextOrderSeq: number;
}

/** 30 días de pedidos de ejemplo, del más reciente al más antiguo. */
export function generateSampleData(): SampleData {
  const rnd = mulberry32(20261008);
  const customers = buildCustomers(rnd, 600);
  const loyal = customers.slice(0, 70);
  const products = PRODUCTS;

  type Draft = { customer: Customer; lines: OrderLine[]; method: PaymentMethodId; age: number; coupon?: string };
  const drafts: Draft[] = [];

  for (let d = 29; d >= 0; d--) {
    const weekendBump = d % 7 === 1 || d % 7 === 2 ? 3 : 0;
    const n = Math.round(9 + (29 - d) * 0.18 + weekendBump + rnd() * 5);
    for (let k = 0; k < n; k++) {
      const customer = rnd() < 0.22 ? loyal[Math.floor(rnd() * loyal.length)] : customers[Math.floor(rnd() * customers.length)];
      const nLines = rnd() < 0.62 ? 1 : rnd() < 0.8 ? 2 : 3;
      const lines: OrderLine[] = [];
      while (lines.length < nLines) {
        const p = pickWeighted(rnd, products, (x) => x.demand);
        if (lines.some((l) => l.productId === p.id)) continue;
        const qty = p.id === COFFEE_ID ? 1 + Math.floor(rnd() * 3) : rnd() < 0.06 ? 2 : 1;
        lines.push({ productId: p.id, qty, unitPrice: p.price });
        const companion = COMPANIONS[p.id];
        if (companion && rnd() < companion.p && !lines.some((l) => l.productId === companion.id)) {
          const c = products.find((x) => x.id === companion.id)!;
          lines.push({ productId: c.id, qty: 1, unitPrice: c.price });
        }
      }
      let method = pickWeighted(rnd, PAYMENT_METHODS, (m) => METHOD_WEIGHTS[m]);
      const gross = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
      if (method === 'addi' && gross < ADDI_MIN) method = 'pse';
      // Minutos dentro del día: más pedidos entre 8:00 y 22:00.
      const age = d * 1440 + Math.floor(rnd() * 1440);
      drafts.push({ customer, lines, method, age, coupon: rnd() < 0.12 ? 'BIENVENIDA10' : undefined });
    }
  }

  // Dos casos fijos para la revisión de riesgo (reglas de ejemplo), con
  // clientes nuevos que no tienen pedidos anteriores.
  const p2 = products.find((p) => p.id === 2)!;
  const p1 = products.find((p) => p.id === 1)!;
  const codCustomer: Customer = { id: 'C-0901', name: 'Julián Pineda', cityId: 'barranquilla' };
  const newCustomer: Customer = { id: 'C-0902', name: 'Carolina Bermúdez', cityId: 'cali' };
  customers.push(codCustomer, newCustomer);
  drafts.push({ customer: codCustomer, lines: [{ productId: p2.id, qty: 1, unitPrice: p2.price }], method: 'cod', age: 95 });
  drafts.push({ customer: newCustomer, lines: [{ productId: p1.id, qty: 1, unitPrice: p1.price }], method: 'card', age: 260 });

  // Numeración en orden cronológico: el más antiguo es TDA-1001.
  drafts.sort((a, b) => b.age - a.age);
  const orders = drafts.map((dr, i) => buildOrder(FIRST_ORDER_SEQ + i, dr.customer, dr.lines, dr.method, dr.age, rnd, dr.coupon));
  orders.reverse();

  // Devoluciones de ejemplo sobre pedidos entregados.
  const delivered = orders.filter((o) => o.status === 'delivered');
  const pickReturn = (pred: (o: Order) => boolean, from: number) => delivered.slice(from).find(pred);
  const isCat = (o: Order, cat: Product['category']) => o.lines.find((l) => products.find((p) => p.id === l.productId)?.category === cat);
  const seeds: Array<{ order?: Order; cat: Product['category']; reason: ReturnReason; status: ReturnStatus }> = [
    { order: pickReturn((o) => !!isCat(o, 'fashion'), 2), cat: 'fashion', reason: 'size', status: 'pending' },
    { order: pickReturn((o) => !!isCat(o, 'tech'), 4), cat: 'tech', reason: 'warranty', status: 'pending' },
    { order: pickReturn((o) => !!isCat(o, 'beauty'), 6), cat: 'beauty', reason: 'retracto', status: 'approved' },
    { order: pickReturn((o) => !!isCat(o, 'sports'), 12), cat: 'sports', reason: 'notAsDescribed', status: 'rejected' },
  ];
  const returns: ReturnRequest[] = [];
  seeds.forEach((s, i) => {
    if (!s.order) return;
    const line = isCat(s.order, s.cat)!;
    returns.push({
      id: `DEV-${String(301 + i)}`,
      orderId: s.order.id,
      productId: line.productId,
      qty: 1,
      reason: s.reason,
      status: s.status,
      amount: line.unitPrice,
      restocked: s.status === 'approved' && s.reason !== 'warranty',
      ageMin: Math.max(60, (s.order.ageMin ?? 0) - 2880),
    });
  });

  return { customers, orders, returns, nextOrderSeq: FIRST_ORDER_SEQ + orders.length };
}

export const SAMPLE = generateSampleData();

// ---------------------------------------------------------------------------
// Datos del vendedor (ficticios) para la factura de ejemplo
// ---------------------------------------------------------------------------
export const SELLER = {
  name: 'Tienda de Ejemplo S.A.S.',
  nit: '901555010',
  address: 'Calle 85 # 15-32, Bogotá D.C.',
  resolution: 'Resolución de facturación de ejemplo 18760000000000 · Prefijo TDA',
};

/** Dígito de verificación del NIT (algoritmo de la DIAN, módulo 11). */
export function nitCheckDigit(nit: string): number {
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const digits = nit.replace(/\D/g, '').split('').reverse().map(Number);
  const sum = digits.reduce((s, d, i) => s + d * weights[i], 0);
  const r = sum % 11;
  return r > 1 ? 11 - r : r;
}

export function formatNit(nit: string): string {
  const n = nit.replace(/\D/g, '');
  return `${n.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${nitCheckDigit(n)}`;
}
