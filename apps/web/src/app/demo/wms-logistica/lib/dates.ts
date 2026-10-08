/**
 * Fechas y horas de la demo como texto local ('AAAA-MM-DD' y 'AAAA-MM-DDTHH:MM')
 * para que los cálculos no dependan de la zona horaria del navegador. La fecha
 * "de hoy" solo se lee en el cliente (efectos y manejadores de eventos), nunca
 * durante el render inicial, para no romper la hidratación.
 */

export type ISODate = string; // 2026-10-08
export type ISODateTime = string; // 2026-10-08T09:15

const pad = (n: number) => String(n).padStart(2, '0');

function parse(iso: ISODate): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toISO(d: Date): ISODate {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Momento actual del navegador en hora local (solo en el cliente). */
export function localNow(): ISODateTime {
  const n = new Date();
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}T${pad(n.getHours())}:${pad(n.getMinutes())}`;
}

export function addDays(iso: ISODate, days: number): ISODate {
  const d = parse(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toISO(d);
}

export function diffDays(from: ISODate, to: ISODate): number {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / 86400000);
}

export function dayOfMonth(iso: ISODate): number {
  return Number(iso.slice(8, 10));
}

export function daysInMonth(iso: ISODate): number {
  const d = parse(iso);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
}

export function previousMonth(iso: ISODate): ISODate {
  const d = parse(iso);
  return toISO(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)));
}

/** Minutos desde la medianoche de una fecha-hora local. */
export function minutesOf(dt: ISODateTime): number {
  const [h, m] = dt.slice(11, 16).split(':').map(Number);
  return h * 60 + m;
}

/** Suma (o resta) minutos a una fecha-hora local, cruzando días si hace falta. */
export function addMinutes(dt: ISODateTime, minutes: number): ISODateTime {
  const total = minutesOf(dt) + minutes;
  const dayShift = Math.floor(total / 1440);
  const rest = ((total % 1440) + 1440) % 1440;
  const date = addDays(dt.slice(0, 10), dayShift);
  return `${date}T${pad(Math.floor(rest / 60))}:${pad(rest % 60)}`;
}

export function hhmm(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export function timeToMinutes(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

export function dateOf(dt: ISODateTime): ISODate {
  return dt.slice(0, 10);
}
