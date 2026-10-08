/**
 * Portal › Mi perfil: el dueño de la cuenta lee y actualiza sus datos
 * (PATCH /api/auth/me) y cambia su contraseña verificando la actual
 * (POST /api/auth/change-password), que emite una sesión nueva.
 */
import request from 'supertest';
import type { Express } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectTestDb, describeDbRedis, disconnectTestDb, signToken } from './helpers';

describeDbRedis('perfil de la cuenta (integración)', () => {
  let app: Express;
  let token: string;
  let email: string;
  const password = 'Clave-actual-123';

  beforeAll(async () => {
    await connectTestDb('profile');
    const { createApp } = await import('../../app');
    app = createApp();
    email = `perfil-${Date.now()}@test.local`;
    const res = await mongoose.connection.collection('users').insertOne({
      email,
      name: 'Laura Perfil',
      role: 'prospect',
      provider: 'local',
      accountStatus: 'activo',
      password: await bcrypt.hash(password, 4),
      created_at: new Date(),
      updated_at: new Date(),
    });
    token = signToken({ id: String(res.insertedId), email, role: 'prospect' });
  });

  afterAll(async () => {
    const { getRedisClient } = await import('../../config/redis');
    const redis = await getRedisClient();
    const users = await mongoose.connection.collection('users').find({ email }).project({ _id: 1 }).toArray();
    for (const u of users) await redis.del(`refresh_token:${u._id}`);
    await redis.quit();
    await disconnectTestDb();
  });

  // IP distinta por petición: el cupo estricto (5/min por IP) es compartido
  // por login, registro y cambio de contraseña.
  let n = 0;
  const ip = () => `10.77.${Math.floor(n / 250)}.${(n++ % 250) + 1}`;
  const auth = () => ({ Authorization: `Bearer ${token}`, 'X-Forwarded-For': ip() });

  it('GET /me devuelve los datos reales de la cuenta (sin la contraseña)', async () => {
    const res = await request(app).get('/api/auth/me').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ email, name: 'Laura Perfil', role: 'prospect', phone: null, company: null, provider: 'local', accountStatus: 'activo' });
    expect(JSON.stringify(res.body)).not.toContain('password');
  });

  it('PATCH /me actualiza nombre, teléfono y empresa; valida y no deja cambiar rol ni email', async () => {
    const ok = await request(app).patch('/api/auth/me').set(auth()).send({ name: 'Laura Gómez', phone: '+57 300 123 4567', company: 'Logística Andina SAS' });
    expect(ok.status).toBe(200);
    expect(ok.body.data).toMatchObject({ name: 'Laura Gómez', phone: '+57 300 123 4567', company: 'Logística Andina SAS', role: 'prospect', email });

    expect((await request(app).patch('/api/auth/me').set(auth()).send({ role: 'admin' })).status).toBe(400);
    expect((await request(app).patch('/api/auth/me').set(auth()).send({ email: 'otro@test.local' })).status).toBe(400);
    const badPhone = await request(app).patch('/api/auth/me').set(auth()).send({ phone: 'llámame' });
    expect(badPhone.status).toBe(400);
    expect(badPhone.body.fields).toEqual(['phone']);
    expect((await request(app).patch('/api/auth/me').set(auth()).send({ name: 'x' })).status).toBe(400);

    // Vaciar un campo opcional lo quita.
    const cleared = await request(app).patch('/api/auth/me').set(auth()).send({ company: '' });
    expect(cleared.body.data.company).toBeNull();
    expect(cleared.body.data.phone).toBe('+57 300 123 4567');
    expect((await request(app).patch('/api/auth/me').send({ name: 'Sin sesión' })).status).toBe(401);
  });

  it('POST /change-password exige la contraseña actual y cambia la de verdad', async () => {
    const wrong = await request(app).post('/api/auth/change-password').set(auth()).send({ currentPassword: 'no-es', newPassword: 'Nueva-clave-456' });
    expect(wrong.status).toBe(400);
    expect(wrong.body.code).toBe('wrong_password');
    const short = await request(app).post('/api/auth/change-password').set(auth()).send({ currentPassword: password, newPassword: 'corta' });
    expect(short.status).toBe(400);
    expect(short.body.code).toBe('invalid_password');

    const res = await request(app).post('/api/auth/change-password').set(auth()).send({ currentPassword: password, newPassword: 'Nueva-clave-456' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.refreshToken).toBeTruthy();

    expect((await request(app).post('/api/auth/login').set('X-Forwarded-For', ip()).send({ email, password })).status).toBe(401);
    const login = await request(app).post('/api/auth/login').set('X-Forwarded-For', ip()).send({ email, password: 'Nueva-clave-456' });
    expect(login.status).toBe(200);
    const anon = await request(app).post('/api/auth/change-password').set('X-Forwarded-For', ip()).send({ currentPassword: 'a', newPassword: 'Otra-clave-789' });
    expect(anon.status).toBe(401);
  });
});
