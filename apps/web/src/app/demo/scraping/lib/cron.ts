/**
 * Expresiones cron de 5 campos (minuto hora día-del-mes mes día-de-la-semana)
 * con `*`, listas `a,b`, rangos `a-b` y pasos `* /n` o `a-b/n`. Calcula las
 * próximas ejecuciones a partir del reloj fijo de la demo (hora de Colombia).
 */
import { addDays, parts, weekday } from './format';

interface FieldSpec { min: number; max: number }
const SPECS: FieldSpec[] = [
  { min: 0, max: 59 },
  { min: 0, max: 23 },
  { min: 1, max: 31 },
  { min: 1, max: 12 },
  { min: 0, max: 7 },
];

export interface ParsedCron {
  minutes: number[];
  hours: number[];
  dom: Set<number>;
  months: Set<number>;
  dow: Set<number>;
  domAny: boolean;
  dowAny: boolean;
}

function parseField(raw: string, spec: FieldSpec): number[] | null {
  const out = new Set<number>();
  for (const part of raw.split(',')) {
    if (!part) return null;
    const [rangePart, stepPart] = part.split('/');
    if (part.split('/').length > 2) return null;
    let step = 1;
    if (stepPart !== undefined) {
      if (!/^\d+$/.test(stepPart)) return null;
      step = Number(stepPart);
      if (step < 1) return null;
    }
    let from: number;
    let to: number;
    if (rangePart === '*') {
      from = spec.min;
      to = spec.max;
    } else if (/^\d+-\d+$/.test(rangePart)) {
      [from, to] = rangePart.split('-').map(Number);
    } else if (/^\d+$/.test(rangePart)) {
      from = Number(rangePart);
      to = stepPart !== undefined ? spec.max : from;
    } else {
      return null;
    }
    if (from < spec.min || to > spec.max || from > to) return null;
    for (let v = from; v <= to; v += step) out.add(v);
  }
  return Array.from(out).sort((a, b) => a - b);
}

export function parseCron(expr: string): ParsedCron | null {
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) return null;
  const parsed = fields.map((f, i) => parseField(f, SPECS[i]));
  if (parsed.some((p) => p === null || p.length === 0)) return null;
  const [minutes, hours, dom, months, dowRaw] = parsed as number[][];
  const dow = new Set(dowRaw.map((d) => (d === 7 ? 0 : d)));
  return {
    minutes,
    hours,
    dom: new Set(dom),
    months: new Set(months),
    dow,
    domAny: fields[2] === '*',
    dowAny: fields[4] === '*',
  };
}

/** Próximas `count` ejecuciones estrictamente después de `fromIso` (busca hasta 2 años). */
export function nextRuns(expr: string, fromIso: string, count = 5): string[] {
  const c = parseCron(expr);
  if (!c) return [];
  const out: string[] = [];
  const start = parts(fromIso);
  const startDate = fromIso.slice(0, 10);
  for (let i = 0; i < 800 && out.length < count; i++) {
    const day = addDays(startDate, i);
    const p = parts(day);
    if (!c.months.has(p.m)) continue;
    const domOk = c.dom.has(p.d);
    const dowOk = c.dow.has(weekday(day));
    // Regla de cron: si ambos campos están restringidos basta con que se cumpla uno.
    const dayOk = c.domAny && c.dowAny ? true : c.domAny ? dowOk : c.dowAny ? domOk : domOk || dowOk;
    if (!dayOk) continue;
    for (const h of c.hours) {
      for (const m of c.minutes) {
        if (i === 0 && (h < start.hh || (h === start.hh && m <= start.mm))) continue;
        out.push(`${day}T${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}`);
        if (out.length >= count) return out;
      }
    }
  }
  return out;
}

export type SchedulePreset = 'daily6' | 'businessHours' | 'every4h' | 'weeklyMon' | 'custom';

export const PRESET_CRON: Record<Exclude<SchedulePreset, 'custom'>, string> = {
  daily6: '0 6 * * *',
  businessHours: '0 7-18 * * 1-5',
  every4h: '0 */4 * * *',
  weeklyMon: '0 7 * * 1',
};
