/**
 * Panel de administración (integración, supertest):
 *  - una solicitud que se fusiona con otra abierta avisa al equipo y deja
 *    registro en la bitácora y en la actividad del lead;
 *  - una solicitud rechazada como spam no infla Contactos (queda en
 *    «Descartados»);
 *  - volver una solicitud «en revisión» a «pendiente»;
 *  - no se concede acceso a una demo desactivada (aviso claro);
 *  - el enlace nuevo de activación desde Accesos trae el teléfono (WhatsApp);
 *  - bitácora con filtros (grupo de acciones, quién, fechas) y lista de acciones;
 *  - Contactos: buscador, origen y estado nuevo;
 *  - Usuarios: los 7 roles, teléfono y estado de la cuenta.
 */
import request from 'supertest';
import type { Express } from 'express';
import mongoose from 'mongoose';
import { TestUser, bearer, connectTestDb, createUser, describeDb, disconnectTestDb } from './helpers';

const usedIps = new Set<string>();
function ip(): string {
  const value = `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`;
  usedIps.add(value);
  return value;
}

function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}@empresa-panel.co`;
}

function validRequest(overrides: Record<string, unknown> = {}) {
  return {
    nombre: 'Laura Panel',
    empresa: 'Panel SAS',
    email: uniqueEmail('laura'),
    telefono: '+57 311 111 1111',
    pais: 'Colombia',
    tamanoEmpresa: '11-50',
    demos: ['erp'],
    casoDeUso: 'Queremos evaluar el ERP para nuestra operación.',
    consentimiento: true,
    ...overrides,
  };
}

async function waitFor<T>(fn: () => Promise<T | null | undefined | false>, timeoutMs = 5000): Promise<T> {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value) return value as T;
    if (Date.now() - start > timeoutMs) throw new Error('waitFor: tiempo agotado');
    await new Promise((r) => setTimeout(r, 50));
  }
}

describeDb('panel de administración (integración)', () => {
  let app: Express;
  let admin: TestUser;
  let sales: TestUser;
  let manager: TestUser;

  beforeAll(async () => {
    await connectTestDb('adminpanel');
    const { createApp } = await import('../../app');
    app = createApp();
    await (await import('../../services/demo-catalog.service')).seedDemoCatalog();
    admin = await createUser('admin');
    sales = await createUser('sales');
    manager = await createUser('manager');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    const { REDIS_OK } = await import('./helpers');
    if (REDIS_OK) {
      const { getRedisClient } = await import('../../config/redis');
      const { hashIp } = await import('../../services/ai-budget.service');
      const redis = await getRedisClient();
      const hashes = new Set<string>();
      for (const value of usedIps) hashes.add(hashIp('demo-request:ip:1h', value));
      for await (const key of redis.scanIterator({ MATCH: 'rl:demo-request:*', COUNT: 500 })) {
        const k = String(key);
        if (k.startsWith('rl:demo-request:email:') || hashes.has(k.split(':').pop() as string)) await redis.del(k);
      }
      await redis.quit();
    }
    await disconnectTestDb();
  });

  async function submit(body: Record<string, unknown>) {
    const res = await request(app).post('/api/demo-requests').set('X-Forwarded-For', ip()).send(body);
    expect(res.status).toBe(201);
    return res.body.data as { codigo: string; fusionada: boolean };
  }

  async function requestDoc(codigo: string) {
    return mongoose.connection.collection('demorequests').findOne({ codigo });
  }

  describe('solicitudes', () => {
    it('una solicitud fusionada avisa al equipo y deja bitácora y actividad del lead', async () => {
      const team = jest.spyOn(await import('../../services/team-notify.service'), 'notifyTeamInBackground');
      const body = validRequest();
      const first = await submit(body);
      const doc = await requestDoc(first.codigo);
      await waitFor(async () => (await requestDoc(first.codigo))?.lead);
      const second = await submit({ ...body, demos: ['hrms'], casoDeUso: 'También queremos ver nómina y vacaciones.' });
      expect(second).toMatchObject({ codigo: first.codigo, fusionada: true });

      const audit = await waitFor(() => mongoose.connection.collection('auditlogs').findOne({ accion: 'demo_request.merge', 'entidad.id': String(doc!._id) }));
      expect(audit.detalle).toMatchObject({ codigo: first.codigo, demos: ['hrms'] });
      const lead = await mongoose.connection.collection('leads').findOne({ email: body.email });
      const activity = await waitFor(() => mongoose.connection.collection('leadactivities').findOne({ lead: lead!._id, tipo: 'sistema', texto: { $regex: 'Volvió a pedir' } }));
      expect(activity.texto).toContain(first.codigo);
      await waitFor(async () => team.mock.calls.some(([n]) => /actualizada/.test(n.asunto)));
      const notice = team.mock.calls.find(([n]) => /actualizada/.test(n.asunto))![0];
      expect(notice.enlace).toContain(`/admin/solicitudes/${String(doc!._id)}`);

      // El historial de la solicitud muestra la fusión.
      const detail = await request(app).get(`/api/admin/demo-requests/${String(doc!._id)}`).set(bearer(sales));
      expect(detail.body.data.historial.map((h: { accion: string }) => h.accion)).toContain('demo_request.merge');
    });

    it('rechazada como spam: su contacto sale de Contactos y queda en Descartados', async () => {
      const body = validRequest({ email: uniqueEmail('spam') });
      const { codigo } = await submit(body);
      const doc = await waitFor(async () => {
        const d = await requestDoc(codigo);
        return d?.lead ? d : null;
      });
      const before = await request(app).get('/api/admin/contacts').query({ q: body.email }).set(bearer(admin));
      expect(before.body.data).toHaveLength(1);
      expect(before.body.data[0]).toMatchObject({ source: 'demo-request', status: 'new', demoRequest: { codigo } });

      const rej = await request(app).post(`/api/admin/demo-requests/${String(doc._id)}/reject`).set(bearer(sales)).send({ motivo: 'spam' });
      expect(rej.status).toBe(200);
      const after = await request(app).get('/api/admin/contacts').query({ q: body.email }).set(bearer(admin));
      expect(after.body.data).toHaveLength(0);
      const discarded = await request(app).get('/api/admin/contacts').query({ q: body.email, status: 'discarded' }).set(bearer(admin));
      expect(discarded.body.data).toHaveLength(1);
      expect(discarded.body.data[0].descartado).toMatchObject({ motivo: 'spam' });
    });

    it('una solicitud en revisión vuelve a pendiente (y queda en la bitácora)', async () => {
      const { codigo } = await submit(validRequest());
      const doc = await requestDoc(codigo);
      const id = String(doc!._id);
      expect((await request(app).patch(`/api/admin/demo-requests/${id}`).set(bearer(sales)).send({ estado: 'en_revision' })).body.data.request.estado).toBe('en_revision');
      const back = await request(app).patch(`/api/admin/demo-requests/${id}`).set(bearer(sales)).send({ estado: 'pendiente', nota: 'Esperando datos del cliente' });
      expect(back.status).toBe(200);
      expect(back.body.data.request.estado).toBe('pendiente');
      const logs = await mongoose.connection.collection('auditlogs').find({ accion: 'demo_request.update', 'entidad.id': id }).toArray();
      expect(logs.at(-1)?.detalle).toMatchObject({ de: 'en_revision', a: 'pendiente' });
    });
  });

  describe('accesos', () => {
    it('no concede acceso a una demo desactivada (ni al aprobar ni por invitación)', async () => {
      expect((await request(app).patch('/api/admin/demo-catalog/lms').set(bearer(admin)).send({ activo: false })).status).toBe(200);
      try {
        const direct = await request(app).post('/api/admin/demo-grants').set(bearer(sales)).send({ email: uniqueEmail('inactiva'), nombre: 'Inactiva', demos: ['lms', 'erp'] });
        expect(direct.status).toBe(409);
        expect(direct.body).toMatchObject({ code: 'demo_inactive', demos: ['lms'] });
        expect(direct.body.message).toMatch(/desactivadas/);
        expect(await mongoose.connection.collection('demogrants').countDocuments({ demoSlug: 'lms' })).toBe(0);

        const { codigo } = await submit(validRequest({ demos: ['lms'] }));
        const doc = await requestDoc(codigo);
        const approve = await request(app).post(`/api/admin/demo-requests/${String(doc!._id)}/approve`).set(bearer(admin)).send({});
        expect(approve.status).toBe(409);
        expect((await requestDoc(codigo))?.estado).toBe('pendiente');
      } finally {
        await request(app).patch('/api/admin/demo-catalog/lms').set(bearer(admin)).send({ activo: true });
      }
    });

    it('el enlace de activación nuevo desde Accesos trae el teléfono para WhatsApp', async () => {
      const email = uniqueEmail('tel');
      const inv = await request(app).post('/api/admin/demo-grants').set(bearer(sales)).send({ email, nombre: 'Con Teléfono', telefono: '+57 320 222 3333', demos: ['erp'] });
      expect(inv.status).toBe(201);
      const list = await request(app).get('/api/admin/demo-grants').query({ q: email }).set(bearer(sales));
      expect(list.body.data.items[0].user).toMatchObject({ email, phone: '+57 320 222 3333' });
      const again = await request(app).post(`/api/admin/demo-grants/${list.body.data.items[0].id}/resend-activation`).set(bearer(sales));
      expect(again.status).toBe(200);
      expect(again.body.data.user.phone).toBe('+57 320 222 3333');
    });
  });

  describe('bitácora', () => {
    it('solo admin; filtra por grupo, persona y fechas; lista las acciones', async () => {
      expect((await request(app).get('/api/admin/audit-log').set(bearer(manager))).status).toBe(403);
      expect((await request(app).get('/api/admin/audit-log/acciones').set(bearer(sales))).status).toBe(403);
      const acciones = await request(app).get('/api/admin/audit-log/acciones').set(bearer(admin));
      expect(acciones.status).toBe(200);
      expect(acciones.body.data).toEqual(expect.arrayContaining(['demo_request.update', 'demo_grant.create']));

      const byGroup = await request(app).get('/api/admin/audit-log').query({ categoria: 'demo_grant', limit: 50 }).set(bearer(admin));
      expect(byGroup.body.data.items.length).toBeGreaterThan(0);
      expect(byGroup.body.data.items.every((i: { accion: string }) => i.accion.startsWith('demo_grant.'))).toBe(true);

      const byActor = await request(app).get('/api/admin/audit-log').query({ actor: sales.email.slice(0, 12) }).set(bearer(admin));
      expect(byActor.body.data.items.every((i: { actorEmail: string }) => i.actorEmail === sales.email)).toBe(true);

      const future = await request(app).get('/api/admin/audit-log').query({ desde: '2099-01-01' }).set(bearer(admin));
      expect(future.body.data.total).toBe(0);
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
      const range = await request(app).get('/api/admin/audit-log').query({ desde: today, hasta: today }).set(bearer(admin));
      expect(range.body.data.total).toBeGreaterThan(0);
      expect((await request(app).get('/api/admin/audit-log').query({ desde: 'ayer' }).set(bearer(admin))).status).toBe(400);
    });
  });

  describe('contactos y usuarios', () => {
    it('buscador, filtro de origen y estado que se refleja', async () => {
      const Contact = (await import('../../models/Contact')).default;
      const c = await Contact.create({ name: 'Rodrigo Origen', email: 'rodrigo@origen.test', service: 'Chatbot', message: 'Hola', source: 'demo-rag' });
      await Contact.create({ name: 'Otra Persona', email: 'otra@origen.test', service: 'ERP', message: 'Hola' });
      const q = await request(app).get('/api/admin/contacts').query({ q: 'rodrigo' }).set(bearer(manager));
      expect(q.body.data).toHaveLength(1);
      expect(q.body.data[0]).toMatchObject({ source: 'demo-rag', demoRequest: null });
      const bySource = await request(app).get('/api/admin/contacts').query({ source: 'contact-form', q: 'origen.test' }).set(bearer(manager));
      expect(bySource.body.data.map((x: { email: string }) => x.email)).toEqual(['otra@origen.test']);
      const upd = await request(app).patch(`/api/admin/contacts/${String(c._id)}/status`).set(bearer(manager)).send({ status: 'responded' });
      expect(upd.body.data.status).toBe('responded');
      expect((await request(app).get('/api/admin/contacts').query({ status: 'responded', q: 'rodrigo' }).set(bearer(manager))).body.data).toHaveLength(1);
    });

    it('usuarios: el admin da cualquiera de los 7 roles; la lista trae teléfono y estado', async () => {
      const u = await createUser('user');
      for (const role of ['sales', 'prospect', 'client', 'developer', 'manager', 'user']) {
        const res = await request(app).patch(`/api/admin/users/${u.id}/role`).set(bearer(admin)).send({ role });
        expect(res.status).toBe(200);
        expect(res.body.data.role).toBe(role);
      }
      expect((await request(app).patch(`/api/admin/users/${u.id}/role`).set(bearer(manager)).send({ role: 'client' })).status).toBe(403);
      const list = await request(app).get('/api/admin/users').query({ search: u.email }).set(bearer(manager));
      expect(list.body.data[0]).toMatchObject({ email: u.email, role: 'user', accountStatus: 'activo', phone: null });
    });
  });
});
