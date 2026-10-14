/**
 * Autorización de datos (Ley 1581 de 2012) en los formularios públicos:
 *  - /contact: casilla obligatoria, campo trampa, prueba de la autorización
 *    (versión de la política del SERVIDOR, fecha, hash de la IP), plazo y
 *    errores de validación con el campo que falló.
 *  - "Solicitar demo": la versión de la política la fija el servidor.
 *  - "Prueba con tu documento": la autorización queda estructurada en el
 *    lead y, si el lead no se puede guardar, el documento no se procesa.
 */
import request from 'supertest';
import type { Express } from 'express';
import mongoose from 'mongoose';
import { bearer, connectTestDb, createUser, describeDb, disconnectTestDb, REDIS_OK } from './helpers';

const SERVER_POLICY = '2026-10-servidor';

describeDb('autorización de datos en formularios públicos (integración)', () => {
  let app: Express;
  const prev = {
    policy: process.env.PRIVACY_POLICY_VERSION,
    upload: process.env.DEMO_UPLOAD_ENABLED,
  };

  beforeAll(async () => {
    process.env.PRIVACY_POLICY_VERSION = SERVER_POLICY;
    process.env.DEMO_UPLOAD_ENABLED = 'true';
    await connectTestDb('consent');
    if (REDIS_OK) {
      // Cupos diarios de la demo RAG de corridas anteriores (solo la base de pruebas).
      const { getRedisClient } = await import('../../config/redis');
      const redis = await getRedisClient();
      for await (const key of redis.scanIterator({ MATCH: 'demo-rag:docs:*' })) await redis.del(key);
    }
    const { createApp } = await import('../../app');
    app = createApp();
  });

  afterAll(async () => {
    if (prev.policy === undefined) delete process.env.PRIVACY_POLICY_VERSION;
    else process.env.PRIVACY_POLICY_VERSION = prev.policy;
    if (prev.upload === undefined) delete process.env.DEMO_UPLOAD_ENABLED;
    else process.env.DEMO_UPLOAD_ENABLED = prev.upload;
    if (REDIS_OK) {
      const { getRedisClient } = await import('../../config/redis');
      const redis = await getRedisClient().catch(() => null);
      await redis?.quit().catch(() => undefined);
    }
    await disconnectTestDb();
  });

  // IP distinta por petición: el cupo estricto de /contact es 5 por minuto e
  // IP y el de la demo RAG, 3 documentos al día (en Redis): el prefijo cambia
  // en cada corrida para no heredar cupos de una corrida anterior.
  const run = 1 + Math.floor(Math.random() * 250);
  let n = 0;
  const ip = () => `10.${run}.${Math.floor(n / 250)}.${(n++ % 250) + 1}`;
  const uniqueEmail = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`;

  const contactBody = (email: string, extra: Record<string, unknown> = {}) => ({
    name: 'Laura Prueba',
    email,
    phone: '+57 300 111 2222',
    company: 'Empresa Prueba',
    service: 'Sistema RAG',
    budget: '15-40m',
    message: 'Quiero un asistente para responder con nuestros manuales.',
    consentimiento: true,
    website: '',
    ...extra,
  });

  describe('POST /api/contact', () => {
    it('sin la casilla de autorización responde 400 con el campo y no guarda nada', async () => {
      const email = uniqueEmail('sin-consent');
      const res = await request(app).post('/api/contact').set('X-Forwarded-For', ip()).send(contactBody(email, { consentimiento: false }));
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ success: false, code: 'consent_required', fields: ['consentimiento'] });
      expect(res.body.errores.consentimiento).toMatch(/autorización/);
      expect(await mongoose.connection.collection('contacts').countDocuments({ email })).toBe(0);
    });

    it('el campo trampa lleno responde como un envío normal pero no guarda nada', async () => {
      const email = uniqueEmail('bot');
      const res = await request(app).post('/api/contact').set('X-Forwarded-For', ip()).send(contactBody(email, { website: 'https://spam.example' }));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(await mongoose.connection.collection('contacts').countDocuments({ email })).toBe(0);
      expect(await mongoose.connection.collection('leads').countDocuments({ email })).toBe(0);
    });

    it('los errores de validación dicen qué campo falló y por qué', async () => {
      const res = await request(app)
        .post('/api/contact')
        .set('X-Forwarded-For', ip())
        .send(contactBody('no-es-un-email', { message: '', timeline: 'mañana', name: 'x'.repeat(121) }));
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('invalid_request');
      expect(res.body.fields).toEqual(expect.arrayContaining(['email', 'message', 'timeline', 'name']));
      expect(res.body.errores).toMatchObject({
        email: 'Escribe un email válido.',
        message: 'Cuéntanos sobre tu proyecto.',
        timeline: 'Elige cuándo quieres empezar de la lista.',
      });
      expect(res.body.message).toBeTruthy();
    });

    it('guarda la prueba de la autorización (versión del servidor, fecha, hash de IP) y el plazo, y el panel los muestra', async () => {
      const email = uniqueEmail('con-consent');
      const before = Date.now();
      const res = await request(app)
        .post('/api/contact')
        .set('X-Forwarded-For', '203.0.113.45')
        .set('User-Agent', 'Navegador de prueba')
        .send(contactBody(email, { timeline: 'now', versionPolitica: 'version-del-cliente' }));
      expect(res.status).toBe(200);

      const contact = await mongoose.connection.collection('contacts').findOne({ email });
      expect(contact?.plazo).toBe('now');
      expect(contact?.consentimiento).toMatchObject({ aceptado: true, versionPolitica: SERVER_POLICY, userAgent: 'Navegador de prueba' });
      expect((contact?.consentimiento.fecha as Date).getTime()).toBeGreaterThanOrEqual(before - 1000);
      expect(contact?.consentimiento.ipHash).toMatch(/^[a-f0-9]{32}$/);
      expect(JSON.stringify(contact)).not.toContain('203.0.113.45');

      const admin = await createUser('admin');
      const list = await request(app).get('/api/admin/contacts').set(bearer(admin));
      const item = list.body.data.find((c: { email: string }) => c.email === email);
      expect(item).toMatchObject({ plazo: 'now', consentimiento: { aceptado: true, versionPolitica: SERVER_POLICY } });
      expect(item.consentimiento.ipHash).toBeUndefined();
    });
  });

  describe('POST /api/demo-requests', () => {
    it('ignora la versión de la política que envía el cliente', async () => {
      const email = uniqueEmail('demo');
      const res = await request(app)
        .post('/api/demo-requests')
        .set('X-Forwarded-For', ip())
        .send({
          nombre: 'Ana Prueba',
          empresa: 'ACME SAS',
          email,
          pais: 'Colombia',
          tamanoEmpresa: '11-50',
          demos: ['erp'],
          casoDeUso: 'Queremos ver el ERP para controlar inventario.',
          consentimiento: true,
          versionPolitica: '1999-01-falsa',
        });
      expect(res.status).toBe(201);
      const saved = await mongoose.connection.collection('demorequests').findOne({ email });
      expect(saved?.consentimiento.versionPolitica).toBe(SERVER_POLICY);
    });
  });

  (REDIS_OK ? describe : describe.skip)('POST /api/demo-rag/documents', () => {
    const upload = (email: string, opts: { consent?: string; ip?: string } = {}) =>
      request(app)
        .post('/api/demo-rag/documents')
        .set('X-Forwarded-For', opts.ip ?? ip())
        .field('email', email)
        .field('consent', opts.consent ?? 'true')
        .attach('file', Buffer.from('Politica de garantia.\n\nLa garantia de los equipos es de doce meses desde la compra.'), {
          filename: 'garantia.txt',
          contentType: 'text/plain',
        });

    it('guarda la autorización estructurada en el lead antes de procesar el documento', async () => {
      const email = uniqueEmail('rag');
      const res = await upload(email);
      expect(res.status).toBe(201);
      const contact = await mongoose.connection.collection('contacts').findOne({ email, source: 'demo-rag' });
      expect(contact?.consentimiento).toMatchObject({ aceptado: true, versionPolitica: SERVER_POLICY });
      expect(contact?.consentimiento.ipHash).toMatch(/^[a-f0-9]{32}$/);
      // El resultado del procesamiento se agrega al mensaje del lead.
      await new Promise((r) => setTimeout(r, 100));
      const updated = await mongoose.connection.collection('contacts').findOne({ _id: contact!._id });
      expect(updated?.message).toMatch(/Documento procesado: 1 página/);
    });

    it('sin autorización no registra nada', async () => {
      const email = uniqueEmail('rag-sin');
      const res = await upload(email, { consent: 'false' });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('consent_required');
      expect(await mongoose.connection.collection('contacts').countDocuments({ email })).toBe(0);
    });

    it('si el lead no se puede guardar, NO procesa el documento y lo dice', async () => {
      const leadService = await import('../../services/lead.service');
      const ragService = await import('../../services/demo-rag.service');
      const failLead = jest.spyOn(leadService, 'registerLead').mockRejectedValueOnce(new Error('MongoDB caído'));
      const ingest = jest.spyOn(ragService, 'ingestDocument');
      const sameIp = ip();
      try {
        const res = await upload(uniqueEmail('rag-falla'), { ip: sameIp });
        expect(res.status).toBe(503);
        expect(res.body.code).toBe('lead_unavailable');
        expect(res.body.message).toMatch(/no procesamos tu documento/);
        expect(ingest).not.toHaveBeenCalled();
      } finally {
        failLead.mockRestore();
        ingest.mockRestore();
      }
      // El cupo diario se devolvió: la misma IP puede subir sus 3 documentos.
      for (let i = 0; i < 3; i += 1) {
        expect((await upload(uniqueEmail(`rag-ok-${i}`), { ip: sameIp })).status).toBe(201);
      }
    });
  });
});
