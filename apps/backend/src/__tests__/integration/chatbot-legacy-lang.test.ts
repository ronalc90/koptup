/**
 * Chatbot: retiro de la API anterior "por sesión" (404 y limpieza única de lo
 * que guardaba sin vencimiento) e idioma de los textos que escribe el
 * servidor en modo extractivo (sin clave de IA).
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import mongoose from 'mongoose';
import request from 'supertest';
import type { Express } from 'express';
import { connectTestDb, describeDb, disconnectTestDb } from './helpers';

const OWNER_HEADER = 'X-Bot-Owner-Token';
const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');

describeDb('chatbot: API heredada retirada e idioma del modo extractivo (integración)', () => {
  let app: Express;
  const prevKey = process.env.OPENAI_API_KEY;

  beforeAll(async () => {
    await connectTestDb('chatbot_legacy_lang');
    // Sin clave de OpenAI: el chat responde en modo extractivo.
    delete process.env.OPENAI_API_KEY;
    const { createApp } = await import('../../app');
    app = createApp();
  });

  afterAll(async () => {
    if (prevKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = prevKey;
    await disconnectTestDb();
  });

  it('las 7 rutas de la API por sesión ya no existen (404)', async () => {
    const calls: Array<[string, string]> = [
      ['post', '/api/chatbot/session'],
      ['post', '/api/chatbot/upload'],
      ['post', '/api/chatbot/message'],
      ['get', '/api/chatbot/info/sesion-de-prueba-123'],
      ['put', '/api/chatbot/config'],
      ['delete', '/api/chatbot/messages/sesion-de-prueba-123'],
      ['delete', '/api/chatbot/documents/sesion-de-prueba-123'],
    ];
    for (const [method, url] of calls) {
      const res = await (request(app) as any)[method](url).send({ sessionId: 'sesion-de-prueba-123', message: 'Mi cédula es 123456' });
      expect([method, url, res.status, res.body.code]).toEqual([method, url, 404, 'not_found']);
    }
    // Nada quedó guardado en la colección heredada.
    const legacy = await mongoose.connection.db!.listCollections({ name: 'chatbots' }).toArray();
    expect(legacy).toHaveLength(0);
  });

  it('la limpieza única borra la colección `chatbots` y uploads/chatbot, y es idempotente', async () => {
    const { purgeLegacySessionChatbot } = await import('../../services/chatbot-legacy-cleanup.service');
    await mongoose.connection.collection('chatbots').insertMany([
      { sessionId: 'sesion-a-0001', messages: [{ role: 'user', content: 'Mi cédula es 123456' }], documents: [] },
      { sessionId: 'sesion-b-0002', messages: [], documents: [{ filename: 'x.txt', content: 'secreto' }] },
    ]);
    // Un bot actual no se toca.
    await mongoose.connection.collection('chatbot_bots').insertOne({ botId: 'kbot_vigente00000001', name: 'Vigente' });
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'koptup-legacy-uploads-'));
    fs.writeFileSync(path.join(dir, 'chatbot-1.txt'), 'uno');
    fs.writeFileSync(path.join(dir, 'chatbot-2.pdf'), 'dos');

    expect(await purgeLegacySessionChatbot({ uploadsDir: dir })).toEqual({ sessions: 2, files: 2 });
    expect(await mongoose.connection.db!.listCollections({ name: 'chatbots' }).toArray()).toHaveLength(0);
    expect(fs.existsSync(dir)).toBe(false);
    expect(await mongoose.connection.collection('chatbot_bots').countDocuments({ botId: 'kbot_vigente00000001' })).toBe(1);

    expect(await purgeLegacySessionChatbot({ uploadsDir: dir })).toEqual({ sessions: 0, files: 0 });
  });

  async function botWithDoc(languages?: string[]) {
    const created = await request(app).post('/api/chatbot/bots').send({ name: 'Idiomas', ...(languages ? { languages } : {}) });
    expect(created.status).toBe(201);
    const { botId, ownerToken } = created.body as { botId: string; ownerToken: string };
    const up = await request(app)
      .post(`/api/chatbot/bots/${botId}/docs`)
      .set(OWNER_HEADER, ownerToken)
      .send({ files: [{ name: 'politica.txt', mime: 'text/plain', contentBase64: b64('La garantia de los equipos dura doce meses desde la compra.') }] });
    expect(up.status).toBe(201);
    return botId;
  }

  it('sin clave: la respuesta explica el modo extractivo (error llm_not_configured) en el idioma pedido', async () => {
    const botId = await botWithDoc();
    const es = await request(app).post(`/api/chatbot/bots/${botId}/chat`).send({ message: '¿Cuánto dura la garantia de los equipos?' });
    expect(es.status).toBe(200);
    expect(es.body).toMatchObject({ model: 'extractive-bm25', error: 'llm_not_configured' });
    expect(es.body.reply).toMatch(/^\(Modo extractivo: la IA no está configurada/);
    expect(es.body.reply).toContain('[1] La garantia');

    const en = await request(app).post(`/api/chatbot/bots/${botId}/chat`).send({ message: 'garantia equipos', lang: 'en' });
    expect(en.body.reply).toMatch(/^\(Extractive mode: AI is not configured/);
  });

  it('«no encontré» y «sin documentos» salen en inglés con lang=en o con un bot en inglés', async () => {
    const botId = await botWithDoc();
    const es = await request(app).post(`/api/chatbot/bots/${botId}/chat`).send({ message: 'zzzz qqqq' });
    expect(es.body.reply).toBe('No encontré esa información en los documentos cargados.');
    const en = await request(app).post(`/api/chatbot/bots/${botId}/chat`).send({ message: 'zzzz qqqq', lang: 'en-US' });
    expect(en.body.reply).toBe("I couldn't find that information in the uploaded documents.");

    // Sin `lang`: manda el primer idioma del bot.
    const enBot = await botWithDoc(['en']);
    const byBot = await request(app).post(`/api/chatbot/bots/${enBot}/chat`).send({ message: 'zzzz qqqq' });
    expect(byBot.body.reply).toBe("I couldn't find that information in the uploaded documents.");

    const empty = await request(app).post('/api/chatbot/bots').send({ name: 'Vacío', languages: ['en'] });
    const noDocs = await request(app).post(`/api/chatbot/bots/${empty.body.botId}/chat`).send({ message: 'hello' });
    expect(noDocs.body.reply).toMatch(/^You don't have any documents yet/);
    // Un idioma que no se soporta cae en español.
    const fr = await request(app).post(`/api/chatbot/bots/${botId}/chat`).send({ message: 'zzzz qqqq', lang: 'fr' });
    expect(fr.body.reply).toBe('No encontré esa información en los documentos cargados.');
  });
});
