/**
 * Días hábiles en la hora de Colombia (America/Bogota, UTC−5 sin horario de
 * verano). Se saltan sábados y domingos; los festivos de Colombia no se
 * descuentan (un plazo que cae en festivo vence ese día).
 */
const BOGOTA_OFFSET_MS = -5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Día de la semana en Bogotá (0 = domingo … 6 = sábado). */
export function bogotaWeekday(date: Date): number {
  return new Date(date.getTime() + BOGOTA_OFFSET_MS).getUTCDay();
}

export function isBusinessDay(date: Date): boolean {
  const d = bogotaWeekday(date);
  return d !== 0 && d !== 6;
}

/**
 * Suma `days` días hábiles conservando la hora: una solicitud del viernes a
 * las 10:00 con 1 día hábil vence el lunes a las 10:00; una del sábado, el
 * lunes a la misma hora.
 */
export function addBusinessDays(from: Date, days: number): Date {
  let result = new Date(from.getTime());
  let remaining = Math.max(0, Math.trunc(days));
  while (remaining > 0) {
    result = new Date(result.getTime() + DAY_MS);
    if (isBusinessDay(result)) remaining -= 1;
  }
  return result;
}
