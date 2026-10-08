/**
 * Fechas de la demo como texto ISO 'AAAA-MM-DD' (sin hora ni zona) para que
 * los cálculos no dependan de la zona horaria del navegador. Incluye los
 * festivos de Colombia (Ley 51 de 1983, "Ley Emiliani") calculados por año.
 */

export type ISODate = string;

const pad = (n: number) => String(n).padStart(2, '0');

export function toISO(d: Date): ISODate {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function parseISO(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Fecha local del navegador (se llama solo en efectos del cliente). */
export function localToday(): ISODate {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDays(iso: ISODate, n: number): ISODate {
  const d = parseISO(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toISO(d);
}

export function addMonths(iso: ISODate, n: number): ISODate {
  const d = parseISO(iso);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return toISO(d);
}

export function diffDays(from: ISODate, to: ISODate): number {
  return Math.round((parseISO(to).getTime() - parseISO(from).getTime()) / 86400000);
}

export function lastDayOfMonth(iso: ISODate): ISODate {
  const d = parseISO(iso);
  return toISO(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)));
}

export function firstDayOfMonth(iso: ISODate): ISODate {
  return `${iso.slice(0, 7)}-01`;
}

/** 0 = domingo … 6 = sábado */
export function weekday(iso: ISODate): number {
  return parseISO(iso).getUTCDay();
}

function easter(year: number): ISODate {
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

/** Traslada al lunes siguiente (si no cae en lunes). */
function toMonday(iso: ISODate): ISODate {
  const wd = weekday(iso);
  return wd === 1 ? iso : addDays(iso, (8 - wd) % 7);
}

export type HolidayKey =
  | 'newYear' | 'epiphany' | 'stJoseph' | 'holyThursday' | 'goodFriday' | 'labour' | 'ascension'
  | 'corpus' | 'sacredHeart' | 'stPeter' | 'independence' | 'boyaca' | 'assumption' | 'raza'
  | 'allSaints' | 'cartagena' | 'immaculate' | 'christmas';

const cache = new Map<number, Map<ISODate, HolidayKey>>();

export function holidays(year: number): Map<ISODate, HolidayKey> {
  const hit = cache.get(year);
  if (hit) return hit;
  const e = easter(year);
  const list: [ISODate, HolidayKey][] = [
    [`${year}-01-01`, 'newYear'],
    [toMonday(`${year}-01-06`), 'epiphany'],
    [toMonday(`${year}-03-19`), 'stJoseph'],
    [addDays(e, -3), 'holyThursday'],
    [addDays(e, -2), 'goodFriday'],
    [`${year}-05-01`, 'labour'],
    [addDays(e, 43), 'ascension'],
    [addDays(e, 64), 'corpus'],
    [addDays(e, 71), 'sacredHeart'],
    [toMonday(`${year}-06-29`), 'stPeter'],
    [`${year}-07-20`, 'independence'],
    [`${year}-08-07`, 'boyaca'],
    [toMonday(`${year}-08-15`), 'assumption'],
    [toMonday(`${year}-10-12`), 'raza'],
    [toMonday(`${year}-11-01`), 'allSaints'],
    [toMonday(`${year}-11-11`), 'cartagena'],
    [`${year}-12-08`, 'immaculate'],
    [`${year}-12-25`, 'christmas'],
  ];
  const map = new Map(list);
  cache.set(year, map);
  return map;
}

export function holidayOf(iso: ISODate): HolidayKey | undefined {
  return holidays(Number(iso.slice(0, 4))).get(iso);
}

/** Día hábil de la empresa de ejemplo: lunes a viernes que no sea festivo. */
export function isBusinessDay(iso: ISODate): boolean {
  const wd = weekday(iso);
  return wd !== 0 && wd !== 6 && !holidayOf(iso);
}

/** Último día de un período de `n` días hábiles que empieza en `start` (o el siguiente hábil). */
export function endOfBusinessDays(start: ISODate, n: number): ISODate {
  let d = start;
  while (!isBusinessDay(d)) d = addDays(d, 1);
  let count = 1;
  while (count < n) {
    d = addDays(d, 1);
    if (isBusinessDay(d)) count++;
  }
  return d;
}

/** Días hábiles entre dos fechas, ambas incluidas. */
export function businessDaysBetween(from: ISODate, to: ISODate): number {
  let n = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) if (isBusinessDay(d)) n++;
  return n;
}

export function nextBusinessDay(iso: ISODate): ISODate {
  let d = addDays(iso, 1);
  while (!isBusinessDay(d)) d = addDays(d, 1);
  return d;
}

/** Formatea una fecha ISO sin desplazamientos por zona horaria. */
export function formatDate(iso: ISODate, locale: string, style: 'short' | 'medium' | 'long' | 'dayMonth' | 'monthYear' = 'medium'): string {
  const opts: Intl.DateTimeFormatOptions =
    style === 'short' ? { day: '2-digit', month: '2-digit', year: 'numeric' }
      : style === 'long' ? { day: 'numeric', month: 'long', year: 'numeric' }
        : style === 'dayMonth' ? { day: 'numeric', month: 'short' }
          : style === 'monthYear' ? { month: 'long', year: 'numeric' }
            : { day: 'numeric', month: 'short', year: 'numeric' };
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-CO', { ...opts, timeZone: 'UTC' }).format(parseISO(iso));
}

/** Años completos entre dos fechas. */
export function fullYears(from: ISODate, to: ISODate): number {
  const a = parseISO(from);
  const b = parseISO(to);
  let y = b.getUTCFullYear() - a.getUTCFullYear();
  if (b.getUTCMonth() < a.getUTCMonth() || (b.getUTCMonth() === a.getUTCMonth() && b.getUTCDate() < a.getUTCDate())) y--;
  return y;
}
