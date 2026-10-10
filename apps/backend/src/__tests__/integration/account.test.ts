/**
 * Sesión y cuenta (integración, supertest + MongoDB + Redis):
 *  - una sesión renovable por dispositivo: dos navegadores conviven, cerrar
 *    sesión en uno no cierra el otro y cambiar la contraseña cierra los demás;
 *  - "Recordarme" sin marcar: sesión de 1 día;
 *  - proveedores de inicio de sesión (Google solo si está configurado) y
 *    Google sin configurar vuelve a /login en vez de dejar un JSON;
 *  - "Olvidé mi contraseña" sin correo configurado: respuesta honesta y sin
 *    emitir enlaces;
 *  - restablecer con un enlace usado, reemplazado o vencido: motivo propio;
 *  - el admin genera un enlace de restablecimiento para compartir (no el
 *    manager, ni para cuentas de Google);
 *  - /api/auth/me de una cuenta borrada responde 401 (no 404).
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import type { Express } from 'express';
import mongoose from 'mongoose';
import { TestUser, bearer, connectTestDb, createUser, describeDbRedis, disconnectTestDb } from './helpers';

describeDbRedis('sesión y cuenta (integración)', () => {
  let app: Express;
  let admin: TestUser;
  let manager: TestUser;
  let n = 0;
  // IP distinta por petición: login y recuperación tienen cupos estrictos por IP.
  const ip = () => `10.88.${Math.floor(n / 250)}.${(n++ % 250) + 1}`;
  const prevGoogle = { id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET };

  beforeAll(async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    await connectTestDb('account');
    const { createApp } = await import('../../app');
    app = createApp();
    admin = await createUser('admin');
    manager = await createUser('manager');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    if (prevGoogle.id !== undefined) process.env.GOOGLE_CLIENT_ID = prevGoogle.id;
    if (prevGoogle.secret !== undefined) process.env.GOOGLE_CLIENT_SECRET = prevGoogle.secret;
    const { getRedisClient } = await import('../../config/redis');
    const client = await getRedisClient().catch(() => null);
    if (client?.isOpen) await client.quit();
    await disconnectTestDb();
  });

  async function localUser(password = 'Clave-segura-123', extra: Record<string, unknown> = {}) {
    const email = `cuenta-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@ejemplo.test`;
    const res = await mongoose.connection.collection('users').insertOne({
      email,
      name: 'Persona Cuenta',
      role: 'client',
      provider: 'local',
      accountStatus: 'activo',
      password: await bcrypt.hash(password, 4),
      phone: '+57 300 000 0000',
      created_at: new Date(),
      updated_at: new Date(),
      ...extra,
    });
    return { id: String(res.insertedId), email, password };
  }

  const login = (email: string, password: string, extra: Record<string, unknown> = {}) =>
    request(app).post('/api/auth/login').set('X-Forwarded-For', ip()).send({ email, password, ...extra });
  const refresh = (refreshToken: string) => request(app).post('/api/auth/refresh').set('X-Forwarded-For', ip()).send({ refreshToken });

  describe('sesiones por dispositivo', () => {
    it('dos navegadores conviven; cerrar sesión en uno no cierra el otro', async () => {
      const u = await localUser();
      const a = (await login(u.email, u.password)).body.data;
      const b = (await login(u.email, u.password)).body.data;
      expect(a.refreshToken).not.toBe(b.refreshToken);
      expect((await refresh(a.refreshToken)).status).toBe(200);
      expect((await refresh(b.refreshToken)).status).toBe(200);

      expect((await request(app).post('/api/auth/logout').set({ Authorization: `Bearer ${a.accessToken}` })).status).toBe(200);
      expect((await refresh(a.refreshToken)).status).toBe(401);
      const stillB = await refresh(b.refreshToken);
      expect(stillB.status).toBe(200);
      // El token renovado conserva la sesión del dispositivo.
      expect((jwt.decode(stillB.body.data.accessToken) as { sid: string }).sid).toBe((jwt.decode(b.refreshToken) as { sid: string }).sid);
    });

    it('cambiar la contraseña cierra las demás sesiones y deja una nueva', async () => {
      const u = await localUser();
      const a = (await login(u.email, u.password)).body.data;
      const b = (await login(u.email, u.password)).body.data;
      const change = await request(app)
        .post('/api/auth/change-password')
        .set({ Authorization: `Bearer ${a.accessToken}`, 'X-Forwarded-For': ip() })
        .send({ currentPassword: u.password, newPassword: 'Otra-clave-456' });
      expect(change.status).toBe(200);
      expect((await refresh(a.refreshToken)).status).toBe(401);
      expect((await refresh(b.refreshToken)).status).toBe(401);
      expect((await refresh(change.body.data.refreshToken)).status).toBe(200);
    });

    it('"Recordarme" sin marcar: sesión de 1 día', async () => {
      const u = await localUser();
      const short = (await login(u.email, u.password, { remember: false })).body.data;
      expect(short).toMatchObject({ remember: false, expiresIn: 86400 });
      const decoded = jwt.decode(short.refreshToken) as { exp: number; iat: number; sid: string };
      expect(decoded.exp - decoded.iat).toBe(86400);
      const { getRedisClient } = await import('../../config/redis');
      const ttl = await (await getRedisClient()).ttl(`refresh_token:${u.id}:${decoded.sid}`);
      expect(ttl).toBeGreaterThan(86400 - 60);
      expect(ttl).toBeLessThanOrEqual(86400);
      const long = (await login(u.email, u.password)).body.data;
      expect(long.remember).toBe(true);
      expect(long.expiresIn).toBeGreaterThan(86400);
    });

    it('un token anterior (sin sesión por dispositivo) sigue sirviendo hasta vencer', async () => {
      const u = await localUser();
      const legacy = jwt.sign({ id: u.id, email: u.email }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: 3600 });
      const { getRedisClient } = await import('../../config/redis');
      await (await getRedisClient()).setEx(`refresh_token:${u.id}`, 3600, legacy);
      expect((await refresh(legacy)).status).toBe(200);
      expect((await refresh(`${legacy}x`)).status).toBe(401);
    });
  });

  describe('proveedores de inicio de sesión', () => {
    it('Google aparece solo si está configurado', async () => {
      const res = await request(app).get('/api/auth/providers');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ google: false, email: true });
    });

    it('Google sin configurar: el navegador vuelve a /login con aviso; la API recibe 503', async () => {
      const browser = await request(app).get('/api/auth/google').set('Accept', 'text/html,application/xhtml+xml');
      expect(browser.status).toBe(302);
      expect(browser.headers.location).toMatch(/\/login\?error=google_not_configured$/);
      const api = await request(app).get('/api/auth/google').set('Accept', 'application/json');
      expect(api.status).toBe(503);
      expect(api.body.code).toBe('google_not_configured');
    });
  });

  describe('recuperar la contraseña', () => {
    it('sin correo configurado: respuesta honesta, igual para cualquier correo, y sin emitir enlaces', async () => {
      const u = await localUser();
      const known = await request(app).post('/api/auth/forgot-password').set('X-Forwarded-For', ip()).send({ email: u.email });
      const unknown = await request(app).post('/api/auth/forgot-password').set('X-Forwarded-For', ip()).send({ email: 'nadie@ejemplo.test' });
      expect(known.status).toBe(200);
      expect(known.body).toMatchObject({ code: 'email_not_configured', data: { correo: 'no_configurado' } });
      expect(unknown.body).toEqual(known.body);
      expect(await mongoose.connection.collection('magiclinktokens').countDocuments({ proposito: 'reset' })).toBe(0);
    });

    it('enlace usado, reemplazado o vencido: cada uno con su motivo', async () => {
      const { issueMagicLink } = await import('../../services/magic-link.service');
      const u = await localUser();
      const tokenOf = (url: string) => new URL(url).searchParams.get('token') as string;
      const reset = (token: string) => request(app).post('/api/auth/reset-password').set('X-Forwarded-For', ip()).send({ token, password: 'Clave-nueva-789' });

      const first = await issueMagicLink({ userId: u.id, proposito: 'reset' });
      const second = await issueMagicLink({ userId: u.id, proposito: 'reset' });
      const replaced = await reset(tokenOf(first.url));
      expect(replaced.body).toMatchObject({ code: 'token_replaced' });
      expect(replaced.body.message).toMatch(/reemplazado/);
      expect((await reset(tokenOf(second.url))).status).toBe(200);
      const used = await reset(tokenOf(second.url));
      expect(used.body.code).toBe('token_used');
      expect(used.body.message).toMatch(/ya se usó/);

      const third = await issueMagicLink({ userId: u.id, proposito: 'reset', now: new Date(Date.now() - 2 * 60 * 60 * 1000) });
      const expired = await reset(tokenOf(third.url));
      expect(expired.body.code).toBe('token_expired');
      expect(expired.body.message).toMatch(/venció/);
    });

    it('el admin genera un enlace para compartir; el manager no; una cuenta de Google tampoco', async () => {
      const u = await localUser();
      const res = await request(app).post(`/api/admin/users/${u.id}/reset-link`).set(bearer(admin));
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ user: { id: u.id, phone: '+57 300 000 0000' } });
      expect(res.body.data.resetUrl).toMatch(/\/reset-password\?token=/);
      expect(res.headers['cache-control']).toMatch(/no-store/);
      const token = new URL(res.body.data.resetUrl).searchParams.get('token');
      const ok = await request(app).post('/api/auth/reset-password').set('X-Forwarded-For', ip()).send({ token, password: 'Desde-el-panel-1' });
      expect(ok.status).toBe(200);
      expect((await login(u.email, 'Desde-el-panel-1')).status).toBe(200);
      const audit = await mongoose.connection.collection('auditlogs').findOne({ accion: 'user.reset_link', 'entidad.id': u.id });
      expect(audit?.detalle).not.toHaveProperty('resetUrl');

      expect((await request(app).post(`/api/admin/users/${u.id}/reset-link`).set(bearer(manager))).status).toBe(403);
      const google = await localUser('x', { provider: 'google', password: undefined });
      expect((await request(app).post(`/api/admin/users/${google.id}/reset-link`).set(bearer(admin))).body.code).toBe('not_local_account');
    });
  });

  it('/api/auth/me de una cuenta que ya no existe responde 401 session_invalid', async () => {
    const ghost = await createUser('client');
    await mongoose.connection.collection('users').deleteOne({ _id: new mongoose.Types.ObjectId(ghost.id) });
    const res = await request(app).get('/api/auth/me').set(bearer(ghost));
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('session_invalid');
  });
});
