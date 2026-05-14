'use client';

import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
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

export type ViewId = 'storefront' | 'checkout' | 'vendor' | 'operations' | 'admin';

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [view, setView] = useState<ViewId>('storefront');

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

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function calcTotals(subtotal: number) {
  const shipping = subtotal === 0 ? 0 : subtotal >= 100 ? 0 : 12;
  const tax = +(subtotal * 0.08).toFixed(2);
  const total = +(subtotal + shipping + tax).toFixed(2);
  return { shipping, tax, total };
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
