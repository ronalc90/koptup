/**
 * Formatos deterministas (mismo resultado en servidor y navegador, sin Intl ni
 * zona horaria) para evitar errores de hidratación. Las fechas se guardan como
 * 'AAAA-MM-DD' y se operan como días civiles.
 */
import type { CurrencyCode, Locale } from './types';

/** TRM de referencia fija de la demo (COP por USD). Es un dato de ejemplo. */
export const TRM_REF = 4000;

const MONTHS: Record<Locale, string[]> = {
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

const MONTHS_LONG: Record<Locale, string[]> = {
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

/** Nombres de los meses en mayúsculas y sin tildes, como los escribe un extracto bancario. */
export const BANK_MONTHS = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

function group(intStr: string, sep: string) {
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

/** Convierte un valor en COP a la moneda de visualización. */
export function convert(cop: number, currency: CurrencyCode) {
  return currency === 'USD' ? cop / TRM_REF : cop;
}

/** Número entero con separador de miles según idioma. */
export function fmtInt(n: number, locale: Locale) {
  const sign = n < 0 ? '-' : '';
  return sign + group(String(Math.round(Math.abs(n))), locale === 'es' ? '.' : ',');
}

/** Número con decimales fijos. */
export function fmtDec(n: number, decimals: number, locale: Locale) {
  const sign = n < 0 ? '-' : '';
  const fixed = Math.abs(n).toFixed(decimals);
  const [i, d] = fixed.split('.');
  const g = group(i, locale === 'es' ? '.' : ',');
  return sign + (d ? `${g}${locale === 'es' ? ',' : '.'}${d}` : g);
}

/** Cantidad (enteros sin decimales; kg con hasta 2 decimales). */
export function fmtQty(n: number, locale: Locale) {
  return Number.isInteger(n) ? fmtInt(n, locale) : fmtDec(n, 2, locale);
}

function prefix(currency: CurrencyCode, locale: Locale) {
  // Espacio duro (U+00A0) para que el símbolo no quede separado del valor al partir la línea
  if (currency === 'USD') return locale === 'es' ? 'US$\u00a0' : 'US$';
  return locale === 'es' ? '$\u00a0' : 'COP\u00a0';
}

/** Valor monetario completo (recibe COP y convierte si hace falta). */
export function fmtMoney(cop: number, currency: CurrencyCode, locale: Locale) {
  const v = convert(cop, currency);
  const sign = v < 0 ? '-' : '';
  return sign + prefix(currency, locale) + fmtInt(Math.abs(v), locale);
}

/** Valor monetario compacto para tarjetas: millones (COP) o miles (USD). */
export function fmtMoneyShort(cop: number, currency: CurrencyCode, locale: Locale) {
  const v = convert(cop, currency);
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (currency === 'COP' && abs >= 1_000_000) {
    return `${sign}${prefix(currency, locale)}${fmtDec(abs / 1_000_000, 1, locale)}${locale === 'es' ? '\u00a0M' : 'M'}`;
  }
  if (currency === 'USD' && abs >= 10_000) {
    return `${sign}${prefix(currency, locale)}${fmtDec(abs / 1_000, 1, locale)}${locale === 'es' ? '\u00a0mil' : 'K'}`;
  }
  return fmtMoney(cop, currency, locale);
}

export function fmtPct(ratio: number, locale: Locale, decimals = 1) {
  const n = fmtDec(ratio * 100, decimals, locale);
  return locale === 'es' ? `${n}\u00a0%` : `${n}%`;
}

/** '2026-09-30' -> '30 sep 2026' (es) / 'Sep 30, 2026' (en). */
export function fmtDate(iso: string | undefined, locale: Locale) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  const mon = MONTHS[locale][m - 1];
  return locale === 'es' ? `${d} ${mon} ${y}` : `${mon} ${d}, ${y}`;
}

/** Nombre corto del mes de una fecha o de 'AAAA-MM'. */
export function fmtMonth(iso: string, locale: Locale, withYear = false) {
  const [y, m] = iso.split('-').map(Number);
  const mon = MONTHS[locale][m - 1];
  return withYear ? `${mon} ${y}` : mon;
}

/** '2026-09' -> 'septiembre de 2026' (es) / 'September 2026' (en). */
export function fmtMonthLong(iso: string, locale: Locale, withYear = true) {
  const [y, m] = iso.split('-').map(Number);
  const mon = MONTHS_LONG[locale][m - 1];
  if (!withYear) return mon;
  return locale === 'es' ? `${mon} de ${y}` : `${mon} ${y}`;
}

/** '2026-09' -> 'Septiembre 2026' (es) / 'September 2026' (en): rótulo corto para listas. */
export function fmtMonthTitle(ym: string, locale: Locale) {
  const [y, m] = ym.split('-').map(Number);
  return capitalize(`${MONTHS_LONG[locale][m - 1]} ${y}`);
}

/** Rango de meses corto: 'jul–sep 2026' o 'nov 2026–ene 2027'. */
export function fmtMonthRange(fromYm: string, toYm: string, locale: Locale) {
  const sameYear = fromYm.slice(0, 4) === toYm.slice(0, 4);
  if (fromYm === toYm) return fmtMonth(fromYm, locale, true);
  return sameYear ? `${fmtMonth(fromYm, locale)}–${fmtMonth(toYm, locale, true)}` : `${fmtMonth(fromYm, locale, true)}–${fmtMonth(toYm, locale, true)}`;
}

/** Primera letra en mayúscula (para rótulos de listas). */
export function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// ---------- Fechas como días civiles (sin Date) ----------

/** Días desde 1970-01-01 (algoritmo de Howard Hinnant). */
export function toDays(iso: string) {
  let [y, m, d] = iso.split('-').map(Number);
  y -= m <= 2 ? 1 : 0;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

export function fromDays(z: number) {
  z += 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  let y = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp + (mp < 10 ? 3 : -9);
  y += m <= 2 ? 1 : 0;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function addDays(iso: string, n: number) {
  return fromDays(toDays(iso) + n);
}

export function diffDays(a: string, b: string) {
  return toDays(a) - toDays(b);
}

/** 0 = domingo … 6 = sábado. */
export function weekday(iso: string) {
  return (((toDays(iso) + 4) % 7) + 7) % 7;
}

/** Suma meses a 'AAAA-MM'. */
export function addMonths(ym: string, n: number) {
  const [y, m] = ym.split('-').map(Number);
  const idx = y * 12 + (m - 1) + n;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, '0')}`;
}

/** Meses completos entre dos fechas o meses ('2026-01' → '2026-09' = 8). */
export function monthsBetween(from: string, to: string) {
  const [y1, m1] = from.split('-').map(Number);
  const [y2, m2] = to.split('-').map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
}

/** Lista de meses 'AAAA-MM' de `from` a `to`, ambos incluidos. */
export function monthList(from: string, to: string) {
  const out: string[] = [];
  for (let ym = from.slice(0, 7); ym <= to.slice(0, 7); ym = addMonths(ym, 1)) out.push(ym);
  return out;
}

/** Días hábiles (lunes a viernes) entre dos fechas, ambas incluidas. */
export function businessDays(from: string, to: string) {
  let n = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) if (weekday(d) >= 1 && weekday(d) <= 5) n++;
  return n;
}

/** Fecha de hoy en Colombia (UTC−5, sin horario de verano). Solo se llama en el navegador después de montar. */
export function todayInColombia(nowMs: number) {
  return fromDays(Math.floor((nowMs - 5 * 3_600_000) / 86_400_000));
}

export function lastDayOfMonth(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
  return addDays(next, -1);
}

/** Texto sin tildes y en minúsculas para búsquedas. */
export function norm(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function matches(q: string, ...fields: (string | number | undefined)[]) {
  const nq = norm(q.trim());
  if (!nq) return true;
  return fields.some((f) => f !== undefined && norm(String(f)).includes(nq));
}

/** Dígito de verificación del NIT (algoritmo de la DIAN). */
export function nitDv(nit: string) {
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const digits = nit.replace(/\D/g, '').split('').reverse().map(Number);
  const sum = digits.reduce((s, d, i) => s + d * weights[i], 0);
  const r = sum % 11;
  return r > 1 ? 11 - r : r;
}

/** '900123456' -> '900.123.456-7'. */
export function fmtNit(nit: string) {
  return `${group(nit, '.')}-${nitDv(nit)}`;
}

// ---------- Exportación ----------

/** Descarga un CSV (con BOM para que Excel lea las tildes). */
export function downloadCsv(filename: string, rows: (string | number)[][], locale: Locale) {
  const sep = locale === 'es' ? ';' : ',';
  const esc = (v: string | number) => {
    const s = typeof v === 'number' ? (locale === 'es' ? String(v).replace('.', ',') : String(v)) : v;
    return /[";,\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const content = '﻿' + rows.map((r) => r.map(esc).join(sep)).join('\r\n');
  downloadText(filename, content, 'text/csv;charset=utf-8');
}

export function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Valor para CSV en la moneda elegida (COP enteros, USD con 2 decimales). */
export function csvMoney(cop: number, currency: CurrencyCode) {
  return currency === 'USD' ? Math.round((cop / TRM_REF) * 100) / 100 : Math.round(cop);
}
