/**
 * Tablero ejecutivo: las cifras salen de un solo dataset y cuadran entre
 * vistas (Resumen, Finanzas, Clientes, cartera, flujo de caja), los datos de
 * ejemplo son determinísticos y el CSV del visitante se lee bien.
 */
import { buildUploadDataset, csvDecimal, guessMapping, parseAmount, parseCsv, toCsv } from '../lib/csv';
import { buildSample as buildSampleAt } from '../lib/dataset';
import { addMonths, lastClosedMonth, lastDay, normalizeDate } from '../lib/dates';
import {
  aging,
  alerts,
  BUCKETS,
  buildContext,
  buildIndex,
  cashFlow,
  findPeriod,
  forecast,
  hasMonths,
  kpis,
  openInvoices,
  periodEnd,
  periodOptions,
  pnl,
  sortCustomers,
  totals,
  trailingSeries,
  yearBefore,
} from '../lib/engine';
import { formatNit, nitDv, PRESETS, REFERENCE_ANCHOR, SAMPLE_MONTHS } from '../lib/presets';
import { SECTORS, type SectorId } from '../lib/types';

const params = (sector: (typeof SECTORS)[number]) => ({ goalGrowth: PRESETS[sector].goalGrowth, thresholds: PRESETS[sector].thresholds });
/** Datos de ejemplo con el corte de referencia (30 sep 2026), el mismo de la guía. */
const buildSample = (sector: SectorId) => buildSampleAt(sector, REFERENCE_ANCHOR);

describe('Tablero ejecutivo · datos de ejemplo', () => {
  it('genera siempre las mismas facturas (sin Date.now ni Math.random)', () => {
    for (const s of SECTORS) expect(JSON.stringify(buildSample(s))).toBe(JSON.stringify(buildSample(s)));
  });

  it('los números de factura son únicos y las fechas están dentro del período de ejemplo', () => {
    for (const s of SECTORS) {
      const ds = buildSample(s);
      expect(new Set(ds.rows.map((r) => r.id)).size).toBe(ds.rows.length);
      expect(ds.months).toHaveLength(SAMPLE_MONTHS);
      expect(ds.months[0]).toBe('2024-10');
      expect(ds.cutoff).toBe('2026-09-30');
      for (const r of ds.rows) {
        expect(r.date >= '2024-10-01' && r.date <= ds.cutoff).toBe(true);
        expect(r.value).toBeGreaterThan(0);
        if (r.paid) expect(r.paid <= ds.cutoff && r.paid >= r.date).toBe(true);
      }
    }
  });

  it('el NIT de ejemplo lleva el dígito de verificación de la DIAN', () => {
    expect(nitDv('800197268')).toBe(4);
    expect(formatNit('901457832')).toBe(`901.457.832-${nitDv('901457832')}`);
    expect(formatNit('800197268-4')).toBe('800.197.268-4');
    for (const s of SECTORS) expect(formatNit(PRESETS[s].company.nit)).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d$/);
  });
});

describe('Tablero ejecutivo · fechas coherentes con hoy', () => {
  it('el corte es el último mes cerrado en Colombia (UTC−5)', () => {
    expect(lastClosedMonth(new Date('2026-10-14T15:00:00Z'))).toBe('2026-09');
    // 30 sep 2026 a las 10 p. m. en Bogotá: todavía es septiembre.
    expect(lastClosedMonth(new Date('2026-10-01T03:00:00Z'))).toBe('2026-08');
    expect(lastClosedMonth(new Date('2026-10-01T06:00:00Z'))).toBe('2026-09');
    // 31 dic 2026 a las 11:59 p. m. en Bogotá y 1 ene 2027 a medianoche.
    expect(lastClosedMonth(new Date('2027-01-01T04:59:00Z'))).toBe('2026-11');
    expect(lastClosedMonth(new Date('2027-01-01T05:00:00Z'))).toBe('2026-12');
  });

  const anchors = Array.from({ length: 12 }, (_, i) => addMonths('2026-10', i));

  it('los datos terminan en el mes de corte y nada queda después del corte', () => {
    for (const a of anchors) {
      const ds = buildSampleAt('comercio', a);
      expect(ds.months[ds.months.length - 1]).toBe(a);
      expect(ds.cutoff).toBe(lastDay(a));
      for (const r of ds.rows) {
        expect(r.date <= ds.cutoff).toBe(true);
        if (r.paid) expect(r.paid <= ds.cutoff).toBe(true);
      }
    }
  });

  it('la historia del ejemplo se mantiene cada mes: ventas bajo la meta, Cali rezagada y clientes en riesgo', () => {
    for (const a of anchors) {
      const ds = buildSampleAt('comercio', a);
      const ctx = buildContext(buildIndex(ds), findPeriod(ds, null), params('comercio'));
      expect(ctx.kpis.compliance!).toBeGreaterThan(0.9);
      expect(ctx.kpis.compliance!).toBeLessThan(0.97);
      expect(ctx.cities.find((c) => c.key === 'Cali')!.compliance!).toBeLessThan(0.8);
      expect(ctx.customers.filter((c) => c.segment === 'riesgo').length).toBeGreaterThanOrEqual(3);
      expect(ctx.customers.some((c) => c.segment === 'nuevo')).toBe(true);
      // La caja arranca sobre el mínimo: si salta la alerta de caja es por una semana proyectada.
      expect(ctx.cash!.start).toBeGreaterThanOrEqual(params('comercio').thresholds.cashFloor * 1e6);
    }
  });

  it('el selector ofrece los últimos 12 meses, sus trimestres y el año a la fecha, todos con año anterior para comparar', () => {
    for (const a of ['2026-09', '2027-01', '2027-02', '2026-11']) {
      const ds = buildSampleAt('comercio', a);
      const idx = buildIndex(ds);
      const opts = periodOptions(ds);
      const months = opts.filter((p) => p.kind === 'month');
      expect(months).toHaveLength(12);
      expect(months[0].key).toBe(`m:${a}`);
      expect(months[11].key).toBe(`m:${addMonths(a, -11)}`);
      const quarters = opts.filter((p) => p.kind === 'quarter');
      expect(quarters.length).toBeGreaterThanOrEqual(4);
      expect(quarters[0].months).toContain(a);
      const ytd = opts.filter((p) => p.kind === 'year');
      expect(ytd).toHaveLength(1);
      expect(ytd[0].months[ytd[0].months.length - 1]).toBe(a);
      for (const p of opts) expect(hasMonths(idx, yearBefore(p.months))).toBe(true);
    }
    expect(periodOptions(buildSampleAt('comercio', '2027-01')).find((p) => p.kind === 'year')!.months).toEqual(['2027-01']);
  });

  it('el gráfico muestra 12 meses con meta y, en el último mes, 3 meses proyectados', () => {
    const ds = buildSample('comercio');
    const idx = buildIndex(ds);
    const fc = forecast(idx);
    const latest = trailingSeries(idx, '2026-09', 10, fc);
    expect(latest.map((p) => p.month)).toEqual([...Array.from({ length: 12 }, (_, i) => addMonths('2025-10', i)), '2026-10', '2026-11', '2026-12']);
    expect(latest.every((p) => p.budget !== null)).toBe(true);
    expect(latest.filter((p) => p.forecast).length).toBe(3);
    const older = trailingSeries(idx, '2026-03', 10, fc);
    expect(older).toHaveLength(12);
    expect(older.some((p) => p.forecast)).toBe(false);
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

  it('la prima de servicios se proyecta en junio y en diciembre', () => {
    for (const [a, month] of [
      ['2026-09', '2026-12'],
      ['2027-03', '2027-06'],
    ]) {
      const idx = buildIndex(buildSampleAt('comercio', a));
      const cf = cashFlow(idx, forecast(idx))!;
      const bonus = cf.weeks.filter((w) => w.events.includes('bonus'));
      expect(bonus).toHaveLength(1);
      expect(bonus[0].start.slice(0, 7) <= month && bonus[0].end.slice(0, 7) >= month).toBe(true);
    }
  });

  it('la alerta de caja mira también la caja al corte', () => {
    const ds = buildSample('comercio');
    const idx = buildIndex(ds);
    const p = findPeriod(ds, null);
    const th = PRESETS.comercio.thresholds;
    const cash = (cashFloor: number) => alerts(buildContext(idx, p, { goalGrowth: 10, thresholds: { ...th, cashFloor } })).find((a) => a.kind === 'cashFloor');
    const start = cashFlow(idx, forecast(idx))!.start / 1e6;
    expect(cash(start + 1)).toMatchObject({ values: expect.objectContaining({ todayBelow: 1 }) });
    expect(cash(0)).toBeUndefined();
    const def = cash(th.cashFloor);
    if (def) expect(def.values.todayBelow).toBe(0);
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
    expect(forecast(buildIndex(buildSampleAt('servicios', '2027-02'))).points.map((x) => x.month)).toEqual(['2027-03', '2027-04', '2027-05']);
    for (const x of fc.points) expect(x.low < x.value && x.value < x.high).toBe(true);
  });
});

describe('Tablero ejecutivo · lista de clientes y exportaciones', () => {
  it('«Mayor caída» empieza por la mayor caída: los clientes sin año anterior van al final en cualquier orden', () => {
    const ds = buildSample('comercio');
    const ctx = buildContext(buildIndex(ds), findPeriod(ds, null), params('comercio'));
    const withoutPrev = ctx.customers.filter((c) => c.yoy === null).length;
    expect(withoutPrev).toBeGreaterThan(0);
    for (const dir of ['asc', 'desc'] as const) {
      const list = sortCustomers(ctx.customers, 'yoy', dir);
      expect(list.slice(-withoutPrev).every((c) => c.yoy === null)).toBe(true);
      const known = list.slice(0, list.length - withoutPrev).map((c) => c.yoy as number);
      for (let i = 1; i < known.length; i++) expect(dir === 'asc' ? known[i] >= known[i - 1] : known[i] <= known[i - 1]).toBe(true);
    }
    const drop = sortCustomers(ctx.customers, 'yoy', 'asc')[0];
    expect(drop.segment).toBe('riesgo');
  });

  it('los decimales del CSV usan coma en español (Excel en español) y punto en inglés', () => {
    expect(csvDecimal(-33.62, 'es')).toBe('-33,6');
    expect(csvDecimal(26.3, 'en')).toBe('26.3');
    expect(csvDecimal(null, 'es')).toBeNull();
    const csv = toCsv(['a', 'b'], [[csvDecimal(12.34, 'es'), 5]], 'es');
    expect(csv).toContain('12,3;5');
  });

  it('los prefijos de factura de ejemplo no usan el prefijo del set de pruebas de la DIAN', () => {
    for (const s of SECTORS) expect(PRESETS[s].invoicePrefix).not.toMatch(/^SETP/i);
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
