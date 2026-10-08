/**
 * Tablero ejecutivo: las cifras salen de un solo dataset y cuadran entre
 * vistas (Resumen, Finanzas, Clientes, cartera, flujo de caja), los datos de
 * ejemplo son determinísticos y el CSV del visitante se lee bien.
 */
import { buildUploadDataset, guessMapping, parseAmount, parseCsv, toCsv } from '../lib/csv';
import { buildSample } from '../lib/dataset';
import { normalizeDate } from '../lib/dates';
import {
  aging,
  alerts,
  BUCKETS,
  buildContext,
  buildIndex,
  cashFlow,
  findPeriod,
  forecast,
  kpis,
  openInvoices,
  periodEnd,
  periodOptions,
  pnl,
  totals,
} from '../lib/engine';
import { formatNit, nitDv, PRESETS } from '../lib/presets';
import { SECTORS } from '../lib/types';

const params = (sector: (typeof SECTORS)[number]) => ({ goalGrowth: PRESETS[sector].goalGrowth, thresholds: PRESETS[sector].thresholds });

describe('Tablero ejecutivo · datos de ejemplo', () => {
  it('genera siempre las mismas facturas (sin Date.now ni Math.random)', () => {
    for (const s of SECTORS) expect(JSON.stringify(buildSample(s))).toBe(JSON.stringify(buildSample(s)));
  });

  it('los números de factura son únicos y las fechas están dentro del período de ejemplo', () => {
    for (const s of SECTORS) {
      const ds = buildSample(s);
      expect(new Set(ds.rows.map((r) => r.id)).size).toBe(ds.rows.length);
      for (const r of ds.rows) {
        expect(r.date >= '2025-01-01' && r.date <= ds.cutoff).toBe(true);
        expect(r.value).toBeGreaterThan(0);
        if (r.paid) expect(r.paid <= ds.cutoff && r.paid >= r.date).toBe(true);
      }
    }
  });

  it('el NIT de ejemplo lleva el dígito de verificación de la DIAN', () => {
    expect(nitDv('800197268')).toBe(4);
    expect(formatNit('901457832')).toBe(`901.457.832-${nitDv('901457832')}`);
  });
});

describe('Tablero ejecutivo · las cifras cuadran entre vistas', () => {
  for (const sector of SECTORS) {
    const ds = buildSample(sector);
    const idx = buildIndex(ds);
    for (const p of periodOptions(ds)) {
      it(`${sector} ${p.key}: KPI = estado de resultados = suma de clientes = suma de ciudades y líneas`, () => {
        const ctx = buildContext(idx, p, params(sector));
        const sum = ds.rows.filter((r) => p.months.includes(r.date.slice(0, 7))).reduce((s, r) => s + r.value, 0);
        expect(ctx.kpis.sales).toBeCloseTo(sum, 0);
        const lines = pnl(idx, p.months, params(sector).goalGrowth);
        expect(lines.find((l) => l.key === 'sales')!.real).toBeCloseTo(sum, 0);
        expect(ctx.customers.reduce((s, c) => s + c.sales, 0)).toBeCloseTo(sum, 0);
        expect(ctx.cities.reduce((s, c) => s + c.sales, 0)).toBeCloseTo(sum, 0);
        expect(ctx.lines.reduce((s, c) => s + c.sales, 0)).toBeCloseTo(sum, 0);
        const gross = lines.find((l) => l.key === 'gross')!.real;
        expect(gross).toBeCloseTo(sum - totals(idx, p.months).cost, 0);
        const op = lines.find((l) => l.key === 'operating')!.real;
        const exp = lines.find((l) => l.key === 'expenses')!.real;
        expect(op).toBeCloseTo(gross - exp, 0);
      });
    }
  }

  it('la cartera por edades suma lo mismo que las facturas pendientes y que la cartera por cliente', () => {
    const ds = buildSample('comercio');
    const idx = buildIndex(ds);
    const p = findPeriod(ds, 'm:2026-09');
    const ag = aging(idx, periodEnd(ds, p));
    const open = openInvoices(idx, ag.asOf).reduce((s, o) => s + o.row.value, 0);
    expect(BUCKETS.reduce((s, b) => s + ag.buckets[b], 0)).toBeCloseTo(open, 0);
    expect(ag.customers.reduce((s, c) => s + c.total, 0)).toBeCloseTo(open, 0);
    expect(kpis(idx, p, 10).over60).toBeCloseTo(ag.buckets.d61_90 + ag.buckets.d90, 0);
  });

  it('el flujo de caja encadena los saldos semana a semana', () => {
    for (const s of SECTORS) {
      const idx = buildIndex(buildSample(s));
      const cf = cashFlow(idx, forecast(idx))!;
      expect(cf.weeks).toHaveLength(13);
      let bal = cf.start;
      for (const w of cf.weeks) {
        bal += w.collections + w.newSales - w.suppliers - w.payroll - w.rent - w.other - w.tax;
        expect(w.balance).toBeCloseTo(bal, 0);
      }
      expect(cf.min.balance).toBe(Math.min(...cf.weeks.map((w) => w.balance)));
    }
  });

  it('la meta sale del año anterior y cambia con el crecimiento configurado', () => {
    const ds = buildSample('comercio');
    const idx = buildIndex(ds);
    const p = findPeriod(ds, 'q:2026-3');
    const prev = totals(idx, ['2025-07', '2025-08', '2025-09']).sales;
    expect(kpis(idx, p, 10).budget).toBeCloseTo(prev * 1.1, 0);
    expect(kpis(idx, p, 0).budget).toBeCloseTo(prev, 0);
  });

  it('las alertas responden a los umbrales', () => {
    const ds = buildSample('comercio');
    const idx = buildIndex(ds);
    const p = findPeriod(ds, 'm:2026-09');
    const strict = alerts(buildContext(idx, p, params('comercio')));
    const lax = alerts(
      buildContext(idx, p, { goalGrowth: 0, thresholds: { goalGap: 50, marginDrop: 50, overdueGrowth: 100, cashFloor: 0, riskDrop: 100 } }),
    );
    expect(strict.length).toBeGreaterThan(lax.length);
    expect(strict.some((a) => a.kind === 'salesGoal')).toBe(true);
    expect(lax.some((a) => a.kind === 'salesGoal')).toBe(false);
  });

  it('la proyección trae 3 meses con banda que contiene el valor central', () => {
    const idx = buildIndex(buildSample('servicios'));
    const fc = forecast(idx);
    expect(fc.method).toBe('seasonal');
    expect(fc.points.map((x) => x.month)).toEqual(['2026-10', '2026-11', '2026-12']);
    for (const x of fc.points) expect(x.low < x.value && x.value < x.high).toBe(true);
  });
});

describe('Tablero ejecutivo · Prueba con tu CSV', () => {
  it('lee montos y fechas en formatos colombianos y en inglés', () => {
    expect(parseAmount('1.250.000')).toBe(1250000);
    expect(parseAmount('$ 1.250.000,50')).toBe(1250000.5);
    expect(parseAmount('1,250,000.50')).toBe(1250000.5);
    expect(parseAmount('1250000')).toBe(1250000);
    expect(parseAmount('12.5')).toBe(12.5);
    expect(parseAmount('(1.200)')).toBe(-1200);
    expect(parseAmount('abc')).toBeNull();
    expect(normalizeDate('30/09/2026')).toBe('2026-09-30');
    expect(normalizeDate('2026-9-1')).toBe('2026-09-01');
    expect(normalizeDate('31/02/2026')).toBeNull();
  });

  it('el CSV exportado se vuelve a leer igual (ida y vuelta) y recalcula el tablero', () => {
    const ds = buildSample('comercio');
    const csv = toCsv(
      ['fecha', 'factura', 'cliente', 'ciudad', 'linea', 'vendedor', 'valor', 'costo'],
      ds.rows.map((r) => [r.date, r.id, r.customer, r.city, r.line, r.seller, Math.round(r.value), r.cost]),
      'es',
    );
    const parsed = parseCsv(csv);
    expect(parsed.delimiter).toBe(';');
    const mapping = guessMapping(parsed.headers);
    expect(mapping).toMatchObject({ date: 0, invoice: 1, customer: 2, city: 3, line: 4, seller: 5, value: 6, cost: 7 });
    const res = buildUploadDataset(parsed, mapping, 'ventas.csv', 'comercio', { noCity: '-', noLine: '-', noSeller: '-' });
    expect(res.used).toBe(ds.rows.length);
    expect(res.skipped).toBe(0);
    const up = res.dataset!;
    expect(up.hasCost).toBe(true);
    expect(up.hasReceivables).toBe(false);
    const p = findPeriod(up, 'm:2026-09');
    expect(kpis(buildIndex(up), p, 10).sales).toBeCloseTo(kpis(buildIndex(ds), findPeriod(ds, 'm:2026-09'), 10).sales, 0);
    expect(cashFlow(buildIndex(up), forecast(buildIndex(up)))).toBeNull();
  });

  it('ignora filas inválidas y avisa cuántas', () => {
    const parsed = parseCsv('fecha,cliente,valor\n2026-01-05,Cliente Uno,100000\nayer,Cliente Dos,5000\n2026-01-06,,7000\n2026-01-07,Cliente Tres,n/a\n');
    const res = buildUploadDataset(parsed, guessMapping(parsed.headers), 'x.csv', 'comercio', { noCity: 'Sin ciudad', noLine: 'Sin línea', noSeller: 'Sin vendedor' });
    expect(res.used).toBe(1);
    expect(res.reasons).toEqual({ badDate: 1, badValue: 1, noCustomer: 1 });
    expect(res.dataset!.rows[0]).toMatchObject({ city: 'Sin ciudad', cost: null });
    expect(res.dataset!.hasCost).toBe(false);
  });
});
