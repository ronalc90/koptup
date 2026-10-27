/**
 * Demo de Gestión Humana y Nómina: flujos que antes quedaban a medias.
 * - La nómina sigue con la siguiente quincena después de pagar.
 * - Quien ingresa recibe sus cursos obligatorios.
 * - Un candidato descartado vuelve al proceso.
 * - El asistente explica por qué una respuesta no la redactó la IA.
 */
import { buildState } from '../lib/seed';
import { reducer, type Action } from '../lib/store';
import { nextPeriod, payroll, periodFromId, previousPeriod, totals } from '../lib/payroll';
import { errorKind, noAiReason, sampleKey } from '../lib/assistant';
import type { HrState, Onboarding } from '../lib/types';
import { ON_TASKS } from '../lib/types';

const BASE = '2026-10-14';

function run(s: HrState, ...actions: Action[]): HrState {
  return actions.reduce((acc, a) => reducer(acc, a) as HrState, s);
}

describe('Demo HRMS · quincenas', () => {
  it('calcula la quincena siguiente y la anterior', () => {
    const q1 = periodFromId('2026-10-Q1');
    expect(q1).toMatchObject({ from: '2026-10-01', to: '2026-10-15', payDate: '2026-10-15' });
    expect(nextPeriod(q1)).toMatchObject({ id: '2026-10-Q2', from: '2026-10-16', to: '2026-10-31' });
    expect(nextPeriod(periodFromId('2026-12-Q2')).id).toBe('2027-01-Q1');
    expect(previousPeriod(q1)).toMatchObject({ id: '2026-09-Q2', from: '2026-09-16', to: '2026-09-30' });
    expect(previousPeriod(periodFromId('2026-02-Q2')).id).toBe('2026-02-Q1');
    expect(periodFromId('2026-02-Q2').to).toBe('2026-02-28');
  });

  it('solo abre la siguiente quincena cuando la actual está pagada y guarda la pagada', () => {
    const s0 = buildState(BASE);
    expect(s0.run.periodId).toBe('2026-10-Q1');
    expect(run(s0, { type: 'run.next' })).toBe(s0);

    const paid = run(s0, { type: 'run.status', status: 'liquidated' }, { type: 'run.status', status: 'approved' }, { type: 'run.status', status: 'paid' });
    const expected = totals(payroll(paid.employees, paid.run.novelties, periodFromId(paid.run.periodId)));
    const s1 = run(paid, { type: 'run.next' });
    expect(s1.run).toEqual({ periodId: '2026-10-Q2', status: 'draft', novelties: [] });
    expect(s1.paidRuns).toHaveLength(1);
    expect(s1.paidRuns[0]).toMatchObject({ periodId: '2026-10-Q1', count: expected.count, net: expected.net, cost: expected.cost });
    expect(s1.paidRuns[0].novelties).toEqual(paid.run.novelties);
  });
});

describe('Demo HRMS · contratación', () => {
  it('quien se contrata y se activa entra a la nómina de su quincena y recibe los cursos obligatorios', () => {
    const s0 = buildState(BASE);
    const offer = s0.candidates.find((c) => c.stage === 'offer' && c.vacancyId === 'V3')!;
    let s = run(s0, { type: 'candidate.move', id: offer.id, stage: 'hired' });
    expect(s.guide.hired).toBe(true);
    const proc = s.processes.find((p) => p.kind === 'in' && p.candidateId === offer.id) as Onboarding;
    expect(proc).toBeDefined();
    s = run(s, ...ON_TASKS.map((task) => ({ type: 'process.toggle', id: proc.id, task }) as Action), { type: 'process.close', id: proc.id });
    const emp = s.employees.find((e) => e.name === offer.name && e.status === 'active')!;
    expect(emp).toBeDefined();
    expect(s.employees).toHaveLength(187);

    const induction = s.courses.find((c) => c.id === 'induction')!;
    const harassment = s.courses.find((c) => c.id === 'harassment')!;
    const sagrilaft = s.courses.find((c) => c.id === 'sagrilaft')!;
    const food = s.courses.find((c) => c.id === 'food')!;
    expect(induction.assigned).toContain(emp.id);
    expect(harassment.assigned).toContain(emp.id);
    // Analista de costos (finanzas): SAGRILAFT sí, manipulación de alimentos no.
    expect(sagrilaft.assigned).toContain(emp.id);
    expect(food.assigned).not.toContain(emp.id);

    // Ingresa en 14 días: no está en la 1.ª quincena, sí en la 2.ª (proporcional).
    const q1 = periodFromId(s.run.periodId);
    expect(payroll(s.employees, [], q1).some((l) => l.employeeId === emp.id)).toBe(false);
    const line = payroll(s.employees, [], nextPeriod(q1)).find((l) => l.employeeId === emp.id);
    expect(line).toBeDefined();
    expect(line!.days).toBeGreaterThan(0);
    expect(line!.days).toBeLessThan(15);
  });

  it('un candidato descartado vuelve al proceso en la misma etapa', () => {
    const s0 = buildState(BASE);
    const c = s0.candidates.find((x) => x.stage === 'screening')!;
    const s1 = run(s0, { type: 'candidate.discard', id: c.id });
    expect(s1.candidates.find((x) => x.id === c.id)!.discarded).toBe(true);
    const s2 = run(s1, { type: 'candidate.restore', id: c.id });
    expect(s2.candidates.find((x) => x.id === c.id)).toMatchObject({ discarded: false, stage: 'screening' });
  });
});

describe('Demo HRMS · asistente', () => {
  it('explica el modo sin IA según la respuesta del servidor', () => {
    expect(noAiReason('gpt-4o-mini', undefined)).toBeNull();
    expect(noAiReason('extractive-bm25', undefined)).toBe('noKey');
    expect(noAiReason('extractive-bm25', 'budget_exhausted')).toBe('budgetExhausted');
    expect(noAiReason('extractive-bm25', 'budget_unavailable')).toBe('budgetUnavailable');
    expect(noAiReason('extractive-bm25-fallback', 'llm_provider_error')).toBe('providerError');
  });

  it('traduce los errores HTTP del formato único', () => {
    expect(errorKind(429, 'rate_limited')).toBe('rateLimited');
    expect(errorKind(503, 'capacity')).toBe('unavailable');
    expect(errorKind(503, 'storage_unavailable')).toBe('unavailable');
    expect(errorKind(404, 'bot_not_found')).toBe('server');
    expect(errorKind(500, '')).toBe('server');
  });

  it('usa una clave de bot compartido válida para el servidor', () => {
    expect(sampleKey('es')).toMatch(/^[A-Za-z0-9:._-]{1,64}$/);
    expect(sampleKey('en')).not.toBe(sampleKey('es'));
  });
});
