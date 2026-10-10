/**
 * Formato de números y fechas con idioma y zona horaria fijos (Colombia), para
 * que el servidor y el navegador pinten lo mismo. Las fechas solo se usan
 * después de montar la página (dependen de la hora actual).
 */
import type { Lang } from './types';

export const TIME_ZONE = 'America/Bogota';

export const asLang = (locale: string): Lang => (locale === 'en' ? 'en' : 'es');
export const intlLocale = (lang: Lang) => (lang === 'en' ? 'en-US' : 'es-CO');

export function fmtNumber(n: number, lang: Lang, maxFrac = 0): string {
  return new Intl.NumberFormat(intlLocale(lang), { maximumFractionDigits: maxFrac }).format(n);
}

/** Porcentaje a partir de una fracción (0,873 → «87 %»). */
export function fmtPct(x: number, lang: Lang, frac = 0): string {
  return new Intl.NumberFormat(intlLocale(lang), {
    style: 'percent',
    minimumFractionDigits: frac,
    maximumFractionDigits: frac,
  }).format(x);
}

export function fmtDateTime(isoStr: string, lang: Lang): string {
  return new Intl.DateTimeFormat(intlLocale(lang), {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoStr));
}

export function fmtTime(isoStr: string, lang: Lang): string {
  return new Intl.DateTimeFormat(intlLocale(lang), { timeZone: TIME_ZONE, hour: 'numeric', minute: '2-digit' }).format(new Date(isoStr));
}

export function fmtDate(ms: number, lang: Lang): string {
  return new Intl.DateTimeFormat(intlLocale(lang), { timeZone: TIME_ZONE, day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(ms));
}

/** Nombre corto del mes («sep.», «Sep») en la zona de Colombia. */
export function fmtMonth(ms: number, lang: Lang, long = false): string {
  return new Intl.DateTimeFormat(intlLocale(lang), { timeZone: TIME_ZONE, month: long ? 'long' : 'short', ...(long ? { year: 'numeric' } : {}) }).format(new Date(ms));
}

/**
 * Inicio (en milisegundos) de los `count` meses completos anteriores al mes de
 * `nowMs`, del más antiguo al más reciente. Usa el día 15 para no caer en
 * otro mes por la zona horaria.
 */
export function previousMonths(nowMs: number, count: number): number[] {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, year: 'numeric', month: 'numeric' }).formatToParts(new Date(nowMs));
  const y = Number(parts.find((p) => p.type === 'year')?.value);
  const m = Number(parts.find((p) => p.type === 'month')?.value) - 1;
  const out: number[] = [];
  for (let i = count; i >= 1; i--) out.push(Date.UTC(y, m - i, 15, 12));
  return out;
}

export const minutesBetween = (fromIso: string, toMs: number) => Math.max(0, Math.round((toMs - new Date(fromIso).getTime()) / 60000));

/** Duración «m:ss». */
export function fmtClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
