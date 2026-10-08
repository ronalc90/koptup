'use client';

// Estado único de la demo de tienda: catálogo, existencias por bodega, carrito,
// pedidos, devoluciones, reglas de precio, transportadoras y automatizaciones.
// Todas las vistas leen y escriben aquí, así un pedido pagado en la tienda
// aparece en el panel, en logística y en los reportes, y un producto creado en
// el panel aparece en la tienda. Se guarda en localStorage (solo en este
// navegador) y se puede restablecer.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { PRODUCTS, totalStock, WAREHOUSE_IDS, type Product, type WarehouseId } from './products';
import { DEFAULT_RULES, priceCart, COUPONS, type CartPricing, type PricingRules, type RuleId } from './pricing';
import {
  SAMPLE, CARRIERS, CARRIER_BY_ID, CITY_BY_ID, LAST_TRACKING_STEP, ORDER_FLOW, orderNumber,
  type CarrierId, type Order, type OrderStatus, type PaymentMethodId, type ReturnReason, type ReturnRequest,
} from './data';
import { AUTOMATION_IDS, type AutomationId, type Clock } from './analytics';

export const VIEW_IDS = ['storefront', 'checkout', 'vendor', 'operations', 'admin'] as const;
export type ViewId = (typeof VIEW_IDS)[number];

const STORAGE_KEY = 'koptup-demo-ecommerce-v3';
const VERSION = 3;

export interface CartItem { productId: number; qty: number }

interface PersistedState {
  v: number;
  products: Product[];
  orders: Order[];
  returns: ReturnRequest[];
  rules: PricingRules;
  carriers: Record<CarrierId, boolean>;
  automations: Record<AutomationId, boolean>;
  wishlist: number[];
  cart: CartItem[];
  coupon: string | null;
  seq: { order: number; product: number; guide: number; ret: number };
  tour: { open: boolean; reportsSeen: boolean };
}

function initialState(): PersistedState {
  return {
    v: VERSION,
    products: PRODUCTS,
    orders: SAMPLE.orders,
    returns: SAMPLE.returns,
    rules: { ...DEFAULT_RULES },
    carriers: Object.fromEntries(CARRIERS.map((c) => [c.id, true])) as Record<CarrierId, boolean>,
    automations: Object.fromEntries(AUTOMATION_IDS.map((a) => [a, a !== 'winBack'])) as Record<AutomationId, boolean>,
    wishlist: [],
    cart: [],
    coupon: null,
    seq: { order: SAMPLE.nextOrderSeq, product: 101, guide: 1, ret: 301 + SAMPLE.returns.length },
    tour: { open: true, reportsSeen: false },
  };
}

export interface CheckoutInput {
  customer: string;
  email: string;
  phone: string;
  docType: string;
  docNumber: string;
  cityId: string;
  address: string;
  company?: string;
  method: PaymentMethodId;
}

export interface NewProductInput {
  name: string;
  sku: string;
  category: Product['category'];
  price: number;
  stock: number;
  description?: string;
  imageData?: string;
}

export interface Toast { id: number; message: string; action?: { label: string; view: ViewId } }

interface StoreValue {
  hydrated: boolean;
  clock: Clock;
  state: PersistedState;
  view: ViewId;
  setView: (v: ViewId) => void;
  productName: (p: Product | undefined) => string;
  productById: Map<number, Product>;
  recentlyViewed: number[];
  pushRecentlyViewed: (id: number) => void;
  // carrito
  cartLines: Array<{ product: Product; qty: number }>;
  cartCount: number;
  pricing: CartPricing;
  addToCart: (id: number, qty?: number) => void;
  setCartQty: (id: number, qty: number) => void;
  removeFromCart: (id: number) => void;
  applyCoupon: (code: string) => boolean;
  clearCoupon: () => void;
  placeOrder: (input: CheckoutInput) => Order | null;
  setOrderCufe: (id: string, cufe: string) => void;
  // pedidos y logística
  advanceOrder: (id: string) => void;
  shipOrder: (id: string, carrier: CarrierId) => void;
  advanceTracking: (id: string) => void;
  reviewRisk: (id: string, decision: 'approved' | 'rejected') => void;
  addReturn: (orderId: string, productId: number, reason: ReturnReason) => void;
  resolveReturn: (id: string, approve: boolean) => void;
  // catálogo
  createProduct: (input: NewProductInput) => Product;
  updateProduct: (id: number, patch: Partial<Pick<Product, 'name' | 'price' | 'hidden' | 'description'>>) => void;
  deleteProduct: (id: number) => void;
  restock: (id: number, qty: number, warehouse?: WarehouseId) => void;
  // configuración
  toggleRule: (id: RuleId) => void;
  toggleCarrier: (id: CarrierId) => void;
  toggleAutomation: (id: AutomationId) => void;
  toggleWish: (id: number) => void;
  setTourOpen: (open: boolean) => void;
  reset: () => void;
  // avisos
  toasts: Toast[];
  notify: (message: string, action?: Toast['action']) => void;
  dismissToast: (id: number) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function readStorage(): PersistedState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    return parsed && parsed.v === VERSION && Array.isArray(parsed.orders) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStorage(state: PersistedState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Sin almacenamiento disponible (modo privado o cuota llena): la demo sigue en memoria.
  }
}

/** Descuenta existencias empezando por la bodega indicada. */
function takeStock(p: Product, qty: number, first: WarehouseId): Product {
  const warehouses = { ...p.warehouses };
  let left = qty;
  for (const wh of [first, ...WAREHOUSE_IDS.filter((w) => w !== first)]) {
    const take = Math.min(left, warehouses[wh]);
    warehouses[wh] -= take;
    left -= take;
    if (!left) break;
  }
  return { ...p, warehouses };
}

function putStock(p: Product, qty: number, wh: WarehouseId): Product {
  return { ...p, warehouses: { ...p.warehouses, [wh]: p.warehouses[wh] + qty } };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const t = useTranslations('demoEcommerce2');
  const [state, setState] = useState<PersistedState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [clock, setClock] = useState<Clock>({ start: null, now: null });
  const [view, setViewState] = useState<ViewId>('storefront');
  const [recentlyViewed, setRecentlyViewed] = useState<number[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);

  // Carga en el navegador (después del primer render, para no romper la hidratación).
  useEffect(() => {
    const stored = readStorage();
    if (stored) setState(stored);
    const start = Date.now();
    setClock({ start, now: start });
    const requested = new URLSearchParams(window.location.search).get('view');
    if (requested && (VIEW_IDS as readonly string[]).includes(requested)) setViewState(requested as ViewId);
    setHydrated(true);
    const timer = window.setInterval(() => setClock((c) => ({ ...c, now: Date.now() })), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (hydrated) writeStorage(state);
  }, [state, hydrated]);

  const notify = useCallback((message: string, action?: Toast['action']) => {
    const id = ++toastSeq.current;
    setToasts((prev) => [...prev.slice(-2), { id, message, action }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 5000);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((prev) => prev.filter((x) => x.id !== id)), []);

  const setView = useCallback((v: ViewId) => {
    setViewState(v);
    try {
      const url = new URL(window.location.href);
      if (v === 'storefront') url.searchParams.delete('view');
      else url.searchParams.set('view', v);
      window.history.replaceState(window.history.state, '', url.toString());
    } catch {
      // URL no actualizable: la vista cambia igual.
    }
    window.scrollTo({ top: 0 });
  }, []);

  const productById = useMemo(() => new Map(state.products.map((p) => [p.id, p])), [state.products]);

  const productName = useCallback(
    (p: Product | undefined) => {
      if (!p) return '—';
      if (p.name) return p.name;
      return p.nameKey ? t(`productNames.${p.nameKey}`) : p.sku;
    },
    [t],
  );

  const pushRecentlyViewed = useCallback((id: number) => {
    setRecentlyViewed((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 6));
  }, []);

  // ------------------------------------------------------------------ carrito
  const cartLines = useMemo(
    () =>
      state.cart
        .map((c) => ({ product: productById.get(c.productId), qty: c.qty }))
        .filter((l): l is { product: Product; qty: number } => !!l.product),
    [state.cart, productById],
  );
  const cartCount = cartLines.reduce((s, l) => s + l.qty, 0);
  const pricing = useMemo(
    () =>
      priceCart(
        cartLines.map((l) => ({ productId: l.product.id, qty: l.qty, unitPrice: l.product.price, category: l.product.category })),
        state.rules,
        state.coupon,
      ),
    [cartLines, state.rules, state.coupon],
  );

  const addToCart = useCallback(
    (id: number, qty = 1) => {
      const p = productById.get(id);
      if (!p) return;
      const stock = totalStock(p);
      const current = state.cart.find((c) => c.productId === id)?.qty ?? 0;
      const next = Math.min(stock, current + qty);
      if (next <= current) {
        notify(t('toasts.noStock', { name: productName(p), n: stock }));
        return;
      }
      setState((s) => ({
        ...s,
        cart: s.cart.some((c) => c.productId === id)
          ? s.cart.map((c) => (c.productId === id ? { ...c, qty: next } : c))
          : [...s.cart, { productId: id, qty: next }],
      }));
      notify(
        next < current + qty ? t('toasts.addedLimited', { name: productName(p), n: next }) : t('toasts.added', { name: productName(p) }),
        { label: t('toasts.goToCart'), view: 'checkout' },
      );
    },
    [productById, state.cart, notify, t, productName],
  );

  const setCartQty = useCallback(
    (id: number, qty: number) => {
      const p = productById.get(id);
      const max = p ? totalStock(p) : 0;
      if (p && qty > max) notify(t('toasts.noStock', { name: productName(p), n: max }));
      setState((s) => ({
        ...s,
        cart: s.cart
          .map((c) => (c.productId === id ? { ...c, qty: Math.max(0, Math.min(qty, max)) } : c))
          .filter((c) => c.qty > 0),
      }));
    },
    [productById, notify, t, productName],
  );

  const removeFromCart = useCallback((id: number) => {
    setState((s) => ({ ...s, cart: s.cart.filter((c) => c.productId !== id) }));
  }, []);

  const applyCoupon = useCallback((code: string) => {
    const c = code.trim().toUpperCase();
    if (!COUPONS[c]) return false;
    setState((s) => ({ ...s, coupon: c }));
    return true;
  }, []);
  const clearCoupon = useCallback(() => setState((s) => ({ ...s, coupon: null })), []);

  const placeOrder = useCallback(
    (input: CheckoutInput): Order | null => {
      if (!cartLines.length) return null;
      if (cartLines.some((l) => l.qty > totalStock(l.product))) return null;
      const city = CITY_BY_ID[input.cityId];
      const seq = state.seq.order;
      const order: Order = {
        id: orderNumber(seq),
        customerId: `W-${input.email.trim().toLowerCase()}`,
        customer: input.customer.trim(),
        cityId: input.cityId,
        lines: cartLines.map((l) => ({ productId: l.product.id, qty: l.qty, unitPrice: l.product.price })),
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        net: pricing.net,
        shipping: pricing.shipping,
        ivaIncluded: pricing.ivaIncluded,
        total: pricing.total,
        coupon: state.coupon ?? undefined,
        method: input.method,
        paid: input.method !== 'cod',
        status: 'new',
        createdAt: Date.now(),
        demo: true,
        email: input.email.trim(),
        phone: input.phone.trim(),
        docType: input.docType,
        docNumber: input.docNumber.trim(),
        address: input.address.trim(),
        company: input.company?.trim() || undefined,
        warehouse: city?.warehouse ?? 'bog',
      };
      setState((s) => ({
        ...s,
        orders: [order, ...s.orders],
        products: s.products.map((p) => {
          const line = order.lines.find((l) => l.productId === p.id);
          return line ? takeStock(p, line.qty, order.warehouse) : p;
        }),
        cart: [],
        coupon: null,
        seq: { ...s.seq, order: s.seq.order + 1 },
      }));
      return order;
    },
    [cartLines, pricing, state.coupon, state.seq.order],
  );

  const setOrderCufe = useCallback((id: string, cufe: string) => {
    setState((s) => ({ ...s, orders: s.orders.map((o) => (o.id === id ? { ...o, cufe } : o)) }));
  }, []);

  // --------------------------------------------------------- pedidos/logística
  const patchOrder = useCallback((id: string, fn: (o: Order) => Order) => {
    setState((s) => ({ ...s, orders: s.orders.map((o) => (o.id === id ? fn(o) : o)) }));
  }, []);

  const advanceOrder = useCallback(
    (id: string) => {
      patchOrder(id, (o) => {
        const idx = ORDER_FLOW.indexOf(o.status);
        if (idx < 0 || o.status === 'preparing' || o.status === 'delivered') return o; // despachar exige guía
        const status = ORDER_FLOW[idx + 1] as OrderStatus;
        if (status === 'delivered') return { ...o, status, trackingStep: LAST_TRACKING_STEP, paid: true };
        return { ...o, status };
      });
    },
    [patchOrder],
  );

  const shipOrder = useCallback((id: string, carrier: CarrierId) => {
    setState((s) => {
      const c = CARRIER_BY_ID[carrier];
      const guide = `${c.prefix}-SIM-${String(s.seq.guide).padStart(6, '0')}`;
      return {
        ...s,
        orders: s.orders.map((o) => (o.id === id ? { ...o, status: 'shipped', carrier, guide, trackingStep: 0 } : o)),
        seq: { ...s.seq, guide: s.seq.guide + 1 },
      };
    });
  }, []);

  const advanceTracking = useCallback(
    (id: string) => {
      patchOrder(id, (o) => {
        const step = Math.min(LAST_TRACKING_STEP, (o.trackingStep ?? 0) + 1);
        return step === LAST_TRACKING_STEP ? { ...o, trackingStep: step, status: 'delivered', paid: true } : { ...o, trackingStep: step };
      });
    },
    [patchOrder],
  );

  const reviewRisk = useCallback((id: string, decision: 'approved' | 'rejected') => {
    setState((s) => {
      const order = s.orders.find((o) => o.id === id);
      if (!order) return s;
      if (decision === 'approved') {
        return { ...s, orders: s.orders.map((o) => (o.id === id ? { ...o, riskReview: 'approved' } : o)) };
      }
      return {
        ...s,
        orders: s.orders.map((o) => (o.id === id ? { ...o, riskReview: 'rejected', status: 'cancelled', paid: false } : o)),
        products: s.products.map((p) => {
          const line = order.lines.find((l) => l.productId === p.id);
          return line ? putStock(p, line.qty, order.warehouse) : p;
        }),
      };
    });
  }, []);

  const addReturn = useCallback((orderId: string, productId: number, reason: ReturnReason) => {
    setState((s) => {
      const order = s.orders.find((o) => o.id === orderId);
      const line = order?.lines.find((l) => l.productId === productId);
      if (!order || !line) return s;
      const ret: ReturnRequest = {
        id: `DEV-${s.seq.ret}`,
        orderId,
        productId,
        qty: 1,
        reason,
        status: 'pending',
        amount: Math.round((line.unitPrice * order.net) / (order.subtotal || 1)),
        createdAt: Date.now(),
      };
      return { ...s, returns: [ret, ...s.returns], seq: { ...s.seq, ret: s.seq.ret + 1 } };
    });
  }, []);

  const resolveReturn = useCallback((id: string, approve: boolean) => {
    setState((s) => {
      const ret = s.returns.find((r) => r.id === id);
      if (!ret || ret.status !== 'pending') return s;
      const order = s.orders.find((o) => o.id === ret.orderId);
      // Garantía: el producto va a revisión técnica, no vuelve al inventario vendible.
      const restock = approve && ret.reason !== 'warranty';
      return {
        ...s,
        returns: s.returns.map((r) => (r.id === id ? { ...r, status: approve ? 'approved' : 'rejected', restocked: restock } : r)),
        products: restock
          ? s.products.map((p) => (p.id === ret.productId ? putStock(p, ret.qty, order?.warehouse ?? 'bog') : p))
          : s.products,
      };
    });
  }, []);

  // ------------------------------------------------------------------ catálogo
  const createProduct = useCallback(
    (input: NewProductInput): Product => {
      const id = state.seq.product;
      const product: Product = {
        id,
        sku: input.sku.trim().toUpperCase(),
        name: input.name.trim(),
        description: input.description?.trim() || undefined,
        category: input.category,
        price: Math.round(input.price),
        rating: 0,
        reviews: 0,
        imageData: input.imageData,
        details: [
          { x: 0.5, y: 0.5, z: 1.6 },
          { x: 0.5, y: 0.5, z: 2.4 },
        ],
        badges: ['new'],
        warehouses: { bog: Math.max(0, Math.round(input.stock)), mde: 0, cli: 0 },
        demand: 0,
        custom: true,
      };
      setState((s) => ({ ...s, products: [...s.products, product], seq: { ...s.seq, product: s.seq.product + 1 } }));
      return product;
    },
    [state.seq.product],
  );

  const updateProduct = useCallback((id: number, patch: Partial<Pick<Product, 'name' | 'price' | 'hidden' | 'description'>>) => {
    setState((s) => ({
      ...s,
      products: s.products.map((p) => {
        if (p.id !== id) return p;
        const next = { ...p, ...patch };
        // Si el precio sube por encima del precio "antes", deja de mostrarse como descuento.
        if (patch.price !== undefined && p.originalPrice && patch.price >= p.originalPrice) next.originalPrice = undefined;
        return next;
      }),
      cart: patch.hidden ? s.cart.filter((c) => c.productId !== id) : s.cart,
    }));
  }, []);

  const deleteProduct = useCallback((id: number) => {
    setState((s) => ({
      ...s,
      products: s.products.filter((p) => p.id !== id || !p.custom),
      cart: s.cart.filter((c) => c.productId !== id),
      wishlist: s.wishlist.filter((w) => w !== id),
    }));
    setRecentlyViewed((prev) => prev.filter((x) => x !== id));
  }, []);

  const restock = useCallback((id: number, qty: number, warehouse: WarehouseId = 'bog') => {
    setState((s) => ({ ...s, products: s.products.map((p) => (p.id === id ? putStock(p, qty, warehouse) : p)) }));
  }, []);

  // ------------------------------------------------------------- configuración
  const toggleRule = useCallback((id: RuleId) => setState((s) => ({ ...s, rules: { ...s.rules, [id]: !s.rules[id] } })), []);
  const toggleCarrier = useCallback(
    (id: CarrierId) =>
      setState((s) => {
        const enabled = Object.values(s.carriers).filter(Boolean).length;
        if (s.carriers[id] && enabled <= 1) return s; // siempre queda al menos una
        return { ...s, carriers: { ...s.carriers, [id]: !s.carriers[id] } };
      }),
    [],
  );
  const toggleAutomation = useCallback(
    (id: AutomationId) => setState((s) => ({ ...s, automations: { ...s.automations, [id]: !s.automations[id] } })),
    [],
  );
  const toggleWish = useCallback(
    (id: number) =>
      setState((s) => ({ ...s, wishlist: s.wishlist.includes(id) ? s.wishlist.filter((w) => w !== id) : [...s.wishlist, id] })),
    [],
  );
  const setTourOpen = useCallback((open: boolean) => setState((s) => ({ ...s, tour: { ...s.tour, open } })), []);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // nada que borrar
    }
    setState(initialState());
    setRecentlyViewed([]);
    setView('storefront');
  }, [setView]);

  // Paso 5 del recorrido: ver los reportes después de pagar un pedido.
  useEffect(() => {
    if (view === 'admin' && !state.tour.reportsSeen && state.orders.some((o) => o.demo)) {
      setState((s) => ({ ...s, tour: { ...s.tour, reportsSeen: true } }));
    }
  }, [view, state.orders, state.tour.reportsSeen]);

  const value: StoreValue = {
    hydrated, clock, state, view, setView, productName, productById, recentlyViewed, pushRecentlyViewed,
    cartLines, cartCount, pricing, addToCart, setCartQty, removeFromCart, applyCoupon, clearCoupon, placeOrder, setOrderCufe,
    advanceOrder, shipOrder, advanceTracking, reviewRisk, addReturn, resolveReturn,
    createProduct, updateProduct, deleteProduct, restock,
    toggleRule, toggleCarrier, toggleAutomation, toggleWish, setTourOpen, reset,
    toasts, notify, dismissToast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore debe usarse dentro de StoreProvider');
  return ctx;
}
