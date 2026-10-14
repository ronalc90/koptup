/**
 * Fechas de la demo sin depender de la zona horaria del navegador: todo se
 * maneja como texto AAAA-MM-DD y se calcula con UTC. "Hoy" es la fecha de
 * Colombia y solo se pide en el navegador después de montar la página, para
 * que el servidor y el navegador pinten lo mismo.
 */

const pad = (n: number) => String(n).padStart(2, '0');

/** AAAA-MM-DD a partir de año, mes (1–12) y día. */
export function isoOf(y: number, m: number, d: number) {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function partsOf(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

/** Suma (o resta) días. */
export function addDays(iso: string, n: number) {
  const { y, m, d } = partsOf(iso);
  return isoOf(y, m, d + n);
}

/** Días que tiene un mes. */
export function daysInMonth(y: number, m: number) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/**
 * Fecha del mes que queda `monthsAgo` meses antes de `iso`, en el día `day`
 * (recortado al último día de ese mes: el 31 en septiembre es el 30).
 */
export function monthDay(iso: string, monthsAgo: number, day: number) {
  const { y, m } = partsOf(iso);
  const idx = y * 12 + (m - 1) - monthsAgo;
  const yy = Math.floor(idx / 12);
  const mm = (idx % 12) + 1;
  return isoOf(yy, mm, Math.min(day, daysInMonth(yy, mm)));
}

/** Último día del mes de `iso` (o de `monthsAhead` meses después). */
export function endOfMonth(iso: string, monthsAhead = 0) {
  const { y, m } = partsOf(iso);
  const idx = y * 12 + (m - 1) + monthsAhead;
  const yy = Math.floor(idx / 12);
  const mm = (idx % 12) + 1;
  return isoOf(yy, mm, daysInMonth(yy, mm));
}

/** Clave del mes: AAAA-MM. */
export const monthKeyOf = (iso: string) => iso.slice(0, 7);

/** Clave del mes que queda `monthsAgo` meses antes (negativo = después). */
export function monthKeyAgo(iso: string, monthsAgo: number) {
  return monthKeyOf(monthDay(iso, monthsAgo, 1));
}

/** Día de la semana (0 = domingo). */
export function weekdayOf(iso: string) {
  const { y, m, d } = partsOf(iso);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Los últimos `n` días terminando hoy (hoy primero). */
export function lastDays(today: string, n: number) {
  return Array.from({ length: n }, (_, i) => addDays(today, -i));
}

/** Los próximos `n` días a partir de mañana. */
export function nextDays(today: string, n: number) {
  return Array.from({ length: n }, (_, i) => addDays(today, i + 1));
}

/** Fecha y hora de Colombia (UTC−5, sin horario de verano) para un instante. */
export function colombiaNow(ms: number) {
  const dt = new Date(ms - 5 * 60 * 60 * 1000);
  return {
    date: `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`,
    time: `${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())}`,
  };
}

/* ------------------------------ Festivos ------------------------------ */

/** Domingo de Pascua (algoritmo de Meeus/Jones/Butcher, calendario gregoriano). */
export function easterSunday(year: number) {
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
  return isoOf(year, month, day);
}

/** Lleva la fecha al lunes siguiente si no cae en lunes (Ley 51 de 1983). */
function nextMonday(iso: string) {
  const dow = weekdayOf(iso);
  return dow === 1 ? iso : addDays(iso, (8 - dow) % 7);
}

export type HolidayKey =
  | 'newYear'
  | 'epiphany'
  | 'saintJoseph'
  | 'holyThursday'
  | 'goodFriday'
  | 'labour'
  | 'ascension'
  | 'corpusChristi'
  | 'sacredHeart'
  | 'saintsPeterPaul'
  | 'independence'
  | 'boyaca'
  | 'assumption'
  | 'raceDay'
  | 'allSaints'
  | 'cartagena'
  | 'immaculate'
  | 'christmas';

const holidayCache = new Map<number, Record<string, HolidayKey>>();

/**
 * Festivos de Colombia de un año (AAAA-MM-DD → clave): fijos, trasladables al
 * lunes (Ley 51 de 1983) y los que dependen de la Pascua.
 */
export function colombianHolidays(year: number): Record<string, HolidayKey> {
  const cached = holidayCache.get(year);
  if (cached) return cached;
  const out: Record<string, HolidayKey> = {};
  const put = (iso: string, key: HolidayKey) => {
    if (!out[iso]) out[iso] = key;
  };
  const easter = easterSunday(year);
  put(isoOf(year, 1, 1), 'newYear');
  put(nextMonday(isoOf(year, 1, 6)), 'epiphany');
  put(nextMonday(isoOf(year, 3, 19)), 'saintJoseph');
  put(addDays(easter, -3), 'holyThursday');
  put(addDays(easter, -2), 'goodFriday');
  put(isoOf(year, 5, 1), 'labour');
  put(addDays(easter, 43), 'ascension');
  put(addDays(easter, 64), 'corpusChristi');
  put(addDays(easter, 71), 'sacredHeart');
  put(nextMonday(isoOf(year, 6, 29)), 'saintsPeterPaul');
  put(isoOf(year, 7, 20), 'independence');
  put(isoOf(year, 8, 7), 'boyaca');
  put(nextMonday(isoOf(year, 8, 15)), 'assumption');
  put(nextMonday(isoOf(year, 10, 12)), 'raceDay');
  put(nextMonday(isoOf(year, 11, 1)), 'allSaints');
  put(nextMonday(isoOf(year, 11, 11)), 'cartagena');
  put(isoOf(year, 12, 8), 'immaculate');
  put(isoOf(year, 12, 25), 'christmas');
  holidayCache.set(year, out);
  return out;
}

export function holidayOf(iso: string): HolidayKey | undefined {
  return colombianHolidays(partsOf(iso).y)[iso];
}
