'use client';

/**
 * Usuario vigente según el backend (GET /api/auth/me), para los marcos del
 * panel y del portal.
 *
 * - El rol se lee del servidor (no solo del que guardó el login en el
 *   navegador): si el equipo cambia el rol de la cuenta, el menú se actualiza
 *   sin cerrar sesión (al cargar la página y al volver a la pestaña).
 * - Si el backend no responde (caído, 5xx o una respuesta que no es suya), el
 *   estado es `unavailable`: el marco muestra «Servicio no disponible» con
 *   reintento, en vez de mandar al login como si la sesión fuera inválida.
 * - Solo un 401 del backend significa que hay que iniciar sesión otra vez.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE } from '@/lib/backend-url';
import { authFetch } from '@/lib/auth-token';

export interface SessionUserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string | null;
  company?: string | null;
  provider?: string;
  accountStatus?: string;
  avatar?: string | null;
  notificationPrefs?: { email: Record<string, boolean> };
}

export type SessionState =
  | { status: 'loading'; user: null }
  | { status: 'ok'; user: SessionUserInfo }
  | { status: 'unavailable'; user: null }
  | { status: 'unauthenticated'; user: null };

/** Vuelve a consultar el rol al volver a la pestaña, como mucho cada 30 s. */
const REFRESH_ON_FOCUS_MS = 30_000;

function storeUser(user: SessionUserInfo): void {
  try {
    const prev = JSON.parse(localStorage.getItem('user') || 'null') as Record<string, unknown> | null;
    localStorage.setItem('user', JSON.stringify({ ...(prev ?? {}), id: user.id, email: user.email, name: user.name, role: user.role }));
  } catch {
    /* almacenamiento no disponible */
  }
}

export async function fetchSessionUser(): Promise<SessionState> {
  let res: Response;
  try {
    res = await authFetch(`${API_BASE}/auth/me`, { cache: 'no-store', headers: { Accept: 'application/json' } });
  } catch {
    return { status: 'unavailable', user: null };
  }
  if (res.status === 401) return { status: 'unauthenticated', user: null };
  if (!res.ok) return { status: 'unavailable', user: null };
  try {
    const json = (await res.json()) as { success?: boolean; data?: SessionUserInfo & { id?: string } };
    const data = json?.data;
    if (!data?.id || !data.role) return { status: 'unavailable', user: null };
    const user = { ...data, id: String(data.id) };
    storeUser(user);
    return { status: 'ok', user };
  } catch {
    return { status: 'unavailable', user: null };
  }
}

export function useSessionUser(): { state: SessionState; reload: () => void } {
  const [state, setState] = useState<SessionState>({ status: 'loading', user: null });
  const lastFetch = useRef(0);

  const load = useCallback(async (silent: boolean) => {
    lastFetch.current = Date.now();
    if (!silent) setState({ status: 'loading', user: null });
    const next = await fetchSessionUser();
    // Una falla momentánea al volver a la pestaña no tumba una sesión que ya cargó.
    setState((prev) => (silent && prev.status === 'ok' && next.status === 'unavailable' ? prev : next));
  }, []);

  useEffect(() => {
    void load(false);
    const onFocus = () => {
      if (Date.now() - lastFetch.current > REFRESH_ON_FOCUS_MS) void load(true);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const reload = useCallback(() => void load(false), [load]);
  return { state, reload };
}

/** URL del login que vuelve a la página actual después de iniciar sesión. */
export function loginUrlForCurrentPage(): string {
  if (typeof window === 'undefined') return '/login';
  const path = `${window.location.pathname}${window.location.search}`;
  return `/login?redirect=${encodeURIComponent(path)}`;
}
