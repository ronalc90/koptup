/**
 * @jest-environment node
 *
 * Páginas públicas dentro de una demo con acceso controlado: la verificación
 * del certificado del LMS (/demo/lms/verificar, lo que abre el QR) la puede
 * abrir cualquiera, aunque el LMS requiera acceso. El resto del LMS sigue
 * mostrando la pantalla de acceso a quien no lo tiene.
 */
import { NextRequest } from 'next/server';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const CATALOG = { success: true, data: [{ slug: 'lms', accessMode: 'solicitud', activo: true }] };

let calls: string[] = [];

async function loadMiddleware() {
  let mod: typeof import('@/middleware') | undefined;
  jest.isolateModules(() => {
    mod = require('@/middleware');
  });
  return mod!.middleware;
}

const request = (path: string) => new NextRequest(`http://localhost:3300${path}`);

function rewriteOf(res: Response): URL | null {
  const value = res.headers.get('x-middleware-rewrite');
  return value ? new URL(value) : null;
}

/** Sin bloqueo: next-intl solo reescribe la ruta a su idioma (/es/…, /en/…). */
function passed(res: Response): boolean {
  if (res.headers.get('x-middleware-next') === '1') return true;
  const target = rewriteOf(res);
  return !!target && /^\/(es|en)\/(?!demo-acceso\/)/.test(target.pathname);
}

describe('middleware: páginas públicas dentro de una demo con acceso', () => {
  const realFetch = global.fetch;
  beforeEach(() => {
    calls = [];
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      calls.push(String(input));
      return String(input).endsWith('/demo-catalog') ? json(CATALOG) : json({}, 500);
    }) as unknown as typeof fetch;
  });
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('/demo/lms/verificar pasa sin sesión, sin consultar el acceso y sin indexarse', async () => {
    const middleware = await loadMiddleware();
    for (const path of ['/demo/lms/verificar', '/demo/lms/verificar/', '/demo/lms/verificar?d=abc']) {
      const res = await middleware(request(path));
      expect(passed(res)).toBe(true);
      expect(rewriteOf(res)?.pathname).toBe('/es/demo/lms/verificar');
      expect(res.headers.get('x-robots-tag')).toBe('noindex');
    }
    expect(calls.some((c) => c.includes('/demo-access/'))).toBe(false);
  });

  it('el resto del LMS sigue pidiendo acceso', async () => {
    const middleware = await loadMiddleware();
    for (const path of ['/demo/lms', '/demo/lms/verificar-otra', '/demo/lms/curso/verificar']) {
      const target = new URL((await middleware(request(path))).headers.get('x-middleware-rewrite')!);
      expect(target.pathname).toBe('/es/demo-acceso/lms');
      expect(target.searchParams.get('motivo')).toBe('sin_sesion');
    }
  });
});
