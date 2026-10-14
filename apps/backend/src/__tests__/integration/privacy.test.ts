/**
 * Admin › Privacidad (Ley 1581): buscar por email todo lo que el sistema
 * guarda de una persona, exportarlo y suprimirlo. Solo rol admin.
 *
 * Corre con el flujo de compra activo (COMMERCE_ENABLED=true) para cubrir
 * también los Leads y su línea de tiempo; apagado no se escriben (ver
 * commerce-flag.test.ts).
 */
import request from 'supertest';
import type { Express } from 'express';
import mongoose from 'mongoose';
import { bearer, connectTestDb, createUser, describeDb, disconnectTestDb, REDIS_OK, type TestUser } from './helpers';

describeDb('Admin › Privacidad: derechos del titular (integración)', () => {
  let app: Express;
  let admin: TestUser;
  let sales: TestUser;
  let manager: TestUser;

  const run = 1 + Math.floor(Math.random() * 250);
  let n = 0;
  const ip = () => `10.${run}.${Math.floor(n / 250)}.${(n++ % 250) + 1}`;

  // Gmail: el email escrito con puntos y alias se normaliza igual que el login.
  const stamp = `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
  const WRITTEN = `Titular.Prueba.${stamp}+alias@Gmail.com`;
  const NORMALIZED = `titularprueba${stamp}@gmail.com`;

  const prevCommerce = process.env.COMMERCE_ENABLED;

  beforeAll(async () => {
    process.env.COMMERCE_ENABLED = 'true';
    await connectTestDb('privacy');
    const { createApp } = await import('../../app');
    app = createApp();
    admin = await createUser('admin');
    sales = await createUser('sales');
    manager = await createUser('manager');

    // 1. Formulario de contacto y solicitud de demo con el mismo email.
    const contact = await request(app)
      .post('/api/contact')
      .set('X-Forwarded-For', ip())
      .send({ name: 'Titular Prueba', email: WRITTEN, service: 'Sistema RAG', message: 'Hola, quiero información.', consentimiento: true, timeline: '1m' });
    expect(contact.status).toBe(200);
    const demo = await request(app)
      .post('/api/demo-requests')
      .set('X-Forwarded-For', ip())
      .send({
        nombre: 'Titular Prueba',
        empresa: 'Empresa del Titular',
        email: WRITTEN,
        pais: 'Colombia',
        tamanoEmpresa: '1-10',
        demos: ['erp'],
        casoDeUso: 'Quiero probar el ERP para mi empresa.',
        consentimiento: true,
      });
    expect(demo.status).toBe(201);
    // Espera a que el lead de la solicitud quede registrado.
    await new Promise((r) => setTimeout(r, 300));
    const saved = await mongoose.connection.collection('demorequests').findOne({ email: NORMALIZED });
    // 2. El equipo la aprueba: cuenta prospect, acceso, enlace de activación y bitácora.
    const approve = await request(app).post(`/api/admin/demo-requests/${saved!._id}/approve`).set(bearer(sales)).send({ dias: 7 });
    expect(approve.status).toBe(200);
    // 3. Una pregunta al chatbot que contiene el email.
    await mongoose.connection.collection('chatbot_turns').insertOne({
      botId: 'kbot_privacidad',
      turnId: 'msg_priv',
      role: 'user',
      content: `Mi correo es ${NORMALIZED}, ¿me pueden escribir?`,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
    });
  });

  afterAll(async () => {
    if (prevCommerce === undefined) delete process.env.COMMERCE_ENABLED;
    else process.env.COMMERCE_ENABLED = prevCommerce;
    if (REDIS_OK) {
      const { getRedisClient } = await import('../../config/redis');
      const redis = await getRedisClient().catch(() => null);
      await redis?.quit().catch(() => undefined);
    }
    await disconnectTestDb();
  });

  const search = (u: TestUser | null, email: string) => {
    const r = request(app).post('/api/admin/privacy/search').send({ email });
    return u ? r.set(bearer(u)) : r;
  };

  it('solo el rol admin puede usar la API de privacidad', async () => {
    expect((await search(null, WRITTEN)).status).toBe(401);
    expect((await search(sales, WRITTEN)).status).toBe(403);
    expect((await search(manager, WRITTEN)).status).toBe(403);
    for (const path of ['export', 'erase']) {
      expect((await request(app).post(`/api/admin/privacy/${path}`).set(bearer(sales)).send({ email: WRITTEN, confirmacion: WRITTEN })).status).toBe(403);
    }
    // Email inválido: 400 con el campo.
    const bad = await search(admin, 'no-es-email');
    expect(bad.status).toBe(400);
    expect(bad.body.fields).toEqual(['email']);
  });

  it('encuentra todo lo que se guarda de la persona (por el email escrito o normalizado)', async () => {
    const res = await search(admin, WRITTEN);
    expect(res.status).toBe(200);
    const { resumen, datos, correosBuscados, bloqueos } = res.body.data;
    expect(correosBuscados).toEqual(expect.arrayContaining([WRITTEN.toLowerCase(), NORMALIZED]));
    expect(resumen).toMatchObject({ cuentas: 1, solicitudesDemo: 1, accesosDemo: 1, enlacesDeUnSoloUso: 1, leads: 1, conversacionesChatbot: 1 });
    expect(resumen.contactos).toBeGreaterThanOrEqual(2); // formulario + solicitud de demo
    expect(resumen.actividadesLead).toBeGreaterThanOrEqual(1);
    expect(resumen.bitacora).toBeGreaterThanOrEqual(2); // aprobación y acceso creado
    expect(bloqueos).toEqual([]);
    // Sin secretos: ni contraseña, ni hash de tokens.
    expect(JSON.stringify(datos)).not.toMatch(/"password"|"tokenHash"/);
    expect(datos.cuentas[0]).toMatchObject({ email: NORMALIZED, role: 'prospect' });
    expect(datos.contactos.find((c: { source: string }) => c.source === 'contact-form')).toMatchObject({ plazo: '1m' });
    expect(res.body.data.plazos).toMatchObject({ conservacionMeses: 24, conversacionesChatbotDias: 30 });
    // La consulta queda en la bitácora sin datos personales.
    const log = await mongoose.connection.collection('auditlogs').findOne({ accion: 'privacy.search' }, { sort: { createdAt: -1 } });
    expect(log).toBeTruthy();
    expect(JSON.stringify(log)).not.toContain(NORMALIZED);
  });

  it('exporta los datos en un archivo JSON', async () => {
    const res = await request(app).post('/api/admin/privacy/export').set(bearer(admin)).send({ email: NORMALIZED });
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="datos-titular-\d{4}-\d{2}-\d{2}\.json"/);
    expect(res.body).toMatchObject({ responsable: 'KopTup', norma: 'Ley 1581 de 2012 (Colombia)' });
    expect(res.body.datos.solicitudesDemo[0]).toMatchObject({ email: NORMALIZED, empresa: 'Empresa del Titular' });
    expect(JSON.stringify(res.body)).not.toMatch(/"password"|"tokenHash"/);
  });

  it('suprimir exige escribir otra vez el mismo email', async () => {
    const res = await request(app).post('/api/admin/privacy/erase').set(bearer(admin)).send({ email: WRITTEN, confirmacion: 'otro@correo.com' });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: 'confirmation_mismatch', fields: ['confirmacion'] });
    expect((await search(admin, WRITTEN)).body.data.resumen.cuentas).toBe(1);
  });

  it('no suprime cuentas del equipo', async () => {
    const res = await request(app).post('/api/admin/privacy/erase').set(bearer(admin)).send({ email: sales.email, confirmacion: sales.email });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('team_account');
  });

  it('no suprime si hay registros contractuales (propuesta aceptada): la ley obliga a conservarlos', async () => {
    const email = `cliente-${stamp}@empresa.co`;
    const lead = await mongoose.connection.collection('leads').insertOne({ email, nombre: 'Cliente', etapa: 'ganado', origenes: [], origenPrincipal: 'manual', intereses: [], contactos: 0, ultimaActividadEn: new Date(), etapaCambiadaEn: new Date() });
    await mongoose.connection.collection('proposals').insertOne({ numero: `KOP-T-${stamp}`, lead: lead.insertedId, estado: 'aceptada', cliente: { nombre: 'Cliente', email }, pago: { estado: 'pendiente' } });
    const res = await request(app).post('/api/admin/privacy/erase').set(bearer(admin)).send({ email, confirmacion: email });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('contractual_records');
    expect(res.body.bloqueos[0]).toMatchObject({ motivo: 'contractual_records', detalle: { propuestas: 1 } });
    expect(await mongoose.connection.collection('leads').countDocuments({ email })).toBe(1);
  });

  it('suprime todo de forma irreversible y deja en la bitácora una constancia sin datos personales', async () => {
    const auditBefore = await mongoose.connection.collection('auditlogs').countDocuments({ accion: { $in: ['demo_request.approve', 'demo_grant.create'] } });
    const user = await mongoose.connection.collection('users').findOne({ email: NORMALIZED });

    const res = await request(app).post('/api/admin/privacy/erase').set(bearer(admin)).send({ email: WRITTEN, confirmacion: ` ${WRITTEN.toUpperCase()} ` });
    expect(res.status).toBe(200);
    const { referencia, eliminados, anonimizados } = res.body.data;
    expect(referencia).toMatch(/^SUP-\d{4}-[0-9A-F]{8}$/);
    expect(eliminados).toMatchObject({ cuentas: 1, solicitudesDemo: 1, accesosDemo: 1, enlacesDeUnSoloUso: 1, leads: 1, conversacionesChatbot: 1 });
    expect(anonimizados.bitacora).toBeGreaterThanOrEqual(2);

    // Ya no queda nada de la persona.
    const after = await search(admin, WRITTEN);
    expect(Object.values(after.body.data.resumen).every((v) => v === 0)).toBe(true);
    const db = mongoose.connection;
    expect(await db.collection('users').countDocuments({ email: NORMALIZED })).toBe(0);
    expect(await db.collection('contacts').countDocuments({ email: NORMALIZED })).toBe(0);
    expect(await db.collection('demogrants').countDocuments({ user: user!._id })).toBe(0);
    expect(await db.collection('magiclinktokens').countDocuments({ user: user!._id })).toBe(0);
    expect(await db.collection('chatbot_turns').countDocuments({ turnId: 'msg_priv' })).toBe(0);

    // La bitácora conserva la acción del equipo, sin los datos de la persona.
    const kept = await db.collection('auditlogs').find({ accion: { $in: ['demo_request.approve', 'demo_grant.create'] } }).toArray();
    expect(kept).toHaveLength(auditBefore);
    expect(JSON.stringify(kept)).not.toContain(NORMALIZED);
    expect(kept.every((k) => k.actorEmail === sales.email)).toBe(true);

    // Constancia de la supresión: referencia y conteos, sin email ni nombre.
    const proof = await db.collection('auditlogs').findOne({ accion: 'privacy.erase' });
    expect(proof).toMatchObject({ actorEmail: admin.email, entidad: { tipo: 'Titular', id: referencia }, detalle: { referencia } });
    expect(JSON.stringify(proof)).not.toMatch(new RegExp(`${NORMALIZED}|Titular Prueba|Empresa del Titular`, 'i'));

    // Otra supresión: no queda nada.
    const again = await request(app).post('/api/admin/privacy/erase').set(bearer(admin)).send({ email: WRITTEN, confirmacion: WRITTEN });
    expect(again.status).toBe(404);
  });
});
