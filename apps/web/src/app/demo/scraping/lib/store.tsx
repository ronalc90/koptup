'use client';

/**
 * Estado de la demo en el navegador. Se guarda en localStorage (clave
 * `demo:scraping:v1`) para que tu configuración, tus reglas y tus ejecuciones
 * sigan ahí al volver; "Reiniciar demo" lo borra. Nada sale del navegador.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { notify } from './notify';
import { PRESET_CRON } from './cron';
import {
  DEFAULT_DOCS, DEFAULT_FIELDS, DEFAULT_NORMATIVA, DEFAULT_RADAR, DEFAULT_RULES, RECORD_SELECTOR, SIMULATED_STORE_CHANGES, SOURCES, SOURCE_IDS,
} from './data';
import { historyFromResult, runSource, scheduledTime, seedHistory, signatureOf, type SourceConfigs } from './engine';
import { DEMO_NOW, DEMO_TODAY, addMinutes, type Loc } from './format';
import type {
  Channel, CustomSource, DocsConfig, Field, HistoryEntry, NormativaConfig, RadarConfig, Rule, RunResult, Schedule, SentAlert, SourceId, Tab,
} from './types';
import { TABS } from './types';

const KEY = 'demo:scraping:v1';

export type TourStep = 'radar' | 'field' | 'change' | 'download' | 'legal';
export const TOUR_STEPS: TourStep[] = ['radar', 'field', 'change', 'download', 'legal'];

export interface DemoState {
  activeId: string;
  tab: Tab;
  fieldsSaved: Field[];
  fieldsDraft: Field[];
  nextFieldId: number;
  recordSelector: string;
  recordSelectorDraft: string;
  simulated: number;
  radar: RadarConfig;
  normativa: NormativaConfig;
  docs: DocsConfig;
  schedules: Record<SourceId, Schedule>;
  rules: Rule[];
  nextRuleId: number;
  channels: Channel[];
  sentAlerts: SentAlert[];
  results: Partial<Record<SourceId, RunResult>>;
  history: HistoryEntry[];
  manualRuns: number;
  paused: SourceId[];
  sentToRag: string[];
  corrections: Record<string, number>;
  customSources: CustomSource[];
  tour: Record<TourStep, boolean>;
  tourHidden: boolean;
}

export function defaultState(): DemoState {
  return {
    activeId: 'contratacion',
    tab: 'overview',
    fieldsSaved: DEFAULT_FIELDS,
    fieldsDraft: DEFAULT_FIELDS,
    nextFieldId: DEFAULT_FIELDS.length + 1,
    recordSelector: RECORD_SELECTOR,
    recordSelectorDraft: RECORD_SELECTOR,
    simulated: 0,
    radar: DEFAULT_RADAR,
    normativa: DEFAULT_NORMATIVA,
    docs: DEFAULT_DOCS,
    schedules: Object.fromEntries(SOURCES.map((s) => [s.id, { preset: s.defaultPreset, cron: PRESET_CRON.daily6 }])) as Record<SourceId, Schedule>,
    rules: DEFAULT_RULES,
    nextRuleId: DEFAULT_RULES.length + 1,
    channels: ['email'],
    sentAlerts: [],
    results: {},
    history: [],
    manualRuns: 0,
    paused: [],
    sentToRag: [],
    corrections: {},
    customSources: [],
    tour: { radar: false, field: false, change: false, download: false, legal: false },
    tourHidden: false,
  };
}

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/** Lo leído de localStorage se valida por partes: lo que no cuadre vuelve al valor inicial. */
function restore(raw: unknown): DemoState {
  const base = defaultState();
  if (!isObj(raw)) return base;
  const out: DemoState = { ...base };
  const r = raw as Partial<DemoState>;
  if (typeof r.activeId === 'string') out.activeId = r.activeId;
  if (typeof r.tab === 'string' && TABS.includes(r.tab)) out.tab = r.tab;
  const validField = (f: unknown): f is Field => isObj(f) && typeof f.id === 'string' && typeof f.name === 'string' && typeof f.selector === 'string' && typeof f.type === 'string' && typeof f.required === 'boolean' && (f.scope === 'record' || f.scope === 'page');
  if (Array.isArray(r.fieldsSaved) && r.fieldsSaved.every(validField)) out.fieldsSaved = r.fieldsSaved.slice(0, 30);
  if (Array.isArray(r.fieldsDraft) && r.fieldsDraft.every(validField)) out.fieldsDraft = r.fieldsDraft.slice(0, 30);
  if (typeof r.nextFieldId === 'number') out.nextFieldId = r.nextFieldId;
  if (typeof r.recordSelector === 'string') out.recordSelector = r.recordSelector.slice(0, 200);
  if (typeof r.recordSelectorDraft === 'string') out.recordSelectorDraft = r.recordSelectorDraft.slice(0, 200);
  if (typeof r.simulated === 'number' && r.simulated >= 0 && r.simulated <= SIMULATED_STORE_CHANGES.length) out.simulated = r.simulated;
  if (isObj(r.radar) && Array.isArray(r.radar.keywords) && Array.isArray(r.radar.departments) && typeof r.radar.minAmount === 'number') out.radar = r.radar as RadarConfig;
  if (isObj(r.normativa) && Array.isArray(r.normativa.entities) && typeof r.normativa.keyword === 'string') out.normativa = r.normativa as NormativaConfig;
  if (isObj(r.docs) && typeof r.docs.threshold === 'number' && Array.isArray(r.docs.columns)) out.docs = r.docs as DocsConfig;
  if (isObj(r.schedules)) {
    for (const id of SOURCE_IDS) {
      const sc = (r.schedules as Record<string, unknown>)[id];
      if (isObj(sc) && typeof sc.preset === 'string' && typeof sc.cron === 'string') out.schedules[id] = sc as unknown as Schedule;
    }
  }
  if (Array.isArray(r.rules)) out.rules = r.rules.filter((x) => isObj(x) && typeof x.id === 'string' && typeof x.type === 'string').slice(0, 50) as Rule[];
  if (typeof r.nextRuleId === 'number') out.nextRuleId = r.nextRuleId;
  if (Array.isArray(r.channels)) out.channels = r.channels.filter((c) => c === 'email' || c === 'teams' || c === 'whatsapp');
  if (Array.isArray(r.sentAlerts)) out.sentAlerts = r.sentAlerts.slice(0, 30) as SentAlert[];
  if (isObj(r.results)) {
    for (const id of SOURCE_IDS) {
      const res = (r.results as Record<string, unknown>)[id];
      if (isObj(res) && Array.isArray(res.rows) && Array.isArray(res.columns) && Array.isArray(res.changes) && Array.isArray(res.log)) out.results[id] = res as unknown as RunResult;
    }
  }
  if (Array.isArray(r.history)) out.history = r.history.filter((h) => isObj(h) && typeof h.id === 'string').slice(-60) as HistoryEntry[];
  if (typeof r.manualRuns === 'number') out.manualRuns = r.manualRuns;
  if (Array.isArray(r.paused)) out.paused = r.paused.filter((x) => SOURCE_IDS.includes(x));
  if (Array.isArray(r.sentToRag)) out.sentToRag = r.sentToRag.filter((x) => typeof x === 'string');
  if (isObj(r.corrections)) out.corrections = Object.fromEntries(Object.entries(r.corrections).filter(([, v]) => typeof v === 'number')) as Record<string, number>;
  if (Array.isArray(r.customSources)) out.customSources = r.customSources.filter((c) => isObj(c) && typeof c.id === 'string' && typeof c.url === 'string').slice(0, 10) as CustomSource[];
  if (isObj(r.tour)) for (const k of TOUR_STEPS) out.tour[k] = !!(r.tour as Record<string, unknown>)[k];
  if (typeof r.tourHidden === 'boolean') out.tourHidden = r.tourHidden;
  if (!SOURCE_IDS.includes(out.activeId as SourceId) && !out.customSources.some((c) => c.id === out.activeId)) out.activeId = base.activeId;
  return out;
}

export function configsOf(s: DemoState): SourceConfigs {
  return { fields: s.fieldsSaved, recordSelector: s.recordSelector, simulated: s.simulated, radar: s.radar, normativa: s.normativa, docs: s.docs };
}

/** Completa la ejecución programada de hoy (6:00 a. m.) de cada fuente que no tenga resultado. */
function withScheduledRuns(st: DemoState): DemoState {
  const cfg = configsOf(st);
  const results = { ...st.results };
  const history = [...st.history];
  for (const id of SOURCE_IDS) {
    if (results[id]) continue;
    const res = runSource(id, cfg, `${DEMO_TODAY}T${scheduledTime(id)}`, 'scheduled');
    results[id] = res;
    if (!history.some((h) => h.id === `today-${id}`)) history.push(historyFromResult(res, `today-${id}`));
  }
  return { ...st, results, history };
}

interface Running { sourceId: SourceId; result: RunResult; shown: number }

interface Ctx {
  s: DemoState;
  ready: boolean;
  loc: Loc;
  running: Running | null;
  update: (fn: (s: DemoState) => DemoState) => void;
  selectSource: (id: string) => void;
  setTab: (tab: Tab) => void;
  runNow: (id: SourceId) => void;
  markTour: (step: TourStep) => void;
  reset: () => void;
  pendingConfig: (id: SourceId) => boolean;
  fullHistory: HistoryEntry[];
}

const DemoCtx = createContext<Ctx | null>(null);

export function useDemo(): Ctx {
  const c = useContext(DemoCtx);
  if (!c) throw new Error('useDemo fuera de DemoProvider');
  return c;
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const t = useTranslations('demoScraping');
  const loc: Loc = useLocale() === 'en' ? 'en' : 'es';
  const [s, setS] = useState<DemoState>(defaultState);
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState<Running | null>(null);
  const tRef = useRef(t);
  tRef.current = t;

  // 1) Cargar lo guardado y calcular la ejecución programada de hoy (6:00 a. m.) que falte.
  useEffect(() => {
    let restored = defaultState();
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) restored = restore(JSON.parse(raw));
    } catch {
      restored = defaultState();
    }
    setS(withScheduledRuns(restored));
    setReady(true);
  }, []);

  // 2) Guardar cada cambio, solo después de cargar lo guardado (si no, el estado
  //    inicial pisaría lo que había en el navegador).
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* almacenamiento lleno o bloqueado: la demo sigue funcionando sin guardar */
    }
  }, [s, ready]);

  // 3) Ejecución en curso: muestra la bitácora línea por línea y al final guarda el resultado.
  useEffect(() => {
    if (!running) return;
    if (running.shown < running.result.log.length) {
      const id = window.setTimeout(() => setRunning((r) => (r ? { ...r, shown: r.shown + 1 } : r)), 420);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => {
      const res = running.result;
      setS((prev) => ({
        ...prev,
        results: { ...prev.results, [res.sourceId]: res },
        history: [...prev.history, historyFromResult(res, `m-${prev.manualRuns + 1}`)].slice(-60),
        manualRuns: prev.manualRuns + 1,
      }));
      setRunning(null);
      const tt = tRef.current;
      notify.success(tt('run.finished', { source: tt(`sources.${res.sourceId}.name`), records: res.rows.length, changes: res.changes.length }));
    }, 300);
    return () => window.clearTimeout(id);
  }, [running]);

  const update = useCallback((fn: (s: DemoState) => DemoState) => setS(fn), []);

  const markTour = useCallback((step: TourStep) => {
    setS((prev) => (prev.tour[step] ? prev : { ...prev, tour: { ...prev.tour, [step]: true } }));
  }, []);

  const setTab = useCallback((tab: Tab) => {
    setS((prev) => {
      const tour = { ...prev.tour };
      if (tab === 'compliance') tour.legal = true;
      if (tab === 'changes' && prev.activeId === 'precios') tour.change = true;
      return { ...prev, tab, tour };
    });
  }, []);

  const selectSource = useCallback((id: string) => {
    setS((prev) => {
      const tour = { ...prev.tour };
      if (prev.tab === 'changes' && id === 'precios') tour.change = true;
      return { ...prev, activeId: id, tour };
    });
  }, []);

  const runNow = useCallback((id: SourceId) => {
    if (running) return;
    const at = addMinutes(DEMO_NOW, s.manualRuns * 2);
    let result: RunResult;
    try {
      result = runSource(id, configsOf(s), at, 'manual');
    } catch {
      notify.error(tRef.current('run.failed'));
      return;
    }
    setRunning({ sourceId: id, result, shown: 0 });
  }, [running, s]);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* sin almacenamiento */
    }
    setRunning(null);
    setS(withScheduledRuns(defaultState()));
    notify.success(tRef.current('actions.resetDone'));
  }, []);

  const pendingConfig = useCallback((id: SourceId) => {
    const r = s.results[id];
    return !!r && r.signature !== signatureOf(id, configsOf(s));
  }, [s]);

  const fullHistory = useMemo(
    () => [...seedHistory(), ...s.history].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : a.id < b.id ? 1 : -1)),
    [s.history],
  );

  const value = useMemo<Ctx>(() => ({ s, ready, loc, running, update, selectSource, setTab, runNow, markTour, reset, pendingConfig, fullHistory }), [s, ready, loc, running, update, selectSource, setTab, runNow, markTour, reset, pendingConfig, fullHistory]);

  return <DemoCtx.Provider value={value}>{children}</DemoCtx.Provider>;
}
