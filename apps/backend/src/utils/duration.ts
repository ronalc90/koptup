/**
 * duration.ts — convierte duraciones de configuración (`7d`, `12h`, `30m`,
 * `3600`) a segundos.
 *
 * Acepta un número entero de segundos o un número con unidad: `s`, `m`, `h`,
 * `d` o `w` (mayúsculas o minúsculas, con o sin espacio). Devuelve `null` si
 * el valor no se puede interpretar o no es positivo. Se usa para que la vida
 * del token de renovación sea la misma en el JWT y en Redis.
 */
const UNIT_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 24 * 60 * 60,
  w: 7 * 24 * 60 * 60,
};

export function parseDurationSeconds(value: string | number | undefined | null): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
  const match = /^\s*(\d+(?:\.\d+)?)\s*([smhdw])?\s*$/i.exec(value);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = (match[2] ?? 's').toLowerCase();
  const seconds = Math.floor(amount * UNIT_SECONDS[unit]);
  return seconds > 0 ? seconds : null;
}
