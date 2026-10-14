/**
 * Chatbot: cupos por IP. GET /models no cuenta (lista fija), el resto de
 * /api/chatbot tiene un cupo general y las preguntas al chat uno propio.
 * Los cupos se leen al cargar el módulo: se fijan aquí, antes de crear la app.
 */
import request from 'supertest';
import type { Express } from 'express';
import { connectTestDb, describeDb, disconnectTestDb } from './helpers';

describeDb('chatbot: cupos por IP (integración)', () => {
  let app: Express;
  const prev = { api: process.env.CHATBOT_API_RATE_LIMIT_MAX, chat: process.env.CHATBOT_RATE_LIMIT_MAX };

  beforeAll(async () => {
    await connectTestDb('chatbot_rate_limit');
    process.env.CHATBOT_API_RATE_LIMIT_MAX = '3';
    process.env.CHATBOT_RATE_LIMIT_MAX = '2';
    const { createApp } = await import('../../app');
    app = createApp();
  });

  afterAll(async () => {
    process.env.CHATBOT_API_RATE_LIMIT_MAX = prev.api;
    process.env.CHATBOT_RATE_LIMIT_MAX = prev.chat;
    await disconnectTestDb();
  });

  it('GET /models no cuenta; el chat tiene su cupo y el resto el general', async () => {
    for (let i = 0; i < 6; i += 1) {
      expect((await request(app).get('/api/chatbot/models')).status).toBe(200);
    }
    // Preguntas: 2 por minuto (el bot no existe, pero pasan el cupo).
    expect((await request(app).post('/api/chatbot/bots/kbot_noexiste/chat').send({ message: 'hola' })).status).toBe(404);
    expect((await request(app).post('/api/chatbot/bots/kbot_noexiste/chat').send({ message: 'hola' })).status).toBe(404);
    const third = await request(app).post('/api/chatbot/bots/kbot_noexiste/chat').send({ message: 'hola' });
    expect(third.status).toBe(429);
    expect(third.body).toMatchObject({ success: false, code: 'rate_limited' });
    // General: 3 por minuto (ya van 3 contando las preguntas).
    const general = await request(app).get('/api/chatbot/bots/kbot_noexiste');
    expect(general.status).toBe(429);
    expect(general.body.code).toBe('rate_limited');
    // /models sigue respondiendo.
    expect((await request(app).get('/api/chatbot/models')).status).toBe(200);
  });
});
