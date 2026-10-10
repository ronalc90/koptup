/**
 * Formulario de /contact con una cotización (POST /api/contact, campo
 * `quote`): el plan RAG, o el nivel y la modalidad de "Cotizar este tier",
 * quedan guardados como identificadores en `Contact.cotizacion`, y el nombre
 * legible (que arma la web) en `service` y en los intereses del lead. El
 * plazo ("¿Cuándo quieres empezar?") se guarda en `Contact.plazo`.
 */
import request from 'supertest';
import type { Express } from 'express';
import mongoose from 'mongoose';
import { connectTestDb, describeDbRedis, disconnectTestDb } from './helpers';

describeDbRedis('contacto con cotización (integración)', () => {
  let app: Express;

  beforeAll(async () => {
    await connectTestDb('contact_quote');
    const { createApp } = await import('../../app');
    app = createApp();
  });

  afterAll(async () => {
    const { getRedisClient } = await import('../../config/redis');
    const redis = await getRedisClient();
    await redis.quit();
    await disconnectTestDb();
  });

  // IP distinta por petición: el cupo estricto es de 5 por minuto y por IP.
  let n = 0;
  const ip = () => `10.88.${Math.floor(n / 250)}.${(n++ % 250) + 1}`;

  // Campos que el formulario siempre envía (incluida la autorización de datos,
  // si el backend la exige).
  const base = (email: string) => ({
    name: 'Carolina Prueba',
    email,
    message: 'Quiero cotizar esta solución para mi empresa.',
    consent: true,
    acceptPrivacy: true,
  });

  it('guarda nivel y modalidad de una solución del catálogo', async () => {
    const email = `cotiza-tier-${Date.now()}@test.local`;
    const res = await request(app)
      .post('/api/contact')
      .set('X-Forwarded-For', ip())
      .send({
        ...base(email),
        service: 'CRM con IA — Nivel Profesional · Suscripción SaaS mensual',
        quote: { service: 'crm-ia', tier: 'profesional', modality: 'saas' },
      });
    expect(res.status).toBe(200);

    const contact = await mongoose.connection.collection('contacts').findOne({ email });
    expect(contact?.service).toBe('CRM con IA — Nivel Profesional · Suscripción SaaS mensual');
    expect(contact?.cotizacion).toEqual({ servicio: 'crm-ia', nivel: 'profesional', modalidad: 'saas' });

    const lead = await mongoose.connection.collection('leads').findOne({ email });
    expect(lead?.intereses).toContain('CRM con IA — Nivel Profesional · Suscripción SaaS mensual');
  });

  it('guarda el plan RAG', async () => {
    const email = `cotiza-plan-${Date.now()}@test.local`;
    const res = await request(app)
      .post('/api/contact')
      .set('X-Forwarded-For', ip())
      .send({ ...base(email), service: 'Sistema RAG — Plan Esencial', quote: { service: 'sistema-rag', plan: 'esencial' } });
    expect(res.status).toBe(200);
    const contact = await mongoose.connection.collection('contacts').findOne({ email });
    expect(contact?.cotizacion).toEqual({ servicio: 'sistema-rag', plan: 'esencial' });
  });

  it('guarda el plazo (¿cuándo quieres empezar?) y rechaza valores desconocidos', async () => {
    const email = `plazo-${Date.now()}@test.local`;
    const ok = await request(app)
      .post('/api/contact')
      .set('X-Forwarded-For', ip())
      .send({ ...base(email), service: 'Consultoría', timeline: '1m' });
    expect(ok.status).toBe(200);
    const contact = await mongoose.connection.collection('contacts').findOne({ email });
    expect(contact?.plazo).toBe('1m');

    const empty = await request(app)
      .post('/api/contact')
      .set('X-Forwarded-For', ip())
      .send({ ...base(`plazo-vacio-${Date.now()}@test.local`), service: 'Consultoría', timeline: '' });
    expect(empty.status).toBe(200);

    const bad = await request(app)
      .post('/api/contact')
      .set('X-Forwarded-For', ip())
      .send({ ...base(`plazo-malo-${Date.now()}@test.local`), service: 'Consultoría', timeline: 'mañana' });
    expect(bad.status).toBe(400);
  });

  it('acepta los servicios que el portal todavía enlaza, sin nivel ni modalidad', async () => {
    const email = `cotiza-portal-${Date.now()}@test.local`;
    const res = await request(app)
      .post('/api/contact')
      .set('X-Forwarded-For', ip())
      .send({ ...base(email), service: 'Desarrollo web a medida', quote: { service: 'desarrollo-web' } });
    expect(res.status).toBe(200);
    const contact = await mongoose.connection.collection('contacts').findOne({ email });
    expect(contact?.cotizacion).toEqual({ servicio: 'desarrollo-web' });
  });

  it('sin cotización no guarda el campo', async () => {
    const email = `sin-cotizacion-${Date.now()}@test.local`;
    const res = await request(app)
      .post('/api/contact')
      .set('X-Forwarded-For', ip())
      .send({ ...base(email), service: 'Consultoría' });
    expect(res.status).toBe(200);
    const contact = await mongoose.connection.collection('contacts').findOne({ email });
    expect(contact?.cotizacion).toBeUndefined();
  });

  it('rechaza valores desconocidos sin guardar nada', async () => {
    const email = `cotiza-invalida-${Date.now()}@test.local`;
    for (const quote of [
      { service: 'crm-ia', tier: 'oro' },
      { service: 'crm-ia', modality: 'leasing' },
      { service: 'sistema-rag', plan: 'gratis' },
      { service: '<script>' },
      { service: 'producto-inventado' },
      { service: 'crm-ia', plan: 'esencial' },
      { service: 'sistema-rag', tier: 'avanzado' },
      { service: 'desarrollo-web', modality: 'saas' },
      'crm-ia',
    ]) {
      const res = await request(app)
        .post('/api/contact')
        .set('X-Forwarded-For', ip())
        .send({ ...base(email), service: 'CRM con IA', quote });
      expect(res.status).toBe(400);
    }
    expect(await mongoose.connection.collection('contacts').countDocuments({ email })).toBe(0);
  });
});
