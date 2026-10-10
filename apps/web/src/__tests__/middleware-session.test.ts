/**
 * @jest-environment node
 *
 * Sesión del panel y del portal en el middleware de Next (src/middleware.ts),
 * con el backend simulado (fetch):
 *  - con el backend caído o respondiendo algo que no es suyo (404 de la
 *    plataforma), /admin y /dashboard muestran «servicio no disponible» (503)
 *    en vez de mandar al login;
 *  - solo un 401 manda al login, conservando la ruta de regreso;
 *  - el rol se lee del backend en cada visita (caché corta de 10 s).
 */
import { NextRequest } from 'next/server';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function mockBackend(route: (url: string) => Response | Promise<Response>) {
  global.fetch = jest.fn(async (input: RequestInfo | URL) => route(String(input))) as unknown as typeof fetch;
}

async function loadMiddleware() {
  let mod: typeof import('@/middleware') | undefined;
  jest.isolateModules(() => {
    mod = require('@/middleware');
  });
  return mod!.middleware;
}

function request(path: string, cookies: Record<string, string> = {}) {
  const cookie = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
  return new NextRequest(`http://localhost:3300${path}`, { headers: cookie ? { cookie } : {} });
}

describe('middleware: sesión de /admin y /dashboard', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('backend que responde 404 (plataforma sin la app): 503 «servicio no disponible», no el login', async () => {
    mockBackend(() => new Response('Application not found', { status: 404 }));
    const middleware = await loadMiddleware();
    const res = await middleware(request('/admin/orders', { accessToken: 'tok' }));
    expect(res.status).toBe(503);
    expect(res.headers.get('location')).toBeNull();
    expect(await res.text()).toMatch(/No pudimos verificar tu sesión/);
  });

  it('backend caído (sin respuesta): 503', async () => {
    mockBackend(() => {
      throw new TypeError('fetch failed');
    });
    const middleware = await loadMiddleware();
    const res = await middleware(request('/dashboard/billing', { accessToken: 'tok' }));
    expect(res.status).toBe(503);
  });

  it('401 del backend: login con la ruta de regreso (incluidos sus parámetros)', async () => {
    mockBackend((url) => (url.endsWith('/auth/me') ? json({ success: false, code: 'invalid_token' }, 401) : json({}, 500)));
    const middleware = await loadMiddleware();
    const res = await middleware(request('/dashboard/messages?c=CONV-0001', { accessToken: 'tok' }));
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get('location') as string);
    expect(location.pathname).toBe('/login');
    expect(location.searchParams.get('redirect')).toBe('/dashboard/messages?c=CONV-0001');
  });

  it('sin cookies: login con la ruta de regreso, sin consultar al backend', async () => {
    mockBackend(() => json({}, 500));
    const middleware = await loadMiddleware();
    const res = await middleware(request('/dashboard/orders'));
    expect(new URL(res.headers.get('location') as string).searchParams.get('redirect')).toBe('/dashboard/orders');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('el rol vigente del backend decide (un cliente no entra al panel)', async () => {
    mockBackend((url) => (url.endsWith('/auth/me') ? json({ success: true, data: { id: 'u1', email: 'c@x.test', role: 'client' } }) : json({}, 500)));
    const middleware = await loadMiddleware();
    const res = await middleware(request('/admin', { accessToken: 'tok' }));
    expect(new URL(res.headers.get('location') as string).pathname).toBe('/dashboard');
  });
});
