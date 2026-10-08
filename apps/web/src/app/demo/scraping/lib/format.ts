/**
 * Formatos de cifras y fechas sin `Intl`, `toLocaleString` ni la hora del
 * equipo: la salida es idéntica en el servidor y en cualquier navegador (sin
 * errores de hidratación). Español de Colombia: punto de miles y coma decimal.
 *
 * Las fechas de la demo son "locales de Colombia" (UTC−5, sin horario de
 * verano) y se guardan como texto `AAAA-MM-DD` o `AAAA-MM-DDTHH:mm`.
 */
export type Loc = 'es' | 'en';

/** Reloj fijo de la demo: jueves 8 de octubre de 2026, 8:15 a. m. (hora de Colombia). */
export const DEMO_NOW = '2026-10-08T08:15';
export const DEMO_TODAY = '2026-10-08';
export const DEMO_YESTERDAY = '2026-10-07';

function group(intPart: string, sep: string) {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

export function num(n: number, loc: Loc, decimals = 0): string {
  const sign = n < 0 ? '−' : '';
  const [i, d] = Math.abs(n).toFixed(decimals).split('.');
  return `${sign}${group(i, loc === 'es' ? '.' : ',')}${d ? (loc === 'es' ? ',' : '.') + d : ''}`;
}

/** Pesos colombianos: `$ 189.900` (ES) o `COP 189,900` (EN). */
export function cop(n: number, loc: Loc): string {
  const v = num(Math.round(n), loc);
  return loc === 'es' ? `$ ${v}` : `COP ${v}`;
}

/** Porcentaje ya multiplicado por 100 (`96,4 %`). */
export function pct(value: number, loc: Loc, decimals = 0): string {
  return `${num(value, loc, decimals)}${loc === 'es' ? ' %' : '%'}`;
}

/** Variación con signo (`−11 %`, `+7,6 %`). */
export function signedPct(value: number, loc: Loc, decimals = 0): string {
  const rounded = Number(value.toFixed(decimals));
  const s = rounded > 0 ? '+' : rounded < 0 ? '−' : '';
  return `${s}${num(Math.abs(value), loc, decimals)}${loc === 'es' ? ' %' : '%'}`;
}

const MONTHS: Record<Loc, string[]> = {
  es: ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sept.', 'oct.', 'nov.', 'dic.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};
const WEEKDAYS: Record<Loc, string[]> = {
  es: ['dom.', 'lun.', 'mar.', 'mié.', 'jue.', 'vie.', 'sáb.'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

interface Parts { y: number; m: number; d: number; hh: number; mm: number }

export function parts(iso: string): Parts {
  const [date, time = '00:00'] = iso.split('T');
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return { y, m, d, hh, mm };
}

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

export function toIso(p: Parts, withTime = true): string {
  const date = `${p.y}-${pad(p.m)}-${pad(p.d)}`;
  return withTime ? `${date}T${pad(p.hh)}:${pad(p.mm)}` : date;
}

/** Suma minutos a una fecha local (aritmética en UTC para no depender de la zona del equipo). */
export function addMinutes(iso: string, minutes: number): string {
  const p = parts(iso);
  const t = Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm) + minutes * 60000;
  const dt = new Date(t);
  return toIso({ y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate(), hh: dt.getUTCHours(), mm: dt.getUTCMinutes() });
}

export function addDays(isoDate: string, days: number): string {
  return addMinutes(`${isoDate.slice(0, 10)}T00:00`, days * 1440).slice(0, 10);
}

/** Día de la semana (0 = domingo). */
export function weekday(isoDate: string): number {
  const p = parts(isoDate);
  return new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay();
}

/** Diferencia en días calendario (b − a). */
export function daysBetween(a: string, b: string): number {
  const pa = parts(a);
  const pb = parts(b);
  return Math.round((Date.UTC(pb.y, pb.m - 1, pb.d) - Date.UTC(pa.y, pa.m - 1, pa.d)) / 86400000);
}

export function time(iso: string, loc: Loc): string {
  const { hh, mm } = parts(iso);
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  if (loc === 'es') return `${h12}:${pad(mm)} ${hh < 12 ? 'a. m.' : 'p. m.'}`;
  return `${h12}:${pad(mm)} ${hh < 12 ? 'AM' : 'PM'}`;
}

export function date(iso: string, loc: Loc): string {
  const { y, m, d } = parts(iso);
  return loc === 'es' ? `${d} ${MONTHS.es[m - 1]} ${y}` : `${MONTHS.en[m - 1]} ${d}, ${y}`;
}

export function shortDate(iso: string, loc: Loc): string {
  const { m, d } = parts(iso);
  return loc === 'es' ? `${d} ${MONTHS.es[m - 1]}` : `${MONTHS.en[m - 1]} ${d}`;
}

export function dateTime(iso: string, loc: Loc): string {
  return `${date(iso, loc)}, ${time(iso, loc)}`;
}

/** `jue. 8 oct.` / `Thu, Oct 8` */
export function dayLabel(iso: string, loc: Loc): string {
  const wd = WEEKDAYS[loc][weekday(iso)];
  return loc === 'es' ? `${wd} ${shortDate(iso, loc)}` : `${wd}, ${shortDate(iso, loc)}`;
}

/** Normaliza texto para búsquedas: minúsculas y sin tildes. */
export function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Convierte un texto con precio o cantidad a número (`$ 189.900` → 189900, `Agotado` → 0). */
export function parseNumber(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/agotad|sin stock|no disponible|sold out|out of stock/i.test(s)) return 0;
  const m = s.match(/-?\d[\d.,]*/);
  if (!m) return null;
  let t = m[0];
  const lastComma = t.lastIndexOf(',');
  const lastDot = t.lastIndexOf('.');
  if (lastComma > -1 && lastDot > -1) {
    // El separador que aparece de último es el decimal.
    if (lastComma > lastDot) t = t.replace(/\./g, '').replace(',', '.');
    else t = t.replace(/,/g, '');
  } else if (lastComma > -1) {
    const dec = t.length - lastComma - 1;
    t = dec === 3 ? t.replace(/,/g, '') : t.replace(',', '.');
  } else if (lastDot > -1) {
    const dec = t.length - lastDot - 1;
    // En Colombia el punto separa miles: "189.900" es ciento ochenta y nueve mil novecientos.
    if (dec === 3 || (t.match(/\./g) || []).length > 1) t = t.replace(/\./g, '');
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
