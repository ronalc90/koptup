import { NextRequest, NextResponse } from 'next/server';
import { API_BASE } from '@/lib/backend-url';
import { ADMIN_PANEL_ROLES, STAFF_ROLES, hasRole } from '@/lib/auth-roles';

/**
 * Guardia del lado del servidor para las áreas privadas de la web.
 *
 * Antes de servir /admin, /dashboard, /liquidacion o /test, verifica la sesión
 * con el backend (`GET /api/auth/me`, que lee el usuario y su rol vigente de la
 * base de datos) usando la cookie `accessToken` que deja el login. Si el token
 * venció pero hay `refreshToken`, lo renueva y deja la cookie nueva.
 *
 *  - Sin sesión válida → /login?redirect=<ruta> (el login vuelve a la ruta).
 *  - Sin el rol necesario → /dashboard (o / si la ruta era el dashboard).
 *  - Backend sin respuesta → 503 (falla cerrada: no se sirve la página).
 *
 * Es una barrera adicional a la del cliente (AdminLayout, DashboardLayout) y
 * a la del backend, que vuelve a autorizar cada endpoint.
 */

export const config = {
  matcher: ['/admin', '/admin/:path*', '/dashboard', '/dashboard/:path*', '/liquidacion', '/liquidacion/:path*', '/test'],
};

type Area = { roles: readonly string[] | 'any' };

function areaFor(pathname: string): Area {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return { roles: ADMIN_PANEL_ROLES };
  if (pathname === '/liquidacion' || pathname.startsWith('/liquidacion/')) return { roles: STAFF_ROLES };
  if (pathname === '/test') return { roles: ['admin'] };
  return { roles: 'any' };
}

const ACCESS_COOKIE = 'accessToken';
const REFRESH_COOKIE = 'refreshToken';
const ACCESS_COOKIE_MAX_AGE = 15 * 60;
const BACKEND_TIMEOUT_MS = 5000;

type MeResult =
  | { status: 'ok'; user: { id: string; email: string; role: string } }
  | { status: 'unauthorized' }
  | { status: 'error' };

/**
 * Cabeceras para que el backend sepa la IP del visitante (las peticiones del
 * middleware salen desde el servidor de la web). Solo si INTERNAL_API_KEY está
 * configurada igual en la web y en el backend.
 */
function forwardHeaders(req: NextRequest): Record<string, string> {
  const internalKey = process.env.INTERNAL_API_KEY;
  const ip = req.ip || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip');
  return internalKey && ip ? { 'X-Internal-Key': internalKey, 'X-Client-IP': ip } : {};
}

/**
 * Caché corta (por instancia) de sesiones ya verificadas: una página del
 * portal dispara varias peticiones (la navegación y los prefetch de sus
 * enlaces) y no hace falta consultar al backend en cada una. El backend vuelve
 * a autorizar cada endpoint con el rol vigente.
 */
const ME_CACHE_TTL_MS = 30_000;
const ME_CACHE_MAX = 500;
const meCache = new Map<string, { user: { id: string; email: string; role: string }; expires: number }>();

function cachedMe(token: string): MeResult | null {
  const hit = meCache.get(token);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    meCache.delete(token);
    return null;
  }
  return { status: 'ok', user: hit.user };
}

function rememberMe(token: string, user: { id: string; email: string; role: string }): void {
  if (meCache.size >= ME_CACHE_MAX) {
    const oldest = meCache.keys().next().value;
    if (oldest !== undefined) meCache.delete(oldest);
  }
  meCache.set(token, { user, expires: Date.now() + ME_CACHE_TTL_MS });
}

async function fetchMe(token: string, extra: Record<string, string>): Promise<MeResult> {
  const cached = cachedMe(token);
  if (cached) return cached;
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...extra, Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });
    if (res.status === 401 || res.status === 403 || res.status === 404) return { status: 'unauthorized' };
    if (!res.ok) return { status: 'error' };
    const json = (await res.json()) as { data?: { id?: string; email?: string; role?: string } };
    const user = json?.data;
    if (!user?.id || !user.role) return { status: 'unauthorized' };
    const verified = { id: String(user.id), email: String(user.email ?? ''), role: user.role };
    rememberMe(token, verified);
    return { status: 'ok', user: verified };
  } catch {
    return { status: 'error' };
  }
}

async function refreshAccessToken(refreshToken: string, extra: Record<string, string>): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { ...extra, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { accessToken?: string } };
    return json?.data?.accessToken ?? null;
  } catch {
    return null;
  }
}

function redirectToLogin(req: NextRequest): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  url.searchParams.set('redirect', `${req.nextUrl.pathname}${req.nextUrl.search}`);
  const res = NextResponse.redirect(url);
  res.cookies.delete(ACCESS_COOKIE);
  return res;
}

function unavailable(): NextResponse {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Servicio no disponible | KopTup</title></head><body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;color:#111"><h1 style="font-size:1.25rem">No pudimos verificar tu sesión</h1><p>El servicio no respondió. Intenta de nuevo en unos minutos.</p><p lang="en" style="color:#555">We couldn't verify your session. Please try again in a few minutes.</p><p><a href="/">Volver al inicio</a></p></body></html>`;
  return new NextResponse(html, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Retry-After': '60' },
  });
}

export async function middleware(req: NextRequest) {
  const area = areaFor(req.nextUrl.pathname);
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;

  const extra = forwardHeaders(req);
  let me: MeResult = token ? await fetchMe(token, extra) : { status: 'unauthorized' };
  let renewedToken: string | null = null;
  if (me.status === 'unauthorized' && refreshToken) {
    renewedToken = await refreshAccessToken(refreshToken, extra);
    if (renewedToken) me = await fetchMe(renewedToken, extra);
  }

  if (me.status === 'error') return unavailable();
  if (me.status === 'unauthorized') return redirectToLogin(req);

  if (area.roles !== 'any' && !hasRole(me.user.role, area.roles)) {
    const url = req.nextUrl.clone();
    url.pathname = req.nextUrl.pathname.startsWith('/dashboard') ? '/' : '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('X-Robots-Tag', 'noindex');
  if (renewedToken) {
    res.cookies.set(ACCESS_COOKIE, renewedToken, {
      path: '/',
      maxAge: ACCESS_COOKIE_MAX_AGE,
      sameSite: 'lax',
      secure: req.nextUrl.protocol === 'https:',
    });
  }
  return res;
}
