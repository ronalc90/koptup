/**
 * Chatbot en MongoDB: migración del archivo heredado `state.json`, bots que
 * sobreviven a un reinicio, historial solo del widget de bots de usuario,
 * vencimiento de las conversaciones (TTL) y borrado de bots sin uso.
 */
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import mongoose from 'mongoose';
import request from 'supertest';
import type { Express } from 'express';
import { connectTestDb, describeDb, disconnectTestDb } from './helpers';

const OWNER_HEADER = 'X-Bot-Owner-Token';
const DAY_MS = 24 * 60 * 60 * 1000;
const MIGRATED_BOT_ID = 'kbot_migrado000000001';
const MIGRATED_TOKEN = 'm'.repeat(43);

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const b64 = (s: string) => Buffer.from(s, 'utf-8').toString('base64');

describeDb('chatbot: almacenamiento en MongoDB, historial y vencimiento (integración)', () => {
  let app: Express;
  let stateDir: string;
  const prevKey = process.env.OPENAI_API_KEY;
  const prevTtl = process.env.CHATBOT_CONVERSATION_TTL_DAYS;

  beforeAll(async () => {
    await connectTestDb('chatbot_storage');
    stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'koptup-chatbot-store-'));
    process.env.CHATBOT_STATE_DIR = stateDir;
    process.env.CHATBOT_CONVERSATION_TTL_DAYS = '30';
    const now = Date.now();
    const iso = (ms: number) => new Date(ms).toISOString();
    // Archivo heredado: un bot con dueño, un documento y dos conversaciones
    // (una de hace 60 días, ya vencida con el plazo de 30, y una de ayer).
    fs.writeFileSync(
      path.join(stateDir, 'state.json'),
      JSON.stringify({
        bots: [
          [
            MIGRATED_BOT_ID,
            {
              botId: MIGRATED_BOT_ID,
              name: 'Bot migrado',
              color: '#123456',
              position: 'bl',
              avatar: '🤖',
              welcome: 'Hola',
              systemPrompt: 'Prompt',
              tone: 'friendly',
              languages: ['es'],
              createdAt: iso(now - 90 * DAY_MS),
              updatedAt: iso(now - 2 * DAY_MS),
              docs: [],
              ownerTokenHash: sha256(MIGRATED_TOKEN),
            },
          ],
        ],
        docs: [[MIGRATED_BOT_ID, [{ id: 'doc_migrado', name: 'politica.txt', size: 100, mime: 'text/plain', hash: 'abc', uploadedAt: iso(now - 10 * DAY_MS) }]]],
        chunks: [
          [
            MIGRATED_BOT_ID,
            [{ id: 'chk_1', docId: 'doc_migrado', docName: 'politica.txt', text: 'La garantia de los equipos es de doce meses desde la compra.', tokens: [] }],
          ],
        ],
        conversations: [
          [
            MIGRATED_BOT_ID,
            [
              { id: 'msg_viejo', role: 'user', content: 'pregunta vieja', timestamp: iso(now - 60 * DAY_MS) },
              { id: 'msg_nuevo', role: 'user', content: 'pregunta reciente', timestamp: iso(now - DAY_MS) },
            ],
          ],
        ],
        updatedAt: iso(now),
      }),
    );
    delete process.env.OPENAI_API_KEY;
    const { createApp } = await import('../../app');
    app = createApp();
  });

  afterAll(async () => {
    if (prevKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = prevKey;
    if (prevTtl === undefined) delete process.env.CHATBOT_CONVERSATION_TTL_DAYS;
    else process.env.CHATBOT_CONVERSATION_TTL_DAYS = prevTtl;
    fs.rmSync(stateDir, { recursive: true, force: true });
    await disconnectTestDb();
  });

  async function createBot(body: Record<string, unknown> = {}) {
    const res = await request(app).post('/api/chatbot/bots').send({ name: 'Mi bot', ...body });
    expect(res.status).toBe(201);
    const bot = res.body as { botId: string; ownerToken: string; kind: string };
    const docs = await request(app)
      .post(`/api/chatbot/bots/${bot.botId}/docs`)
      .set(OWNER_HEADER, bot.ownerToken)
      .send({ files: [{ name: 'horario.txt', mime: 'text/plain', contentBase64: b64('El horario de atencion es de lunes a viernes de ocho a cinco.') }] });
    expect(docs.status).toBe(201);
    return bot;
  }

  const conversations = (botId: string, token: string) =>
    request(app).get(`/api/chatbot/bots/${botId}/conversations?limit=200`).set(OWNER_HEADER, token);

  it('migra el archivo heredado una sola vez, sin las conversaciones vencidas, y lo borra del disco', async () => {
    const list = await request(app).get('/api/chatbot/bots').set(OWNER_HEADER, MIGRATED_TOKEN);
    expect(list.status).toBe(200);
    expect(list.body.map((b: { botId: string }) => b.botId)).toEqual([MIGRATED_BOT_ID]);
    expect(list.body[0]).toMatchObject({ docsCount: 1, chunksCount: 1, conversationsCount: 1, owned: true });
    expect(fs.existsSync(path.join(stateDir, 'state.json'))).toBe(false);

    const own = await request(app).get(`/api/chatbot/bots/${MIGRATED_BOT_ID}`).set(OWNER_HEADER, MIGRATED_TOKEN);
    expect(own.body).toMatchObject({ name: 'Bot migrado', position: 'bl', kind: 'builder' });
    expect(own.body.docs.map((d: { name: string }) => d.name)).toEqual(['politica.txt']);

    // Los fragmentos migrados responden (las palabras se recalculan).
    const chat = await request(app).post(`/api/chatbot/bots/${MIGRATED_BOT_ID}/chat`).send({ message: '¿Cuánto dura la garantia de los equipos?' });
    expect(chat.status).toBe(200);
    expect(chat.body.sources[0].name).toBe('politica.txt');

    const history = await conversations(MIGRATED_BOT_ID, MIGRATED_TOKEN);
    expect(history.body.map((t: { content: string }) => t.content)).toEqual(['pregunta reciente']);
    const migrated = await mongoose.connection.collection('chatbot_turns').findOne({ botId: MIGRATED_BOT_ID, turnId: 'msg_nuevo' });
    // Vence 30 días después de la pregunta original.
    expect(Math.abs((migrated?.expiresAt as Date).getTime() - (Date.parse(migrated?.timestamp) + 30 * DAY_MS))).toBeLessThan(1000);
  });

  it('el bot y sus documentos quedan en MongoDB y responden después de un reinicio (sin caché)', async () => {
    const bot = await createBot({ name: 'Persistente' });
    const stored = await mongoose.connection.collection('chatbot_bots').findOne({ botId: bot.botId });
    expect(stored).toMatchObject({ name: 'Persistente', chunksCount: 1, kind: 'builder' });
    expect(stored?.ownerTokenHash).toBe(sha256(bot.ownerToken));
    expect(JSON.stringify(stored)).not.toContain(bot.ownerToken);

    // Simula un proceso nuevo: sin caché de fragmentos ni migración en memoria.
    const store = await import('../../services/chatbot-store.service');
    store.resetChatbotMigrationForTests();
    const chat = await request(app).post(`/api/chatbot/bots/${bot.botId}/chat`).send({ message: 'horario de atencion lunes' });
    expect(chat.body.sources[0].name).toBe('horario.txt');
  });

  it('no guarda las preguntas de "Prueba el asistente" ni de la vista previa (sin canal widget)', async () => {
    const bot = await createBot();
    await request(app).post(`/api/chatbot/bots/${bot.botId}/chat`).send({ message: 'horario de atencion' }).expect(200);
    await request(app).post(`/api/chatbot/bots/${bot.botId}/chat`).send({ message: 'horario de atencion', channel: 'preview' }).expect(200);
    expect((await conversations(bot.botId, bot.ownerToken)).body).toEqual([]);
    expect(await mongoose.connection.collection('chatbot_turns').countDocuments({ botId: bot.botId })).toBe(0);
  });

  it('nunca guarda conversaciones de un bot de ejemplo, ni desde el widget', async () => {
    const sample = await createBot({ kind: 'sample' });
    expect(sample.kind).toBe('sample');
    await request(app).post(`/api/chatbot/bots/${sample.botId}/chat`).send({ message: 'horario', channel: 'widget' }).expect(200);
    expect(await mongoose.connection.collection('chatbot_turns').countDocuments({ botId: sample.botId })).toBe(0);
    // Un `kind` desconocido se trata como bot de usuario.
    const odd = await request(app).post('/api/chatbot/bots').send({ name: 'Raro', kind: 'admin' });
    expect(odd.body.kind).toBe('builder');
  });

  it('guarda las del widget de un bot de usuario con vencimiento (TTL) y como máximo 200 turnos', async () => {
    const bot = await createBot();
    const before = Date.now();
    const res = await request(app).post(`/api/chatbot/bots/${bot.botId}/chat`).send({ message: 'horario de atencion', channel: 'widget' });
    expect(res.status).toBe(200);
    const history = await conversations(bot.botId, bot.ownerToken);
    expect(history.body.map((t: { role: string }) => t.role)).toEqual(['user', 'assistant']);
    expect(history.body[0].content).toBe('horario de atencion');

    const turn = await mongoose.connection.collection('chatbot_turns').findOne({ botId: bot.botId, role: 'user' });
    const expires = (turn?.expiresAt as Date).getTime();
    expect(expires).toBeGreaterThanOrEqual(before + 30 * DAY_MS - 1000);
    expect(expires).toBeLessThanOrEqual(Date.now() + 30 * DAY_MS + 1000);

    // MongoDB borra solo los turnos vencidos: índice TTL sobre expiresAt
    // (Mongoose crea los índices al registrar el modelo).
    await mongoose.model('ChatbotTurn').init();
    const indexes = await mongoose.connection.collection('chatbot_turns').indexes();
    expect(indexes.find((i) => i.key?.expiresAt === 1)?.expireAfterSeconds).toBe(0);

    // Un turno ya vencido no se muestra aunque MongoDB aún no lo haya borrado.
    await mongoose.connection.collection('chatbot_turns').updateOne({ _id: turn!._id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await conversations(bot.botId, bot.ownerToken)).body.map((t: { role: string }) => t.role)).toEqual(['assistant']);

    // Tope de 200 turnos por bot (los más recientes).
    for (let i = 0; i < 101; i += 1) {
      await request(app).post(`/api/chatbot/bots/${bot.botId}/chat`).send({ message: `horario ${i}`, channel: 'widget' }).expect(200);
    }
    expect(await mongoose.connection.collection('chatbot_turns').countDocuments({ botId: bot.botId })).toBe(200);
    const last = await conversations(bot.botId, bot.ownerToken);
    expect(last.body[last.body.length - 2].content).toBe('horario 100');

    // Borrar el bot borra también su historial y sus fragmentos.
    await request(app).delete(`/api/chatbot/bots/${bot.botId}`).set(OWNER_HEADER, bot.ownerToken).expect(200);
    expect(await mongoose.connection.collection('chatbot_turns').countDocuments({ botId: bot.botId })).toBe(0);
    expect(await mongoose.connection.collection('chatbot_bot_chunks').countDocuments({ botId: bot.botId })).toBe(0);
  });

  it('el job de conservación borra los bots sin uso pasado su plazo', async () => {
    const sample = await createBot({ kind: 'sample' });
    const builder = await createBot();
    const fresh = await createBot();
    const col = mongoose.connection.collection('chatbot_bots');
    await col.updateOne({ botId: sample.botId }, { $set: { lastActivityAt: new Date(Date.now() - 31 * DAY_MS) } });
    await col.updateOne({ botId: builder.botId }, { $set: { lastActivityAt: new Date(Date.now() - 366 * DAY_MS) } });
    const { purgeIdleBots } = await import('../../services/chatbot-store.service');
    const res = await purgeIdleBots();
    expect(res).toMatchObject({ sample: 1, builder: 1 });
    expect(await col.countDocuments({ botId: { $in: [sample.botId, builder.botId] } })).toBe(0);
    expect(await col.countDocuments({ botId: fresh.botId })).toBe(1);
    expect(await mongoose.connection.collection('chatbot_bot_chunks').countDocuments({ botId: sample.botId })).toBe(0);
  });

  it('un archivo heredado que no es JSON válido no rompe nada y no se borra (el equipo lo revisa)', async () => {
    const file = path.join(stateDir, 'state.json');
    fs.writeFileSync(file, '{"bots": [ esto no es json');
    const { ensureChatbotMigrated, resetChatbotMigrationForTests } = await import('../../services/chatbot-store.service');
    resetChatbotMigrationForTests();
    await expect(ensureChatbotMigrated()).resolves.toBeUndefined();
    expect(fs.existsSync(file)).toBe(true);
    // Los bots siguen funcionando.
    const list = await request(app).get('/api/chatbot/bots').set(OWNER_HEADER, MIGRATED_TOKEN);
    expect(list.status).toBe(200);
    fs.rmSync(file);
  });
});
