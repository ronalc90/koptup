import jwt from 'jsonwebtoken';
import type { Request } from 'express';
import { generalRateLimitKey, resolveClientIp } from '../../middleware/client-ip';

function fakeReq(opts: { ip?: string; headers?: Record<string, string>; url?: string; body?: unknown }): Request {
  const headers = Object.fromEntries(Object.entries(opts.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    ip: opts.ip ?? '203.0.113.10',
    headers,
    header: (name: string) => headers[name.toLowerCase()],
    originalUrl: opts.url ?? '/api/projects',
    body: opts.body,
  } as unknown as Request;
}

describe('IP del visitante y clave del rate-limit general', () => {
  const prevKey = process.env.INTERNAL_API_KEY;
  afterEach(() => {
    if (prevKey === undefined) delete process.env.INTERNAL_API_KEY;
    else process.env.INTERNAL_API_KEY = prevKey;
  });

  it('sin clave interna, X-Client-IP se ignora (no se puede falsear)', () => {
    delete process.env.INTERNAL_API_KEY;
    expect(resolveClientIp(fakeReq({ headers: { 'X-Client-IP': '1.2.3.4', 'X-Internal-Key': 'x' } }))).toBe('203.0.113.10');
  });

  it('con la clave interna correcta se usa la IP que informa la web', () => {
    process.env.INTERNAL_API_KEY = 'clave-interna-larga-de-prueba';
    expect(resolveClientIp(fakeReq({ headers: { 'X-Client-IP': '1.2.3.4', 'X-Internal-Key': 'clave-interna-larga-de-prueba' } }))).toBe('1.2.3.4');
    expect(resolveClientIp(fakeReq({ headers: { 'X-Client-IP': '1.2.3.4', 'X-Internal-Key': 'otra-clave' } }))).toBe('203.0.113.10');
  });

  it('con un token válido cuenta por usuario; con uno falso, por IP', () => {
    const token = jwt.sign({ id: 'u1', email: 'a@b.c', role: 'user' }, process.env.JWT_SECRET as string);
    expect(generalRateLimitKey(fakeReq({ headers: { Authorization: `Bearer ${token}` } }))).toBe('user:u1');
    const forged = jwt.sign({ id: 'u1', email: 'a@b.c', role: 'user' }, 'otro-secreto');
    expect(generalRateLimitKey(fakeReq({ headers: { Authorization: `Bearer ${forged}` } }))).toBe('ip:203.0.113.10');
  });

  it('en /api/auth/refresh cuenta por sesión de refresco (solo con firma válida)', () => {
    const secret = process.env.JWT_REFRESH_SECRET as string;
    const rtA = jwt.sign({ id: 'u1', email: 'a@b.c' }, secret);
    const rtB = jwt.sign({ id: 'u2', email: 'd@e.f' }, secret);
    const a = generalRateLimitKey(fakeReq({ url: '/api/auth/refresh', body: { refreshToken: rtA } }));
    const b = generalRateLimitKey(fakeReq({ url: '/api/auth/refresh', body: { refreshToken: rtB } }));
    expect(a).toMatch(/^refresh:/);
    expect(a).not.toBe(b);
    // Un valor inventado no abre un cupo nuevo: cuenta por IP.
    expect(generalRateLimitKey(fakeReq({ url: '/api/auth/refresh', body: { refreshToken: 'inventado-1' } }))).toBe('ip:203.0.113.10');
    const forged = jwt.sign({ id: 'u1', email: 'a@b.c' }, 'otro-secreto');
    expect(generalRateLimitKey(fakeReq({ url: '/api/auth/refresh', body: { refreshToken: forged } }))).toBe('ip:203.0.113.10');
  });
});
