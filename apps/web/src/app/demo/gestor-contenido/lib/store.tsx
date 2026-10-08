'use client';

/**
 * Estado de la demo en el navegador: reducer + localStorage (clave
 * `demo:cms:v1`). Los datos se generan después de montar la página, con la
 * hora del navegador, así que el HTML del servidor no tiene fechas (sin
 * errores de hidratación). Cada 5 s se revisan las publicaciones programadas.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { currentUser, reducer, type Action } from './reducer';
import { buildState, STATE_VERSION } from './seed';
import { iso } from './time';
import type { AppState, Locale, Person, Status, ViewId } from './types';

const STORAGE_KEY = 'demo:cms:v1';
const TICK_MS = 5000;

type WithoutNow<A> = A extends { now: string } ? Omit<A, 'now'> : A;
export type ActInput = WithoutNow<Action>;

export interface Toast {
  id: number;
  text: string;
  tone: 'ok' | 'info' | 'warn';
}

interface Ctx {
  state: AppState;
  me: Person;
  act: (a: ActInput) => void;
  view: ViewId;
  go: (v: ViewId) => void;
  editingId: string | null;
  openEntry: (id: string) => void;
  contentLocale: Locale;
  setContentLocale: (l: Locale) => void;
  toasts: Toast[];
  toast: (text: string, tone?: Toast['tone']) => void;
  reset: () => void;
  nowMs: number;
  storageOk: boolean;
  newId: (prefix: string) => string;
  /** Filtro de estado que la vista de entradas aplica al abrirse (desde el inicio). */
  statusPreset: Status | null;
  showEntries: (status: Status | null) => void;
}

const CmsContext = createContext<Ctx | null>(null);

function load(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed && parsed.version === STATE_VERSION && Array.isArray(parsed.entries)) return parsed;
    }
  } catch {
    /* sin almacenamiento: datos nuevos */
  }
  return buildState(Date.now());
}

function rootReducer(state: AppState | null, action: Action): AppState | null {
  if (action.type === 'state.replace') return action.state;
  return state ? reducer(state, action) : state;
}

export function CmsProvider({ children }: { children: ReactNode }) {
  const uiLocale = useLocale();
  const [state, dispatch] = useReducer(rootReducer, null);
  const [view, setView] = useState<ViewId>('home');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contentLocale, setContentLocale] = useState<Locale>(uiLocale === 'en' ? 'en' : 'es');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [nowMs, setNowMs] = useState(0);
  const [storageOk, setStorageOk] = useState(true);
  const [statusPreset, setStatusPreset] = useState<Status | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    const s = load();
    dispatch({ type: 'state.replace', state: s });
    dispatch({ type: 'scheduler.tick', now: iso(Date.now()) });
    setNowMs(Date.now());
    const id = window.setInterval(() => {
      const now = Date.now();
      setNowMs(now);
      dispatch({ type: 'scheduler.tick', now: iso(now) });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!state) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setStorageOk(true);
    } catch {
      setStorageOk(false);
    }
  }, [state]);

  const toast = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = ++seq.current;
    setToasts((t) => [...t.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const act = useCallback((a: ActInput) => {
    dispatch({ ...a, now: iso(Date.now()) } as Action);
  }, []);

  const go = useCallback((v: ViewId) => {
    setView(v);
    setStatusPreset(null);
    if (v !== 'editor') setEditingId(null);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }, []);

  const openEntry = useCallback((id: string) => {
    setEditingId(id);
    setView('editor');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }, []);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nada que borrar */
    }
    dispatch({ type: 'state.replace', state: buildState(Date.now()) });
    setEditingId(null);
    setView('home');
  }, []);

  const showEntries = useCallback((status: Status | null) => {
    setStatusPreset(status);
    setEditingId(null);
    setView('entries');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }, []);

  const newId = useCallback((prefix: string) => `${prefix}-${Date.now().toString(36)}${(++seq.current).toString(36)}`, []);

  const value = useMemo<Ctx | null>(
    () =>
      state
        ? {
            state,
            me: currentUser(state),
            act,
            view,
            go,
            editingId,
            openEntry,
            contentLocale,
            setContentLocale,
            toasts,
            toast,
            reset,
            nowMs,
            storageOk,
            newId,
            statusPreset,
            showEntries,
          }
        : null,
    [state, act, view, go, editingId, openEntry, contentLocale, toasts, toast, reset, nowMs, storageOk, newId, statusPreset, showEntries],
  );

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
}

/** null mientras se cargan los datos (primer render del servidor y del cliente). */
export function useCmsMaybe(): Ctx | null {
  return useContext(CmsContext);
}

export function useCms(): Ctx {
  const c = useContext(CmsContext);
  if (!c) throw new Error('useCms fuera de CmsProvider o antes de cargar los datos');
  return c;
}
