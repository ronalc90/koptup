/**
 * proposal-calc.ts — cálculo de montos de una propuesta (funciones puras).
 *
 * Todo se calcula en el servidor con enteros en unidades menores (centavos)
 * para no acumular errores de coma flotante:
 *  - COP se redondea a pesos enteros; USD, a centavos.
 *  - Por ítem: precio unitario × cantidad, menos el descuento (%).
 *  - Subtotal (pago inicial) = Σ setup neto; IVA 19 % opcional; total.
 *  - Mensualidad (recurrente) = Σ mensualidad neta, con su IVA si aplica.
 *  - Anticipo = total del pago inicial × % de anticipo.
 */
import { IVA_PCT, type Currency } from '../config/commerce';

export function toMinor(amount: number): number {
  return Math.round(amount * 100);
}

export function fromMinor(minor: number): number {
  return Math.round(minor) / 100;
}

/** Redondea unidades menores a la precisión de la moneda (COP: pesos enteros). */
export function roundMinor(minor: number, currency: Currency): number {
  return currency === 'COP' ? Math.round(minor / 100) * 100 : Math.round(minor);
}

/** Normaliza un monto en unidades mayores (COP sin decimales; USD con 2). */
export function normalizeAmount(amount: number, currency: Currency): number {
  return fromMinor(roundMinor(toMinor(amount), currency));
}

/** Porcentaje de un monto en unidades menores, redondeado a la moneda. */
export function pctOfMinor(minor: number, pct: number, currency: Currency): number {
  return roundMinor((minor * pct) / 100, currency);
}

export interface CalcItemInput {
  cantidad: number;
  /** Precio unitario del pago inicial (setup o pago único). */
  setup: number;
  /** Precio unitario mensual (mensualidad o mantenimiento); 0 si no tiene. */
  mensualidad: number;
  /** Descuento en % (0–100) sobre el setup y la mensualidad del ítem. */
  descuentoPct: number;
}

export interface CalcItemResult {
  setupBruto: number;
  setupDescuento: number;
  setupTotal: number;
  mensualBruto: number;
  mensualDescuento: number;
  mensualTotal: number;
}

export function computeItem(item: CalcItemInput, currency: Currency): CalcItemResult {
  const qty = Math.max(0, Math.trunc(item.cantidad));
  const pct = Math.min(100, Math.max(0, item.descuentoPct || 0));
  const setupBruto = roundMinor(toMinor(normalizeAmount(item.setup, currency)) * qty, currency);
  const mensualBruto = roundMinor(toMinor(normalizeAmount(item.mensualidad, currency)) * qty, currency);
  const setupDescuento = pctOfMinor(setupBruto, pct, currency);
  const mensualDescuento = pctOfMinor(mensualBruto, pct, currency);
  return {
    setupBruto: fromMinor(setupBruto),
    setupDescuento: fromMinor(setupDescuento),
    setupTotal: fromMinor(setupBruto - setupDescuento),
    mensualBruto: fromMinor(mensualBruto),
    mensualDescuento: fromMinor(mensualDescuento),
    mensualTotal: fromMinor(mensualBruto - mensualDescuento),
  };
}

export interface ProposalTotals {
  /** Pago inicial antes de descuentos. */
  bruto: number;
  descuento: number;
  /** Pago inicial con descuentos, antes de IVA. */
  subtotal: number;
  iva: number;
  /** Pago inicial con IVA. */
  total: number;
  mensualBruto: number;
  mensualDescuento: number;
  mensualSubtotal: number;
  mensualIva: number;
  mensualTotal: number;
  anticipo: number;
}

export function computeTotals(
  items: CalcItemInput[],
  opts: { currency: Currency; ivaAplica: boolean; anticipoPct: number },
): { items: CalcItemResult[]; totales: ProposalTotals } {
  const { currency } = opts;
  const results = items.map((i) => computeItem(i, currency));
  const sum = (pick: (r: CalcItemResult) => number) => results.reduce((acc, r) => acc + toMinor(pick(r)), 0);

  const bruto = sum((r) => r.setupBruto);
  const descuento = sum((r) => r.setupDescuento);
  const subtotal = bruto - descuento;
  const iva = opts.ivaAplica ? pctOfMinor(subtotal, IVA_PCT, currency) : 0;
  const total = subtotal + iva;

  const mensualBruto = sum((r) => r.mensualBruto);
  const mensualDescuento = sum((r) => r.mensualDescuento);
  const mensualSubtotal = mensualBruto - mensualDescuento;
  const mensualIva = opts.ivaAplica ? pctOfMinor(mensualSubtotal, IVA_PCT, currency) : 0;

  const anticipoPct = Math.min(100, Math.max(0, opts.anticipoPct));
  const anticipo = pctOfMinor(total, anticipoPct, currency);

  return {
    items: results,
    totales: {
      bruto: fromMinor(bruto),
      descuento: fromMinor(descuento),
      subtotal: fromMinor(subtotal),
      iva: fromMinor(iva),
      total: fromMinor(total),
      mensualBruto: fromMinor(mensualBruto),
      mensualDescuento: fromMinor(mensualDescuento),
      mensualSubtotal: fromMinor(mensualSubtotal),
      mensualIva: fromMinor(mensualIva),
      mensualTotal: fromMinor(mensualSubtotal + mensualIva),
      anticipo: fromMinor(anticipo),
    },
  };
}

/** Monto en centavos para una pasarela (Wompi: `amount-in-cents`). */
export function amountInCents(amount: number): number {
  return toMinor(amount);
}

/** "COP 3.900.000" · "USD 1.200" · "USD 1.200,50" (formato es-CO, como la web). */
export function formatMoney(amount: number, currency: Currency): string {
  const decimals = currency === 'USD' && !Number.isInteger(amount) ? 2 : 0;
  const n = new Intl.NumberFormat('es-CO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount);
  return `${currency} ${n}`;
}
