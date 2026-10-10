/**
 * Fechas en hora de Colombia (UTC−5, sin horario de verano) y formatos
 * deterministas: no dependen de la zona ni del idioma del navegador.
 */
import type { Loc, Stamp } from './types';

const BOGOTA_OFFSET_MS = 5 * 3600 * 1000;

const MONTHS: Record<Loc, string[]> = {
  es: ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

export function asLoc(locale: string): Loc {
  return locale === 'en' ? 'en' : 'es';
}

/** Ahora en Colombia. Solo en el navegador (efectos o manejadores). */
export function bogotaNow(ms: number = Date.now()): Stamp {
  return new Date(ms - BOGOTA_OFFSET_MS).toISOString().slice(0, 19);
}

function toMs(stamp: Stamp): number {
  return Date.parse(`${stamp.length === 10 ? `${stamp}T00:00:00` : stamp}Z`);
}

export function addSeconds(stamp: Stamp, seconds: number): Stamp {
  return new Date(toMs(stamp) + seconds * 1000).toISOString().slice(0, 19);
}

export function addMinutes(stamp: Stamp, minutes: number): Stamp {
  return addSeconds(stamp, minutes * 60);
}

export function addDays(stamp: Stamp, days: number): Stamp {
  return addMinutes(stamp, days * 1440);
}

export function diffMinutes(from: Stamp, to: Stamp): number {
  return Math.round((toMs(to) - toMs(from)) / 60000);
}

export function dayOf(stamp: Stamp): string {
  return stamp.slice(0, 10);
}

export function monthOf(stamp: Stamp): string {
  return stamp.slice(0, 7);
}

function parts(stamp: Stamp) {
  const [d, time = '00:00:00'] = stamp.split('T');
  const [y, m, day] = d.split('-').map(Number);
  const [hh, mm, ss = 0] = time.split(':').map(Number);
  return { y, m, day, hh, mm, ss };
}

/** Días que faltan para el 1 del mes siguiente y esa fecha. */
export function nextMonthStart(stamp: Stamp): { day: string; daysLeft: number } {
  const { y, m } = parts(stamp);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  const day = `${ny}-${String(nm).padStart(2, '0')}-01`;
  const daysLeft = Math.max(1, Math.ceil((toMs(day) - toMs(stamp)) / 86400000));
  return { day, daysLeft };
}

export function dayOfMonth(stamp: Stamp): number {
  return parts(stamp).day;
}

/** "8 oct. 2026" / "Oct 8, 2026" */
export function fmtDate(stamp: Stamp, loc: Loc): string {
  const { y, m, day } = parts(stamp);
  return loc === 'en' ? `${MONTHS.en[m - 1]} ${day}, ${y}` : `${day} ${MONTHS.es[m - 1]} ${y}`;
}

/** "8 oct." / "Oct 8" */
export function fmtShortDate(stamp: Stamp, loc: Loc): string {
  const { m, day } = parts(stamp);
  return loc === 'en' ? `${MONTHS.en[m - 1]} ${day}` : `${day} ${MONTHS.es[m - 1]}`;
}

/** "9:05:12 a. m." / "9:05:12 AM" */
export function fmtClock(stamp: Stamp, loc: Loc, seconds = true): string {
  const { hh, mm, ss } = parts(stamp);
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  const sec = seconds ? `:${String(ss).padStart(2, '0')}` : '';
  const suffix = loc === 'en' ? (hh < 12 ? 'AM' : 'PM') : hh < 12 ? 'a. m.' : 'p. m.';
  return `${h12}:${String(mm).padStart(2, '0')}${sec} ${suffix}`;
}

/** Hora si es de hoy; fecha corta y hora si no. */
export function fmtWhen(stamp: Stamp, now: Stamp, loc: Loc, seconds = true): string {
  if (dayOf(stamp) === dayOf(now)) return fmtClock(stamp, loc, seconds);
  return `${fmtShortDate(stamp, loc)}, ${fmtClock(stamp, loc, false)}`;
}

/** Agrupa miles: 1234567 → "1.234.567" (es) / "1,234,567" (en). */
export function fmtInt(n: number, loc: Loc): string {
  const neg = n < 0;
  const s = String(Math.round(Math.abs(n)));
  const sep = loc === 'en' ? ',' : '.';
  const out = s.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  return neg ? `-${out}` : out;
}

/** Un decimal con el separador del idioma: 7.14 → "7,1". */
export function fmtDec(n: number, loc: Loc, digits = 1): string {
  const fixed = n.toFixed(digits);
  return loc === 'en' ? fixed : fixed.replace('.', ',');
}

/** "$ 4.284.000" (pesos colombianos, sin decimales). */
export function fmtCop(n: number, loc: Loc): string {
  return `$ ${fmtInt(n, loc)}`;
}

/** Duración de una ejecución: "842 ms", "3,4 s". */
export function fmtMs(ms: number, loc: Loc): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const s = ms / 1000;
  return Number.isInteger(s) ? `${s} s` : `${fmtDec(s, loc)} s`;
}

/** Hace cuánto (en minutos) en texto corto. */
export function fmtAgo(minutes: number, loc: Loc): string {
  if (minutes < 1) return loc === 'en' ? 'just now' : 'ahora';
  if (minutes < 60) return loc === 'en' ? `${minutes} min ago` : `hace ${minutes} min`;
  const h = Math.floor(minutes / 60);
  if (h < 24) return loc === 'en' ? `${h} h ago` : `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (loc === 'en') return d === 1 ? 'yesterday' : `${d} days ago`;
  return d === 1 ? 'ayer' : `hace ${d} días`;
}

/** Hash entero determinista (para ids y duraciones simuladas). */
export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Dígito de verificación de un NIT colombiano (algoritmo de la DIAN). */
export function nitDv(nit: string): number {
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const digits = nit.replace(/\D/g, '').split('').reverse();
  let sum = 0;
  digits.forEach((d, i) => {
    sum += Number(d) * weights[i];
  });
  const r = sum % 11;
  return r > 1 ? 11 - r : r;
}

/** "900512347" → "900.512.347-4" */
export function fmtNit(nit: string): string {
  const clean = nit.replace(/\D/g, '');
  return `${clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${nitDv(clean)}`;
}
