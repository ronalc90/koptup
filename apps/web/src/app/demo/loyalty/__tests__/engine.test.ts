/**
 * Lógica de la demo de fidelización: fechas relativas a hoy, puntos con
 * multiplicadores, saldo desde el libro de puntos, niveles en 12 meses,
 * misiones, racha, horario de la Ley 2300 con festivos, recuperación de lo
 * guardado y CSV.
 */
import { DEFAULT_MISSIONS, POINTS_HISTOGRAM, defaultRules, sampleLedger, sampleMembers, type LedgerTx } from '../components/data';
import { colombianHolidays, colombiaNow, easterSunday, endOfMonth, lastDays, monthDay, nextDays, weekdayOf } from '../components/dates';
import {
  balanceOf,
  couponCode,
  countAtLeast,
  firstSendDate,
  ley2300Check,
  missionProgress,
  money,
  programCost,
  purchaseMonths,
  quoteSale,
  streakOf,
  thresholdsValid,
  tierCounts,
  tierFor,
  tierPoints,
  tierWindowStart,
  toCsv,
} from '../components/engine';
import { initialState, restoreState } from '../components/store';

/** Fechas de anclaje con casos borde: hoy, enero, fin de mes, año bisiesto y diciembre. */
const ANCHORS = ['2026-10-14', '2026-01-05', '2027-03-31', '2028-02-29', '2026-12-31', '2026-11-01'];

describe('fechas', () => {
  it('pasa un instante a la fecha y hora de Colombia (UTC−5)', () => {
    expect(colombiaNow(Date.UTC(2026, 9, 14, 3, 20))).toEqual({ date: '2026-10-13', time: '22:20' });
    expect(colombiaNow(Date.UTC(2026, 9, 14, 15, 5))).toEqual({ date: '2026-10-14', time: '10:05' });
  });

  it('recorta el día al final del mes y salta de año', () => {
    expect(monthDay('2026-03-31', 1, 31)).toBe('2026-02-28');
    expect(monthDay('2026-01-05', 2, 15)).toBe('2025-11-15');
    expect(endOfMonth('2028-02-10')).toBe('2028-02-29');
    expect(endOfMonth('2026-12-10', 1)).toBe('2027-01-31');
  });

  it('arma los últimos días (hoy primero) y los próximos desde mañana', () => {
    expect(lastDays('2026-10-14', 3)).toEqual(['2026-10-14', '2026-10-13', '2026-10-12']);
    expect(nextDays('2026-12-30', 3)).toEqual(['2026-12-31', '2027-01-01', '2027-01-02']);
  });

  it('calcula los festivos de Colombia (fijos, Ley 51 de 1983 y Pascua)', () => {
    expect(easterSunday(2026)).toBe('2026-04-05');
    const h = colombianHolidays(2026);
    expect(h['2026-04-02']).toBe('holyThursday');
    expect(h['2026-04-03']).toBe('goodFriday');
    expect(h['2026-10-12']).toBe('raceDay');
    expect(h['2026-11-02']).toBe('allSaints');
    expect(h['2026-11-16']).toBe('cartagena');
    expect(h['2026-12-08']).toBe('immaculate');
    expect(Object.keys(h)).toHaveLength(18);
  });

  it('cuenta los 12 meses del nivel terminando hoy', () => {
    expect(tierWindowStart('2026-10-14')).toBe('2025-10-15');
    expect(tierWindowStart('2028-02-29')).toBe('2027-03-01');
  });
});

describe('quoteSale', () => {
  const rules = defaultRules('2026-10-14');

  it('la regla del día arranca en el día de hoy: $185.000 en Cuidado personal dan 370 puntos', () => {
    expect(weekdayOf('2026-10-14')).toBe(3);
    expect(rules.dayRule.weekday).toBe(3);
    const q = quoteSale([{ category: 'personalCare', amount: 185000 }], 0, 'store', '2026-10-14', rules);
    expect(q.points).toBe(370);
    expect(q.lines[0].dayApplied).toBe(true);
  });

  it('no aplica la regla del día otro día y suma el multiplicador del canal', () => {
    const q = quoteSale([{ category: 'personalCare', amount: 185000 }], 0, 'app', '2026-10-13', rules);
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
      '2026-10-13',
      rules,
    );
    expect(q.paid).toBe(180000);
    expect(q.lines[0].points).toBe(0);
    expect(q.lines[1].points).toBe(108); // 120.000 − 12.000 de descuento proporcional
  });
});

describe('datos de ejemplo relativos a hoy', () => {
  it.each(ANCHORS)('con fecha %s: el saldo de Laura es la suma de su libro y está en Plata', (anchor) => {
    const ledger = sampleLedger(anchor);
    expect(balanceOf(ledger, 'm-laura')).toBe(4350);
    expect(tierPoints(ledger, 'm-laura', anchor)).toBe(3110);
    expect(tierFor(3110, defaultRules(anchor).thresholds)).toBe('silver');
    // Nada queda después de hoy y Laura no ha comprado en el mes en curso.
    expect(ledger.every((tx) => tx.date <= anchor)).toBe(true);
    const thisMonth = anchor.slice(0, 7);
    expect(ledger.some((tx) => tx.memberId === 'm-laura' && tx.kind === 'earn' && tx.date.startsWith(thisMonth))).toBe(false);
    // Laura cumple años este mes (para ver el regalo) y es miembro desde antes.
    const laura = sampleMembers(anchor).find((m) => m.id === 'm-laura')!;
    expect(laura.birthMonth).toBe(Number(anchor.slice(5, 7)));
    expect(laura.since < anchor).toBe(true);
  });

  it('los demás miembros tienen saldos coherentes', () => {
    const ledger = sampleLedger('2026-10-14');
    expect(balanceOf(ledger, 'm-andres')).toBe(2160 + 5420 - 2600);
    expect(tierFor(tierPoints(ledger, 'm-andres', '2026-10-14'), defaultRules('2026-10-14').thresholds)).toBe('gold');
    expect(tierFor(tierPoints(ledger, 'm-valentina', '2026-10-14'), defaultRules('2026-10-14').thresholds)).toBe('diamond');
  });

  it('los miembros por nivel suman la base de ejemplo', () => {
    const total = POINTS_HISTOGRAM.reduce((s, n) => s + n, 0);
    expect(total).toBe(29200);
    expect(Math.round(countAtLeast(0))).toBe(29200);
    expect(tierCounts(defaultRules('2026-10-14').thresholds)).toEqual({ classic: 18300, silver: 7500, gold: 2700, diamond: 700 });
  });

  it('rechaza umbrales desordenados', () => {
    expect(thresholdsValid(defaultRules('2026-10-14').thresholds)).toBe(true);
    expect(thresholdsValid({ classic: 0, silver: 5000, gold: 4000, diamond: 8000 })).toBe(false);
  });
});

describe('misiones, racha y nivel con las compras de la demo', () => {
  const today = '2026-10-14';
  const members = sampleMembers(today);
  const laura = members.find((m) => m.id === 'm-laura')!;
  const buy = (id: string, points: number): LedgerTx => ({ id, memberId: 'm-laura', date: today, kind: 'earn', points, saleId: id, channel: 'store', session: true });

  it('la misión de 2 compras del mes se completa con la segunda compra de la demo', () => {
    const buy2 = DEFAULT_MISSIONS.find((m) => m.id === 'buy2')!;
    const base = sampleLedger(today);
    expect(missionProgress(buy2, laura, members, base, today)).toEqual({ current: 0, done: false });
    expect(missionProgress(buy2, laura, members, [...base, buy('V-0001', 370)], today)).toEqual({ current: 1, done: false });
    expect(missionProgress(buy2, laura, members, [...base, buy('V-0001', 370), buy('V-0002', 630)], today).done).toBe(true);
  });

  it('Laura sube a Oro con las dos compras del recorrido', () => {
    const ledger = [...sampleLedger(today), buy('V-0001', 370), buy('V-0002', 630)];
    expect(tierPoints(ledger, 'm-laura', today)).toBe(4110);
    expect(tierFor(4110, defaultRules(today).thresholds)).toBe('gold');
  });

  it('cuenta los meses seguidos con compra y la compra de hoy extiende la racha', () => {
    const base = sampleLedger(today);
    expect(streakOf(purchaseMonths(laura, base), today)).toBe(8);
    expect(streakOf(purchaseMonths(laura, [...base, buy('V-0001', 370)]), today)).toBe(9);
  });

  it('los cupones llevan el año de hoy', () => {
    expect(couponCode(1, '2027-01-02')).toBe('CV-2027-0001');
  });
});

describe('Ley 2300 de 2023', () => {
  it('permite lunes a viernes 7–19 h y sábados 8–15 h; nunca domingos ni festivos', () => {
    expect(ley2300Check('2026-10-13', '07:00')).toEqual({ ok: true });
    expect(ley2300Check('2026-10-16', '19:30')).toEqual({ ok: false, reason: 'weekday' });
    expect(ley2300Check('2026-10-17', '10:00')).toEqual({ ok: true });
    expect(ley2300Check('2026-10-17', '16:00')).toEqual({ ok: false, reason: 'saturday' });
    expect(ley2300Check('2026-10-18', '10:00')).toEqual({ ok: false, reason: 'sunday' });
    expect(ley2300Check('2026-12-08', '10:00')).toEqual({ ok: false, reason: 'holiday', holiday: 'immaculate' });
    expect(ley2300Check('2026-10-13', '')).toEqual({ ok: false, reason: 'time' });
  });

  it('propone el primer día permitido: salta el domingo y el festivo', () => {
    // Sábado 7 de noviembre de 2026: mañana es domingo y el lunes 16 es festivo, pero el lunes 9 no.
    expect(firstSendDate(nextDays('2026-11-07', 14))).toBe('2026-11-09');
    // Domingo 1 de noviembre: el lunes 2 es festivo (Todos los Santos).
    expect(firstSendDate(nextDays('2026-11-01', 14))).toBe('2026-11-03');
  });
});

describe('lo guardado en el navegador', () => {
  it('se conserva en el mismo mes y se vuelve a armar si cambió el mes', () => {
    const saved = { ...initialState('2026-10-02'), saleSeq: 3 };
    const same = restoreState(JSON.parse(JSON.stringify(saved)), false, '2026-10-14');
    expect(same.notice).toBeNull();
    expect(same.state.saleSeq).toBe(3);
    expect(same.state.anchor).toBe('2026-10-02');

    const next = restoreState(JSON.parse(JSON.stringify(saved)), false, '2026-11-01');
    expect(next.notice).toBe('newMonth');
    expect(next.state.anchor).toBe('2026-11-01');
    expect(next.state.saleSeq).toBe(0);
  });

  it('descarta la versión anterior con fechas fijas y lo avisa', () => {
    const legacy = restoreState({ v: 1, ledger: [], members: [] }, true, '2026-10-14');
    expect(legacy.notice).toBe('updated');
    expect(legacy.state.anchor).toBe('2026-10-14');
    expect(restoreState(null, false, '2026-10-14').notice).toBeNull();
  });
});

describe('formato y exportación', () => {
  it('formatea pesos sin depender del entorno', () => {
    expect(money(13120000, 'es')).toBe('$13.120.000');
    expect(money(13120000, 'en')).toBe('$13,120,000');
  });

  it('calcula el costo del programa con la regla base', () => {
    expect(programCost(1_600_000_000, defaultRules('2026-10-14'), 18).net).toBeCloseTo(13_120_000, 2);
  });

  it('escapa separadores en el CSV', () => {
    expect(toCsv([['a;b', 'c"d', 3]], ';')).toBe('"a;b";"c""d";3');
  });
});
