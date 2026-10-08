/**
 * Sistema de solicitud y acceso a demos (wiki 04) de punta a punta con
 * supertest + MongoDB real (+ Redis si REDIS_URL_TEST responde):
 *
 *  - catálogo sembrado (28 demos) y modos editables;
 *  - solicitar → aprobar → activar → Mis demos → demo-access → API protegida
 *    → revocar → denegado;
 *  - permisos (no-staff no aprueba; sales no toca demos privadas; un
 *    prospecto no ve accesos de otros);
 *  - enlace mágico de un solo uso, vencido y reemplazado;
 *  - honeypot, consentimiento obligatorio, validación y rate-limit;
 *  - vigencia evaluada en tiempo real y job de expiración con candado.
 */
import request from 'supertest';
import type { Express } from 'express';
import mongoose from 'mongoose';
import {
  REDIS_OK,
  TestUser,
  bearer,
  connectTestDb,
  createUser,
  describeDb,
  disconnectTestDb,
} from './helpers';

const DAY = 24 * 60 * 60 * 1000;

const usedIps = new Set<string>();
/** IP aleatoria por petición (los límites por IP no se cruzan entre pruebas ni corridas). */
function ip(): string {
  const value = `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`;
  usedIps.add(value);
  return value;
}

function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}@empresa-prueba.co`;
}

function validRequest(overrides: Record<string, unknown> = {}) {
  return {
    nombre: 'Ana Prueba',
    empresa: 'ACME SAS',
    cargo: 'Gerente de operaciones',
    email: uniqueEmail('ana'),
    telefono: '+57 300 000 0000',
    pais: 'Colombia',
    tamanoEmpresa: '11-50',
    demos: ['erp'],
    casoDeUso: 'Queremos ver el ERP para controlar inventario y facturación.',
    consentimiento: true,
    origen: { pagina: '/demo/erp', utm: { source: 'google', campaign: 'prueba' } },
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

describeDb('sistema de demos (integración)', () => {
  let app: Express;
  let admin: TestUser;
  let sales: TestUser;
  let manager: TestUser;
  let developer: TestUser;
  let plainUser: TestUser;
  let emailService: typeof import('../../services/email.service').emailService;
  let catalogSvc: typeof import('../../services/demo-catalog.service');

  beforeAll(async () => {
    await connectTestDb('demos');
    const { createApp } = await import('../../app');
    app = createApp();
    catalogSvc = await import('../../services/demo-catalog.service');
    await catalogSvc.seedDemoCatalog();
    emailService = (await import('../../services/email.service')).emailService;
    admin = await createUser('admin');
    sales = await createUser('sales');
    manager = await createUser('manager');
    developer = await createUser('developer');
    plainUser = await createUser('user');
  });

  afterAll(async () => {
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
      await redis.del('jobs:demo-grants:lock');
      await redis.quit();
    }
    await disconnectTestDb();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /** Envía una solicitud válida y devuelve su documento. */
  async function submit(overrides: Record<string, unknown> = {}) {
    const body = validRequest(overrides);
    const res = await request(app).post('/api/demo-requests').set('X-Forwarded-For', ip()).send(body);
    expect(res.status).toBe(201);
    const DemoRequest = (await import('../../models/DemoRequest')).default;
    const doc = await DemoRequest.findOne({ codigo: res.body.data.codigo });
    expect(doc).toBeTruthy();
    return { res, body, doc: doc! };
  }

  async function activate(token: string, password = 'ClaveSegura2026') {
    return request(app).post('/api/auth/activate').set('X-Forwarded-For', ip()).send({ token, password });
  }

  function tokenFromUrl(url: string): string {
    return url.split('/').pop() as string;
  }

  // -------------------------------------------------------------------------
  describe('catálogo', () => {
    it('la semilla es idempotente: 28 demos (18 públicas, 8 por solicitud, 2 privadas)', async () => {
      expect(await catalogSvc.seedDemoCatalog()).toBe(0);
      const res = await request(app).get('/api/demo-catalog');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(28);
      const counts = (res.body.data as Array<{ accessMode: string }>).reduce<Record<string, number>>((acc, d) => {
        acc[d.accessMode] = (acc[d.accessMode] ?? 0) + 1;
        return acc;
      }, {});
      expect(counts).toEqual({ publico: 18, solicitud: 8, privado: 2 });
      const cm = res.body.data.find((d: { slug: string }) => d.slug === 'cuentas-medicas');
      expect(cm).toEqual({ slug: 'cuentas-medicas', nombre: expect.any(String), nombreEn: expect.any(String), accessMode: 'privado', activo: true });
    });

    it('el admin cambia el modo desde el panel, queda auditado y la semilla no lo pisa', async () => {
      const res = await request(app).patch('/api/admin/demo-catalog/hrms').set(bearer(admin)).send({ accessMode: 'publico', duracionDiasPorDefecto: 7 });
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ slug: 'hrms', accessMode: 'publico', duracionDiasPorDefecto: 7 });
      await catalogSvc.seedDemoCatalog();
      const access = await request(app).get('/api/demo-access/hrms');
      expect(access.body.data).toMatchObject({ allowed: true, accessMode: 'publico', reason: 'publico' });

      const AuditLog = (await import('../../models/AuditLog')).default;
      const log = await AuditLog.findOne({ accion: 'demo_catalog.update', 'entidad.id': 'hrms' }).lean();
      expect(log?.detalle).toMatchObject({ antes: { accessMode: 'solicitud' }, despues: { accessMode: 'publico' } });

      // PATCH /api/admin/demo-catalog con { slug } también sirve.
      const back = await request(app).patch('/api/admin/demo-catalog').set(bearer(admin)).send({ slug: 'hrms', accessMode: 'solicitud', duracionDiasPorDefecto: 14 });
      expect(back.status).toBe(200);
      expect((await request(app).get('/api/demo-access/hrms')).body.data).toMatchObject({ allowed: false, reason: 'sin_sesion' });
    });

    it('solo el admin edita el catálogo; el chatbot RAG queda siempre público', async () => {
      expect((await request(app).patch('/api/admin/demo-catalog/lms').send({ activo: false })).status).toBe(401);
      expect((await request(app).patch('/api/admin/demo-catalog/lms').set(bearer(sales)).send({ activo: false })).status).toBe(403);
      expect((await request(app).patch('/api/admin/demo-catalog/lms').set(bearer(manager)).send({ activo: false })).status).toBe(403);
      expect((await request(app).get('/api/admin/demo-catalog').set(bearer(manager))).body.data).toHaveLength(28);
      const fixed = await request(app).patch('/api/admin/demo-catalog/chatbot').set(bearer(admin)).send({ accessMode: 'privado' });
      expect(fixed.status).toBe(422);
      expect(fixed.body.code).toBe('fixed_mode');
      expect((await request(app).patch('/api/admin/demo-catalog/no-existe').set(bearer(admin)).send({ activo: false })).status).toBe(404);
      expect((await request(app).patch('/api/admin/demo-catalog/lms').set(bearer(admin)).send({ accessMode: 'abierto' })).status).toBe(400);
    });

    it('una demo desactivada se niega a todos menos al staff', async () => {
      await request(app).patch('/api/admin/demo-catalog/telemedicina').set(bearer(admin)).send({ activo: false }).expect(200);
      try {
        expect((await request(app).get('/api/demo-access/telemedicina')).body.data).toMatchObject({ allowed: false, reason: 'desactivada', activo: false });
        expect((await request(app).get('/api/demo-access/telemedicina').set(bearer(developer))).body.data).toMatchObject({ allowed: true, reason: 'staff' });
      } finally {
        await request(app).patch('/api/admin/demo-catalog/telemedicina').set(bearer(admin)).send({ activo: true }).expect(200);
      }
    });

    it('demo-access: 404 si la demo no existe; las públicas abren sin sesión', async () => {
      expect((await request(app).get('/api/demo-access/no-existe')).status).toBe(404);
      expect((await request(app).get('/api/demo-access/chatbot')).body.data).toMatchObject({ allowed: true, accessMode: 'publico', reason: 'publico' });
      expect((await request(app).get('/api/demo-access/cuentas-medicas')).body.data).toMatchObject({ allowed: false, accessMode: 'privado', reason: 'sin_sesion' });
    });
  });

  // -------------------------------------------------------------------------
  describe('POST /api/demo-requests (anti-spam y validación)', () => {
    it('sin la autorización de datos (Ley 1581) → 400 y no se guarda nada', async () => {
      const DemoRequest = (await import('../../models/DemoRequest')).default;
      const before = await DemoRequest.countDocuments();
      for (const consentimiento of [undefined, false, 'no']) {
        const res = await request(app).post('/api/demo-requests').set('X-Forwarded-For', ip()).send(validRequest({ consentimiento }));
        expect(res.status).toBe(400);
        expect(res.body.code).toBe('consent_required');
      }
      expect(await DemoRequest.countDocuments()).toBe(before);
    });

    it('honeypot lleno → responde como éxito, pero no guarda la solicitud ni el lead', async () => {
      const DemoRequest = (await import('../../models/DemoRequest')).default;
      const Contact = (await import('../../models/Contact')).default;
      const body = validRequest({ website: 'http://spam.example' });
      const res = await request(app).post('/api/demo-requests').set('X-Forwarded-For', ip()).send(body);
      expect(res.status).toBe(201);
      expect(res.body.data.codigo).toMatch(/^DR-\d{4}-[A-Z0-9]{6}$/);
      await new Promise((r) => setTimeout(r, 100));
      expect(await DemoRequest.countDocuments({ codigo: res.body.data.codigo })).toBe(0);
      expect(await Contact.countDocuments({ email: body.email })).toBe(0);
    });

    it('datos inválidos → 400 con errores por campo; demo inexistente → 400 unknown_demo', async () => {
      const bad = await request(app)
        .post('/api/demo-requests')
        .set('X-Forwarded-For', ip())
        .send(validRequest({ nombre: 'A', email: 'no-es-email', demos: [], casoDeUso: 'corto', tamanoEmpresa: '5' }));
      expect(bad.status).toBe(400);
      expect(bad.body.code).toBe('invalid_request');
      expect(bad.body.fields).toEqual(expect.arrayContaining(['nombre', 'email', 'demos', 'casoDeUso', 'tamanoEmpresa']));
      expect(bad.body.errores.nombre).toBe('Escribe tu nombre.');

      const unknown = await request(app).post('/api/demo-requests').set('X-Forwarded-For', ip()).send(validRequest({ demos: ['erp', 'no-existe'] }));
      expect(unknown.status).toBe(400);
      expect(unknown.body).toMatchObject({ code: 'unknown_demo', demos: ['no-existe'] });
    });

    it('los envíos inválidos no gastan el cupo por IP: quien corrige el formulario puede enviarlo', async () => {
      const sameIp = ip();
      for (let i = 0; i < 6; i += 1) {
        const bad = i % 2 === 0 ? validRequest({ consentimiento: false }) : validRequest({ email: 'no-es-email' });
        expect((await request(app).post('/api/demo-requests').set('X-Forwarded-For', sameIp).send(bad)).status).toBe(400);
      }
      expect((await request(app).post('/api/demo-requests').set('X-Forwarded-For', sameIp).send(validRequest())).status).toBe(201);
    });

    it('rate-limit por IP: la sexta solicitud en una hora desde la misma IP → 429', async () => {
      const sameIp = ip();
      for (let i = 0; i < 5; i += 1) {
        const res = await request(app).post('/api/demo-requests').set('X-Forwarded-For', sameIp).send(validRequest());
        expect(res.status).toBe(201);
      }
      const blocked = await request(app).post('/api/demo-requests').set('X-Forwarded-For', sameIp).send(validRequest());
      expect(blocked.status).toBe(429);
      expect(blocked.body.code).toBe('rate_limited');
      expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
      // Otra IP sigue pudiendo enviar.
      expect((await request(app).post('/api/demo-requests').set('X-Forwarded-For', ip()).send(validRequest())).status).toBe(201);
    });

    it('guarda el consentimiento, el origen y el lead (Contact demo-request); sin SMTP los avisos quedan en false', async () => {
      const { doc, body } = await submit({ email: 'Laura.Gomez+demo@Gmail.com' });
      // Email normalizado igual que el login.
      expect(doc.email).toBe('lauragomez@gmail.com');
      expect(doc.estado).toBe('pendiente');
      expect(doc.consentimiento).toMatchObject({ aceptado: true, versionPolitica: expect.any(String) });
      expect(doc.consentimiento.ipHash).toMatch(/^[a-f0-9]{32}$/);
      expect(doc.origen?.utm?.source).toBe('google');
      const DemoRequest = (await import('../../models/DemoRequest')).default;
      const withLead = await waitFor(async () => {
        const d = await DemoRequest.findById(doc._id).lean();
        return d?.lead && d.notificaciones?.equipoEmail !== undefined && d.notificaciones?.acuseSolicitante !== undefined ? d : null;
      });
      const Contact = (await import('../../models/Contact')).default;
      const lead = await Contact.findById(withLead.lead).lean();
      expect(lead).toMatchObject({ source: 'demo-request', email: 'lauragomez@gmail.com', company: body.empresa });
      expect(lead?.message).toContain(doc.codigo);
      expect(withLead.notificaciones).toMatchObject({ equipoEmail: false, equipoWhatsapp: false, acuseSolicitante: false });
    });

    it('si el mismo email ya tiene una solicitud abierta, se le suman las demos (no se duplica)', async () => {
      const email = uniqueEmail('repite');
      const first = await submit({ email, demos: ['erp'] });
      const again = await request(app).post('/api/demo-requests').set('X-Forwarded-For', ip()).send(validRequest({ email, demos: ['lms', 'erp'] }));
      expect(again.status).toBe(201);
      expect(again.body.data).toMatchObject({ codigo: first.doc.codigo, fusionada: true });
      const DemoRequest = (await import('../../models/DemoRequest')).default;
      const merged = await DemoRequest.findById(first.doc._id).lean();
      expect(merged?.demos.sort()).toEqual(['erp', 'lms']);
      expect(merged?.reenvios).toBe(1);
      expect(await DemoRequest.countDocuments({ email: first.doc.email })).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  describe('flujo completo', () => {
    it('solicitar → aprobar → activar → Mis demos → demo-access → API real → revocar → denegado', async () => {
      const originalEmail = `Mario.Ruiz.${Date.now().toString(36)}@Empresa-Prueba.co`;
      const { doc } = await submit({ email: originalEmail, demos: ['erp', 'cuentas-medicas'], nombre: 'Mario Ruiz' });
      const id = String(doc._id);

      // Bandeja del equipo con filtros.
      const list = await request(app).get('/api/admin/demo-requests').query({ estado: 'pendiente', demo: 'cuentas-medicas', q: doc.codigo }).set(bearer(sales));
      expect(list.status).toBe(200);
      expect(list.body.data.items.map((r: { id: string }) => r.id)).toEqual([id]);
      expect(list.body.data.conteos.pendiente).toBeGreaterThanOrEqual(1);
      const detail = await request(app).get(`/api/admin/demo-requests/${id}`).set(bearer(manager));
      expect(detail.status).toBe(200);
      expect(detail.body.data.request).toMatchObject({ codigo: doc.codigo, estado: 'pendiente' });
      expect(detail.body.data.cuenta).toBeNull();

      // Sin acceso todavía.
      expect((await request(app).get('/api/demo-access/erp')).body.data).toMatchObject({ allowed: false, reason: 'sin_sesion' });

      // sales no aprueba demos privadas; manager solo lee.
      const salesTry = await request(app).post(`/api/admin/demo-requests/${id}/approve`).set(bearer(sales)).send({});
      expect(salesTry.status).toBe(403);
      expect(salesTry.body.code).toBe('requires_admin');
      expect((await request(app).post(`/api/admin/demo-requests/${id}/approve`).set(bearer(manager)).send({})).status).toBe(403);

      // El admin aprueba: cuenta prospect invitada, 2 accesos de 14 días y enlace de activación.
      const approved = await request(app).post(`/api/admin/demo-requests/${id}/approve`).set(bearer(admin)).send({ dias: 14, nota: 'Viene de la pauta' });
      expect(approved.status).toBe(200);
      const data = approved.body.data;
      expect(data.request.estado).toBe('aprobada');
      expect(data.user).toMatchObject({ role: 'prospect', accountStatus: 'invitado', cuentaNueva: true });
      expect(data.grants).toHaveLength(2);
      expect(data.grants.every((g: { diasRestantes: number; vigente: boolean }) => g.diasRestantes === 14 && g.vigente)).toBe(true);
      expect(data.activationUrl).toMatch(/\/activar\/[A-Za-z0-9_-]{43}$/);
      expect(new Date(data.activationExpiresAt).getTime() - Date.now()).toBeGreaterThan(71 * 60 * 60 * 1000);
      expect(data.email).toEqual({ configurado: false, enviado: false });

      // Doble clic → 409, sin duplicar accesos.
      const twice = await request(app).post(`/api/admin/demo-requests/${id}/approve`).set(bearer(admin)).send({});
      expect(twice.status).toBe(409);
      const DemoGrant = (await import('../../models/DemoGrant')).default;
      expect(await DemoGrant.countDocuments({ user: data.user.id })).toBe(2);

      // El token se guarda solo como hash.
      const MagicLinkToken = (await import('../../models/MagicLinkToken')).default;
      const token = tokenFromUrl(data.activationUrl);
      expect(await MagicLinkToken.countDocuments({ tokenHash: token })).toBe(0);
      expect(await MagicLinkToken.countDocuments({ user: data.user.id, proposito: 'activacion', usedAt: null })).toBe(1);

      // Antes de activar no puede iniciar sesión.
      const early = await request(app).post('/api/auth/login').set('X-Forwarded-For', ip()).send({ email: originalEmail, password: 'cualquiera123' });
      expect(early.status).toBe(401);
      expect(early.body.code).toBe('account_not_activated');

      // La página de activación valida el enlace sin gastarlo.
      const check = await request(app).post('/api/auth/activate/check').send({ token });
      expect(check.status).toBe(200);
      expect(check.body.data).toMatchObject({ nombre: 'Mario Ruiz' });
      expect(check.body.data.emailEnmascarado).toMatch(/^m\*\*\*.@empresa-prueba\.co$/);

      // Contraseña corta → 400 y el token sigue sirviendo.
      expect((await activate(token, '123')).body.code).toBe('invalid_password');

      // Activa: devuelve la sesión igual que el login.
      const act = await activate(token);
      expect(act.status).toBe(200);
      expect(act.body.data).toMatchObject({ accessToken: expect.any(String), refreshToken: expect.any(String), user: { role: 'prospect' } });
      const prospect = { token: act.body.data.accessToken as string };

      // Un solo uso.
      const reuse = await activate(token);
      expect(reuse.status).toBe(400);
      expect(reuse.body.code).toBe('token_used');

      // Mis demos: sus 2 accesos con días restantes.
      const mine = await request(app).get('/api/me/demos').set(bearer(prospect));
      expect(mine.status).toBe(200);
      expect(mine.body.data.map((g: { demoSlug: string }) => g.demoSlug).sort()).toEqual(['cuentas-medicas', 'erp']);
      expect(mine.body.data[0]).toMatchObject({ estado: 'activo', vigente: true, diasRestantes: 14, url: expect.stringMatching(/^\/demo\//) });
      expect(mine.body.data[0].nota).toBeUndefined();

      // demo-access permitido y registra la apertura.
      const open = await request(app).get('/api/demo-access/erp').set(bearer(prospect));
      expect(open.body.data).toMatchObject({ allowed: true, accessMode: 'solicitud', reason: 'grant', diasRestantes: 14 });
      expect(new Date(open.body.data.expiresAt).getTime()).toBeGreaterThan(Date.now() + 13 * DAY);
      // Una consulta seguida (p. ej. la web que renueva la verificación) es la misma visita.
      await request(app).get('/api/demo-access/erp').set(bearer(prospect));
      let erpGrant = await DemoGrant.findOne({ user: data.user.id, demoSlug: 'erp' }).lean();
      expect(erpGrant?.accesos).toBe(1);
      expect(erpGrant?.ultimoAcceso).toBeTruthy();
      // Tras 30 min sin actividad, abrirla otra vez cuenta una visita nueva.
      await DemoGrant.updateOne({ _id: erpGrant!._id }, { $set: { ultimoAcceso: new Date(Date.now() - 31 * 60 * 1000) } });
      await request(app).get('/api/demo-access/erp').set(bearer(prospect));
      erpGrant = await DemoGrant.findOne({ user: data.user.id, demoSlug: 'erp' }).lean();
      expect(erpGrant?.accesos).toBe(2);
      expect(Date.now() - new Date(erpGrant!.ultimoAcceso!).getTime()).toBeLessThan(60_000);
      // Una demo que no le dieron sigue cerrada.
      expect((await request(app).get('/api/demo-access/lms').set(bearer(prospect))).body.data).toMatchObject({ allowed: false, reason: 'sin_acceso' });

      // APIs con backend real: cuentas-medicas sí, sistema-experto no.
      expect((await request(app).get('/api/auditoria/estadisticas').set(bearer(prospect))).status).toBe(200);
      expect((await request(app).get('/api/documentos-conocimiento/config').set(bearer(prospect))).status).toBe(200);
      // La configuración global del motor y la herramienta interna /liquidacion
      // (reglas y radicados del equipo) no se abren con el acceso a la demo.
      expect((await request(app).patch('/api/documentos-conocimiento/config/ley100').set(bearer(prospect)).send({ activo: false })).status).toBe(403);
      for (const url of ['/api/liquidacion/radicados', '/api/liquidacion/estadisticas', '/api/reglas-facturacion']) {
        expect([url, (await request(app).get(url).set(bearer(prospect))).status]).toEqual([url, 403]);
      }
      expect((await request(app).post('/api/reglas-facturacion').set(bearer(prospect)).send({ nombre: 'x' })).status).toBe(403);
      expect((await request(app).delete(`/api/liquidacion/radicados/${new mongoose.Types.ObjectId()}`).set(bearer(prospect))).status).toBe(403);
      expect((await request(app).get('/api/reglas-facturacion').set(bearer(sales))).status).not.toBe(403);
      expect((await request(app).get('/api/liquidacion/estadisticas').set(bearer(manager))).status).not.toBe(403);
      const expert = await request(app).get('/api/expert/estadisticas').set(bearer(prospect));
      expect(expert.status).toBe(403);
      expect(expert.body).toMatchObject({ code: 'demo_access_required', motivo: 'sin_acceso' });

      // Puede iniciar sesión con el email tal como lo escribió.
      const login = await request(app).post('/api/auth/login').set('X-Forwarded-For', ip()).send({ email: originalEmail, password: 'ClaveSegura2026' });
      expect(login.status).toBe(200);
      expect(login.body.data.user.role).toBe('prospect');

      // Revocar (admin) → denegado de inmediato en demo-access y en la API.
      const cmGrant = data.grants.find((g: { demoSlug: string }) => g.demoSlug === 'cuentas-medicas');
      const revoked = await request(app).post(`/api/admin/demo-grants/${cmGrant.id}/revoke`).set(bearer(admin)).send({ motivo: 'Fin de la prueba' });
      expect(revoked.status).toBe(200);
      expect(revoked.body.data.grant).toMatchObject({ estado: 'revocado', estadoEfectivo: 'revocado', motivoRevocacion: 'Fin de la prueba' });
      expect((await request(app).get('/api/demo-access/cuentas-medicas').set(bearer(prospect))).body.data).toMatchObject({
        allowed: false,
        reason: 'revocado',
        expiresAt: null,
      });
      const api = await request(app).get('/api/auditoria/estadisticas').set(bearer(prospect));
      expect(api.status).toBe(403);
      expect(api.body.motivo).toBe('revocado');
      expect((await request(app).post(`/api/admin/demo-grants/${cmGrant.id}/revoke`).set(bearer(admin)).send({})).status).toBe(409);
      expect((await request(app).post(`/api/admin/demo-grants/${cmGrant.id}/extend`).set(bearer(admin)).send({ dias: 5 })).status).toBe(409);

      // Panel: accesos con uso y detalle con historial.
      const grants = await request(app).get('/api/admin/demo-grants').query({ q: 'mario', estado: 'activo' }).set(bearer(manager));
      expect(grants.body.data.items).toHaveLength(1);
      expect(grants.body.data.items[0]).toMatchObject({ demoSlug: 'erp', accesos: 2, user: { role: 'prospect', accountStatus: 'activo' } });
      const after = await request(app).get(`/api/admin/demo-requests/${id}`).set(bearer(admin));
      expect(after.body.data.cuenta).toMatchObject({ role: 'prospect', accountStatus: 'activo' });
      expect(after.body.data.grants).toHaveLength(2);
      expect(after.body.data.request.notas.map((n: { texto: string }) => n.texto)).toContain('Viene de la pauta');

      // Bitácora: aprobación, activación y revocación.
      const AuditLog = (await import('../../models/AuditLog')).default;
      const actions = (await AuditLog.find({}).lean()).map((l) => l.accion);
      expect(actions).toEqual(expect.arrayContaining(['demo_request.approve', 'user.activate', 'demo_grant.revoke']));
      const audit = await request(app).get('/api/admin/audit-log').query({ entidadTipo: 'DemoRequest', entidadId: id }).set(bearer(admin));
      expect(audit.status).toBe(200);
      expect(audit.body.data.items[0]).toMatchObject({ accion: 'demo_request.approve', actorEmail: admin.email });
      expect((await request(app).get('/api/admin/audit-log').set(bearer(sales))).status).toBe(403);
    });

    it('aprobar demos de una cuenta que ya existe la vincula sin bajarle el rol ni pedir activación', async () => {
      const client = await createUser('client');
      const { doc } = await submit({ email: client.email, demos: ['wms-logistica'] });
      const res = await request(app).post(`/api/admin/demo-requests/${doc._id}/approve`).set(bearer(sales)).send({});
      expect(res.status).toBe(200);
      expect(res.body.data.user).toMatchObject({ id: client.id, role: 'client', cuentaNueva: false });
      expect(res.body.data.activationUrl).toBeNull();
      expect(res.body.data.loginUrl).toMatch(/\/login\?redirect=%2Fdashboard%2Fdemos$/);
      expect((await request(app).get('/api/demo-access/wms-logistica').set(bearer(client))).body.data.allowed).toBe(true);
      // Reenviar el enlace a una cuenta activa → 409 con el enlace de login.
      const resend = await request(app).post(`/api/admin/demo-requests/${doc._id}/resend-activation`).set(bearer(admin));
      expect(resend.status).toBe(409);
      expect(resend.body.code).toBe('account_active');
    });

    it('una solicitud con el email de alguien del equipo no se aprueba', async () => {
      const { doc } = await submit({ email: manager.email, demos: ['erp'] });
      const res = await request(app).post(`/api/admin/demo-requests/${doc._id}/approve`).set(bearer(admin)).send({});
      expect(res.status).toBe(422);
      expect(res.body.code).toBe('team_email');
      const DemoRequest = (await import('../../models/DemoRequest')).default;
      expect((await DemoRequest.findById(doc._id).lean())?.estado).toBe('pendiente');
    });
  });

  // -------------------------------------------------------------------------
  describe('permisos', () => {
    it('sin sesión 401; usuario normal y prospecto 403 en todas las rutas del equipo', async () => {
      const { doc } = await submit();
      const routes: Array<[string, string]> = [
        ['get', '/api/admin/demo-requests'],
        ['get', `/api/admin/demo-requests/${doc._id}`],
        ['patch', `/api/admin/demo-requests/${doc._id}`],
        ['post', `/api/admin/demo-requests/${doc._id}/approve`],
        ['post', `/api/admin/demo-requests/${doc._id}/reject`],
        ['get', '/api/admin/demo-grants'],
        ['post', '/api/admin/demo-grants'],
        ['get', '/api/admin/demo-catalog'],
        ['get', '/api/admin/audit-log'],
      ];
      const prospect = await createUser('prospect');
      for (const [method, url] of routes) {
        const anon = await (request(app) as any)[method](url).send({});
        expect([method, url, anon.status]).toEqual([method, url, 401]);
        for (const who of [plainUser, prospect]) {
          const res = await (request(app) as any)[method](url).set(bearer(who)).send({ motivo: 'x', email: 'a@b.co', demos: ['erp'] });
          expect([method, url, who.role, res.status]).toEqual([method, url, who.role, 403]);
        }
      }
      const DemoRequest = (await import('../../models/DemoRequest')).default;
      expect((await DemoRequest.findById(doc._id).lean())?.estado).toBe('pendiente');
    });

    it('sales aprueba demos por solicitud y gestiona sus accesos; manager solo lee', async () => {
      const { doc } = await submit({ demos: ['delivery', 'voice-ai'] });
      expect((await request(app).post(`/api/admin/demo-requests/${doc._id}/reject`).set(bearer(manager)).send({ motivo: 'no' })).status).toBe(403);
      const res = await request(app).post(`/api/admin/demo-requests/${doc._id}/approve`).set(bearer(sales)).send({ demos: ['delivery'], dias: 10 });
      expect(res.status).toBe(200);
      expect(res.body.data.grants).toHaveLength(1);
      expect(res.body.data.grants[0]).toMatchObject({ demoSlug: 'delivery', diasRestantes: 10 });
      const gid = res.body.data.grants[0].id;
      expect((await request(app).post(`/api/admin/demo-grants/${gid}/extend`).set(bearer(manager)).send({ dias: 3 })).status).toBe(403);
      const ext = await request(app).post(`/api/admin/demo-grants/${gid}/extend`).set(bearer(sales)).send({ dias: 3 });
      expect(ext.status).toBe(200);
      expect(ext.body.data.grant.diasRestantes).toBe(13);
      expect(ext.body.data.grant.extensiones).toHaveLength(1);
    });

    it('un prospecto solo ve sus accesos y no abre las demos de otro', async () => {
      const a = await request(app).post('/api/admin/demo-grants').set(bearer(admin)).send({ email: uniqueEmail('a'), nombre: 'Prospecto A', demos: ['erp'] });
      const b = await request(app).post('/api/admin/demo-grants').set(bearer(admin)).send({ email: uniqueEmail('b'), nombre: 'Prospecto B', demos: ['lms', 'sistema-experto'] });
      expect(a.status).toBe(201);
      expect(b.status).toBe(201);
      const sessionA = (await activate(tokenFromUrl(a.body.data.activationUrl))).body.data.accessToken as string;
      const sessionB = (await activate(tokenFromUrl(b.body.data.activationUrl))).body.data.accessToken as string;

      const mineA = await request(app).get('/api/me/demos').set({ Authorization: `Bearer ${sessionA}` });
      expect(mineA.body.data.map((g: { demoSlug: string }) => g.demoSlug)).toEqual(['erp']);
      const mineB = await request(app).get('/api/me/demos').set({ Authorization: `Bearer ${sessionB}` });
      expect(mineB.body.data.map((g: { demoSlug: string }) => g.demoSlug).sort()).toEqual(['lms', 'sistema-experto']);

      expect((await request(app).get('/api/demo-access/lms').set({ Authorization: `Bearer ${sessionA}` })).body.data.allowed).toBe(false);
      expect((await request(app).get('/api/cups/estadisticas').set({ Authorization: `Bearer ${sessionA}` })).status).toBe(403);
      expect((await request(app).get('/api/cups/estadisticas').set({ Authorization: `Bearer ${sessionB}` })).status).toBe(200);
      expect((await request(app).get('/api/me/demos')).status).toBe(401);
    });

    it('invitación directa: demos privadas solo admin; sin nombre para una cuenta nueva → 400', async () => {
      const salesPriv = await request(app).post('/api/admin/demo-grants').set(bearer(sales)).send({ email: uniqueEmail('dr'), nombre: 'Dra', demos: ['cuentas-medicas'] });
      expect(salesPriv.status).toBe(403);
      expect(salesPriv.body.code).toBe('requires_admin');
      const salesOk = await request(app).post('/api/admin/demo-grants').set(bearer(sales)).send({ email: uniqueEmail('ok'), nombre: 'Persona', demos: ['erp'], dias: 5 });
      expect(salesOk.status).toBe(201);
      expect(salesOk.body.data.grants[0].diasRestantes).toBe(5);
      const noName = await request(app).post('/api/admin/demo-grants').set(bearer(admin)).send({ email: uniqueEmail('sin'), demos: ['erp'] });
      expect(noName.status).toBe(400);
      expect(noName.body.code).toBe('name_required');
      const team = await request(app).post('/api/admin/demo-grants').set(bearer(admin)).send({ email: sales.email, demos: ['erp'] });
      expect(team.status).toBe(422);
      const AuditLog = (await import('../../models/AuditLog')).default;
      expect(await AuditLog.countDocuments({ accion: 'demo_grant.create', actorEmail: sales.email })).toBeGreaterThanOrEqual(1);
    });

    it('developer (staff) abre cualquier demo, también las privadas', async () => {
      expect((await request(app).get('/api/demo-access/cuentas-medicas').set(bearer(developer))).body.data).toMatchObject({ allowed: true, reason: 'staff' });
      expect((await request(app).get('/api/auditoria/estadisticas').set(bearer(developer))).status).toBe(200);
    });
  });

  // -------------------------------------------------------------------------
  describe('rechazo', () => {
    it('motivo obligatorio; con notificar se envía un mensaje (no el motivo interno); spam nunca se notifica', async () => {
      const send = jest.spyOn(emailService, 'sendMail').mockResolvedValue(true);
      jest.spyOn(emailService, 'isConfigured').mockReturnValue(true);
      jest.spyOn(emailService, 'sendContactNotification').mockResolvedValue(true);

      const { doc } = await submit();
      await waitFor(async () => send.mock.calls.length >= 1); // acuse
      send.mockClear();
      expect((await request(app).post(`/api/admin/demo-requests/${doc._id}/reject`).set(bearer(sales)).send({})).status).toBe(400);
      const res = await request(app)
        .post(`/api/admin/demo-requests/${doc._id}/reject`)
        .set(bearer(sales))
        .send({ motivo: 'fuera de perfil (interno)', notificar: true, mensaje: 'Hoy no atendemos proyectos de este tipo.' });
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ notificado: true, request: { estado: 'rechazada', motivoRechazo: 'fuera de perfil (interno)' } });
      expect(send).toHaveBeenCalledTimes(1);
      const mail = send.mock.calls[0][0];
      expect(mail.to).toBe(doc.email);
      expect(mail.text).toContain('Hoy no atendemos proyectos de este tipo.');
      expect(mail.text).not.toContain('interno');
      expect((await request(app).post(`/api/admin/demo-requests/${doc._id}/approve`).set(bearer(admin)).send({})).status).toBe(409);

      send.mockClear();
      const spam = await submit();
      await waitFor(async () => send.mock.calls.length >= 1);
      send.mockClear();
      const spamRes = await request(app).post(`/api/admin/demo-requests/${spam.doc._id}/reject`).set(bearer(admin)).send({ motivo: 'spam', notificar: true });
      expect(spamRes.status).toBe(200);
      expect(spamRes.body.data.notificado).toBe(false);
      expect(send).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  describe('correo con SMTP configurado', () => {
    it('acuse al solicitante, aviso al equipo y correo de aprobación con el enlace de activación', async () => {
      const send = jest.spyOn(emailService, 'sendMail').mockResolvedValue(true);
      jest.spyOn(emailService, 'isConfigured').mockReturnValue(true);
      const team = jest.spyOn(emailService, 'sendContactNotification').mockResolvedValue(true);

      const { doc } = await submit({ demos: ['lms'], nombre: 'Sofía <b>Test</b>' });
      const DemoRequest = (await import('../../models/DemoRequest')).default;
      const ready = await waitFor(async () => {
        const d = await DemoRequest.findById(doc._id).lean();
        return d?.notificaciones?.acuseSolicitante === true && d.notificaciones.equipoEmail === true ? d : null;
      });
      expect(ready.notificaciones.equipoWhatsapp).toBe(false);
      expect(team).toHaveBeenCalledWith(expect.objectContaining({ source: 'demo-request', email: doc.email }));
      const ack = send.mock.calls.find((c) => c[0].subject.includes(doc.codigo));
      expect(ack?.[0].to).toBe(doc.email);
      // Lo que escribe el usuario se escapa en el HTML.
      expect(ack?.[0].html).toContain('Sofía &lt;b&gt;Test&lt;/b&gt;');

      send.mockClear();
      const res = await request(app).post(`/api/admin/demo-requests/${doc._id}/approve`).set(bearer(sales)).send({ mensaje: 'Te esperamos.' });
      expect(res.status).toBe(200);
      expect(res.body.data.email).toEqual({ configurado: true, enviado: true });
      expect(send).toHaveBeenCalledTimes(1);
      const mail = send.mock.calls[0][0];
      expect(mail.to).toBe(doc.email);
      expect(mail.html).toContain(res.body.data.activationUrl);
      expect(mail.text).toContain('Te esperamos.');
      expect((await DemoRequest.findById(doc._id).lean())?.notificaciones.decisionSolicitante).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  describe('enlace mágico', () => {
    async function invite() {
      const res = await request(app).post('/api/admin/demo-grants').set(bearer(admin)).send({ email: uniqueEmail('inv'), nombre: 'Invitado', demos: ['erp'] });
      expect(res.status).toBe(201);
      return res.body.data as { activationUrl: string; user: { id: string }; grants: Array<{ id: string }> };
    }

    it('vencido → 400 token_expired (y no activa la cuenta)', async () => {
      const data = await invite();
      const MagicLinkToken = (await import('../../models/MagicLinkToken')).default;
      await MagicLinkToken.updateMany({ user: data.user.id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
      const token = tokenFromUrl(data.activationUrl);
      const check = await request(app).post('/api/auth/activate/check').send({ token });
      expect(check.status).toBe(400);
      expect(check.body.code).toBe('token_expired');
      const act = await activate(token);
      expect(act.status).toBe(400);
      expect(act.body.code).toBe('token_expired');
      const User = (await import('../../models/User')).default;
      expect((await User.findById(data.user.id).lean())?.accountStatus).toBe('invitado');
    });

    it('reenviar invalida el anterior (token_replaced) y el nuevo funciona una sola vez', async () => {
      const data = await invite();
      const resend = await request(app).post(`/api/admin/demo-grants/${data.grants[0].id}/resend-activation`).set(bearer(sales));
      expect(resend.status).toBe(200);
      expect(resend.body.data.activationUrl).not.toBe(data.activationUrl);
      const old = await activate(tokenFromUrl(data.activationUrl));
      expect(old.status).toBe(400);
      expect(old.body.code).toBe('token_replaced');
      const fresh = tokenFromUrl(resend.body.data.activationUrl);
      expect((await activate(fresh)).status).toBe(200);
      expect((await activate(fresh)).body.code).toBe('token_used');
    });

    it('dos activaciones simultáneas del mismo token: solo una gana', async () => {
      const data = await invite();
      const token = tokenFromUrl(data.activationUrl);
      const results = await Promise.all([activate(token, 'PrimeraClave1'), activate(token, 'SegundaClave2')]);
      expect(results.map((r) => r.status).sort()).toEqual([200, 400]);
    });

    it('token mal formado o inexistente → token_invalid', async () => {
      for (const token of ['', 'corto', 'x'.repeat(43), '../../etc/passwd-aaaaaaaaaaaaaaaaaaaaaaaa']) {
        const res = await activate(token);
        expect(res.status).toBe(400);
        expect(['token_invalid', 'invalid_password']).toContain(res.body.code);
      }
      const res = await activate('A'.repeat(43));
      expect(res.body.code).toBe('token_invalid');
    });

    it('restablecer contraseña usa MagicLinkToken (propósito reset), de un solo uso', async () => {
      const resetEmail = jest.spyOn(emailService, 'sendPasswordResetEmail').mockResolvedValue(true);
      const data = await invite();
      const User = (await import('../../models/User')).default;
      const u = await User.findById(data.user.id).lean();
      const res = await request(app).post('/api/auth/forgot-password').set('X-Forwarded-For', ip()).send({ email: u!.email });
      expect(res.status).toBe(200);
      const resetUrl = resetEmail.mock.calls[0][0].resetUrl;
      const token = new URL(resetUrl).searchParams.get('token') as string;
      const MagicLinkToken = (await import('../../models/MagicLinkToken')).default;
      expect(await MagicLinkToken.countDocuments({ user: data.user.id, proposito: 'reset', usedAt: null })).toBe(1);
      const ok = await request(app).post('/api/auth/reset-password').set('X-Forwarded-For', ip()).send({ token, password: 'NuevaClave2026' });
      expect(ok.status).toBe(200);
      const again = await request(app).post('/api/auth/reset-password').set('X-Forwarded-For', ip()).send({ token, password: 'OtraClave2026' });
      expect(again.status).toBe(400);
      // La cuenta invitada quedó activa y su enlace de activación ya no sirve.
      expect((await User.findById(data.user.id).lean())?.accountStatus).toBe('activo');
      expect((await activate(tokenFromUrl(data.activationUrl))).body.code).toBe('token_replaced');
    });
  });

  // -------------------------------------------------------------------------
  describe('vigencia y job de expiración', () => {
    it('la vigencia se evalúa en cada consulta: vencido sin correr el job → denegado; extender lo reabre', async () => {
      const inv = await request(app).post('/api/admin/demo-grants').set(bearer(admin)).send({ email: uniqueEmail('vence'), nombre: 'Vence', demos: ['cuentas-medicas'] });
      const session = (await activate(tokenFromUrl(inv.body.data.activationUrl))).body.data.accessToken as string;
      const auth = { Authorization: `Bearer ${session}` };
      const gid = inv.body.data.grants[0].id;
      const DemoGrant = (await import('../../models/DemoGrant')).default;
      await DemoGrant.updateOne({ _id: gid }, { $set: { expiresAt: new Date(Date.now() - 60_000) } });

      const access = await request(app).get('/api/demo-access/cuentas-medicas').set(auth);
      expect(access.body.data).toMatchObject({ allowed: false, reason: 'expirado', diasRestantes: 0 });
      expect((await DemoGrant.findById(gid).lean())?.estado).toBe('activo'); // el job aún no corrió
      const api = await request(app).get('/api/auditoria/estadisticas').set(auth);
      expect(api.status).toBe(403);
      expect(api.body.motivo).toBe('expirado');
      expect((await request(app).get('/api/me/demos').set(auth)).body.data[0]).toMatchObject({ estado: 'expirado', vigente: false, diasRestantes: 0 });

      expect((await request(app).post(`/api/admin/demo-grants/${gid}/extend`).set(bearer(sales)).send({ dias: 7 })).status).toBe(403); // privada
      const ext = await request(app).post(`/api/admin/demo-grants/${gid}/extend`).set(bearer(admin)).send({ dias: 7 });
      expect(ext.status).toBe(200);
      expect(ext.body.data.grant).toMatchObject({ estado: 'activo', diasRestantes: 7 });
      expect((await request(app).get('/api/demo-access/cuentas-medicas').set(auth)).body.data).toMatchObject({ allowed: true, reason: 'grant' });
      expect((await request(app).get('/api/auditoria/estadisticas').set(auth)).status).toBe(200);
    });

    it('marca vencidos, recuerda 3 días antes solo con SMTP, un correo por persona y sin duplicar', async () => {
      const { runDemoGrantsJob } = await import('../../jobs/demo-grants.job');
      const DemoGrant = (await import('../../models/DemoGrant')).default;
      const owner = await createUser('prospect');
      const other = await createUser('prospect');
      const invited = await createUser('prospect');
      await mongoose.connection.collection('users').updateOne({ _id: new mongoose.Types.ObjectId(invited.id) }, { $set: { accountStatus: 'invitado' }, $unset: { password: 1 } });
      const now = Date.now();
      const [expired, soon1, soon2, later] = await DemoGrant.create([
        { user: owner.id, demoSlug: 'erp', expiresAt: new Date(now - DAY), estado: 'activo' },
        { user: owner.id, demoSlug: 'lms', expiresAt: new Date(now + 2 * DAY), estado: 'activo' },
        { user: owner.id, demoSlug: 'hrms', expiresAt: new Date(now + 1 * DAY), estado: 'activo' },
        { user: other.id, demoSlug: 'erp', expiresAt: new Date(now + 10 * DAY), estado: 'activo' },
        { user: invited.id, demoSlug: 'pos', expiresAt: new Date(now + 1 * DAY), estado: 'activo' },
      ]);

      // Sin SMTP: solo marca vencidos y no "gasta" recordatorios.
      const first = await runDemoGrantsJob();
      expect(first.expirados).toBeGreaterThanOrEqual(1);
      expect(first.recordatorios).toBe(0);
      expect((await DemoGrant.findById(expired._id).lean())?.estado).toBe('expirado');
      expect((await DemoGrant.findById(soon1._id).lean())?.recordatorioEnviadoEn).toBeNull();

      // Con SMTP: un correo para el dueño con sus 2 demos por vencer.
      const send = jest.spyOn(emailService, 'sendMail').mockResolvedValue(true);
      jest.spyOn(emailService, 'isConfigured').mockReturnValue(true);
      const second = await runDemoGrantsJob();
      const toOwner = send.mock.calls.filter((c) => c[0].to === owner.email);
      expect(toOwner).toHaveLength(1);
      expect(toOwner[0][0].text).toMatch(/Plataforma de aprendizaje/);
      expect(toOwner[0][0].text).toMatch(/talento humano/);
      expect(toOwner[0][0].text).toContain('Mis demos:');
      // A una cuenta sin activar no se le ofrece "Mis demos": se le recuerda activarla.
      const toInvited = send.mock.calls.filter((c) => c[0].to === invited.email);
      expect(toInvited).toHaveLength(1);
      expect(toInvited[0][0].text).toContain('Aún no activas tu cuenta');
      expect(toInvited[0][0].text).not.toContain('Mis demos:');
      expect(send.mock.calls.some((c) => c[0].to === other.email)).toBe(false);
      expect(second.recordatorios).toBeGreaterThanOrEqual(1);
      expect((await DemoGrant.findById(soon2._id).lean())?.recordatorioEnviadoEn).toBeTruthy();
      expect((await DemoGrant.findById(later._id).lean())?.recordatorioEnviadoEn).toBeNull();

      // Otra corrida no repite el recordatorio.
      send.mockClear();
      await runDemoGrantsJob();
      expect(send.mock.calls.filter((c) => c[0].to === owner.email)).toHaveLength(0);

      // Si el envío falla, se libera para reintentar.
      await DemoGrant.updateOne({ _id: later._id }, { $set: { expiresAt: new Date(now + 2 * DAY) } });
      send.mockResolvedValue(false);
      const failed = await runDemoGrantsJob();
      expect(failed.recordatoriosFallidos).toBeGreaterThanOrEqual(1);
      expect((await DemoGrant.findById(later._id).lean())?.recordatorioEnviadoEn).toBeNull();
    });

    (REDIS_OK ? it : it.skip)('con el candado de Redis tomado por otra instancia, la corrida se salta', async () => {
      const { runDemoGrantsJob, DEMO_GRANTS_LOCK_KEY } = await import('../../jobs/demo-grants.job');
      const { acquireLock, releaseLock } = await import('../../services/redis-lock.service');
      const held = await acquireLock(DEMO_GRANTS_LOCK_KEY, 60_000);
      expect(held.status).toBe('acquired');
      try {
        const res = await runDemoGrantsJob();
        expect(res).toMatchObject({ skipped: 'lock_busy', lock: 'busy' });
      } finally {
        if (held.status === 'acquired') await releaseLock(DEMO_GRANTS_LOCK_KEY, held.token);
      }
      expect((await runDemoGrantsJob()).lock).toBe('acquired');
    });
  });

  it('extender o revocar el acceso de una cuenta borrada no falla (no hay a quién escribir)', async () => {
    const inv = await request(app).post('/api/admin/demo-grants').set(bearer(admin)).send({ email: uniqueEmail('borrada'), nombre: 'Cuenta borrada', demos: ['erp'] });
    expect(inv.status).toBe(201);
    await mongoose.connection.collection('users').deleteOne({ _id: new mongoose.Types.ObjectId(inv.body.data.user.id) });
    const gid = inv.body.data.grants[0].id;
    const ext = await request(app).post(`/api/admin/demo-grants/${gid}/extend`).set(bearer(admin)).send({ dias: 2 });
    expect(ext.status).toBe(200);
    expect(ext.body.data.email.enviado).toBe(false);
    expect((await request(app).post(`/api/admin/demo-grants/${gid}/revoke`).set(bearer(admin)).send({})).status).toBe(200);
  });

  it('listado de accesos: filtro por_vencer (≤ 3 días) y conteos por estado con la misma búsqueda', async () => {
    const DemoGrant = (await import('../../models/DemoGrant')).default;
    const email = uniqueEmail('conteos');
    const inv = await request(app).post('/api/admin/demo-grants').set(bearer(admin)).send({ email, nombre: 'Conteos', demos: ['erp', 'lms', 'hrms', 'delivery'] });
    expect(inv.status).toBe(201);
    const [erp, lms, hrms, delivery] = inv.body.data.grants.map((g: { id: string }) => g.id);
    await DemoGrant.updateOne({ _id: lms }, { $set: { expiresAt: new Date(Date.now() + 2 * DAY) } });
    await DemoGrant.updateOne({ _id: hrms }, { $set: { expiresAt: new Date(Date.now() - DAY) } });
    expect((await request(app).post(`/api/admin/demo-grants/${delivery}/revoke`).set(bearer(admin)).send({ motivo: 'prueba' })).status).toBe(200);

    const all = await request(app).get('/api/admin/demo-grants').query({ q: email }).set(bearer(sales));
    expect(all.status).toBe(200);
    expect(all.body.data.conteos).toEqual({ todos: 4, activo: 2, por_vencer: 1, expirado: 1, revocado: 1 });
    const soon = await request(app).get('/api/admin/demo-grants').query({ q: email, estado: 'por_vencer' }).set(bearer(manager));
    expect(soon.status).toBe(200);
    expect(soon.body.data.items.map((g: { id: string }) => g.id)).toEqual([lms]);
    expect(soon.body.data.conteos.todos).toBe(4);
    const active = await request(app).get('/api/admin/demo-grants').query({ q: email, estado: 'activo' }).set(bearer(admin));
    expect(active.body.data.items.map((g: { id: string }) => g.id).sort()).toEqual([erp, lms].sort());
    expect((await request(app).get('/api/admin/demo-grants').query({ estado: 'otro' }).set(bearer(admin))).status).toBe(400);
  });

  it('demo-access con ?registrar=0 (prefetch de la web) decide igual pero no cuenta el uso', async () => {
    const DemoGrant = (await import('../../models/DemoGrant')).default;
    const inv = await request(app).post('/api/admin/demo-grants').set(bearer(admin)).send({ email: uniqueEmail('prefetch'), nombre: 'Prefetch', demos: ['telemedicina'] });
    const session = (await activate(tokenFromUrl(inv.body.data.activationUrl))).body.data.accessToken as string;
    const auth = { Authorization: `Bearer ${session}` };
    const gid = inv.body.data.grants[0].id;

    const pre = await request(app).get('/api/demo-access/telemedicina?registrar=0').set(auth);
    expect(pre.body.data).toMatchObject({ allowed: true, reason: 'grant' });
    let g = await DemoGrant.findById(gid).lean();
    expect(g?.accesos ?? 0).toBe(0);
    expect(g?.ultimoAcceso ?? null).toBeNull();

    expect((await request(app).get('/api/demo-access/telemedicina').set(auth)).body.data.allowed).toBe(true);
    g = await DemoGrant.findById(gid).lean();
    expect(g?.accesos).toBe(1);
    expect(g?.ultimoAcceso).toBeTruthy();
  });

  it('ids inválidos o inexistentes → 404 (no 500)', async () => {
    const missing = new mongoose.Types.ObjectId().toString();
    for (const url of [`/api/admin/demo-requests/${missing}`, '/api/admin/demo-requests/no-es-id']) {
      expect((await request(app).get(url).set(bearer(admin))).status).toBe(404);
    }
    expect((await request(app).post(`/api/admin/demo-grants/${missing}/extend`).set(bearer(admin)).send({ dias: 3 })).status).toBe(404);
    expect((await request(app).post('/api/admin/demo-grants/no-es-id/revoke').set(bearer(admin)).send({})).status).toBe(404);
    expect((await request(app).post(`/api/admin/demo-requests/${missing}/approve`).set(bearer(admin)).send({})).status).toBe(404);
  });
});
