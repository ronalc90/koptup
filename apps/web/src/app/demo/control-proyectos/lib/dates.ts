/**
 * Fechas como texto ISO 'AAAA-MM-DD' (sin hora ni zona) para que los cálculos
 * no dependan de la zona horaria del navegador: una tarea que vence el día 5
 * se muestra el día 5 en Bogotá, en Madrid o en Ciudad de México.
 */
import type { ISODate, ISODateTime } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

export function toISO(d: Date): ISODate {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function parseISO(iso: ISODate): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Fecha local del navegador. Se llama solo en efectos o manejadores del cliente. */
export function localToday(): ISODate {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Fecha y hora local del navegador. Solo en manejadores del cliente. */
export function localNow(): ISODateTime {
  const now = new Date();
  return `${localToday()}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function addDays(iso: ISODate, n: number): ISODate {
  const d = parseISO(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toISO(d);
}

export function diffDays(from: ISODate, to: ISODate): number {
  return Math.round((parseISO(to).getTime() - parseISO(from).getTime()) / 86400000);
}

/** 0 = domingo … 6 = sábado */
export function weekday(iso: ISODate): number {
  return parseISO(iso).getUTCDay();
}

/**
 * Día hábil a `n` días de `base`: si cae en fin de semana, una fecha pasada se
 * corre al viernes anterior y una futura al lunes siguiente (así lo vencido
 * sigue vencido y lo futuro sigue en el futuro).
 */
export function workday(base: ISODate, n: number): ISODate {
  let d = addDays(base, n);
  if (n === 0) return d;
  const step = n < 0 ? -1 : 1;
  while (weekday(d) === 0 || weekday(d) === 6) d = addDays(d, step);
  return d;
}

export function firstOfMonth(iso: ISODate): ISODate {
  return `${iso.slice(0, 7)}-01`;
}

export function addMonths(iso: ISODate, n: number): ISODate {
  const d = parseISO(firstOfMonth(iso));
  d.setUTCMonth(d.getUTCMonth() + n);
  return toISO(d);
}

export function daysInMonth(iso: ISODate): number {
  const d = parseISO(iso);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
}

export function minDate(a: ISODate, b: ISODate): ISODate {
  return a < b ? a : b;
}

export function maxDate(a: ISODate, b: ISODate): ISODate {
  return a > b ? a : b;
}

const TAG: Record<string, string> = { es: 'es-CO', en: 'en-US' };

export type DateStyle = 'short' | 'medium' | 'long' | 'day' | 'month' | 'weekday';

/** Formatea una fecha ISO en el idioma activo, siempre en UTC (sin corrimientos). */
export function formatDate(iso: ISODate, locale: string, style: DateStyle = 'medium'): string {
  const opts: Intl.DateTimeFormatOptions =
    style === 'short'
      ? { day: 'numeric', month: 'short' }
      : style === 'long'
        ? { day: 'numeric', month: 'long', year: 'numeric' }
        : style === 'day'
          ? { weekday: 'short', day: 'numeric', month: 'short' }
          : style === 'month'
            ? { month: 'long', year: 'numeric' }
            : style === 'weekday'
              ? { weekday: 'short' }
              : { day: 'numeric', month: 'short', year: 'numeric' };
  return new Intl.DateTimeFormat(TAG[locale] ?? 'es-CO', { ...opts, timeZone: 'UTC' }).format(parseISO(iso));
}

/** "AAAA-MM-DDTHH:mm" → fecha corta y hora. */
export function formatDateTime(at: ISODateTime, locale: string): string {
  const [date, time = '00:00'] = at.split('T');
  return `${formatDate(date, locale, 'short')} · ${time}`;
}
