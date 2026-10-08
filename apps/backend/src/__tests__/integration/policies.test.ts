/**
 * Autorización en el servidor: 401/403/200 por política en rutas
 * representativas (pública, autenticado, dueño del recurso, staff, admin,
 * acceso a demo y solo desarrollo), más el manejador de errores y /health.
 */
import request from 'supertest';
import type { Express } from 'express';
import mongoose from 'mongoose';
import {
  TestUser,
  bearer,
  connectTestDb,
  createUser,
  describeDb,
  disconnectTestDb,
  signToken,
} from './helpers';

describeDb('políticas de autorización (integración)', () => {
  let app: Express;
  let admin: TestUser;
  let manager: TestUser;
  let user: TestUser;
  let otherUser: TestUser;
  let access: typeof import('../../middleware/access');

  beforeAll(async () => {
    await connectTestDb('policies');
    access = await import('../../middleware/access');
    const { createApp } = await import('../../app');
    app = createApp();
    admin = await createUser('admin');
    manager = await createUser('manager');
    user = await createUser('user');
    otherUser = await createUser('user');
  });

  afterAll(async () => {
    access.setDemoAccessResolver(null);
    await disconnectTestDb();
  });

  describe('salud', () => {
    it('GET /health/live responde 200 siempre', async () => {
      const res = await request(app).get('/health/live');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('alive');
    });

    it('GET /health responde 200 con MongoDB conectado', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'healthy', mongo: 'connected' });
    });
  });

  describe('autenticado (GET /api/auth/me)', () => {
    it('401 sin token', async () => {
      expect((await request(app).get('/api/auth/me')).status).toBe(401);
    });

    it('401 con token firmado con otro secreto', async () => {
      const jwt = await import('jsonwebtoken');
      const forged = jwt.sign({ id: user.id, email: user.email, role: 'admin' }, 'otro-secreto');
      expect((await request(app).get('/api/auth/me').set({ Authorization: `Bearer ${forged}` })).status).toBe(401);
    });

    it('401 TOKEN_EXPIRED con token vencido', async () => {
      const expired = signToken(user, { expiresIn: -10 });
      const res = await request(app).get('/api/auth/me').set({ Authorization: `Bearer ${expired}` });
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('TOKEN_EXPIRED');
    });

    it('200 con el rol vigente de la BD', async () => {
      const res = await request(app).get('/api/auth/me').set(bearer(user));
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ email: user.email, role: 'user' });
    });

    it('refresh con un token inválido o falsificado → 401 (no 500)', async () => {
      expect((await request(app).post('/api/auth/refresh').send({ refreshToken: 'no-es-un-jwt' })).status).toBe(401);
      const forged = signToken({ id: user.id, email: user.email, role: 'user' });
      expect((await request(app).post('/api/auth/refresh').send({ refreshToken: forged })).status).toBe(401);
    });
  });

  describe('dueño del recurso', () => {
    it('documentos: 401 sin sesión y cada usuario ve solo los suyos', async () => {
      const docs = mongoose.connection.collection('documents');
      const base = { file_path: '/tmp/x', file_size: 10, mime_type: 'text/plain', is_deleted: false, is_favorite: false, tags: [], created_at: new Date(), updated_at: new Date() };
      const mine = await docs.insertOne({ ...base, user_id: user.id, filename: 'a.txt', original_filename: 'mio.txt' });
      await docs.insertOne({ ...base, user_id: otherUser.id, filename: 'b.txt', original_filename: 'ajeno.txt' });

      expect((await request(app).get('/api/documents')).status).toBe(401);

      const res = await request(app).get('/api/documents').set(bearer(user));
      expect(res.status).toBe(200);
      const names = (res.body.data as Array<{ name: string }>).map((d) => d.name);
      expect(names).toEqual(['mio.txt']);

      // El otro usuario no puede modificar ni ver el documento ajeno.
      const patch = await request(app).patch(`/api/documents/${String(mine.insertedId)}`).set(bearer(otherUser)).send({ is_favorite: true });
      expect(patch.status).toBe(404);
    });

    it('documentos: un objeto en la query no se cuela en el filtro', async () => {
      const res = await request(app).get('/api/documents?folder[$ne]=x').set(bearer(otherUser));
      expect(res.status).toBe(200);
      expect((res.body.data as Array<{ name: string }>).map((d) => d.name)).toEqual(['ajeno.txt']);
    });

    it('entregables: el dueño y el staff ven el entregable; otro usuario recibe 403', async () => {
      await mongoose.connection.collection('deliverables').insertOne({
        deliverableId: 'DEL-TEST-1',
        userId: new mongoose.Types.ObjectId(user.id),
        projectId: new mongoose.Types.ObjectId(),
        title: 'Entregable',
        history: [],
      });
      expect((await request(app).get('/api/deliverables/DEL-TEST-1').set(bearer(otherUser))).status).toBe(403);
      expect((await request(app).get('/api/deliverables/DEL-TEST-1').set(bearer(user))).status).toBe(200);
      expect((await request(app).get('/api/deliverables/DEL-TEST-1').set(bearer(manager))).status).toBe(200);
      expect((await request(app).post('/api/deliverables/DEL-TEST-1/approve').set(bearer(otherUser)).send({})).status).toBe(403);
    });

    it('facturas: otro usuario no puede pagar ni descargar una factura ajena', async () => {
      const inv = await mongoose.connection.collection('invoices').insertOne({
        userId: new mongoose.Types.ObjectId(user.id),
        status: 'pending',
        total: 100,
        history: [],
      });
      const id = String(inv.insertedId);
      expect((await request(app).post(`/api/invoices/${id}/pay`).set(bearer(otherUser)).send({ paymentMethod: 'card' })).status).toBe(403);
      expect((await request(app).get(`/api/invoices/${id}/download`).set(bearer(otherUser))).status).toBe(403);
      expect((await request(app).post('/api/invoices').set(bearer(user)).send({})).status).toBe(403);
    });

    it('notificaciones: solo el staff puede notificar a otra cuenta', async () => {
      const payload = { type: 'system', title: 'Hola', message: 'Prueba', targetUserId: otherUser.id };
      expect((await request(app).post('/api/notifications').set(bearer(user)).send(payload)).status).toBe(403);
      expect((await request(app).post('/api/notifications').set(bearer(admin)).send(payload)).status).toBe(201);
    });

    it('mensajes: solo un participante marca la conversación como leída', async () => {
      await mongoose.connection.collection('conversations').insertOne({
        conversationId: 'CONV-TEST-1',
        title: 'Proyecto de prueba',
        participants: [
          { userId: new mongoose.Types.ObjectId(admin.id), role: 'admin', name: 'Admin', email: admin.email },
          { userId: new mongoose.Types.ObjectId(user.id), role: 'client', name: 'Cliente', email: user.email },
        ],
        unreadCount: {},
        status: 'active',
        createdBy: new mongoose.Types.ObjectId(admin.id),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect((await request(app).post('/api/messages/conversations/CONV-TEST-1/read')).status).toBe(401);
      expect((await request(app).post('/api/messages/conversations/CONV-TEST-1/read').set(bearer(otherUser))).status).toBe(403);
      expect((await request(app).post('/api/messages/conversations/CONV-TEST-1/read').set(bearer(user))).status).toBe(200);
      expect((await request(app).get('/api/messages/conversations/CONV-TEST-1').set(bearer(otherUser))).status).toBe(403);
    });

    it('proyectos: datos inválidos → 400 y proyecto ajeno o inexistente → 404 (no 500)', async () => {
      expect((await request(app).post('/api/projects').set(bearer(user)).send({})).status).toBe(400);
      const missing = new mongoose.Types.ObjectId().toString();
      expect((await request(app).delete(`/api/projects/${missing}`).set(bearer(user))).status).toBe(404);
    });
  });

  describe('staff y admin (panel /api/admin)', () => {
    it('401 sin sesión, 403 usuario, 200 admin y manager', async () => {
      expect((await request(app).get('/api/admin/users')).status).toBe(401);
      expect((await request(app).get('/api/admin/users').set(bearer(user))).status).toBe(403);
      expect((await request(app).get('/api/admin/users').set(bearer(admin))).status).toBe(200);
      expect((await request(app).get('/api/admin/users').set(bearer(manager))).status).toBe(200);
    });

    it('el rol se lee de la BD: un token con rol admin de un usuario normal no da acceso', async () => {
      const elevated = signToken({ id: user.id, email: user.email, role: 'admin' });
      expect((await request(app).get('/api/admin/users').set({ Authorization: `Bearer ${elevated}` })).status).toBe(403);
    });

    it('si se revoca el rol en la BD, el token vigente deja de servir', async () => {
      const temp = await createUser('manager');
      expect((await request(app).get('/api/admin/users').set(bearer(temp))).status).toBe(200);
      await mongoose.connection.collection('users').updateOne({ _id: new mongoose.Types.ObjectId(temp.id) }, { $set: { role: 'user' } });
      expect((await request(app).get('/api/admin/users').set(bearer(temp))).status).toBe(403);
    });

    it('cambiar roles: manager 403, admin valida el rol y lo aplica', async () => {
      const target = await createUser('user');
      expect((await request(app).patch(`/api/admin/users/${target.id}/role`).set(bearer(manager)).send({ role: 'admin' })).status).toBe(403);
      expect((await request(app).patch(`/api/admin/users/${target.id}/role`).set(bearer(admin)).send({ role: 'superadmin' })).status).toBe(400);
      const ok = await request(app).patch(`/api/admin/users/${target.id}/role`).set(bearer(admin)).send({ role: 'manager' });
      expect(ok.status).toBe(200);
      expect(ok.body.data.role).toBe('manager');
      expect((await request(app).patch(`/api/admin/users/${admin.id}/role`).set(bearer(admin)).send({ role: 'user' })).status).toBe(400);
    });

    it('cuentas médicas internas (/api/cuentas): solo staff', async () => {
      expect((await request(app).get('/api/cuentas')).status).toBe(401);
      expect((await request(app).get('/api/cuentas').set(bearer(user))).status).toBe(403);
      expect((await request(app).get('/api/cuentas').set(bearer(manager))).status).toBe(200);
    });

    it('/api/export no acepta rutas fuera de la carpeta de exportes', async () => {
      const res = await request(app).get('/api/export').query({ file: '../../package.json' }).set(bearer(admin));
      expect(res.status).toBe(403);
    });
  });

  describe('acceso a demo (requireStaffOrDemoAccess)', () => {
    it('demo privada (cuentas-medicas): 401 anónimo, 403 sin acceso, 200 staff', async () => {
      const anon = await request(app).get('/api/auditoria/estadisticas');
      expect(anon.status).toBe(401);
      expect(anon.body.code).toBe('login_required');
      const noAccess = await request(app).get('/api/auditoria/estadisticas').set(bearer(user));
      expect(noAccess.status).toBe(403);
      expect(noAccess.body.code).toBe('demo_access_required');
      expect((await request(app).get('/api/auditoria/estadisticas').set(bearer(manager))).status).toBe(200);
    });

    it('sistema experto: CUPS y expert exigen acceso', async () => {
      expect((await request(app).get('/api/cups/estadisticas')).status).toBe(401);
      expect((await request(app).get('/api/expert/estadisticas').set(bearer(user))).status).toBe(403);
      expect((await request(app).get('/api/cups/estadisticas').set(bearer(admin))).status).toBe(200);
    });

    it('gancho P4: un resolvedor registrado concede la demo a un usuario', async () => {
      access.setDemoAccessResolver(async ({ slug, user: u }) =>
        u && u.id === user.id && slug === 'cuentas-medicas' ? { allowed: true, reason: 'grant', grantId: 'g-1' } : { allowed: false, reason: u ? 'no_access' : 'login_required' },
      );
      try {
        expect((await request(app).get('/api/auditoria/estadisticas').set(bearer(user))).status).toBe(200);
        expect((await request(app).get('/api/auditoria/estadisticas').set(bearer(otherUser))).status).toBe(403);
        expect((await request(app).get('/api/cups/estadisticas').set(bearer(user))).status).toBe(403);
      } finally {
        access.setDemoAccessResolver(null);
      }
    });

    it('operaciones destructivas: solo admin y sin rutas arbitrarias', async () => {
      expect((await request(app).post('/api/cups/importar-csv').set(bearer(manager)).send({ archivo: 'cups.csv' })).status).toBe(403);
      const traversal = await request(app).post('/api/cups/importar-csv').set(bearer(admin)).send({ archivo: '../../../etc/passwd', truncate: true });
      expect(traversal.status).toBe(400);
      const absolute = await request(app).post('/api/cups/importar-excel').set(bearer(admin)).send({ rutaArchivo: '/etc/passwd', archivo: '/etc/passwd.xlsx' });
      expect(absolute.status).toBe(400);
      expect((await request(app).post('/api/documentos-conocimiento/config/resetear').set(bearer(manager))).status).toBe(403);
    });
  });

  describe('rutas de prueba', () => {
    it('en desarrollo: 401 anónimo, 403 usuario, 200 admin', async () => {
      expect((await request(app).get('/api/test/whatsapp/status')).status).toBe(401);
      expect((await request(app).get('/api/test/whatsapp/status').set(bearer(user))).status).toBe(403);
      expect((await request(app).get('/api/test/whatsapp/status').set(bearer(admin))).status).toBe(200);
      expect((await request(app).post('/api/contact/test-email').set(bearer(user))).status).toBe(403);
      expect((await request(app).post('/api/chat/session').set(bearer(user))).status).toBe(403);
    });

    it('en producción: 404 incluso para admin', async () => {
      const prev = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        expect((await request(app).get('/api/test/whatsapp/status').set(bearer(admin))).status).toBe(404);
        expect((await request(app).post('/api/contact/test-whatsapp').set(bearer(admin))).status).toBe(404);
        expect((await request(app).post('/api/chat/message').set(bearer(admin))).status).toBe(404);
      } finally {
        process.env.NODE_ENV = prev;
      }
    });
  });

  describe('manejador de errores', () => {
    it('JSON inválido → 400', async () => {
      const res = await request(app).post('/api/contact').set('Content-Type', 'application/json').send('{malo');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('invalid_json');
    });

    it('cuerpo demasiado grande → 413', async () => {
      const res = await request(app)
        .post('/api/contact')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ message: 'x'.repeat(3 * 1024 * 1024) }));
      expect(res.status).toBe(413);
    });

    it('origen no permitido por CORS → 403', async () => {
      const res = await request(app).get('/health/live').set('Origin', 'https://sitio-malicioso.example');
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('cors_forbidden');
    });

    it('origen permitido recibe cabeceras CORS', async () => {
      const res = await request(app).options('/api/chatbot/models').set('Origin', 'https://koptup.com').set('Access-Control-Request-Method', 'GET');
      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe('https://koptup.com');
      expect(String(res.headers['access-control-allow-headers'])).toMatch(/X-Bot-Owner-Token/i);
    });

    it('error de multer → 400', async () => {
      const res = await request(app)
        .post('/api/auditoria/soportes')
        .set(bearer(admin))
        .attach('otro_campo', Buffer.from('hola'), 'a.pdf');
      expect(res.status).toBe(400);
      const badType = await request(app)
        .post('/api/auditoria/soportes')
        .set(bearer(admin))
        .attach('file', Buffer.from('MZ'), 'programa.exe');
      expect(badType.status).toBe(400);
    });

    it('en producción no se filtra el stack', async () => {
      const prev = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        const res = await request(app).post('/api/contact').set('Content-Type', 'application/json').send('{malo');
        expect(res.status).toBe(400);
        expect(res.body.stack).toBeUndefined();
        expect(res.body.error).toBeUndefined();
      } finally {
        process.env.NODE_ENV = prev;
      }
    });
  });

  describe('IP real detrás del proxy (trust proxy)', () => {
    it('el rate-limit estricto cuenta por la IP de X-Forwarded-For', async () => {
      const send = (ip: string) => request(app).post('/api/quotes').set('X-Forwarded-For', ip).send({});
      for (let i = 0; i < 5; i += 1) {
        expect((await send('198.51.100.7')).status).toBe(400);
      }
      expect((await send('198.51.100.7')).status).toBe(429);
      // Otra IP real tiene su propio cupo.
      expect((await send('198.51.100.8')).status).toBe(400);
    });
  });
});
