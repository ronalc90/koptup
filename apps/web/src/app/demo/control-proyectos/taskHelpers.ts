/**
 * Helpers compartidos para la demo `control-proyectos`.
 * Centraliza utilidades de tareas para evitar duplicación entre vistas.
 */

import type { Task } from './types';

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'alta':
      return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400';
    case 'media':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400';
    case 'baja':
      return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export function getTaskProgress(task: Task): number {
  const total = task.checklist.length;
  const done = task.checklist.filter((item) => item.done).length;
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

/**
 * Score AI sintético determinístico a partir del id de la tarea, para que
 * cada tarea tenga un score AI estable en la demo sin estado adicional.
 */
export function getAiScore(taskId: number): number {
  const seed = (taskId * 73 + 13) % 60;
  return 40 + seed;
}

export function getAiScoreTone(score: number): string {
  if (score >= 85) return 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300';
  if (score >= 65) return 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300';
  return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300';
}

/**
 * Devuelve dependencias, nivel de riesgo y horas registradas determinísticas
 * por id, para mostrar badges estables en cada tarjeta de tarea de la demo.
 */
export function getTaskMeta(taskId: number): { deps: number; risk: 'low' | 'medium' | 'high'; hours: number } {
  const r = (taskId * 17) % 5;
  const risk = r >= 4 ? 'high' : r >= 2 ? 'medium' : 'low';
  const deps = (taskId * 3) % 4;
  const hours = ((taskId * 11) % 50) / 10 + 0.5;
  return { deps, risk, hours };
}
