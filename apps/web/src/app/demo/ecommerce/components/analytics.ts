// Cálculos de la demo: KPIs, series, rankings, recomendaciones por reglas,
// revisión de riesgo, audiencias de automatizaciones y exportación CSV.
// Todo sale de los pedidos y productos del estado: nada está escrito a mano.

import { COFFEE_ID, CATEGORY_IDS, totalStock, type Product, type ProductCategory } from './products';
import { CITY_BY_ID, PAYMENT_METHODS, type Order, type PaymentMethodId } from './data';

export const DAY = 1440;

/** Reloj de la sesión: `start` es cuándo se abrió la demo y `now` el instante actual (ambos null en el servidor). */
export interface Clock {
  start: number | null;
  now: number | null;
}

/** Antigüedad del pedido en minutos. */
export function orderAge(o: Pick<Order, 'ageMin' | 'createdAt'>, clock: Clock): number {
  if (o.createdAt != null) {
    return clock.now != null ? Math.max(0, (clock.now - o.createdAt) / 60000) : 0;
  }
  const base = o.ageMin ?? 0;
  return clock.now != null && clock.start != null ? base + Math.max(0, (clock.now - clock.start) / 60000) : base;
}

export type AgeParts = { unit: 'now' | 'min' | 'h' | 'd'; n: number };
export function ageParts(minutes: number): AgeParts {
  if (minutes < 1) return { unit: 'now', n: 0 };
  if (minutes < 60) return { unit: 'min', n: Math.floor(minutes) };
  if (minutes < DAY) return { unit: 'h', n: Math.floor(minutes / 60) };
  return { unit: 'd', n: Math.floor(minutes / DAY) };
}

/** Pedidos (no cancelados) con antigüedad en [fromMin, toMin). */
export function inWindow(orders: Order[], clock: Clock, fromMin: number, toMin: number): Order[] {
  return orders.filter((o) => {
    if (o.status === 'cancelled') return false;
    const a = orderAge(o, clock);
    return a >= fromMin && a < toMin;
  });
}

export interface Kpis {
  sales: number;
  orders: number;
  ticket: number;
  units: number;
  customers: number;
  repeatRate: number;
}

export function computeKpis(orders: Order[]): Kpis {
  const sales = orders.reduce((s, o) => s + o.net, 0);
  const units = orders.reduce((s, o) => s + o.lines.reduce((u, l) => u + l.qty, 0), 0);
  const perCustomer = new Map<string, number>();
  orders.forEach((o) => perCustomer.set(o.customerId, (perCustomer.get(o.customerId) ?? 0) + 1));
  const repeat = [...perCustomer.values()].filter((n) => n > 1).length;
  return {
    sales,
    orders: orders.length,
    ticket: orders.length ? sales / orders.length : 0,
    units,
    customers: perCustomer.size,
    repeatRate: perCustomer.size ? (repeat / perCustomer.size) * 100 : 0,
  };
}

/** Variación % de `value` frente al promedio diario de los 7 días anteriores. */
export function deltaVsWeek(orders: Order[], clock: Clock, pick: (k: Kpis) => number): number | null {
  const today = pick(computeKpis(inWindow(orders, clock, 0, DAY)));
  const days = Array.from({ length: 7 }, (_, i) => pick(computeKpis(inWindow(orders, clock, (i + 1) * DAY, (i + 2) * DAY))));
  const avg = days.reduce((s, v) => s + v, 0) / days.length;
  if (!avg) return null;
  return ((today - avg) / avg) * 100;
}

/** Ventas netas por día; índice 0 = hace `days - 1` días, último = últimas 24 h. */
export function dailySeries(orders: Order[], clock: Clock, days: number): Array<{ daysAgo: number; sales: number; orders: number }> {
  const out = Array.from({ length: days }, (_, i) => ({ daysAgo: days - 1 - i, sales: 0, orders: 0 }));
  orders.forEach((o) => {
    if (o.status === 'cancelled') return;
    const d = Math.floor(orderAge(o, clock) / DAY);
    if (d < days) {
      const slot = out[days - 1 - d];
      slot.sales += o.net;
      slot.orders += 1;
    }
  });
  return out;
}

/** Valor neto de cada línea (los descuentos del pedido se reparten en proporción). */
function lineNet(o: Order, lineGross: number): number {
  return o.subtotal ? (lineGross * o.net) / o.subtotal : 0;
}

export interface ProductSales { product: Product; units: number; sales: number }

export function salesByProduct(orders: Order[], products: Product[]): ProductSales[] {
  const map = new Map<number, ProductSales>();
  products.forEach((p) => map.set(p.id, { product: p, units: 0, sales: 0 }));
  orders.forEach((o) => {
    if (o.status === 'cancelled') return;
    o.lines.forEach((l) => {
      const row = map.get(l.productId);
      if (!row) return;
      row.units += l.qty;
      row.sales += lineNet(o, l.unitPrice * l.qty);
    });
  });
  return [...map.values()].sort((a, b) => b.units - a.units || b.sales - a.sales);
}

export function salesByCategory(rows: ProductSales[]): Array<{ key: ProductCategory; sales: number; pct: number }> {
  const total = rows.reduce((s, r) => s + r.sales, 0) || 1;
  return CATEGORY_IDS.map((key) => {
    const sales = rows.filter((r) => r.product.category === key).reduce((s, r) => s + r.sales, 0);
    return { key, sales, pct: (sales / total) * 100 };
  }).sort((a, b) => b.sales - a.sales);
}

export function salesByCity(orders: Order[]): Array<{ cityId: string; sales: number; orders: number }> {
  const map = new Map<string, { cityId: string; sales: number; orders: number }>();
  orders.forEach((o) => {
    const row = map.get(o.cityId) ?? { cityId: o.cityId, sales: 0, orders: 0 };
    row.sales += o.net;
    row.orders += 1;
    map.set(o.cityId, row);
  });
  return [...map.values()].sort((a, b) => b.sales - a.sales);
}

export function ordersByMethod(orders: Order[]): Array<{ method: PaymentMethodId; orders: number; pct: number }> {
  const total = orders.length || 1;
  return PAYMENT_METHODS.map((method) => {
    const n = orders.filter((o) => o.method === method).length;
    return { method, orders: n, pct: (n / total) * 100 };
  }).sort((a, b) => b.orders - a.orders);
}

/** Productos más vendidos en los últimos 30 días (para la tienda y el panel). */
export function bestsellerIds(orders: Order[], products: Product[], clock: Clock, n = 6): number[] {
  return salesByProduct(inWindow(orders, clock, 0, 30 * DAY), products)
    .filter((r) => r.units > 0 && !r.product.hidden)
    .slice(0, n)
    .map((r) => r.product.id);
}

// ---------------------------------------------------------------------------
// Recomendaciones calculadas con reglas (no es IA)
// ---------------------------------------------------------------------------
export type Insight =
  | { kind: 'restock'; product: Product; days: number; stock: number }
  | { kind: 'pair'; a: Product; b: Product; pct: number; count: number }
  | { kind: 'trend'; category: ProductCategory; pct: number }
  | { kind: 'wallets'; pct: number };

export function coverageDays(stock: number, units30: number): number | null {
  if (units30 <= 0) return null;
  return stock / (units30 / 30);
}

export function computeInsights(orders: Order[], products: Product[], clock: Clock): Insight[] {
  const last30 = inWindow(orders, clock, 0, 30 * DAY);
  const rows = salesByProduct(last30, products);
  const insights: Insight[] = [];

  const restock = rows
    .map((r) => ({ r, days: coverageDays(totalStock(r.product), r.units) }))
    .filter((x): x is { r: ProductSales; days: number } => x.days !== null && x.days < 21 && !x.r.product.hidden)
    .sort((a, b) => a.days - b.days);
  if (restock[0]) insights.push({ kind: 'restock', product: restock[0].r.product, days: restock[0].days, stock: totalStock(restock[0].r.product) });

  // Par de productos que más se compra junto (soporte mínimo de 5 pedidos).
  const byId = new Map(products.map((p) => [p.id, p]));
  const withProduct = new Map<number, number>();
  const pairs = new Map<string, number>();
  last30.forEach((o) => {
    const ids = [...new Set(o.lines.map((l) => l.productId))].sort((a, b) => a - b);
    ids.forEach((id) => withProduct.set(id, (withProduct.get(id) ?? 0) + 1));
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const k = `${ids[i]}-${ids[j]}`;
        pairs.set(k, (pairs.get(k) ?? 0) + 1);
      }
    }
  });
  let best: { a: number; b: number; pct: number; count: number } | null = null;
  pairs.forEach((count, k) => {
    if (count < 5) return;
    const [x, y] = k.split('-').map(Number);
    // Se expresa desde el producto con menos pedidos ("de los pedidos con A, el X % incluye B").
    const [a, b] = (withProduct.get(x) ?? 0) <= (withProduct.get(y) ?? 0) ? [x, y] : [y, x];
    const pct = (count / (withProduct.get(a) ?? 1)) * 100;
    if (!best || pct > best.pct) best = { a, b, pct, count };
  });
  const bestPair = best as { a: number; b: number; pct: number; count: number } | null;
  if (bestPair && byId.get(bestPair.a) && byId.get(bestPair.b)) {
    insights.push({ kind: 'pair', a: byId.get(bestPair.a)!, b: byId.get(bestPair.b)!, pct: bestPair.pct, count: bestPair.count });
  }

  // Categoría con el mayor cambio: últimos 7 días frente a los 7 anteriores.
  const thisWeek = salesByCategory(salesByProduct(inWindow(orders, clock, 0, 7 * DAY), products));
  const prevWeek = salesByCategory(salesByProduct(inWindow(orders, clock, 7 * DAY, 14 * DAY), products));
  let trend: { category: ProductCategory; pct: number } | null = null;
  thisWeek.forEach((c) => {
    const prev = prevWeek.find((p) => p.key === c.key)?.sales ?? 0;
    if (prev <= 0) return;
    const pct = ((c.sales - prev) / prev) * 100;
    if (!trend || Math.abs(pct) > Math.abs(trend.pct)) trend = { category: c.key, pct };
  });
  const bestTrend = trend as { category: ProductCategory; pct: number } | null;
  if (bestTrend) insights.push({ kind: 'trend', category: bestTrend.category, pct: bestTrend.pct });

  const wallets = last30.filter((o) => o.method === 'nequi' || o.method === 'daviplata').length;
  if (last30.length) insights.push({ kind: 'wallets', pct: (wallets / last30.length) * 100 });

  return insights;
}

// ---------------------------------------------------------------------------
// Revisión de riesgo con reglas de ejemplo
// ---------------------------------------------------------------------------
export type RiskRule = 'codHigh' | 'firstOrderHigh' | 'bulkTech';
export const COD_LIMIT = 1500000;
export const FIRST_ORDER_LIMIT = 4000000;

export function riskFlags(order: Order, orders: Order[], products: Product[], clock: Clock): RiskRule[] {
  const flags: RiskRule[] = [];
  if (order.method === 'cod' && order.total >= COD_LIMIT) flags.push('codHigh');
  const age = orderAge(order, clock);
  const earlier = orders.some((o) => o.id !== order.id && o.customerId === order.customerId && orderAge(o, clock) > age);
  if (!earlier && order.total >= FIRST_ORDER_LIMIT) flags.push('firstOrderHigh');
  const byId = new Map(products.map((p) => [p.id, p]));
  if (order.lines.some((l) => l.qty >= 3 && byId.get(l.productId)?.category === 'tech')) flags.push('bulkTech');
  return flags;
}

/** Pedidos aún no despachados que cumplen alguna regla (incluye los ya revisados). */
export function riskQueue(orders: Order[], products: Product[], clock: Clock): Array<{ order: Order; flags: RiskRule[] }> {
  return orders
    .filter((o) => o.status === 'new' || o.status === 'preparing' || o.riskReview)
    .map((order) => ({ order, flags: riskFlags(order, orders, products, clock) }))
    .filter((x) => x.flags.length > 0);
}

// ---------------------------------------------------------------------------
// Audiencias de las automatizaciones de marketing (calculadas con los pedidos)
// ---------------------------------------------------------------------------
export type AutomationId = 'postPurchase' | 'winBack' | 'replenishment';
export const AUTOMATION_IDS: AutomationId[] = ['postPurchase', 'winBack', 'replenishment'];

export function automationAudience(id: AutomationId, orders: Order[], clock: Clock): Array<{ customerId: string; customer: string }> {
  const valid = orders.filter((o) => o.status !== 'cancelled');
  const lastByCustomer = new Map<string, { age: number; customer: string }>();
  valid.forEach((o) => {
    const a = orderAge(o, clock);
    const prev = lastByCustomer.get(o.customerId);
    if (!prev || a < prev.age) lastByCustomer.set(o.customerId, { age: a, customer: o.customer });
  });
  const uniq = (list: Order[]) => {
    const m = new Map<string, string>();
    list.forEach((o) => m.set(o.customerId, o.customer));
    return [...m.entries()].map(([customerId, customer]) => ({ customerId, customer }));
  };
  if (id === 'postPurchase') {
    return uniq(valid.filter((o) => o.status === 'delivered' && orderAge(o, clock) < 7 * DAY));
  }
  if (id === 'winBack') {
    return [...lastByCustomer.entries()]
      .filter(([, v]) => v.age >= 21 * DAY)
      .map(([customerId, v]) => ({ customerId, customer: v.customer }));
  }
  // Reposición: compraron café hace 20–30 días y no han vuelto a comprarlo.
  const coffee = valid.filter((o) => o.lines.some((l) => l.productId === COFFEE_ID));
  const lastCoffee = new Map<string, { age: number; customer: string }>();
  coffee.forEach((o) => {
    const a = orderAge(o, clock);
    const prev = lastCoffee.get(o.customerId);
    if (!prev || a < prev.age) lastCoffee.set(o.customerId, { age: a, customer: o.customer });
  });
  return [...lastCoffee.entries()]
    .filter(([, v]) => v.age >= 20 * DAY && v.age < 30 * DAY)
    .map(([customerId, v]) => ({ customerId, customer: v.customer }));
}

// ---------------------------------------------------------------------------
// CSV y descargas
// ---------------------------------------------------------------------------
export function toCsv(rows: Array<Array<string | number>>): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + rows.map((r) => r.map(esc).join(',')).join('\r\n');
}

export function downloadBlob(filename: string, content: BlobPart, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Fecha local "AAAA-MM-DD HH:mm" (solo en manejadores de eventos, nunca en el render). */
export function localStamp(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function cityLabel(cityId: string): string {
  const c = CITY_BY_ID[cityId];
  return c ? c.name : cityId;
}

// ---------------------------------------------------------------------------
// Validaciones del pago simulado
// ---------------------------------------------------------------------------
export function luhnValid(num: string): boolean {
  const digits = num.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export function cardBrand(num: string): 'visa' | 'mastercard' | 'amex' | null {
  const d = num.replace(/\D/g, '');
  if (/^4/.test(d)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'mastercard';
  if (/^3[47]/.test(d)) return 'amex';
  return null;
}

/** MM/AA no vencida respecto al mes actual (se evalúa al pagar). */
export function expiryValid(value: string, nowMs: number): boolean {
  const m = value.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date(nowMs);
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
}

/** Tarjeta de prueba que la pasarela simulada rechaza (como las tarjetas de prueba de las pasarelas). */
export const DECLINED_TEST_CARD = '4000000000000002';

/** Celular colombiano: 10 dígitos que empiezan por 3. */
export function mobileValid(v: string): boolean {
  return /^3\d{9}$/.test(v.replace(/\D/g, '').replace(/^57(?=3\d{9}$)/, ''));
}

export function emailValid(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

/**
 * CUFE de ejemplo: SHA-384 (como lo define la DIAN) sobre los datos del pedido
 * y una clave técnica ficticia. Se calcula en el navegador y no se envía a la DIAN.
 */
export async function computeCufe(fields: string[]): Promise<string | null> {
  try {
    if (typeof crypto === 'undefined' || !crypto.subtle) return null;
    const data = new TextEncoder().encode(fields.join(''));
    const hash = await crypto.subtle.digest('SHA-384', data);
    return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return null;
  }
}
