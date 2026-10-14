/**
 * Demo POS · lógica: horas relativas a la hora de Colombia, día de los datos,
 * impuestos incluidos en el precio, reportes y datos de ejemplo coherentes.
 */
import { PRESETS } from '../components/data';
import { buildReport, computeTotals, maxRedeemBlocks, money, pointsEarned, tierOf, type TicketLine } from '../components/engine';
import { bogotaDay, hhmm, seedState, stampTimes } from '../components/usePosStore';

/** Dígito de verificación del NIT (algoritmo de la DIAN, módulo 11). */
function nitDv(nit: string) {
  const w = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const sum = nit
    .split('')
    .reverse()
    .reduce((s, d, i) => s + Number(d) * w[i], 0);
  const r = sum % 11;
  return r < 2 ? r : 11 - r;
}

const line = (over: Partial<TicketLine>): TicketLine => ({
  uid: 'x',
  productId: 'p',
  name: 'P',
  emoji: '',
  qty: 1,
  unitPrice: 0,
  tax: 'iva19',
  sent: 0,
  ...over,
});

describe('Demo POS · fechas y horas', () => {
  it('el día de los datos es el de Colombia (UTC−5)', () => {
    // 14 oct 2026 a las 03:00 UTC todavía es 13 de octubre en Colombia
    expect(bogotaDay(Date.UTC(2026, 9, 14, 3, 0))).toBe('2026-10-13');
    expect(bogotaDay(Date.UTC(2026, 9, 14, 5, 0))).toBe('2026-10-14');
  });

  it('la semilla no trae horas fijas: se calculan al montar, antes de la hora actual', () => {
    const seed = seedState();
    expect(seed.day).toBe('');
    expect(seed.data.retail.shifts['lc-chapinero'].openedAt).toBe('');
    expect(seed.data.retail.staff['e-r1'].since).toBe('');

    const now = Date.UTC(2026, 9, 14, 15, 2); // 10:02 en Colombia
    const s = stampTimes(seed, now);
    expect(s.day).toBe('2026-10-14');
    expect(hhmm(new Date(now))).toBe('10:02');
    // La cajera de Chapinero entró hace 4 horas (redondeado a 5 minutos) y el turno abrió con ella.
    expect(s.data.retail.staff['e-r1'].since).toBe('06:00');
    expect(s.data.retail.shifts['lc-chapinero'].openedAt).toBe('06:00');
    // Quien no ha marcado sigue sin hora.
    expect(s.data.retail.staff['e-r3']).toEqual({ clockedIn: false, since: '' });
    // Las comandas de ejemplo quedan con su antigüedad.
    const k = s.data.restaurant.kds.find((x) => x.seed && x.ageMin === 9);
    expect(k?.createdAt).toBe(now - 9 * 60_000);
    // Lo que ya tiene hora no cambia al volver a montar.
    expect(stampTimes(s, now + 3_600_000).data.retail.shifts['lc-chapinero'].openedAt).toBe('06:00');
  });
});

describe('Demo POS · cálculos', () => {
  it('separa la base y el impuesto de precios con impuesto incluido y reparte el descuento', () => {
    const lines = [line({ unitPrice: 11900, tax: 'iva19' }), line({ unitPrice: 5000, tax: 'exento' })];
    const t = computeTotals(lines, 0);
    expect(t.gross).toBe(16900);
    expect(t.taxes.find((x) => x.kind === 'iva19')).toEqual({ kind: 'iva19', base: 10000, tax: 1900 });
    expect(t.base + t.taxTotal).toBe(t.net);

    const d = computeTotals(lines, 5000);
    expect(d.net).toBe(11900);
    expect(d.taxes.reduce((s, x) => s + x.base + x.tax, 0)).toBe(11900);
  });

  it('puntos: niveles, acumulación y canje sin pasarse del total ni del saldo', () => {
    expect(tierOf(5420)).toBe('gold');
    expect(tierOf(1500)).toBe('silver');
    expect(tierOf(320)).toBe('bronze');
    expect(pointsEarned(23363, 'gold')).toBe(46);
    expect(maxRedeemBlocks(5420, 23363)).toBe(4);
    expect(maxRedeemBlocks(400, 50000)).toBe(0);
  });

  it('reporte del turno: efectivo neto sin el cambio y anuladas aparte', () => {
    const base = { tip: 0, discount: 0, taxes: [], lines: [] };
    const r = buildReport([
      { ...base, total: 15200, change: 4800, payments: [{ method: 'cash', amount: 20000 }] },
      { ...base, total: 23363, change: 0, payments: [{ method: 'cash', amount: 20000 }, { method: 'card', amount: 3363 }] },
      { ...base, total: 9000, change: 0, payments: [{ method: 'qr', amount: 9000 }], refunded: true },
    ]);
    expect(r.count).toBe(2);
    expect(r.total).toBe(38563);
    expect(r.netCash).toBe(35200);
    expect(r.byMethod).toEqual({ cash: 35200, card: 3363, qr: 0, gift: 0 });
    expect(r.refundsCount).toBe(1);
  });

  it('formatea pesos sin depender del idioma del navegador', () => {
    expect(money(1234567, 'es')).toBe('$1.234.567');
    expect(money(1234567, 'en')).toBe('$1,234,567');
    expect(money(-2000, 'es')).toBe('−$2.000');
  });
});

describe('Demo POS · datos de ejemplo', () => {
  it('los NIT de los negocios ficticios tienen dígito de verificación válido', () => {
    for (const p of Object.values(PRESETS)) {
      const [num, dv] = p.business.nit.replace(/\./g, '').split('-');
      expect(nitDv(num)).toBe(Number(dv));
    }
  });

  it('cada sede tiene cajero/a con hora de entrada y los códigos de barras son EAN-13 válidos', () => {
    for (const p of Object.values(PRESETS)) {
      for (const s of p.sedes) {
        const cashier = p.employees.find((e) => e.sede === s.id && e.role === 'cashier');
        expect(cashier?.sinceMin).toBeGreaterThan(0);
      }
      for (const pr of p.products.filter((x) => x.barcode)) {
        const d = (pr.barcode as string).split('').map(Number);
        const sum = d.slice(0, 12).reduce((s, n, i) => s + n * (i % 2 === 0 ? 1 : 3), 0);
        expect((10 - (sum % 10)) % 10).toBe(d[12]);
      }
    }
  });
});
