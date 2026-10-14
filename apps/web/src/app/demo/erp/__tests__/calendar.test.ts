/**
 * Demo ERP · calendario: la demo trabaja sobre el cierre del mes anterior a
 * hoy y los datos de ejemplo se arman para esa fecha. Con cualquier fecha la
 * contabilidad debe cuadrar (incluido el cierre del ejercicio al cruzar un año).
 */
import { REFERENCE_WORK_DATE } from '../lib/catalog';
import { currentWorkDate, historyStartFor, isMonthEnd, workDateFor } from '../lib/calendar';
import { balance, compute, entriesAsOf, periodRange, periodSlug, pnl, receivables, trialBalance, valuationAt } from '../lib/engine';
import { buildSeed } from '../lib/seed';
import { restoreSaved } from '../lib/store';

describe('Demo ERP · calendario', () => {
  it('la fecha de trabajo es el último día del mes anterior a hoy (hora de Colombia)', () => {
    expect(workDateFor('2026-10-14')).toBe('2026-09-30');
    expect(workDateFor('2027-01-05')).toBe('2026-12-31');
    expect(workDateFor('2028-03-01')).toBe('2028-02-29');
    // 14 oct 2026 a las 03:00 UTC sigue siendo 13 de octubre en Colombia
    expect(currentWorkDate(Date.UTC(2026, 9, 14, 3, 0))).toBe('2026-09-30');
    // 1 nov 2026 a las 04:59 UTC todavía es 31 de octubre en Colombia
    expect(currentWorkDate(Date.UTC(2026, 10, 1, 4, 59))).toBe('2026-09-30');
    expect(currentWorkDate(Date.UTC(2026, 10, 1, 5, 0))).toBe('2026-10-31');
    expect(isMonthEnd(workDateFor('2026-03-10'))).toBe(true);
  });

  it('la historia empieza el 1 de enero y tiene al menos seis meses', () => {
    expect(historyStartFor('2026-09-30')).toBe('2026-01-01');
    expect(historyStartFor('2027-02-28')).toBe('2026-01-01');
    expect(historyStartFor('2027-06-30')).toBe('2027-01-01');
  });

  it('los períodos se calculan desde la fecha de trabajo', () => {
    const q = periodRange('q', '2027-01-31');
    expect(q).toMatchObject({ start: '2026-11-01', end: '2027-01-31', months: ['2026-11', '2026-12', '2027-01'] });
    expect(q.prev).toEqual({ start: '2026-08-01', end: '2026-10-31' });
    expect(periodRange('m1', '2027-01-31')).toMatchObject({ start: '2026-12-01', end: '2026-12-31', prev: { start: '2026-11-01', end: '2026-11-30' } });
    expect(periodRange('ytd', '2026-09-30').months).toHaveLength(9);
    expect(periodSlug(periodRange('m0', '2026-09-30'))).toBe('2026-09');
    expect(periodSlug(periodRange('q', '2026-09-30'))).toBe('2026-07_2026-09');
  });

  it.each(['2026-09-30', '2026-12-31', '2027-01-31', '2027-03-31'])('con fecha de trabajo %s todo cuadra', (workDate) => {
    const state = buildSeed(workDate);
    expect(state.workDate).toBe(workDate);
    const c = compute(state);
    // Nada queda después de la fecha de trabajo
    expect(c.entries.every((e) => e.date <= workDate)).toBe(true);
    for (const e of c.entries) expect(e.lines.reduce((a, l) => a + l.debit - l.credit, 0)).toBe(0);
    const r = periodRange('m0', workDate);
    const tb = trialBalance(entriesAsOf(c.entries, r.end), 'all', r);
    expect(Math.round(tb.reduce((a, x) => a + x.closing, 0))).toBe(0);
    // Cartera = cuenta 1305 e inventario = cuentas 14
    const ar = receivables(state, c, 'all', workDate).reduce((a, x) => a + x.open, 0);
    expect(ar).toBe(balance(c.entries, 'all', ['1305'], null, workDate));
    const v = valuationAt(c.movements, workDate);
    const inv = Object.values(v.valueAvg).reduce((a, x) => a + x, 0);
    expect(Math.abs(inv - balance(c.entries, 'all', ['14'], null, workDate))).toBeLessThan(5);
    // Estado de situación financiera: activo = pasivo + patrimonio
    const es = entriesAsOf(c.entries, workDate);
    const assets = balance(es, 'all', ['1'], null, workDate);
    const liabilities = -balance(es, 'all', ['2'], null, workDate);
    const capital = -balance(es, 'all', ['3'], null, workDate);
    const result = -balance(es, 'all', ['4', '5', '6'], `${workDate.slice(0, 4)}-01-01`, workDate);
    expect(Math.round(assets - liabilities - capital - result)).toBe(0);
    // Hay ventas en el mes abierto y documentos para recorrer el flujo
    expect(pnl(c.entries, 'all', r, 0.35).revenue).toBeGreaterThan(0);
    expect(state.sales.some((s) => s.status === 'quote')).toBe(true);
    expect(state.sales.some((s) => s.status === 'order')).toBe(true);
    expect(state.payroll.some((p) => p.eStatus === 'pending' && p.month === workDate.slice(0, 7))).toBe(true);
    expect(state.bank.some((b) => !b.match && b.amount > 0)).toBe(true);
  });

  it('al cruzar un 31 de diciembre se cierra el ejercicio contra utilidades acumuladas', () => {
    const state = buildSeed('2027-01-31');
    const c = compute(state);
    const closing = c.entries.filter((e) => e.source === 'closing');
    expect(closing.map((e) => e.no)).toEqual(['CI-2026', 'CI-2026']);
    // Después del cierre, las cuentas de resultado de 2026 quedan en cero
    expect(Math.round(balance(c.entries, 'all', ['4', '5', '6'], null, '2026-12-31'))).toBe(0);
    // Pero el 31 de diciembre (antes del cierre) se ve el resultado del año
    const before = entriesAsOf(c.entries, '2026-12-31');
    expect(Math.round(balance(before, 'all', ['4', '5', '6'], '2026-01-01', '2026-12-31'))).not.toBe(0);
    // El estado de resultados de diciembre no incluye el cierre
    const dec = pnl(c.entries, 'all', periodRange('m1', '2027-01-31'), 0.35);
    expect(dec.revenue).toBeGreaterThan(0);
  });

  it('lo guardado se conserva solo si es del mismo mes; la versión 3 era el cierre de septiembre de 2026', () => {
    const seed = buildSeed(REFERENCE_WORK_DATE);
    const v3 = { ...seed, v: 3 } as Partial<typeof seed>;
    delete v3.workDate;
    delete v3.startDate;
    const kept = restoreSaved(JSON.stringify(v3), REFERENCE_WORK_DATE);
    expect(kept.state?.workDate).toBe(REFERENCE_WORK_DATE);
    expect(kept.stale).toBe(false);
    const old = restoreSaved(JSON.stringify(seed), '2026-10-31');
    expect(old).toEqual({ state: null, stale: true });
    expect(restoreSaved(null, REFERENCE_WORK_DATE)).toEqual({ state: null, stale: false });
  });
});
