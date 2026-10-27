/**
 * Fechas en hora de Colombia (UTC−5, sin horario de verano) con formatos
 * propios: no dependen de la zona ni del ICU del navegador, así el HTML del
 * servidor y el del cliente coinciden. `bogotaNow()` solo se llama en el
 * navegador (efectos o manejadores), nunca durante el primer render.
 */
import type { Loc, Stamp } from './types';

const BOGOTA_OFFSET_MS = 5 * 3600 * 1000;

const MONTHS_SHORT: Record<Loc, string[]> = {
  es: ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

const MONTHS_LONG_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function asLoc(locale: string): Loc {
  return locale === 'en' ? 'en' : 'es';
}

/** Ahora en Colombia: "2026-10-08T09:05:12". */
export function bogotaNow(ms: number = Date.now()): Stamp {
  return new Date(ms - BOGOTA_OFFSET_MS).toISOString().slice(0, 19);
}

/** Convierte una fecha ISO del servidor (UTC) a hora de Colombia. */
export function isoToBogota(iso: string): Stamp {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso.slice(0, 19);
  return bogotaNow(ms);
}

export function toMs(stamp: Stamp): number {
  return Date.parse(`${stamp.length === 10 ? `${stamp}T00:00:00` : stamp}Z`);
}

export function addDays(stamp: Stamp, days: number): Stamp {
  return new Date(toMs(stamp) + days * 86400000).toISOString().slice(0, 19);
}

/** Mismo día y mes, `years` años después (29 feb → 28 feb si hace falta). */
export function addYears(stamp: Stamp, years: number): Stamp {
  const { y, m, day } = parts(stamp);
  const target = y + years;
  const last = new Date(Date.UTC(target, m, 0)).getUTCDate();
  return `${target}-${pad(m)}-${pad(Math.min(day, last))}${stamp.slice(10)}`;
}

export function diffDays(from: Stamp, to: Stamp): number {
  return Math.floor((toMs(to) - toMs(from)) / 86400000);
}

export function dayOf(stamp: Stamp): string {
  return stamp.slice(0, 10);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function parts(stamp: Stamp) {
  const [d, time = '00:00:00'] = stamp.split('T');
  const [y, m, day] = d.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return { y, m, day, hh, mm };
}

/** "8 oct. 2026" / "Oct 8, 2026" */
export function fmtDate(stamp: Stamp, loc: Loc): string {
  const { y, m, day } = parts(stamp);
  return loc === 'en' ? `${MONTHS_SHORT.en[m - 1]} ${day}, ${y}` : `${day} ${MONTHS_SHORT.es[m - 1]} ${y}`;
}

/** "8 oct. 2026, 9:05 a. m." / "Oct 8, 2026, 9:05 AM" */
export function fmtDateTime(stamp: Stamp, loc: Loc): string {
  const { hh, mm } = parts(stamp);
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  const suffix = loc === 'en' ? (hh < 12 ? 'AM' : 'PM') : hh < 12 ? 'a. m.' : 'p. m.';
  return `${fmtDate(stamp, loc)}, ${h12}:${pad(mm)} ${suffix}`;
}

/** "8 de octubre de 2026": así se escriben las fechas dentro de los documentos. */
export function fmtLongEs(stamp: Stamp): string {
  const { y, m, day } = parts(stamp);
  return `${day} de ${MONTHS_LONG_ES[m - 1]} de ${y}`;
}

/** Tamaño de archivo: "1,2 MB" / "1.2 MB". */
export function fmtBytes(bytes: number, loc: Loc): string {
  const dec = loc === 'en' ? '.' : ',';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace('.', dec)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', dec)} MB`;
}

/** Número con separador de miles del idioma. */
export function fmtNum(n: number, loc: Loc): string {
  const sign = n < 0 ? '-' : '';
  return sign + String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, loc === 'en' ? ',' : '.');
}

/** Pesos colombianos como se escriben en los documentos: "$1.280.000.000". */
export function fmtCop(n: number): string {
  return `$${fmtNum(n, 'es')}`;
}

/**
 * Reemplaza marcas de fecha relativas a hoy dentro de los textos de ejemplo:
 * {{d:-30}} → "8 de septiembre de 2026", {{ds:-30}} → "2026-09-08",
 * {{y:0}} → "2026", {{y:1}} → "2027".
 */
export function fillDates(text: string, now: Stamp): string {
  return text.replace(/\{\{(d|ds|y):(-?\d+)\}\}/g, (_m, kind: string, n: string) => {
    const k = Number(n);
    if (kind === 'y') return String(parts(now).y + k);
    const stamp = addDays(now, k);
    return kind === 'ds' ? dayOf(stamp) : fmtLongEs(stamp);
  });
}
