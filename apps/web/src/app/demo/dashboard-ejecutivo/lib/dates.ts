/**
 * Fechas como texto ISO (`AAAA-MM-DD`) y meses (`AAAA-MM`), con aritmética en
 * UTC: no dependen de la zona horaria del navegador ni del servidor, así el
 * render del servidor y el del cliente son idénticos.
 */
import type { ISODate, MonthKey } from './types';

const DAY = 86_400_000;

export function toDays(d: ISODate): number {
  const [y, m, day] = d.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, day) / DAY);
}

export function fromDays(n: number): ISODate {
  const dt = new Date(n * DAY);
  const y = dt.getUTCFullYear();
  const m = dt.getUTCMonth() + 1;
  const d = dt.getUTCDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export const addDays = (d: ISODate, n: number): ISODate => fromDays(toDays(d) + n);

/** a − b en días. */
export const diffDays = (a: ISODate, b: ISODate): number => toDays(a) - toDays(b);

export const monthOf = (d: ISODate): MonthKey => d.slice(0, 7);

export function daysInMonth(m: MonthKey): number {
  const [y, mm] = m.split('-').map(Number);
  return new Date(Date.UTC(y, mm, 0)).getUTCDate();
}

export const firstDay = (m: MonthKey): ISODate => `${m}-01`;
export const lastDay = (m: MonthKey): ISODate => `${m}-${String(daysInMonth(m)).padStart(2, '0')}`;

export function addMonths(m: MonthKey, n: number): MonthKey {
  const [y, mm] = m.split('-').map(Number);
  const total = y * 12 + (mm - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, '0')}`;
}

export const yearOf = (m: MonthKey): number => Number(m.slice(0, 4));
export const monthNum = (m: MonthKey): number => Number(m.slice(5, 7));
export const quarterOf = (m: MonthKey): number => Math.floor((monthNum(m) - 1) / 3) + 1;

/** Día de la semana (0 = domingo). */
export const weekday = (d: ISODate): number => new Date(toDays(d) * DAY).getUTCDay();

export function monthRange(from: MonthKey, to: MonthKey): MonthKey[] {
  const out: MonthKey[] = [];
  for (let m = from; m <= to; m = addMonths(m, 1)) out.push(m);
  return out;
}

/** Valida y normaliza una fecha escrita como AAAA-MM-DD, DD/MM/AAAA o DD-MM-AAAA. */
export function normalizeDate(raw: string): ISODate | null {
  const s = raw.trim();
  let y: number;
  let m: number;
  let d: number;
  let match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T].*)?$/.exec(s);
  if (match) {
    y = +match[1];
    m = +match[2];
    d = +match[3];
  } else {
    match = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:[ T].*)?$/.exec(s);
    if (!match) return null;
    d = +match[1];
    m = +match[2];
    y = +match[3];
  }
  if (y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1) return null;
  const mk = `${y}-${String(m).padStart(2, '0')}`;
  if (d > daysInMonth(mk)) return null;
  return `${mk}-${String(d).padStart(2, '0')}`;
}
