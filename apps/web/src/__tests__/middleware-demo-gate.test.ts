/**
 * @jest-environment node
 *
 * Control de acceso a /demo/<slug> en el middleware de Next (src/middleware.ts),
 * con el backend simulado (fetch). Verifica que:
 *  - una demo abierta pasa sin consultar el acceso;
 *  - una demo que requiere acceso, sin sesión, muestra /demo-acceso (rewrite);
 *  - con sesión decide el backend (permitido → pasa; denegado → motivo);
 *  - si el backend no responde: las abiertas (según la semilla) pasan y las
 *    demás muestran la pantalla de acceso con «no_disponible»;
 *  - un token vencido se renueva con el refresh token.
 */
import { NextRequest } from 'next/server';

type Route = (url: string, init?: RequestInit) => Response | Promise<Response>;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const CATALOG = {
  success: true,
  data: [
    { slug: 'chatbot', accessMode: 'publico', activo: true },
    { slug: 'erp', accessMode: 'solicitud', activo: true },
    { slug: 'ecommerce', accessMode: 'publico', activo: true },
    { slug: 'crm-ia', accessMode: 'publico', activo: false },
    { slug: 'cuentas-medicas', accessMode: 'privado', activo: true },
  ],
};

let calls: string[] = [];

function mockBackend(route: Route) {
  calls = [];
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push(`${init?.method ?? 'GET'} ${url} ${(init?.headers as Record<string, string> | undefined)?.Authorization ?? ''}`.trim());
    return route(url, init);
  }) as unknown as typeof fetch;
}

async function loadMiddleware() {
  let mod: typeof import('@/middleware') | undefined;
  jest.isolateModules(() => {
    mod = require('@/middleware');
  });
  return mod!.middleware;
}

function request(path: string, cookies: Record<string, string> = {}, headers: Record<string, string> = {}) {
  const cookie = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
  return new NextRequest(`http://localhost:3300${path}`, { headers: { ...(cookie ? { cookie } : {}), ...headers } });
}

function rewriteOf(res: Response): URL | null {
  const value = res.headers.get('x-middleware-rewrite');
  return value ? new URL(value) : null;
}

describe('middleware: acceso a /demo/<slug>', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('demo abierta: pasa sin consultar demo-access', async () => {
    mockBackend((url) => (url.endsWith('/demo-catalog') ? json(CATALOG) : json({}, 500)));
    const middleware = await loadMiddleware();
    const res = await middleware(request('/demo/ecommerce'));
    expect(res.headers.get('x-middleware-next')).toBe('1');
    expect(rewriteOf(res)).toBeNull();
    expect(calls.some((c) => c.includes('/demo-access/'))).toBe(false);
  });

  it('requiere acceso y no hay sesión: pantalla de acceso con motivo sin_sesion (sin llamar a demo-access)', async () => {
    mockBackend((url) => (url.endsWith('/demo-catalog') ? json(CATALOG) : json({}, 500)));
    const middleware = await loadMiddleware();
    const res = await middleware(request('/demo/erp?tab=finanzas'));
    const target = rewriteOf(res)!;
    expect(target.pathname).toBe('/demo-acceso/erp');
    expect(target.searchParams.get('motivo')).toBe('sin_sesion');
    expect(target.searchParams.get('modo')).toBe('solicitud');
    expect(target.searchParams.get('ruta')).toBe('/demo/erp?tab=finanzas');
    expect(res.headers.get('x-robots-tag')).toBe('noindex');
    expect(calls.some((c) => c.includes('/demo-access/'))).toBe(false);
  });

  it('con sesión y acceso vigente: pasa, sin caché compartida y sin indexar', async () => {
    mockBackend((url) => {
      if (url.endsWith('/demo-catalog')) return json(CATALOG);
      if (url.includes('/demo-access/erp')) return json({ success: true, data: { allowed: true, reason: 'grant', accessMode: 'solicitud', expiresAt: null } });
      return json({}, 500);
    });
    const middleware = await loadMiddleware();
    const res = await middleware(request('/demo/erp', { accessToken: 'tok-1' }));
    expect(res.headers.get('x-middleware-next')).toBe('1');
    expect(res.headers.get('cache-control')).toBe('private, no-store');
    expect(res.headers.get('x-robots-tag')).toBe('noindex');
    expect(calls.some((c) => c.includes('/api/demo-access/erp ') && c.endsWith('Bearer tok-1'))).toBe(true);
  });

  it('con sesión y acceso vencido o revocado: la pantalla de acceso recibe el motivo y la fecha', async () => {
    mockBackend((url) => {
      if (url.endsWith('/demo-catalog')) return json(CATALOG);
      if (url.includes('/demo-access/erp')) return json({ success: true, data: { allowed: false, reason: 'expirado', accessMode: 'solicitud', expiresAt: '2026-10-01T00:00:00.000Z' } });
      if (url.includes('/demo-access/cuentas-medicas')) return json({ success: true, data: { allowed: false, reason: 'revocado', accessMode: 'privado', expiresAt: null } });
      return json({}, 500);
    });
    const middleware = await loadMiddleware();
    const expired = rewriteOf(await middleware(request('/demo/erp', { accessToken: 't' })))!;
    expect(expired.searchParams.get('motivo')).toBe('expirado');
    expect(expired.searchParams.get('vence')).toBe('2026-10-01T00:00:00.000Z');
    const revoked = rewriteOf(await middleware(request('/demo/cuentas-medicas', { accessToken: 't' })))!;
    expect(revoked.pathname).toBe('/demo-acceso/cuentas-medicas');
    expect(revoked.searchParams.get('motivo')).toBe('revocado');
    expect(revoked.searchParams.get('modo')).toBe('privado');
  });

  it('demo abierta pero desactivada: consulta el acceso (el equipo entra) y al visitante le dice «en mantenimiento»', async () => {
    mockBackend((url) => (url.endsWith('/demo-catalog') ? json(CATALOG) : json({}, 500)));
    const middleware = await loadMiddleware();
    const target = rewriteOf(await middleware(request('/demo/crm-ia')))!;
    expect(target.searchParams.get('motivo')).toBe('desactivada');
  });

  it('backend caído: las abiertas según la semilla pasan; las demás → no_disponible', async () => {
    mockBackend(() => {
      throw new Error('ECONNREFUSED');
    });
    const middleware = await loadMiddleware();
    expect((await middleware(request('/demo/chatbot'))).headers.get('x-middleware-next')).toBe('1');
    const anon = rewriteOf(await middleware(request('/demo/erp')))!;
    expect(anon.searchParams.get('motivo')).toBe('no_disponible');
    const withSession = rewriteOf(await middleware(request('/demo/erp', { accessToken: 't' })))!;
    expect(withSession.searchParams.get('motivo')).toBe('no_disponible');
  });

  it('token vencido: lo renueva con el refresh token, decide con el nuevo y deja la cookie', async () => {
    mockBackend((url, init) => {
      if (url.endsWith('/demo-catalog')) return json(CATALOG);
      if (url.endsWith('/auth/refresh')) return json({ success: true, data: { accessToken: 'tok-nuevo' } });
      if (url.includes('/demo-access/erp')) {
        const auth = (init?.headers as Record<string, string>)?.Authorization;
        return auth === 'Bearer tok-nuevo'
          ? json({ success: true, data: { allowed: true, reason: 'grant', accessMode: 'solicitud' } })
          : json({ success: false, code: 'TOKEN_EXPIRED' }, 401);
      }
      return json({}, 500);
    });
    const middleware = await loadMiddleware();
    const res = await middleware(request('/demo/erp', { accessToken: 'tok-viejo', refreshToken: 'r1' }));
    expect(res.headers.get('x-middleware-next')).toBe('1');
    expect(res.headers.get('set-cookie')).toContain('accessToken=tok-nuevo');
  });

  it('prefetch de Next: consulta con registrar=0 (no cuenta como visita)', async () => {
    mockBackend((url) => {
      if (url.endsWith('/demo-catalog')) return json(CATALOG);
      if (url.includes('/demo-access/erp')) return json({ success: true, data: { allowed: true, reason: 'grant', accessMode: 'solicitud' } });
      return json({}, 500);
    });
    const middleware = await loadMiddleware();
    await middleware(request('/demo/erp', { accessToken: 't' }, { 'next-router-prefetch': '1' }));
    expect(calls.some((c) => c.includes('/demo-access/erp?registrar=0'))).toBe(true);
  });

  it('el catálogo se guarda 60 s: dos visitas seguidas hacen una sola consulta', async () => {
    mockBackend((url) => (url.endsWith('/demo-catalog') ? json(CATALOG) : json({}, 500)));
    const middleware = await loadMiddleware();
    await middleware(request('/demo/ecommerce'));
    await middleware(request('/demo/erp'));
    expect(calls.filter((c) => c.includes('/demo-catalog'))).toHaveLength(1);
  });

  it('una ruta que no es una demo conocida no se toca', async () => {
    mockBackend(() => json({}, 500));
    const middleware = await loadMiddleware();
    const res = await middleware(request('/demo/no-existe'));
    expect(res.headers.get('x-middleware-next')).toBe('1');
    expect(calls).toHaveLength(0);
  });
});

describe('middleware: portal y panel por rol', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  function meAs(role: string) {
    mockBackend((url) => (url.endsWith('/auth/me') ? json({ success: true, data: { id: 'u1', email: 'p@x.co', role } }) : json({}, 500)));
  }

  it('un prospecto solo entra a Mis demos y a su perfil', async () => {
    meAs('prospect');
    const middleware = await loadMiddleware();
    const billing = await middleware(request('/dashboard/billing', { accessToken: 'a' }));
    expect(billing.headers.get('location')).toBe('http://localhost:3300/dashboard/demos');
    const home = await middleware(request('/dashboard', { accessToken: 'b' }));
    expect(home.headers.get('location')).toBe('http://localhost:3300/dashboard/demos');
    expect((await middleware(request('/dashboard/demos', { accessToken: 'c' }))).headers.get('x-middleware-next')).toBe('1');
    expect((await middleware(request('/dashboard/profile', { accessToken: 'd' }))).headers.get('x-middleware-next')).toBe('1');
  });

  it('sales entra a las secciones comerciales del panel, no al resto', async () => {
    meAs('sales');
    const middleware = await loadMiddleware();
    expect((await middleware(request('/admin/solicitudes', { accessToken: 'e' }))).headers.get('x-middleware-next')).toBe('1');
    expect((await middleware(request('/admin/accesos', { accessToken: 'f' }))).headers.get('x-middleware-next')).toBe('1');
    const users = await middleware(request('/admin/users', { accessToken: 'g' }));
    expect(users.headers.get('location')).toBe('http://localhost:3300/admin/solicitudes');
  });

  it('un prospecto no entra al panel', async () => {
    meAs('prospect');
    const middleware = await loadMiddleware();
    const res = await middleware(request('/admin/solicitudes', { accessToken: 'h' }));
    expect(res.headers.get('location')).toBe('http://localhost:3300/dashboard/demos');
  });
});
