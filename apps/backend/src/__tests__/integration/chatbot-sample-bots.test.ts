/**
 * Bots de ejemplo compartidos (POST /api/chatbot/sample-bots) de "Prueba el
 * asistente" en /demo/chatbot:
 *  - el mismo contenido (config + textos) devuelve siempre el mismo bot, sin
 *    crear otro ni gastar el límite de creación;
 *  - otro contenido da otro bot (nadie cambia el que ven los demás);
 *  - el bot no tiene dueño, es `sample` y no guarda conversaciones;
 *  - solo textos cortos; dos peticiones a la vez dejan un solo bot.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import mongoose from 'mongoose';
import request from 'supertest';
import type { Express } from 'express';
import { connectTestDb, describeDb, disconnectTestDb } from './helpers';

const OWNER_HEADER = 'X-Bot-Owner-Token';
const CREATE_LIMIT = 8;
const b64 = (s: string) => Buffer.from(s, 'utf-8').toString('base64');

function samplePayload(overrides: { sampleKey?: string; text?: string; name?: string } = {}) {
  const text = overrides.text ?? '1. Vacaciones. Todo colaborador tiene derecho a 15 dias habiles de vacaciones por cada año de servicio.';
  return {
    sampleKey: overrides.sampleKey ?? 'rrhh:es:2026-10-v1',
    config: { name: overrides.name ?? 'Logística Ejemplo S.A.S.', welcome: 'Hola', systemPrompt: 'Eres el asistente.', tone: 'friendly', color: '#4F46E5', position: 'br', avatar: '💬', languages: ['es'] },
    files: [
      { name: 'Política de vacaciones.txt', size: text.length, mime: 'text/plain', contentBase64: b64(text) },
      { name: 'Trabajo en casa.txt', size: 40, mime: 'text/plain', contentBase64: b64('2. Trabajo en casa. Hasta 2 dias por semana para cargos administrativos.') },
    ],
  };
}

describeDb('chatbot: bots de ejemplo compartidos (integración)', () => {
  let app: Express;
  let stateDir: string;
  const prevKey = process.env.OPENAI_API_KEY;
  const prevLimit = process.env.CHATBOT_CREATE_LIMIT_PER_HOUR;

  beforeAll(async () => {
    await connectTestDb('chatbot_sample_bots');
    stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'koptup-chatbot-sample-'));
    process.env.CHATBOT_STATE_DIR = stateDir;
    process.env.CHATBOT_CREATE_LIMIT_PER_HOUR = String(CREATE_LIMIT);
    // Sin clave de OpenAI: el chat responde en modo extractivo (no gasta).
    delete process.env.OPENAI_API_KEY;
    const { createApp } = await import('../../app');
    app = createApp();
    // El índice único de la huella debe existir antes de la prueba de concurrencia.
    await mongoose.model('ChatbotBot').init();
  });

  afterAll(async () => {
    if (prevKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = prevKey;
    if (prevLimit === undefined) delete process.env.CHATBOT_CREATE_LIMIT_PER_HOUR;
    else process.env.CHATBOT_CREATE_LIMIT_PER_HOUR = prevLimit;
    fs.rmSync(stateDir, { recursive: true, force: true });
    await disconnectTestDb();
  });

  const bots = () => mongoose.connection.collection('chatbot_bots');

  it('GET /models anuncia los bots de ejemplo compartidos', async () => {
    const res = await request(app).get('/api/chatbot/models');
    expect(res.status).toBe(200);
    expect(res.body.sharedSampleBots).toBe(true);
  });

  it('el mismo contenido devuelve el mismo bot: se crea una vez y se reutiliza', async () => {
    const first = await request(app).post('/api/chatbot/sample-bots').send(samplePayload());
    expect(first.status).toBe(201);
    expect(first.body).toMatchObject({ shared: true, docsCount: 2 });
    expect(first.body.docs).toHaveLength(2);
    expect(first.body.ownerToken).toBeUndefined();

    const again = await request(app).post('/api/chatbot/sample-bots').send(samplePayload());
    expect(again.status).toBe(200);
    expect(again.body.botId).toBe(first.body.botId);
    expect(await bots().countDocuments({ kind: 'sample' })).toBe(1);

    const stored = await bots().findOne({ botId: first.body.botId });
    expect(stored).toMatchObject({ kind: 'sample', ownerTokenHash: null });
    expect(typeof stored?.sampleHash).toBe('string');

    // Vista pública: sin documentos, con su cantidad (la usa el navegador para saber si sigue indexado).
    const pub = await request(app).get(`/api/chatbot/bots/${first.body.botId}`);
    expect(pub.status).toBe(200);
    expect(pub.body).toMatchObject({ docs: [], docsCount: 2, owned: false });
  });

  it('nadie lo edita ni lo borra desde la web, y sus conversaciones no se guardan', async () => {
    const { body } = await request(app).post('/api/chatbot/sample-bots').send(samplePayload());
    const token = 'x'.repeat(43);
    expect((await request(app).patch(`/api/chatbot/bots/${body.botId}`).set(OWNER_HEADER, token).send({ name: 'Otro' })).status).toBe(403);
    expect((await request(app).delete(`/api/chatbot/bots/${body.botId}`).set(OWNER_HEADER, token)).status).toBe(403);
    expect((await request(app).post(`/api/chatbot/bots/${body.botId}/docs`).set(OWNER_HEADER, token).send({ files: [] })).status).toBe(403);

    const chat = await request(app).post(`/api/chatbot/bots/${body.botId}/chat`).send({ message: '¿Cuántos días de vacaciones tengo?', channel: 'widget' });
    expect(chat.status).toBe(200);
    expect(chat.body.sources.length).toBeGreaterThan(0);
    expect(chat.body.sources[0].name).toBe('Política de vacaciones.txt');
    expect(await mongoose.connection.collection('chatbot_turns').countDocuments({ botId: body.botId })).toBe(0);
  });

  it('otro contenido da otro bot: el que ven los demás no cambia', async () => {
    const original = await request(app).post('/api/chatbot/sample-bots').send(samplePayload());
    const altered = await request(app)
      .post('/api/chatbot/sample-bots')
      .send(samplePayload({ text: '1. Vacaciones. Ningun colaborador tiene vacaciones.' }));
    expect(altered.status).toBe(201);
    expect(altered.body.botId).not.toBe(original.body.botId);

    const again = await request(app).post('/api/chatbot/sample-bots').send(samplePayload());
    expect(again.body.botId).toBe(original.body.botId);
    const chat = await request(app).post(`/api/chatbot/bots/${original.body.botId}/chat`).send({ message: 'vacaciones' });
    expect(chat.body.sources[0].chunk).toContain('15 dias habiles');
  });

  it('solo acepta textos cortos y datos válidos', async () => {
    const send = (body: unknown) => request(app).post('/api/chatbot/sample-bots').send(body as object);
    const pdf = samplePayload();
    pdf.files[0].mime = 'application/pdf';
    expect((await send(pdf)).status).toBe(400);

    const big = samplePayload({ text: 'a'.repeat(300 * 1024) });
    expect((await send(big)).status).toBe(400);

    const many = samplePayload();
    many.files = Array.from({ length: 6 }, (_, i) => ({ ...many.files[0], name: `doc${i}.txt` }));
    expect((await send(many)).status).toBe(400);

    expect((await send({ ...samplePayload(), sampleKey: 'no válido con espacios' })).status).toBe(400);
    expect((await send(samplePayload({ name: '   ' }))).status).toBe(400);
    expect((await send({ ...samplePayload(), files: [] })).status).toBe(400);

    // Un binario declarado como texto no se indexa.
    const binary = samplePayload({ sampleKey: 'bin:es:v1' });
    binary.files[0].contentBase64 = Buffer.from([0, 1, 2, 3, 0, 0, 255, 254, 0, 7]).toString('base64');
    const res = await send(binary);
    expect(res.status).toBe(422);
    expect(await bots().countDocuments({ sampleHash: { $exists: true }, name: 'Logística Ejemplo S.A.S.', docs: { $size: 0 } })).toBe(0);
  });

  it('dos visitantes a la vez con un contenido nuevo dejan un solo bot', async () => {
    const payload = samplePayload({ sampleKey: 'salud:es:2026-10-v1', name: 'IPS Ejemplo Salud' });
    const [a, b] = await Promise.all([
      request(app).post('/api/chatbot/sample-bots').send(payload),
      request(app).post('/api/chatbot/sample-bots').send(payload),
    ]);
    expect([200, 201]).toContain(a.status);
    expect([200, 201]).toContain(b.status);
    expect(a.body.botId).toBe(b.body.botId);
    expect(await bots().countDocuments({ name: 'IPS Ejemplo Salud' })).toBe(1);
  });

  it('reutilizar no gasta el límite de creación; crear contenido nuevo sí', async () => {
    // Agota el límite de creación de esta IP con bots normales.
    let status = 201;
    for (let i = 0; i < CREATE_LIMIT + 2 && status !== 429; i += 1) {
      status = (await request(app).post('/api/chatbot/bots').send({ name: `Bot ${i}` })).status;
    }
    expect(status).toBe(429);

    const reuse = await request(app).post('/api/chatbot/sample-bots').send(samplePayload());
    expect(reuse.status).toBe(200);

    const fresh = await request(app).post('/api/chatbot/sample-bots').send(samplePayload({ sampleKey: 'tienda:es:2026-10-v1' }));
    expect(fresh.status).toBe(429);
    expect(fresh.body.code).toBe('rate_limited');
  });
});
