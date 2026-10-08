'use client';

/**
 * Estado de la demo en el navegador: reducer + persistencia en localStorage
 * (los cambios sobreviven a recargar la página durante 7 días; después se
 * regeneran los datos de ejemplo con la fecha nueva).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { diffDays, localNow, localToday } from './dates';
import { reducer, type Action } from './reducer';
import { buildState, STATE_VERSION } from './seed';
import { EMPTY_FILTERS, type AppState, type Filters, type ISODate, type ISODateTime, type SectionId, type ViewId, type Workspace } from './types';

const STORAGE_KEY = 'koptup.gestion-proyectos.state';
const MAX_AGE_DAYS = 7;

/** Archivos que subiste en esta sesión (no se guardan: viven solo en memoria). */
export const uploadedFiles = new Map<string, File>();

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

/** Quita los adjuntos subidos en una sesión anterior (el archivo ya no existe). */
function stripUploads(s: AppState): AppState {
  const clean = (ws: Workspace): Workspace => ({
    ...ws,
    tasks: ws.tasks.map((t) => (t.attachments.some((a) => a.source === 'upload' && !uploadedFiles.has(a.id)) ? { ...t, attachments: t.attachments.filter((a) => a.source !== 'upload' || uploadedFiles.has(a.id)) } : t)),
  });
  return { ...s, workspaces: { construccion: clean(s.workspaces.construccion), agencia: clean(s.workspaces.agencia), software: clean(s.workspaces.software) } };
}

type Stamped<A> = A extends { now: ISODateTime; today: ISODate } ? Omit<A, 'now' | 'today'> : A;
export type DispatchInput = Stamped<Action>;

interface Ctx {
  state: AppState;
  ws: Workspace;
  today: ISODate;
  /** Despacha una acción agregando "hoy" y "ahora" del navegador cuando hace falta. */
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
  const [view, setView] = useState<ViewId>('kanban');
  const [clientMode, setClientMode] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  // Los datos dependen de la fecha local y de localStorage: se cargan solo en el cliente.
  useEffect(() => {
    const d = localToday();
    const loaded = stripUploads(load(d));
    setToday(d);
    setView(loaded.prefs.defaultView);
    dispatch({ type: 'load', state: loaded });
    dispatch({ type: 'automation.tick', today: d, now: localNow() });
  }, []);

  useEffect(() => {
    if (!state) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* almacenamiento lleno o bloqueado: la demo sigue funcionando en memoria */
    }
  }, [state]);

  const act = useCallback((a: DispatchInput) => {
    const full = (STAMPED.has(a.type) ? { ...a, today: localToday(), now: localNow() } : a) as Action;
    dispatch(full);
  }, []);

  const setSection = useCallback((s: SectionId) => {
    setSectionState(s);
    setClientMode(false);
    setTaskId(null);
    document.getElementById('gp-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nada que limpiar */
    }
    uploadedFiles.clear();
    const d = localToday();
    setToday(d);
    dispatch({ type: 'reset', base: d });
    dispatch({ type: 'automation.tick', today: d, now: localNow() });
    setTaskId(null);
    setClientMode(false);
    setFilters(EMPTY_FILTERS);
    setSectionState('project');
  }, []);

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
          }
        : null,
    [state, today, act, section, setSection, view, clientMode, taskId, filters, reset],
  );

  if (!value) return <>{fallback}</>;
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): Ctx {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo fuera de DemoProvider');
  return ctx;
}
