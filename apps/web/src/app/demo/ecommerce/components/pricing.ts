// Precios, reglas de precio y cupones de la tienda de ejemplo.
//
// Reglas de ejemplo (Colombia): los precios ya incluyen IVA (19 %, tarifa
// general), el envío cuesta $ 9.900 y es gratis desde $ 150.000 si la regla está
// activa. Las reglas que el panel de la tienda activa o desactiva se aplican de
// verdad en el carrito con esta función.

import type { ProductCategory } from './products';
import { COFFEE_ID } from './products';

export const IVA_RATE = 0.19;
export const SHIPPING_FEE = 9900;
export const FREE_SHIPPING_FROM = 150000;
export const VOLUME_DISCOUNT_FROM = 300000;
export const VOLUME_DISCOUNT_RATE = 0.1;
export const WINE_DISCOUNT_RATE = 0.15;

/** Cupones válidos en la demo (código → % de descuento). */
export const COUPONS: Record<string, number> = {
  BIENVENIDA10: 0.1,
};

export type RuleId = 'volume10' | 'freeShipping' | 'coffee3x2' | 'wine15';
export const RULE_IDS: RuleId[] = ['volume10', 'freeShipping', 'coffee3x2', 'wine15'];
export type PricingRules = Record<RuleId, boolean>;
export const DEFAULT_RULES: PricingRules = {
  volume10: true,
  freeShipping: true,
  coffee3x2: false,
  wine15: false,
};

export interface PricingLine {
  productId: number;
  qty: number;
  unitPrice: number;
  category: ProductCategory;
}

export type AdjustmentKey = RuleId | 'coupon';

export interface CartPricing {
  /** Suma de precio × cantidad (IVA incluido). */
  subtotal: number;
  adjustments: Array<{ key: AdjustmentKey; amount: number }>;
  discount: number;
  /** Subtotal menos descuentos (valor de los productos). */
  net: number;
  shipping: number;
  /** IVA contenido en el valor de los productos. */
  ivaIncluded: number;
  total: number;
}

export function priceCart(lines: PricingLine[], rules: PricingRules, couponCode?: string | null): CartPricing {
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const adjustments: CartPricing['adjustments'] = [];

  if (rules.wine15) {
    const wines = lines.filter((l) => l.category === 'wines').reduce((s, l) => s + l.unitPrice * l.qty, 0);
    const amount = Math.round(wines * WINE_DISCOUNT_RATE);
    if (amount > 0) adjustments.push({ key: 'wine15', amount });
  }
  if (rules.coffee3x2) {
    const coffee = lines.find((l) => l.productId === COFFEE_ID);
    const free = coffee ? Math.floor(coffee.qty / 3) : 0;
    if (coffee && free > 0) adjustments.push({ key: 'coffee3x2', amount: free * coffee.unitPrice });
  }
  const afterRules = subtotal - adjustments.reduce((s, a) => s + a.amount, 0);
  if (rules.volume10 && afterRules > VOLUME_DISCOUNT_FROM) {
    adjustments.push({ key: 'volume10', amount: Math.round(afterRules * VOLUME_DISCOUNT_RATE) });
  }
  const rate = couponCode ? COUPONS[couponCode] ?? 0 : 0;
  if (rate > 0) {
    const base = subtotal - adjustments.reduce((s, a) => s + a.amount, 0);
    const amount = Math.round(base * rate);
    if (amount > 0) adjustments.push({ key: 'coupon', amount });
  }

  const discount = adjustments.reduce((s, a) => s + a.amount, 0);
  const net = Math.max(0, subtotal - discount);
  const shipping = net === 0 ? 0 : rules.freeShipping && net >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
  const ivaIncluded = Math.round(net - net / (1 + IVA_RATE));
  return { subtotal, adjustments, discount, net, shipping, ivaIncluded, total: net + shipping };
}

// ---------------------------------------------------------------------------
// Formato: pesos colombianos sin decimales, formato es-CO ("$ 6.499.000") en
// ambos idiomas, para que servidor y navegador rendericen exactamente lo mismo.
// ---------------------------------------------------------------------------
const COP_FORMAT = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const NUMBER_FORMAT = new Intl.NumberFormat('es-CO');
const DECIMAL_FORMAT = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });

export function formatPrice(amount: number): string {
  return COP_FORMAT.format(Math.round(amount));
}

export function formatNumber(value: number): string {
  return NUMBER_FORMAT.format(Math.round(value));
}

export function formatDecimal(value: number): string {
  return DECIMAL_FORMAT.format(value);
}

/** Millones de pesos con un decimal: "$ 186,4 M". */
export function formatMillions(amount: number): string {
  return `$ ${DECIMAL_FORMAT.format(amount / 1_000_000)} M`;
}
