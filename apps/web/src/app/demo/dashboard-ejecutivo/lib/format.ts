/**
 * Formatos de cifras y fechas sin `Intl` ni `toLocaleString`: la salida es la
 * misma en el servidor y en cualquier navegador (sin errores de hidratación).
 * Español de Colombia: punto de miles y coma decimal; inglés: lo contrario.
 */
import { monthNum, yearOf } from './dates';
import type { ISODate, MonthKey, Period } from './types';

export type Loc = 'es' | 'en';

function group(intPart: string, sep: string) {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

/** Número con separadores del idioma. */
export function num(n: number, loc: Loc, decimals = 0): string {
  const sign = n < 0 ? '-' : '';
  const fixed = Math.abs(n).toFixed(decimals);
  const [i, d] = fixed.split('.');
  const g = group(i, loc === 'es' ? '.' : ',');
  return `${sign}${g}${d ? (loc === 'es' ? ',' : '.') + d : ''}`;
}

/** Pesos completos: `$1.840.512.300`. */
export function money(n: number, loc: Loc): string {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${num(Math.abs(Math.round(n)), loc)}`;
}

/** Millones de pesos: `$1.840 M` (con un decimal si es menor a 100 M). */
export function moneyM(n: number, loc: Loc, decimals?: number): string {
  const m = n / 1e6;
  const d = decimals ?? (Math.abs(m) < 100 ? 1 : 0);
  const sign = m < 0 ? '-' : '';
  return `${sign}$${num(Math.abs(m), loc, d)}\u00a0M`;
}

/** Porcentaje de una proporción (0,274 → `27,4 %`). */
export function pct(ratio: number, loc: Loc, decimals = 1): string {
  return `${num(ratio * 100, loc, decimals)}${loc === 'es' ? '\u00a0%' : '%'}`;
}

/** Variación con signo (0,036 → `+3,6 %`). */
export function signedPct(ratio: number, loc: Loc, decimals = 1): string {
  const v = ratio * 100;
  const s = v > 0.05 ? '+' : v < -0.05 ? '−' : '';
  return `${s}${num(Math.abs(v), loc, decimals)}${loc === 'es' ? '\u00a0%' : '%'}`;
}

/** Puntos porcentuales con signo (−0,008 → `−0,8 pts`). */
export function signedPts(diff: number, loc: Loc): string {
  const v = diff * 100;
  const s = v > 0.05 ? '+' : v < -0.05 ? '−' : '';
  return `${s}${num(Math.abs(v), loc, 1)}\u00a0pts`;
}

/** Nombres de meses y fechas legibles a partir de los textos del idioma. */
export interface MonthNames {
  long: string[];
  short: string[];
}

export function formatDate(d: ISODate, loc: Loc, names: MonthNames): string {
  const [y, m, day] = d.split('-').map(Number);
  return loc === 'es' ? `${day} ${names.short[m - 1]} ${y}` : `${names.short[m - 1]} ${day}, ${y}`;
}

export function formatMonth(m: MonthKey, names: MonthNames, short = false): string {
  return `${(short ? names.short : names.long)[monthNum(m) - 1]} ${yearOf(m)}`;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Nombre de un período ("Septiembre 2026", "T3 2026 (jul–sep)", "2026 a la fecha (ene–sep)"). */
export function periodLabel(p: Period, names: MonthNames, words: { quarter: string; ytd: string }): string {
  const first = p.months[0];
  const last = p.months[p.months.length - 1];
  const range = first === last ? names.short[monthNum(first) - 1] : `${names.short[monthNum(first) - 1]}–${names.short[monthNum(last) - 1]}`;
  if (p.kind === 'month') return capitalize(formatMonth(first, names));
  if (p.kind === 'quarter') return `${words.quarter}${p.index} ${p.year} (${range})`;
  return `${p.year} ${words.ytd} (${range})`;
}

/** Texto seguro para nombres de archivo. */
export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
