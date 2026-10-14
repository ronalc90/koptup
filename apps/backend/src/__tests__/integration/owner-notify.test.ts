/**
 * Avisos al dueño de punta a punta con MongoDB real (+ Redis si responde) y
 * fetch simulado para Resend y Meta (nunca sale un correo ni un WhatsApp
 * real):
 *
 *  - POST /api/contact → Contact.notificaciones por canal (enviado /
 *    fallido / no_configurado) y salud en AppSetting `avisos.estado`;
 *  - job de reintentos (backoff, límites, sin reenviar los exitosos);
 *  - latido mensual (ventana horaria, días, aviso cruzado, persistencia);
 *  - webhook de WhatsApp (verificación GET, firma, estados por wamid);
 *  - endpoints del panel (permisos, sin secretos, auditoría).
 */
import crypto from 'crypto';
import request from 'supertest';
import type { Express } from 'express';
import mongoose from 'mongoose';
import { REDIS_OK, TestUser, bearer, connectTestDb, createUser, describeDb, disconnectTestDb } from './helpers';

const RESEND_KEY = 're_clave_integracion_123456';
const WA_TOKEN = 'EAAG-token-integracion-123456';
const APP_SECRET = 'app-secret-integracion';
const VERIFY_TOKEN = 'verify-token-integracion';
const OWNER_EMAIL = 'dueno.avisos@koptup-prueba.co';

// Las variables se leen al importar los servicios (import dinámico en beforeAll).
Object.assign(process.env, {
  RESEND_API_KEY: RESEND_KEY,
  RESEND_API_URL: 'http://resend.mock',
  NOTIFY_EMAIL: OWNER_EMAIL,
  EMAIL_FROM: 'KopTup <avisos@koptup.com>',
  WHATSAPP_PROVIDER: 'meta',
  WHATSAPP_API_TOKEN: WA_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID: '109876543210',
  ADMIN_WHATSAPP_NUMBER: '+57 300 123 4567',
  WHATSAPP_GRAPH_URL: 'http://graph.mock',
  WHATSAPP_APP_SECRET: APP_SECRET,
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: VERIFY_TOKEN,
});

const MIN = 60_000;
const DAY = 24 * 60 * MIN;

type Reply = { status: number; body: unknown } | Error;
interface Captured {
  kind: 'resend' | 'meta';
  url: string;
  headers: Record<string, string>;
  body: any;
}

function ip(): string {
  return `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`;
}

async function waitFor<T>(fn: () => Promise<T | null | undefined | false>, timeoutMs = 5000): Promise<T> {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value) return value as T;
    if (Date.now() - start > timeoutMs) throw new Error('waitFor: tiempo agotado');
    await new Promise((r) => setTimeout(r, 30));
  }
}

function sign(raw: string, secret = APP_SECRET): string {
  return `sha256=${crypto.createHmac('sha256', secret).update(raw).digest('hex')}`;
}

describeDb('avisos al dueño (integración)', () => {
  let app: Express;
  let admin: TestUser;
  let manager: TestUser;
  let Contact: typeof import('../../models/Contact').default;
  let AppSetting: typeof import('../../models/AppSetting').default;
  let AuditLog: typeof import('../../models/AuditLog').default;
  let owner: typeof import('../../services/owner-notify.service');
  let retryJob: typeof import('../../jobs/notify-retry.job');
  let heartbeatJob: typeof import('../../jobs/notify-heartbeat.job');
  let webhook: typeof import('../../routes/whatsapp-webhook.routes');
  let lead: typeof import('../../services/lead.service');

  const captured: Captured[] = [];
  let resendQueue: Reply[] = [];
  let metaQueue: Reply[] = [];
  let seq = 0;

  beforeAll(async () => {
    await connectTestDb('avisos');
    ({ default: Contact } = await import('../../models/Contact'));
    ({ default: AppSetting } = await import('../../models/AppSetting'));
    ({ default: AuditLog } = await import('../../models/AuditLog'));
    owner = await import('../../services/owner-notify.service');
    retryJob = await import('../../jobs/notify-retry.job');
    heartbeatJob = await import('../../jobs/notify-heartbeat.job');
    webhook = await import('../../routes/whatsapp-webhook.routes');
    lead = await import('../../services/lead.service');
    const { createApp } = await import('../../app');
    app = createApp();
    admin = await createUser('admin');
    manager = await createUser('manager');
  });

  afterAll(async () => {
    if (REDIS_OK) {
      const { getRedisClient } = await import('../../config/redis');
      const redis = await getRedisClient();
      await redis.del(['jobs:notify-retry:lock', 'jobs:notify-heartbeat:lock']);
      await redis.quit();
    }
    await disconnectTestDb();
  });

  beforeEach(async () => {
    captured.length = 0;
    resendQueue = [];
    metaQueue = [];
    owner.resetWebhookAlertsForTests();
    jest.spyOn(global, 'fetch').mockImplementation(async (input: any, init?: any) => {
      const url = String(input);
      const kind = url.startsWith('http://resend.mock') ? 'resend' : url.startsWith('http://graph.mock') ? 'meta' : null;
      if (!kind) throw new Error(`fetch inesperado a ${url}`);
      captured.push({ kind, url, headers: init?.headers ?? {}, body: JSON.parse(String(init?.body ?? '{}')) });
      seq += 1;
      const next = (kind === 'resend' ? resendQueue : metaQueue).shift();
      if (next instanceof Error) throw next;
      const reply = next ?? (kind === 'resend' ? { status: 200, body: { id: `re_${seq}` } } : { status: 200, body: { messages: [{ id: `wamid.${seq}` }] } });
      return new Response(JSON.stringify(reply.body), { status: reply.status, headers: { 'Content-Type': 'application/json' } });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const metaError = (status: number, code: number) => ({ status, body: { error: { message: `(#${code}) Error de prueba`, code, fbtrace_id: 'FbTrace1' } } });

  async function createContact(over: Record<string, unknown> = {}) {
    return Contact.create({
      name: 'Persona Prueba',
      email: `persona.${Date.now()}${Math.random().toString(36).slice(2, 6)}@cliente-prueba.co`,
      service: 'Sistema RAG',
      message: 'Hola, quiero cotizar.',
      status: 'new',
      ...over,
    });
  }

  // -------------------------------------------------------------------------
  describe('aviso inicial (POST /api/contact y lead.service)', () => {
    it('envía por los dos canales y guarda el estado por canal y la salud', async () => {
      const email = `ana.${Date.now()}@cliente-prueba.co`;
      const res = await request(app)
        .post('/api/contact')
        .set('X-Forwarded-For', ip())
        .send({ name: 'Ana Prueba', email, company: 'ACME', service: 'Sistema RAG', message: 'Hola,\nquiero un chatbot.', consentimiento: true });
      expect(res.status).toBe(200);

      const contact = await waitFor(async () => {
        const c = await Contact.findOne({ email }).lean();
        return c?.notificaciones?.email.estado === 'enviado' && c.notificaciones.whatsapp.estado === 'enviado' ? c : null;
      });
      expect(contact.notificaciones?.email).toMatchObject({ intentos: 1, error: null, proximoIntento: null });
      expect(contact.notificaciones?.email.idProveedor).toMatch(/^re_/);
      expect(contact.notificaciones?.whatsapp.idProveedor).toMatch(/^wamid\./);

      const mail = captured.find((c) => c.kind === 'resend');
      expect(mail?.body).toMatchObject({ to: [OWNER_EMAIL], reply_to: email, from: 'KopTup <avisos@koptup.com>' });
      // contact-<id>-email-<hash del cuerpo>: el mismo cuerpo repite la key; otro cuerpo, otra key.
      expect(mail?.headers['Idempotency-Key']).toMatch(new RegExp(`^contact-${String(contact._id)}-email-[0-9a-f]{16}$`));
      const wa = captured.find((c) => c.kind === 'meta');
      expect(wa?.body.template.name).toBe('koptup_aviso');
      expect(wa?.body.template.components[0].parameters[0].text).toBe('Nuevo contacto de Ana Prueba');
      // Sin el punto final: la plantilla ya pone «.» después de {{2}}.
      expect(wa?.body.template.components[0].parameters[1].text).toMatch(/Mensaje: Hola, quiero un chatbot$/);
      // El correo no lleva el nombre de la persona en el log, pero sí el responder a.
      expect(mail?.body.subject).toBe('🔔 Nuevo contacto: Ana Prueba - Sistema RAG');

      // La salud se guarda justo después del estado del contacto (sin bloquear la respuesta HTTP).
      const state = await waitFor(async () => {
        const s = await owner.readAvisosState();
        return s.email?.ultimoExito && s.whatsapp?.ultimoExito ? s : null;
      });
      expect(state.email?.ultimoExito).toBeTruthy();
      expect(state.whatsapp?.ultimoExito).toBeTruthy();
    });

    it('fallos: estado fallido con el error limpio, intentos 1 y próximo intento en 5 min; notified en false', async () => {
      resendQueue.push({ status: 500, body: { message: 'boom' } }, { status: 500, body: { message: 'boom' } });
      metaQueue.push(metaError(400, 131030));
      const before = Date.now();
      const { contact, notified } = await lead.registerLeadWithNotifications({
        name: 'Beto',
        email: `beto.${Date.now()}@cliente-prueba.co`,
        service: 'ERP',
        message: 'Hola',
      });
      expect(await notified).toEqual({ email: false, whatsapp: false });
      const c = await Contact.findById(contact._id).lean();
      expect(c?.notificaciones?.email).toMatchObject({ estado: 'fallido', intentos: 1 });
      expect(c?.notificaciones?.email.error).toMatch(/Resend 500/);
      const wait = (c?.notificaciones?.email.proximoIntento as Date).getTime() - before;
      expect(wait).toBeGreaterThanOrEqual(5 * MIN - 1000);
      expect(wait).toBeLessThan(6 * MIN);
      expect(c?.notificaciones?.whatsapp).toMatchObject({ estado: 'fallido', intentos: 1 });
      expect(c?.notificaciones?.whatsapp.error).toMatch(/131030/);
      expect(JSON.stringify(c?.notificaciones)).not.toContain(WA_TOKEN);
      const state = await owner.readAvisosState();
      expect(state.whatsapp?.ultimoError).toMatch(/131030/);
    });

    it('canal no configurado: queda no_configurado y no se intenta', async () => {
      const { whatsappService } = await import('../../services/whatsapp.service');
      jest.spyOn(whatsappService, 'isConfigured').mockReturnValue(false);
      const { contact, notified } = await lead.registerLeadWithNotifications({ name: 'Caro', email: `caro.${Date.now()}@cliente-prueba.co`, service: 'POS', message: 'Hola' });
      expect(await notified).toEqual({ email: true, whatsapp: false });
      const c = await Contact.findById(contact._id).lean();
      expect(c?.notificaciones?.whatsapp).toMatchObject({ estado: 'no_configurado', intentos: 0 });
      expect(captured.filter((x) => x.kind === 'meta')).toHaveLength(0);
    });

    it('respaldo hello_world: enviado con respaldo y el error de la plantilla a la vista', async () => {
      metaQueue.push(metaError(404, 132001), { status: 200, body: { messages: [{ id: 'wamid.hello' }] } });
      const { contact, notified } = await lead.registerLeadWithNotifications({ name: 'Dani', email: `dani.${Date.now()}@cliente-prueba.co`, service: 'CRM', message: 'Hola' });
      expect((await notified).whatsapp).toBe(true);
      const c = await Contact.findById(contact._id).lean();
      expect(c?.notificaciones?.whatsapp).toMatchObject({ estado: 'enviado', respaldo: 'hello_world', idProveedor: 'wamid.hello' });
      expect(c?.notificaciones?.whatsapp.error).toMatch(/132001/);
    });
  });

  // -------------------------------------------------------------------------
  describe('job de reintentos', () => {
    function channel(estado: string, intentos: number, proximoIntento: Date | null, extra: Record<string, unknown> = {}) {
      return { estado, intentos, proximoIntento, ultimoIntento: null, error: null, idProveedor: null, respaldo: null, ...extra };
    }

    it('reintenta fallidos y pendientes viejos con plazo vencido; respeta límites y no reenvía exitosos', async () => {
      await Contact.deleteMany({});
      const now = new Date();
      const past = new Date(now.getTime() - MIN);
      const okWa = channel('enviado', 1, null, { idProveedor: 'wamid.ok' });
      const fallido = await createContact({ notificaciones: { email: channel('fallido', 1, past), whatsapp: okWa } });
      const pendienteViejo = await createContact({ notificaciones: { email: channel('pendiente', 0, past), whatsapp: okWa } });
      const enCurso = await createContact({ notificaciones: { email: channel('pendiente', 0, new Date(now.getTime() + 5 * MIN)), whatsapp: okWa } });
      const agotado = await createContact({ notificaciones: { email: channel('fallido', 6, past), whatsapp: okWa } });
      const viejo = await createContact({ created_at: new Date(now.getTime() - 4 * DAY), notificaciones: { email: channel('fallido', 1, past), whatsapp: okWa } });
      const enviado = await createContact({ notificaciones: { email: channel('enviado', 1, null), whatsapp: okWa } });

      const r = await retryJob.runNotifyRetryJob(now);
      expect(r.skipped).toBeUndefined();
      expect(r).toMatchObject({ intentados: 2, enviados: 2, fallidos: 0 });
      expect(captured.filter((c) => c.kind === 'meta')).toHaveLength(0);
      const get = async (id: unknown) => (await Contact.findById(id).lean())?.notificaciones?.email;
      expect(await get(fallido._id)).toMatchObject({ estado: 'enviado', intentos: 2, proximoIntento: null });
      expect(await get(pendienteViejo._id)).toMatchObject({ estado: 'enviado', intentos: 1 });
      expect(await get(enCurso._id)).toMatchObject({ estado: 'pendiente', intentos: 0 });
      expect(await get(agotado._id)).toMatchObject({ estado: 'fallido', intentos: 6 });
      expect(await get(viejo._id)).toMatchObject({ estado: 'fallido', intentos: 1 });
      expect(await get(enviado._id)).toMatchObject({ estado: 'enviado', intentos: 1 });
      // Misma Idempotency-Key que el aviso inicial.
      const keys = captured.map((c) => c.headers['Idempotency-Key']);
      expect(keys).toHaveLength(2);
      expect(keys.some((k) => new RegExp(`^contact-${String(fallido._id)}-email-[0-9a-f]{16}$`).test(k))).toBe(true);
      expect(keys.some((k) => new RegExp(`^contact-${String(pendienteViejo._id)}-email-[0-9a-f]{16}$`).test(k))).toBe(true);

      // Segunda corrida: nada que hacer.
      captured.length = 0;
      expect(await retryJob.runNotifyRetryJob(now)).toMatchObject({ intentados: 0 });
      expect(captured).toHaveLength(0);
    });

    it('backoff: un nuevo fallo programa el siguiente intento (15 min tras el 2.º, 12 h tras el 5.º) y el 6.º es el último', async () => {
      await Contact.deleteMany({});
      const now = new Date();
      const past = new Date(now.getTime() - MIN);
      const okWa = channel('enviado', 1, null);
      const c2 = await createContact({ notificaciones: { email: channel('fallido', 1, past), whatsapp: okWa } });
      const c5 = await createContact({ notificaciones: { email: channel('fallido', 4, past), whatsapp: okWa } });
      const c6 = await createContact({ notificaciones: { email: channel('fallido', 5, past), whatsapp: okWa } });
      for (let i = 0; i < 6; i += 1) resendQueue.push({ status: 422, body: { name: 'validation_error', message: 'Invalid' } });
      const r = await retryJob.runNotifyRetryJob(now);
      expect(r).toMatchObject({ intentados: 3, fallidos: 3 });
      const get = async (id: unknown) => (await Contact.findById(id).lean())?.notificaciones?.email;
      expect((await get(c2._id))?.intentos).toBe(2);
      expect(((await get(c2._id))?.proximoIntento as Date).getTime() - now.getTime()).toBe(15 * MIN);
      expect((await get(c5._id))?.intentos).toBe(5);
      expect(((await get(c5._id))?.proximoIntento as Date).getTime() - now.getTime()).toBe(12 * 60 * MIN);
      expect(await get(c6._id)).toMatchObject({ estado: 'fallido', intentos: 6, proximoIntento: null });
    });
  });

  // -------------------------------------------------------------------------
  describe('latido mensual', () => {
    const inWindow = new Date('2026-10-14T15:00:00Z'); // 10:00 en Bogotá
    const outWindow = new Date('2026-10-15T03:00:00Z'); // 22:00 en Bogotá

    beforeEach(async () => {
      await AppSetting.deleteMany({ clave: 'avisos.estado' });
    });

    it('solo dentro de 9:00-18:59 de Bogotá; envía por los dos canales y guarda el latido; no repite antes de los días', async () => {
      expect(await heartbeatJob.runNotifyHeartbeatJob(outWindow)).toEqual({ skipped: 'fuera_de_horario' });
      expect(captured).toHaveLength(0);

      const r = await heartbeatJob.runNotifyHeartbeatJob(inWindow);
      expect(r.resultado?.email).toMatchObject({ configurado: true, enviado: true });
      expect(r.resultado?.whatsapp).toMatchObject({ configurado: true, enviado: true });
      expect(r.avisoCruzado).toEqual([]);
      const mail = captured.find((c) => c.kind === 'resend');
      expect(mail?.body.subject).toBe('✅ Prueba mensual: tus avisos de contactos funcionan');
      expect(mail?.headers['Idempotency-Key']).toBe('latido-2026-10-14');
      const wa = captured.find((c) => c.kind === 'meta');
      expect(wa?.body.template.components[0].parameters[1].text).toMatch(/^Prueba mensual: tus avisos de contactos funcionan/);

      const state = await owner.readAvisosState();
      expect(new Date(state.latido?.ultimo as Date).toISOString()).toBe(inWindow.toISOString());
      expect(state.latido?.resultado).toEqual({ email: true, whatsapp: true });
      expect(state.email?.ultimoExito).toBeTruthy();

      captured.length = 0;
      expect(await heartbeatJob.runNotifyHeartbeatJob(new Date(inWindow.getTime() + 29 * DAY))).toMatchObject({ skipped: 'no_toca' });
      expect(captured).toHaveLength(0);
      const again = await heartbeatJob.runNotifyHeartbeatJob(new Date(inWindow.getTime() + 30 * DAY));
      expect(again.resultado?.email.enviado).toBe(true);
    });

    it('NOTIFY_HEARTBEAT_DAYS=0 lo apaga; con 7 días usa ese plazo', async () => {
      const prev = process.env.NOTIFY_HEARTBEAT_DAYS;
      try {
        process.env.NOTIFY_HEARTBEAT_DAYS = '0';
        expect(await heartbeatJob.runNotifyHeartbeatJob(inWindow)).toEqual({ skipped: 'disabled' });
        process.env.NOTIFY_HEARTBEAT_DAYS = '7';
        await heartbeatJob.runNotifyHeartbeatJob(inWindow);
        expect(await heartbeatJob.runNotifyHeartbeatJob(new Date(inWindow.getTime() + 6 * DAY))).toMatchObject({ skipped: 'no_toca' });
        expect((await heartbeatJob.runNotifyHeartbeatJob(new Date(inWindow.getTime() + 7 * DAY))).resultado).toBeDefined();
      } finally {
        if (prev === undefined) delete process.env.NOTIFY_HEARTBEAT_DAYS;
        else process.env.NOTIFY_HEARTBEAT_DAYS = prev;
      }
    });

    it('si WhatsApp falla avisa por correo; si el correo falla avisa por WhatsApp', async () => {
      metaQueue.push(metaError(401, 190));
      const r = await heartbeatJob.runNotifyHeartbeatJob(inWindow);
      expect(r.resultado?.whatsapp).toMatchObject({ configurado: true, enviado: false });
      expect(r.avisoCruzado).toEqual(['email']);
      const alert = captured.filter((c) => c.kind === 'resend').find((c) => /Falla en tus avisos por WhatsApp/.test(c.body.subject));
      expect(alert?.body.text).toMatch(/190/);
      expect(alert?.body.text).toMatch(/token/);
      expect((await owner.readAvisosState()).latido?.resultado).toEqual({ email: true, whatsapp: false });

      await AppSetting.deleteMany({ clave: 'avisos.estado' });
      captured.length = 0;
      resendQueue.push({ status: 401, body: { name: 'missing_api_key', message: 'API key is invalid' } });
      const r2 = await heartbeatJob.runNotifyHeartbeatJob(inWindow);
      expect(r2.resultado?.email.enviado).toBe(false);
      expect(r2.avisoCruzado).toEqual(['whatsapp']);
      const waAlert = captured.filter((c) => c.kind === 'meta').find((c) => c.body.template.components[0].parameters[0].text === 'Falla en los avisos por correo');
      expect(waAlert?.body.template.components[0].parameters[1].text).toMatch(/RESEND_API_KEY/);
      expect((await owner.readAvisosState()).email?.ultimoError).toMatch(/401/);
    });
  });

  // -------------------------------------------------------------------------
  describe('webhook de WhatsApp', () => {
    it('GET: responde el challenge solo con el token correcto', async () => {
      const ok = await request(app).get('/api/webhooks/whatsapp').query({ 'hub.mode': 'subscribe', 'hub.verify_token': VERIFY_TOKEN, 'hub.challenge': '1158201444' });
      expect(ok.status).toBe(200);
      expect(ok.text).toBe('1158201444');
      expect((await request(app).get('/api/webhooks/whatsapp').query({ 'hub.mode': 'subscribe', 'hub.verify_token': 'otro', 'hub.challenge': 'x' })).status).toBe(403);
      expect((await request(app).get('/api/webhooks/whatsapp').query({ 'hub.mode': 'unsubscribe', 'hub.verify_token': VERIFY_TOKEN })).status).toBe(403);
    });

    it('POST: 401 sin firma o con firma inválida (cuerpo crudo)', async () => {
      const raw = JSON.stringify({ entry: [] });
      expect((await request(app).post('/api/webhooks/whatsapp').set('Content-Type', 'application/json').send(raw)).status).toBe(401);
      expect((await request(app).post('/api/webhooks/whatsapp').set('Content-Type', 'application/json').set('X-Hub-Signature-256', sign(raw, 'otro')).send(raw)).status).toBe(401);
      // Firma del cuerpo con otro espaciado: no coincide con el cuerpo crudo recibido.
      expect((await request(app).post('/api/webhooks/whatsapp').set('Content-Type', 'application/json').set('X-Hub-Signature-256', sign(JSON.stringify({ entry: [] }, null, 2))).send(raw)).status).toBe(401);
    });

    it('POST firmado: entregado → leído (sin retroceder) y fallido con alerta por correo', async () => {
      const okWa = (wamid: string) => ({ estado: 'enviado', intentos: 1, idProveedor: wamid, proximoIntento: null });
      const okEmail = { estado: 'enviado', intentos: 1, proximoIntento: null };
      const a = await createContact({ notificaciones: { email: okEmail, whatsapp: okWa('wamid.A') } });
      const b = await createContact({ name: 'Bruno', notificaciones: { email: okEmail, whatsapp: okWa('wamid.B') } });
      const post = async (statuses: unknown[]) => {
        const raw = JSON.stringify({ object: 'whatsapp_business_account', entry: [{ id: '1', changes: [{ field: 'messages', value: { messaging_product: 'whatsapp', statuses } }] }] });
        const res = await request(app).post('/api/webhooks/whatsapp').set('Content-Type', 'application/json').set('X-Hub-Signature-256', sign(raw)).send(raw);
        expect(res.status).toBe(200);
        await webhook.lastWebhookProcessing();
      };
      await post([{ id: 'wamid.A', status: 'delivered', timestamp: '1', recipient_id: '573001234567' }]);
      expect((await Contact.findById(a._id).lean())?.notificaciones?.whatsapp.estado).toBe('entregado');
      await post([{ id: 'wamid.A', status: 'read', timestamp: '2' }]);
      expect((await Contact.findById(a._id).lean())?.notificaciones?.whatsapp.estado).toBe('leido');
      await post([{ id: 'wamid.A', status: 'delivered', timestamp: '3' }]);
      expect((await Contact.findById(a._id).lean())?.notificaciones?.whatsapp.estado).toBe('leido');

      captured.length = 0;
      await post([{ id: 'wamid.B', status: 'failed', errors: [{ code: 131026, title: 'Message undeliverable', error_data: { details: 'No se pudo entregar' } }] }]);
      const bn = (await Contact.findById(b._id).lean())?.notificaciones?.whatsapp;
      expect(bn?.estado).toBe('fallido');
      expect(bn?.error).toMatch(/131026/);
      expect(bn?.proximoIntento).toBeTruthy();
      const alert = captured.find((c) => c.kind === 'resend');
      expect(alert?.body.subject).toBe('⚠️ WhatsApp no entregó un aviso de KopTup');
      expect(alert?.body.text).toMatch(/131026/);
      expect(alert?.body.text).toMatch(/Bruno/);
      expect((await owner.readAvisosState()).whatsapp?.ultimoError).toMatch(/131026/);
      // Un evento repetido no manda otra alerta.
      captured.length = 0;
      await post([{ id: 'wamid.B', status: 'failed', errors: [{ code: 131026, title: 'Message undeliverable' }] }]);
      expect(captured).toHaveLength(0);
    });

    it('sin WHATSAPP_APP_SECRET y WHATSAPP_WEBHOOK_VERIFY_TOKEN el webhook no existe (404)', async () => {
      const { whatsappService } = await import('../../services/whatsapp.service');
      jest.spyOn(whatsappService, 'isWebhookEnabled').mockReturnValue(false);
      expect((await request(app).get('/api/webhooks/whatsapp').query({ 'hub.mode': 'subscribe', 'hub.verify_token': VERIFY_TOKEN })).status).toBe(404);
      expect((await request(app).post('/api/webhooks/whatsapp').send('{}')).status).toBe(404);
    });
  });

  // -------------------------------------------------------------------------
  describe('panel: estado, prueba y reenvío', () => {
    function expectNoSecrets(payload: unknown) {
      const text = JSON.stringify(payload);
      for (const secret of [RESEND_KEY, WA_TOKEN, APP_SECRET, VERIFY_TOKEN, OWNER_EMAIL, '3001234567', '109876543210']) {
        expect(text).not.toContain(secret);
      }
    }

    it('GET /status: manager y admin; destinos enmascarados y sin secretos; anónimo 401', async () => {
      expect((await request(app).get('/api/admin/notifications/status')).status).toBe(401);
      const res = await request(app).get('/api/admin/notifications/status').set(bearer(manager));
      expect(res.status).toBe(200);
      expect(res.body.data.email).toMatchObject({
        proveedor: 'resend',
        configurado: true,
        destino: 'du***@koptup-prueba.co',
        remitente: 'KopTup <avisos@koptup.com>',
        faltan: [],
      });
      expect(res.body.data.whatsapp).toMatchObject({ proveedor: 'meta', configurado: true, destino: '+57 *** *** 4567', plantilla: 'koptup_aviso', webhook: true, faltan: [] });
      expect(res.body.data.latido).toMatchObject({ activo: true, cadaDias: 30 });
      expect(Object.keys(res.body.data.latido).sort()).toEqual(['activo', 'cadaDias', 'proximo', 'ultimo']);
      expectNoSecrets(res.body);
      expect((await request(app).get('/api/admin/notifications/status').set(bearer(admin))).status).toBe(200);
    });

    it('POST /test: solo admin; envía por los dos canales, devuelve el resultado y queda en la bitácora', async () => {
      expect((await request(app).post('/api/admin/notifications/test')).status).toBe(401);
      expect((await request(app).post('/api/admin/notifications/test').set(bearer(manager))).status).toBe(403);
      expect(captured).toHaveLength(0);

      metaQueue.push(metaError(400, 131030));
      const res = await request(app).post('/api/admin/notifications/test').set(bearer(admin));
      expect(res.status).toBe(200);
      expect(res.body.data.email).toMatchObject({ configurado: true, enviado: true });
      expect(res.body.data.email.id).toMatch(/^re_/);
      expect(res.body.data.whatsapp).toMatchObject({ configurado: true, enviado: false });
      expect(res.body.data.whatsapp.error).toMatch(/131030/);
      expectNoSecrets(res.body);
      expect(captured.find((c) => c.kind === 'resend')?.body.subject).toBe('✅ Aviso de prueba de KopTup');
      const audit = await AuditLog.findOne({ accion: 'notifications.test', actorEmail: admin.email }).lean();
      expect(audit?.detalle).toMatchObject({ email: { configurado: true, enviado: true }, whatsapp: { configurado: true, enviado: false } });
      expectNoSecrets(audit);
    });

    it('POST /contacts/:id/notify: reenvía solo lo que no salió (o todo con ?todos=1); GET /contacts muestra notificaciones', async () => {
      const c = await createContact({
        notificaciones: {
          email: { estado: 'fallido', intentos: 6, proximoIntento: null, error: 'Resend 500: boom' },
          whatsapp: { estado: 'leido', intentos: 1, idProveedor: 'wamid.L', proximoIntento: null },
        },
      });
      expect((await request(app).post(`/api/admin/contacts/${String(c._id)}/notify`).set(bearer(manager))).status).toBe(403);
      expect((await request(app).post(`/api/admin/contacts/${String(c._id)}/notify`)).status).toBe(401);

      const res = await request(app).post(`/api/admin/contacts/${String(c._id)}/notify`).set(bearer(admin));
      expect(res.status).toBe(200);
      expect(res.body.data.notificaciones.email).toMatchObject({ estado: 'enviado', intentos: 7, error: null });
      expect(res.body.data.notificaciones.whatsapp).toMatchObject({ estado: 'leido', intentos: 1 });
      expect(res.body.data.resultado.whatsapp).toMatchObject({ omitido: true, enviado: true });
      expect(captured.map((x) => x.kind)).toEqual(['resend']);
      expect(captured[0].body.reply_to).toBe(c.email);

      captured.length = 0;
      const all = await request(app).post(`/api/admin/contacts/${String(c._id)}/notify?todos=1`).set(bearer(admin));
      expect(all.status).toBe(200);
      expect(captured.map((x) => x.kind).sort()).toEqual(['meta', 'resend']);
      // Reenvío forzado de un correo ya enviado: otra Idempotency-Key (si no, Resend lo descarta 24 h).
      expect(captured.find((x) => x.kind === 'resend')?.headers['Idempotency-Key']).toMatch(new RegExp(`^contact-${String(c._id)}-email-[0-9a-f]{16}-r8$`));
      expect(all.body.data.notificaciones.whatsapp).toMatchObject({ estado: 'enviado', intentos: 2 });
      expect(await AuditLog.countDocuments({ accion: 'contact.notify_resend', 'entidad.id': String(c._id) })).toBe(2);

      const list = await request(app).get('/api/admin/contacts').set(bearer(manager));
      const row = (list.body.data as Array<{ id: string; notificaciones: any }>).find((x) => String(x.id) === String(c._id));
      expect(row?.notificaciones.email).toMatchObject({ estado: 'enviado' });
      expect(row?.notificaciones.whatsapp).toMatchObject({ estado: 'enviado' });
      expect(row?.notificaciones.whatsapp.idProveedor).toBeUndefined();

      // Contacto anterior al registro de avisos: el reenvío manual lo inicia.
      const legacy = await createContact();
      const legacyRes = await request(app).post(`/api/admin/contacts/${String(legacy._id)}/notify`).set(bearer(admin));
      expect(legacyRes.status).toBe(200);
      expect(legacyRes.body.data.notificaciones.email.estado).toBe('enviado');
      expect(legacyRes.body.data.notificaciones.whatsapp.estado).toBe('enviado');

      expect((await request(app).post(`/api/admin/contacts/${new mongoose.Types.ObjectId().toString()}/notify`).set(bearer(admin))).status).toBe(404);
    });
  });
  // -------------------------------------------------------------------------
  describe('casos de la revisión', () => {
    const ownerMails = () => captured.filter((c) => c.kind === 'resend' && c.body.to?.[0] === OWNER_EMAIL);
    const demoBody = (email: string, over: Record<string, unknown> = {}) => ({
      nombre: 'Ana Demo',
      empresa: 'ACME SAS',
      cargo: 'Gerente',
      email,
      telefono: '+57 300 000 0000',
      pais: 'Colombia',
      tamanoEmpresa: '11-50',
      demos: ['erp'],
      casoDeUso: 'Queremos ver el ERP para controlar inventario y facturación.',
      consentimiento: true,
      origen: { pagina: '/demo/erp' },
      ...over,
    });

    it('solicitud de demo fusionada (mismo email en 30 días): también avisa al dueño, con un contacto que dice que es un reenvío', async () => {
      const email = `fusion.${Date.now()}@empresa-prueba.co`;
      const r1 = await request(app).post('/api/demo-requests').set('X-Forwarded-For', ip()).send(demoBody(email));
      expect(r1.status).toBe(201);
      await waitFor(async () => (await Contact.countDocuments({ email, 'notificaciones.whatsapp.estado': 'enviado' })) === 1);
      const before = { mails: ownerMails().length, wa: captured.filter((c) => c.kind === 'meta').length };

      const r2 = await request(app)
        .post('/api/demo-requests')
        .set('X-Forwarded-For', ip())
        .send(demoBody(email, { demos: ['lms'], casoDeUso: 'Ahora también nos interesa el LMS para 200 personas, urgente.' }));
      expect(r2.status).toBe(201);
      expect(r2.body.data).toMatchObject({ codigo: r1.body.data.codigo, fusionada: true });
      const resent = await waitFor(async () => {
        const c = await Contact.findOne({ email, message: /volvió a enviar/ }).lean();
        return c?.notificaciones?.email.estado === 'enviado' && c.notificaciones.whatsapp.estado === 'enviado' ? c : null;
      });
      expect(resent.source).toBe('demo-request');
      expect(resent.service).toContain(`reenvío de ${r1.body.data.codigo}`);
      expect(resent.message).toContain('LMS para 200 personas');
      expect(ownerMails().length).toBe(before.mails + 1);
      expect(captured.filter((c) => c.kind === 'meta').length).toBe(before.wa + 1);
    });

    it('solicitud de demo: el «aviso al equipo» de la solicitud se actualiza cuando el reintento sí envía', async () => {
      const email = `sync.${Date.now()}@empresa-prueba.co`;
      // El aviso al dueño falla 2 veces (intento + reintento inmediato); el acuse a la persona sale bien.
      let ownerFails = 2;
      const orig = (global.fetch as jest.Mock).getMockImplementation()!;
      (global.fetch as jest.Mock).mockImplementation(async (input: any, init?: any) => {
        const body = JSON.parse(String(init?.body ?? '{}'));
        if (String(input).startsWith('http://resend.mock') && body.to?.[0] === OWNER_EMAIL && ownerFails > 0) {
          ownerFails -= 1;
          return new Response(JSON.stringify({ name: 'application_error', message: 'boom' }), { status: 500 });
        }
        return orig(input, init);
      });
      const DemoRequest = (await import('../../models/DemoRequest')).default;
      const res = await request(app).post('/api/demo-requests').set('X-Forwarded-For', ip()).send(demoBody(email));
      expect(res.status).toBe(201);
      const dr = await waitFor(async () => {
        const d = await DemoRequest.findOne({ codigo: res.body.data.codigo }).lean();
        return d?.lead && d.notificaciones?.equipoEmail === false && d.notificaciones?.equipoWhatsapp === true ? d : null;
      });
      await retryJob.runNotifyRetryJob(new Date(Date.now() + 6 * MIN));
      expect((await Contact.findById(dr.lead).lean())?.notificaciones?.email.estado).toBe('enviado');
      expect((await DemoRequest.findById(dr._id).lean())?.notificaciones).toMatchObject({ equipoEmail: true, equipoWhatsapp: true });
    });

    it('demo RAG: si el contacto cambió entre intentos, el correo usa otra Idempotency-Key (Resend respondería 409) y sale', async () => {
      // Emula a Resend: la misma key con otro cuerpo → 409 invalid_idempotent_request.
      const seen = new Map<string, string>();
      const statuses: number[] = [];
      const orig = (global.fetch as jest.Mock).getMockImplementation()!;
      (global.fetch as jest.Mock).mockImplementation(async (input: any, init?: any) => {
        const key = init?.headers?.['Idempotency-Key'];
        if (String(input).startsWith('http://resend.mock') && key) {
          const body = String(init?.body ?? '');
          if (seen.has(key) && seen.get(key) !== body) {
            statuses.push(409);
            return new Response(JSON.stringify({ name: 'invalid_idempotent_request', message: 'Same idempotency key used with a different request payload.' }), { status: 409 });
          }
          seen.set(key, body);
          statuses.push(200);
        }
        return orig(input, init);
      });
      const t0 = new Date();
      const { contact, notified } = await lead.registerLeadWithNotifications({
        name: 'Lead RAG',
        email: `rag.${Date.now()}@cliente-prueba.co`,
        service: 'Demo RAG: prueba con tu documento',
        message: 'Subió un documento PDF.',
        source: 'demo-rag',
      });
      await notified;
      // El proceso "murió" antes de guardar el resultado y luego la demo completó el mensaje.
      await Contact.updateOne(
        { _id: contact._id },
        { $set: { 'notificaciones.email.estado': 'pendiente', 'notificaciones.email.intentos': 0, 'notificaciones.email.proximoIntento': new Date(t0.getTime() + 10 * MIN), message: 'Subió un documento PDF.\nDocumento procesado: 3 páginas.' } },
      );
      await retryJob.runNotifyRetryJob(new Date(t0.getTime() + 11 * MIN));
      expect(statuses).toEqual([200, 200]);
      const keys = ownerMails().map((m) => m.headers['Idempotency-Key']);
      expect(new Set(keys).size).toBe(2);
      expect((await Contact.findById(contact._id).lean())?.notificaciones?.email).toMatchObject({ estado: 'enviado', intentos: 1 });

      // Mismo cuerpo → misma key (Resend no lo duplica).
      await Contact.updateOne({ _id: contact._id }, { $set: { 'notificaciones.email.estado': 'fallido', 'notificaciones.email.proximoIntento': new Date(t0.getTime() - MIN) } });
      await retryJob.runNotifyRetryJob(new Date(t0.getTime() + 12 * MIN));
      const keys2 = ownerMails().map((m) => m.headers['Idempotency-Key']);
      expect(keys2[2]).toBe(keys2[1]);
    });

    it('reenvío manual mientras el job tiene el canal reclamado: no se envía dos veces', async () => {
      const c0 = await createContact({
        notificaciones: { email: { estado: 'enviado', intentos: 1 }, whatsapp: { estado: 'fallido', intentos: 1, proximoIntento: new Date(Date.now() - 1000) } },
      });
      const orig = (global.fetch as jest.Mock).getMockImplementation()!;
      (global.fetch as jest.Mock).mockImplementation(async (input: any, init?: any) => {
        if (String(input).startsWith('http://graph.mock')) await new Promise((r) => setTimeout(r, 500));
        return orig(input, init);
      });
      const job = retryJob.runNotifyRetryJob(new Date());
      // Espera a que el job reclame el canal (queda `pendiente` mientras Meta responde).
      await waitFor(async () => (await Contact.findById(c0._id).lean())?.notificaciones?.whatsapp.estado === 'pendiente');
      const manual = await owner.deliverContactNotifications(String(c0._id), { modo: 'manual', canales: ['whatsapp'] });
      await job;
      expect(manual.whatsapp).toMatchObject({ omitido: true, estado: 'pendiente' });
      expect(captured.filter((c) => c.kind === 'meta')).toHaveLength(1);
      expect((await Contact.findById(c0._id).lean())?.notificaciones?.whatsapp).toMatchObject({ estado: 'enviado', intentos: 2 });
    });

    it('webhook «failed» que llega antes de guardar el wamid: vuelve a buscar y el aviso queda «fallido» con alerta del contacto', async () => {
      const orig = (global.fetch as jest.Mock).getMockImplementation()!;
      let processing: Promise<unknown> | null = null;
      (global.fetch as jest.Mock).mockImplementation(async (input: any, init?: any) => {
        const res: Response = await orig(input, init);
        if (String(input).startsWith('http://graph.mock') && !processing) {
          const wamid = (await res.clone().json()).messages[0].id;
          processing = owner.processWhatsAppStatuses(
            { entry: [{ changes: [{ value: { statuses: [{ id: wamid, status: 'failed', errors: [{ code: 131026, title: 'Message undeliverable' }] }] } }] }] },
            new Date(),
            { lookupDelayMs: 50, lookupRetries: 20 },
          );
        }
        return res;
      });
      const { contact, notified } = await lead.registerLeadWithNotifications({ name: 'Rápido', email: `race.${Date.now()}@cliente-prueba.co`, service: 'ERP', message: 'Hola' });
      await notified;
      await processing;
      const wa = (await Contact.findById(contact._id).lean())?.notificaciones?.whatsapp;
      expect(wa?.estado).toBe('fallido');
      expect(wa?.error).toMatch(/131026/);
      const alert = ownerMails().find((m) => String(m.body.subject).includes('WhatsApp no entregó'));
      expect(alert?.body.text).toMatch(/Rápido/);
    });

    it('webhook «failed» de un wamid sin contacto: la alerta no dice que era una prueba', async () => {
      await owner.processWhatsAppStatuses(
        { entry: [{ changes: [{ value: { statuses: [{ id: `wamid.huerfano.${Date.now()}`, status: 'failed', errors: [{ code: 131026, title: 'Message undeliverable' }] }] } }] }] },
        new Date(),
        { lookupRetries: 0 },
      );
      const alert = ownerMails().find((m) => String(m.body.subject).includes('WhatsApp no entregó'));
      expect(alert?.body.text).toMatch(/No se pudo asociar a un contacto/);
      expect(alert?.body.text).toMatch(/pedido/);
      expect(alert?.body.text).not.toMatch(/Era un aviso de prueba o del latido mensual/);
      // El panel ve que el webhook sí recibe eventos.
      const status = await request(app).get('/api/admin/notifications/status').set(bearer(admin));
      expect(status.body.data.whatsapp.webhookUltimoEvento).toBeTruthy();
    });

    it('latido: si WhatsApp solo salió con el respaldo hello_world, no se da por bueno y avisa por correo', async () => {
      await AppSetting.deleteMany({ clave: 'avisos.estado' });
      metaQueue.push(metaError(404, 132001));
      const r = await heartbeatJob.runNotifyHeartbeatJob(new Date('2026-10-14T15:30:00Z'));
      expect(r.resultado?.whatsapp).toMatchObject({ enviado: true, respaldo: 'hello_world' });
      expect(r.avisoCruzado).toEqual(['email']);
      const alert = ownerMails().find((m) => /Falla en tus avisos por WhatsApp/.test(m.body.subject));
      expect(alert?.body.text).toMatch(/hello_world/);
      expect(alert?.body.text).toMatch(/132001/);
      expect((await owner.readAvisosState()).latido?.resultado).toEqual({ email: true, whatsapp: false });
    });

    it('latido: si no sale por ningún canal, se reintenta al día siguiente (no espera 30 días)', async () => {
      await AppSetting.deleteMany({ clave: 'avisos.estado' });
      // Intento + reintento inmediato de cada canal.
      for (let i = 0; i < 2; i += 1) {
        resendQueue.push({ status: 503, body: { name: 'service_unavailable', message: 'down' } });
        metaQueue.push({ status: 503, body: { error: { code: 2, message: 'down' } } });
      }
      const t = new Date('2026-10-14T15:30:00Z'); // 10:30 en Bogotá
      const r1 = await heartbeatJob.runNotifyHeartbeatJob(t);
      expect(r1.resultado?.email.enviado).toBe(false);
      expect(r1.resultado?.whatsapp.enviado).toBe(false);
      const st = await owner.readAvisosState();
      expect(st.latido?.ultimo ?? null).toBeNull();
      expect(new Date(st.latido?.intento as Date).toISOString()).toBe(t.toISOString());
      // El panel muestra el reintento (20 h después, movido a las 9:00 de Bogotá), no "ahora".
      const status = await owner.getNotificationStatus(new Date(t.getTime() + MIN));
      expect(status.latido.proximo).toBe('2026-10-15T14:00:00.000Z');

      expect(await heartbeatJob.runNotifyHeartbeatJob(new Date(t.getTime() + 60 * MIN))).toMatchObject({ skipped: 'no_toca' });
      const r2 = await heartbeatJob.runNotifyHeartbeatJob(new Date(t.getTime() + 23 * 60 * MIN)); // 9:30 del día siguiente
      expect(r2.resultado?.email.enviado).toBe(true);
      expect(new Date((await owner.readAvisosState()).latido?.ultimo as Date).toISOString()).toBe(new Date(t.getTime() + 23 * 60 * MIN).toISOString());
    });

    it('correo con un reply_to que Resend rechazaría: el aviso sale sin «responder a»', async () => {
      const c = await createContact({ email: 'josé.pérez@ejemplo.co', notificaciones: null });
      const res = await request(app).post(`/api/admin/contacts/${String(c._id)}/notify`).set(bearer(admin));
      expect(res.status).toBe(200);
      const mail = ownerMails().pop();
      expect(mail?.body.reply_to).toBeUndefined();
      expect(mail?.body.text).toContain('josé.pérez@ejemplo.co');
    });

    it('POST /contacts/:id/notify tiene su propio límite (10 cada 15 min por cuenta)', async () => {
      const c = await createContact({ notificaciones: { email: { estado: 'enviado', intentos: 1 }, whatsapp: { estado: 'enviado', intentos: 1 } } });
      let last = 200;
      for (let i = 0; i < 12 && last !== 429; i += 1) {
        last = (await request(app).post(`/api/admin/contacts/${String(c._id)}/notify`).set(bearer(admin))).status;
      }
      expect(last).toBe(429);
    });
  });
});
