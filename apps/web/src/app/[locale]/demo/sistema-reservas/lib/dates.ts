/**
 * Fechas sin zona: 'AAAA-MM-DD' calculadas en UTC para que el día 15 sea el
 * 15 en cualquier navegador. "Hoy" y "ahora" se toman en hora de Bogotá
 * (UTC−5 todo el año) y solo dentro de efectos o manejadores del cliente.
 */
import type { ISODate, L, Stamp } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

export function toISO(d: Date): ISODate {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function parseISO(iso: ISODate): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
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

/** Lunes de la semana de `iso`. */
export function startOfWeek(iso: ISODate): ISODate {
  const wd = weekday(iso);
  return addDays(iso, wd === 0 ? -6 : 1 - wd);
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

export function sameMonth(a: ISODate, b: ISODate): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

/** Bogotá no tiene horario de verano: siempre UTC−5. */
const BOGOTA_OFFSET_MIN = -5 * 60;

export interface Now {
  date: ISODate;
  minutes: number;
  stamp: Stamp;
}

/** Fecha y hora actuales en Bogotá. Solo en el cliente (efectos o manejadores). */
export function bogotaNow(ms: number = Date.now()): Now {
  const d = new Date(ms + BOGOTA_OFFSET_MIN * 60000);
  const date = toISO(d);
  const minutes = d.getUTCHours() * 60 + d.getUTCMinutes();
  return { date, minutes, stamp: `${date}T${hhmm(minutes)}` };
}

export function hhmm(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

export function stampOf(date: ISODate, minutes: number): Stamp {
  return `${date}T${hhmm(minutes)}`;
}

/** Hora de Bogotá → instante UTC en formato de calendario (AAAAMMDDTHHmmssZ). */
export function utcCompact(date: ISODate, minutes: number): string {
  const d = parseISO(date);
  d.setUTCMinutes(minutes - BOGOTA_OFFSET_MIN);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

/* ------------------------------------------------------------------ */
/* Festivos de Colombia (Ley 51 de 1983, "Ley Emiliani")               */
/* ------------------------------------------------------------------ */

export interface Holiday {
  date: ISODate;
  name: L;
}

/** Domingo de Pascua (algoritmo gregoriano anónimo). */
export function easter(year: number): ISODate {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Corre la fecha al lunes siguiente si no cae en lunes. */
function nextMonday(iso: ISODate): ISODate {
  const wd = weekday(iso);
  return wd === 1 ? iso : addDays(iso, (8 - wd) % 7);
}

const cache = new Map<number, Holiday[]>();

export function holidays(year: number): Holiday[] {
  const hit = cache.get(year);
  if (hit) return hit;
  const y = (m: number, d: number) => `${year}-${pad(m)}-${pad(d)}`;
  const e = easter(year);
  const list: Holiday[] = [
    { date: y(1, 1), name: { es: 'Año Nuevo', en: "New Year's Day" } },
    { date: nextMonday(y(1, 6)), name: { es: 'Día de los Reyes Magos', en: 'Epiphany' } },
    { date: nextMonday(y(3, 19)), name: { es: 'Día de San José', en: "Saint Joseph's Day" } },
    { date: addDays(e, -3), name: { es: 'Jueves Santo', en: 'Maundy Thursday' } },
    { date: addDays(e, -2), name: { es: 'Viernes Santo', en: 'Good Friday' } },
    { date: y(5, 1), name: { es: 'Día del Trabajo', en: 'Labour Day' } },
    { date: addDays(e, 43), name: { es: 'Ascensión del Señor', en: 'Ascension Day' } },
    { date: addDays(e, 64), name: { es: 'Corpus Christi', en: 'Corpus Christi' } },
    { date: addDays(e, 71), name: { es: 'Sagrado Corazón', en: 'Sacred Heart' } },
    { date: nextMonday(y(6, 29)), name: { es: 'San Pedro y San Pablo', en: 'Saints Peter and Paul' } },
    { date: y(7, 20), name: { es: 'Día de la Independencia', en: 'Independence Day' } },
    { date: y(8, 7), name: { es: 'Batalla de Boyacá', en: 'Battle of Boyacá' } },
    { date: nextMonday(y(8, 15)), name: { es: 'Asunción de la Virgen', en: 'Assumption Day' } },
    { date: nextMonday(y(10, 12)), name: { es: 'Día de la Raza', en: 'Columbus Day' } },
    { date: nextMonday(y(11, 1)), name: { es: 'Todos los Santos', en: "All Saints' Day" } },
    { date: nextMonday(y(11, 11)), name: { es: 'Independencia de Cartagena', en: 'Independence of Cartagena' } },
    { date: y(12, 8), name: { es: 'Inmaculada Concepción', en: 'Immaculate Conception' } },
    { date: y(12, 25), name: { es: 'Navidad', en: 'Christmas Day' } },
  ];
  list.sort((a, b) => (a.date < b.date ? -1 : 1));
  cache.set(year, list);
  return list;
}

export function holidayOn(iso: ISODate): Holiday | null {
  return holidays(Number(iso.slice(0, 4))).find((h) => h.date === iso) ?? null;
}

export function holidaysInMonth(iso: ISODate): Holiday[] {
  const ym = iso.slice(0, 7);
  return holidays(Number(iso.slice(0, 4))).filter((h) => h.date.startsWith(ym));
}

/* ------------------------------------------------------------------ */
/* Formatos (siempre con zona UTC para no correr el día)               */
/* ------------------------------------------------------------------ */

const TAG: Record<string, string> = { es: 'es-CO', en: 'en-US' };

export type DateStyle = 'long' | 'medium' | 'short' | 'weekdayShort' | 'month' | 'dayMonth';

export function formatDate(iso: ISODate, locale: string, style: DateStyle = 'medium'): string {
  const opts: Intl.DateTimeFormatOptions =
    style === 'long'
      ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
      : style === 'short'
        ? { weekday: 'short', day: 'numeric', month: 'short' }
        : style === 'weekdayShort'
          ? { weekday: 'short' }
          : style === 'month'
            ? { month: 'long', year: 'numeric' }
            : style === 'dayMonth'
              ? { weekday: 'long', day: 'numeric', month: 'long' }
              : { day: 'numeric', month: 'short', year: 'numeric' };
  return new Intl.DateTimeFormat(TAG[locale] ?? 'es-CO', { ...opts, timeZone: 'UTC' }).format(parseISO(iso));
}

/** 10:00 a. m. / 10:00 AM */
export function formatTime(minutes: number, locale: string): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = locale === 'en' ? (h < 12 ? 'AM' : 'PM') : h < 12 ? 'a. m.' : 'p. m.';
  return `${h12}:${pad(m)} ${suffix}`;
}

export function formatStamp(at: Stamp, locale: string): string {
  const [date, time = '00:00'] = at.split('T');
  const [h, m] = time.split(':').map(Number);
  return `${formatDate(date, locale, 'medium')} · ${formatTime(h * 60 + m, locale)}`;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
