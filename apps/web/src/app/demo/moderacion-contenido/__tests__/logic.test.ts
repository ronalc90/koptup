/**
 * Lógica de la demo de moderación: clasificador por reglas, rutas de las
 * reglas, prioridad, simulador sobre el lote de ejemplo, evaluación y CSV.
 */
import { classify, highlightSpans, normalize, splitHighlights } from '../lib/classifier';
import { DEFAULT_RULES, buildSeed } from '../lib/data';
import { buildCsv } from '../lib/files';
import { previousMonths } from '../lib/format';
import { buildBatch, countRuleChanges, evaluate, priorityFor, routeFor, ruleMatches, simulate } from '../lib/logic';
import { EVAL_SET, SAMPLE_CASES } from '../lib/samples';
import type { Rule } from '../lib/types';

describe('clasificador por reglas', () => {
  it.each(SAMPLE_CASES.map((c) => [c.id, c] as const))('%s: misma categoría y confianza en español e inglés', (_id, c) => {
    const es = classify(c.content.es);
    const en = classify(c.content.en);
    expect(es.label).toBe(c.expected);
    expect(en.label).toBe(c.expected);
    expect(en.score).toBe(es.score);
  });

  it('el conjunto de evaluación da la misma etiqueta en los dos idiomas', () => {
    for (const e of EVAL_SET) expect(classify(e.text.en).label).toBe(classify(e.text.es).label);
  });

  it('ignora tildes y mayúsculas y conserva las posiciones del texto original', () => {
    const text = 'ESCRÍBEME al 3XX XXX XXXX y pagas POR FUERA.';
    const { norm, map } = normalize(text);
    expect(norm).toBe('escribeme al 3xx xxx xxxx y pagas por fuera.');
    expect(map).toHaveLength(norm.length + 1);
    const c = classify(text);
    expect(c.label).toBe('offPlatform');
    const parts = splitHighlights(text, highlightSpans(c, c.label)).filter((p) => p.mark).map((p) => p.text);
    expect(parts).toEqual(['ESCRÍBEME', '3XX XXX XXXX', 'POR FUERA']);
  });

  it('las señales de refuerzo solas no marcan nada', () => {
    expect(classify('Profe, ¿mañana hay tarea de matemáticas?').label).toBe('none');
    expect(classify('Trabajo desde casa, sin experiencia').label).toBe('none');
  });

  it('acepta separadores de miles entre el verbo y el kit', () => {
    expect(classify('Solo envía $ 50.000 para el kit').scores.scam).toBeGreaterThan(0.5);
  });

  it('un texto sin señales queda sin infracción con confianza 0', () => {
    const c = classify('Muy buen vendedor, el producto llegó a tiempo.');
    expect(c.label).toBe('none');
    expect(c.score).toBe(0);
  });
});

describe('reglas', () => {
  const rule = (p: Partial<Rule>): Rule => ({ id: 'x', category: 'spam', operator: 'gt', threshold: 0.5, action: 'humanReview', active: true, ...p });

  it('evalúa mayor, menor y entre (con los umbrales en cualquier orden)', () => {
    expect(ruleMatches(rule({ operator: 'gt', threshold: 0.5 }), 'spam', 0.6)).toBe(true);
    expect(ruleMatches(rule({ operator: 'gt', threshold: 0.6 }), 'spam', 0.6)).toBe(false);
    expect(ruleMatches(rule({ operator: 'lt', threshold: 0.2, category: 'any' }), 'none', 0)).toBe(true);
    expect(ruleMatches(rule({ operator: 'between', threshold: 0.8, threshold2: 0.5 }), 'spam', 0.7)).toBe(true);
    expect(ruleMatches(rule({ active: false }), 'spam', 0.9)).toBe(false);
    expect(ruleMatches(rule({}), 'scam', 0.9)).toBe(false);
  });

  it('gana la acción más estricta y sin reglas va a revisión humana', () => {
    const rules = [rule({ action: 'autoApprove' }), rule({ action: 'escalate' }), rule({ action: 'autoReject' })];
    expect(routeFor(rules, 'spam', 0.9)).toEqual({ action: 'escalate', ruleNo: 2 });
    expect(routeFor([], 'spam', 0.9)).toEqual({ action: 'humanReview', ruleNo: null });
  });

  it('las rutas iniciales de la cola son las esperadas', () => {
    const route = (id: string) => {
      const c = classify(SAMPLE_CASES.find((x) => x.id === id)!.content.es);
      return routeFor(DEFAULT_RULES, c.label, c.score);
    };
    expect(route('c-2041')).toEqual({ action: 'warn', ruleNo: 7 });
    expect(route('c-2042')).toEqual({ action: 'autoReject', ruleNo: 1 });
    expect(route('c-2043')).toEqual({ action: 'humanReview', ruleNo: null });
    expect(route('c-2047')).toEqual({ action: 'escalate', ruleNo: 3 });
    expect(route('c-2053')).toEqual({ action: 'limit', ruleNo: 5 });
    expect(route('c-2054')).toEqual({ action: 'autoApprove', ruleNo: 9 });
  });

  it('cuenta los cambios entre dos versiones de las reglas', () => {
    const edited = DEFAULT_RULES.map((r) => (r.id === 'r-8' ? { ...r, active: true } : r)).filter((r) => r.id !== 'r-9');
    expect(countRuleChanges(DEFAULT_RULES, edited)).toBe(2);
    expect(countRuleChanges(DEFAULT_RULES, [...DEFAULT_RULES, rule({ id: 'r-10' })])).toBe(1);
  });

  it('la prioridad combina gravedad y confianza', () => {
    expect(priorityFor('minors', 0.4)).toBe('critical');
    expect(priorityFor('scam', 0.9)).toBe('critical');
    expect(priorityFor('scam', 0.7)).toBe('high');
    expect(priorityFor('spam', 0.8)).toBe('low');
    expect(priorityFor('none', 0)).toBe('low');
    expect(priorityFor('spam', 0.5, { action: 'escalate', ruleNo: 1 })).toBe('high');
  });
});

describe('simulador y evaluación', () => {
  it('el lote es determinista y el simulador suma el total', () => {
    expect(buildBatch()).toEqual(buildBatch());
    const sim = simulate(DEFAULT_RULES, buildBatch());
    const sum = Object.values(sim.byAction).reduce((a, b) => a + b, 0);
    expect(sum).toBe(sim.total);
    expect(sim.automatic + sim.human).toBe(sim.total);
    expect(sim.perRule).toHaveLength(DEFAULT_RULES.length);
  });

  it('subir el umbral de aprobación automática aumenta las aprobaciones erradas', () => {
    const batch = buildBatch();
    const strict = simulate(DEFAULT_RULES, batch);
    const loose = simulate(DEFAULT_RULES.map((r) => (r.id === 'r-9' ? { ...r, threshold: 0.6 } : r)), batch);
    expect(loose.byAction.autoApprove).toBeGreaterThan(strict.byAction.autoApprove);
    expect(loose.falseNegatives).toBeGreaterThan(strict.falseNegatives);
  });

  it('sin reglas todo va a revisión humana', () => {
    const sim = simulate([], buildBatch());
    expect(sim.human).toBe(sim.total);
    expect(sim.falsePositives + sim.falseNegatives).toBe(0);
  });

  it.each(['es', 'en'] as const)('evalúa el clasificador con los ejemplos etiquetados (%s)', (lang) => {
    const ev = evaluate(lang);
    expect(ev.total).toBe(SAMPLE_CASES.length + EVAL_SET.length);
    expect(ev.correct + ev.errors.length).toBe(ev.total);
    expect(ev.accuracy).toBeGreaterThan(0.8);
    expect(ev.accuracy).toBeLessThan(1);
    expect(ev.benignFlagged).toBeGreaterThan(0);
  });
});

describe('datos y archivos', () => {
  it('los datos iniciales son relativos a la hora actual', () => {
    const now = Date.UTC(2026, 9, 10, 15, 0);
    const s = buildSeed(now);
    expect(s.createdAt).toBe(new Date(now).toISOString());
    for (const c of s.cases) expect(new Date(c.receivedAt).getTime()).toBeLessThan(now);
    for (const a of s.audit) expect(new Date(a.at).getTime()).toBeLessThan(now);
    expect(s.cases.every((c) => c.status === 'pending')).toBe(true);
    expect(s.cases.some((c) => (c as { id: string }).id === 'q-1047')).toBe(false);
  });

  it('los meses del informe son los cuatro anteriores al actual en Colombia', () => {
    // 1 de octubre a las 2 a. m. UTC todavía es 30 de septiembre en Bogotá.
    const months = previousMonths(Date.UTC(2026, 9, 1, 2), 4).map((ms) => new Date(ms).getUTCMonth());
    expect(months).toEqual([4, 5, 6, 7]);
    expect(previousMonths(Date.UTC(2026, 0, 20), 2).map((ms) => new Date(ms).toISOString().slice(0, 7))).toEqual(['2025-11', '2025-12']);
  });

  it('el CSV escapa separadores, comillas y saltos de línea', () => {
    const csv = buildCsv(['a', 'b'], [['x;y', 'dijo "hola"'], ['línea\n2', 3]], ';');
    expect(csv).toBe('a;b\r\n"x;y";"dijo ""hola"""\r\n"línea\n2";3');
  });
});
