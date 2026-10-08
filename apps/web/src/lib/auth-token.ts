/**
 * Token de sesión para llamadas al backend desde el navegador.
 *
 * El login guarda `accessToken` (15 min) y `refreshToken` (7 días) en cookies
 * del dominio de la web (ver lib/api.ts). Las pantallas que llaman al backend
 * con `fetch` o con su propia instancia de axios usan estas funciones para
 * enviar `Authorization: Bearer <token>` y renovarlo si venció; así, una
 * cuenta con acceso (staff o, desde P4, con la demo concedida) puede usar las
 * APIs protegidas.
 */
import Cookies from 'js-cookie';
import type { AxiosInstance } from 'axios';
import { API_BASE } from './backend-url';

const ACCESS_COOKIE = 'accessToken';
const REFRESH_COOKIE = 'refreshToken';
/** 15 minutos, igual que lib/api.ts. */
const ACCESS_COOKIE_DAYS = 1 / 96;

export function getAccessToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return Cookies.get(ACCESS_COOKIE) || undefined;
}

let refreshing: Promise<string | null> | null = null;

/** Pide un access token nuevo con el refresh token. Devuelve null si no se pudo. */
export function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const refreshToken = Cookies.get(REFRESH_COOKIE);
      if (!refreshToken) return null;
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return null;
      const json = (await res.json().catch(() => null)) as { data?: { accessToken?: string } } | null;
      const token = json?.data?.accessToken;
      if (!token) return null;
      Cookies.set(ACCESS_COOKIE, token, { expires: ACCESS_COOKIE_DAYS });
      return token;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/** Access token vigente: el de la cookie o, si ya expiró, uno renovado. */
export async function getValidAccessToken(): Promise<string | null> {
  const token = getAccessToken();
  if (token) return token;
  if (typeof window !== 'undefined' && Cookies.get(REFRESH_COOKIE)) return refreshAccessToken();
  return null;
}

/** Cabeceras con `Authorization` si hay sesión (más las que se pasen). */
export async function authHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const token = await getValidAccessToken();
  return { ...(extra ?? {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function isExpiredResponseBody(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const b = body as { code?: unknown; message?: unknown };
  return b.code === 'TOKEN_EXPIRED' || b.message === 'Token expired';
}

/**
 * `fetch` con la sesión: agrega `Authorization` y, si el backend responde que
 * el token venció, lo renueva y reintenta una vez.
 */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = await getValidAccessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(input, { ...init, headers });
  if (res.status !== 401 || !token) return res;
  const body = await res.clone().json().catch(() => null);
  if (!isExpiredResponseBody(body)) return res;
  const fresh = await refreshAccessToken();
  if (!fresh) return res;
  headers.set('Authorization', `Bearer ${fresh}`);
  return fetch(input, { ...init, headers });
}

/** Agrega la sesión a una instancia de axios (servicios que no usan lib/api.ts). */
export function withAuth<T extends AxiosInstance>(instance: T): T {
  instance.interceptors.request.use(async (config) => {
    const token = await getValidAccessToken();
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
    return config;
  });
  return instance;
}
