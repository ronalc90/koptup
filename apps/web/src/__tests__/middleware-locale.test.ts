/**
 * @jest-environment node
 *
 * Idioma por URL y guardia de sesión en src/middleware.ts:
 *  - las páginas públicas, en español o en /en, siguen su camino sin pedir sesión;
 *  - las áreas privadas redirigen al login del mismo idioma.
 */
import { NextRequest } from 'next/server';

async function loadMiddleware() {
  let mod: typeof import('@/middleware') | undefined;
  jest.isolateModules(() => {
    mod = require('@/middleware');
  });
  return mod!.middleware;
}

function request(path: string) {
  return new NextRequest(`http://localhost:3300${path}`);
}

function rewriteOf(res: Response): URL | null {
  const value = res.headers.get('x-middleware-rewrite');
  return value ? new URL(value) : null;
}

describe('middleware: idioma por URL', () => {
  const realFetch = global.fetch;
  beforeEach(() => {
    global.fetch = jest.fn(async () => {
      throw new Error('sin backend en esta prueba');
    }) as unknown as typeof fetch;
  });
  afterEach(() => {
    global.fetch = realFetch;
  });

  it.each(['/about', '/en/about', '/services', '/en/services', '/', '/en'])('página pública %s pasa sin sesión', async (path) => {
    const middleware = await loadMiddleware();
    const res = await middleware(request(path));
    expect(res.headers.get('location')).toBeNull();
    expect(res.status).not.toBe(307);
    expect(res.headers.get('x-middleware-next') === '1' || rewriteOf(res) !== null).toBe(true);
  });

  it('en español la reescritura lleva /es', async () => {
    const middleware = await loadMiddleware();
    const res = await middleware(request('/about'));
    expect(rewriteOf(res)?.pathname).toBe('/es/about');
  });

  it('en inglés la reescritura conserva /en', async () => {
    const middleware = await loadMiddleware();
    const res = await middleware(request('/en/about'));
    expect(rewriteOf(res)?.pathname).toBe('/en/about');
  });

  it('/admin sin sesión va al login en español', async () => {
    const middleware = await loadMiddleware();
    const res = await middleware(request('/admin'));
    const location = new URL(res.headers.get('location')!);
    expect(location.pathname).toBe('/login');
    expect(location.searchParams.get('redirect')).toBe('/admin');
  });

  it('/en/admin sin sesión va al login en inglés', async () => {
    const middleware = await loadMiddleware();
    const res = await middleware(request('/en/admin'));
    const location = new URL(res.headers.get('location')!);
    expect(location.pathname).toBe('/en/login');
    expect(location.searchParams.get('redirect')).toBe('/en/admin');
  });

  it('/en/dashboard sin sesión va al login en inglés', async () => {
    const middleware = await loadMiddleware();
    const res = await middleware(request('/en/dashboard/demos'));
    const location = new URL(res.headers.get('location')!);
    expect(location.pathname).toBe('/en/login');
  });
});
