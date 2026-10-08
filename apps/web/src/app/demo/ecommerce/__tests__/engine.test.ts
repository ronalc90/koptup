/**
 * Lógica de la demo de tienda: reglas de precio, datos de ejemplo
 * deterministas y reportes calculados (nada escrito a mano).
 */
import { priceCart, DEFAULT_RULES, FREE_SHIPPING_FROM, SHIPPING_FEE } from '../components/pricing';
import { PRODUCTS, COFFEE_ID, totalStock } from '../components/products';
import { SAMPLE, generateSampleData, nitCheckDigit, formatNit, CITY_BY_ID } from '../components/data';
import {
  computeKpis, inWindow, dailySeries, salesByProduct, salesByCategory, computeInsights, riskQueue,
  automationAudience, luhnValid, expiryValid, mobileValid, toCsv, DAY, type Clock,
} from '../components/analytics';

const clock: Clock = { start: null, now: null };
const line = (id: number, qty: number) => {
  const p = PRODUCTS.find((x) => x.id === id)!;
  return { productId: id, qty, unitPrice: p.price, category: p.category };
};

describe('priceCart', () => {
  it('cobra envío por debajo del mínimo y lo regala desde $ 150.000', () => {
    const small = priceCart([line(COFFEE_ID, 1)], DEFAULT_RULES);
    expect(small.shipping).toBe(SHIPPING_FEE);
    expect(small.total).toBe(38900 + SHIPPING_FEE);
    const big = priceCart([line(COFFEE_ID, 3), line(15, 1)], DEFAULT_RULES);
    expect(big.net).toBeGreaterThanOrEqual(FREE_SHIPPING_FROM);
    expect(big.shipping).toBe(0);
  });

  it('aplica el 10 % sobre $ 300.000 y el cupón BIENVENIDA10 encima', () => {
    const r = priceCart([line(4, 1)], DEFAULT_RULES, 'BIENVENIDA10');
    expect(r.adjustments.map((a) => a.key)).toEqual(['volume10', 'coupon']);
    expect(r.adjustments[0].amount).toBe(59900);
    expect(r.adjustments[1].amount).toBe(Math.round((599000 - 59900) * 0.1));
    expect(r.ivaIncluded).toBe(Math.round(r.net - r.net / 1.19));
  });

  it('respeta las reglas desactivadas y las opcionales', () => {
    const off = priceCart([line(4, 1)], { ...DEFAULT_RULES, volume10: false, freeShipping: false });
    expect(off.discount).toBe(0);
    expect(off.shipping).toBe(SHIPPING_FEE);
    const promo = priceCart([line(COFFEE_ID, 3), line(23, 1)], { ...DEFAULT_RULES, coffee3x2: true, wine15: true });
    expect(promo.adjustments.find((a) => a.key === 'coffee3x2')?.amount).toBe(38900);
    expect(promo.adjustments.find((a) => a.key === 'wine15')?.amount).toBe(Math.round(89900 * 0.15));
  });

  it('ignora cupones que no existen', () => {
    expect(priceCart([line(COFFEE_ID, 1)], DEFAULT_RULES, 'NOEXISTE').discount).toBe(0);
  });
});

describe('datos de ejemplo', () => {
  it('son deterministas (mismo resultado en servidor y navegador)', () => {
    const again = generateSampleData();
    expect(again.orders.map((o) => [o.id, o.total, o.status])).toEqual(SAMPLE.orders.map((o) => [o.id, o.total, o.status]));
  });

  it('tienen pedidos coherentes: totales, ciudades y numeración', () => {
    SAMPLE.orders.forEach((o) => {
      expect(o.total).toBe(o.net + o.shipping);
      expect(o.net).toBe(o.subtotal - o.discount);
      expect(CITY_BY_ID[o.cityId]).toBeDefined();
    });
    expect(SAMPLE.orders[SAMPLE.orders.length - 1].id).toBe('TDA-1001');
    expect(SAMPLE.nextOrderSeq).toBe(1001 + SAMPLE.orders.length);
  });

  it('calcula KPIs, series y categorías que cuadran entre sí', () => {
    const last30 = inWindow(SAMPLE.orders, clock, 0, 30 * DAY);
    const k = computeKpis(last30);
    const series = dailySeries(SAMPLE.orders, clock, 30);
    expect(series.reduce((s, d) => s + d.sales, 0)).toBeCloseTo(k.sales, 0);
    const cats = salesByCategory(salesByProduct(last30, PRODUCTS));
    expect(cats.reduce((s, c) => s + c.sales, 0)).toBeCloseTo(k.sales, 0);
    expect(k.ticket).toBeCloseTo(k.sales / k.orders, 5);
  });

  it('genera recomendaciones por reglas, revisión de riesgo y audiencias', () => {
    const insights = computeInsights(SAMPLE.orders, PRODUCTS, clock);
    const restock = insights.find((i) => i.kind === 'restock');
    expect(restock && restock.kind === 'restock' ? restock.stock : -1).toBe(totalStock(PRODUCTS.find((p) => p.id === 15)!));
    expect(riskQueue(SAMPLE.orders, PRODUCTS, clock).map((r) => r.flags[0]).sort()).toEqual(['codHigh', 'firstOrderHigh']);
    expect(automationAudience('postPurchase', SAMPLE.orders, clock).length).toBeGreaterThan(0);
  });
});

describe('validaciones y utilidades', () => {
  it('valida tarjetas (Luhn), vencimiento y celulares', () => {
    expect(luhnValid('4242 4242 4242 4242')).toBe(true);
    expect(luhnValid('4242 4242 4242 4241')).toBe(false);
    const oct2026 = new Date(2026, 9, 8).getTime();
    expect(expiryValid('12/29', oct2026)).toBe(true);
    expect(expiryValid('09/26', oct2026)).toBe(false);
    expect(mobileValid('300 123 4567')).toBe(true);
    expect(mobileValid('6011234567')).toBe(false);
  });

  it('calcula el dígito de verificación del NIT', () => {
    expect(nitCheckDigit('901555010')).toBe(4);
    expect(nitCheckDigit('900123456')).toBe(8);
    expect(formatNit('901555010')).toBe('901.555.010-4');
  });

  it('escapa el CSV', () => {
    expect(toCsv([['a', 'b,c', 'd"e']])).toBe('﻿a,"b,c","d""e"');
  });
});
