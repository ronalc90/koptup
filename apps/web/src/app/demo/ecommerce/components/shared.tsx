'use client';

import { createContext, useContext, useState, useMemo, useCallback, useEffect, ReactNode } from 'react';
import { Product } from './products';

// ---------------------------------------------------------------------------
// Cart context — single source of truth shared across Storefront / Checkout.
// ---------------------------------------------------------------------------

export interface CartLine {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  add: (product: Product, qty?: number) => void;
  setQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  recentlyViewed: Product[];
  pushRecentlyViewed: (product: Product) => void;
  goToCheckout: () => void;
  view: ViewId;
  setView: (v: ViewId) => void;
}

export const VIEW_IDS = ['storefront', 'checkout', 'vendor', 'operations', 'admin'] as const;
export type ViewId = (typeof VIEW_IDS)[number];

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [view, setView] = useState<ViewId>('storefront');

  // Permite enlazar una vista concreta: /demo/ecommerce?view=admin
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('view');
    if (requested && (VIEW_IDS as readonly string[]).includes(requested)) {
      setView(requested as ViewId);
    }
  }, []);

  const add = useCallback((product: Product, qty = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, quantity: l.quantity + qty } : l
        );
      }
      return [...prev, { product, quantity: qty }];
    });
  }, []);

  const setQty = useCallback((productId: number, qty: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.product.id === productId ? { ...l, quantity: qty } : l))
        .filter((l) => l.quantity > 0)
    );
  }, []);

  const remove = useCallback((productId: number) => {
    setLines((prev) => prev.filter((l) => l.product.id !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const pushRecentlyViewed = useCallback((product: Product) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      return [product, ...filtered].slice(0, 6);
    });
  }, []);

  const goToCheckout = useCallback(() => setView('checkout'), []);

  const itemCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines]
  );
  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0),
    [lines]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      itemCount,
      subtotal,
      add,
      setQty,
      remove,
      clear,
      recentlyViewed,
      pushRecentlyViewed,
      goToCheckout,
      view,
      setView,
    }),
    [lines, itemCount, subtotal, add, setQty, remove, clear, recentlyViewed, pushRecentlyViewed, goToCheckout, view]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Pricing helpers
// ---------------------------------------------------------------------------

// Tienda de ejemplo para Colombia: pesos colombianos sin decimales, formato
// es-CO ("$ 6.499.000") en ambos idiomas, para que servidor y navegador
// rendericen lo mismo.
const COP_FORMAT = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const NUMBER_FORMAT = new Intl.NumberFormat('es-CO');

export function formatPrice(amount: number): string {
  return COP_FORMAT.format(Math.round(amount));
}

export function formatNumber(value: number): string {
  return NUMBER_FORMAT.format(value);
}

// Reglas de ejemplo: los precios ya incluyen IVA (19 %, tarifa general), el
// envío cuesta $ 9.900 y es gratis desde $ 150.000.
export const IVA_RATE = 0.19;
export const SHIPPING_FEE = 9900;
export const FREE_SHIPPING_FROM = 150000;

export function calcTotals(net: number) {
  const shipping = net === 0 ? 0 : net >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
  const ivaIncluded = Math.round(net - net / (1 + IVA_RATE));
  const total = net + shipping;
  return { shipping, ivaIncluded, total };
}

// ---------------------------------------------------------------------------
// CUFE mock generator (DIAN Colombia electronic invoice unique code)
// ---------------------------------------------------------------------------
export function generateCufe(): string {
  const chars = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 96; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `KOP-${ts}-${rnd}`;
}
