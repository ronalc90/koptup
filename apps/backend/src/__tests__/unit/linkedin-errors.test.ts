/**
 * LinkedIn Ads: los 503 dicen qué pasó con un código propio (sin Redis ni
 * MongoDB: los servicios de cupo se simulan).
 */
import express from 'express';
import request from 'supertest';

const getBudgetStatus = jest.fn();
const consumeRateLimit = jest.fn();
jest.mock('../../services/ai-budget.service', () => ({
  getBudgetStatus: (...args: unknown[]) => getBudgetStatus(...args),
  consumeRateLimit: (...args: unknown[]) => consumeRateLimit(...args),
  recordSpend: jest.fn(),
}));

const body = { demo: { titulo: 'CRM con IA', path: '/demo/crm-ia' }, angulo: 'problema', tono: 'profesional' };

async function buildApp() {
  const { setDemoAccessResolver } = await import('../../middleware/access');
  setDemoAccessResolver(async () => ({ allowed: true, reason: 'public' }));
  const router = (await import('../../routes/linkedin-ads.routes')).default;
  const app = express();
  app.use(express.json());
  app.use('/api/linkedin-ads', router);
  return app;
}

describe('LinkedIn Ads: códigos y mensajes de error', () => {
  const prevKey = process.env.OPENAI_API_KEY;
  afterEach(() => {
    process.env.OPENAI_API_KEY = prevKey;
  });

  it('sin clave de OpenAI: 503 ai_not_configured', async () => {
    delete process.env.OPENAI_API_KEY;
    const res = await request(await buildApp()).post('/api/linkedin-ads/generate').send(body);
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ success: false, code: 'ai_not_configured', message: expect.stringMatching(/no está configurada/) });
  });

  it('cupo del mes agotado: 503 budget_exhausted con un mensaje claro', async () => {
    process.env.OPENAI_API_KEY = 'sk-test-mock';
    getBudgetStatus.mockResolvedValue({ available: false, reason: 'budget_exhausted' });
    const res = await request(await buildApp()).post('/api/linkedin-ads/generate').send(body);
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('budget_exhausted');
    expect(res.body.message).toMatch(/cupo mensual/);
    expect(res.body.message).toMatch(/generador local/);
    expect(res.body.error).toBeUndefined();
  });

  it('Redis caído (no se puede medir el gasto): 503 limits_unavailable', async () => {
    process.env.OPENAI_API_KEY = 'sk-test-mock';
    getBudgetStatus.mockResolvedValue({ available: false, reason: 'unavailable' });
    const res = await request(await buildApp()).post('/api/linkedin-ads/generate').send(body);
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('limits_unavailable');
    expect(res.body.message).toMatch(/cupo de uso/);
  });

  it('Redis cae al contar el cupo: 503 limits_unavailable', async () => {
    process.env.OPENAI_API_KEY = 'sk-test-mock';
    getBudgetStatus.mockResolvedValue({ available: true, reason: null });
    consumeRateLimit.mockResolvedValue(null);
    const res = await request(await buildApp()).post('/api/linkedin-ads/generate').send(body);
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('limits_unavailable');
  });

  it('cuerpo inválido: 400 invalid_request con los campos', async () => {
    const res = await request(await buildApp()).post('/api/linkedin-ads/generate').send({ angulo: 'x' });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, code: 'invalid_request', fields: expect.any(Array) });
    expect(typeof res.body.message).toBe('string');
  });
});
