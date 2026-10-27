/**
 * Demo de Gestión Humana y Nómina: los datos de ejemplo son deterministas,
 * los saldos y la nómina cuadran y el calendario usa los festivos de Colombia.
 */
import { buildState } from '../lib/seed';
import { businessDaysBetween, endOfBusinessDays, holidays } from '../lib/dates';
import { currentPeriod, journal, monthlyWithholding, payroll, totals, PARAMS } from '../lib/payroll';
import { alerts, kpis, vacationBalance } from '../lib/selectors';
import { fitScore, settlement } from '../lib/talent';
import { nitDv } from '../lib/catalog';

const BASE = '2026-10-08';

describe('Demo HRMS · motor', () => {
  const state = buildState(BASE);

  it('genera los mismos datos para la misma fecha', () => {
    expect(JSON.stringify(buildState(BASE))).toBe(JSON.stringify(state));
  });

  it('el indicador de colaboradores es el total del directorio', () => {
    expect(kpis(state).headcount).toBe(state.employees.filter((e) => e.status !== 'retired').length);
    expect(state.employees).toHaveLength(186);
  });

  it('la colaboradora de la app tiene 12 días hábiles de saldo (causados − tomados)', () => {
    const camila = state.employees.find((e) => e.name === 'Camila Rojas Parra')!;
    const b = vacationBalance(state, camila);
    expect(b.accrued).toBe(42);
    expect(b.balance).toBe(12);
  });

  it('ninguna solicitud de vacaciones de ejemplo deja el saldo negativo', () => {
    for (const l of state.leaves.filter((x) => x.type === 'vacation' && x.status !== 'rejected')) {
      const e = state.employees.find((x) => x.id === l.employeeId)!;
      const b = vacationBalance(state, e);
      const after = l.status === 'pending' ? b.balance - l.days : b.balance;
      expect(after).toBeGreaterThanOrEqual(0);
    }
  });

  it('bruto = suma de devengados, neto = bruto − deducciones y el asiento cuadra', () => {
    const lines = payroll(state.employees, state.run.novelties, currentPeriod(BASE));
    for (const l of lines) {
      expect(l.earned).toBe(l.salary + l.transport + l.overtime + l.commission);
      expect(l.net).toBe(l.earned - l.deductions);
      expect(l.deductions).toBe(l.health + l.pension + l.fsp + l.withholding);
    }
    const t = totals(lines);
    expect(t.net).toBe(t.earned - t.deductions);
    const entry = journal(t);
    expect(entry.reduce((a, l) => a + l.debit, 0)).toBe(entry.reduce((a, l) => a + l.credit, 0));
  });

  it('auxilio de transporte solo hasta 2 salarios mínimos y retención en cero para salarios bajos', () => {
    const lines = payroll(state.employees, [], currentPeriod(BASE));
    for (const l of lines) {
      const e = state.employees.find((x) => x.id === l.employeeId)!;
      if (e.salary > 2 * PARAMS.smmlv) expect(l.transport).toBe(0);
    }
    expect(monthlyWithholding(2000000, 160000)).toBe(0);
    expect(monthlyWithholding(18500000, 1665000)).toBeGreaterThan(0);
  });

  it('festivos de Colombia 2026 y conteo de días hábiles', () => {
    const h = holidays(2026);
    for (const d of ['2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29', '2026-08-17', '2026-10-12', '2026-11-02', '2026-11-16']) {
      expect(h.has(d)).toBe(true);
    }
    expect(h.size).toBe(18);
    // 5 días hábiles desde el viernes 9 de octubre: el lunes 12 es festivo.
    expect(endOfBusinessDays('2026-10-09', 5)).toBe('2026-10-16');
    expect(businessDaysBetween('2026-10-01', '2026-10-31')).toBe(21);
  });

  it('alertas calculadas: 6 contratos por vencer en 30 días', () => {
    expect(alerts(state).contracts).toHaveLength(6);
  });

  it('puntaje de ajuste por reglas entre 0 y 100 y liquidación con totales coherentes', () => {
    for (const c of state.candidates) {
      const s = fitScore(c, state.vacancies.find((v) => v.id === c.vacancyId)!);
      expect(s.total).toBe(s.experience + s.education + s.shifts + s.distance);
      expect(s.total).toBeGreaterThanOrEqual(0);
      expect(s.total).toBeLessThanOrEqual(100);
    }
    const e = state.employees[20];
    const s = settlement(e, '2026-10-15', 'resignation', 5);
    expect(s.indemnity).toBe(0);
    expect(s.total).toBe(s.pendingSalary + s.severance + s.interest + s.prima + s.vacation + s.indemnity);
  });

  it('NIT de ejemplo con dígito de verificación correcto', () => {
    expect(nitDv('901738264')).toBe(4);
  });
});
