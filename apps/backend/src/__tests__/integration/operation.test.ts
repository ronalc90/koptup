/**
 * Operación (integración):
 *  - ADMIN_EMAIL: solo da el rol si la cuenta existe, está activa y no hay
 *    otro admin; lo deja en la bitácora y no lo devuelve si un admin se lo
 *    quitó (porque ya hay otro admin).
 *  - JWT_REFRESH_EXPIRES_IN: la copia del token de renovación en Redis vence
 *    igual que el JWT.
 *  - /health: 200 con MongoDB conectado (lo usan Railway y el monitoreo).
 *  - Formato único de error en la sesión, los roles y las rutas inexistentes.
 */
import request from 'supertest';
import type { Express } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { bearer, connectTestDb, createUser, describeDb, describeDbRedis, disconnectTestDb } from './helpers';

describeDb('ADMIN_EMAIL al arrancar (integración)', () => {
  beforeAll(async () => {
    await connectTestDb('opadmin');
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await mongoose.connection.collection('users').deleteMany({});
    await mongoose.connection.collection('auditlogs').deleteMany({});
  });

  const roleOf = async (email: string) => (await mongoose.connection.collection('users').findOne({ email }))?.role;
  const roleAudits = () => mongoose.connection.collection('auditlogs').find({ accion: 'user.role_change' }).toArray();

  it('sin variable o sin cuenta: no cambia nada', async () => {
    const { ensureAdminFromEnv } = await import('../../services/admin-bootstrap.service');
    expect(await ensureAdminFromEnv('')).toBe('sin_variable');
    expect(await ensureAdminFromEnv('nadie@ejemplo.test')).toBe('no_existe');
    expect(await roleAudits()).toHaveLength(0);
  });

  it('primer admin: da el rol y lo deja en la bitácora', async () => {
    const { ensureAdminFromEnv } = await import('../../services/admin-bootstrap.service');
    const owner = await createUser('user', 'duena@ejemplo.test');
    expect(await ensureAdminFromEnv(' Duena@Ejemplo.test ')).toBe('promovida');
    expect(await roleOf(owner.email)).toBe('admin');

    const audits = await roleAudits();
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      actor: null,
      actorRol: 'system',
      entidad: { tipo: 'User', id: owner.id },
      detalle: { email: owner.email, antes: 'user', despues: 'admin', origen: 'ADMIN_EMAIL' },
    });

    // Un segundo arranque no repite el cambio ni la entrada.
    expect(await ensureAdminFromEnv(owner.email)).toBe('ya_es_admin');
    expect(await roleAudits()).toHaveLength(1);
  });

  it('si otro admin le quitó el rol, el arranque no se lo devuelve', async () => {
    const { ensureAdminFromEnv } = await import('../../services/admin-bootstrap.service');
    await createUser('admin', 'otra-admin@ejemplo.test');
    const owner = await createUser('manager', 'duena@ejemplo.test');
    expect(await ensureAdminFromEnv(owner.email)).toBe('hay_otro_admin');
    expect(await roleOf(owner.email)).toBe('manager');
    expect(await roleAudits()).toHaveLength(0);
  });

  it('recuperación: si no queda ningún admin, vuelve a darlo', async () => {
    const { ensureAdminFromEnv } = await import('../../services/admin-bootstrap.service');
    const owner = await createUser('sales', 'duena@ejemplo.test');
    expect(await ensureAdminFromEnv(owner.email)).toBe('promovida');
    expect(await roleOf(owner.email)).toBe('admin');
  });

  it('una cuenta invitada (sin activar) no recibe el rol', async () => {
    const { ensureAdminFromEnv } = await import('../../services/admin-bootstrap.service');
    await mongoose.connection.collection('users').insertOne({
      email: 'invitada@ejemplo.test',
      name: 'Invitada',
      role: 'prospect',
      provider: 'local',
      accountStatus: 'invitado',
    });
    expect(await ensureAdminFromEnv('invitada@ejemplo.test')).toBe('cuenta_invitada');
    expect(await roleOf('invitada@ejemplo.test')).toBe('prospect');
  });
});

describeDbRedis('sesión y salud (integración)', () => {
  let app: Express;
  const prevRefresh = process.env.JWT_REFRESH_EXPIRES_IN;

  beforeAll(async () => {
    await connectTestDb('opsession');
    const { createApp } = await import('../../app');
    app = createApp();
  });

  afterAll(async () => {
    const { getRedisClient } = await import('../../config/redis');
    const client = await getRedisClient().catch(() => null);
    if (client?.isOpen) await client.quit();
    if (prevRefresh === undefined) delete process.env.JWT_REFRESH_EXPIRES_IN;
    else process.env.JWT_REFRESH_EXPIRES_IN = prevRefresh;
    await disconnectTestDb();
  });

  it('JWT_REFRESH_EXPIRES_IN=2h: el JWT y la copia en Redis vencen a las 2 horas', async () => {
    process.env.JWT_REFRESH_EXPIRES_IN = '2h';
    const email = `sesion-${Date.now()}@ejemplo.test`;
    await mongoose.connection.collection('users').insertOne({
      email,
      name: 'Sesión',
      role: 'client',
      provider: 'local',
      accountStatus: 'activo',
      password: await bcrypt.hash('Clave-de-prueba-123', 4),
    });
    const res = await request(app).post('/api/auth/login').set('X-Forwarded-For', '198.51.100.77').send({ email, password: 'Clave-de-prueba-123' });
    expect(res.status).toBe(200);
    const { refreshToken, user } = res.body.data;
    const decoded = jwt.decode(refreshToken) as { exp: number; iat: number };
    expect(decoded.exp - decoded.iat).toBe(2 * 60 * 60);

    const { getRedisClient } = await import('../../config/redis');
    const client = await getRedisClient();
    const ttl = await client.ttl(`refresh_token:${user.id}`);
    expect(ttl).toBeGreaterThan(2 * 60 * 60 - 60);
    expect(ttl).toBeLessThanOrEqual(2 * 60 * 60);
  });

  it('GET /health responde 200 con MongoDB conectado', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'healthy', mongo: 'connected' });
  });

  it('sesión, roles y rutas inexistentes usan el formato único { success, code, message }', async () => {
    const shape = (code: string) => ({ success: false, code, message: expect.stringMatching(/\S/) });

    const sinToken = await request(app).get('/api/auth/me');
    expect(sinToken.status).toBe(401);
    expect(sinToken.body).toEqual(shape('unauthorized'));

    const tokenMalo = await request(app).get('/api/auth/me').set('Authorization', 'Bearer no-es-un-jwt');
    expect(tokenMalo.status).toBe(401);
    expect(tokenMalo.body).toEqual(shape('invalid_token'));

    const client = await createUser('client');
    const vencido = jwt.sign({ id: client.id, email: client.email, role: 'client' }, process.env.JWT_SECRET as string, { expiresIn: -10 });
    const expirado = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${vencido}`);
    expect(expirado.status).toBe(401);
    expect(expirado.body).toEqual(shape('TOKEN_EXPIRED'));

    const sinRol = await request(app).get('/api/admin/audit-log').set(bearer(client));
    expect(sinRol.status).toBe(403);
    expect(sinRol.body).toEqual(shape('forbidden'));

    const noExiste = await request(app).get('/api/no-existe');
    expect(noExiste.status).toBe(404);
    expect(noExiste.body).toEqual(shape('not_found'));
  });

  it('la cuenta responde en español y con código propio (login, registro y renovación)', async () => {
    const user = await createUser('client');
    const login = await request(app).post('/api/auth/login').set('X-Forwarded-For', '10.20.0.1').send({ email: user.email, password: 'no-es-la-clave-1' });
    expect(login.status).toBe(401);
    expect(login.body).toMatchObject({ success: false, code: 'invalid_credentials', message: 'El correo o la contraseña no son correctos.' });

    const repetido = await request(app).post('/api/auth/register').set('X-Forwarded-For', '10.20.0.2').send({ email: user.email, password: 'Clave-segura-123', name: 'Otra persona' });
    expect(repetido.status).toBe(400);
    expect(repetido.body).toMatchObject({ success: false, code: 'email_taken' });

    const renovar = await request(app).post('/api/auth/refresh').set('X-Forwarded-For', '10.20.0.3').send({ refreshToken: 'no-es-un-token' });
    expect(renovar.status).toBe(401);
    expect(renovar.body).toMatchObject({ success: false, code: 'invalid_refresh_token', message: 'Tu sesión expiró. Inicia sesión de nuevo.' });
  });
});
