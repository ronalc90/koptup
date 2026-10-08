/**
 * Lógica de la demo de fidelización: puntos con multiplicadores, saldo desde
 * el libro de puntos, niveles, misiones, horario de la Ley 2300 y CSV.
 */
import { DEFAULT_MISSIONS, DEFAULT_RULES, INITIAL_LEDGER, MEMBERS, POINTS_HISTOGRAM } from '../components/data';
import {
  balanceOf,
  countAtLeast,
  ley2300Check,
  missionProgress,
  money,
  programCost,
  quoteSale,
  streakOf,
  purchaseMonths,
  thresholdsValid,
  tierCounts,
  tierFor,
  toCsv,
  weekdayOf,
  yearPoints,
} from '../components/engine';

const laura = MEMBERS.find((m) => m.id === 'm-laura')!;

describe('quoteSale', () => {
  it('da 370 puntos por $185.000 en Cuidado personal un martes (doble puntos)', () => {
    expect(weekdayOf('2026-10-06')).toBe(2);
    const q = quoteSale([{ category: 'personalCare', amount: 185000 }], 0, 'store', '2026-10-06', DEFAULT_RULES);
    expect(q.points).toBe(370);
    expect(q.lines[0].dayApplied).toBe(true);
  });

  it('no aplica la regla del día otro día y suma el multiplicador del canal', () => {
    const q = quoteSale([{ category: 'personalCare', amount: 185000 }], 0, 'app', '2026-10-07', DEFAULT_RULES);
    expect(q.points).toBe(277); // 185 × 1,5
  });

  it('los medicamentos con fórmula no acumulan y el descuento reduce la base', () => {
    const q = quoteSale(
      [
        { category: 'rx', amount: 80000 },
        { category: 'otc', amount: 120000 },
      ],
      20000,
      'store',
      '2026-10-07',
      DEFAULT_RULES,
    );
    expect(q.paid).toBe(180000);
    expect(q.lines[0].points).toBe(0);
    expect(q.lines[1].points).toBe(108); // 120.000 − 12.000 de descuento proporcional
  });
});

describe('libro de puntos y niveles', () => {
  it('el saldo de Laura es la suma de su libro y está en Plata', () => {
    expect(balanceOf(INITIAL_LEDGER, 'm-laura')).toBe(4350);
    expect(yearPoints(INITIAL_LEDGER, 'm-laura')).toBe(3110);
    expect(tierFor(3110, DEFAULT_RULES.thresholds)).toBe('silver');
  });

  it('los miembros por nivel suman la base de ejemplo', () => {
    const total = POINTS_HISTOGRAM.reduce((s, n) => s + n, 0);
    expect(total).toBe(29200);
    expect(Math.round(countAtLeast(0))).toBe(29200);
    expect(tierCounts(DEFAULT_RULES.thresholds)).toEqual({ classic: 18300, silver: 7500, gold: 2700, diamond: 700 });
  });

  it('rechaza umbrales desordenados', () => {
    expect(thresholdsValid(DEFAULT_RULES.thresholds)).toBe(true);
    expect(thresholdsValid({ classic: 0, silver: 5000, gold: 4000, diamond: 8000 })).toBe(false);
  });
});

describe('misiones y racha', () => {
  it('la misión de 2 compras del mes avanza con el libro', () => {
    const buy2 = DEFAULT_MISSIONS.find((m) => m.id === 'buy2')!;
    expect(missionProgress(buy2, laura, MEMBERS, INITIAL_LEDGER)).toEqual({ current: 1, done: false });
    const ledger = [
      ...INITIAL_LEDGER,
      { id: 'x', memberId: 'm-laura', date: '2026-10-06', kind: 'earn' as const, points: 370, saleId: 'V-0001', channel: 'store' as const },
    ];
    expect(missionProgress(buy2, laura, MEMBERS, ledger).done).toBe(true);
  });

  it('cuenta los meses seguidos con compra', () => {
    expect(streakOf(purchaseMonths(laura, INITIAL_LEDGER))).toBe(7);
  });
});

describe('Ley 2300 de 2023', () => {
  it('permite lunes a viernes 7–19 h y sábados 8–15 h; nunca domingos', () => {
    expect(ley2300Check(1, '07:00')).toBe('ok');
    expect(ley2300Check(5, '19:30')).toBe('weekday');
    expect(ley2300Check(6, '10:00')).toBe('ok');
    expect(ley2300Check(6, '16:00')).toBe('saturday');
    expect(ley2300Check(0, '10:00')).toBe('sunday');
  });
});

describe('formato y exportación', () => {
  it('formatea pesos sin depender del entorno', () => {
    expect(money(13120000, 'es')).toBe('$13.120.000');
    expect(money(13120000, 'en')).toBe('$13,120,000');
  });

  it('calcula el costo del programa con la regla base', () => {
    expect(programCost(1_600_000_000, DEFAULT_RULES, 18).net).toBeCloseTo(13_120_000, 2);
  });

  it('escapa separadores en el CSV', () => {
    expect(toCsv([['a;b', 'c"d', 3]], ';')).toBe('"a;b";"c""d";3');
  });
});
