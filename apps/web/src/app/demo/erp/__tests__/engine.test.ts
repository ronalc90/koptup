/**
 * Motor contable de la demo ERP: los datos de ejemplo son deterministas y todo
 * cuadra (partida doble, cartera = cuenta 1305, inventario = cuentas 14).
 */
import { buildSeed } from '../lib/seed';
import { balance, compute, docTotals, receivables, trialBalance, valuationAt } from '../lib/engine';
import { fmtMoney, fmtNit, nitDv } from '../lib/format';

describe('Demo ERP · motor', () => {
  const state = buildSeed();
  const c = compute(state);

  it('genera los mismos datos en cada carga (sin hidratación distinta)', () => {
    expect(JSON.stringify(buildSeed())).toBe(JSON.stringify(state));
  });

  it('cada asiento cuadra y el balance de prueba suma cero', () => {
    for (const e of c.entries) expect(e.lines.reduce((a, l) => a + l.debit - l.credit, 0)).toBe(0);
    const tb = trialBalance(c.entries, 'all', { start: '2026-09-01', end: '2026-09-30' });
    expect(Math.round(tb.reduce((a, r) => a + r.closing, 0))).toBe(0);
  });

  it('la cartera por documento coincide con la cuenta 1305 y el inventario con las cuentas 14', () => {
    const ar = receivables(state, c, 'all', '2026-09-30').reduce((a, x) => a + x.open, 0);
    expect(ar).toBe(balance(c.entries, 'all', ['1305'], null, '2026-09-30'));
    const v = valuationAt(c.movements, '2026-09-30');
    const inv = Object.values(v.valueAvg).reduce((a, x) => a + x, 0);
    expect(Math.abs(inv - balance(c.entries, 'all', ['14'], null, '2026-09-30'))).toBeLessThan(5);
  });

  it('nunca hay existencias negativas', () => {
    const run: Record<string, number> = {};
    for (const m of c.movements) {
      const k = `${m.sku}|${m.wh}`;
      run[k] = (run[k] || 0) + m.qty;
      expect(run[k]).toBeGreaterThan(-0.01);
    }
  });

  it('facturar descuenta inventario y genera el asiento de la venta', () => {
    const order = state.sales.find((s) => s.status === 'order')!;
    const next = {
      ...state,
      seq: state.seq + 1,
      sales: state.sales.map((s) => (s.id === order.id ? { ...s, status: 'invoiced' as const, invoiceNo: 'SMV-9999', invoiceDate: '2026-09-30', invoiceSeq: state.seq, dueDate: '2026-10-30' } : s)),
    };
    const c2 = compute(next);
    const entry = c2.entries.find((e) => e.no === 'SMV-9999')!;
    expect(entry).toBeDefined();
    expect(entry.lines.find((l) => l.account === '1305')!.debit).toBe(docTotals(order.lines).total);
    const before = valuationAt(c.movements, '2026-09-30').stock[order.lines[0].sku]![order.warehouse]!;
    const after = valuationAt(c2.movements, '2026-09-30').stock[order.lines[0].sku]![order.warehouse]!;
    expect(before - after).toBe(order.lines[0].qty);
  });

  it('formatos deterministas y NIT con dígito de verificación', () => {
    expect(fmtMoney(1234567, 'COP', 'es')).toBe('$\u00a01.234.567');
    expect(fmtMoney(1234567, 'COP', 'en')).toBe('COP\u00a01,234,567');
    // Caso conocido: el NIT público de la DIAN es 800.197.268-4
    expect(nitDv('800197268')).toBe(4);
    expect(fmtNit('800197268')).toBe('800.197.268-4');
  });
});
