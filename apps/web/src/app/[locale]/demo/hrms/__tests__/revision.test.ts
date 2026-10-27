/**
 * Demo de Gestión Humana y Nómina: casos que encontró la revisión adversarial.
 * - Indemnización por despido sin justa causa según el tipo de contrato (art. 64 C.S.T.).
 * - Quien ingresa queda con el jefe de su cargo (no con la dirección de planta).
 * - Al finalizar un retiro se cancelan sus solicitudes pendientes.
 * - No se aceptan ausencias que se crucen con otra registrada o pendiente.
 * - Unas vacaciones pedidas desde un sábado empiezan el primer día hábil.
 */
import { buildState } from '../lib/seed';
import { reducer, type Action } from '../lib/store';
import { firstBusinessDay } from '../lib/dates';
import { PARAMS } from '../lib/payroll';
import { overlappingLeave } from '../lib/selectors';
import { settlement } from '../lib/talent';
import type { Employee, HrState, Offboarding, Onboarding } from '../lib/types';
import { OFF_TASKS, ON_TASKS } from '../lib/types';

const BASE = '2026-10-14';

function run(s: HrState, ...actions: Action[]): HrState {
  return actions.reduce((acc, a) => reducer(acc, a) as HrState, s);
}

const base: Employee = buildState(BASE).employees.find((e) => e.contract === 'indefinite' && e.salary < 3000000)!;

describe('Demo HRMS · indemnización por despido sin justa causa', () => {
  it('a término fijo paga los salarios del tiempo que falta del plazo', () => {
    const e: Employee = { ...base, contract: 'fixed', salary: 1800000, contractEnd: '2027-02-08', joined: '2026-02-09' };
    const s = settlement(e, '2026-10-29', 'dismissal', 0);
    // Del 30 de octubre de 2026 al 8 de febrero de 2027: 102 días.
    expect(s.indemnityDays).toBe(102);
    expect(s.indemnity).toBe(Math.round((1800000 / 30) * 102));
  });

  it('en contrato indefinido: 30 días el primer año y 20 por cada año adicional (proporcional)', () => {
    const e: Employee = { ...base, contract: 'indefinite', salary: 2000000, joined: '2023-10-29' };
    const s = settlement(e, '2026-10-29', 'dismissal', 0);
    // Tres años: 30 + 20 × 2 = 70 días.
    expect(s.indemnityDays).toBeCloseTo(70, 0);
    expect(s.indemnity).toBe(Math.round((2000000 / 30) * s.indemnityDays));
  });

  it('con salario de 10 salarios mínimos o más: 20 días el primer año y 15 por cada año adicional', () => {
    const e: Employee = { ...base, contract: 'indefinite', salary: 10 * PARAMS.smmlv, joined: '2024-10-29' };
    const s = settlement(e, '2026-10-29', 'dismissal', 0);
    expect(s.indemnityDays).toBeCloseTo(35, 0);
  });

  it('por obra o labor paga mínimo 15 días; renuncia y aprendices no tienen indemnización', () => {
    expect(settlement({ ...base, contract: 'work', contractEnd: null }, '2026-10-29', 'dismissal', 0).indemnityDays).toBe(15);
    expect(settlement({ ...base, contract: 'fixed', contractEnd: '2027-02-08' }, '2026-10-29', 'resignation', 0).indemnity).toBe(0);
    expect(settlement({ ...base, contract: 'apprentice' }, '2026-10-29', 'dismissal', 0).indemnity).toBe(0);
  });
});

describe('Demo HRMS · ingresos y retiros', () => {
  it('quien ingresa queda a cargo del jefe de su cargo', () => {
    const s0 = buildState(BASE);
    const offer = s0.candidates.find((c) => c.stage === 'offer' && c.vacancyId === 'V3')!;
    let s = run(s0, { type: 'candidate.move', id: offer.id, stage: 'hired' });
    const proc = s.processes.find((p) => p.kind === 'in' && p.candidateId === offer.id) as Onboarding;
    s = run(s, ...ON_TASKS.map((task) => ({ type: 'process.toggle', id: proc.id, task }) as Action), { type: 'process.close', id: proc.id });
    const emp = s.employees.find((e) => e.name === offer.name)!;
    const cfo = s.employees.find((e) => e.positionId === 'cfo')!;
    // Analista de costos en Bogotá: su jefe es el director financiero, como el analista que ya existe.
    expect(emp.managerId).toBe(cfo.id);
  });

  it('al finalizar un retiro se cancelan las solicitudes pendientes de esa persona', () => {
    const s0 = buildState(BASE);
    const pending = s0.leaves.find((l) => l.status === 'pending' && l.type === 'vacation')!;
    let s = run(s0, { type: 'employee.exit', id: pending.employeeId, reason: 'resignation', lastDay: '2026-10-30' });
    const proc = s.processes.find((p) => p.kind === 'out' && p.employeeId === pending.employeeId && !p.closed) as Offboarding;
    s = run(s, ...OFF_TASKS.map((task) => ({ type: 'process.toggle', id: proc.id, task }) as Action), { type: 'process.close', id: proc.id });
    expect(s.employees.find((e) => e.id === pending.employeeId)!.status).toBe('retired');
    expect(s.leaves.some((l) => l.employeeId === pending.employeeId && l.status === 'pending')).toBe(false);
    // Las ya aprobadas o rechazadas se conservan en el historial.
    expect(s.leaves.length).toBe(s0.leaves.length - s0.leaves.filter((l) => l.employeeId === pending.employeeId && l.status === 'pending').length);
  });
});

describe('Demo HRMS · solicitudes de ausencia', () => {
  it('detecta ausencias que se cruzan y deja pasar las rechazadas', () => {
    const s0 = buildState(BASE);
    const leave = s0.leaves.find((l) => l.status === 'pending' && l.type === 'vacation')!;
    expect(overlappingLeave(s0, leave.employeeId, leave.from, leave.from)).toBe(true);
    expect(overlappingLeave(s0, leave.employeeId, '2030-01-01', '2030-01-02')).toBe(false);
    const rejected = run(s0, { type: 'leave.decide', id: leave.id, status: 'rejected', reason: 'peak' });
    expect(overlappingLeave(rejected, leave.employeeId, leave.from, leave.to)).toBe(false);
  });

  it('unas vacaciones que se piden desde un sábado empiezan el lunes hábil', () => {
    expect(firstBusinessDay('2026-10-31')).toBe('2026-11-03'); // sábado; el lunes 2 es festivo
    expect(firstBusinessDay('2026-10-29')).toBe('2026-10-29');
  });
});
