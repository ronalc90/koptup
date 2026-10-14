/**
 * Lógica del CRM de ejemplo: fecha de corte relativa a hoy, NIT con dígito de
 * verificación, periodos del pronóstico, cierre de negocios, edición y
 * recorrido guiado.
 */
import {
  SEED_REF_DATE,
  addDays,
  checkNit,
  computeMetrics,
  forecastFor,
  nitCheckDigit,
  periodRange,
  scoreOf,
  timelineFor,
  todayInColombia,
  trendMonths,
} from '../components/crm';
import { SEED_DEALS } from '../components/data';
import { guideProgress } from '../components/GettingStarted';
import { alignTo, moveDealIn, parseStored, seedState, shiftState, updateDealIn } from '../components/useCrmStore';

describe('NIT', () => {
  it('los NIT de los datos de ejemplo tienen dígito de verificación válido', () => {
    for (const d of SEED_DEALS) {
      const check = checkNit(d.nit);
      expect(check).toEqual({ ok: true, formatted: d.nit });
    }
  });

  it('calcula el dígito de verificación con el algoritmo de la DIAN', () => {
    expect(nitCheckDigit('900123456')).toBe(8);
    expect(nitCheckDigit('890941267')).toBe(6);
  });

  it('rechaza un dígito equivocado e informa el correcto, y da formato a un NIT sin puntos', () => {
    expect(checkNit('900.123.456-7')).toEqual({ ok: false, reason: 'dv', expected: 8 });
    expect(checkNit('9001234568')).toEqual({ ok: true, formatted: '900.123.456-8' });
    expect(checkNit('12345')).toEqual({ ok: false, reason: 'format' });
  });
});

describe('fecha de corte', () => {
  it('hoy se calcula en hora de Colombia (UTC-5)', () => {
    expect(todayInColombia(new Date('2026-10-15T03:00:00Z'))).toBe('2026-10-14');
    expect(todayInColombia(new Date('2026-10-15T05:30:00Z'))).toBe('2026-10-15');
  });

  it('la semilla corrida a otro día conserva las métricas relativas', () => {
    const base = seedState();
    const moved = seedState('2026-11-20');
    expect(moved.refDate).toBe('2026-11-20');
    expect(computeMetrics(moved.deals, moved.refDate)).toEqual(computeMetrics(base.deals, base.refDate));
    const d1 = moved.deals.find((d) => d.id === 'd1')!;
    expect(d1.lastContact).toBe('2026-11-19');
    expect(scoreOf(d1, moved.refDate)).toBe(scoreOf(base.deals[0], base.refDate));
  });

  it('el historial de ejemplo se corre con la fecha de corte', () => {
    const moved = seedState('2026-10-14');
    const d1 = moved.deals.find((d) => d.id === 'd1')!;
    const tl = timelineFor(d1, [], moved.refDate);
    expect(tl[0].date).toBe('2026-10-13'); // llamada de ayer
    expect(tl[tl.length - 1].date).toBe(d1.createdAt);
  });

  it('lo guardado otro día se corre entero (negocios, actividades y secuencias)', () => {
    let s = seedState('2026-10-08');
    s = updateDealIn(s, 'd2', { value: 250_000_000 });
    const aligned = alignTo(s, '2026-10-14');
    expect(aligned.refDate).toBe('2026-10-14');
    expect(aligned.events[0].date).toBe('2026-10-14');
    const before = s.enrollments.find((e) => e.dealId === 'd2')!;
    const after = aligned.enrollments.find((e) => e.dealId === 'd2')!;
    expect(after.start).toBe(addDays(before.start, 6));
    expect(shiftState(s, 0)).toBe(s);
  });

  it('acepta lo guardado por la versión anterior (fecha fija del 8 oct 2026)', () => {
    const v1 = { ...seedState(), version: 1 } as unknown;
    const parsed = parseStored(v1)!;
    expect(parsed.version).toBe(2);
    expect(parsed.refDate).toBe(SEED_REF_DATE);
    expect(parsed.guide).toEqual({});
    expect(parseStored({ version: 3 })).toBeNull();
    expect(parseStored(null)).toBeNull();
  });
});

describe('pronóstico', () => {
  it('el periodo es el mes y el trimestre calendario de la fecha de corte', () => {
    expect(periodRange('month', '2026-10-14')).toMatchObject({ start: '2026-10-01', end: '2026-10-31', month: 10, year: 2026 });
    expect(periodRange('quarter', '2026-10-14')).toMatchObject({ start: '2026-10-01', end: '2026-12-31', quarter: 4 });
    expect(periodRange('quarter', '2027-02-03')).toMatchObject({ start: '2027-01-01', end: '2027-03-31', quarter: 1, year: 2027 });
    expect(periodRange('month', '2028-02-10').end).toBe('2028-02-29');
  });

  it('el gráfico muestra tres meses atrás, el actual y dos adelante, también al cambiar de año', () => {
    expect(trendMonths('2026-10-14')).toEqual(['2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12']);
    expect(trendMonths('2027-01-10')).toEqual(['2026-10', '2026-11', '2026-12', '2027-01', '2027-02', '2027-03']);
  });

  it('ganar un negocio sube lo ganado del periodo', () => {
    const s = seedState('2026-10-14');
    const before = forecastFor(s.deals, 'quarter', s.refDate);
    const after = moveDealIn(s, 'd1', 'won');
    const f = forecastFor(after.deals, 'quarter', after.refDate);
    expect(f.won).toBe(before.won + 186_000_000);
  });
});

describe('cierre y edición de negocios', () => {
  it('al ganar, la próxima acción pasa a la automática y la secuencia termina; al reabrir se recupera', () => {
    const s = seedState('2026-10-14');
    const won = moveDealIn(s, 'd2', 'won');
    const d2 = won.deals.find((d) => d.id === 'd2')!;
    expect(d2.nextActionAuto).toBe('won');
    expect(d2.closeDate).toBe('2026-10-14');
    expect(won.enrollments.find((e) => e.dealId === 'd2')!.status).toBe('finished');
    const reopened = moveDealIn(won, 'd2', 'proposal');
    const r2 = reopened.deals.find((d) => d.id === 'd2')!;
    expect(r2.nextActionAuto).toBeUndefined();
    expect(r2.closeDate).toBe('2026-11-13');
  });

  it('al perder guarda el motivo y la próxima acción automática', () => {
    const lost = moveDealIn(seedState('2026-10-14'), 'd5', 'lost', 'timing');
    const d5 = lost.deals.find((d) => d.id === 'd5')!;
    expect(d5.lostReason).toBe('timing');
    expect(d5.nextActionAuto).toBe('lost');
    expect(lost.events[lost.events.length - 1]).toMatchObject({ type: 'lost', params: { reason: 'timing' } });
  });

  it('editar guarda solo lo que cambió, lo deja en el historial y recalcula el puntaje', () => {
    const s = seedState('2026-10-14');
    const d9 = s.deals.find((d) => d.id === 'd9')!;
    const edited = updateDealIn(s, 'd9', { value: d9.value, budgetConfirmed: true, decisionMaker: true, owner: 'vr' });
    const e9 = edited.deals.find((d) => d.id === 'd9')!;
    expect(scoreOf(e9, edited.refDate)).toBe(scoreOf(d9, s.refDate) + 30);
    expect(edited.events[edited.events.length - 1]).toMatchObject({ type: 'edit', key: 'edited', params: { fields: 'budgetConfirmed,decisionMaker,owner' } });
    expect(updateDealIn(s, 'd9', { value: d9.value })).toBe(s);
  });

  it('escribir otra próxima acción quita la automática', () => {
    const won = moveDealIn(seedState('2026-10-14'), 'd1', 'won');
    const edited = updateDealIn(won, 'd1', { nextAction: 'Visita de arranque' });
    expect(edited.deals.find((d) => d.id === 'd1')).toMatchObject({ nextAction: 'Visita de arranque', nextActionAuto: undefined });
  });
});

describe('recorrido sugerido', () => {
  it('cada paso se marca con el historial o las marcas del estado', () => {
    const s = seedState('2026-10-14');
    expect(Object.values(guideProgress(s.events, s.guide)).some(Boolean)).toBe(false);
    const moved = moveDealIn(s, 'd4', 'proposal');
    const p = guideProgress(moved.events, { opened: true, forecast: true });
    expect(p).toEqual({ move: true, open: true, draft: false, forecast: true, sequence: false });
  });
});
