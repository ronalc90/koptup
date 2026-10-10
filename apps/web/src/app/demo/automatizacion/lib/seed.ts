/**
 * Estado inicial de la demo: tres flujos de la distribuidora ficticia con su
 * historial de versiones y unas ejecuciones de ejemplo de hoy. Las ejecuciones
 * no se inventan: se corren con el mismo motor que usa el botón «Ejecutar».
 */
import { addDays, addMinutes, addSeconds, dayOf } from './format';
import { executeRun, type JsRunner, type RunCtx } from './engine';
import { TEMPLATE_RATES, VERSION_PLAN, buildSamples, buildSheets, lastScheduleRun, templateSteps, type SeedText } from './samples';
import type { Counters, DemoState, Loc, ReviewItem, RunRecord, RunSource, Stamp, TemplateKey, Workflow } from './types';

export const STATE_VERSION = 1;
export const STORAGE_PREFIX = 'koptup-demo-automatizacion';
/** Pasados estos días se vuelven a armar los datos de ejemplo. */
export const MAX_AGE_DAYS = 21;

export function storageKey(loc: Loc): string {
  return `${STORAGE_PREFIX}:v${STATE_VERSION}:${loc}`;
}

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

export function buildWorkflow(id: string, key: TemplateKey, text: SeedText, now: Stamp, withHistory: boolean, name?: string): Workflow {
  const steps = templateSteps(key, text);
  const rates = TEMPLATE_RATES[key];
  const tpl = text.templates[key];
  const notes = 'versions' in tpl ? (tpl as { versions?: Record<string, string> }).versions ?? {} : {};
  const plan = withHistory ? VERSION_PLAN[key] ?? [] : [];
  const versions = plan.map((v, i) => ({
    n: i + 1,
    note: notes[`v${i + 1}`] ?? `v${i + 1}`,
    author: text.authors[v.author],
    at: `${dayOf(addDays(now, -v.daysAgo))}T${v.hour}`,
    steps: clone(v.keep.map((idx) => steps[idx])),
  }));
  return {
    id,
    name: name ?? tpl.name,
    template: key,
    steps,
    versions,
    minutesPerRun: rates.minutes,
    rate: withHistory ? { perDay: rates.perDay, ok: rates.ok } : { perDay: 0, ok: rates.ok },
    stepSeq: steps.length,
  };
}

export function versionLabel(wf: Workflow): string {
  const last = wf.versions[wf.versions.length - 1];
  if (!last) return 'draft';
  return JSON.stringify(last.steps) === JSON.stringify(wf.steps) ? `v${last.n}` : 'draft';
}

export interface CommitInput {
  wf: Workflow;
  outcome: Awaited<ReturnType<typeof executeRun>>;
  seq: number;
  startedAt: Stamp;
  sampleId: string;
  source: RunSource;
  sourceRun?: string;
  counters: Counters;
}

/** Arma el registro de la ejecución y, si aplica, el caso para revisar. */
export function toRecords(c: CommitInput): { run: RunRecord; review?: ReviewItem } {
  const runId = `run-${String(c.seq).padStart(4, '0')}`;
  let review: ReviewItem | undefined;
  if (c.outcome.review) {
    c.counters.review += 1;
    const r = c.outcome.review;
    review = {
      id: `rev-${String(c.counters.review).padStart(3, '0')}`,
      runId,
      workflowId: c.wf.id,
      stepId: r.stepId,
      stepName: r.stepName,
      kind: r.kind,
      reason: r.reason,
      createdAt: addSeconds(c.startedAt, Math.max(1, Math.round(c.outcome.durationMs / 1000))),
      status: 'open',
      data: r.data,
      resumeFrom: r.resumeFrom,
      missingPath: r.missingPath,
      sampleId: c.sampleId,
    };
  }
  const run: RunRecord = {
    id: runId,
    seq: c.seq,
    workflowId: c.wf.id,
    startedAt: c.startedAt,
    durationMs: c.outcome.durationMs,
    status: c.outcome.status,
    sampleId: c.sampleId,
    source: c.source,
    sourceRun: c.sourceRun,
    version: versionLabel(c.wf),
    steps: c.outcome.steps,
    summary: c.outcome.summary,
    reviewId: review?.id,
  };
  return { run, review };
}

export async function buildSeed(now: Stamp, text: SeedText, loc: Loc, runJs: JsRunner): Promise<DemoState> {
  const workflows = [
    buildWorkflow('wf-1', 'invoices', text, now, true),
    buildWorkflow('wf-2', 'collections', text, now, true),
    buildWorkflow('wf-3', 'leads', text, now, true),
  ];
  const counters: Counters = { run: 0, review: 0, wf: 3, cxp: 411, crm: 0, pay: 0 };
  const samples = buildSamples(now, text);
  const sheets = buildSheets(text);
  const schedule = lastScheduleRun(now);

  // Ejecuciones de ejemplo, en orden cronológico.
  const plan: { wf: string; sample: string; at: Stamp }[] = [
    { wf: 'wf-2', sample: 'colOk', at: addSeconds(schedule, 4) },
    { wf: 'wf-2', sample: 'colRecent', at: addSeconds(schedule, 6) },
    { wf: 'wf-2', sample: 'colNoPhone', at: addSeconds(schedule, 9) },
    { wf: 'wf-1', sample: 'invOk', at: addMinutes(now, -185) },
    { wf: 'wf-3', sample: 'leadBog', at: addMinutes(now, -152) },
    { wf: 'wf-1', sample: 'invRetry', at: addMinutes(now, -108) },
    { wf: 'wf-1', sample: 'invMismatch', at: addMinutes(now, -41) },
    { wf: 'wf-3', sample: 'leadComplaint', at: addMinutes(now, -23) },
  ].sort((a, b) => (a.at < b.at ? -1 : 1));

  const runs: RunRecord[] = [];
  const reviews: ReviewItem[] = [];
  for (const p of plan) {
    const wf = workflows.find((w) => w.id === p.wf)!;
    const sample = samples.find((s) => s.id === p.sample)!;
    counters.run += 1;
    const ctx: RunCtx = { loc, now: p.at, seq: counters.run, counters, sheets, kb: text.kb, runJs };
    const outcome = await executeRun({ steps: wf.steps, sample, ctx });
    const { run, review } = toRecords({ wf, outcome, seq: counters.run, startedAt: p.at, sampleId: sample.id, source: 'trigger', counters });
    runs.unshift(run);
    if (review) reviews.unshift(review);
  }

  return { v: STATE_VERSION, day: dayOf(now), workflows, activeId: 'wf-1', runs, reviews, counters };
}

/** Comprueba la forma básica de un estado guardado. */
export function isValidState(x: unknown): x is DemoState {
  if (!x || typeof x !== 'object') return false;
  const s = x as Partial<DemoState>;
  return (
    s.v === STATE_VERSION &&
    typeof s.day === 'string' &&
    Array.isArray(s.workflows) &&
    s.workflows.length > 0 &&
    s.workflows.every((w) => Array.isArray(w?.steps) && Array.isArray(w?.versions)) &&
    Array.isArray(s.runs) &&
    Array.isArray(s.reviews) &&
    typeof s.activeId === 'string' &&
    !!s.counters
  );
}

