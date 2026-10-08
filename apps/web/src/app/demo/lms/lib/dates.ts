/**
 * Fechas de la demo como texto ISO (AAAA-MM-DD) para no depender de la zona
 * horaria al comparar días. Todo se calcula en el navegador después de montar
 * la página (nunca en el render del servidor) para evitar errores de
 * hidratación.
 */
export type ISODate = string;

const pad = (n: number) => String(n).padStart(2, '0');

export function iso(y: number, m: number, d: number): ISODate {
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** Hoy según el reloj del navegador. */
export function localToday(now: Date = new Date()): ISODate {
  return iso(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function toUtc(d: ISODate): number {
  const [y, m, dd] = d.split('-').map(Number);
  return Date.UTC(y, m - 1, dd);
}

export function addDays(d: ISODate, n: number): ISODate {
  return new Date(toUtc(d) + n * 86400000).toISOString().slice(0, 10);
}

/** a − b en días. */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((toUtc(a) - toUtc(b)) / 86400000);
}

export function yearOf(d: ISODate): number {
  return Number(d.slice(0, 4));
}

export type DateStyle = 'short' | 'long' | 'weekday' | 'dayMonth';

export function formatDate(d: ISODate, locale: string, style: DateStyle = 'short'): string {
  const tag = locale === 'en' ? 'en-US' : 'es-CO';
  const opts: Intl.DateTimeFormatOptions =
    style === 'long'
      ? { day: 'numeric', month: 'long', year: 'numeric' }
      : style === 'weekday'
        ? { weekday: 'short' }
        : style === 'dayMonth'
          ? { day: 'numeric', month: 'short' }
          : { day: '2-digit', month: 'short', year: 'numeric' };
  return new Intl.DateTimeFormat(tag, { ...opts, timeZone: 'UTC' }).format(new Date(toUtc(d)));
}

/** mm:ss (o h:mm:ss) a partir de segundos. */
export function clock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(r)}` : `${pad(m)}:${pad(r)}`;
}

/** Bogotá no tiene horario de verano: UTC−5 todo el año. */
export const BOGOTA_OFFSET_MIN = -5 * 60;

/** Fecha ISO de "hoy" en Colombia para un instante dado. */
export function bogotaDate(ms: number): ISODate {
  return new Date(ms + BOGOTA_OFFSET_MIN * 60000).toISOString().slice(0, 10);
}

/** Instante (ms) de una fecha y hora de Colombia. */
export function bogotaInstant(d: ISODate, hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return toUtc(d) + (h * 60 + m - BOGOTA_OFFSET_MIN) * 60000;
}
