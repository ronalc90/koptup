/**
 * Fechas de la demo en hora de Colombia (UTC−5, sin horario de verano). Las
 * fechas de ejemplo se calculan desde el momento en que abres la demo, así que
 * nunca quedan "en el pasado"; todo esto corre solo en el navegador, después de
 * montar la página (no hay fechas en el HTML del servidor).
 */
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const OFFSET = -5 * HOUR;

export const iso = (ms: number) => new Date(ms).toISOString();

/** Medianoche (hora de Colombia) del día de `ms`, expresada en milisegundos UTC. */
export function bogotaDayStart(ms: number): number {
  return Math.floor((ms + OFFSET) / DAY) * DAY - OFFSET;
}

/** Día `days` relativo a hoy, a la hora y minuto dados (hora de Colombia). */
export function atBogota(nowMs: number, days: number, hour: number, minute = 0): number {
  return bogotaDayStart(nowMs) + days * DAY + hour * HOUR + minute * 60_000;
}

/** Valor para <input type="datetime-local"> en hora de Colombia. */
export function toLocalInput(ms: number): string {
  const d = new Date(ms + OFFSET);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

/** Lee un valor de <input type="datetime-local"> como hora de Colombia. */
export function fromLocalInput(value: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  return Date.UTC(y, mo - 1, d, h, mi) - OFFSET;
}

const TAG = (locale: string) => (locale === 'en' ? 'en-US' : 'es-CO');

export function formatDateTime(isoStr: string, locale: string): string {
  return new Intl.DateTimeFormat(TAG(locale), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  }).format(new Date(isoStr));
}

export function formatDate(isoStr: string, locale: string): string {
  return new Intl.DateTimeFormat(TAG(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Bogota',
  }).format(new Date(isoStr));
}

export function formatTime(isoStr: string, locale: string): string {
  return new Intl.DateTimeFormat(TAG(locale), {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/Bogota',
  }).format(new Date(isoStr));
}
