'use client';

/**
 * Estado de la demo (flujos, ejecuciones y casos para revisar) con
 * persistencia en localStorage. Todo ocurre en el navegador: no hay servidor,
 * ni conectores reales, ni modelo de IA.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { isStepType, isTrigger, typeKey } from './catalog';
import { executeRun, setPath, validateFlow, type Data, type RunCtx } from './engine';
import { asLoc, bogotaNow, diffMinutes } from './format';
import { runInWorker } from './sandbox';
import { buildSamples, buildSheets, newStep, samplesFor, type SeedText } from './samples';
import { MAX_AGE_DAYS, buildSeed, buildWorkflow, isValidState, storageKey, toRecords } from './seed';
import type { ConfigValue, DemoState, Loc, Msg, ReviewItem, RunRecord, RunSource, SampleEvent, Stamp, Step, StepLog, StepType, TemplateKey, Workflow } from './types';

export type NodeVisual = 'idle' | 'running' | 'success' | 'retry' | 'failed' | 'review' | 'stopped' | 'cancelled';

export interface Live {
  workflowId: string;
  statuses: Record<string, NodeVisual>;
  /** Índice del paso más avanzado (para pintar las flechas recorridas). */
  reached: number;
  running: boolean;
}

export interface Toast {
  id: number;
  text: string;
  tone: 'ok' | 'info' | 'warn';
  action?: { label: string; run: () => void };
}

export interface TestResult {
  logs: StepLog[];
  input: unknown;
  output: unknown;
  /** Si un paso anterior no dejó pasar el ejemplo. */
  blockedBy?: StepLog;
}

export type ReviewAction = 'retry' | 'continue' | 'done' | 'discard';

interface Ctx {
  s: DemoState;
  loc: Loc;
  text: SeedText;
  now: Stamp;
  wf: Workflow;
  samples: SampleEvent[];
  wfSamples: SampleEvent[];
  sampleId: string;
  setSampleId: (id: string) => void;
  live: Live;
  toasts: Toast[];
  toast: (text: string, tone?: Toast['tone'], action?: Toast['action']) => void;
  dismissToast: (id: number) => void;
  msg: (m: Msg) => string;
  dirty: boolean;
  setActive: (id: string) => void;
  renameWorkflow: (id: string, name: string) => void;
  duplicateWorkflow: (id: string) => void;
  deleteWorkflow: (id: string) => void;
  createFromTemplate: (key: TemplateKey) => string;
  importWorkflow: (raw: unknown) => { ok: true; name: string } | { ok: false; error: string };
  addStep: (type: StepType, index?: number) => string | null;
  replaceTrigger: (type: StepType) => string;
  updateStep: (id: string, patch: Partial<Pick<Step, 'name' | 'credential'>> & { config?: Record<string, ConfigValue>; retry?: Partial<Step['retry']> }) => void;
  moveStep: (id: string, toIndex: number) => void;
  removeStep: (id: string) => void;
  duplicateStep: (id: string) => string | null;
  saveVersion: (note: string) => void;
  restoreVersion: (n: number) => void;
  setMinutes: (wfId: string, minutes: number) => void;
  run: (opts?: { sampleId?: string; source?: RunSource; sourceRun?: string }) => Promise<void>;
  cancel: () => void;
  resolveReview: (id: string, action: ReviewAction, fix?: string) => Promise<RunRecord | null>;
  discardOpen: () => number;
  testStep: (stepId: string, sampleId: string) => Promise<TestResult | null>;
  reset: () => Promise<void>;
}

const AutomationContext = createContext<Ctx | null>(null);

export function useAutomation(): Ctx {
  const c = useContext(AutomationContext);
  if (!c) throw new Error('useAutomation fuera de AutomationProvider');
  return c;
}

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const VISUAL: Record<StepLog['status'], NodeVisual> = {
  success: 'success',
  retry: 'retry',
  failed: 'failed',
  review: 'review',
  stopped: 'stopped',
  cancelled: 'cancelled',
};

/** Ejecuciones que se conservan (cada una guarda la entrada y salida de sus pasos). */
const MAX_RUNS = 120;

const IDLE_LIVE: Live = { workflowId: '', statuses: {}, reached: -1, running: false };

export function AutomationProvider({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const t = useTranslations('demoAutomation');
  const loc = asLoc(useLocale());
  const text = useMemo(() => t.raw('seed') as SeedText, [t]);
  const sheets = useMemo(() => buildSheets(text), [text]);
  const [s, setS] = useState<DemoState | null>(null);
  const [now, setNow] = useState<Stamp>('');
  const [live, setLive] = useState<Live>(IDLE_LIVE);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sampleByWf, setSampleByWf] = useState<Record<string, string>>({});
  const stateRef = useRef<DemoState | null>(null);
  const liveRef = useRef<Live>(IDLE_LIVE);
  const cancelRef = useRef(false);
  const runningRef = useRef(false);
  const alive = useRef(true);
  const toastSeq = useRef(0);
  stateRef.current = s;
  liveRef.current = live;

  /* ---------------- carga, guardado y reloj ---------------- */
  useEffect(() => {
    alive.current = true;
    const stamp = bogotaNow();
    setNow(stamp);
    let saved: unknown = null;
    try {
      const raw = window.localStorage.getItem(storageKey(loc));
      saved = raw ? JSON.parse(raw) : null;
    } catch {
      saved = null;
    }
    if (isValidState(saved) && diffMinutes(`${saved.day}T00:00:00`, stamp) <= MAX_AGE_DAYS * 1440 && saved.workflows.some((w) => w.id === saved.activeId)) {
      setS(saved);
    } else {
      buildSeed(stamp, text, loc, runInWorker).then((seed) => {
        if (alive.current) setS(seed);
      });
    }
    const timer = window.setInterval(() => setNow(bogotaNow()), 30000);
    return () => {
      alive.current = false;
      window.clearInterval(timer);
    };
    // Solo al montar (y si cambia el idioma).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc]);

  useEffect(() => {
    if (!s) return;
    try {
      window.localStorage.setItem(storageKey(loc), JSON.stringify(s));
    } catch {
      // Sin almacenamiento (modo privado): la demo sigue funcionando en memoria.
    }
  }, [s, loc]);

  /* ---------------- utilidades ---------------- */
  const toast = useCallback((textMsg: string, tone: Toast['tone'] = 'ok', action?: Toast['action']) => {
    toastSeq.current += 1;
    const id = toastSeq.current;
    setToasts((prev) => [...prev.slice(-2), { id, text: textMsg, tone, action }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), action ? 8000 : 5000);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((prev) => prev.filter((x) => x.id !== id)), []);

  const msg = useCallback(
    (m: Msg): string => {
      const params: Record<string, string | number> = {};
      for (const [k, v] of Object.entries(m.params ?? {})) {
        if (typeof v === 'string' && v.includes('§')) {
          params[k] = v
            .split('|')
            .map((part) => (part.startsWith('§') ? t(part.slice(1)) : part))
            .join(', ');
        } else params[k] = v;
      }
      if (typeof params.error === 'string' && params.error === '') params.error = '—';
      return t(m.key, params);
    },
    [t],
  );

  const patchState = useCallback((fn: (prev: DemoState) => DemoState) => {
    setS((prev) => (prev ? fn(prev) : prev));
  }, []);

  const patchWf = useCallback(
    (id: string, fn: (wf: Workflow) => Workflow) => {
      patchState((prev) => ({ ...prev, workflows: prev.workflows.map((w) => (w.id === id ? fn(w) : w)) }));
    },
    [patchState],
  );

  const samples = useMemo(() => (now ? buildSamples(now, text) : []), [now, text]);

  const wf = useMemo(() => (s ? s.workflows.find((w) => w.id === s.activeId) ?? s.workflows[0] : null), [s]);
  const wfSamples = useMemo(() => samplesFor(samples, wf?.steps[0]?.type), [samples, wf]);
  const sampleId = wf && sampleByWf[wf.id] && wfSamples.some((x) => x.id === sampleByWf[wf.id]) ? sampleByWf[wf.id] : wfSamples[0]?.id ?? '';
  const setSampleId = useCallback(
    (id: string) => {
      if (wf) setSampleByWf((prev) => ({ ...prev, [wf.id]: id }));
    },
    [wf],
  );

  const dirty = useMemo(() => {
    if (!wf) return false;
    const last = wf.versions[wf.versions.length - 1];
    return !last || JSON.stringify(last.steps) !== JSON.stringify(wf.steps);
  }, [wf]);

  const ctxFor = useCallback(
    (seq: number, counters: DemoState['counters'], at: Stamp): RunCtx => ({ loc, now: at, seq, counters, sheets, kb: text.kb, runJs: runInWorker }),
    [loc, sheets, text],
  );

  /* ---------------- flujos ---------------- */
  const setActive = useCallback(
    (id: string) => {
      if (runningRef.current) return;
      patchState((prev) => ({ ...prev, activeId: id }));
      setLive(IDLE_LIVE);
    },
    [patchState],
  );

  const renameWorkflow = useCallback((id: string, name: string) => patchWf(id, (w) => ({ ...w, name: name.trim().slice(0, 80) || w.name })), [patchWf]);

  const uniqueName = useCallback((base: string, list: Workflow[]) => {
    if (!list.some((w) => w.name === base)) return base;
    let i = 2;
    while (list.some((w) => w.name === `${base} (${i})`)) i += 1;
    return `${base} (${i})`;
  }, []);

  const duplicateWorkflow = useCallback(
    (id: string) => {
      patchState((prev) => {
        const src = prev.workflows.find((w) => w.id === id);
        if (!src) return prev;
        const n = prev.counters.wf + 1;
        const copy: Workflow = {
          ...clone(src),
          id: `wf-${n}`,
          name: uniqueName(t('flows.copyName', { name: src.name }), prev.workflows),
          versions: [],
          rate: { perDay: 0, ok: src.rate.ok },
        };
        return { ...prev, workflows: [...prev.workflows, copy], activeId: copy.id, counters: { ...prev.counters, wf: n } };
      });
      setLive(IDLE_LIVE);
    },
    [patchState, t, uniqueName],
  );

  const deleteWorkflow = useCallback(
    (id: string) => {
      patchState((prev) => {
        if (prev.workflows.length <= 1) return prev;
        const workflows = prev.workflows.filter((w) => w.id !== id);
        return {
          ...prev,
          workflows,
          activeId: prev.activeId === id ? workflows[0].id : prev.activeId,
          runs: prev.runs.filter((r) => r.workflowId !== id),
          reviews: prev.reviews.filter((r) => r.workflowId !== id),
        };
      });
      setLive(IDLE_LIVE);
    },
    [patchState],
  );

  const createFromTemplate = useCallback(
    (key: TemplateKey): string => {
      const cur = stateRef.current;
      if (!cur) return '';
      const n = cur.counters.wf + 1;
      const id = `wf-${n}`;
      const base = buildWorkflow(id, key, text, bogotaNow(), false);
      const created: Workflow = { ...base, name: uniqueName(base.name, cur.workflows) };
      patchState((prev) => ({ ...prev, workflows: [...prev.workflows, created], activeId: id, counters: { ...prev.counters, wf: n } }));
      setLive(IDLE_LIVE);
      return id;
    },
    [patchState, text, uniqueName],
  );

  const importWorkflow = useCallback(
    (raw: unknown): { ok: true; name: string } | { ok: false; error: string } => {
      const cur = stateRef.current;
      if (!cur) return { ok: false, error: t('json.errors.shape') };
      const obj = raw as { name?: unknown; steps?: unknown };
      if (!obj || typeof obj !== 'object' || typeof obj.name !== 'string' || !Array.isArray(obj.steps)) return { ok: false, error: t('json.errors.shape') };
      if (obj.steps.length === 0 || obj.steps.length > 20) return { ok: false, error: t('json.errors.count') };
      const steps: Step[] = [];
      for (const [i, rawStep] of (obj.steps as unknown[]).entries()) {
        const st = rawStep as Partial<Step>;
        if (!st || typeof st !== 'object' || !isStepType(st.type)) return { ok: false, error: t('json.errors.type', { n: i + 1 }) };
        const base = newStep(`s${i + 1}`, st.type, typeof st.name === 'string' && st.name.trim() ? st.name.trim().slice(0, 60) : t(`types.${typeKey(st.type)}.name`), text);
        const config: Record<string, ConfigValue> = { ...base.config };
        if (st.config && typeof st.config === 'object') {
          for (const [k, v] of Object.entries(st.config)) {
            if ((typeof v === 'string' && v.length <= 4000) || (typeof v === 'number' && Number.isFinite(v))) config[k] = v;
          }
        }
        const retry = { ...base.retry };
        if (st.retry && typeof st.retry === 'object') {
          const a = Number(st.retry.attempts);
          if (Number.isInteger(a) && a >= 0 && a <= 5) retry.attempts = a;
          if (st.retry.backoff === 'linear' || st.retry.backoff === 'exponential') retry.backoff = st.retry.backoff;
          const b = Number(st.retry.baseSeconds);
          if ([1, 2, 5, 10].includes(b)) retry.baseSeconds = b;
        }
        steps.push({ ...base, config, retry, credential: typeof st.credential === 'string' ? st.credential : base.credential });
      }
      const invalid = validateFlow(steps);
      if (invalid) return { ok: false, error: msg(invalid) };
      const n = cur.counters.wf + 1;
      const id = `wf-${n}`;
      const name = uniqueName(obj.name.trim().slice(0, 80) || t('flows.importedName'), cur.workflows);
      const created: Workflow = {
        ...buildWorkflow(id, 'blank', text, bogotaNow(), false),
        name,
        steps,
        stepSeq: steps.length,
      };
      patchState((prev) => ({ ...prev, workflows: [...prev.workflows, created], activeId: id, counters: { ...prev.counters, wf: n } }));
      setLive(IDLE_LIVE);
      return { ok: true, name };
    },
    [msg, patchState, t, text, uniqueName],
  );

  /* ---------------- pasos ---------------- */
  const addStep = useCallback(
    (type: StepType, index?: number): string | null => {
      const cur = stateRef.current;
      const w = cur?.workflows.find((x) => x.id === cur.activeId);
      if (!cur || !w || isTrigger(type)) return null;
      if (w.steps.length >= 20) {
        toast(t('toasts.maxSteps'), 'warn');
        return null;
      }
      const id = `s${w.stepSeq + 1}`;
      const at = Math.max(1, Math.min(w.steps.length, index ?? w.steps.length));
      const step = newStep(id, type, t(`types.${typeKey(type)}.name`), text);
      patchWf(w.id, (x) => {
        const steps = [...x.steps];
        steps.splice(at, 0, step);
        return { ...x, steps, stepSeq: x.stepSeq + 1 };
      });
      setLive(IDLE_LIVE);
      return id;
    },
    [patchWf, t, text, toast],
  );

  const replaceTrigger = useCallback(
    (type: StepType): string => {
      const cur = stateRef.current;
      const w = cur?.workflows.find((x) => x.id === cur.activeId);
      if (!cur || !w) return '';
      const id = `s${w.stepSeq + 1}`;
      const step = newStep(id, type, t(`types.${typeKey(type)}.name`), text);
      patchWf(w.id, (x) => ({ ...x, steps: isTrigger(x.steps[0]?.type) ? [step, ...x.steps.slice(1)] : [step, ...x.steps], stepSeq: x.stepSeq + 1 }));
      setLive(IDLE_LIVE);
      return id;
    },
    [patchWf, t, text],
  );

  const updateStep = useCallback<Ctx['updateStep']>(
    (id, patch) => {
      const cur = stateRef.current;
      if (!cur) return;
      patchWf(cur.activeId, (x) => ({
        ...x,
        steps: x.steps.map((st) =>
          st.id === id
            ? {
                ...st,
                ...(patch.name !== undefined ? { name: patch.name.slice(0, 60) } : {}),
                ...(patch.credential !== undefined ? { credential: patch.credential } : {}),
                config: patch.config ? { ...st.config, ...patch.config } : st.config,
                retry: patch.retry ? { ...st.retry, ...patch.retry } : st.retry,
              }
            : st,
        ),
      }));
    },
    [patchWf],
  );

  const moveStep = useCallback(
    (id: string, toIndex: number) => {
      const cur = stateRef.current;
      if (!cur) return;
      patchWf(cur.activeId, (x) => {
        const from = x.steps.findIndex((st) => st.id === id);
        if (from <= 0) return x;
        const steps = [...x.steps];
        const [moved] = steps.splice(from, 1);
        const at = Math.max(1, Math.min(steps.length, toIndex > from ? toIndex - 1 : toIndex));
        steps.splice(at, 0, moved);
        return { ...x, steps };
      });
      setLive(IDLE_LIVE);
    },
    [patchWf],
  );

  const removeStep = useCallback(
    (id: string) => {
      const cur = stateRef.current;
      const w = cur?.workflows.find((x) => x.id === cur.activeId);
      if (!cur || !w) return;
      const index = w.steps.findIndex((st) => st.id === id);
      if (index <= 0) return;
      const removed = w.steps[index];
      const wfId = w.id;
      patchWf(wfId, (x) => ({ ...x, steps: x.steps.filter((st) => st.id !== id) }));
      setLive(IDLE_LIVE);
      toast(t('toasts.stepRemoved', { name: removed.name }), 'info', {
        label: t('common.undo'),
        run: () =>
          patchWf(wfId, (x) => {
            if (x.steps.some((st) => st.id === removed.id)) return x;
            const steps = [...x.steps];
            steps.splice(Math.min(index, steps.length), 0, removed);
            return { ...x, steps };
          }),
      });
    },
    [patchWf, t, toast],
  );

  const duplicateStep = useCallback(
    (id: string): string | null => {
      const cur = stateRef.current;
      const w = cur?.workflows.find((x) => x.id === cur.activeId);
      if (!cur || !w) return null;
      const index = w.steps.findIndex((st) => st.id === id);
      if (index <= 0 || w.steps.length >= 20) return null;
      const newId = `s${w.stepSeq + 1}`;
      const copy: Step = { ...clone(w.steps[index]), id: newId, name: t('flows.copyName', { name: w.steps[index].name }).slice(0, 60) };
      patchWf(w.id, (x) => {
        const steps = [...x.steps];
        steps.splice(index + 1, 0, copy);
        return { ...x, steps, stepSeq: x.stepSeq + 1 };
      });
      return newId;
    },
    [patchWf, t],
  );

  const saveVersion = useCallback(
    (note: string) => {
      const cur = stateRef.current;
      if (!cur) return;
      const at = bogotaNow();
      patchWf(cur.activeId, (x) => {
        const n = (x.versions[x.versions.length - 1]?.n ?? 0) + 1;
        return { ...x, versions: [...x.versions, { n, note: note.trim().slice(0, 120) || t('versions.defaultNote'), author: t('seed.you'), at, steps: clone(x.steps) }] };
      });
    },
    [patchWf, t],
  );

  const restoreVersion = useCallback(
    (n: number) => {
      const cur = stateRef.current;
      if (!cur) return;
      patchWf(cur.activeId, (x) => {
        const v = x.versions.find((vv) => vv.n === n);
        if (!v) return x;
        const maxId = Math.max(x.stepSeq, ...v.steps.map((st) => Number(st.id.replace(/\D/g, '')) || 0));
        return { ...x, steps: clone(v.steps), stepSeq: maxId };
      });
      setLive(IDLE_LIVE);
    },
    [patchWf],
  );

  const setMinutes = useCallback(
    (wfId: string, minutes: number) => patchWf(wfId, (x) => ({ ...x, minutesPerRun: Math.max(0, Math.min(240, Math.round(minutes) || 0)) })),
    [patchWf],
  );

  /* ---------------- ejecuciones ---------------- */
  /** Ejecuta el flujo activo con un ejemplo y muestra el avance paso a paso. */
  const run: Ctx['run'] = async (opts) => {
    const cur = stateRef.current;
    const w = cur?.workflows.find((x) => x.id === cur.activeId);
    if (!cur || !w || runningRef.current) return;
    const invalid = validateFlow(w.steps);
    if (invalid) {
      toast(msg(invalid), 'warn');
      return;
    }
    const sample = samples.find((x) => x.id === (opts?.sampleId ?? sampleId) && x.trigger === w.steps[0].type);
    if (!sample) {
      toast(t('toasts.noSample'), 'warn');
      return;
    }
    cancelRef.current = false;
    runningRef.current = true;
    try {
      const snapshot = clone(w);
      const counters = clone(cur.counters);
      counters.run += 1;
      const seq = counters.run;
      const startedAt = bogotaNow();
      setLive({ workflowId: w.id, statuses: {}, reached: -1, running: true });
      const outcome = await executeRun({ steps: snapshot.steps, sample, ctx: ctxFor(seq, counters, startedAt) });

      // El resultado ya está calculado; aquí solo se muestra paso a paso.
      const shown: StepLog[] = [];
      let cancelled = false;
      for (const log of outcome.steps) {
        if (cancelRef.current) {
          cancelled = true;
          break;
        }
        const idx = snapshot.steps.findIndex((st) => st.id === log.stepId);
        setLive((l) => ({ ...l, statuses: { ...l.statuses, [log.stepId]: 'running' }, reached: Math.max(l.reached, idx) }));
        await sleep(Math.max(260, Math.min(700, log.durationMs / 2.5)));
        if (!alive.current) return;
        shown.push(log);
        setLive((l) => ({ ...l, statuses: { ...l.statuses, [log.stepId]: VISUAL[log.status] } }));
        if (log.waitMs) await sleep(450);
      }

      let final = outcome;
      if (cancelled) {
        const next = snapshot.steps.find((st) => !shown.some((l) => l.stepId === st.id));
        final = {
          ...outcome,
          status: 'cancelled',
          steps: shown,
          durationMs: shown.reduce((a, l) => a + l.durationMs + (l.waitMs ?? 0), 0),
          summary: { key: 'sum.cancelled', params: { step: next?.name ?? '—' } },
          review: undefined,
        };
        if (next) setLive((l) => ({ ...l, statuses: { ...l.statuses, [next.id]: 'cancelled' } }));
      }
      const base = stateRef.current;
      if (!base) return;
      const finalCounters = cancelled ? { ...base.counters, run: seq } : { ...counters, review: base.counters.review, wf: base.counters.wf };
      const { run: record, review } = toRecords({
        wf: snapshot,
        outcome: final,
        seq,
        startedAt,
        sampleId: sample.id,
        source: opts?.source ?? 'manual',
        sourceRun: opts?.sourceRun,
        counters: finalCounters,
      });
      patchState((prev) => ({
        ...prev,
        counters: { ...finalCounters, wf: prev.counters.wf },
        runs: [record, ...prev.runs].slice(0, MAX_RUNS),
        reviews: review ? [review, ...prev.reviews] : prev.reviews,
      }));
      const tone: Toast['tone'] = record.status === 'success' || record.status === 'retried' ? 'ok' : record.status === 'stopped' || record.status === 'cancelled' ? 'info' : 'warn';
      toast(`${record.id}: ${msg(record.summary)}`, tone);
    } finally {
      runningRef.current = false;
      setLive((l) => ({ ...l, running: false }));
    }
  };

  const cancel = useCallback(() => {
    if (runningRef.current) cancelRef.current = true;
  }, []);

  const resolveReview = useCallback<Ctx['resolveReview']>(
    async (id, action, fix) => {
      const cur = stateRef.current;
      const item = cur?.reviews.find((r) => r.id === id);
      if (!cur || !item || item.status !== 'open') return null;
      if (runningRef.current) {
        toast(t('toasts.waitRun'), 'info');
        return null;
      }
      const at = bogotaNow();
      if (action === 'done' || action === 'discard') {
        patchState((prev) => ({
          ...prev,
          reviews: prev.reviews.map((r) =>
            r.id === id ? { ...r, status: action === 'done' ? 'resolved' : 'discarded', resolvedAt: at, resolution: { key: action === 'done' ? 'review.res.done' : 'review.res.discarded' } } : r,
          ),
        }));
        return null;
      }
      const w = cur.workflows.find((x) => x.id === item.workflowId);
      if (!w) return null;
      if (action === 'continue' && !item.resumeFrom) {
        patchState((prev) => ({
          ...prev,
          reviews: prev.reviews.map((r) => (r.id === id ? { ...r, status: 'resolved', resolvedAt: at, resolution: { key: 'review.res.approvedEnd' } } : r)),
        }));
        return null;
      }
      const startIndex = w.steps.findIndex((st) => st.id === item.resumeFrom);
      if (startIndex < 0) {
        toast(t('toasts.stepGone', { step: item.stepName }), 'warn');
        return null;
      }
      const sample = samples.find((x) => x.id === item.sampleId) ?? samples[0];
      let data: Data = item.data;
      if (fix !== undefined && item.missingPath) data = setPath(data, item.missingPath, fix.trim());
      const counters = clone(cur.counters);
      counters.run += 1;
      const seq = counters.run;
      const outcome = await executeRun({ steps: w.steps, sample, ctx: ctxFor(seq, counters, at), startIndex, data, resume: true });
      const runId = `run-${String(seq).padStart(4, '0')}`;
      const record: RunRecord = {
        ...toRecords({ wf: w, outcome: { ...outcome, review: undefined }, seq, startedAt: at, sampleId: item.sampleId, source: action === 'retry' ? 'retry' : 'approve', sourceRun: item.runId, counters }).run,
        reviewId: outcome.review ? item.id : undefined,
      };
      patchState((prev) => ({
        ...prev,
        counters: { ...counters, review: prev.counters.review, wf: prev.counters.wf },
        runs: [record, ...prev.runs].slice(0, MAX_RUNS),
        reviews: prev.reviews.map((r): ReviewItem => {
          if (r.id !== id) return r;
          if (outcome.review) {
            const rv = outcome.review;
            return { ...r, runId, stepId: rv.stepId, stepName: rv.stepName, kind: rv.kind, reason: rv.reason, data: rv.data, resumeFrom: rv.resumeFrom, missingPath: rv.missingPath };
          }
          return { ...r, status: 'resolved', resolvedAt: at, resolution: { key: 'review.res.byRun', params: { run: runId } } };
        }),
      }));
      return record;
    },
    [ctxFor, patchState, samples, t, toast],
  );

  const discardOpen = useCallback((): number => {
    const cur = stateRef.current;
    if (!cur) return 0;
    const count = cur.reviews.filter((r) => r.status === 'open').length;
    const at = bogotaNow();
    patchState((prev) => ({
      ...prev,
      reviews: prev.reviews.map((r) => (r.status === 'open' ? { ...r, status: 'discarded', resolvedAt: at, resolution: { key: 'review.res.discarded' } } : r)),
    }));
    return count;
  }, [patchState]);

  const testStep = useCallback<Ctx['testStep']>(
    async (stepId, sId) => {
      const cur = stateRef.current;
      const w = cur?.workflows.find((x) => x.id === cur.activeId);
      if (!cur || !w) return null;
      const idx = w.steps.findIndex((st) => st.id === stepId);
      const sample = samples.find((x) => x.id === sId);
      if (idx < 0 || !sample || validateFlow(w.steps)) return null;
      const counters = clone(cur.counters);
      const outcome = await executeRun({ steps: w.steps, sample, ctx: ctxFor(counters.run + 1, counters, bogotaNow()), untilIndex: idx });
      const logs = outcome.steps.filter((l) => l.stepId === stepId);
      if (!logs.length) return { logs, input: null, output: null, blockedBy: outcome.steps[outcome.steps.length - 1] };
      return { logs, input: logs[0].input, output: logs[logs.length - 1].output ?? null };
    },
    [ctxFor, samples],
  );

  const reset = useCallback(async () => {
    if (runningRef.current) return;
    try {
      window.localStorage.removeItem(storageKey(loc));
    } catch {
      // nada que borrar
    }
    const stamp = bogotaNow();
    const seed = await buildSeed(stamp, text, loc, runInWorker);
    setNow(stamp);
    setS(seed);
    setLive(IDLE_LIVE);
    setSampleByWf({});
  }, [loc, text]);

  if (!s || !wf || !now) return <>{fallback}</>;

  const value: Ctx = {
    s,
    loc,
    text,
    now,
    wf,
    samples,
    wfSamples,
    sampleId,
    setSampleId,
    live: live.workflowId === wf.id ? live : IDLE_LIVE,
    toasts,
    toast,
    dismissToast,
    msg,
    dirty,
    setActive,
    renameWorkflow,
    duplicateWorkflow,
    deleteWorkflow,
    createFromTemplate,
    importWorkflow,
    addStep,
    replaceTrigger,
    updateStep,
    moveStep,
    removeStep,
    duplicateStep,
    saveVersion,
    restoreVersion,
    setMinutes,
    run,
    cancel,
    resolveReview,
    discardOpen,
    testStep,
    reset,
  };
  return <AutomationContext.Provider value={value}>{children}</AutomationContext.Provider>;
}

/** Ejecuciones del mes (de ejemplo + de esta sesión) y ahorro estimado. */
export function monthUsage(s: DemoState, now: Stamp) {
  const dom = Number(now.slice(8, 10));
  const month = now.slice(0, 7);
  const rows = s.workflows.map((w) => {
    const baseRuns = Math.round(w.rate.perDay * Math.max(0, dom - 1));
    const baseOk = Math.round(baseRuns * w.rate.ok);
    const mine = s.runs.filter((r) => r.workflowId === w.id && r.startedAt.slice(0, 7) === month);
    const ok = baseOk + mine.filter((r) => r.status === 'success' || r.status === 'retried').length;
    const runs = baseRuns + mine.length;
    return { wf: w, runs, ok, hours: (ok * w.minutesPerRun) / 60 };
  });
  return {
    rows,
    runs: rows.reduce((a, r) => a + r.runs, 0),
    ok: rows.reduce((a, r) => a + r.ok, 0),
    hours: rows.reduce((a, r) => a + r.hours, 0),
  };
}

