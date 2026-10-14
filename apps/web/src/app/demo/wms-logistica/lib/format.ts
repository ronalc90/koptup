/**
 * Formatos con locale explícito (es-CO / en-US) para que los números no
 * cambien según el navegador. Se usan solo con datos que existen en el
 * cliente (el estado se arma después de montar la página).
 */
import { minutesOf, type ISODate, type ISODateTime } from './dates';

export type Lang = 'es' | 'en';

const tag = (lang: Lang) => (lang === 'en' ? 'en-US' : 'es-CO');

export function fmtNum(n: number, lang: Lang, decimals = 0): string {
  return new Intl.NumberFormat(tag(lang), { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
}

/** Pesos colombianos sin decimales: "$ 1.234.567" (es) o "COP 1,234,567" (en). */
export function fmtCOP(n: number, lang: Lang): string {
  const v = fmtNum(Math.round(n), lang);
  return lang === 'en' ? `COP ${v}` : `$ ${v}`;
}

export function fmtPct(n: number, lang: Lang, decimals = 1): string {
  return `${fmtNum(n, lang, decimals)} %`;
}

const MONTHS: Record<Lang, string[]> = {
  es: ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

const MONTHS_LONG: Record<Lang, string[]> = {
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

/** "8 oct. 2026" / "Oct 8, 2026" */
export function fmtDate(iso: ISODate, lang: Lang): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return lang === 'en' ? `${MONTHS.en[m - 1]} ${d}, ${y}` : `${d} ${MONTHS.es[m - 1]} ${y}`;
}

/** "octubre de 2026" / "October 2026" */
export function fmtMonth(iso: ISODate, lang: Lang): string {
  const [y, m] = iso.slice(0, 7).split('-').map(Number);
  return lang === 'en' ? `${MONTHS_LONG.en[m - 1]} ${y}` : `${MONTHS_LONG.es[m - 1]} de ${y}`;
}

/** "3:00 p. m." / "3:00 PM" a partir de minutos desde medianoche. */
export function fmtClock(minutes: number, lang: Lang): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  if (lang === 'en') return `${h12}:${mm} ${h24 < 12 ? 'AM' : 'PM'}`;
  return `${h12}:${mm} ${h24 < 12 ? 'a. m.' : 'p. m.'}`;
}

/** Fecha y hora corta: si es hoy, solo la hora. */
export function fmtDateTime(dt: ISODateTime, today: ISODate, lang: Lang): string {
  const time = fmtClock(minutesOf(dt), lang);
  if (dt.slice(0, 10) === today) return time;
  return `${fmtDate(dt.slice(0, 10), lang)}, ${time}`;
}

export function fmtKg(n: number, lang: Lang): string {
  return `${fmtNum(n, lang, n < 10 ? 2 : 1)} kg`;
}
