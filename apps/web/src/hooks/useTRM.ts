/**
 * Hook React para consumir la TRM USD/COP en vivo desde `/api/trm`.
 *
 * Estrategia:
 *   1. En el primer render se hidrata desde `localStorage` si hay un valor
 *      cacheado de menos de 6 horas (evita parpadeo y trabaja offline).
 *   2. En background dispara `fetch('/api/trm')` para refrescar.
 *   3. Guarda el resultado fresco en `localStorage` para la próxima visita.
 *
 * Estado:
 *   - `loading`: la primera respuesta todavía no llegó (y no había caché).
 *   - `source`: 'live' (API), 'cached' (localStorage fresco) o 'fallback'.
 */

'use client';

import { useEffect, useState } from 'react';

export type TRMSource = 'live' | 'fallback' | 'cached';

export interface TRMState {
  rate: number;
  loading: boolean;
  source: TRMSource;
  updatedAt: string | null;
}

interface TRMApiResponse {
  rate: number;
  updatedAt: string;
  source: string;
  provider?: string;
}

interface CachedTRM {
  rate: number;
  updatedAt: string;
  ts: number;
}

const FALLBACK_RATE = 4000;
const STORAGE_KEY = 'koptup.trm.v1';
const STORAGE_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas

function readCache(): CachedTRM | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedTRM;
    if (
      typeof parsed?.rate !== 'number' ||
      typeof parsed?.updatedAt !== 'string' ||
      typeof parsed?.ts !== 'number'
    ) {
      return null;
    }
    if (Date.now() - parsed.ts > STORAGE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(rate: number, updatedAt: string): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: CachedTRM = { rate, updatedAt, ts: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage puede fallar en modo privado o por cuota; lo ignoramos.
  }
}

export function useTRM(): TRMState {
  const [state, setState] = useState<TRMState>({
    rate: FALLBACK_RATE,
    loading: true,
    source: 'fallback',
    updatedAt: null,
  });

  useEffect(() => {
    let cancelled = false;

    const cached = readCache();
    if (cached) {
      setState({
        rate: cached.rate,
        loading: false,
        source: 'cached',
        updatedAt: cached.updatedAt,
      });
    }

    fetch('/api/trm', { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(`TRM HTTP ${r.status}`);
        return r.json() as Promise<TRMApiResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        const source: TRMSource = data.source === 'live' ? 'live' : 'fallback';
        setState({
          rate: data.rate,
          loading: false,
          source,
          updatedAt: data.updatedAt,
        });
        if (source === 'live') writeCache(data.rate, data.updatedAt);
      })
      .catch(() => {
        if (cancelled) return;
        setState((s) => ({ ...s, loading: false }));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
