'use client';

/**
 * Estado de la demo en el navegador: reducer + persistencia en localStorage
 * (los cambios sobreviven a recargar la página durante 7 días; después se
 * regeneran los datos de ejemplo con la fecha nueva). Los archivos adjuntos se
 * guardan aparte, en IndexedDB (ver `files.ts`).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { diffDays, localNow, localToday } from './dates';
import { clearFiles, loadFiles, uploadedFiles } from './files';
import { reducer, type Action } from './reducer';
import { buildState, STATE_VERSION } from './seed';
import {
  EMPTY_FILTERS,
  GUIDE_STEPS,
  type AppState,
  type Filters,
  type GuideStep,
  type ISODate,
  type ISODateTime,
  type SectionId,
  type ViewId,
  type Workspace,
} from './types';

export { uploadedFiles } from './files';

const STORAGE_KEY = 'koptup.gestion-proyectos.state';
const GUIDE_KEY = 'koptup.gestion-proyectos.guide';
const MAX_AGE_DAYS = 7;

/** Evento que lanza el encabezado (fuera del proveedor) para mostrar la guía de 5 pasos. */
export const SHOW_GUIDE_EVENT = 'gp:show-guide';

function load(today: ISODate): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      const age = diffDays(parsed.baseDate, today);
      if (parsed.version === STATE_VERSION && age >= 0 && age <= MAX_AGE_DAYS) return parsed;
    }
  } catch {
    /* sin almacenamiento disponible: se usan datos nuevos */
  }
  return buildState(today);
}

function uploadIds(s: AppState): Set<string> {
  const ids = new Set<string>();
  for (const ws of Object.values(s.workspaces)) for (const t of ws.tasks) for (const a of t.attachments) if (a.source === 'upload') ids.add(a.id);
  return ids;
}

/** Quita los adjuntos cuyo archivo ya no está en el navegador (borrado o guardado en otra pestaña sin IndexedDB). */
function stripUploads(s: AppState): AppState {
  const clean = (ws: Workspace): Workspace => ({
    ...ws,
    tasks: ws.tasks.map((t) => (t.attachments.some((a) => a.source === 'upload' && !uploadedFiles.has(a.id)) ? { ...t, attachments: t.attachments.filter((a) => a.source !== 'upload' || uploadedFiles.has(a.id)) } : t)),
  });
  return { ...s, workspaces: { construccion: clean(s.workspaces.construccion), agencia: clean(s.workspaces.agencia), software: clean(s.workspaces.software) } };
}

interface GuideState {
  hidden: boolean;
  done: GuideStep[];
}

function loadGuide(): GuideState {
  try {
    const raw = window.localStorage.getItem(GUIDE_KEY);
    if (raw) {
      const g = JSON.parse(raw) as Partial<GuideState>;
      return { hidden: !!g.hidden, done: (g.done ?? []).filter((s): s is GuideStep => GUIDE_STEPS.includes(s as GuideStep)) };
    }
  } catch {
    /* sin almacenamiento: la guía empieza visible y sin pasos hechos */
  }
  return { hidden: false, done: [] };
}

/** Paso de la guía que cumple una acción (mover a revisión del cliente, aprobar o pedir cambios). */
function stepOf(a: DispatchInput): GuideStep | null {
  if ((a.type === 'task.move' && a.status === 'client') || (a.type === 'task.create' && a.task.status === 'client')) return 'move';
  if (a.type === 'client.approve' || a.type === 'client.changes') return 'client';
  return null;
}

type Stamped<A> = A extends { now: ISODateTime; today: ISODate } ? Omit<A, 'now' | 'today'> : A;
export type DispatchInput = Stamped<Action>;

interface Ctx {
  state: AppState;
  ws: Workspace;
  today: ISODate;
  /** Despacha una acción agregando "hoy" y "ahora" (de Colombia) cuando hace falta. */
  act: (a: DispatchInput) => void;
  section: SectionId;
  setSection: (s: SectionId) => void;
  view: ViewId;
  setView: (v: ViewId) => void;
  clientMode: boolean;
  setClientMode: (v: boolean) => void;
  taskId: string | null;
  openTask: (id: string | null) => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  reset: () => void;
  guideHidden: boolean;
  setGuideHidden: (v: boolean) => void;
  guideDone: GuideStep[];
  markStep: (s: GuideStep) => void;
}

const DemoContext = createContext<Ctx | null>(null);

const STAMPED = new Set([
  'sector',
  'workspace.reset',
  'project.create',
  'sprint.close',
  'milestone.invoice',
  'task.create',
  'task.update',
  'task.move',
  'task.duplicate',
  'comment.add',
  'attach.add',
  'time.add',
  'client.approve',
  'client.changes',
  'client.comment',
  'outbox.weekly',
  'automation.set',
  'automation.tick',
]);

export function DemoProvider({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null);
  const [today, setToday] = useState<ISODate>('');
  const [section, setSectionState] = useState<SectionId>('project');
  const [view, setViewState] = useState<ViewId>('kanban');
  const [clientMode, setClientMode] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [guide, setGuide] = useState<GuideState>({ hidden: false, done: [] });

  // Los datos dependen de la fecha de hoy y de lo guardado en el navegador: se cargan solo en el cliente.
  useEffect(() => {
    let alive = true;
    const d = localToday();
    const saved = load(d);
    setGuide(loadGuide());
    // Los adjuntos se leen de IndexedDB antes de mostrar los datos (con un tope por si el navegador no responde).
    const files = loadFiles(uploadIds(saved));
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 2000));
    Promise.race([files, timeout]).then(() => {
      if (!alive) return;
      const loaded = stripUploads(saved);
      setToday(d);
      setViewState(loaded.prefs.defaultView);
      dispatch({ type: 'load', state: loaded });
      dispatch({ type: 'automation.tick', today: d, now: localNow() });
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!state) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* almacenamiento lleno o bloqueado: la demo sigue funcionando en memoria */
    }
  }, [state]);

  const saveGuide = useCallback((fn: (g: GuideState) => GuideState) => {
    setGuide((g) => {
      const next = fn(g);
      if (next === g) return g;
      try {
        window.localStorage.setItem(GUIDE_KEY, JSON.stringify(next));
      } catch {
        /* sin almacenamiento: se recuerda solo en esta visita */
      }
      return next;
    });
  }, []);

  const markStep = useCallback((s: GuideStep) => saveGuide((g) => (g.done.includes(s) ? g : { ...g, done: [...g.done, s] })), [saveGuide]);
  const setGuideHidden = useCallback((hidden: boolean) => saveGuide((g) => (g.hidden === hidden ? g : { ...g, hidden })), [saveGuide]);

  const act = useCallback(
    (a: DispatchInput) => {
      const full = (STAMPED.has(a.type) ? { ...a, today: localToday(), now: localNow() } : a) as Action;
      dispatch(full);
      const step = stepOf(a);
      if (step) markStep(step);
    },
    [markStep],
  );

  const setSection = useCallback(
    (s: SectionId) => {
      setSectionState(s);
      setClientMode(false);
      setTaskId(null);
      if (s === 'portfolio') markStep('portfolio');
      document.getElementById('gp-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [markStep],
  );

  const setView = useCallback(
    (v: ViewId) => {
      setViewState(v);
      if (v === 'reports') markStep('reports');
    },
    [markStep],
  );

  // El encabezado de la página (fuera del proveedor) pide mostrar la guía: se abre el proyecto y se lleva la vista a ella.
  useEffect(() => {
    const show = () => {
      setGuideHidden(false);
      setSectionState('project');
      setClientMode(false);
      setTaskId(null);
      setTimeout(() => {
        const el = document.getElementById('gp-guide');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.focus({ preventScroll: true });
      }, 60);
    };
    window.addEventListener(SHOW_GUIDE_EVENT, show);
    return () => window.removeEventListener(SHOW_GUIDE_EVENT, show);
  }, [setGuideHidden]);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nada que limpiar */
    }
    void clearFiles();
    const d = localToday();
    setToday(d);
    dispatch({ type: 'reset', base: d });
    dispatch({ type: 'automation.tick', today: d, now: localNow() });
    saveGuide((g) => ({ ...g, done: [] }));
    setTaskId(null);
    setClientMode(false);
    setFilters(EMPTY_FILTERS);
    setSectionState('project');
  }, [saveGuide]);

  const value = useMemo<Ctx | null>(
    () =>
      state && today
        ? {
            state,
            ws: state.workspaces[state.sector],
            today,
            act,
            section,
            setSection,
            view,
            setView,
            clientMode,
            setClientMode,
            taskId,
            openTask: setTaskId,
            filters,
            setFilters,
            reset,
            guideHidden: guide.hidden,
            setGuideHidden,
            guideDone: guide.done,
            markStep,
          }
        : null,
    [state, today, act, section, setSection, view, setView, clientMode, taskId, filters, reset, guide, setGuideHidden, markStep],
  );

  if (!value) return <>{fallback}</>;
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): Ctx {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo fuera de DemoProvider');
  return ctx;
}
