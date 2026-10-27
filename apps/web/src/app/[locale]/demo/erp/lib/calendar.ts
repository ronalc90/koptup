/**
 * Calendario de la demo. La demo trabaja siempre sobre el CIERRE DEL MES
 * ANTERIOR a hoy (hora de Colombia): si hoy es 14 de octubre de 2026, el
 * período abierto es septiembre de 2026 y lo que registras queda con fecha
 * 30 de septiembre. La historia de ejemplo arranca el 1 de enero del año que
 * haga falta para tener al menos seis meses completos de comparación.
 *
 * Todo se calcula con días civiles (sin Date ni zona horaria) para que el
 * resultado sea igual en el servidor, en el navegador y en las pruebas.
 */
import { addDays, addMonths, lastDayOfMonth, todayInColombia, weekday } from './format';

/** Fecha de trabajo para un día dado: el último día del mes anterior. */
export function workDateFor(today: string) {
  return addDays(`${today.slice(0, 7)}-01`, -1);
}

/** Primer día de la historia de ejemplo para una fecha de trabajo. */
export function historyStartFor(workDate: string) {
  return `${addMonths(workDate.slice(0, 7), -5).slice(0, 4)}-01-01`;
}

/** Fecha de trabajo vigente según el reloj del navegador (solo después de montar). */
export function currentWorkDate(nowMs: number) {
  return workDateFor(todayInColombia(nowMs));
}

/** true si la fecha es el último día de su mes. */
export function isMonthEnd(iso: string) {
  return lastDayOfMonth(iso.slice(0, 7)) === iso;
}

/** El día hábil (lunes a viernes) igual o anterior a la fecha. */
export function businessDayOnOrBefore(iso: string) {
  let d = iso;
  while (weekday(d) === 0 || weekday(d) === 6) d = addDays(d, -1);
  return d;
}

/** El día hábil (lunes a viernes) igual o posterior a la fecha. */
export function businessDayOnOrAfter(iso: string) {
  let d = iso;
  while (weekday(d) === 0 || weekday(d) === 6) d = addDays(d, 1);
  return d;
}
