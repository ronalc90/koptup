/**
 * Fechas en hora de Colombia (UTC−5, sin horario de verano) y formatos
 * deterministas: no dependen de la zona ni del ICU del navegador, así el HTML
 * del servidor y el del cliente coinciden.
 */
import type { Stamp } from './types';

export type Loc = 'es' | 'en';

const BOGOTA_OFFSET_MS = 5 * 3600 * 1000;

const MONTHS: Record<Loc, string[]> = {
  es: ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

export function asLoc(locale: string): Loc {
  return locale === 'en' ? 'en' : 'es';
}

/** Ahora en Colombia: "2026-10-08T09:05:12". Solo en el navegador (efectos o manejadores). */
export function bogotaNow(ms: number = Date.now()): Stamp {
  return new Date(ms - BOGOTA_OFFSET_MS).toISOString().slice(0, 19);
}

function toMs(stamp: Stamp): number {
  return Date.parse(`${stamp.length === 10 ? `${stamp}T00:00:00` : stamp}Z`);
}

export function addMinutes(stamp: Stamp, minutes: number): Stamp {
  return new Date(toMs(stamp) + minutes * 60000).toISOString().slice(0, 19);
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

/** "8 oct. 2026" / "Oct 8, 2026" */
export function fmtDate(stamp: Stamp, loc: Loc): string {
  const { y, m, day } = parts(stamp);
  return loc === 'en' ? `${MONTHS.en[m - 1]} ${day}, ${y}` : `${day} ${MONTHS.es[m - 1]} ${y}`;
}

function clock(hh: number, mm: number, loc: Loc, ss?: number): string {
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  const sec = ss === undefined ? '' : `:${String(ss).padStart(2, '0')}`;
  const suffix = loc === 'en' ? (hh < 12 ? 'AM' : 'PM') : hh < 12 ? 'a. m.' : 'p. m.';
  return `${h12}:${String(mm).padStart(2, '0')}${sec} ${suffix}`;
}

/** "8 oct. 2026, 9:05 a. m." / "Oct 8, 2026, 9:05 AM" */
export function fmtDateTime(stamp: Stamp, loc: Loc, seconds = false): string {
  const { hh, mm, ss } = parts(stamp);
  return `${fmtDate(stamp, loc)}, ${clock(hh, mm, loc, seconds ? ss : undefined)}`;
}

/** Duración legible: "45 min", "3 h 20 min", "2,5 días" / "2.5 days". */
export function fmtDuration(minutes: number, loc: Loc): string {
  if (minutes < 60) return `${Math.max(0, Math.round(minutes))} min`;
  if (minutes < 48 * 60) {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return m ? `${h} h ${m} min` : `${h} h`;
  }
  const days = Math.round((minutes / 1440) * 10) / 10;
  const txt = loc === 'en' ? String(days) : String(days).replace('.', ',');
  return loc === 'en' ? `${txt} days` : `${txt} días`;
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
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, loc === 'en' ? ',' : '.');
}
