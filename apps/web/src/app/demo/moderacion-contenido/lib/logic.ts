/**
 * Lógica pura de la demo: qué hace cada regla con un caso, prioridad de la
 * cola, simulación sobre el lote de ejemplo y métricas del clasificador.
 */
import { classify } from './classifier';
import { CATEGORY_MIX, SEVERITY } from './data';
import { EVAL_SET, SAMPLE_CASES } from './samples';
import { CATEGORIES, type CategoryKey, type Label, type Lang, type Priority, type Rule, type RuleAction } from './types';

/** Si varias reglas coinciden, gana la acción más estricta. */
export const ACTION_RANK: Record<RuleAction, number> = {
  escalate: 5,
  autoReject: 4,
  warn: 3,
  limit: 2,
  humanReview: 1,
  autoApprove: 0,
};

/** Acciones que resuelven el caso sin que nadie lo revise. */
export function isAutomatic(action: RuleAction): boolean {
  return action === 'autoReject' || action === 'autoApprove' || action === 'warn' || action === 'limit';
}

export function ruleMatches(rule: Rule, label: Label, score: number): boolean {
  if (!rule.active) return false;
  if (rule.category !== 'any' && rule.category !== label) return false;
  if (rule.operator === 'gt') return score > rule.threshold;
  if (rule.operator === 'lt') return score < rule.threshold;
  const a = rule.threshold;
  const b = rule.threshold2 ?? 1;
  return score >= Math.min(a, b) && score <= Math.max(a, b);
}

export interface Route {
  action: RuleAction;
  /** Número de la regla (1, 2, …) o null si ninguna coincide (va a revisión humana). */
  ruleNo: number | null;
}

export function routeFor(rules: Rule[], label: Label, score: number): Route {
  let best: Route | null = null;
  rules.forEach((r, i) => {
    if (!ruleMatches(r, label, score)) return;
    if (!best || ACTION_RANK[r.action] > ACTION_RANK[best.action]) best = { action: r.action, ruleNo: i + 1 };
  });
  return best ?? { action: 'humanReview', ruleNo: null };
}

const PRIORITY_ORDER: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

/** Prioridad en la cola: gravedad de la categoría combinada con la confianza. */
export function priorityFor(label: Label, score: number, route?: Route): Priority {
  let p: Priority;
  if (label === 'none') p = 'low';
  else {
    const sev = SEVERITY[label];
    if (sev === 'critical') p = score >= 0.3 ? 'critical' : 'high';
    else if (sev === 'high') p = score >= 0.85 ? 'critical' : score >= 0.6 ? 'high' : 'medium';
    else if (sev === 'medium') p = score >= 0.85 ? 'high' : score >= 0.5 ? 'medium' : 'low';
    else p = score >= 0.9 ? 'medium' : 'low';
  }
  if (route?.action === 'escalate' && PRIORITY_ORDER[p] > PRIORITY_ORDER.high) p = 'high';
  return p;
}

export function comparePriority(
  a: { priority: Priority; score: number; receivedAt: string },
  b: { priority: Priority; score: number; receivedAt: string },
): number {
  return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || b.score - a.score || a.receivedAt.localeCompare(b.receivedAt);
}

/* ---------- Lote de ejemplo (simulador de reglas) ---------- */

/** Generador pseudoaleatorio con semilla: el lote es el mismo en el servidor y en el navegador. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface BatchItem {
  label: Label;
  /** Categoría que el clasificador vería (aunque la confianza sea baja). */
  category: CategoryKey;
  score: number;
  /** Verdad de referencia del ejemplo: ¿de verdad infringe la política? */
  violates: boolean;
}

export const BATCH_SIZE = 240;

export function buildBatch(n = BATCH_SIZE, seed = 2026): BatchItem[] {
  const rnd = mulberry32(seed);
  const cats = CATEGORIES.filter((c) => CATEGORY_MIX[c] > 0);
  const total = cats.reduce((s, c) => s + CATEGORY_MIX[c], 0);
  const pick = (): CategoryKey => {
    let x = rnd() * total;
    for (const c of cats) {
      x -= CATEGORY_MIX[c];
      if (x <= 0) return c;
    }
    return cats[cats.length - 1];
  };
  const items: BatchItem[] = [];
  for (let i = 0; i < n; i++) {
    const violates = rnd() < 0.6;
    const category = pick();
    let score: number;
    // Lo que infringe suele puntuar alto, pero el 8 % se le escapa al clasificador;
    // lo que no infringe suele puntuar bajo, pero una parte se parece a algo prohibido.
    if (violates) score = rnd() < 0.08 ? 0.05 + 0.2 * rnd() : 0.35 + 0.64 * Math.pow(rnd(), 0.6);
    else score = rnd() < 0.75 ? 0.2 * Math.pow(rnd(), 1.4) : 0.25 + 0.65 * rnd();
    score = Math.min(0.99, Math.round(score * 100) / 100);
    items.push({ category, score, violates, label: score < 0.2 ? 'none' : category });
  }
  return items;
}

export interface Simulation {
  total: number;
  byAction: Record<RuleAction, number>;
  automatic: number;
  human: number;
  /** Contenido que NO infringía y una regla retiró, limitó o advirtió. */
  falsePositives: number;
  /** Contenido que SÍ infringía y una regla aprobó sola. */
  falseNegatives: number;
  /** Contenidos del lote que coinciden con cada regla (índice = regla). */
  perRule: number[];
}

export function simulate(rules: Rule[], batch: BatchItem[]): Simulation {
  const byAction = { autoReject: 0, warn: 0, limit: 0, humanReview: 0, escalate: 0, autoApprove: 0 } as Record<RuleAction, number>;
  const perRule = rules.map(() => 0);
  let falsePositives = 0;
  let falseNegatives = 0;
  for (const it of batch) {
    rules.forEach((r, i) => {
      if (ruleMatches(r, it.label, it.score)) perRule[i] += 1;
    });
    const route = routeFor(rules, it.label, it.score);
    byAction[route.action] += 1;
    if (!it.violates && (route.action === 'autoReject' || route.action === 'warn' || route.action === 'limit')) falsePositives += 1;
    if (it.violates && route.action === 'autoApprove') falseNegatives += 1;
  }
  const automatic = byAction.autoReject + byAction.warn + byAction.limit + byAction.autoApprove;
  return { total: batch.length, byAction, automatic, human: batch.length - automatic, falsePositives, falseNegatives, perRule };
}

/** Cuántas reglas cambian entre dos versiones (agregadas, borradas o editadas). */
export function countRuleChanges(before: Rule[], after: Rule[]): number {
  const a = new Map(before.map((r) => [r.id, JSON.stringify(r)]));
  const b = new Map(after.map((r) => [r.id, JSON.stringify(r)]));
  let n = 0;
  for (const [id, v] of b) if (a.get(id) !== v) n += 1;
  for (const id of a.keys()) if (!b.has(id)) n += 1;
  return n;
}

/* ---------- Evaluación del clasificador ---------- */

export interface CategoryMetric {
  cat: CategoryKey;
  support: number;
  predicted: number;
  tp: number;
  precision: number | null;
  recall: number | null;
}

export interface Evaluation {
  total: number;
  correct: number;
  accuracy: number;
  benign: number;
  benignFlagged: number;
  perCategory: CategoryMetric[];
  errors: Array<{ id: string; text: string; expected: Label; got: Label; score: number }>;
}

/** Ejemplos etiquetados: los casos de la cola más el conjunto de evaluación. */
export function evaluationExamples(lang: Lang): Array<{ id: string; text: string; label: Label }> {
  return [
    ...SAMPLE_CASES.map((c) => ({ id: c.id, text: c.content[lang], label: c.expected })),
    ...EVAL_SET.map((e) => ({ id: e.id, text: e.text[lang], label: e.label })),
  ];
}

export function evaluate(lang: Lang): Evaluation {
  const examples = evaluationExamples(lang);
  const preds = examples.map((e) => {
    const c = classify(e.text);
    return { ...e, got: c.label, score: c.score };
  });
  const perCategory: CategoryMetric[] = CATEGORIES.map((cat) => {
    const support = preds.filter((p) => p.label === cat).length;
    const predicted = preds.filter((p) => p.got === cat).length;
    const tp = preds.filter((p) => p.label === cat && p.got === cat).length;
    return { cat, support, predicted, tp, precision: predicted ? tp / predicted : null, recall: support ? tp / support : null };
  });
  const correct = preds.filter((p) => p.label === p.got).length;
  const benign = preds.filter((p) => p.label === 'none');
  return {
    total: preds.length,
    correct,
    accuracy: correct / preds.length,
    benign: benign.length,
    benignFlagged: benign.filter((p) => p.got !== 'none').length,
    perCategory,
    errors: preds.filter((p) => p.label !== p.got).map((p) => ({ id: p.id, text: p.text, expected: p.label, got: p.got, score: p.score })),
  };
}
