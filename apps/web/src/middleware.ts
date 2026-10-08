import { NextRequest, NextResponse } from 'next/server';
import { API_BASE } from '@/lib/backend-url';
import { STAFF_ROLES, adminRolesFor, hasRole, homePathForRole, prospectCanAccess } from '@/lib/auth-roles';
import { DEMO_DEFAULTS_BY_SLUG, type DemoAccessMode, isKnownDemoSlug } from '@/lib/demo-access-defaults';

/**
 * Guardia del lado del servidor para las áreas privadas de la web y para las
 * demos que requieren acceso.
 *
 * 1) /admin, /dashboard, /liquidacion y /test: verifica la sesión con el
 *    backend (`GET /api/auth/me`, que lee el usuario y su rol vigente de la
 *    base de datos) usando la cookie `accessToken` que deja el login. Si el
 *    token venció pero hay `refreshToken`, lo renueva y deja la cookie nueva.
 *     - Sin sesión válida → /login?redirect=<ruta> (el login vuelve a la ruta).
 *     - Sin el rol necesario → la página de inicio de su rol.
 *     - Un prospecto solo ve Mis demos y su perfil en el portal.
 *     - Backend sin respuesta → 503 (falla cerrada: no se sirve la página).
 *
 * 2) /demo/<slug> (wiki 04, §10): el modo de acceso de la demo sale del
 *    catálogo del backend (`GET /api/demo-catalog`, caché de 60 s en memoria)
 *    o, si el backend no responde, de la tabla de respaldo
 *    (lib/demo-access-defaults.ts).
 *     - `publico` y activa → pasa sin consultar nada más.
 *     - `solicitud`, `privado` o desactivada → `GET /api/demo-access/<slug>`
 *       con el token de la sesión. Si el backend dice que no (o no responde),
 *       se reescribe a /demo-acceso/<slug>?motivo=… (vista previa, estado y
 *       CTA "Solicitar acceso" o "Iniciar sesión"). La URL no cambia.
 *
 * Es una barrera adicional a la del cliente (AdminLayout, DashboardLayout) y
 * a la del backend, que vuelve a autorizar cada endpoint.
 */

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/liquidacion',
    '/liquidacion/:path*',
    '/test',
    '/demo/:path+',
  ],
};

type Area = { roles: readonly string[] | 'any' };

function areaFor(pathname: string): Area {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return { roles: adminRolesFor(pathname) };
  if (pathname === '/liquidacion' || pathname.startsWith('/liquidacion/')) return { roles: STAFF_ROLES };
  if (pathname === '/test') return { roles: ['admin'] };
  return { roles: 'any' };
}

const ACCESS_COOKIE = 'accessToken';
const REFRESH_COOKIE = 'refreshToken';
const ACCESS_COOKIE_MAX_AGE = 15 * 60;
const BACKEND_TIMEOUT_MS = 5000;
const CATALOG_TIMEOUT_MS = 2500;

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

function setRenewedToken(req: NextRequest, res: NextResponse, token: string | null): void {
  if (!token) return;
  res.cookies.set(ACCESS_COOKIE, token, {
    path: '/',
    maxAge: ACCESS_COOKIE_MAX_AGE,
    sameSite: 'lax',
    secure: req.nextUrl.protocol === 'https:',
  });
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

function redirectTo(req: NextRequest, pathname: string): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  return NextResponse.redirect(url);
}

function unavailable(): NextResponse {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Servicio no disponible | KopTup</title></head><body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;color:#111"><h1 style="font-size:1.25rem">No pudimos verificar tu sesión</h1><p>El servicio no respondió. Intenta de nuevo en unos minutos.</p><p lang="en" style="color:#555">We couldn't verify your session. Please try again in a few minutes.</p><p><a href="/">Volver al inicio</a></p></body></html>`;
  return new NextResponse(html, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Retry-After': '60' },
  });
}

// ---------------------------------------------------------------------------
//   Demos con acceso controlado
// ---------------------------------------------------------------------------

type CatalogModes = Map<string, { accessMode: DemoAccessMode; activo: boolean }>;

/** Caché del catálogo (60 s). Si el backend falla, se reintenta tras 10 s. */
const CATALOG_TTL_MS = 60_000;
const CATALOG_RETRY_MS = 10_000;
let catalogCache: { modes: CatalogModes; fetchedAt: number } | null = null;
let catalogFailedAt = 0;
let catalogInflight: Promise<CatalogModes | null> | null = null;

async function loadCatalog(): Promise<CatalogModes | null> {
  try {
    const res = await fetch(`${API_BASE}/demo-catalog`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(CATALOG_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: Array<{ slug?: string; accessMode?: string; activo?: boolean }> };
    if (!Array.isArray(json?.data)) return null;
    const modes: CatalogModes = new Map();
    for (const item of json.data) {
      if (!item?.slug || !['publico', 'solicitud', 'privado'].includes(String(item.accessMode))) continue;
      modes.set(item.slug, { accessMode: item.accessMode as DemoAccessMode, activo: item.activo !== false });
    }
    return modes;
  } catch {
    return null;
  }
}

/**
 * Modo de acceso de la demo y si viene del backend (`fresh`) o de la tabla de
 * respaldo. Un catálogo viejo (más de 60 s) se sigue usando mientras el
 * backend no responda: es la última decisión conocida del administrador.
 */
async function catalogEntry(slug: string): Promise<{ accessMode: DemoAccessMode; activo: boolean; fresh: boolean }> {
  const now = Date.now();
  const stale = !catalogCache || now - catalogCache.fetchedAt > CATALOG_TTL_MS;
  if (stale && now - catalogFailedAt > CATALOG_RETRY_MS) {
    catalogInflight ??= loadCatalog().finally(() => {
      catalogInflight = null;
    });
    const modes = await catalogInflight;
    if (modes) catalogCache = { modes, fetchedAt: Date.now() };
    else catalogFailedAt = Date.now();
  }
  const fromCatalog = catalogCache?.modes.get(slug);
  if (fromCatalog) return { ...fromCatalog, fresh: true };
  const fallback = DEMO_DEFAULTS_BY_SLUG[slug];
  return { accessMode: fallback?.accessMode ?? 'privado', activo: true, fresh: false };
}

type AccessResult =
  | { status: 'ok'; allowed: boolean; reason: string; accessMode: string | null; expiresAt: string | null }
  | { status: 'expired' }
  | { status: 'not_found' }
  | { status: 'error' };

async function fetchDemoAccess(slug: string, token: string | null, extra: Record<string, string>, prefetch: boolean): Promise<AccessResult> {
  try {
    // En un prefetch de Next no se registra una visita (registrar=0).
    const res = await fetch(`${API_BASE}/demo-access/${encodeURIComponent(slug)}${prefetch ? '?registrar=0' : ''}`, {
      headers: { ...extra, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      cache: 'no-store',
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });
    if (res.status === 401) return { status: 'expired' };
    if (res.status === 404) return { status: 'not_found' };
    if (!res.ok) return { status: 'error' };
    const json = (await res.json()) as {
      data?: { allowed?: boolean; reason?: string; accessMode?: string | null; expiresAt?: string | null };
    };
    const data = json?.data;
    if (!data || typeof data.allowed !== 'boolean') return { status: 'error' };
    return {
      status: 'ok',
      allowed: data.allowed,
      reason: String(data.reason ?? ''),
      accessMode: data.accessMode ?? null,
      expiresAt: data.expiresAt ?? null,
    };
  } catch {
    return { status: 'error' };
  }
}

function isPrefetch(req: NextRequest): boolean {
  return (
    req.headers.get('next-router-prefetch') === '1' ||
    req.headers.get('purpose') === 'prefetch' ||
    req.headers.get('x-middleware-prefetch') === '1'
  );
}

const DENIED = new Set(['sin_sesion', 'sin_acceso', 'expirado', 'revocado', 'desactivada', 'no_disponible']);

/** Muestra la pantalla de acceso de la demo sin cambiar la URL. */
function accessScreen(
  req: NextRequest,
  slug: string,
  info: { motivo: string; modo: DemoAccessMode | string | null; vence?: string | null },
  renewedToken: string | null,
): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = `/demo-acceso/${slug}`;
  url.search = '';
  url.searchParams.set('motivo', DENIED.has(info.motivo) ? info.motivo : 'sin_acceso');
  if (info.modo) url.searchParams.set('modo', String(info.modo));
  if (info.vence) url.searchParams.set('vence', info.vence);
  url.searchParams.set('ruta', `${req.nextUrl.pathname}${req.nextUrl.search}`.slice(0, 300));
  const res = NextResponse.rewrite(url);
  res.headers.set('Cache-Control', 'private, no-store');
  res.headers.set('X-Robots-Tag', 'noindex');
  setRenewedToken(req, res, renewedToken);
  return res;
}

async function demoGate(req: NextRequest): Promise<NextResponse> {
  const slug = req.nextUrl.pathname.split('/')[2]?.toLowerCase() ?? '';
  // Rutas que no son una demo conocida: las resuelve Next (404 si no existen).
  if (!isKnownDemoSlug(slug)) return NextResponse.next();

  const entry = await catalogEntry(slug);
  if (entry.accessMode === 'publico' && entry.activo) return NextResponse.next();

  const token = req.cookies.get(ACCESS_COOKIE)?.value ?? null;
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value ?? null;

  // Sin sesión no hay nada que preguntar: la demo requiere acceso. Si el
  // catálogo no respondió, se dice que no se pudo verificar.
  if (!token && !refreshToken) {
    const motivo = !entry.fresh ? 'no_disponible' : entry.activo ? 'sin_sesion' : 'desactivada';
    return accessScreen(req, slug, { motivo, modo: entry.accessMode }, null);
  }

  const extra = forwardHeaders(req);
  const prefetch = isPrefetch(req);
  let renewedToken: string | null = null;
  let result: AccessResult = token ? await fetchDemoAccess(slug, token, extra, prefetch) : { status: 'expired' };
  if (result.status === 'expired' && refreshToken) {
    renewedToken = await refreshAccessToken(refreshToken, extra);
    result = renewedToken ? await fetchDemoAccess(slug, renewedToken, extra, prefetch) : { status: 'expired' };
  }

  if (result.status === 'not_found') return NextResponse.next();
  if (result.status === 'error') {
    return accessScreen(req, slug, { motivo: 'no_disponible', modo: entry.accessMode }, renewedToken);
  }
  if (result.status === 'expired') {
    // La sesión venció y no se pudo renovar: se pide iniciar sesión otra vez.
    return accessScreen(req, slug, { motivo: entry.activo ? 'sin_sesion' : 'desactivada', modo: entry.accessMode }, null);
  }
  if (!result.allowed) {
    return accessScreen(
      req,
      slug,
      { motivo: result.reason, modo: result.accessMode ?? entry.accessMode, vence: result.reason === 'expirado' ? result.expiresAt : null },
      renewedToken,
    );
  }

  const res = NextResponse.next();
  // Una demo con acceso controlado no se guarda en cachés compartidas ni se indexa.
  res.headers.set('Cache-Control', 'private, no-store');
  res.headers.set('X-Robots-Tag', 'noindex');
  setRenewedToken(req, res, renewedToken);
  return res;
}

// ---------------------------------------------------------------------------

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/demo/')) return demoGate(req);

  const area = areaFor(pathname);
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

  const role = me.user.role;
  if (area.roles !== 'any' && !hasRole(role, area.roles)) {
    const home = homePathForRole(role);
    const res = redirectTo(req, home === pathname ? '/' : home);
    setRenewedToken(req, res, renewedToken);
    return res;
  }
  // Un prospecto (cuenta creada al aprobar una demo) solo ve Mis demos y su perfil.
  if (role === 'prospect' && (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) && !prospectCanAccess(pathname)) {
    const res = redirectTo(req, '/dashboard/demos');
    setRenewedToken(req, res, renewedToken);
    return res;
  }

  const res = NextResponse.next();
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('X-Robots-Tag', 'noindex');
  setRenewedToken(req, res, renewedToken);
  return res;
}
