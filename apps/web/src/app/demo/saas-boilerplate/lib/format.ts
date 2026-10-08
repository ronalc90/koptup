/**
 * Formatos deterministas (no dependen de la zona horaria ni del ICU del
 * navegador), para que el HTML del servidor y el del cliente coincidan.
 */

export type Loc = 'es' | 'en';

const MONTHS_SHORT: Record<Loc, string[]> = {
  es: ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};
const MONTHS_LONG: Record<Loc, string[]> = {
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

export function asLoc(locale: string): Loc {
  return locale === 'en' ? 'en' : 'es';
}

function group(n: number, sep: string): string {
  const s = String(Math.abs(Math.round(n)));
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

/** Pesos colombianos sin decimales: "$149.000" (ES) o "COP 149,000" (EN). */
export function money(n: number, loc: Loc): string {
  const sign = n < 0 ? '-' : '';
  return loc === 'en' ? `${sign}COP ${group(n, ',')}` : `${sign}$${group(n, '.')}`;
}

/** Número con separador de miles del idioma. */
export function num(n: number, loc: Loc, decimals = 0): string {
  if (decimals > 0) {
    const fixed = Math.abs(n).toFixed(decimals);
    const [int, dec] = fixed.split('.');
    const g = group(Number(int), loc === 'en' ? ',' : '.');
    return `${n < 0 ? '-' : ''}${g}${loc === 'en' ? '.' : ','}${dec}`;
  }
  return `${n < 0 ? '-' : ''}${group(n, loc === 'en' ? ',' : '.')}`;
}

function parts(iso: string) {
  const [d, time = ''] = iso.split('T');
  const [y, m, day] = d.split('-').map(Number);
  const [hh = 0, mm = 0] = time.split(':').map(Number);
  return { y, m, day, hh, mm };
}

/** "8 oct. 2026" / "Oct 8, 2026" */
export function dateLabel(iso: string, loc: Loc): string {
  const { y, m, day } = parts(iso);
  return loc === 'en' ? `${MONTHS_SHORT.en[m - 1]} ${day}, ${y}` : `${day} ${MONTHS_SHORT.es[m - 1]} ${y}`;
}

/** "8 oct. 2026, 9:05 a. m." / "Oct 8, 2026, 9:05 AM" */
export function dateTimeLabel(iso: string, loc: Loc): string {
  const { hh, mm } = parts(iso);
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  const mins = String(mm).padStart(2, '0');
  const suffix = loc === 'en' ? (hh < 12 ? 'AM' : 'PM') : hh < 12 ? 'a. m.' : 'p. m.';
  return `${dateLabel(iso, loc)}, ${h12}:${mins} ${suffix}`;
}

/** "octubre de 2026" / "October 2026" a partir de "2026-10". */
export function periodLabel(period: string, loc: Loc): string {
  const [y, m] = period.split('-').map(Number);
  return loc === 'en' ? `${MONTHS_LONG.en[m - 1]} ${y}` : `${MONTHS_LONG.es[m - 1]} de ${y}`;
}

/** "oct." / "Oct" a partir de "2026-10". */
export function monthShort(period: string, loc: Loc): string {
  const m = Number(period.split('-')[1]);
  return MONTHS_SHORT[loc][m - 1];
}

function toUtc(iso: string): number {
  const { y, m, day, hh, mm } = parts(iso);
  return Date.UTC(y, m - 1, day, hh, mm);
}

function fromUtc(ms: number, withTime: boolean): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  const date = `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
  return withTime ? `${date}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}` : date;
}

export function addDays(iso: string, days: number): string {
  return fromUtc(toUtc(iso) + days * 86400000, iso.includes('T'));
}

export function addMinutes(iso: string, minutes: number): string {
  return fromUtc(toUtc(iso) + minutes * 60000, true);
}

/** Días completos entre dos fechas (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUtc(b.slice(0, 10)) - toUtc(a.slice(0, 10))) / 86400000);
}

export function daysInMonth(period: string): number {
  const [y, m] = period.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Dígito de verificación del NIT (DIAN, módulo 11). */
export function nitDv(nit: string): number {
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const digits = nit.replace(/\D/g, '').split('').reverse();
  const sum = digits.reduce((acc, d, i) => acc + Number(d) * weights[i], 0);
  const r = sum % 11;
  return r >= 2 ? 11 - r : r;
}

/** "900.731.245-3" */
export function formatNit(nit: string): string {
  const clean = nit.replace(/\D/g, '');
  return `${group(Number(clean), '.')}-${nitDv(clean)}`;
}

/** Subdominio a partir del nombre: sin tildes, sin "conjunto/edificio…", solo a-z0-9 y guiones. */
export function slugify(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\b(conjunto|residencial|edificio|condominio|campestre|torres?|de|del|la|las|los|el|y)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 24);
  return base;
}

/** Hash estable (FNV-1a) para datos de ejemplo deterministas. */
export function stableHash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
