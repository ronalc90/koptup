/**
 * Demo de gestión de proyectos: las fechas son relativas al día en que se abre
 * la demo, los ids nunca se repiten y las acciones del portal del cliente y
 * las automatizaciones cambian el tablero del equipo.
 */
import { addDays } from '../lib/dates';
import { burndown, isOverdue, projectStats } from '../lib/engine';
import { reducer, type Action } from '../lib/reducer';
import { buildState, nitDv } from '../lib/seed';
import type { AppState, SectorId, Task } from '../lib/types';

const BASE = '2026-10-08';
const NOW = `${BASE}T10:00`;
const stamp = { today: BASE, now: NOW };

function run(state: AppState, ...actions: Action[]): AppState {
  return actions.reduce<AppState>((s, a) => reducer(s, a) as AppState, state);
}

function task(s: AppState, title: string): Task {
  const t = s.workspaces[s.sector].tasks.find((x) => x.title === title);
  if (!t) throw new Error(`No existe la tarea ${title}`);
  return t;
}

describe('Gestión de proyectos · datos de ejemplo', () => {
  it('genera los mismos datos para la misma fecha', () => {
    expect(JSON.stringify(buildState(BASE))).toBe(JSON.stringify(buildState(BASE)));
  });

  it('el proyecto principal de cada sector tiene exactamente 1 tarea vencida cualquier día del año', () => {
    for (let i = 0; i < 366; i++) {
      const day = addDays('2026-01-01', i);
      const s = buildState(day);
      for (const sector of ['construccion', 'agencia', 'software'] as SectorId[]) {
        const ws = s.workspaces[sector];
        const stats = projectStats(ws, ws.projects[0], day);
        expect(stats.overdue).toHaveLength(1);
      }
    }
  });

  it('el semáforo sigue reglas explicables', () => {
    const s = buildState(BASE);
    const c = s.workspaces.construccion;
    expect(projectStats(c, c.projects[0], BASE).health.level).toBe('risk');
    expect(projectStats(c, c.projects[1], BASE).health.level).toBe('ok');
    expect(projectStats(c, c.projects[2], BASE).health.level).toBe('late');
    const a = s.workspaces.agencia;
    const avanza = projectStats(a, a.projects[1], BASE);
    expect(avanza.overdue).toHaveLength(0);
    expect(avanza.health.reasons.map((r) => r.key)).toEqual(['overBudget']);
    const sw = s.workspaces.software;
    expect(projectStats(sw, sw.projects[1], BASE).health.reasons[0].key).toBe('milestoneLate');
  });

  it('el dígito de verificación del NIT sigue el algoritmo de la DIAN', () => {
    expect(nitDv('800197268')).toBe(4);
  });
});

describe('Gestión de proyectos · acciones', () => {
  it('crear una tarea después de eliminar otra no repite ids', () => {
    let s = buildState(BASE);
    const ws0 = s.workspaces.construccion;
    const victim = ws0.tasks[ws0.tasks.length - 1];
    s = run(s, { type: 'task.delete', id: victim.id });
    s = run(s, {
      type: 'task.create',
      ...stamp,
      task: { projectId: 'p1', milestoneId: null, title: 'Nueva', description: '', assigneeId: null, start: BASE, due: BASE, priority: 'low', status: 'todo', estimate: 2, clientVisible: false },
    });
    s = run(s, { type: 'task.duplicate', id: task(s, 'Nueva').id, suffix: '(copia)', ...stamp });
    const ids = s.workspaces.construccion.tasks.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain(victim.id);
  });

  it('mover a revisión del cliente avisa al cliente solo si la automatización está activa', () => {
    let s = buildState(BASE);
    const id = task(s, 'Inspección de trabajo en alturas').id;
    const before = s.workspaces.construccion.outbox.length;
    s = run(s, { type: 'task.move', id, status: 'client', ...stamp });
    expect(s.workspaces.construccion.outbox.length).toBe(before + 2);
    s = run(s, { type: 'task.move', id: task(s, 'Comité de obra con interventoría').id, status: 'review', ...stamp });
    s = run(s, { type: 'automation.set', key: 'notifyClient', value: false, ...stamp });
    s = run(s, { type: 'task.move', id: task(s, 'Comité de obra con interventoría').id, status: 'client', ...stamp });
    expect(s.workspaces.construccion.outbox.length).toBe(before + 2);
  });

  it('la aprobación del cliente pasa la tarea a terminada (o la marca si la automatización está apagada)', () => {
    let s = buildState(BASE);
    const acta = task(s, 'Acta de avance de obra #7');
    s = run(s, { type: 'client.approve', taskId: acta.id, comment: 'Aprobado', ...stamp });
    const done = task(s, 'Acta de avance de obra #7');
    expect(done.status).toBe('done');
    expect(done.clientApproved).toBe(true);
    expect(done.completedAt).toBe(BASE);
    expect(done.comments.at(-1)?.fromClient).toBe(true);
    expect(s.workspaces.construccion.notifications[0].key).toBe('clientApproved');

    let s2 = buildState(BASE);
    s2 = run(s2, { type: 'automation.set', key: 'clientApproval', value: false, ...stamp });
    s2 = run(s2, { type: 'client.approve', taskId: acta.id, comment: '', ...stamp });
    expect(task(s2, 'Acta de avance de obra #7').status).toBe('client');
    expect(task(s2, 'Acta de avance de obra #7').clientApproved).toBe(true);
  });

  it('pedir cambios exige comentario y devuelve la tarea al equipo', () => {
    let s = buildState(BASE);
    const acta = task(s, 'Acta de avance de obra #7');
    const same = run(s, { type: 'client.changes', taskId: acta.id, comment: '  ', ...stamp });
    expect(task(same, 'Acta de avance de obra #7').status).toBe('client');
    s = run(s, { type: 'client.changes', taskId: acta.id, comment: 'Ajusten cantidades', ...stamp });
    expect(task(s, 'Acta de avance de obra #7').status).toBe('doing');
  });

  it('la automatización de vencidas sube la prioridad una sola vez', () => {
    let s = buildState(BASE);
    const lev = task(s, 'Levantamiento arquitectónico');
    expect(lev.priority).toBe('medium');
    expect(isOverdue(lev, BASE)).toBe(true);
    s = run(s, { type: 'automation.tick', ...stamp });
    expect(task(s, 'Levantamiento arquitectónico').priority).toBe('high');
    const n = s.workspaces.construccion.notifications.filter((x) => x.key === 'overdueRaised').length;
    expect(n).toBe(1);
    s = run(s, { type: 'automation.tick', ...stamp });
    expect(s.workspaces.construccion.notifications.filter((x) => x.key === 'overdueRaised').length).toBe(1);
  });

  it('cerrar un sprint pasa las tareas sin terminar al siguiente', () => {
    let s = buildState(BASE, 'software');
    const ws = s.workspaces.software;
    const sprint8 = ws.milestones.find((m) => m.name === 'Sprint 8')!;
    const sprint9 = ws.milestones.find((m) => m.name === 'Sprint 9')!;
    const open = ws.tasks.filter((t) => t.milestoneId === sprint8.id && t.status !== 'done').length;
    s = run(s, { type: 'sprint.close', id: sprint8.id, nextName: 'Sprint 11', ...stamp });
    const after = s.workspaces.software;
    expect(after.milestones.find((m) => m.id === sprint8.id)?.closed).toBe(true);
    expect(after.tasks.filter((t) => t.milestoneId === sprint9.id && t.history.some((h) => h.key === 'sprintMoved'))).toHaveLength(open);
    expect(after.tasks.filter((t) => t.milestoneId === sprint8.id && t.status !== 'done')).toHaveLength(0);
  });

  it('el burndown baja con las tareas terminadas y la línea ideal termina en 0', () => {
    const s = buildState(BASE, 'software');
    const ws = s.workspaces.software;
    const sprint8 = ws.milestones.find((m) => m.name === 'Sprint 8')!;
    const bd = burndown(ws, sprint8, BASE);
    expect(bd.ideal[bd.ideal.length - 1]).toBe(0);
    const actual = bd.actual.filter((v): v is number => v !== null);
    for (let i = 1; i < actual.length; i++) expect(actual[i]).toBeLessThanOrEqual(actual[i - 1]);
    expect(actual[actual.length - 1]).toBe(bd.remaining);
  });

  it('facturar un hito usa el siguiente número de prefactura y registra el aviso', () => {
    let s = buildState(BASE, 'agencia');
    const ms = s.workspaces.agencia.milestones.find((m) => m.name === 'Identidad visual')!;
    s = run(s, { type: 'milestone.invoice', id: ms.id, number: 'PF-0022', ...stamp });
    const after = s.workspaces.agencia;
    expect(after.milestones.find((m) => m.id === ms.id)?.invoice).toEqual({ number: 'PF-0022', on: BASE });
    expect(after.outbox[0].key).toBe('invoice');
  });
});
