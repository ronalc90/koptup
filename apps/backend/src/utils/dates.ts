/**
 * Fechas del portal en la zona horaria del negocio (Colombia).
 *
 * Un pedido creado el 9 de octubre a las 8 p. m. en Bogotá ya es 10 de
 * octubre en UTC: cortar `toISOString()` daba un día distinto al de la
 * persona. Estas funciones devuelven el día calendario en America/Bogota.
 */
export const BUSINESS_TIME_ZONE = 'America/Bogota';

/** Día calendario `AAAA-MM-DD` de la fecha en Bogotá (null si no hay fecha válida). */
export function businessDay(value: Date | string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  // en-CA formatea como AAAA-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: BUSINESS_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

/** Año calendario de la fecha en Bogotá. */
export function businessYear(value: Date = new Date()): number {
  return Number(businessDay(value)?.slice(0, 4) ?? value.getUTCFullYear());
}

/**
 * Fecha (Date) que corresponde al final del día `AAAA-MM-DD` en Bogotá
 * (UTC−5, sin horario de verano): para fechas de vencimiento elegidas como día.
 */
export function endOfBusinessDay(day: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const date = new Date(`${day}T23:59:59.999-05:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Fecha (Date) del inicio del día `AAAA-MM-DD` en Bogotá. */
export function startOfBusinessDay(day: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const date = new Date(`${day}T00:00:00.000-05:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}
