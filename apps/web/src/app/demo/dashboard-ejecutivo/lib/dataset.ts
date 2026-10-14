/**
 * Generador determinístico de los datos de ejemplo: con la misma semilla
 * produce siempre las mismas facturas y gastos (en el servidor y en el
 * navegador), así no hay diferencias de hidratación y las cifras se pueden
 * verificar con pruebas.
 */
import { addDays, addMonths, daysInMonth, lastDay, monthNum, monthRange, yearOf } from './dates';
import { PRESETS, SAMPLE_MONTHS, type CustomerSeed, type Preset } from './presets';
import type { Dataset, ExpenseRow, MonthKey, SaleRow, SectorId } from './types';

/** PRNG mulberry32 con semilla de texto. */
export function rng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (r: () => number, a: number, b: number) => a + (b - a) * r();
const intBetween = (r: () => number, a: number, b: number) => Math.floor(between(r, a, b + 1));

function pick<T extends string>(r: () => number, weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let x = r() * total;
  for (const [k, w] of entries) {
    x -= w;
    if (x <= 0) return k;
  }
  return entries[entries.length - 1][0];
}

function shockFactor(p: Preset, month: MonthKey, anchor: MonthKey, city: string, line: string) {
  let sales = 1;
  let margin = 0;
  for (const s of p.shocks) {
    if (month > anchor || month < addMonths(anchor, 1 - s.lastMonths)) continue;
    if (s.city && s.city !== city) continue;
    if (s.line && s.line !== line) continue;
    if (s.sales) sales *= s.sales;
    if (s.margin) margin += s.margin;
  }
  return { sales, margin };
}

function lineWeights(p: Preset, c: CustomerSeed): Record<string, number> {
  if (c.lines) return c.lines;
  return Object.fromEntries(p.lines.map((l) => [l.id, l.weight]));
}

const round100 = (n: number) => Math.round(n / 100) * 100;

/**
 * Genera las facturas y gastos de ejemplo de un sector: los 24 meses que
 * terminan en `anchor` (el mes de corte). Con el mismo mes de corte la salida
 * es siempre la misma; cada mes nuevo los datos se corren un mes.
 */
export function buildSample(sector: SectorId, anchor: MonthKey): Dataset {
  const p = PRESETS[sector];
  const r = rng(p.seed);
  const months = monthRange(addMonths(anchor, 1 - SAMPLE_MONTHS), anchor);
  const cutoff = lastDay(anchor);
  const since = (c: CustomerSeed) => (c.since ? addMonths(anchor, -c.since) : null);
  const baseSize = p.customers.filter((c) => !c.since).reduce((s, c) => s + c.size, 0);
  const margins = Object.fromEntries(p.lines.map((l) => [l.id, l.margin]));
  const draft: Omit<SaleRow, 'id'>[] = [];

  months.forEach((month, t) => {
    const season = p.season[monthNum(month) - 1];
    const dim = daysInMonth(month);
    for (const c of p.customers) {
      const first = since(c);
      if (first && month < first) continue;
      let ramp = 1;
      if (first) {
        const age = months.indexOf(month) - months.indexOf(first);
        ramp = age === 0 ? 0.55 : age === 1 ? 0.8 : 1;
      }
      // Tendencia anual del sector y del cliente; el nivel base (`monthlyBase`) es el de hace 12 meses.
      const years = (t - 12) / 12;
      const trend = Math.pow(1 + p.growth, years) * Math.pow(1 + c.trend, years);
      const total = (p.monthlyBase * c.size) / baseSize * season * trend * ramp * between(r, 0.92, 1.08);
      const weights = lineWeights(p, c);
      for (const [line, w] of Object.entries(weights)) {
        const lineTotal = total * w * between(r, 0.88, 1.12);
        // Clientes con varias sedes: una factura por sede con su peso; con una sola ciudad, 1 a 3 facturas.
        const splits: { city: string; share: number }[] =
          typeof c.city === 'string'
            ? Array.from({ length: c.size >= 6 ? intBetween(r, 2, 3) : c.size >= 3 ? intBetween(r, 1, 2) : 1 }, () => ({ city: c.city as string, share: between(r, 0.7, 1.3) }))
            : Object.entries(c.city).map(([city, cw]) => ({ city, share: cw * between(r, 0.9, 1.1) }));
        const shareSum = splits.reduce((s, x) => s + x.share, 0);
        for (const { city, share } of splits) {
          const shock = shockFactor(p, month, anchor, city, line);
          const value = round100((lineTotal * share) / shareSum * shock.sales);
          if (value <= 0) continue;
          const bigDiscount = c.size >= 8 ? 0.012 : 0;
          const margin = margins[line] + shock.margin - bigDiscount + between(r, -0.012, 0.012);
          const day = intBetween(r, 1, dim);
          const date = `${month}-${String(day).padStart(2, '0')}`;
          const due = addDays(date, c.term);
          let paid: string | null;
          if (c.term === 0) paid = date;
          else if (c.pay === 'puntual') paid = addDays(due, intBetween(r, -6, 4));
          else if (c.pay === 'lento') paid = addDays(due, intBetween(r, 8, 42));
          else paid = addDays(due, r() < 0.6 ? intBetween(r, 40, 120) : intBetween(r, 120, 260));
          if (paid < date) paid = date;
          if (paid > cutoff) paid = null;
          draft.push({
            date,
            customer: c.name,
            city,
            line,
            seller: p.sellers[c.seller],
            value,
            cost: round100(value * (1 - margin)),
            due,
            paid,
          });
        }
      }
    }
  });

  draft.sort((a, b) => (a.date === b.date ? a.customer.localeCompare(b.customer, 'es') : a.date < b.date ? -1 : 1));
  const rows: SaleRow[] = draft.map((d, i) => ({ id: `${p.invoicePrefix}-${p.invoiceStart + i}`, ...d }));

  const salesByMonth = new Map<MonthKey, number>();
  for (const row of rows) {
    const m = row.date.slice(0, 7);
    salesByMonth.set(m, (salesByMonth.get(m) ?? 0) + row.value);
  }
  const er = rng(`${p.seed}-gastos`);
  const expenses: ExpenseRow[] = [];
  months.forEach((month) => {
    for (const e of p.expenses) {
      let amount: number;
      if (e.variable) amount = (salesByMonth.get(month) ?? 0) * e.variable * between(er, 0.95, 1.05);
      else {
        // Los gastos fijos suben en enero de cada año (como el salario mínimo); `monthly` es el valor del año anterior al corte.
        const years = yearOf(month) - (yearOf(anchor) - 1);
        amount = (e.monthly ?? 0) * Math.pow(1 + e.growth, years) * between(er, 0.97, 1.03);
      }
      expenses.push({ month, category: e.id, amount: round100(amount) });
    }
  });

  return {
    source: 'sample',
    sector,
    fileName: null,
    rows,
    expenses,
    months,
    cutoff,
    cashStart: p.cashStart,
    supplierDays: p.supplierDays,
    hasCost: true,
    hasReceivables: true,
    iva: p.iva,
  };
}
