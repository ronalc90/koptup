import type { T } from './parts';
import { dayOfWeek } from './engine';

/**
 * Formatea fecha y hora con los nombres de messages (demoVoice.dates), sin
 * depender de la zona horaria ni del Intl del navegador: el texto es igual en
 * el servidor y en el cliente.
 */
export function formatWhen(t: T, date: string, time: string, style: 'long' | 'short' = 'long'): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const dow = dayOfWeek(date);
  if (!m || dow < 0) return `${date} ${time}`;
  const month = +m[2];
  const day = +m[3];
  return t(`dates.${style}`, {
    weekday: t(style === 'long' ? `dates.weekdays.d${dow}` : `dates.weekdaysShort.d${dow}`),
    day,
    month: t(style === 'long' ? `dates.months.m${month}` : `dates.monthsShort.m${month}`),
    year: m[1],
    time,
  });
}

/** Porcentaje entero: "64 %" en español, "64%" en inglés. */
export function pct(n: number, locale: string): string {
  return locale === 'en' ? `${Math.round(n)}%` : `${Math.round(n)} %`;
}

/** Número con una cifra decimal: "4,3" en español, "4.3" en inglés. */
export function decimal(n: number, locale: string): string {
  const s = n.toFixed(1);
  return locale === 'en' ? s : s.replace('.', ',');
}
