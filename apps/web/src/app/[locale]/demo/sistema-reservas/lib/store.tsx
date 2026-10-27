'use client';

/**
 * Estado de la demo en el navegador: reducer + localStorage. Lo que reservas o
 * cambias se conserva al recargar durante 7 días; después se regeneran los
 * datos de ejemplo con la fecha nueva.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { bogotaNow, diffDays, type Now } from './dates';
import { BUSINESSES } from './presets';
import { reducer, type Action } from './reducer';
import { buildState, STATE_VERSION } from './seed';
import type { AppState, Business, PresetData, PresetId } from './types';

const STORAGE_KEY = 'koptup.sistema-reservas.state';
const MAX_AGE_DAYS = 7;

function load(now: Now): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      const age = diffDays(parsed.baseDate, now.date);
      if (parsed.version === STATE_VERSION && age >= 0 && age <= MAX_AGE_DAYS && parsed.data?.odontologia) return parsed;
    }
  } catch {
    /* sin almacenamiento disponible: se usan datos nuevos */
  }
  return buildState(now.date, now.minutes);
}

type Stamped<A> = A extends { at: string } ? Omit<A, 'at'> : A;
export type ActInput = Stamped<Exclude<Action, { type: 'load' }>>;

interface Ctx {
  state: AppState;
  now: Now;
  biz: Business;
  data: PresetData;
  act: (a: ActInput) => void;
  setPreset: (p: PresetId) => void;
  reset: () => void;
}

const StoreContext = createContext<Ctx | null>(null);

export function ReservasProvider({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null);
  const [now, setNow] = useState<Now | null>(null);

  // La fecha y la hora de Bogotá y localStorage solo existen en el navegador.
  useEffect(() => {
    const n = bogotaNow();
    setNow(n);
    dispatch({ type: 'load', state: load(n) });
    const timer = window.setInterval(() => setNow(bogotaNow()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!state) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* almacenamiento lleno o bloqueado: la demo sigue en memoria */
    }
  }, [state]);

  const act = useCallback((a: ActInput) => {
    dispatch({ ...a, at: bogotaNow().stamp } as Action);
  }, []);

  const setPreset = useCallback((preset: PresetId) => dispatch({ type: 'preset', preset }), []);

  const reset = useCallback(() => {
    const n = bogotaNow();
    setNow(n);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nada que borrar */
    }
    dispatch({ type: 'load', state: buildState(n.date, n.minutes) });
  }, []);

  const value = useMemo<Ctx | null>(() => {
    if (!state || !now) return null;
    return { state, now, biz: BUSINESSES[state.preset], data: state.data[state.preset], act, setPreset, reset };
  }, [state, now, act, setPreset, reset]);

  if (!value) return <>{fallback}</>;
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useReservas(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useReservas fuera de ReservasProvider');
  return ctx;
}
