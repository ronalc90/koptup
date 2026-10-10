/**
 * Inicio de sesión (integración):
 *  - Google: el callback no pone tokens en la URL; emite un código de un solo
 *    uso (60 s) en el fragmento, que la web canjea por POST.
 *  - Límites por ruta: cada ruta de cuenta tiene su propio contador; el login
 *    cuenta por IP + email; los mensajes de 429 están en español.
 */
import request from 'supertest';
import type { Express, Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectTestDb, createUser, describeDbRedis, disconnectTestDb } from './helpers';

let ipCounter = 0;
const ip = () => `203.0.113.${(ipCounter += 1) % 250}`;
const uniqueIp = () => `198.18.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;

describeDbRedis('inicio de sesión: Google y límites por ruta (integración)', () => {
  let app: Express;
  const prevFrontend = process.env.FRONTEND_URL;

  beforeAll(async () => {
    process.env.FRONTEND_URL = 'https://web.example';
    await connectTestDb('authhard');
    const { createApp } = await import('../../app');
    app = createApp();
  });

  afterAll(async () => {
    // issueSession guarda el refresh token en Redis: se cierra la conexión.
    const { getRedisClient } = await import('../../config/redis');
    const client = await getRedisClient().catch(() => null);
    if (client?.isOpen) await client.quit();
    if (prevFrontend === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = prevFrontend;
    await disconnectTestDb();
  });

  async function runGoogleCallback(userId: string, email: string): Promise<string> {
    const { googleCallback } = await import('../../controllers/auth.controller');
    let location = '';
    await new Promise<void>((resolve, reject) => {
      const res = {
        setHeader: () => res,
        redirect: (url: string) => {
          location = url;
          resolve();
        },
      } as unknown as Response;
      const req = { user: { id: userId, email, role: 'user' } } as any;
      googleCallback(req, res, (err?: unknown) => (err ? reject(err) : resolve()));
    });
    return location;
  }

  describe('Google', () => {
    it('el callback redirige sin tokens: código de un solo uso en el fragmento', async () => {
      const u = await createUser('user');
      const location = await runGoogleCallback(u.id, u.email);
      expect(location).toMatch(/^https:\/\/web\.example\/auth\/callback#code=[A-Za-z0-9_-]{20,}$/);
      expect(location).not.toMatch(/accessToken|refreshToken|\?/);
      // En la BD solo queda el hash del código.
      const code = location.split('#code=')[1];
      expect(await mongoose.connection.collection('magiclinktokens').countDocuments({ tokenHash: code })).toBe(0);
    });

    it('el código se canjea una sola vez por la sesión (misma respuesta que el login)', async () => {
      const u = await createUser('client');
      const code = (await runGoogleCallback(u.id, u.email)).split('#code=')[1];
      const first = await request(app).post('/api/auth/google/exchange').set('X-Forwarded-For', ip()).send({ code });
      expect(first.status).toBe(200);
      expect(first.headers['cache-control']).toBe('no-store');
      expect(first.body.data).toMatchObject({ user: { email: u.email, role: 'client' } });
      expect(typeof first.body.data.accessToken).toBe('string');
      expect(typeof first.body.data.refreshToken).toBe('string');
      const again = await request(app).post('/api/auth/google/exchange').set('X-Forwarded-For', ip()).send({ code });
      expect(again.status).toBe(400);
      expect(again.body.code).toBe('token_used');
    });

    it('un código vencido (más de 60 s), inventado o de otro propósito no sirve', async () => {
      const u = await createUser('user');
      const { issueMagicLink } = await import('../../services/magic-link.service');
      const old = await issueMagicLink({ userId: u.id, proposito: 'oauth', now: new Date(Date.now() - 2 * 60 * 1000) });
      const expired = await request(app).post('/api/auth/google/exchange').set('X-Forwarded-For', ip()).send({ code: old.token });
      expect(expired.status).toBe(400);
      expect(expired.body.code).toBe('token_expired');
      expect((await request(app).post('/api/auth/google/exchange').set('X-Forwarded-For', ip()).send({ code: 'x'.repeat(43) })).status).toBe(400);
      expect((await request(app).post('/api/auth/google/exchange').set('X-Forwarded-For', ip()).send({})).status).toBe(400);
      const reset = await issueMagicLink({ userId: u.id, proposito: 'reset' });
      expect((await request(app).post('/api/auth/google/exchange').set('X-Forwarded-For', ip()).send({ code: reset.token })).status).toBe(400);
    });
  });

  describe('límites por ruta', () => {
    it('login: cuenta por IP + email; otro correo desde la misma IP sigue pudiendo entrar', async () => {
      const sameIp = uniqueIp();
      const password = 'Clave-correcta-123';
      const victim = await createUser('user');
      const good = await createUser('user');
      await mongoose.connection.collection('users').updateOne({ _id: new mongoose.Types.ObjectId(good.id) }, { $set: { password: await bcrypt.hash(password, 4) } });
      for (let i = 0; i < 10; i += 1) {
        expect((await request(app).post('/api/auth/login').set('X-Forwarded-For', sameIp).send({ email: victim.email, password: 'mala-clave' })).status).toBe(401);
      }
      const blocked = await request(app).post('/api/auth/login').set('X-Forwarded-For', sameIp).send({ email: victim.email, password: 'mala-clave' });
      expect(blocked.status).toBe(429);
      expect(blocked.body).toMatchObject({ success: false, code: 'rate_limited' });
      expect(blocked.body.message).toMatch(/Demasiados intentos de inicio de sesión/);
      expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
      // Otra cuenta desde la misma IP no queda bloqueada.
      expect((await request(app).post('/api/auth/login').set('X-Forwarded-For', sameIp).send({ email: good.email, password })).status).toBe(200);
      // La misma cuenta desde otra IP tampoco (el bloqueo es por IP + email).
      expect((await request(app).post('/api/auth/login').set('X-Forwarded-For', uniqueIp()).send({ email: victim.email, password: 'mala-clave' })).status).toBe(401);
    });

    it('agotar el login no bloquea el registro, la recuperación ni la activación (contadores separados)', async () => {
      const sameIp = uniqueIp();
      const u = await createUser('user');
      for (let i = 0; i < 11; i += 1) {
        await request(app).post('/api/auth/login').set('X-Forwarded-For', sameIp).send({ email: u.email, password: 'mala' });
      }
      expect((await request(app).post('/api/auth/login').set('X-Forwarded-For', sameIp).send({ email: u.email, password: 'mala' })).status).toBe(429);
      const reg = await request(app)
        .post('/api/auth/register')
        .set('X-Forwarded-For', sameIp)
        .send({ email: `nuevo-${Date.now()}@test.local`, password: 'Clave-segura-1', name: 'Nuevo' });
      expect(reg.status).toBe(201);
      expect((await request(app).post('/api/auth/forgot-password').set('X-Forwarded-For', sameIp).send({ email: u.email })).status).toBe(200);
      expect((await request(app).post('/api/auth/reset-password').set('X-Forwarded-For', sameIp).send({ token: 'x'.repeat(43), password: 'Clave-segura-1' })).status).toBe(400);
      expect((await request(app).post('/api/auth/activate').set('X-Forwarded-For', sameIp).send({ token: 'x'.repeat(43), password: 'Clave-segura-1' })).status).toBe(400);
    });

    it('registro: 5 por hora por IP, luego 429 en español', async () => {
      const sameIp = uniqueIp();
      for (let i = 0; i < 5; i += 1) {
        const r = await request(app).post('/api/auth/register').set('X-Forwarded-For', sameIp).send({ email: 'no-es-email', password: 'x', name: '' });
        expect(r.status).toBe(400);
      }
      const blocked = await request(app).post('/api/auth/register').set('X-Forwarded-For', sameIp).send({ email: 'no-es-email', password: 'x', name: '' });
      expect(blocked.status).toBe(429);
      expect(blocked.body.message).toMatch(/Demasiados registros/);
    });

    it('recuperar contraseña: 3 por IP + email cada 15 min; otro correo sigue pudiendo', async () => {
      const sameIp = uniqueIp();
      for (let i = 0; i < 3; i += 1) {
        expect((await request(app).post('/api/auth/forgot-password').set('X-Forwarded-For', sameIp).send({ email: 'alguien@test.local' })).status).toBe(200);
      }
      const blocked = await request(app).post('/api/auth/forgot-password').set('X-Forwarded-For', sameIp).send({ email: 'alguien@test.local' });
      expect(blocked.status).toBe(429);
      expect(blocked.body.message).toMatch(/Revisa tu bandeja/);
      expect((await request(app).post('/api/auth/forgot-password').set('X-Forwarded-For', sameIp).send({ email: 'otra@test.local' })).status).toBe(200);
    });

    it('el correo se cuenta normalizado: sus variantes (mayúsculas, puntos o +etiqueta de Gmail) comparten el contador', async () => {
      const sameIp = uniqueIp();
      const variants = ['ana.perez@gmail.com', 'anaperez@gmail.com', 'Ana.Perez+1@gmail.com', 'a.n.a.perez+x@GMAIL.com', 'ANAPEREZ@gmail.com'];
      for (let i = 0; i < 10; i += 1) {
        const r = await request(app).post('/api/auth/login').set('X-Forwarded-For', sameIp).send({ email: variants[i % variants.length], password: 'mala-clave' });
        expect(r.status).toBe(401);
      }
      expect((await request(app).post('/api/auth/login').set('X-Forwarded-For', sameIp).send({ email: 'an.aperez+otra@gmail.com', password: 'mala-clave' })).status).toBe(429);

      const forgotIp = uniqueIp();
      for (let i = 0; i < 3; i += 1) {
        expect((await request(app).post('/api/auth/forgot-password').set('X-Forwarded-For', forgotIp).send({ email: variants[i] })).status).toBe(200);
      }
      expect((await request(app).post('/api/auth/forgot-password').set('X-Forwarded-For', forgotIp).send({ email: variants[3] })).status).toBe(429);
    });

    it('recuperar contraseña: además, 10 por IP con correos distintos', async () => {
      const sameIp = uniqueIp();
      for (let i = 0; i < 10; i += 1) {
        expect((await request(app).post('/api/auth/forgot-password').set('X-Forwarded-For', sameIp).send({ email: `persona${i}@test.local` })).status).toBe(200);
      }
      const blocked = await request(app).post('/api/auth/forgot-password').set('X-Forwarded-For', sameIp).send({ email: 'persona-11@test.local' });
      expect(blocked.status).toBe(429);
      expect(blocked.body).toMatchObject({ code: 'rate_limited' });
      expect(blocked.body.message).toMatch(/desde esta conexión/);
    });

    it('activación y restablecer: 10 cada 15 min por IP, cada uno con su contador', async () => {
      const sameIp = uniqueIp();
      const body = { token: 'x'.repeat(43), password: 'Clave-segura-1' };
      for (let i = 0; i < 10; i += 1) {
        expect((await request(app).post('/api/auth/activate').set('X-Forwarded-For', sameIp).send(body)).status).toBe(400);
      }
      const blocked = await request(app).post('/api/auth/activate').set('X-Forwarded-For', sameIp).send(body);
      expect(blocked.status).toBe(429);
      expect(blocked.body.message).toMatch(/activar la cuenta/);
      // El restablecimiento desde la misma IP tiene su propio cupo.
      expect((await request(app).post('/api/auth/reset-password').set('X-Forwarded-For', sameIp).send(body)).status).toBe(400);
    });
  });
});
