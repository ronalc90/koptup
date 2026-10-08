/**
 * Cálculos del tablero. Todo sale de las mismas filas de ventas y gastos, así
 * el Resumen, Finanzas, Clientes, las alertas, las preguntas guiadas y el PDF
 * muestran las mismas cifras para el mismo período.
 */
import {
  addDays,
  addMonths,
  daysInMonth,
  diffDays,
  lastDay,
  monthNum,
  monthOf,
  quarterOf,
  yearOf,
} from './dates';
import type { Dataset, ISODate, MonthKey, Period, SaleRow, Thresholds } from './types';

/* ------------------------------------------------------------------ */
/* Índice                                                              */
/* ------------------------------------------------------------------ */

export interface CustomerInfo {
  name: string;
  city: string;
  seller: string;
  first: ISODate;
  /** Promedio de días de pago después del vencimiento (null si no hay pagos). */
  avgDelay: number | null;
  /** Plazo típico en días. */
  term: number | null;
}

export interface Index {
  ds: Dataset;
  byMonth: Map<MonthKey, SaleRow[]>;
  lines: string[];
  cities: string[];
  customers: CustomerInfo[];
  customerMap: Map<string, CustomerInfo>;
}

function mostFrequent(values: string[]): string {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = values[0] ?? '';
  let bestN = 0;
  counts.forEach((n, v) => {
    if (n > bestN) {
      best = v;
      bestN = n;
    }
  });
  return best;
}

export function buildIndex(ds: Dataset): Index {
  const byMonth = new Map<MonthKey, SaleRow[]>();
  const lineTotals = new Map<string, number>();
  const cityTotals = new Map<string, number>();
  const perCustomer = new Map<string, SaleRow[]>();
  for (const r of ds.rows) {
    const m = monthOf(r.date);
    if (!byMonth.has(m)) byMonth.set(m, []);
    byMonth.get(m)!.push(r);
    lineTotals.set(r.line, (lineTotals.get(r.line) ?? 0) + r.value);
    cityTotals.set(r.city, (cityTotals.get(r.city) ?? 0) + r.value);
    if (!perCustomer.has(r.customer)) perCustomer.set(r.customer, []);
    perCustomer.get(r.customer)!.push(r);
  }
  const byValue = (m: Map<string, number>) => Array.from(m.entries()).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  const customers: CustomerInfo[] = [];
  perCustomer.forEach((rows, name) => {
    const delays = rows.filter((r) => r.paid && r.due).map((r) => diffDays(r.paid!, r.due!));
    const terms = rows.filter((r) => r.due).map((r) => diffDays(r.due!, r.date));
    customers.push({
      name,
      city: mostFrequent(rows.map((r) => r.city)),
      seller: rows[rows.length - 1].seller,
      first: rows.reduce((min, r) => (r.date < min ? r.date : min), rows[0].date),
      avgDelay: delays.length ? Math.max(0, Math.round(delays.reduce((s, d) => s + d, 0) / delays.length)) : null,
      term: terms.length ? Math.round(terms.reduce((s, d) => s + d, 0) / terms.length) : null,
    });
  });
  customers.sort((a, b) => a.name.localeCompare(b.name));
  return {
    ds,
    byMonth,
    lines: byValue(lineTotals),
    cities: byValue(cityTotals),
    customers,
    customerMap: new Map(customers.map((c) => [c.name, c])),
  };
}

/* ------------------------------------------------------------------ */
/* Períodos                                                            */
/* ------------------------------------------------------------------ */

function monthsOfPeriod(ds: Dataset, kind: Period['kind'], year: number, index: number): MonthKey[] {
  return ds.months.filter((m) => {
    if (yearOf(m) !== year) return false;
    if (kind === 'month') return monthNum(m) === index;
    if (kind === 'quarter') return quarterOf(m) === index;
    return true;
  });
}

/** Períodos del año más reciente con datos: año a la fecha, trimestres y meses (del más reciente al más antiguo). */
export function periodOptions(ds: Dataset): Period[] {
  if (!ds.months.length) return [];
  const year = yearOf(ds.months[ds.months.length - 1]);
  const inYear = ds.months.filter((m) => yearOf(m) === year);
  const out: Period[] = [];
  const months = [...inYear].reverse();
  for (const m of months) out.push({ key: `m:${m}`, kind: 'month', year, index: monthNum(m), months: [m] });
  const quarters = Array.from(new Set(inYear.map(quarterOf))).sort((a, b) => b - a);
  for (const q of quarters) out.push({ key: `q:${year}-${q}`, kind: 'quarter', year, index: q, months: monthsOfPeriod(ds, 'quarter', year, q) });
  out.push({ key: `y:${year}`, kind: 'year', year, index: 0, months: inYear });
  return out;
}

export function findPeriod(ds: Dataset, key: string | null): Period {
  const options = periodOptions(ds);
  return options.find((p) => p.key === key) ?? options[0];
}

/** Último día del período (o la fecha de corte si el período está en curso). */
export function periodEnd(ds: Dataset, p: Period): ISODate {
  const end = lastDay(p.months[p.months.length - 1]);
  return end > ds.cutoff ? ds.cutoff : end;
}

/** Mismos meses, un año antes. */
export const yearBefore = (months: MonthKey[]) => months.map((m) => addMonths(m, -12));

/** Período inmediatamente anterior (mes, trimestre o año). */
export function previousMonths(p: Period): MonthKey[] {
  const first = p.months[0];
  const span = p.kind === 'month' ? 1 : p.kind === 'quarter' ? 3 : 12;
  const start = p.kind === 'month' ? addMonths(first, -1) : p.kind === 'quarter' ? addMonths(`${p.year}-${String((p.index - 1) * 3 + 1).padStart(2, '0')}`, -3) : `${p.year - 1}-01`;
  return Array.from({ length: span }, (_, i) => addMonths(start, i));
}

/* ------------------------------------------------------------------ */
/* Sumas                                                               */
/* ------------------------------------------------------------------ */

export interface Filter {
  city?: string;
  line?: string;
  customer?: string;
}

export interface Totals {
  sales: number;
  cost: number;
  invoices: number;
  customers: number;
}

function matches(r: SaleRow, f?: Filter) {
  if (!f) return true;
  if (f.city && r.city !== f.city) return false;
  if (f.line && r.line !== f.line) return false;
  if (f.customer && r.customer !== f.customer) return false;
  return true;
}

export function rowsIn(idx: Index, months: MonthKey[], f?: Filter): SaleRow[] {
  const out: SaleRow[] = [];
  for (const m of months) for (const r of idx.byMonth.get(m) ?? []) if (matches(r, f)) out.push(r);
  return out;
}

export function totals(idx: Index, months: MonthKey[], f?: Filter): Totals {
  let sales = 0;
  let cost = 0;
  let invoices = 0;
  const customers = new Set<string>();
  for (const r of rowsIn(idx, months, f)) {
    sales += r.value;
    cost += r.cost ?? 0;
    invoices += 1;
    customers.add(r.customer);
  }
  return { sales, cost, invoices, customers: customers.size };
}

/** ¿Hay datos para todos esos meses? */
export const hasMonths = (idx: Index, months: MonthKey[]) => months.length > 0 && months.every((m) => idx.byMonth.has(m));

/** Meta de ventas: mismo período del año anterior × (1 + crecimiento). Null si no hay datos del año anterior. */
export function budget(idx: Index, months: MonthKey[], goalGrowth: number, f?: Filter): number | null {
  const prev = yearBefore(months);
  if (!hasMonths(idx, prev)) return null;
  return totals(idx, prev, f).sales * (1 + goalGrowth / 100);
}

export const marginOf = (t: Totals) => (t.sales > 0 ? (t.sales - t.cost) / t.sales : 0);
export const ratio = (a: number, b: number | null) => (b && b !== 0 ? a / b : null);
export const change = (a: number, b: number | null) => (b && b !== 0 ? a / b - 1 : null);

/* ------------------------------------------------------------------ */
/* Cartera                                                             */
/* ------------------------------------------------------------------ */

export type Bucket = 'current' | 'd1_30' | 'd31_60' | 'd61_90' | 'd90';
export const BUCKETS: Bucket[] = ['current', 'd1_30', 'd31_60', 'd61_90', 'd90'];

export function bucketOf(daysOverdue: number): Bucket {
  if (daysOverdue <= 0) return 'current';
  if (daysOverdue <= 30) return 'd1_30';
  if (daysOverdue <= 60) return 'd31_60';
  if (daysOverdue <= 90) return 'd61_90';
  return 'd90';
}

export interface OpenInvoice {
  row: SaleRow;
  daysOverdue: number;
  bucket: Bucket;
}

/** Facturas pendientes de pago en una fecha. */
export function openInvoices(idx: Index, asOf: ISODate, f?: Filter): OpenInvoice[] {
  if (!idx.ds.hasReceivables) return [];
  const out: OpenInvoice[] = [];
  for (const r of idx.ds.rows) {
    if (r.date > asOf || !r.due) continue;
    if (r.paid && r.paid <= asOf) continue;
    if (!matches(r, f)) continue;
    const daysOverdue = diffDays(asOf, r.due);
    out.push({ row: r, daysOverdue, bucket: bucketOf(daysOverdue) });
  }
  return out;
}

export interface CustomerAging {
  customer: string;
  total: number;
  overdue: number;
  over60: number;
  over90: number;
  buckets: Record<Bucket, number>;
}

export interface Aging {
  asOf: ISODate;
  total: number;
  buckets: Record<Bucket, number>;
  over60: number;
  over90: number;
  customers: CustomerAging[];
}

const emptyBuckets = (): Record<Bucket, number> => ({ current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90: 0 });

export function aging(idx: Index, asOf: ISODate): Aging {
  const buckets = emptyBuckets();
  const per = new Map<string, CustomerAging>();
  let total = 0;
  for (const o of openInvoices(idx, asOf)) {
    buckets[o.bucket] += o.row.value;
    total += o.row.value;
    if (!per.has(o.row.customer)) per.set(o.row.customer, { customer: o.row.customer, total: 0, overdue: 0, over60: 0, over90: 0, buckets: emptyBuckets() });
    const c = per.get(o.row.customer)!;
    c.total += o.row.value;
    c.buckets[o.bucket] += o.row.value;
    if (o.daysOverdue > 0) c.overdue += o.row.value;
    if (o.daysOverdue > 60) c.over60 += o.row.value;
    if (o.daysOverdue > 90) c.over90 += o.row.value;
  }
  const customers = Array.from(per.values()).sort((a, b) => b.over60 - a.over60 || b.overdue - a.overdue);
  return { asOf, total, buckets, over60: buckets.d61_90 + buckets.d90, over90: buckets.d90, customers };
}

/* ------------------------------------------------------------------ */
/* Proyección                                                          */
/* ------------------------------------------------------------------ */

export interface ForecastPoint {
  month: MonthKey;
  value: number;
  low: number;
  high: number;
}

export interface Forecast {
  method: 'seasonal' | 'trend' | 'none';
  /** Desviación relativa usada para la banda. */
  sigma: number;
  points: ForecastPoint[];
}

/** Z de una banda central del 80 %. */
const Z80 = 1.2816;

function std(values: number[]) {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1));
}

/**
 * Proyección estadística de ventas totales (no usa IA):
 * - con 15 meses o más: mismo mes del año anterior × crecimiento de los últimos 3 meses frente a los mismos 3 meses del año anterior;
 * - con 4 a 14 meses: tendencia lineal de los últimos meses.
 * La banda (80 %) sale del error que habría tenido el mismo método en los meses ya conocidos.
 */
export function forecast(idx: Index, horizon = 3): Forecast {
  const months = idx.ds.months;
  const n = months.length;
  const S = (m: MonthKey) => totals(idx, [m]).sales;
  if (n < 4) return { method: 'none', sigma: 0, points: [] };
  const last = months[n - 1];
  const future = Array.from({ length: horizon }, (_, i) => addMonths(last, i + 1));
  const growthAt = (m: MonthKey) => {
    const recent = [1, 2, 3].map((k) => addMonths(m, -k));
    const before = recent.map((x) => addMonths(x, -12));
    if (!hasMonths(idx, recent) || !hasMonths(idx, before)) return null;
    const a = recent.reduce((s, x) => s + S(x), 0);
    const b = before.reduce((s, x) => s + S(x), 0);
    return b > 0 ? a / b : null;
  };
  const gNext = growthAt(addMonths(last, 1));
  if (gNext !== null && future.every((m) => idx.byMonth.has(addMonths(m, -12)))) {
    const errors: number[] = [];
    for (const m of months) {
      const g = growthAt(m);
      if (g === null || !idx.byMonth.has(addMonths(m, -12))) continue;
      const pred = S(addMonths(m, -12)) * g;
      if (pred > 0) errors.push(S(m) / pred - 1);
    }
    const sigma = Math.max(0.03, std(errors));
    return {
      method: 'seasonal',
      sigma,
      points: future.map((m, i) => {
        const value = S(addMonths(m, -12)) * gNext;
        const w = Z80 * sigma * Math.sqrt(i + 1);
        return { month: m, value, low: value * (1 - w), high: value * (1 + w) };
      }),
    };
  }
  const window = months.slice(-12);
  const ys = window.map(S);
  const xs = ys.map((_, i) => i);
  const mx = xs.reduce((s, x) => s + x, 0) / xs.length;
  const my = ys.reduce((s, y) => s + y, 0) / ys.length;
  const slope = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / Math.max(1e-9, xs.reduce((s, x) => s + (x - mx) ** 2, 0));
  const intercept = my - slope * mx;
  const resid = ys.map((y, i) => {
    const fit = intercept + slope * xs[i];
    return fit > 0 ? y / fit - 1 : 0;
  });
  const sigma = Math.max(0.03, std(resid));
  return {
    method: 'trend',
    sigma,
    points: future.map((m, i) => {
      const value = Math.max(0, intercept + slope * (window.length + i));
      const w = Z80 * sigma * Math.sqrt(i + 1);
      return { month: m, value, low: Math.max(0, value * (1 - w)), high: value * (1 + w) };
    }),
  };
}

/* ------------------------------------------------------------------ */
/* Desgloses                                                           */
/* ------------------------------------------------------------------ */

export interface DimRow {
  key: string;
  sales: number;
  cost: number;
  margin: number;
  share: number;
  budget: number | null;
  compliance: number | null;
  prevSales: number | null;
  prevMargin: number | null;
}

export function breakdown(idx: Index, months: MonthKey[], dim: 'city' | 'line', goalGrowth: number): DimRow[] {
  const keys = dim === 'city' ? idx.cities : idx.lines;
  const all = totals(idx, months).sales;
  const prevAvailable = hasMonths(idx, yearBefore(months));
  return keys
    .map((key) => {
      const f: Filter = dim === 'city' ? { city: key } : { line: key };
      const t = totals(idx, months, f);
      const prev = prevAvailable ? totals(idx, yearBefore(months), f) : null;
      const b = budget(idx, months, goalGrowth, f);
      return {
        key,
        sales: t.sales,
        cost: t.cost,
        margin: marginOf(t),
        share: all > 0 ? t.sales / all : 0,
        budget: b,
        compliance: ratio(t.sales, b),
        prevSales: prev ? prev.sales : null,
        prevMargin: prev && prev.sales > 0 ? marginOf(prev) : null,
      };
    })
    .filter((r) => r.sales > 0 || (r.prevSales ?? 0) > 0);
}

export interface MonthPoint {
  month: MonthKey;
  actual: number | null;
  budget: number | null;
  forecast: ForecastPoint | null;
}

/** Serie del año del período: real, meta y proyección de los meses siguientes al corte. */
export function yearSeries(idx: Index, year: number, goalGrowth: number, fc: Forecast): MonthPoint[] {
  return Array.from({ length: 12 }, (_, i) => {
    const month = `${year}-${String(i + 1).padStart(2, '0')}`;
    const actual = idx.byMonth.has(month) ? totals(idx, [month]).sales : null;
    return {
      month,
      actual,
      budget: budget(idx, [month], goalGrowth),
      forecast: fc.points.find((p) => p.month === month) ?? null,
    };
  }).filter((p) => p.actual !== null || p.forecast !== null || p.budget !== null);
}

/* ------------------------------------------------------------------ */
/* Estado de resultados                                                */
/* ------------------------------------------------------------------ */

/** Presupuesto de gastos: mismo período del año anterior + 6 %. */
export const EXPENSE_BUDGET_GROWTH = 6;

export interface PnlLine {
  key: string;
  kind: 'sales' | 'cost' | 'gross' | 'expense' | 'expenses' | 'operating';
  real: number;
  budget: number | null;
}

function expensesIn(idx: Index, months: MonthKey[]) {
  const map = new Map<string, number>();
  for (const e of idx.ds.expenses ?? []) if (months.includes(e.month)) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
  return map;
}

export function expenseCategories(idx: Index): string[] {
  return Array.from(new Set((idx.ds.expenses ?? []).map((e) => e.category)));
}

export function pnl(idx: Index, months: MonthKey[], goalGrowth: number): PnlLine[] {
  const t = totals(idx, months);
  const salesBudget = budget(idx, months, goalGrowth);
  const prev = hasMonths(idx, yearBefore(months)) ? totals(idx, yearBefore(months)) : null;
  const costBudget = salesBudget !== null && prev && prev.sales > 0 ? salesBudget * (prev.cost / prev.sales) : null;
  const lines: PnlLine[] = [
    { key: 'sales', kind: 'sales', real: t.sales, budget: salesBudget },
    { key: 'cost', kind: 'cost', real: t.cost, budget: costBudget },
    { key: 'gross', kind: 'gross', real: t.sales - t.cost, budget: salesBudget !== null && costBudget !== null ? salesBudget - costBudget : null },
  ];
  if (!idx.ds.expenses) return lines;
  const real = expensesIn(idx, months);
  const prevExp = prev ? expensesIn(idx, yearBefore(months)) : null;
  let totalReal = 0;
  let totalBudget: number | null = prevExp ? 0 : null;
  for (const cat of expenseCategories(idx)) {
    const r = real.get(cat) ?? 0;
    const b = prevExp ? (prevExp.get(cat) ?? 0) * (1 + EXPENSE_BUDGET_GROWTH / 100) : null;
    totalReal += r;
    if (totalBudget !== null && b !== null) totalBudget += b;
    lines.push({ key: cat, kind: 'expense', real: r, budget: b });
  }
  lines.push({ key: 'expenses', kind: 'expenses', real: totalReal, budget: totalBudget });
  const grossBudget = lines[2].budget;
  lines.push({
    key: 'operating',
    kind: 'operating',
    real: t.sales - t.cost - totalReal,
    budget: grossBudget !== null && totalBudget !== null ? grossBudget - totalBudget : null,
  });
  return lines;
}

/* ------------------------------------------------------------------ */
/* IVA y movimientos                                                   */
/* ------------------------------------------------------------------ */

const IVA_RATE = 0.19;
/** Día de ejemplo para pagar el IVA bimestral (el real depende del último dígito del NIT en el calendario DIAN). */
export const IVA_DAY = 12;

/** IVA a pagar de un bimestre (ventas gravadas − compras gravadas) con las ventas y costos dados. */
export function ivaFor(ds: Dataset, sales: number, cost: number): number {
  if (!ds.iva) return 0;
  return Math.max(0, IVA_RATE * (ds.iva.salesShare * sales - ds.iva.purchasesShare * cost));
}

export interface Movement {
  date: ISODate;
  kind: 'collection' | 'payroll' | 'rent' | 'tax';
  /** Cliente (cobros) o meses del bimestre (IVA). */
  ref: string;
  amount: number;
}

/** Movimientos de caja relevantes del período: cobros grandes, nómina, arriendo e IVA. */
export function movements(idx: Index, months: MonthKey[]): Movement[] {
  const ds = idx.ds;
  if (!ds.expenses || !ds.hasReceivables) return [];
  const out: Movement[] = [];
  const ivaFactor = ds.iva ? 1 + IVA_RATE * ds.iva.salesShare : 1;
  const paidIn = ds.rows.filter((r) => r.paid && months.includes(monthOf(r.paid)) && diffDays(r.paid, r.date) > 0);
  paidIn.sort((a, b) => b.value - a.value);
  for (const r of paidIn.slice(0, 5)) out.push({ date: r.paid!, kind: 'collection', ref: r.customer, amount: Math.round(r.value * ivaFactor) });
  const exp = (m: MonthKey, cat: string) => (ds.expenses ?? []).find((e) => e.month === m && e.category === cat)?.amount ?? 0;
  for (const m of months) {
    const payroll = exp(m, 'nomina');
    if (payroll) {
      out.push({ date: `${m}-15`, kind: 'payroll', ref: m, amount: -Math.round(payroll / 2) });
      out.push({ date: lastDay(m), kind: 'payroll', ref: m, amount: -Math.round(payroll / 2) });
    }
    const rent = exp(m, 'arriendo');
    if (rent) out.push({ date: `${m}-05`, kind: 'rent', ref: m, amount: -rent });
    if (ds.iva && monthNum(m) % 2 === 1) {
      const bim = [addMonths(m, -2), addMonths(m, -1)];
      if (hasMonths(idx, bim)) {
        const t = totals(idx, bim);
        out.push({ date: `${m}-${IVA_DAY}`, kind: 'tax', ref: `${bim[0]}|${bim[1]}`, amount: -Math.round(ivaFor(ds, t.sales, t.cost)) });
      }
    }
  }
  return out.filter((mv) => mv.date <= ds.cutoff).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/* ------------------------------------------------------------------ */
/* Flujo de caja a 13 semanas                                          */
/* ------------------------------------------------------------------ */

/** Facturas con más de estos días de vencidas no se proyectan como recaudo. */
export const LOST_AFTER_DAYS = 180;

export interface CashWeek {
  n: number;
  start: ISODate;
  end: ISODate;
  collections: number;
  newSales: number;
  suppliers: number;
  payroll: number;
  rent: number;
  other: number;
  tax: number;
  net: number;
  balance: number;
  /** Eventos destacados: `payroll`, `bonus` (prima), `tax`. */
  events: string[];
}

export interface CashFlow {
  start: number;
  weeks: CashWeek[];
  min: CashWeek;
  /** Facturas con más de 180 días de vencidas que no se proyectan como recaudo. */
  excludedOver180: number;
  supplierDays: number;
  collectionDays: number;
  taxDate: ISODate | null;
}

/** Flujo de caja proyectado desde el corte (solo datos de ejemplo: necesita cartera, gastos y caja inicial). */
export function cashFlow(idx: Index, fc: Forecast): CashFlow | null {
  const ds = idx.ds;
  if (ds.cashStart === null || !ds.expenses || !ds.hasReceivables || !fc.points.length) return null;
  const from = addDays(ds.cutoff, 1);
  const weeks: CashWeek[] = Array.from({ length: 13 }, (_, i) => ({
    n: i + 1,
    start: addDays(from, i * 7),
    end: addDays(from, i * 7 + 6),
    collections: 0,
    newSales: 0,
    suppliers: 0,
    payroll: 0,
    rent: 0,
    other: 0,
    tax: 0,
    net: 0,
    balance: 0,
    events: [],
  }));
  const weekOf = (d: ISODate) => {
    const k = Math.floor(diffDays(d, from) / 7);
    return k >= 0 && k < 13 ? weeks[k] : null;
  };
  const salesIva = ds.iva ? 1 + IVA_RATE * ds.iva.salesShare : 1;
  const buyIva = ds.iva ? 1 + IVA_RATE * ds.iva.purchasesShare : 1;
  const lastMonth = ds.months[ds.months.length - 1];
  const recent = [0, 1, 2].map((k) => addMonths(lastMonth, -k)).filter((m) => idx.byMonth.has(m));
  const recentTotals = totals(idx, recent);
  const costRatio = recentTotals.sales > 0 ? recentTotals.cost / recentTotals.sales : 0.7;

  // 1) Recaudo de la cartera abierta: vencimiento + atraso promedio de cada cliente. Lo que ya
  //    superó el atraso habitual se reparte en las 4 semanas siguientes (plan de cobro) y lo que
  //    lleva más de 180 días vencido no se proyecta.
  let excludedOver180 = 0;
  for (const o of openInvoices(idx, ds.cutoff)) {
    if (o.daysOverdue > LOST_AFTER_DAYS) {
      excludedOver180 += o.row.value;
      continue;
    }
    const info = idx.customerMap.get(o.row.customer);
    const expected = addDays(o.row.due!, info?.avgDelay ?? 0);
    if (expected >= from) {
      const w = weekOf(expected);
      if (w) w.collections += o.row.value * salesIva;
    } else {
      for (let k = 0; k < 4; k++) weeks[k].collections += (o.row.value * salesIva) / 4;
    }
  }

  // 2) Ventas proyectadas: se reparten entre los clientes según su peso en los últimos 3 meses y
  //    cada parte se cobra al plazo + atraso promedio de ese cliente.
  const mix = new Map<string, number>();
  for (const r of rowsIn(idx, recent)) mix.set(r.customer, (mix.get(r.customer) ?? 0) + r.value);
  let weighted = 0;
  const lags: { share: number; lag: number }[] = [];
  mix.forEach((v, name) => {
    const info = idx.customerMap.get(name);
    const lag = (info?.term ?? 30) + (info?.avgDelay ?? 0);
    const share = recentTotals.sales > 0 ? v / recentTotals.sales : 0;
    lags.push({ share, lag });
    weighted += share * lag;
  });
  const collectionDays = Math.round(weighted);
  for (const p of fc.points) {
    const dim = daysInMonth(p.month);
    for (let d = 1; d <= dim; d++) {
      const day = `${p.month}-${String(d).padStart(2, '0')}`;
      for (const { share, lag } of lags) {
        const w = weekOf(addDays(day, lag));
        if (w) w.newSales += (p.value / dim) * share * salesIva;
      }
    }
  }

  // 3) Proveedores: el costo de ventas se paga a los días pactados con proveedores.
  const supplierDays = ds.supplierDays ?? 30;
  for (const r of rowsIn(idx, [addMonths(lastMonth, -1), lastMonth])) {
    const w = weekOf(addDays(r.date, supplierDays));
    if (w) w.suppliers += (r.cost ?? 0) * buyIva;
  }
  for (const p of fc.points) {
    const dim = daysInMonth(p.month);
    for (let d = 1; d <= dim; d++) {
      const w = weekOf(addDays(`${p.month}-${String(d).padStart(2, '0')}`, supplierDays));
      if (w) w.suppliers += ((p.value * costRatio) / dim) * buyIva;
    }
  }

  // 4) Nómina (quincenal), prima de diciembre, arriendo y demás gastos.
  const exp = (cat: string) => (ds.expenses ?? []).find((e) => e.month === lastMonth && e.category === cat)?.amount ?? 0;
  const payroll = exp('nomina');
  const rent = exp('arriendo');
  const other = (ds.expenses ?? []).filter((e) => e.month === lastMonth && e.category !== 'nomina' && e.category !== 'arriendo').reduce((s, e) => s + e.amount, 0);
  for (const p of fc.points) {
    const m = p.month;
    for (const day of [`${m}-15`, lastDay(m)]) {
      const w = weekOf(day);
      if (w) {
        w.payroll += payroll / 2;
        if (!w.events.includes('payroll')) w.events.push('payroll');
      }
    }
    if (monthNum(m) === 12) {
      const w = weekOf(`${m}-18`);
      if (w) {
        w.payroll += payroll / 2;
        w.events.push('bonus');
      }
    }
    const wr = weekOf(`${m}-05`);
    if (wr) wr.rent += rent;
    const dim = daysInMonth(m);
    for (let d = 1; d <= dim; d++) {
      const w = weekOf(`${m}-${String(d).padStart(2, '0')}`);
      if (w) w.other += other / dim;
    }
  }

  // 5) IVA bimestral que vence dentro de las 13 semanas.
  let taxDate: ISODate | null = null;
  if (ds.iva) {
    for (const p of fc.points) {
      if (monthNum(p.month) % 2 !== 1) continue;
      const bim = [addMonths(p.month, -2), addMonths(p.month, -1)];
      let sales = 0;
      let cost = 0;
      for (const m of bim) {
        if (idx.byMonth.has(m)) {
          const t = totals(idx, [m]);
          sales += t.sales;
          cost += t.cost;
        } else {
          const f = fc.points.find((x) => x.month === m);
          sales += f?.value ?? 0;
          cost += (f?.value ?? 0) * costRatio;
        }
      }
      const date = `${p.month}-${IVA_DAY}`;
      const w = weekOf(date);
      if (w) {
        w.tax += ivaFor(ds, sales, cost);
        w.events.push('tax');
        taxDate = date;
      }
    }
  }

  let balance = ds.cashStart;
  for (const w of weeks) {
    w.net = w.collections + w.newSales - w.suppliers - w.payroll - w.rent - w.other - w.tax;
    balance += w.net;
    w.balance = balance;
  }
  const min = weeks.reduce((a, b) => (b.balance < a.balance ? b : a), weeks[0]);
  return { start: ds.cashStart, weeks, min, excludedOver180, collectionDays, supplierDays, taxDate };
}

/* ------------------------------------------------------------------ */
/* Clientes                                                            */
/* ------------------------------------------------------------------ */

export type Segment = 'nuevo' | 'recurrente' | 'riesgo';

export interface CustomerStat {
  name: string;
  city: string;
  seller: string;
  sales: number;
  cost: number;
  margin: number | null;
  invoices: number;
  prevSales: number | null;
  yoy: number | null;
  overdue: number;
  over60: number;
  segment: Segment;
}

export function customerStats(idx: Index, p: Period, riskDrop: number): CustomerStat[] {
  const end = periodEnd(idx.ds, p);
  const prevAvailable = hasMonths(idx, yearBefore(p.months));
  const ag = aging(idx, end);
  const agMap = new Map(ag.customers.map((c) => [c.customer, c]));
  const out: CustomerStat[] = [];
  for (const c of idx.customers) {
    if (c.first > end) continue;
    const t = totals(idx, p.months, { customer: c.name });
    const prev = prevAvailable ? totals(idx, yearBefore(p.months), { customer: c.name }).sales : null;
    const a = agMap.get(c.name);
    if (t.sales === 0 && !prev && !a) continue;
    const yoy = prev ? t.sales / prev - 1 : null;
    let segment: Segment = 'recurrente';
    if (diffDays(end, c.first) <= 180) segment = 'nuevo';
    else if (yoy !== null && yoy <= -riskDrop / 100) segment = 'riesgo';
    out.push({
      name: c.name,
      city: c.city,
      seller: c.seller,
      sales: t.sales,
      cost: t.cost,
      margin: idx.ds.hasCost && t.sales > 0 ? (t.sales - t.cost) / t.sales : null,
      invoices: t.invoices,
      prevSales: prev,
      yoy,
      overdue: a?.overdue ?? 0,
      over60: a?.over60 ?? 0,
      segment,
    });
  }
  return out.sort((a, b) => b.sales - a.sales);
}

/** Ventas de un cliente en los últimos 12 meses con datos hasta el período. */
export function customerMonths(idx: Index, name: string, p: Period): { month: MonthKey; sales: number }[] {
  const last = p.months[p.months.length - 1];
  return Array.from({ length: 12 }, (_, i) => addMonths(last, i - 11))
    .filter((m) => idx.byMonth.has(m))
    .map((m) => ({ month: m, sales: totals(idx, [m], { customer: name }).sales }));
}

/* ------------------------------------------------------------------ */
/* KPIs                                                                */
/* ------------------------------------------------------------------ */

export interface Kpis {
  sales: number;
  budget: number | null;
  compliance: number | null;
  salesYoy: number | null;
  margin: number | null;
  marginPrev: number | null;
  over60: number | null;
  over60Prev: number | null;
  ticket: number;
  ticketYoy: number | null;
  activeCustomers: number;
  activeCustomersYoy: number | null;
  invoices: number;
}

export function kpis(idx: Index, p: Period, goalGrowth: number): Kpis {
  const t = totals(idx, p.months);
  const prevAvailable = hasMonths(idx, yearBefore(p.months));
  const prev = prevAvailable ? totals(idx, yearBefore(p.months)) : null;
  const b = budget(idx, p.months, goalGrowth);
  const prevPeriod = previousMonths(p);
  const hasPrevPeriod = hasMonths(idx, prevPeriod);
  const ticket = t.invoices ? t.sales / t.invoices : 0;
  const prevTicket = prev && prev.invoices ? prev.sales / prev.invoices : null;
  return {
    sales: t.sales,
    budget: b,
    compliance: ratio(t.sales, b),
    salesYoy: prev ? change(t.sales, prev.sales) : null,
    margin: idx.ds.hasCost ? marginOf(t) : null,
    marginPrev: idx.ds.hasCost && prev && prev.sales > 0 ? marginOf(prev) : null,
    over60: idx.ds.hasReceivables ? aging(idx, periodEnd(idx.ds, p)).over60 : null,
    over60Prev: idx.ds.hasReceivables && hasPrevPeriod ? aging(idx, lastDay(prevPeriod[prevPeriod.length - 1])).over60 : null,
    ticket,
    ticketYoy: change(ticket, prevTicket),
    activeCustomers: t.customers,
    activeCustomersYoy: prev ? change(t.customers, prev.customers) : null,
    invoices: t.invoices,
  };
}

/* ------------------------------------------------------------------ */
/* Alertas                                                             */
/* ------------------------------------------------------------------ */

export type Severity = 'critical' | 'warning' | 'info';

export interface Alert {
  id: string;
  kind: 'salesGoal' | 'cityGoal' | 'lineMargin' | 'overdue90' | 'cashFloor' | 'customersRisk' | 'forecastGoal';
  severity: Severity;
  view: 'resumen' | 'finanzas' | 'clientes';
  /** Valores numéricos; el texto lo arma la interfaz. */
  values: Record<string, number>;
  /** Textos (ciudad, línea, nombres). */
  labels: Record<string, string>;
}

/** Parámetros del visitante que afectan los cálculos. */
export interface Params {
  goalGrowth: number;
  thresholds: Thresholds;
}

export interface Context {
  idx: Index;
  period: Period;
  params: Params;
  kpis: Kpis;
  fc: Forecast;
  cash: CashFlow | null;
  aging: Aging | null;
  cities: DimRow[];
  lines: DimRow[];
  customers: CustomerStat[];
}

export function buildContext(idx: Index, period: Period, params: Params): Context {
  const fc = forecast(idx);
  return {
    idx,
    period,
    params,
    kpis: kpis(idx, period, params.goalGrowth),
    fc,
    cash: cashFlow(idx, fc),
    aging: idx.ds.hasReceivables ? aging(idx, periodEnd(idx.ds, period)) : null,
    cities: breakdown(idx, period.months, 'city', params.goalGrowth),
    lines: breakdown(idx, period.months, 'line', params.goalGrowth),
    customers: customerStats(idx, period, params.thresholds.riskDrop),
  };
}

/** Próximo trimestre proyectado (meses de la proyección) frente a su meta. */
export function forecastVsGoal(ctx: Context): { months: MonthKey[]; value: number; low: number; high: number; budget: number | null } | null {
  const pts = ctx.fc.points;
  if (!pts.length) return null;
  const months = pts.map((p) => p.month);
  const value = pts.reduce((s, p) => s + p.value, 0);
  const low = pts.reduce((s, p) => s + p.low, 0);
  const high = pts.reduce((s, p) => s + p.high, 0);
  const prev = months.map((m) => addMonths(m, -12));
  const b = hasMonths(ctx.idx, prev) ? totals(ctx.idx, prev).sales * (1 + ctx.params.goalGrowth / 100) : null;
  return { months, value, low, high, budget: b };
}

export function alerts(ctx: Context): Alert[] {
  const th: Thresholds = ctx.params.thresholds;
  const out: Alert[] = [];
  const k = ctx.kpis;
  const gap = th.goalGap / 100;
  if (k.compliance !== null && k.compliance < 1 - gap) {
    out.push({
      id: 'salesGoal',
      kind: 'salesGoal',
      severity: k.compliance < 1 - 2 * gap ? 'critical' : 'warning',
      view: 'resumen',
      values: { gap: 1 - k.compliance, sales: k.sales, budget: k.budget ?? 0 },
      labels: {},
    });
  }
  for (const c of ctx.cities) {
    if (c.compliance !== null && c.compliance < 1 - gap) {
      out.push({
        id: `city:${c.key}`,
        kind: 'cityGoal',
        severity: c.compliance < 1 - 2 * gap ? 'critical' : 'warning',
        view: 'resumen',
        values: { gap: 1 - c.compliance, sales: c.sales, budget: c.budget ?? 0 },
        labels: { city: c.key },
      });
    }
  }
  if (ctx.idx.ds.hasCost) {
    for (const l of ctx.lines) {
      if (l.prevMargin === null || l.sales === 0) continue;
      const drop = (l.prevMargin - l.margin) * 100;
      if (drop >= th.marginDrop) {
        out.push({ id: `line:${l.key}`, kind: 'lineMargin', severity: 'warning', view: 'resumen', values: { drop, margin: l.margin, prev: l.prevMargin }, labels: { line: l.key } });
      }
    }
  }
  if (ctx.aging) {
    const prevMonths = previousMonths(ctx.period);
    if (hasMonths(ctx.idx, prevMonths)) {
      const before = aging(ctx.idx, lastDay(prevMonths[prevMonths.length - 1])).over90;
      const now = ctx.aging.over90;
      if (before > 0 && now / before - 1 >= th.overdueGrowth / 100) {
        out.push({ id: 'overdue90', kind: 'overdue90', severity: 'warning', view: 'finanzas', values: { growth: now / before - 1, now, before }, labels: {} });
      }
    }
  }
  if (ctx.cash && ctx.cash.min.balance < th.cashFloor * 1e6) {
    out.push({
      id: 'cashFloor',
      kind: 'cashFloor',
      severity: 'critical',
      view: 'finanzas',
      values: { balance: ctx.cash.min.balance, week: ctx.cash.min.n, floor: th.cashFloor * 1e6 },
      labels: { start: ctx.cash.min.start, end: ctx.cash.min.end },
    });
  }
  const risk = ctx.customers.filter((c) => c.segment === 'riesgo');
  if (risk.length) {
    out.push({
      id: 'customersRisk',
      kind: 'customersRisk',
      severity: 'info',
      view: 'clientes',
      values: { count: risk.length, lost: risk.reduce((s, c) => s + ((c.prevSales ?? 0) - c.sales), 0) },
      labels: { names: risk.slice(0, 3).map((c) => c.name).join(', ') },
    });
  }
  const fq = forecastVsGoal(ctx);
  if (fq && fq.budget && fq.value / fq.budget < 1 - gap) {
    out.push({ id: 'forecastGoal', kind: 'forecastGoal', severity: 'info', view: 'resumen', values: { compliance: fq.value / fq.budget, value: fq.value, budget: fq.budget }, labels: { from: fq.months[0], to: fq.months[fq.months.length - 1] } });
  }
  const order: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };
  return out.sort((a, b) => order[a.severity] - order[b.severity]);
}

/* ------------------------------------------------------------------ */
/* Hallazgos del resumen automático                                    */
/* ------------------------------------------------------------------ */

export interface Finding {
  kind: 'sales' | 'margin' | 'overdue' | 'forecast';
  tone: 'good' | 'bad' | 'neutral';
  view: 'resumen' | 'finanzas' | 'clientes';
  values: Record<string, number>;
  labels: Record<string, string>;
}

export function findings(ctx: Context): Finding[] {
  const out: Finding[] = [];
  const k = ctx.kpis;
  if (k.compliance !== null && k.budget !== null) {
    const below = k.compliance < 1;
    const ranked = ctx.cities.filter((c) => c.budget !== null).map((c) => ({ c, diff: c.sales - (c.budget ?? 0) }));
    ranked.sort((a, b) => (below ? a.diff - b.diff : b.diff - a.diff));
    const top = ranked[0];
    out.push({
      kind: 'sales',
      tone: below ? 'bad' : 'good',
      view: 'resumen',
      values: { sales: k.sales, budget: k.budget, compliance: k.compliance, cityDiff: top ? top.diff : 0, cityCompliance: top?.c.compliance ?? 0 },
      labels: { city: top ? top.c.key : '' },
    });
  }
  if (k.margin !== null && k.marginPrev !== null) {
    const withPrev = ctx.lines.filter((l) => l.prevMargin !== null && l.sales > 0);
    withPrev.sort((a, b) => Math.abs(b.margin - (b.prevMargin ?? 0)) - Math.abs(a.margin - (a.prevMargin ?? 0)));
    const l = withPrev[0];
    out.push({
      kind: 'margin',
      tone: k.margin >= k.marginPrev ? 'good' : 'bad',
      view: 'resumen',
      values: { margin: k.margin, prev: k.marginPrev, lineMargin: l?.margin ?? 0, linePrev: l?.prevMargin ?? 0 },
      labels: { line: l?.key ?? '' },
    });
  }
  if (ctx.aging && ctx.aging.over90 > 0) {
    const top = ctx.aging.customers.filter((c) => c.over90 > 0).sort((a, b) => b.over90 - a.over90).slice(0, 3);
    const share = top.reduce((s, c) => s + c.over90, 0) / ctx.aging.over90;
    out.push({
      kind: 'overdue',
      tone: 'bad',
      view: 'finanzas',
      values: { over90: ctx.aging.over90, count: top.length, share },
      labels: { names: top.map((c) => c.customer).join(', ') },
    });
  }
  const fq = forecastVsGoal(ctx);
  if (fq) {
    out.push({
      kind: 'forecast',
      tone: fq.budget && fq.value < fq.budget ? 'bad' : 'neutral',
      view: 'resumen',
      values: { value: fq.value, low: fq.low, high: fq.high, compliance: fq.budget ? fq.value / fq.budget : 0, hasBudget: fq.budget ? 1 : 0 },
      labels: { from: fq.months[0], to: fq.months[fq.months.length - 1] },
    });
  }
  return out;
}
