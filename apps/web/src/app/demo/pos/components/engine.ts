/**
 * Cálculos de la demo POS (funciones puras): impuestos incluidos en el precio,
 * descuentos por puntos, propina voluntaria, reportes X/Z y formato de montos.
 */
import { POINTS, TAX_RATES, type PayMethod, type Station, type TaxKind } from './data';

export interface TicketLine {
  uid: string;
  productId: string;
  name: string;
  emoji: string;
  /** Unidades, o kg si `byWeight`. */
  qty: number;
  /** Precio unitario con impuestos (incluye modificadores y hora feliz). */
  unitPrice: number;
  tax: TaxKind;
  byWeight?: boolean;
  station?: Station;
  mods?: string[];
  note?: string;
  combo?: { name: string; station: Station }[];
  /** Unidades ya enviadas a cocina/bar. */
  sent: number;
}

export interface Payment {
  method: PayMethod;
  amount: number;
  /** Código de autorización simulado (datafono / QR) o código del bono. */
  ref?: string;
}

export interface TaxRow {
  kind: TaxKind;
  base: number;
  tax: number;
}

export interface Totals {
  /** Suma de precios con impuestos antes de descuentos. */
  gross: number;
  discount: number;
  /** Total a pagar sin propina. */
  net: number;
  taxes: TaxRow[];
  /** Base sin impuestos después del descuento. */
  base: number;
  taxTotal: number;
}

export type Tier = 'bronze' | 'silver' | 'gold';

export const lineAmount = (l: Pick<TicketLine, 'qty' | 'unitPrice'>) => Math.round(l.qty * l.unitPrice);

const TAX_ORDER: TaxKind[] = ['iva19', 'iva5', 'inc8', 'exento'];

/**
 * Totales con impuestos incluidos: el descuento se reparte en proporción entre
 * las tarifas y la base de cada tarifa es bruto / (1 + tarifa).
 */
export function computeTotals(lines: TicketLine[], discount: number): Totals {
  const gross = lines.reduce((s, l) => s + lineAmount(l), 0);
  const disc = Math.min(Math.max(0, discount), gross);
  const groups = new Map<TaxKind, number>();
  for (const l of lines) groups.set(l.tax, (groups.get(l.tax) ?? 0) + lineAmount(l));
  const kinds = TAX_ORDER.filter((k) => groups.has(k));
  const net = gross - disc;
  let assigned = 0;
  const taxes: TaxRow[] = kinds.map((kind, i) => {
    const g = groups.get(kind) ?? 0;
    const after = i === kinds.length - 1 ? net - assigned : Math.round(gross ? g * (net / gross) : 0);
    assigned += after;
    const base = Math.round(after / (1 + TAX_RATES[kind]));
    return { kind, base, tax: after - base };
  });
  const base = taxes.reduce((s, r) => s + r.base, 0);
  return { gross, discount: disc, net, taxes, base, taxTotal: net - base };
}

/** Propina voluntaria sobre la base antes de impuestos. */
export const tipAmount = (base: number, pct: number) => Math.round(base * (pct / 100));

export function tierOf(points: number): Tier {
  if (points >= POINTS.goldFrom) return 'gold';
  if (points >= POINTS.silverFrom) return 'silver';
  return 'bronze';
}

export const pointsEarned = (paid: number, tier: Tier) => Math.floor((paid / 1000) * POINTS.perThousand[tier]);

/** Bloques de puntos que se pueden canjear sin superar el total ni el saldo. */
export function maxRedeemBlocks(points: number, total: number) {
  return Math.max(0, Math.min(Math.floor(points / POINTS.blockPoints), Math.floor(total / POINTS.blockValue)));
}

// ---------- Formato ----------

const group = (n: number, sep: string) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep);

/** Monto en COP sin decimales con separador de miles fijo (mismo resultado en servidor y navegador). */
export function money(n: number, locale: string) {
  const v = Math.round(n);
  return (v < 0 ? '−' : '') + '$' + group(Math.abs(v), locale === 'en' ? ',' : '.');
}

/** Cantidad: entera, o kg con 3 decimales. */
export function qtyLabel(qty: number, byWeight: boolean | undefined, locale: string) {
  if (!byWeight) return String(qty);
  const s = String(Math.round(qty * 1000) / 1000);
  return (locale === 'en' ? s : s.replace('.', ',')) + ' kg';
}

export function plainNumber(n: number, locale: string) {
  return group(Math.round(n), locale === 'en' ? ',' : '.');
}

/** Hora local de Colombia (solo se usa después de una acción del usuario, nunca en el primer render). */
export function timeLabel(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleTimeString(locale === 'en' ? 'en-US' : 'es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota',
    });
  } catch {
    return iso.slice(11, 16);
  }
}

export function dateTimeLabel(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleString(locale === 'en' ? 'en-US' : 'es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota',
    });
  } catch {
    return iso.slice(0, 16).replace('T', ' ');
  }
}

/** Formatea un NIT o cédula con puntos de miles. */
export function docLabel(doc: string) {
  const [num, dv] = doc.split('-');
  const digits = num.replace(/\D/g, '');
  return group(Number(digits || 0), '.') + (dv ? '-' + dv : '');
}

export function phoneLabel(phone: string) {
  const d = phone.replace(/\D/g, '');
  return d.length === 10 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : phone;
}

// ---------- CUDE de ejemplo ----------

/**
 * SHA-384 en hexadecimal (el algoritmo que usa la DIAN para el CUDE/CUFE).
 * Se calcula en el navegador con Web Crypto; si no está disponible, usa un
 * resumen FNV repetido (sigue siendo solo un código de ejemplo).
 */
export async function sha384Hex(text: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-384', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // sigue con el respaldo
  }
  let out = '';
  for (let r = 0; out.length < 96; r++) {
    let h = 0x811c9dc5 ^ r;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    out += (h >>> 0).toString(16).padStart(8, '0');
  }
  return out.slice(0, 96);
}

// ---------- Reportes ----------

export interface SaleLike {
  total: number;
  tip: number;
  discount: number;
  change: number;
  payments: Payment[];
  taxes: TaxRow[];
  lines: { name: string; qty: number; amount: number; byWeight?: boolean; emoji: string }[];
  refunded?: boolean;
}

export interface ShiftReport {
  count: number;
  /** Ventas cobradas (incluye propinas) de las ventas vigentes. */
  total: number;
  tips: number;
  discounts: number;
  avg: number;
  byMethod: Record<PayMethod, number>;
  taxes: TaxRow[];
  refundsCount: number;
  refundsTotal: number;
  /** Efectivo neto recibido (efectivo cobrado − cambio) de las ventas vigentes. */
  netCash: number;
  top: { name: string; emoji: string; qty: number; amount: number; byWeight?: boolean }[];
}

export function buildReport(sales: SaleLike[]): ShiftReport {
  const valid = sales.filter((s) => !s.refunded);
  const refunded = sales.filter((s) => s.refunded);
  const byMethod: Record<PayMethod, number> = { cash: 0, card: 0, qr: 0, gift: 0 };
  let netCash = 0;
  const taxMap = new Map<TaxKind, TaxRow>();
  const prod = new Map<string, { name: string; emoji: string; qty: number; amount: number; byWeight?: boolean }>();
  for (const s of valid) {
    for (const p of s.payments) byMethod[p.method] += p.amount;
    byMethod.cash -= s.change;
    netCash += s.payments.filter((p) => p.method === 'cash').reduce((a, p) => a + p.amount, 0) - s.change;
    for (const t of s.taxes) {
      const row = taxMap.get(t.kind) ?? { kind: t.kind, base: 0, tax: 0 };
      row.base += t.base;
      row.tax += t.tax;
      taxMap.set(t.kind, row);
    }
    for (const l of s.lines) {
      const row = prod.get(l.name) ?? { name: l.name, emoji: l.emoji, qty: 0, amount: 0, byWeight: l.byWeight };
      row.qty += l.qty;
      row.amount += l.amount;
      prod.set(l.name, row);
    }
  }
  const total = valid.reduce((s, x) => s + x.total, 0);
  return {
    count: valid.length,
    total,
    tips: valid.reduce((s, x) => s + x.tip, 0),
    discounts: valid.reduce((s, x) => s + x.discount, 0),
    avg: valid.length ? Math.round(total / valid.length) : 0,
    byMethod,
    taxes: TAX_ORDER.filter((k) => taxMap.has(k)).map((k) => taxMap.get(k) as TaxRow),
    refundsCount: refunded.length,
    refundsTotal: refunded.reduce((s, x) => s + x.total, 0),
    netCash,
    top: Array.from(prod.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5),
  };
}
