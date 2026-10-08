/**
 * Cálculos de la demo (funciones puras): avance, vencidas, presupuesto,
 * semáforo, burndown, carga del equipo, informe semanal y exportación CSV.
 * Todo sale del estado; ningún número está escrito a mano en la interfaz.
 */
import { addDays, diffDays, maxDate, minDate } from './dates';
import type { Filters, ISODate, Member, Milestone, Project, StatusId, Task, Workspace } from './types';

export function isOverdue(task: Task, today: ISODate): boolean {
  return task.status !== 'done' && task.due < today;
}

export function daysLate(task: Task, today: ISODate): number {
  return Math.max(0, diffDays(task.due, today));
}

export function projectTasks(ws: Workspace, projectId: string): Task[] {
  return ws.tasks.filter((t) => t.projectId === projectId);
}

export function projectMilestones(ws: Workspace, projectId: string): Milestone[] {
  return ws.milestones.filter((m) => m.projectId === projectId).sort((a, b) => a.start.localeCompare(b.start));
}

/**
 * Avance ponderado por horas estimadas: horas de las tareas terminadas sobre
 * el total de horas estimadas (0–100).
 */
export function progress(tasks: Task[]): number {
  const total = tasks.reduce((s, t) => s + t.estimate, 0);
  if (total === 0) return tasks.length === 0 ? 0 : Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100);
  const done = tasks.filter((t) => t.status === 'done').reduce((s, t) => s + t.estimate, 0);
  return Math.round((done / total) * 100);
}

export function checklistProgress(task: Task): number {
  if (task.checklist.length === 0) return 0;
  return Math.round((task.checklist.filter((c) => c.done).length / task.checklist.length) * 100);
}

export function memberById(ws: Workspace, id: string | null | undefined): Member | undefined {
  return id ? ws.members.find((m) => m.id === id) : undefined;
}

export function me(ws: Workspace): Member {
  return ws.members.find((m) => m.me) ?? ws.members[0];
}

export function loggedHours(ws: Workspace, taskId: string): number {
  return ws.time.filter((e) => e.taskId === taskId).reduce((s, e) => s + e.hours, 0);
}

/** Costo de las horas registradas (horas × costo por hora de la persona). */
export function laborCost(ws: Workspace, taskIds: Set<string>): number {
  const rate = new Map(ws.members.map((m) => [m.id, m.rate]));
  return ws.time.filter((e) => taskIds.has(e.taskId)).reduce((s, e) => s + e.hours * (rate.get(e.memberId) ?? 0), 0);
}

export interface MilestoneStats {
  milestone: Milestone;
  tasks: Task[];
  progress: number;
  labor: number;
  expenses: number;
  cost: number;
  /** Presupuesto ejecutado (0–100+). */
  spent: number;
  late: boolean;
  complete: boolean;
}

export function milestoneStats(ws: Workspace, m: Milestone, today: ISODate): MilestoneStats {
  const tasks = ws.tasks.filter((t) => t.milestoneId === m.id);
  const labor = laborCost(ws, new Set(tasks.map((t) => t.id)));
  const expenses = ws.expenses.filter((x) => x.milestoneId === m.id).reduce((s, x) => s + x.amount, 0);
  const cost = labor + expenses;
  const complete = tasks.length > 0 && tasks.every((t) => t.status === 'done');
  return {
    milestone: m,
    tasks,
    progress: progress(tasks),
    labor,
    expenses,
    cost,
    spent: m.budget > 0 ? Math.round((cost / m.budget) * 100) : 0,
    late: !complete && !m.closed && m.end < today && tasks.length > 0,
    complete,
  };
}

export interface ProjectStats {
  project: Project;
  tasks: Task[];
  progress: number;
  overdue: Task[];
  budget: number;
  cost: number;
  spent: number;
  milestones: MilestoneStats[];
  current: MilestoneStats | null;
  health: Health;
}

export type HealthLevel = 'ok' | 'risk' | 'late';
export interface Health {
  level: HealthLevel;
  reasons: { key: string; params: Record<string, string | number> }[];
}

/** El hito en curso: el que contiene hoy; si no, el próximo; si no, el último. */
export function currentMilestone(list: MilestoneStats[], today: ISODate): MilestoneStats | null {
  const open = list.filter((s) => !s.milestone.closed);
  return (
    open.find((s) => s.milestone.start <= today && s.milestone.end >= today) ??
    open.find((s) => s.late) ??
    open.find((s) => s.milestone.start > today) ??
    list[list.length - 1] ??
    null
  );
}

/**
 * Semáforo del proyecto (reglas explicables):
 * - Atrasado: un hito vencido sin terminar o 2 o más tareas vencidas.
 * - En riesgo: 1 tarea vencida, o el presupuesto ejecutado supera el avance en más de 10 puntos.
 * - En tiempo: lo demás.
 */
export function health(overdue: Task[], prog: number, spent: number, milestones: MilestoneStats[], today: ISODate): Health {
  const reasons: Health['reasons'] = [];
  const lateMs = milestones.filter((m) => m.late);
  for (const m of lateMs) reasons.push({ key: 'milestoneLate', params: { name: m.milestone.name, days: diffDays(m.milestone.end, today) } });
  if (overdue.length > 0) {
    const worst = [...overdue].sort((a, b) => a.due.localeCompare(b.due))[0];
    reasons.push({ key: overdue.length === 1 ? 'oneOverdue' : 'manyOverdue', params: { count: overdue.length, task: worst.title, days: diffDays(worst.due, today) } });
  }
  if (spent > prog + 10) reasons.push({ key: 'overBudget', params: { spent, progress: prog } });
  const level: HealthLevel = lateMs.length > 0 || overdue.length >= 2 ? 'late' : overdue.length === 1 || spent > prog + 10 ? 'risk' : 'ok';
  return { level, reasons };
}

export function projectStats(ws: Workspace, project: Project, today: ISODate): ProjectStats {
  const tasks = projectTasks(ws, project.id);
  const ms = projectMilestones(ws, project.id).map((m) => milestoneStats(ws, m, today));
  const prog = progress(tasks);
  const overdue = tasks.filter((t) => isOverdue(t, today));
  const budget = ms.reduce((s, m) => s + m.milestone.budget, 0);
  const orphanCost = laborCost(ws, new Set(tasks.filter((t) => !t.milestoneId).map((t) => t.id)));
  const cost = ms.reduce((s, m) => s + m.cost, 0) + orphanCost;
  const spent = budget > 0 ? Math.round((cost / budget) * 100) : 0;
  return {
    project,
    tasks,
    progress: prog,
    overdue,
    budget,
    cost,
    spent,
    milestones: ms,
    current: currentMilestone(ms, today),
    health: health(overdue, prog, spent, ms, today),
  };
}

/** Tareas de las que depende esta y que aún no terminan. */
export function blockers(ws: Workspace, task: Task): Task[] {
  return task.dependsOn.map((id) => ws.tasks.find((t) => t.id === id)).filter((t): t is Task => !!t && t.status !== 'done');
}

/** ¿`candidate` depende (directa o indirectamente) de `taskId`? Evita ciclos. */
export function dependsOnTransitively(ws: Workspace, candidateId: string, taskId: string, seen = new Set<string>()): boolean {
  if (candidateId === taskId) return true;
  if (seen.has(candidateId)) return false;
  seen.add(candidateId);
  const c = ws.tasks.find((t) => t.id === candidateId);
  return !!c && c.dependsOn.some((d) => dependsOnTransitively(ws, d, taskId, seen));
}

/** Dependencias fin-inicio que no se cumplen en el cronograma (la sucesora empieza antes de que termine la predecesora). */
export function dependencyConflicts(ws: Workspace, tasks: Task[]): { task: Task; pred: Task }[] {
  const out: { task: Task; pred: Task }[] = [];
  for (const t of tasks) {
    for (const id of t.dependsOn) {
      const pred = ws.tasks.find((x) => x.id === id);
      if (pred && pred.status !== 'done' && t.start <= pred.due) out.push({ task: t, pred });
    }
  }
  return out;
}

export interface Burndown {
  days: ISODate[];
  ideal: number[];
  actual: (number | null)[];
  total: number;
  remaining: number;
}

/** Burndown de un hito/sprint: horas estimadas pendientes por día (real hasta hoy) contra la línea ideal. */
export function burndown(ws: Workspace, m: Milestone, today: ISODate): Burndown {
  const tasks = ws.tasks.filter((t) => t.milestoneId === m.id);
  const total = tasks.reduce((s, t) => s + t.estimate, 0);
  const span = Math.max(1, diffDays(m.start, m.end));
  const days: ISODate[] = [];
  for (let i = 0; i <= span; i++) days.push(addDays(m.start, i));
  const ideal = days.map((_, i) => Math.round(total - (total * i) / span));
  const actual = days.map((d) =>
    d > today ? null : total - tasks.filter((t) => t.status === 'done' && t.completedAt && t.completedAt <= d).reduce((s, t) => s + t.estimate, 0),
  );
  const remaining = total - tasks.filter((t) => t.status === 'done').reduce((s, t) => s + t.estimate, 0);
  return { days, ideal, actual, total, remaining };
}

export interface Workload {
  member: Member;
  /** Horas pendientes de tareas abiertas que vencen en los próximos 14 días (o ya vencidas). */
  pending: number;
  capacity: number;
  load: number;
}

/** Carga del equipo en las próximas dos semanas (todos los proyectos del espacio). */
export function workload(ws: Workspace, today: ISODate): Workload[] {
  const horizon = addDays(today, 14);
  return ws.members.map((member) => {
    const pending = ws.tasks
      .filter((t) => t.assigneeId === member.id && t.status !== 'done' && t.due <= horizon)
      .reduce((s, t) => s + Math.max(0, t.estimate - loggedHours(ws, t.id)), 0);
    const capacity = member.capacity * 2;
    return { member, pending: Math.round(pending * 10) / 10, capacity, load: capacity > 0 ? Math.round((pending / capacity) * 100) : 0 };
  });
}

export function hoursByMember(ws: Workspace, taskIds: Set<string>, from: ISODate, to: ISODate): { member: Member; hours: number }[] {
  return ws.members
    .map((member) => ({
      member,
      hours: ws.time.filter((e) => e.memberId === member.id && taskIds.has(e.taskId) && e.date >= from && e.date <= to).reduce((s, e) => s + e.hours, 0),
    }))
    .filter((x) => x.hours > 0);
}

export interface WeeklyReport {
  from: ISODate;
  to: ISODate;
  completed: Task[];
  overdue: Task[];
  upcoming: Task[];
  inClientReview: Task[];
  hours: number;
  stats: ProjectStats;
}

/** Informe de los últimos 7 días y lo que viene en los próximos 7. */
export function weeklyReport(ws: Workspace, project: Project, today: ISODate): WeeklyReport {
  const stats = projectStats(ws, project, today);
  const from = addDays(today, -6);
  const next = addDays(today, 7);
  const ids = new Set(stats.tasks.map((t) => t.id));
  return {
    from,
    to: today,
    completed: stats.tasks.filter((t) => t.status === 'done' && t.completedAt && t.completedAt >= from && t.completedAt <= today),
    overdue: stats.overdue,
    upcoming: stats.tasks.filter((t) => t.status !== 'done' && t.due >= today && t.due <= next).sort((a, b) => a.due.localeCompare(b.due)),
    inClientReview: stats.tasks.filter((t) => t.status === 'client'),
    hours: ws.time.filter((e) => ids.has(e.taskId) && e.date >= from && e.date <= today).reduce((s, e) => s + e.hours, 0),
    stats,
  };
}

export function applyFilters(tasks: Task[], f: Filters, today: ISODate): Task[] {
  const q = f.q.trim().toLowerCase();
  return tasks.filter(
    (t) =>
      (!q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.tags.some((g) => g.toLowerCase().includes(q))) &&
      (!f.assignee || (f.assignee === 'none' ? !t.assigneeId : t.assigneeId === f.assignee)) &&
      (!f.priority || t.priority === f.priority) &&
      (!f.milestone || t.milestoneId === f.milestone) &&
      (!f.overdueOnly || isOverdue(t, today)),
  );
}

export function filtersActive(f: Filters): boolean {
  return !!(f.q || f.assignee || f.priority || f.milestone || f.overdueOnly);
}

/** Rango de fechas que cubre un conjunto de tareas e hitos. */
export function dateRange(tasks: Task[], milestones: Milestone[], fallback: ISODate): [ISODate, ISODate] {
  let from = fallback;
  let to = fallback;
  for (const t of tasks) {
    from = minDate(from, t.start);
    to = maxDate(to, t.due);
  }
  for (const m of milestones) {
    from = minDate(from, m.start);
    to = maxDate(to, m.end);
  }
  return [from, to];
}

export const STATUS_ORDER: Record<StatusId, number> = { todo: 0, doing: 1, review: 2, client: 3, done: 4 };

/** CSV con separador ";" y BOM para que Excel en español lo abra con tildes y columnas. */
export function toCSV(rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + rows.map((r) => r.map(esc).join(';')).join('\r\n');
}

export function downloadBlob(content: BlobPart, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 60);
}

/** Siguiente número de prefactura de ejemplo del espacio (PF-0001…). */
export function nextInvoiceNumber(ws: Workspace): string {
  const max = ws.milestones.reduce((n, m) => {
    const num = m.invoice ? Number(m.invoice.number.replace(/\D/g, '')) : 0;
    return Math.max(n, num);
  }, 0);
  return `PF-${String(max + 1).padStart(4, '0')}`;
}
