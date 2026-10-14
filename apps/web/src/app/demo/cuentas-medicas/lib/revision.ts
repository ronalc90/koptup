import type { Factura, Glosa } from '../tipos-auditoria';
import { zonaDeFecha } from './formato';

/**
 * Estado de cada factura según la revisión del auditor.
 *
 * El backend guarda el estado que propuso el modelo al auditar el PDF y no lo
 * cambia cuando el auditor decide las glosas (solo recalcula los totales). La
 * demo lo calcula a partir de las decisiones, que sí quedan guardadas en el
 * servidor, así que todas las personas con acceso ven el mismo estado:
 *  - con glosas pendientes → «En auditoría»;
 *  - con todas las glosas decididas → «Glosada» si queda algún valor glosado,
 *    o «Aceptada» si el auditor las descartó todas;
 *  - sin glosas → el estado que guardó el servidor, salvo «En auditoría» o
 *    «Radicada», que pasan a «Aceptada» porque no hay nada que decidir.
 */

export const ESTADO_EN_AUDITORIA = 'En Auditoría';

/** Una glosa está pendiente mientras el auditor no la confirma, ajusta ni descarta. */
export function glosaPendiente(glosa: Pick<Glosa, 'estado'>): boolean {
  return glosa.estado !== 'Aceptada' && glosa.estado !== 'Rechazada';
}

export interface ResumenRevision {
  /** Estado que muestra la demo (clave del backend: 'En Auditoría', 'Glosada', 'Aceptada'…). */
  estado: string;
  glosas: number;
  pendientes: number;
  /** Suma de lo glosado en las glosas que no se descartaron. */
  valorGlosado: number;
  /** Revisión cerrada: no queda ninguna glosa pendiente. */
  cerrada: boolean;
}

export function resumirRevision(
  factura: Pick<Factura, 'estado'>,
  glosas: Array<Pick<Glosa, 'estado' | 'valorGlosado'>>,
): ResumenRevision {
  const pendientes = glosas.filter(glosaPendiente).length;
  const valorGlosado = glosas
    .filter((g) => g.estado !== 'Rechazada')
    .reduce((suma, g) => suma + (Number(g.valorGlosado) || 0), 0);

  let estado: string;
  if (pendientes > 0) estado = ESTADO_EN_AUDITORIA;
  else if (glosas.length > 0) estado = valorGlosado > 0 ? 'Glosada' : 'Aceptada';
  else estado = factura.estado === ESTADO_EN_AUDITORIA || factura.estado === 'Radicada' ? 'Aceptada' : factura.estado;

  return { estado, glosas: glosas.length, pendientes, valorGlosado, cerrada: pendientes === 0 };
}

/**
 * Fecha 'AAAA-MM-DD' en hora de Colombia (o la fecha tal cual si el servidor
 * la guardó sin hora, ver `zonaDeFecha`), para comparar con los filtros.
 */
export function diaColombia(iso: string | undefined): string {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  // en-CA formatea como AAAA-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: zonaDeFecha(iso),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(fecha);
}
