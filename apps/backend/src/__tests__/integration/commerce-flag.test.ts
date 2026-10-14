/**
 * Flujo de compra apagado por defecto (COMMERCE_ENABLED): el pipeline de
 * leads, las propuestas y los pagos siguen en desarrollo. Sin la variable en
 * `true`:
 *  - sus rutas no se montan (404, también para el admin), y
 *  - ningún formulario ni acceso escribe Leads: el formulario de contacto,
 *    «Prueba con tu documento», la solicitud de demo aprobada y la invitación
 *    directa guardan solo lo de siempre (Contact, DemoRequest, DemoGrant).
 * Con la variable en `true`, el contacto se liga a su Lead.
 */
import request from 'supertest';
import type { Express } from 'express';
import mongoose from 'mongoose';
import { bearer, connectTestDb, createUser, describeDbRedis, disconnectTestDb, type TestUser } from './helpers';

describeDbRedis('flujo de compra apagado por defecto (integración)', () => {
  let app: Express;
  let admin: TestUser;
  let sales: TestUser;
  const prev = { commerce: process.env.COMMERCE_ENABLED, upload: process.env.DEMO_UPLOAD_ENABLED };

  beforeAll(async () => {
    delete process.env.COMMERCE_ENABLED;
    process.env.DEMO_UPLOAD_ENABLED = 'true';
    await connectTestDb('commerce_flag');
    // Cupos diarios de la demo RAG de corridas anteriores (solo la base de pruebas).
    const { getRedisClient } = await import('../../config/redis');
    const redis = await getRedisClient();
    for await (const key of redis.scanIterator({ MATCH: 'demo-rag:docs:*' })) await redis.del(key);
    const { createApp } = await import('../../app');
    app = createApp();
    admin = await createUser('admin');
    sales = await createUser('sales');
  });

  afterAll(async () => {
    if (prev.commerce === undefined) delete process.env.COMMERCE_ENABLED;
    else process.env.COMMERCE_ENABLED = prev.commerce;
    if (prev.upload === undefined) delete process.env.DEMO_UPLOAD_ENABLED;
    else process.env.DEMO_UPLOAD_ENABLED = prev.upload;
    const { getRedisClient } = await import('../../config/redis');
    const redis = await getRedisClient().catch(() => null);
    await redis?.quit().catch(() => undefined);
    await disconnectTestDb();
  });

  // IP distinta por petición (cupos por IP del formulario y de la demo RAG).
  const run = 1 + Math.floor(Math.random() * 250);
  let n = 0;
  const ip = () => `10.${run}.${Math.floor(n / 250)}.${(n++ % 250) + 1}`;
  const uniqueEmail = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`;
  const db = () => mongoose.connection;

  async function waitFor<T>(fn: () => Promise<T | null | undefined>, ms = 3000): Promise<T> {
    const until = Date.now() + ms;
    for (;;) {
      const value = await fn();
      if (value) return value;
      if (Date.now() > until) throw new Error('waitFor: tiempo agotado');
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  it('apagado: las rutas del flujo de compra responden 404, también para el admin', async () => {
    const routes: Array<['get' | 'post', string]> = [
      ['get', '/api/admin/leads'],
      ['get', '/api/admin/proposals'],
      ['get', '/api/admin/settings/commerce'],
      ['get', '/api/proposals/public/token-de-prueba'],
      ['get', '/api/me/proposals'],
      ['post', '/api/me/proposal-requests'],
      ['get', '/api/payments/config'],
    ];
    for (const [method, path] of routes) {
      const res = await request(app)[method](path).set(bearer(admin)).send({});
      expect({ path, status: res.status, code: res.body.code }).toEqual({ path, status: 404, code: 'not_found' });
    }
  });

  it('apagado: contacto, «Prueba con tu documento», solicitud aprobada e invitación directa no escriben Leads', async () => {
    // Formulario de /contact.
    const contactEmail = uniqueEmail('contacto');
    const contact = await request(app)
      .post('/api/contact')
      .set('X-Forwarded-For', ip())
      .send({ name: 'Laura Prueba', email: contactEmail, service: 'Sistema RAG', message: 'Quiero información del sistema RAG.', consentimiento: true });
    expect(contact.status).toBe(200);

    // «Prueba con tu documento» (embudo RAG).
    const ragEmail = uniqueEmail('rag');
    const rag = await request(app)
      .post('/api/demo-rag/documents')
      .set('X-Forwarded-For', ip())
      .field('email', ragEmail)
      .field('consent', 'true')
      .attach('file', Buffer.from('Politica de garantia.\n\nLa garantia de los equipos es de doce meses desde la compra.'), {
        filename: 'garantia.txt',
        contentType: 'text/plain',
      });
    expect(rag.status).toBe(201);

    // Solicitud de demo y aprobación del equipo.
    const requestEmail = uniqueEmail('solicitud');
    const created = await request(app)
      .post('/api/demo-requests')
      .set('X-Forwarded-For', ip())
      .send({
        nombre: 'Mario Prueba',
        empresa: 'Empresa de Prueba',
        email: requestEmail,
        pais: 'Colombia',
        tamanoEmpresa: '1-10',
        demos: ['erp'],
        casoDeUso: 'Quiero probar el ERP para mi empresa.',
        consentimiento: true,
      });
    expect(created.status).toBe(201);
    const saved = await waitFor(() => db().collection('demorequests').findOne({ email: requestEmail, lead: { $exists: true } }));
    const approve = await request(app).post(`/api/admin/demo-requests/${saved._id}/approve`).set(bearer(sales)).send({ dias: 7 });
    expect(approve.status).toBe(200);

    // Invitación directa del equipo.
    const invite = await request(app)
      .post('/api/admin/demo-grants')
      .set(bearer(admin))
      .send({ email: uniqueEmail('invitado'), nombre: 'Persona Invitada', demos: ['erp'] });
    expect(invite.status).toBe(201);

    // Se guardó lo de siempre...
    for (const [email, source] of [
      [contactEmail, 'contact-form'],
      [ragEmail, 'demo-rag'],
      [requestEmail, 'demo-request'],
    ]) {
      expect(await db().collection('contacts').countDocuments({ email, source })).toBe(1);
    }
    expect(await db().collection('demogrants').countDocuments({})).toBe(2);
    // ...pero nada del pipeline comercial.
    await new Promise((r) => setTimeout(r, 200));
    expect(await db().collection('leads').countDocuments({})).toBe(0);
    expect(await db().collection('leadactivities').countDocuments({})).toBe(0);
    expect(await db().collection('contacts').countDocuments({ lead: { $exists: true, $ne: null } })).toBe(0);
  });

  it('encendido (COMMERCE_ENABLED=true): el contacto se liga a su Lead con los intereses de la cotización', async () => {
    process.env.COMMERCE_ENABLED = 'true';
    try {
      const email = uniqueEmail('cotiza');
      const res = await request(app)
        .post('/api/contact')
        .set('X-Forwarded-For', ip())
        .send({
          name: 'Carolina Prueba',
          email,
          message: 'Quiero cotizar esta solución para mi empresa.',
          consentimiento: true,
          service: 'CRM con IA — Nivel Profesional · Suscripción SaaS mensual',
          quote: { service: 'crm-ia', tier: 'profesional', modality: 'saas' },
        });
      expect(res.status).toBe(200);
      const lead = await db().collection('leads').findOne({ email });
      expect(lead?.intereses).toContain('CRM con IA — Nivel Profesional · Suscripción SaaS mensual');
      const contact = await db().collection('contacts').findOne({ email });
      expect(String(contact?.lead)).toBe(String(lead?._id));
    } finally {
      delete process.env.COMMERCE_ENABLED;
    }
  });
});
